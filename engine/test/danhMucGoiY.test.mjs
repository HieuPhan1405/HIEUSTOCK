// Test tay cho lib/danhMucGoiY.js (danh muc goi y theo nguoi dung). Chay: node engine/test/danhMucGoiY.test.mjs
import { danhGiaMaDangCam, goiYDanhMuc, chiaTyTrong } from "../../lib/danhMucGoiY.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

const r = (ma, o = {}) => ({ ma, tin: "TRUNG LAP", gia: 20, stop_loss: 18, tp1: 22, tp2: 24, kijun: 19, diem: 1, nganh: `N_${ma}`, gtgd_tb20: 20, ...o });

// danh gia ma dang cam
ok("BAN -> ban", danhGiaMaDangCam(r("A", { tin: "BAN" }), 15).loai === "ban");
ok("NAM GIU nhung gia <= cat lo -> cat_lo", danhGiaMaDangCam(r("A", { tin: "NAM GIU", gia: 17.9 }), 20).loai === "cat_lo");
{
  const d = danhGiaMaDangCam(r("A", { tin: "NAM GIU", tp_da_cham: "TP1" }), 16);
  ok("NAM GIU -> giu, lai von +25%, nhac chot TP1", d.loai === "giu" && Math.abs(d.laiVonPct - 25) < 1e-9 && d.lyDo.includes("TP1"), JSON.stringify(d));
}
ok("trung lap duoi Kijun -> giam; tren Kijun -> theo_doi", danhGiaMaDangCam(r("A", { kijun: 21 }), 20).loai === "giam" && danhGiaMaDangCam(r("A", { kijun: 19 }), 20).loai === "theo_doi");
ok("khong co du lieu", danhGiaMaDangCam(null, 20).loai === "khong_du_lieu");
ok("cat lo khong ap dung khi he thong khong giu (stop cu)", danhGiaMaDangCam(r("A", { tin: "TRUNG LAP", gia: 17, kijun: 16 }), 20).loai === "theo_doi");

// chia ty trong
{
  const w = chiaTyTrong([{ rui: 0.05, he: 1 }, { rui: 0.1, he: 1 }], 4, 0.5);
  ok("rui ro nho -> ty trong lon hon; tong = muc tieu", w[0] > w[1] && Math.abs(w[0] + w[1] - 0.5) < 1e-9, JSON.stringify(w));
}
{
  const w = chiaTyTrong([{ rui: 0.03, he: 1 }, { rui: 0.1, he: 1 }, { rui: 0.1, he: 1 }], 10, 0.3);
  ok("tran 2/N moi ma (20%)", Math.max(...w) <= 0.2 + 1e-9, JSON.stringify(w));
}

// goi y tong
{
  const tatCa = [
    r("HOLD", { tin: "NAM GIU", diem: 2, nganh: "Ngan hang" }),
    r("SELL", { tin: "BAN" }),
    r("NEUT", { kijun: 19 }),
    r("M1", { tin: "MUA", diem: 3, nganh: "Ngan hang", gia: 20, stop_loss: 19 }),
    r("M2", { tin: "MUA", diem: 2.9, nganh: "Ngan hang" }),
    r("M3", { tin: "MUA", diem: 2.5, nganh: "Thep" }),
    r("M4", { tin: "MUA", diem: 2.4, nganh: "Thep", gtgd_tb20: 1 }),
    r("RUN", { tin: "NAM GIU", diem: 2.6, nganh: "Dau khi", vung_mua: "tren" }),
    r("IN", { tin: "NAM GIU", diem: 2.2, nganh: "Dau khi", vung_mua: "trong" }),
    r("BB", { nganh: "Hoa chat", gia: 10 }),
  ];
  const muaPhucHoi = [{ ma: "BB", cach: 1, giaB: 9.8, gia: 10, sl: 9, tp1: 11, tp2: 12, klDay: 2.5 }];
  const kq = goiYDanhMuc({ soMa: 5, dangCam: [{ ma: "hold", giaVon: 18 }, { ma: "SELL", giaVon: 25 }, { ma: "NEUT", giaVon: 20 }, { ma: "HOLD", giaVon: 1 }], tatCa, muaPhucHoi, vonTrieu: 500 });
  const loai = Object.fromEntries(kq.dangCam.map((x) => [x.ma, x.loai]));
  ok("dang cam: bo ma trung, phan loai dung", kq.dangCam.length === 3 && loai.HOLD === "giu" && loai.SELL === "ban" && loai.NEUT === "theo_doi", JSON.stringify(loai));
  ok("con lai = HOLD + NEUT, cho trong 3", kq.conLai.length === 2 && kq.them.length <= 3);
  const ma = kq.them.map((t) => t.ma);
  ok("them: tu MUA theo diem, bo ma duoi gia / GTGD thap / vuot gioi han nganh (Ngan hang da co HOLD + M1 = 2)", ma[0] === "M1" && !ma.includes("M2") && !ma.includes("M4") && !ma.includes("RUN"), ma.join(","));
  ok("them ca NAM GIU con trong vung mua (IN) va diem B (BB) khi con cho", ma.includes("M3") || ma.includes("IN") || ma.includes("BB"), ma.join(","));
  ok("tong ty trong + tien mat = 100%", Math.abs(kq.tongCoPhieu + kq.tienMat - 1) < 1e-9);
  ok("von 500 trieu -> so tien & so co phieu theo lo 100", kq.conLai.every((x) => x.soCp % 100 === 0 && x.soTien > 0));
  ok("ghi nhan ma bi bo vi gioi han nganh", kq.boQuaNganh.includes("M2"), kq.boQuaNganh.join(","));
}
{
  const tatCa = [r("A", { tin: "NAM GIU", diem: 3 }), r("B", { tin: "NAM GIU", diem: 2 }), r("C", { tin: "NAM GIU", diem: 1 })];
  const kq = goiYDanhMuc({ soMa: 2, dangCam: [{ ma: "A", giaVon: 10 }, { ma: "B", giaVon: 10 }, { ma: "C", giaVon: 10 }], tatCa });
  ok("cam vuot so ma muon nam: giu 2 ma diem cao, ma thap nhat -> du", kq.conLai.map((x) => x.ma).join() === "A,B" && kq.dangCam.find((x) => x.ma === "C").loai === "du");
}
{
  const kq = goiYDanhMuc({ soMa: 3, dangCam: [], tatCa: [r("X", { tin: "MUA" })] });
  ok("thieu ung vien: co tien mat va thieuMa", kq.them.length === 1 && kq.thieuMa === 2 && kq.tienMat > 0.5, JSON.stringify([kq.thieuMa, kq.tienMat]));
}
{
  const tatCa = [r("A", { tin: "NAM GIU", nganh: "Thep" }), r("M1", { tin: "MUA", diem: 3, nganh: "Ngan hang" }), r("M2", { tin: "MUA", diem: 2, nganh: "Thep" }), r("M3", { tin: "MUA", diem: 1, nganh: "Dau khi" })];
  const kq = goiYDanhMuc({ soMa: 4, dangCam: [{ ma: "A", giaVon: 15 }], tatCa, nganhChon: ["Thep", "Dau khi"] });
  ok("nganhChon: chi them ma thuoc nganh da chon, dem so ma bi bo", kq.them.map((t) => t.ma).join() === "M2,M3" && kq.boQuaViNganh === 1, JSON.stringify([kq.them.map((t) => t.ma), kq.boQuaViNganh]));
  const kq2 = goiYDanhMuc({ soMa: 4, dangCam: [{ ma: "A", giaVon: 15 }], tatCa, nganhChon: ["Ngan hang"] });
  ok("ma dang cam ngoai nganh chon van duoc danh gia (giu) kem co ngoaiNganh", kq2.dangCam[0].loai === "giu" && kq2.dangCam[0].ngoaiNganh === true && kq2.them.map((t) => t.ma).join() === "M1");
  ok("nganhChon rong = moi nganh", goiYDanhMuc({ soMa: 4, dangCam: [], tatCa }).them.length === 3);
}

if (loi) {
  console.log(`\n${loi} loi`);
  process.exit(1);
}
console.log("\nTat ca dat");
