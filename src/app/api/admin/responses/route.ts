import { NextRequest, NextResponse } from "next/server";
import { getAllResponses, getLocalResponses } from "@/lib/storage";
import { getServiceSupabase, isSupabaseConfigured } from "@/lib/supabase";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const role = searchParams.get("role");
    const surveyId = searchParams.get("surveyId");

    let responses = await getAllResponses();

    if (surveyId && surveyId !== "all") {
      responses = responses.filter((r) => {
        const rSurveyId = (r.metadata?.surveyId as string) || (r.metadata?.survey_id as string);
        if (surveyId === "eng-ai-colleges-2025" || surveyId === "surv_eng_01") {
          return !rSurveyId || rSurveyId === "eng-ai-colleges-2025" || rSurveyId === "surv_eng_01";
        }
        return rSurveyId === surveyId;
      });
    }

    if (role && role !== "all") {
      responses = responses.filter((r) => r.respondent_type === role);
    }

    // Export CSV format
    if (format === "csv") {
      // Collect all question keys across all responses
      const questionKeySet = new Set<string>();
      for (const r of responses) {
        if (r.answers && typeof r.answers === "object") {
          for (const k of Object.keys(r.answers)) {
            questionKeySet.add(k);
          }
        }
      }
      const questionKeys = Array.from(questionKeySet);

      const baseHeaders = [
        "Submission ID",
        "Date",
        "Survey ID",
        "Track / Role",
        "Name",
        "Organization / College",
        "Department",
        "Email",
        "Phone",
        "Pilot Interest",
        "Time Spent (seconds)",
      ];

      const questionHeaders = questionKeys.map((k) => `Question [${k}]`);
      const allHeaders = [...baseHeaders, ...questionHeaders];

      const rows = responses.map((r) => {
        const baseCols = [
          `"${r.id}"`,
          `"${new Date(r.created_at || "").toISOString()}"`,
          `"${(r.metadata?.surveyId || "eng-ai-colleges-2025")}"`,
          `"${r.respondent_type_label || r.respondent_type}"`,
          `"${(r.respondent_name || "").replace(/"/g, '""')}"`,
          `"${(r.college || "").replace(/"/g, '""')}"`,
          `"${(r.department || "").replace(/"/g, '""')}"`,
          `"${(r.email || "").replace(/"/g, '""')}"`,
          `"${(r.phone || "").replace(/"/g, '""')}"`,
          `"${String(r.pilot_interest || "").replace(/"/g, '""')}"`,
          `"${r.time_spent_seconds || 0}"`,
        ];

        const questionCols = questionKeys.map((k) => {
          const val = r.answers?.[k];
          if (val === undefined || val === null) return `""`;
          let str = "";
          if (typeof val === "object") {
            if ("selected" in val) {
              const sel = Array.isArray(val.selected) ? val.selected.join("; ") : String(val.selected);
              str = val.observation ? `${sel} (Note: ${val.observation})` : sel;
            } else if (Array.isArray(val)) {
              str = val.join("; ");
            } else {
              str = Object.entries(val)
                .map(([subK, subV]) => `${subK}: ${Array.isArray(subV) ? subV.join(", ") : subV}`)
                .join(" | ");
            }
          } else {
            str = String(val);
          }
          return `"${str.replace(/"/g, '""')}"`;
        });

        return [...baseCols, ...questionCols].join(",");
      });

      const csvContent = [allHeaders.join(","), ...rows].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="survey-responses-${surveyId || "all"}-${Date.now()}.csv"`,
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
    const clearAll = searchParams.get("clearAll") === "true";

    const DATA_DIR = path.join(process.cwd(), "data");
    const RESPONSES_FILE = path.join(DATA_DIR, "responses.json");

    if (clearAll) {
      if (fs.existsSync(RESPONSES_FILE)) {
        fs.writeFileSync(RESPONSES_FILE, "[]", "utf-8");
      }
      if (isSupabaseConfigured) {
        try {
          const supabase = getServiceSupabase();
          if (supabase) {
            await supabase.from("responses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          }
        } catch (e) {
          console.warn("Notice clearing all responses from Supabase:", e);
        }
      }
      return NextResponse.json({ success: true, message: "All responses wiped clean" });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing response ID" }, { status: 400 });
    }

    // 1. Delete locally
    if (fs.existsSync(RESPONSES_FILE)) {
      const existing = getLocalResponses();
      const filtered = existing.filter((r) => r.id !== id);
      fs.writeFileSync(RESPONSES_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    }

    // 2. Delete from Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const supabase = getServiceSupabase();
        if (supabase) {
          await supabase.from("responses").delete().eq("id", id);
        }
      } catch (e) {
        console.warn("Notice deleting response from Supabase:", e);
      }
    }

    return NextResponse.json({ success: true, message: `Response ${id} deleted` });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete response" }, { status: 500 });
  }
}
