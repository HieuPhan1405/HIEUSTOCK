// Test tay: node engine/test/chuYTrongPhien.test.mjs
import { suKienGia, suKienHeThong, chuYTrongPhien } from "../../lib/chuYTrongPhien.js";

let loi = 0;
const dat = (ten, dk) => {
  if (dk) console.log("ok:", ten);
  else { console.log("SAI:", ten); loi++; }
};
const khoa = (ds) => ds.map((x) => x.khoa);

// Duong phang 100 (Tenkan = Kijun = 100): nen truoc o tren, nen nay dong cua duoi -> thung
{
  const b = Array.from({ length: 60 }, (_, i) => ({ t: `d${i}`, h: 101, l: 99, c: 100 })); // phang: Tenkan = Kijun = 100
  b.push({ t: "d60", h: 101, l: 99, c: 100.6 }); // phien truoc: tren Tenkan
  b.push({ t: "d61", h: 100.8, l: 98.5, c: 99 }); // hien tai: dong cua duoi Tenkan
  const ks = suKienGia(b);
  const k = khoa(ks);
  dat("thung Tenkan va Kijun khi dong cua tu tren xuong duoi duong phang 100", k.includes("thung_tenkan") && k.includes("thung_kijun"), k.join());
  dat("thung la mau do, loai xau", ks.find((x) => x.khoa === "thung_tenkan").loai === "xau");
}
{
  const b = Array.from({ length: 60 }, (_, i) => ({ t: `d${i}`, h: 101, l: 99, c: 100 }));
  b.push({ t: "d60", h: 100.4, l: 99, c: 99.4 }); // truoc: duoi
  b.push({ t: "d61", h: 102, l: 99.3, c: 101.5 }); // nay: vuot len
  const k = khoa(suKienGia(b));
  dat("vuot len Tenkan / Kijun", k.includes("vuot_tenkan") && k.includes("vuot_kijun"), k.join());
}
// Cham Kijun roi bat lai (chua vuot, chua thung): truoc va nay deu o tren, low <= Kijun
{
  const b = Array.from({ length: 60 }, (_, i) => ({ t: `d${i}`, h: 101, l: 99, c: 100 }));
  b.push({ t: "d60", h: 103, l: 100.2, c: 102 });
  b.push({ t: "d61", h: 103, l: 99.8, c: 102.4 });
  const k = khoa(suKienGia(b));
  dat("cham Kijun roi bat lai", k.includes("bat_kijun") || k.includes("bat_tenkan"), k.join());
}
dat("it nen -> rong", suKienGia([{ h: 2, l: 1, c: 1.5 }]).length === 0 && suKienGia(null).length === 0);
// bien dong manh
{
  const b = Array.from({ length: 60 }, (_, i) => ({ t: `d${i}`, h: 101, l: 99, c: 100 }));
  b.push({ t: "d60", h: 101, l: 99, c: 100 });
  b.push({ t: "d61", h: 106, l: 100, c: 105.5 });
  dat("tang manh +5,5%", khoa(suKienGia(b)).includes("tang_manh"));
}

// he thong
const sk = suKienHeThong({ tin: "NAM GIU", ban_bot: true, mat_than: true }, [{ ly_do: "TP1", gia_ban: 13.9, phan_chot_pct: 30, vong: 5 }, { ly_do: "CAT_LO", gia_ban: 12, vong: 9 }], "2026-10-29");
dat("TP1 ghi bang loi de hieu, co gia va phan chot", sk.some((x) => x.nhan === "Đã chạm mốc chốt lời TP1 ở 13,90, nên chốt 30% lệnh" && x.loai === "tot"), JSON.stringify(sk.map((x) => x.nhan)));
dat("cat lo ghi, Ban bot / Mat Than KHONG ghi o day (nam o cot Canh bao)", sk.some((x) => x.nhan.startsWith("Đã chạm mức cắt lỗ")) && !sk.some((x) => x.khoa === "ban_bot" || x.khoa === "mat_than"));
dat("MUA moi hom nay", suKienHeThong({ tin: "MUA", ngay_mua: "2026-10-29" }, [], "2026-10-29").some((x) => x.khoa === "mua_moi"));
dat("MUA cu (ngay mua khac) khong ghi MUA moi", !suKienHeThong({ tin: "MUA", ngay_mua: "2026-10-20" }, [], "2026-10-29").some((x) => x.khoa === "mua_moi"));
dat("khong co gi -> rong", suKienHeThong({ tin: "NAM GIU" }, [], "2026-10-29").length === 0);

// gop + sap: xau truoc, tot sau, cat bot
{
  const r = chuYTrongPhien({ row: { tin: "NAM GIU" }, dongLenhNgay: [{ ly_do: "TP1", gia_ban: 13.9, phan_chot_pct: 30 }, { ly_do: "CAT_LO", gia_ban: 12 }, { ly_do: "TP2", gia_ban: 14.5, phan_chot_pct: 30 }], ngay: "2026-10-29", toiDa: 2 });
  dat("toi da 2 dong, phan con lai dem vao them", r.cacSuKien.length === 2 && r.them === 1);
  dat("canh bao xau (cat lo) len truoc", r.cacSuKien[0].loai === "xau");
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
