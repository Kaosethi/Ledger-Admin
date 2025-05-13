import { NextResponse } from "next/server";
import mockDataInstance from "@/lib/mockData";
import { withAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import { NextRequest } from "next/server";

// GET /api/registrations/pending - Get all pending registrations
export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    try {
      // Get search parameters from URL
      const searchParams = request.nextUrl.searchParams;
      const search = searchParams.get("search");
      console.log("Pending registrations search param:", search);

      // Default to mock data - in a real app, you would query the database here
      let pendingRegistrations = [...mockDataInstance.pendingRegistrations];

      // Apply search filter if provided
      if (search) {
        console.log("Applying pending registrations search:", search);
        const searchLower = search.toLowerCase();
        pendingRegistrations = pendingRegistrations.filter((registration) => {
          return (
            registration.childName.toLowerCase().includes(searchLower) ||
            registration.guardianName.toLowerCase().includes(searchLower) ||
            (registration.guardianContact &&
              registration.guardianContact.toLowerCase().includes(searchLower))
          );
        });
      }

      console.log(
        `Returning ${pendingRegistrations.length} pending registrations after filtering`
      );
      return NextResponse.json(pendingRegistrations);
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      return NextResponse.json(mockDataInstance.pendingRegistrations);
    }
  }
);

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
