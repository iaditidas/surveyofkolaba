import { NextRequest, NextResponse } from "next/server";
import { getAllResponses } from "@/lib/storage";
import { getAllSurveys, getSurveyById } from "@/lib/surveyStorage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const surveyId = searchParams.get("surveyId");

    const [allSurveys, allResponses] = await Promise.all([
      getAllSurveys(),
      getAllResponses(),
    ]);

    // If surveyId not specified, choose the first available survey
    const targetSurveyId = surveyId || (allSurveys.length > 0 ? allSurveys[0].id : null);

    if (!targetSurveyId) {
      return NextResponse.json({
        success: true,
        totalSurveys: allSurveys.length,
        totalResponses: allResponses.length,
        stats: null,
      });
    }

    const currentSurvey = await getSurveyById(targetSurveyId);
    if (!currentSurvey) {
      return NextResponse.json(
        { success: false, error: "Survey not found" },
        { status: 404 }
      );
    }

    // Filter responses strictly for this survey
    let surveyResponses = allResponses.filter((r) => {
      const rSurveyId = (r.metadata?.surveyId as string) || (r.metadata?.survey_id as string);
      if (targetSurveyId === "eng-ai-colleges-2025" || targetSurveyId === "surv_eng_01") {
        return !rSurveyId || rSurveyId === "eng-ai-colleges-2025" || rSurveyId === "surv_eng_01";
      }
      return rSurveyId === targetSurveyId || rSurveyId === currentSurvey.slug;
    });

    const role = searchParams.get("role");
    if (role && role !== "all") {
      surveyResponses = surveyResponses.filter((r) => r.respondent_type === role);
    }

    const totalResponses = surveyResponses.length;

    // Track breakdown counts
    const roleCounts: Record<string, number> = {
      student: 0,
      faculty: 0,
      tpo: 0,
      admin: 0,
    };
    for (const r of surveyResponses) {
      if (r.respondent_type && roleCounts[r.respondent_type] !== undefined) {
        roleCounts[r.respondent_type]++;
      }
    }

    // Time spent computation
    let totalSeconds = 0;
    let timedCount = 0;
    for (const r of surveyResponses) {
      if (r.time_spent_seconds && r.time_spent_seconds > 0) {
        totalSeconds += r.time_spent_seconds;
        timedCount++;
      }
    }
    const avgTimeSpentSeconds = timedCount > 0 ? Math.round(totalSeconds / timedCount) : 180;

    // Timeline trends (grouped by date)
    const timelineMap: Record<string, number> = {};
    for (const r of surveyResponses) {
      const dateStr = r.created_at ? new Date(r.created_at).toISOString().split("T")[0] : "Recent";
      timelineMap[dateStr] = (timelineMap[dateStr] || 0) + 1;
    }
    const timeline = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Dynamic question-level stats based on current survey's actual sections & questions
    const questionStats: any[] = [];

    // Helper to process a question or subquestion
    const processQuestion = (
      qDef: any,
      sectionTitle: string,
      answersList: any[],
      parentTitle?: string
    ) => {
      const validAnswers = answersList.filter((a) => a !== undefined && a !== null && a !== "");
      const answeredCount = validAnswers.length;

      const stat: any = {
        id: qDef.id,
        title: parentTitle ? `${parentTitle} → ${qDef.title}` : qDef.title,
        description: qDef.description,
        type: qDef.type,
        sectionTitle: sectionTitle,
        answeredCount,
        responseRate: totalResponses > 0 ? Math.round((answeredCount / totalResponses) * 100) : 0,
      };

      // Extract observations if any
      const observations: string[] = [];
      const extractedValues: any[] = [];

      for (const raw of validAnswers) {
        if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
          if (raw.observation && typeof raw.observation === "string" && raw.observation.trim()) {
            observations.push(raw.observation.trim());
          }
          if ("selected" in raw) {
            extractedValues.push(raw.selected);
          } else {
            extractedValues.push(raw);
          }
        } else {
          extractedValues.push(raw);
        }
      }

      if (observations.length > 0) {
        stat.observations = observations.slice(0, 10);
      }

      const qType = qDef.type;

      if (qType === "single-choice" || qType === "dropdown" || qType === "yes-no") {
        const counts: Record<string, number> = {};
        if (qDef.options) {
          for (const opt of qDef.options) {
            counts[opt.label || opt.id] = 0;
          }
        } else if (qType === "yes-no") {
          counts["Yes"] = 0;
          counts["No"] = 0;
        }

        for (const val of extractedValues) {
          const strVal = String(val);
          const matchedOpt = qDef.options?.find((o: any) => o.id === strVal || o.label === strVal);
          const label = matchedOpt ? matchedOpt.label : strVal;
          counts[label] = (counts[label] || 0) + 1;
        }

        stat.distribution = Object.entries(counts).map(([label, count]) => ({
          label,
          count,
          percentage: answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0,
        }));
      } else if (qType === "multi-choice" || qType === "ranking") {
        const counts: Record<string, number> = {};
        if (qDef.options) {
          for (const opt of qDef.options) {
            counts[opt.label || opt.id] = 0;
          }
        }

        for (const val of extractedValues) {
          const items = Array.isArray(val) ? val : [val];
          for (const item of items) {
            const strVal = String(item);
            const matchedOpt = qDef.options?.find((o: any) => o.id === strVal || o.label === strVal);
            const label = matchedOpt ? matchedOpt.label : strVal;
            counts[label] = (counts[label] || 0) + 1;
          }
        }

        stat.distribution = Object.entries(counts).map(([label, count]) => ({
          label,
          count,
          percentage: answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0,
        }));
      } else if (qType === "rating" || qType === "linear-scale" || qType === "scale") {
        let sum = 0;
        let numCount = 0;
        const scoreCounts: Record<string, number> = {};

        for (const val of extractedValues) {
          const num = Number(val);
          if (!isNaN(num)) {
            sum += num;
            numCount++;
            scoreCounts[String(num)] = (scoreCounts[String(num)] || 0) + 1;
          }
        }

        stat.average = numCount > 0 ? Number((sum / numCount).toFixed(1)) : 0;
        stat.min = qDef.min ?? 1;
        stat.max = qDef.max ?? (qType === "rating" ? 5 : 10);
        stat.distribution = Object.entries(scoreCounts)
          .map(([score, count]) => ({ score: Number(score), count }))
          .sort((a, b) => a.score - b.score);
      } else {
        // Textual questions
        stat.recentAnswers = extractedValues
          .slice(0, 10)
          .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)));
      }

      return stat;
    };

    if (Array.isArray(currentSurvey.sections)) {
      for (const section of currentSurvey.sections) {
        if (!Array.isArray(section.questions)) continue;

        for (const q of section.questions) {
          const qId = q.id;
          const answersForQ = surveyResponses.map((r) => r.answers?.[qId]);

          // If question has subQuestions (composite / contact), process each subQuestion as well
          if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
            for (const sq of q.subQuestions) {
              const sqAnswers = answersForQ.map((a: any) =>
                typeof a === "object" && a !== null ? a[sq.id] : undefined
              );
              questionStats.push(processQuestion(sq, section.title, sqAnswers, q.title));
            }
          } else {
            questionStats.push(processQuestion(q, section.title, answersForQ));
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      survey: currentSurvey,
      totalResponses,
      roleCounts,
      completionRate: totalResponses > 0 ? 100 : 0,
      avgTimeSpentSeconds,
      timeline,
      questionStats,
    });
  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to generate survey analytics" },
      { status: 500 }
    );
  }
}
