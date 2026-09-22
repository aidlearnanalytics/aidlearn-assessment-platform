"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry: industry || undefined }),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Couldn't create this company.");
      return;
    }
    router.push("/admin/companies");
    router.refresh();
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">New company</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Company name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Indie Finance"
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Industry (optional)</label>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="financial-services"
            className="w-full rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        {error && <p className="text-sm text-warn">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-accent px-4 py-2 text-sm text-paper disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create company"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/companies")}
            className="rounded border border-ink/20 px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
