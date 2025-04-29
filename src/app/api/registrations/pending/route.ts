import { NextResponse } from "next/server";
import mockDataInstance from "@/lib/mockData";

// GET /api/registrations/pending - Get all pending registrations
export async function GET(request: Request, context: any) {
  try {
    // For this endpoint, we'll just return mock data directly
    // In a real implementation, you would query your database
    return NextResponse.json(mockDataInstance.pendingRegistrations);
  } catch (error) {
    console.error("Error fetching pending registrations:", error);
    return NextResponse.json(mockDataInstance.pendingRegistrations);
  }
}

// POST /api/registrations/pending - Create a new pending registration
export async function POST(request: Request, context: any) {
  try {
    const body = await request.json();

    // Generate a unique ID for the registration
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 5);
    const registrationId = `PEN-${timestamp}-${randomString}`;

    // Create the new registration with submitted data
    const newRegistration = {
      ...body,
      id: registrationId,
      submittedAt: new Date().toISOString(),
      status: "Pending",
    };

    // In a real implementation, you would save this to your database
    // For our mock implementation, we'll just return the new registration

    return NextResponse.json(newRegistration, { status: 201 });
  } catch (error) {
    console.error("Error creating pending registration:", error);
    return NextResponse.json(
      { error: "Failed to create pending registration" },
      { status: 500 }
    );
  }
}
