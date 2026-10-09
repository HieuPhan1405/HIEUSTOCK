// Test tay cho engine/loi/mocTiepTheo.js ("Ma theo doi": moc diem (+) sap cham). Chay: node engine/test/mocTiepTheo.test.mjs
import { tinhMocTiepTheo } from "../loi/mocTiepTheo.js";

let loi = 0;
const ok = (ten, dk, them = "") => { if (!dk) { loi++; console.log("SAI:", ten, them); } else console.log("ok:", ten); };
const gan = (a, b) => Math.abs(a - b) < 1e-9;

const a = tinhMocTiepTheo({ gia: 18.65, cloudTop: 18.1, cloudBot: 17, cbTop: 20.35, cbBot: 17.825, totalScore: 0.49 });
ok("tren may, trong vung can bang -> moc = dinh can bang", a.loai === "CAN BANG" && a.gia === 20.35 && gan(a.cachPct, (20.35 / 18.65 - 1) * 100), JSON.stringify(a));
ok("diem uoc tinh = diem + 1.5", gan(a.diemNeuVuot, 1.99));

const b = tinhMocTiepTheo({ gia: 10, cloudTop: 11, cloudBot: 10.5, cbTop: 12, cbBot: 11.5, totalScore: -2 });
ok("duoi may: moc may gan hon can bang", b.loai === "MAY" && b.gia === 10.5 && gan(b.cachPct, 5), JSON.stringify(b));

const c = tinhMocTiepTheo({ gia: 10, cloudTop: 10.2, cloudBot: 9, cbTop: 10.1, cbBot: 9.5, totalScore: 0 });
ok("trong may + trong can bang: lay moc gan nhat (can bang 1%)", c.loai === "CAN BANG" && c.gia === 10.1, JSON.stringify(c));

const d = tinhMocTiepTheo({ gia: 20, cloudTop: 15, cloudBot: 14, cbTop: 16, cbBot: 15, totalScore: 3 });
ok("tren het moi moc -> khong co moc (0, \"\")", d.gia === 0 && d.loai === "" && d.cachPct === 0 && d.diemNeuVuot === 4.5, JSON.stringify(d));

const e = tinhMocTiepTheo({ gia: 10, cloudTop: NaN, cloudBot: NaN, cbTop: 12, cbBot: 11, totalScore: 0 });
ok("may chua co du lieu (NaN) -> chi xet can bang", e.loai === "CAN BANG" && e.gia === 11, JSON.stringify(e));

console.log(loi ? `${loi} LOI` : "TAT CA OK");
process.exit(loi ? 1 : 0);
