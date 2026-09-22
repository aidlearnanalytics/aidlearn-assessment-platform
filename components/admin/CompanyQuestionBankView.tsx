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
  options?: any;
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

  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Manual Question Form
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [formulaAnswer, setFormulaAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // AI Generator Form
  const [aiTopic, setAiTopic] = useState("Financial Modeling & Three Statement Valuation");
  const [aiDifficulty, setAiDifficulty] = useState("INTERMEDIATE");
  const [aiCount, setAiCount] = useState(5);
  const [aiNotes, setAiNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState<string | null>(null);

  // Filter state
  const [searchFilter, setSearchFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");

  const filteredQuestions = company.questions.filter((q) => {
    const matchesSearch = q.prompt.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesDiff = difficultyFilter === "ALL" || q.difficulty === difficultyFilter;
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

    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          topic: aiTopic,
          industry: company.industry || "Financial Services",
          difficulty: aiDifficulty,
          count: Number(aiCount),
          notes: aiNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGenerationMsg(`Successfully generated and added ${data.generatedCount || aiCount} questions to ${company.name}!`);
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
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {company.name} Question Bank
                </h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                  {company.questions.length} Questions
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Scoped specifically to <span className="text-slate-800 font-semibold">{company.name}</span>. All generated and authored questions here are automatically available for this tenant.
              </p>
            </div>
          </div>

          {/* Action Modals Trigger */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 text-slate-600" />
              New Question
            </button>

            <button
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-blue-200" />
              AI Generate Questions
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 border-t border-slate-100 pt-6">
          <input
            type="text"
            placeholder="Search questions by keyword or formula..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full sm:w-80 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Difficulty:</span>
            {["ALL", "EASY", "INTERMEDIATE", "HARD", "EXPERT"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficultyFilter(d)}
                className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${
                  difficultyFilter === d
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-700">No questions found</h3>
            <p className="mt-1 text-xs text-slate-400">
              Click &quot;AI Generate Questions&quot; to automatically create curriculum-aligned questions for {company.name}.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
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
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow transition-shadow space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-black text-blue-600 font-mono">
                      Q{idx + 1}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 border border-slate-200">
                      {q.type}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        q.difficulty === "EXPERT"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : q.difficulty === "HARD"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : q.difficulty === "INTERMEDIATE"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">{q.points} pt{q.points > 1 ? "s" : ""}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.prompt}</p>

                {/* Options Preview */}
                {Array.isArray(parsedOpts) && parsedOpts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {parsedOpts.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                          opt.isCorrect
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="font-bold text-[10px] w-4">{String.fromCharCode(65 + oIdx)}.</span>
                        <span className="flex-1">{opt.text}</span>
                        {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Formula / Short Answer Correct Answer */}
                {q.correctAnswer && (
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs font-mono text-slate-800">
                    <span className="font-bold text-slate-500 font-sans uppercase text-[10px] block mb-1">
                      Correct Answer / Formula:
                    </span>
                    {q.correctAnswer}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="rounded-xl bg-blue-50/50 p-3 border border-blue-100 text-xs text-blue-950">
                    <span className="font-bold text-blue-900 uppercase text-[10px] block mb-0.5">
                      Explanation & Rationale:
                    </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: MANUAL QUESTION CREATION */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Create Custom Question</h3>
                <p className="text-xs text-slate-500">Add to {company.name}&apos;s Question Bank</p>
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
                  Question Prompt
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter the assessment scenario or question prompt..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice (Single)</option>
                    <option value="MULTIPLE_SELECT">Multiple Select (Checkboxes)</option>
                    <option value="FORMULA_ENTRY">Formula Entry</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="HARD">Hard</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Points Weight
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Options Input for Multiple Choice */}
              {(type === "MULTIPLE_CHOICE" || type === "MULTIPLE_SELECT" || type === "TRUE_FALSE") && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Answer Options (Select correct option radio/checkbox)
                  </label>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type={type === "MULTIPLE_SELECT" ? "checkbox" : "radio"}
                        name="correctOptionRadio"
                        checked={opt.isCorrect}
                        onChange={() => {
                          if (type === "MULTIPLE_SELECT") {
                            const newOpts = [...options];
                            newOpts[idx].isCorrect = !newOpts[idx].isCorrect;
                            setOptions(newOpts);
                          } else {
                            const newOpts = options.map((o, i) => ({
                              ...o,
                              isCorrect: i === idx,
                            }));
                            setOptions(newOpts);
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
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
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60"
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
                  Topic / Skill Domain
                </label>
                <input
                  type="text"
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Dynamic Array Formulas, DCF Valuation, SQL Window Functions"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  />
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
                  placeholder="Provide specific scenarios, formula constraints, or job role focus..."
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
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  {generating ? "Generating with Gemini..." : `Generate ${aiCount} Questions`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
