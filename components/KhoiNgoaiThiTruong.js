import Link from "next/link";
import { tenCongTy } from "@/lib/tenMa";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const mono = { fontFamily: "'JetBrains Mono', monospace" };

const tyDong = (v) => `${v > 0 ? "+" : ""}${Math.round(v).toLocaleString("vi-VN")} tỷ`;

function DanhSachMa({ ds, mau }) {
  if (!ds?.length) return <span className="text-sm" style={{ color: MUTED }}>Không có mã nào</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ds.map((r) => {
        const t = tenCongTy(r.ma);
        return (
          <Link
            key={r.ma}
            href={`/ma/${r.ma}`}
            title={t?.ten}
            className="inline-flex items-baseline gap-1.5 px-2 py-1 rounded-md text-xs hover:brightness-125 transition"
            style={{ background: mau + "1F", color: mau, border: `1px solid ${mau}33` }}
          >
            <b style={{ ...mono, fontWeight: 700 }}>{r.ma}</b>
            <span style={{ ...mono, opacity: 0.85, fontSize: 10 }}>{tyDong(r.tyDong)}</span>
          </Link>
        );
      })}
    </div>
  );
}

// Khoi ngoai dang widget dashboard rieng (tach khoi Ra soat nhanh) - lam RO khai niem mua rong/ban
// rong (nhieu nguoi doc nham la "khoi luong mua/ban", khong phai CHENH LECH mua-ban) bang 1 thanh
// chia doi 0 + giai thich ro rang, thay vi chi liet ke danh sach ma nhu truoc.
export default function KhoiNgoaiThiTruong({ ngoai }) {
  if (!ngoai) {
    return (
      <div className="rounded-2xl border p-5 mb-6 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
        Chưa tải được dữ liệu khối ngoại (nguồn VNDirect).
      </div>
    );
  }

  const mauRong = ngoai.rongHose >= 0 ? XANH : DO;
  const nhanRong = ngoai.rongHose >= 0 ? "MUA RÒNG" : "BÁN RÒNG";
  // Ty le lap day thanh: theo % so voi muc lon nhat trong ngay (rong hoac top ma) de thanh luon
  // "co y nghia" trong ngay hom do, khong dua vao 1 nguong co dinh de tuy tien.
  const thangDo = Math.max(Math.abs(ngoai.rongHose), ...ngoai.topMua.map((r) => r.tyDong), ...ngoai.topBan.map((r) => Math.abs(r.tyDong)), 1);
  const tyLeRong = Math.min(100, (Math.abs(ngoai.rongHose) / thangDo) * 50);

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          Khối ngoại (nhà đầu tư nước ngoài)
        </p>
        <p className="text-[11px]" style={{ color: MUTED }}>
          Ngày {ngoai.ngay.split("-").reverse().join("/")} · toàn bộ mã niêm yết HOSE, nguồn VNDirect
        </p>
      </div>

      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2" style={{ background: mauRong + "22", color: mauRong, border: `1px solid ${mauRong}55` }}>
          {nhanRong}
        </span>
        <p className="text-3xl" style={{ ...mono, fontWeight: 700, color: mauRong }}>
          {tyDong(ngoai.rongHose)}
        </p>
        <p className="text-[11px] mt-1" style={{ color: MUTED }}>
          Khối ngoại ròng HOSE hôm nay
        </p>
      </div>

      {/* Thanh chia doi 0: trai = ban rong (do), phai = mua rong (xanh) */}
      <div className="relative h-2.5 rounded-full mb-1" style={{ background: "#262631" }}>
        <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: "#3A3A44" }} />
        {ngoai.rongHose >= 0 ? (
          <div className="absolute top-0 bottom-0 left-1/2 rounded-r-full" style={{ width: `${tyLeRong}%`, background: XANH }} />
        ) : (
          <div className="absolute top-0 bottom-0 right-1/2 rounded-l-full" style={{ width: `${tyLeRong}%`, background: DO }} />
        )}
      </div>
      <div className="flex justify-between text-[10px] mb-4" style={{ color: MUTED }}>
        <span>← Bán ròng</span>
        <span>Mua ròng →</span>
      </div>

      <p className="text-xs mb-4 leading-relaxed" style={{ color: MUTED }}>
        <b style={{ color: "#D8D8E0" }}>Mua ròng</b>: khối ngoại mua vào NHIỀU HƠN bán ra trong phiên (chênh lệch giá trị mua − bán &gt; 0) → dòng tiền ngoại đang vào ròng.{" "}
        <b style={{ color: "#D8D8E0" }}>Bán ròng</b>: ngược lại — bán ra nhiều hơn mua vào, dòng tiền ngoại đang rút ròng. Không phải tổng khối lượng mua hoặc bán riêng lẻ.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: XANH }}>
            TOP MUA RÒNG
          </p>
          <DanhSachMa ds={ngoai.topMua} mau={XANH} />
        </div>
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: DO }}>
            TOP BÁN RÒNG
          </p>
          <DanhSachMa ds={ngoai.topBan} mau={DO} />
        </div>
      </div>
    </div>
  );
}
