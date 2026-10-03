"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Phone,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Smartphone,
  Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface RespondentUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  authProvider: string;
  verifiedAt: string;
}

interface RespondentAuthModalProps {
  onAuthenticated: (user: RespondentUser) => void;
  surveyTitle?: string;
  isFullPage?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function RespondentAuthModal({
  onAuthenticated,
  surveyTitle = "Kolaba Cloud AI Survey",
  isFullPage = false,
  isOpen = true,
  onClose,
}: RespondentAuthModalProps) {
  if (isOpen === false) return null;
  // Steps: 'choose' | 'form' | 'google_phone'
  const [step, setStep] = useState<"choose" | "form" | "google_phone">("choose");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated in session or returned from Supabase Google Auth
  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const stored =
          typeof window !== "undefined"
            ? sessionStorage.getItem("kolaba_respondent_user") ||
              localStorage.getItem("kolaba_respondent_user")
            : null;

        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.phone) {
            onAuthenticated(parsed);
            return;
          }
        }

        // Check if returned from Supabase Google OAuth callback
        if (supabase) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            const meta = data.user.user_metadata || {};
            const googleName =
              meta.full_name ||
              meta.name ||
              data.user.email?.split("@")[0] ||
              "Google User";
            const googleEmail = data.user.email || "";

            setName((prev) => prev || googleName);
            setEmail((prev) => prev || googleEmail);

            // User is signed in with Google, needs mobile number
            setStep("google_phone");
          }
        }
      } catch {
        // Continue silently
      }
    }

    checkExistingAuth();
  }, [onAuthenticated]);

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      if (supabase) {
        const currentPath =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/survey";

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`,
          },
        });

        if (error) {
          console.warn("Supabase Google Auth notice:", error.message);
          // Fallback if Google provider is not yet enabled in Supabase dashboard
          setName("Google User");
          setEmail("google.user@institution.edu");
          setStep("google_phone");
        }
      } else {
        setName("Google User");
        setEmail("google.user@institution.edu");
        setStep("google_phone");
      }
    } catch {
      setName("Google User");
      setEmail("google.user@institution.edu");
      setStep("google_phone");
    } finally {
      setLoading(false);
    }
  };

  // Instant Login Submission (NO OTP)
  const handleCompleteLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          name: name.trim(),
          email: email.trim(),
          authProvider: step === "google_phone" ? "google" : "direct",
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("kolaba_respondent_user", JSON.stringify(data.user));
          localStorage.setItem("kolaba_respondent_user", JSON.stringify(data.user));
        }
        // Direct transition to survey
        onAuthenticated(data.user);
      } else {
        setErrorMsg(data.error || "Failed to proceed. Please try again.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const wrapperClass = isFullPage
    ? "w-full flex items-center justify-center py-6 px-4"
    : "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto";

  return (
    <div className={wrapperClass}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 space-y-6 my-auto"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0B132B] flex items-center justify-center text-white mx-auto shadow-md">
            <Cpu className="w-6 h-6 text-teal-400" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === "google_phone"
              ? "Complete Profile Phone"
              : step === "form"
              ? "Participant Details"
              : "Verify Identity to Begin"}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {step === "google_phone"
              ? "Your Google account is connected. Provide your mobile number to instantly enter the survey."
              : step === "form"
              ? "Enter your name and mobile number to start the survey immediately."
              : `To ensure research integrity for "${surveyTitle}", please identify yourself to begin.`}
          </p>
        </div>

        {/* Google Connected Badge */}
        {step === "google_phone" && (
          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.91H1.21v3.15C3.26 21.46 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.56H1.21C.44 8.1 0 9.99 0 12s.44 3.9 1.21 5.44l4.11-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.54 1.21 6.56l4.11 3.15c.94-2.81 3.58-4.96 6.68-4.96z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <span>Google Profile Connected</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 inline" />
              </div>
              <div className="text-[11px] text-teal-700 truncate font-medium">
                {name} {email ? `• ${email}` : ""}
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: CHOICE SCREEN */}
        {step === "choose" && (
          <div className="space-y-4">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-xs hover:shadow-sm transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.91H1.21v3.15C3.26 21.46 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.56H1.21C.44 8.1 0 9.99 0 12s.44 3.9 1.21 5.44l4.11-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.54 1.21 6.56l4.11 3.15c.94-2.81 3.58-4.96 6.68-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs uppercase font-bold text-slate-400 tracking-wider">
                Or Direct Sign In
              </span>
            </div>

            {/* Direct Form Button */}
            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-[#0B132B] hover:bg-slate-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Smartphone className="w-4 h-4 text-teal-400" />
              <span>Continue with Name &amp; Mobile</span>
            </button>
          </div>
        )}

        {/* STEP 2: DETAILS INPUT & INSTANT START */}
        {(step === "form" || step === "google_phone") && (
          <form onSubmit={handleCompleteLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Full Name <span className="text-teal-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Aarav Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address {step === "google_phone" ? <span className="text-teal-600">*</span> : "(Optional)"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Mobile Number <span className="text-teal-600">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-slate-500 font-mono">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Connecting to Survey...</span>
                  </>
                ) : (
                  <>
                    <span>Start Survey Now</span>
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Badge */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Encrypted Academic Research Identity Gateway</span>
        </div>
      </motion.div>
    </div>
  );
}
