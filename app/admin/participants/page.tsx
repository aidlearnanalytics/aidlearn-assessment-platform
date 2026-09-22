import { db } from "@/lib/db";

export default async function ParticipantsPage() {
  const participants = await db.participant.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: true, attempts: { select: { status: true, overallPct: true } } },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Participants</h1>
      <table className="w-full text-sm">
        <thead className="text-left text-ink/50">
          <tr>
            <th className="pb-2">Name</th>
            <th className="pb-2">Company</th>
            <th className="pb-2">Attempts</th>
            <th className="pb-2">Best score</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => {
            const best = p.attempts.reduce(
              (max, a) => (a.overallPct && a.overallPct > max ? a.overallPct : max),
              0
            );
            return (
              <tr key={p.id} className="border-t border-ink/10">
                <td className="py-2">{p.fullName}</td>
                <td className="py-2 text-ink/60">{p.company.name}</td>
                <td className="py-2">{p.attempts.length}</td>
                <td className="py-2">{best ? `${best.toFixed(0)}%` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {participants.length === 0 && <p className="text-ink/60">No participants yet.</p>}
    </div>
  );
}
