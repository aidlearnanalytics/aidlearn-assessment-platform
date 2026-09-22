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
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [name, setName] = useState("");
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
        companyId,
        name,
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
      setError(typeof body.error === "string" ? body.error : "Could not create this assessment.");
      return;
    }
    const { assessment } = await res.json();
    router.push(`/admin/assessments/${assessment.id}`);
    router.refresh();
  }

  if (companies.length === 0) {
    return (
      <p className="text-slate-600 text-sm">
        You need a company before you can build an assessment.{" "}
        <a href="/admin/companies" className="text-[#1d4ed8] underline">
          Create one first
        </a>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5 bg-white p-6 rounded-2xl border border-slate-200">
      <div>
        <label className="mb-1 block text-xs font-bold text-slate-700 uppercase">Assessment Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Financial Modeling & Analytics Diagnostic Evaluation"
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-slate-700 uppercase">Target Organization</label>
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-slate-700 uppercase">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Diagnostic evaluation assessing Excel, SQL, and business analytics skills."
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 uppercase">Duration (mins)</label>
          <input
            type="number"
            min={5}
            max={480}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 uppercase"># Questions</label>
          <input
            type="number"
            min={1}
            max={200}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 uppercase">Passing Score %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={passingScorePct}
            onChange={(e) => setPassingScorePct(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold text-slate-700 uppercase">Assessment Configuration</label>
        <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={toggles[t.key]}
                onChange={(e) => setToggles((prev) => ({ ...prev, [t.key]: e.target.checked }))}
                className="rounded text-[#1d4ed8]"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#1d4ed8] hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60 transition-all cursor-pointer"
        >
          {saving ? "Saving..." : "Create Assessment"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/assessments")}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
