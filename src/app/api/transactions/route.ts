import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, createTransactionSchema } from "@/lib/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

// GET /api/transactions - Get all transactions with optional filtering
export async function GET(request: Request, context: any) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const merchantId = searchParams.get("merchantId");

    const allTransactions = await db
      .select()
      .from(transactions)
      .where(
        accountId && merchantId
          ? eq(transactions.accountId, accountId) &&
              eq(transactions.merchantId, merchantId)
          : accountId
          ? eq(transactions.accountId, accountId)
          : merchantId
          ? eq(transactions.merchantId, merchantId)
          : undefined
      );

    return NextResponse.json(allTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: Request, context: any) {
  try {
    const body = await request.json();

    // Validate request body against schema
    const validatedData = createTransactionSchema.parse(body);

    // Generate unique ID for transaction
    const transactionId = `TXN${Date.now()}`;

    // Extract id from validatedData if it exists to avoid overwriting
    const { id, ...transactionData } = validatedData;

    // Insert new transaction with our generated id
    const newTransaction = await db
      .insert(transactions)
      .values({
        id: transactionId,
        ...transactionData,
      })
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
