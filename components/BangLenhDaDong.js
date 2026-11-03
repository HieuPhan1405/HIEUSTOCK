"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fmt, pct } from "@/components/dungChung";
import { HangLocNhanh } from "@/components/boLocChung";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";

const ngayVN = (s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "—");
const mauLai = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);

// BO LOC NHANH cua bang Lenh da dong (moi dong = 1 lan chot / dong lenh, xem components/LenhDaDongView.js)
const NHANH = [
  { khoa: "tatca", nhan: "Tất cả", f: () => true },
  { khoa: "lai", nhan: "Có lãi", f: (x) => x.lai_lo_pct > 0 },
  { khoa: "lo", nhan: "Bị lỗ", f: (x) => x.lai_lo_pct < 0 },
  { khoa: "tp", nhan: "Chốt lời từng phần", f: (x) => x.ly_do === "TP1" || x.ly_do === "TP2" },
  { khoa: "catLo", nhan: "Cắt lỗ", f: (x) => x.ly_do === "CAT_LO" },
  { khoa: "muaMoi", nhan: "Lệnh Mua mới", f: (x) => x._muaMoi },
];

// BANG LENH DA DONG (client: loc nhanh + the dien thoai). ds da duoc trang server gan san _ketThuc (chuoi ly do dong), _muaMoi, _tenNgan, _ten.
export default function BangLenhDaDong({ ds }) {
  const [nhanh, setNhanh] = useState("tatca");
  const dsNhanh = useMemo(() => NHANH.map((m) => ({ ...m, dem: ds.filter(m.f).length, dang: nhanh === m.khoa })).filter((m) => m.khoa === "tatca" || m.dem > 0), [ds, nhanh]);
  const daLoc = useMemo(() => ds.filter((NHANH.find((m) => m.khoa === nhanh) ?? NHANH[0]).f), [ds, nhanh]);

  if (ds.length === 0) {
    return (
      <div className="rounded-2xl border py-8 px-4 text-center text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
        Chưa có lệnh nào đóng kể từ khi web bắt đầu ghi nhận. Khi một mã đang NẮM GIỮ chuyển sang BÁN, kết quả sẽ tự xuất hiện ở đây.
      </div>
    );
  }

  return (
    <div>
      <HangLocNhanh ds={dsNhanh} onChon={(m) => setNhanh(m.dang ? "tatca" : m.khoa)} />

      {/* DIEN THOAI: the */}
      <div className="sm:hidden rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        {daLoc.map((x, i) => (
          <Link key={`${x.ma}-${x.ngay_mua}-${x.vong}-${x.ly_do}-${i}`} href={`/ma/${x.ma}`} className={`block px-3 py-2.5 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5">
                  <span className="font-bold" style={{ fontFamily: "var(--font-chu)" }}>
                    {x.ma}
                  </span>
                  <span className="text-xs truncate" style={{ color: x._muaMoi ? "var(--cyan)" : MUTED }}>
                    {x._muaMoi ? "Mua mới" : x._tenNgan}
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {fmt(x.gia_mua)} → {fmt(x.gia_ban)} · {ngayVN(x.ngay_ban)} · {x.so_phien ?? "—"} phiên
                </p>
              </div>
              <p className="text-base font-bold shrink-0" style={{ fontFamily: "var(--font-chu)", color: mauLai(x.lai_lo_pct) }}>
                {pct(x.lai_lo_pct, 2)}
              </p>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--chu-2)" }}>
              {x._ketThuc}
            </p>
          </Link>
        ))}
      </div>

      {/* MAY TINH: bang, tieu de dinh khi cuon */}
      <div className="hidden sm:block rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-auto bang-cuon max-h-[calc(100vh-150px)]">
          <table className="w-full text-sm" style={{ fontFamily: "var(--font-chu)" }}>
            <thead>
              <tr className="text-left" style={{ color: MUTED }}>
                {[
                  ["Mã", ""],
                  ["Ngày mua", ""],
                  ["Giá mua", "text-right"],
                  ["Ngày bán", ""],
                  ["Giá bán", "text-right"],
                  ["Lãi/Lỗ", "text-right"],
                  ["Số phiên", "text-right"],
                  ["Kết thúc", ""],
                ].map(([t, can], i) => (
                  <th key={t} className={`sticky top-0 py-2.5 px-3 font-normal border-b whitespace-nowrap ${can} ${i === 0 ? "left-0 z-[3]" : "z-[2]"}`} style={{ background: NEN_CARD, borderColor: VIEN }}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daLoc.map((x, i) => (
                <tr key={`${x.ma}-${x.ngay_mua}-${x.vong}-${x.ly_do}-${i}`} className={`hover:bg-[color:var(--hover-nhe)] ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
                  <td className="py-2 px-3 sticky left-0 z-[1]" style={{ background: NEN_CARD }}>
                    <Link href={`/ma/${x.ma}`} className="hover:underline" style={{ fontWeight: 700 }}>
                      {x.ma}
                    </Link>
                    {x._muaMoi && (
                      <span className="block text-[11px] font-bold leading-tight mt-0.5" style={{ color: "var(--cyan)" }}>
                        Mua mới
                      </span>
                    )}
                    {x._tenNgan && (
                      <span className="block max-w-[170px] truncate text-[11px] leading-tight" style={{ color: MUTED }} title={x._ten}>
                        {x._tenNgan}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3" style={{ color: MUTED }}>
                    {ngayVN(x.ngay_mua)}
                  </td>
                  <td className="py-2 px-3 text-right">{fmt(x.gia_mua)}</td>
                  <td className="py-2 px-3" style={{ color: MUTED }}>
                    {ngayVN(x.ngay_ban)}
                  </td>
                  <td className="py-2 px-3 text-right">{fmt(x.gia_ban)}</td>
                  <td className="py-2 px-3 text-right font-bold" style={{ color: mauLai(x.lai_lo_pct) }}>
                    {pct(x.lai_lo_pct, 2)}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: MUTED }}>
                    {x.so_phien ?? "—"}
                  </td>
                  <td className="py-2 px-3 text-xs max-w-[320px]" style={{ color: "var(--chu-2)" }}>
                    {x._ketThuc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
