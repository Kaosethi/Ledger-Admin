import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import { z } from "zod";

// Define the schema for request validation
const suspendMerchantSchema = z.object({
  reason: z
    .string()
    .min(1, "Suspension reason is required")
    .max(500, "Suspension reason is too long")
    .optional(),
});

// PATCH /api/merchants/[id]/suspend - Suspend a merchant (set status to suspended)
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const now = new Date();

      // Parse and validate the request body
      const bodyJson = await request.json().catch(() => ({}));
      const result = suspendMerchantSchema.safeParse(bodyJson);

      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid request", details: result.error.format() },
          { status: 400 }
        );
      }

      const { reason } = result.data;

      // Update merchant status to suspended
      const updatedMerchant = await db
        .update(merchants)
        .set({
          status: "suspended",
          declineReason: reason || "No reason provided", // Using existing declineReason field to store suspension reason
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
      console.error("Error suspending merchant:", error);
      return NextResponse.json(
        { error: "Failed to suspend merchant" },
        { status: 500 }
      );
    }
  }
);
