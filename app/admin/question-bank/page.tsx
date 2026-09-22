import { db } from "@/lib/db";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-ink/10 text-ink/60",
  PENDING_APPROVAL: "bg-accentSoft text-accent",
  APPROVED: "bg-accentSoft text-accent",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-ink/10 text-ink/40",
};

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams?: { status?: string; skillId?: string; difficulty?: string };
}) {
  const { status, skillId, difficulty } = searchParams ?? {};

  const [questions, skills] = await Promise.all([
    db.question.findMany({
      where: {
        status: status ? (status as any) : undefined,
        skillId: skillId || undefined,
        difficulty: difficulty || undefined,
      },
      orderBy: { createdAt: "desc" },
      include: { skill: true, category: true },
      take: 50,
    }),
    db.skill.findMany({ orderBy: { name: "asc" } }),
  ]);

  function filterHref(next: Partial<{ status: string; skillId: string; difficulty: string }>) {
    const merged = { status, skillId, difficulty, ...next };
    const qs = new URLSearchParams(
      Object.entries(merged).filter(([, v]) => v) as [string, string][]
    ).toString();
    return `/admin/question-bank${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Question Bank</h1>
        <div className="flex gap-2">
          <Link href="/admin/question-bank/new" className="rounded bg-accent px-4 py-2 text-sm text-paper">
            New question
          </Link>
          <Link
            href="/admin/question-bank/generate"
            className="rounded border border-accent px-4 py-2 text-sm text-accent"
          >
            AI generate
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {["PENDING_APPROVAL", "APPROVED", "REJECTED", "DRAFT"].map((s) => (
            <Link
              key={s}
              href={filterHref({ status: status === s ? "" : s })}
              className={`rounded px-3 py-1 ${status === s ? "bg-accent text-paper" : "bg-ink/5"}`}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            {skills.map((sk) => (
              <Link
                key={sk.id}
                href={filterHref({ skillId: skillId === sk.id ? "" : sk.id })}
                className={`rounded px-3 py-1 ${skillId === sk.id ? "bg-accent text-paper" : "bg-ink/5"}`}
              >
                {sk.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex gap-2 text-sm">
          {["beginner", "intermediate", "advanced"].map((d) => (
            <Link
              key={d}
              href={filterHref({ difficulty: difficulty === d ? "" : d })}
              className={`rounded px-3 py-1 capitalize ${difficulty === d ? "bg-accent text-paper" : "bg-ink/5"}`}
            >
              {d}
            </Link>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {questions.map((q) => (
          <li key={q.id}>
            <Link
              href={`/admin/question-bank/${q.id}`}
              className="block rounded border border-ink/10 p-3 hover:border-accent"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLES[q.status]}`}>
                  {q.status.replace("_", " ")}
                </span>
                <span className="text-xs text-ink/40">
                  {q.source === "AI_GENERATED" ? "AI generated" : "Human"} · {q.skill?.name ?? "—"} ·{" "}
                  {q.difficulty}
                </span>
              </div>
              <p className="text-sm">{q.prompt}</p>
            </Link>
          </li>
        ))}
        {questions.length === 0 && <p className="text-ink/60">No questions match this filter.</p>}
      </ul>
    </div>
  );
}
