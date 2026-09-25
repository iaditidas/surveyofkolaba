import { NextRequest, NextResponse } from "next/server";

const ADMIN_PIN = process.env.ADMIN_ACCESS_PIN || "kolaba2026";

export async function POST(req: NextRequest) {
  try {
    const { pin, email } = await req.json();

    if (pin && pin === ADMIN_PIN) {
      return NextResponse.json({
        success: true,
        user: { email: email || "admin@kolabacloud.com", role: "administrator" },
        token: "admin-session-" + Date.now(),
      });
    }

    return NextResponse.json(
      { error: "Invalid Admin Passcode or Credentials" },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Authentication failed", details: error.message },
      { status: 500 }
    );
  }
}
