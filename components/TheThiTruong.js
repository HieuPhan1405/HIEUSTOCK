// THE CHIA SE THI TRUONG (ve ngoai man hinh roi chup thanh anh de gui khach - xem components/XuatAnh.js). Cung bo cuc / mau co dinh voi components/TheChiaSeMa.js (720px, chu >= 13px, doc duoc tren Zalo).
// Gom: VN-Index + xu huong, tam ly thi truong (0-100), muc giu lenh cua he thong, do rong (tang / giam / dung gia), top tang - giam gia, nganh manh - yeu nhat.
// Chi dung du lieu da co san trong tatCa (cac dong tin hieu) va vnindex nen khong goi them nguon nao.
import { fmt, pct } from "@/components/dungChung";
import { tinhTongQuanThiTruong, nhanTamLy } from "@/lib/thiTruong";
import { gioChupVN } from "@/lib/xuatAnh";

export const RONG_THE_THI_TRUONG = 720;
const C = { nen: "#0E0F1C", card: "#181A2E", the2: "#1E2140", vien: "#2A2D48", chu: "#F4F5FB", mo: "#A3A6C4", xanh: "#4ADE80", xanhDam: "#16A34A", do: "#F87171", doDam: "#B91C1C", vang: "#FBBF24", tim: "#8B7CF6", timNhat: "#C9BEFF", cyan: "#5EEAD4" };
const FONT = "var(--font-chu), 'Open Sans', system-ui, sans-serif";

// bien CSS cua web (doi theo giao dien sang / toi) -> mau co dinh cua the
const MAU = { "var(--do)": C.do, "var(--cam)": "#FB923C", "var(--vang)": C.vang, "var(--chanh)": "#A3E635", "var(--xanh)": C.xanh, "var(--mo)": C.mo };
const co = (v) => MAU[v] ?? v;
const mauDoi = (v) => (v == null ? C.mo : v > 0 ? C.xanh : v < 0 ? C.do : C.vang);

function Khoi({ tieuDe, phu, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 20, padding: "22px 24px", marginBottom: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 4, height: 18, borderRadius: 2, background: `linear-gradient(180deg, ${C.timNhat}, ${C.tim})` }} />
          <span style={{ fontSize: 19, fontWeight: 800, color: C.chu }}>{tieuDe}</span>
        </div>
        {phu && <div style={{ fontSize: 13.5, color: C.mo, marginTop: 6, lineHeight: 1.4 }}>{phu}</div>}
      </div>
      {children}
    </div>
  );
}

// dong ho tam ly: nen cung xam + phan da lap 1 mau theo nhan (cung cach voi Dashboard)
function DongHo({ diem, mau }) {
  const cx = 100;
  const cy = 100;
  const r = 78;
  const p = (ptram) => {
    const a = Math.PI * (1 - ptram / 100);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  };
  const cung = (tu, den) => {
    const [x1, y1] = p(tu);
    const [x2, y2] = p(den);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const d = diem == null ? 0 : Math.max(0, Math.min(100, diem));
  const goc = -90 + (d / 100) * 180;
  return (
    <svg viewBox="0 0 200 112" width="220" height="123" style={{ display: "block" }} aria-hidden="true">
      <path d={cung(0.4, 99.6)} stroke="#2F3256" strokeWidth="14" fill="none" />
      {d > 1 && <path d={cung(0.4, d)} stroke={mau} strokeWidth="14" fill="none" />}
      <g transform={`rotate(${goc} ${cx} ${cy})`}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - 66} stroke={C.chu} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r="7.5" fill={C.chu} />
    </svg>
  );
}

function Chip({ ma, doi }) {
  const m = mauDoi(doi);
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8, padding: "7px 12px", borderRadius: 12, background: C.the2, border: `1px solid ${C.vien}`, fontSize: 16 }}>
      <b style={{ fontWeight: 800 }}>{ma}</b>
      <span style={{ fontWeight: 700, color: m, fontSize: 15 }}>{pct(doi, 1)}</span>
    </span>
  );
}

// props: tatCa (dong tin hieu da chuan hoa), vnindex (dong VNINDEX hoac null), ngay (chuoi ngay hien thi)
export default function TheThiTruong({ tatCa = [], vnindex = null, ngay = "" }) {
  const tq = tinhTongQuanThiTruong(tatCa, vnindex);
  const tl = nhanTamLy(tq.tamLy);
  const mauTL = co(tl.mau);
  const dr = tq.doRong;
  const tong = Math.max(dr.tong, 1);
  const khuc = [
    [dr.tangManh, C.xanhDam],
    [dr.tangNhe, C.xanh],
    [dr.dung, C.vang],
    [dr.giamNhe, C.do],
    [dr.giamManh, C.doDam],
  ];

  return (
    <div
      style={{
        width: RONG_THE_THI_TRUONG,
        background: `radial-gradient(620px 300px at 12% -60px, rgba(108,92,231,0.42), rgba(108,92,231,0) 70%), radial-gradient(460px 260px at 105% 40px, rgba(34,211,238,0.14), rgba(34,211,238,0) 70%), ${C.nen}`,
        color: C.chu,
        fontFamily: FONT,
        padding: "28px 28px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-day-du-toi.png" alt="CloudStock" style={{ height: 44, width: "auto" }} />
        <span style={{ fontSize: 13, color: C.mo, textAlign: "right", lineHeight: 1.35 }}>
          Tổng quan thị trường
          <br />
          {ngay ? `Số liệu ngày ${ngay}` : gioChupVN()}
        </span>
      </div>

      {/* VN-INDEX + TAM LY */}
      <div style={{ background: `linear-gradient(160deg, ${C.the2}, ${C.card})`, border: `1px solid ${C.vien}`, borderRadius: 24, padding: "24px 26px", marginBottom: 16, boxShadow: "0 18px 40px -22px rgba(108,92,231,0.7)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, color: C.mo, marginBottom: 6 }}>VN-Index</div>
            {vnindex ? (
              <>
                <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1, letterSpacing: -1 }}>{fmt(vnindex.gia)}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: mauDoi(vnindex.doi), marginTop: 8 }}>{pct(vnindex.doi, 2)}</div>
                {tq.xuHuong && (
                  <span style={{ display: "inline-block", marginTop: 14, padding: "6px 16px", borderRadius: 999, fontSize: 16, fontWeight: 800, color: "#0E0F1C", background: co(tq.xuHuong.mau), boxShadow: `0 8px 22px -8px ${co(tq.xuHuong.mau)}` }}>
                    Xu hướng {tq.xuHuong.nhan.toLowerCase()}
                  </span>
                )}
              </>
            ) : (
              <div style={{ fontSize: 16, color: C.mo }}>Chưa có dữ liệu VN-Index.</div>
            )}
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 15, color: C.mo, marginBottom: 2 }}>Tâm lý thị trường</div>
            <DongHo diem={tq.tamLy} mau={mauTL} />
            <div style={{ marginTop: -4 }}>
              <span style={{ fontSize: 34, fontWeight: 800 }}>{tq.tamLy ?? "—"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: mauTL, marginLeft: 8 }}>{tl.nhan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DO RONG + MUC GIU LENH */}
      <Khoi tieuDe="Độ rộng thị trường" phu={`Tính trên ${tq.tong} mã hệ thống đang theo dõi (HOSE, HNX, UPCOM)`}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
          <span style={{ color: C.xanh }}>{dr.tang} tăng</span>
          <span style={{ color: C.mo, fontWeight: 400 }}> · </span>
          <span style={{ color: C.do }}>{dr.giam} giảm</span>
          <span style={{ color: C.mo, fontWeight: 400 }}> · </span>
          <span style={{ color: C.vang }}>{dr.dung} đứng giá</span>
        </div>
        <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", background: C.vien }}>
          {khuc.map(([n, mau], i) => (
            <div key={i} style={{ width: `${(n / tong) * 100}%`, background: mau }} />
          ))}
        </div>
        <div style={{ fontSize: 13.5, color: C.mo, marginTop: 10, lineHeight: 1.5 }}>
          Tăng mạnh &gt;3%: <b style={{ color: C.chu }}>{dr.tangManh}</b> · tăng nhẹ: <b style={{ color: C.chu }}>{dr.tangNhe}</b> · giảm nhẹ: <b style={{ color: C.chu }}>{dr.giamNhe}</b> · giảm mạnh &lt;−3%: <b style={{ color: C.chu }}>{dr.giamManh}</b>
        </div>
        {tq.tyLeDangGiu != null && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.vien}`, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 15, color: C.mo }}>Mức giữ lệnh của hệ thống ({tq.dangGiu}/{tq.tong} mã)</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: C.timNhat }}>{Math.round(tq.tyLeDangGiu)}%</span>
          </div>
        )}
      </Khoi>

      {/* TOP TANG / GIAM */}
      <Khoi tieuDe="Top tăng – giảm giá" phu="Mã có giá trị giao dịch trung bình 20 phiên từ 5 tỷ đồng">
        <div style={{ fontSize: 14, color: C.xanh, fontWeight: 800, marginBottom: 8 }}>Tăng mạnh nhất</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {tq.topTang.slice(0, 8).map((r) => (
            <Chip key={r.ma} ma={r.ma} doi={r.doi} />
          ))}
        </div>
        <div style={{ fontSize: 14, color: C.do, fontWeight: 800, marginBottom: 8 }}>Giảm mạnh nhất</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {tq.topGiam.slice(0, 8).map((r) => (
            <Chip key={r.ma} ma={r.ma} doi={r.doi} />
          ))}
        </div>
      </Khoi>

      {/* NGANH */}
      {(tq.nganhTot.length > 0 || tq.nganhXau.length > 0) && (
        <Khoi tieuDe="Ngành dẫn dắt – kéo lùi" phu="Mức thay đổi giá trung bình của các mã trong ngành hôm nay">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[
              ["Mạnh nhất", tq.nganhTot, C.xanh],
              ["Yếu nhất", tq.nganhXau, C.do],
            ].map(([nhan, ds, mau]) => (
              <div key={nhan} style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, color: mau, fontWeight: 800, marginBottom: 8 }}>{nhan}</div>
                {ds.map((n) => (
                  <div key={n.khoa} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: `1px solid ${C.vien}`, fontSize: 15 }}>
                    <span style={{ minWidth: 0 }}>{n.nhan}</span>
                    <b style={{ color: mauDoi(n.tb), flexShrink: 0 }}>{pct(n.tb, 2)}</b>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Khoi>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, fontSize: 12.5, color: C.mo, borderTop: `1px solid ${C.vien}`, paddingTop: 14, lineHeight: 1.45 }}>
        <span style={{ flexShrink: 0 }}>
          <b style={{ color: C.chu, fontSize: 14 }}>CloudStock</b>
          <br />
          cloudstock.id.vn
        </span>
        <span style={{ textAlign: "right" }}>Chụp lúc {gioChupVN()}. Thống kê trên các mã hệ thống theo dõi, không phải toàn thị trường và không phải khuyến nghị đầu tư.</span>
      </div>
    </div>
  );
}
