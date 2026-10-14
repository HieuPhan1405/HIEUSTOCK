// NGHIEN CUU (2026-10-14): ty le thang theo TUNG MA - ma nao co ty le thang cao / thap trong lich su lenh cua he thong, va ty le do co ben (du doan duoc) khong?
// Engine HIEN TAI (mac dinh). Mua mo cua phien sau, thoat theo luat he thong, phi 0,4% / vong. Chi xet ma co >= 12 lenh. Ben vung: tach 2 giai doan (truoc / tu 05/2022), xem
// ma tot o giai doan 1 co con tot o giai doan 2 khong (tuong quan thu hang + tach nhom). Chay: node engine/dich-vu/nghienCuuTyLeThangTheoMa.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { mo, tb, f } from "./nghienCuuLenh.mjs";
import { phanLoaiVonHoa } from "../danh-sach/vonHoa.js";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json");
const kq = chayEngine({ cache, vni, thamSoThem: {} }); const ds = [];
for (const t of kq.lenh) { if (![1, 2, 3].includes(t.loai) || t.iv + 3 >= t.n) continue; const E = t.open[t.iv + 1]; if (!(E > 0) || !(t.S < E)) continue; const r = mo(t, { E, vao: t.iv + 1, banTu: t.iv + 3, S: t.S }); if (r) ds.push({ ma: t.ma, ngay: t.ngay, ret: r.ret }); }
const theoMa = new Map(); for (const x of ds) { if (!theoMa.has(x.ma)) theoMa.set(x.ma, []); theoMa.get(x.ma).push(x); }
const th = (g) => (100 * g.filter((x) => x.ret > 0).length) / g.length;
const tk = (ma, g) => ({ ma, n: g.length, th: th(g), tb: tb(g.map((x) => x.ret)), nhom: phanLoaiVonHoa(ma) ?? "-" });
const tat = [...theoMa].filter(([, g]) => g.length >= 12).map(([ma, g]) => tk(ma, g));
const tbThang = th(ds); console.log(`Tong ${ds.length} lenh, ${theoMa.size} ma; ty le thang chung ${f(tbThang, 1)}%, ${tat.length} ma co >= 12 lenh.`);
const in_ = (a) => a.map((x) => `${x.ma.padEnd(4)} n=${String(x.n).padStart(3)} thang ${f(x.th, 0).padStart(3)}% lai TB ${f(x.tb).padStart(6)}% (${x.nhom})`).join("\n   ");
const sxTh = [...tat].sort((a, b) => b.th - a.th || b.n - a.n);
console.log("\n== 20 MA TY LE THANG CAO NHAT (>= 12 lenh) ==\n   " + in_(sxTh.slice(0, 20)));
console.log("\n== 20 MA TY LE THANG THAP NHAT ==\n   " + in_(sxTh.slice(-20).reverse()));
const sxTb = [...tat].sort((a, b) => b.tb - a.tb);
console.log("\n== 15 MA LAI TB CAO NHAT ==\n   " + in_(sxTb.slice(0, 15)));
console.log("\n== 15 MA LAI TB THAP NHAT ==\n   " + in_(sxTb.slice(-15).reverse()));
// ben vung
const gd1 = (g) => g.filter((x) => x.ngay < "2022-05-01"), gd2 = (g) => g.filter((x) => x.ngay >= "2022-05-01");
const ben = [...theoMa].filter(([, g]) => gd1(g).length >= 8 && gd2(g).length >= 8).map(([ma, g]) => ({ ma, a: th(gd1(g)), b: th(gd2(g)), ta: tb(gd1(g).map((x) => x.ret)), tb2: tb(gd2(g).map((x) => x.ret)) }));
const rank = (arr) => { const o = arr.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = new Array(arr.length); o.forEach(([, i], k) => (r[i] = k)); return r; };
const corr = (x, y) => { const mx = tb(x), my = tb(y); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / Math.sqrt(b * c); };
console.log(`\n== BEN VUNG: ${ben.length} ma co >= 8 lenh o CA 2 giai doan ==`);
console.log(`   tuong quan hang ty le thang GD1 vs GD2: ${f(corr(rank(ben.map((x) => x.a)), rank(ben.map((x) => x.b))), 3)} | lai TB: ${f(corr(rank(ben.map((x) => x.ta)), rank(ben.map((x) => x.tb2))), 3)}`);
const top = [...ben].sort((x, y) => y.a - x.a), n4 = Math.floor(ben.length / 4);
const nhomTb = (g, k) => f(tb(g.map((x) => x[k])), 1);
console.log(`   Nhom 25% ma ty le thang CAO nhat o GD1 -> o GD2: thang ${nhomTb(top.slice(0, n4), "b")}% (lai TB ${nhomTb(top.slice(0, n4), "tb2")}%)`);
console.log(`   Nhom 25% ma ty le thang THAP nhat o GD1 -> o GD2: thang ${nhomTb(top.slice(-n4), "b")}% (lai TB ${nhomTb(top.slice(-n4), "tb2")}%)`);
console.log(`   Chung o GD2: thang ${nhomTb(ben, "b")}% (lai TB ${nhomTb(ben, "tb2")}%)`);
const topTb = [...ben].sort((x, y) => y.ta - x.ta);
console.log(`   Nhom 25% ma LAI TB cao nhat o GD1 -> GD2: thang ${nhomTb(topTb.slice(0, n4), "b")}%, lai TB ${nhomTb(topTb.slice(0, n4), "tb2")}% | 25% thap nhat -> thang ${nhomTb(topTb.slice(-n4), "b")}%, lai TB ${nhomTb(topTb.slice(-n4), "tb2")}%`);
// ban than 20 ma cao nhat tong the, ben khong?
const top20 = sxTh.slice(0, 20).map((x) => x.ma), bot20 = sxTh.slice(-20).map((x) => x.ma);
const gd2Of = (arr) => ds.filter((x) => arr.includes(x.ma) && x.ngay >= "2022-05-01"); const a2 = gd2Of(top20), b2 = gd2Of(bot20);
console.log(`   (Thien lech nhin lai) 20 ma cao nhat toan ky: o GD2 thang ${f(th(a2), 0)}% n=${a2.length}; 20 ma thap nhat toan ky: o GD2 thang ${f(th(b2), 0)}% n=${b2.length}`);
// theo nhom von hoa
for (const nh of ["VN30", "Midcap", "Smallcap"]) { const g = ds.filter((x) => (phanLoaiVonHoa(x.ma) ?? "-") === nh); console.log(`   Nhom ${nh}: n=${g.length} thang ${f(th(g), 1)}% lai TB ${f(tb(g.map((x) => x.ret)))}%`); }
process.exit(0);
