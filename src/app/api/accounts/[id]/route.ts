import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";

// GET /api/accounts/[id] - Get a specific account by ID
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const account = await db
        .select()
        .from(accounts)
        // filter soft deleted accounts
        .where(
          and(isNull(accounts.deletedAt), eq(accounts.id, context.params.id))
        );

      if (!account.length) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(account[0]);
    } catch (error) {
      console.error("Error fetching account:", error);
      return NextResponse.json(
        { error: "Failed to fetch account" },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/accounts/[id] - Update an account
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const body = await request.json();

      // Update account
      const updatedAccount = await db
        .update(accounts)
        .set(body)
        .where(eq(accounts.id, context.params.id))
        .returning();

      if (!updatedAccount.length) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(updatedAccount[0]);
    } catch (error) {
      console.error("Error updating account:", error);
      return NextResponse.json(
        { error: "Failed to update account" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/accounts/[id] - Delete an account
export const DELETE = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const deletedAccount = await db
        .delete(accounts)
        .where(eq(accounts.id, context.params.id))
        .returning();

      if (!deletedAccount.length) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(deletedAccount[0]);
    } catch (error) {
      console.error("Error deleting account:", error);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }
  }
);
