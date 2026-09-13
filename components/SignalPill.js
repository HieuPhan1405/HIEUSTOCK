export default function SignalPill({ tin }) {
  const map = {
    MUA: { bg: "#123423", text: "#22C55E", label: "MUA" },
    BAN: { bg: "#3A1620", text: "#EF4444", label: "BAN" },
    "NAM GIU": { bg: "#332413", text: "#FBBF24", label: "NẮM GIỮ" },
    "TRUNG LAP": { bg: "#26262F", text: "#A6A6B3", label: "TRUNG LẬP" },
  };
  const s = map[tin] || map["TRUNG LAP"];
  return (
    <span
      style={{ background: s.bg, color: s.text, fontFamily: "'JetBrains Mono', monospace" }}
      className="px-2 py-0.5 text-xs font-bold tracking-wide rounded-sm"
    >
      {s.label}
    </span>
  );
}
