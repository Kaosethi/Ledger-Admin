// src/app/api/merchant-app/auth/register/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  merchants,
  accounts,
  createMerchantSchema,
  accountTypeEnum,
  accountStatusEnum,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";

export async function POST(request: NextRequest) {
  console.log("[API /merchant-app/auth/register] Request received");
  try {
    const body = await request.json();

    const validatedData = createMerchantSchema.parse(body);

    const {
      displayId,
      internalAccountDisplayId, // <<< --- ADDED THIS TO DESTRUCTURING ---
      businessName,
      contactEmail,
      password,
      storeAddress,
      category,
      contactPerson,
      contactPhone,
      website,
      description,
      logoUrl,
    } = validatedData;

    console.log("[API /merchant-app/auth/register] Validated request body:", {
      displayId, internalAccountDisplayId, businessName, contactEmail, /* no password */
      storeAddress, category, contactPerson, contactPhone,
    });

    const registrationResult = await db.transaction(async (tx) => {
      const existingMerchantByEmail = await tx
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.contactEmail, contactEmail.toLowerCase()))
        .limit(1);

      if (existingMerchantByEmail.length > 0) {
        console.warn("[API /merchant-app/auth/register] Merchant with email already exists in tx");
        const err = new Error("A merchant with this email already exists.");
        (err as any).statusCode = 409;
        throw err;
      }

      const existingInternalAccountByDisplayId = await tx
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.displayId, internalAccountDisplayId)) // Use the destructured variable
        .limit(1);
      
      if (existingInternalAccountByDisplayId.length > 0) {
        console.warn(`[API /merchant-app/auth/register] Internal account displayId ${internalAccountDisplayId} already exists.`);
        const err = new Error("Internal account setup conflict. Please try a different identifier or contact support.");
        (err as any).statusCode = 409;
        throw err;
      }
      
      const [newInternalAccount] = await tx
        .insert(accounts)
        .values({
          displayId: internalAccountDisplayId, // Use the destructured variable
          childName: `${businessName} Internal Acct.`,
          guardianName: contactPerson || "Merchant System", 
          status: accountStatusEnum.enumValues[1], // "Active"
          balance: "0.00",
          hashedPin: null, 
          accountType: accountTypeEnum.enumValues[1], // "MERCHANT_INTERNAL"
          email: contactEmail.toLowerCase(),
        })
        .returning({ id: accounts.id });

      if (!newInternalAccount || !newInternalAccount.id) {
        console.error("[API /merchant-app/auth/register] Failed to create internal account for merchant in tx.");
        throw new Error("Failed to set up merchant account structure (internal account).");
      }
      const merchantInternalAccountUUID = newInternalAccount.id;

      const hashedPassword = await hashPassword(password);

      const newMerchantInsertData = {
        displayId: displayId, 
        businessName: businessName,
        contactEmail: contactEmail.toLowerCase(),
        hashedPassword: hashedPassword,
        storeAddress: storeAddress,
        internalAccountId: merchantInternalAccountUUID,
        contactPerson: contactPerson,
        contactPhone: contactPhone,
        category: category || null,
        website: website || null,
        description: description || null,
        logoUrl: logoUrl || null,
      };

      const [insertedMerchant] = await tx
        .insert(merchants)
        .values(newMerchantInsertData)
        .returning({
          id: merchants.id,
          displayId: merchants.displayId,
          businessName: merchants.businessName,
          contactEmail: merchants.contactEmail,
          status: merchants.status,
        });

      if (!insertedMerchant) {
        console.error("[API /merchant-app/auth/register] Failed to insert merchant into database in tx.");
        throw new Error("Failed to register merchant entity.");
      }

      console.log("[API /merchant-app/auth/register] Merchant registered successfully in tx:", insertedMerchant);
      return insertedMerchant; 
    });

    return NextResponse.json(
      {
        message: "Merchant registration successful. Your application is pending admin approval.",
        merchant: {
          id: registrationResult.id,
          displayId: registrationResult.displayId,
          name: registrationResult.businessName,
          email: registrationResult.contactEmail,
          status: registrationResult.status,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("[API /merchant-app/auth/register] Error processing request:", error.message, error.stack);
    
    if (error instanceof z.ZodError) {
      console.warn("[API /merchant-app/auth/register] Validation error:", error.flatten());
      return NextResponse.json({ error: "Validation failed. Please check your input.", details: error.flatten().fieldErrors }, { status: 400 });
    }
    if (error.statusCode) { 
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error.code === '23505') { 
        if (error.detail && error.detail.toLowerCase().includes('display_id')) {
            return NextResponse.json({ error: "A record with this Display ID already exists. Please try a different one." }, { status: 409 });
        }
        return NextResponse.json({ error: "A record with some unique identifier already exists." }, { status: 409 });
    }
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json({ error: "Invalid request body. Ensure JSON is well-formed." }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal Server Error during registration." }, { status: 500 });
  }
}