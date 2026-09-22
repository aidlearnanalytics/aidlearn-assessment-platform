import { db } from "@/lib/db";
import { Database, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QuestionBankIndexPage() {
  let companies: any[] = [];
  try {
    companies = await db.company.findMany({
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
  } catch (err) {
    console.error("Failed to load question bank companies:", err);
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">
          Question Bank by Company
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Select a client company to review, author, import, or generate custom questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/admin/question-bank/${company.id}`}
            className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#0f172a] group-hover:text-blue-600 transition-colors">
                {company.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {company.industry || "General Industry"}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">
                {company.assessments?.length || 0} Assessments
              </span>
              <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Manage Questions <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}

        {companies.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No client companies registered yet. Create a company in the Directory to begin adding questions.
          </div>
        )}
      </div>
    </div>
  );
}
