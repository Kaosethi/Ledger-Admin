import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTransactionSchema, transactions } from "@/lib/db/schema";
import { z } from "zod";

// GET /api/transactions - Get all transactions
export async function GET() {
  try {
    // Get all transactions with join to users
    const allTransactions = await db.query.transactions.findMany({
      with: {
        user: true,
      },
    });

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
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body against schema
    const validatedData = createTransactionSchema.parse(body);

    // Insert new transaction
    const newTransaction = await db
      .insert(transactions)
      .values(validatedData)
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
