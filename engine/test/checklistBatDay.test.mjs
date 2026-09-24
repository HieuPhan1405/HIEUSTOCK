// Test tay cho engine/loi/checklistBatDay.js (port tu amibroker/8_Export_ChecklistBatDay.afl).
// Cac ham nen (hhv/llv/sma/ref/valueWhen/rsi/mfi) da co test rieng - o day chi kiem tra logic
// GHEP (nguong diem, su kien vuot nguong, pct sau N phien, dinh dang CSV), khong tinh tay lai tung
// chi so. Chay: node engine/test/checklistBatDay.test.mjs
import { tinhChecklistBatDay, xayDungCsvBatDay } from "../loi/checklistBatDay.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

function ngayTuChiSo(i) {
  const d = new Date(2024, 0, 1 + i);
  return d.toISOString().slice(0, 10);
}

// Chuoi gia: 280 phien di ngang quanh 100 (thiet lap MA200/HHV252 on dinh ~100-108), roi mot dot
// GIAM MANH lien tuc ve ~65 (chiet khau ~40% so dinh, MA200Dev rat am, RSI/MFI qua ban, capitulation
// o phien giam manh nhat) - du de vuot nguong 5 diem tham khao it nhat 1 lan.
function sinhNenSuySup() {
  const nen = [];
  let gia = 100;
  for (let i = 0; i < 280; i++) {
    gia = 100 + Math.sin(i / 9) * 3; // dao dong nhe, khong tao xu huong
    nen.push({ t: ngayTuChiSo(i), o: gia, h: gia + 1, l: gia - 1, c: gia, v: 1_000_000 });
  }
  // 12 phien giam manh lien tiep, khoi luong tang dan (capitulation o vai phien cuoi).
  for (let i = 0; i < 12; i++) {
    gia = gia * 0.955; // ~-4.5%/phien
    const bienDoRong = i >= 8; // vai phien cuoi nen rong hon han de kich C6 (bien do + khoi luong dot bien)
    nen.push({
      t: ngayTuChiSo(280 + i),
      o: gia * 1.02,
      h: gia * 1.03,
      l: gia * (bienDoRong ? 0.9 : 0.97),
      c: gia,
      v: bienDoRong ? 6_000_000 : 1_200_000,
    });
  }
  // 25 phien sau do de co du du lieu tinh pct_sau_20 cho cac su kien vua roi.
  for (let i = 0; i < 25; i++) {
    gia = gia * (1 + (Math.random() * 0.01 - 0.004));
    nen.push({ t: ngayTuChiSo(292 + i), o: gia, h: gia + 0.5, l: gia - 0.5, c: gia, v: 1_000_000 });
  }
  return nen;
}

// ---- Chua du lich su (<260 nen) -> mang rong, khong loi ----
{
  const nenNgan = Array.from({ length: 100 }, (_, i) => ({ t: ngayTuChiSo(i), o: 10, h: 10.5, l: 9.5, c: 10, v: 1000 }));
  const kq = tinhChecklistBatDay(nenNgan);
  ok("Chua du 260 nen -> tra ve mang rong", Array.isArray(kq) && kq.length === 0, kq.length);
}

// ---- Chuoi di ngang mai, khong bao gio sut sau -> khong co su kien nao ----
{
  const nen = Array.from({ length: 320 }, (_, i) => {
    const gia = 100 + Math.sin(i / 9) * 2;
    return { t: ngayTuChiSo(i), o: gia, h: gia + 0.5, l: gia - 0.5, c: gia, v: 1_000_000 };
  });
  const kq = tinhChecklistBatDay(nen);
  ok("Chuoi di ngang, khong sut gia -> khong co su kien bat day nao", kq.length === 0, kq.length);
}

// ---- Dot suy sup manh -> phai co it nhat 1 su kien vuot nguong 5 ----
{
  const nen = sinhNenSuySup();
  const kq = tinhChecklistBatDay(nen);
  ok("Dot suy sup manh -> co it nhat 1 su kien kich hoat", kq.length >= 1, kq.length);

  if (kq.length >= 1) {
    const sk = kq[0];
    ok("Diem su kien >= 5 (dung nguong tham khao)", sk.diem >= 5, sk.diem);
    ok("Chiet khau luc kich hoat > 20% (dieu kien C1)", sk.chiet_khau > 20, sk.chiet_khau);
    ok("gia_luc_tin_hieu la so duong hop le", sk.gia_luc_tin_hieu > 0, sk.gia_luc_tin_hieu);
    ok("RSI luc kich hoat co gia tri (khong null)", sk.rsi != null, sk.rsi);

    // Su kien dau tien trong danh sach chac chan con >=20 phien sau do (co 25 phien them vao cuoi) -> pct_sau_20 phai co gia tri.
    ok("pct_sau_20 co gia tri khi con du du lieu tuong lai", sk.pct_sau_20 != null, sk.pct_sau_20);
  }

  // Su kien GAN CUOI CHUOI NHAT (neu co) se thieu du lieu tuong lai -> pct_sau_5/10/20 phai la null,
  // khong duoc "an" thanh 0% (day chinh la loi AmiBroker ma file AFL da ghi chu va sua).
  const suKienCuoiChuoi = kq.find((s) => s.ngay >= ngayTuChiSo(nen.length - 3));
  ok("Su kien qua gan cuoi chuoi (khong con 5 phien sau) -> pct_sau_5 la null, khong phai 0", !suKienCuoiChuoi || suKienCuoiChuoi.pct_sau_5 == null);
}

// ---- Tham so NamBatDauTheoDoi loc dung nam (giong Param AFL) ----
{
  const nen = sinhNenSuySup();
  const namDotSuySup = Number(nen[290].t.slice(0, 4));
  const kqKhongLoc = tinhChecklistBatDay(nen, { namBatDauTheoDoi: 0 });
  const kqLocNamSau = tinhChecklistBatDay(nen, { namBatDauTheoDoi: namDotSuySup + 5 });
  ok("namBatDauTheoDoi=0 (khong gioi han) -> con giu su kien", kqKhongLoc.length >= 1, kqKhongLoc.length);
  ok("namBatDauTheoDoi loc sau ca nam xay ra dot suy sup -> khong con su kien nao", kqLocNamSau.length === 0, kqLocNamSau.length);
}

// ---- Dinh dang CSV: header dung 11 cot, ngay doi tu ISO sang D/M/YYYY, bool -> "1"/"0" ----
{
  const csv = xayDungCsvBatDay([
    { ma: "ABC", ngay: "2024-03-05", diem: 6.5, gia_luc_tin_hieu: 12.34, pct_sau_5: 3.1, pct_sau_10: null, pct_sau_20: -1.25, chiet_khau: 22.5, rsi: 28.4, capitulation: true, ftd: false },
  ]);
  const dong = csv.trim().split("\n");
  ok("CSV co dung 1 header + 1 dong du lieu", dong.length === 2, dong.length);
  ok("Header dung 11 cot theo dung ten route mong doi", dong[0] === "ma,ngay,diem,gia_luc_tin_hieu,pct_sau_5,pct_sau_10,pct_sau_20,chiet_khau,rsi,capitulation,ftd");
  ok("Ngay doi tu ISO sang D/M/YYYY khong so 0 dau", dong[1].includes(",5/3/2024,"), dong[1]);
  ok("pct_sau_10 null -> o rong (khong phai chu 'null')", dong[1].split(",")[5] === "", dong[1]);
  ok("capitulation true -> '1', ftd false -> '0'", dong[1].endsWith(",1,0"), dong[1]);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
