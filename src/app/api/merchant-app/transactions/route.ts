// src/app/api/merchant-app/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants, accounts, transactions } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import * as jose from "jose";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { env } from "@/lib/config";

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

// --- Custom Error Classes (Copied from your version) ---
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
class BadRequestError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}
class BeneficiaryNotFoundError extends ApiError {
  constructor(message: string = "Beneficiary account not found.") {
    super(message, 404);
  }
}
class BeneficiaryInactiveError extends ApiError {
  constructor(message: string = "Beneficiary account is not active.") {
    super(message, 403);
  }
}
class InsufficientFundsError extends ApiError {
  constructor(message: string = "Insufficient funds in beneficiary account.") {
    super(message, 403);
  }
}
class IncorrectPinError extends ApiError {
  constructor(message: string = "Incorrect PIN provided.") {
    super(message, 400);
  }
}
class PinEntryLockedError extends ApiError {
  constructor(
    message: string = "PIN entry locked: Too many incorrect attempts."
  ) {
    super(message, 403);
  }
}
class MerchantAccountError extends ApiError {
  constructor(message: string = "Merchant account configuration error.") {
    super(message, 500);
  }
}
class TransactionProcessingError extends ApiError {
  constructor(
    message: string = "Failed to complete all transaction operations."
  ) {
    super(message, 500);
  }
}

// --- Helper to get Authenticated Merchant Info (Copied from your version, with optional logs) ---
async function getAuthenticatedMerchantInfo(
  request: NextRequest
): Promise<{
  merchantId: string;
  merchantInternalAccountId: string;
  merchantBusinessName: string;
}> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[API Transactions] Auth: No/invalid Authorization header");
    throw new UnauthorizedError("Authorization header is missing or improperly formatted.");
  }
  const token = authHeader.substring(7);
  if (!token) {
    console.warn("[API Transactions] Auth: Token missing after Bearer prefix");
    throw new UnauthorizedError("Token is missing.");
  }
  try {
    const secretKey = getJwtSecretKey(); // Called once here

    let payloadForLogging: jose.JWTPayload | null = null;
    try { payloadForLogging = jose.decodeJwt(token); } catch (e: any) { /* ignore for logging */ }
    // Optional detailed logging can be enabled if needed by uncommenting below
    // const serverCurrentTime = new Date();
    // const serverCurrentUnixTime = Math.floor(serverCurrentTime.getTime() / 1000);
    // console.log(`[API Transactions] Auth: Server current time: ${serverCurrentTime.toISOString()}`);
    // if (payloadForLogging?.exp) {
    //   console.log(`[API Transactions] Auth: Token exp: ${new Date(payloadForLogging.exp * 1000).toISOString()}, Time to expiry: ${payloadForLogging.exp - serverCurrentUnixTime}s`);
    // }

    const { payload } = await jose.jwtVerify<AuthenticatedMerchantPayload>(
      token, secretKey, { algorithms: [JWT_ALGORITHM], clockTolerance: "5 minutes" }
    );

    if (payload && payload.merchantId) {
      const merchantDetails = await db.select({ id: merchants.id, internalAccountId: merchants.internalAccountId, businessName: merchants.businessName, status: merchants.status })
        .from(merchants).where(eq(merchants.id, payload.merchantId)).limit(1);
      if (merchantDetails.length > 0 && merchantDetails[0].internalAccountId) {
        if (merchantDetails[0].status !== "active") {
          console.warn(`[API Transactions] Auth: Merchant ${payload.merchantId} not active (status: ${merchantDetails[0].status}).`);
          throw new UnauthorizedError("Merchant account is not active.");
        }
        return { merchantId: merchantDetails[0].id, merchantInternalAccountId: merchantDetails[0].internalAccountId, merchantBusinessName: merchantDetails[0].businessName };
      } else {
        console.warn(`[API Transactions] Auth: Merchant ${payload.merchantId} not found or no internalAccountId.`);
        throw new UnauthorizedError("Merchant details not found or configuration incomplete.");
      }
    }
    console.warn("[API Transactions] Auth: JWT valid, but merchantId missing in payload.");
    throw new UnauthorizedError("Invalid token payload.");
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("[API Transactions] Auth: DETAILED JWT Verif. Error:", "Name:", error.name, "Msg:", error.message, "Code:", error.code, "Full:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    if (["JWSSignatureVerificationFailed", "JWTExpired", "JWTClaimValidationFailed", "JWTInvalid"].includes(error.code || error.name)) {
      throw new UnauthorizedError(`Token verification failed/expired. Original: ${error.message} (Code: ${error.code || 'N/A'})`);
    }
    throw new UnauthorizedError(`Failed to authenticate token. Original: ${error.message} (Code: ${error.code || 'N/A'})`);
  }
}

// --- Zod Schema for POST (Copied from your version) ---
const PIN_FAILURE_TYPE_MAX_ATTEMPTS = "MAX_ATTEMPTS_REACHED";
const createTransactionPostSchema = z.object({
  amount: z.string({ required_error: "Amount is required." })
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be valid monetary string (e.g., '100.00' or '50').")
    .refine(valStr => { try { return parseFloat(valStr) > 0; } catch { return false; } }, { message: "Amount must be positive." }),
  beneficiaryDisplayId: z.string({ required_error: "Beneficiary display ID is required." }).min(1, "Beneficiary display ID cannot be empty."),
  enteredPin: z.string({ required_error: "Customer PIN is required." }).length(4, "PIN must be 4 digits.").regex(/^\d+$/, "PIN must be digits."),
  description: z.string().optional(),
  clientReportedPinFailureType: z.string().optional(),
});

// --- API Route Handler: POST /api/merchant-app/transactions (Restored to match your original structure and logging) ---
export async function POST(request: NextRequest) {
  let paymentId: string | null = null; // Defined at the top of the function

  try {
    // getJwtSecretKey(); // Not needed here, getAuthenticatedMerchantInfo calls it.

    const authenticatedMerchant = await getAuthenticatedMerchantInfo(request);
    const { merchantId, merchantInternalAccountId, merchantBusinessName } = authenticatedMerchant;

    let requestBodyJson;
    try { requestBodyJson = await request.json(); } 
    catch (e) { throw new BadRequestError("Invalid request body: Must be valid JSON."); }

    const validationResult = createTransactionPostSchema.safeParse(requestBodyJson);
    if (!validationResult.success) {
      throw new BadRequestError("Invalid request payload.", validationResult.error.flatten());
    }
    const { amount: amountString, beneficiaryDisplayId, enteredPin, description: reqDescription, clientReportedPinFailureType } = validationResult.data;
    const amount = parseFloat(amountString);

    paymentId = uuidv4(); // Assigned here
    console.log( // Using your original log format
      `[TX PaymentID: ${paymentId}] POST PROCESSING STARTED for beneficiary '${beneficiaryDisplayId}', amount: ${amount} (from string '${amountString}'). Merch: ${merchantBusinessName}(${merchantId})`
    );

    const beneficiaryQueryResult = await db.select({ id: accounts.id, balance: accounts.balance, status: accounts.status, displayId: accounts.displayId, childName: accounts.childName, hashedPin: accounts.hashedPin })
      .from(accounts).where(and(eq(accounts.displayId, beneficiaryDisplayId), eq(accounts.accountType, "CHILD_DISPLAY"))).limit(1);

    if (beneficiaryQueryResult.length === 0) {
      console.warn(`[TX PaymentID: ${paymentId}] Beneficiary with displayId '${beneficiaryDisplayId}' (type CHILD_DISPLAY) not found.`);
      throw new BeneficiaryNotFoundError(`Beneficiary account with display ID '${beneficiaryDisplayId}' not found.`);
    }
    const beneficiaryAccount = beneficiaryQueryResult[0];
    console.log(`[TX PaymentID: ${paymentId}] Beneficiary account found: DB_ID ${beneficiaryAccount.id}, DispID ${beneficiaryAccount.displayId}, Status ${beneficiaryAccount.status}`);

    const commonTxData = { // Data for failed transaction logging
        paymentId: paymentId!, amount: amount.toFixed(2), type: "Debit" as "Debit" | "Credit", // Ensure type matches enum
        accountId: beneficiaryAccount.id, merchantId: merchantId,
        description: reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
        timestamp: new Date()
    };

    if (clientReportedPinFailureType === PIN_FAILURE_TYPE_MAX_ATTEMPTS) {
      const reason = "PIN entry locked: Too many incorrect attempts (reported by client).";
      console.warn(`[TX PaymentID: ${paymentId}] Client reported max PIN attempts for beneficiary '${beneficiaryDisplayId}'. Logging failed transaction.`);
      await db.insert(transactions).values({ ...commonTxData, status: "Failed", declineReason: reason, pinVerified: false });
      console.log(`[TX PaymentID: ${paymentId}] Logged FAILED transaction due to client-reported max PIN attempts.`);
      throw new PinEntryLockedError(reason);
    } else {
      if (!beneficiaryAccount.hashedPin) {
        const reason = `Beneficiary account '${beneficiaryDisplayId}' (DB_ID: ${beneficiaryAccount.id}) does not have a PIN set up.`;
        console.warn(`[TX PaymentID: ${paymentId}] ${reason}`);
        throw new IncorrectPinError("Account PIN not set up."); // No failed tx log here in original, matches
      }
      console.log(`[TX PaymentID: ${paymentId}] Verifying PIN for beneficiary '${beneficiaryDisplayId}'.`);
      const isPinValid = await verifyPassword(enteredPin, beneficiaryAccount.hashedPin);
      if (!isPinValid) {
        const reason = `Incorrect PIN provided for beneficiary '${beneficiaryDisplayId}'.`;
        console.warn(`[TX PaymentID: ${paymentId}] ${reason}`);
        // Original did not log a failed transaction here, just threw. Matching that.
        throw new IncorrectPinError(reason);
      }
      console.log(`[TX PaymentID: ${paymentId}] PIN VERIFIED SUCCESSFULLY for beneficiary '${beneficiaryDisplayId}'.`);
    }

    console.log(`[TX PaymentID: ${paymentId}] PIN is valid. Proceeding to account status and balance checks.`);

    if (beneficiaryAccount.status !== "Active") {
      const reason = `Beneficiary account '${beneficiaryDisplayId}' is not active (status: ${beneficiaryAccount.status}).`;
      console.warn(`[TX PaymentID: ${paymentId}] ${reason}. Logging failed transaction.`);
      await db.insert(transactions).values({ ...commonTxData, status: "Failed", declineReason: reason, pinVerified: true });
      console.log(`[TX PaymentID: ${paymentId}] Logged FAILED transaction due to inactive beneficiary.`);
      throw new BeneficiaryInactiveError(reason);
    }

    const beneficiaryBalance = parseFloat(beneficiaryAccount.balance || "0.00");
    console.log(`[TX PaymentID: ${paymentId}] Beneficiary balance: ${beneficiaryBalance}. Amount to transact: ${amount}.`);
    if (beneficiaryBalance < amount) {
      const reason = `Insufficient funds in beneficiary account '${beneficiaryDisplayId}'. Available: ${beneficiaryBalance}, Required: ${amount}.`;
      console.warn(`[TX PaymentID: ${paymentId}] ${reason}. Logging failed transaction.`);
      await db.insert(transactions).values({ ...commonTxData, status: "Failed", declineReason: reason, pinVerified: true });
      console.log(`[TX PaymentID: ${paymentId}] Logged FAILED transaction due to insufficient funds.`);
      throw new InsufficientFundsError(reason);
    }

    console.log(`[TX PaymentID: ${paymentId}] All pre-checks passed. Starting DB transaction.`);
    const result = await db.transaction(async (tx) => {
      console.log(`[TX PaymentID: ${paymentId}] Inside DB transaction callback.`);
      const merchantInternalAcctDetails = await tx.select({ id: accounts.id, balance: accounts.balance, status: accounts.status })
        .from(accounts).where(and(eq(accounts.id, merchantInternalAccountId), eq(accounts.accountType, "MERCHANT_INTERNAL"))).limit(1);

      if (merchantInternalAcctDetails.length === 0 || merchantInternalAcctDetails[0].status !== "Active") {
        const statusInfo = merchantInternalAcctDetails.length > 0 ? merchantInternalAcctDetails[0].status : "Not Found";
        const errMsg = `CRITICAL (within TX): Merchant internal account ${merchantInternalAccountId} (for ${merchantBusinessName}) issue (Status: ${statusInfo}).`;
        console.error(`[TX PaymentID: ${paymentId}] ${errMsg}`);
        throw new MerchantAccountError(errMsg);
      }
      const merchantLedgerAccount = merchantInternalAcctDetails[0];
      console.log(`[TX PaymentID: ${paymentId}] Merchant internal account (${merchantLedgerAccount.id}) validated. Status: ${merchantLedgerAccount.status}, Balance: ${merchantLedgerAccount.balance}`);

      const debitDescription = reqDescription || `Payment to ${merchantBusinessName}`;
      const creditDescription = reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId}`;

      const newBeneficiaryBalance = beneficiaryBalance - amount;
      console.log(`[TX PaymentID: ${paymentId}] Updating beneficiary account ${beneficiaryAccount.id} balance from ${beneficiaryBalance} to ${newBeneficiaryBalance.toFixed(2)}.`);
      await tx.update(accounts).set({ balance: newBeneficiaryBalance.toFixed(2) }).where(eq(accounts.id, beneficiaryAccount.id));

      const [debitLeg] = await tx.insert(transactions).values({ 
        paymentId: paymentId!, accountId: beneficiaryAccount.id, merchantId: merchantId, type: "Debit", 
        amount: amount.toFixed(2), status: "Completed", pinVerified: true, description: debitDescription, timestamp: new Date() 
      }).returning();
      console.log(`[TX PaymentID: ${paymentId}] Inserted DEBIT LEG. ID: ${debitLeg.id}`); // Restored log

      const merchantCurrentBalance = parseFloat(merchantLedgerAccount.balance || "0.00");
      const newMerchantBalance = merchantCurrentBalance + amount;
      console.log(`[TX PaymentID: ${paymentId}] Updating merchant account ${merchantInternalAccountId} balance from ${merchantCurrentBalance} to ${newMerchantBalance.toFixed(2)}.`);
      await tx.update(accounts).set({ balance: newMerchantBalance.toFixed(2) }).where(eq(accounts.id, merchantInternalAccountId));

      const [creditLeg] = await tx.insert(transactions).values({ 
        paymentId: paymentId!, accountId: merchantInternalAccountId, merchantId: merchantId, type: "Credit", 
        amount: amount.toFixed(2), status: "Completed", pinVerified: true, description: creditDescription, timestamp: new Date() 
      }).returning();
      console.log(`[TX PaymentID: ${paymentId}] Inserted CREDIT LEG. ID: ${creditLeg.id}`); // Restored log

      // Using Promise.all as in your original for fetching updated balances
      const [updatedCustomerAccountResArray, updatedMerchantAccountResArray] = await Promise.all([
        tx.select({ id: accounts.id, balance: accounts.balance }).from(accounts).where(eq(accounts.id, beneficiaryAccount.id)).limit(1),
        tx.select({ id: accounts.id, balance: accounts.balance }).from(accounts).where(eq(accounts.id, merchantInternalAccountId)).limit(1),
      ]);
      
      // Destructure from array assuming limit(1) always returns an element if found
      const updatedCustomerAccountRes = updatedCustomerAccountResArray[0];
      const updatedMerchantAccountRes = updatedMerchantAccountResArray[0];


      if (!updatedCustomerAccountRes || !updatedMerchantAccountRes || !debitLeg || !creditLeg) {
        console.error(`[TX PaymentID: ${paymentId}] CRITICAL ERROR: Post-update data fetching or leg insertion failed within DB transaction.`);
        throw new TransactionProcessingError("Failed to confirm all transaction operations post-update.");
      }

      console.log(
        `[TX PaymentID: ${paymentId}] SUCCESSFUL transaction. Customer (${beneficiaryAccount.id}) new balance: ${updatedCustomerAccountRes.balance}, Merchant Account (${merchantInternalAccountId}) new balance: ${updatedMerchantAccountRes.balance}`
      );
      // Restoring original return structure from transaction block
      return {
        paymentId: paymentId!,
        transactionId: debitLeg.id,
        status: "Completed",
        message: "Transaction processed successfully.",
        customerNewBalance: updatedCustomerAccountRes.balance,
        merchantNewBalance: updatedMerchantAccountRes.balance,
      };
    });

    console.log(`[TX PaymentID: ${paymentId}] DB transaction completed successfully. Preparing successful response.`);
    // API response uses only a subset of 'result'
    return NextResponse.json(
      {
        transactionId: result.transactionId,
        status: result.status,
        message: result.message,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const logPId = paymentId || "N/A_BEFORE_PAYMENTID_GEN"; // Uses paymentId for logging context
    const errorMessage = error.message || "Unknown error occurred.";
    console.error(
      `[API Transactions - PaymentID: ${logPId}] POST Processing FAILED. Error: ${errorMessage}`,
      error instanceof Error && error.stack ? error.stack : JSON.stringify(error)
    );

    if (error instanceof ApiError) {
      const errorDetails = error.details ? error.details : undefined;
      return NextResponse.json(
        { error: error.message, details: errorDetails },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "An internal server error occurred while processing the transaction." },
      { status: 500 }
    );
  }
}

// --- API Route Handler: GET /api/merchant-app/transactions (WITH REFINEMENTS 1 & 2) ---
export async function GET(request: NextRequest) {
  try {
    const authenticatedMerchant = await getAuthenticatedMerchantInfo(request);
    const { merchantId, merchantBusinessName } = authenticatedMerchant; // merchantInternalAccountId also available

    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const statusQueryParam = url.searchParams.get("status");

    let page = 1;
    if (pageParam) {
        const parsedPage = parseInt(pageParam, 10);
        if (!isNaN(parsedPage) && parsedPage > 0) { page = parsedPage; }
        else { console.warn(`[API GET Transactions] Invalid page: ${pageParam}. Defaulting to 1.`); }
    }

    let limit = 20;
    if (limitParam) {
        const parsedLimit = parseInt(limitParam, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) { limit = parsedLimit; }
        else { console.warn(`[API GET Transactions] Invalid limit: ${limitParam}. Defaulting to 20.`); }
    }
    const offset = (page - 1) * limit;

    const effectiveStatusFilter = (statusQueryParam && statusQueryParam.toLowerCase() !== "all")
        ? statusQueryParam
        : null;

    const otherPartyAccount = alias(accounts, "other_party_account_details");

    console.log(
      `[API GET Transactions] Merchant: ${merchantBusinessName} (ID: ${merchantId}). Page: ${page}, Limit: ${limit}, StatusQP: '${statusQueryParam}', EffectiveDBStatus: '${effectiveStatusFilter === null ? 'All' : effectiveStatusFilter}', LegView: CustomerDebit`
    );

    const whereClauses = [
        eq(transactions.merchantId, merchantId),
        eq(transactions.type, "Debit"), 
    ];
    if (effectiveStatusFilter) {
        whereClauses.push(eq(transactions.status, effectiveStatusFilter as typeof transactions.status.enumValues[number]));
    }

    const transactionRecords = await db
      .select({
        id: transactions.id,
        paymentId: transactions.paymentId,
        timestamp: transactions.timestamp,
        amount: transactions.amount,
        type: transactions.type,
        status: transactions.status,
        description: transactions.description,
        declineReason: transactions.declineReason,
        createdAt: transactions.createdAt,
        relatedAccountId: otherPartyAccount.id,
        relatedAccountDisplayId: otherPartyAccount.displayId,
        relatedAccountChildName: otherPartyAccount.childName,
        relatedAccountType: otherPartyAccount.accountType,
      })
      .from(transactions)
      .innerJoin(
        otherPartyAccount,
        and(
            eq(transactions.accountId, otherPartyAccount.id),
            eq(otherPartyAccount.accountType, "CHILD_DISPLAY")
        )
      )
      .where(and(...whereClauses))
      .orderBy(desc(transactions.timestamp), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({
        count: sql<number>`coalesce(count(${transactions.id})::int, 0)`,
      })
      .from(transactions)
      .innerJoin(
        otherPartyAccount,
        and(
            eq(transactions.accountId, otherPartyAccount.id),
            eq(otherPartyAccount.accountType, "CHILD_DISPLAY")
        )
      )
      .where(and(...whereClauses));

    const totalTransactions = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalTransactions / limit) || 1;

    console.log(
      `[API GET Transactions] Found ${transactionRecords.length} single-leg records for merchantId: ${merchantId} on page ${page}. Total items matching filter: ${totalTransactions}`
    );

    return NextResponse.json({
      data: transactionRecords.map(tx => ({
        legId: tx.id,
        paymentId: tx.paymentId,
        eventTimestamp: tx.timestamp,
        recordCreatedAt: tx.createdAt,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        originalDescription: tx.description,
        declineReason: tx.declineReason,
        relatedAccountId: tx.relatedAccountId,
        relatedAccountDisplayId: tx.relatedAccountDisplayId,
        relatedAccountChildName: tx.relatedAccountChildName,
        relatedAccountType: tx.relatedAccountType,
        displayDescription: `Payment from ${tx.relatedAccountChildName || tx.relatedAccountDisplayId || 'customer'}${tx.description ? ` for ${tx.description}` : ''}`
      })),
      pagination: {
        page,
        limit,
        totalItems: totalTransactions,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        statusFilter: statusQueryParam ? statusQueryParam.toLowerCase() === "all" ? "All" : statusQueryParam : "All"
      },
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
        console.error(`[API GET Transactions] ApiError: ${error.message}`, error.details ? JSON.stringify(error.details) : "");
      return NextResponse.json({ error: error.message, details: error.details }, { status: error.statusCode });
    }
    console.error(`[API GET Transactions] Unexpected error: ${error.message || "Unknown"}`, error instanceof Error ? error.stack : JSON.stringify(error));
    return NextResponse.json({ error: "An internal server error occurred while fetching transactions." }, { status: 500 });
  }
}