"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { fmt, nhe } from "@/components/dungChung";
import { soVN } from "@/lib/soVN";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const PRIMARY = "#6C5CE7";

// 3 kich ban gia cac phien sau (engine/dich-vu/kichBanMua.mjs). So phien toi da engine xet: 10.
const KICH_BAN = [
  { khoa: "giu", nhan: "Giữ giá", phu: "giá đứng yên" },
  { khoa: "tang", nhan: "Tăng đều", phu: "+1%/phiên" },
  { khoa: "giam", nhan: "Giảm đều", phu: "−1%/phiên" },
];

const ngayNgan = (v) => (v ? v.slice(8, 10) + "/" + v.slice(5, 7) : "—");
const so1 = (v) => soVN(v, 1);

// So phien SOM NHAT ra MUA trong 3 kich ban (0 = hom nay co khoang gia ra MUA); 99 = khong co.
function somNhat(r) {
  const ds = KICH_BAN.map((k) => r[`${k.khoa}_phien`]).filter((v) => v != null);
  if (r.mua_tu != null) ds.push(0);
  return ds.length ? Math.min(...ds) : 99;
}

// "xu huong 0,5 -> 2" - chi hien phan DOI so voi hien tai (xu huong / dong luong / dong tien), de biet dieu kien nao thay doi.
function chuoiThayDoi(r, k) {
  const cap = [
    ["Xu hướng", r.trend, r[`${k}_trend`]],
    ["Động lượng", r.mom, r[`${k}_mom`]],
    ["Dòng tiền", r.dt, r[`${k}_dt`]],
  ];
  const doi = cap.filter(([, a, b]) => a != null && b != null && Math.abs(a - b) > 1e-9);
  if (doi.length === 0) return "điểm thành phần giữ nguyên";
  return doi.map(([ten, a, b]) => `${ten} ${so1(a)}→${so1(b)}`).join(" · ");
}

function OKichBan({ r, k }) {
  const phien = r[`${k}_phien`];
  if (phien == null) return <span style={{ color: MUTED }}>—</span>;
  const doi = r[`${k}_doi`];
  return (
    <div className="leading-tight">
      <span className="font-bold" style={{ color: phien <= 3 ? XANH : TEXT }}>
        +{phien} phiên
      </span>
      <span className="text-[11px] ml-1" style={{ color: MUTED }}>
        ({ngayNgan(r[`${k}_ngay`])}, giá {fmt(r[`${k}_gia`])})
      </span>
      <div className="text-[11px]" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        Điểm {soVN(r[`${k}_diem`], 2, true)} · {chuoiThayDoi(r, k)}
        {doi != null && doi < phien && <> · đủ điểm từ +{doi}, chờ xác nhận</>}
      </div>
    </div>
  );
}

const COT = [
  { khoa: "ma", nhan: "Mã", canPhai: false, lay: (r) => r.ma },
  { khoa: "gia", nhan: "Giá", canPhai: true, lay: (r) => r.gia },
  { khoa: "diem", nhan: "Điểm", canPhai: true, lay: (r) => r.diem },
  { khoa: "som", nhan: "Hôm nay", canPhai: false, lay: (r) => (r.mua_tu != null ? 0 : 99) },
  ...KICH_BAN.map((k) => ({ khoa: k.khoa, nhan: k.nhan, phu: k.phu, canPhai: false, lay: (r) => r[`${k.khoa}_phien`] ?? 99 })),
];

export default function BangKichBanMua({ duLieu }) {
  const [timKiem, setTimKiem] = useState("");
  const [loc, setLoc] = useState("co"); // co = chi ma co kich ban | homnay | ba | tat
  const [sapXep, setSapXep] = useState({ khoa: "sn", chieu: "asc" });

  const daLoc = useMemo(() => {
    const tuKhoa = timKiem.trim().toUpperCase();
    let ds = tuKhoa ? duLieu.filter((r) => r.ma.includes(tuKhoa)) : duLieu;
    if (loc === "co") ds = ds.filter((r) => somNhat(r) < 99);
    else if (loc === "homnay") ds = ds.filter((r) => r.mua_tu != null);
    else if (loc === "ba") ds = ds.filter((r) => somNhat(r) <= 3);
    const cot = sapXep.khoa === "sn" ? { lay: somNhat } : COT.find((c) => c.khoa === sapXep.khoa);
    return [...ds].sort((a, b) => {
      const va = cot.lay(a);
      const vb = cot.lay(b);
      const so = typeof va === "string" || typeof vb === "string" ? String(va ?? "").localeCompare(String(vb ?? "")) : (va ?? -Infinity) - (vb ?? -Infinity);
      return (sapXep.chieu === "asc" ? so : -so) || a.ma.localeCompare(b.ma);
    });
  }, [duLieu, timKiem, loc, sapXep]);

  function doiSapXep(khoa) {
    setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: khoa === "ma" ? "asc" : khoa === "diem" || khoa === "gia" ? "desc" : "asc" }));
  }

  const LOC = [
    { khoa: "co", nhan: "Có kịch bản mua" },
    { khoa: "ba", nhan: "Trong 3 phiên" },
    { khoa: "homnay", nhan: "Có thể MUA hôm nay" },
    { khoa: "tat", nhan: "Tất cả mã" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={MUTED} />
          <input
            value={timKiem}
            onChange={(e) => setTimKiem(e.target.value)}
            placeholder="Tìm mã cổ phiếu..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'JetBrains Mono', monospace" }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {LOC.map((l) => (
            <button
              key={l.khoa}
              type="button"
              onClick={() => setLoc(l.khoa)}
              className="px-3 py-1.5 text-xs rounded-full border"
              style={{
                borderColor: loc === l.khoa ? PRIMARY : VIEN,
                background: loc === l.khoa ? nhe(PRIMARY, 16) : "transparent",
                color: loc === l.khoa ? TEXT : MUTED,
                fontFamily: "'Inter', sans-serif",
                fontWeight: loc === l.khoa ? 700 : 500,
              }}
            >
              {l.nhan}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs mb-2" style={{ color: MUTED }}>
        Hiển thị {daLoc.length} / {duLieu.length} mã chưa có lệnh.
      </p>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                {COT.map((c) => (
                  <th key={c.khoa} className={`py-3 px-3 font-normal cursor-pointer select-none whitespace-nowrap ${c.canPhai ? "text-right" : "text-left"}`} onClick={() => doiSapXep(c.khoa)}>
                    <span className="inline-flex items-center gap-1">
                      {c.nhan}
                      {c.phu && (
                        <span className="text-[10px]" style={{ opacity: 0.7 }}>
                          ({c.phu})
                        </span>
                      )}
                      {sapXep.khoa === c.khoa ? (
                        sapXep.chieu === "desc" ? <ArrowDown size={12} color={PRIMARY} /> : <ArrowUp size={12} color={PRIMARY} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daLoc.map((r, i) => (
                <tr key={r.ma} className={i > 0 ? "border-t align-top" : "align-top"} style={{ borderColor: "var(--vien-nhe)" }}>
                  <td className="py-2.5 px-3">
                    <Link href={`/ma/${r.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                      {r.ma}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-right">{fmt(r.gia)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span style={{ color: r.diem >= 1.25 ? XANH : TEXT }}>{soVN(r.diem, 2, true)}</span>
                    <div className="text-[10px]" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                      XH {so1(r.trend)} · ĐL {so1(r.mom)} · DT {so1(r.dt)}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {r.mua_tu != null ? (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-sm whitespace-nowrap" style={{ background: nhe(XANH, 14), color: XANH }}>
                        Đóng cửa {fmt(r.mua_tu)}
                        {r.mua_den !== r.mua_tu ? `–${fmt(r.mua_den)}` : ""}
                      </span>
                    ) : (
                      <span style={{ color: MUTED }}>—</span>
                    )}
                  </td>
                  {KICH_BAN.map((k) => (
                    <td key={k.khoa} className="py-2.5 px-3 min-w-[170px]">
                      <OKichBan r={r} k={k.khoa} />
                    </td>
                  ))}
                </tr>
              ))}
              {daLoc.length === 0 && (
                <tr>
                  <td colSpan={COT.length} className="py-6 text-center text-sm" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Chưa có dữ liệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[11px] mt-3 space-y-1" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        <p>
          <b style={{ color: VANG }}>Cách đọc:</b> &quot;Hôm nay&quot; là khoảng giá đóng cửa của phiên hôm nay (trong biên độ ±7%) mà hệ thống sẽ ra tín hiệu MUA. Ba cột kịch bản cho biết nếu giá giữ nguyên /
          tăng đều 1% / giảm đều 1% mỗi phiên thì sau bao nhiêu phiên mã đủ điều kiện MUA (tối đa 10 phiên), kèm điểm lúc đó và thành phần nào thay đổi (XH = xu hướng, ĐL = động lượng, DT = dòng tiền).
        </p>
        <p>
          Đây là mô phỏng với giả định khối lượng mỗi phiên bằng trung bình 20 phiên và chưa tính độ rộng ngành, nên có thể lệch nhẹ so với tín hiệu thật. Giá chạy khác kịch bản thì thời điểm sẽ khác.
          Thông tin tham khảo, không phải khuyến nghị đầu tư.
        </p>
      </div>
    </div>
  );
}
