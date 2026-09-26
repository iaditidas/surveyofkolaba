import { NextRequest, NextResponse } from "next/server";
import { saveSurveyResponse } from "@/lib/storage";
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
