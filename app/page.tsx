import { db } from "@/lib/db";
import CandidateRegisterForm from "@/components/candidate/CandidateRegisterForm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let companies: any[] = [];
  try {
    companies = await db.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("Failed to load companies:", err);
    companies = [];
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Clean Focused Header with Official AidLearn Logo Only */}
      <header className="sticky top-0 z-50 h-16 bg-[#1d4ed8] shadow-sm flex items-center px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white p-1.5 shadow-xs flex items-center justify-center">
              <img
                src="/brand/aidlearn-symbol-transparent.png"
                alt="AidLearn Analytics Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-white tracking-tight leading-tight">
                AIDLEARN <span className="text-[#facc15]">ANALYTICS</span>
              </span>
              <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                Corporate Assessment Portal
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Area: Directly Candidate Registration Form */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 flex items-center justify-center">
        <div className="w-full">
          <CandidateRegisterForm companies={companies} />
        </div>
      </main>

      {/* Minimal Clean Footer */}
      <footer className="py-6 px-6 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p>© {new Date().getFullYear()} AidLearn Analytics Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
