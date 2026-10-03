import { NextRequest, NextResponse } from "next/server";
import { saveSurveyResponse, hasAlreadySubmitted } from "@/lib/storage";
import { sendSurveyEmail } from "@/lib/email";
import { SurveyResponse, RespondentType } from "@/types/survey";
import { PERSONA_INFO } from "@/lib/survey-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      respondent_type,
      respondent_name,
      college,
      department,
      role,
      email,
      phone,
      answers,
      survey_path,
      pilot_interest,
      consent,
      time_spent_seconds,
      metadata,
    } = body;

    if (!respondent_type || !email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Missing or invalid required fields (respondent_type, valid email)" },
        { status: 400 }
      );
    }

    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    const surveyId = (body.survey_id as string) || (metadata?.surveyId as string) || "eng-ai-colleges-2025";

    // Strict duplicate check: once submitted, cannot submit another response for the same survey
    const isDuplicate = await hasAlreadySubmitted(surveyId, email, cleanPhone);
    if (isDuplicate) {
      return NextResponse.json(
        {
          error: "You have already submitted a response for this survey. Multiple submissions from the same account are not permitted.",
          alreadySubmitted: true,
        },
        { status: 409 }
      );
    }

    const typeKey = respondent_type as RespondentType;
    const personaMeta = PERSONA_INFO[typeKey];

    const surveyResponse: SurveyResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      respondent_type: typeKey,
      respondent_type_label: personaMeta ? personaMeta.label : respondent_type,
      respondent_name: respondent_name || "Anonymous Respondent",
      college: college || "Not Specified",
      department: department || "",
      role: role || "",
      email: email,
      phone: phone || "",
      answers: answers || {},
      survey_path: survey_path || [],
      pilot_interest: pilot_interest ?? false,
      consent: Boolean(consent),
      time_spent_seconds: Number(time_spent_seconds) || 0,
      created_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        userAgent: req.headers.get("user-agent") || "",
        submittedAt: new Date().toISOString(),
      },
    };

    // 1. Save response
    await saveSurveyResponse(surveyResponse);

    // 2. Dispatch email to aditidas2486@gmail.com
    const emailResult = await sendSurveyEmail(surveyResponse);

    return NextResponse.json({
      success: true,
      id: surveyResponse.id,
      message: "Survey response recorded and sent successfully",
      emailDelivery: emailResult,
    });
  } catch (error: any) {
    console.error("Error submitting survey response:", error);
    return NextResponse.json(
      { error: "Internal server error saving response", details: error.message },
      { status: 500 }
    );
  }
}
