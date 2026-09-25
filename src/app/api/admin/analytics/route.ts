import { NextResponse } from "next/server";
import { getAllResponses, computeSurveyStats } from "@/lib/storage";

export async function GET() {
  try {
    const responses = await getAllResponses();
    const stats = computeSurveyStats(responses);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("Error computing analytics:", error);
    return NextResponse.json(
      { error: "Failed to compute analytics", details: error.message },
      { status: 500 }
    );
  }
}
