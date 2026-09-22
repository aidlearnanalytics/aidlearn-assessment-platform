"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuestionActions({
  id,
  status,
}: {
  id: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ARCHIVED";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, opts?: RequestInit) {
    setBusy(true);
    setError(null);
    const res = await fetch(path, { method: "POST", ...opts });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "That action failed.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleReject() {
    const reason = window.prompt("Reason for rejecting (optional):") ?? undefined;
    await call(`/api/questions/${id}/reject`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
  }

  async function handleDelete() {
    if (!window.confirm("Delete this question permanently?")) return;
    setBusy(true);
    const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/admin/question-bank");
      router.refresh();
    } else {
      setError("Couldn't delete this question.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" && (
          <button
            disabled={busy}
            onClick={() => call(`/api/questions/${id}/submit`)}
            className="rounded bg-accent px-4 py-2 text-sm text-paper disabled:opacity-60"
          >
            Submit for approval
          </button>
        )}
        {status === "PENDING_APPROVAL" && (
          <>
            <button
              disabled={busy}
              onClick={() => call(`/api/questions/${id}/approve`)}
              className="rounded bg-accent px-4 py-2 text-sm text-paper disabled:opacity-60"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={handleReject}
              className="rounded border border-warn px-4 py-2 text-sm text-warn disabled:opacity-60"
            >
              Reject
            </button>
          </>
        )}
        {status === "APPROVED" && (
          <button
            disabled={busy}
            onClick={handleReject}
            className="rounded border border-warn px-4 py-2 text-sm text-warn disabled:opacity-60"
          >
            Reject (send back for edits)
          </button>
        )}
        <button
          disabled={busy}
          onClick={handleDelete}
          className="rounded border border-ink/20 px-4 py-2 text-sm text-ink/70 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      {error && <p className="text-sm text-warn">{error}</p>}
    </div>
  );
}
