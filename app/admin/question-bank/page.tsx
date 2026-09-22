import { db } from "@/lib/db";
import Link from "next/link";
import { BookOpen, Building2, Sparkles, ArrowRight, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuestionBankDirectoryPage() {
  const companies = await db.company.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { questions: true },
      },
      assessments: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          passingScorePct: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">
            Question Bank Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Select a company below to manage its custom evaluation questions and generate AI curricula.
          </p>
        </div>

        <Link
          href="/admin/companies"
          className="px-4 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Company</span>
        </Link>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0f172a] mb-1">No Companies Registered Yet</h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first client company before generating question banks.
          </p>
          <Link
            href="/admin/companies"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
          >
            Go to Companies &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 hover:shadow-cardHover transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-[#7c3aed] flex items-center justify-center font-bold text-sm">
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    {c.industry || "General"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#0f172a] group-hover:text-[#1d4ed8] transition-colors line-clamp-1">
                  {c.name}
                </h3>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-2xl font-black text-[#0f172a] block">
                    {c._count.questions}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Questions Assigned
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href={`/admin/question-bank/${c.id}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  <span>Manage & Generate Questions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
