import { Suspense } from "react";
import XuatAnh from "@/components/XuatAnh";
import TheThiTruong from "@/components/TheThiTruong";
import { capNhatMoiNhat } from "@/components/dungChung";
import DongTienThiTruong from "@/components/DongTienThiTruong";
import { layCoDem } from "@/lib/boNhoMem";
import { layTatCaTinHieu, layChiSoVNIndex } from "@/lib/tinHieu";
import { layDongTienNuocNgoai, tinhTongQuanThiTruong, layChuoiThanhKhoanHOSE } from "@/lib/thiTruong";
import { layDaiChiSo, layBieuDoVNIndex } from "@/lib/chiSoThiTruong";
import { TheThongKePhien, TheBienDong, TheNoiBat } from "@/components/RaSoatThiTruong";
import DaiChiSo from "@/components/DaiChiSo";
import BieuDoVNIndex from "@/components/BieuDoVNIndex";
import BieuDoTamLyLichSu from "@/components/BieuDoTamLyLichSu";
import ThanhKhoanThiTruong from "@/components/ThanhKhoanThiTruong";
import AnhHuongIndex from "@/components/AnhHuongIndex";
import KhoiNgoaiThiTruong from "@/components/KhoiNgoaiThiTruong";
import VungGiaTriChiSo from "@/components/VungGiaTriChiSo";
import { layLichSuGia } from "@/lib/lichSuGia";
import { viTriTheoVungGiaTri } from "@/lib/vungGiaTriChiSo";
import { thongBaoLoi } from "@/lib/loiAnToan";
import BanDoNhiet from "@/components/BanDoNhiet";
import ThanhMucTrang from "@/components/ThanhMucTrang";

// DASHBOARD THI TRUONG (10/11/2026 lam lai kieu FireAnt "Tong quan thi truong"): LUOI O thay vi 10 khoi xep doc ~5.700px.
//   Hang 1: dai 4 chi so (VN-Index, VN30, HNX, UPCoM) · Hang 2: bieu do VN-Index | Thong ke phien · Hang 3: ban do nhiet · Hang 4: tac dong toi VN-Index
//   Hang 5: top bien dong | nganh & diem noi bat | khoi ngoai · Hang 6: thanh khoan · Hang 7: tam ly lich su | vung gia tri · Hang 8: dong tien chu dong.
// Bo so voi ban cu (trung voi trang Tong quan / dai chi so): the "Xu huong thi truong" (gia + xu huong VN-Index), dong "So lieu ngay", the lien ket "Phan tich nganh" (da co tab Nganh).
const MUC_LUC = [
  { id: "chi-so", nhan: "Chỉ số" },
  { id: "thong-ke", nhan: "Thống kê phiên" },
  { id: "ban-do-nhiet", nhan: "Bản đồ nhiệt" },
  { id: "tac-dong", nhan: "Tác động" },
  { id: "bien-dong", nhan: "Biến động" },
  { id: "khoi-ngoai", nhan: "Khối ngoại" },
  { id: "thanh-khoan", nhan: "Thanh khoản" },
  { id: "tam-ly", nhan: "Tâm lý" },
  { id: "dong-tien", nhan: "Dòng tiền" },
];

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dashboard thị trường",
  description: "VN-Index, VN30, HNX, UPCoM, độ rộng, thanh khoản, khối ngoại, bản đồ nhiệt, tác động tới VN-Index, tâm lý và dòng tiền thị trường trong một màn hình.",
};

const TEXT = "var(--chu)";
const MUTED = "var(--mo)";

// O chung NGUON NGOAI (cham, 1-4 giay) dat trong Suspense: phan tu DB hien ngay, o nay hien sau. layCoDem: tra ban cu ngay, lam moi ngam -> tu lan thu 2 gan nhu tuc thi.
function OCho({ tieuDe, cao = 120 }) {
  return (
    <div className="rounded-2xl border p-5 text-sm h-full" style={{ borderColor: "var(--vien)", background: "var(--card)", color: MUTED, minHeight: cao }} aria-busy="true">
      {tieuDe}: đang tải…
    </div>
  );
}
async function ODaiChiSo() {
  const ds = await layCoDem("dai-chi-so", 60_000, layDaiChiSo, { choToiDaMs: 2500 }).catch(() => null);
  return <DaiChiSo ds={ds} />;
}
async function OBieuDoVNIndex() {
  const du = await layCoDem("bieu-do-vnindex", 60_000, layBieuDoVNIndex, { choToiDaMs: 3000 }).catch(() => null);
  return du ? <BieuDoVNIndex du={du} /> : <OCho tieuDe="Biểu đồ VN-Index" cao={320} />;
}
async function OThongKe({ tq }) {
  const [thanhKhoan, khoiNgoai] = await Promise.all([
    layCoDem("thanh-khoan-hose-21", 120_000, () => layChuoiThanhKhoanHOSE(21), { choToiDaMs: 3000 }).catch(() => null),
    layCoDem("khoi-ngoai", 300_000, layDongTienNuocNgoai, { choToiDaMs: 3000 }).catch(() => null),
  ]);
  return <TheThongKePhien tq={tq} thanhKhoan={thanhKhoan} khoiNgoai={khoiNgoai} />;
}
async function OKhoiNgoai() {
  const ngoai = await layCoDem("khoi-ngoai", 300_000, layDongTienNuocNgoai, { choToiDaMs: 4000 });
  return <KhoiNgoaiThiTruong ngoai={ngoai} />;
}
async function OVungGiaTri() {
  const vt = await layCoDem("vung-gia-tri-vnindex", 120_000, () => layLichSuGia("VNINDEX", 200).then((nen) => viTriTheoVungGiaTri(nen)), { choToiDaMs: 4000 });
  return <VungGiaTriChiSo vt={vt} />;
}

// O trong luoi: bo le duoi rieng cua tung khoi cu (mb-6) va keo cao bang o canh ben.
const O = "scroll-mt-28 min-w-0 [&>*]:mb-0! [&>*]:h-full";

export default async function TrangDashboard() {
  let tatCa = [];
  let chiSoVNIndex = null;
  let loi = null;
  try {
    [tatCa, chiSoVNIndex] = await Promise.all([layTatCaTinHieu(), layChiSoVNIndex()]);
  } catch (e) {
    loi = thongBaoLoi(e);
  }

  const capNhat = capNhatMoiNhat(tatCa);
  const ngayHienThi = capNhat ? new Date(capNhat).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "numeric", year: "numeric" }) : "";
  const gioCapNhat = capNhat ? new Date(capNhat).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }) : "";
  const tq = tatCa.length ? tinhTongQuanThiTruong(tatCa, chiSoVNIndex) : null;

  // diem "truc tiep" cua bieu do lich su tam ly: cung cong thuc 3 ty le voi chuoi lich su (khong gom ty le % ma dat diem MUA nhu dong ho)
  let tamLyHienTai = null;
  if (capNhat && chiSoVNIndex?.gia && tq) {
    const ba = [tq.doRong.tong ? (tq.doRong.tang / tq.doRong.tong) * 100 : null, tq.tren.kijun, tq.tren.canBang];
    if (ba.every((x) => x != null)) tamLyHienTai = { ngay: new Date(capNhat).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }), s: ba.reduce((a, b) => a + b, 0) / 3, v: chiSoVNIndex.gia };
  }

  return (
    <div id="chup-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 py-6" style={{ color: TEXT }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
            Dashboard thị trường
          </h1>
          {ngayHienThi && (
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>
              Phiên {ngayHienThi}
              {gioCapNhat ? ` · số liệu hệ thống cập nhật ${gioCapNhat}` : ""} · chỉ số, thanh khoản, khối ngoại lấy trực tiếp từ nguồn giá
            </p>
          )}
        </div>
        {/* the chia se thi truong rieng (720px, chu to, doc duoc tren Zalo) thay cho chup nguyen trang */}
        {tatCa.length > 0 && (
          <XuatAnh
            nhan="Chụp ảnh dashboard"
            kieu="nho"
            tenFile={`CloudStock-thi-truong-${new Date().toISOString().slice(0, 10)}.png`}
            tieuDe="Dashboard thị trường"
            the={<TheThiTruong tatCa={tatCa} vnindex={chiSoVNIndex} ngay={ngayHienThi} />}
          />
        )}
      </div>
      <ThanhMucTrang muc={MUC_LUC} />

      {loi && (
        <p className="text-sm mb-6" style={{ color: "var(--do)" }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      <div className="grid grid-cols-12 gap-4">
        <section id="chi-so" className={`col-span-12 ${O}`}>
          <Suspense fallback={<OCho tieuDe="Chỉ số thị trường" cao={74} />}>
            <ODaiChiSo />
          </Suspense>
        </section>

        <section className={`col-span-12 xl:col-span-7 ${O}`}>
          <Suspense fallback={<OCho tieuDe="Biểu đồ VN-Index" cao={320} />}>
            <OBieuDoVNIndex />
          </Suspense>
        </section>
        <section id="thong-ke" className={`col-span-12 xl:col-span-5 ${O}`}>
          {tq && (
            <Suspense fallback={<TheThongKePhien tq={tq} thanhKhoan={null} khoiNgoai={null} />}>
              <OThongKe tq={tq} />
            </Suspense>
          )}
        </section>

        {/* Ban do nhiet (doi tieu chi to mau / co o). Chi gui xuong trinh duyet cac truong khach cung duoc thay (khong gui nguyen dong tin hieu: lib/lamSachChoKhach.js). */}
        <section id="ban-do-nhiet" className={`col-span-12 ${O}`}>
          {tatCa.length > 0 && <BanDoNhiet tieuDe="Bản đồ nhiệt thị trường" tatCa={tatCa.map((r) => ({ ma: r.ma, nganh: r.nganh, doi: r.doi, gtgd_tb20: r.gtgd_tb20, rs_vni: r.rs_vni, rs_vni_60: r.rs_vni_60, diem: r.diem, von_hoa_ty: r.von_hoa_ty }))} />}
        </section>

        <section id="tac-dong" className={`col-span-12 ${O}`}>
          <AnhHuongIndex />
        </section>

        <section id="bien-dong" className={`col-span-12 lg:col-span-6 xl:col-span-4 ${O}`}>
          {tq && <TheBienDong tq={tq} />}
        </section>
        <section className={`col-span-12 lg:col-span-6 xl:col-span-4 ${O}`}>{tq && <TheNoiBat tq={tq} />}</section>
        <section id="khoi-ngoai" className={`col-span-12 xl:col-span-4 ${O}`}>
          <Suspense fallback={<OCho tieuDe="Khối ngoại" />}>
            <OKhoiNgoai />
          </Suspense>
        </section>

        <section id="thanh-khoan" className={`col-span-12 ${O}`}>
          <ThanhKhoanThiTruong ma="VNINDEX" />
        </section>

        <section id="tam-ly" className={`col-span-12 xl:col-span-7 ${O}`}>
          <BieuDoTamLyLichSu hienTai={tamLyHienTai} />
        </section>
        <section className={`col-span-12 xl:col-span-5 ${O}`}>
          <Suspense fallback={<OCho tieuDe="Vị trí VN-Index so với vùng giá trị" />}>
            <OVungGiaTri />
          </Suspense>
        </section>

        <section id="dong-tien" className={`col-span-12 ${O}`}>
          <DongTienThiTruong />
        </section>
      </div>
    </div>
  );
}
