import { NextRequest, NextResponse } from "next/server";
import { sendSurveyEmail, isSmtpConfigured, isResendConfigured } from "@/lib/email";
import { SurveyResponse } from "@/types/survey";

export async function GET(req: NextRequest) {
  const testResponse: SurveyResponse = {
    id: `test-${Date.now()}`,
    respondent_type: "student",
    respondent_type_label: "Student / Club Lead",
    respondent_name: "Aditi Das (Test)",
    college: "RV College of Engineering",
    department: "AI & DS / AIML",
    role: "IEEE Lead",
    email: "aditidas2486@gmail.com",
    phone: "+91 9876543210",
    consent: true,
    pilot_interest: "Yes - Free Workshop & GPU Credits",
    time_spent_seconds: 180,
    created_at: new Date().toISOString(),
    survey_path: [
      {
        questionId: "D1",
        stepNumber: 1,
        questionTitle: "Which department are you studying in?",
        answerSummary: "AI & DS / AIML",
        rawAnswer: "AI & DS / AIML",
      },
      {
        questionId: "D2",
        stepNumber: 2,
        questionTitle: "What kind of project have you done, or are you doing, in your department?",
        answerSummary: "AI / ML (vision, NLP, LLM chatbot, agents)",
        rawAnswer: "AI / ML (vision, NLP, LLM chatbot, agents)",
      },
      {
        questionId: "D8",
        stepNumber: 8,
        questionTitle: "For your next project, which ONE free thing would help most?",
        answerSummary: "Sponsored GPU credits",
        rawAnswer: "Sponsored GPU credits",
      },
    ],
    answers: {
      D1: "AI & DS / AIML",
      D2: "AI / ML (vision, NLP, LLM chatbot, agents)",
      D8: "Sponsored GPU credits",
    },
  };

  const recipient =
    process.env.RECIPIENT_EMAIL ||
    process.env.SURVEY_NOTIFICATION_EMAIL ||
    "aditidas2486@gmail.com";

  const result = await sendSurveyEmail(testResponse);

  return NextResponse.json({
    recipient,
    isSmtpConfigured,
    isResendConfigured,
    smtpUserConfigured: Boolean(process.env.EMAIL_USER),
    smtpPassConfigured: Boolean(process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS),
    result,
  });
}
