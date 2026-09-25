"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import {
  Users,
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Activity,
  ChevronRight,
} from "lucide-react";
import { SurveySummaryStats } from "@/types/survey";
import { formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SurveySummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/analytics");
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        } else {
          setError(data.error || "Failed to load dashboard data");
        }
      } catch (err: any) {
        setError("Network error loading dashboard statistics");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div>
        <AdminNav />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium">Aggregating survey statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <AdminNav />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Dashboard Data Unavailable</h2>
          <p className="text-sm text-slate-600">{error || "No response data found"}</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Responses",
      value: stats.totalResponses,
      sublabel: "Completed surveys",
      icon: Users,
      color: "text-slate-900 bg-slate-100",
    },
    {
      label: "Student / Club Leads",
      value: stats.studentCount,
      sublabel: `${stats.totalResponses > 0 ? Math.round((stats.studentCount / stats.totalResponses) * 100) : 0}% of responses`,
      icon: GraduationCap,
      color: "text-blue-700 bg-blue-50",
    },
    {
      label: "HOD / Faculty",
      value: stats.facultyCount,
      sublabel: `${stats.totalResponses > 0 ? Math.round((stats.facultyCount / stats.totalResponses) * 100) : 0}% of responses`,
      icon: BookOpen,
      color: "text-teal-700 bg-teal-50",
    },
    {
      label: "Placement Officers (TPOs)",
      value: stats.tpoCount,
      sublabel: `${stats.totalResponses > 0 ? Math.round((stats.tpoCount / stats.totalResponses) * 100) : 0}% of responses`,
      icon: Briefcase,
      color: "text-amber-700 bg-amber-50",
    },
    {
      label: "Principals & Deans",
      value: stats.adminCount,
      sublabel: `${stats.totalResponses > 0 ? Math.round((stats.adminCount / stats.totalResponses) * 100) : 0}% of responses`,
      icon: Building2,
      color: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "Pilot Interest Rate",
      value: `${stats.pilotInterestRate}%`,
      sublabel: `${stats.pilotInterestCount} colleges interested in pilot`,
      icon: Sparkles,
      color: "text-emerald-700 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Welcome & Export Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Executive Research Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Live intelligence from engineering colleges across India for Kolaba Cloud AI.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/admin/responses?format=csv"
              download
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download CSV Report</span>
            </a>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#0B132B] text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>Detailed Visual Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
            </Link>
          </div>
        </div>

        {/* Empty State if 0 responses */}
        {stats.totalResponses === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Responses Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                No survey submissions have been recorded in the database yet. Submit the survey on the live form to see metrics populating automatically.
              </p>
            </div>
            <Link
              href="/survey"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B132B] text-white text-xs font-semibold"
            >
              <span>Submit First Survey Response</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {kpi.label}
                      </span>
                      <div className={`p-2 rounded-xl ${kpi.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {kpi.value}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{kpi.sublabel}</div>
                  </div>
                );
              })}
            </div>

            {/* Strategic Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Requested Support */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Top Requested Support / Offerings
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Phase 1 KPI</span>
                </div>

                <div className="space-y-3">
                  {stats.topRequestedSupport.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-800">{item.name}</span>
                        <span className="text-slate-500 font-semibold">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Pain Points / Delays */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Common Obstacles & Bottlenecks
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Pain Point Severity</span>
                </div>

                <div className="space-y-3">
                  {stats.topPainPoints.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-800">{item.name}</span>
                        <span className="text-slate-500 font-semibold">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Responses Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Recent Submissions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showing latest completed surveys across all 4 tracks.
                  </p>
                </div>

                <Link
                  href="/admin/responses"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  <span>View All Responses ({stats.totalResponses})</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Respondent</th>
                      <th className="px-5 py-3">Role / Track</th>
                      <th className="px-5 py-3">College</th>
                      <th className="px-5 py-3">Pilot Interest</th>
                      <th className="px-5 py-3">Submitted</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentResponses.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{r.respondent_name}</div>
                          <div className="text-[11px] text-slate-400">{r.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {r.respondent_type_label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 max-w-[200px] truncate">
                          {r.college || "N/A"}
                        </td>
                        <td className="px-5 py-3.5">
                          {r.pilot_interest && r.pilot_interest !== "No" && r.pilot_interest !== "Not right now" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Interested</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px]">None</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/admin/responses/${r.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-[#0B132B] hover:text-white text-slate-700 text-xs font-semibold transition-all"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
