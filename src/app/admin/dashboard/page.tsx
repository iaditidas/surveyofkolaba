"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { SurveyResponse } from "@/types/survey";
import { SurveySchema } from "@/types/schema";
import {
  Users,
  Plus,
  ArrowRight,
  FileText,
  BarChart3,
  Clock,
  Mail,
  CheckCircle2,
  Building2,
  Play,
  Settings,
  Sparkles,
  Layers,
  ChevronRight,
  Lock,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [surveys, setSurveys] = useState<SurveySchema[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);

  useEffect(() => {
    const session = sessionStorage.getItem("kolaba_admin_session");
    if (!session) {
      router.push("/admin/login");
      return;
    }
    setAuthenticated(true);
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resSurveys, resResponses] = await Promise.all([
        fetch("/api/surveys"),
        fetch("/api/admin/responses"),
      ]);

      const dataSurveys = await resSurveys.json();
      const dataResponses = await resResponses.json();

      if (dataSurveys.success && Array.isArray(dataSurveys.surveys)) {
        setSurveys(dataSurveys.surveys);
      }
      if (dataResponses.success && Array.isArray(dataResponses.responses)) {
        setResponses(dataResponses.responses);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
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

  const publishedCount = surveys.filter((s) => s.status === "PUBLISHED").length;
  const draftCount = surveys.filter((s) => s.status === "DRAFT").length;
  const totalSubmissions = responses.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header Title & Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Platform Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              High-level KPIs across surveys. Select a specific survey to view detailed responses and analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/surveys/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Survey</span>
            </Link>
          </div>
        </div>

        {/* High-Level Platform KPIs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Surveys
            </span>
            <div className="text-3xl font-black text-slate-900">{surveys.length}</div>
            <div className="text-xs text-slate-500 font-medium">Configured in Supabase</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
              Published Active
            </span>
            <div className="text-3xl font-black text-slate-900">{publishedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Accepting public responses</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">
              Draft Surveys
            </span>
            <div className="text-3xl font-black text-slate-900">{draftCount}</div>
            <div className="text-xs text-slate-500 font-medium">Under review / preparation</div>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 shadow-xs space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
              Total Submissions
            </span>
            <div className="text-3xl font-black text-teal-950">{totalSubmissions}</div>
            <div className="text-xs text-teal-700 font-medium">Across all surveys</div>
          </div>
        </div>

        {/* Survey Directory Scoped Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Active Surveys Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a survey to inspect its scoped responses or analytics.
              </p>
            </div>

            <Link
              href="/admin/surveys"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
            >
              <span>Manage Surveys</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-6">Survey &amp; Organization</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Responses</th>
                  <th className="py-3 px-6 text-right">Survey Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveys.map((survey) => {
                  const qCount =
                    survey.sections?.reduce(
                      (acc, s) => acc + (s.questions?.length || 0),
                      0
                    ) || 0;
                  const companyName = survey.company?.name || "Kolaba Cloud";

                  return (
                    <tr key={survey.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-base">{survey.title}</span>
                          {(survey.id === "eng-ai-colleges-2025" || survey.title.includes("Kolaba")) && (
                            <span className="px-2 py-0.5 rounded-md bg-[#0B132B] text-teal-300 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
                              Kolaba Flagship
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-700">{companyName}</span>
                          <span>&bull;</span>
                          <span>{survey.industry || "General"}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            survey.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {survey.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs font-semibold text-slate-700">
                        {qCount} Questions
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-sm font-bold text-slate-900">
                          {survey.responseCount || 0}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Scoped Analytics */}
                          <Link
                            href={`/admin/analytics?surveyId=${survey.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-bold transition-colors"
                            title="View Analytics for this survey"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Analytics</span>
                          </Link>

                          {/* Scoped Responses */}
                          <Link
                            href={`/admin/responses?surveyId=${survey.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold transition-colors"
                            title="View Responses for this survey"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Responses</span>
                          </Link>

                          {/* Edit in Visual Builder */}
                          <Link
                            href={`/admin/surveys/${survey.id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors"
                            title="Edit Survey"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>

                          {/* Open Live Survey (Same Tab) */}
                          <Link
                            href={`/surveys/${survey.slug || survey.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 text-xs font-bold transition-colors"
                            title="Open Survey Landing Page"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Open</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Submissions Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Recent Submissions Feed ({responses.slice(0, 8).length})
            </h2>
            <span className="text-xs text-slate-500">Live captured data</span>
          </div>

          {responses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No submissions recorded yet across surveys.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-6">Respondent</th>
                    <th className="py-3 px-4">Survey</th>
                    <th className="py-3 px-4">Organization / College</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {responses.slice(0, 8).map((r) => {
                    const surveyId = (r.metadata?.surveyId as string) || "eng-ai-colleges-2025";
                    const surveyObj = surveys.find((s) => s.id === surveyId || s.slug === surveyId);
                    const surveyTitle = surveyObj?.title || r.metadata?.surveyTitle || "Engineering Colleges Program";

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900">
                            {r.respondent_name || "Anonymous"}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{r.email}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                          {surveyTitle}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {r.college || "Not Specified"}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(r.created_at || "").toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <Link
                            href={`/admin/responses?surveyId=${surveyId}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
