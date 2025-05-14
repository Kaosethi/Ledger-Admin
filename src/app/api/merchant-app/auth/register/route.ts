// src/app/api/merchant-app/auth/register/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants } from "@/lib/db/schema"; // Assuming this is 'merchantsTable' or similar from your actual schema file
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  console.log("[API /merchant-app/auth/register] Request received");
  try {
    const body = await request.json();
    // MODIFIED: Destructure fields with names that clearly map to their purpose.
    // App should send these field names.
    const {
      storeName, // Renamed from 'name' for clarity, maps to businessName
      email,
      password,
      location, // Maps to storeAddress
      category,
      contactPerson, // ADDED: Expect contactPerson
      contactPhoneNumber, // ADDED: Expect contactPhoneNumber
    } = body;

    console.log(
      "[API /merchant-app/auth/register] Request body parsed:",
      { // Log all expected fields for debugging
        storeName,
        email,
        // Do not log password
        location,
        category,
        contactPerson,
        contactPhoneNumber
      }
    );

    // --- Basic Validation ---
    // MODIFIED: Updated required fields list
    if (!storeName || !email || !password || !location || !category) {
      console.warn(
        "[API /merchant-app/auth/register] Missing required fields",
        {
          hasStoreName: !!storeName, // MODIFIED
          hasEmail: !!email,
          hasPassword: !!password,
          hasLocation: !!location,
          hasCategory: !!category,
        }
      );
      return NextResponse.json(
        {
          error:
            "Missing required fields: storeName, email, password, location, and category are required.", // MODIFIED
        },
        { status: 400 }
      );
    }

    // --- More Specific Validation (Optional but Recommended) ---
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

    // --- Database Operations ---
    console.log(
      "[API /merchant-app/auth/register] Checking for existing merchant with email:",
      email
    );
    // REMINDER: Ensure 'merchants.contactEmail' matches your schema column name
    const existingMerchant = await db
      .select()
      .from(merchants) // Ensure 'merchants' is the correct Drizzle table object from your schema
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

    console.log(
      "[API /merchant-app/auth/register] No existing merchant found, proceeding with registration"
    );

    console.log("[API /merchant-app/auth/register] Hashing password");
    const hashedPassword = await hash(password, SALT_ROUNDS);

    // MODIFIED: Construct new merchant data with correct mappings
    // REMINDER: Ensure these field names (businessName, contactEmail, etc.)
    // match the column names in your Drizzle 'merchants' schema.
    const newMerchantData: any = { // Use 'any' for flexibility or define a proper type
      businessName: storeName, // MODIFIED: Use storeName from request
      contactEmail: email.toLowerCase(),
      hashedPassword: hashedPassword,
      storeAddress: location,
      category: category,
      // ADDED: Include contactPerson and contactPhoneNumber if provided
      // These will be null/undefined if not in request body, Drizzle handles this for nullable columns.
    };

    if (contactPerson) {
      newMerchantData.contactPerson = contactPerson;
    }
    if (contactPhoneNumber) {
      // You might want to add validation for phone number format here
      newMerchantData.contactPhone = contactPhoneNumber; // Assuming DB column is 'contactPhone'
    }
    
    // Default status will be applied by DB schema or Drizzle if defined there
    // Default timestamps (submittedAt, createdAt, updatedAt) also typically handled by schema/DB

    console.log(
      "[API /merchant-app/auth/register] Inserting new merchant record:",
      newMerchantData // Log the data going into the DB (excluding password)
    );

    // REMINDER: Ensure 'merchants' is the correct Drizzle table object
    const insertedMerchant = await db
      .insert(merchants)
      .values(newMerchantData)
      .returning({
        id: merchants.id,
        businessName: merchants.businessName,
        contactEmail: merchants.contactEmail,
        status: merchants.status,
        submittedAt: merchants.submittedAt, // Ensure this column exists or remove
        category: merchants.category,
        storeAddress: merchants.storeAddress,
        contactPerson: merchants.contactPerson, // ADDED: Return contactPerson
        contactPhone: merchants.contactPhone,   // ADDED: Return contactPhone
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

    console.log("[API /merchant-app/auth/register] Returning success response");
    return NextResponse.json(
      {
        message: "Merchant registration successful. Awaiting admin approval.",
        merchant: {
          id: registeredMerchant.id,
          name: registeredMerchant.businessName, // Keep 'name' here if Android expects it in response
          email: registeredMerchant.contactEmail,
          location: registeredMerchant.storeAddress,
          category: registeredMerchant.category,
          status: registeredMerchant.status,
          submittedAt: registeredMerchant.submittedAt,
          contactPerson: registeredMerchant.contactPerson, // ADDED
          contactPhoneNumber: registeredMerchant.contactPhone, // ADDED (assuming DB column is contactPhone)
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