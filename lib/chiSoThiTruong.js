// CHI SO THI TRUONG cho Dashboard kieu FireAnt (10/11/2026): dai 4 chi so (VN-Index, VN30, HNX-Index, UPCoM) + du lieu o bieu do VN-Index (phut phien moi nhat + nen ngay 1 nam).
// Nguon: lib/lichSuGia.js (DNSE, du phong VNDirect) - gia da ghep nen hom nay dang chay. Du lieu ben thu ba: moi ham deu co the nem loi, noi goi bat loi + bo qua o tuong ung.
import { layLichSuGia, layNenPhutNgay } from "@/lib/lichSuGia";

export const DAI_CHI_SO = [
  { ma: "VNINDEX", ten: "VN-Index" },
  { ma: "VN30", ten: "VN30" },
  { ma: "HNXINDEX", ten: "HNX-Index" },
  { ma: "UPCOMINDEX", ten: "UPCoM" },
];

const lam2 = (x) => Math.round(x * 100) / 100;

// 1 chi so: gia phien moi nhat, thay doi so phien truoc (diem, %), chuoi gia dong cua soPhien phien gan nhat [[ngay yyyy-mm-dd, dong cua], ...].
export async function layChiSo(ma, soPhien = 30) {
  const nen = await layLichSuGia(ma, Math.max(soPhien + 1, 50));
  if (nen.length < 2) return null;
  const cuoi = nen[nen.length - 1];
  const truoc = nen[nen.length - 2];
  return {
    ma,
    ngay: cuoi.t,
    gia: cuoi.c,
    truoc: truoc.c,
    doiDiem: cuoi.c - truoc.c,
    doi: (cuoi.c / truoc.c - 1) * 100,
    chuoi: nen.slice(-soPhien).map((b) => [b.t, lam2(b.c)]),
  };
}

// Dai chi so: chi so nao loi nguon thi bo qua (khong lam hong ca dai).
export async function layDaiChiSo() {
  const kq = await Promise.all(
    DAI_CHI_SO.map(async (c) => {
      try {
        const x = await layChiSo(c.ma, 30);
        return x ? { ...x, ten: c.ten } : null;
      } catch {
        return null;
      }
    })
  );
  return kq.filter(Boolean);
}

// O bieu do VN-Index: nen ngay ~1 nam (tab 1T / 3T / 1N) + nen PHUT cua phien moi nhat (tab Trong ngay; cuoi tuan / truoc gio mo cua = phien gan nhat da giao dich).
// phut: [[giay Unix, gia], ...]; tham chieu = gia dong cua phien lien truoc (duong ke ngang o tab Trong ngay).
export async function layBieuDoVNIndex() {
  const ngay = await layChiSo("VNINDEX", 250);
  if (!ngay) return null;
  let phut = [];
  try {
    phut = (await layNenPhutNgay("VNINDEX", ngay.ngay)).map((b) => [b.t, lam2(b.c)]);
  } catch {
    phut = [];
  }
  return { ngay: ngay.ngay, gia: ngay.gia, doi: ngay.doi, doiDiem: ngay.doiDiem, thamChieu: ngay.truoc, nenNgay: ngay.chuoi, phut };
}
