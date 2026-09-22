import { db } from "@/lib/db";
import { Database, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QuestionBankIndexPage() {
  const companies = await db.company.findMany({
    include: {
      _count: {
        select: { assessments: true, participants: true },
      },
      assessments: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const totalQuestions = await db.question.count();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">Question Bank & Curriculum</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage question taxonomies, review candidate assessments, and generate AI assessment questions.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#1d4ed8] text-xs font-bold">
          <Database className="w-4 h-4" />
          <span>{totalQuestions} Active Questions</span>
        </div>
      </div>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((c) => (
          <Link
            key={c.id}
            href={`/admin/question-bank/${c.id}`}
            className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-[#1d4ed8] hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1d4ed8]">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-[#1d4ed8] transition-colors flex items-center gap-1">
                  Manage Bank <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <h3 className="text-base font-bold text-[#0f172a] group-hover:text-[#1d4ed8] transition-colors line-clamp-1">
                {c.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                {c.industry || "General Corporate Analytics"}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>{c._count.assessments} Assessments</span>
              <span className="font-bold text-[#1d4ed8]">Manage Questions &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
