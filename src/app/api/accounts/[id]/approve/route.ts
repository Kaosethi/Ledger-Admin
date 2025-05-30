import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import { removeSensitiveData } from "@/lib/utils";

// PATCH /api/accounts/[id]/approve - Approve an account (set status to Active)
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const now = new Date();

      // Update account status to Active
      const updatedAccount = await db
        .update(accounts)
        .set({
          status: "Active",
          updatedAt: now,
          lastActivity: now,
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

      // Remove sensitive data before returning
      const safeAccount = removeSensitiveData(updatedAccount[0]);
      return NextResponse.json(safeAccount);
    } catch (error) {
      console.error("Error approving account:", error);
      return NextResponse.json(
        { error: "Failed to approve account" },
        { status: 500 }
      );
    }
  }
);
