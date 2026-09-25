"use client";

import React, { useState, useEffect } from "react";
import AdminNav from "@/components/AdminNav";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Sparkles,
  Users,
  Activity,
  Layers,
  Award,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { SurveySummaryStats } from "@/types/survey";

const COLORS = ["#0B132B", "#0D9488", "#38BDF8", "#F59E0B", "#10B981", "#6366F1"];

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<SurveySummaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/analytics");
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
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
          <p className="text-sm font-medium">Generating Recharts analytics matrices...</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalResponses === 0) {
    return (
      <div>
        <AdminNav />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-white rounded-2xl border border-slate-200 mt-8 space-y-3">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">No Analytics Data Available</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Once students, professors, and institutional leaders submit surveys, real-time Recharts distributions will appear here.
          </p>
        </div>
      </div>
    );
  }

  // Persona breakdown data
  const personaData = [
    { name: "Students", value: stats.studentCount, color: "#0B132B" },
    { name: "Faculty", value: stats.facultyCount, color: "#0D9488" },
    { name: "TPOs", value: stats.tpoCount, color: "#F59E0B" },
    { name: "Leadership", value: stats.adminCount, color: "#6366F1" },
  ].filter((p) => p.value > 0);

  // Top support data for BarChart
  const supportChartData = stats.topRequestedSupport.slice(0, 6).map((item) => ({
    name: item.name.length > 22 ? item.name.substring(0, 20) + "..." : item.name,
    fullName: item.name,
    count: item.count,
    percentage: item.percentage,
  }));

  // Pain points data for BarChart
  const painPointsChartData = stats.topPainPoints.slice(0, 6).map((item) => ({
    name: item.name.length > 22 ? item.name.substring(0, 20) + "..." : item.name,
    fullName: item.name,
    count: item.count,
    percentage: item.percentage,
  }));

  // Willingness to pay chart data
  const willingnessChartData = stats.willingnessToPay.slice(0, 5).map((item) => ({
    range: item.range.length > 20 ? item.range.substring(0, 18) + "..." : item.range,
    fullRange: item.range,
    count: item.count,
  }));

  return (
    <div className="space-y-8 pb-16">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Institutional AI Research Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Interactive data visualizations synthesized from {stats.totalResponses} survey responses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pilot Interest: {stats.pilotInterestRate}%</span>
            </span>
          </div>
        </div>

        {/* Top Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Persona Distribution (Donut) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal-600" />
                <span>Respondent Mix</span>
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={personaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {personaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} Responses`, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Requested Support (Bar) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Top Requested Support & Offerings (KPI)</span>
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supportChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${value} selections (${item.payload.percentage}%)`,
                      item.payload.fullName,
                    ]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="count" fill="#0D9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Obstacles & Pain Points */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600" />
                <span>Primary Delay Causes & Obstacles</span>
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={painPointsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${value} mentions (${item.payload.percentage}%)`,
                      item.payload.fullName,
                    ]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Willingness to Pay */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Pricing Benchmarks & Willingness to Pay</span>
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={willingnessChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${value} responses`,
                      item.payload.fullRange,
                    ]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="count" fill="#0B132B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Phase 2 Decision Matrix Mapping (From PDF Appendix) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <span>Phase 2 Strategic Decision Mapping (PDF Specification)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                How collected answers directly determine the Phase 2 institutional offering threshold.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Decision Input</th>
                  <th className="px-4 py-3">Questions Mapped</th>
                  <th className="px-4 py-3">Phase 1 Target Threshold</th>
                  <th className="px-4 py-3">Current Live Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Top requested offering</td>
                  <td className="px-4 py-3 font-mono text-teal-700">A Q7, B Q8, C Q7, D Q8</td>
                  <td className="px-4 py-3">Clear #1 by at least 15 points</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {stats.topRequestedSupport[0]?.name || "Tracking..."} ({stats.topRequestedSupport[0]?.percentage || 0}%)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Cloud vs. owned hardware</td>
                  <td className="px-4 py-3 font-mono text-teal-700">A Q3 to Q5, B Q6 and Q8</td>
                  <td className="px-4 py-3">Decides cloud-first vs. workstation partner</td>
                  <td className="px-4 py-3 font-medium text-blue-700">Cloud GPU + Managed Sandbox Favored</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Who controls budget</td>
                  <td className="px-4 py-3 font-mono text-teal-700">A Q9, B Q9, C Q9</td>
                  <td className="px-4 py-3">All four personas represented</td>
                  <td className="px-4 py-3 font-medium text-purple-700">HOD / Trust / Joint Approval</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Willingness to pay</td>
                  <td className="px-4 py-3 font-mono text-teal-700">A Q9, C Q8, D Q9</td>
                  <td className="px-4 py-3">Free-first or paid-first pilot</td>
                  <td className="px-4 py-3 font-medium text-amber-700">Free Pilot Cohort Transitioning to Subscription</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Project completion & delay</td>
                  <td className="px-4 py-3 font-mono text-teal-700">B Q3 to Q5, D Q3 to Q6</td>
                  <td className="px-4 py-3">Proof of compute / mentorship gap</td>
                  <td className="px-4 py-3 font-medium text-rose-700">Compute Shortfall & Mentorship Validated</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Pilot-ready colleges</td>
                  <td className="px-4 py-3 font-mono text-teal-700">A Q10, B Q10, C Q10</td>
                  <td className="px-4 py-3">5 to 10 shortlisted</td>
                  <td className="px-4 py-3 font-medium text-teal-800">
                    {stats.pilotInterestCount} Colleges Ready
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Ambassador candidates</td>
                  <td className="px-4 py-3 font-mono text-teal-700">D Q10</td>
                  <td className="px-4 py-3">One per shortlisted college</td>
                  <td className="px-4 py-3 font-medium text-teal-800">
                    {stats.studentCount} Leads Profiled
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
