// src/app/api/merchant-app/auth/register/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Assuming this is the correct path to your db instance
import { merchants } from "@/lib/db/schema"; // Assuming this is the correct path to your schema
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

const SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

export async function POST(request: Request) {
  console.log("[API /merchant-app/auth/register] Request received");
  try {
    const body = await request.json();
    const {
      name, // This will be mapped to businessName
      email, // This will be mapped to contactEmail
      password, // Plain text password from app
      location, // This will be mapped to storeAddress
      category,
      // contactEmail is not directly used from request body if `email` is primary,
      // but your schema has a `contactEmail` field which we'll use `email` for.
    } = body;

    console.log(
      "[API /merchant-app/auth/register] Request body parsed successfully"
    );

    // --- Basic Validation ---
    if (!name || !email || !password || !location || !category) {
      console.warn(
        "[API /merchant-app/auth/register] Missing required fields",
        {
          hasName: !!name,
          hasEmail: !!email,
          hasPassword: !!password,
          hasLocation: !!location,
          hasCategory: !!category,
        }
      );
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, email, password, location, and category are required.",
        },
        { status: 400 }
      );
    }

    // --- More Specific Validation (Optional but Recommended) ---
    // Validate email format (basic regex example)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn("[API /merchant-app/auth/register] Invalid email format", {
        email,
      });
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // Validate password strength (example: min 8 characters)
    if (password.length < 8) {
      console.warn("[API /merchant-app/auth/register] Password too short");
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    console.log(
      "[API /merchant-app/auth/register] Validation passed, processing registration data:",
      {
        name,
        email,
        location,
        category,
      }
    ); // Don't log password

    // --- Database Operations ---
    // 1. Check if a merchant with this email already exists
    console.log(
      "[API /merchant-app/auth/register] Checking for existing merchant with email:",
      email
    );
    const existingMerchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.contactEmail, email.toLowerCase())) // Case-insensitive check often good for emails
      .limit(1);

    if (existingMerchant.length > 0) {
      console.warn(
        "[API /merchant-app/auth/register] Merchant with email already exists"
      );
      return NextResponse.json(
        { error: "A merchant with this email already exists." },
        { status: 409 } // 409 Conflict
      );
    }

    console.log(
      "[API /merchant-app/auth/register] No existing merchant found, proceeding with registration"
    );

    // 2. Hash the received plain text password
    console.log("[API /merchant-app/auth/register] Hashing password");
    const hashedPassword = await hash(password, SALT_ROUNDS);

    // 3. Create a new merchant record in the database
    //    The `id`, `submittedAt`, `createdAt`, `updatedAt`, and `status` (to 'pending_approval')
    //    will be handled by Drizzle defaults as per your schema.
    const newMerchantData = {
      businessName: name,
      contactEmail: email.toLowerCase(), // Store email in lowercase for consistency
      hashedPassword: hashedPassword,
      storeAddress: location,
      category: category,
      // contactPerson: name, // Optional: if you want to populate this
      // Other fields like contactPhone, website, description, logoUrl are optional
      // and not provided by the current Android app request.
    };

    console.log(
      "[API /merchant-app/auth/register] Inserting new merchant record"
    );
    const insertedMerchant = await db
      .insert(merchants)
      .values(newMerchantData)
      .returning({
        id: merchants.id,
        businessName: merchants.businessName,
        contactEmail: merchants.contactEmail,
        status: merchants.status,
        submittedAt: merchants.submittedAt,
        category: merchants.category,
        storeAddress: merchants.storeAddress,
      });

    if (!insertedMerchant || insertedMerchant.length === 0) {
      console.error(
        "[API /merchant-app/auth/register] Failed to insert merchant into database."
      );
      return NextResponse.json(
        { error: "Failed to register merchant. Please try again." },
        { status: 500 }
      );
    }

    const registeredMerchant = insertedMerchant[0];
    console.log(
      "[API /merchant-app/auth/register] Merchant registered successfully:",
      registeredMerchant
    );

    // 5. Return a success response
    console.log("[API /merchant-app/auth/register] Returning success response");
    return NextResponse.json(
      {
        message: "Merchant registration successful. Awaiting admin approval.",
        merchant: {
          id: registeredMerchant.id,
          name: registeredMerchant.businessName, // Map back to 'name' for consistency with Android request/mock
          email: registeredMerchant.contactEmail,
          location: registeredMerchant.storeAddress,
          category: registeredMerchant.category,
          status: registeredMerchant.status,
          submittedAt: registeredMerchant.submittedAt,
        },
      },
      { status: 201 } // 201 Created
    );
  } catch (error) {
    console.error(
      "[API /merchant-app/auth/register] Error processing request:",
      error
    );
    if (error instanceof SyntaxError) {
      // JSON parsing error
      console.error("[API /merchant-app/auth/register] JSON parsing error");
      return NextResponse.json(
        { error: "Invalid request body. Ensure JSON is well-formed." },
        { status: 400 }
      );
    }
    // Catch Drizzle/DB specific errors if needed for more granular responses
    return NextResponse.json(
      { error: "Internal Server Error during registration." },
      { status: 500 }
    );
  }
}
