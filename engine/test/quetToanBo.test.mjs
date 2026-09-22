// Test cho engine/loi/quetToanBo.js. taiLichSuToanBo can goi mang that (DNSE OpenAPI + VNDirect)
// nen KHONG test o day - da duoc kiem chung gian tiep qua chayThuOpenApi.mjs/chayPipelineDayDu.mjs
// voi credential that (xem lich su trao doi 2026-09-22/23). File nay chi test cac ham THUAN:
// danhSachMaQuet, capNhatNenMoiNhat, va tinhTinHieuToanBo (voi du lieu tong hop, khong goi mang).
import { danhSachMaQuet, capNhatNenMoiNhat, tinhTinHieuToanBo } from "../loi/quetToanBo.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// ---- danhSachMaQuet ----
{
  const ds = danhSachMaQuet();
  ok("co hon 300 ma (VN30+Midcap+Smallcap gop lai)", ds.length > 300, ds.length);
  ok("khong co ma trung lap", new Set(ds).size === ds.length);
  ok("da sap xep (VD phan tu dau <= phan tu ke tiep)", ds[0] <= ds[1]);
}

// ---- capNhatNenMoiNhat ----
{
  const nen = [
    { t: "2026-09-19", o: 10, h: 11, l: 9, c: 10.5, v: 1000 },
    { t: "2026-09-22", o: 10.5, h: 12, l: 10, c: 11.5, v: 2000 },
  ];
  capNhatNenMoiNhat(nen, { t: "2026-09-22", o: 10.5, h: 12.5, l: 10, c: 12, v: 2500 });
  ok("cung ngay voi nen cuoi -> GHI DE (khong them dong moi)", nen.length === 2, nen.length);
  ok("gia tri duoc cap nhat dung", nen[1].c === 12 && nen[1].h === 12.5 && nen[1].v === 2500, nen[1]);

  capNhatNenMoiNhat(nen, { t: "2026-09-23", o: 12, h: 12.2, l: 11.8, c: 12.1, v: 500 });
  ok("ngay MOI HON -> THEM nen moi vao cuoi", nen.length === 3, nen.length);
  ok("nen moi dung gia tri", nen[2].t === "2026-09-23" && nen[2].c === 12.1);

  const soLuongTruoc = nen.length;
  capNhatNenMoiNhat(nen, { t: "2026-09-20", o: 1, h: 1, l: 1, c: 1, v: 1 }); // ngay CU HON nen cuoi - du lieu tre
  ok("ngay CU HON nen cuoi -> BO QUA, khong them/sua gi", nen.length === soLuongTruoc && nen[2].c === 12.1);

  const nenRong = [];
  capNhatNenMoiNhat(nenRong, { t: "2026-09-19", o: 1, h: 1, l: 1, c: 1, v: 1 });
  ok("mang rong -> them nen dau tien", nenRong.length === 1);
}

// ---- tinhTinHieuToanBo (du lieu tong hop, khong goi mang - dam bao rap dung, khong crash) ----
{
  function taoNen(soNen, gia0 = 50) {
    const nen = [];
    let gia = gia0;
    for (let i = 0; i < soNen; i++) {
      gia = gia * (1 + (Math.sin(i / 10) * 0.01));
      const ngay = new Date(Date.UTC(2024, 0, 1) + i * 86400000).toISOString().slice(0, 10);
      nen.push({ t: ngay, o: gia * 0.99, h: gia * 1.01, l: gia * 0.98, c: gia, v: 500000 });
    }
    return nen;
  }
  const nenTheoMa = new Map([
    ["AAA", taoNen(300, 20)],
    ["VJC", taoNen(300, 100)],
  ]);
  const vniNen = taoNen(300, 1500);
  const sanTheoMa = new Map([
    ["AAA", "HOSE"],
    ["VJC", "HOSE"],
  ]);

  let ketQua;
  try {
    ketQua = tinhTinHieuToanBo({ nenTheoMa, vniNen, sanTheoMa });
    ok("chay khong crash", true);
  } catch (e) {
    ok("chay khong crash", false, e.stack);
  }
  if (ketQua) {
    ok("co dung 3 dong (2 ma + VNINDEX)", ketQua.hang.length === 3, ketQua.hang.length);
    ok("khong co loi tinh toan", ketQua.loiTinhToan.length === 0, ketQua.loiTinhToan);
    ok("co dong VNINDEX voi von_hoa='ChiSo'", ketQua.hang.some((h) => h.ma === "VNINDEX" && h.von_hoa === "ChiSo"));
    ok("breadth co tinh duoc (la so huu han)", Number.isFinite(ketQua.ketQuaBreadth.trungBinh), ketQua.ketQuaBreadth.trungBinh);
  }
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
