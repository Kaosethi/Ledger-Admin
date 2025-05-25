// src/app/api/merchants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  merchants,
  merchantStatusEnum,
  createMerchantSchema,
} from "@/lib/db/schema";
import { z } from "zod";
import { withAuth } from '@/lib/audit'; // Assuming this handles admin authentication
import { JWTPayload } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";

// Drizzle imports
import { eq, SQL, desc } from "drizzle-orm";
import { PgSelect } from "drizzle-orm/pg-core"; // General select type for explicit typing

// GET /api/merchants - Get merchants, optionally filtered by status (protected)
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const { searchParams } = request.nextUrl;
      const statusParam = searchParams.get("status");

      let validatedStatus:
        | (typeof merchantStatusEnum.enumValues)[number]
        | undefined;
      if (statusParam) {
        if (merchantStatusEnum.enumValues.includes(statusParam as any)) {
          validatedStatus =
            statusParam as (typeof merchantStatusEnum.enumValues)[number];
        } else {
          console.warn(
            `Invalid status parameter received: ${statusParam}. Fetching without status filter or as per default.`
          );
        }
      }

      // Explicitly type 'finalQuery'.
      // The generic arguments for PgSelect might need adjustment if this exact signature isn't perfect
      // for your Drizzle version, but it's a common base.
      // TTable, TSelection, TSelectMode, TPartial
      let finalQuery; // Let TypeScript infer the type

      if (validatedStatus) {
        finalQuery = db
          .select()
          .from(merchants)
          .where(eq(merchants.status, validatedStatus));
      } else {
        finalQuery = db.select().from(merchants);
      }

      if (validatedStatus === "pending_approval") {
        finalQuery = finalQuery.orderBy(desc(merchants.submittedAt));
      } else {
        finalQuery = finalQuery.orderBy(desc(merchants.createdAt));
      }

      const fetchedMerchants = await finalQuery;

      return NextResponse.json(fetchedMerchants);
    } catch (dbError) {
      console.error("Error fetching merchants:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch merchants from the database." },
        { status: 500 }
      );
    }
  }
);

// POST /api/merchants - Create a new merchant (protected by admin auth)
export const POST = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const body = await request.json();
      const validatedData = createMerchantSchema.parse(body);

      // Use 'any' type to avoid TypeScript errors with optional fields
      const dataToInsert: any = {
        businessName: validatedData.businessName,
      };

      if (validatedData.contactEmail) {
        dataToInsert.contactEmail = validatedData.contactEmail;
      }
      if (validatedData.category) {
        dataToInsert.category = validatedData.category;
      }

      if (validatedData.password) {
        dataToInsert.hashedPassword = await hashPassword(
          validatedData.password
        );
      }

      const newMerchant = await db
        .insert(merchants)
        .values(dataToInsert)
        .returning();

      if (!newMerchant || newMerchant.length === 0) {
        console.error(
          "[API POST /merchants] Merchant insertion failed to return a result."
        );
        throw new Error("Merchant insertion failed to return a result.");
      }

      return NextResponse.json(newMerchant[0], { status: 201 });
    } catch (error: any) {
      console.error("Error creating merchant:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.format() },
          { status: 400 }
        );
      }
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "A merchant with this email or other unique identifier already exists.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to create merchant" },
        { status: 500 }
      );
    }
  }
);
