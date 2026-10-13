import { nhe } from "@/components/dungChung";
import { soVN } from "@/lib/soVN";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "#F6C544";
const mono = { fontFamily: "'JetBrains Mono', monospace" };

const TRANG_THAI = {
  tren: {
    nhan: "TRÊN VÙNG GIÁ TRỊ",
    mau: XANH,
    yNghia: "VN-Index đang đóng cửa trên vùng giao dịch chính của 60 phiên gần nhất: thị trường đang được chấp nhận ở vùng giá cao hơn.",
  },
  trong: {
    nhan: "TRONG VÙNG GIÁ TRỊ",
    mau: VANG,
    yNghia: "VN-Index đang nằm trong vùng giao dịch chính của 60 phiên gần nhất (vùng chứa khoảng 70% khối lượng). Đây là trạng thái thường gặp nhất.",
  },
  duoi: {
    nhan: "DƯỚI VÙNG GIÁ TRỊ",
    mau: DO,
    yNghia:
      "VN-Index đã rơi xuống dưới vùng giao dịch chính của 60 phiên gần nhất. Trong dữ liệu lịch sử của hệ thống, tín hiệu mua xuất hiện ở giai đoạn này thường kém hơn các giai đoạn khác, nên cần thận trọng hơn với lệnh mua mới.",
  },
};

// VN-Index so voi "vung gia tri" (Volume Profile 60 phien, lib/vungGiaTriChiSo.js): the boi canh thi truong tren trang Thi truong.
// Chi la thong tin tham khao - KHONG phai dieu kien mua / ban cua he thong (xem ket qua kiem chung trong engine/dich-vu/nghienCuuVPVni.mjs).
export default function VungGiaTriChiSo({ vt, ten = "VN-Index" }) {
  if (!vt) return null; // nguon gia loi / khong du du lieu: bo qua the nay, khong lam hong trang
  const tt = TRANG_THAI[vt.viTri] ?? TRANG_THAI.trong;
  const rong = vt.cao - vt.thap;
  const pct = (x) => (rong > 0 ? Math.max(0, Math.min(100, ((x - vt.thap) / rong) * 100)) : 50);
  const so = (x) => soVN(x, 1, true);
  const moc = [
    { nhan: "VAL", gia: vt.val, mau: MUTED },
    { nhan: "POC", gia: vt.poc, mau: VANG },
    { nhan: "VAH", gia: vt.vah, mau: MUTED },
  ];
  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          {ten} theo khối lượng · vùng giá trị {vt.soPhien} phiên
        </p>
        <span className="px-2.5 py-1 rounded-md text-xs font-bold" style={{ background: nhe(tt.mau, 14), color: tt.mau, border: `1px solid ${nhe(tt.mau, 30)}`, fontFamily: "'Inter', sans-serif" }}>
          {tt.nhan}
        </span>
      </div>

      {/* Thuoc do: tu day den dinh cua {soPhien} phien; dai dam = vung gia tri (VAL..VAH); vach vang = POC; cham = gia dong cua gan nhat */}
      <div className="relative h-9 mb-1" role="img" aria-label={`${ten} đóng cửa ${so(vt.dong)}, vùng giá trị từ ${so(vt.val)} đến ${so(vt.vah)}, POC ${so(vt.poc)}`}>
        <div className="absolute left-0 right-0 top-3.5 h-2 rounded-full" style={{ background: "var(--vien-nhe)" }} />
        <div className="absolute top-3.5 h-2 rounded-full" style={{ left: `${pct(vt.val)}%`, width: `${Math.max(1, pct(vt.vah) - pct(vt.val))}%`, background: nhe(VANG, 35) }} />
        <div className="absolute top-2 h-5 w-0.5" style={{ left: `${pct(vt.poc)}%`, background: VANG }} />
        <div className="absolute top-2 w-5 h-5 rounded-full -ml-2.5" style={{ left: `${pct(vt.dong)}%`, background: tt.mau, border: `3px solid ${NEN_CARD}`, boxShadow: `0 0 0 1.5px ${tt.mau}` }} />
      </div>
      <div className="flex justify-between text-[11px] mb-4" style={{ color: MUTED, ...mono }}>
        <span>Thấp nhất {so(vt.thap)}</span>
        <span>Cao nhất {so(vt.cao)}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: MUTED }}>Đóng cửa gần nhất</p>
          <p className="text-lg font-bold" style={{ color: tt.mau, ...mono }}>{so(vt.dong)}</p>
        </div>
        {moc.map((m) => (
          <div key={m.nhan}>
            <p className="text-[11px] mb-0.5" style={{ color: MUTED }}>
              {m.nhan === "POC" ? "POC (khối lượng nhiều nhất)" : m.nhan === "VAH" ? "VAH (biên trên)" : "VAL (biên dưới)"}
            </p>
            <p className="text-lg font-bold" style={{ color: m.nhan === "POC" ? VANG : TEXT, ...mono }}>{so(m.gia)}</p>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{tt.yNghia}</p>
      <p className="text-[11px] mt-2" style={{ color: MUTED }}>
        Ước lượng từ nến ngày (khối lượng mỗi phiên chia đều theo biên độ giá của phiên đó), tính đến phiên {vt.ngay.split("-").reverse().join("/")}. Thông tin tham khảo, không phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
