import { db } from "@/lib/db";
import Link from "next/link";

export default async function CompaniesPage() {
  const companies = await db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { assessments: true, participants: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <Link href="/admin/companies/new" className="rounded bg-accent px-4 py-2 text-sm text-paper">
          New company
        </Link>
      </div>

      {companies.length === 0 ? (
        <p className="text-ink/60">No companies yet. Create the first one to start building an assessment.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-ink/50">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Industry</th>
              <th className="pb-2">Assessments</th>
              <th className="pb-2">Participants</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t border-ink/10">
                <td className="py-2">
                  <Link href={`/admin/companies/${c.id}`} className="hover:text-accent">
                    {c.name}
                  </Link>
                </td>
                <td className="py-2 text-ink/60">{c.industry ?? "—"}</td>
                <td className="py-2">{c._count.assessments}</td>
                <td className="py-2">{c._count.participants}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
