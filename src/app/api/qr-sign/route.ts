import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";

const SECRET = process.env.JWT_SECRET!;

// POST /api/qr-sign - Create a signed QR code payload (protected)
export const POST = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    const body = await request.json();
    const { type, account, ver } = body;
    if (!type || !account || !ver) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const qrPayload = { type, account, ver };
    const sig = crypto
      .createHmac("sha256", SECRET)
      .update(JSON.stringify(qrPayload))
      .digest("base64")
      .slice(0, 32);
    return NextResponse.json({ ...qrPayload, sig });
  }
);
