// MODIFIED: src/app/api/merchant-app/auth/register/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { merchants, accounts, accountTypeEnum, accountStatusEnum } from '@/lib/db/schema'; // Added accounts, accountTypeEnum, accountStatusEnum
import { eq, and } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid'; // For generating a unique displayId for internal account if needed

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
      category, // Optional, as per last schema discussion
      contactPerson,
      contactPhoneNumber,
      // Removed: website, description, logoUrl from direct destructuring for now, handle if present
    } = body;

    console.log(
      "[API /merchant-app/auth/register] Request body parsed:",
      { storeName, email, /* no password */ location, category, contactPerson, contactPhoneNumber }
    );

    // --- Basic Validation ---
    if (!storeName || !email || !password || !location || !contactPerson || !contactPhoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields: storeName, email, password, location, contactPerson, and contactPhoneNumber are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    // Start Database Transaction
    const registrationResult = await db.transaction(async (tx) => {
      // 1. Check if a merchant with this email already exists
      const existingMerchantByEmail = await tx
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.contactEmail, email.toLowerCase()))
        .limit(1);

      if (existingMerchantByEmail.length > 0) {
        console.warn("[API /merchant-app/auth/register] Merchant with email already exists in tx");
        // To make db.transaction return a specific response, we can throw a custom error
        // or return a specific structure that the outer code interprets.
        // For simplicity, let's throw an error that we can catch and interpret.
        const err = new Error("A merchant with this email already exists.");
        (err as any).statusCode = 409; // Attach statusCode to error
        throw err;
      }

      // 2. Create the Merchant's Internal Account in the 'accounts' table
      const internalAccountDisplayId = `MERCH_INT_${uuidv4()}`; // Ensure uniqueness
      const [newInternalAccount] = await tx
        .insert(accounts)
        .values({
          displayId: internalAccountDisplayId,
          // These fields might not be relevant for MERCHANT_INTERNAL type, set to sensible defaults or null
          childName: storeName, // Or "Internal Account"
          guardianName: "System", // Or merchant's contact person
          status: accountStatusEnum.enumValues[1], // "Active"
          balance: "0.00",
          hashedPin: null, // Not applicable for merchant internal account
          accountType: accountTypeEnum.enumValues[1], // "MERCHANT_INTERNAL"
          email: email.toLowerCase(), // Can store merchant's email here too
          // Fill other NOT NULL fields in 'accounts' if any, or ensure they have defaults
        })
        .returning({ id: accounts.id });

      if (!newInternalAccount || !newInternalAccount.id) {
        console.error("[API /merchant-app/auth/register] Failed to create internal account for merchant in tx.");
        throw new Error("Failed to set up merchant account structure."); // Generic error
      }
      const merchantInternalAccountId = newInternalAccount.id;

      // 3. Hash the received plain text password
      const hashedPassword = await hash(password, SALT_ROUNDS);

      // 4. Create the new merchant record, linking to the internal account
      const newMerchantData: any = {
        businessName: storeName,
        contactEmail: email.toLowerCase(),
        hashedPassword: hashedPassword,
        storeAddress: location,
        internalAccountId: merchantInternalAccountId, // CRITICAL: Link to the created internal account
        contactPerson: contactPerson,
        contactPhone: contactPhoneNumber,
        // Optional fields from request body if present and schema supports them
        category: category || null, // Set to null if not provided
        website: body.website || null,
        description: body.description || null,
        logoUrl: body.logoUrl || null,
        // status will default to "pending_approval" as per schema
        // submittedAt, createdAt, updatedAt will default as per schema
      };

      const [insertedMerchant] = await tx
        .insert(merchants)
        .values(newMerchantData)
        .returning({
          id: merchants.id,
          businessName: merchants.businessName,
          contactEmail: merchants.contactEmail,
          status: merchants.status,
          // Return other fields as needed
        });

      if (!insertedMerchant) {
        console.error("[API /merchant-app/auth/register] Failed to insert merchant into database in tx.");
        throw new Error("Failed to register merchant entity.");
      }
      
      console.log("[API /merchant-app/auth/register] Merchant registered successfully in tx:", insertedMerchant);
      return insertedMerchant; // Return the successfully created merchant from the transaction
    });

    // If db.transaction was successful
    return NextResponse.json(
      {
        message: "Merchant registration successful. Awaiting admin approval.",
        merchant: { // Map to a consistent response structure if needed
          id: registrationResult.id,
          name: registrationResult.businessName,
          email: registrationResult.contactEmail,
          status: registrationResult.status,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("[API /merchant-app/auth/register] Error processing request:", error.message, error.stack);
    if (error.statusCode) { // Check for custom statusCode attached to thrown error
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body. Ensure JSON is well-formed." }, { status: 400 });
    }
    // The generic message you saw before
    return NextResponse.json({ error: "Internal Server Error during registration." }, { status: 500 });
  }
}