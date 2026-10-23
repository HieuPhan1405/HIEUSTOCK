import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import { dungMuaPhucHoi } from "@/lib/muaPhucHoi";
import { tinhVungLenh } from "@/components/dungChung";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import DanhMucGoiY from "@/components/DanhMucGoiY";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Danh mục gợi ý",
  description: "Nhập số mã muốn nắm và các mã đang cầm: gợi ý giữ / bán / cắt lỗ, thêm mã mới và chia tỷ trọng theo tín hiệu hệ thống.",
};

const MUTED = "var(--mo)";
const DO = "var(--do)";
const sans = { fontFamily: "var(--font-chu)" };

export default async function TrangDanhMucGoiY() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Danh mục gợi ý"
        moTa="Đăng ký hoặc đăng nhập miễn phí để nhập danh mục đang cầm và nhận gợi ý giữ / bán, thêm mã và tỷ trọng."
        choDuyet={!!nguoiDung}
      />
    );
  }

  let tatCa = [];
  let muaPhucHoi = [];
  let loi = null;
  try {
    tatCa = await layTatCaTinHieu();
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  try {
    muaPhucHoi = dungMuaPhucHoi({ hang: (await layChiBaoKyThuat()).hang, tatCa });
  } catch {
    // khong co du lieu diem B: chi goi y tu tin hieu he thong
  }
  // Chi gui xuong trinh duyet cac cot can dung (giam dung luong): vung mua tinh san tu tinhVungLenh.
  const gon = tatCa.map((r) => ({
    ma: r.ma, tin: r.tin, diem: r.diem, gia: r.gia, stop_loss: r.stop_loss, tp1: r.tp1, tp2: r.tp2, kijun: r.kijun, nganh: r.nganh, gtgd_tb20: r.gtgd_tb20, tp_da_cham: r.tp_da_cham,
    vung_mua: tinhVungLenh(r)?.mua?.trangThai ?? null,
  }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl mb-1" style={{ ...sans, fontWeight: 700 }}>Danh mục gợi ý</h1>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Nhập số mã bạn muốn nắm và những mã đang cầm (kèm giá vốn). Hệ thống đối chiếu với tín hiệu hiện tại để gợi ý mã nào giữ, mã nào nên bán / cắt lỗ, mã mới nào có thể thêm và chia tỷ trọng.
      </p>
      {loi && <p className="text-sm mb-6" style={{ color: DO }}>Lỗi tải dữ liệu: {loi}</p>}
      <DanhMucGoiY tatCa={gon} muaPhucHoi={muaPhucHoi} />
    </div>
  );
}
