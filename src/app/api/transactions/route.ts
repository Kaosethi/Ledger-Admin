import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, createTransactionSchema } from "@/lib/db/schema";
import { z } from "zod";
import mockDataInstance from "@/lib/mockData";
import { withAuth } from '@/lib/audit';
import { JWTPayload } from "@/lib/auth/jwt";

// GET /api/transactions - Get all transactions (protected)
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      // Try to fetch from the database
      try {
        const allTransactions = await db.select().from(transactions);
        if (allTransactions && allTransactions.length > 0) {
          return NextResponse.json(allTransactions);
        }
      } catch (dbError) {
        console.warn("Database error, falling back to mock data:", dbError);
      }

      // If database fetch fails or returns empty, use mock data
      return NextResponse.json(mockDataInstance.transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Final fallback to mock data
      return NextResponse.json(mockDataInstance.transactions);
    }
  }
);

// POST /api/transactions - Create a new transaction (protected)
export const POST = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const body = await request.json();

      // Validate request body against schema
      const validatedData = createTransactionSchema.parse(body);

      // Generate unique transaction reference if not provided
      const reference =
        validatedData.reference ||
        `TX-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`;

      try {
        // Insert new transaction - let the database generate the ID
        const newTransaction = await db
          .insert(transactions)
          .values({
            ...validatedData,
            // Set the reference field
            reference,
            // Generate a random UUID for paymentId
            paymentId: crypto.randomUUID(),
            // Convert number to string for the database's numeric field
            amount: validatedData.amount.toString(),
          })
          .returning();

        return NextResponse.json(newTransaction[0], { status: 201 });
      } catch (dbError) {
        console.warn(
          "Database error on POST, returning mock response:",
          dbError
        );

        // Create mock response with UUID
        const mockResponse = {
          id: crypto.randomUUID(),
          ...validatedData,
          reference,
          timestamp: new Date().toISOString(),
        };

        return NextResponse.json(mockResponse, { status: 201 });
      }
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
);
