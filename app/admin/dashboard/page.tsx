import { db } from "@/lib/db";

async function getStats() {
  const [companies, assessments, questions, attempts] = await Promise.all([
    db.company.count(),
    db.assessment.count(),
    db.question.count({ where: { status: "APPROVED" } }),
    db.assessmentAttempt.count(),
  ]);
  return { companies, assessments, questions, attempts };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Companies", value: stats.companies },
    { label: "Assessments", value: stats.assessments },
    { label: "Approved questions", value: stats.questions },
    { label: "Attempts recorded", value: stats.attempts },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="flex flex-col items-center justify-center rounded border border-ink/10 p-4 text-center"
          >
            <p className="text-3xl font-semibold">{c.value}</p>
            <p className="text-sm text-ink/60">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
