"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CheckCircle2, ArrowRight, ShieldCheck, ArrowLeft, Sparkles, Building2 } from "lucide-react";
import { SurveySchema } from "@/types/schema";

export default function SurveyCompletePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [survey, setSurvey] = useState<SurveySchema | null>(null);

  useEffect(() => {
    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    fetch(`/api/surveys/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.survey) {
          setSurvey(d.survey);
        }
      })
      .catch(() => {});
  }, [slug]);

  const company = survey?.company || {
    name: "Kolaba Cloud AI",
    brandPrimaryColor: "#0B132B",
  };
  const brandPrimary = company.brandPrimaryColor || "#0B132B";

  const completionMessage =
    survey?.settings?.completionMessage ||
    "Thank you for sharing your feedback! Your submission has been securely recorded and will directly guide upcoming research and program offerings.";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-sm">
        {/* Animated Checkmark Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Company & Survey Meta */}
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            {company.name}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Submission Received!
          </h1>
          {survey?.title && (
            <p className="text-xs font-bold text-teal-700">{survey.title}</p>
          )}
        </div>

        {/* Custom Thank you message */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {completionMessage}
        </p>

        {/* Isolation & Security assurance */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Response recorded and verified in database</span>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <Link
            href="/surveys"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow-md transition-all"
            style={{ backgroundColor: brandPrimary }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Survey Directory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
