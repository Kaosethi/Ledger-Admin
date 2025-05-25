import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { administrators } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from '@/lib/audit';
import { JWTPayload } from "@/lib/auth/jwt";

// GET /api/administrators/[id] - Get a specific administrator by ID (protected)
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const admin = await db
        .select()
        .from(administrators)
        .where(eq(administrators.id, context.params.id));

      if (!admin.length) {
        return NextResponse.json(
          { error: "Administrator not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(admin[0]);
    } catch (error) {
      console.error("Error fetching administrator:", error);
      return NextResponse.json(
        { error: "Failed to fetch administrator" },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/administrators/[id] - Update an administrator (protected)
export const PATCH = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const body = await request.json();

      // Update administrator
      const updatedAdmin = await db
        .update(administrators)
        .set(body)
        .where(eq(administrators.id, context.params.id))
        .returning();

      if (!updatedAdmin.length) {
        return NextResponse.json(
          { error: "Administrator not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(updatedAdmin[0]);
    } catch (error) {
      console.error("Error updating administrator:", error);
      return NextResponse.json(
        { error: "Failed to update administrator" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/administrators/[id] - Delete an administrator (protected)
export const DELETE = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      const deletedAdmin = await db
        .delete(administrators)
        .where(eq(administrators.id, context.params.id))
        .returning();

      if (!deletedAdmin.length) {
        return NextResponse.json(
          { error: "Administrator not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(deletedAdmin[0]);
    } catch (error) {
      console.error("Error deleting administrator:", error);
      return NextResponse.json(
        { error: "Failed to delete administrator" },
        { status: 500 }
      );
    }
  }
);
