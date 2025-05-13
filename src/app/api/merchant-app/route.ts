import { NextRequest, NextResponse } from "next/server";
import { transactions, createTransactionSchema } from "@/lib/db/schema";
import mockDataInstance from "@/lib/mockData";
import { JWTPayload } from "@/lib/auth/jwt";

// GET /api/transactions - Get all transactions (protected)
export const GET = async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      return NextResponse.json({
        message: "Fetching transactions from mock data",
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json(mockDataInstance.transactions);
    }
  }
