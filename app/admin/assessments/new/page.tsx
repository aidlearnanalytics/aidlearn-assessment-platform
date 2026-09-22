import { db } from "@/lib/db";
import AssessmentForm from "@/components/admin/AssessmentForm";

export default async function NewAssessmentPage() {
  const companies = await db.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">New assessment</h1>
      <p className="mb-6 text-sm text-ink/60">
        Set it up here, then attach approved questions from the next screen before publishing.
      </p>
      <AssessmentForm companies={companies} />
    </div>
  );
}
