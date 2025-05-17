import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";

// PATCH /api/accounts/[id]/suspend - Suspend an account (set status to Suspended)
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    const { id } = await context.params;

    try {
      const now = new Date();

      // Update account status to Inactive and soft delete
      const updatedAccount = await db
        .update(accounts)
        .set({
          status: "Suspended",
          updatedAt: now,
          lastActivity: now,
        })
        .where(
          and(isNull(accounts.deletedAt), eq(accounts.id, id))
        )
        .returning();

      if (!updatedAccount.length) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(updatedAccount[0]);
    } catch (error) {
      console.error("Error suspending account:", error);
      return NextResponse.json(
        { error: "Failed to suspend account" },
        { status: 500 }
      );
    }
  }
);
