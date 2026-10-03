"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cpu, ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import RespondentAuthModal, { RespondentUser } from "@/components/RespondentAuthModal";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/survey";
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? sessionStorage.getItem("kolaba_respondent_user") ||
            localStorage.getItem("kolaba_respondent_user")
          : null;

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.phone) {
          // Already authenticated, forward to destination
          router.replace(next);
          return;
        }
      }
    } catch {
      // Continue to login
    } finally {
      setCheckingAuth(false);
    }
  }, [next, router]);

  const handleAuthenticated = (user: RespondentUser) => {
    router.push(next);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Verifying Identity Session...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Return to Overview */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </Link>

        <div className="flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Secure Research Identity</span>
        </div>
      </div>

      {/* Main Authentication Component */}
      <RespondentAuthModal
        onAuthenticated={handleAuthenticated}
        surveyTitle="Kolaba Cloud AI Survey"
        isFullPage={true}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-semibold text-slate-500">Loading Portal...</span>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
