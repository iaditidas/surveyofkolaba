"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { SurveyResponse } from "@/types/survey";
import { SurveySchema } from "@/types/schema";
import {
  Users,
  Search,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  Trash2,
  X,
  FileSpreadsheet,
  Building2,
  Eye,
  ArrowLeft,
  Loader2,
  Calendar,
  Layers,
  HelpCircle,
} from "lucide-react";

function renderFormattedAnswer(ans: any) {
  if (ans === undefined || ans === null || ans === "") {
    return <span className="text-xs text-slate-400 italic">No answer recorded</span>;
  }

  // If object with selected and observation
  if (typeof ans === "object" && !Array.isArray(ans) && "selected" in ans) {
    const sel = ans.selected;
    const obs = ans.observation;
    return (
      <div className="space-y-2">
        <div className="text-xs sm:text-sm font-semibold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200">
          {Array.isArray(sel) ? sel.join(", ") : String(sel)}
        </div>
        {obs && (
          <div className="text-xs bg-amber-50 text-amber-900 border border-amber-200 rounded-lg p-2.5">
            <span className="font-bold not-italic text-amber-800 block text-[10px] uppercase tracking-wider">
              Observation / Note:
            </span>
            <span>"{obs}"</span>
          </div>
        )}
      </div>
    );
  }

  // If array of choices
  if (Array.isArray(ans)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {ans.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200"
          >
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  // If boolean
  if (typeof ans === "boolean") {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
          ans ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-700"
        }`}
      >
        {ans ? "Yes" : "No"}
      </span>
    );
  }

  // If composite/contact object (key-values)
  if (typeof ans === "object") {
    const entries = Object.entries(ans).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    );
    if (entries.length === 0) {
      return <span className="text-xs text-slate-400 italic">Empty</span>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {entries.map(([k, v]) => {
          const formattedKey = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <div key={k} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {formattedKey}
              </span>
              <span className="font-bold text-slate-800">
                {Array.isArray(v) ? v.join(", ") : String(v)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // String / Number
  return (
    <div className="text-xs sm:text-sm font-semibold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200">
      {String(ans)}
    </div>
  );
}

function AdminResponsesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSurveyId = searchParams.get("surveyId");

  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [surveys, setSurveys] = useState<SurveySchema[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(initialSurveyId || "");
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
        // Default to first survey if not provided
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
      fetchResponses(selectedSurveyId);
    }
  }, [authenticated, selectedSurveyId]);

  const fetchResponses = async (surveyId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/responses?surveyId=${encodeURIComponent(surveyId)}`);
      const data = await res.json();
      if (data.success) {
        setResponses(data.responses || []);
      }
    } catch (err) {
      console.error("Failed to load responses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResponse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this response?")) return;

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/responses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setResponses((prev) => prev.filter((r) => r.id !== id));
        if (selectedResponse?.id === id) setSelectedResponse(null);
      }
    } catch (err) {
      alert("Failed to delete response.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAllResponses = async () => {
    if (!window.confirm("Are you sure you want to permanently clear ALL responses? This cannot be undone.")) return;

    setIsDeleting("all");
    try {
      const res = await fetch("/api/admin/responses?clearAll=true", { method: "DELETE" });
      if (res.ok) {
        setResponses([]);
        setSelectedResponse(null);
      }
    } catch {
      alert("Failed to clear responses.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  const currentSurvey = surveys.find((s) => s.id === selectedSurveyId || s.slug === selectedSurveyId);

  const filteredResponses = responses.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      r.respondent_name?.toLowerCase().includes(q) ||
      r.college?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  const exportUrl = `/api/admin/responses?format=csv&surveyId=${encodeURIComponent(selectedSurveyId)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header with Survey Selector Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
              Survey-Scoped Submissions
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {currentSurvey ? currentSurvey.title : "Survey Responses"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Showing responses isolated strictly for {currentSurvey?.company?.name || "this survey"}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Survey Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Survey:
              </span>
              <select
                value={selectedSurveyId}
                onChange={(e) => setSelectedSurveyId(e.target.value)}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs max-w-[240px] truncate"
              >
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.company?.name || "Kolaba"})
                  </option>
                ))}
              </select>
            </div>

            {responses.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllResponses}
                disabled={isDeleting === "all"}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors shadow-xs"
                title="Permanently clear all submissions"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting === "all" ? "Clearing..." : "Wipe All"}</span>
              </button>
            )}

            <a
              href={exportUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B132B] text-white text-xs font-bold hover:bg-slate-800 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <span>Export CSV</span>
            </a>
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

        {/* Search bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by respondent name, organization, email, or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="text-xs font-bold text-slate-500">
            {filteredResponses.length} response{filteredResponses.length === 1 ? "" : "s"} found
          </div>
        </div>

        {/* Responses Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Fetching responses...</p>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Responses Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {responses.length === 0
                  ? "No submissions have been recorded for this survey yet."
                  : "No submissions match your search query."}
              </p>
              {currentSurvey && (
                <div className="pt-2">
                  <Link
                    href={`/surveys/${currentSurvey.slug || currentSurvey.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    <span>Open Public Survey</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Respondent</th>
                    <th className="py-3.5 px-4">Role / Track</th>
                    <th className="py-3.5 px-4">Organization</th>
                    <th className="py-3.5 px-4">Submitted At</th>
                    <th className="py-3.5 px-4">Time Spent</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResponses.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedResponse(r)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {r.respondent_name || "Anonymous"}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          {r.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{r.email}</span>
                            </span>
                          )}
                          {r.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{r.phone}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 capitalize">
                          {r.respondent_type_label || r.respondent_type || "Respondent"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                        {r.college || "Not Specified"}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(r.created_at || "").toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {r.time_spent_seconds ? `${Math.round(r.time_spent_seconds / 60)} min` : "1 min"}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResponse(r);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteResponse(r.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Response Details Slide-over Drawer / Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Submission Detail
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedResponse.respondent_name || "Anonymous Respondent"}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {selectedResponse.id}</p>
              </div>

              <button
                onClick={() => setSelectedResponse(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Respondent Info Cards */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Email</span>
                  <span className="font-bold text-slate-800">{selectedResponse.email || "Not Provided"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Phone</span>
                  <span className="font-bold text-slate-800">{selectedResponse.phone || "Not Provided"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Organization / College</span>
                  <span className="font-bold text-slate-800">{selectedResponse.college || "Not Specified"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Submitted Date</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedResponse.created_at || "").toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Answers Breakdown according to survey sections & survey path */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>Recorded Survey Answers</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {Object.keys(selectedResponse.answers || {}).length} Fields Recorded
                  </span>
                </div>

                {/* If survey_path is recorded, display the sequential question trace */}
                {Array.isArray(selectedResponse.survey_path) && selectedResponse.survey_path.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 flex items-center justify-between">
                      <span>Conversational Survey Path Trace</span>
                      <span>{selectedResponse.survey_path.length} questions answered</span>
                    </div>

                    <div className="space-y-3">
                      {selectedResponse.survey_path.map((step, idx) => (
                        <div
                          key={step.questionId || idx}
                          className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                              Step {step.stepNumber || idx + 1} · {step.questionId}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 leading-snug">
                            {step.questionTitle}
                          </div>
                          <div className="pt-1">
                            {renderFormattedAnswer(
                              selectedResponse.answers?.[step.questionId] ?? step.rawAnswer ?? step.answerSummary
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : currentSurvey?.sections ? (
                  (() => {
                    const answeredSections = currentSurvey.sections
                      .map((sec) => ({
                        ...sec,
                        answeredQuestions: sec.questions.filter(
                          (q) => selectedResponse.answers?.[q.id] !== undefined
                        ),
                      }))
                      .filter((sec) => sec.answeredQuestions.length > 0);

                    if (answeredSections.length === 0) {
                      return (
                        <div className="space-y-2.5">
                          {Object.entries(selectedResponse.answers || {}).map(([key, val]) => (
                            <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                              <span className="font-mono text-xs font-bold text-teal-700 block">{key}</span>
                              <div>{renderFormattedAnswer(val)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {answeredSections.map((section, sIdx) => (
                          <div key={section.id || sIdx} className="space-y-3 pt-1">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center justify-between">
                              <span>{section.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {section.answeredQuestions.length} questions
                              </span>
                            </div>

                            {section.answeredQuestions.map((q) => {
                              const ans = selectedResponse.answers[q.id];
                              return (
                                <div
                                  key={q.id}
                                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                                      {q.id}
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-800 leading-snug">
                                    {q.title}
                                  </div>
                                  <div className="pt-1">
                                    {renderFormattedAnswer(ans)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-2.5">
                    {Object.entries(selectedResponse.answers || {}).map(([key, val]) => (
                      <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="font-mono text-xs font-bold text-teal-700 block">{key}</span>
                        <div>{renderFormattedAnswer(val)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={(e) => handleDeleteResponse(selectedResponse.id, e)}
                disabled={isDeleting === selectedResponse.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Submission</span>
              </button>

              <button
                onClick={() => setSelectedResponse(null)}
                className="px-5 py-2 rounded-xl bg-[#0B132B] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminResponsesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
      }
    >
      <AdminResponsesContent />
    </Suspense>
  );
}
