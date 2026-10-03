"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { SurveySchema } from "@/types/schema";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building2,
  Layers,
  HelpCircle,
  FileText,
  Star,
  Users,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";

function AdminAnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSurveyId = searchParams.get("surveyId");

  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [surveys, setSurveys] = useState<SurveySchema[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(initialSurveyId || "");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("all");
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("kolaba_admin_session");
    if (!session) {
      router.push("/admin/login");
      return;
    }
    setAuthenticated(true);
    fetchSurveys();
  }, [router]);

  const fetchSurveys = async () => {
    try {
      const res = await fetch("/api/surveys");
      const data = await res.json();
      if (data.success && Array.isArray(data.surveys)) {
        setSurveys(data.surveys);
        if (!selectedSurveyId && data.surveys.length > 0) {
          const firstId = initialSurveyId || data.surveys[0].id;
          setSelectedSurveyId(firstId);
        }
      }
    } catch (err) {
      console.error("Failed to load surveys:", err);
    }
  };

  useEffect(() => {
    if (authenticated && selectedSurveyId) {
      fetchAnalytics(selectedSurveyId, selectedRoleFilter);
    }
  }, [authenticated, selectedSurveyId, selectedRoleFilter]);

  const fetchAnalytics = async (surveyId: string, role = selectedRoleFilter) => {
    setLoading(true);
    try {
      const roleParam = role && role !== "all" ? `&role=${encodeURIComponent(role)}` : "";
      const res = await fetch(`/api/admin/analytics?surveyId=${encodeURIComponent(surveyId)}${roleParam}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  const currentSurvey = analyticsData?.survey || surveys.find((s) => s.id === selectedSurveyId || s.slug === selectedSurveyId);
  const totalResponses = analyticsData?.totalResponses ?? (currentSurvey?.responseCount || 0);
  const avgSeconds = analyticsData?.avgTimeSpentSeconds || 180;
  const avgMins = Math.max(1, Math.round(avgSeconds / 60));
  const timeline = analyticsData?.timeline || [];
  const questionStats = analyticsData?.questionStats || [];

  const displayedQuestionStats = questionStats.filter((q: any) => {
    if (selectedSectionFilter === "all") return true;
    return q.sectionTitle === selectedSectionFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header with Survey Switcher */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
              Survey-Specific Analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {currentSurvey ? currentSurvey.title : "Survey Analytics"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Isolated metric breakdown for {currentSurvey?.company?.name || "this survey"}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Survey:
            </span>
            <select
              value={selectedSurveyId}
              onChange={(e) => setSelectedSurveyId(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs max-w-[260px] truncate"
            >
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.company?.name || "Kolaba"})
                </option>
              ))}
            </select>

            <Link
              href={`/admin/responses?surveyId=${selectedSurveyId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>View Responses</span>
            </Link>
          </div>
        </div>

        {/* Survey Switcher Pills for Quick Switching */}
        {surveys.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {surveys.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSurveyId(s.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  selectedSurveyId === s.id
                    ? "bg-[#0B132B] text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{s.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/50">
                  {s.responseCount || 0}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Track / Role Filter Switcher */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Filter by Track:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Tracks" },
              { id: "student", label: "Student" },
              { id: "faculty", label: "Faculty" },
              { id: "tpo", label: "TPO" },
              { id: "admin", label: "Leadership" },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleFilter(role.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedRoleFilter === role.id
                    ? "bg-[#0B132B] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {role.label}
                {analyticsData?.roleCounts?.[role.id] !== undefined && role.id !== "all" && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/60">
                    {analyticsData.roleCounts[role.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scoped KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Submissions
            </span>
            <div className="text-3xl font-black text-slate-900">{totalResponses}</div>
            <div className="text-xs text-slate-500 font-medium">For {currentSurvey?.title}</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
              Completion Rate
            </span>
            <div className="text-3xl font-black text-slate-900">
              {totalResponses > 0 ? "100%" : "0%"}
            </div>
            <div className="text-xs text-slate-500 font-medium">Completed questionnaires</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600">
              Avg Time Spent
            </span>
            <div className="text-3xl font-black text-slate-900">{avgMins} min</div>
            <div className="text-xs text-slate-500 font-medium">Based on submission timestamps</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600">
              Question Count
            </span>
            <div className="text-3xl font-black text-slate-900">
              {questionStats.length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Recorded questions & metrics</div>
          </div>
        </div>

        {/* Response Timeline Trends */}
        {timeline.length > 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>Response Volume Over Time</span>
              </h2>
              <span className="text-xs text-slate-400">Daily submission velocity</span>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0B132B",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Dynamic Question-Level Statistics */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-600" />
                <span>Question-Level Breakdown</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregated from {totalResponses} respondent answers across all recorded questions
              </p>
            </div>

            {/* Section Switcher Filter Pills */}
            {(() => {
              const distinctSections = Array.from(
                new Set(questionStats.map((q: any) => q.sectionTitle).filter(Boolean))
              ) as string[];

              if (distinctSections.length <= 1) return null;

              return (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedSectionFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      selectedSectionFilter === "all"
                        ? "bg-[#0B132B] text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    All Sections ({questionStats.length})
                  </button>
                  {distinctSections.map((sec) => {
                    const count = questionStats.filter((q: any) => q.sectionTitle === sec).length;
                    return (
                      <button
                        key={sec}
                        onClick={() => setSelectedSectionFilter(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          selectedSectionFilter === sec
                            ? "bg-teal-700 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {sec.split(":")[0]} ({count})
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {loading ? (
            <div className="p-16 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Computing question statistics...</p>
            </div>
          ) : displayedQuestionStats.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              No question metrics match the selected section filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedQuestionStats.map((stat: any, idx: number) => (
                <div
                  key={stat.id || idx}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
                >
                  {/* Question Title & Section Header */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">
                        {stat.sectionTitle || `Question ${idx + 1}`}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {stat.answeredCount} Answered ({stat.responseRate}%)
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {stat.title}
                    </h3>
                  </div>

                  {/* Choice Distribution Bars */}
                  {stat.distribution && stat.distribution.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      {stat.distribution.map((item: any, optIdx: number) => (
                        <div key={optIdx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span className="truncate max-w-[240px]">{item.label}</span>
                            <span className="font-mono text-slate-500 shrink-0">
                              {item.count} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-teal-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rating / Linear Scale Summary */}
                  {stat.average !== undefined && (
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <div>
                          <div className="text-lg font-black text-amber-950">
                            {stat.average} <span className="text-xs text-amber-700 font-bold">/ {stat.max}</span>
                          </div>
                          <div className="text-[10px] font-semibold text-amber-800">
                            Average rating across respondents
                          </div>
                        </div>
                      </div>

                      {/* Rating Distribution if available */}
                      {stat.distribution && (
                        <div className="space-y-1 pt-1">
                          {stat.distribution.map((d: any) => (
                            <div key={d.score} className="flex items-center gap-2 text-xs">
                              <span className="w-4 font-bold text-slate-600">{d.score}★</span>
                              <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-400 h-full rounded-full"
                                  style={{
                                    width: `${stat.answeredCount > 0 ? (d.count / stat.answeredCount) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="w-6 text-right font-mono text-[11px] text-slate-400">
                                {d.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Open-ended text answers */}
                  {stat.recentAnswers && stat.recentAnswers.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Recent Submissions Sample:
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {stat.recentAnswers.map((ans: string, aIdx: number) => (
                          <div
                            key={aIdx}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 italic"
                          >
                            "{ans}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observations & Feedback notes */}
                  {stat.observations && stat.observations.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                        Observations & Qualitative Feedback ({stat.observations.length}):
                      </span>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {stat.observations.map((obs: string, oIdx: number) => (
                          <div
                            key={oIdx}
                            className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-950 italic"
                          >
                            "{obs}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
      }
    >
      <AdminAnalyticsContent />
    </Suspense>
  );
}
