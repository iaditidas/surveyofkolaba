import { NextRequest, NextResponse } from "next/server";
import { hasAlreadySubmitted } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const surveyId = searchParams.get("surveyId") || "eng-ai-colleges-2025";
    const email = searchParams.get("email") || "";
    const phone = searchParams.get("phone") || "";

    if (!email && !phone) {
      return NextResponse.json({ alreadySubmitted: false });
    }

    const already = await hasAlreadySubmitted(surveyId, email, phone);
    return NextResponse.json({ alreadySubmitted: already });
  } catch (error: any) {
    return NextResponse.json({ alreadySubmitted: false });
  }
}
