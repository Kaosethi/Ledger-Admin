// src/app/api/merchant-app/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Assuming this is your Drizzle instance path
import { merchants, accounts, transactions } from '@/lib/db/schema'; // Assuming this is your schema path
import { eq, and } from 'drizzle-orm';
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';

// --- JWT Configuration ---
const JWT_SECRET_STRING = process.env.JWT_SECRET;
const JWT_ALGORITHM = 'HS256';

let _jwtSecretKey: Uint8Array | null = null; // Cached secret key

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

// --- Custom Error Classes (Remain the same) ---
class ApiError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
class UnauthorizedError extends ApiError { /* ... */ constructor(message: string = 'Unauthorized: Invalid or missing token, or merchant configuration issue.') { super(message, 401); } }
class BadRequestError extends ApiError { /* ... */ constructor(message: string) { super(message, 400); } }
class BeneficiaryNotFoundError extends ApiError { /* ... */ constructor(message: string = "Beneficiary account not found.") { super(message, 404); } }
class BeneficiaryInactiveError extends ApiError { /* ... */ constructor(message: string = "Beneficiary account is not active.") { super(message, 403); } }
class InsufficientFundsError extends ApiError { /* ... */ constructor(message: string = "Insufficient funds in beneficiary account.") { super(message, 403); } }
class MerchantAccountError extends ApiError { /* ... */ constructor(message: string = "Merchant account configuration error.") { super(message, 500); } }
class TransactionProcessingError extends ApiError { /* ... */ constructor(message: string = "Failed to complete all transaction operations.") { super(message, 500); } }


// --- Helper to get Authenticated Merchant Info (Remains the same) ---
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

interface CreateTransactionRequestBody {
  amount: number;
  beneficiaryDisplayId: string;
  description?: string;
}

// --- API Route Handler: POST /api/merchant-app/transactions ---
// --- MODIFIED TO PERSISTENTLY LOG FAILED TRANSACTIONS FOR INACTIVE/INSUFFICIENT FUNDS ---
export async function POST(request: NextRequest) {
  let paymentId: string | null = null; 

  try {
    getJwtSecretKey(); // Check JWT_SECRET upfront

    const authenticatedMerchant = await getAuthenticatedMerchantInfo(request);
    const { merchantId, merchantInternalAccountId, merchantBusinessName } = authenticatedMerchant;

    let requestBody: CreateTransactionRequestBody;
    try {
      requestBody = await request.json();
    } catch (e) {
      throw new BadRequestError('Invalid request body: Must be valid JSON.');
    }

    const { amount, beneficiaryDisplayId, description: reqDescription } = requestBody;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestError('Invalid amount: Must be a positive number.');
    }
    if (!beneficiaryDisplayId || typeof beneficiaryDisplayId !== 'string' || beneficiaryDisplayId.trim() === '') {
      throw new BadRequestError('Beneficiary display ID is required and must be a non-empty string.');
    }

    paymentId = uuidv4(); // Generate paymentId early for all scenarios (success or logged failure)

    // --- STEP 1: Pre-validation of Beneficiary (outside main db.transaction) ---
    const beneficiaryQueryResult = await db
      .select({
        id: accounts.id,
        balance: accounts.balance,
        status: accounts.status,
        displayId: accounts.displayId,
        childName: accounts.childName,
      })
      .from(accounts)
      .where(and(
        eq(accounts.displayId, beneficiaryDisplayId),
        eq(accounts.accountType, "CHILD_DISPLAY")
      ))
      .limit(1);

    if (beneficiaryQueryResult.length === 0) {
      console.warn(`[TX PaymentID: ${paymentId}] Pre-check: Beneficiary account (CHILD_DISPLAY) with displayId '${beneficiaryDisplayId}' not found.`);
      // No "Failed" log for "Not Found" as transactions.accountId requires a valid account.
      throw new BeneficiaryNotFoundError(`Beneficiary account with display ID '${beneficiaryDisplayId}' not found.`);
    }
    const beneficiaryAccount = beneficiaryQueryResult[0];

    // Check for Inactive Beneficiary
    if (beneficiaryAccount.status !== 'Active') {
      const reason = `Beneficiary account '${beneficiaryDisplayId}' is not active (status: ${beneficiaryAccount.status}).`;
      console.warn(`[TX PaymentID: ${paymentId}] Pre-check: ${reason}`);

      // Log the "Failed" transaction (this INSERT is its own committed operation)
      await db.insert(transactions).values({
          paymentId: paymentId!,
          amount: amount.toString(),
          type: "Debit", // Attempted debit
          accountId: beneficiaryAccount.id, // Link to the found (but inactive) beneficiary
          merchantId: merchantId,
          status: "Failed",
          declineReason: reason,
          description: reqDescription || `Payment attempt from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
          timestamp: new Date(),
      });
      console.log(`[TX PaymentID: ${paymentId}] Logged FAILED transaction due to inactive beneficiary.`);
      throw new BeneficiaryInactiveError(reason); // Now throw to send 403 to client
    }

    // Check for Insufficient Funds
    const beneficiaryBalance = parseFloat(beneficiaryAccount.balance || "0.00");
    if (beneficiaryBalance < amount) {
      const reason = `Insufficient funds in beneficiary account '${beneficiaryDisplayId}'. Available: ${beneficiaryBalance}, Required: ${amount}.`;
      console.warn(`[TX PaymentID: ${paymentId}] Pre-check: ${reason}`);

      // Log the "Failed" transaction
      await db.insert(transactions).values({
          paymentId: paymentId!,
          amount: amount.toString(),
          type: "Debit", // Attempted debit
          accountId: beneficiaryAccount.id,
          merchantId: merchantId,
          status: "Failed",
          declineReason: reason,
          description: reqDescription || `Payment attempt from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
          timestamp: new Date(),
      });
      console.log(`[TX PaymentID: ${paymentId}] Logged FAILED transaction due to insufficient funds.`);
      throw new InsufficientFundsError(reason); // Now throw to send 403 to client
    }

    // --- STEP 2: If all pre-validations pass, proceed with the main atomic transaction ---
    const result = await db.transaction(async (tx) => {
      // Fetch Merchant's Internal Account within this transaction to ensure consistency
      const merchantInternalAcctDetails = await tx
        .select({ id: accounts.id, balance: accounts.balance, status: accounts.status })
        .from(accounts)
        .where(and(
            eq(accounts.id, merchantInternalAccountId),
            eq(accounts.accountType, "MERCHANT_INTERNAL")
        ))
        .limit(1);
      
      if (merchantInternalAcctDetails.length === 0) {
        const errMsg = `CRITICAL (within TX): Merchant internal account ${merchantInternalAccountId} not found for merchant ${merchantId}.`;
        console.error(`[TX PaymentID: ${paymentId}] ${errMsg}`);
        throw new MerchantAccountError(errMsg); 
      }
      const merchantLedgerAccount = merchantInternalAcctDetails[0];

      if (merchantLedgerAccount.status !== 'Active') {
        const errMsg = `CRITICAL (within TX): Merchant internal account ${merchantInternalAccountId} is not active (status: ${merchantLedgerAccount.status}).`;
        console.error(`[TX PaymentID: ${paymentId}] ${errMsg}`);
        // This error will cause the db.transaction to roll back, no "Failed" log inserted here for this.
        throw new MerchantAccountError(errMsg); 
      }
      
      // Perform ledger updates
      const debitDescription = reqDescription || `Payment to ${merchantBusinessName}`;
      const creditDescription = reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId}`;

      // Use beneficiaryBalance from pre-check. For higher concurrency safety, re-fetch with FOR UPDATE here.
      const newBeneficiaryBalance = (beneficiaryBalance - amount); 
      const [updatedCustomerAccount] = await tx
        .update(accounts)
        .set({ balance: newBeneficiaryBalance.toFixed(2) }) 
        .where(eq(accounts.id, beneficiaryAccount.id)) // Use beneficiaryAccount.id from pre-check
        .returning({ id: accounts.id, balance: accounts.balance });

      const [debitLeg] = await tx.insert(transactions).values({
        paymentId: paymentId!,
        accountId: beneficiaryAccount.id, // Use beneficiaryAccount.id from pre-check
        merchantId: merchantId,
        type: "Debit",
        amount: amount.toString(),
        status: "Completed",
        description: debitDescription,
        timestamp: new Date(),
      }).returning();

      const merchantCurrentBalance = parseFloat(merchantLedgerAccount.balance || "0.00");
      const newMerchantBalance = (merchantCurrentBalance + amount);
      const [updatedMerchantAccount] = await tx
        .update(accounts)
        .set({ balance: newMerchantBalance.toFixed(2) }) 
        .where(eq(accounts.id, merchantInternalAccountId))
        .returning({ id: accounts.id, balance: accounts.balance });
        
      const [creditLeg] = await tx.insert(transactions).values({
        paymentId: paymentId!,
        accountId: merchantInternalAccountId,
        merchantId: merchantId, 
        type: "Credit",
        amount: amount.toString(),
        status: "Completed",
        description: creditDescription,
        timestamp: new Date(),
      }).returning();
      
      if (!updatedCustomerAccount || !updatedMerchantAccount || !debitLeg || !creditLeg) {
          console.error(`[TX PaymentID: ${paymentId}] Critical error during ledger updates or transaction leg insertion within DB transaction.`);
          throw new TransactionProcessingError("Failed to complete all transaction operations due to unexpected database response.");
      }

      console.log(`[TX PaymentID: ${paymentId}] SUCCESSFUL transaction. Customer (${beneficiaryAccount.id}) new balance: ${updatedCustomerAccount.balance}, Merchant Account (${merchantInternalAccountId}) new balance: ${updatedMerchantAccount.balance}`);
      return { 
        paymentId: paymentId!, 
        debitLeg, 
        creditLeg,
        updatedCustomerBalance: updatedCustomerAccount.balance,
        updatedMerchantBalance: updatedMerchantAccount.balance
      };
    }); // End of db.transaction

    return NextResponse.json(
      {
        message: 'Transaction processed successfully.',
        paymentId: result.paymentId,
        debitTransaction: result.debitLeg,
        creditTransaction: result.creditLeg,
        customerAccountBalance: result.updatedCustomerBalance,
        merchantAccountBalance: result.updatedMerchantBalance,
      },
      { status: 201 }
    );

  } catch (error: any) {
    const logPId = paymentId || "N/A"; // paymentId should be set if we got past input validation
    // Avoid logging the full error.stack to production logs if it's too verbose or sensitive
    console.error(`[API Transactions - PaymentID: ${logPId}] Processing ended with error: ${error.message}`);
    if (error.stack && process.env.NODE_ENV === 'development') { // Log stack in dev
        console.error(error.stack);
    }


    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, details: error.cause || null }, { status: error.statusCode });
    }
    
    return NextResponse.json({ error: 'An internal server error occurred while processing the transaction.' }, { status: 500 });
  }
}