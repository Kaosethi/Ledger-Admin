import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/project-settings?project=STC
export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get("project");
  if (!project) {
    return NextResponse.json({ error: "Project is required" }, { status: 400 });
  }
  const settings = await db.select().from(projectSettings).where(eq(projectSettings.project, project));
  return NextResponse.json({ project, settings });
}

// PUT /api/project-settings
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { project, key, value } = body;
  if (!project || !key || typeof value === "undefined") {
    return NextResponse.json({ error: "project, key, and value are required" }, { status: 400 });
  }
  // Upsert logic
  await db
    .insert(projectSettings)
    .values({ project, key, value })
    .onConflictDoUpdate({ target: [projectSettings.project, projectSettings.key], set: { value } });
  return NextResponse.json({ success: true });
}
