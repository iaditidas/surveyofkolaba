import { SurveySchema, SurveyStatus, QuestionType, SurveySection, SurveyQuestion } from "@/types/schema";
import { getServiceSupabase, isSupabaseConfigured } from "./supabase";
import {
  PERSONA_GATE_QUESTION,
  STUDENT_QUESTIONS,
  FACULTY_QUESTIONS,
  TPO_QUESTIONS,
  ADMIN_QUESTIONS,
} from "./survey-data";
import { QuestionDefinition } from "@/types/survey";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SURVEYS_FILE = path.join(DATA_DIR, "surveys.json");

// Ensure local directory
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Convert uppercase status to valid Postgres enum ('draft', 'published', 'archived', 'paused', 'review')
export function toDbStatus(status: string): string {
  const s = (status || "").toLowerCase();
  if (["draft", "published", "archived", "paused", "review"].includes(s)) {
    return s;
  }
  return "draft";
}

// Convert DB status to SurveyStatus
export function fromDbStatus(status: string): SurveyStatus {
  const s = (status || "").toUpperCase();
  if (["DRAFT", "PUBLISHED", "ARCHIVED", "PAUSED", "REVIEW"].includes(s)) {
    return s as SurveyStatus;
  }
  return "DRAFT";
}

// Helper to convert QuestionDefinition into SurveyQuestion
function toSurveyQuestion(q: QuestionDefinition, order: number): SurveyQuestion {
  const title = typeof q.title === "function" ? q.title({}) : q.title;
  const description =
    typeof q.subtitle === "function"
      ? q.subtitle({})
      : q.subtitle || q.helperText || undefined;

  let type: QuestionType = "single-choice";
  if (q.type === "single-choice") type = "single-choice";
  else if (q.type === "multi-choice") type = "multi-choice";
  else if (q.type === "scale") type = "rating";
  else if (q.type === "ranking") type = "ranking";
  else if (q.type === "text") type = "long-text";
  else if (q.type === "composite") type = "composite";
  else if (q.type === "contact") type = "contact";

  return {
    id: q.id,
    type,
    title,
    description,
    required: true,
    visibility: "VISIBLE",
    order,
    options: q.options?.map((opt) => ({
      id: opt.id,
      label: opt.label,
      sublabel: opt.sublabel,
      icon: opt.icon,
    })),
    min: q.scaleMin,
    max: q.scaleMax,
    minLabel: q.scaleLabels?.min,
    maxLabel: q.scaleLabels?.max,
    subQuestions: q.subQuestions?.map((sq, sqIdx) => ({
      id: sq.id,
      type:
        sq.type === "scale"
          ? "rating"
          : sq.type === "textarea"
          ? "long-text"
          : sq.type === "text"
          ? "short-text"
          : (sq.type as QuestionType),
      title: sq.title,
      description: sq.subtitle,
      placeholder: sq.placeholder,
      required: sq.required ?? true,
      visibility: "VISIBLE",
      order: sqIdx + 1,
      options: sq.options?.map((opt) => ({
        id: opt.id,
        label: opt.label,
        sublabel: opt.sublabel,
      })),
      min: sq.scaleMin,
      max: sq.scaleMax,
      minLabel: sq.scaleLabels?.min,
      maxLabel: sq.scaleLabels?.max,
    })),
  };
}

// The flagship Engineering Colleges AI Survey
export const FLAGSHIP_KOLABA_SURVEY: SurveySchema = {
  id: "eng-ai-colleges-2025",
  slug: "engineering-colleges-program",
  title: "Kolaba Cloud AI — Engineering Colleges Program",
  description:
    "A nationwide academic study mapping compute bottlenecks, GPU laboratory access, GenAI curriculum needs, and placement mentorship for engineering institutions.",
  purpose:
    "Understand the compute and mentorship requirements of Indian engineering colleges before designing sovereign AI cloud lab offerings.",
  industry: "Higher Education & Technology",
  status: "PUBLISHED",
  version: 1,
  company: {
    name: "Kolaba Cloud AI",
    tagline: "Sovereign AI & GPU Infrastructure for India",
    description:
      "Bengaluru-based enterprise AI company powering sovereign GPU compute, applied GenAI infrastructure, and industry-grade research labs for India's leading engineering institutions.",
    industry: "AI / Data / Technology",
    website: "https://kolabacloud.com",
    primaryContactName: "Kolaba Academic Relations",
    primaryContactEmail: "info@kolabacloud.com",
    location: "Bengaluru, Karnataka, India",
    brandPrimaryColor: "#0B132B",
    brandSecondaryColor: "#0D9488",
    logoUrl: "/icons/kolaba_logo.svg",
  },
  settings: {
    allowMultipleResponses: false,
    isAnonymous: false,
    requireEmail: true,
    showProgressIndicator: true,
    showQuestionNumbers: true,
    completionMessage:
      "Thank you for shaping India's Sovereign AI Education ecosystem with Kolaba Cloud!",
    brandColor: "#0D9488",
    estCompletionMinutes: 4,
  },
  sections: [
    {
      id: "sec_gate",
      title: "Role Selection (Gate Question)",
      description: "Select your role to unlock your tailored 10-question survey flow.",
      order: 1,
      visibility: "VISIBLE",
      questions: [toSurveyQuestion(PERSONA_GATE_QUESTION, 1)],
    },
    {
      id: "sec_student",
      title: "Section D: Student / Club Lead Flow",
      description: "Department context, active project domains, compute bottlenecks, and student AI needs.",
      order: 2,
      visibility: "VISIBLE",
      questions: STUDENT_QUESTIONS.map((q, idx) => toSurveyQuestion(q, idx + 1)),
    },
    {
      id: "sec_faculty",
      title: "Section B: HOD / Faculty Flow",
      description: "Institutional AI infrastructure, GPU clusters, curriculum gaps, research compute, and FDP needs.",
      order: 3,
      visibility: "VISIBLE",
      questions: FACULTY_QUESTIONS.map((q, idx) => toSurveyQuestion(q, idx + 1)),
    },
    {
      id: "sec_tpo",
      title: "Section C: Training & Placement Officer Flow",
      description: "Placement trends, recruitment requirements, skill gaps, package differentials, and hiring partnerships.",
      order: 4,
      visibility: "VISIBLE",
      questions: TPO_QUESTIONS.map((q, idx) => toSurveyQuestion(q, idx + 1)),
    },
    {
      id: "sec_admin",
      title: "Section A: Principal / Dean / Administrator Flow",
      description: "Institutional governance, Capex vs Opex budget, accreditation targets, and strategic cloud partnerships.",
      order: 5,
      visibility: "VISIBLE",
      questions: ADMIN_QUESTIONS.map((q, idx) => toSurveyQuestion(q, idx + 1)),
    },
  ],
  logic: [],
  createdAt: "2025-10-01T00:00:00.000Z",
  updatedAt: new Date().toISOString(),
};

// Second sample survey: Customer Feedback Survey (Multi-industry demonstration)
export const SAMPLE_CUSTOMER_SURVEY: SurveySchema = {
  id: "surv_saas_csat_01",
  slug: "customer-feedback-survey",
  title: "Product Experience & Customer Feedback",
  description: "Help us understand your workflow efficiency, NPS satisfaction, and feature priorities.",
  purpose: "Continuous discovery to refine developer tool speed, accuracy, and support responsiveness.",
  industry: "Enterprise SaaS & Cloud",
  status: "PUBLISHED",
  version: 1,
  company: {
    name: "Apex Cloud Technologies",
    tagline: "Enterprise Cloud Infrastructure Solutions",
    description: "Provider of high-reliability cloud orchestration tools for engineering teams worldwide.",
    industry: "Enterprise Cloud",
    website: "https://apexcloud.example.com",
    primaryContactName: "Apex Product Team",
    primaryContactEmail: "product@apexcloud.example.com",
    location: "Mumbai, India",
    brandPrimaryColor: "#1E293B",
    brandSecondaryColor: "#3B82F6",
  },
  settings: {
    allowMultipleResponses: false,
    isAnonymous: false,
    requireEmail: true,
    showProgressIndicator: true,
    showQuestionNumbers: true,
    completionMessage: "Thank you for your feedback! Our engineering leads review each submission weekly.",
    brandColor: "#3B82F6",
    estCompletionMinutes: 3,
  },
  sections: [
    {
      id: "sec_nps_eval",
      title: "1. Core Satisfaction & Utility",
      order: 1,
      visibility: "VISIBLE",
      questions: [
        {
          id: "nps_rating",
          type: "linear-scale",
          title: "How likely are you to recommend our platform to a colleague?",
          min: 0,
          max: 10,
          minLabel: "Not Likely",
          maxLabel: "Extremely Likely",
          required: true,
          visibility: "VISIBLE",
          order: 1,
        },
        {
          id: "primary_use_case",
          type: "single-choice",
          title: "What is your team's primary use case?",
          required: true,
          visibility: "VISIBLE",
          order: 2,
          options: [
            { id: "dev_testing", label: "Dev & Automated Testing" },
            { id: "prod_deploy", label: "Production Microservices Deployment" },
            { id: "ai_inference", label: "AI Model Serving & Inference" },
            { id: "cost_opt", label: "Cloud Cost Optimization" },
          ],
        },
        {
          id: "feature_wishes",
          type: "long-text",
          title: "What is one feature we should build next to accelerate your team?",
          placeholder: "Share your top priority...",
          required: false,
          visibility: "VISIBLE",
          order: 3,
        },
      ],
    },
  ],
  logic: [],
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: new Date().toISOString(),
};

// Initial default catalog
const INITIAL_CATALOG: SurveySchema[] = [
  FLAGSHIP_KOLABA_SURVEY,
  SAMPLE_CUSTOMER_SURVEY,
];

// Read local surveys
export function getLocalSurveys(): SurveySchema[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(SURVEYS_FILE)) {
      fs.writeFileSync(SURVEYS_FILE, JSON.stringify(INITIAL_CATALOG, null, 2), "utf-8");
      return INITIAL_CATALOG;
    }
    const raw = fs.readFileSync(SURVEYS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(SURVEYS_FILE, JSON.stringify(INITIAL_CATALOG, null, 2), "utf-8");
      return INITIAL_CATALOG;
    }

    // Ensure the flagship survey is always present, published, and titled properly
    const flagshipIdx = parsed.findIndex(
      (s) => s.id === FLAGSHIP_KOLABA_SURVEY.id || s.slug === FLAGSHIP_KOLABA_SURVEY.slug || s.title?.includes("Engineering Colleges")
    );
    if (flagshipIdx === -1) {
      parsed.unshift(FLAGSHIP_KOLABA_SURVEY);
      fs.writeFileSync(SURVEYS_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    } else {
      // Keep flagship metadata and questions perfectly synchronized
      parsed[flagshipIdx] = {
        ...FLAGSHIP_KOLABA_SURVEY,
        ...parsed[flagshipIdx],
        id: FLAGSHIP_KOLABA_SURVEY.id,
        slug: FLAGSHIP_KOLABA_SURVEY.slug,
        title: FLAGSHIP_KOLABA_SURVEY.title,
        status: "PUBLISHED",
        company: FLAGSHIP_KOLABA_SURVEY.company,
        sections: FLAGSHIP_KOLABA_SURVEY.sections,
      };
      fs.writeFileSync(SURVEYS_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }

    return parsed;
  } catch (err) {
    console.error("Error reading local surveys:", err);
    return INITIAL_CATALOG;
  }
}

// Write local surveys
export function saveLocalSurveys(surveys: SurveySchema[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(SURVEYS_FILE, JSON.stringify(surveys, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local surveys:", err);
  }
}

// Fetch all surveys with full Supabase integration & local fallback
export async function getRelationalSurveys(): Promise<SurveySchema[]> {
  const localSurveys = getLocalSurveys();

  if (isSupabaseConfigured) {
    try {
      const supabaseAdmin = getServiceSupabase();
      if (supabaseAdmin) {
        // Query normalized relational tables from Supabase
        const { data: dbSurveys, error } = await supabaseAdmin
          .from("surveys")
          .select(`
            id,
            title,
            slug,
            description,
            industry,
            status,
            logo_url,
            created_at,
            updated_at,
            survey_versions (
              id,
              version_number,
              status,
              created_at,
              published_at,
              survey_sections (
                id,
                title,
                description,
                created_at,
                questions (
                  id,
                  question_text,
                  question_type,
                  description,
                  placeholder,
                  required,
                  settings,
                  created_at,
                  updated_at,
                  question_options (
                    id,
                    value,
                    created_at
                  )
                )
              ),
              logic_rules (
                id,
                source_question_id,
                target_question_id,
                target_section_id,
                action,
                operator,
                created_at
              )
            ),
            survey_settings (
              id,
              allow_multiple_responses,
              require_email,
              show_progress,
              show_question_numbers,
              redirect_url,
              created_at,
              updated_at
            )
          `)
          .order("updated_at", { ascending: false });

        if (!error && Array.isArray(dbSurveys) && dbSurveys.length > 0) {
          // Map DB relational entities to SurveySchema
          const mapped: SurveySchema[] = dbSurveys.map((d: any) => {
            const latestVersion = (d.survey_versions || [])[0] || {};
            const sections: SurveySection[] = (latestVersion.survey_sections || []).map(
              (sec: any, secIdx: number) => ({
                id: sec.id,
                title: sec.title || `Section ${secIdx + 1}`,
                description: sec.description || "",
                order: secIdx + 1,
                visibility: "VISIBLE",
                questions: (sec.questions || []).map((q: any, qIdx: number) => ({
                  id: q.id,
                  type: (q.question_type as QuestionType) || "short-text",
                  title: q.question_text || "Question",
                  description: q.description || "",
                  required: Boolean(q.required),
                  placeholder: q.placeholder || "",
                  visibility: "VISIBLE",
                  order: qIdx + 1,
                  options: (q.question_options || []).map((opt: any) => ({
                    id: opt.id,
                    label: opt.value || "",
                    value: opt.value || "",
                  })),
                  settings: q.settings || {},
                })),
              })
            );

            const settings = d.survey_settings?.[0] || {};
            const localMatch = localSurveys.find((ls) => ls.id === d.id || ls.slug === d.slug);

            return {
              id: d.id,
              slug: d.slug || d.id,
              title: d.title,
              description: d.description || "",
              purpose: localMatch?.purpose || d.description || "",
              industry: d.industry || "General",
              status: fromDbStatus(d.status),
              version: latestVersion.version_number || 1,
              company: localMatch?.company || {
                name: d.title?.includes("Kolaba") ? "Kolaba Cloud AI" : "Organization",
                industry: d.industry || "General",
                logoUrl: d.logo_url || undefined,
              },
              sections,
              logic: [],
              settings: {
                allowMultipleResponses: Boolean(settings.allow_multiple_responses),
                isAnonymous: false,
                requireEmail: Boolean(settings.require_email ?? true),
                showProgressIndicator: Boolean(settings.show_progress ?? true),
                showQuestionNumbers: Boolean(settings.show_question_numbers ?? true),
                completionMessage: localMatch?.settings?.completionMessage || "Thank you for participating!",
                brandColor: localMatch?.settings?.brandColor || "#0D9488",
                estCompletionMinutes: localMatch?.settings?.estCompletionMinutes || 4,
              },
              createdAt: d.created_at,
              updatedAt: d.updated_at,
            };
          });

          // Merge: ensure local surveys like the flagship survey are also available
          for (const ls of localSurveys) {
            if (!mapped.some((m) => m.id === ls.id || m.slug === ls.slug)) {
              mapped.push(ls);
            }
          }

          return mapped;
        }
      }
    } catch (err) {
      console.warn("Supabase fetch notice, maintaining local catalog:", err);
    }
  }

  return localSurveys;
}

// Get single survey by ID or Slug
export async function getRelationalSurveyById(idOrSlug: string): Promise<SurveySchema | null> {
  const surveys = await getRelationalSurveys();
  const directMatch = surveys.find(
    (s) =>
      s.id === idOrSlug ||
      s.slug === idOrSlug ||
      (s.title && s.title.toLowerCase().replace(/\s+/g, "-") === idOrSlug.toLowerCase())
  );
  if (directMatch) return directMatch;

  // Handle common aliases for the primary Kolaba Cloud AI survey
  const normalized = (idOrSlug || "").toLowerCase().trim();
  const kolabaAliases = [
    "eng-ai-colleges-2025",
    "engineering",
    "engineering-colleges-program",
    "kolaba",
    "kolaba-cloud",
    "kolaba-cloud-ai",
    "kolabacloud",
    "kolaba-survey",
    "current",
    "default",
  ];
  if (kolabaAliases.includes(normalized) || (normalized.includes("kolaba") && normalized.includes("college"))) {
    return surveys.find((s) => s.id === FLAGSHIP_KOLABA_SURVEY.id) || surveys[0] || null;
  }

  return null;
}

// Save or Update a Survey across local & Supabase
export async function saveRelationalSurvey(
  survey: SurveySchema
): Promise<{ success: boolean; survey: SurveySchema }> {
  const localSurveys = getLocalSurveys();
  const existingIdx = localSurveys.findIndex(
    (s) => s.id === survey.id || (survey.slug && s.slug === survey.slug)
  );

  const updatedSurvey: SurveySchema = {
    ...survey,
    slug: survey.slug || survey.id,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    localSurveys[existingIdx] = updatedSurvey;
  } else {
    localSurveys.unshift(updatedSurvey);
  }

  saveLocalSurveys(localSurveys);

  // Sync to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const supabaseAdmin = getServiceSupabase();
      if (supabaseAdmin) {
        // Upsert into surveys table
        const dbStatus = toDbStatus(updatedSurvey.status);
        const { error: surveyErr } = await supabaseAdmin.from("surveys").upsert(
          {
            id: updatedSurvey.id,
            title: updatedSurvey.title,
            slug: updatedSurvey.slug,
            description: updatedSurvey.description,
            industry: updatedSurvey.industry || updatedSurvey.company?.industry || "General",
            status: dbStatus,
            logo_url: updatedSurvey.company?.logoUrl || null,
            updated_at: updatedSurvey.updatedAt,
          },
          { onConflict: "id" }
        );

        if (surveyErr) {
          console.warn("[Supabase Notice - surveys upsert]:", surveyErr.message);
        }

        // Upsert version
        const versionId = `ver_${updatedSurvey.id}_${updatedSurvey.version || 1}`;
        await supabaseAdmin.from("survey_versions").upsert(
          {
            id: versionId,
            survey_id: updatedSurvey.id,
            version_number: updatedSurvey.version || 1,
            status: dbStatus,
            published_at: dbStatus === "published" ? new Date().toISOString() : null,
          },
          { onConflict: "id" }
        );

        // Upsert sections & questions
        if (Array.isArray(updatedSurvey.sections)) {
          for (let secIdx = 0; secIdx < updatedSurvey.sections.length; secIdx++) {
            const sec = updatedSurvey.sections[secIdx];
            const secId = sec.id || `sec_${updatedSurvey.id}_${secIdx + 1}`;
            await supabaseAdmin.from("survey_sections").upsert(
              {
                id: secId,
                survey_version_id: versionId,
                title: sec.title,
                description: sec.description || null,
              },
              { onConflict: "id" }
            );

            if (Array.isArray(sec.questions)) {
              for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
                const q = sec.questions[qIdx];
                const qId = q.id || `q_${secId}_${qIdx + 1}`;
                await supabaseAdmin.from("questions").upsert(
                  {
                    id: qId,
                    section_id: secId,
                    question_text: q.title,
                    question_type: q.type || "short-text",
                    description: q.description || null,
                    placeholder: q.placeholder || null,
                    required: Boolean(q.required),
                    settings: q.options ? { options: q.options } : {},
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "id" }
                );

                if (Array.isArray(q.options)) {
                  for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
                    const opt = q.options[optIdx];
                    const optId = opt.id || `opt_${qId}_${optIdx + 1}`;
                    await supabaseAdmin.from("question_options").upsert(
                      {
                        id: optId,
                        question_id: qId,
                        value: opt.label || opt.value || "",
                      },
                      { onConflict: "id" }
                    );
                  }
                }
              }
            }
          }
        }

        // Upsert settings
        await supabaseAdmin.from("survey_settings").upsert(
          {
            survey_id: updatedSurvey.id,
            allow_multiple_responses: Boolean(updatedSurvey.settings?.allowMultipleResponses),
            require_email: Boolean(updatedSurvey.settings?.requireEmail),
            show_progress: Boolean(updatedSurvey.settings?.showProgressIndicator),
            show_question_numbers: Boolean(updatedSurvey.settings?.showQuestionNumbers),
            redirect_url: updatedSurvey.settings?.redirectUrl || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "survey_id" }
        );
      }
    } catch (err) {
      console.warn("[Supabase Sync Notice - local copy maintained]:", err);
    }
  }

  return { success: true, survey: updatedSurvey };
}

// Delete / Archive a Survey
export async function deleteRelationalSurvey(id: string): Promise<boolean> {
  const surveys = getLocalSurveys();
  const filtered = surveys.filter((s) => s.id !== id && s.slug !== id);
  if (filtered.length === surveys.length) return false;

  saveLocalSurveys(filtered);

  if (isSupabaseConfigured) {
    try {
      const supabaseAdmin = getServiceSupabase();
      if (supabaseAdmin) {
        await supabaseAdmin.from("surveys").delete().eq("id", id);
      }
    } catch {
      // local safe
    }
  }

  return true;
}
