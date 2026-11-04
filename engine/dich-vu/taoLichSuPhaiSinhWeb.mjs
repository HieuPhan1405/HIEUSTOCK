// TAO BAN CHUP LICH SU PHA VO BIEN DONG 0,3 cho trang /phai-sinh (muc "Lich su tu 2024"): doc nen 1 phut VN30F1M da tai (taiDuLieuPhaiSinh.mjs -> engine/output/vn30f1m_1p.json),
// chay DUNG logic cua web (lib/phaVoPhaiSinh.js: tinhBienDong, vung gia tri, phien dau hop dong) cho tung phien tu ngay TU, ghi lib/phaiSinhLichSuTinh.json.
// Trang web ghep ban chup nay voi ~30 phien gan nhat lay truc tiep tu DNSE (lib/phaVoPhaiSinhDuLieu.js layLichSuDai) -> CHAY LAI moi 3-4 tuan de khong bi ho giua 2 nguon.
// Chay: node engine/dich-vu/taiDuLieuPhaiSinh.mjs && node engine/dich-vu/taoLichSuPhaiSinhWeb.mjs   (TU=2024-01-01 doi ngay bat dau)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { tachPhien, bienDoPhien, tinhBienDong, laPhienDauHopDong, vungGiaTriPhien, viTriVungGiaTri } from "../../lib/phaVoPhaiSinh.js";

const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TU = process.env.TU ?? "2024-01-01";
const j = JSON.parse(readFileSync(path.join(GOC, "output", "vn30f1m_1p.json"), "utf8"));
const nen = j.t.map((t, i) => [t, j.o[i], j.h[i], j.l[i], j.c[i], j.v?.[i] ?? 0]).filter((r) => r.slice(1, 5).every((x) => Number.isFinite(x) && x > 0) && r[2] >= r[3]).sort((a, b) => a[0] - b[0]);
const P = tachPhien(nen);
const ds = [...P.keys()].sort();
const hang = [];
for (let i = 1; i < ds.length; i++) {
  if (ds[i] < TU) continue;
  const p = P.get(ds[i]);
  if (!p || p.kCuoi < 200) continue; // phien thieu du lieu
  const bd = bienDoPhien(P.get(ds[i - 1]));
  const dauHD = laPhienDauHopDong(ds[i - 1], ds[i]);
  const vung = dauHD ? null : vungGiaTriPhien(P.get(ds[i - 1]));
  const x = bd ? tinhBienDong(p, bd.bienDo) : null;
  const r = { ngay: ds[i] };
  if (dauHD) r.dauHD = 1;
  if (x && x.phia) {
    Object.assign(r, { phia: x.phia, vao: x.vao.gia, gioVao: x.vao.gio, ra: x.ra ? x.ra.gia : null, gioRa: x.ra ? x.ra.gio : null, lyDo: x.trangThai, diemSauPhi: Math.round(x.diemSauPhi * 100) / 100, viTri: viTriVungGiaTri(x.vao.gia, x.phia, vung) });
  }
  hang.push(r);
}
const out = { tu: TU, den: hang[hang.length - 1].ngay, tao: new Date().toISOString().slice(0, 10), hang };
writeFileSync(path.join(GOC, "..", "lib", "phaiSinhLichSuTinh.json"), JSON.stringify(out));
const L = hang.filter((r) => r.phia && !r.dauHD);
console.log(`Ghi lib/phaiSinhLichSuTinh.json: ${hang.length} phien tu ${hang[0].ngay} den ${out.den}; ${L.length} lenh, thang ${L.filter((r) => r.diemSauPhi > 0).length}, tong ${L.reduce((s, r) => s + r.diemSauPhi, 0).toFixed(1)} diem sau phi`);
