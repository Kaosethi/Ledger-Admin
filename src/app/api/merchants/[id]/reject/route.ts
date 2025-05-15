import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { z } from "zod";
import { JWTPayload } from "@/lib/auth/jwt";

// PATCH /api/merchants/[id]/reject - Reject a merchant (set status to inactive)
export const PATCH = withAuth(async (request: NextRequest, context: any, payload: JWTPayload) => {
  try {
    const now = new Date();

    const body = await request.json();
    const { declineReason } = z.object({
      declineReason: z.string().min(1).optional(),
    }).parse(body);

    // Update merchant status to active
    const updatedMerchant = await db
      .update(merchants)
      .set({
        status: "rejected",
        updatedAt: now,
        declineReason: declineReason || "No reason provided",
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
