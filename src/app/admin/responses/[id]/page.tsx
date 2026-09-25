"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import PathVisualizer from "@/components/PathVisualizer";
import {
  ArrowLeft,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
  Sparkles,
  Code,
  CheckCircle2,
  FileText,
  AlertCircle,
  Share2,
} from "lucide-react";
import { SurveyResponse } from "@/types/survey";
import { formatDate } from "@/lib/utils";

export default function ResponseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [response, setResponse] = useState<SurveyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    async function fetchResponse() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/responses/${id}`);
        const data = await res.json();
        if (data.success && data.response) {
          setResponse(data.response);
        } else {
          setError(data.error || "Response record not found");
        }
      } catch (err: any) {
        setError("Network error fetching response details");
      } finally {
        setLoading(false);
      }
    }
    fetchResponse();
  }, [id]);

  if (loading) {
    return (
      <div>
        <AdminNav />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium">Loading survey response...</p>
        </div>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div>
        <AdminNav />
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Survey Record Not Found</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {error || "The requested survey response could not be located."}
          </p>
          <Link
            href="/admin/responses"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B132B] text-white text-xs font-semibold rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Responses</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <AdminNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Navigation header */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/responses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Submissions</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>{showRawJson ? "Hide Raw JSON" : "View Raw JSON"}</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#0B132B] text-white">
                  {response.respondent_type_label}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {response.id}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {response.respondent_name}
              </h1>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="flex items-center sm:justify-end gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Submitted on {formatDate(response.created_at)}</span>
              </div>
              {response.time_spent_seconds ? (
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>Time Spent: {Math.round(response.time_spent_seconds / 60)} min ({response.time_spent_seconds}s)</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Building className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-600">
                  College / Institution
                </div>
                <div className="font-semibold text-slate-900">{response.college || "N/A"}</div>
                {response.department && (
                  <div className="text-xs text-teal-700 font-medium mt-0.5">
                    Dept: {response.department}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Mail className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-600">
                  Contact Coordinates
                </div>
                <div className="font-semibold text-slate-900">{response.email}</div>
                {response.phone && (
                  <div className="text-xs text-slate-600 mt-0.5">{response.phone}</div>
                )}
              </div>
            </div>
          </div>

          {/* Pilot Interest & Consent status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span className="font-semibold text-teal-950">
                Consent Verified: {response.consent ? "Yes (Agreed to contact & research storage)" : "No"}
              </span>
            </div>

            {response.pilot_interest && (
              <div className="flex items-center gap-1.5 font-bold text-teal-800">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Pilot Intent: {String(response.pilot_interest)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chained Logic Flow Path Visualizer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <PathVisualizer
            surveyPath={response.survey_path}
            respondentTypeLabel={response.respondent_type_label}
          />
        </div>

        {/* Raw JSON viewer */}
        {showRawJson && (
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-bold text-teal-400">
              Raw Supabase JSON Record:
            </div>
            <pre className="text-xs font-mono overflow-x-auto p-3 bg-slate-950 rounded-lg text-emerald-400">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
