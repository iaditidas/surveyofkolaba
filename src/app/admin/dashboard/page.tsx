"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { SurveyResponse, SurveySummaryStats, RespondentType } from "@/types/survey";
import {
  Users,
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  Sparkles,
  Download,
  Search,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  Trash2,
  X,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<SurveySummaryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Check session
    const session = sessionStorage.getItem("kolaba_admin_session");
    if (!session) {
      router.push("/admin/login");
      return;
    }
    setAuthenticated(true);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resResp, resStats] = await Promise.all([
        fetch("/api/admin/responses"),
        fetch("/api/admin/analytics"),
      ]);

      const dataResp = await resResp.json();
      const dataStats = await resStats.json();

      if (dataResp.success) setResponses(dataResp.responses || []);
      if (dataStats.success) setStats(dataStats.stats || null);
    } catch (err) {
      console.error("Failed to load admin data:", err);
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

  // Filtered responses list
  const filteredResponses = responses.filter((r) => {
    const matchesRole = selectedRole === "all" || r.respondent_type === selectedRole;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.respondent_name?.toLowerCase().includes(q) ||
      r.college?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);

    return matchesRole && matchesSearch;
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  const roleMeta: Record<RespondentType, { label: string; color: string; icon: any }> = {
    student: { label: "Student", color: "bg-blue-50 text-blue-700 border-blue-200", icon: GraduationCap },
    faculty: { label: "Faculty", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: BookOpen },
    tpo: { label: "Placement (TPO)", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Briefcase },
    admin: { label: "Principal/Dean", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Building2 },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Survey Responses Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live responses gathered across engineering colleges for GPU &amp; AI infrastructure research
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              Refresh Data
            </button>
            <a
              href="/api/admin/responses?format=csv"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B132B] text-white text-xs font-bold hover:bg-slate-800 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <span>Download CSV</span>
            </a>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Responses
            </span>
            <div className="text-2xl font-black text-slate-900">{responses.length}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600 text-[11px] font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Students</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {responses.filter((r) => r.respondent_type === "student").length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Faculty</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {responses.filter((r) => r.respondent_type === "faculty").length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-purple-600 text-[11px] font-bold uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5" />
              <span>TPOs</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {responses.filter((r) => r.respondent_type === "tpo").length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 text-[11px] font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>Leadership</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {responses.filter((r) => r.respondent_type === "admin").length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-teal-800 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Pilot Interest</span>
            </div>
            <div className="text-2xl font-black text-teal-900">
              {
                responses.filter(
                  (r) =>
                    r.pilot_interest &&
                    r.pilot_interest !== "No" &&
                    r.pilot_interest !== false &&
                    r.pilot_interest !== "None"
                ).length
              }
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by respondent name, college, email, or department..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: "all", label: "All Tracks" },
                { id: "student", label: "Students" },
                { id: "faculty", label: "Faculty" },
                { id: "tpo", label: "TPOs" },
                { id: "admin", label: "Leadership" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedRole(pill.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    selectedRole === pill.id
                      ? "bg-[#0B132B] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responses Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Captured Submissions ({filteredResponses.length})
            </h2>
            <span className="text-xs text-slate-500">Click any row to inspect all answers</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">Loading survey responses...</div>
          ) : filteredResponses.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No responses match your search filter</p>
              <p className="text-xs text-slate-400">Try clearing your search query or selecting &quot;All Tracks&quot;</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Respondent</th>
                    <th className="py-3.5 px-4">Track</th>
                    <th className="py-3.5 px-4">College / Dept</th>
                    <th className="py-3.5 px-4">Pilot Interest</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResponses.map((r) => {
                    const roleInfo = roleMeta[r.respondent_type] || roleMeta.student;
                    const RoleIcon = roleInfo.icon;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedResponse(r)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {r.respondent_name || "Anonymous"}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{r.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${roleInfo.color}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            <span>{roleInfo.label}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 text-xs sm:text-sm">
                            {r.college || "Not Specified"}
                          </div>
                          {r.department && (
                            <div className="text-xs text-slate-500">{r.department}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.pilot_interest &&
                          r.pilot_interest !== "No" &&
                          r.pilot_interest !== false &&
                          r.pilot_interest !== "None" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Interested</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Standard</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(r.created_at || Date.now()).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedResponse(r);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteResponse(r.id, e)}
                              disabled={isDeleting === r.id}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Delete Response"
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

      {/* Response Detail Drawer / Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  {selectedResponse.respondent_type_label || selectedResponse.respondent_type}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedResponse.respondent_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {selectedResponse.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedResponse(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Profile Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs sm:text-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Contact Information
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 text-xs">College:</span>
                    <div className="font-bold text-slate-900">{selectedResponse.college || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Department:</span>
                    <div className="font-bold text-slate-900">{selectedResponse.department || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Email:</span>
                    <div className="font-bold text-slate-900">
                      <a href={`mailto:${selectedResponse.email}`} className="text-teal-700 underline">
                        {selectedResponse.email}
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Phone:</span>
                    <div className="font-bold text-slate-900">{selectedResponse.phone || "N/A"}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Consent:</span>
                  <span className={selectedResponse.consent ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                    {selectedResponse.consent ? "✓ Yes" : "✗ No"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Time Spent:</span>
                  <span className="font-bold text-slate-900">
                    {Math.floor((selectedResponse.time_spent_seconds || 0) / 60)}m{" "}
                    {(selectedResponse.time_spent_seconds || 0) % 60}s
                  </span>
                </div>
              </div>

              {/* Step by Step Answers */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                  Survey Answers ({selectedResponse.survey_path?.length || Object.keys(selectedResponse.answers || {}).length} Questions)
                </h4>

                {selectedResponse.survey_path && selectedResponse.survey_path.length > 0 ? (
                  selectedResponse.survey_path.map((step, idx) => (
                    <div
                      key={step.questionId || idx}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2"
                    >
                      <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                        Question {step.stepNumber || idx + 1} ({step.questionId})
                      </div>
                      <div className="text-sm font-bold text-slate-900">{step.questionTitle}</div>
                      <div className="p-3 bg-slate-50 rounded-lg text-xs sm:text-sm font-medium text-slate-800 border border-slate-100">
                        {typeof step.rawAnswer === "object" ? (
                          <pre className="whitespace-pre-wrap font-sans">
                            {JSON.stringify(step.rawAnswer, null, 2)}
                          </pre>
                        ) : (
                          step.answerSummary || String(step.rawAnswer || "N/A")
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  Object.entries(selectedResponse.answers || {}).map(([qKey, qVal]) => (
                    <div
                      key={qKey}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5"
                    >
                      <div className="text-xs font-bold text-teal-700">{qKey}</div>
                      <div className="p-3 bg-slate-50 rounded-lg text-xs sm:text-sm font-medium text-slate-800">
                        {typeof qVal === "object" ? (
                          <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(qVal, null, 2)}</pre>
                        ) : (
                          String(qVal)
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Submitted {new Date(selectedResponse.created_at || Date.now()).toLocaleString("en-IN")}
              </span>
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
