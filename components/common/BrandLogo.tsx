import Link from "next/link";
import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  href?: string;
  subtitle?: string;
}

export function BrandLogo({
  className = "",
  iconClassName = "w-8 h-8",
  showText = true,
  href = "/",
  subtitle = "Assessment Platform",
}: BrandLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative flex shrink-0 items-center justify-center ${iconClassName}`}>
        <img
          src="/brand/aidlearn-symbol-transparent.png"
          alt="AidLearn Analytics"
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <div className="flex flex-col justify-center select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-black tracking-tight text-[#0f172a] uppercase">
              AidLearn
            </span>
            <span className="text-[10px] font-bold tracking-widest text-[#1d4ed8] uppercase">
              Analytics
            </span>
          </div>
          {subtitle && (
            <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="transition-opacity hover:opacity-90 inline-flex items-center">
      {content}
    </Link>
  );
}
