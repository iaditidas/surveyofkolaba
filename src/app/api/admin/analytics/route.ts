import { NextRequest, NextResponse } from "next/server";
import { getAllResponses, computeSurveyStats } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const responses = await getAllResponses();
    const stats = computeSurveyStats(responses);

    return NextResponse.json({
      success: true,
      stats,
      total: responses.length,
    });
  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to generate survey analytics" },
      { status: 500 }
    );
  }
}
