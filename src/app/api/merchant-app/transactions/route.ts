// src/app/api/merchant-app/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { merchants, accounts, transactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { verifyPassword } from '@/lib/auth/password'; // Using your scrypt verifyPassword utility

// --- JWT Configuration ---
const JWT_SECRET_STRING = process.env.JWT_SECRET;
const JWT_ALGORITHM = 'HS256';

let _jwtSecretKey: Uint8Array | null = null;

function getJwtSecretKey(): Uint8Array {
  if (_jwtSecretKey) return _jwtSecretKey;
  if (!JWT_SECRET_STRING) {
    throw new Error('JWT_SECRET environment variable is not set.');
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
class UnauthorizedError extends ApiError { constructor(message: string = 'Unauthorized: Invalid or missing token, or merchant configuration issue.') { super(message, 401); } }
class BadRequestError extends ApiError { constructor(message: string, details?: any) { super(message, 400, details); } }
class BeneficiaryNotFoundError extends ApiError { constructor(message: string = "Beneficiary account not found.") { super(message, 404); } }
class BeneficiaryInactiveError extends ApiError { constructor(message: string = "Beneficiary account is not active.") { super(message, 403); } }
class InsufficientFundsError extends ApiError { constructor(message: string = "Insufficient funds in beneficiary account.") { super(message, 403); } }
class IncorrectPinError extends ApiError { constructor(message: string = "Incorrect PIN provided.") { super(message, 400); } }
class PinEntryLockedError extends ApiError { constructor(message: string = "PIN entry locked: Too many incorrect attempts.") { super(message, 403); } }
class MerchantAccountError extends ApiError { constructor(message: string = "Merchant account configuration error.") { super(message, 500); } }
class TransactionProcessingError extends ApiError { constructor(message: string = "Failed to complete all transaction operations.") { super(message, 500); } }

// --- Helper to get Authenticated Merchant Info ---
async function getAuthenticatedMerchantInfo(request: NextRequest): Promise<{ merchantId: string; merchantInternalAccountId: string; merchantBusinessName: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[API Transactions] Auth: No/invalid Authorization header');
    throw new UnauthorizedError('Authorization header is missing or improperly formatted.');
  }
  const token = authHeader.substring(7);
  if (!token) {
    console.warn('[API Transactions] Auth: Token missing after Bearer prefix');
    throw new UnauthorizedError('Token is missing.');
  }
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jose.jwtVerify<AuthenticatedMerchantPayload>(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
    });
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
        if (merchantDetails[0].status !== 'active') {
          console.warn(`[API Transactions] Auth: Merchant ${payload.merchantId} is not active (status: ${merchantDetails[0].status}).`);
          throw new UnauthorizedError('Merchant account is not active.');
        }
        return {
          merchantId: merchantDetails[0].id,
          merchantInternalAccountId: merchantDetails[0].internalAccountId,
          merchantBusinessName: merchantDetails[0].businessName,
        };
      } else {
        console.warn(`[API Transactions] Auth: Merchant ${payload.merchantId} not found or missing internalAccountId.`);
        throw new UnauthorizedError('Merchant details not found or configuration incomplete.');
      }
    }
    console.warn('[API Transactions] Auth: JWT valid, but merchantId missing in payload.');
    throw new UnauthorizedError('Invalid token payload.');
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.warn('[API Transactions] Auth: JWT Verification Error:', error.name, error.message);
    if (['JWSSignatureVerificationFailed', 'JWTExpired', 'JWTClaimValidationFailed', 'JWTInvalid'].includes(error.code || error.name)) {
        throw new UnauthorizedError('Token verification failed or token expired.');
    }
    throw new UnauthorizedError('Failed to authenticate token.');
  }
}

// --- Zod Schema for Request Body Validation ---
const PIN_FAILURE_TYPE_MAX_ATTEMPTS = "MAX_ATTEMPTS_REACHED";

const createTransactionSchema = z.object({
  amount: z.number({ required_error: "Amount is required." }).positive({ message: "Amount must be a positive number." }),
  beneficiaryDisplayId: z.string({ required_error: "Beneficiary display ID is required." }).min(1, "Beneficiary display ID cannot be empty."),
  enteredPin: z.string({ required_error: "Customer PIN is required." })
              .length(4, "PIN must be exactly 4 digits.")
              .regex(/^\d+$/, "PIN must contain only digits."),
  description: z.string().optional(),
  clientReportedPinFailureType: z.string().optional(),
});


// --- API Route Handler: POST /api/merchant-app/transactions ---
export async function POST(request: NextRequest) {
  let paymentId: string | null = null; 

  try {
    getJwtSecretKey(); 

    const authenticatedMerchant = await getAuthenticatedMerchantInfo(request);
    const { merchantId, merchantInternalAccountId, merchantBusinessName } = authenticatedMerchant;

    let requestBodyJson;
    try {
      requestBodyJson = await request.json();
    } catch (e) {
      throw new BadRequestError('Invalid request body: Must be valid JSON.');
    }

    const validationResult = createTransactionSchema.safeParse(requestBodyJson);
    if (!validationResult.success) {
      throw new BadRequestError("Invalid request payload.", validationResult.error.format());
    }
    const { amount, beneficiaryDisplayId, enteredPin, description: reqDescription, clientReportedPinFailureType } = validationResult.data;

    paymentId = uuidv4();

    const beneficiaryQueryResult = await db
      .select({
        id: accounts.id, balance: accounts.balance, status: accounts.status,
        displayId: accounts.displayId, childName: accounts.childName, hashedPin: accounts.hashedPin,
      })
      .from(accounts)
      .where(and(eq(accounts.displayId, beneficiaryDisplayId), eq(accounts.accountType, "CHILD_DISPLAY")))
      .limit(1);

    if (beneficiaryQueryResult.length === 0) {
      // No DB log here, as beneficiary not found, no transaction attempt to record.
      console.warn(`[TX PaymentID: ${paymentId}] Pre-check: Beneficiary with displayId '${beneficiaryDisplayId}' not found.`);
      throw new BeneficiaryNotFoundError(`Beneficiary account with display ID '${beneficiaryDisplayId}' not found.`);
    }
    const beneficiaryAccount = beneficiaryQueryResult[0];

    // STEP 1: Handle Client-Reported Max PIN Attempts or Perform Server-Side PIN Verification
    if (clientReportedPinFailureType === PIN_FAILURE_TYPE_MAX_ATTEMPTS) {
      // DEFINITIVE FAILURE: Client reported max attempts. LOG THIS.
      const reason = "PIN entry locked: Too many incorrect attempts (reported by client).";
      console.warn(`[TX PaymentID: ${paymentId}] Client reported max PIN attempts for beneficiary '${beneficiaryDisplayId}'.`);
      await db.insert(transactions).values({
          paymentId: paymentId!, amount: amount.toString(), type: "Debit", accountId: beneficiaryAccount.id, merchantId: merchantId,
          status: "Failed", declineReason: reason, pinVerified: false,
          description: reqDescription || `Payment attempt from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
          timestamp: new Date(),
      });
      console.log(`[TX PaymentID: ${paymentId}] Logged FAILED transaction due to client-reported max PIN attempts.`);
      throw new PinEntryLockedError(reason);
    } else {
      // Proceed with server-side PIN verification
      if (!beneficiaryAccount.hashedPin) {
        // Beneficiary has no PIN set. This is a setup issue.
        // For cleaner merchant history, DO NOT LOG to transactions table.
        // Client app should inform merchant "Customer has no PIN".
        const reason = `Beneficiary account '${beneficiaryDisplayId}' does not have a PIN set up.`;
        console.warn(`[TX PaymentID: ${paymentId}] Pre-check: ${reason}`);
        // No db.insert(transactions) here for this case.
        throw new IncorrectPinError(reason); // Or a more specific error like "BeneficiaryPinNotSetError"
      }

      const isPinValid = await verifyPassword(enteredPin, beneficiaryAccount.hashedPin);
      
      if (!isPinValid) {
        // Server verified incorrect PIN. DO NOT LOG this individual attempt.
        // Client will handle retries or report max attempts.
        const reason = `Incorrect PIN provided for beneficiary '${beneficiaryDisplayId}'.`;
        console.warn(`[TX PaymentID: ${paymentId}] Pre-check: ${reason} (Not logging this attempt to DB).`);
        throw new IncorrectPinError(reason);
      }
      // PIN IS VALID if we reach here. `pinVerified` for subsequent logs will be true.
    }

    // PIN IS CONSIDERED VALID
    // Proceed with other pre-checks (status, balance) - these failures WILL be logged.

    if (beneficiaryAccount.status !== 'Active') {
      // DEFINITIVE FAILURE: PIN was okay, but account inactive. LOG THIS.
      const reason = `Beneficiary account '${beneficiaryDisplayId}' is not active (status: ${beneficiaryAccount.status}).`;
      console.warn(`[TX PaymentID: ${paymentId}] Pre-check: ${reason}`);
      await db.insert(transactions).values({
          paymentId: paymentId!, amount: amount.toString(), type: "Debit", accountId: beneficiaryAccount.id, merchantId: merchantId,
          status: "Failed", declineReason: reason, pinVerified: true, // PIN was okay
          description: reqDescription || `Payment attempt from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
          timestamp: new Date(),
      });
      console.log(`[TX PaymentID: ${paymentId}] Logged FAILED transaction due to inactive beneficiary.`);
      throw new BeneficiaryInactiveError(reason);
    }

    const beneficiaryBalance = parseFloat(beneficiaryAccount.balance || "0.00");
    if (beneficiaryBalance < amount) {
      // DEFINITIVE FAILURE: PIN was okay, but insufficient funds. LOG THIS.
      const reason = `Insufficient funds in beneficiary account '${beneficiaryDisplayId}'. Available: ${beneficiaryBalance}, Required: ${amount}.`;
      console.warn(`[TX PaymentID: ${paymentId}] Pre-check: ${reason}`);
      await db.insert(transactions).values({
          paymentId: paymentId!, amount: amount.toString(), type: "Debit", accountId: beneficiaryAccount.id, merchantId: merchantId,
          status: "Failed", declineReason: reason, pinVerified: true, // PIN was okay
          description: reqDescription || `Payment attempt from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
          timestamp: new Date(),
      });
      console.log(`[TX PaymentID: ${paymentId}] Logged FAILED transaction due to insufficient funds.`);
      throw new InsufficientFundsError(reason);
    }

    // STEP 2: All pre-validations passed. Proceed with the main atomic transaction
    const result = await db.transaction(async (tx) => {
      // ... (rest of the successful transaction logic - no changes here) ...
      const merchantInternalAcctDetails = await tx
        .select({ id: accounts.id, balance: accounts.balance, status: accounts.status })
        .from(accounts)
        .where(and(eq(accounts.id, merchantInternalAccountId), eq(accounts.accountType, "MERCHANT_INTERNAL")))
        .limit(1);
      
      if (merchantInternalAcctDetails.length === 0 || merchantInternalAcctDetails[0].status !== 'Active') {
        const statusInfo = merchantInternalAcctDetails.length > 0 ? merchantInternalAcctDetails[0].status : 'Not Found';
        const errMsg = `CRITICAL (within TX): Merchant internal account ${merchantInternalAccountId} issue (Status: ${statusInfo}).`;
        console.error(`[TX PaymentID: ${paymentId}] ${errMsg}`);
        throw new MerchantAccountError(errMsg); 
      }
      const merchantLedgerAccount = merchantInternalAcctDetails[0];
      
      const debitDescription = reqDescription || `Payment to ${merchantBusinessName}`;
      const creditDescription = reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId}`;

      const newBeneficiaryBalance = (beneficiaryBalance - amount); 
      await tx.update(accounts).set({ balance: newBeneficiaryBalance.toFixed(2) }).where(eq(accounts.id, beneficiaryAccount.id));

      const [debitLeg] = await tx.insert(transactions).values({
        paymentId: paymentId!, accountId: beneficiaryAccount.id, merchantId: merchantId,
        type: "Debit", amount: amount.toString(), status: "Completed", pinVerified: true,
        description: debitDescription, timestamp: new Date(),
      }).returning();

      const merchantCurrentBalance = parseFloat(merchantLedgerAccount.balance || "0.00");
      const newMerchantBalance = (merchantCurrentBalance + amount);
      await tx.update(accounts).set({ balance: newMerchantBalance.toFixed(2) }).where(eq(accounts.id, merchantInternalAccountId));
        
      const [creditLeg] = await tx.insert(transactions).values({
        paymentId: paymentId!, accountId: merchantInternalAccountId, merchantId: merchantId, 
        type: "Credit", amount: amount.toString(), status: "Completed", pinVerified: true,
        description: creditDescription, timestamp: new Date(),
      }).returning();
      
      const [updatedCustomerAccountRes, updatedMerchantAccountRes] = await Promise.all([
          tx.select({ id: accounts.id, balance: accounts.balance }).from(accounts).where(eq(accounts.id, beneficiaryAccount.id)).limit(1),
          tx.select({ id: accounts.id, balance: accounts.balance }).from(accounts).where(eq(accounts.id, merchantInternalAccountId)).limit(1)
      ]);

      if (!updatedCustomerAccountRes[0] || !updatedMerchantAccountRes[0] || !debitLeg || !creditLeg) {
          console.error(`[TX PaymentID: ${paymentId}] Critical error: Post-update data fetching or leg insertion failed.`);
          throw new TransactionProcessingError("Failed to confirm all transaction operations.");
      }

      console.log(`[TX PaymentID: ${paymentId}] SUCCESSFUL transaction. Customer (${beneficiaryAccount.id}) new balance: ${updatedCustomerAccountRes[0].balance}, Merchant Account (${merchantInternalAccountId}) new balance: ${updatedMerchantAccountRes[0].balance}`);
      return { 
        paymentId: paymentId!, debitLeg, creditLeg,
        updatedCustomerBalance: updatedCustomerAccountRes[0].balance,
        updatedMerchantBalance: updatedMerchantAccountRes[0].balance
      };
    });

    return NextResponse.json({
        message: 'Transaction processed successfully.', paymentId: result.paymentId,
        debitTransaction: result.debitLeg, creditTransaction: result.creditLeg,
        customerAccountBalance: result.updatedCustomerBalance, merchantAccountBalance: result.updatedMerchantBalance,
      },{ status: 201 });

  } catch (error: any) {
    const logPId = paymentId || "N/A";
    const errorMessage = error.message || 'Unknown error occurred.';
    // Log all errors that reach this top-level catch block for debugging
    console.error(`[API Transactions - PaymentID: ${logPId}] Processing ended with error: ${errorMessage}`, error instanceof Error ? error.stack : error);


    if (error instanceof ApiError) {
      const errorDetails = (error instanceof BadRequestError && error.details) ? error.details : null;
      return NextResponse.json({ error: error.message, details: errorDetails }, { status: error.statusCode });
    }
    
    return NextResponse.json({ error: 'An internal server error occurred while processing the transaction.' }, { status: 500 });
  }
}