import { NextRequest, NextResponse } from "next/server";
import { getSurveyById, saveSurvey, deleteSurvey } from "@/lib/surveyStorage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const survey = await getSurveyById(id);
    if (!survey) {
      return NextResponse.json(
        { success: false, error: "Survey not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, survey });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get survey" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await getSurveyById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Survey not found" },
        { status: 404 }
      );
    }

    const updated = {
      ...existing,
      ...body,
      id, // Preserve ID
      version: (existing.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };

    const result = await saveSurvey(updated);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update survey" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteSurvey(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Survey not found or could not be deleted" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Survey deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete survey" },
      { status: 500 }
    );
  }
}
