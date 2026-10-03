"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import {
  FileBox,
  GraduationCap,
  Briefcase,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  Copy,
  CheckCircle2,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface SurveyTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  questionCount: number;
  estMinutes: number;
  icon: any;
  color: string;
  previewQuestions: string[];
}

const TEMPLATES: SurveyTemplate[] = [
  {
    id: "tpl_eng_edu",
    title: "Engineering Colleges AI & GPU Readiness",
    category: "Higher Education",
    description: "Multi-track survey evaluating AI compute bottlenecks, NVIDIA GPU lab access, and syllabus modernization.",
    questionCount: 12,
    estMinutes: 4,
    icon: GraduationCap,
    color: "from-teal-500 to-emerald-600",
    previewQuestions: [
      "What is your primary affiliation (Dean, Faculty, TPO, Student)?",
      "Does your department have dedicated NVIDIA GPUs for student labs?",
      "How severe is GPU compute limitation in completing final-year projects?",
      "Interest in Kolaba Cloud AI Sandbox & GPU pilot program",
    ],
  },
  {
    id: "tpl_saas_csat",
    title: "SaaS Customer Satisfaction & NPS",
    category: "Product & SaaS",
    description: "Measure Net Promoter Score, core feature utility, customer sentiment, and unblock key expansion signals.",
    questionCount: 8,
    estMinutes: 3,
    icon: Briefcase,
    color: "from-blue-500 to-indigo-600",
    previewQuestions: [
      "How likely are you to recommend our software to a colleague (0-10)?",
      "What is the single most valuable workflow in our platform?",
      "What missing capability would make you 10x more productive?",
    ],
  },
  {
    id: "tpl_employee_pulse",
    title: "Quarterly Employee Pulse & Culture",
    category: "Human Resources",
    description: "Anonymous workplace survey assessing team morale, managerial support, psychological safety, and growth.",
    questionCount: 10,
    estMinutes: 4,
    icon: Users,
    color: "from-purple-500 to-violet-600",
    previewQuestions: [
      "Select your departmental function and tenure",
      "Rate your current work-life balance satisfaction (1-5)",
      "How clear is your quarterly career development path?",
      "Anonymous suggestions for executive leadership",
    ],
  },
  {
    id: "tpl_event_feedback",
    title: "Hackathon & Tech Event Post-Mortem",
    category: "Developer Relations",
    description: "Post-event participant feedback for hackathons, workshops, and AI developer conferences.",
    questionCount: 7,
    estMinutes: 2,
    icon: Sparkles,
    color: "from-amber-500 to-orange-600",
    previewQuestions: [
      "Which workshop or track was most valuable to you?",
      "Rate the mentoring and technical support received during the hackathon",
      "Would you attend next year's edition?",
    ],
  },
  {
    id: "tpl_healthcare_intake",
    title: "Digital Health & Clinic Patient Intake",
    category: "Healthcare",
    description: "Pre-consultation digital questionnaire covering symptoms, history, medication, and consent.",
    questionCount: 11,
    estMinutes: 5,
    icon: Building2,
    color: "from-rose-500 to-pink-600",
    previewQuestions: [
      "Reason for current medical consultation",
      "Current prescription medications & allergies",
      "Preferred follow-up communication (Email / SMS / WhatsApp)",
    ],
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("kolaba_admin_session");
    if (!session) {
      router.push("/admin/login");
      return;
    }
    setAuthenticated(true);
  }, [router]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  const filteredTemplates = TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === "ALL" || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = async (template: SurveyTemplate) => {
    setCreatingId(template.id);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.title,
          description: template.description,
          industry: template.category,
          status: "DRAFT",
          sections: [
            {
              id: `sec_${Date.now()}`,
              title: "Primary Assessment",
              order: 1,
              visibility: "VISIBLE",
              questions: template.previewQuestions.map((q, idx) => ({
                id: `q_${Date.now()}_${idx}`,
                type: idx === 0 ? "single-choice" : idx === 1 ? "rating" : "short-text",
                title: q,
                required: true,
                visibility: "VISIBLE",
                order: idx + 1,
                min: 1,
                max: 5,
              })),
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success && data.survey) {
        router.push(`/admin/surveys/${data.survey.id}/edit`);
      } else {
        alert(data.error || "Failed to create survey from template");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>Survey Templates Library</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Curated
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select a pre-designed, battle-tested template or launch from an industry-specific framework.
            </p>
          </div>

          <Link
            href="/admin/surveys/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B132B] text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Generate with AI</span>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by keyword..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "Higher Education", "Product & SaaS", "Human Resources", "Developer Relations", "Healthcare"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? "bg-[#0B132B] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => {
            const Icon = tpl.icon;
            const isBusy = creatingId === tpl.id;

            return (
              <div
                key={tpl.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${tpl.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      {tpl.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Sample questions preview */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">Sample Questions:</span>
                    {tpl.previewQuestions.slice(0, 3).map((pq, idx) => (
                      <div key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-slate-400 font-mono">•</span>
                        <span className="line-clamp-1">{pq}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>{tpl.questionCount} Questions</span>
                    <span>&bull;</span>
                    <span>~{tpl.estMinutes} mins to complete</span>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(tpl)}
                    disabled={isBusy}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0B132B] text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Use Template</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
