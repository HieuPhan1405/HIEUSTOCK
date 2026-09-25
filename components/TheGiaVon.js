"use client";

import { useState } from "react";
import { fmt, pct } from "@/components/dungChung";
import { ketQuaDiemMua, LOAI_DIEM_MUA } from "@/lib/muaThemTinhToan";

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

// GIA VON CUA BAN cho cac diem MUA THEM / MUA MOI cua 1 ma - nam TRONG TRANG TUNG MA (truoc day la bang rieng o So lenh dang mo). Moi diem: chon
// "Da mua dot dau" (dang giu lenh goc cua ma nay) -> MUA THEM, gia von = trung binh voi phan lenh goc con lai; "Chua mua" -> MUA MOI, gia von = gia mua moi.
// Lua chon luu RIENG theo tai khoan (API /api/mua-them); chua dang nhap thi chi tinh tren trang, khong luu (coTheLuu = false).
// diem: ket qua cacDiemMuaMoi(row) (mang thuan, truyen tu server); daChonBanDau: { "MA|vong|yyyy-mm-dd": true/false }.
export default function TheGiaVon({ diem, daChonBanDau = {}, coTheLuu = false }) {
  const [chon, setChon] = useState(daChonBanDau);
  const [loi, setLoi] = useState(null);

  if (!diem?.length) return null;

  async function datLuaChon(d, daMua) {
    const cu = chon[d.khoa] === true;
    if (cu === daMua) return;
    setLoi(null);
    setChon((c) => ({ ...c, [d.khoa]: daMua })); // hien ngay, loi thi hoan lai
    if (!coTheLuu) return;
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
      setLoi(`Không lưu được lựa chọn: ${e.message}`);
    }
  }

  return (
    <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: TIM }}>
        ★ Giá vốn của bạn · lệnh mua thêm / mua mới
      </p>
      <p className="text-xs mb-4" style={{ color: MUTED }}>
        Chọn <b style={{ color: TEXT }}>Đã mua đợt đầu</b> nếu bạn đang giữ lệnh gốc của mã này: đây là <b style={{ color: TIM }}>MUA THÊM</b>, giá vốn được tính trung bình với phần lệnh gốc còn lại. Chọn{" "}
        <b style={{ color: TEXT }}>Chưa mua</b> nếu bạn chưa vào lệnh nào: đây là <b style={{ color: NGOC }}>MUA MỚI</b>, giá vốn chính là giá mua mới.{" "}
        {coTheLuu ? "Lựa chọn lưu riêng cho tài khoản của bạn." : "Đăng nhập để lưu lựa chọn này (hiện chỉ tính trên trang, tải lại sẽ mất)."}
      </p>
      {loi && (
        <p className="text-xs mb-2" style={{ color: DO }}>
          {loi}
        </p>
      )}
      <div className="space-y-3">
        {diem.map((d) => {
          const daMua = chon[d.khoa] === true;
          const kq = ketQuaDiemMua(d, daMua);
          return (
            <div key={d.khoa} className="rounded-xl border p-3" style={{ borderColor: VIEN, background: "#101018" }}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded"
                    style={{ color: kq.muaThem ? TIM : NGOC, border: `1px solid ${kq.muaThem ? TIM : NGOC}`, fontFamily: "'Inter', sans-serif" }}
                  >
                    {kq.muaThem ? "MUA THÊM" : "MUA MỚI"}
                  </span>
                  <span className="text-xs" style={{ color: MAU_LOAI[d.vong], fontFamily: "'Inter', sans-serif" }}>
                    {LOAI_DIEM_MUA[d.vong].ngan} · {ngayVN(d.ngay)}
                  </span>
                  {d.homNay && (
                    <span className="text-[10px] font-bold" style={{ color: XANH }}>
                      HÔM NAY
                    </span>
                  )}
                </div>
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
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Giá mua thêm
                  </p>
                  <p className="text-sm font-bold">{fmt(d.giaMua)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Giá hiện tại
                  </p>
                  <p className="text-sm font-bold">{d.gia ? fmt(d.gia) : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Giá vốn của bạn
                  </p>
                  <p className="text-sm font-bold" style={{ color: kq.muaThem ? TIM : NGOC }}>
                    {fmt(kq.giaVon)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Lãi/lỗ theo giá vốn
                  </p>
                  <p className="text-sm font-bold" style={{ color: mauLai(kq.laiLoPct) }}>
                    {kq.laiLoPct == null ? "—" : pct(kq.laiLoPct, 2)}
                  </p>
                </div>
              </div>

              <p className="text-[11px] leading-snug mt-3" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                {kq.muaThem
                  ? kq.tinhDuocTrungBinh
                    ? `Giá vốn trung bình của ${d.conLaiGocPct}% lệnh gốc còn lại (giá mua ${fmt(d.giaMuaGoc)}) và 1 lệnh mua thêm (giá ${fmt(d.giaMua)}).`
                    : "Thiếu giá lệnh gốc nên chưa tính được giá vốn trung bình, tạm lấy giá mua thêm."
                  : "Giá vốn = giá mua mới, tính Stop-loss và chốt lời như một lệnh mới."}{" "}
                {d.stop ? `Cắt lỗ riêng ${fmt(d.stop)}. ` : ""}
                {d.tp1 ? `Chốt lời riêng ${[d.tp1, d.tp2, d.tp3].map((v) => (v ? fmt(v) : "—")).join(" / ")}.` : ""}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
        Giá vốn trung bình giả định bạn mua thêm bằng đúng khối lượng một lệnh gốc đầy đủ; phần lệnh gốc còn lại theo tỷ lệ chốt lời đã chạm (TP1 30%, TP2 30%: sau TP1 còn 70%, sau TP2 còn 40%; lệnh cũ trước 26/09/2026 sau TP3 còn 15%). Số liệu tham khảo, không phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
