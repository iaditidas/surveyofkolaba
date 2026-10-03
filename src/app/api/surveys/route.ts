import { NextRequest, NextResponse } from "next/server";
import { getAllSurveys, saveSurvey } from "@/lib/surveyStorage";
import { SurveySchema } from "@/types/schema";

export async function GET() {
  try {
    const surveys = await getAllSurveys();
    return NextResponse.json({ success: true, surveys });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch surveys" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Survey title is required" },
        { status: 400 }
      );
    }

    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") +
        "-" +
        Date.now().toString().slice(-4);

    const newSurvey: SurveySchema = {
      id: body.id || `surv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      slug: slug,
      title: body.title,
      description: body.description || "",
      purpose: body.purpose || "",
      company: body.company || {
        name: body.companyName || "Organization",
        industry: body.industry || "General",
        brandPrimaryColor: "#0B132B",
        brandSecondaryColor: "#0D9488",
      },
      status: body.status || "PUBLISHED",
      version: body.version || 1,
      industry: body.industry || body.company?.industry || "General",
      sections: body.sections || [
        {
          id: `sec_${Date.now()}`,
          title: "General Questions",
          order: 1,
          visibility: "VISIBLE",
          questions: [],
        },
      ],
      logic: body.logic || [],
      settings: {
        allowMultipleResponses: false,
        isAnonymous: false,
        requireEmail: true,
        showProgressIndicator: true,
        showQuestionNumbers: true,
        completionMessage: "Thank you for completing this survey!",
        brandColor: "#0D9488",
        ...body.settings,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await saveSurvey(newSurvey);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create survey" },
      { status: 500 }
    );
  }
}
