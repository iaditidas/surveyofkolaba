import { SurveySchema } from "@/types/schema";
import {
  getRelationalSurveys,
  getRelationalSurveyById,
  saveRelationalSurvey,
  deleteRelationalSurvey,
  getLocalSurveys as getLocalRelationalSurveys,
  saveLocalSurveys as saveLocalRelationalSurveys,
  FLAGSHIP_KOLABA_SURVEY,
} from "./surveyRelationalService";
import { getAllResponses } from "./storage";

export { FLAGSHIP_KOLABA_SURVEY };

// Read local surveys
export function getLocalSurveys(): SurveySchema[] {
  return getLocalRelationalSurveys();
}

// Save local surveys
export function saveLocalSurveys(surveys: SurveySchema[]): void {
  saveLocalRelationalSurveys(surveys);
}

// Fetch all surveys with dynamic question and response counts
export async function getAllSurveys(): Promise<SurveySchema[]> {
  const [surveys, responses] = await Promise.all([
    getRelationalSurveys(),
    getAllResponses().catch(() => []),
  ]);

  // Aggregate responses per survey
  const responseCountMap: Record<string, number> = {};
  for (const r of responses) {
    const sId = (r.metadata?.surveyId as string) || "eng-ai-colleges-2025";
    responseCountMap[sId] = (responseCountMap[sId] || 0) + 1;
    // Map alias
    if (sId === "eng-ai-colleges-2025" || sId === "surv_eng_01" || sId === "engineering-colleges-program") {
      responseCountMap["eng-ai-colleges-2025"] = (responseCountMap["eng-ai-colleges-2025"] || 0);
      responseCountMap["surv_eng_01"] = (responseCountMap["surv_eng_01"] || 0);
    }
  }

  const mappedSurveys = surveys.map((s) => {
    // Total questions in this survey
    let totalQuestions = 0;
    if (Array.isArray(s.sections)) {
      for (const sec of s.sections) {
        totalQuestions += sec.questions?.length || 0;
      }
    }

    const count =
      responseCountMap[s.id] ||
      (s.slug ? responseCountMap[s.slug] : 0) ||
      (s.id === "eng-ai-colleges-2025" || s.id === "surv_eng_01" ? responses.length : 0);

    return {
      ...s,
      responseCount: count,
      settings: {
        ...s.settings,
        estCompletionMinutes: s.settings?.estCompletionMinutes || Math.max(2, Math.ceil(totalQuestions * 0.4)),
      },
    };
  });

  // Ensure Kolaba Flagship survey is always #1 at the top of the platform
  return mappedSurveys.sort((a, b) => {
    const isKolabaA = a.id === "eng-ai-colleges-2025" || a.title?.includes("Kolaba") || a.company?.name?.includes("Kolaba");
    const isKolabaB = b.id === "eng-ai-colleges-2025" || b.title?.includes("Kolaba") || b.company?.name?.includes("Kolaba");
    if (isKolabaA && !isKolabaB) return -1;
    if (!isKolabaA && isKolabaB) return 1;
    return 0;
  });
}

// Get single survey by ID or Slug
export async function getSurveyById(id: string): Promise<SurveySchema | null> {
  const survey = await getRelationalSurveyById(id);
  if (!survey) return null;

  const responses = await getAllResponses().catch(() => []);
  const count = responses.filter(
    (r) =>
      (r.metadata?.surveyId === survey.id) ||
      (r.metadata?.surveyId === survey.slug) ||
      (survey.id === "eng-ai-colleges-2025" && (!r.metadata?.surveyId || r.metadata?.surveyId === "eng-ai-colleges-2025"))
  ).length;

  return {
    ...survey,
    responseCount: count,
  };
}

// Save or Update a Survey
export async function saveSurvey(
  survey: SurveySchema
): Promise<{ success: boolean; survey: SurveySchema }> {
  return saveRelationalSurvey(survey);
}

// Delete a Survey
export async function deleteSurvey(id: string): Promise<boolean> {
  return deleteRelationalSurvey(id);
}
