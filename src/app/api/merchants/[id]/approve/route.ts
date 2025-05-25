import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from '@/lib/audit';
import { JWTPayload } from "@/lib/auth/jwt";

// PATCH /api/merchants/[id]/approve - Approve a merchant (set status to active)
export const PATCH = withAuth(async (request: NextRequest, context: any, payload: JWTPayload) => {
  try {
    const now = new Date();

    // Update merchant status to active
    const updatedMerchant = await db
      .update(merchants)
      .set({
        status: "active",
        updatedAt: now,
      })
      .where(
        and(isNull(merchants.deletedAt), eq(merchants.id, context.params.id))
      )
      .returning();

    if (!updatedMerchant.length) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMerchant[0]);
  } catch (error) {
    console.error("Error approving merchant:", error);
    return NextResponse.json(
      { error: "Failed to approve merchant" },
      { status: 500 }
    );
  }
});
