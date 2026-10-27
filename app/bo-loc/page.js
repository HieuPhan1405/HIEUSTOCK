import { Suspense } from "react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { COT_CHI_BAO } from "@/lib/cotChiBaoKyThuat";
import BangBoLoc from "@/components/BangBoLoc";
import NhanCapNhat from "@/components/NhanCapNhat";
import NhanThiTruong5Phien from "@/components/NhanThiTruong5Phien";
import { capNhatMoiNhat } from "@/components/dungChung";
import { thongBaoLoi } from "@/lib/loiAnToan";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import { lamSachChoKhach } from "@/lib/lamSachChoKhach";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bộ lọc cổ phiếu",
  description: "Lọc và sắp xếp toàn bộ cổ phiếu HOSE, HNX, UPCOM theo tín hiệu, xu hướng, dòng tiền, thanh khoản và vốn hoá.",
};

export default async function TrangBoLoc() {
  let tatCa = [];
  let loi = null;
  let chiBaoLuc = null;
  // Tin hieu, nguoi dung va chi bao ky thuat doc SONG SONG (truoc day lan luot 3 lan di-ve toi DB).
  const [kqTinHieu, nguoiDung, kqChiBao] = await Promise.all([
    layTatCaTinHieu().then((v) => ({ v }), (e) => ({ e })),
    layNguoiDungHienTai().catch(() => null),
    layChiBaoKyThuat().then((v) => ({ v }), () => null),
  ]);
  if (kqTinHieu.e) loi = thongBaoLoi(kqTinHieu.e);
  else tatCa = kqTinHieu.v;
  // KHOA THONG TIN QUAN TRONG (2026-10-09): khach chua dang nhap / chua duoc duyet khong nhan tin hieu va thong tin vi the trong du lieu trang (truoc day chi bi lam mo o giao dien,
  // van doc duoc trong ma nguon trang). Cot Tin hieu cua khach da la chu mau mo co dinh nen dung gia tri gia dinh TRUNG LAP.
  if (!loi && !nguoiDung?.da_duyet) tatCa = lamSachChoKhach(tatCa, { tinGiaDinh: "AN" });
  // Chi bao ky thuat (RSI, MACD, MA...) gop vao tung ma - loi o day khong duoc lam mat bang chinh, chi mat bo loc chi bao.
  if (!loi && kqChiBao) {
    try {
      const { hang, capNhatLuc } = kqChiBao.v;
      const theoMa = new Map(hang.map((h) => [h.ma, h]));
      // Du lieu nay duoc gui nguyen xuong trinh duyet (~390 ma x hon 100 cot): BO cot khong co gia tri (null ~ nua so cot) va lam tron so thap phan dai (7 chu so co nghia) de trang nhe di rat nhieu.
      // Cot thieu duoc doc nhu null o moi noi (bo loc / cot hien thi deu dung kiem tra so huu han).
      tatCa = tatCa.map((r) => {
        const h = theoMa.get(r.ma);
        if (!h) return r;
        const o = { ...r };
        for (const k of COT_CHI_BAO) {
          const v = h[k];
          if (v != null) o[k] = typeof v === "number" && !Number.isInteger(v) ? Number(v.toPrecision(7)) : v;
        }
        return o;
      });
      chiBaoLuc = capNhatLuc;
    } catch {}
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        Bộ lọc cổ phiếu
      </h1>
      <p className="text-sm mb-4" style={{ color: "var(--mo)" }}>
        Lọc và sắp xếp toàn bộ {tatCa.length} cổ phiếu đang theo dõi (HOSE, HNX, UPCOM) theo nhiều tiêu chí.
      </p>
      <NhanCapNhat luc={capNhatMoiNhat(tatCa)} className="mb-2" />
      <Suspense fallback={null}>
        <NhanThiTruong5Phien className="mb-6" />
      </Suspense>

      {loi ? (
        <p className="text-sm" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      ) : (
        <Suspense fallback={null}>
          <BangBoLoc duLieu={tatCa} chiBaoLuc={chiBaoLuc} />
        </Suspense>
      )}
    </div>
  );
}
