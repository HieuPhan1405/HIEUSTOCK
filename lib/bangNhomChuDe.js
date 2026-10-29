// BANG NHOM CHU DE (vd "Dau tu cong") theo mau tham khao cua Hieu 29/10/2026 - ham THUAN, import tuong doi de test tay: engine/test/bangNhomChuDe.test.mjs.
// Moi ma: gia dong cua phien gan nhat, % thay doi so voi phien truoc, khoi luong phien do; ma KHONG giao dich trong phien gan nhat cua nhom (nen cuoi cu hon) hien 0% / KL 0 (nhu mau).
// % trung binh nhom = trung binh DEU % thay doi cua MOI ma trong nhom (gom ca ma khong giao dich = 0%).
// barsTheoMa: { MA: [{ t: "yyyy-mm-dd", c, v }, ...] tang dan } hoac null / thieu khi khong lay duoc.
export function tinhBangNhom(dsMa, barsTheoMa) {
  const cuoi = (ma) => {
    const b = barsTheoMa?.[ma];
    return Array.isArray(b) && b.length ? b[b.length - 1] : null;
  };
  // Phien gan nhat cua nhom = ngay nen cuoi lon nhat trong cac ma.
  let ngayPhien = null;
  for (const ma of dsMa) {
    const n = cuoi(ma);
    if (n && (!ngayPhien || n.t > ngayPhien)) ngayPhien = n.t;
  }
  const hang = [];
  for (const ma of dsMa) {
    const b = barsTheoMa?.[ma];
    const n = cuoi(ma);
    if (!n || !(n.c > 0)) {
      hang.push({ ma, gia: null, doiPct: null, kl: null, coDuLieu: false });
      continue;
    }
    const truoc = b.length > 1 ? b[b.length - 2] : null;
    const giaoDich = n.t === ngayPhien;
    hang.push({
      ma,
      gia: n.c,
      doiPct: giaoDich && truoc?.c > 0 ? (n.c / truoc.c - 1) * 100 : 0,
      kl: giaoDich ? n.v ?? 0 : 0,
      coDuLieu: true,
    });
  }
  const co = hang.filter((h) => h.coDuLieu);
  const tb = co.length ? co.reduce((s, h) => s + h.doiPct, 0) / co.length : null;
  return { ngayPhien, hang, trungBinhPct: tb };
}

// Mau nen o theo % thay doi: xanh dam dan khi tang, do dam dan khi giam, vang khi 0 (bien do HOSE +-7%).
export function mauNenTheoDoi(pct) {
  if (pct == null || !Number.isFinite(pct)) return "transparent";
  if (Math.abs(pct) < 0.005) return "rgba(234,179,8,0.22)";
  const d = Math.min(Math.abs(pct) / 7, 1);
  const a = (0.12 + d * 0.63).toFixed(2);
  return pct > 0 ? `rgba(34,197,94,${a})` : `rgba(239,68,68,${a})`;
}

// 3300 -> "3,3k", 2_000_000 -> "2m", 100 -> "100".
export function dinhDangKL(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  const f = (x) => (Math.round(x * 10) / 10).toString().replace(".", ",");
  if (v >= 1e6) return `${f(v / 1e6)}m`;
  if (v >= 1e3) return `${f(v / 1e3)}k`;
  return String(Math.round(v));
}
