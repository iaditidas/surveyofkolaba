import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// In-memory rate limiting store (tracks failed attempts per IP)
const FAILED_ATTEMPTS: Record<string, { count: number; lockedUntil: number }> = {};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const REQUIRED_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Kolabacloud@75";
const VALID_ADMIN_EMAILS = [
  "admin@kolabacloud.com",
  "kolaba@admin.com",
];

// Constant time string comparison to prevent timing attacks
function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");
    if (bufA.length !== bufB.length) {
      // Compare with self to avoid timing leak on length
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = Date.now();

    // Check rate limit / lockout
    const attemptRecord = FAILED_ATTEMPTS[ip];
    if (attemptRecord && attemptRecord.lockedUntil > now) {
      const remainingMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Access temporarily locked for ${remainingMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    // Verify email & password strictly
    const isEmailValid = VALID_ADMIN_EMAILS.includes(cleanEmail);
    const isPasswordValid = timingSafeCompare(cleanPass, REQUIRED_ADMIN_PASSWORD);

    if (isEmailValid && isPasswordValid) {
      // Clear failed attempts on success
      if (FAILED_ATTEMPTS[ip]) {
        delete FAILED_ATTEMPTS[ip];
      }

      // Generate secure session token
      const sessionToken = crypto.randomBytes(32).toString("hex");

      const response = NextResponse.json({
        success: true,
        user: {
          email: cleanEmail,
          name: "Kolaba Administrator",
          role: "superadmin",
        },
        token: sessionToken,
      });

      // Also set HTTP-only secure cookie for additional enterprise security
      response.cookies.set("kolaba_admin_auth", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    }

    // Record failed attempt
    if (!FAILED_ATTEMPTS[ip]) {
      FAILED_ATTEMPTS[ip] = { count: 1, lockedUntil: 0 };
    } else {
      FAILED_ATTEMPTS[ip].count += 1;
    }

    if (FAILED_ATTEMPTS[ip].count >= MAX_FAILED_ATTEMPTS) {
      FAILED_ATTEMPTS[ip].lockedUntil = now + LOCKOUT_DURATION_MS;
      return NextResponse.json(
        {
          error: "Maximum failed attempts exceeded. Security lockout active for 15 minutes.",
        },
        { status: 429 }
      );
    }

    const attemptsRemaining = MAX_FAILED_ATTEMPTS - FAILED_ATTEMPTS[ip].count;

    return NextResponse.json(
      {
        error: `Invalid email or password. (${attemptsRemaining} attempt(s) remaining before lockout)`,
      },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}
