import { NextRequest, NextResponse } from "next/server";
import { getAllResponses, generateResponsesCSV } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.toLowerCase();
    const college = searchParams.get("college")?.toLowerCase();
    const format = searchParams.get("format");
    const pilotOnly = searchParams.get("pilotOnly") === "true";

    let responses = await getAllResponses();

    // Filter by type
    if (type && type !== "all") {
      responses = responses.filter((r) => r.respondent_type === type);
    }

    // Filter by pilot interest
    if (pilotOnly) {
      responses = responses.filter((r) => {
        const val: any = r.pilot_interest;
        if (!val) return false;
        if (typeof val === "boolean") return val;
        if (typeof val === "string") {
          return (
            val !== "No" &&
            val !== "Not right now" &&
            val !== "false"
          );
        }
        if (Array.isArray(val)) {
          return (
            val.length > 0 &&
            !val.includes("Not right now")
          );
        }
        return false;
      });
    }

    // Filter by search query
    if (search) {
      responses = responses.filter(
        (r) =>
          r.respondent_name?.toLowerCase().includes(search) ||
          r.college?.toLowerCase().includes(search) ||
          r.email?.toLowerCase().includes(search) ||
          r.department?.toLowerCase().includes(search)
      );
    }

    // Filter by college
    if (college) {
      responses = responses.filter((r) =>
        r.college?.toLowerCase().includes(college)
      );
    }

    // Return CSV if requested
    if (format === "csv") {
      const csv = generateResponsesCSV(responses);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="kolaba-survey-responses-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      total: responses.length,
      responses,
    });
  } catch (error: any) {
    console.error("Admin responses fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load responses", details: error.message },
      { status: 500 }
    );
  }
}
