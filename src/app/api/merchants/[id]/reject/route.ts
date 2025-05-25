import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from '@/lib/audit';
import { JWTPayload } from "@/lib/auth/jwt";
import { z } from "zod";

// Define the schema for request validation
const rejectMerchantSchema = z.object({
  declineReason: z
    .string()
    .min(1, "Decline reason is required")
    .max(500, "Decline reason is too long")
    .optional(),
});

// PATCH /api/merchants/[id]/reject - Reject a merchant (set status to rejected)
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const now = new Date();

      // Parse and validate the request body
      const bodyJson = await request.json().catch(() => ({}));
      const result = rejectMerchantSchema.safeParse(bodyJson);

      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid request", details: result.error.format() },
          { status: 400 }
        );
      }

      const { declineReason } = result.data;

      // Update merchant status to rejected
      const updatedMerchant = await db
        .update(merchants)
        .set({
          status: "rejected",
          declineReason: declineReason || "No reason provided",
          updatedAt: now,
        })
        .where(
          and(isNull(merchants.deletedAt), eq(merchants.id, context.params.id))
        )
        .returning();

      if (!updatedMerchant.length) {
        return NextResponse.json(
          { error: "Merchant not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(updatedMerchant[0]);
    } catch (error) {
      console.error("Error rejecting merchant:", error);
      return NextResponse.json(
        { error: "Failed to reject merchant" },
        { status: 500 }
      );
    }
  }
);
