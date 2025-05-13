import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";

// PATCH /api/accounts/[id]/reactivate - Reactivate an account (set status to Active)
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
          and(
            isNull(accounts.deletedAt),
            eq(accounts.id, context.params.id),
            eq(accounts.status, "Suspended")
          )
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
      console.error("Error reactivating account:", error);
      return NextResponse.json(
        { error: "Failed to reactivate account" },
        { status: 500 }
      );
    }
  }
);
