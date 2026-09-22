"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export default function AIGeneratorForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("Financial Modeling & Dynamic Array Formulas");
  const [industry, setIndustry] = useState("financial-services");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [numQuestions, setNumQuestions] = useState(5);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPreviewQuestions([]);

    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          industry,
          difficulty,
          numQuestions,
          notes: notes || undefined,
          autoApprove: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed.");
      }

      setPreviewQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message || "Failed to generate questions with AI.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchSave(status: "DRAFT" | "APPROVED") {
    setSavingBatch(true);
    setError(null);

    try {
      for (const q of previewQuestions) {
        await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: q.prompt,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            industry: industry || undefined,
            points: q.points || 1,
            skillName: q.skillName || "Excel",
            categoryName: q.categoryName || topic,
          }),
        });
      }

      router.push("/admin/question-bank");
      router.refresh();
    } catch (err: any) {
      setError("Failed to save questions to question bank.");
      setSavingBatch(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-black/10 p-6 flex flex-col gap-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-black/70 mb-1.5 uppercase tracking-wider">
            Assessment Topic / Skill Area <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Pivot Tables, VLOOKUP & INDEX/MATCH, Financial Forecasting"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-black/70 mb-1.5 uppercase tracking-wider">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-black/70 mb-1.5 uppercase tracking-wider">
              Industry Context
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="financial-services"
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-black/70 mb-1.5 uppercase tracking-wider">
              # of Questions
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-black/70 mb-1.5 uppercase tracking-wider">
            Curriculum Notes / Context <span className="text-black/40 font-normal">(Optional prompt instructions)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Paste syllabus notes, training outline, or specific formula logic you want tested..."
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="self-start py-2.5 px-6 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-sm font-semibold shadow-sm disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Questions with Gemini AI...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Questions
            </>
          )}
        </button>
      </form>

      {/* Generated Questions Preview */}
      {previewQuestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/10 p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-black/10">
            <div>
              <h2 className="text-lg font-bold text-[#12141C]">
                Generated Questions Preview ({previewQuestions.length})
              </h2>
              <p className="text-xs text-black/60">
                Review the AI generated items before importing to your Question Bank.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={savingBatch}
                onClick={() => handleBatchSave("APPROVED")}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm disabled:opacity-60 transition-all cursor-pointer"
              >
                {savingBatch ? "Importing..." : "Approve & Import All"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {previewQuestions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-black/10 bg-slate-50/50 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1d4ed8]">Question {idx + 1} &bull; {q.type}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-black/5 text-black/60 capitalize font-medium">
                    {q.difficulty} &bull; {q.points} pt
                  </span>
                </div>

                <p className="text-sm font-semibold text-[#12141C]">{q.prompt}</p>

                {q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {q.options.map((opt: any, oIdx: number) => (
                      <div
                        key={oIdx}
                        className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${
                          opt.isCorrect
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                            : "bg-white border-black/10 text-black/70"
                        }`}
                      >
                        <span>{opt.isCorrect ? "✓" : "○"}</span>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {q.correctAnswer && (
                  <div className="text-xs text-emerald-800 font-mono bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    Correct Answer: {q.correctAnswer}
                  </div>
                )}

                {q.explanation && (
                  <p className="text-xs text-black/50 italic mt-1">
                    Explanation: {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
