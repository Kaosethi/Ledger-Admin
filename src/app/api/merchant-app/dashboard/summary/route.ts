// src/app/api/merchant-app/dashboard/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, transactions, merchants } from "@/lib/db/schema"; // merchants schema added
import { and, eq, gte, lte, sum, count as sqlCount } from "drizzle-orm"; // removed sql as it wasn't used directly by sum
import * as jose from "jose";
import { env } from "@/lib/env";

// --- JWT Secret Setup ---
const JWT_SECRET_STRING = env.JWT_SECRET;
const JWT_ALGORITHM = "HS256";
let _jwtSecretKey: Uint8Array | null = null;

function getJwtSecretKey(): Uint8Array {
  if (_jwtSecretKey) return _jwtSecretKey;
  if (!JWT_SECRET_STRING) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  _jwtSecretKey = new TextEncoder().encode(JWT_SECRET_STRING);
  return _jwtSecretKey;
}

interface AuthenticatedMerchantPayload extends jose.JWTPayload {
  merchantId: string;
  email: string;
}

// --- Custom Error Classes ---
class ApiError extends Error {
  public statusCode: number;
  public details?: any;
  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
class UnauthorizedError extends ApiError {
  constructor(
    message: string = "Unauthorized: Invalid or missing token, or merchant configuration issue."
  ) {
    super(message, 401);
  }
}
// Removed InternalServerError as it wasn't explicitly used, generic Error can be caught

// --- Helper to get Authenticated Merchant Info (Copied from your transactions/route.ts) ---
async function getAuthenticatedMerchantInfo(request: NextRequest): Promise<{
  merchantId: string;
  merchantInternalAccountId: string;
  merchantBusinessName: string;
}> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[API Dashboard] Auth: No/invalid Authorization header");
    throw new UnauthorizedError(
      "Authorization header is missing or improperly formatted."
    );
  }
  const token = authHeader.substring(7);
  if (!token) {
    console.warn("[API Dashboard] Auth: Token missing after Bearer prefix");
    throw new UnauthorizedError("Token is missing.");
  }
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jose.jwtVerify<AuthenticatedMerchantPayload>(
      token,
      secretKey,
      { algorithms: [JWT_ALGORITHM], clockTolerance: "5 minutes" }
    );

    if (payload && payload.merchantId) {
      const merchantDetails = await db
        .select({
          id: merchants.id,
          internalAccountId: merchants.internalAccountId,
          businessName: merchants.businessName,
          status: merchants.status,
        })
        .from(merchants)
        .where(eq(merchants.id, payload.merchantId))
        .limit(1);

      if (merchantDetails.length > 0 && merchantDetails[0].internalAccountId) {
        if (merchantDetails[0].status !== "active") {
          console.warn(
            `[API Dashboard] Auth: Merchant ${payload.merchantId} not active (status: ${merchantDetails[0].status}).`
          );
          throw new UnauthorizedError("Merchant account is not active.");
        }
        const businessName = merchantDetails[0].businessName ?? "Merchant";
        return {
          merchantId: merchantDetails[0].id,
          merchantInternalAccountId: merchantDetails[0].internalAccountId,
          merchantBusinessName: businessName,
        };
      } else {
        console.warn(
          `[API Dashboard] Auth: Merchant ${payload.merchantId} not found or no internalAccountId.`
        );
        throw new UnauthorizedError(
          "Merchant details not found or configuration incomplete."
        );
      }
    }
    console.warn(
      "[API Dashboard] Auth: JWT valid, but merchantId missing in payload."
    );
    throw new UnauthorizedError("Invalid token payload.");
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error(
      "[API Dashboard] Auth: DETAILED JWT Verif. Error:",
      "Name:",
      error.name,
      "Msg:",
      error.message,
      "Code:",
      error.code
    );
    if (
      [
        "JWSSignatureVerificationFailed",
        "JWTExpired",
        "JWTClaimValidationFailed",
        "JWTInvalid",
      ].includes(error.code || error.name)
    ) {
      throw new UnauthorizedError(
        `Token verification failed/expired. Original: ${error.message} (Code: ${
          error.code || "N/A"
        })`
      );
    }
    throw new UnauthorizedError(
      `Failed to authenticate token. Original: ${error.message} (Code: ${
        error.code || "N/A"
      })`
    );
  }
}

// --- Date Helper Functions (UTC-based) ---
const getStartOfTodayUTC = () => {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
};

const getEndOfTodayUTC = () => {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
};

const getStartOfWeekUTC = (date: Date) => {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0)
  );
};

const getEndOfWeekUTC = (date: Date) => {
  const startOfWeek = getStartOfWeekUTC(date);
  return new Date(
    Date.UTC(
      startOfWeek.getUTCFullYear(),
      startOfWeek.getUTCMonth(),
      startOfWeek.getUTCDate() + 6,
      23,
      59,
      59,
      999
    )
  );
};

const getStartOfMonthUTC = (date: Date) => {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)
  );
};

const getEndOfMonthUTC = (date: Date) => {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
};

// --- Helper function to query aggregates (moved outside GET, takes merchantInternalAccountId as param) ---
async function getTransactionSummaryForMerchant(
  merchantInternalAccountIdParam: string,
  startDate: Date,
  endDate: Date
) {
  const [result] = await db
    .select({
      totalAmount: sum(transactions.amount).mapWith(Number),
      count: sqlCount(transactions.id),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, merchantInternalAccountIdParam),
        eq(transactions.type, "Credit"),
        eq(transactions.status, "Completed"),
        gte(transactions.timestamp, startDate),
        lte(transactions.timestamp, endDate)
      )
    );
  return {
    totalAmount: parseFloat((result?.totalAmount || 0).toFixed(2)),
    count: result?.count || 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { merchantId, merchantInternalAccountId, merchantBusinessName } =
      await getAuthenticatedMerchantInfo(request);

    console.log(
      `[API Dashboard] Fetching summary for Merchant: ${merchantBusinessName} (ID: ${merchantId}, InternalLedgerAcc: ${merchantInternalAccountId})`
    );

    const now = new Date();

    // 1. Today's Summary
    const todayStart = getStartOfTodayUTC();
    const todayEnd = getEndOfTodayUTC();
    const todaySummary = await getTransactionSummaryForMerchant(
      merchantInternalAccountId,
      todayStart,
      todayEnd
    ); // Pass ID
    console.log(
      `[API Dashboard] Today's Summary for ${merchantBusinessName}: ${JSON.stringify(
        todaySummary
      )} (Range: ${todayStart.toISOString()} - ${todayEnd.toISOString()})`
    );

    // 2. This Week's Summary (Mon-Sun)
    const weekStart = getStartOfWeekUTC(now);
    const weekEnd = getEndOfWeekUTC(now);
    const thisWeekSummary = await getTransactionSummaryForMerchant(
      merchantInternalAccountId,
      weekStart,
      weekEnd
    ); // Pass ID
    console.log(
      `[API Dashboard] This Week's Summary for ${merchantBusinessName}: ${JSON.stringify(
        thisWeekSummary
      )} (Range: ${weekStart.toISOString()} - ${weekEnd.toISOString()})`
    );

    // 3. This Month's Summary
    const monthStart = getStartOfMonthUTC(now);
    const monthEnd = getEndOfMonthUTC(now);
    const thisMonthSummary = await getTransactionSummaryForMerchant(
      merchantInternalAccountId,
      monthStart,
      monthEnd
    ); // Pass ID
    console.log(
      `[API Dashboard] This Month's Summary for ${merchantBusinessName}: ${JSON.stringify(
        thisMonthSummary
      )} (Range: ${monthStart.toISOString()} - ${monthEnd.toISOString()})`
    );

    return NextResponse.json({
      merchantName: merchantBusinessName,
      today: todaySummary,
      thisWeek: thisWeekSummary,
      thisMonth: thisMonthSummary,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      console.error(
        `[API Dashboard] ApiError: ${error.message}`,
        error.details ? JSON.stringify(error.details) : ""
      );
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error(
      `[API Dashboard] Unexpected error: ${error.message || "Unknown"}`,
      error instanceof Error ? error.stack : JSON.stringify(error)
    );
    return NextResponse.json(
      {
        error:
          "An internal server error occurred while fetching dashboard summary.",
      },
      { status: 500 }
    );
  }
}
