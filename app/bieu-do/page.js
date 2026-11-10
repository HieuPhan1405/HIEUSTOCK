import Link from "next/link";
import { Search } from "lucide-react";
import { layTinHieuTheoMa } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import BieuDoKyThuat from "@/components/BieuDoKyThuat";
import SignalPill from "@/components/SignalPill";
import { tinhVungLenh } from "@/components/dungChung";
import { tenCongTy } from "@/lib/tenMa";
import NutThamGia from "@/components/NutThamGia";
import XemNhanhDanhSach from "@/components/XemNhanhDanhSach";
import TabMaBieuDo from "@/components/TabMaBieuDo";
import { NGANH_NHAN } from "@/lib/nganh";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { layPhanTichMa } from "@/lib/phanTichCoBanDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Biểu đồ kỹ thuật",
  description: "Biểu đồ nến Nhật kèm Ichimoku, đường cân bằng dài hạn, MA và khối lượng cho cổ phiếu HOSE, HNX, UPCOM và VN-Index.",
};

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const GOI_Y = ["VNINDEX", "VN30", "VCB", "FPT", "HPG", "SSI", "STB"];

export default async function TrangBieuDo({ searchParams }) {
  const tham = await searchParams;
  const nhap = String(Array.isArray(tham?.ma) ? tham.ma[0] : tham?.ma || "VNINDEX");
  const ma = nhap.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "VNINDEX";

  // Vung mua/cat lo/chot loi chi hien cho nguoi da dang nhap (giong Bo loc / So lenh); ma khong co du lieu tin hieu van xem duoc bieu do.
  const nguoiDung = await layNguoiDungHienTai();
  let row = null;
  try {
    row = await layTinHieuTheoMa(ma);
  } catch {
    row = null;
  }
  const vung = nguoiDung?.da_duyet && row ? tinhVungLenh(row) : null;
  const ten = tenCongTy(ma);
  // Bang 5 o tren goc bieu do (Diem, Trang thai, Gia mua, So phien, Lai/lo) - cung dieu kien voi vung lenh: chi nguoi da dang nhap va duoc duyet.
  const thongTin =
    nguoiDung?.da_duyet && row && ma !== "VNINDEX"
      ? {
          diem: row.diem,
          tin: row.tin,
          banTheoDoiTu: row.ban_theo_doi ? row.ban_theo_doi_tu : null,
          webGiu: Array.isArray(row.lenh_web) && row.lenh_web.length > 0,
          muaTheoDoiTu: row.mua_theo_doi_tu ?? null,
          daChotMua: row.da_chot_mua === true,
          giaMua: row.gia_mua,
          soPhien: row.so_phien_giu,
          laiLo: row.lai_lo_pct,
        }
      : null;
  // O THONG TIN MA ben phai bieu do (kieu FireAnt, components/ThongTinMaBieuDo.js): CHI truong CONG KHAI - cot trong allowlist khach (lib/lamSachChoKhach.js),
  // chi bao ky thuat (bang chi_bao_ky_thuat, Bo loc chi bao cung cong khai) va phan tich co ban (trang ma cung cong khai). Nguon phu loi / chua co thi bo nhom do.
  let thongTinMa = null;
  if (ma !== "VNINDEX") {
    const [cbTat, ptcb] = await Promise.all([layChiBaoKyThuat().catch(() => null), layPhanTichMa(ma).catch(() => null)]);
    const cb = cbTat?.hang?.find((h) => h.ma === ma) ?? null;
    const quyMoi = ptcb?.q ? (ptcb.quyMoi ?? Object.keys(ptcb.q).sort().at(-1)) : null;
    const q = quyMoi ? ptcb.q[quyMoi] : null;
    const so = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : null);
    thongTinMa = {
      ten: ten?.ten ?? row?.ten_cong_ty ?? null,
      san: ten?.san ?? null,
      nganh: row?.nganh ? NGANH_NHAN[row.nganh] || row.nganh : null,
      giaoDich: { klTyLe: so(cb?.kl_ty_le), klTb20: so(row?.khoi_luong_tb20), gtgdTb20: so(row?.gtgd_tb20), vonHoaTy: so(row?.von_hoa_ty), freeFloat: so(row?.free_float), vonHoaTuDoTy: so(row?.von_hoa_tu_do_ty) },
      kyThuat: {
        gia: so(row?.gia), diem: so(row?.diem), trend: so(row?.trend), dt: so(row?.dt), adx: so(row?.adx), matThan: !!row?.mat_than,
        kijun: so(row?.kijun), ggBot: so(row?.gg_bot), ggTop: so(row?.gg_top), dinh52: so(row?.dinh_52t), rs20: so(row?.rs_vni), rs60: so(row?.rs_vni_60),
        rsi: so(cb?.rsi14), mfi: so(cb?.mfi14), cachMa200: so(cb?.cach_ma200_pct),
      },
      coBan: ptcb?.dinhGia
        ? {
            quy: quyMoi && /^\d{4}-\d{2}-\d{2}$/.test(quyMoi) ? `Quý ${Math.ceil(Number(quyMoi.slice(5, 7)) / 3)}/${quyMoi.slice(0, 4)}` : quyMoi,
            pe: ptcb.dinhGia.pe ?? null, peNganh: so(ptcb.dinhGia.peNganh), pb: so(ptcb.dinhGia.pb), pbNganh: so(ptcb.dinhGia.pbNganh), coTuc: so(ptcb.dinhGia.tyLeCoTuc),
            roe: so(q?.roe), lnYoY: so(q?.lnTTMYoY), dtYoY: so(q?.dtTTMYoY), xepLoai: ptcb.d360?.xepLoai ?? null, diem360: so(ptcb.d360?.tong),
          }
        : null,
    };
  }

  // 10/11/2026 bo cuc kieu FireAnt Charts: bo tieu de to + dong huong dan, gom O TIM MA + XEM NHANH + TEN MA vao 1 HANG cong cu, bieu do rong het chieu ngang va cao toi sat day man hinh.
  return (
    <div className="px-3 sm:px-4 py-3" style={{ color: TEXT }}>
      <h1 className="sr-only">Biểu đồ kỹ thuật {ma}</h1>
      <TabMaBieuDo ma={ma} idOTim="o-tim-ma-bieu-do" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
        <form action="/bieu-do" method="get" className="relative w-36 shrink-0">
          <Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input
            id="o-tim-ma-bieu-do"
            name="ma"
            defaultValue={ma}
            key={ma}
            autoComplete="off"
            maxLength={12}
            placeholder="Nhập mã…"
            aria-label="Mã cổ phiếu hoặc chỉ số (Enter để xem)"
            className="w-full h-8 pl-8 pr-2 text-sm outline-none rounded-lg"
            style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)", fontWeight: 700, textTransform: "uppercase" }}
          />
        </form>
        {ten && (
          <p className="flex flex-wrap items-center gap-2 text-sm min-w-0" style={{ color: MUTED }}>
            <span className="truncate max-w-[280px]" title={ten.ten}>
              {ten.ten} · {ten.san}
            </span>
            {ma !== "VNINDEX" && nguoiDung?.da_duyet && <NutThamGia ma={ma} soNguoiThamGia={0} daThamGia={false} />}
          </p>
        )}
        {row && ma !== "VNINDEX" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {nguoiDung && <SignalPill tin={row.tin} banTheoDoiTu={row.ban_theo_doi ? row.ban_theo_doi_tu : null} webGiu={Array.isArray(row.lenh_web) && row.lenh_web.length > 0} muaTheoDoiTu={row.mua_theo_doi_tu ?? null} daChotMua={row.da_chot_mua === true} />}
            <Link href={`/ma/${ma}`} className="text-xs" style={{ color: "var(--tim-chu)" }}>
              Chi tiết {ma} →
            </Link>
          </div>
        )}
        {/* thanh vien: cac ma trong danh sach theo doi; khach: goi y co dinh */}
        <XemNhanhDanhSach ma={ma} goiY={GOI_Y} className="lg:ml-auto" />
      </div>

      <BieuDoKyThuat ma={ma} vung={vung} ngayMua={vung ? row.ngay_mua : null} chieuCao={520} layDayManHinh truCao={290} thongTin={thongTin} boCucRong thongTinMa={thongTinMa} />
    </div>
  );
}
