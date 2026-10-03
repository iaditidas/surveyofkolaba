import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, email } = body;

    const cleanPhone = (phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Generate a secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore[cleanPhone] = {
      code: otpCode,
      expiresAt,
      attempts: 0,
      name: name || "Participant",
      email: email || "",
    };

    console.log(`[KOLABA OTP] Generated OTP for ${cleanPhone}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to +91 ${cleanPhone.slice(-10)}`,
      // Provide devOtp for immediate frictionless developer testing
      devOtp: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch verification code." },
      { status: 500 }
    );
  }
}
