import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/transactions/[id] - Get a specific transaction by ID
export async function GET(request: Request, context: any) {
  try {
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, context.params.id));

    if (!transaction.length) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction[0]);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/[id] - Update a transaction
export async function PATCH(request: Request, context: any) {
  try {
    const body = await request.json();

    // Update transaction
    const updatedTransaction = await db
      .update(transactions)
      .set(body)
      .where(eq(transactions.id, context.params.id))
      .returning();

    if (!updatedTransaction.length) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTransaction[0]);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}
