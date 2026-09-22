"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  HelpCircle,
  X,
  Layers,
  Building2,
} from "lucide-react";

interface QuestionItem {
  id: string;
  prompt: string;
  type: string;
  options?: string | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  difficulty: string;
  points: number;
  skill?: { name: string } | null;
  category?: { name: string } | null;
  createdAt: string | Date;
}

interface CompanyQuestionBankProps {
  company: {
    id: string;
    name: string;
    slug: string;
    industry?: string | null;
    questions: QuestionItem[];
  };
}

export default function CompanyQuestionBankView({ company }: CompanyQuestionBankProps) {
  const router = useRouter();

  // Modals
  const [showAIModal, setShowAIModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // AI Generator Form State
  const [aiTopic, setAiTopic] = useState("Financial Modeling & Valuation");
  const [aiIndustry, setAiIndustry] = useState(company.industry || "Corporate Finance & Banking");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "intermediate" | "hard" | "expert">("intermediate");
  const [aiCount, setAiCount] = useState(5);
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual Question Form State
  const [prompt, setPrompt] = useState("");
  const [skillName, setSkillName] = useState("Excel");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState([
    { key: "A", text: "", isCorrect: true },
    { key: "B", text: "", isCorrect: false },
    { key: "C", text: "", isCorrect: false },
    { key: "D", text: "", isCorrect: false },
  ]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // AI Generation Submit
  async function handleAIGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          topic: aiTopic.trim(),
          industry: aiIndustry.trim(),
          difficulty: aiDifficulty,
          numQuestions: Number(aiCount),
          notes: aiNotes.trim() || undefined,
          autoApprove: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions");
      }

      setShowAIModal(false);
      setAiNotes("");
      router.refresh();
    } catch (err: any) {
      setAiError(err.message || "Failed to generate questions with AI");
    } finally {
      setAiLoading(false);
    }
  }

  // Manual Creation Submit
  async function handleManualCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setManualLoading(true);
    setManualError(null);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          prompt: prompt.trim(),
          type: "MULTIPLE_CHOICE",
          options: options.filter((o) => o.text.trim() !== ""),
          explanation: explanation.trim() || undefined,
          difficulty,
          points: Number(points) || 1,
          skillName: skillName.trim() || "General",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create question");
      }

      setShowManualModal(false);
      setPrompt("");
      setExplanation("");
      setOptions([
        { key: "A", text: "", isCorrect: true },
        { key: "B", text: "", isCorrect: false },
        { key: "C", text: "", isCorrect: false },
        { key: "D", text: "", isCorrect: false },
      ]);
      router.refresh();
    } catch (err: any) {
      setManualError(err.message || "Failed to save question");
    } finally {
      setManualLoading(false);
    }
  }

  // Delete Question Handler
  async function handleDeleteQuestion(qId: string) {
    if (!confirm("Are you sure you want to remove this question from the company assessment?")) return;

    try {
      await fetch(`/api/questions/${qId}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Link
            href="/admin/question-bank"
            className="text-xs font-semibold text-slate-500 hover:text-[#1d4ed8] inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Question Bank Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">
              {company.name} Questions
            </h1>
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1d4ed8] text-xs font-bold">
              {company.questions.length} Questions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Industry Context: <strong className="text-slate-700">{company.industry || "General Enterprise"}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0f172a] text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Question</span>
          </button>

          <button
            onClick={() => setShowAIModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Generate Questions</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      {company.questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0f172a] mb-1">No Questions Added Yet</h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            You can generate high-quality questions for {company.name} instantly with Gemini AI or author custom questions manually.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate with AI</span>
            </button>
            <button
              onClick={() => setShowManualModal(true)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0f172a] text-xs font-bold transition-all cursor-pointer"
            >
              + Create Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {company.questions.map((q, idx) => {
            let parsedOpts: any[] = [];
            if (q.options) {
              try {
                parsedOpts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
              } catch {
                parsedOpts = [];
              }
            }

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#1d4ed8] text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {q.skill?.name || "General"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        q.difficulty?.toLowerCase() === "hard" || q.difficulty?.toLowerCase() === "expert"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : q.difficulty?.toLowerCase() === "intermediate"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">{q.points} Points</span>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Delete Question"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#0f172a] leading-relaxed whitespace-pre-wrap">
                  {q.prompt}
                </h3>

                {parsedOpts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {parsedOpts.map((opt: any, optIdx: number) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = opt.isCorrect || q.correctAnswer === opt.key || q.correctAnswer === letter;

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                            isCorrect
                              ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold"
                              : "bg-slate-50/50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCorrect ? "bg-[#059669] text-white" : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1 line-clamp-2">{opt.text}</span>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.explanation && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <strong className="text-[#0f172a]">Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI GENERATE QUESTIONS MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 md:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">Generate Questions with Gemini AI</h3>
                  <p className="text-[11px] text-slate-400">Scoped directly to {company.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAIGenerate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Topic / Capability Area <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Advanced Excel Dynamic Arrays & XLOOKUP"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Difficulty Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all cursor-pointer"
                  >
                    <option value="easy">Easy / Foundational</option>
                    <option value="intermediate">Intermediate / Practical</option>
                    <option value="hard">Hard / Advanced</option>
                    <option value="expert">Expert / Architect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Question Count <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={20}
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Industry / Client Context
                </label>
                <input
                  type="text"
                  value={aiIndustry}
                  onChange={(e) => setAiIndustry(e.target.value)}
                  placeholder="e.g. Commercial Banking & Asset Management"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Custom Curriculum Notes / Prompt Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="e.g. Focus on realistic loan amortization schedules, LET and LAMBDA formulas, and error handling."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                />
              </div>

              {aiError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {aiError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate {aiCount} Questions</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL QUESTION MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 md:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#0f172a]">Create Question Manually</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Prompt <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Which formula correctly calculates the compound annual growth rate (CAGR)?"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Skill Area
                  </label>
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="e.g. Excel"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all cursor-pointer"
                  >
                    <option value="easy">Easy</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                  />
                </div>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Options (Select radio for correct answer) <span className="text-red-500">*</span>
                </label>

                {options.map((opt, idx) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() =>
                        setOptions((prev) =>
                          prev.map((o, i) => ({ ...o, isCorrect: i === idx }))
                        )
                      }
                      className="w-4 h-4 text-[#1d4ed8] cursor-pointer"
                    />
                    <span className="w-5 text-xs font-bold text-slate-500">{opt.key}</span>
                    <input
                      required={idx < 2}
                      type="text"
                      value={opt.text}
                      onChange={(e) =>
                        setOptions((prev) =>
                          prev.map((o, i) => (i === idx ? { ...o, text: e.target.value } : o))
                        )
                      }
                      placeholder={`Option ${opt.key} text`}
                      className="flex-1 rounded-xl border border-slate-300 p-2 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Explanation / Rationale
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why this answer is correct..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                />
              </div>

              {manualError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {manualError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  {manualLoading ? "Saving..." : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
