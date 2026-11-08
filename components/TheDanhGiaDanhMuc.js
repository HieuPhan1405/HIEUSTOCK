// THE CHIA SE "DANH GIA DANH MUC" (ve ngoai man hinh roi chup thanh anh - xem components/XuatAnh.js). Mau co dinh nen toi, rong 720px, chu >= 13px nhu TheThiTruong.
// CHI hien ty le % (khong co so tien) de nguoi dung chia se khong lo quy mo tai san; tuy chon an ten ma.
import { gioChupVN } from "@/lib/xuatAnh";

export const RONG_THE_DANH_GIA = 720;
const C = { nen: "#0E2016", card: "#1F3D2B", the2: "#28503A", vien: "#2F5A41", chu: "#F6F0E1", mo: "#B3C0AE", xanh: "#4ADE80", do: "#F87171", vang: "#FBBF24", tim: "#A78BFA", timNhat: "#C4B5FD", cam: "#C4842A" };
const FONT = "var(--font-chu), 'Open Sans', system-ui, sans-serif";
const p1 = (x) => (x == null || !Number.isFinite(x) ? "—" : x.toFixed(1).replace(".", ","));
const mauDiem = (d) => (d == null ? C.mo : d >= 70 ? C.xanh : d >= 50 ? C.vang : C.do);
const MAU_MUC = [C.do, C.vang, C.xanh];

function Cung({ diem }) {
  const r = 78;
  const p = (x) => {
    const a = Math.PI * (1 - x / 100);
    return [100 + r * Math.cos(a), 96 - r * Math.sin(a)];
  };
  const cung = (tu, den) => `M ${p(tu)[0]} ${p(tu)[1]} A ${r} ${r} 0 0 1 ${p(den)[0]} ${p(den)[1]}`;
  const d = Math.max(0, Math.min(100, diem ?? 0));
  return (
    <svg viewBox="0 0 200 110" width="230" height="127" aria-hidden="true">
      <path d={cung(0.5, 99.5)} stroke="#2F3256" strokeWidth="14" fill="none" strokeLinecap="round" />
      {d > 1 && <path d={cung(0.5, d)} stroke={mauDiem(diem)} strokeWidth="14" fill="none" strokeLinecap="round" />}
      <text x="100" y="86" textAnchor="middle" fontSize="42" fontWeight="800" fill={C.chu} style={{ fontFamily: FONT }}>
        {diem ?? "—"}
      </text>
    </svg>
  );
}

const TEN_TRU = { daDang: "Đa dạng hóa", ruiRo: "Rủi ro", xuHuong: "Xu hướng", thanhKhoan: "Thanh khoản", doanhNghiep: "Doanh nghiệp" };

// suc = chamDiemSucKhoe, rr = phanTichRuiRo, pb = danhGiaDanhMuc, nhanXet = danh sach nhan xet (chi % - khong tien), anMa = an ten ma, phongCach = ten phong cach cham diem
export default function TheDanhGiaDanhMuc({ suc, rr, pb, nhanXet = [], anMa = false, ngay = "", phongCach = "" }) {
  const TRU = Object.keys(suc?.tru ?? {}).map((k) => [TEN_TRU[k] ?? k, suc.tru[k], suc.toiDa?.[k] ?? 25]);
  const chiSo = rr?.dsMa?.length
    ? [
        ["Biến động năm", `${Math.round(rr.volP)}%`, `VN-Index ${Math.round(rr.volV)}%`],
        ["Beta", rr.betaP.toFixed(2).replace(".", ","), "so với VN-Index"],
        ["Khoản độc lập", p1(rr.soCuocDocLap), `từ ${rr.ma.length} mã`],
        ["Sụt giảm tối đa", `${p1(Math.abs(rr.ddP.pct))}%`, "1 năm qua"],
      ]
    : [];
  const ma = [...(pb?.hang ?? [])].filter((h) => h.tyTrong != null).sort((a, b) => b.tyTrong - a.tyTrong).slice(0, 8);
  return (
    <div style={{ width: RONG_THE_DANH_GIA, background: `radial-gradient(620px 300px at 12% -60px, rgba(139,92,246,0.42), rgba(139,92,246,0) 70%), ${C.nen}`, color: C.chu, fontFamily: FONT, padding: "28px 28px 22px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-day-du-toi.png" alt="CloudStock" style={{ height: 44, width: "auto" }} />
        <span style={{ fontSize: 13, color: C.mo, textAlign: "right", lineHeight: 1.35 }}>
          Đánh giá danh mục
          <br />
          {ngay ? `Dữ liệu ${ngay}` : gioChupVN()}
        </span>
      </div>

      <div style={{ display: "flex", gap: 22, alignItems: "center", background: C.card, border: `1px solid ${C.vien}`, borderRadius: 22, padding: "20px 24px", marginBottom: 14 }}>
        <div style={{ textAlign: "center" }}>
          <Cung diem={suc?.diem} />
          <div style={{ fontSize: 18, fontWeight: 800, color: mauDiem(suc?.diem), marginTop: -6 }}>{suc?.xepLoai ?? ""}</div>
          <div style={{ fontSize: 12.5, color: C.mo }}>Điểm sức khỏe /100</div>
        </div>
        <div style={{ flex: 1 }}>
          {TRU.map(([ten, v, toiDa]) => (
            <div key={ten} style={{ marginBottom: TRU.length > 4 ? 7 : 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                <span>{ten}</span>
                <span style={{ color: C.mo }}>
                  <b style={{ color: C.chu }}>{v ?? "—"}</b>/{toiDa}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "#2F3256", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((v ?? 0) / toiDa) * 100}%`, background: C.tim, borderRadius: 99 }} />
              </div>
            </div>
          ))}
          {phongCach && <div style={{ fontSize: 12.5, color: C.mo, marginTop: 2 }}>Chấm theo phong cách: {phongCach}</div>}
        </div>
      </div>

      {chiSo.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          {chiSo.map(([ten, gt, phu]) => (
            <div key={ten} style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 16, padding: "12px 14px" }}>
              <div style={{ fontSize: 12.5, color: C.mo }}>{ten}</div>
              <div style={{ fontSize: 24, fontWeight: 800, margin: "2px 0" }}>{gt}</div>
              <div style={{ fontSize: 12, color: C.mo }}>{phu}</div>
            </div>
          ))}
        </div>
      )}

      {nhanXet.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 18, padding: "16px 20px", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Điều quan trọng nhất</div>
          {nhanXet.slice(0, 3).map((x, k) => (
            <div key={k} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.45, marginBottom: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: MAU_MUC[x.muc], marginTop: 6, flexShrink: 0 }} />
              <span>
                <b>{x.tieuDe}: </b>
                {x.noiDung}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: anMa ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 18, padding: "14px 18px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Theo ngành</div>
          {(pb?.nganh ?? []).slice(0, 5).map((g) => (
            <div key={g.ten} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "3px 0" }}>
              <span>{g.ten}</span>
              <b>{Math.round(g.tyTrong * 100)}%</b>
            </div>
          ))}
        </div>
        {!anMa && (
          <div style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 18, padding: "14px 18px" }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Theo mã</div>
            {ma.map((h) => (
              <div key={h.ma} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "3px 0" }}>
                <b>{h.ma}</b>
                <span>{p1(h.tyTrong * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: C.mo, textAlign: "center" }}>Tự chấm danh mục miễn phí tại cloudstock.id.vn/danh-gia-danh-muc · Không phải khuyến nghị đầu tư</div>
    </div>
  );
}
