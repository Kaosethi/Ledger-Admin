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
  merchantId: string; // Expecting this to be the UUID of the merchant
  email: string;
  // Add other relevant fields from your JWT payload if needed
}

// --- Custom Error Classes ---
class ApiError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    // Ensuring the prototype chain is correct
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized: Invalid or missing token, or merchant configuration issue.') {
    super(message, 401);
  }
}

class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message, 400);
  }
}

class BeneficiaryNotFoundError extends ApiError {
  constructor(message: string = "Beneficiary account not found.") {
    super(message, 404);
  }
}

class BeneficiaryInactiveError extends ApiError {
  constructor(message: string = "Beneficiary account is not active.") {
    super(message, 403); // 403 Forbidden as the action cannot be performed on this resource
  }
}

class InsufficientFundsError extends ApiError {
  constructor(message: string = "Insufficient funds in beneficiary account.") {
    super(message, 403); // 403 Forbidden, or could be 400 Bad Request / 409 Conflict
  }
}

class MerchantAccountError extends ApiError { // For server-side/configuration issues with merchant account
  constructor(message: string = "Merchant account configuration error.") {
    super(message, 500);
  }
}

class TransactionProcessingError extends ApiError { // For general failures during transaction commit phase
    constructor(message: string = "Failed to complete all transaction operations.") {
        super(message, 500);
    }
}


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
    const secretKey = getJwtSecretKey(); // Ensure secret is checked/loaded
    const { payload } = await jose.jwtVerify<AuthenticatedMerchantPayload>(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
    });

    if (payload && payload.merchantId) {
      const merchantDetails = await db
        .select({
          id: merchants.id,
          internalAccountId: merchants.internalAccountId,
          businessName: merchants.businessName,
          status: merchants.status, // Also fetch status to ensure merchant is active
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
    if (error instanceof ApiError) throw error; // Re-throw known API errors
    console.warn('[API Transactions] Auth: JWT Verification Error:', error.name, error.message);
    // Map common jose errors to UnauthorizedError
    if (['JWSSignatureVerificationFailed', 'JWTExpired', 'JWTClaimValidationFailed', 'JWTInvalid'].includes(error.code || error.name)) {
        throw new UnauthorizedError('Token verification failed or token expired.');
    }
    throw new UnauthorizedError('Failed to authenticate token.'); // Generic fallback
  }
}

// --- Request Body Interface ---
interface CreateTransactionRequestBody {
  amount: number;
  beneficiaryDisplayId: string;
  description?: string;
}

// --- API Route Handler: POST /api/merchant-app/transactions ---
export async function POST(request: NextRequest) {
  let paymentId: string | null = null; // Initialize paymentId, will be set later

  try {
    // Ensure JWT secret is configured (throws if not)
    getJwtSecretKey();

    const authenticatedMerchant = await getAuthenticatedMerchantInfo(request);
    const { merchantId, merchantInternalAccountId, merchantBusinessName } = authenticatedMerchant;

    let requestBody: CreateTransactionRequestBody;
    try {
      requestBody = await request.json();
    } catch (e) {
      throw new BadRequestError('Invalid request body: Must be valid JSON.');
    }

    const { amount, beneficiaryDisplayId, description: reqDescription } = requestBody;

    // Validate input
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestError('Invalid amount: Must be a positive number.');
    }
    if (!beneficiaryDisplayId || typeof beneficiaryDisplayId !== 'string' || beneficiaryDisplayId.trim() === '') {
      throw new BadRequestError('Beneficiary display ID is required and must be a non-empty string.');
    }

    paymentId = uuidv4(); // Generate a unique ID for this payment event

    const result = await db.transaction(async (tx) => {
      // 1. Find the beneficiary (customer) account
      const beneficiaryAccounts = await tx
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
          eq(accounts.accountType, "CHILD_DISPLAY") // Use string literal for enum
        ))
        .limit(1);

      if (beneficiaryAccounts.length === 0) {
        console.warn(`[TX PaymentID: ${paymentId}] Beneficiary account (CHILD_DISPLAY) with displayId '${beneficiaryDisplayId}' not found.`);
        // THIS IS THE KEY PART FOR THE "NOT FOUND" SCENARIO - IT THROWS AN ERROR
        // AND DOES NOT ATTEMPT TO INSERT A TRANSACTION WITH accountId: 'system'
        throw new BeneficiaryNotFoundError(`Beneficiary account with display ID '${beneficiaryDisplayId}' not found.`);
      }
      const beneficiaryAccount = beneficiaryAccounts[0];

      // 2. Validate beneficiary account
      if (beneficiaryAccount.status !== 'Active') { // Ensure 'Active' matches your account_status enum string
        const reason = `Beneficiary account '${beneficiaryDisplayId}' is not active (status: ${beneficiaryAccount.status}).`;
        console.warn(`[TX PaymentID: ${paymentId}] ${reason}`);
        
        await tx.insert(transactions).values({
            paymentId: paymentId!, 
            amount: amount.toString(),
            type: "Debit", 
            accountId: beneficiaryAccount.id, 
            merchantId: merchantId,
            status: "Failed",
            declineReason: reason,
            description: reqDescription || `Payment attempt from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
            timestamp: new Date(), 
        });
        throw new BeneficiaryInactiveError(reason);
      }

      const beneficiaryBalance = parseFloat(beneficiaryAccount.balance || "0.00");
      if (beneficiaryBalance < amount) {
        const reason = `Insufficient funds in beneficiary account '${beneficiaryDisplayId}'. Available: ${beneficiaryBalance}, Required: ${amount}.`;
        console.warn(`[TX PaymentID: ${paymentId}] ${reason}`);

        await tx.insert(transactions).values({
            paymentId: paymentId!,
            amount: amount.toString(),
            type: "Debit", 
            accountId: beneficiaryAccount.id,
            merchantId: merchantId,
            status: "Failed",
            declineReason: reason,
            description: reqDescription || `Payment attempt from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
            timestamp: new Date(),
        });
        throw new InsufficientFundsError(reason);
      }

      // 3. Fetch Merchant's Internal Account (should exist and be active if authenticated correctly)
      const merchantInternalAcctDetails = await tx
        .select({ id: accounts.id, balance: accounts.balance, status: accounts.status })
        .from(accounts)
        .where(and(
            eq(accounts.id, merchantInternalAccountId),
            eq(accounts.accountType, "MERCHANT_INTERNAL")
        ))
        .limit(1);
      
      if (merchantInternalAcctDetails.length === 0) {
        const errMsg = `CRITICAL: Merchant internal account ${merchantInternalAccountId} not found for merchant ${merchantId}.`;
        console.error(`[TX PaymentID: ${paymentId}] ${errMsg}`);
        throw new MerchantAccountError(errMsg); 
      }
      const merchantLedgerAccount = merchantInternalAcctDetails[0];

      if (merchantLedgerAccount.status !== 'Active') {
        const errMsg = `CRITICAL: Merchant internal account ${merchantInternalAccountId} is not active (status: ${merchantLedgerAccount.status}).`;
        console.error(`[TX PaymentID: ${paymentId}] ${errMsg}`);
        throw new MerchantAccountError(errMsg); 
      }

      // 4. Perform ledger updates
      const debitDescription = reqDescription || `Payment to ${merchantBusinessName}`;
      const creditDescription = reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId}`;

      const newBeneficiaryBalance = (beneficiaryBalance - amount);
      const [updatedCustomerAccount] = await tx
        .update(accounts)
        .set({ balance: newBeneficiaryBalance.toFixed(2) }) 
        .where(eq(accounts.id, beneficiaryAccount.id))
        .returning({ id: accounts.id, balance: accounts.balance });

      const [debitLeg] = await tx.insert(transactions).values({
        paymentId: paymentId!,
        accountId: beneficiaryAccount.id,
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
          console.error(`[TX PaymentID: ${paymentId}] Critical error during ledger updates or transaction leg insertion. One or more operations failed to return expected results.`);
          throw new TransactionProcessingError("Failed to complete all transaction operations due to unexpected database response.");
      }

      console.log(`[TX PaymentID: ${paymentId}] Transaction successful. Customer (${beneficiaryAccount.id}) new balance: ${updatedCustomerAccount.balance}, Merchant Account (${merchantInternalAccountId}) new balance: ${updatedMerchantAccount.balance}`);
      return { 
        paymentId: paymentId!, 
        debitLeg, 
        creditLeg,
        updatedCustomerBalance: updatedCustomerAccount.balance,
        updatedMerchantBalance: updatedMerchantAccount.balance
      };
    });

    // If db.transaction was successful
    return NextResponse.json(
      {
        message: 'Transaction processed successfully.',
        paymentId: result.paymentId,
        debitTransaction: result.debitLeg,
        creditTransaction: result.creditLeg,
        customerAccountBalance: result.updatedCustomerBalance,
        merchantAccountBalance: result.updatedMerchantBalance,
      },
      { status: 201 } // 201 Created
    );

  } catch (error: any) {
    // Log the error with paymentId if available for better traceability
    const logPId = paymentId || "N/A";
    console.error(`[API Transactions - PaymentID: ${logPId}] Error processing transaction: ${error.message}`, error.stack);

    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, details: error.cause }, { status: error.statusCode });
    }
    
    // Default to 500 for unexpected errors
    return NextResponse.json({ error: 'Internal Server Error while processing transaction.' }, { status: 500 });
  }
}