"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AdminNav from "@/components/AdminNav";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Settings,
  Eye,
  Play,
  Layers,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GitBranch,
  Sliders,
  CheckCircle2,
  Copy,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  SurveySchema,
  SurveySection,
  SurveyQuestion,
  QuestionType,
  LogicRule,
} from "@/types/schema";

const QUESTION_TYPES: { type: QuestionType; label: string; icon: string }[] = [
  { type: "single-choice", label: "Single Choice (Radio)", icon: "🔘" },
  { type: "multi-choice", label: "Multiple Choice (Checkboxes)", icon: "☑️" },
  { type: "short-text", label: "Short Text Input", icon: "✏️" },
  { type: "long-text", label: "Long Paragraph", icon: "📝" },
  { type: "rating", label: "Star / Number Rating", icon: "⭐" },
  { type: "linear-scale", label: "Likert / Linear Scale (0-10)", icon: "📊" },
  { type: "yes-no", label: "Yes / No Question", icon: "👍" },
  { type: "dropdown", label: "Dropdown Select", icon: "🔽" },
  { type: "email", label: "Email Address", icon: "✉️" },
  { type: "phone", label: "Phone Number", icon: "📞" },
];

export default function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [survey, setSurvey] = useState<SurveySchema | null>(null);
  const [activeTab, setActiveTab] = useState<"questions" | "logic" | "settings">("questions");

  useEffect(() => {
    const session = sessionStorage.getItem("kolaba_admin_session");
    if (!session) {
      router.push("/admin/login");
      return;
    }
    setAuthenticated(true);
    fetchSurvey();
  }, [id, router]);

  const fetchSurvey = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/surveys/${id}`);
      const data = await res.json();
      if (data.success && data.survey) {
        setSurvey(data.survey);
      } else {
        alert(data.error || "Failed to load survey");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (statusOverride?: SurveySchema["status"]) => {
    if (!survey) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        ...survey,
        status: statusOverride || survey.status,
      };

      const res = await fetch(`/api/surveys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.survey) {
        setSurvey(data.survey);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || "Failed to save survey");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Section Handlers
  const addSection = () => {
    if (!survey) return;
    const newSection: SurveySection = {
      id: `sec_${Date.now()}`,
      title: `New Section ${survey.sections.length + 1}`,
      description: "",
      order: survey.sections.length + 1,
      visibility: "VISIBLE",
      questions: [
        {
          id: `q_${Date.now()}`,
          type: "short-text",
          title: "New Question",
          required: true,
          visibility: "VISIBLE",
          order: 1,
        },
      ],
    };
    setSurvey({ ...survey, sections: [...survey.sections, newSection] });
  };

  const removeSection = (sIdx: number) => {
    if (!survey || survey.sections.length <= 1) {
      alert("A survey must have at least one section.");
      return;
    }
    const updated = { ...survey };
    updated.sections.splice(sIdx, 1);
    setSurvey(updated);
  };

  // Question Handlers
  const addQuestion = (sIdx: number) => {
    if (!survey) return;
    const updated = { ...survey };
    const qCount = updated.sections[sIdx].questions.length;
    const newQ: SurveyQuestion = {
      id: `q_${Date.now()}`,
      type: "single-choice",
      title: "Untitled Question",
      required: true,
      visibility: "VISIBLE",
      order: qCount + 1,
      options: [
        { id: `opt_${Date.now()}_1`, label: "Option 1" },
        { id: `opt_${Date.now()}_2`, label: "Option 2" },
      ],
    };
    updated.sections[sIdx].questions.push(newQ);
    setSurvey(updated);
  };

  const removeQuestion = (sIdx: number, qIdx: number) => {
    if (!survey) return;
    const updated = { ...survey };
    updated.sections[sIdx].questions.splice(qIdx, 1);
    setSurvey(updated);
  };

  const updateQuestion = (sIdx: number, qIdx: number, updates: Partial<SurveyQuestion>) => {
    if (!survey) return;
    const updated = { ...survey };
    updated.sections[sIdx].questions[qIdx] = {
      ...updated.sections[sIdx].questions[qIdx],
      ...updates,
    };
    setSurvey(updated);
  };

  const addOption = (sIdx: number, qIdx: number) => {
    if (!survey) return;
    const updated = { ...survey };
    const q = updated.sections[sIdx].questions[qIdx];
    const opts = q.options || [];
    opts.push({ id: `opt_${Date.now()}`, label: `Option ${opts.length + 1}` });
    q.options = opts;
    setSurvey(updated);
  };

  const removeOption = (sIdx: number, qIdx: number, optIdx: number) => {
    if (!survey) return;
    const updated = { ...survey };
    const q = updated.sections[sIdx].questions[qIdx];
    if (q.options) {
      q.options.splice(optIdx, 1);
    }
    setSurvey(updated);
  };

  // Logic Rule Handlers
  const addLogicRule = () => {
    if (!survey) return;
    const allQuestions = survey.sections.flatMap((s) => s.questions);
    if (allQuestions.length < 2) {
      alert("You need at least 2 questions to configure conditional branching.");
      return;
    }

    const newRule: LogicRule = {
      id: `rule_${Date.now()}`,
      action: "show",
      targetId: allQuestions[1]?.id || "",
      matchType: "ALL",
      conditions: [
        {
          id: `cond_${Date.now()}`,
          questionId: allQuestions[0]?.id || "",
          operator: "equals",
          value: "Yes",
        },
      ],
    };

    setSurvey({
      ...survey,
      logic: [...(survey.logic || []), newRule],
    });
  };

  const removeLogicRule = (rIdx: number) => {
    if (!survey) return;
    const updated = { ...survey };
    updated.logic.splice(rIdx, 1);
    setSurvey(updated);
  };

  if (!authenticated || loading || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-sm font-medium">Loading survey editor...</span>
        </div>
      </div>
    );
  }

  const allQuestions = survey.sections.flatMap((s) => s.questions);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      <AdminNav />

      {/* Top sticky action toolbar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/surveys"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={survey.title}
                  onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
                  className="font-black text-slate-900 text-base sm:text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none transition-colors"
                />
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                  v{survey.version}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {survey.industry || "General"} &bull; {survey.status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Preview Button */}
            <Link
              href={`/surveys/${survey.slug || survey.id}`}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-colors"
            >
              <Eye className="w-4 h-4 text-teal-600" />
              <span>Preview Live</span>
            </Link>

            {/* Status Select */}
            <select
              value={survey.status}
              onChange={(e) =>
                setSurvey({ ...survey, status: e.target.value as SurveySchema["status"] })
              }
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="PAUSED">PAUSED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            {/* Save Button */}
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === "questions"
                ? "bg-[#0B132B] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Questions & Sections ({allQuestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logic")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === "logic"
                ? "bg-[#0B132B] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <span>Conditional Logic ({survey.logic?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-[#0B132B] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Survey Settings</span>
          </button>
        </div>

        {/* TAB 1: Questions & Sections */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            {survey.sections.map((section, sIdx) => (
              <div
                key={section.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex-1 space-y-1">
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                      Section {sIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const updated = { ...survey };
                        updated.sections[sIdx].title = e.target.value;
                        setSurvey(updated);
                      }}
                      placeholder="Section Title"
                      className="w-full text-lg font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-teal-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={section.description || ""}
                      onChange={(e) => {
                        const updated = { ...survey };
                        updated.sections[sIdx].description = e.target.value;
                        setSurvey(updated);
                      }}
                      placeholder="Optional section description / instructions..."
                      className="w-full text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addQuestion(sIdx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                    {survey.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(sIdx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  {section.questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {qIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={q.title}
                            onChange={(e) =>
                              updateQuestion(sIdx, qIdx, { title: e.target.value })
                            }
                            placeholder="Enter your question here..."
                            className="w-full font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none"
                          />
                        </div>

                        {/* Question Type Selector */}
                        <div className="flex items-center gap-2">
                          <select
                            value={q.type}
                            onChange={(e) =>
                              updateQuestion(sIdx, qIdx, {
                                type: e.target.value as QuestionType,
                                options:
                                  e.target.value.includes("choice") || e.target.value === "dropdown"
                                    ? q.options || [
                                        { id: `opt_1`, label: "Option 1" },
                                        { id: `opt_2`, label: "Option 2" },
                                      ]
                                    : undefined,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            {QUESTION_TYPES.map((t) => (
                              <option key={t.type} value={t.type}>
                                {t.icon} {t.label}
                              </option>
                            ))}
                          </select>

                          {/* Required Toggle */}
                          <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) =>
                                updateQuestion(sIdx, qIdx, { required: e.target.checked })
                              }
                              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                            />
                            <span>Required</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeQuestion(sIdx, qIdx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Description */}
                      <input
                        type="text"
                        value={q.description || ""}
                        onChange={(e) =>
                          updateQuestion(sIdx, qIdx, { description: e.target.value })
                        }
                        placeholder="Help text or context for respondent (optional)..."
                        className="w-full text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-teal-500 focus:outline-none"
                      />

                      {/* Choice Options Editor (if single/multi/dropdown) */}
                      {(q.type === "single-choice" ||
                        q.type === "multi-choice" ||
                        q.type === "dropdown") && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/60">
                          <span className="text-xs font-bold text-slate-600 block">Options:</span>
                          <div className="space-y-1.5">
                            {q.options?.map((opt, optIdx) => (
                              <div key={opt.id} className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-mono">•</span>
                                <input
                                  type="text"
                                  value={opt.label}
                                  onChange={(e) => {
                                    const opts = [...(q.options || [])];
                                    opts[optIdx].label = e.target.value;
                                    updateQuestion(sIdx, qIdx, { options: opts });
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                                {q.options && q.options.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(sIdx, qIdx, optIdx)}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                                    title="Remove option"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => addOption(sIdx, qIdx)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Option</span>
                          </button>
                        </div>
                      )}

                      {/* Rating/Scale labels (if rating or linear-scale) */}
                      {(q.type === "rating" || q.type === "linear-scale") && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">
                              Min Label (e.g. Strongly Disagree)
                            </label>
                            <input
                              type="text"
                              value={q.minLabel || ""}
                              onChange={(e) =>
                                updateQuestion(sIdx, qIdx, { minLabel: e.target.value })
                              }
                              placeholder="e.g., Poor / Not Likely"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">
                              Max Label (e.g. Strongly Agree)
                            </label>
                            <input
                              type="text"
                              value={q.maxLabel || ""}
                              onChange={(e) =>
                                updateQuestion(sIdx, qIdx, { maxLabel: e.target.value })
                              }
                              placeholder="e.g., Outstanding / Highly Likely"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Add Section Button */}
            <button
              type="button"
              onClick={addSection}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 text-slate-600 hover:text-teal-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Section</span>
            </button>
          </div>
        )}

        {/* TAB 2: Conditional Logic */}
        {activeTab === "logic" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-indigo-600" />
                  <span>Conditional Branching Rules</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Show or hide questions dynamically based on the respondent’s prior answers.
                </p>
              </div>

              <button
                type="button"
                onClick={addLogicRule}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Logic Rule</span>
              </button>
            </div>

            {(!survey.logic || survey.logic.length === 0) ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <GitBranch className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium">No conditional rules defined yet.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add a rule to show follow-up questions only when a specific answer is chosen (e.g., &quot;If role == Student, show Capstone project questions&quot;).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {survey.logic.map((rule, rIdx) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                        Rule #{rIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLogicRule(rIdx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700">IF Question:</span>
                      <select
                        value={rule.conditions[0]?.questionId}
                        onChange={(e) => {
                          const updated = { ...survey };
                          updated.logic[rIdx].conditions[0].questionId = e.target.value;
                          setSurvey(updated);
                        }}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                      >
                        {allQuestions.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title.substring(0, 40)}...
                          </option>
                        ))}
                      </select>

                      <span className="font-bold text-slate-700">IS:</span>
                      <select
                        value={rule.conditions[0]?.operator}
                        onChange={(e) => {
                          const updated = { ...survey };
                          updated.logic[rIdx].conditions[0].operator = e.target.value as any;
                          setSurvey(updated);
                        }}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                      >
                        <option value="equals">Equals</option>
                        <option value="not-equals">Does Not Equal</option>
                        <option value="contains">Contains</option>
                        <option value="is-answered">Is Answered</option>
                      </select>

                      <input
                        type="text"
                        value={rule.conditions[0]?.value || ""}
                        onChange={(e) => {
                          const updated = { ...survey };
                          updated.logic[rIdx].conditions[0].value = e.target.value;
                          setSurvey(updated);
                        }}
                        placeholder="Value to match..."
                        className="p-1.5 rounded-lg border border-slate-300 bg-white text-xs w-36 font-medium"
                      />

                      <span className="font-bold text-indigo-700">THEN</span>
                      <select
                        value={rule.action}
                        onChange={(e) => {
                          const updated = { ...survey };
                          updated.logic[rIdx].action = e.target.value as any;
                          setSurvey(updated);
                        }}
                        className="p-1.5 rounded-lg border border-indigo-300 bg-white font-bold text-indigo-700"
                      >
                        <option value="show">SHOW</option>
                        <option value="hide">HIDE</option>
                      </select>

                      <span className="font-bold text-slate-700">TARGET QUESTION:</span>
                      <select
                        value={rule.targetId}
                        onChange={(e) => {
                          const updated = { ...survey };
                          updated.logic[rIdx].targetId = e.target.value;
                          setSurvey(updated);
                        }}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                      >
                        {allQuestions.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title.substring(0, 40)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Survey Settings */}
        {activeTab === "settings" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Survey Settings & Branding
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Completion / Thank You Message
                </label>
                <textarea
                  rows={3}
                  value={survey.settings?.completionMessage || ""}
                  onChange={(e) =>
                    setSurvey({
                      ...survey,
                      settings: { ...survey.settings, completionMessage: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={survey.settings?.requireEmail || false}
                    onChange={(e) =>
                      setSurvey({
                        ...survey,
                        settings: { ...survey.settings, requireEmail: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Require Email Address</div>
                    <div className="text-xs text-slate-500">Must provide email to submit</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={survey.settings?.showProgressIndicator !== false}
                    onChange={(e) =>
                      setSurvey({
                        ...survey,
                        settings: { ...survey.settings, showProgressIndicator: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Progress Bar</div>
                    <div className="text-xs text-slate-500">Show % progress at top</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
