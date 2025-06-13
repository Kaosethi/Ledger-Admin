// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
    transactions, 
    accounts,
    createTransactionApiPayloadSchema,
    // selectTransactionSchema, // Keep if you use it for specific select projections
    transactionStatusEnum, 
    transactionTypeEnum,   
} from "@/lib/db/schema";
import { z } from "zod";
import { withAuth } from "@/lib/auth/middleware"; 
import { JWTPayload } from "@/lib/auth/jwt"; 
import { desc, eq, and, or, ilike, sql } from "drizzle-orm";
import { generateDisplayId } from "@/lib/utils/idGenerator";

// GET /api/transactions - Get all transactions (protected)
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const accountId = searchParams.get("accountId");
      const merchantIdParam = searchParams.get("merchantId");
      const paymentId = searchParams.get("paymentId");
      const statusParam = searchParams.get("status");
      const typeParam = searchParams.get("type");
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      const offset = parseInt(searchParams.get("offset") || "0", 10);

      const conditions = [];
      if (accountId) conditions.push(eq(transactions.accountId, accountId));
      if (merchantIdParam) conditions.push(eq(transactions.merchantId, merchantIdParam));
      if (paymentId) conditions.push(eq(transactions.paymentId, paymentId));
      if (statusParam && transactionStatusEnum.enumValues.includes(statusParam as any)) {
        conditions.push(eq(transactions.status, statusParam as typeof transactionStatusEnum.enumValues[number]));
      }
      if (typeParam && transactionTypeEnum.enumValues.includes(typeParam as any)) {
        conditions.push(eq(transactions.type, typeParam as typeof transactionTypeEnum.enumValues[number]));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select()
        .from(transactions)
        .where(whereCondition) 
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCountResult = await db
        .select({ value: sql<number>`count(${transactions.id})`.mapWith(Number) })
        .from(transactions)
        .where(whereCondition); 
        
      const totalCount = totalCountResult[0]?.value || 0;

      return NextResponse.json({ data, totalCount });

    } catch (error: any) {
      console.error("[API GET /transactions] Error fetching transactions:", { message: error.message, stack: error.stack });
      return NextResponse.json({ error: error.message || "Failed to fetch transactions" }, { status: 500 });
    }
  }
);

// POST /api/transactions - Create a new transaction (protected)
export const POST = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    let rawClientPayloadForLogging: any; 

    try {
      const body = await request.json();
      rawClientPayloadForLogging = body; 
      console.log("[API POST /transactions] Raw request body:", JSON.stringify(body));

      const validatedData = createTransactionApiPayloadSchema.parse(body);
      console.log("[API POST /transactions] Validated client payload:", validatedData);
      
      const result = await db.transaction(async (tx) => {
        const newTransactionDisplayId = await generateDisplayId(tx, 'TRX'); 
        console.log(`[API POST /transactions] Generated transaction displayId: ${newTransactionDisplayId}`);

        const reference = validatedData.reference || `TX-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`;

        // Fetch account details
        const [account] = await tx.select().from(accounts).where(eq(accounts.id, validatedData.accountId));
        if (!account) {
          // Account does not exist (should be caught by FK, but handle gracefully)
          const failedTx = await tx.insert(transactions).values({
            displayId: newTransactionDisplayId,
            paymentId: validatedData.paymentId,
            amount: validatedData.amount.toString(),
            type: validatedData.type,
            accountId: validatedData.accountId,
            merchantId: validatedData.merchantId || null,
            status: 'Failed',
            project: validatedData.project,
            description: validatedData.description || null,
            reference,
            timestamp: new Date(),
            pinVerified: false,
            metadata: null,
            declineReason: 'Account does not exist',
          }).returning();
          return failedTx[0];
        }

        // Check account status
        if (['Inactive', 'Suspended', 'Pending'].includes(account.status)) {
          const failedTx = await tx.insert(transactions).values({
            displayId: newTransactionDisplayId,
            paymentId: validatedData.paymentId,
            amount: validatedData.amount.toString(),
            type: validatedData.type,
            accountId: validatedData.accountId,
            merchantId: validatedData.merchantId || null,
            status: 'Failed',
            project: validatedData.project,
            description: validatedData.description || null,
            reference,
            timestamp: new Date(),
            pinVerified: false,
            metadata: null,
            declineReason: `Account status: ${account.status}`,
          }).returning();
          return failedTx[0];
        }

        // Check for PIN attempts exceeded (if you have a field or logic for this, replace this check accordingly)
        // Example: if (account.pinAttempts && account.pinAttempts >= MAX_PIN_ATTEMPTS)
        // We'll assume a placeholder check for now:
        // const MAX_PIN_ATTEMPTS = 3;
        // if (account.pinAttempts >= MAX_PIN_ATTEMPTS) { ... }

        // Check for insufficient balance (for Debit transactions)
        if (validatedData.type === 'Debit') {
          const balance = typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance;
          if (balance < validatedData.amount) {
            const failedTx = await tx.insert(transactions).values({
              displayId: newTransactionDisplayId,
              paymentId: validatedData.paymentId,
              amount: validatedData.amount.toString(),
              type: validatedData.type,
              accountId: validatedData.accountId,
              merchantId: validatedData.merchantId || null,
              status: 'Failed',
              project: validatedData.project,
              description: validatedData.description || null,
              reference,
              timestamp: new Date(),
              pinVerified: false,
              metadata: null,
              declineReason: 'Insufficient Balance',
            }).returning();
            return failedTx[0];
          }
        }

        // If all checks pass, insert as 'Pending'
        const transactionDataForDb: typeof transactions.$inferInsert = {
          displayId: newTransactionDisplayId,
          paymentId: validatedData.paymentId,
          amount: validatedData.amount.toString(),
          type: validatedData.type,
          accountId: validatedData.accountId,
          merchantId: validatedData.merchantId || null,
          project: validatedData.project,
          status: transactionStatusEnum.enumValues[1], // 'Pending'
          description: validatedData.description || null,
          reference,
          timestamp: new Date(),
          pinVerified: false,
          metadata: null,
          declineReason: null,
        };
        console.log("[API POST /transactions] Data for DB insertion:", transactionDataForDb);
        const [newTransactionResult] = await tx
          .insert(transactions)
          .values(transactionDataForDb)
          .returning();
        if (!newTransactionResult) {
          console.error("[API POST /transactions] Transaction insertion failed, DB returned no result.");
          throw new Error("Failed to insert transaction, DB returned no result.");
        }
        console.log("[API POST /transactions] Transaction created successfully:", newTransactionResult.id);
        return newTransactionResult;
      });

      return NextResponse.json(result, { status: result.status === 'Failed' ? 400 : 201 });

    } catch (error: any) {
      console.error("[API POST /transactions] Error creating transaction:", {
          message: error.message,
          stack: error.stack,
          code: error.code, 
          detail: error.detail, 
          constraint: error.constraint, 
          clientPayload: rawClientPayloadForLogging 
      });

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      
      if (error.code === '23505' && error.detail && error.detail.toLowerCase().includes(transactions.displayId.name)) {
        return NextResponse.json({ error: "Generated Transaction Display ID conflict. Please try again." }, { status: 409 });
      }
      if (error.code === '23502') { 
        return NextResponse.json({ error: `A required field was missing or null for the transaction: ${error.column || 'unknown column'}.`, detail: error.detail }, { status: 500 });
      }
      if (error.code === '23503') { 
        let msg = "Invalid reference ID provided for transaction (e.g., paymentId, accountId, or merchantId does not exist).";
        if (error.constraint && error.constraint.includes(transactions.paymentId.name)) msg = "Invalid Payment ID: The specified payment does not exist.";
        else if (error.constraint && error.constraint.includes(transactions.accountId.name)) msg = "Invalid Account ID: The specified account does not exist.";
        else if (rawClientPayloadForLogging?.merchantId && error.constraint && error.constraint.includes(transactions.merchantId.name)) msg = "Invalid Merchant ID: The specified merchant does not exist.";
        return NextResponse.json({ error: msg , detail: error.detail}, { status: 400 });
      }

      return NextResponse.json(
        { error: error.message || "Failed to create transaction due to an internal server error." },
        { status: 500 }
      );
    }
  }
);