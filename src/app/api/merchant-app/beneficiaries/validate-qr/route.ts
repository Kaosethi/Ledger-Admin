// src/app/api/merchant-app/beneficiaries/validate-qr/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log("!!! VALIDATE-QR POST HANDLER REACHED !!!");
  return NextResponse.json({ message: "Validate QR Test OK" }, { status: 200 });
}