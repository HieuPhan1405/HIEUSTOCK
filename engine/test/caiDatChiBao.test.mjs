// Test tay cho lib/caiDatChiBao.js. Chay: node engine/test/caiDatChiBao.test.mjs
import { DINH_NGHIA, thamSo, kieuNet, datThamSo, datKieu, macDinhLai, nhanDong, lamSach, lamSachThamSo, hexRgba, CO_CAI_DAT } from "../../lib/caiDatChiBao.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

ok("mac dinh: RSI 14 / 70 / 30, Ichimoku 9-17-26-26", thamSo(null, "rsi").n === 14 && thamSo(null, "rsi").mua === 70 && thamSo({}, "ichimoku").kijun === 17 && thamSo(undefined, "ichimoku").dichMay === 26);
const cd1 = datThamSo(null, "rsi", "n", "21");
ok("dat RSI chu ky = 21 (chuoi -> so), cac thong so khac giu mac dinh", thamSo(cd1, "rsi").n === 21 && thamSo(cd1, "rsi").mua === 70);
ok("khong sua cd cu (bat bien)", thamSo(null, "rsi").n === 14);
ok("ngoai khoang bi ep ve khoang: RSI 5000 -> 200, 0 -> 2", thamSo(datThamSo(null, "rsi", "n", 5000), "rsi").n === 200 && thamSo(datThamSo(null, "rsi", "n", 0), "rsi").n === 2);
ok("so thap phan dau phay: Bollinger 2,5 -> 2.5", thamSo(datThamSo(null, "boll", "k", "2,5"), "boll").k === 2.5);
ok("so nguyen lam tron: 13,7 -> 14", lamSachThamSo(DINH_NGHIA.rsi.thamSo[0], "13,7") === 14);
ok("chuoi rac -> mac dinh", lamSachThamSo(DINH_NGHIA.rsi.thamSo[0], "abc") === 14 && lamSachThamSo(DINH_NGHIA.rsi.thamSo[0], "") === 14);
ok("lua chon AVPT: gia tri la -> Balanced", thamSo(datThamSo(null, "tvAvpt", "profile", "Xyz"), "tvAvpt").profile === "Balanced" && thamSo(datThamSo(null, "tvAvpt", "profile", "Shallow"), "tvAvpt").profile === "Shallow");
ok("khoa khong ton tai khong gay loi", Object.keys(thamSo(null, "khongCo")).length === 0 && datThamSo(null, "khongCo", "x", 1) != null);

const cd2 = datKieu(null, "ma", "ma1", { mau: "#112233", day: 3, hien: false });
ok("kieu net: mau / day / an duoc luu", kieuNet(cd2, "ma", "ma1").mau === "#112233" && kieuNet(cd2, "ma", "ma1").day === 3 && kieuNet(cd2, "ma", "ma1").hien === false && kieuNet(cd2, "ma", "ma1").daSua);
ok("kieu net chua sua: mac dinh, daSua false", kieuNet(null, "ma", "ma2").mau === "#2DD4BF" && !kieuNet(null, "ma", "ma2").daSua && kieuNet(null, "ma", "ma2").hien);
ok("mau sai dinh dang bi bo (giu mac dinh)", kieuNet(datKieu(null, "ma", "ma1", { mau: "do" }), "ma", "ma1").mau === "#F472B6");
ok("do day ep ve 1..5", kieuNet(datKieu(null, "ma", "ma1", { day: 99 }), "ma", "ma1").day === 5 && kieuNet(datKieu(null, "ma", "ma1", { day: -3 }), "ma", "ma1").day === 1);

const cd3 = datKieu(datThamSo(null, "ma", "ma1", 10), "ma", "ma1", { day: 2 });
const cd4 = macDinhLai(cd3, "ma");
ok("macDinhLai xoa thong so + kieu cua dung chi bao", thamSo(cd4, "ma").ma1 === 20 && kieuNet(cd4, "ma", "ma1").day === 1);
ok("macDinhLai giu chi bao khac", thamSo(macDinhLai(datThamSo(cd1, "ma", "ma1", 10), "ma"), "rsi").n === 21);

ok("nhan dong: RSI 21 / MACD 8·17·5 / MA 5/10/30", nhanDong("rsi", cd1, "RSI 14") === "RSI 21" && nhanDong("macd", datThamSo(datThamSo(datThamSo(null, "macd", "nhanh", 8), "macd", "cham", 17), "macd", "tinHieu", 5), "MACD") === "MACD 8·17·5" && nhanDong("ma", datThamSo(datThamSo(datThamSo(null, "ma", "ma1", 5), "ma", "ma2", 10), "ma", "ma3", 30), "MA") === "MA 5/10/30");
ok("nhan dong chi bao khong co thong so dong: giu nhan goc", nhanDong("mcdx", null, "MCDX") === "MCDX");

ok("lamSach bo khoa la, ep gia tri, bo mau sai", (() => {
  const x = lamSach({ thamSo: { rsi: { n: 9999, la: 1 }, khongCo: { a: 1 } }, kieu: { ma: { ma1: { mau: "#abcdef", day: 2, hien: false }, ma2: { mau: "xxx" } } } });
  return x.thamSo.rsi.n === 200 && x.thamSo.rsi.la === undefined && x.thamSo.khongCo === undefined && x.kieu.ma.ma1.mau === "#abcdef" && x.kieu.ma.ma1.hien === false && x.kieu.ma.ma2 === undefined;
})());
ok("lamSach(null / rac) -> rong", JSON.stringify(lamSach(null)) === '{"thamSo":{},"kieu":{}}' && JSON.stringify(lamSach("x")) === '{"thamSo":{},"kieu":{}}');
ok("hexRgba: #22C55E 0,75 -> rgba(34,197,94,0.75)", hexRgba("#22C55E", 0.75) === "rgba(34,197,94,0.75)");
ok("CO_CAI_DAT: rsi co, ichimoku co, khong ton tai khong", CO_CAI_DAT("rsi") && CO_CAI_DAT("ichimoku") && !CO_CAI_DAT("abc"));
ok("moi thong so mac dinh nam trong [min, max] (khong thieu cau hinh)", Object.values(DINH_NGHIA).every((d) => d.thamSo.every((p) => p.loai === "chon" || (p.mac >= p.min && p.mac <= p.max))));
ok("mau mac dinh la #RRGGBB", Object.values(DINH_NGHIA).every((d) => d.kieu.every((n) => /^#[0-9A-Fa-f]{6}$/.test(n.mau))));

console.log(loi ? `\n${loi} LOI` : "\nTAT CA DAT");
process.exit(loi ? 1 : 0);
