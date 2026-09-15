import { TriangleAlert } from "lucide-react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import TraCuuMa from "@/components/TraCuuMa";
import BangLenhMo from "@/components/BangLenhMo";
import { pct, chamTPCaoNhat, pctChotLoi } from "@/components/dungChung";

export const dynamic = "force-dynamic";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const DO = "#EF4444";
const XANH = "#22C55E";

export default async function TrangLenhMo() {
  let tatCa = [];
  let loi = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = String(e?.message || e);
  }

  // "Dang mo" = ma vua phat tin hieu MUA hoac dang giu vi the (NAM GIU).
  // Uu tien hien CANH BAO MAT THAN len dau (rui ro dao chieu, can chu y truoc).
  const dangMo = tatCa
    .filter((r) => r.tin === "MUA" || r.tin === "NAM GIU")
    .sort((a, b) => (b.mat_than ? 1 : 0) - (a.mat_than ? 1 : 0));
  const soCanhBao = dangMo.filter((r) => r.mat_than).length;

  // Thong ke nhanh hieu qua danh muc dang mo - tinh tren dung so lenh dang
  // giu (khong tinh cac lenh da dong, vi trang nay chi hien vi the mo).
  const soLenh = dangMo.length;
  const soLai = dangMo.filter((r) => r.lai_lo_pct > 0).length;
  const soLo = dangMo.filter((r) => r.lai_lo_pct < 0).length;
  const tyLeLai = soLenh ? (soLai / soLenh) * 100 : 0;
  const tyLeLo = soLenh ? (soLo / soLenh) * 100 : 0;
  const laiLoTB = soLenh ? dangMo.reduce((tong, r) => tong + (r.lai_lo_pct ?? 0), 0) / soLenh : 0;

  // % chot loi trung binh - CHI tinh tren cac lenh DA cham it nhat 1 muc TP,
  // dua tren gia TP (dong bang luc mua) chu khong phai gia hien tai.
  const daChotLoi = dangMo.filter((r) => chamTPCaoNhat(r) != null);
  const soDaChotLoi = daChotLoi.length;
  const chotLoiTB = soDaChotLoi
    ? daChotLoi.reduce((tong, r) => tong + (pctChotLoi(r) ?? 0), 0) / soDaChotLoi
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Sổ lệnh đang mở
      </h1>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        {loi ? "—" : `${dangMo.length} mã đang MUA hoặc NẮM GIỮ / tổng ${tatCa.length} mã theo dõi.`}
      </p>
      {soCanhBao > 0 && (
        <p className="text-sm mb-6 flex items-center gap-1.5" style={{ color: DO }}>
          <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />
          {soCanhBao} mã đang cảnh báo Mắt Thần — nên xem lại ngay.
        </p>
      )}
      {soCanhBao === 0 && <div className="mb-6" />}

      {/* THONG KE HIEU QUA DANH MUC DANG MO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
            {soLenh}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Lệnh đang mở
          </p>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: XANH }}>
            {tyLeLai.toFixed(0)}%
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Tỷ lệ lãi ({soLai} lệnh)
          </p>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: DO }}>
            {tyLeLo.toFixed(0)}%
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Tỷ lệ lỗ ({soLo} lệnh)
          </p>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: laiLoTB >= 0 ? XANH : DO }}>
            {pct(laiLoTB, 2)}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Lãi/lỗ trung bình
          </p>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p
            className="text-2xl"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: soDaChotLoi === 0 ? MUTED : chotLoiTB >= 0 ? XANH : DO,
            }}
          >
            {soDaChotLoi > 0 ? pct(chotLoiTB, 2) : "—"}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Chốt lời TB ({soDaChotLoi} lệnh)
          </p>
        </div>
      </div>

      <div className="mb-8 max-w-md rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Tra cứu mã khác
        </p>
        <TraCuuMa />
      </div>

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <BangLenhMo duLieu={dangMo} />
      <p className="text-[11px] mt-3" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        Ngày mua/Giá mua lấy đúng thời điểm phát tín hiệu MUA thật trên AmiBroker (không ước tính). Ngày bán/Giá bán luôn trống vì đây là các lệnh còn đang mở. Chốt lời báo mức TP cao nhất mà giá hiện tại đã chạm tới — không tự động bán, chỉ là gợi ý tham khảo. ⚠ Bán bớt xuất hiện khi điểm hôm nay đã tụt dưới ngưỡng bán nhưng chưa đủ điều kiện Bán hẳn — gợi ý giảm bớt vị thế sớm hơn, không đợi đến khi có tín hiệu Bán toàn bộ.
      </p>
    </div>
  );
}
