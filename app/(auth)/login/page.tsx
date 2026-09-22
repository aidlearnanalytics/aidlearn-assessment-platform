import { BrandLogo } from "@/components/common/BrandLogo";
import { LoginForm } from "@/components/auth/LoginForm";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandLogo iconClassName="w-12 h-12" subtitle="Administrator Portal" />
          <h1 className="mt-6 text-2xl font-extrabold text-slate-900 tracking-tight">
            Admin Sign In
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xs">
            Enter your credentials to access the AidLearn Assessment & Diagnostic Management Console.
          </p>
        </div>

        {/* Card Surface */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <LoginForm />
        </div>

        {/* Security Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Encrypted Session & Access Control</span>
        </div>
      </div>
    </main>
  );
}
