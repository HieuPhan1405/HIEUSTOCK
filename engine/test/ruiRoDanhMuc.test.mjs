// Test tay: node engine/test/ruiRoDanhMuc.test.mjs
import { canhTheoNgay, phanTichRuiRo, chamDiemSucKhoe, nhanXetRuiRo, toiUuTyTrong, tyTrongBienDongNhoNhat, covLedoitWolf, tinhRuiRoMo, duBaoSutGiam } from "../../lib/ruiRoDanhMuc.js";
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
dat("bien dong du bao = 1/2 mau + 1/2 EWMA (khac mau 1 nam, cung bac)", rr.volP > 0 && rr.volP1Nam > 0 && Math.abs(rr.volP / rr.volP1Nam - 1) < 0.5);
dat("VaR = 1,645 x bien dong ngay du bao", gan(rr.var95, (1.645 * rr.volP) / Math.sqrt(250), 1e-9));
dat("du bao sut giam 6 thang: co trung vi <= 80% <= 95%, tinh them tren tai san rong khi margin", rr.duBao && rr.duBao.trungVi <= rr.duBao.p80 && rr.duBao.p80 <= rr.duBao.p95 && rr.duBao.nav && rr.duBao.nav.p80 > rr.duBao.p80);
dat("hieu qua: Sharpe / bat tang / bat giam la so", ["sharpe", "sortino", "batTang", "batGiam"].every((k) => Number.isFinite(rr.hieuQua[k])));
dat("khung hoang that: 6 dot, A B C MOI chua co trong du lieu -> uoc theo beta (MOI beta 1)", rr.khungHoang.length === 6 && rr.khungHoang.every((k) => k.soMaUoc === 4) && gan(rr.khungHoang[0].portPct, ((60 * m.A.beta + 30 * m.B.beta + 10 * m.C.beta + 5) / 105) * rr.khungHoang[0].vniPct, 1e-9));

// toi uu ty trong
const tu = toiUuTyTrong(rr, { tran: 0.6 });
dat("toi uu: tong ty trong = 1, moi ma <= tran", gan(tu.ma.reduce((s, x) => s + x.wToiUu, 0), 1, 1e-6) && tu.ma.every((x) => x.wToiUu <= 0.6 + 1e-6));
dat("toi uu: bien dong du bao sau < truoc, A (bien dong lon) giam ty trong", tu.sau.volP < tu.truoc.volP && tu.ma.find((x) => x.ma === "A").doi < 0, JSON.stringify(tu.ma));
const tu2 = toiUuTyTrong(rr, { tran: 0.3, boQua: ["C"] });
dat("toi uu: bo ma can thoat, 2 ma con lai tran nang len 1/2", tu2.ma.length === 2 && tu2.boQua.join() === "C" && tu2.tran === 0.5);
dat("toi uu: < 2 ma -> null", toiUuTyTrong(rr, { boQua: ["A", "B"] }) === null);
const S2 = [[0.04, 0], [0, 0.01]];
const w2 = tyTrongBienDongNhoNhat(S2, 1);
dat("bien dong nho nhat 2 ma doc lap: w ~ nghich dao phuong sai (0,2 / 0,8)", gan(w2[0], 0.2, 1e-3) && gan(w2[1], 0.8, 1e-3), JSON.stringify(w2));
dat("bien dong nho nhat co tran 0,6: ma it bien dong cham tran", gan(tyTrongBienDongNhoNhat(S2, 0.6)[1], 0.6, 1e-6));
const LW = covLedoitWolf(rr.loiSuat.R);
dat("Ledoit-Wolf: doi xung, duong cheo bang phuong sai mau (T)", LW.every((r, i) => r.every((x, j) => gan(x, LW[j][i], 1e-15))) && LW[0][0] > 0);

// rui ro mo
const rm = tinhRuiRoMo([{ ma: "X", gia: 20, giaTri: 40e6, moc: [18, 15, null] }, { ma: "Y", gia: 10, giaTri: 20e6, moc: [11] }, { ma: "Z", gia: 5, giaTri: 10e6, moc: [] }], 100e6);
dat("rui ro mo: X moc gan nhat 18 -> mat 10% x 40tr = 4tr = 4% tai san rong", gan(rm.tongMat, 4e6, 1e-6) && gan(rm.navPct, 4, 1e-9) && rm.ds[0].ma === "Y");
dat("rui ro mo: Y da duoi moc, Z khong ro moc", rm.daCham.join() === "Y" && rm.khongRo.join() === "Z");

// cham diem + nhan xet
const pb = { soMaCoGia: 4, chiTietDiem: { daDang: 30, kyThuat: 40, ruiRo: 20 }, nganh: [{ ten: "Thép", tyTrong: 0.5 }], nganhDangSong: false, margin: { giamDenCanhBao: 8, donBay: 2 }, taiSan: { nav: 55e6, coPhieu: 105e6 } };
const d = chamDiemSucKhoe(pb, rr);
dat("diem 0..100 = tong 4 tru, moi tru 0..25", d.diem === d.tru.daDang + d.tru.ruiRo + d.tru.xuHuong + d.tru.thanhKhoan && Object.values(d.tru).every((x) => x >= 0 && x <= 25), JSON.stringify(d));
dat("margin mong (8%) bi tru diem rui ro", d.tru.ruiRo <= 15, d.tru.ruiRo);
dat("khong co du lieu rui ro -> van cham duoc (dayDu = false)", chamDiemSucKhoe(pb, null).dayDu === false);
const nx = nhanXetRuiRo(rr, pb);
dat("nhan xet: co 'Rui ro don vao mot ma' (A), nang truoc", nx.some((x) => x.tieuDe === "Rủi ro dồn vào một mã" && /^A /.test(x.noiDung)) && nx.every((x, i) => i === 0 || nx[i - 1].muc <= x.muc), JSON.stringify(nx.map((x) => x.tieuDe)));
dat("nhan xet: beta + margin noi tai san rong giam manh hon", nx.some((x) => x.tieuDe === "Độ nhạy với thị trường" && /margin/.test(x.noiDung)));
dat("bang du bao sut giam: bien dong cao hon -> sut giam 80% khong thap hon", [15, 24, 28, 33, 40, 50].map((v) => duBaoSutGiam(v).p80).every((x, i, a) => i === 0 || x >= a[i - 1]));
rr.toiUu = toiUuTyTrong(rr, { tran: 0.6 });
dat("nhan xet: co du bao 6 thang + khung hoang cu", nhanXetRuiRo(rr, pb).some((x) => x.tieuDe === "6 tháng tới có thể sụt bao nhiêu") && nhanXetRuiRo(rr, pb).some((x) => x.tieuDe === "Nếu khủng hoảng cũ lặp lại"));
dat("du lieu ngan -> null", phanTichRuiRo({ ngay: ngay.slice(0, 50), vni: vni.slice(0, 50), gia: {}, giaTri: { A: 1 } }) === null);
console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
