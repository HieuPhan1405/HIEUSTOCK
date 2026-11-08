// Thanh phan + dinh dang dung chung cho cac muc cua trang Danh gia danh muc (components/DanhGiaDanhMuc.js, DanhGia*.js, BaoCaoDanhMuc.js).
export const VIEN = "var(--vien)";
export const NEN_CARD = "var(--card)";
export const TEXT = "var(--chu)";
export const MUTED = "var(--mo)";
export const PRIMARY = "#6C5CE7";
export const XANH = "var(--xanh)";
export const DO = "var(--do)";
export const VANG = "var(--vang)";
export const CAM = "var(--cam)";
export const sans = { fontFamily: "var(--font-chu)" };
export const MAU_MUC = [DO, VANG, XANH];
export const NHAN_MUC = ["Cần xử lý", "Chú ý", "Tốt"];
// mau trang thai Giu / Theo doi / Giam / Thoat - luon kem chu (khong de mau tu noi)
export const MAU_NHAN = { giu: XANH, theo_doi: VANG, giam: CAM, thoat: DO };

export const soVN = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString("vi-VN", { maximumFractionDigits: d }) : "—");
export const p1 = (x) => (x == null || !Number.isFinite(x) ? "—" : x.toFixed(1).replace(".", ","));
export const p0 = (x) => (x == null || !Number.isFinite(x) ? "—" : `${Math.round(x)}`);
export const dau = (x, d = 1) => (x == null || !Number.isFinite(x) ? "—" : `${x > 0 ? "+" : ""}${x.toFixed(d).replace(".", ",")}%`);
export function tien(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e9) return `${soVN(v / 1e9, 2)} tỷ`;
  if (a >= 1e6) return `${soVN(v / 1e6, 1)} triệu`;
  return `${soVN(v)} đ`;
}
export const mauLai = (v) => (v == null ? MUTED : v > 0 ? XANH : v < 0 ? DO : TEXT);
export const ngayVN = (t) => (t ? `${t.slice(8, 10)}/${t.slice(5, 7)}/${t.slice(0, 4)}` : "");

export function Khoi({ tieuDe, phu, children, className = "mb-6", phai }) {
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${className}`} style={{ borderColor: VIEN, background: NEN_CARD }} aria-label={tieuDe}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>
          {tieuDe}
        </h2>
        {phai}
      </div>
      {phu && (
        <p className="text-xs -mt-2 mb-3" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
      {children}
    </section>
  );
}

export function The({ nhan, children, phu, mau }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="text-xs mb-1" style={{ color: MUTED }}>
        {nhan}
      </div>
      <div className="text-xl sm:text-2xl" style={{ ...sans, fontWeight: 800, color: mau ?? TEXT }}>
        {children}
      </div>
      {phu && (
        <div className="text-[11px] mt-1" style={{ color: MUTED }}>
          {phu}
        </div>
      )}
    </div>
  );
}

export function Thanh({ ten, v, mau = "var(--bd-1)" }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1" style={sans}>
        <span>{ten}</span>
        <span style={{ color: MUTED }}>{(v * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--vien-nhe)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, v * 100)}%`, background: mau }} />
      </div>
    </div>
  );
}

export function NhanXet({ x }) {
  return (
    <li className="flex gap-2.5 text-sm" style={sans}>
      <span aria-hidden="true" className="mt-1.5 shrink-0 rounded-full" style={{ width: 9, height: 9, background: MAU_MUC[x.muc] }} />
      <span>
        <span className="sr-only">{NHAN_MUC[x.muc]}: </span>
        {x.tieuDe && <b>{x.tieuDe}: </b>}
        {x.noiDung}
      </span>
    </li>
  );
}

// Nhan trang thai Giu / Theo doi / Giam ty trong / Thoat (cham mau + chu)
export function NhanTrangThai({ nhan, ten }) {
  if (!nhan) return <span style={{ color: MUTED }}>—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-bold px-2 py-0.5 rounded-full border" style={{ borderColor: MAU_NHAN[nhan], color: TEXT, ...sans }}>
      <span aria-hidden="true" className="rounded-full" style={{ width: 8, height: 8, background: MAU_NHAN[nhan] }} />
      {ten}
    </span>
  );
}
