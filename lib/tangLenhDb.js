// TANG LENH A / A+ / A++ - phan lay du lieu o MAY CHU (nen gia DNSE + khoi ngoai VNDirect; cong thuc thuan o lib/tangLenh.js). Chi tinh cho vai ma dang co tin hieu MUA moi
// (hoac ma vua MUA phien truoc, de biet phien sau da xac nhan chua) nen so lan goi nguon ngoai nho. Loi nguon / thieu so lieu -> ma do khong co tang (khong doan bua).
import { layLichSuGia } from "./lichSuGia.js";
import { layKhoiNgoaiMa } from "./khoiNgoaiMa.js";
import { layCoDem } from "./boNhoMem.js";
import { ngayChuoi } from "./muaThemTinhToan.js";
import { tinhTangLenh } from "./tangLenh.js";

const SONG_SONG = 5;
const HAN_MS = 180_000;

async function tinhMotMa(ma, ngayTin, vni) {
  const [nen, ngoai] = await Promise.all([layLichSuGia(ma, 220), layKhoiNgoaiMa(ma, 40)]);
  return tinhTangLenh({ nen, vni, ngayTin, ngoai: ngoai.map((x) => ({ ngay: x.ngay, rongTy: x.rongTy })) });
}

// hang: cac dong tin hieu. Tra ve Map ma -> ket qua tinhTangLenh (chi ma tinh duoc). Gia tri null khi chua co du lieu (lan dau khoi dong cham).
export async function layTangLenhCacMa(hang) {
  const ung = hang.filter((r) => r.tin === "MUA" || r.tin === "NAM GIU");
  const mua = ung.filter((r) => r.tin === "MUA").map((r) => r.ma).sort();
  const giu = ung.filter((r) => r.tin === "NAM GIU" && ngayChuoi(r.ngay_mua)).map((r) => `${r.ma}@${ngayChuoi(r.ngay_mua)}`).sort();
  if (!mua.length && !giu.length) return new Map();
  const khoa = `tang-lenh:${mua.join(",")}|${giu.join(",")}`;
  const kq = await layCoDem(
    khoa,
    HAN_MS,
    async () => {
      const vni = await layLichSuGia("VNINDEX", 260);
      const homTruoc = vni.length >= 2 ? vni[vni.length - 2].t : null;
      const homNay = vni.length ? vni[vni.length - 1].t : null;
      // MUA: ngay tin hieu = ngay co dong tin hieu (ngay_mua neu co, khong thi phien moi nhat). NAM GIU: chi xet lenh vua mua PHIEN TRUOC (phien nay la phien xac nhan).
      const viec = [];
      for (const r of ung) {
        const nm = ngayChuoi(r.ngay_mua);
        if (r.tin === "MUA") viec.push([r.ma, nm && nm <= homNay ? nm : homNay]);
        else if (nm && nm === homTruoc) viec.push([r.ma, nm]);
      }
      const ra = {};
      for (let i = 0; i < viec.length; i += SONG_SONG) {
        await Promise.all(
          viec.slice(i, i + SONG_SONG).map(async ([ma, ngayTin]) => {
            try {
              const x = await tinhMotMa(ma, ngayTin, vni);
              if (x) ra[ma] = x;
            } catch {
              // nguon loi: bo qua ma nay
            }
          })
        );
      }
      return ra;
    },
    { choToiDaMs: 900 }
  );
  return new Map(Object.entries(kq ?? {}));
}
