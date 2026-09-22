"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QuestionSummary = { id: string; prompt: string; skillName?: string; difficulty: string };

export default function AssessmentQuestionManager({
  assessmentId,
  attached,
  available,
  numQuestions,
  isPublished,
}: {
  assessmentId: string;
  attached: { linkId: string; question: QuestionSummary }[];
  available: QuestionSummary[];
  numQuestions: number;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addQuestion(questionId: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/assessments/${assessmentId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Couldn't add that question.");
      return;
    }
    router.refresh();
  }

  async function removeQuestion(linkId: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/assessments/${assessmentId}/questions/${linkId}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't remove that question.");
      return;
    }
    router.refresh();
  }

  async function publish() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/assessments/${assessmentId}/publish`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Couldn't publish.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded border border-ink/10 p-3">
        <p className="text-sm">
          <span className="font-medium">{attached.length}</span> / {numQuestions} questions attached
        </p>
        {isPublished ? (
          <span className="rounded bg-accentSoft px-3 py-1 text-sm text-accent">Published</span>
        ) : (
          <button
            disabled={busy || attached.length < numQuestions}
            onClick={publish}
            className="rounded bg-accent px-4 py-2 text-sm text-paper disabled:opacity-40"
            title={attached.length < numQuestions ? "Attach enough questions first" : undefined}
          >
            Publish
          </button>
        )}
      </div>
      {error && <p className="text-sm text-warn">{error}</p>}

      <div>
        <h2 className="mb-2 text-sm font-semibold">Attached questions</h2>
        {attached.length === 0 ? (
          <p className="text-sm text-ink/60">None yet — add some from the approved list below.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {attached.map((a) => (
              <li
                key={a.linkId}
                className="flex items-center justify-between rounded border border-ink/10 p-3 text-sm"
              >
                <span>
                  {a.question.prompt}
                  <span className="ml-2 text-xs text-ink/40">
                    {a.question.skillName ?? "—"} · {a.question.difficulty}
                  </span>
                </span>
                {!isPublished && (
                  <button
                    disabled={busy}
                    onClick={() => removeQuestion(a.linkId)}
                    className="text-xs text-ink/40 hover:text-warn"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isPublished && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Approved questions not yet attached</h2>
          {available.length === 0 ? (
            <p className="text-sm text-ink/60">
              No unattached approved questions. Go approve more in the Question Bank.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {available.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center justify-between rounded border border-ink/10 p-3 text-sm"
                >
                  <span>
                    {q.prompt}
                    <span className="ml-2 text-xs text-ink/40">
                      {q.skillName ?? "—"} · {q.difficulty}
                    </span>
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => addQuestion(q.id)}
                    className="rounded border border-accent px-3 py-1 text-xs text-accent"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
