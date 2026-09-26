"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, Target, ShieldCheck, TrendingUp, Rewind } from "lucide-react";
import { fmt, pct } from "@/components/dungChung";
import { dungNhatKyLenh } from "@/lib/nhatKyLenh";
import { ngayChuoi } from "@/lib/muaThemTinhToan";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const NGOC = "#22D3EE";
const TIM = "#A78BFA";

const ngayVN = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "—");
// Von 100 don vi -> hien 1 chu so thap phan khi can (vd 33, 105.3).
const so = (n) => {
  const v = Math.round(Number(n) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};
const mauLaiLo = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);

// Icon + mau cua tung loai su kien (lib/nhatKyLenh.js chi tra ve "kieu"); mau null = theo lai/lo cua chinh dong do.
const KIEU = {
  mua: { icon: ArrowUpCircle, mau: XANH },
  mua_moi: { icon: TrendingUp, mau: NGOC },
  cham_tp: { icon: Target, mau: VANG },
  chot_tp: { icon: Target, mau: null },
  cat_lo: { icon: ArrowDownCircle, mau: null },
  bao_ve: { icon: ShieldCheck, mau: null },
  dong: { icon: ArrowDownCircle, mau: null },
  dang_giu: { icon: Rewind, mau: TIM },
};

function hienSuKien(s) {
  const k = KIEU[s.kieu] ?? KIEU.dong;
  let phu;
  if (s.kieu === "mua" || s.kieu === "mua_moi") phu = `Giá ${fmt(s.gia)}`;
  else if (s.kieu === "cham_tp") phu = `Giá vượt ${fmt(s.moc)} · sau ${s.soPhien} phiên`;
  else if (s.kieu === "dang_giu") phu = `Tính đến lần cập nhật dữ liệu gần nhất${s.soPhien != null ? ` · giữ ${s.soPhien} phiên` : ""}`;
  else phu = `Giá ${fmt(s.gia)}${s.soPhien != null ? ` · giữ ${s.soPhien} phiên` : ""}`;
  const mauLai = mauLaiLo(s.laiLoPct);
  return {
    icon: k.icon,
    mau: k.mau ?? mauLai,
    ngay: s.ngay,
    chinh: s.chinh,
    phu,
    giaTri: s.giaTriPhan != null ? { hien: `${so(s.phanVon)} → ${so(s.giaTriPhan)}`, mau: mauLai, nhan: `trên ${so(s.phanVon)} vốn` } : null,
  };
}

function Dong({ icon: Icon, mau, ngay, chinh, phu, giaTri, nhanLenh }) {
  return (
    <div className="flex gap-3 py-3 border-b last:border-b-0" style={{ borderColor: "#1D1D26" }}>
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: mau + "20" }}>
        <Icon size={15} color={mau} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-sm" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
            {chinh}
          </p>
          <span className="text-xs shrink-0" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
            {ngay ? ngayVN(ngay) : "—"}
          </span>
        </div>
        {phu && (
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {phu}
          </p>
        )}
        {nhanLenh && (
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#1D1D26", color: "#A6A6B3", fontFamily: "'JetBrains Mono', monospace" }}>
            {nhanLenh}
          </span>
        )}
      </div>
      {giaTri && (
        <div className="shrink-0 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <p className="text-sm font-bold" style={{ color: giaTri.mau }}>
            {giaTri.hien}
          </p>
          <p className="text-[10px]" style={{ color: MUTED }}>
            {giaTri.nhan}
          </p>
        </div>
      )}
    </div>
  );
}

// THANH CHON LENH THEO NGAY MUA: "Tat ca" + moi lenh (dang giu / da dong) la 1 nut ghi ngay mua, gia mua va ket qua - chon lenh nao thi nhat ky chi hien dong thoi gian cua lenh do.
function ThanhChonNhatKy({ lenh, khoaChon, datKhoa }) {
  const soDangGiu = lenh.filter((l) => l.dangGiu).length;
  const nut = (khoa, noiDung) => {
    const dangChon = khoaChon === khoa;
    return (
      <button
        key={khoa || "tat-ca"}
        type="button"
        role="tab"
        aria-selected={dangChon}
        onClick={() => datKhoa(khoa)}
        className="shrink-0 text-left rounded-xl border px-3 py-2"
        style={dangChon ? { borderColor: "#6C5CE7", background: "rgba(108,92,231,0.15)" } : { borderColor: VIEN, background: "transparent" }}
      >
        {noiDung}
      </button>
    );
  };
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-3" role="tablist" aria-label="Chọn lệnh theo ngày mua">
      {nut(
        "",
        <>
          <span className="block text-sm font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
            Tất cả
          </span>
          <span className="block text-[11px]" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
            {lenh.length} lệnh
          </span>
          <span className="block text-xs" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
            {soDangGiu} đang giữ · {lenh.length - soDangGiu} đã đóng
          </span>
        </>
      )}
      {lenh.map((l) =>
        nut(
          l.khoa,
          <>
            <span className="block text-sm font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
              Mua {ngayVN(l.ngayMua)}
              {l.laMuaMoi && <span style={{ color: NGOC }}> · Mua mới</span>}
              {l.tenLenh && (
                <span className="font-normal" style={{ color: MUTED }}>
                  {" "}
                  · {l.tenLenh}
                </span>
              )}
            </span>
            <span className="block text-[11px]" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
              giá {fmt(l.giaMua)}
              {l.soPhien != null ? ` · ${l.soPhien} phiên` : ""}
            </span>
            <span className="block text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: mauLaiLo(l.ketQuaPct) }}>
              {l.dangGiu ? "Đang giữ" : "Đã đóng"} · {pct(l.ketQuaPct, 2)}
            </span>
          </>
        )
      )}
    </div>
  );
}

// Tom tat 1 lenh dang xem: ngay mua/gia mua, dang giu hay da dong, so phien giu va ket qua ca lenh tren 100 von.
function TomTatLenh({ l }) {
  const kq = l.ketQuaPct;
  return (
    <div className="rounded-xl border p-3 mb-1 flex flex-wrap items-center justify-between gap-2" style={{ borderColor: VIEN, background: "#0B0B10" }}>
      <div className="min-w-0">
        <p className="text-sm font-bold" style={{ color: TEXT, fontFamily: "'Inter', sans-serif" }}>
          Lệnh mua {ngayVN(l.ngayMua)} · giá {fmt(l.giaMua)}
          {l.laMuaMoi && <span style={{ color: NGOC }}> · Mua mới</span>}
          {l.tenLenh && (
            <span className="font-normal" style={{ color: MUTED }}>
              {" "}
              · {l.tenLenh}
            </span>
          )}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
          {l.dangGiu ? `Đang giữ ${so(l.conLaiPct)}% vị thế${l.daChotPct > 0 ? ` · đã chốt ${so(l.daChotPct)}%` : ""}` : "Đã đóng hoàn toàn"}
          {l.soPhien != null ? ` · giữ ${l.soPhien} phiên` : ""}
        </p>
      </div>
      <div className="text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <p className="text-sm font-bold" style={{ color: mauLaiLo(kq) }}>
          {kq == null ? "—" : `100 → ${so(100 + kq)}`}
        </p>
        <p className="text-[10px]" style={{ color: MUTED }}>
          {l.tamTinh ? "tạm tính · " : ""}
          {pct(kq, 2)} trên 100 vốn
        </p>
      </div>
    </div>
  );
}

// Nhat ky mua-ban cua 1 ma THEO TUNG LENH (moi lenh = 1 ngay mua): goc tu cac lenh da dong (lichSuDaDong) + cac lenh DANG MO cua ma (cacLenh - lenhDangMo). Chon ngay mua o thanh
// ngang de xem rieng 1 lenh; "Tat ca" gop moi lenh theo thoi gian (moi dong co nhan lenh). Moi lenh gia dinh 100 don vi von - xem lib/nhatKyLenh.js.
export default function NhatKyGiaoDich({ ma, lichSuDaDong = [], cacLenh = [] }) {
  const [nen, setNen] = useState(null);
  const [khoaChon, setKhoaChon] = useState("");

  const canTimNgayCham = cacLenh.some((l) => ngayChuoi(l.ngay_mua) && (l.tp1 > 0 || l.tp2 > 0 || l.tp3 > 0));
  const dangTai = canTimNgayCham && nen === null; // suy ra tu trang thai da tai chua, khong can them 1 state rieng

  useEffect(() => {
    if (!canTimNgayCham) return;
    let huy = false;
    fetch(`/api/gia-lich-su?ma=${encodeURIComponent(ma)}&kt=D`)
      .then((r) => r.json())
      .then((j) => {
        if (!huy) setNen(j.trangThai === "ok" ? j.nen : []); // [] rieng voi null: bao hieu da tai xong (du loi) de tat "dang tai"
      })
      .catch(() => {
        if (!huy) setNen([]);
      });
    return () => {
      huy = true;
    };
  }, [ma, canTimNgayCham]);

  const { lenh, tatCa } = useMemo(() => dungNhatKyLenh({ lichSuDaDong, cacLenhMo: cacLenh, nen }), [lichSuDaDong, cacLenh, nen]);
  if (lenh.length === 0) return null;

  const nhieuLenh = lenh.length > 1;
  const dangXem = nhieuLenh ? (lenh.find((l) => l.khoa === khoaChon) ?? null) : lenh[0];
  const dsSuKien = dangXem ? dangXem.suKien : tatCa;
  const nhanLenh = Object.fromEntries(lenh.map((l) => [l.khoa, `lệnh mua ${ngayVN(l.ngayMua)}${l.laMuaMoi ? " · Mua mới" : ""}`]));

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#6C5CE7", fontFamily: "'JetBrains Mono', monospace" }}>
        ★ Nhật ký giao dịch {ma}
      </p>
      <p className="text-[11px] mb-3" style={{ color: MUTED }}>
        {nhieuLenh ? "Mỗi lệnh có dòng thời gian riêng: chọn ngày mua để xem từng lệnh. " : ""}
        Mỗi lệnh giả định vào 100 đơn vị vốn để quy lãi/lỗ ra số cụ thể.
        {dangTai && " Đang tính ngày chạm các mốc chốt lời…"}
      </p>
      {nhieuLenh && <ThanhChonNhatKy lenh={lenh} khoaChon={dangXem ? dangXem.khoa : ""} datKhoa={setKhoaChon} />}
      {dangXem && <TomTatLenh l={dangXem} />}
      <div>
        {dsSuKien.map((s, i) => (
          <Dong key={i} {...hienSuKien(s)} nhanLenh={!dangXem && nhieuLenh ? nhanLenh[s.khoaLenh] : null} />
        ))}
      </div>
      <p className="text-[10px] mt-2" style={{ color: "#6B6B78" }}>
        Lệnh chốt từng phần ghi phần vốn của mỗi lần chốt (vd 30 → 33: 30 vốn đã chốt thành 33), cộng các phần lại ra kết quả cả lệnh; lệnh đang giữ tính phần còn lại theo giá hiện tại
        (tạm tính). Lệnh đóng trước khi có tính năng này chỉ ghi mốc Mua và mốc Đóng. Số liệu tham khảo, không phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
