import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import crypto from "crypto";
import { env } from "@/lib/env";

// GET /api/accounts/[id]/regenerate-qr - Regenerate QR code for an account
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    const { id } = await context.params;
    try {
      // Validate admin permissions
      if (!payload.isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized: Admin access required" },
          { status: 403 }
        );
      }

      // Check if account exists and is not suspended or deleted
      const account = await db
        .select()
        .from(accounts)
        .where(
          and(
            isNull(accounts.deletedAt),
            eq(accounts.id, id),
            ne(accounts.status, "Suspended")
          )
        );

      if (!account.length) {
        return NextResponse.json(
          { error: "Account not found or not active" },
          { status: 404 }
        );
      }

      // Generate new QR code
      const accountId = account[0].id;
      const type = "pay";
      const ver = "1.0";

      const qrPayload = { type, account: accountId, ver };
      const sig = crypto
        .createHmac("sha256", env.JWT_SECRET)
        .update(JSON.stringify(qrPayload))
        .digest("base64")
        .slice(0, 32);

      // Add signature to payload
      const fullPayload = { ...qrPayload, sig };

      // Convert payload to base64
      const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString(
        "base64"
      );

      // Update account with new QR signature and lastActivity
      const updatedAccount = await db
        .update(accounts)
        .set({
          currentQrToken: base64Payload, // Store the signature in currentQrToken
          updatedAt: new Date(),
          lastActivity: new Date(),
        })
        .where(eq(accounts.id, accountId))
        .returning();

      // Return base64 encoded QR payload
      return NextResponse.json({
        message: "QR code regenerated successfully",
        qrPayload: base64Payload,
      });
    } catch (error) {
      console.error("Error regenerating QR code:", error);
      return NextResponse.json(
        { error: "Failed to regenerate QR code" },
        { status: 500 }
      );
    }
  }
);
