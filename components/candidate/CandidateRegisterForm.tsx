"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
}

export default function CandidateRegisterForm({
  companies = [],
}: {
  companies: CompanyOption[];
}) {
  const router = useRouter();

  const [companyId, setCompanyId] = useState<string>(
    companies.length > 0 ? companies[0].id : ""
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const selectedId = companyId || (companies.length > 0 ? companies[0].id : "");
      if (!selectedId) {
        throw new Error("Please select an organization to proceed.");
      }

      const res = await fetch("/api/candidates/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          department: department.trim() || undefined,
          companyId: selectedId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate assessment. Please try again.");
      }

      router.push(`/assessment/${data.attemptId}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1d4ed8] text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Proctored Skills Diagnostic
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
          Candidate Registration
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Enter your candidate details below to begin your timed technical evaluation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Company Dropdown */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Organization / Evaluation Suite <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-xs bg-slate-50/50 text-[#0f172a] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.industry ? `· ${c.industry}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Oluwaseun Adeyemi"
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-xs bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Work Email */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Work or Official Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. candidate@company.com"
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-xs bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +234 801 234 5678"
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-xs bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Department / Role Focus <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Financial Planning & Analysis / Data Analytics"
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-xs bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Timed proctoring with automated fullscreen and tab-switch monitoring.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting Assessment...
            </>
          ) : (
            <>
              <span>Begin Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
