import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchantStatusEnum } from "@/lib/db/schema";
import { merchants } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import { z } from "zod";

// Define the schema for request validation
const reactivateMerchantSchema = z.object({
  notes: z.string().max(500, "Notes are too long").optional(),
});

// PATCH /api/merchants/[id]/reactive - Reactivate a merchant (set status to active)
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const now = new Date();

      // Parse and validate the request body
      const bodyJson = await request.json().catch(() => ({}));
      const result = reactivateMerchantSchema.safeParse(bodyJson);

      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid request", details: result.error.format() },
          { status: 400 }
        );
      }

      const { notes } = result.data;

      // Update merchant status to active
      const updatedMerchant = await db
        .update(merchants)
        .set({
          status: "active",
          declineReason: null, // Clear any previous suspension/decline reason
          updatedAt: now,
        })
        .where(
          and(
            isNull(merchants.deletedAt),
            eq(merchants.id, context.params.id),
            eq(merchants.status, "suspended")
          )
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
      console.error("Error reactivating merchant:", error);
      return NextResponse.json(
        { error: "Failed to reactivate merchant" },
        { status: 500 }
      );
    }
  }
);
