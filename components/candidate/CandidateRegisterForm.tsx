"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, User, Mail, Phone, Briefcase, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
}

export default function CandidateRegisterForm({ companies }: { companies: CompanyOption[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) {
      setError("Please select your organization/company.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/candidates/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          department: department || undefined,
          companyId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate assessment. Please try again.");
      }

      router.push(`/assessment/${data.attemptId}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm max-w-md mx-auto">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#0f172a] mb-1">No Assessments Active</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          There are currently no company evaluations published. Administrators can create client organizations and generate AI question banks from the Admin Portal.
        </p>
        <a
          href="/admin"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          Go to Admin Portal &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1d4ed8] text-[11px] font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Proctored Skills Diagnostic
        </div>
        <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">Candidate Verification</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your details below to access your company&apos;s tailored evaluation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Company Dropdown */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Organization / Company <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs bg-slate-50/50 text-[#0f172a] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.industry ? `(${c.industry})` : ""}
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
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Work Email */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Work Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. o.adeyemi@company.com"
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
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
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Department / Team <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Business Intelligence / FP&A"
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
          <span>Fullscreen proctoring and tab-switch monitoring are enforced.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Initializing Assessment...
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
