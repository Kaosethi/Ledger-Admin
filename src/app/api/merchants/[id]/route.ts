import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/merchants/[id] - Get a specific merchant by ID
export async function GET(request: Request, context: any) {
  try {
    const merchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, context.params.id));

    if (!merchant.length) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(merchant[0]);
  } catch (error) {
    console.error("Error fetching merchant:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant" },
      { status: 500 }
    );
  }
}

// PATCH /api/merchants/[id] - Update a merchant
export async function PATCH(request: Request, context: any) {
  try {
    const body = await request.json();

    // Update merchant
    const updatedMerchant = await db
      .update(merchants)
      .set(body)
      .where(eq(merchants.id, context.params.id))
      .returning();

    if (!updatedMerchant.length) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedMerchant[0]);
  } catch (error) {
    console.error("Error updating merchant:", error);
    return NextResponse.json(
      { error: "Failed to update merchant" },
      { status: 500 }
    );
  }
}
