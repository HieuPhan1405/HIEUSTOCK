// THE CHIA SE TIN HIEU TRONG PHIEN (ve ngoai man hinh roi chup thanh anh de gui khach - xem components/XuatAnh.js). Cung bo cuc / mau co dinh voi components/TheThiTruong.js (720px, chu >= 13px).
// Chi gom 4 o "Top co hoi dang chu y" cua phien (Mua / Mua moi / Ban / Ban bot), moi o toi da TOI_DA dong + "va N ma khac" de anh khong dai vo han. Du lieu lay tu dungCoHoiHomNay (lib/coHoiHomNay.js).
import { fmt, pct } from "@/components/dungChung";
import { gioChupVN } from "@/lib/xuatAnh";

export const RONG_THE_TIN_HIEU = 720;
const TOI_DA = 8;
const C = { nen: "#0E0F1C", card: "#181A2E", the2: "#1E2140", vien: "#2A2D48", chu: "#F4F5FB", mo: "#A3A6C4", xanh: "#4ADE80", do: "#F87171", cam: "#FB923C", vang: "#FBBF24", tim: "#6C5CE7", timNhat: "#A29BFE" };
const FONT = "var(--font-chu), 'Open Sans', system-ui, sans-serif";
const mauLai = (v) => (v == null ? C.mo : v > 0 ? C.xanh : v < 0 ? C.do : C.vang);

function O({ tieuDe, mau, ds, trong, dong }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 20, padding: "18px 22px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, fontWeight: 800, color: mau }}>
          <span style={{ width: 4, height: 18, borderRadius: 2, background: mau }} />
          {tieuDe}
        </span>
        <span style={{ fontSize: 22, fontWeight: 800, color: mau }}>{ds.length}</span>
      </div>
      {ds.length === 0 ? (
        <div style={{ fontSize: 14, color: C.mo }}>{trong}</div>
      ) : (
        <>
          {ds.slice(0, TOI_DA).map((x, i) => dong(x, i))}
          {ds.length > TOI_DA && <div style={{ fontSize: 13.5, color: C.mo, marginTop: 8 }}>… và {ds.length - TOI_DA} mã khác</div>}
        </>
      )}
    </div>
  );
}

const Hang = ({ ma, trai, phai, mauPhai = C.chu }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "7px 0", borderTop: `1px solid ${C.vien}` }}>
    <b style={{ width: 62, fontSize: 17, fontWeight: 800 }}>{ma}</b>
    <span style={{ flex: 1, fontSize: 14, color: C.mo, lineHeight: 1.35 }}>{trai}</span>
    <span style={{ fontSize: 16, fontWeight: 800, color: mauPhai, whiteSpace: "nowrap" }}>{phai}</span>
  </div>
);

// props: cohoi = ket qua dungCoHoiHomNay ({ mua, ban, muaMoi, banBot }), ngay = chuoi ngay hien thi
export default function TheTinHieu({ cohoi, ngay = "" }) {
  const { mua = [], ban = [], muaMoi = [], banBot = [] } = cohoi || {};
  return (
    <div style={{ width: RONG_THE_TIN_HIEU, background: `radial-gradient(620px 300px at 12% -60px, rgba(108,92,231,0.42), rgba(108,92,231,0) 70%), ${C.nen}`, color: C.chu, fontFamily: FONT, padding: "28px 28px 24px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-day-du-toi.png" alt="CloudStock" style={{ height: 44, width: "auto" }} />
        <span style={{ fontSize: 13, color: C.mo, textAlign: "right", lineHeight: 1.35 }}>
          Tín hiệu trong phiên
          <br />
          {ngay ? `Phiên ${ngay}` : gioChupVN()}
        </span>
      </div>

      <O tieuDe="Mua" mau={C.xanh} ds={mua} trong="Chưa có tín hiệu mua trong phiên." dong={(r) => <Hang key={r.ma} ma={r.ma} trai={`Điểm ${fmt(r.diem)} · Cắt lỗ ${fmt(r.stop_loss)} · TP1 ${fmt(r.tp1)}`} phai={fmt(r.gia_mua ?? r.gia)} />} />
      <O tieuDe="Mua mới" mau={C.timNhat} ds={muaMoi} trong="Chưa có lệnh mua mới trong phiên." dong={(r, i) => <Hang key={`${r.ma}${i}`} ma={r.ma} trai={`Cắt lỗ ${fmt(r.stop_loss ?? r.stop_moi)} · TP1 ${fmt(r.tp1 ?? r.tp1_moi)}`} phai={fmt(r.gia_mua_moi ?? r.gia_mua ?? r.gia)} />} />
      <O tieuDe="Bán" mau={C.do} ds={ban} trong="Chưa có lệnh bán trong phiên." dong={(b) => <Hang key={b.khoa} ma={b.ma} trai={`${b.lyDo}${b.giaBan != null ? ` · giá ${fmt(b.giaBan)}` : ""}`} phai={b.ketQuaPct != null ? pct(b.ketQuaPct, 1) : "—"} mauPhai={mauLai(b.ketQuaPct)} />} />
      <O
        tieuDe="Bán bớt"
        mau={C.cam}
        ds={banBot}
        trong="Chưa có mã cần bán bớt."
        dong={(x) => (
          <Hang key={x.khoa} ma={x.ma} trai={x.loai === "chot" ? `Chốt ${x.phanPct}% tại ${x.tp}${x.gia != null ? ` · giá ${fmt(x.gia)}` : ""}` : x.duoiTenkanPct != null && !x.theoDiem ? `Giá dưới Tenkan ${fmt(Math.abs(x.duoiTenkanPct))}%` : "Cảnh báo giảm bớt"} phai={x.laiPct != null ? pct(x.laiPct, 1) : "—"} mauPhai={mauLai(x.laiPct)} />
        )}
      />
      <div style={{ fontSize: 12.5, color: C.mo, marginTop: 4, textAlign: "center" }}>cloudstock.id.vn · Không phải khuyến nghị đầu tư</div>
    </div>
  );
}
