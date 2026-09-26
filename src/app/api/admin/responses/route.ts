import { NextRequest, NextResponse } from "next/server";
import { getAllResponses, getLocalResponses } from "@/lib/storage";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const role = searchParams.get("role");

    let responses = await getAllResponses();

    if (role && role !== "all") {
      responses = responses.filter((r) => r.respondent_type === role);
    }

    // Export CSV format
    if (format === "csv") {
      const headers = [
        "Submission ID",
        "Date",
        "Track",
        "Name",
        "College",
        "Department",
        "Role",
        "Email",
        "Phone",
        "Pilot Interest",
        "Consent",
        "Time Spent (seconds)",
      ];

      const rows = responses.map((r) => [
        `"${r.id}"`,
        `"${new Date(r.created_at || "").toISOString()}"`,
        `"${r.respondent_type_label || r.respondent_type}"`,
        `"${(r.respondent_name || "").replace(/"/g, '""')}"`,
        `"${(r.college || "").replace(/"/g, '""')}"`,
        `"${(r.department || "").replace(/"/g, '""')}"`,
        `"${(r.role || "").replace(/"/g, '""')}"`,
        `"${(r.email || "").replace(/"/g, '""')}"`,
        `"${(r.phone || "").replace(/"/g, '""')}"`,
        `"${String(r.pilot_interest || "").replace(/"/g, '""')}"`,
        `"${r.consent ? "Yes" : "No"}"`,
        `"${r.time_spent_seconds || 0}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="kolaba-survey-responses-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: responses.length,
      responses,
    });
  } catch (error: any) {
    console.error("Admin responses fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch survey responses" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing response ID" }, { status: 400 });
    }

    const DATA_DIR = path.join(process.cwd(), "data");
    const RESPONSES_FILE = path.join(DATA_DIR, "responses.json");

    if (fs.existsSync(RESPONSES_FILE)) {
      const existing = getLocalResponses();
      const filtered = existing.filter((r) => r.id !== id);
      fs.writeFileSync(RESPONSES_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    }

    return NextResponse.json({ success: true, message: `Response ${id} deleted` });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete response" }, { status: 500 });
  }
}
