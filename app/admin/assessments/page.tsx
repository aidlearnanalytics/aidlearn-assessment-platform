import { db } from "@/lib/db";
import Link from "next/link";

export default async function AssessmentsPage() {
  const assessments = await db.assessment.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: true, _count: { select: { questions: true, attempts: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assessments</h1>
        <Link href="/admin/assessments/new" className="rounded bg-accent px-4 py-2 text-sm text-paper">
          New assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <p className="text-ink/60">No assessments yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-ink/50">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Company</th>
              <th className="pb-2">Questions</th>
              <th className="pb-2">Attempts</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => (
              <tr key={a.id} className="border-t border-ink/10">
                <td className="py-2">
                  <Link href={`/admin/assessments/${a.id}`} className="hover:text-accent">
                    {a.name}
                  </Link>
                </td>
                <td className="py-2 text-ink/60">{a.company.name}</td>
                <td className="py-2">{a._count.questions}</td>
                <td className="py-2">{a._count.attempts}</td>
                <td className="py-2">
                  <span
                    className={
                      a.isPublished
                        ? "rounded bg-accentSoft px-2 py-0.5 text-accent"
                        : "rounded bg-ink/10 px-2 py-0.5 text-ink/60"
                    }
                  >
                    {a.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
