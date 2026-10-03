"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  MapPin,
  CheckCircle2,
  Sparkles,
  Layers,
  Lock,
} from "lucide-react";
import { SurveySchema } from "@/types/schema";
import HomePage from "@/app/page";

export default function SurveyLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const normalizedSlug = (slug || "").toLowerCase();
  const isKolaba =
    normalizedSlug === "engineering-colleges-program" ||
    normalizedSlug === "eng-ai-colleges-2025" ||
    normalizedSlug === "surv_eng_01" ||
    normalizedSlug === "kolaba" ||
    normalizedSlug === "kolaba-cloud" ||
    normalizedSlug === "kolaba-cloud-ai" ||
    normalizedSlug === "kolabacloud" ||
    (normalizedSlug.includes("kolaba") && (normalizedSlug.includes("college") || normalizedSlug.includes("ai")));

  if (isKolaba) {
    return <HomePage />;
  }

  const [survey, setSurvey] = useState<SurveySchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSurvey();
  }, [slug]);

  const fetchSurvey = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/surveys/${slug}`);
      const data = await res.json();
      if (data.success && data.survey) {
        setSurvey(data.survey);
      } else {
        setError(data.error || "Survey not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load survey");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          <p className="text-xs text-slate-500 font-medium">Loading survey details...</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Survey Not Available</h2>
          <p className="text-xs text-slate-600">
            {error || "We couldn't locate this survey. It may be unpublished or the link may have changed."}
          </p>
          <div className="pt-2">
            <Link
              href="/surveys"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B132B] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Survey Directory</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Company details
  const company = survey.company || {
    name: "Kolaba Cloud AI",
    tagline: "Applied AI & Cloud Infrastructure",
    description: "Enterprise sovereign AI systems and infrastructure.",
    brandPrimaryColor: "#0B132B",
    brandSecondaryColor: "#0D9488",
  };

  const brandPrimary = company.brandPrimaryColor || "#0B132B";
  const brandSecondary = company.brandSecondaryColor || "#0D9488";

  const totalQuestions =
    survey.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 10;
  const estMinutes =
    survey.settings?.estCompletionMinutes || Math.max(2, Math.ceil(totalQuestions * 0.4));

  const startSurveyUrl = `/surveys/${survey.slug || survey.id}/start`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      {/* Top Survey Header with Company Branding */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Company branding */}
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-8 h-8 rounded-lg object-contain border border-slate-200"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs"
                style={{ backgroundColor: brandPrimary }}
              >
                {company.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 block leading-tight">
                {company.name}
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                {company.industry || "Official Survey"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/surveys"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Directory</span>
            </Link>

            <Link
              href={startSurveyUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow-md transition-all"
              style={{ backgroundColor: brandPrimary }}
            >
              <span>Start Survey</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Landing Page Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-10">
        {/* Survey Hero Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {survey.industry || "Research Study"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Assessment
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {survey.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {survey.description ||
                "Thank you for taking the time to share your perspective. Your input directly influences upcoming offerings and strategic initiatives."}
            </p>
          </div>

          {/* Survey Purpose Section */}
          {survey.purpose && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Study Purpose
              </span>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                {survey.purpose}
              </p>
            </div>
          )}

          {/* Survey Quick Facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Estimated Time</span>
              </div>
              <div className="text-base font-black text-slate-900">{estMinutes} Minutes</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>Questions</span>
              </div>
              <div className="text-base font-black text-slate-900">{totalQuestions} Total</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Sections</span>
              </div>
              <div className="text-base font-black text-slate-900">
                {survey.sections?.length || 1} Parts
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Confidential</span>
              </div>
              <div className="text-base font-black text-slate-900">Protected</div>
            </div>
          </div>

          {/* Start CTA Button */}
          <div className="pt-4">
            <Link
              href={startSurveyUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm sm:text-base font-bold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              style={{ backgroundColor: brandPrimary }}
            >
              <span>Begin Survey</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Survey Outline / Sections Overview */}
        {survey.sections && survey.sections.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>What this survey covers</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {survey.sections.map((section, idx) => (
                <div
                  key={section.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
                >
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <span>{section.title}</span>
                  </div>
                  {section.description && (
                    <p className="text-xs text-slate-500 pl-7 leading-relaxed">
                      {section.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organization / Company Profile Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{company.name}</h3>
                {company.tagline && (
                  <p className="text-xs text-slate-500">{company.tagline}</p>
                )}
              </div>
            </div>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visit Website</span>
              </a>
            )}
          </div>

          {company.description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
              {company.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            {company.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{company.location}</span>
              </div>
            )}
            {company.primaryContactEmail && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{company.primaryContactEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Security / Isolation Notice */}
        <div className="text-center py-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Responses for this survey are collected securely and isolated strictly for {company.name}.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
