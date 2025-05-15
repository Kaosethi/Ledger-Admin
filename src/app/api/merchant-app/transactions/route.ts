// FULLY REVISED: src/app/api/merchant-app/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { merchants, accounts, transactions, transactionTypeEnum, transactionStatusEnum, accountTypeEnum } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid'; // For generating paymentId

// JWT Configuration
const JWT_SECRET_STRING = process.env.JWT_SECRET;
const JWT_ALGORITHM = 'HS256';

interface AuthenticatedMerchantPayload extends jose.JWTPayload {
  merchantId: string;
  email: string;
}

function getJwtSecretKey(): Uint8Array {
  if (!JWT_SECRET_STRING) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return new TextEncoder().encode(JWT_SECRET_STRING);
}

async function getAuthenticatedMerchantInfo(request: NextRequest): Promise<{ merchantId: string; merchantInternalAccountId: string; merchantBusinessName: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[API Transactions] Auth: No/invalid Authorization header');
    return null;
  }
  const token = authHeader.substring(7);
  if (!token) {
    console.warn('[API Transactions] Auth: Token missing after Bearer prefix');
    return null;
  }

  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jose.jwtVerify<AuthenticatedMerchantPayload>(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
    });

    if (payload && payload.merchantId) {
      // Fetch merchant's internalAccountId and businessName
      const merchantDetails = await db
        .select({
          id: merchants.id,
          internalAccountId: merchants.internalAccountId,
          businessName: merchants.businessName,
        })
        .from(merchants)
        .where(eq(merchants.id, payload.merchantId))
        .limit(1);

      if (merchantDetails.length > 0 && merchantDetails[0].internalAccountId) {
        return {
          merchantId: merchantDetails[0].id,
          merchantInternalAccountId: merchantDetails[0].internalAccountId,
          merchantBusinessName: merchantDetails[0].businessName,
        };
      } else {
        console.warn(`[API Transactions] Auth: Merchant ${payload.merchantId} found but no internalAccountId or businessName.`);
        return null;
      }
    }
    console.warn('[API Transactions] Auth: JWT valid, but merchantId missing in payload.');
    return null;
  } catch (error) {
    console.warn('[API Transactions] Auth: JWT Verification Error:', (error as Error).name, (error as Error).message);
    return null;
  }
}

interface CreateTransactionRequestBody {
  amount: number;
  beneficiaryDisplayId: string; // The displayId from the QR code for the customer
  description?: string;
  // currency?: string; // Add if needed
}

export async function POST(request: NextRequest) {
  try {
    getJwtSecretKey(); // Check JWT_SECRET upfront
  } catch (error) {
    console.error('[API Transactions] Setup: JWT Secret configuration error:', (error as Error).message);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const authenticatedMerchant = await getAuthenticatedMerchantInfo(request);
  if (!authenticatedMerchant) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing token, or merchant configuration issue.' }, { status: 401 });
  }
  const { merchantId, merchantInternalAccountId, merchantBusinessName } = authenticatedMerchant;

  let requestBody: CreateTransactionRequestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body: Must be valid JSON.' }, { status: 400 });
  }

  const { amount, beneficiaryDisplayId, description: reqDescription } = requestBody;

  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount: Must be a positive number.' }, { status: 400 });
  }
  if (!beneficiaryDisplayId || typeof beneficiaryDisplayId !== 'string' || beneficiaryDisplayId.trim() === '') {
    return NextResponse.json({ error: 'Beneficiary display ID is required.' }, { status: 400 });
  }

  const paymentId = uuidv4(); // Generate a unique ID for this payment event

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Find the beneficiary (customer) account by displayId
      const beneficiaryAccounts = await tx
        .select({
          id: accounts.id,
          balance: accounts.balance,
          status: accounts.status,
          displayId: accounts.displayId, // For description
          childName: accounts.childName, // For description
        })
        .from(accounts)
        .where(and(
            eq(accounts.displayId, beneficiaryDisplayId),
            eq(accounts.accountType, accountTypeEnum.enumValues[0]) // CHILD_DISPLAY
        ))
        .limit(1);

      if (beneficiaryAccounts.length === 0) {
        console.warn(`[TX PaymentID: ${paymentId}] Beneficiary account (CHILD_DISPLAY) with displayId '${beneficiaryDisplayId}' not found.`);
        // Log only one "Failed" transaction for this attempt
        // Insert a failed transaction with a placeholder accountId (e.g., 'system' or a known fallback account)
        await tx.insert(transactions).values({
            paymentId: paymentId,
            amount: amount.toString(),
            type: transactionTypeEnum.enumValues[0], // "Debit" (attempted)
            accountId: 'system', // Use a valid fallback accountId string
            merchantId: merchantId,
            status: transactionStatusEnum.enumValues[2], // "Failed"
            declineReason: `Beneficiary account '${beneficiaryDisplayId}' not found.`,
            description: reqDescription || `Payment from ${beneficiaryDisplayId} to ${merchantBusinessName}`,
        });
        // Throw error to trigger rollback and be caught by outer catch
        throw new Error(`Beneficiary account '${beneficiaryDisplayId}' not found.`);
      }
      const beneficiaryAccount = beneficiaryAccounts[0];

      // 2. Validate beneficiary account
      if (beneficiaryAccount.status !== 'Active') { // Assuming 'Active' is from accountStatusEnum
        const reason = `Beneficiary account is not active (status: ${beneficiaryAccount.status}).`;
        console.warn(`[TX PaymentID: ${paymentId}] ${reason}`);
        await tx.insert(transactions).values({
            paymentId: paymentId,
            amount: amount.toString(),
            type: transactionTypeEnum.enumValues[0], // "Debit" (attempted)
            accountId: beneficiaryAccount.id,
            merchantId: merchantId,
            status: transactionStatusEnum.enumValues[2], // "Failed"
            declineReason: reason,
            description: reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
        });
        throw new Error(reason);
      }

      const beneficiaryBalance = parseFloat(beneficiaryAccount.balance || "0");
      if (beneficiaryBalance < amount) {
        const reason = 'Insufficient funds in beneficiary account.';
        console.warn(`[TX PaymentID: ${paymentId}] ${reason} Balance: ${beneficiaryBalance}, Amount: ${amount}`);
        await tx.insert(transactions).values({
            paymentId: paymentId,
            amount: amount.toString(),
            type: transactionTypeEnum.enumValues[0], // "Debit" (attempted)
            accountId: beneficiaryAccount.id,
            merchantId: merchantId,
            status: transactionStatusEnum.enumValues[2], // "Failed"
            declineReason: reason,
            description: reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId} to ${merchantBusinessName}`,
        });
        throw new Error(reason);
      }

      // 3. Fetch Merchant's Internal Account (should always exist if merchant is authenticated correctly)
      const merchantInternalAccounts = await tx
        .select({ id: accounts.id, balance: accounts.balance, status: accounts.status })
        .from(accounts)
        .where(eq(accounts.id, merchantInternalAccountId))
        .limit(1);
      
      if(merchantInternalAccounts.length === 0) {
        console.error(`[TX PaymentID: ${paymentId}] CRITICAL: Merchant internal account ${merchantInternalAccountId} not found for merchant ${merchantId}.`);
        throw new Error('Merchant account configuration error.'); // This is a server-side issue
      }
      const merchantAccount = merchantInternalAccounts[0];
      if (merchantAccount.status !== 'Active') {
        console.error(`[TX PaymentID: ${paymentId}] CRITICAL: Merchant internal account ${merchantInternalAccountId} is not active.`);
        throw new Error('Merchant account currently inactive.'); // This is a server-side issue
      }


      // 4. Perform ledger updates (Debit Customer, Credit Merchant)
      const debitDescription = reqDescription || `Payment to ${merchantBusinessName}`;
      const creditDescription = reqDescription || `Payment from ${beneficiaryAccount.childName || beneficiaryDisplayId}`;

      // Debit Customer Account
      const [updatedCustomerAccount] = await tx
        .update(accounts)
        .set({ balance: (beneficiaryBalance - amount).toFixed(2) }) // Ensure precision
        .where(eq(accounts.id, beneficiaryAccount.id))
        .returning({ id: accounts.id, balance: accounts.balance});

      const [debitLeg] = await tx.insert(transactions).values({
        paymentId: paymentId,
        accountId: beneficiaryAccount.id,
        merchantId: merchantId,
        type: transactionTypeEnum.enumValues[0], // "Debit"
        amount: amount.toString(),
        status: transactionStatusEnum.enumValues[0], // "Completed"
        description: debitDescription,
      }).returning();

      // Credit Merchant Internal Account
      const merchantCurrentBalance = parseFloat(merchantAccount.balance || "0");
      const [updatedMerchantAccount] = await tx
        .update(accounts)
        .set({ balance: (merchantCurrentBalance + amount).toFixed(2) }) // Ensure precision
        .where(eq(accounts.id, merchantInternalAccountId))
        .returning({ id: accounts.id, balance: accounts.balance});
        
      const [creditLeg] = await tx.insert(transactions).values({
        paymentId: paymentId,
        accountId: merchantInternalAccountId,
        merchantId: merchantId, // Still useful to know which merchant facilitated
        type: transactionTypeEnum.enumValues[1], // "Credit"
        amount: amount.toString(),
        status: transactionStatusEnum.enumValues[0], // "Completed"
        description: creditDescription,
      }).returning();
      
      if(!updatedCustomerAccount || !updatedMerchantAccount || !debitLeg || !creditLeg){
          // One of the operations failed unexpectedly after checks
          console.error(`[TX PaymentID: ${paymentId}] Critical error during ledger updates or transaction leg insertion.`);
          throw new Error("Failed to complete all transaction operations.");
      }

      console.log(`[TX PaymentID: ${paymentId}] Transaction successful. Customer balance: ${updatedCustomerAccount.balance}, Merchant balance: ${updatedMerchantAccount.balance}`);
      return { debitLeg, creditLeg, paymentId }; // Return data from the transaction
    });

    // If db.transaction was successful
    return NextResponse.json(
      {
        message: 'Transaction processed successfully.',
        paymentId: result.paymentId,
        debitTransaction: result.debitLeg,
        creditTransaction: result.creditLeg,
      },
      { status: 201 }
    );

  } catch (error: any) { // Catch errors from db.transaction or other issues
    console.error(`[API Transactions - PaymentID: ${paymentId}] Error processing transaction:`, error.message);
    // The error message from the thrown error inside db.transaction will be used
    // Default status for client-caused errors (404, 403) should be set when error is thrown
    // If it's an unexpected error (like DB connection), it'll be 500.
    let statusCode = 500;
    if (error.message.includes("not found")) statusCode = 404;
    if (error.message.includes("not active") || error.message.includes("Insufficient funds")) statusCode = 403;
    if (error.message.includes("Merchant account configuration error") || error.message.includes("Merchant account currently inactive") || error.message.includes("Failed to complete all transaction operations")) statusCode = 500;


    return NextResponse.json({ error: error.message || 'Internal Server Error while processing transaction.' }, { status: statusCode });
  }
}