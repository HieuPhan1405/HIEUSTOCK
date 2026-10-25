"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { soVN } from "@/lib/soVN";

// KHOI "DONG TIEN THOI GIAN THUC" cua Dashboard thi truong (du lieu tu DNSE: engine/dich-vu/dongTienRealTime.mjs -> /api/dong-tien). Don vi hien thi: TY DONG (du lieu goc: trieu dong).
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const sans = { fontFamily: "var(--font-chu)" };
const CHU_KY_MS = 20_000;

export const ty = (trieu, chuSo = 1) => (trieu == null ? "—" : soVN(trieu / 1000, chuSo));
const dau = (trieu, chuSo = 1) => (trieu == null ? "—" : `${trieu > 0 ? "+" : ""}${ty(trieu, chuSo)}`);
const mau = (v) => (v == null || v === 0 ? MUTED : v > 0 ? XANH : DO);
const gio = (iso) => (iso ? new Date(iso).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "");
const ngayVN = (s) => (s ? s.split("-").reverse().join("/") : "");

// thanh ty le mua / ban chu dong
export function ThanhMuaBan({ mua, ban, cao = 10 }) {
  const t = (mua ?? 0) + (ban ?? 0);
  const pm = t > 0 ? (mua / t) * 100 : 50;
  return (
    <div className="flex w-full rounded-full overflow-hidden" style={{ height: cao, background: VIEN }} role="img" aria-label={`Mua chủ động ${pm.toFixed(0)}%`}>
      <div style={{ width: `${pm}%`, background: XANH }} />
      <div style={{ width: `${100 - pm}%`, background: DO }} />
    </div>
  );
}

function TheNhom({ ten, g, phu }) {
  if (!g) return null;
  const tiLe = g.mua + g.ban > 0 ? (g.mua / (g.mua + g.ban)) * 100 : null;
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex items-baseline justify-between mb-2">
        <span style={{ ...sans, fontWeight: 700 }}>{ten}</span>
        {phu && <span className="text-[11px]" style={{ color: MUTED }}>{phu}</span>}
      </div>
      <ThanhMuaBan mua={g.mua} ban={g.ban} />
      <div className="flex justify-between text-xs mt-1.5" style={{ color: MUTED }}>
        <span>Mua chủ động <b style={{ color: XANH }}>{ty(g.mua, 0)} tỷ</b></span>
        <span>Bán chủ động <b style={{ color: DO }}>{ty(g.ban, 0)} tỷ</b></span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xl" style={{ fontWeight: 800, color: mau(g.rong) }}>{dau(g.rong, 0)} tỷ</span>
        <span className="text-[11px]" style={{ color: MUTED }}>ròng chủ động{tiLe != null ? ` · mua ${tiLe.toFixed(0)}%` : ""}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs" style={{ color: MUTED }}>
        <span>Lệnh lớn ròng <b style={{ color: mau(g.lon?.rong) }}>{dau(g.lon?.rong, 0)} tỷ</b></span>
        <span>Khối ngoại ròng <b style={{ color: mau(g.nn?.rong) }}>{dau(g.nn?.rong, 0)} tỷ</b></span>
      </div>
    </div>
  );
}

function DanhSachTop({ tieuDe, ds, truong, mauCot }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs mb-1.5" style={{ color: MUTED, ...sans, fontWeight: 700 }}>{tieuDe}</p>
      {(ds ?? []).slice(0, 8).map((x) => (
        <Link key={x.ma} href={`/ma/${x.ma}`} className="flex items-baseline justify-between py-1 border-b last:border-b-0 text-sm" style={{ borderColor: "var(--vien-nhe)", color: TEXT }}>
          <span style={{ ...sans, fontWeight: 700 }}>{x.ma}</span>
          <span style={{ color: mauCot }}>{dau(x[truong], 1)} tỷ</span>
        </Link>
      ))}
    </div>
  );
}

const CHI_SO_HIEN = [["VNINDEX", "VN-Index"], ["VN30", "VN30"], ["VN100", "VN100"], ["HNX", "HNX"], ["UPCOM", "UPCoM"]];

export default function DongTienThiTruong() {
  const [d, setD] = useState({ trangThai: "tai", du: null, loi: null });
  useEffect(() => {
    let dung = false;
    const tai = async () => {
      try {
        const r = await fetch("/api/dong-tien", { cache: "no-store" });
        if (dung) return;
        if (r.status === 401) return setD({ trangThai: "khoa", du: null, loi: null });
        const j = await r.json();
        setD({ trangThai: j.du ? "co" : "rong", du: j.du ?? null, loi: j.loi ?? null });
      } catch {
        if (!dung) setD((c) => ({ ...c, loi: "Không tải được dữ liệu dòng tiền" }));
      }
    };
    tai();
    const t = setInterval(() => document.visibilityState === "visible" && tai(), CHU_KY_MS);
    return () => {
      dung = true;
      clearInterval(t);
    };
  }, []);

  const du = d.du;
  return (
    <section className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD, color: TEXT }} aria-label="Dòng tiền thời gian thực">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>Dòng tiền thời gian thực</h2>
        {du && (
          <span className="text-xs" style={{ color: MUTED }}>
            Phiên {ngayVN(du.ngay)} · cập nhật {gio(du.luc ?? du.capNhat)}
          </span>
        )}
      </div>
      <p className="text-xs mb-4" style={{ color: MUTED }}>
        <b>Mua chủ động</b> = tổng giá trị lệnh khớp do bên MUA đặt giá chào bán (kéo giá lên); <b>bán chủ động</b> ngược lại. Chỉ tính khớp liên tục (không gồm ATO/ATC). &ldquo;Lệnh lớn&rdquo; ≥ {du?.nguong?.lonTrieu ?? 500} triệu/lệnh — ước lượng theo cỡ lệnh, không phải dữ liệu tổ chức thật. Nguồn: DNSE.
      </p>

      {d.trangThai === "tai" && <p className="text-sm" style={{ color: MUTED }}>Đang tải…</p>}
      {d.trangThai === "khoa" && <p className="text-sm" style={{ color: MUTED }}>Đăng nhập tài khoản đã được duyệt để xem dòng tiền thời gian thực.</p>}
      {d.trangThai === "rong" && <p className="text-sm" style={{ color: MUTED }}>Chưa có dữ liệu. Dịch vụ dòng tiền chạy trong giờ giao dịch (9h–15h, thứ 2–6) cùng engine thời gian thực.</p>}
      {d.loi && d.trangThai !== "khoa" && <p className="text-sm" style={{ color: DO }}>{d.loi}</p>}

      {du && (
        <>
          <div className="grid gap-3 md:grid-cols-2 mb-5">
            <TheNhom ten="Toàn thị trường" g={du.tong} phu={`${du.tong?.soMa ?? 0} mã`} />
            <TheNhom ten="Nhóm VN30" g={du.vn30} phu={`${du.vn30?.soMa ?? 0} mã`} />
          </div>

          <h3 className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>Độ rộng thị trường</h3>
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ color: MUTED }}>
                  <th className="py-1.5 pr-3 font-normal">Chỉ số</th>
                  <th className="py-1.5 px-2 font-normal text-right">Điểm</th>
                  <th className="py-1.5 px-2 font-normal text-right">Thay đổi</th>
                  <th className="py-1.5 px-2 font-normal text-right" style={{ color: XANH }}>Tăng</th>
                  <th className="py-1.5 px-2 font-normal text-right" style={{ color: DO }}>Giảm</th>
                  <th className="py-1.5 px-2 font-normal text-right">Đứng</th>
                  <th className="py-1.5 px-2 font-normal text-right">Trần / Sàn</th>
                  <th className="py-1.5 px-2 font-normal text-right">KL tăng / giảm</th>
                  <th className="py-1.5 pl-2 font-normal text-right">GTGD (tỷ)</th>
                </tr>
              </thead>
              <tbody>
                {CHI_SO_HIEN.map(([k, ten]) => {
                  const c = du.chiSo?.[k];
                  if (!c) return null;
                  const tl = c.klTang != null && c.klGiam != null && c.klTang + c.klGiam > 0 ? (c.klTang / (c.klTang + c.klGiam)) * 100 : null;
                  return (
                    <tr key={k} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                      <td className="py-1.5 pr-3" style={{ ...sans, fontWeight: 700 }}>{ten}</td>
                      <td className="py-1.5 px-2 text-right">{soVN(c.gt, 2)}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: mau(c.doi) }}>{c.doi != null ? `${c.doi > 0 ? "+" : ""}${soVN(c.doi, 2)} (${c.doiPct > 0 ? "+" : ""}${soVN(c.doiPct, 2)}%)` : "—"}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: XANH }}>{c.tang ?? "—"}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: DO }}>{c.giam ?? "—"}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: MUTED }}>{c.dung ?? "—"}</td>
                      <td className="py-1.5 px-2 text-right"><span style={{ color: XANH }}>{c.tran ?? 0}</span> / <span style={{ color: DO }}>{c.san ?? 0}</span></td>
                      <td className="py-1.5 px-2 text-right" style={{ color: tl == null ? MUTED : tl >= 50 ? XANH : DO }}>{tl != null ? `${tl.toFixed(0)}% / ${(100 - tl).toFixed(0)}%` : "—"}</td>
                      <td className="py-1.5 pl-2 text-right">{c.gtGd != null ? soVN(c.gtGd, 0) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>Mã nổi bật trong phiên</h3>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
            <DanhSachTop tieuDe="Mua chủ động ròng nhiều nhất" ds={du.topMua} truong="rong" mauCot={XANH} />
            <DanhSachTop tieuDe="Bán chủ động ròng nhiều nhất" ds={du.topBan} truong="rong" mauCot={DO} />
            <DanhSachTop tieuDe="Lệnh lớn mua ròng" ds={du.topLonMua} truong="lonRong" mauCot={XANH} />
            <DanhSachTop tieuDe="Lệnh lớn bán ròng" ds={du.topLonBan} truong="lonRong" mauCot={DO} />
          </div>

          {du.nganh?.length > 0 && (
            <>
              <h3 className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>Dòng tiền theo ngành</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs" style={{ color: MUTED }}>
                      <th className="py-1.5 pr-3 font-normal">Ngành</th>
                      <th className="py-1.5 px-2 font-normal text-right">Mã</th>
                      <th className="py-1.5 px-2 font-normal" style={{ minWidth: 120 }}>Mua / bán chủ động</th>
                      <th className="py-1.5 px-2 font-normal text-right">Ròng (tỷ)</th>
                      <th className="py-1.5 px-2 font-normal text-right">Lệnh lớn ròng</th>
                      <th className="py-1.5 pl-2 font-normal text-right">Khối ngoại ròng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {du.nganh.map((g) => (
                      <tr key={g.ten} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                        <td className="py-1.5 pr-3">{g.ten}</td>
                        <td className="py-1.5 px-2 text-right" style={{ color: MUTED }}>{g.soMa}</td>
                        <td className="py-1.5 px-2"><ThanhMuaBan mua={g.mua} ban={g.ban} cao={7} /></td>
                        <td className="py-1.5 px-2 text-right" style={{ color: mau(g.rong), fontWeight: 700 }}>{dau(g.rong)}</td>
                        <td className="py-1.5 px-2 text-right" style={{ color: mau(g.lonRong) }}>{dau(g.lonRong)}</td>
                        <td className="py-1.5 pl-2 text-right" style={{ color: mau(g.nnRong) }}>{dau(g.nnRong)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
