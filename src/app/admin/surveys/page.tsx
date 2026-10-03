"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AdminNav from "@/components/AdminNav";
import {
  Search,
  Plus,
  FileText,
  Copy,
  Archive,
  BarChart3,
  Play,
  Settings,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Loader2,
  Share2,
  Building2,
  Eye,
  Check,
  Power,
  RotateCcw,
} from "lucide-react";
import { SurveySchema } from "@/types/schema";

export default function SurveysPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [surveys, setSurveys] = useState<SurveySchema[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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

  // Toggle Publish / Unpublish status
  const handleTogglePublish = async (survey: SurveySchema) => {
    const newStatus = survey.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setActionInProgress(survey.id);
    try {
      const res = await fetch(`/api/surveys/${survey.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSurveys((prev) =>
          prev.map((s) => (s.id === survey.id ? { ...s, status: newStatus } : s))
        );
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  // Archive Survey
  const handleArchive = async (survey: SurveySchema) => {
    if (!confirm(`Are you sure you want to archive "${survey.title}"?`)) return;
    setActionInProgress(survey.id);
    try {
      const res = await fetch(`/api/surveys/${survey.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      const data = await res.json();
      if (data.success) {
        setSurveys((prev) =>
          prev.map((s) => (s.id === survey.id ? { ...s, status: "ARCHIVED" } : s))
        );
      } else {
        alert(data.error || "Failed to archive survey");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  // Duplicate survey
  const handleDuplicate = async (survey: SurveySchema) => {
    setActionInProgress(survey.id);
    try {
      const copyPayload = {
        ...survey,
        id: `surv_${Date.now()}_copy`,
        title: `${survey.title} (Copy)`,
        slug: `${survey.slug || survey.id}-copy-${Date.now().toString().slice(-4)}`,
        status: "DRAFT",
        version: 1,
      };

      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copyPayload),
      });

      const data = await res.json();
      if (data.success) {
        await fetchSurveys();
      } else {
        alert(data.error || "Failed to duplicate survey");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete survey
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this survey? All associated local settings will be removed.")) return;
    try {
      const res = await fetch(`/api/surveys/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSurveys((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(data.error || "Failed to delete survey");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleCopyLink = (survey: SurveySchema) => {
    const url = `${window.location.origin}/surveys/${survey.slug || survey.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(survey.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  const filteredSurveys = surveys.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.company?.name && s.company.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.industry && s.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            PUBLISHED
          </span>
        );
      case "DRAFT":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            DRAFT
          </span>
        );
      case "PAUSED":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            PAUSED
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ARCHIVED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header & New Survey CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Survey Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Create, configure, and monitor multi-industry surveys across organizations.
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

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search survey title, organization, industry or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  statusFilter === tab
                    ? "bg-[#0B132B] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Surveys Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading surveys from Supabase...</p>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Surveys Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {surveys.length === 0
                  ? "No surveys configured yet. Click 'Create New Survey' to get started."
                  : "No surveys match your active filters or search terms."}
              </p>
              {surveys.length === 0 && (
                <div className="pt-2">
                  <Link
                    href="/admin/surveys/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B132B] text-white text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Survey</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Survey &amp; Organization</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Structure</th>
                    <th className="py-3.5 px-4">Responses</th>
                    <th className="py-3.5 px-4">Updated</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSurveys.map((survey) => {
                    const totalQuestions = survey.sections?.reduce(
                      (acc, s) => acc + (s.questions?.length || 0),
                      0
                    ) || 0;
                    const companyName = survey.company?.name || "Kolaba Cloud";
                    const isBusy = actionInProgress === survey.id;

                    return (
                      <tr
                        key={survey.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Survey & Company */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/admin/surveys/${survey.id}/edit`}
                              className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors block text-base"
                            >
                              {survey.title}
                            </Link>
                            {(survey.id === "eng-ai-colleges-2025" || survey.title.includes("Kolaba")) && (
                              <span className="px-2 py-0.5 rounded-md bg-[#0B132B] text-teal-300 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
                                Kolaba Flagship
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{companyName}</span>
                            </span>
                            <span>&bull;</span>
                            <span className="text-slate-600">{survey.industry || "General"}</span>
                            <span>&bull;</span>
                            <span className="font-mono text-slate-400">v{survey.version || 1}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">{getStatusBadge(survey.status)}</td>

                        {/* Sections & Questions */}
                        <td className="py-4 px-4">
                          <div className="text-xs font-semibold text-slate-700">
                            {survey.sections?.length || 1} Section
                            {(survey.sections?.length || 1) > 1 ? "s" : ""},{" "}
                            <span className="text-teal-700">{totalQuestions} Questions</span>
                          </div>
                        </td>

                        {/* Response count */}
                        <td className="py-4 px-4">
                          <div className="text-xs font-bold text-slate-800">
                            {survey.responseCount || 0}
                          </div>
                          <div className="text-[11px] text-slate-400">submissions</div>
                        </td>

                        {/* Updated date */}
                        <td className="py-4 px-4 text-xs text-slate-500">
                          {new Date(survey.updatedAt || survey.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </td>

                        {/* Actions (All in same tab!) */}
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Copy Public Link */}
                            <button
                              onClick={() => handleCopyLink(survey)}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Copy Public Survey Link"
                            >
                              {copiedId === survey.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </button>

                            {/* Open Public Landing / Runner in same tab */}
                            <Link
                              href={`/surveys/${survey.slug || survey.id}`}
                              className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                              title="Open Public Survey (Same Tab)"
                            >
                              <Play className="w-4 h-4" />
                            </Link>

                            {/* Edit in Visual Builder */}
                            <Link
                              href={`/admin/surveys/${survey.id}/edit`}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit Survey (Same Tab)"
                            >
                              <Settings className="w-4 h-4" />
                            </Link>

                            {/* Survey-Specific Responses */}
                            <Link
                              href={`/admin/responses?surveyId=${survey.id}`}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              title="View Responses for this Survey"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>

                            {/* Survey-Specific Analytics */}
                            <Link
                              href={`/admin/analytics?surveyId=${survey.id}`}
                              className="p-2 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                              title="View Analytics for this Survey"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Link>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(survey)}
                              disabled={isBusy}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Duplicate Survey"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Publish / Unpublish Toggle */}
                            <button
                              onClick={() => handleTogglePublish(survey)}
                              disabled={isBusy}
                              className={`p-2 rounded-lg transition-colors ${
                                survey.status === "PUBLISHED"
                                  ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                  : "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                              }`}
                              title={
                                survey.status === "PUBLISHED"
                                  ? "Unpublish (Set to Draft)"
                                  : "Publish Survey"
                              }
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            {/* Archive */}
                            {survey.status !== "ARCHIVED" && (
                              <button
                                onClick={() => handleArchive(survey)}
                                disabled={isBusy}
                                className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Archive Survey"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(survey.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Survey"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
