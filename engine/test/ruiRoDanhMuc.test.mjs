// Test tay: node engine/test/ruiRoDanhMuc.test.mjs
import { canhTheoNgay, phanTichRuiRo, chamDiemSucKhoe, nhanXetRuiRo } from "../../lib/ruiRoDanhMuc.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };
const gan = (a, b, e) => Math.abs(a - b) <= e;

dat("canh theo ngay: ffill, null truoc nen dau", JSON.stringify(canhTheoNgay(["a", "b", "c", "d"], [{ t: "b", c: 10 }, { t: "d", c: 12 }])) === "[null,10,10,12]");

// du lieu gia lap: 260 phien, VN-Index ngau nhien (hat giong co dinh); A = 1,5 x VNI, B = 0,5 x VNI + nhieu rieng, C = doc lap
let s = 7;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5) * 0.04;
const N = 261;
const ngay = Array.from({ length: N }, (_, i) => new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString().slice(0, 10));
const rv = Array.from({ length: N - 1 }, rnd);
const nhieu = Array.from({ length: N - 1 }, rnd);
const doc = Array.from({ length: N - 1 }, rnd);
const chuoi = (r) => r.reduce((a, x) => (a.push(a[a.length - 1] * (1 + x)), a), [100]);
const vni = chuoi(rv);
const gia = { A: chuoi(rv.map((x) => 1.5 * x)), B: chuoi(rv.map((x, i) => 0.5 * x + 0.5 * nhieu[i])), C: chuoi(doc), MOI: [...Array(N - 50).fill(null), ...Array(50).fill(10)] };
const rr = phanTichRuiRo({ ngay, vni, gia, giaTri: { A: 60e6, B: 30e6, C: 10e6, MOI: 5e6 }, gtgd: { A: 1e9, B: 1e8, C: 5e6 }, tienMat: 0, no: 50e6 });
dat("ma moi niem yet (50 phien) bi loai khoi tinh rui ro", rr.lichSuNgan.join() === "MOI" && rr.dsMa.join() === "A,B,C" && rr.soPhien === N - 1);
const m = Object.fromEntries(rr.ma.map((x) => [x.ma, x]));
dat("beta A ~ 1,5; beta B ~ 0,5; beta C ~ 0", gan(m.A.beta, 1.5, 1e-9) && gan(m.B.beta, 0.5, 0.15) && gan(m.C.beta, 0, 0.2), `${m.A.beta} ${m.B.beta} ${m.C.beta}`);
dat("dong gop rui ro cong lai = 1, A gánh nhieu hon ty trong von", gan(rr.ma.reduce((x, y) => x + y.rc, 0), 1, 1e-9) && m.A.rc > m.A.w);
dat("he so da dang hoa >= 1, so cuoc doc lap = DR^2", rr.dr >= 1 && gan(rr.soCuocDocLap, rr.dr * rr.dr, 1e-12));
dat("bien dong A = 1,5 x VN-Index", gan(m.A.vol, 1.5 * rr.volV, 1e-6));
dat("VaR / CVaR duong, CVaR >= VaR", rr.var95 > 0 && rr.cvar95 >= rr.var95);
dat("chuoi chuan 100 bat dau 100, dai = so phien + 1", rr.chuoi.danhMuc[0] === 100 && rr.chuoi.danhMuc.length === N);
dat("4 kich ban soc (3 theo beta + 1 dot giam that)", rr.kichBan.length === 4 && gan(rr.kichBan[1].portPct, rr.betaP * -10, 1e-9));
// GT 105tr (gom MOI), no 50tr: soc -20% x beta -> ty le ky quy
const k20 = rr.kichBan[2];
const ts = 105e6 * (1 + k20.portPct / 100);
dat("ty le ky quy sau soc tinh dung", gan(k20.tyLeKyQuy, ((ts - 50e6) / ts) * 100, 1e-6), k20.tyLeKyQuy);
dat("thanh khoan: C 10tr / (20% x 5tr) = 10 phien, A 0,3 phien", gan(rr.thanhKhoan.ds.find((x) => x.ma === "C").soPhien, 10, 1e-9) && rr.thanhKhoan.ds.find((x) => x.ma === "A").soPhien < 1);
dat("can bang bien dong giam bien dong", rr.canBangBienDong.volP < rr.volP);

// cham diem + nhan xet
const pb = { soMaCoGia: 4, chiTietDiem: { daDang: 30, kyThuat: 40, ruiRo: 20 }, nganh: [{ ten: "Thép", tyTrong: 0.5 }], nganhDangSong: false, margin: { giamDenCanhBao: 8, donBay: 2 }, taiSan: { nav: 55e6, coPhieu: 105e6 } };
const d = chamDiemSucKhoe(pb, rr);
dat("diem 0..100 = tong 4 tru, moi tru 0..25", d.diem === d.tru.daDang + d.tru.ruiRo + d.tru.xuHuong + d.tru.thanhKhoan && Object.values(d.tru).every((x) => x >= 0 && x <= 25), JSON.stringify(d));
dat("margin mong (8%) bi tru diem rui ro", d.tru.ruiRo <= 15, d.tru.ruiRo);
dat("khong co du lieu rui ro -> van cham duoc (dayDu = false)", chamDiemSucKhoe(pb, null).dayDu === false);
const nx = nhanXetRuiRo(rr, pb);
dat("nhan xet: co 'Rui ro don vao mot ma' (A), nang truoc", nx.some((x) => x.tieuDe === "Rủi ro dồn vào một mã" && /^A /.test(x.noiDung)) && nx.every((x, i) => i === 0 || nx[i - 1].muc <= x.muc), JSON.stringify(nx.map((x) => x.tieuDe)));
dat("nhan xet: beta + margin noi tai san rong giam manh hon", nx.some((x) => x.tieuDe === "Độ nhạy với thị trường" && /margin/.test(x.noiDung)));
dat("du lieu ngan -> null", phanTichRuiRo({ ngay: ngay.slice(0, 50), vni: vni.slice(0, 50), gia: {}, giaTri: { A: 1 } }) === null);
console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
