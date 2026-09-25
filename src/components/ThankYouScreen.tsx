"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  Share2,
  Mail,
  ShieldCheck,
  Download,
} from "lucide-react";
import { RespondentType } from "@/types/survey";
import { PERSONA_INFO } from "@/lib/survey-data";

interface ThankYouScreenProps {
  respondentType: RespondentType;
  submissionId: string;
  name: string;
  college: string;
  pilotInterest?: any;
  onReset: () => void;
}

export default function ThankYouScreen({
  respondentType,
  submissionId,
  name,
  college,
  pilotInterest,
  onReset,
}: ThankYouScreenProps) {
  useEffect(() => {
    // Fire confetti on load
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#0B132B", "#0D9488", "#10B981", "#38BDF8"],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const personaMeta = PERSONA_INFO[respondentType];

  // Tailor next steps message based on role and pilot interest
  let tailoredMessage =
    "Our research team will synthesize these findings to structure accessible GPU grants and institutional packages.";

  if (respondentType === "student") {
    tailoredMessage =
      "Thank you for sharing your project journey! Our campus team will review your responses for sponsored GPU credits, club workshop schedules, and student ambassador allocations.";
  } else if (respondentType === "faculty") {
    tailoredMessage =
      "Thank you, Professor. Our academic relations team will reach out regarding faculty development programs (FDPs) and customized AI lab sandbox curriculum modules.";
  } else if (respondentType === "tpo") {
    tailoredMessage =
      "Thank you for your valuable placement insights. We look forward to connecting regarding recruiter demo days, mentored capstone tracks, and industry certification partnerships.";
  } else if (respondentType === "admin") {
    tailoredMessage =
      "Thank you for your institutional perspective. Our leadership team will prepare a tailored briefing on Sovereign AI Centers of Excellence and private VPC deployments for your campus.";
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm text-center space-y-6"
      >
        {/* Success Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-50 border-2 border-teal-200 rounded-full flex items-center justify-center mx-auto text-teal-600 shadow-xs">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600" />
        </div>

        {/* Primary Thank You Copy */}
        <div className="space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Response Recorded</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Thank you for sharing your experience.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            Your response has been recorded and will help inform{" "}
            <strong className="text-slate-900">Kolaba Cloud AI&apos;s</strong>{" "}
            engineering-college program research.
          </p>
        </div>

        {/* Tailored Next Step Card */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Next Steps ({personaMeta?.label || "Respondent"})</span>
            <span className="text-teal-700 font-semibold">{college || "Campus Partner"}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {tailoredMessage}
          </p>
          <div className="text-[11px] text-slate-600 pt-1 font-mono">
            Submission ID: {submissionId}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Take for Another Role</span>
          </button>

          <Link
            href={`/admin/responses/${submissionId}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B132B] text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4 text-teal-400" />
            <span>View in Admin Dashboard</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Responses are encrypted & strictly used for academic research.</span>
        </div>
      </motion.div>
    </div>
  );
}
