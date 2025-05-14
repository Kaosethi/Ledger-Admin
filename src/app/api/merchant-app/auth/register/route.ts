// MODIFIED: src/app/api/merchant-app/auth/register/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants } from "@/lib/db/schema"; // Assuming this is 'merchantsTable' or similar
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  console.log("[API /merchant-app/auth/register] Request received");
  try {
    const body = await request.json();
    const {
      storeName,
      email,
      password,
      location, // Maps to storeAddress
      // REMOVED: category from required destructuring. It will be handled as optional.
      contactPerson,
      contactPhoneNumber,
      category, // ADDED: Destructure category here, but it will be optional
    } = body;

    console.log(
      "[API /merchant-app/auth/register] Request body parsed:",
      {
        storeName,
        email,
        // Do not log password
        location,
        category, // Log if present
        contactPerson,
        contactPhoneNumber
      }
    );

    // --- Basic Validation ---
    // REMOVED: category from this primary validation check
    if (!storeName || !email || !password || !location || !contactPerson || !contactPhoneNumber) {
      console.warn(
        "[API /merchant-app/auth/register] Missing required fields",
        {
          hasStoreName: !!storeName,
          hasEmail: !!email,
          hasPassword: !!password,
          hasLocation: !!location,
          // hasCategory: !!category, // REMOVED from mandatory check
          hasContactPerson: !!contactPerson,
          hasContactPhoneNumber: !!contactPhoneNumber,
        }
      );
      return NextResponse.json(
        {
          // MODIFIED: Updated error message
          error:
            "Missing required fields: storeName, email, password, location, contactPerson, and contactPhoneNumber are required.",
        },
        { status: 400 }
      );
    }

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

    if (password.length < 8) {
      console.warn("[API /merchant-app/auth/register] Password too short");
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    console.log(
      "[API /merchant-app/auth/register] Validation passed, processing registration data"
    );

    const existingMerchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.contactEmail, email.toLowerCase()))
      .limit(1);

    if (existingMerchant.length > 0) {
      console.warn(
        "[API /merchant-app/auth/register] Merchant with email already exists"
      );
      return NextResponse.json(
        { error: "A merchant with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, SALT_ROUNDS);

    const newMerchantData: any = {
      businessName: storeName,
      contactEmail: email.toLowerCase(),
      hashedPassword: hashedPassword,
      storeAddress: location,
      // MODIFIED: category is now conditional.
      // If 'category' is provided in the body and is not empty, use it. Otherwise, it won't be set,
      // relying on the DB column being nullable or having a default.
      contactPerson: contactPerson,
      contactPhone: contactPhoneNumber,
    };

    if (category && typeof category === 'string' && category.trim() !== '') {
      newMerchantData.category = category;
    }
    // If category is not in the request body, or is empty, it's simply not added to newMerchantData.
    // Drizzle will attempt to insert NULL if the column is nullable, or DB default will apply.

    console.log(
      "[API /merchant-app/auth/register] Inserting new merchant record:",
      newMerchantData
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
        category: merchants.category, // Keep returning it to see what DB sets if not provided
        storeAddress: merchants.storeAddress,
        contactPerson: merchants.contactPerson,
        contactPhone: merchants.contactPhone,
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

    return NextResponse.json(
      {
        message: "Merchant registration successful. Awaiting admin approval.",
        merchant: {
          id: registeredMerchant.id,
          name: registeredMerchant.businessName,
          email: registeredMerchant.contactEmail,
          location: registeredMerchant.storeAddress,
          category: registeredMerchant.category, // Return it
          status: registeredMerchant.status,
          submittedAt: registeredMerchant.submittedAt,
          contactPerson: registeredMerchant.contactPerson,
          contactPhoneNumber: registeredMerchant.contactPhone,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "[API /merchant-app/auth/register] Error processing request:",
      error
    );
    if (error instanceof SyntaxError) {
      console.error("[API /merchant-app/auth/register] JSON parsing error");
      return NextResponse.json(
        { error: "Invalid request body. Ensure JSON is well-formed." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error during registration." },
      { status: 500 }
    );
  }
}