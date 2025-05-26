import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, createTransactionSchema, selectTransactionSchema } from "@/lib/db/schema";
import { z } from "zod";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import { desc, eq, and, or, ilike, sql } from "drizzle-orm"; // Added sql for count

// GET /api/transactions - Get all transactions (protected)
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const accountId = searchParams.get("accountId");
      const merchantId = searchParams.get("merchantId");
      const paymentId = searchParams.get("paymentId");
      const status = searchParams.get("status");
      const type = searchParams.get("type");
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      const offset = parseInt(searchParams.get("offset") || "0", 10);

      const conditions = [];

      if (accountId) {
        conditions.push(eq(transactions.accountId, accountId));
      }
      if (merchantId) {
        conditions.push(eq(transactions.merchantId, merchantId));
      }
      if (paymentId) {
        conditions.push(eq(transactions.paymentId, paymentId));
      }
      if (status && ["Completed", "Pending", "Failed", "Declined"].includes(status)) {
        conditions.push(eq(transactions.status, status as typeof transactions.status.enumValues[number]));
      }
      if (type && ["Debit", "Credit", "Adjustment"].includes(type)) {
        conditions.push(eq(transactions.type, type as typeof transactions.type.enumValues[number]));
      }

      const query = db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);

      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
      
      const data = await query;

      const totalCountQuery = db
        .select({ value: sql<number>`count(${transactions.id})`.mapWith(Number) })
        .from(transactions);
      
      if (conditions.length > 0) {
        totalCountQuery.where(and(...conditions));
      }
      const totalCountResult = await totalCountQuery;
      const totalCount = totalCountResult[0]?.value || 0;

      return NextResponse.json({ data, totalCount });

    } catch (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
  }
);

// POST /api/transactions - Create a new transaction (protected)
export const POST = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    let transactionInsertData: any; // Define here to be accessible in catch for merchantId check
    try {
      const body = await request.json();
      const validatedData = createTransactionSchema.parse(body);

      const reference =
        validatedData.reference ||
        `TX-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`;

      transactionInsertData = { // Assign to the higher-scoped variable
        displayId: validatedData.displayId,
        paymentId: validatedData.paymentId,
        amount: validatedData.amount.toString(),
        type: validatedData.type,
        accountId: validatedData.accountId,
        merchantId: validatedData.merchantId,
        status: validatedData.status,
        declineReason: validatedData.declineReason,
        pinVerified: validatedData.pinVerified,
        description: validatedData.description,
        reference: reference,
        metadata: validatedData.metadata,
      };

      const newTransactionResult = await db
        .insert(transactions)
        .values(transactionInsertData)
        .returning();

      if (!newTransactionResult || newTransactionResult.length === 0) {
        console.error("Failed to insert transaction, DB returned no result.");
        return NextResponse.json({ error: "Failed to create transaction record in database" }, { status: 500 });
      }

      return NextResponse.json(newTransactionResult[0], { status: 201 });

    } catch (error: any) {
      console.error("Error creating transaction:", error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.format() },
          { status: 400 }
        );
      }
      
      if (error.code === '23505' && error.detail && error.detail.toLowerCase().includes('display_id')) {
        return NextResponse.json({ error: "Display ID already exists for a transaction. Please use a unique Display ID." }, { status: 409 });
      }
      
      if (error.code === '23503' && error.constraint_name && error.constraint_name.toLowerCase().includes('transactions_payment_id_fkey')) {
         return NextResponse.json({ error: "Invalid Payment ID: The specified payment does not exist." }, { status: 400 });
      }
      if (error.code === '23503' && error.constraint_name && error.constraint_name.toLowerCase().includes('transactions_account_id_fkey')) {
         return NextResponse.json({ error: "Invalid Account ID: The specified account does not exist." }, { status: 400 });
      }
      // Check if a merchantId was provided in the data that was attempted to be inserted
      if (transactionInsertData && transactionInsertData.merchantId && error.code === '23503' && error.constraint_name && error.constraint_name.toLowerCase().includes('transactions_merchant_id_fkey')) {
         return NextResponse.json({ error: "Invalid Merchant ID: The specified merchant does not exist." }, { status: 400 });
      }

      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }
  }
);