// TICH SAN: mua deu moi thang vs CHI MUA KHI RE (PE HOSE thap) - Hieu 02/11/2026. PE HOSE cuoi thang tu lib/lichSuDinhGiaThiTruong.js (2018-01 -> 2026-08), VN-Index cuoi thang.
// "Re" = PE thang do <= trung vi PE cua 36 thang truoc (khong nhin truoc). Moi thang co 1 don vi ngan sach; tien khong mua duoc giu o dang tien mat (lai suat 0% va 4%/nam), cuoi ky cong lai.
// Bien the: (1) mua deu; (2) chi mua khi re, bo qua thang khac (tien mat nam im); (3) tien mat tich luy, khi re thi dua het tien dang co vao. Chay: node engine/dich-vu/nghienCuuTichSanGiaRe.mjs
import { docJson, f } from "./backtestChung.mjs";
import { LICH_SU_DINH_GIA } from "../../lib/lichSuDinhGiaThiTruong.js";

const vni = docJson("vnindex_dai.json");
const cuoi = new Map(); for (const b of vni) cuoi.set(b.t.slice(0, 7), b.c);
const ds = LICH_SU_DINH_GIA.map((x) => ({ k: x.ngay.slice(0, 7), pe: x.pe, g: cuoi.get(x.ngay.slice(0, 7)) })).filter((x) => x.g);
const trungVi = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
for (const laiTM of [0, 0.04]) {
  const mTM = Math.pow(1 + laiTM, 1 / 12);
  const kq = {};
  for (const ten of ["deu", "chiRe", "doiRe"]) {
    let don = 0, tm = 0, nap = 0, thangMua = 0;
    for (let q = 0; q < ds.length; q++) {
      tm *= mTM; nap++; tm += 1;
      const re = q >= 36 && ds[q].pe <= trungVi(ds.slice(q - 36, q).map((x) => x.pe));
      const dat = ten === "deu" || q < 36 || re; // 36 thang dau chua co lich su -> mua deu
      if (ten === "deu") { don += 1 / ds[q].g; tm -= 1; thangMua++; }
      else if (ten === "chiRe") { if (dat) { don += 1 / ds[q].g; tm -= 1; thangMua++; } }
      else if (dat) { don += tm / ds[q].g; tm = 0; thangMua++; }
    }
    kq[ten] = { gt: don * ds.at(-1).g + tm, nap, tm, thangMua };
  }
  console.log(`\nLai tien mat ${laiTM * 100}%/nam | ${ds[0].k} -> ${ds.at(-1).k}, ${ds.length} thang, ngan sach ${ds.length} don vi`);
  for (const [ten, o] of Object.entries(kq)) console.log(`${ten.padEnd(6)} gia tri cuoi ${f(o.gt, 2).padStart(6)} (x${f(o.gt / o.nap, 3)} ngan sach) | thang mua ${o.thangMua}/${o.nap}, tien mat cuoi ky ${f(o.tm, 1)}`);
}
const ph = ds.slice(36).map((x, i) => x.pe <= trungVi(ds.slice(i, i + 36).map((y) => y.pe)));
console.log(`\nSo thang "re" (PE <= trung vi 36 thang truoc) tu thang 37: ${ph.filter(Boolean).length}/${ph.length}`);
// loi suat VN-Index 12 thang sau theo re / khong re
const sau = (q) => (q + 12 < ds.length ? ds[q + 12].g / ds[q].g - 1 : null);
const nhom = { re: [], dat: [] };
ds.forEach((x, q) => { if (q < 36 || sau(q) == null) return; (ph[q - 36] ? nhom.re : nhom.dat).push(sau(q) * 100); });
for (const [k, a] of Object.entries(nhom)) console.log(`${k === "re" ? "thang RE" : "thang KHONG re"}: n=${a.length}, loi suat VN-Index 12 thang sau TB ${f(a.reduce((s, x) => s + x, 0) / a.length, 1)}%`);
