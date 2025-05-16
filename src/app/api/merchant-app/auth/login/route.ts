// MODIFIED: src/app/api/merchant-app/auth/login/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants } from "@/lib/db/schema"; //  Ensure this is your merchants table object
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { createJWT } from "@/lib/auth/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log(
      "[API /merchant-app/auth/login] Attempting login for email:",
      email
    );

    const foundMerchants = await db
      .select()
      .from(merchants)
      .where(eq(merchants.contactEmail, email.toLowerCase()))
      .limit(1);

    if (foundMerchants.length === 0) {
      console.warn(
        "[API /merchant-app/auth/login] Merchant not found for email:",
        email
      );
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const merchant = foundMerchants[0];

    if (!merchant.hashedPassword) {
      console.error(
        "[API /merchant-app/auth/login] Merchant found but has no hashed password. Email:",
        email
      );
      return NextResponse.json(
        { error: "Account configuration issue." },
        { status: 500 }
      );
    }
    const isPasswordValid = await verifyPassword(
      password,
      merchant.hashedPassword
    );

    if (!isPasswordValid) {
      console.warn(
        "[API /merchant-app/auth/login] Invalid password for email:",
        email
      );
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (merchant.status !== "active") {
      console.warn(
        `[API /merchant-app/auth/login] Login attempt for non-active merchant. Email: ${email}, Status: ${merchant.status}`
      );
      let errorMessage = "Login failed. Your account is not active.";
      if (merchant.status === "pending_approval") {
        errorMessage = "Your account is pending administrator approval.";
      } else if (merchant.status === "rejected") {
        errorMessage = "Your account application has been rejected.";
      } else if (merchant.status === "suspended") {
        errorMessage = "Your account has been suspended.";
      }
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }

    // Create JWT using the imported createJWT function
    const token = await createJWT({
      sub: merchant.id.toString(),
      email: merchant.contactEmail,
      role: "merchant",
      merchantId: merchant.id,
      // Add any other claims as needed
    });

    console.log(
      "[API /merchant-app/auth/login] Login successful for email:",
      email
    );

    const { hashedPassword, ...merchantDetailsForClient } = merchant;

    const response = NextResponse.json({
      message: "Login successful",
      merchant: merchantDetailsForClient,
      token: token,
    });

    return response;
  } catch (error) {
    console.error(
      "[API /merchant-app/auth/login] Error processing login request:",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error during login." },
      { status: 500 }
    );
  }
}
