import { SurveyResponse, SurveySummaryStats, RespondentType } from "@/types/survey";
import { getServiceSupabase, isSupabaseConfigured } from "./supabase";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const RESPONSES_FILE = path.join(DATA_DIR, "responses.json");

// Helper to ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read local file responses
export function getLocalResponses(): SurveyResponse[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(RESPONSES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(RESPONSES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading local responses:", err);
    return [];
  }
}

// Write local file responses
export function saveLocalResponse(newResponse: SurveyResponse): void {
  try {
    ensureDataDir();
    const existing = getLocalResponses();
    const index = existing.findIndex((r) => r.id === newResponse.id);
    if (index >= 0) {
      existing[index] = newResponse;
    } else {
      existing.unshift(newResponse);
    }
    fs.writeFileSync(RESPONSES_FILE, JSON.stringify(existing, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local response:", err);
  }
}

// Main save survey response function (Syncs to Supabase and saves locally)
export async function saveSurveyResponse(response: SurveyResponse): Promise<{ success: boolean; id: string; error?: any }> {
  // Always save locally for immediate resilience and offline mode
  saveLocalResponse(response);

  // If Supabase is configured, write to Supabase table
  if (isSupabaseConfigured) {
    try {
      const supabaseAdmin = getServiceSupabase();
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.from("survey_responses").insert({
          id: response.id,
          respondent_type: response.respondent_type,
          respondent_type_label: response.respondent_type_label,
          respondent_name: response.respondent_name,
          college: response.college,
          department: response.department || null,
          role: response.role || null,
          email: response.email,
          phone: response.phone || null,
          answers: response.answers,
          survey_path: response.survey_path,
          pilot_interest: String(response.pilot_interest || false),
          consent: response.consent,
          time_spent_seconds: response.time_spent_seconds || 0,
          metadata: response.metadata || {},
          created_at: response.created_at,
        });

        if (error) {
          console.warn("[Supabase Insert Warning] Could not insert to Supabase, local copy saved:", error.message);
        }
      }
    } catch (err) {
      console.warn("[Supabase Sync Warning] Failed to reach Supabase, local copy maintained:", err);
    }
  }

  return { success: true, id: response.id };
}

// Fetch all responses from Supabase (falling back to local)
export async function getAllResponses(): Promise<SurveyResponse[]> {
  if (isSupabaseConfigured) {
    try {
      const supabaseAdmin = getServiceSupabase();
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from("survey_responses")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            respondent_type: row.respondent_type,
            respondent_type_label: row.respondent_type_label,
            respondent_name: row.respondent_name,
            college: row.college,
            department: row.department,
            role: row.role,
            email: row.email,
            phone: row.phone,
            answers: row.answers || {},
            survey_path: row.survey_path || [],
            pilot_interest: row.pilot_interest === "true" || row.pilot_interest === true ? true : row.pilot_interest,
            consent: row.consent,
            created_at: row.created_at,
            time_spent_seconds: row.time_spent_seconds,
            metadata: row.metadata || {},
          }));
        }
      }
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to local file:", err);
    }
  }

  return getLocalResponses();
}

// Get single response by ID
export async function getResponseById(id: string): Promise<SurveyResponse | null> {
  const all = await getAllResponses();
  return all.find((r) => r.id === id) || null;
}

// Compute comprehensive statistics for dashboard & analytics
export function computeSurveyStats(responses: SurveyResponse[]): SurveySummaryStats {
  const total = responses.length;
  if (total === 0) {
    return {
      totalResponses: 0,
      studentCount: 0,
      facultyCount: 0,
      tpoCount: 0,
      adminCount: 0,
      pilotInterestCount: 0,
      pilotInterestRate: 0,
      topRequestedSupport: [],
      topPainPoints: [],
      willingnessToPay: [],
      timelineSatisfaction: [],
      recentResponses: [],
    };
  }

  let studentCount = 0;
  let facultyCount = 0;
  let tpoCount = 0;
  let adminCount = 0;
  let pilotInterestCount = 0;

  const supportCounts: Record<string, number> = {};
  const painPointCounts: Record<string, number> = {};
  const willingnessCounts: Record<string, number> = {};
  const timelineCounts: Record<string, number> = {};

  responses.forEach((r) => {
    // Persona counts
    if (r.respondent_type === "student") studentCount++;
    else if (r.respondent_type === "faculty") facultyCount++;
    else if (r.respondent_type === "tpo") tpoCount++;
    else if (r.respondent_type === "admin") adminCount++;

    // Pilot interest
    if (
      r.pilot_interest === true ||
      r.pilot_interest === "Yes" ||
      r.pilot_interest === "Maybe" ||
      r.pilot_interest === "Maybe, please call me" ||
      (typeof r.pilot_interest === "string" && r.pilot_interest.toLowerCase().includes("pilot")) ||
      (Array.isArray(r.pilot_interest) && r.pilot_interest.length > 0 && !r.pilot_interest.includes("Not right now"))
    ) {
      pilotInterestCount++;
    }

    // Process support answers
    // Student Q8
    if (r.answers["D8"]) {
      const s = String(r.answers["D8"]);
      supportCounts[s] = (supportCounts[s] || 0) + 1;
    }
    // Faculty Q8
    if (r.answers["B8"]?.primary_support) {
      const s = String(r.answers["B8"].primary_support);
      supportCounts[s] = (supportCounts[s] || 0) + 1;
    }
    // TPO Q7
    if (r.answers["C7"]) {
      const top1 = Array.isArray(r.answers["C7"]) ? r.answers["C7"][0] : r.answers["C7"];
      if (top1) supportCounts[top1] = (supportCounts[top1] || 0) + 1;
    }
    // Admin Q7
    if (r.answers["A7"]) {
      const s = String(r.answers["A7"]);
      supportCounts[s] = (supportCounts[s] || 0) + 1;
    }

    // Process pain points / obstacles
    // Student Q6
    if (r.answers["D6"]) {
      const pts = Array.isArray(r.answers["D6"]) ? r.answers["D6"] : [r.answers["D6"]];
      pts.forEach((p: string) => {
        if (p) painPointCounts[p] = (painPointCounts[p] || 0) + 1;
      });
    }
    // Faculty Q5
    if (r.answers["B5"]) {
      const pts = Array.isArray(r.answers["B5"]) ? r.answers["B5"] : [r.answers["B5"]];
      pts.forEach((p: string) => {
        if (p) painPointCounts[p] = (painPointCounts[p] || 0) + 1;
      });
    }
    // TPO Q4
    if (r.answers["C4"]) {
      const pts = Array.isArray(r.answers["C4"]) ? r.answers["C4"] : [r.answers["C4"]];
      pts.forEach((p: string) => {
        if (p) painPointCounts[p] = (painPointCounts[p] || 0) + 1;
      });
    }
    // Admin Q5
    if (r.answers["A5"]) {
      const pts = Array.isArray(r.answers["A5"]) ? r.answers["A5"] : [r.answers["A5"]];
      pts.forEach((p: string) => {
        if (p) painPointCounts[p] = (painPointCounts[p] || 0) + 1;
      });
    }

    // Willingness to pay
    if (r.answers["D9"]) {
      const w = String(r.answers["D9"]);
      willingnessCounts[w] = (willingnessCounts[w] || 0) + 1;
    }
    if (r.answers["C8"]?.cost_per_student) {
      const w = String(r.answers["C8"].cost_per_student);
      willingnessCounts[w] = (willingnessCounts[w] || 0) + 1;
    }
    if (r.answers["A9"]?.budget_range) {
      const w = String(r.answers["A9"].budget_range);
      willingnessCounts[w] = (willingnessCounts[w] || 0) + 1;
    }

    // Timeline / project completion
    if (r.answers["D5"]) {
      const t = String(r.answers["D5"]);
      timelineCounts[t] = (timelineCounts[t] || 0) + 1;
    }
    if (r.answers["B3"]) {
      const t = String(r.answers["B3"]);
      timelineCounts[t] = (timelineCounts[t] || 0) + 1;
    }
  });

  const topRequestedSupport = Object.entries(supportCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const topPainPoints = Object.entries(painPointCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const willingnessToPay = Object.entries(willingnessCounts)
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => b.count - a.count);

  const timelineSatisfaction = Object.entries(timelineCounts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalResponses: total,
    studentCount,
    facultyCount,
    tpoCount,
    adminCount,
    pilotInterestCount,
    pilotInterestRate: total > 0 ? Math.round((pilotInterestCount / total) * 100) : 0,
    topRequestedSupport,
    topPainPoints,
    willingnessToPay,
    timelineSatisfaction,
    recentResponses: responses.slice(0, 8),
  };
}

// CSV Export Generator
export function generateResponsesCSV(responses: SurveyResponse[]): string {
  if (responses.length === 0) {
    return "ID,Type,Name,College,Department,Role,Email,Phone,Consent,Date,Answers\n";
  }

  const headers = [
    "Response ID",
    "Respondent Type",
    "Full Name",
    "College Name",
    "Department",
    "Role",
    "Email",
    "Phone",
    "Pilot Interest",
    "Consent",
    "Submission Date",
    "Time Spent (sec)",
    "Survey Path Summary",
    "Full Answers JSON",
  ];

  const escapeCSV = (str: string | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = responses.map((r) => {
    const pathSummary = r.survey_path
      .map((p) => `[${p.questionId}] ${p.questionTitle}: ${p.answerSummary}`)
      .join(" | ");

    return [
      escapeCSV(r.id),
      escapeCSV(r.respondent_type_label),
      escapeCSV(r.respondent_name),
      escapeCSV(r.college),
      escapeCSV(r.department || ""),
      escapeCSV(r.role || ""),
      escapeCSV(r.email),
      escapeCSV(r.phone || ""),
      escapeCSV(String(r.pilot_interest || "")),
      escapeCSV(r.consent ? "Yes" : "No"),
      escapeCSV(r.created_at),
      escapeCSV(String(r.time_spent_seconds || 0)),
      escapeCSV(pathSummary),
      escapeCSV(JSON.stringify(r.answers)),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
