"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Code2,
  Building2,
  Layers,
  X,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

interface OptionItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionItem {
  id: string;
  prompt: string;
  type: string;
  difficulty: string;
  points: number;
  explanation: string | null;
  correctAnswer: string | null;
  options: OptionItem[] | null;
  category: { id: string; name: string } | null;
  skill: { id: string; name: string } | null;
  source: string;
  status: string;
}

interface CompanyQuestionBankViewProps {
  company: {
    id: string;
    name: string;
    slug?: string;
    industry?: string | null;
    questions?: QuestionItem[];
  };
  assessment?: {
    id: string;
    name: string;
    durationMinutes: number;
    numQuestions: number;
  } | null;
  questions?: QuestionItem[];
}

export default function CompanyQuestionBankView({
  company,
  assessment,
  questions: rawQuestions,
}: CompanyQuestionBankViewProps) {
  const questions: QuestionItem[] = rawQuestions || (company as any)?.questions || [];
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("ALL");

  // Modal 1: Create Manual Question
  const [showNewModal, setShowNewModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [formulaAnswer, setFormulaAnswer] = useState("");
  const [options, setOptions] = useState<OptionItem[]>([
    { id: "1", text: "", isCorrect: true },
    { id: "2", text: "", isCorrect: false },
    { id: "3", text: "", isCorrect: false },
    { id: "4", text: "", isCorrect: false },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Modal 2: AI Question Generator
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("INTERMEDIATE");
  const [aiCount, setAiCount] = useState<number>(10);
  const [aiNotes, setAiNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState<string | null>(null);

  const filteredQuestions = questions.filter((q: QuestionItem) => {
    const matchesSearch =
      q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDiff = filterDifficulty === "ALL" || q.difficulty === filterDifficulty;
    return matchesSearch && matchesDiff;
  });

  const handleCreateManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let finalOptions: any = null;
    let finalCorrectAnswer: string | null = null;

    if (type === "MULTIPLE_CHOICE" || type === "MULTIPLE_SELECT" || type === "TRUE_FALSE") {
      finalOptions = options
        .filter((o) => o.text.trim())
        .map((o, idx) => ({
          id: String(idx + 1),
          text: o.text.trim(),
          isCorrect: o.isCorrect,
        }));
      const correct = finalOptions.find((o: any) => o.isCorrect);
      finalCorrectAnswer = correct ? correct.text : null;
    } else {
      finalCorrectAnswer = formulaAnswer.trim();
    }

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          prompt,
          type,
          difficulty,
          points,
          explanation,
          options: finalOptions,
          correctAnswer: finalCorrectAnswer,
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        setPrompt("");
        setFormulaAnswer("");
        setExplanation("");
        router.refresh();
      } else {
        alert("Failed to create question. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAIQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenerationMsg(null);

    const requestedCount = Math.max(Number(aiCount) || 1, 1);

    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          topic: aiTopic,
          industry: company.industry || "Financial Services",
          difficulty: aiDifficulty,
          count: requestedCount,
          numQuestions: requestedCount,
          notes: aiNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGenerationMsg(`Successfully generated and added ${data.generatedCount || requestedCount} questions to ${company.name}!`);
        setTimeout(() => {
          setShowAIModal(false);
          setGenerationMsg(null);
          router.refresh();
        }, 1500);
      } else {
        setGenerationMsg(data.error || "Failed to generate questions.");
      }
    } catch (err: any) {
      console.error(err);
      setGenerationMsg(err.message || "Failed to generate questions with AI.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to remove this question from this company's bank?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href="/admin/question-bank"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">{company.name}</h1>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                  {company.industry || "General Analytics"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Company Question Bank & Diagnostic Assessment Curriculum
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Generate Questions with AI</span>
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-slate-500" />
              <span>Add Question Manually</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
            <p className="mt-1 text-2xl font-black text-slate-900">{questions.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Multiple Choice</span>
            <p className="mt-1 text-2xl font-black text-blue-600">
              {questions.filter((q: QuestionItem) => q.type === "MULTIPLE_CHOICE").length}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Formula / Practical</span>
            <p className="mt-1 text-2xl font-black text-indigo-600">
              {questions.filter((q: QuestionItem) => q.type === "FORMULA_ENTRY" || q.type === "SHORT_ANSWER").length}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assessment Status</span>
            <p className="mt-1 text-sm font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Live Assessment
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions or formulas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="HARD">Hard</option>
            <option value="EXPERT">Expert</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-bold text-slate-800">No questions found in this bank</h3>
          <p className="mt-1 text-xs text-slate-400">
            Click "Generate Questions with AI" or "Add Question Manually" to build this company's assessment curriculum.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                    {idx + 1}
                  </span>
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-700 border border-blue-200">
                        {q.type.replace("_", " ")}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          q.difficulty === "HARD" || q.difficulty === "EXPERT"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : q.difficulty === "INTERMEDIATE"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {q.points} pt{q.points > 1 ? "s" : ""}
                      </span>
                      {q.source === "AI_GENERATED" && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                          <Sparkles className="h-3 w-3" /> AI Generated
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-slate-900 leading-snug">{q.prompt}</p>

                    {/* Options list if multiple choice */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs ${
                              opt.isCorrect
                                ? "bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold"
                                : "bg-slate-50 border border-slate-200 text-slate-600"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                                opt.isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formula answer if practical */}
                    {q.correctAnswer && (
                      <div className="rounded-xl bg-slate-900 px-3.5 py-2 font-mono text-xs text-emerald-400 inline-block">
                        Answer: {q.correctAnswer}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-xs text-slate-500 italic pt-1">
                        <span className="font-semibold text-slate-600 not-italic">Rationale:</span>{" "}
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove from bank"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADD MANUAL QUESTION */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Add New Question</h3>
                <p className="text-xs text-slate-500">Adding to {company.name} Question Bank</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Question Prompt / Scenario
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Which formula calculates the weighted average cost of capital given dynamic inputs?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="FORMULA_ENTRY">Formula Entry</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="HARD">Hard</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Multiple Choice Options */}
              {type === "MULTIPLE_CHOICE" && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Answer Options (Select the correct radio button)
                  </label>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const newOpts = options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                          setOptions(newOpts);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-400 w-4">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${String.fromCharCode(65 + idx)} Text`}
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[idx].text = e.target.value;
                          setOptions(newOpts);
                        }}
                        className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Formula entry */}
              {(type === "FORMULA_ENTRY" || type === "SHORT_ANSWER") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Correct Formula / Exact Answer
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. =XIRR(B2:B10, A2:A10)"
                    value={formulaAnswer}
                    onChange={(e) => setFormulaAnswer(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Explanation & Learning Rationale
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why this answer is correct..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Question to Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI QUESTION GENERATOR */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">AI Question Generation</h3>
                  <p className="text-xs text-slate-500">Powered by Gemini for {company.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAIQuestions} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Topic / Skill Domain <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Dynamic Array Formulas, DCF Valuation, SQL Window Functions, Power Query"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="HARD">Hard</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Number of Questions to Generate <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={aiCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAiCount(isNaN(val) ? 1 : Math.max(1, val));
                    }}
                    placeholder="e.g. 10, 25, 50"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Set any quantity. AI will generate full questions with detailed rationales.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Custom Curriculum / Company Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Provide specific scenarios, formula constraints, real-world case details, or job role focus..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {generationMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold ${
                    generationMsg.includes("Successfully")
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {generationMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generating {aiCount} Questions with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generate {aiCount} Questions with AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
