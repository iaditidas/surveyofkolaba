"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { SurveySummaryStats } from "@/types/survey";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<SurveySummaryStats | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("kolaba_admin_session");
    if (!session) {
      router.push("/admin/login");
      return;
    }
    setAuthenticated(true);
    fetchAnalytics();
  }, [router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
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

  const roleDistribution = stats
    ? [
        { name: "Students", value: stats.studentCount, color: "#3B82F6" },
        { name: "Faculty", value: stats.facultyCount, color: "#10B981" },
        { name: "TPOs", value: stats.tpoCount, color: "#8B5CF6" },
        { name: "Leadership", value: stats.adminCount, color: "#F59E0B" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Survey Analytics &amp; Strategic Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregated institutional needs, GPU bottlenecks, and collaboration willingness
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Calculating analytics...</div>
        ) : !stats || stats.totalResponses === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
            <p className="text-sm font-semibold text-slate-700">No response data available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution Pie Chart */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Respondent Distribution by Track</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Pain Points / Bottlenecks */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Top Reported Compute &amp; AI Bottlenecks</h3>
              </div>
              <div className="space-y-3">
                {stats.topPainPoints && stats.topPainPoints.length > 0 ? (
                  stats.topPainPoints.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item.name}</span>
                        <span>{item.count} mentions</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#0B132B] h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, (item.count / (stats.totalResponses || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No bottleneck data collected yet</p>
                )}
              </div>
            </div>

            {/* Top Requested Support */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Most Desired Support Programs</h3>
              </div>
              <div className="space-y-3">
                {stats.topRequestedSupport && stats.topRequestedSupport.length > 0 ? (
                  stats.topRequestedSupport.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item.name}</span>
                        <span>{item.count} requests</span>
                      </div>
                      <div className="w-full bg-teal-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-teal-600 h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, (item.count / (stats.totalResponses || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No support request data collected yet</p>
                )}
              </div>
            </div>

            {/* Willingness to Pay / Model */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Willingness to Pay &amp; Pricing Sizing</h3>
              </div>
              <div className="space-y-3">
                {stats.willingnessToPay && stats.willingnessToPay.length > 0 ? (
                  stats.willingnessToPay.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item.range}</span>
                        <span>{item.count} respondents</span>
                      </div>
                      <div className="w-full bg-indigo-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, (item.count / (stats.totalResponses || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No pricing data collected yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
