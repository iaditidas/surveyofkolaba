import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { otpStore } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp, name, email, authProvider } = body;

    const cleanPhone = (phone || "").replace(/\D/g, "");
    const cleanOtp = (otp || "").trim();

    if (!cleanPhone || !cleanOtp) {
      return NextResponse.json(
        { success: false, error: "Mobile number and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    const record = otpStore[cleanPhone];

    // Master verification override for frictionless demo/testing or exact match
    const isMasterOtp = cleanOtp === "123456";
    const isMatch = record && record.code === cleanOtp;

    if (!isMatch && !isMasterOtp) {
      if (record) {
        record.attempts = (record.attempts || 0) + 1;
        if (record.attempts >= 4) {
          delete otpStore[cleanPhone];
          return NextResponse.json(
            { success: false, error: "Too many incorrect attempts. Please request a new code." },
            { status: 429 }
          );
        }
      }
      return NextResponse.json(
        { success: false, error: "Invalid verification code. Please try again." },
        { status: 400 }
      );
    }

    if (record && Date.now() > record.expiresAt) {
      delete otpStore[cleanPhone];
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Code verified successfully!
    delete otpStore[cleanPhone];

    const finalName = name || record?.name || "Participant";
    const finalEmail = email || record?.email || "";
    const respondentId = `resp_usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Attempt to store in Supabase profiles if possible
    const supabase = getServiceSupabase();
    if (supabase) {
      try {
        await supabase.from("profiles").upsert({
          id: respondentId,
          full_name: finalName,
          role: "respondent",
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        // Silently continue if table has restricted RLS
      }
    }

    const authenticatedUser = {
      id: respondentId,
      name: finalName,
      email: finalEmail,
      phone: `+91 ${cleanPhone.slice(-10)}`,
      authProvider: authProvider || "mobile_otp",
      verifiedAt: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
      message: "Identity verified successfully. Proceeding to survey...",
    });

    // Set cookie for persistence
    response.cookies.set("kolaba_respondent_auth", JSON.stringify(authenticatedUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed." },
      { status: 500 }
    );
  }
}
