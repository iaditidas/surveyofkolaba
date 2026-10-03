import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, authProvider } = body;

    const cleanName = (name || "").trim();
    const cleanPhone = (phone || "").replace(/\D/g, "");
    const cleanEmail = (email || "").trim();

    if (!cleanName) {
      return NextResponse.json(
        { success: false, error: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const respondentId = `resp_usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Optional sync to Supabase profiles
    const supabase = getServiceSupabase();
    if (supabase) {
      try {
        await supabase.from("profiles").upsert({
          id: respondentId,
          full_name: cleanName,
          role: "respondent",
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Silently continue if restricted by RLS
      }
    }

    const authenticatedUser = {
      id: respondentId,
      name: cleanName,
      email: cleanEmail,
      phone: `+91 ${cleanPhone.slice(-10)}`,
      authProvider: authProvider || "name_phone",
      verifiedAt: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
      message: "Authentication successful. Entering survey...",
    });

    // Set cookie for 7 days
    response.cookies.set("kolaba_respondent_auth", JSON.stringify(authenticatedUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to authenticate." },
      { status: 500 }
    );
  }
}
