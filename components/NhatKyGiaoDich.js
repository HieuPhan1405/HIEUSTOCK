"use client";

import { useEffect, useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, Target, ShieldCheck, TrendingUp, Rewind } from "lucide-react";
import { ngayChamTP } from "@/lib/ngayChamMoc";
import { fmt } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const NGOC = "#22D3EE";
const TIM = "#A78BFA";

const VON_GOC = 100; // gia dinh moi luot vao lenh bo 100 don vi von, de quy lai/lo ra so cu the thay vi chi %.
const ngayVN = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "—");
const chuoiNgay = (v) => (v ? new Date(v).toISOString().slice(0, 10) : null);
const soVon = (laiLoPct) => (laiLoPct == null ? null : (VON_GOC * (1 + laiLoPct / 100)).toFixed(1));

const NHAN_LY_DO = {
  TP3: (x) => `Chốt đủ TP3 (${x.phan_chot_pct ?? 85}% vị thế)`,
  CAT_LO: () => "Cắt lỗ (chạm Stop-loss)",
  BAO_VE_LAI: () => "Bảo vệ lãi (SL đã dời lên cao hơn)",
  BAN: () => "Bán theo tín hiệu",
  THOAT: () => "Thoát vị thế",
};

function Dong({ icon: Icon, mau, ngay, chinh, phu, giaTri }) {
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
            {ngay}
          </span>
        </div>
        {phu && (
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {phu}
          </p>
        )}
      </div>
      {giaTri && (
        <div className="shrink-0 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <p className="text-sm font-bold" style={{ color: giaTri.mau }}>
            {giaTri.hien}
          </p>
          <p className="text-[10px]" style={{ color: MUTED }}>
            trên 100 vốn
          </p>
        </div>
      )}
    </div>
  );
}

// Nhat ky mua-ban rieng cua 1 ma: goc tu cac lenh da dong (lichSuDaDong) + vi the dang giu hien tai (neu co).
// Moi diem lai/lo quy doi ra so cu the tren gia dinh 100 don vi von cho de hinh dung thay vi chi xem %.
export default function NhatKyGiaoDich({
  ma,
  lichSuDaDong = [],
  dangGiu,
  ngayMua,
  giaMua,
  laiLoPct,
  tp1,
  tp2,
  tp3,
  daChamTp,
  dangGiuMoi,
  ngayMuaMoi,
  giaMuaMoi,
  dangGiuGiua,
  ngayMuaGiua,
  giaMuaGiua,
}) {
  const [nen, setNen] = useState(null);

  const ngayMuaStr = chuoiNgay(ngayMua);
  const ngayMuaMoiStr = chuoiNgay(ngayMuaMoi);
  const ngayMuaGiuaStr = chuoiNgay(ngayMuaGiua);
  const canTimNgayCham = dangGiu && ngayMuaStr && (tp1 > 0 || tp2 > 0 || tp3 > 0);
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

  // ---------- Xay danh sach su kien ----------
  // uuTien: thu tu hien thi khi 2 su kien trung ngay (vd Cham TP3 va Chot du TP3 thuong cung 1 ngay phat hien).
  const UU_TIEN = { MUA: 0, CHAM_TP: 1, DONG: 2, DANG_GIU: 3 };
  const suKien = [];

  // 1. Cac dot DA DONG trong qua khu (moi dong lenh_da_dong = 1 su kien MUA + 1 su kien DONG; khu trung MUA khi
  // nhieu dong (vd vong 1 chot TP3 + vong 3 phan con lai) cung 1 ngay_mua).
  const daThemMua = new Set();
  for (const d of lichSuDaDong) {
    const khoaMua = `${d.ngay_mua}|${d.vong === 2 ? "moi" : d.vong === 4 ? "giua" : "goc"}`;
    if (!daThemMua.has(khoaMua)) {
      daThemMua.add(khoaMua);
      suKien.push({
        ngay: d.ngay_mua,
        uuTien: UU_TIEN.MUA,
        icon: ArrowUpCircle,
        mau: XANH,
        chinh: d.vong === 2 ? "Mua thêm (sau TP3)" : d.vong === 4 ? "Mua thêm (giữa chừng)" : "Mua",
        phu: `Giá ${fmt(d.gia_mua)}`,
      });
    }
    const nhan = NHAN_LY_DO[d.ly_do] || (() => "Đóng vị thế");
    suKien.push({
      ngay: d.ngay_ban,
      uuTien: UU_TIEN.DONG,
      icon: d.ly_do === "CAT_LO" ? ArrowDownCircle : d.ly_do === "TP3" ? Target : d.ly_do === "BAO_VE_LAI" ? ShieldCheck : ArrowDownCircle,
      mau: d.lai_lo_pct >= 0 ? XANH : DO,
      chinh: nhan(d) + (d.vong === 3 ? " · phần còn lại sau TP3" : ""),
      phu: `Giá ${fmt(d.gia_ban)}${d.so_phien != null ? ` · giữ ${d.so_phien} phiên` : ""}`,
      giaTri: { hien: `${VON_GOC} → ${soVon(d.lai_lo_pct)}`, mau: d.lai_lo_pct >= 0 ? XANH : DO },
    });
  }

  // 2. Vi the DANG GIU hien tai (chua co trong lichSuDaDong vi chua dong). Neu dot mua nay da co san trong lich su
  // (vd. da tung chot TP3 nen co dong "vong 1" ghi lai ngay mua nay roi) thi KHONG them "Mua" trung nua.
  if (dangGiu && ngayMuaStr) {
    if (!daThemMua.has(`${ngayMuaStr}|goc`)) {
      suKien.push({ ngay: ngayMuaStr, uuTien: UU_TIEN.MUA, icon: ArrowUpCircle, mau: XANH, chinh: "Mua", phu: `Giá ${fmt(giaMua)}` });
    }

    if (nen) {
      const moc = [
        ["TP1", tp1, "Chạm TP1"],
        ["TP2", tp2, "Chạm TP2"],
        ["TP3", tp3, "Chạm TP3"],
      ];
      const thuTu = { TP1: 1, TP2: 2, TP3: 3 };
      for (const [ky, gia_, nhan] of moc) {
        if (!(gia_ > 0) || thuTu[ky] > (thuTu[daChamTp] ?? 0)) continue;
        const cham = ngayChamTP(nen, ngayMuaStr, gia_);
        if (cham)
          suKien.push({
            ngay: cham.ngay,
            uuTien: UU_TIEN.CHAM_TP,
            icon: Target,
            mau: VANG,
            chinh: nhan,
            phu: `Giá vượt ${fmt(gia_)} · sau ${cham.soPhien} phiên`,
          });
      }
    }

    if (dangGiuMoi && ngayMuaMoiStr && !daThemMua.has(`${ngayMuaMoiStr}|moi`)) {
      suKien.push({ ngay: ngayMuaMoiStr, uuTien: UU_TIEN.MUA, icon: TrendingUp, mau: NGOC, chinh: "Mua thêm (sau TP3)", phu: `Giá ${fmt(giaMuaMoi)}` });
    }

    if (dangGiuGiua && ngayMuaGiuaStr && !daThemMua.has(`${ngayMuaGiuaStr}|giua`)) {
      suKien.push({ ngay: ngayMuaGiuaStr, uuTien: UU_TIEN.MUA, icon: TrendingUp, mau: TIM, chinh: "Mua thêm (giữa chừng)", phu: `Giá ${fmt(giaMuaGiua)}` });
    }

    suKien.push({
      ngay: null,
      uuTien: UU_TIEN.DANG_GIU,
      icon: Rewind,
      mau: TIM,
      chinh: "Đang giữ",
      phu: "Tính đến lần cập nhật dữ liệu gần nhất",
      giaTri: laiLoPct != null ? { hien: `${VON_GOC} → ${soVon(laiLoPct)}`, mau: laiLoPct >= 0 ? XANH : DO } : null,
    });
  }

  if (suKien.length === 0) return null;
  suKien.sort((a, b) => {
    if (a.ngay == null) return 1;
    if (b.ngay == null) return -1;
    if (a.ngay !== b.ngay) return a.ngay < b.ngay ? -1 : 1;
    return a.uuTien - b.uuTien;
  });

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#6C5CE7", fontFamily: "'JetBrains Mono', monospace" }}>
        ★ Nhật ký giao dịch {ma}
      </p>
      <p className="text-[11px] mb-2" style={{ color: MUTED }}>
        Mỗi lượt vào lệnh giả định 100 đơn vị vốn để quy lãi/lỗ ra số cụ thể, dễ so sánh giữa các đợt.
        {dangTai && " Đang tính ngày chạm các mốc chốt lời…"}
      </p>
      <div>
        {suKien.map((s, i) => (
          <Dong key={i} icon={s.icon} mau={s.mau} ngay={ngayVN(s.ngay)} chinh={s.chinh} phu={s.phu} giaTri={s.giaTri} />
        ))}
      </div>
      <p className="text-[10px] mt-2" style={{ color: "#6B6B78" }}>
        Đợt đã đóng chỉ ghi mốc Mua và mốc Đóng (chưa lưu ngày chạm TP giữa chừng cho các lệnh đóng trước khi có tính năng này). Số liệu tham khảo, không
        phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
