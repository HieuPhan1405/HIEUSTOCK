// Test tay cho lib/volumeProfile.js. Chay: node engine/test/volumeProfile.test.mjs
import { tinhHoSoKhoiLuong, chonNenChoHoSo, chuanBiNenGio } from "../../lib/volumeProfile.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;

// 1. Bao toan khoi luong + chia deu theo khoang gia
{
  const p = tinhHoSoKhoiLuong([{ o: 10, h: 20, l: 10, c: 20, v: 1000 }], { soHang: 10 });
  ok("1 nen 10..20, 10 hang: moi hang 100", p.hang.every((h) => gan(h.kl, 100)), JSON.stringify(p.hang.map((h) => h.kl)));
  ok("tong khoi luong duoc bao toan", gan(p.hang.reduce((s, h) => s + h.kl, 0), 1000) && gan(p.tong, 1000));
  ok("nen tang -> toan bo vao cot 'tang'", p.hang.every((h) => gan(h.tang, 100) && h.giam === 0));
  ok("bien gia dung", gan(p.giaThap, 10) && gan(p.giaCao, 20) && gan(p.buoc, 1));
}
// 2. POC + vung gia tri
{
  const nen = [
    { o: 18, h: 20, l: 10, c: 12, v: 1000 }, // giam (dong cua < mo cua), trai deu 10..20 (100 / hang)
    { o: 14, h: 15, l: 14, c: 15, v: 5000 }, // tang, don vao hang 14..15
    { o: 15, h: 16, l: 15, c: 15.5, v: 2000 }, // tang, hang 15..16
  ];
  const p = tinhHoSoKhoiLuong(nen, { soHang: 10 });
  ok("POC o hang 14..15", p.iPoc === 4 && gan(p.poc, 14.5), `${p.iPoc} ${p.poc}`);
  ok("khoi luong hang POC = 5100 (5000 tang + 100 giam)", gan(p.hang[4].kl, 5100) && gan(p.hang[4].tang, 5000) && gan(p.hang[4].giam, 100));
  ok("vung gia tri 70% = 14..16 (5100 + 2100 = 7200 / 8000 = 90% >= 70%)", gan(p.val, 14) && gan(p.vah, 16), `${p.val} ${p.vah}`);
  ok("VAL <= POC <= VAH", p.val <= p.poc && p.poc <= p.vah);
  const tong = p.hang.reduce((s, h) => s + h.kl, 0);
  ok("tong = 8000", gan(tong, 8000));
}
// 3. Nen dung 1 gia (cao = thap) va nen loi
{
  const p = tinhHoSoKhoiLuong([{ o: 10, h: 12, l: 10, c: 11, v: 100 }, { o: 11, h: 11, l: 11, c: 11, v: 900 }, { o: 0, h: 0, l: 0, c: 0, v: 50 }, { o: 11, h: 12, l: 11, c: 12, v: 0 }], { soHang: 4 });
  ok("nen 1 gia don het vao 1 hang", gan(p.hang[2].kl, 900 + 25), JSON.stringify(p.hang.map((h) => h.kl)));
  ok("bo qua nen loi / KL = 0", gan(p.tong, 1000));
  ok("khong du du lieu -> null", tinhHoSoKhoiLuong([]) === null && tinhHoSoKhoiLuong([{ o: 5, h: 5, l: 5, c: 5, v: 10 }]) === null && tinhHoSoKhoiLuong(null) === null);
}
// 4. Nen cham dung bien tren khong bi roi ra ngoai mang
{
  const p = tinhHoSoKhoiLuong([{ o: 10, h: 20, l: 10, c: 20, v: 100 }, { o: 20, h: 20, l: 20, c: 20, v: 40 }], { soHang: 5 });
  ok("gia = dinh cao nhat -> vao hang cuoi", gan(p.hang[4].kl, 20 + 40), JSON.stringify(p.hang.map((h) => h.kl)));
}
// 5. chonNenChoHoSo: uu tien nen gio, ghep voi nen bieu do truoc vung phu
{
  const ngay = ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09"].map((t, i) => ({ t, o: 10 + i, h: 11 + i, l: 9 + i, c: 10.5 + i, v: 1000 }));
  const giay = (d, h) => Math.floor(Date.parse(`${d}T0${h}:00:00Z`) / 1000); // 02:00Z = 9h sang VN
  const gio = chuanBiNenGio([
    [giay("2026-01-07", 2), 12, 12.5, 11.5, 12.2, 400], [giay("2026-01-07", 6), 12.2, 13, 12, 12.5, 600],
    [giay("2026-01-08", 2), 13, 14, 12.5, 13.5, 1000],
    [giay("2026-01-09", 3), 14, 15, 13, 14.5, 1000],
  ]);
  ok("chuanBiNenGio: 4 nen, co ngay VN", gio.length === 4 && gio[0].ngay === "2026-01-07" && gio[3].ngay === "2026-01-09");
  const a = chonNenChoHoSo({ nenBieuDo: ngay, nenGio: gio, tuNgay: "2026-01-05", denNgay: "2026-01-08" });
  ok("ghep: 2 nen ngay (05, 06) + 3 nen gio (07, 07, 08)", a.soBieuDo === 2 && a.soGio === 3 && a.nguon === "ghep", JSON.stringify(a));
  const b = chonNenChoHoSo({ nenBieuDo: ngay, nenGio: gio, tuNgay: "2026-01-07", denNgay: "2026-01-09" });
  ok("toan nen gio", b.soBieuDo === 0 && b.soGio === 4 && b.nguon === "gio");
  const c = chonNenChoHoSo({ nenBieuDo: ngay, nenGio: null, tuNgay: "2026-01-06", denNgay: "2026-01-08" });
  ok("khong co nen gio -> dung nen bieu do", c.soBieuDo === 3 && c.soGio === 0 && c.nguon === "bieuDo");
  const d = chonNenChoHoSo({ nenBieuDo: ngay, nenGio: gio, tuNgay: "2026-01-05", denNgay: "2026-01-06" });
  ok("khoang nam truoc vung nen gio -> chi nen bieu do", d.soBieuDo === 2 && d.soGio === 0);
  ok("khoi luong khong bi dem 2 lan", gan(a.nen.reduce((s, x) => s + x.v, 0), 1000 + 1000 + 400 + 600 + 1000));
}
// 6. Chuan hoa gia nen gio theo nen ngay khi lech he so dieu chinh
{
  const ngay = [{ t: "2026-02-02", o: 10, h: 11, l: 9, c: 10, v: 100 }];
  const t = Math.floor(Date.parse("2026-02-02T03:00:00Z") / 1000);
  const gio = chuanBiNenGio([[t, 20, 22, 18, 20, 100]]); // nen gio chua dieu chinh (gap doi)
  const a = chonNenChoHoSo({ nenBieuDo: ngay, nenGio: gio, tuNgay: "2026-02-02", denNgay: "2026-02-02" });
  ok("gia nen gio duoc co ve gia nen ngay (x0,5)", gan(a.nen[0].h, 11) && gan(a.nen[0].l, 9) && gan(a.nen[0].c, 10), JSON.stringify(a.nen[0]));
}
// 7. Khung tuan: nen tuan chua ngay dau co nen gio thi bo, lay nen gio
{
  const tuan = [{ t: "2026-01-05", o: 10, h: 12, l: 9, c: 11, v: 5000 }, { t: "2026-01-12", o: 11, h: 13, l: 10, c: 12, v: 6000 }];
  const t = Math.floor(Date.parse("2026-01-13T03:00:00Z") / 1000);
  const gio = chuanBiNenGio([[t, 11, 12, 10.5, 11.5, 700]]);
  const a = chonNenChoHoSo({ nenBieuDo: tuan, nenGio: gio, tuNgay: "2026-01-05", denNgay: "2026-01-18", soNgayMoiNen: 7 });
  ok("tuan 05/01 dung nen tuan, tuan 12/01 (co nen gio tu 13/01) dung nen gio", a.soBieuDo === 1 && a.soGio === 1, JSON.stringify({ a: a.soBieuDo, b: a.soGio }));
}

console.log(loi ? `\n${loi} LOI` : "\nTat ca dat.");
process.exit(loi ? 1 : 0);
