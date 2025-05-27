// src/app/api/merchant-app/auth/register/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  merchants,
  accounts,
  createMerchantApiPayloadSchema,
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
    console.log("[API /merchant-app/auth/register] Raw request body:", JSON.stringify(body));

    const validatedData = createMerchantApiPayloadSchema.parse(body);
    console.log("[API /merchant-app/auth/register] Zod validation successful.");

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

    console.log("[API /merchant-app/auth/register] Destructured validated data:", {
      storeName, email, location, contactPerson, contactPhoneNumber, category, website, description, logoUrl 
    });

    const registrationResult = await db.transaction(async (tx) => {
      console.log("[API /merchant-app/auth/register] Inside DB transaction.");

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
      console.log("[API /merchant-app/auth/register] Email uniqueness check passed.");

      let internalAccountDisplayId: string | undefined;
      let merchantDisplayId: string | undefined;

      try {
        console.log("[API /merchant-app/auth/register] Attempting to generate internalAccountDisplayId for prefix 'MIA'...");
        internalAccountDisplayId = await generateDisplayId(tx, 'MIA'); 
        console.log(`[API /merchant-app/auth/register] SUCCESSFULLY generated internalAccountDisplayId: ${internalAccountDisplayId}`);
      } catch (genError: any) {
        console.error(`[API /merchant-app/auth/register] FAILED to generate internalAccountDisplayId: ${genError.message}`, genError.stack);
        throw new Error(`Failed to generate internal account display ID: ${genError.message}`);
      }

      try {
        console.log("[API /merchant-app/auth/register] Attempting to generate merchantDisplayId for prefix 'MER'...");
        merchantDisplayId = await generateDisplayId(tx, 'MER');
        console.log(`[API /merchant-app/auth/register] SUCCESSFULLY generated merchantDisplayId: ${merchantDisplayId}`);
      } catch (genError: any) {
        console.error(`[API /merchant-app/auth/register] FAILED to generate merchantDisplayId: ${genError.message}`, genError.stack);
        throw new Error(`Failed to generate merchant display ID: ${genError.message}`);
      }
      
      if (!internalAccountDisplayId) {
          console.error("[API /merchant-app/auth/register] CRITICAL: internalAccountDisplayId is undefined after generation attempt.");
          throw new Error("Internal error: Account Display ID was not generated.");
      }
      if (!merchantDisplayId) {
          console.error("[API /merchant-app/auth/register] CRITICAL: merchantDisplayId is undefined after generation attempt.");
          throw new Error("Internal error: Merchant Display ID was not generated.");
      }

      console.log(`[API /merchant-app/auth/register] Proceeding to create internal account with displayId: ${internalAccountDisplayId}`);
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
      console.log(`[API /merchant-app/auth/register] Internal account created: ${newInternalAccount.id} (Returned Display ID: ${newInternalAccount.displayId})`);

      const hashedPassword = await hashPassword(password);
      console.log("[API /merchant-app/auth/register] Password hashed.");

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
      console.log("[API /merchant-app/auth/register] Merchant data to be inserted:", JSON.stringify(newMerchantInsertData, (key, value) => key === "hashedPassword" ? "[FILTERED]" : value));

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

      console.log(`[API /merchant-app/auth/register] Merchant registered successfully: ${insertedMerchant.id} (Returned Display ID: ${insertedMerchant.displayId})`);
      
      return { merchant: insertedMerchant, account: newInternalAccount }; 
    });

    console.log("[API /merchant-app/auth/register] DB transaction completed successfully.");
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
    console.error("[API /merchant-app/auth/register] CRITICAL ERROR in handler:", {
        message: error.message,
        stack: error.stack,
        detail: error.detail, // For pg errors
        code: error.code,     // For pg errors
        constraint: error.constraint // For pg errors
    });
    
    if (error instanceof z.ZodError) {
      console.warn("[API /merchant-app/auth/register] Validation error details:", error.flatten().fieldErrors);
      return NextResponse.json({ 
        error: "Validation failed. Please check your input.", 
        details: error.flatten().fieldErrors 
      }, { status: 400 });
    }
    if ((error as any).statusCode) { 
      return NextResponse.json({ error: error.message }, { status: (error as any).statusCode });
    }
    if (error.code === '23505') { // PostgreSQL unique_violation error code
        let specificMessage = "A record with a unique identifier already exists.";
        if (error.detail && error.detail.toLowerCase().includes('display_id')) {
            specificMessage = "A record with this Display ID already exists. This is a rare server issue, please try again.";
            console.warn(`[API /merchant-app/auth/register] Unique constraint violation for display_id: ${error.detail}`);
        } else if (error.detail && error.detail.toLowerCase().includes(merchants.contactEmail.name)) { // merchants.contactEmail.name is 'contact_email'
            specificMessage = "A merchant with this email already exists.";
            console.warn(`[API /merchant-app/auth/register] Unique constraint violation for email: ${error.detail}`);
        } else {
            console.warn(`[API /merchant-app/auth/register] Generic unique constraint violation: ${error.detail || error.message}`);
        }
        return NextResponse.json({ error: specificMessage, detail: error.detail }, { status: 409 });
    }
    if (error.code === '23502') { // PostgreSQL not_null_violation
        let specificMessage = "A required field was missing in the database operation.";
        if (error.column && error.table) {
            specificMessage = `The field '${error.column}' in table '${error.table}' cannot be null.`;
            if (error.column === 'display_id' && error.table === 'merchants') {
                specificMessage = "Internal server error: Failed to assign a display ID to the merchant.";
            } else if (error.column === 'display_id' && error.table === 'accounts') {
                specificMessage = "Internal server error: Failed to assign a display ID to the internal account.";
            }
        }
        console.warn(`[API /merchant-app/auth/register] Not null violation: ${specificMessage} (Detail: ${error.detail})`);
        return NextResponse.json({ error: specificMessage, detail: error.detail }, { status: 500 });
    }
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json({ error: "Invalid request body. Ensure JSON is well-formed." }, { status: 400 });
    }
    
    // Default error message for unhandled cases
    let errorMessage = "An internal server error occurred during registration.";
    if (error.message) { // Use the specific error message if available
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage, detail: error.detail, code: error.code }, { status: 500 });
  }
}