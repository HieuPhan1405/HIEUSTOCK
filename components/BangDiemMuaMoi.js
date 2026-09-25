"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fmt, pct } from "@/components/dungChung";
import { cacDiemMuaMoi, ketQuaDiemMua, LOAI_DIEM_MUA } from "@/lib/muaThemTinhToan";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const NGOC = "#22D3EE";
const TIM = "#A78BFA";
const PRIMARY = "#6C5CE7";

const ngayVN = (s) => s.split("-").reverse().join("/");
const mauLai = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);
const MAU_LOAI = { moi: NGOC, giua: TIM };

// Bang "Diem mua moi" o So lenh dang mo: cac ma vua co diem MUA THEM (sau TP3 / giua chung). Moi nguoi tu chon da mua dot dau chua
// (luu RIENG theo tai khoan): da mua -> "MUA THEM" tinh gia von trung binh voi phan lenh goc con lai; chua -> "MUA MOI"
// (gia von = gia mua moi, Stop-loss/TP nhu thuong). Khong co diem nao thi khong hien gi.
export default function BangDiemMuaMoi({ dangMo, daChonBanDau = {} }) {
  const [chon, setChon] = useState(daChonBanDau);
  const [loi, setLoi] = useState(null);

  const diem = useMemo(
    () =>
      dangMo
        .flatMap(cacDiemMuaMoi)
        .sort((a, b) => (a.homNay === b.homNay ? (a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : a.ma.localeCompare(b.ma)) : a.homNay ? -1 : 1)),
    [dangMo]
  );

  if (diem.length === 0) return null;

  async function datLuaChon(d, daMua) {
    const cu = chon[d.khoa] === true;
    if (cu === daMua) return;
    setLoi(null);
    setChon((c) => ({ ...c, [d.khoa]: daMua })); // hien ngay, loi thi hoan lai
    try {
      const res = await fetch("/api/mua-them", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ma: d.ma, vong: d.vong, ngayMua: d.ngay, daMuaDotDau: daMua }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.loi || `Lỗi ${res.status}`);
      }
    } catch (e) {
      setChon((c) => ({ ...c, [d.khoa]: cu }));
      setLoi(`Không lưu được lựa chọn cho ${d.ma}: ${e.message}`);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: MUTED }}>
        Điểm mua mới · {diem.length} điểm
      </p>
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        Chọn <b style={{ color: TEXT }}>Đã mua đợt đầu</b> nếu bạn đang giữ lệnh gốc của mã này: đây là <b style={{ color: TIM }}>MUA THÊM</b> — giá vốn được tính trung bình với phần lệnh gốc còn lại. Chọn{" "}
        <b style={{ color: TEXT }}>Chưa mua</b> nếu bạn chưa vào lệnh nào: đây là <b style={{ color: NGOC }}>MUA MỚI</b>, tính Stop-loss / chốt lời như một lệnh mới. Lựa chọn lưu riêng cho tài khoản của bạn.
      </p>
      {loi && (
        <p className="text-xs mb-2" style={{ color: DO }}>
          {loi}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <thead>
            <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
              <th className="py-2 pr-3 font-normal">Mã · điểm mua</th>
              <th className="py-2 px-3 font-normal text-right">Giá mua mới</th>
              <th className="py-2 px-3 font-normal text-right">Giá hiện tại</th>
              <th className="py-2 px-3 font-normal">Bạn đã mua đợt đầu?</th>
              <th className="py-2 px-3 font-normal text-right">Giá vốn</th>
              <th className="py-2 px-3 font-normal text-right">Lãi/Lỗ</th>
              <th className="py-2 px-3 font-normal text-right">Cắt lỗ</th>
              <th className="py-2 pl-3 font-normal text-right">Chốt lời (TP1 · TP2 · TP3)</th>
            </tr>
          </thead>
          <tbody>
            {diem.map((d, i) => {
              const daMua = chon[d.khoa] === true;
              const kq = ketQuaDiemMua(d, daMua);
              return (
                <tr key={d.khoa} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/ma/${d.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        {d.ma}
                      </Link>
                      <span
                        className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded"
                        style={{ color: kq.muaThem ? TIM : NGOC, border: `1px solid ${kq.muaThem ? TIM : NGOC}` }}
                      >
                        {kq.muaThem ? "MUA THÊM" : "MUA MỚI"}
                      </span>
                      {d.homNay && (
                        <span className="text-[10px] font-bold" style={{ color: XANH }}>
                          HÔM NAY
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: MAU_LOAI[d.vong], fontFamily: "'Inter', sans-serif" }}>
                      {LOAI_DIEM_MUA[d.vong].nhan} · {ngayVN(d.ngay)}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-right">{fmt(d.giaMua)}</td>
                  <td className="py-3 px-3 text-right">{d.gia ? fmt(d.gia) : "—"}</td>
                  <td className="py-3 px-3">
                    <div className="inline-flex rounded-lg overflow-hidden border" style={{ borderColor: VIEN, fontFamily: "'Inter', sans-serif" }} role="group" aria-label={`Bạn đã mua đợt đầu của ${d.ma} chưa`}>
                      {[
                        [false, "Chưa mua"],
                        [true, "Đã mua đợt đầu"],
                      ].map(([giaTri, nhan]) => (
                        <button
                          key={nhan}
                          type="button"
                          onClick={() => datLuaChon(d, giaTri)}
                          aria-pressed={daMua === giaTri}
                          className="px-2.5 py-1.5 text-xs whitespace-nowrap"
                          style={daMua === giaTri ? { background: PRIMARY, color: "#fff", fontWeight: 700 } : { background: "transparent", color: MUTED }}
                        >
                          {nhan}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span style={{ fontWeight: 700 }}>{fmt(kq.giaVon)}</span>
                    {kq.muaThem && (
                      <p className="text-[10px]" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                        {kq.tinhDuocTrungBinh
                          ? `TB với ${d.conLaiGocPct}% lệnh gốc (${fmt(d.giaMuaGoc)})`
                          : "thiếu giá lệnh gốc — chưa tính được trung bình"}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-bold" style={{ color: mauLai(kq.laiLoPct) }}>
                    {kq.laiLoPct == null ? "—" : pct(kq.laiLoPct, 2)}
                  </td>
                  <td className="py-3 px-3 text-right" style={{ color: DO }}>
                    {d.stop ? fmt(d.stop) : "—"}
                  </td>
                  <td className="py-3 pl-3 text-right" style={{ color: MUTED }}>
                    {[d.tp1, d.tp2, d.tp3].map((v) => (v ? fmt(v) : "—")).join(" · ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
        Giá vốn trung bình giả định bạn mua thêm bằng đúng khối lượng một lệnh gốc đầy đủ; phần lệnh gốc còn lại theo tỷ lệ chốt lời 30/30/40 đã chạm (sau TP1 còn 70%, sau TP2 còn 40%; lệnh cũ trước 25/09/2026 sau TP3 còn 15%). Số liệu tham khảo, không phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
