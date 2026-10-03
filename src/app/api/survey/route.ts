import { NextRequest, NextResponse } from "next/server";
import { saveSurveyResponse, hasAlreadySubmitted } from "@/lib/storage";
import { sendSurveyEmail } from "@/lib/email";
import { SurveyResponse, RespondentType } from "@/types/survey";
import { PERSONA_INFO } from "@/lib/survey-data";

// Simple in-memory rate limiter / duplicate check (prevents double submits within 5 seconds)
const recentSubmissions = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body" },
        { status: 400 }
      );
    }

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Survey submission payload cannot be empty" },
        { status: 400 }
      );
    }

    // Extract fields with fallbacks to handle both standard survey engine & custom payloads
    const email =
      body.email ||
      body.contact_email ||
      body.answers?.contact_email ||
      body.answers?.D10?.contact_email ||
      body.answers?.B10?.contact_email ||
      body.answers?.C10?.contact_email ||
      body.answers?.A10?.contact_email ||
      "";

    const respondentName =
      body.respondent_name ||
      body.name ||
      body.contact_name ||
      body.answers?.contact_name ||
      body.answers?.D10?.contact_name ||
      body.answers?.B10?.contact_name ||
      body.answers?.C10?.contact_name ||
      body.answers?.A10?.contact_name ||
      "Anonymous Respondent";

    const respondentType: RespondentType =
      (body.respondent_type as RespondentType) ||
      (body.type as RespondentType) ||
      "student";

    const personaMeta = PERSONA_INFO[respondentType];

    const college =
      body.college ||
      body.answers?.contact_college ||
      body.answers?.D10?.contact_college ||
      body.answers?.B1?.college_name ||
      body.answers?.C1?.college_name ||
      body.answers?.A1?.college_details ||
      body.college_name ||
      "";

    const department =
      body.department ||
      body.answers?.D1 ||
      body.answers?.B1?.department ||
      "";

    const role =
      body.role ||
      body.answers?.B1?.role ||
      personaMeta?.label ||
      "";

    const pilotInterest =
      body.pilot_interest ??
      body.answers?.D10?.campus_ambassador ??
      body.answers?.B10?.pilot_interest ??
      body.answers?.C10?.tpo_pilot_interest ??
      body.answers?.A10?.pilot_welcome ??
      false;

    const consent =
      body.consent !== undefined
        ? Boolean(body.consent)
        : body.answers?.consent !== false;

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required for submission." },
        { status: 422 }
      );
    }

    const cleanPhone = (body.phone || body.answers?.contact_phone || body.answers?.D10?.contact_phone || "").replace(/\D/g, "").slice(-10);
    const surveyId = (body.metadata?.surveyId as string) || "eng-ai-colleges-2025";

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

    // Duplicate submission guard (e.g. rapid double clicks)
    const duplicateKey = `${email.toLowerCase()}_${respondentType}`;
    const now = Date.now();
    const lastSubmitted = recentSubmissions.get(duplicateKey);
    if (lastSubmitted && now - lastSubmitted < 4000) {
      return NextResponse.json(
        {
          error: "Duplicate submission detected. Please wait a moment.",
          duplicate: true,
        },
        { status: 429 }
      );
    }
    recentSubmissions.set(duplicateKey, now);

    const surveyResponse: SurveyResponse = {
      id: body.id || `resp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      respondent_type: respondentType,
      respondent_type_label: personaMeta ? personaMeta.label : respondentType,
      respondent_name: respondentName,
      college: college || "Not Specified",
      department: department || undefined,
      role: role || undefined,
      email: email,
      phone: body.phone || body.answers?.contact_phone || body.answers?.D10?.contact_phone || "",
      answers: body.answers || {},
      survey_path: Array.isArray(body.survey_path) ? body.survey_path : [],
      pilot_interest: pilotInterest,
      consent: consent,
      time_spent_seconds: Number(body.time_spent_seconds) || 0,
      created_at: body.submittedAt || new Date().toISOString(),
      metadata: {
        ...body.metadata,
        surveyId: surveyId,
        surveyTitle: body.metadata?.surveyTitle || "Kolaba Cloud AI — Engineering Colleges Program",
        userAgent: req.headers.get("user-agent") || "",
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "local",
      },
    };

    // 1. Save response to storage (and Supabase if configured)
    await saveSurveyResponse(surveyResponse);

    // 2. Dispatch email notification to aditidas2486@gmail.com
    const emailResult = await sendSurveyEmail(surveyResponse);

    if (!emailResult.success && emailResult.error) {
      console.warn(`[Submission Warning] Response ${surveyResponse.id} saved but email delivery encountered an issue:`, emailResult.error);
    }

    return NextResponse.json(
      {
        success: true,
        id: surveyResponse.id,
        message: "Survey response recorded and sent successfully",
        emailDelivery: {
          sent: emailResult.success,
          method: emailResult.method,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API Survey Error]", error);
    return NextResponse.json(
      {
        error: "Internal server error processing survey submission",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
