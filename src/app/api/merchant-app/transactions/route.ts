// src/app/api/merchant-app/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
    merchants, 
    accounts, 
    transactions, 
    payments, 
    transactionStatusEnum,
    transactionTypeEnum,
    accountTypeEnum,
    merchantStatusEnum, // <<< CORRECTED: Added import
    accountStatusEnum,  // <<< CORRECTED: Added import
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import * as jose from "jose";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { env } from "@/lib/env";
import { generateDisplayId as generateSystemDisplayId } from "@/lib/utils/idGenerator";

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
  constructor(message: string = "Unauthorized: Invalid or missing token, or merchant configuration issue.") {
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
  constructor(message: string = "PIN entry locked: Too many incorrect attempts.") {
    super(message, 403);
  }
}
class MerchantAccountError extends ApiError {
  constructor(message: string = "Merchant account configuration error.") {
    super(message, 500);
  }
}
class TransactionProcessingError extends ApiError {
  constructor(message: string = "Failed to complete all transaction operations.") {
    super(message, 500);
  }
}

// --- Helper to get Authenticated Merchant Info ---
interface MerchantInfo {
  merchantId: string;
  merchantInternalAccountId: string;
  merchantBusinessName: string;
}

async function getAuthenticatedMerchantInfo(request: NextRequest): Promise<MerchantInfo> {
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
    const secretKey = getJwtSecretKey();
    const { payload } = await jose.jwtVerify<AuthenticatedMerchantPayload>(
      token, secretKey, { algorithms: [JWT_ALGORITHM], clockTolerance: "5 minutes" }
    );

    if (payload && payload.merchantId) {
      const merchantDetails = await db.select({
          id: merchants.id, 
          internalAccountId: merchants.internalAccountId,
          businessName: merchants.businessName, 
          status: merchants.status,
        })
        .from(merchants)
        .where(eq(merchants.id, payload.merchantId))
        .limit(1);

      if (merchantDetails.length > 0 && merchantDetails[0].internalAccountId) {
        // Use the imported merchantStatusEnum here
        if (merchantDetails[0].status !== merchantStatusEnum.enumValues.find(s => s === "active")) { 
          console.warn(`[API Transactions] Auth: Merchant ${payload.merchantId} not active (status: ${merchantDetails[0].status}).`);
          throw new UnauthorizedError("Merchant account is not active.");
        }
        return {
          merchantId: merchantDetails[0].id,
          merchantInternalAccountId: merchantDetails[0].internalAccountId,
          merchantBusinessName: merchantDetails[0].businessName,
        };
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
    if (["JWSSignatureVerificationFailed", "JWTExpired", "JWTClaimValidationFailed", "JWTInvalid", "ERR_JWT_EXPIRED", "ERR_JWS_SIGNATURE_VERIFICATION_FAILED"].includes(error.code || error.name)) {
      throw new UnauthorizedError(`Token verification failed/expired. Original: ${error.message} (Code: ${error.code || "N/A"})`);
    }
    throw new UnauthorizedError(`Failed to authenticate token. Original: ${error.message} (Code: ${error.code || "N/A"})`);
  }
}

// --- Zod Schema for POST ---
const createMerchantAppTransactionPostSchema = z.object({
  amount: z.string({ required_error: "Amount is required." })
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be valid monetary string (e.g., '100.00' or '50').")
    .refine((valStr) => { try { return parseFloat(valStr) > 0; } catch { return false; }}, { message: "Amount must be positive." }),
  beneficiaryDisplayId: z.string({ required_error: "Beneficiary display ID is required." }).min(1, "Beneficiary display ID cannot be empty."),
  enteredPin: z.string({ required_error: "Customer PIN is required." }).length(4, "PIN must be 4 digits.").regex(/^\d+$/, "PIN must be digits."),
  description: z.string().optional(),
  clientReportedPinFailureType: z.string().optional(),
});

const PIN_FAILURE_TYPE_MAX_ATTEMPTS = "MAX_ATTEMPTS_REACHED";

// --- API Route Handler: POST /api/merchant-app/transactions ---
export async function POST(request: NextRequest) {
  let paymentUUIDForTransactionLegs: string | null = null; 
  let paymentDisplayIdForResponse: string | null = null;
  let rawClientPayloadForLogging: any = null; 

  try {
    const authenticatedMerchant = await getAuthenticatedMerchantInfo(request);
    const { merchantId, merchantInternalAccountId, merchantBusinessName } = authenticatedMerchant;

    try { 
      rawClientPayloadForLogging = await request.json(); 
    } catch (e) { 
      throw new BadRequestError("Invalid request body: Must be valid JSON."); 
    }
    console.log("[API POST /merchant-app/transactions] Raw request body:", JSON.stringify(rawClientPayloadForLogging));

    const validationResult = createMerchantAppTransactionPostSchema.safeParse(rawClientPayloadForLogging);
    if (!validationResult.success) {
      console.warn("[API POST /merchant-app/transactions] Zod Validation Failed:", validationResult.error.flatten());
      throw new BadRequestError("Invalid request payload.", validationResult.error.flatten().fieldErrors);
    }
    const {
      amount: amountString,
      beneficiaryDisplayId,
      enteredPin,
      description: reqDescription,
      clientReportedPinFailureType,
    } = validationResult.data;
    const amount = parseFloat(amountString);

    const transactionProcessingResult = await db.transaction(async (tx) => {
        const newPaymentDisplayId = await generateSystemDisplayId(tx, 'PAY'); 

        const [paymentInsertResult] = await tx.insert(payments).values({
            displayId: newPaymentDisplayId 
        }).returning({ id: payments.id, displayId: payments.displayId });

        if (!paymentInsertResult || !paymentInsertResult.id) {
            console.error(`[MerchantApp TX] Failed to create payment record. Generated PAY-ID: ${newPaymentDisplayId}`);
            throw new TransactionProcessingError("Could not initiate payment record.");
        }
        paymentUUIDForTransactionLegs = paymentInsertResult.id;
        paymentDisplayIdForResponse = paymentInsertResult.displayId; 
        console.log(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] POST PROCESSING STARTED for beneficiary '${beneficiaryDisplayId}', amount: ${amount}. Merch: ${merchantBusinessName}(${merchantId}). Payment DisplayID: ${paymentDisplayIdForResponse}`);

        const beneficiaryQueryResult = await tx
          .select({
            id: accounts.id, balance: accounts.balance, status: accounts.status,
            displayId: accounts.displayId, childName: accounts.childName, hashedPin: accounts.hashedPin,
          })
          .from(accounts)
          .where(and(eq(accounts.displayId, beneficiaryDisplayId), eq(accounts.accountType, accountTypeEnum.enumValues.find(at => at === "CHILD_DISPLAY")!)))
          .limit(1);

        if (beneficiaryQueryResult.length === 0) {
          console.warn(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Beneficiary with displayId '${beneficiaryDisplayId}' not found.`);
          throw new BeneficiaryNotFoundError(`Beneficiary account with display ID '${beneficiaryDisplayId}' not found.`);
        }
        const beneficiaryAccount = beneficiaryQueryResult[0];
        console.log(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Beneficiary account found: DB_ID ${beneficiaryAccount.id}, DispID ${beneficiaryAccount.displayId}, Status ${beneficiaryAccount.status}`);

        const commonTxDataForFailureLogs: Omit<typeof transactions.$inferInsert, 'displayId' | 'status' | 'declineReason'> & { status: typeof transactionStatusEnum.enumValues[number], declineReason: string } = {
            paymentId: paymentUUIDForTransactionLegs!, 
            amount: amount.toFixed(2),
            type: transactionTypeEnum.enumValues.find(t => t === "Debit")!,
            accountId: beneficiaryAccount.id,
            merchantId: merchantId,
            description: reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
            timestamp: new Date(),
            pinVerified: false, 
            metadata: null,
            status: transactionStatusEnum.enumValues.find(s => s === "Failed")!, 
            declineReason: "Unknown failure before specific check", 
        };

        if (clientReportedPinFailureType === PIN_FAILURE_TYPE_MAX_ATTEMPTS) {
          const reason = "PIN entry locked: Too many incorrect attempts (reported by client).";
          console.warn(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Client reported max PIN attempts. Logging failed transaction.`);
          await tx.insert(transactions).values({
            ...commonTxDataForFailureLogs,
            displayId: await generateSystemDisplayId(tx, "TRX-PINLOCK"),
            declineReason: reason,
          });
          console.log(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Logged FAILED transaction due to client-reported max PIN attempts.`);
          throw new PinEntryLockedError(reason);
        } else {
          if (!beneficiaryAccount.hashedPin) {
            console.warn(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Beneficiary account '${beneficiaryDisplayId}' no PIN.`);
            throw new IncorrectPinError("Account PIN not set up.");
          }
          const isPinValid = await verifyPassword(enteredPin, beneficiaryAccount.hashedPin);
          if (!isPinValid) {
            console.warn(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Incorrect PIN for '${beneficiaryDisplayId}'.`);
            throw new IncorrectPinError(`Incorrect PIN provided for beneficiary '${beneficiaryDisplayId}'.`);
          }
          console.log(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] PIN VERIFIED for '${beneficiaryDisplayId}'.`);
          commonTxDataForFailureLogs.pinVerified = true; 
        }

        // Use the imported accountStatusEnum here
        if (beneficiaryAccount.status !== accountStatusEnum.enumValues.find(s => s === "Active")) { 
          const reason = `Beneficiary account '${beneficiaryDisplayId}' is not active (status: ${beneficiaryAccount.status}).`;
          console.warn(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] ${reason}. Logging failed transaction.`);
          await tx.insert(transactions).values({
            ...commonTxDataForFailureLogs, 
            displayId: await generateSystemDisplayId(tx, "TRX-INACTIVE"),
            declineReason: reason,
          });
          console.log(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Logged FAILED transaction due to inactive beneficiary.`);
          throw new BeneficiaryInactiveError(reason);
        }

        const beneficiaryBalance = parseFloat(beneficiaryAccount.balance || "0.00");
        if (beneficiaryBalance < amount) {
          const reason = `Insufficient funds in beneficiary account '${beneficiaryDisplayId}'. Available: ${beneficiaryBalance}, Required: ${amount}.`;
          console.warn(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] ${reason}. Logging failed transaction.`);
          await tx.insert(transactions).values({
            ...commonTxDataForFailureLogs, 
            displayId: await generateSystemDisplayId(tx, "TRX-INSUF"), 
            declineReason: reason, 
          });
          console.log(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Logged FAILED transaction due to insufficient funds.`);
          throw new InsufficientFundsError(reason);
        }

        console.log(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] All pre-checks passed. Starting main DB transaction part.`);
        
        const merchantInternalAcctDetails = await tx.select({ id: accounts.id, balance: accounts.balance, status: accounts.status })
          .from(accounts).where(and(eq(accounts.id, merchantInternalAccountId), eq(accounts.accountType, accountTypeEnum.enumValues.find(at => at === "MERCHANT_INTERNAL")!))).limit(1);

        // Use the imported accountStatusEnum here
        if (merchantInternalAcctDetails.length === 0 || merchantInternalAcctDetails[0].status !== accountStatusEnum.enumValues.find(s => s === "Active")) {
          const errMsg = `CRITICAL: Merchant internal account ${merchantInternalAccountId} issue. Status: ${merchantInternalAcctDetails[0]?.status}`;
          console.error(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] ${errMsg}`);
          throw new MerchantAccountError(errMsg);
        }
        const merchantLedgerAccount = merchantInternalAcctDetails[0];

        const debitDescription = reqDescription || `Payment to ${merchantBusinessName}`;
        const creditDescription = reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId}`;

        await tx.update(accounts).set({ balance: (beneficiaryBalance - amount).toFixed(2), lastActivity: new Date() }).where(eq(accounts.id, beneficiaryAccount.id));
        
        const debitLegDisplayId = await generateSystemDisplayId(tx, "TRX-D");
        const [debitLeg] = await tx.insert(transactions).values({
          displayId: debitLegDisplayId,
          paymentId: paymentUUIDForTransactionLegs!,
          accountId: beneficiaryAccount.id, merchantId: merchantId, 
          type: transactionTypeEnum.enumValues.find(t => t === "Debit")!,
          amount: amount.toFixed(2), 
          status: transactionStatusEnum.enumValues.find(s => s === "Completed")!, 
          pinVerified: true,
          description: debitDescription, 
          timestamp: new Date(), 
          reference: null, metadata: null, declineReason: null, 
        }).returning();
        console.log(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Inserted DEBIT LEG. ID: ${debitLeg.id}, DisplayID: ${debitLeg.displayId}`);

        const merchantNewBalance = parseFloat(merchantLedgerAccount.balance || "0.00") + amount;
        await tx.update(accounts).set({ balance: merchantNewBalance.toFixed(2), lastActivity: new Date() }).where(eq(accounts.id, merchantInternalAccountId));

        const creditLegDisplayId = await generateSystemDisplayId(tx, "TRX-C");
        const [creditLeg] = await tx.insert(transactions).values({
          displayId: creditLegDisplayId,
          paymentId: paymentUUIDForTransactionLegs!,
          accountId: merchantInternalAccountId, merchantId: merchantId, 
          type: transactionTypeEnum.enumValues.find(t => t === "Credit")!,
          amount: amount.toFixed(2), 
          status: transactionStatusEnum.enumValues.find(s => s === "Completed")!, 
          pinVerified: true, 
          description: creditDescription, 
          timestamp: new Date(),
          reference: null, metadata: null, declineReason: null, 
        }).returning();
        console.log(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Inserted CREDIT LEG. ID: ${creditLeg.id}, DisplayID: ${creditLeg.displayId}`);
        
        if (!debitLeg || !creditLeg) {
          console.error(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Critical error: One or both transaction legs failed to insert/return.`);
          throw new TransactionProcessingError("Data confirmation failed post-update for transaction legs.");
        }
        
        const [updatedCustomer, updatedMerchant] = await Promise.all([
          tx.select({ balance: accounts.balance }).from(accounts).where(eq(accounts.id, beneficiaryAccount.id)).limit(1),
          tx.select({ balance: accounts.balance }).from(accounts).where(eq(accounts.id, merchantInternalAccountId)).limit(1),
        ]);

        if (!updatedCustomer[0] || !updatedMerchant[0]) {
            console.error(`[MerchantApp TX PaymentID: ${paymentUUIDForTransactionLegs}] Failed to retrieve updated balances post-transaction.`);
            throw new TransactionProcessingError("Data confirmation failed for account balances.");
        }

        return {
          paymentDisplayId: paymentDisplayIdForResponse, 
          paymentInternalId: paymentUUIDForTransactionLegs,
          debitTransactionDisplayId: debitLeg.displayId, 
          creditTransactionDisplayId: creditLeg.displayId,
          status: "Completed",
          message: "Transaction processed successfully.",
          customerNewBalance: updatedCustomer[0].balance, 
          merchantNewBalance: updatedMerchant[0].balance,
        };
    }); 

    return NextResponse.json({
        paymentDisplayId: transactionProcessingResult.paymentDisplayId,
        transactionStatus: transactionProcessingResult.status, 
        message: transactionProcessingResult.message,
    }, { status: 201 });

  } catch (error: any) {
    const logPId = paymentUUIDForTransactionLegs || "N/A_PAYMENTID_PRE_TX";
    const errorPayload = {
        message: error.message,
        stack: error.stack, 
        code: error.code, 
        detail: error.detail, 
        constraint: error.constraint,
        clientPayload: rawClientPayloadForLogging,
        ...(error instanceof ApiError && { apiErrorDetails: error.details }) 
    };
    console.error(`[MerchantApp TX - PaymentID: ${logPId}] POST FAILED:`, JSON.stringify(errorPayload, null, 2));
    
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) { 
        return NextResponse.json({ error: "Invalid request payload.", details: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error during transaction processing." }, { status: 500 });
  }
}

// --- API Route Handler: GET /api/merchant-app/transactions ---
export async function GET(request: NextRequest) {
  try {
    const authenticatedMerchant = await getAuthenticatedMerchantInfo(request);
    const { merchantId, merchantBusinessName } = authenticatedMerchant; // merchantBusinessName is available from MerchantInfo

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

    const effectiveStatusFilter = statusQueryParam && statusQueryParam.toLowerCase() !== "all" ? statusQueryParam : null;
    const otherPartyAccount = alias(accounts, "other_party_account_details");

    const conditions = [
      eq(transactions.merchantId, merchantId),
      eq(transactions.type, transactionTypeEnum.enumValues.find(t => t === "Debit")!), 
    ];
    if (effectiveStatusFilter) {
      const validStatus = transactionStatusEnum.enumValues.find(s => s.toLowerCase() === effectiveStatusFilter.toLowerCase());
      if (validStatus) {
        conditions.push(eq(transactions.status, validStatus));
      } else {
        console.warn(`[API GET Transactions] Invalid status filter: ${effectiveStatusFilter}. Ignoring status filter.`);
      }
    }
    const whereCondition = and(...conditions); // Ensure conditions is not empty before spreading for 'and'

    const transactionRecords = await db
      .select({
        id: transactions.id, displayId: transactions.displayId, paymentId: transactions.paymentId,
        timestamp: transactions.timestamp, amount: transactions.amount, type: transactions.type,
        status: transactions.status, description: transactions.description, declineReason: transactions.declineReason,
        createdAt: transactions.createdAt, 
        relatedAccountId: otherPartyAccount.id, 
        relatedAccountDisplayId: otherPartyAccount.displayId, 
        relatedAccountChildName: otherPartyAccount.childName,
        relatedAccountType: otherPartyAccount.accountType,
      })
      .from(transactions)
      .innerJoin(otherPartyAccount, eq(transactions.accountId, otherPartyAccount.id))
      .where(whereCondition)
      .orderBy(desc(transactions.timestamp), desc(transactions.createdAt))
      .limit(limit).offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`coalesce(count(${transactions.id})::int, 0)` })
      .from(transactions)
      .innerJoin(otherPartyAccount, eq(transactions.accountId, otherPartyAccount.id))
      .where(whereCondition);
      
    const totalTransactions = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalTransactions / limit) || 1;

    return NextResponse.json({
      data: transactionRecords.map((tx) => ({
        legId: tx.id, transactionDisplayId: tx.displayId, paymentId: tx.paymentId,
        eventTimestamp: tx.timestamp, recordCreatedAt: tx.createdAt, amount: tx.amount,
        type: tx.type, status: tx.status, originalDescription: tx.description,
        declineReason: tx.declineReason, 
        beneficiaryAccountId: tx.relatedAccountId, 
        beneficiaryDisplayId: tx.relatedAccountDisplayId, 
        beneficiaryName: tx.relatedAccountChildName,
        beneficiaryAccountType: tx.relatedAccountType,
        displayDescription: `Payment from ${tx.relatedAccountChildName || tx.relatedAccountDisplayId || "customer"}${tx.description ? ` for ${tx.description}` : ""}`,
      })),
      pagination: {
        page, limit, totalItems: totalTransactions, totalPages,
        hasNextPage: page < totalPages, hasPreviousPage: page > 1,
        statusFilter: statusQueryParam ? (statusQueryParam.toLowerCase() === "all" ? "All" : statusQueryParam) : "All",
      },
    });
  } catch (error: any) {
    console.error(`[MerchantApp GET Transactions] Error: ${error.message}`, error.stack);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error fetching transactions." }, { status: 500 });
  }
}