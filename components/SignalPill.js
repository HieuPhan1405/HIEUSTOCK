export default function SignalPill({ tin }) {
  const map = {
    MUA: { bg: "#1F3D2E", text: "#5FCF8A", label: "MUA" },
    BAN: { bg: "#3D1F1F", text: "#E86A6A", label: "BAN" },
    "NAM GIU": { bg: "#332B14", text: "#E8C873", label: "NẮM GIỮ" },
    "TRUNG LAP": { bg: "#2A2620", text: "#A8A296", label: "TRUNG LẬP" },
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
