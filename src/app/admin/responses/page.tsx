"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Calendar,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  FileText,
} from "lucide-react";
import { SurveyResponse, RespondentType } from "@/types/survey";
import { formatDate } from "@/lib/utils";

export default function AdminResponsesPage() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [pilotOnly, setPilotOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/responses");
      const data = await res.json();
      if (data.success && Array.isArray(data.responses)) {
        setResponses(data.responses);
      } else {
        setError(data.error || "Failed to load responses");
      }
    } catch (err: any) {
      setError("Network error fetching survey responses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered responses logic
  const filtered = responses
    .filter((r) => {
      // Type filter
      if (selectedType !== "all" && r.respondent_type !== selectedType) {
        return false;
      }

      // Pilot filter
      if (pilotOnly) {
        const isPilot =
          r.pilot_interest &&
          r.pilot_interest !== "No" &&
          r.pilot_interest !== "Not right now" &&
          r.pilot_interest !== "false";
        if (!isPilot) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.respondent_name?.toLowerCase().includes(q);
        const matchesCollege = r.college?.toLowerCase().includes(q);
        const matchesEmail = r.email?.toLowerCase().includes(q);
        const matchesDept = r.department?.toLowerCase().includes(q);
        if (!matchesName && !matchesCollege && !matchesEmail && !matchesDept) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const filterTabs = [
    { id: "all", label: "All Submissions" },
    { id: "student", label: "Students", icon: GraduationCap },
    { id: "faculty", label: "Faculty", icon: BookOpen },
    { id: "tpo", label: "TPOs", icon: Briefcase },
    { id: "admin", label: "Leadership", icon: Building2 },
  ];

  return (
    <div className="space-y-8 pb-16">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Survey Responses Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Showing {filtered.length} of {responses.length} recorded submissions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh Responses"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <a
              href="/api/admin/responses?format=csv"
              download
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student, professor name, college, email or department..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:ring-2 focus:ring-[#0B132B] focus:bg-white"
              />
            </div>

            {/* Pilot Checkbox Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={pilotOnly}
                onChange={(e) => setPilotOnly(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span>Pilot Interested Only</span>
            </label>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
            </button>
          </div>

          {/* Persona Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedType(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#0B132B] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Responses Table / Card list */}
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium">Loading filtered responses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Matching Responses</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No survey submissions matched your current search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Respondent Info</th>
                    <th className="px-5 py-3.5">Track / Role</th>
                    <th className="px-5 py-3.5">College & Dept</th>
                    <th className="px-5 py-3.5">Path Steps</th>
                    <th className="px-5 py-3.5">Pilot Interest</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {r.respondent_name}
                        </div>
                        <div className="text-[11px] text-slate-500">{r.email}</div>
                        {r.phone && <div className="text-[11px] text-slate-400">{r.phone}</div>}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {r.respondent_type_label}
                        </span>
                        {r.role && (
                          <div className="text-[11px] text-slate-500 mt-1">{r.role}</div>
                        )}
                      </td>

                      <td className="px-5 py-4 max-w-[220px]">
                        <div className="font-medium text-slate-900 truncate">
                          {r.college || "N/A"}
                        </div>
                        {r.department && (
                          <div className="text-[11px] text-teal-700 font-medium truncate">
                            {r.department}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{r.survey_path?.length || 0} Qs answered</span>
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {r.pilot_interest &&
                        r.pilot_interest !== "No" &&
                        r.pilot_interest !== "Not right now" &&
                        r.pilot_interest !== "false" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pilot Ready</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">No pilot</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/responses/${r.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B132B] text-white hover:bg-slate-800 text-xs font-semibold transition-all shadow-xs"
                        >
                          <span>Inspect Flow</span>
                          <ArrowRight className="w-3 h-3 text-teal-400" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
