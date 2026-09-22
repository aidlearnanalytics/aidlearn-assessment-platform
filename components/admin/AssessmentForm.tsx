"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Company = { id: string; name: string };

const TOGGLES: { key: keyof typeof DEFAULT_TOGGLES; label: string }[] = [
  { key: "randomizeQuestions", label: "Randomize question order" },
  { key: "randomizeOptions", label: "Randomize option order" },
  { key: "requireScreenShare", label: "Require screen share" },
  { key: "requireFullscreen", label: "Require fullscreen" },
  { key: "monitorTabSwitch", label: "Monitor tab switching" },
  { key: "monitorVisibility", label: "Monitor visibility changes" },
];

const DEFAULT_TOGGLES = {
  randomizeQuestions: true,
  randomizeOptions: true,
  requireScreenShare: true,
  requireFullscreen: true,
  monitorTabSwitch: true,
  monitorVisibility: true,
};

export default function AssessmentForm({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [numQuestions, setNumQuestions] = useState(20);
  const [passingScorePct, setPassingScorePct] = useState(70);
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        companyId,
        description: description || undefined,
        durationMinutes,
        numQuestions,
        passingScorePct,
        ...toggles,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Couldn't create this assessment.");
      return;
    }
    const { assessment } = await res.json();
    router.push(`/admin/assessments/${assessment.id}`);
    router.refresh();
  }

  if (companies.length === 0) {
    return (
      <p className="text-ink/60">
        You need a company before you can build an assessment.{" "}
        <a href="/admin/companies/new" className="text-accent underline">
          Create one first
        </a>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium">Assessment name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Indie Finance Excel & Financial Data Skills Assessment"
          className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Company</label>
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Duration (min)</label>
          <input
            type="number"
            min={5}
            max={480}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium"># Questions</label>
          <input
            type="number"
            min={1}
            max={200}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Passing score %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={passingScorePct}
            onChange={(e) => setPassingScorePct(Number(e.target.value))}
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Randomization &amp; monitoring</label>
        <div className="grid grid-cols-2 gap-2">
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={toggles[t.key]}
                onChange={(e) => setToggles((prev) => ({ ...prev, [t.key]: e.target.checked }))}
                className="accent-accent"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-warn">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-4 py-2 text-sm text-paper disabled:opacity-60"
        >
          {saving ? "Saving…" : "Create assessment"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/assessments")}
          className="rounded border border-ink/20 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
