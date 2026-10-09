// KICH BAN MUA CHO TAT CA CAC MA: voi moi ma chua co lenh (TRUNG LAP / BAN) tinh
//  A. gia dong cua HOM NAY (trong bien do +-7%) nao ra tin hieu MUA (khoang gia mua_tu - mua_den).
//  B. neu khong co lenh hom nay: sau bao nhieu phien se ra MUA theo 3 kich ban gia: GIU GIA, TANG 1%/phien, GIAM 1%/phien (khoi luong moi phien = TB20 x --kl).
//     Ghi ro so phien "doi phien sau" (da du diem nhung cho xac nhan) va diem thanh phan (xu huong / dong luong / dong tien) luc do so voi hien tai.
// Nen (da dieu chinh) tu VNDirect finfo, VN-Index tu dchart. Khong co breadth nganh nen co the lech nhe so voi web; CHI de tham khao, khong phai khuyen nghi.
// Chay: node engine/dich-vu/kichBanMua.mjs [--phien=10] [--kl=1.0] [--ma=ANV,SHB] [--ra=ket-qua.csv] [--upload]
//   --upload : POST JSON len /api/upload-kich-ban (can CS_UPLOAD_API_KEY, goc web CS_GOC_WEB mac dinh https://www.cloudstock.id.vn) - engine real-time (--upload) tu goi file nay moi 15 phut.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { layNenDieuChinh } from "../loi/nenDieuChinh.js";

const SO_NEN = 500;
export const KICH_BAN = { giu: 0, tang: 0.01, giam: -0.01 };

const tick = (g) => (g < 10 ? 0.01 : g < 50 ? 0.05 : 0.1);
const lam = (g) => Number((Math.round(g / tick(g)) * tick(g)).toFixed(2));
const nhan = (r) => (r.tin === "MUA" ? "MUA" : r.tin === "TRUNG LAP" && r.cho_phien_sau ? "DOI PHIEN SAU" : r.tin);

function phienKeTiep(ngay) {
  const d = new Date(ngay + "T00:00:00Z");
  do d.setUTCDate(d.getUTCDate() + 1);
  while ([0, 6].includes(d.getUTCDay()));
  return d.toISOString().slice(0, 10);
}

// nenFull: [{t,o,h,l,c,v}] tu cu den moi (nen cuoi la nen hom nay, co the dang chay). vni: Map(ngay -> dong cua VN-Index).
export function tinhKichBanMotMa(ma, nenFull, vni, { soPhien = 10, kl: heSoKl = 1.0 } = {}) {
  const vniCuoi = [...vni.values()].at(-1);
  const tinhVoi = (nen) =>
    tinhTinHieuChoMa({ ma, nen, vniClose: nen.map((b) => vni.get(b.t) ?? vniCuoi), san: "HOSE", ketQuaBreadth: { theoNganh: new Map(), trungBinh: 50 } });
  const nen = nenFull.slice(-SO_NEN);
  const cuoi = nen.at(-1);
  const truoc = nen.at(-2);
  const tb20 = nen.slice(-21, -1).reduce((s, b) => s + b.v, 0) / 20;
  const kl = Math.round(heSoKl * tb20);
  const hienTai = tinhVoi(nen);
  const out = {
    ma,
    ngay_nen: cuoi.t,
    gia: cuoi.c,
    tin: hienTai.tin,
    diem: hienTai.diem,
    trend: hienTai.trend,
    mom: hienTai.mom,
    dt: hienTai.dt,
    mua_tu: null,
    mua_den: null,
  };

  // A. quet gia dong cua hom nay
  const thuHomNay = (g) => nen.map((b, i) => (i === nen.length - 1 ? { ...b, c: g, h: Math.max(b.h, g), l: Math.min(b.l, g), v: Math.max(b.v, kl) } : b));
  for (let g = lam(truoc.c * 0.93); g <= lam(truoc.c * 1.07) + 1e-9; g = lam(g + tick(g))) {
    if (nhan(tinhVoi(thuHomNay(g))) === "MUA") {
      if (out.mua_tu == null) out.mua_tu = g;
      out.mua_den = g;
    }
  }

  // B. 3 kich ban gia cac phien sau
  for (const [ten, buoc] of Object.entries(KICH_BAN)) {
    let thu = nen.map((b, i) => (i === nen.length - 1 ? { ...b, v: Math.max(b.v, kl) } : b));
    let g = cuoi.c;
    let ngay = cuoi.t;
    let doi = null;
    let mua = null;
    for (let k = 1; k <= soPhien; k++) {
      g = lam(g * (1 + buoc));
      ngay = phienKeTiep(ngay);
      const prev = thu.at(-1).c;
      thu = [...thu, { t: ngay, o: prev, h: Math.max(prev, g), l: Math.min(prev, g), c: g, v: kl }];
      const r = tinhVoi(thu);
      const nh = nhan(r);
      if (nh === "DOI PHIEN SAU" && doi == null) doi = k;
      if (nh === "MUA") {
        mua = { k, ngay, gia: g, diem: r.diem, trend: r.trend, mom: r.mom, dt: r.dt };
        break;
      }
    }
    out[`${ten}_phien`] = mua ? mua.k : null;
    out[`${ten}_ngay`] = mua ? mua.ngay : null;
    out[`${ten}_gia`] = mua ? mua.gia : null;
    out[`${ten}_diem`] = mua ? mua.diem : null;
    out[`${ten}_trend`] = mua ? mua.trend : null;
    out[`${ten}_mom`] = mua ? mua.mom : null;
    out[`${ten}_dt`] = mua ? mua.dt : null;
    out[`${ten}_doi`] = doi;
  }
  return out;
}

export async function layVni() {
  const den = Math.floor(Date.now() / 1000);
  const ngayVN = (giay) => new Date(giay * 1000 + 7 * 3600e3).toISOString().slice(0, 10);
  const dv = await (await fetch(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=VNINDEX&from=${den - 5 * 365 * 86400}&to=${den}`, { signal: AbortSignal.timeout(30000) })).json();
  return new Map(dv.t.map((t, i) => [ngayVN(t), dv.c[i]]));
}

// dsMa: ma can tinh; tra ve { kq: [...], loi: [...] }. Tai nen song song HANG luong (VNDirect cho phep, ~1 phut cho ~340 ma).
export async function tinhKichBanToanBo(dsMa, tuyChon = {}) {
  const vni = await layVni();
  const kq = [];
  const loi = [];
  let i = 0;
  async function tho() {
    while (i < dsMa.length) {
      const ma = dsMa[i++];
      try {
        const nen = await layNenDieuChinh(ma, SO_NEN + 30).catch(() => layNenDieuChinh(ma, SO_NEN + 30));
        if (nen.length < 300) throw new Error("it nen");
        kq.push(tinhKichBanMotMa(ma, nen, vni, tuyChon));
      } catch (e) {
        loi.push(`${ma}: ${e.message}`);
      }
      if ((kq.length + loi.length) % 80 === 0) console.log(`  ${kq.length + loi.length}/${dsMa.length}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, tho));
  return { kq, loi };
}

// ---------------- chay tu dong lenh ----------------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const opt = (ten, mac) => {
    const a = args.find((x) => x.startsWith(`--${ten}=`));
    return a ? a.slice(ten.length + 3) : mac;
  };
  const goc = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
  const chiMa = opt("ma", "") ? opt("ma", "").toUpperCase().split(",") : null;
  const ds = (await (await fetch(`${goc}/api/signals`, { signal: AbortSignal.timeout(30000) })).json()).tinHieu;
  const dsMa = ds.filter((r) => (chiMa ? chiMa.includes(r.ma) : r.tin === "TRUNG LAP" || r.tin === "BAN")).map((r) => r.ma);
  console.log(`${dsMa.length} ma can tinh (chua co lenh)...`);
  const { kq, loi } = await tinhKichBanToanBo(dsMa, { soPhien: Number(opt("phien", 10)), kl: Number(opt("kl", 1.0)) });
  console.log(`Xong ${kq.length} ma (${loi.length} loi).`);
  if (loi.length) console.log(loi.slice(0, 10).join("\n"));

  const ra = opt("ra", "");
  if (ra) {
    const COT = Object.keys(kq[0] ?? { ma: 1 });
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    fs.writeFileSync(ra, "﻿" + COT.join(",") + "\n" + kq.map((r) => COT.map((c) => esc(r[c])).join(",")).join("\n"));
    console.log("Da ghi", ra);
  }
  if (args.includes("--upload")) {
    const key = process.env.CS_UPLOAD_API_KEY;
    if (!key) {
      console.log("--upload nhung THIEU CS_UPLOAD_API_KEY - bo qua upload.");
    } else if (kq.length < 50 && !chiMa) {
      console.log(`Chi tinh duoc ${kq.length} ma (< 50) - khong upload de khong xoa nham du lieu cu.`);
    } else {
      const res = await fetch(`${goc}/api/upload-kich-ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: JSON.stringify({ hang: kq, daydu: !chiMa }),
        signal: AbortSignal.timeout(120000),
      });
      console.log(`[upload kich-ban] HTTP ${res.status}`, (await res.text()).slice(0, 300));
    }
  }
  process.exit(0);
}
