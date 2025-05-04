import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, account, ver } = body;
  if (!type || !account || !ver) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const payload = { type, account, ver };
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(payload))
    .digest("base64")
    .slice(0, 32);
  return NextResponse.json({ ...payload, sig });
}
