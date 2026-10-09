// DUNG LAI LICH SU "LENH DA DONG" BANG ENGINE (ban NHAP - chi doc, KHONG ghi vao DB): chay engine tren gia lich su da dieu chinh cua tat ca ma, lay cac lenh MUA (lenh goc) va
// MUA THEM GIUA CHUNG tu ngay --tu, mo phong dung quy tac hien tai (chot 30% TP1 + 30% TP2, phan con lai giu den tin hieu BAN / cat lo / hoa von sau TP2) bang CHINH may trang thai
// cua engine (engine/loi/mayTrangThai.js), roi xuat cac dong theo dung dinh dang bang lenh_da_dong + thong ke bang lib/thongKeLenh.js de so voi so lieu hien tai tren web.
// KHAC web that: (1) du lieu theo NEN NGAY (gia vao = gia engine luc nen MUA, khong co gia trong phien / khung gio / web giu lenh); (2) khong co breadth nganh; (3) TP / cat lo tinh theo engine hom do.
// Chay: node engine/dich-vu/dungLaiLenhDaDong.mjs [--tu=2026-01-13] [--ra=thu-muc]
import fs from "node:fs";
import path from "node:path";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { layNenDieuChinh } from "../loi/nenDieuChinh.js";
import { gomTheoLenh, thongKeLenhDaDong } from "../../lib/thongKeLenh.js";

const args = process.argv.slice(2);
const opt = (ten, mac) => {
  const a = args.find((x) => x.startsWith(`--${ten}=`));
  return a ? a.slice(ten.length + 3) : mac;
};
const TU = opt("tu", "2026-01-13");
const RA = opt("ra", "dung-lai");
const GOC = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
const SO_NEN = 900;
const W1 = 30;
const W2 = 30;

const den = Math.floor(Date.now() / 1000);
const ngayVN = (giay) => new Date(giay * 1000 + 7 * 3600e3).toISOString().slice(0, 10);
const dv = await (await fetch(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=VNINDEX&from=${den - 6 * 365 * 86400}&to=${den}`)).json();
const vni = new Map(dv.t.map((t, i) => [ngayVN(t), dv.c[i]]));
const vniCuoi = [...vni.values()].at(-1);
const dsMa = (await (await fetch(`${GOC}/api/signals`, { headers: { "x-api-key": process.env.CS_UPLOAD_API_KEY || "" } })).json()).tinHieu.map((r) => r.ma).filter((m) => m !== "VNINDEX");
console.log(`${dsMa.length} ma, tu ${TU}`);

const LY_DO = { 1: "BAN", 2: "CAT_LO", 3: "BAO_VE_LAI", 4: "THOAT_KIJUN", 5: "CHOT_TP3" };
const lam = (x) => Number(x.toFixed(4));

// Cac dong TP / dong cua 1 vi the. v: { ma, iv, E, stop, tp1, tp2, jThoat (nen dong, -1 neu dang mo), lyDo, giaThoat, vongTP: [5,6], vongDong, bar: {open, high, ngay} }
function dongCuaViThe(v) {
  const { ma, iv, E, tp1, tp2, jThoat, lyDo, giaThoat, vongTP, vongDong, open, high, ngay, n } = v;
  const hang = [];
  const cuoi = jThoat >= 0 ? jThoat : n - 1;
  const goc = { ma, ngay_mua: ngay[iv], gia_mua: lam(E), theo_doi: false };
  let daTP1 = false;
  let daTP2 = false;
  for (let j = iv + 1; j <= cuoi; j++) {
    if (j === jThoat && (lyDo === "CAT_LO" || lyDo === "BAO_VE_LAI")) break; // cung nen cham stop / hoa von: stop xet truoc, khong tinh TP
    for (const [k, tp, w, vong] of [["TP1", tp1, W1, vongTP[0]], ["TP2", tp2, W2, vongTP[1]]]) {
      if (k === "TP1" && daTP1) continue;
      if (k === "TP2" && daTP2) continue;
      if (!(tp > E) || high[j] < tp) continue;
      const gia = open[j] >= tp ? open[j] : tp;
      hang.push({ ...goc, ngay_ban: ngay[j], gia_ban: lam(gia), lai_lo_pct: (gia / E - 1) * 100, so_phien: j - iv, ly_do: k, da_cham_tp: k, phan_chot_pct: w, vong });
      if (k === "TP1") daTP1 = true;
      else daTP1 = daTP2 = true;
    }
  }
  if (jThoat >= 0) {
    const conLai = 100 - (daTP1 ? W1 : 0) - (daTP2 ? W2 : 0);
    hang.push({ ...goc, ngay_ban: ngay[jThoat], gia_ban: lam(giaThoat), lai_lo_pct: (giaThoat / E - 1) * 100, so_phien: jThoat - iv, ly_do: lyDo, da_cham_tp: daTP2 ? "TP2" : daTP1 ? "TP1" : null, phan_chot_pct: conLai, vong: vongDong });
  }
  return hang;
}

const tatCa = [];
const loi = [];
let i = 0;
let soLenhGoc = 0;
let soLenhGiua = 0;
async function tho() {
  while (i < dsMa.length) {
    const ma = dsMa[i++];
    try {
      const nen = (await layNenDieuChinh(ma, SO_NEN).catch(() => layNenDieuChinh(ma, SO_NEN))).slice(-SO_NEN);
      if (nen.length < 300) throw new Error("it nen");
      const vniClose = nen.map((b) => vni.get(b.t) ?? vniCuoi);
      const hang = tinhTinHieuChoMa({ ma, nen, vniClose, san: "HOSE", ketQuaBreadth: { theoNganh: new Map(), trungBinh: 50 }, thamSo: { traChuoi: true } });
      const { open, high, low, close, kq } = hang._chuoi;
      const n = nen.length;
      const ngay = nen.map((b) => b.t);
      const giaThoatGoc = (j) => {
        const lyDo = kq.lyDoBanBar[j];
        if (lyDo === 2) return Math.min(open[j], kq.stopVaoTrongVongLap[j]);
        if (lyDo === 3) return Math.min(open[j], kq.giaVaoTrongVongLap[j]);
        return close[j];
      };
      for (let iv = 1; iv < n; iv++) {
        if (ngay[iv] < TU) continue;
        if (kq.buy[iv]) {
          const E = kq.giaVaoLuc[iv];
          let j = -1;
          for (let k = iv + 1; k < n; k++) if (kq.giuTrongVongLap[k] !== 1) { j = k; break; }
          if (!(E > 0)) continue;
          soLenhGoc++;
          tatCa.push(...dongCuaViThe({ ma, iv, E, tp1: kq.tp1VaoVong[iv], tp2: kq.tp2VaoVong[iv], jThoat: j, lyDo: j >= 0 ? LY_DO[kq.lyDoBanBar[j]] ?? "BAN" : null, giaThoat: j >= 0 ? giaThoatGoc(j) : null, vongTP: [5, 6], vongDong: 1, open, high, ngay, n }));
        }
        if (kq.muaGiuaSuKien[iv]) {
          const E = kq.muaGiuaGia[iv];
          let j = -1;
          for (let k = iv + 1; k < n; k++) if (kq.muaGiuaGiu[k] !== true) { j = k; break; }
          if (!(E > 0)) continue;
          soLenhGiua++;
          let lyDo = null;
          let giaThoat = null;
          if (j >= 0) {
            const cat = kq.muaGiuaCat[j];
            if (cat === 1) { lyDo = "CAT_LO"; giaThoat = Math.min(open[j], kq.muaGiuaStop[iv]); }
            else if (cat === 3) { lyDo = "BAO_VE_LAI"; giaThoat = Math.min(open[j], E); }
            else { lyDo = LY_DO[kq.lyDoBanBar[j]] ?? "BAN"; giaThoat = giaThoatGoc(j); }
          }
          tatCa.push(...dongCuaViThe({ ma, iv, E, tp1: kq.muaGiuaTP1[iv], tp2: kq.muaGiuaTP2[iv], jThoat: j, lyDo, giaThoat, vongTP: [7, 8], vongDong: 4, open, high, ngay, n }));
        }
      }
    } catch (e) {
      loi.push(`${ma}: ${e.message}`);
    }
    if ((i % 80) === 0) console.log(`  ${i}/${dsMa.length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, tho));
tatCa.sort((a, b) => a.ngay_ban.localeCompare(b.ngay_ban) || a.ma.localeCompare(b.ma));

// So voi so lieu hien tai tren web (cung khoang thoi gian)
let hienTai = [];
try {
  const r = await (await fetch(`${GOC}/api/lenh-da-dong-xem`, { headers: { "x-api-key": process.env.CS_UPLOAD_API_KEY || "" } })).json();
  hienTai = r.dong ?? [];
} catch {}
const tk = (ds) => {
  const t = thongKeLenhDaDong(ds);
  return { soLenh: t.soLenh, tyLeThang: t.tyLeThang, laiTB: t.laiTB, laiTBThang: t.laiTBThang, loTBThua: t.loTBThua, phienTB: t.phienTB, soDangChotTungPhan: t.soDangChotTungPhan, tyLeThangGomKhoaLai: t.tyLeThangGomKhoaLai, soDong: t.soDong };
};
const moi = tk(tatCa);
const cu = hienTai.length ? tk(hienTai.filter((x) => x.ngay_mua >= TU)) : null;
fs.mkdirSync(RA, { recursive: true });
fs.writeFileSync(path.join(RA, "lenh-da-dong-dung-lai.json"), JSON.stringify(tatCa, null, 1));
const COT = ["ma", "ngay_mua", "gia_mua", "ngay_ban", "gia_ban", "lai_lo_pct", "so_phien", "ly_do", "da_cham_tp", "phan_chot_pct", "vong"];
fs.writeFileSync(path.join(RA, "lenh-da-dong-dung-lai.csv"), "﻿" + COT.join(",") + "\n" + tatCa.map((r) => COT.map((c) => (typeof r[c] === "number" ? Number(r[c].toFixed(4)) : r[c] ?? "")).join(",")).join("\n"));
const lenhMoi = gomTheoLenh(tatCa);
fs.writeFileSync(path.join(RA, "tung-lenh-dung-lai.json"), JSON.stringify(lenhMoi, null, 1));
fs.writeFileSync(path.join(RA, "thong-ke.json"), JSON.stringify({ tu: TU, soMaLoi: loi.length, soLenhGoc, soLenhGiua, dungLai: moi, hienTaiTrenWeb: cu }, null, 2));
console.log(`Xong: ${soLenhGoc} lenh goc + ${soLenhGiua} lenh giua chung -> ${tatCa.length} dong (${loi.length} ma loi)`);
console.log("DUNG LAI :", JSON.stringify(moi));
console.log("HIEN TAI :", JSON.stringify(cu));
if (loi.length) console.log(loi.slice(0, 8).join("\n"));
process.exit(0);
