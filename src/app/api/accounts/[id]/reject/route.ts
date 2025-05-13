import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";

// PATCH /api/accounts/[id]/reject - Reject an account (set status to Inactive and soft delete)
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const now = new Date();

      // Update account status to Inactive and soft delete
      const updatedAccount = await db
        .update(accounts)
        .set({
          status: "Inactive",
          updatedAt: now,
          lastActivity: now,
          deletedAt: now, // Soft delete by setting deletedAt
        })
        .where(
          and(isNull(accounts.deletedAt), eq(accounts.id, context.params.id))
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
      console.error("Error rejecting account:", error);
      return NextResponse.json(
        { error: "Failed to reject account" },
        { status: 500 }
      );
    }
  }
);
