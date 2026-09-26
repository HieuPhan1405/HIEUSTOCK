import Link from "next/link";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import { layThamGiaCuaToi } from "@/lib/thamGia";
import { layLenhDaDong } from "@/lib/lenhDaDong";
import { layLichPhien } from "@/lib/lichSuGia";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import DanhMucMa from "@/components/DanhMucMa";
import LenhDaDongView from "@/components/LenhDaDongView";
import NhanCapNhat from "@/components/NhanCapNhat";
import { capNhatMoiNhat } from "@/components/dungChung";
import { lenhDangMo, cacDiemMuaMoi } from "@/lib/muaThemTinhToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Danh mục theo dõi",
  description: "Danh mục các mã bạn đã tham gia: lệnh đang giữ, vùng mua, cắt lỗ, chốt lời, lãi/lỗ và các lệnh đã đóng.",
};

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const DO = "#EF4444";

function TieuDeMuc({ children, phu }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        {children}
      </h2>
      {phu && (
        <p className="text-xs" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

export default async function TrangDanhMuc() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Danh mục theo dõi"
        moTa="Đăng ký hoặc đăng nhập miễn phí để lập danh mục các mã bạn tham gia: lệnh đang giữ, lãi/lỗ, vùng mua - cắt lỗ - chốt lời và lệnh đã đóng."
        choDuyet={!!nguoiDung}
      />
    );
  }

  let thamGia = [];
  let tatCa = [];
  let loi = null;
  try {
    [thamGia, tatCa] = await Promise.all([layThamGiaCuaToi(nguoiDung.id), layTatCaTinHieu()]);
  } catch (e) {
    loi = String(e?.message || e);
  }
  // Lenh da dong tai rieng: loi o day khong duoc lam mat phan lenh dang giu.
  let daDong = [];
  let loiDaDong = null;
  try {
    daDong = await layLenhDaDong();
  } catch (e) {
    loiDaDong = String(e?.message || e);
  }

  const ngayThamGia = new Map(thamGia.map((t) => [t.ma, t.ngay_tham_gia]));
  const cuaToi = tatCa.filter((r) => ngayThamGia.has(r.ma));
  // Lenh da dong chi tinh tu luc tham gia (ban/chot tu ngay tham gia tro di).
  const dsDaDong = daDong.filter((x) => ngayThamGia.has(x.ma) && x.ngay_ban >= ngayThamGia.get(x.ma));

  // 1 danh sach chung: MOI LENH 1 dong rieng (lenh dau + cac lenh mua moi dang giu cua cac ma ban tham gia; 1 ma co nhieu lenh thi danh so (1), (2)). Giong So lenh dang mo:
  // ma khong con lenh nao thi chuyen xuong "Dang theo doi".
  const dsLenh = lenhDangMo(cuaToi, cuaToi.some((r) => cacDiemMuaMoi(r).length) ? await layLichPhien() : null);
  // DANH MUC = danh sach MA (moi ma 1 dong); ma dang co vi the (lenh) co mui ten xo ra cac vi the cua ma do. Ma co vi the len truoc.
  const lenhTheoMa = new Map();
  for (const l of dsLenh) {
    if (!lenhTheoMa.has(l.ma)) lenhTheoMa.set(l.ma, []);
    lenhTheoMa.get(l.ma).push(l);
  }
  const tinHieuTheoMa = new Map(cuaToi.map((r) => [r.ma, r]));
  const dsMa = thamGia
    .map((t) => {
      const r = tinHieuTheoMa.get(t.ma);
      return {
        ma: t.ma,
        ngayThamGia: t.ngay_tham_gia,
        coDuLieu: !!r,
        tenNgan: r?.ten_ngan ?? null,
        tenCongTy: r?.ten_cong_ty ?? null,
        tin: r?.tin ?? null,
        gia: r?.gia ?? null,
        diem: r?.diem ?? null,
        lenh: lenhTheoMa.get(t.ma) ?? [],
      };
    })
    .sort((a, b) => Number(b.lenh.length > 0) - Number(a.lenh.length > 0) || a.ma.localeCompare(b.ma));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Danh mục theo dõi
      </h1>
      <p className="text-sm mb-3" style={{ color: MUTED }}>
        Mã nào bạn bấm nút tham gia (biểu tượng người cạnh mã ở{" "}
        <Link href="/bo-loc" className="underline" style={{ color: PRIMARY }}>
          Bộ lọc
        </Link>{" "}
        hoặc{" "}
        <Link href="/lenh-mo" className="underline" style={{ color: PRIMARY }}>
          Sổ lệnh
        </Link>
        ) sẽ tự vào đây. Mỗi mã một dòng; mã đang có vị thế có mũi tên <b>▾</b> ở đầu dòng — bấm để xổ ra các <b>vị thế</b> (lệnh) của mã đó: mã có nhiều lệnh được đánh số (1), (2)... theo ngày mua, nhãn <b style={{ color: "#22D3EE" }}>Mua mới</b> là đợt vào sau lệnh đầu. Lệnh kết thúc sẽ tự chuyển sang &quot;Lệnh đã đóng&quot;.
      </p>
      <NhanCapNhat luc={capNhatMoiNhat(tatCa)} className="mb-6" />

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      {!loi && thamGia.length === 0 && (
        <div className="rounded-2xl border p-8 text-center mb-8" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-base mb-2" style={{ fontWeight: 600 }}>
            Danh mục của bạn đang trống
          </p>
          <p className="text-sm mb-4" style={{ color: MUTED }}>
            Vào Bộ lọc hoặc Sổ lệnh, bấm nút tham gia cạnh mã bạn đã vào lệnh (hoặc muốn theo dõi sát). Lệnh của mã đó sẽ tự hiện ở đây.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/lenh-mo" className="px-4 py-2 rounded-lg" style={{ background: PRIMARY, color: "#FFFFFF" }}>
              Mở Sổ lệnh đang mở
            </Link>
            <Link href="/bo-loc" className="px-4 py-2 rounded-lg border" style={{ borderColor: VIEN, color: TEXT }}>
              Mở Bộ lọc cổ phiếu
            </Link>
          </div>
        </div>
      )}

      {thamGia.length > 0 && (
        <>
          <section className="mb-10">
            <TieuDeMuc phu="Giá mua, vùng cắt lỗ, chốt lời và lãi/lỗ lấy theo lệnh của hệ thống, không phải giá khớp thật của bạn. Bấm mũi tên ▾ cạnh mã để xem từng vị thế; lọc &quot;Vị thế tốt nhất&quot; / &quot;Vị thế sau&quot; để mỗi mã chỉ hiện 1 vị thế.">Mã đang theo dõi</TieuDeMuc>
            <DanhMucMa dsMa={dsMa} soCoDuLieu={cuaToi.length} soTheoDoi={thamGia.length} />
          </section>

          <section>
            {loiDaDong && (
              <p className="text-sm mb-3" style={{ color: DO }}>
                Không tải được lệnh đã đóng: {loiDaDong}
              </p>
            )}
            <LenhDaDongView
              nhung
              ds={dsDaDong}
              tieuDe="Lệnh đã đóng của tôi"
              moTa="Các lệnh của những mã bạn đã tham gia, bán/thoát hoặc chốt đủ TP3 kể từ ngày bạn tham gia mã đó."
            />
          </section>
        </>
      )}
    </div>
  );
}
