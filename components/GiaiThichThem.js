import { ChevronDown } from "lucide-react";

const MUTED = "#8B8B99";

// Doan giai thich dai thu gon: chi hien 1 dong tom tat + nut "Xem giải thích", bam moi mo phan day du (the <details> co san cua trinh duyet, khong can JavaScript).
export default function GiaiThichThem({ tomTat, children, className = "" }) {
  return (
    <details className={`group text-[11px] leading-relaxed ${className}`} style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
      <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden inline-flex flex-wrap items-center gap-x-1.5">
        {tomTat && <span>{tomTat}</span>}
        <span className="inline-flex items-center gap-0.5 underline decoration-dotted underline-offset-2" style={{ color: "#A6A6B3" }}>
          <span className="group-open:hidden">Xem giải thích</span>
          <span className="hidden group-open:inline">Thu gọn</span>
          <ChevronDown size={12} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}
