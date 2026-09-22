"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  PlusCircle,
  Users,
  BookOpen,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";

interface CompanyItem {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  createdAt: string | Date;
  _count: {
    participants: number;
    assessments: number;
    questions: number;
  };
}

export default function CompanyListWithModal({ companies }: { companies: CompanyItem[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), industry: industry.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create company");
      }

      setShowModal(false);
      setName("");
      setIndustry("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create company");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">
            Client Organizations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage corporate accounts, monitor candidate rosters, and generate executive reports.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Company</span>
        </button>
      </div>

      {/* Companies List / Grid */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0f172a] mb-1">No Companies Registered</h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Get started by adding your first client organization. You can then assign questions or generate tailored curricula with AI.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            + Create First Company
          </button>
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
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1d4ed8] flex items-center justify-center font-bold text-sm">
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    {c.industry || "General Industry"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#0f172a] group-hover:text-[#1d4ed8] transition-colors line-clamp-1">
                  {c.name}
                </h3>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-lg font-black text-[#0f172a] block">
                      {c._count.participants}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Candidates
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-lg font-black text-[#0f172a] block">
                      {c._count.questions}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Questions
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href={`/admin/companies/${c.id}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/admin/question-bank/${c.id}`}
                  title="Manage Question Bank"
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-[#1d4ed8]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#0f172a]">Create Client Organization</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company / Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Zenith Bank Plc"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Industry / Sector <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Commercial Banking & Asset Management"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50/50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  {loading ? "Creating..." : "Save Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
