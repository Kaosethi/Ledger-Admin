import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  transactions,
  createTransactionSchema,
  transactionStatusEnum,
} from "@/lib/db/schema";
import { z } from "zod";
import mockDataInstance from "@/lib/mockData";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import { and, eq, ilike, or } from "drizzle-orm";
import { Transaction } from "@/lib/mockData";

// GET /api/transactions - Get all transactions (protected)
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      // Get search and filter parameters from URL
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status");
      const search = searchParams.get("search");
      console.log("Transaction search param:", search);
      console.log("Transaction status param:", status);

      // Try to fetch from the database with filters
      try {
        // Build query conditions
        const conditions = [];

        // Add status filter if provided (validate it's a valid status)
        if (
          status &&
          ["Completed", "Pending", "Failed", "Declined"].includes(status)
        ) {
          // Cast the string status to the enum type for type safety
          const validStatus = status as
            | "Completed"
            | "Pending"
            | "Failed"
            | "Declined";
          conditions.push(eq(transactions.status, validStatus));
        }

        // Add search filter if provided (search in reference or description)
        if (search) {
          console.log("Applying transaction search condition:", search);
          conditions.push(
            or(
              ilike(transactions.reference, `%${search}%`),
              ilike(transactions.description, `%${search}%`)
            )
          );
        }

        // Execute query with conditions if they exist
        let filteredTransactions;
        if (conditions.length > 0) {
          console.log("Applying transaction filter conditions");
          filteredTransactions = await db
            .select()
            .from(transactions)
            .where(and(...conditions));
        } else {
          console.log("No filter conditions, fetching all transactions");
          filteredTransactions = await db.select().from(transactions);
        }

        console.log(
          `Found ${filteredTransactions.length} transactions after filtering`
        );
        if (filteredTransactions && filteredTransactions.length > 0) {
          return NextResponse.json(filteredTransactions);
        }
      } catch (dbError) {
        console.warn("Database error, falling back to mock data:", dbError);
      }

      // If database fetch fails or returns empty, use mock data
      // Apply filters to mock data if needed
      let mockResults: Transaction[] = [...mockDataInstance.transactions];

      if (status) {
        mockResults = mockResults.filter(
          (transaction) => transaction.status === status
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        mockResults = mockResults.filter((transaction) => {
          // Check if description exists and contains search term
          return (
            transaction.description.toLowerCase().includes(searchLower) ||
            // Check transaction ID as reference
            transaction.id.toLowerCase().includes(searchLower)
          );
        });
      }

      console.log(
        `Returning ${mockResults.length} mock transactions after filtering`
      );
      return NextResponse.json(mockResults);
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
