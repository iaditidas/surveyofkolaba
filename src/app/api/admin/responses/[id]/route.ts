import { NextRequest, NextResponse } from "next/server";
import { getResponseById } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const response = await getResponseById(id);

    if (!response) {
      return NextResponse.json(
        { error: "Survey response not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error("Error fetching single response:", error);
    return NextResponse.json(
      { error: "Failed to fetch response details", details: error.message },
      { status: 500 }
    );
  }
}
