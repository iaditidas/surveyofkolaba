"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Clock,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Compass,
  Building2,
} from "lucide-react";
import { SurveySchema } from "@/types/schema";

export default function SurveysDirectoryPage() {
  const [surveys, setSurveys] = useState<SurveySchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/surveys");
      const data = await res.json();
      if (data.success && Array.isArray(data.surveys)) {
        setSurveys(data.surveys);
      }
    } catch (err) {
      console.error("Failed to load surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  const industries: string[] = [
    "all",
    ...Array.from(new Set(surveys.map((s) => s.industry).filter((i): i is string => Boolean(i)))),
  ];

  const filteredSurveys = surveys.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      s.title.toLowerCase().includes(query) ||
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.company?.name && s.company.name.toLowerCase().includes(query)) ||
      (s.industry && s.industry.toLowerCase().includes(query));

    const matchesIndustry =
      selectedIndustry === "all" || s.industry === selectedIndustry;

    const isPublic = s.status === "PUBLISHED" || surveys.every((x) => x.status !== "PUBLISHED");
    return matchesSearch && matchesIndustry && isPublic;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-[450px] h-[450px] bg-teal-100/40 rounded-full blur-[110px]" />
        <div className="absolute top-10 right-1/4 w-[400px] h-[400px] bg-slate-200/40 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 space-y-10">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Survey Platform Directory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Available Surveys
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Browse our active research programs, customer studies, and institutional assessments. Select any survey to view its dedicated landing page.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by survey name, company, or industry..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {industries.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                Industry:
              </span>
              {industries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 capitalize ${
                    selectedIndustry === ind
                      ? "bg-[#0B132B] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {ind === "all" ? "All Industries" : ind}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Survey Cards Grid */}
        <div>
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
              <p className="text-xs text-slate-500 font-medium">Loading surveys...</p>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="py-16 px-6 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Surveys Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active surveys match your search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSurveys.map((survey) => {
                const totalQuestions =
                  survey.sections?.reduce(
                    (acc, s) => acc + (s.questions?.length || 0),
                    0
                  ) || 10;
                const estMinutes =
                  survey.settings?.estCompletionMinutes ||
                  Math.max(2, Math.ceil(totalQuestions * 0.4));
                const companyName = survey.company?.name || "Kolaba Cloud AI";
                const brandColor = survey.company?.brandPrimaryColor || "#0B132B";
                const surveyUrl =
                  survey.id === "eng-ai-colleges-2025" || survey.slug === "engineering-colleges-program"
                    ? "/"
                    : `/surveys/${survey.slug || survey.id}`;

                return (
                  <div
                    key={survey.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:border-slate-300"
                  >
                    <div className="space-y-4">
                      {/* Organization Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                            style={{ backgroundColor: brandColor }}
                          >
                            {companyName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                              {companyName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {survey.industry || "Research Study"}
                            </div>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>

                      {/* Survey Title & Description */}
                      <div className="space-y-2 pt-1">
                        <h2 className="text-xl font-black text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                          {survey.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {survey.description || "Share your feedback to guide upcoming initiatives and research."}
                        </p>
                      </div>

                      {survey.purpose && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                          "{survey.purpose}"
                        </div>
                      )}

                      {/* Metadata Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{estMinutes} minutes</span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>{totalQuestions} Questions</span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          <span>Verified</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA Action Button */}
                    <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        {survey.responseCount && survey.responseCount > 0
                          ? `${survey.responseCount} responses`
                          : "Active"}
                      </span>

                      <Link
                        href={surveyUrl}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow-md transition-all group-hover:translate-x-0.5"
                        style={{ backgroundColor: brandColor }}
                      >
                        <span>Start Survey</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
