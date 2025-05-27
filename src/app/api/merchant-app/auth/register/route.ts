// src/app/api/merchant-app/auth/register/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  merchants,
  accounts,
  createMerchantApiPayloadSchema, // <<< CORRECTED IMPORT
  accountTypeEnum,
  accountStatusEnum,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password"; 
import { generateDisplayId } from "@/lib/utils/idGenerator"; 
import { z } from "zod"; 

export async function POST(request: NextRequest) {
  console.log("[API /merchant-app/auth/register] Request received");
  try {
    const body = await request.json();

    // Validate incoming payload against the specific API payload schema
    const validatedData = createMerchantApiPayloadSchema.parse(body); // <<< CORRECTED USAGE

    // Destructure fields based on createMerchantApiPayloadSchema
    const {
      storeName,      
      email,          
      password,
      location,       
      contactPerson,
      contactPhoneNumber, 
      category,
      website,
      description,
      logoUrl,
    } = validatedData;

    console.log("[API /merchant-app/auth/register] Validated request body (client payload):", {
      storeName, email, /* no password logging */
      location, contactPerson, contactPhoneNumber, category, website, description, logoUrl
    });

    const registrationResult = await db.transaction(async (tx) => {
      const existingMerchantByEmail = await tx
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.contactEmail, email.toLowerCase())) 
        .limit(1);

      if (existingMerchantByEmail.length > 0) {
        console.warn(`[API /merchant-app/auth/register] Merchant with email ${email} already exists.`);
        const err = new Error("A merchant with this email already exists.");
        (err as any).statusCode = 409;
        throw err;
      }

      const internalAccountDisplayId = await generateDisplayId(tx, 'MIA'); 
      const merchantDisplayId = await generateDisplayId(tx, 'MER');

      const [newInternalAccount] = await tx
        .insert(accounts)
        .values({
          displayId: internalAccountDisplayId, 
          childName: `${storeName} Internal Acc.`, 
          guardianName: contactPerson || `${storeName} System`, 
          status: accountStatusEnum.enumValues[1], 
          balance: "0.00",
          hashedPin: null, 
          accountType: accountTypeEnum.enumValues[1], 
          email: email.toLowerCase(), 
        })
        .returning({ id: accounts.id, displayId: accounts.displayId });

      if (!newInternalAccount || !newInternalAccount.id) {
        console.error("[API /merchant-app/auth/register] Failed to create internal account for merchant.");
        throw new Error("Failed to set up merchant account structure (internal account).");
      }
      const merchantInternalAccountUUID = newInternalAccount.id;
      console.log(`[API /merchant-app/auth/register] Internal account created: ${newInternalAccount.id} (Display ID: ${newInternalAccount.displayId})`);


      const hashedPassword = await hashPassword(password);

      const newMerchantInsertData = {
        displayId: merchantDisplayId, 
        businessName: storeName,         
        contactEmail: email.toLowerCase(), 
        hashedPassword: hashedPassword,
        storeAddress: location,        
        internalAccountId: merchantInternalAccountUUID,
        contactPerson: contactPerson,    
        contactPhone: contactPhoneNumber,
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
        console.error("[API /merchant-app/auth/register] Failed to insert merchant into database.");
        throw new Error("Failed to register merchant entity.");
      }

      console.log(`[API /merchant-app/auth/register] Merchant registered successfully: ${insertedMerchant.id} (Display ID: ${insertedMerchant.displayId})`);
      
      return { merchant: insertedMerchant, account: newInternalAccount }; 
    });

    return NextResponse.json(
      {
        message: "Merchant registration successful. Your application is pending admin approval.",
        merchant: {
          id: registrationResult.merchant.id,
          displayId: registrationResult.merchant.displayId, 
          name: registrationResult.merchant.businessName, 
          email: registrationResult.merchant.contactEmail,  
          status: registrationResult.merchant.status,
        },
        internalAccount: {
            id: registrationResult.account.id,
            displayId: registrationResult.account.displayId, 
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("[API /merchant-app/auth/register] Error processing request:", error.message, error.stack);
    
    if (error instanceof z.ZodError) {
      console.warn("[API /merchant-app/auth/register] Validation error:", error.flatten().fieldErrors);
      return NextResponse.json({ 
        error: "Validation failed. Please check your input.", 
        details: error.flatten().fieldErrors 
      }, { status: 400 });
    }
    if ((error as any).statusCode) { 
      return NextResponse.json({ error: error.message }, { status: (error as any).statusCode });
    }
    if (error.code === '23505') { 
        if (error.detail && error.detail.toLowerCase().includes('display_id')) {
             console.warn(`[API /merchant-app/auth/register] Unique constraint violation for display_id: ${error.detail}`);
            return NextResponse.json({ error: "A record with this Display ID already exists. This is a rare server issue, please try again." }, { status: 409 });
        }
        if (error.detail && error.detail.toLowerCase().includes(merchants.contactEmail.name)) { 
            console.warn(`[API /merchant-app/auth/register] Unique constraint violation for email: ${error.detail}`);
            return NextResponse.json({ error: "A merchant with this email already exists." }, { status: 409 });
        }
        console.warn(`[API /merchant-app/auth/register] Unique constraint violation: ${error.detail || error.message}`);
        return NextResponse.json({ error: "A record with a unique identifier already exists. Please check your input or contact support." }, { status: 409 });
    }
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json({ error: "Invalid request body. Ensure JSON is well-formed." }, { status: 400 });
    }
    
    return NextResponse.json({ error: "An internal server error occurred during registration." }, { status: 500 });
  }
}