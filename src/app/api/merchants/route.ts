// src/app/api/merchants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  merchants,
  accounts, 
  merchantStatusEnum,
  accountStatusEnum, 
  accountTypeEnum,   
  createMerchantApiPayloadSchema, 
} from "@/lib/db/schema";
import { z } from "zod";
import { withAuth } from "@/lib/auth/middleware"; 
import { JWTPayload } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { generateDisplayId } from "@/lib/utils/idGenerator"; 

import { eq, desc, SQL } from "drizzle-orm";
// Import the specific Select type if needed, or rely on inference
import { PgSelect } from 'drizzle-orm/pg-core';


// GET /api/merchants - Get merchants, optionally filtered by status (protected)
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const { searchParams } = request.nextUrl;
      const statusParam = searchParams.get("status");

      let validatedStatus: (typeof merchantStatusEnum.enumValues)[number] | undefined;
      if (statusParam) {
        if (merchantStatusEnum.enumValues.includes(statusParam as any)) {
          validatedStatus = statusParam as (typeof merchantStatusEnum.enumValues)[number];
        } else {
          console.warn(
            `Invalid status parameter received: ${statusParam}. Fetching without status filter.`
          );
        }
      }

      // Explicitly type the query builder.
      // This is a general type for a select statement that can be further refined.
      // For `db.select().from(merchants)`, the type would be something like:
      // PgSelect<typeof merchants, any, any, any> - but this can get verbose.
      // Let's try a more general approach that Drizzle's fluent API should handle.
      let query = db.select().from(merchants).$dynamic(); // Using $dynamic() to help with type inference later

      if (validatedStatus) {
        query = query.where(eq(merchants.status, validatedStatus));
      }

      // Apply conditional ORDER BY clause
      if (validatedStatus === "pending_approval") {
        query = query.orderBy(desc(merchants.submittedAt));
      } else {
        query = query.orderBy(desc(merchants.createdAt));
      }
      
      // The type of 'query' should now be a complete and executable select statement
      const fetchedMerchants = await query; 

      return NextResponse.json(fetchedMerchants);
    } catch (dbError: any) { 
      console.error("Error fetching merchants:", dbError);
      return NextResponse.json(
        { error: dbError.message || "Failed to fetch merchants from the database." },
        { status: 500 }
      );
    }
  }
);

// POST handler remains the same as the fully corrected one I provided previously
export const POST = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    console.log(`[API POST /merchants] Admin ${payload.sub} (or relevant ID from payload) attempting to create merchant.`);
    try {
      const body = await request.json();
      const validatedData = createMerchantApiPayloadSchema.parse(body);

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

      const result = await db.transaction(async (tx) => {
        const existingMerchantByEmail = await tx
          .select({ id: merchants.id })
          .from(merchants)
          .where(eq(merchants.contactEmail, email.toLowerCase()))
          .limit(1);

        if (existingMerchantByEmail.length > 0) {
          const err = new Error("A merchant with this email already exists.");
          (err as any).statusCode = 409; 
          throw err;
        }
        
        const internalAccountDisplayId = await generateDisplayId(tx, 'MIA'); 
        const merchantDisplayIdVal = await generateDisplayId(tx, 'MER');

        const [newInternalAccount] = await tx
          .insert(accounts)
          .values({
            displayId: internalAccountDisplayId,
            childName: `${storeName} Internal Acc.`,
            guardianName: contactPerson || `${storeName} System Admin`, 
            status: accountStatusEnum.enumValues[1], 
            accountType: accountTypeEnum.enumValues[1], 
            email: email.toLowerCase(), 
            balance: "0.00",
          })
          .returning({ id: accounts.id, displayId: accounts.displayId });

        if (!newInternalAccount || !newInternalAccount.id) {
          console.error("[API POST /merchants] Failed to create internal account for merchant.");
          throw new Error("Failed to create internal account for merchant.");
        }
        console.log(`[API POST /merchants] Internal account created: ${newInternalAccount.id} (Display ID: ${newInternalAccount.displayId})`);

        const hashedPassword = await hashPassword(password); 

        const merchantInsertData = {
          displayId: merchantDisplayIdVal,
          businessName: storeName,
          contactEmail: email.toLowerCase(),
          hashedPassword: hashedPassword,
          storeAddress: location,
          internalAccountId: newInternalAccount.id,
          contactPerson: contactPerson,
          contactPhone: contactPhoneNumber,
          category: category || null,
          website: website || null,
          description: description || null,
          logoUrl: logoUrl || null,
          status: merchantStatusEnum.enumValues[1], 
        };

        const [insertedMerchant] = await tx
          .insert(merchants)
          .values(merchantInsertData)
          .returning(); 

        if (!insertedMerchant) {
          console.error("[API POST /merchants] Merchant insertion failed, DB returned no result.");
          throw new Error("Merchant insertion failed to return a result.");
        }
        console.log(`[API POST /merchants] Merchant created: ${insertedMerchant.id} (Display ID: ${insertedMerchant.displayId})`);
        return { ...insertedMerchant, internalAccountDisplayId: newInternalAccount.displayId };
      });

      return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
      console.error("[API POST /merchants] Error creating merchant:", {
        message: error.message,
        stack: error.stack,
        code: error.code, 
        detail: error.detail, 
        constraint: error.constraint 
      });

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      if ((error as any).statusCode) {
         return NextResponse.json({ error: error.message }, { status: (error as any).statusCode });
      }
      if (error.code === "23505") { 
        let msg = "A record with a unique identifier already exists.";
        if (error.detail && error.detail.includes(merchants.contactEmail.name)) { 
            msg = "A merchant with this email already exists.";
        } else if (error.detail && error.detail.includes(merchants.displayId.name)){
            msg = "Generated Merchant Display ID conflict. This is rare, please try again.";
        } else if (error.detail && error.detail.includes(accounts.displayId.name)){
            msg = "Generated Account Display ID conflict. This is rare, please try again.";
        }
        return NextResponse.json({ error: msg, detail: error.detail }, { status: 409 });
      }
      if (error.code === '23502') { 
        return NextResponse.json({ error: `A required field was missing or null: ${error.column || 'unknown column'}.`, detail: error.detail }, { status: 500 });
      }
      return NextResponse.json(
        { error: error.message || "Failed to create merchant due to an internal server error." },
        { status: 500 }
      );
    }
  }
);