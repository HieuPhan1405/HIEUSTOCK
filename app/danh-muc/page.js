import Link from "next/link";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import { layDanhSachCuaToi } from "@/lib/danhSachTheoDoi";
import { layLenhDaDong, layLenhCoSuKienNgay, ngayGiaoDichVN } from "@/lib/lenhDaDong";
import { layLichPhien, layLichSuGia } from "@/lib/lichSuGia";
import { chuYTrongPhien } from "@/lib/chuYTrongPhien";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { canhBaoDangCo } from "@/lib/canhBaoDanhMuc";
import { canhBaoDongTien, canhBaoFreeFloat, gopCanhBao } from "@/lib/canhBaoDongTien";
import { freeFloatCuaMa } from "@/lib/freeFloat";
import { layDongTienMa } from "@/lib/dongTien";
import { layKhoiNgoaiMa } from "@/lib/khoiNgoaiMa";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import DanhMucMa from "@/components/DanhMucMa";
import DanhSachTheoDoi from "@/components/DanhSachTheoDoi";
import LenhDaDongView from "@/components/LenhDaDongView";
import NhanCapNhat from "@/components/NhanCapNhat";
import GiaiThichThem from "@/components/GiaiThichThem";
import { capNhatMoiNhat } from "@/components/dungChung";
import { lenhDangMo, cacDiemMuaMoi } from "@/lib/muaThemTinhToan";
import { thongBaoLoi } from "@/lib/loiAnToan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Danh sách theo dõi",
  description: "Nhiều danh sách cổ phiếu theo dõi: giá, tín hiệu, điểm, cảnh báo của từng mã; danh sách chính kèm vị thế và lệnh đã đóng.",
};

const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const DO = "var(--do)";

// Chi cac cot chi bao dung cho ghi chu (khong de de len cot cua dong tin hieu).
const COT_GHI_CHU = ["cach_tenkan_pct", "cach_kijun_pct", "gia_so_may", "rsi14", "kl_ty_le"];
const pick = (h) => (h ? Object.fromEntries(COT_GHI_CHU.filter((k) => h[k] != null).map((k) => [k, h[k]])) : {});
// Cot gui xuong bang Danh sach theo doi (moi ma 1 dong, du de hien bang gia gon + tinh canh bao nhanh lib/canhBaoDanhMuc.js ngay tren trinh duyet cho ma vua them).
const COT_GON = ["ma", "ten_ngan", "ten_cong_ty", "nganh", "san", "gia", "doi", "diem", "trend", "dt", "rs_vni", "gtgd_tb20", "tin", "ban_theo_doi", "ban_theo_doi_tu", "mua_theo_doi_tu", "da_chot_mua", "mat_than", "ban_bot", "stop_loss", "tp1", "tp2", "tp3", "tp_da_cham", "kijun", "gg_top", "gg_bot", "dinh_52t", "lai_lo_pct"];
const hangGon = (r, cb) => ({ ...Object.fromEntries(COT_GON.filter((k) => r[k] != null).map((k) => [k, r[k]])), lenh_web: Array.isArray(r.lenh_web) && r.lenh_web.length > 0, ...pick(cb) });

export default async function TrangDanhMuc({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Danh sách theo dõi"
        moTa="Đăng ký hoặc đăng nhập miễn phí để lập nhiều danh sách cổ phiếu theo dõi: giá, tín hiệu, cảnh báo của từng mã, vị thế và lệnh đã đóng."
        choDuyet={!!nguoiDung}
      />
    );
  }

  // Danh sach CHINH (bang tham_gia_ma) = phan dau cua danhSach; cac danh sach tu tao nam sau (lib/danhSachTheoDoi.js).
  let danhSach = [];
  let thamGia = [];
  let tatCa = [];
  let loi = null;
  // Chi bao ky thuat (Tenkan, Kijun, may, MA) chi de tao Ghi chu tu dong: loi o day khong lam mat bang.
  let chiBaoTheoMa = new Map();
  try {
    const [a, b, cb] = await Promise.all([layDanhSachCuaToi(nguoiDung.id), layTatCaTinHieu(), layChiBaoKyThuat().catch(() => null)]);
    danhSach = a;
    thamGia = a[0].ma.map((x) => ({ ma: x.ma, ngay_tham_gia: x.ngay }));
    tatCa = b;
    if (cb?.hang) chiBaoTheoMa = new Map(cb.hang.map((h) => [h.ma, h]));
  } catch (e) {
    loi = thongBaoLoi(e);
  }
  // Lenh da dong tai rieng: loi o day khong duoc lam mat phan lenh dang giu.
  let daDong = [];
  let loiDaDong = null;
  try {
    daDong = await layLenhDaDong();
  } catch (e) {
    loiDaDong = thongBaoLoi(e);
  }

  const ngayThamGia = new Map(thamGia.map((t) => [t.ma, t.ngay_tham_gia]));
  const cuaToi = tatCa.filter((r) => ngayThamGia.has(r.ma));
  // Lenh da dong chi tinh tu luc tham gia (ban/chot tu ngay tham gia tro di).
  const dsDaDong = daDong.filter((x) => ngayThamGia.has(x.ma) && x.ngay_ban >= ngayThamGia.get(x.ma));

  // 1 danh sach chung: MOI LENH 1 dong rieng (lenh dau + cac lenh mua moi dang giu cua cac ma ban tham gia; 1 ma co nhieu lenh thi danh so (1), (2)). Giong So lenh dang mo:
  // ma khong con lenh nao thi chuyen xuong "Dang theo doi".
  const dsLenh = lenhDangMo(cuaToi, cuaToi.some((r) => cacDiemMuaMoi(r).length || r.lenh_web?.length) ? await layLichPhien() : null);
  // DANH MUC = danh sach MA (moi ma 1 dong); ma dang co vi the (lenh) co mui ten xo ra cac vi the cua ma do. Ma co vi the len truoc.
  const lenhTheoMa = new Map();
  for (const l of dsLenh) {
    if (!lenhTheoMa.has(l.ma)) lenhTheoMa.set(l.ma, []);
    lenhTheoMa.get(l.ma).push(l);
  }
  const tinHieuTheoMa = new Map(cuaToi.map((r) => [r.ma, r]));
  // CHU Y TRONG PHIEN: gia (nen ngay, ke ca nen dang chay) vuot / thung Tenkan, Kijun, may, can bang...; he thong cham TP, cat lo, MUA, BAN trong phien. Moi nguon loi chi lam trong cot do (khong lam hong bang).
  const capNhatPhien = capNhatMoiNhat(tatCa);
  const ngayPhien = capNhatPhien ? ngayGiaoDichVN(new Date(capNhatPhien)) : null;
  // Dong tien (mua / ban chu dong, khoi ngoai trong phien - DB, nho 10 giay) va khoi ngoai theo phien (VNDirect) de canh bao ngoai ban nhieu, ban chu dong nhieu...: nguon nao loi thi bo qua nguon do.
  // Chong lag (29/10/2026): moi nguon phu co HAN TOI DA (qua han thi bo qua, trang van hien du) va chay toi da 6 ma cung luc (truoc day tat ca ma x 3 nguon cung luc -> nghen khi theo doi nhieu ma).
  const theoMa = (fn, hanMs = 4000, song = 6) => {
    const kq = new Map();
    let i = 0;
    const chayMot = async () => {
      while (i < cuaToi.length) {
        const ma = cuaToi[i++].ma;
        const v = await Promise.race([fn(ma).catch(() => null), new Promise((r) => setTimeout(() => r(null), hanMs))]);
        kq.set(ma, v);
      }
    };
    return Promise.all(Array.from({ length: Math.min(song, cuaToi.length) }, chayMot)).then(() => kq);
  };
  const [barsTheoMa, lenhNgay, dongTienTheoMa, ngoaiTheoMa] = await Promise.all([
    theoMa((ma) => layLichSuGia(ma, 300)),
    layLenhCoSuKienNgay(ngayPhien).catch(() => []),
    theoMa((ma) => layDongTienMa(ma)),
    theoMa((ma) => layKhoiNgoaiMa(ma, 10)),
  ]);
  const taoCanhBao = (r, ma) => {
    const cb = chiBaoTheoMa.get(ma);
    const hang = { ...r, ...pick(cb) };
    const co = canhBaoDangCo(hang, 99);
    const bars = barsTheoMa.get(ma);
    const doiPhienPct = Array.isArray(bars) && bars.length > 1 ? (bars[bars.length - 1].c / bars[bars.length - 2].c - 1) * 100 : null;
    const dt = dongTienTheoMa.get(ma);
    const dongTien = canhBaoDongTien({
      tomTat: dt?.tomTat ?? null,
      ngayDuLieu: dt?.ngay ?? null,
      ngayPhien,
      nnLichSu: ngoaiTheoMa.get(ma),
      klTyLe: hang.kl_ty_le,
      doiPhienPct,
      rsi: hang.rsi14,
      giu: r.tin === "MUA" || r.tin === "NAM GIU",
    });
    // Free float (DNSE): thap -> de bien dong manh; vong quay trong phien cao (KL phien cuoi / co phieu tu do) - chi tinh khi nen cuoi la phien hien tai.
    const ff = freeFloatCuaMa(ma);
    const nenCuoi = Array.isArray(bars) && bars.length ? bars[bars.length - 1] : null;
    const freeFloat = canhBaoFreeFloat({ freeFloatPct: ff?.pct, coPhieuTuDo: ff?.coPhieuTuDo, klPhien: nenCuoi && nenCuoi.t === ngayPhien ? nenCuoi.v : null });
    return { ...gopCanhBao(co.cacCanhBao, dongTien, freeFloat, 5), canGanNhat: co.canGanNhat };
  };
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
        ban_theo_doi: r?.ban_theo_doi ?? false,
        ban_theo_doi_tu: r?.ban_theo_doi_tu ?? null,
        coLenhWeb: Array.isArray(r?.lenh_web) && r.lenh_web.length > 0,
        mua_theo_doi_tu: r?.mua_theo_doi_tu ?? null,
        da_chot_mua: r?.da_chot_mua === true,
        gia: r?.gia ?? null,
        diem: r?.diem ?? null,
        // DA DIEN RA trong phien (lib/chuYTrongPhien.js): gia vuot / thung cac duong, cham TP, cat lo, MUA, BAN. Chi la nhan thong tin.
        chuY: r
          ? chuYTrongPhien({
              bars: barsTheoMa.get(t.ma),
              row: r,
              dongLenhNgay: lenhNgay.filter((d) => d.ma === t.ma && d.ngay_ban === ngayPhien),
              ngay: ngayPhien,
            })
          : { cacSuKien: [], them: 0 },
        // Canh bao DANG / SAP xay ra (loi de hieu): sap toi moc chot loi / vung can, gia duoi Tenkan / Kijun / may, Ban bot, Mat Than... (lib/canhBaoDanhMuc.js)
        canhBao: r ? taoCanhBao(r, t.ma) : { cacCanhBao: [], them: 0, canGanNhat: { tren: null, duoi: null } },
        lenh: lenhTheoMa.get(t.ma) ?? [],
      };
    })
    .sort((a, b) => Number(b.lenh.length > 0) - Number(a.lenh.length > 0) || a.ma.localeCompare(b.ma));

  // Canh bao DAY DU (gom dong tien, khoi ngoai, free float) chi tinh cho ma o danh sach chinh; ma o danh sach khac dung canh bao nhanh tinh tren trinh duyet.
  const canhBaoChinh = Object.fromEntries(dsMa.filter((m) => m.coDuLieu).map((m) => [m.ma, { cacCanhBao: m.canhBao.cacCanhBao.map(({ khoa, nhan, mau, muc }) => ({ khoa, nhan, mau, muc })), them: m.canhBao.them }]));
  const hang = tatCa.map((r) => hangGon(r, chiBaoTheoMa.get(r.ma)));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        Danh sách theo dõi
      </h1>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        Tạo nhiều danh sách (vd: Ngân hàng, Chờ mua, Kết quả lọc) để xem nhanh giá, tín hiệu và cảnh báo của từng mã. Thêm mã ở ô bên dưới, bằng nút{" "}
        <b style={{ color: TEXT }}>dấu trang</b> cạnh mã ở{" "}
        <Link href="/bo-loc" className="underline" style={{ color: PRIMARY }}>
          Bộ lọc
        </Link>
        , hoặc nút <b style={{ color: TEXT }}>Lưu vào danh sách</b> để lưu cả kết quả lọc.
      </p>
      <GiaiThichThem className="mb-2">
        Danh sách chính (biểu tượng chuông) là danh sách dùng cho thông báo khi bạn chọn chế độ &quot;Chỉ mã đang theo dõi&quot;, và có thêm phần vị thế, cảnh báo dòng tiền, khối ngoại, lệnh đã
        đóng kể từ ngày bạn theo dõi. Mỗi tài khoản có tối đa 20 danh sách, mỗi danh sách tối đa 200 mã. Giá mua, cắt lỗ, chốt lời theo lệnh của hệ thống (không phải giá khớp thật của bạn).
      </GiaiThichThem>
      <NhanCapNhat luc={capNhatMoiNhat(tatCa)} className="mb-5" />

      {loi ? (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      ) : (
        <DanhSachTheoDoi
          danhSachBanDau={danhSach}
          hang={hang}
          canhBaoChinh={canhBaoChinh}
          dsDauTien={typeof sp.ds === "string" ? sp.ds : null}
          chiTietChinh={
            thamGia.length > 0 ? (
              <>
                <section className="mb-10">
                  <DanhMucMa dsMa={dsMa} soCoDuLieu={cuaToi.length} soTheoDoi={thamGia.length} />
                </section>
                <section>
                  {loiDaDong && (
                    <p className="text-sm mb-3" style={{ color: DO }}>
                      Không tải được lệnh đã đóng: {loiDaDong}
                    </p>
                  )}
                  <LenhDaDongView nhung ds={dsDaDong} tieuDe="Lệnh đã đóng của tôi" moTa="Các lệnh của những mã trong danh sách chính, bán/thoát hoặc chốt đủ TP3 kể từ ngày bạn theo dõi mã đó." />
                </section>
              </>
            ) : null
          }
        />
      )}
    </div>
  );
}
