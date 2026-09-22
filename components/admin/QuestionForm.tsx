"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OptionRow = { id: string; text: string; isCorrect: boolean };

type QuestionType = "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "FORMULA_ENTRY";

export type QuestionFormInitial = {
  id?: string;
  prompt?: string;
  type?: QuestionType;
  options?: OptionRow[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  difficulty?: string;
  industry?: string | null;
  points?: number;
  skillName?: string;
  categoryName?: string;
};

function newOption(): OptionRow {
  return { id: Math.random().toString(36).slice(2, 8), text: "", isCorrect: false };
}

export default function QuestionForm({ initial }: { initial?: QuestionFormInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [type, setType] = useState<QuestionType>(initial?.type ?? "MULTIPLE_CHOICE");
  const [options, setOptions] = useState<OptionRow[]>(
    initial?.options && initial.options.length ? initial.options : [newOption(), newOption()]
  );
  const [correctAnswer, setCorrectAnswer] = useState(initial?.correctAnswer ?? "");
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "beginner");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [points, setPoints] = useState(initial?.points ?? 1);
  const [skillName, setSkillName] = useState(initial?.skillName ?? "");
  const [categoryName, setCategoryName] = useState(initial?.categoryName ?? "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const needsOptions = type === "MULTIPLE_CHOICE" || type === "MULTIPLE_SELECT";
  const needsCorrectAnswer = type === "SHORT_ANSWER" || type === "FORMULA_ENTRY";

  function updateOption(id: string, patch: Partial<OptionRow>) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function toggleCorrect(id: string) {
    setOptions((prev) =>
      prev.map((o) =>
        type === "MULTIPLE_CHOICE"
          ? { ...o, isCorrect: o.id === id } // single-select: only one correct
          : o.id === id
          ? { ...o, isCorrect: !o.isCorrect }
          : o
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      prompt,
      type,
      options: needsOptions ? options.filter((o) => o.text.trim().length > 0) : undefined,
      correctAnswer: needsCorrectAnswer ? correctAnswer : undefined,
      explanation: explanation || undefined,
      difficulty,
      industry: industry || undefined,
      points,
      skillName,
      categoryName: categoryName || undefined,
    };

    const url = isEdit ? `/api/questions/${initial!.id}` : "/api/questions";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(
        typeof body.error === "string"
          ? body.error
          : "Couldn't save this question — check the fields above."
      );
      return;
    }

    router.push("/admin/question-bank");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium">Prompt</label>
        <textarea
          required
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="e.g. Which Excel function returns the position of a value in a range?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="MULTIPLE_CHOICE">Multiple choice (one correct)</option>
            <option value="MULTIPLE_SELECT">Multiple select (several correct)</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="SHORT_ANSWER">Short answer</option>
            <option value="FORMULA_ENTRY">Formula entry</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {(needsOptions || type === "TRUE_FALSE") && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Options {type === "MULTIPLE_CHOICE" ? "(mark the one correct answer)" : "(mark every correct answer)"}
          </label>
          {type === "TRUE_FALSE" ? (
            <p className="text-sm text-ink/60">
              True/False questions are scored against the correct answer below — set it to "True" or
              "False".
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {options.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    type={type === "MULTIPLE_CHOICE" ? "radio" : "checkbox"}
                    checked={o.isCorrect}
                    onChange={() => toggleCorrect(o.id)}
                    className="accent-accent"
                  />
                  <input
                    value={o.text}
                    onChange={(e) => updateOption(o.id, { text: e.target.value })}
                    placeholder="Option text"
                    className="flex-1 rounded border border-ink/20 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setOptions((prev) => prev.filter((x) => x.id !== o.id))}
                    className="text-sm text-ink/40 hover:text-warn"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, newOption()])}
                className="self-start text-sm text-accent"
              >
                + Add option
              </button>
            </div>
          )}
        </div>
      )}

      {(needsCorrectAnswer || type === "TRUE_FALSE") && (
        <div>
          <label className="mb-1 block text-sm font-medium">Correct answer</label>
          <input
            required
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder={type === "TRUE_FALSE" ? "True or False" : "e.g. =VLOOKUP(A2,B:D,3,FALSE)"}
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Explanation (shown after answering)</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Skill</label>
          <input
            required
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            placeholder="Excel"
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category (optional)</label>
          <input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Lookup Functions"
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Industry (optional)</label>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="financial-services"
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Points</label>
          <input
            type="number"
            min={1}
            max={20}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {error && <p className="text-sm text-warn">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-4 py-2 text-sm text-paper disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save as draft"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/question-bank")}
          className="rounded border border-ink/20 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
