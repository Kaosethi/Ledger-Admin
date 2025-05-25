// api/merchants/[id]/reactive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchantStatusEnum, merchants } from "@/lib/db/schema"; // Use merchantStatusEnum
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import { z } from "zod";

// Define the schema for request validation
// It now expects a 'status' field which should be one of the allowed enum values
const reactiveMerchantSchema = z.object({
  status: z.enum(merchantStatusEnum.enumValues), // Correct: Use the actual enum values from your schema
  notes: z.string().max(500, "Notes are too long").optional(),
});

// PATCH /api/merchants/[id]/reactive - Sets a merchant to a new 'reactive' state (e.g., active or pending_approval)
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const now = new Date();
      const merchantId = context.params.id;

      // Parse and validate the request body
      let bodyJson;
      try {
        bodyJson = await request.json();
      } catch (e) {
        return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
      }
      
      const result = reactiveMerchantSchema.safeParse(bodyJson);

      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid request body", details: result.error.format() },
          { status: 400 }
        );
      }

      const { status: newStatus, notes } = result.data; // newStatus will be 'active' or 'pending_approval'

      const currentMerchant = await db.query.merchants.findFirst({
        where: and(
          eq(merchants.id, merchantId),
          isNull(merchants.deletedAt)
        ),
      });

      if (!currentMerchant) {
        return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
      }

      let isValidTransition = false;
      if (newStatus === "active" && currentMerchant.status === "suspended") {
        isValidTransition = true;
      } else if (newStatus === "pending_approval" && currentMerchant.status === "rejected") {
        isValidTransition = true;
      }

      if (!isValidTransition) {
        return NextResponse.json(
          { error: `Cannot transition merchant from status '${currentMerchant.status}' to '${newStatus}' via this endpoint.` },
          { status: 400 } 
        );
      }

      const updatedMerchant = await db
        .update(merchants)
        .set({
          status: newStatus, 
          declineReason: null, 
          updatedAt: now,
        })
        .where(
          and(
            isNull(merchants.deletedAt),
            eq(merchants.id, merchantId),
            eq(merchants.status, currentMerchant.status) 
          )
        )
        .returning();

      if (!updatedMerchant.length) {
        return NextResponse.json(
          { error: "Merchant not found or state changed unexpectedly" },
          { status: 404 } 
        );
      }

      // TODO: Log admin activity

      return NextResponse.json(updatedMerchant[0]);
    } catch (error) {
      console.error("Error setting merchant to reactive status:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { error: "Failed to set merchant to reactive status", details: process.env.NODE_ENV === "development" ? errorMessage : undefined },
        { status: 500 }
      );
    }
  }
);