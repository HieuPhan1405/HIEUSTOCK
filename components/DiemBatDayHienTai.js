"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import NutThamGia from "@/components/NutThamGia";
import GiaiThichThem from "@/components/GiaiThichThem";
import { HangLocNhanh } from "@/components/boLocChung";
import { fmt, pct } from "@/components/dungChung";
import { soVN } from "@/lib/soVN";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const PRIMARY = "#6C5CE7";
const sans = { fontFamily: "var(--font-chu)" };
const NGUONG = 5; // diem bao tin hieu (xem engine/loi/checklistBatDay.js NGUONG_THAM_KHAO)
const DIEM_TOI_DA = 9;

// 8 dieu kien cua checklist (khop engine/loi/checklistBatDay.js): khoa = ten cot bd_*, diem toi da, mo ta ngan + gia tri hien tai kem muc can dat.
const DK = [
  { k: "c1", nhan: "Chiết khấu ≥ 20% so đỉnh 1 năm", ngan: "Chiết khấu ≥ 20%", max: 1, ct: (r) => (r.chietKhau != null ? `đang −${soVN(r.chietKhau, 0)}%` : null) },
  { k: "c2", nhan: "Quá bán (RSI < 35 và MFI < 30, mỗi điều kiện 0,5 điểm)", ngan: "Quá bán", max: 1, ct: (r) => `RSI ${r.rsi != null ? soVN(r.rsi, 0) : "—"} · MFI ${r.mfi != null ? soVN(r.mfi, 0) : "—"}` },
  { k: "c3", nhan: "Williams %R dưới −80", ngan: "Williams %R < −80", max: 1, ct: (r) => (r.wr != null ? `đang ${soVN(r.wr, 0)}` : null) },
  { k: "c4", nhan: "Giá thấp hơn MA200 từ 12% trở lên", ngan: "Dưới MA200 ≥ 12%", max: 1, ct: (r) => (r.ma200 != null ? `cách MA200 ${r.ma200 > 0 ? "+" : ""}${soVN(r.ma200, 0)}%` : null) },
  { k: "c6", nhan: "Capitulation: phiên giảm kèm khối lượng gấp 2 lần và biên độ rộng gấp 1,5 lần bình thường", ngan: "Capitulation", max: 1, ct: () => "chỉ tính đúng phiên bán tháo" },
  { k: "c7", nhan: "Phân kỳ RSI tại đáy: giá đáy mới thấp hơn nhưng RSI cao hơn", ngan: "Phân kỳ RSI", max: 1, ct: () => "chỉ tính đúng phiên tạo đáy" },
  { k: "c8", nhan: "Đáy sau cao hơn đáy trước", ngan: "Đáy sau cao hơn", max: 1, ct: () => "chỉ tính đúng phiên tạo đáy" },
  { k: "c9", nhan: "Follow-through day: tăng ≥ 1,25% kèm khối lượng tăng, khi đang chiết khấu ≥ 15%", ngan: "Phiên xác nhận tăng", max: 2, ct: () => "chỉ tính đúng phiên tăng mạnh" },
];

const dat = (r, d) => r[d.k] ?? 0;
const thieu = (r) => DK.map((d) => ({ ...d, con: Math.round((d.max - dat(r, d)) * 10) / 10 })).filter((d) => d.con > 0);
const da = (r) => DK.map((d) => ({ ...d, co: dat(r, d) })).filter((d) => d.co > 0);
const canThem = (r) => Math.max(0, Math.round((NGUONG - r.diem) * 10) / 10);
// "chi can 1 dieu kien": co 1 dieu kien chua dat (hoac dat 1 phan) du de cham nguong
const mot = (r) => r.diem < NGUONG && thieu(r).some((d) => d.con >= canThem(r) - 1e-9);
const soDiem = (v) => soVN(v, v % 1 ? 1 : 0, true);

function ChipDK({ d, dat: ok }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] whitespace-nowrap"
      style={ok ? { background: "rgba(74,222,128,0.14)", color: XANH, border: "1px solid rgba(74,222,128,0.35)", fontWeight: 600 } : { background: "transparent", color: MUTED, border: `1px dashed ${VIEN}` }}
      title={d.nhan}
    >
      {ok ? "✓" : "○"} {d.ngan} <b style={{ ...sans, opacity: 0.85 }}>{ok ? `+${soDiem(d.co)}` : `+${soDiem(d.con)}`}</b>
    </span>
  );
}

function ThanhDiem({ v }) {
  const mau = v >= NGUONG ? XANH : v >= 4 ? VANG : MUTED;
  return (
    <div className="min-w-[88px]">
      <div className="flex items-baseline gap-1">
        <b className="text-lg" style={{ ...sans, color: mau }}>{soDiem(v)}</b>
        <span className="text-xs" style={{ color: MUTED }}>/ {DIEM_TOI_DA}</span>
      </div>
      <div className="relative h-1.5 rounded-full mt-0.5" style={{ background: "var(--vien-nhe)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (v / DIEM_TOI_DA) * 100)}%`, background: mau }} />
        <span className="absolute top-[-2px] h-[10px] w-px" style={{ left: `${(NGUONG / DIEM_TOI_DA) * 100}%`, background: TEXT, opacity: 0.55 }} title="Mốc báo tín hiệu: 5 điểm" />
      </div>
    </div>
  );
}

// ĐIỂM BẮT ĐÁY HIỆN TẠI: moi ma dang bao nhieu diem tren checklist + dieu kien nao da dat / con thieu (cung cong thuc voi cac lan bat day lich su). ds: [{ ma, ten, nganh, gia, doi, gtgd, diem, c1..c9, chietKhau, rsi, mfi, wr, ma200 }].
export default function DiemBatDayHienTai({ ds, ngay, capNhat }) {
  const [tim, setTim] = useState("");
  const [nhanh, setNhanh] = useState("tat");
  const [nganh, setNganh] = useState("");
  const [dkThieu, setDkThieu] = useState("");
  const [chiThanhKhoan, setChiThanhKhoan] = useState(true);
  const [sapXep, setSapXep] = useState("diem");
  const [soHien, setSoHien] = useState(60);

  const dsNganh = useMemo(() => [...new Set(ds.map((r) => r.nganh).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")), [ds]);
  const coSo = useMemo(() => {
    const q = tim.trim().toUpperCase();
    return ds.filter((r) => (!chiThanhKhoan || (r.gtgd ?? 0) >= 3) && (!nganh || r.nganh === nganh) && (!q || r.ma.includes(q) || (r.ten ?? "").toUpperCase().includes(q)));
  }, [ds, tim, nganh, chiThanhKhoan]);
  const NHANH = [
    { khoa: "tat", nhan: "Tất cả", f: () => true },
    { khoa: "du", nhan: "Đủ 5 điểm", f: (r) => r.diem >= NGUONG, moTa: "Đã đạt mốc báo tín hiệu bắt đáy" },
    { khoa: "gan", nhan: "Gần đủ (4 – 4,9)", f: (r) => r.diem >= 4 && r.diem < NGUONG },
    { khoa: "mot", nhan: "Chỉ cần thêm 1 điều kiện", f: mot, moTa: "Còn thiếu đúng 1 điều kiện (hoặc phần điểm của nó) là đủ 5 điểm" },
    { khoa: "ba", nhan: "Từ 3 điểm", f: (r) => r.diem >= 3 },
  ].map((m) => ({ ...m, dem: coSo.filter(m.f).length, dang: nhanh === m.khoa }));
  const hien = useMemo(() => {
    const f = NHANH.find((m) => m.khoa === nhanh)?.f ?? (() => true);
    const dk = DK.find((d) => d.k === dkThieu);
    let a = coSo.filter(f).filter((r) => !dk || dat(r, dk) < dk.max);
    a = [...a].sort((x, y) => (sapXep === "ma" ? x.ma.localeCompare(y.ma) : sapXep === "chiet" ? (y.chietKhau ?? 0) - (x.chietKhau ?? 0) : y.diem - x.diem || (y.chietKhau ?? 0) - (x.chietKhau ?? 0)));
    return a;
    // NHANH tinh lai moi lan render (phu thuoc coSo) nen khong dua vao danh sach phu thuoc
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coSo, nhanh, dkThieu, sapXep]);

  if (!ds.length)
    return (
      <div className="rounded-2xl border p-6 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
        Chưa có dữ liệu điểm hiện tại. Số liệu này do engine tính cùng lúc với các chỉ báo kỹ thuật; sau lần cập nhật kế tiếp của engine (khởi động lại engine nếu vừa nâng cấp) bảng sẽ có dữ liệu.
      </div>
    );

  const o = "px-3 py-2 rounded-lg text-sm border";
  const oStyle = { borderColor: VIEN, background: NEN_CARD, color: TEXT, ...sans };
  return (
    <div>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        Mỗi cổ phiếu đang được bao nhiêu điểm trên checklist bắt đáy (tối đa {DIEM_TOI_DA}), điều kiện nào <b style={{ color: XANH }}>đã đạt</b> và điều kiện nào <b style={{ color: TEXT }}>còn thiếu</b>. Hệ thống báo tín hiệu khi đạt từ {NGUONG} điểm.
      </p>
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        Dữ liệu phiên {ngay ? ngay.split("-").reverse().join("/") : "gần nhất"}
        {capNhat ? ` · cập nhật ${new Date(capNhat).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" })} ${new Date(capNhat).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : ""}
      </p>
      <GiaiThichThem className="mb-3" nhanMo="Cách tính điểm và các điều kiện">
        <p>Tổng điểm gồm 8 điều kiện: nhóm giá (chiết khấu, quá bán, Williams %R, dưới MA200) tối đa 4 điểm; nhóm tín hiệu đáy (capitulation, phân kỳ RSI, đáy sau cao hơn) tối đa 3 điểm; phiên xác nhận tăng 2 điểm.</p>
        <ul className="mt-1 space-y-0.5">
          {DK.map((d) => (
            <li key={d.k}>
              • {d.nhan} (+{soDiem(d.max)})
            </li>
          ))}
        </ul>
        <p className="mt-1">Ba điều kiện cuối (capitulation, phân kỳ, đáy sau cao hơn) và phiên xác nhận chỉ đạt đúng vào phiên xảy ra, nên điểm của một mã có thể thay đổi từng ngày. Điểm hiện tại chỉ để theo dõi mã nào sắp đủ điều kiện, không phải khuyến nghị mua.</p>
      </GiaiThichThem>

      <HangLocNhanh ds={NHANH} onChon={(m) => setNhanh(m.khoa)} />
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} aria-hidden="true" />
          <input value={tim} onChange={(e) => { setTim(e.target.value); setSoHien(60); }} placeholder="Tìm mã hoặc tên công ty…" aria-label="Tìm mã hoặc tên công ty" className={`${o} w-full pl-9`} style={oStyle} />
        </div>
        <select value={nganh} onChange={(e) => { setNganh(e.target.value); setSoHien(60); }} aria-label="Ngành" className={o} style={{ ...oStyle, color: nganh ? TEXT : MUTED }}>
          <option value="">Mọi ngành</option>
          {dsNganh.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={dkThieu} onChange={(e) => { setDkThieu(e.target.value); setSoHien(60); }} aria-label="Đang thiếu điều kiện" className={o} style={{ ...oStyle, color: dkThieu ? TEXT : MUTED }}>
          <option value="">Đang thiếu: bất kỳ</option>
          {DK.map((d) => (
            <option key={d.k} value={d.k}>Đang thiếu: {d.ngan}</option>
          ))}
        </select>
        <select value={sapXep} onChange={(e) => setSapXep(e.target.value)} aria-label="Sắp xếp" className={o} style={oStyle}>
          <option value="diem">Điểm cao nhất</option>
          <option value="chiet">Chiết khấu sâu nhất</option>
          <option value="ma">Mã A → Z</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: MUTED }} title="Hệ thống chỉ bắt đáy các mã có GTGD trung bình 20 phiên từ 3 tỷ (VN100 không giới hạn)">
          <input type="checkbox" checked={chiThanhKhoan} onChange={(e) => setChiThanhKhoan(e.target.checked)} />
          Chỉ mã thanh khoản ≥ 3 tỷ
        </label>
      </div>
      <p className="text-xs mb-2" style={{ color: MUTED }}>
        <b style={{ color: TEXT }}>{hien.length}</b> / {coSo.length} mã
      </p>

      {/* DIEN THOAI: the */}
      <div className="sm:hidden rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        {hien.slice(0, soHien).map((r, i) => (
          <div key={r.ma} className={`px-3 py-3 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5">
                  <Link href={`/ma/${r.ma}`} className="font-bold" style={sans}>{r.ma}</Link>
                  <NutThamGia ma={r.ma} soNguoiThamGia={0} daThamGia={false} />
                  <span className="text-xs truncate" style={{ color: MUTED }}>{r.nganh}</span>
                </p>
                <p className="text-xs" style={{ color: MUTED }}>
                  {fmt(r.gia)} · <span style={{ color: r.doi > 0 ? XANH : r.doi < 0 ? DO : MUTED }}>{pct(r.doi, 2)}</span> · chiết khấu {r.chietKhau != null ? `${soVN(r.chietKhau, 0)}%` : "—"}
                </p>
              </div>
              <ThanhDiem v={r.diem} />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {da(r).map((d) => <ChipDK key={d.k} d={d} dat />)}
              {thieu(r).map((d) => <ChipDK key={d.k} d={d} dat={false} />)}
            </div>
            {r.diem < NGUONG && <p className="text-xs mt-1.5" style={{ color: VANG }}>Cần thêm {soDiem(canThem(r))} điểm để đủ {NGUONG}</p>}
          </div>
        ))}
        {hien.length === 0 && <p className="py-6 text-center text-sm" style={{ color: MUTED }}>Không có mã nào khớp.</p>}
      </div>

      {/* MAY TINH: bang */}
      <div className="hidden sm:block rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-auto bang-cuon max-h-[calc(100vh-150px)]">
          <table className="w-full text-sm" style={sans}>
            <thead>
              <tr style={{ color: MUTED }}>
                {["Mã", "Giá", "Điểm", "Đã đạt", "Còn thiếu", "Cần thêm"].map((t) => (
                  <th key={t} className={`sticky top-0 z-[2] border-b px-3 py-2.5 font-normal text-left whitespace-nowrap ${t === "Mã" ? "left-0 z-[3]" : ""}`} style={{ background: NEN_CARD, borderColor: VIEN }}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hien.slice(0, soHien).map((r) => (
                <tr key={r.ma} className="border-t hover:bg-[color:var(--hover-nhe)] align-top" style={{ borderColor: "var(--vien-nhe)" }}>
                  <td className="px-3 py-2 sticky left-0" style={{ background: NEN_CARD }}>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/ma/${r.ma}`} className="font-bold hover:underline">{r.ma}</Link>
                      <NutThamGia ma={r.ma} soNguoiThamGia={0} daThamGia={false} />
                    </div>
                    <span className="block text-[11px] truncate max-w-[150px]" style={{ color: MUTED }} title={r.ten}>{r.nganh}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <b>{fmt(r.gia)}</b>
                    <span className="block text-[11px]" style={{ color: r.doi > 0 ? XANH : r.doi < 0 ? DO : MUTED }}>{pct(r.doi, 2)}</span>
                    <span className="block text-[11px]" style={{ color: MUTED }}>chiết khấu {r.chietKhau != null ? `${soVN(r.chietKhau, 0)}%` : "—"}</span>
                  </td>
                  <td className="px-3 py-2"><ThanhDiem v={r.diem} /></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                      {da(r).length ? da(r).map((d) => <ChipDK key={d.k} d={d} dat />) : <span className="text-xs" style={{ color: MUTED }}>Chưa đạt điều kiện nào</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5 max-w-[360px]">
                      {thieu(r).map((d) => (
                        <span key={d.k} title={d.ct(r) ? `${d.nhan} — ${d.ct(r)}` : d.nhan}>
                          <ChipDK d={d} dat={false} />
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: r.diem >= NGUONG ? XANH : VANG, fontWeight: 700 }}>
                    {r.diem >= NGUONG ? "Đủ điểm" : `+${soDiem(canThem(r))} điểm`}
                  </td>
                </tr>
              ))}
              {hien.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm" style={{ color: MUTED }}>Không có mã nào khớp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {hien.length > soHien && (
        <div className="text-center mt-3">
          <button type="button" onClick={() => setSoHien(soHien + 60)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: VIEN, color: PRIMARY, ...sans }}>
            Hiện thêm ({hien.length - soHien} mã)
          </button>
        </div>
      )}
    </div>
  );
}
