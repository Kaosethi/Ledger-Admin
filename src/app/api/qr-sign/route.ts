import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { withAuth } from '@/lib/audit';
import { JWTPayload } from "@/lib/auth/jwt";
import { env } from "@/lib/env";

// POST /api/qr-sign - Create a signed QR code payload (protected)
export const POST = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    const body = await request.json();
    const { account } = body;
    const type = "pay";
    const ver = "1.0";
    if (!type || !account || !ver) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const qrPayload = { type, account, ver };
    const sig = crypto
      .createHmac("sha256", env.JWT_SECRET)
      .update(JSON.stringify(qrPayload))
      .digest("base64")
      .slice(0, 32);
    return NextResponse.json({ ...qrPayload, sig });
  }
);
