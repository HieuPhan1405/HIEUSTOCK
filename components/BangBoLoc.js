"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Lock } from "lucide-react";
import NutXuatBang from "@/components/NutXuatBang";
import SignalPill from "@/components/SignalPill";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";
import NutThamGia from "@/components/NutThamGia";
import NutLuuDanhSach from "@/components/NutLuuDanhSach";
import NhanPhuTinHieu, { dsNhanPhu } from "@/components/NhanPhuTinHieu";
import { CAC_COT } from "@/components/cotChung";
import { COT_CHI_BAO_HIEN, THU_TU_COT_CHI_BAO } from "@/components/cotChiBao";
import BoLocChiBaoKyThuat from "@/components/BoLocChiBaoKyThuat";
import { locTheoChiBao, cotChoBoLoc } from "@/lib/boLocChiBao";
import { coCanhBaoBanBot } from "@/lib/ghiChuTuDong";
import {
  NGANH_NHAN,
  LOC_TRONG,
  NHAN_UU_TIEN,
  docLocChungTuUrl,
  locChung,
  coLocChung,
  OSelect,
  HangBoLocChung,
  useCotHienThi,
  ChonCotHienThi,
  useLuaChonLuu,
  HangLocNhanh,
  ThanhGocNhin,
} from "@/components/boLocChung";
import { fmt, pct, soAn, fmtTy, chamTPCaoNhat, datChuanUuTien, sapChamMoc, laChoPhienSau, laDangGiu, lyDoChuaCoDiemMua, phanLoaiXuHuong, NGUONG_DIEM_MUA } from "@/components/dungChung";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const PRIMARY = "#8B5CF6";

// Bo loc "MA THEO DOI" gom 2 nhom: (1) da DAT DIEM MUA nhung dang doi phien sau (laChoPhienSau) va
// (2) chi ma sap cham moc tinh diem +: ma chua co lenh, gia
// dang cach 1 moc (may / duong can bang dai han) khong qua bienMoc % ma VUOT QUA thi duoc cong
// diem va du diem MUA (xem sapChamMoc trong dungChung.js). Du lieu moc chi co
// sau khi Explore lai voi AFL moi - TRUOC DO tam dung cach cu: ma TRUNG LAP co
// diem nam sat duoi nguong MUA (trong BIEN_DO_GAN_MUA diem).
const BIEN_DO_GAN_MUA = 0.5;
const CAC_BIEN_MOC = [1, 2, 3, 5];
const COT_THEO_DOI = ["moc_tiep_theo", "diem_neu_vuot"];

function laMaTheoDoi(r, coDuLieuMoc, bienMoc) {
  if (laChoPhienSau(r)) return true;
  if (coDuLieuMoc) return sapChamMoc(r, bienMoc);
  return r.tin === "TRUNG LAP" && r.diem >= NGUONG_DIEM_MUA - BIEN_DO_GAN_MUA && r.diem < NGUONG_DIEM_MUA;
}

// Cot ma + tin hieu co logic rieng (nut Tham gia, khoa Tin hieu khi chua dang
// nhap) nen dinh nghia tai day; cac cot chi so con lai lay tu cotChung.js.
const COT_RIENG = {
  ma: {
    nhan: "Mã",
    canPhai: false,
    lay: (r) => r.ma,
    hien: (row, ctx) => (
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <Link href={`/ma/${row.ma}`} className="hover:underline" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
            {row.ma}
          </Link>
          {row.mat_than && (
            <span className="text-[11px] font-bold" style={{ color: DO }} title="Cảnh báo Mắt Thần: rủi ro đảo chiều">
              ⚠
            </span>
          )}
          <NutThamGia
            ma={row.ma}
            soNguoiThamGia={ctx.banDoThamGia[row.ma]?.soNguoiThamGia ?? 0}
            daThamGia={ctx.banDoThamGia[row.ma]?.daThamGia ?? false}
            coDangNhap={!!ctx.nguoiDung}
            moChuaDangNhap={ctx.moModalTK}
            onDoiTrangThai={ctx.doiTrangThaiThamGia}
          />
        </div>
        {row.ten_ngan && (
          <span className="block max-w-[170px] truncate text-[11px] font-normal leading-tight mt-0.5" style={{ color: MUTED, fontFamily: "var(--font-chu)" }} title={row.ten_cong_ty}>
            {row.ten_ngan}
          </span>
        )}
      </div>
    ),
  },
  tin: {
    nhan: "Tín hiệu",
    canPhai: true,
    lay: (r) => r.tin,
    // 1 nhan tin hieu + 1 nhan phu quan trong nhat (+n, re chuot xem du) - truoc day xep chong toi 7 nhan co bieu tuong.
    hien: (row, ctx) =>
      ctx.nguoiDung ? (
        <div className="flex flex-col items-end gap-1">
          <SignalPill tin={row.tin} banTheoDoiTu={row.ban_theo_doi ? row.ban_theo_doi_tu : null} webGiu={Array.isArray(row.lenh_web) && row.lenh_web.length > 0} muaTheoDoiTu={row.mua_theo_doi_tu ?? null} daChotMua={row.da_chot_mua === true} />
          {/* tp_da_cham cua ma KHONG con giu chi la lich su lan mua gan nhat - khong hien. */}
          <NhanPhuTinHieu ds={dsNhanPhu(row, { tp: laDangGiu(row) ? chamTPCaoNhat(row) : null })} />
        </div>
      ) : (
        <button type="button" onClick={ctx.moModalTK} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold" style={{ background: "var(--phu)", color: MUTED }} title="Đăng ký/Đăng nhập để xem tín hiệu">
          <Lock size={10} />
          <span style={{ filter: "blur(3px)" }}>MUA</span>
        </button>
      ),
  },
};

const COT = { ...CAC_COT, ...COT_RIENG, ...COT_CHI_BAO_HIEN };

// Thu tu cot tren bang (moi goc nhin chi lay 1 phan, theo dung thu tu nay).
const THU_TU_COT = [
  "ma",
  "san",
  "von_hoa",
  "von_hoa_ty",
  "free_float",
  "von_hoa_tu_do_ty",
  "nganh",
  "gia",
  "doi",
  "diem",
  "diem_rank",
  "diem_confidence",
  "moc_tiep_theo",
  "diem_neu_vuot",
  "trend",
  "dt",
  "mom",
  "adx",
  "rs_vni",
  "rs_vni_60",
  "vi_tri_120",
  "sanyaku",
  "breadth_nganh",
  "khoi_luong_tb20",
  "gtgd_tb20",
  "uu_tien",
  "gia_mua",
  "ngay_mua",
  "so_phien_giu",
  "lai_lo_pct",
  "gia_kich_hoat",
  "vung_mua",
  "vung_sl",
  "vung_tp",
  "stop_loss",
  "tp1",
  "tp2",
  "tp3",
  "chot_loi",
  "kijun",
  "gg_top",
  "gg_bot",
  "dinh_52t",
  ...THU_TU_COT_CHI_BAO,
  "tin",
];
const MAC_DINH = ["san", "von_hoa", "von_hoa_ty", "free_float", "nganh", "gia", "doi", "diem", "trend", "adx", "rs_vni", "khoi_luong_tb20", "gtgd_tb20"];
const DS_KHOA_CHON = THU_TU_COT.filter((k) => k !== "ma" && k !== "tin");

// GOC NHIN (04/11/2026, theo cac tab Overview / Performance / Technical cua TradingView, Finviz): moi goc nhin 1 bo cot vua du. "Tuỳ chọn" = cac cot nguoi dung tu tick (Cot hien thi).
const GOC_NHIN = [
  { khoa: "tongQuan", nhan: "Tổng quan", cot: ["nganh", "gia", "doi", "diem", "trend", "rs_vni", "gtgd_tb20"] },
  { khoa: "kyThuat", nhan: "Kỹ thuật", cot: ["gia", "doi", "diem", "trend", "mom", "dt", "adx", "rs_vni", "rs_vni_60", "vi_tri_120", "breadth_nganh"] },
  { khoa: "thanhKhoan", nhan: "Thanh khoản & vốn hoá", cot: ["san", "von_hoa", "von_hoa_ty", "free_float", "gia", "doi", "khoi_luong_tb20", "gtgd_tb20", "uu_tien"] },
  { khoa: "viThe", nhan: "Vị thế", thanhVien: true, cot: ["gia", "doi", "ngay_mua", "gia_mua", "lai_lo_pct", "so_phien_giu", "vung_mua", "vung_sl", "vung_tp", "chot_loi"] },
  { khoa: "mocGia", nhan: "Mốc giá", cot: ["gia", "doi", "kijun", "gg_bot", "gg_top", "dinh_52t", "tp1", "tp2", "tp3"] },
  { khoa: "tuyChon", nhan: "Tuỳ chọn", cot: null },
];
const KHOA_GOC_NHIN = GOC_NHIN.map((g) => g.khoa);

// Sap xep tren dien thoai (khong co tieu de cot de bam)
const SAP_XEP_DT = [
  ["diem", "Điểm cao nhất"],
  ["doi", "Tăng mạnh nhất hôm nay"],
  ["gtgd_tb20", "Thanh khoản lớn nhất"],
  ["rs_vni", "Mạnh hơn VN-Index (20 phiên)"],
  ["von_hoa_ty", "Vốn hoá lớn nhất"],
  ["ma", "Mã A → Z"],
];

// Ve 60 dong dau, cuon toi gan cuoi (hoac bam "Hien them") thi ve them 80 dong.
const SO_DONG_DAU = 60;
const SO_DONG_THEM = 80;
// Cot lo ra ma nao DANG GIU (gia mua/lai lo/stop-loss/TP chi co gia tri voi ma dang MUA/NAM GIU) - chi hien khi da dang nhap, neu khong khach chua dang ky
// se suy ra duoc cot Tin hieu dang bi lam mo.
const COT_CAN_DANG_NHAP = new Set(["gia_mua", "ngay_mua", "so_phien_giu", "lai_lo_pct", "gia_kich_hoat", "vung_mua", "vung_sl", "vung_tp", "stop_loss", "tp1", "tp2", "tp3", "chot_loi"]);

// Cac khoa loc thuoc "Bo loc nhanh" (bam nut nhanh nay thi bo cac nut nhanh khac, giu nguyen o tim / san / von hoa / nganh).
const xoaNhanh = (l) => ({ ...l, tin: "", xuHuong: "", chiGanDiemMua: false, chiDuDiemChuaMua: false, chiMatThan: false, chiChotLoi: false, chiBanBot: false, chiUuTien: false });

export default function BangBoLoc({ duLieu, chiBaoLuc = null }) {
  const searchParams = useSearchParams();
  const [sapXep, setSapXep] = useState({ khoa: "diem", chieu: "desc" });
  // Doc bo loc ban dau tu URL - chi doc 1 LAN luc khoi tao state, sau do nguoi
  // dung tu do chinh sua tren giao dien.
  const [loc, datLoc] = useState(() => ({
    ...docLocChungTuUrl(searchParams),
    tin: searchParams.get("tin") || "",
    chiGanDiemMua: searchParams.get("gandiemmua") === "1",
    chiDuDiemChuaMua: searchParams.get("duDiemChuaMua") === "1",
    bienMoc: 3,
  }));
  const cotHienThi = useCotHienThi("cs_cot_boloc_v1", DS_KHOA_CHON, MAC_DINH);
  const [gocNhin, datGocNhin] = useLuaChonLuu("cs_goc_nhin_boloc", "tongQuan", KHOA_GOC_NHIN);
  // Bo loc chi bao ky thuat (RSI, MACD, MA...) - khung rieng, moi bo loc: { id, chiBao, dieuKien, tu, den } (xem lib/boLocChiBao.js).
  const [locChiBao, datLocChiBao] = useState([]);
  // Cot "Tin hieu" (MUA/BAN/NAM GIU/TRUNG LAP) bi lam mo cho khach CHUA dang
  // ky/dang nhap - de mac dinh la CHUA dang nhap (an toan hon, tranh nhap
  // nhoang lo tin hieu that truoc khi fetch xong).
  const [nguoiDung, setNguoiDung] = useState(null);
  const [moModalTK, setMoModalTK] = useState(false);
  // Dien thoai: o loc chi tiet (san, nganh, von hoa, chi bao) gon sau 1 nut, mo khi can
  const [moLocChiTiet, setMoLocChiTiet] = useState(false);
  // Ban do "Tham gia" - {ma: {daThamGia, soNguoiThamGia}}, nap 1 lan cho ca bang (tranh goi API rieng tung dong).
  const [banDoThamGia, setBanDoThamGia] = useState({});

  useEffect(() => {
    fetch("/api/nguoi-dung-hien-tai")
      .then((r) => r.json())
      // Tai khoan CHUA duoc admin duyet (da_duyet=false) coi nhu chua dang nhap o day - khong mo
      // khoa cot vi the (giong nguoi chua dang ky), du van dang nhap duoc binh thuong o noi khac.
      .then((d) => setNguoiDung(d.nguoiDung?.da_duyet ? d.nguoiDung : null))
      .catch(() => {});
    fetch("/api/tham-gia")
      .then((r) => r.json())
      .then((d) => {
        const maCuaToi = new Set(d.maCuaToi || []);
        const ban = {};
        for (const [ma, dem] of Object.entries(d.demTatCa || {})) {
          ban[ma] = { soNguoiThamGia: dem, daThamGia: maCuaToi.has(ma) };
        }
        for (const ma of maCuaToi) {
          if (!ban[ma]) ban[ma] = { soNguoiThamGia: 0, daThamGia: true };
        }
        setBanDoThamGia(ban);
      })
      .catch(() => {});
  }, []);

  function doiTrangThaiThamGia(ma, trangThaiMoi) {
    setBanDoThamGia((cu) => ({ ...cu, [ma]: trangThaiMoi }));
  }

  const soTang = duLieu.filter((r) => r.doi > 0).length;
  const soGiam = duLieu.filter((r) => r.doi < 0).length;
  const soDung = duLieu.length - soTang - soGiam;
  // Chua co du lieu moc (chua Explore lai voi AFL moi) -> bo loc theo doi dung cach cu.
  const coDuLieuMoc = useMemo(() => duLieu.some((r) => r.moc_cach_pct != null), [duLieu]);

  // BO LOC NHANH: dem tren tap da qua cac o tim / san / von hoa / nganh (khong tinh cac nut nhanh khac).
  const coSoNhanh = useMemo(() => locChung(duLieu, xoaNhanh(loc)), [duLieu, loc]);
  const locNhanh = useMemo(() => {
    const dem = (f) => coSoNhanh.filter(f).length;
    const khongNhanh = !(loc.tin || loc.xuHuong || loc.chiGanDiemMua || loc.chiDuDiemChuaMua || loc.chiMatThan || loc.chiChotLoi || loc.chiBanBot || loc.chiUuTien);
    return [
      { khoa: "tatca", nhan: "Tất cả", dem: coSoNhanh.length, dang: khongNhanh, ap: (l) => xoaNhanh(l) },
      { khoa: "mua", nhan: "Tín hiệu MUA", thanhVien: true, dem: dem((r) => r.tin === "MUA"), dang: loc.tin === "MUA", ap: (l) => ({ ...xoaNhanh(l), tin: "MUA" }), moTa: "Mã vừa có tín hiệu MUA trong phiên" },
      { khoa: "giu", nhan: "Đang nắm giữ", thanhVien: true, dem: dem((r) => r.tin === "NAM GIU"), dang: loc.tin === "NAM GIU", ap: (l) => ({ ...xoaNhanh(l), tin: "NAM GIU" }) },
      {
        khoa: "sapMua",
        nhan: "Sắp có điểm mua",
        thanhVien: true, // can cot tin (khach chi nhan du lieu da lam sach -> luon 0)
        dem: dem((r) => laMaTheoDoi(r, coDuLieuMoc, loc.bienMoc)),
        dang: loc.chiGanDiemMua,
        ap: (l) => ({ ...xoaNhanh(l), chiGanDiemMua: true }),
        sapXep: coDuLieuMoc ? { khoa: "moc_tiep_theo", chieu: "asc" } : null,
        moTa: "Mã chưa có lệnh và (1) đã đạt điểm MUA nhưng đang đợi phiên sau xác nhận khối lượng, hoặc (2) giá đang sát một mốc (mây / đường cân bằng dài hạn) mà vượt qua thì được cộng điểm và đủ điểm MUA",
      },
      {
        khoa: "duDiem",
        nhan: "Đủ điểm, chưa mua",
        thanhVien: true,
        dem: dem((r) => lyDoChuaCoDiemMua(r)),
        dang: loc.chiDuDiemChuaMua,
        ap: (l) => ({ ...xoaNhanh(l), chiDuDiemChuaMua: true }),
        sapXep: { khoa: "diem", chieu: "desc" },
        moTa: "Điểm hợp lưu đã đạt ngưỡng mua nhưng hệ thống chưa báo MUA. Mở trang mã để xem lý do (chờ khối lượng, thanh khoản, ADX, đợt đã báo...).",
      },
      { khoa: "tang", nhan: "Xu hướng tăng", dem: dem((r) => phanLoaiXuHuong(r) === "xanh"), dang: loc.xuHuong === "xanh", ap: (l) => ({ ...xoaNhanh(l), xuHuong: "xanh" }) },
      { khoa: "uuTien", nhan: "Thanh khoản tốt", dem: dem(datChuanUuTien), dang: loc.chiUuTien, ap: (l) => ({ ...xoaNhanh(l), chiUuTien: true }), moTa: NHAN_UU_TIEN },
      { khoa: "chotLoi", nhan: "Đã chạm chốt lời", thanhVien: true, dem: dem((r) => laDangGiu(r) && chamTPCaoNhat(r)), dang: loc.chiChotLoi, ap: (l) => ({ ...xoaNhanh(l), chiChotLoi: true }) },
      { khoa: "banBot", nhan: "Cảnh báo bán bớt", thanhVien: true, dem: dem(coCanhBaoBanBot), dang: loc.chiBanBot, ap: (l) => ({ ...xoaNhanh(l), chiBanBot: true }) },
      { khoa: "matThan", nhan: "Cảnh báo Mắt Thần", dem: dem((r) => r.mat_than), dang: loc.chiMatThan, ap: (l) => ({ ...xoaNhanh(l), chiMatThan: true }), moTa: "Rủi ro đảo chiều: giá tạo đỉnh trên mây rồi hồi vào mây mà không bật lại" },
    ].map((m) => ({ ...m, biKhoa: m.thanhVien && !nguoiDung }));
  }, [coSoNhanh, loc, coDuLieuMoc, nguoiDung]);

  function chonNhanh(m) {
    if (m.biKhoa) {
      setMoModalTK(true);
      return;
    }
    datLoc((cu) => (m.dang && m.khoa !== "tatca" ? xoaNhanh(cu) : m.ap(cu)));
    if (m.sapXep && !m.dang) setSapXep(m.sapXep);
  }

  const daLoc = useMemo(() => {
    let ds = locChung(duLieu, loc);
    if (loc.tin && nguoiDung) ds = ds.filter((r) => r.tin === loc.tin);
    if (loc.chiGanDiemMua) ds = ds.filter((r) => laMaTheoDoi(r, coDuLieuMoc, loc.bienMoc));
    if (loc.chiDuDiemChuaMua) ds = ds.filter((r) => lyDoChuaCoDiemMua(r));
    ds = locTheoChiBao(ds, locChiBao);

    const lay = COT[sapXep.khoa]?.lay;
    if (!lay) return ds;
    return [...ds].sort((a, b) => {
      const va = lay(a);
      const vb = lay(b);
      let so = 0;
      if (typeof va === "string" || typeof vb === "string") {
        so = String(va ?? "").localeCompare(String(vb ?? ""));
      } else {
        so = (va ?? -Infinity) - (vb ?? -Infinity);
      }
      return sapXep.chieu === "asc" ? so : -so;
    });
  }, [duLieu, loc, sapXep, nguoiDung, coDuLieuMoc, locChiBao]);

  // VE DAN: bang ~390 dong x hon chuc cot = gan 30.000 phan tu DOM, nang tren dien thoai. So dong duoc ghi gan voi bo loc + sap xep hien tai: doi bo loc / sap xep thi
  // quay ve 60 dong dau. Khoa theo bo loc + sap xep (KHONG theo danh tinh mang `daLoc`): du lieu duoc lam moi moi 60 giay nhung so dong da ve va vi tri cuon KHONG bi dat lai.
  const khoaLoc = JSON.stringify([loc, sapXep, locChiBao, !!nguoiDung]);
  const [veDan, setVeDan] = useState({ khoa: null, n: SO_DONG_DAU });
  const soDong = veDan.khoa === khoaLoc ? veDan.n : SO_DONG_DAU;
  const veThem = useCallback(() => setVeDan({ khoa: khoaLoc, n: soDong + SO_DONG_THEM }), [khoaLoc, soDong]);
  const canCuoiRef = useCallback(
    (el) => {
      if (!el || typeof IntersectionObserver === "undefined") return;
      const io = new IntersectionObserver((es) => es[0]?.isIntersecting && veThem(), { rootMargin: "600px" });
      io.observe(el);
      return () => io.disconnect();
    },
    [veThem]
  );

  function doiSapXep(khoa) {
    if (!COT[khoa]?.lay) return;
    // Sap xep theo Tin hieu se lo thu tu MUA/BAN - yeu cau dang nhap.
    if (khoa === "tin" && !nguoiDung) {
      setMoModalTK(true);
      return;
    }
    setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: khoa === "ma" ? "asc" : "desc" }));
  }

  function xoaBoLoc() {
    datLoc({ ...LOC_TRONG, tin: "", chiGanDiemMua: false, chiDuDiemChuaMua: false, bienMoc: 3 });
    datLocChiBao([]);
  }

  const coBoLoc = coLocChung(loc) || loc.tin || loc.chiGanDiemMua || loc.chiDuDiemChuaMua || locChiBao.length > 0;
  const soLocChiTiet = [loc.timKiem, loc.vonHoa, loc.san, loc.nganh].filter(Boolean).length + locChiBao.length;
  const duocXemCot = (k) => !!nguoiDung || !COT_CAN_DANG_NHAP.has(k);
  const dsKhoaChon = DS_KHOA_CHON.filter(duocXemCot);
  const dsGocNhin = GOC_NHIN.filter((g) => !g.thanhVien || nguoiDung);
  const gocHienTai = dsGocNhin.find((g) => g.khoa === gocNhin) ?? dsGocNhin[0];
  const cotGoc = gocHienTai.cot ? new Set(gocHienTai.cot) : cotHienThi.dangChon;
  // Dang loc "ma theo doi" thi tu hien 2 cot moc can vuot + diem neu vuot; dang loc theo chi bao nao thi tu hien cot cua chi bao do.
  const hienCotTheoDoi = loc.chiGanDiemMua && coDuLieuMoc;
  const cotTuHien = cotChoBoLoc(locChiBao);
  const dsCot = THU_TU_COT.filter((k) => COT[k] && (k === "ma" || k === "tin" || ((cotGoc.has(k) || cotTuHien.includes(k) || (hienCotTheoDoi && COT_THEO_DOI.includes(k))) && duocXemCot(k))));
  const ctx = {
    nhanNganh: NGANH_NHAN,
    nguoiDung,
    banDoThamGia,
    doiTrangThaiThamGia,
    moModalTK: () => setMoModalTK(true),
  };
  // Tren dien thoai: neu dang sap xep theo cot khong co san trong the thi hien them gia tri cot do.
  const cotSapXepThem = !["diem", "doi", "gia", "ma", "gtgd_tb20", "tin"].includes(sapXep.khoa) && COT[sapXep.khoa] && duocXemCot(sapXep.khoa) ? sapXep.khoa : null;

  return (
    <div>
      {/* BO LOC NHANH (1 cham ra danh sach) */}
      <HangLocNhanh
        ds={locNhanh}
        onChon={chonNhanh}
        sau={
          loc.chiGanDiemMua && coDuLieuMoc ? (
            <OSelect value={String(loc.bienMoc)} onChange={(v) => datLoc((cu) => ({ ...cu, bienMoc: Number(v) }))} placeholder="Cách mốc tối đa" options={CAC_BIEN_MOC.map((n) => [String(n), `Cách mốc ≤ ${n}%`])} />
          ) : null
        }
      />

      {/* LOC CHI TIET: tim ma, tin hieu, von hoa, xu huong, san, nganh (+ chi bao ky thuat). Dien thoai: an sau nut "Loc them". */}
      <button type="button" onClick={() => setMoLocChiTiet((v) => !v)} aria-expanded={moLocChiTiet} className="sm:hidden w-full flex items-center justify-between gap-3 text-left px-3 py-2.5 mb-3 rounded-xl border text-sm" style={{ borderColor: soLocChiTiet ? PRIMARY : VIEN, background: NEN_CARD, color: "var(--chu)", fontFamily: "var(--font-chu)" }}>
        <span>
          Lọc thêm (sàn, ngành, vốn hoá, chỉ báo)
          {soLocChiTiet > 0 && <b style={{ color: "var(--tim-chu)" }}> · {soLocChiTiet} đang bật</b>}
        </span>
        <span style={{ color: MUTED }}>{moLocChiTiet ? "Thu gọn" : "Mở"}</span>
      </button>
      <div className={moLocChiTiet ? "" : "hidden sm:block"}>
      <HangBoLocChung
        loc={loc}
        datLoc={datLoc}
        coBoLoc={coBoLoc}
        onXoa={xoaBoLoc}
        truocChon={
          nguoiDung ? (
            <OSelect
              value={loc.tin}
              onChange={(v) => datLoc((cu) => ({ ...cu, tin: v }))}
              placeholder="Tất cả tín hiệu"
              options={[
                ["MUA", "MUA"],
                ["NAM GIU", "NẮM GIỮ"],
                ["BAN", "BÁN"],
                ["TRUNG LAP", "TRUNG LẬP"],
              ]}
            />
          ) : (
            <button type="button" onClick={() => setMoModalTK(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg" style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: MUTED, fontFamily: "var(--font-chu)" }}>
              <Lock size={13} />
              Tất cả tín hiệu
            </button>
          )
        }
      />

      <BoLocChiBaoKyThuat dsLoc={locChiBao} datDsLoc={datLocChiBao} duLieu={duLieu} luc={chiBaoLuc} />
      </div>

      {/* GOC NHIN (chi o bang may tinh; the dien thoai co noi dung co dinh) + SO KET QUA */}
      <div className="hidden sm:block">
      <ThanhGocNhin
        ds={dsGocNhin}
        dang={gocHienTai.khoa}
        onChon={datGocNhin}
        phai={
          <div className="flex items-center gap-2">
            <ChonCotHienThi
              cot={COT}
              dsKhoa={dsKhoaChon}
              dangChon={cotHienThi.dangChon}
              onBat={(k) => {
                cotHienThi.bat(k);
                datGocNhin("tuyChon");
              }}
              onHienTatCa={() => {
                cotHienThi.hienTatCa();
                datGocNhin("tuyChon");
              }}
              onMacDinh={cotHienThi.macDinh}
              ghiChu={nguoiDung ? "Tick cột ở đây sẽ chuyển sang góc nhìn Tuỳ chọn." : "Đăng nhập để xem thêm các cột vị thế: giá mua, lãi/lỗ, mức cắt lỗ, TP."}
            />
            {/* cot "Tin hieu" chi xuat cho nguoi da dang nhap (khach chi thay ban lam mo) */}
            <NutXuatBang cot={dsCot.filter((k) => k !== "tin" || nguoiDung).map((k) => ({ khoa: k, nhan: COT[k].nhan, lay: COT[k].lay }))} hang={daLoc} ctx={ctx} />
          </div>
        }
      />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-xs" style={{ color: MUTED }}>
          <b style={{ color: "var(--chu)" }}>{daLoc.length}</b> / {duLieu.length} mã · <span style={{ color: XANH }}>{soTang} tăng</span> · <span style={{ color: DO }}>{soGiam} giảm</span> · {soDung} đứng giá
        </p>
        {/* luu ca ket qua dang loc thanh danh sach theo doi (Danh muc cua toi) */}
        <NutLuuDanhSach dsMa={daLoc.map((r) => r.ma)} coDangNhap={!!nguoiDung} moChuaDangNhap={() => setMoModalTK(true)} />
      </div>

      {/* DIEN THOAI: danh sach the (bang nhieu cot kho doc tren man hinh nho) */}
      <div className="sm:hidden">
        <label className="flex items-center gap-2 text-sm mb-2" style={{ color: MUTED }}>
          Sắp xếp
          <select value={SAP_XEP_DT.some(([k]) => k === sapXep.khoa) ? sapXep.khoa : ""} onChange={(e) => e.target.value && setSapXep({ khoa: e.target.value, chieu: e.target.value === "ma" ? "asc" : "desc" })} className="flex-1 px-2 py-1.5 rounded-lg text-sm" style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: "var(--chu)" }}>
            {!SAP_XEP_DT.some(([k]) => k === sapXep.khoa) && <option value="">{COT[sapXep.khoa]?.nhan ?? "—"}</option>}
            {SAP_XEP_DT.map(([k, nhan]) => (
              <option key={k} value={k}>
                {nhan}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
          {daLoc.slice(0, soDong).map((r, i) => (
            <Link key={r.ma} href={`/ma/${r.ma}`} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className="font-bold" style={{ fontFamily: "var(--font-chu)" }}>
                    {r.ma}
                  </span>
                  {r.mat_than && <span style={{ color: DO }}>⚠</span>}
                  <NutThamGia ma={r.ma} soNguoiThamGia={banDoThamGia[r.ma]?.soNguoiThamGia ?? 0} daThamGia={banDoThamGia[r.ma]?.daThamGia ?? false} coDangNhap={!!nguoiDung} moChuaDangNhap={ctx.moModalTK} onDoiTrangThai={doiTrangThaiThamGia} />
                  <span className="text-xs truncate" style={{ color: MUTED }}>
                    {r.ten_ngan}
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  Điểm <b style={{ color: r.diem >= 0 ? XANH : DO }}>{soAn(r.diem)}</b>
                  {" · GTGD "}
                  {fmtTy(r.gtgd_tb20)} tỷ
                  {cotSapXepThem && (
                    <>
                      {" · "}
                      {COT[cotSapXepThem].nhan} {COT[cotSapXepThem].hien(r, ctx)}
                    </>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold" style={{ fontFamily: "var(--font-chu)" }}>
                  {fmt(r.gia)}
                </p>
                <p className="text-xs font-semibold" style={{ color: r.doi > 0 ? XANH : r.doi < 0 ? DO : MUTED }}>
                  {pct(r.doi, 2)}
                </p>
              </div>
              {nguoiDung && (
                <div className="shrink-0 w-[74px] flex flex-col items-end gap-0.5">
                  <SignalPill tin={r.tin} banTheoDoiTu={r.ban_theo_doi ? r.ban_theo_doi_tu : null} webGiu={Array.isArray(r.lenh_web) && r.lenh_web.length > 0} muaTheoDoiTu={r.mua_theo_doi_tu ?? null} daChotMua={r.da_chot_mua === true} />
                </div>
              )}
            </Link>
          ))}
          {daLoc.length === 0 && (
            <p className="py-6 text-center text-sm" style={{ color: MUTED }}>
              Không tìm thấy mã nào khớp bộ lọc hiện tại.
            </p>
          )}
        </div>
        {daLoc.length > soDong && (
          <div ref={canCuoiRef} className="py-3 text-center">
            <button type="button" onClick={veThem} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: VIEN, color: "var(--tim-chu)" }}>
              Hiện thêm ({daLoc.length - soDong} mã)
            </button>
          </div>
        )}
      </div>

      {/* MAY TINH / MAY TINH BANG: bang, tieu de cot dinh khi cuon (cuon trong khung) */}
      <div className="hidden sm:block rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-auto bang-cuon max-h-[calc(100vh-150px)]">
          <table className="w-full text-sm" style={{ fontFamily: "var(--font-chu)" }}>
            <thead>
              <tr className="text-left" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
                {dsCot.map((k) => {
                  const c = COT[k];
                  return (
                    <th
                      key={k}
                      className={`sticky top-0 py-2.5 px-3 font-normal select-none whitespace-nowrap border-b ${c.lay ? "cursor-pointer hover:text-[color:var(--chu)]" : ""} ${c.canPhai ? "text-right" : "text-left"} ${k === "ma" ? "left-0 z-[3]" : "z-[2]"}`}
                      style={{ background: NEN_CARD, borderColor: VIEN }}
                      onClick={() => doiSapXep(k)}
                    >
                      <span className="inline-flex items-center gap-1" data-may={`cot-${k}`}>
                        {c.nhan}
                        {c.lay &&
                          (sapXep.khoa === k ? (
                            sapXep.chieu === "desc" ? (
                              <ArrowDown size={12} color={PRIMARY} />
                            ) : (
                              <ArrowUp size={12} color={PRIMARY} />
                            )
                          ) : (
                            <ArrowUpDown size={12} opacity={0.35} />
                          ))}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {daLoc.slice(0, soDong).map((row, i) => (
                <tr key={row.ma} className={`hover:bg-[color:var(--hover-nhe)] transition-colors ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
                  {dsCot.map((k) => {
                    const c = COT[k];
                    return (
                      <td key={k} className={`py-2 px-3 ${c.canPhai ? "text-right" : ""} ${k === "ma" ? "sticky left-0 z-[1]" : ""}`} style={k === "ma" ? { background: NEN_CARD } : undefined}>
                        {c.hien(row, ctx)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {daLoc.length === 0 && (
                <tr>
                  <td colSpan={dsCot.length} className="py-6 text-center text-sm" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
                    Không tìm thấy mã nào khớp bộ lọc hiện tại.
                  </td>
                </tr>
              )}
              {daLoc.length > soDong && (
                <tr ref={canCuoiRef}>
                  <td colSpan={dsCot.length} className="py-3 text-center">
                    <button type="button" onClick={veThem} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: VIEN, color: "var(--tim-chu)", fontFamily: "var(--font-chu)" }}>
                      Hiện thêm ({Math.min(SO_DONG_THEM, daLoc.length - soDong)} / còn {daLoc.length - soDong} mã)
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ModalTaiKhoan open={moModalTK} onClose={() => setMoModalTK(false)} onThanhCong={setNguoiDung} tieuDeGoiY="Đăng ký hoặc đăng nhập miễn phí để xem cột Tín hiệu (MUA/BÁN/NẮM GIỮ)." />
    </div>
  );
}
