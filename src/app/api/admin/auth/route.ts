import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    // Check credentials: username "kolaba@admin.com", password "kolabacloud"
    // Also accept admin@kolabacloud.com for convenience
    const isEmailValid = cleanEmail === "kolaba@admin.com" || cleanEmail === "admin@kolabacloud.com";
    const isPasswordValid = cleanPass === "kolabacloud";

    if (isEmailValid && isPasswordValid) {
      return NextResponse.json({
        success: true,
        user: {
          email: "kolaba@admin.com",
          name: "Kolaba Admin",
          role: "administrator",
        },
        token: `kolaba-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      });
    }

    return NextResponse.json(
      { error: "Invalid credentials. Please use kolaba@admin.com / kolabacloud" },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}
