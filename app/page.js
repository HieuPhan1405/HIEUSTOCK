import { Suspense } from "react";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import Image from "next/image";
import SoChay from "@/components/SoChay";
import { layTatCaTinHieu, layChiSoVNIndex } from "@/lib/tinHieu";
import CoHoiHomNay from "@/components/CoHoiHomNay";
import NhanThiTruong5Phien from "@/components/NhanThiTruong5Phien";
import XuatAnh from "@/components/XuatAnh";
import TheThiTruong, { RONG_THE_THI_TRUONG } from "@/components/TheThiTruong";
import TheTinHieu, { RONG_THE_TIN_HIEU } from "@/components/TheTinHieu";
import { dungCoHoiHomNay } from "@/lib/coHoiHomNay";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { dungMuaPhucHoi } from "@/lib/muaPhucHoi";
import { coCanhBaoBanBot } from "@/lib/ghiChuTuDong";
import { layDiemBGanDay } from "@/lib/diemB";
import { layLenhCoSuKienNgay, ngayGiaoDichVN } from "@/lib/lenhDaDong";
import { fmt, pct, phanLoaiXuHuong, capNhatMoiNhat, chamTPCaoNhat, nhe } from "@/components/dungChung";
import NhanCapNhat from "@/components/NhanCapNhat";
import { soVN } from "@/lib/soVN";
import { thongBaoLoi } from "@/lib/loiAnToan";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import { quyenTrangChu, locCauNhanDinh } from "@/lib/khoaTrangChu";
import KhoaTinHieuTrangChu from "@/components/KhoaTinHieuTrangChu";
import TaiKhoanNut from "@/components/TaiKhoanNut";
import { taoMeta, GOC_WEB } from "@/lib/seo";
import GiaiNghia from "@/components/GiaiNghia";
import RadarTinHieu from "@/components/RadarTinHieu";
import { layBatDayGanDay } from "@/lib/batDay";
import { dungSuKienRadar } from "@/lib/radarSuKien";
import { layCoDem } from "@/lib/boNhoMem";
import { layKhoiNgoaiMoiMa } from "@/lib/thiTruong";

export const dynamic = "force-dynamic";
export const metadata = taoMeta({
  tieuDeDayDu: "CloudStock — Hệ thống hỗ trợ đầu tư chứng khoán",
  moTa: "Tổng quan thị trường chứng khoán Việt Nam mỗi phiên: VN-Index, xu hướng, độ rộng, khối ngoại, radar sự kiện và tín hiệu MUA/BÁN cho cổ phiếu HOSE, HNX, UPCOM.",
  duongDan: "/",
});

// Du lieu co cau truc (JSON-LD) cho Google: ten web + o tim kiem (Sitelinks search box -> trang ma).
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: "CloudStock", url: GOC_WEB, logo: `${GOC_WEB}/icon-512.png` },
    { "@type": "WebSite", name: "CloudStock", url: GOC_WEB, inLanguage: "vi-VN", potentialAction: { "@type": "SearchAction", target: `${GOC_WEB}/ma/{search_term_string}`, "query-input": "required name=search_term_string" } },
  ],
};

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const NEN_INSET = "var(--vien-nhe)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const VANG = "var(--vang)";
const DO = "var(--do)";

// Do rong rieng cho 1 nhom von hoa (VN30/Midcap/Smallcap) - dung field
// von_hoa da co san trong tin_hieu (gan tu AFL: InVN30/InVNMidCap/InVNSmallCap).
function tinhDoRongNhom(tatCa, nhom) {
  const ds = tatCa.filter((r) => r.von_hoa === nhom);
  const tong = ds.length;
  const xanh = ds.filter((r) => phanLoaiXuHuong(r) === "xanh").length;
  return { tong, xanh, pctXanh: tong ? (xanh / tong) * 100 : 0 };
}

function sinhKetLuan(pctXanh, pctDo, tong) {
  if (tong === 0) return "Chưa có dữ liệu — đang chờ AmiBroker đẩy CSV lên.";
  if (pctXanh - pctDo > 15) return "Nghiêng tích cực — số mã xu hướng tăng đang áp đảo.";
  if (pctDo - pctXanh > 15) return "Nghiêng tiêu cực — số mã xu hướng giảm đang áp đảo.";
  return "Đi ngang — thị trường chưa có xu hướng rõ ràng.";
}

// "NHAN DINH THI TRUONG" - doan van tu dong sinh tu chinh du lieu ~390 ma
// VN30/Midcap/Smallcap dang theo doi, gom ca HOSE lan HNX/UPCOM tu khi mo
// rong (KHONG phai toan bo thi truong nen khong dung so lieu "do rong ca
// thi truong" tuyet doi, chi noi ro pham vi dang co).
function sinhNhanDinh(tatCa, xemTinHieu) {
  const tong = tatCa.length;
  if (!tong) return null;

  const soTang = tatCa.filter((r) => r.doi > 0).length;
  const soGiam = tatCa.filter((r) => r.doi < 0).length;
  const soDung = tong - soTang - soGiam;
  const soGiamManh = tatCa.filter((r) => r.doi <= -3).length;
  const pctGiam = (soGiam / tong) * 100;
  const pctTang = (soTang / tong) * 100;
  const pctGiamManh = (soGiamManh / tong) * 100;
  const soMua = tatCa.filter((r) => r.tin === "MUA").length;
  const soBan = tatCa.filter((r) => r.tin === "BAN").length;
  const soMatThan = tatCa.filter((r) => r.mat_than).length;
  const soVuotDinh = tatCa.filter((r) => r.dinh_52t != null && r.gia >= r.dinh_52t).length;

  let sacThai = "GIẰNG CO", mau = VANG;
  if (pctGiam - pctTang > 30) { sacThai = "TIÊU CỰC"; mau = DO; }
  else if (pctTang - pctGiam > 30) { sacThai = "TÍCH CỰC"; mau = XANH; }

  // Moi cau co co tinHieu (true = noi ve tin hieu MUA/BAN, Mat Than) - khach chua dang nhap khong thay (lib/khoaTrangChu.js).
  const cau = [
    // 11/11/2026: noi so TANG truoc (cau cu "nghieng tich cuc voi 23,8% ma giam diem" doc nguoc), bo chu "VN30-Midcap-Smallcap".
    { tinHieu: false, cau: `Phiên này nghiêng ${sacThai.toLowerCase()}: ${soVN(pctTang, 1, true)}% số mã tăng, ${soVN(pctGiam, 1, true)}% giảm trong ${tong} cổ phiếu đang theo dõi (HOSE, HNX, UPCOM)${soGiamManh > 0 ? `; ${soGiamManh} mã giảm mạnh trên 3%` : ""}.` },
  ];
  if (soMatThan > 0) {
    cau.push({ tinHieu: true, cau: `Có ${soMatThan} mã đang cảnh báo Mắt Thần — rủi ro đảo chiều cần theo dõi sát trong các phiên tới.` });
  }
  if (soVuotDinh > 0) {
    cau.push({ tinHieu: false, cau: `Vẫn có ${soVuotDinh} mã vượt đỉnh 52 tuần, cho thấy dòng tiền chưa rút hoàn toàn mà đang chọn lọc theo từng nhóm ngành.` });
  }
  cau.push({ tinHieu: true, cau: `Tín hiệu mới phát sinh hôm nay: ${soMua} mã MUA, ${soBan} mã BÁN.` });

  return { sacThai, mau, doanVan: locCauNhanDinh(cau, xemTinHieu).join(" "), soTang, soGiam, soDung };
}

// PTKT VNINDEX - dung dung cong thuc Ichimoku/duong can bang dai han/diem so nhu tung ma,
// chi khac o cho ap dung cho chinh chi so (xem AFL: LaVNIndex).
function phanLoaiTrend(trend) {
  if (trend === null || trend === undefined) return { nhan: "Đi ngang", mau: VANG };
  if (trend > 0.5) return { nhan: "Tăng", mau: XANH };
  if (trend < -0.5) return { nhan: "Giảm", mau: DO };
  return { nhan: "Đi ngang", mau: VANG };
}

// The KPI - card so lieu nhanh, co quang mau mo phia sau de tao diem nhan
// (mo phong hieu ung "glow" cua dashboard fintech hien dai).
// href tuy chon - neu co, ca the tro thanh 1 link bam duoc dan sang Bo loc
// co phieu voi dung bo loc tuong ung (vd Xu huong tang -> ?xuhuong=xanh).
function TheKPI({ nhan, giaTri, phu, mau, href, may, mo = false, hau = "" }) {
  const noiDung = (
    <>
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: mau || PRIMARY }}
      />
      <p className="text-xs mb-1 relative" style={{ color: MUTED, fontFamily: "var(--font-chu)" }} data-may={may}>
        {nhan}
      </p>
      <p className="text-2xl relative" style={{ fontFamily: "var(--font-chu)", fontWeight: 700, color: mau || TEXT, ...(mo ? { filter: "blur(7px)", userSelect: "none" } : {}) }}>
        {typeof giaTri === "number" && !mo ? <SoChay gia={giaTri} hau={hau} /> : giaTri}
      </p>
      {mo && <Lock size={15} color={MUTED} strokeWidth={2} className="absolute right-4 top-4" aria-hidden="true" />}
      {phu && (
        <p className="text-[11px] mt-1 relative" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </>
  );

  const className = "rounded-2xl border px-4 py-3.5 relative overflow-hidden block";
  const style = { borderColor: VIEN, background: NEN_CARD };

  if (href) {
    return (
      <Link href={href} className={`${className} hover:border-[color:var(--vien-dam)] transition-colors`} style={style}>
        {noiDung}
      </Link>
    );
  }
  return (
    <div className={className} style={style}>
      {noiDung}
    </div>
  );
}

// Bieu do tron (donut) that ve bang SVG - the hien ty le Xanh/Sideway/Do,
// khong can thu vien ngoai.
function BieuDoTronDoRong({ soXanh, soSideway, soDo, tong, kichThuoc = 148 }) {
  const tam = kichThuoc / 2;
  const doDayVanh = Math.round(kichThuoc * 0.135);
  const banKinh = tam - doDayVanh / 2;
  const chuVi = 2 * Math.PI * banKinh;
  const cacPhan = [
    { gia: soXanh, mau: XANH },
    { gia: soSideway, mau: VANG },
    { gia: soDo, mau: DO },
  ];
  let daVe = 0;

  return (
    <svg viewBox={`0 0 ${kichThuoc} ${kichThuoc}`} width={kichThuoc} height={kichThuoc} role="img" aria-label="Biểu đồ tròn độ rộng thị trường">
      <circle cx={tam} cy={tam} r={banKinh} fill="none" stroke={NEN_INSET} strokeWidth={doDayVanh} />
      {tong > 0 &&
        cacPhan.map((p, i) => {
          if (p.gia === 0) return null;
          const doDai = (p.gia / tong) * chuVi;
          const el = (
            <circle
              key={i}
              cx={tam}
              cy={tam}
              r={banKinh}
              fill="none"
              stroke={p.mau}
              strokeWidth={doDayVanh}
              strokeDasharray={`${doDai} ${chuVi - doDai}`}
              strokeDashoffset={-daVe}
              transform={`rotate(-90 ${tam} ${tam})`}
            />
          );
          daVe += doDai;
          return el;
        })}
      <text x={tam} y={tam - 2} textAnchor="middle" fontSize={Math.round(kichThuoc * 0.17)} fontWeight="700" fill={TEXT} style={{ fontFamily: "var(--font-chu)" }}>
        {tong ? Math.round((soXanh / tong) * 100) : 0}%
      </text>
      <text x={tam} y={tam + Math.round(kichThuoc * 0.11)} textAnchor="middle" fontSize="11" fill={MUTED} style={{ fontFamily: "var(--font-chu)" }}>
        xu hướng tăng
      </text>
    </svg>
  );
}

// O "XU HUONG CAC MA" canh the VN-Index (10/11/2026: gop 2 the "Ket luan thi truong" + "Do rong theo von hoa" truoc nam cuoi trang len hang dau, kieu the doi
// cua Stockfly / Simplize - tom tat truoc, chi tiet sau). Day la XU HUONG (vung gia Xanh / Sideway / Do) cua cac ma dang theo doi, khac sac thai PHIEN HOM NAY
// (so ma tang / giam trong phien) o the VN-Index - 2 tieu de ghi ro de nguoi xem khong thay "tich cuc" va "tieu cuc" mau thuan nhau.
function TheXuHuongCacMa({ soXanh, soSideway, soDo, tong, pctXanh, pctDo, doRongVonHoa }) {
  return (
    <div className="xl:col-span-2 rounded-2xl border p-5 sm:p-6 grid sm:grid-cols-2 xl:grid-cols-1 gap-4 sm:gap-6 xl:gap-4 content-start" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex items-center gap-5">
        <div className="shrink-0">
          <BieuDoTronDoRong soXanh={soXanh} soSideway={soSideway} soDo={soDo} tong={tong} kichThuoc={112} />
        </div>
        <div className="min-w-0">
          <p className="text-sm mb-1" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
            Xu hướng các mã đang theo dõi
          </p>
          <p className="text-[15px] leading-snug mb-2" style={{ fontFamily: "var(--font-chu)", fontWeight: 600 }}>
            {sinhKetLuan(pctXanh, pctDo, tong)}
          </p>
          {/* Bam vao tung nhom -> Bo loc co phieu loc san theo xu huong do (phanLoaiXuHuong: xanh / sideway / do). */}
          <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ fontFamily: "var(--font-chu)" }}>
            <Link href="/bo-loc?xuhuong=xanh" className="hover:underline py-1" style={{ color: XANH }}>● Tăng {soXanh}</Link>
            <Link href="/bo-loc?xuhuong=sideway" className="hover:underline py-1" style={{ color: VANG }}>● Đi ngang {soSideway}</Link>
            <Link href="/bo-loc?xuhuong=do" className="hover:underline py-1" style={{ color: DO }}>● Giảm {soDo}</Link>
          </p>
        </div>
      </div>
      <div className="pt-4 border-t sm:pt-0 sm:border-t-0 sm:pl-6 sm:border-l xl:pl-0 xl:border-l-0 xl:pt-4 xl:border-t" style={{ borderColor: VIEN }}>
        <p className="text-xs mb-3" style={{ color: MUTED }}>
          Tỷ lệ mã xu hướng tăng theo nhóm vốn hoá
        </p>
        {doRongVonHoa.map(([nhan, { tong: tongNhom, xanh, pctXanh: pctXanhNhom }]) => (
          <div key={nhan} className="mb-2.5 last:mb-0">
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--mo-2)" }}>
              <span>{nhan}</span>
              <span style={{ fontFamily: "var(--font-chu)" }}>{tongNhom === 0 ? "chưa có dữ liệu" : `${xanh}/${tongNhom} mã (${soVN(pctXanhNhom, 1, true)}%)`}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: NEN_INSET }}>
              <div className="h-full rounded-full" style={{ width: `${pctXanhNhom}%`, background: XANH }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function TrangTongQuan() {
  // Nguoi dung va du lieu thi truong doc SONG SONG (khong doi nhau): truoc day doc lan luot nen cong don do tre toi DB.
  const duLieuCho = Promise.all([layTatCaTinHieu(), layChiSoVNIndex()]).then((v) => ({ v }), (e) => ({ e }));
  const nguoiDung = await layNguoiDungHienTai().catch(() => null);
  const { xemTinHieu, choDuyet } = quyenTrangChu(nguoiDung); // khach chua dang nhap / chua duyet: khoa tin hieu (lib/khoaTrangChu.js)
  let tatCa = [];
  let chiSoVNIndex = null;
  let loi = null;
  {
    const kq = await duLieuCho;
    if (kq.e) loi = thongBaoLoi(kq.e);
    else [tatCa, chiSoVNIndex] = kq.v;
  }

  // Phien giao dich cua du lieu moi nhat + nhat ky lenh co su kien trong phien do (chot TP / dong lenh) cho o "Top co hoi dang chu y" - loi o day khong lam hong trang.
  const capNhat = capNhatMoiNhat(tatCa);
  const ngayPhien = capNhat ? ngayGiaoDichVN(new Date(capNhat)) : null;
  // 3 nguon phu doc SONG SONG, loi nguon nao thi nguon do de rong (khong lam hong trang):
  //  - nhat ky lenh co su kien trong phien: o Ban / Ban bot (rong thi van hien tu tin hieu);
  //  - o "Mua phuc hoi (diem B)": tu bang chi_bao_ky_thuat (cot pb_*);
  //  - diem B gan day (45 ngay) de danh dau diem MUA co so da co diem mua phuc hoi truoc do.
  let dongLenh = [];
  let muaPhucHoi = [];
  let diemBGanDay = {};
  let batDayGanDay = [];
  // Bang chi bao ky thuat (khoi luong so voi TB20, cach day 52 tuan...) + khoi ngoai moi ma (nguon ngoai, nho 5 phut) cho RADAR - cho CA khach (du lieu thi truong cong khai). Loi / cham thi radar bo cac loai do.
  const cbCho = layChiBaoKyThuat().catch(() => null);
  const ngoaiCho = layCoDem("khoi-ngoai-moi-ma", 300_000, layKhoiNgoaiMoiMa, { choToiDaMs: 2500 }).catch(() => null);
  if (xemTinHieu) {
    const [a, cb, c, bd] = await Promise.all([
      layLenhCoSuKienNgay(ngayPhien).catch(() => []),
      cbCho,
      layDiemBGanDay().then((x) => Object.fromEntries(x.map((d) => [d.ma, d]))).catch(() => ({})),
      layBatDayGanDay().catch(() => []),
    ]);
    dongLenh = a;
    batDayGanDay = bd;
    try {
      muaPhucHoi = cb ? dungMuaPhucHoi({ hang: cb.hang, tatCa }) : [];
    } catch {
      muaPhucHoi = [];
    }
    // Gop khoang cach toi Tenkan (chi bao ky thuat) vao tung ma: de canh bao "Ban bot" khi dang giu ma gia dong cua duoi Tenkan (nhan tren web, khong doi tin hieu engine).
    if (cb?.hang) {
      const tenkanTheoMa = new Map(cb.hang.map((h) => [h.ma, h.cach_tenkan_pct]));
      tatCa = tatCa.map((r) => (tenkanTheoMa.get(r.ma) != null ? { ...r, cach_tenkan_pct: tenkanTheoMa.get(r.ma) } : r));
    }
    diemBGanDay = c;
  }

  const nhanDinh = sinhNhanDinh(tatCa, xemTinHieu);

  const tong = tatCa.length;
  const soXanh = tatCa.filter((r) => phanLoaiXuHuong(r) === "xanh").length;
  const soDo = tatCa.filter((r) => phanLoaiXuHuong(r) === "do").length;
  const soSideway = tong - soXanh - soDo;
  const pctXanh = tong ? (soXanh / tong) * 100 : 0;
  const pctDo = tong ? (soDo / tong) * 100 : 0;
  const soMua = tatCa.filter((r) => r.tin === "MUA").length;
  const soMatThan = tatCa.filter((r) => r.mat_than).length;
  // 2 the KPI rieng, KHONG tinh vao Tin hieu MUA/BAN (2 cot do chi danh cho
  // dung tin hieu MUA/BAN moi phat sinh hom nay) - Chot loi va Ban bot la
  // trang thai cua vi the DANG giu, khac ban chat.
  const soChotLoi = tatCa.filter((r) => r.tin === "NAM GIU" && chamTPCaoNhat(r)).length;
  const soBanBot = tatCa.filter((r) => coCanhBaoBanBot(r)).length;

  const doRongVonHoa = [
    ["VN30", tinhDoRongNhom(tatCa, "VN30")],
    ["Midcap", tinhDoRongNhom(tatCa, "Midcap")],
    ["Smallcap", tinhDoRongNhom(tatCa, "Smallcap")],
  ];

  // Du lieu cho 2 the anh chia se (Anh thi truong / Anh tin hieu)
  const ngayAnh = capNhat ? new Date(capNhat).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "numeric", year: "numeric" }) : "";
  const cohoiAnh = xemTinHieu ? dungCoHoiHomNay({ tatCa, dongLenh, ngay: ngayPhien }) : null;

  // RADAR: su kien dang chu y trong phien dung tu du lieu da co (khach chi nhan loai thi truong - lib/radarSuKien.js). Chi gui xuong trinh duyet ma + loai + mo ta, khong gui dong tin hieu.
  const [cbRadar, khoiNgoaiRadar] = await Promise.all([cbCho, ngoaiCho]);
  const radar = tatCa.length ? dungSuKienRadar({ tatCa, coHoi: cohoiAnh, muaPhucHoi, batDay: batDayGanDay, chiBao: cbRadar?.hang ?? [], khoiNgoai: khoiNgoaiRadar, xemTinHieu }) : null;
  // Luoi: TAT CA ma dang theo doi, kem nganh (de xep theo nganh nhu bang dien). Chi gui ma + nganh xuong trinh duyet.
  // Moi o: [ma, nganh, %doi trong ngay, KL / TB20 (lan), GTGD hom nay uoc tinh (ty) = KL/TB20 x GTGD TB20]. Deu la so khach cung thay.
  const soHuuHan = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : null);
  const klTheoMa = new Map((cbRadar?.hang ?? []).map((b) => [b.ma, soHuuHan(b.kl_ty_le)]));
  const radarMa = radar
    ? tatCa.map((r) => {
        const kl = klTheoMa.get(r.ma) ?? null;
        const tb = soHuuHan(r.gtgd_tb20);
        return [r.ma, r.nganh ?? null, soHuuHan(r.doi), kl, kl != null && tb != null ? kl * tb : null];
      })
    : [];
  const radarGio = capNhat ? new Date(capNhat).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div style={{ color: TEXT }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
      {/* HERO: chi cho khach chua dang nhap (gioi thieu). Thanh vien vao thang phan thi truong + tin hieu (04/11/2026: bot cuon qua phan quang cao moi ngay). */}
      {xemTinHieu ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
              Thị trường hôm nay
            </h1>
            <p className="text-sm mt-0.5" style={{ color: MUTED }}>
              {ngayAnh ? `Phiên ${ngayAnh} · ` : ""}
              {tong} cổ phiếu hệ thống đang theo dõi
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <XuatAnh nhan="Ảnh thị trường" kieu="nho" the={<TheThiTruong tatCa={tatCa} vnindex={chiSoVNIndex} ngay={ngayAnh} />} rong={RONG_THE_THI_TRUONG} tenFile={`CloudStock-thi-truong-${ngayPhien ?? "hom-nay"}.png`} tieuDe="Tổng quan thị trường" />
            <XuatAnh nhan="Ảnh tín hiệu" kieu="nho" the={<TheTinHieu cohoi={cohoiAnh} ngay={ngayAnh} />} rong={RONG_THE_TIN_HIEU} tenFile={`CloudStock-tin-hieu-${ngayPhien ?? "hom-nay"}.png`} tieuDe="Tín hiệu trong phiên" />
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden border-b" style={{ borderColor: VIEN }}>
          <div aria-hidden="true" className="cs-aurora" />
          <div aria-hidden="true" className="cs-luoi" />
          <Image
            src="/logo-bieu-tuong-toi.png"
            alt=""
            aria-hidden="true"
            width={260}
            height={176}
            className="chi-toi hidden md:block absolute right-10 top-6 w-[330px] h-auto opacity-[0.09] pointer-events-none select-none"
          />
          <Image
            src="/logo-bieu-tuong.png"
            alt=""
            aria-hidden="true"
            width={260}
            height={176}
            className="chi-sang hidden md:block absolute right-10 top-6 w-[330px] h-auto opacity-[0.09] pointer-events-none select-none"
          />
          <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-12">
            <div className="mb-5">
              <span className="cs-nhan-hero" style={{ fontFamily: "var(--font-chu)" }}>
                <span className="cs-nhip" aria-hidden="true" />
                Cập nhật sau mỗi phiên · Quét toàn bộ thị trường
              </span>
            </div>
            <h1
              className="text-[28px] sm:text-4xl leading-[1.15] mb-4"
              style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}
            >
              Tổng quan thị trường,<br />
              <span className="cs-chu-mau">đọc trong 5 giây.</span>
            </h1>
            <p className="max-w-xl" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
              Điểm hợp lưu Xu hướng · Động lượng · Dòng tiền cho {tong > 0 ? tong : "gần 400"} cổ phiếu HOSE, HNX, UPCOM, kiểm chứng
              bằng backtest 11 năm với giá vào lệnh thực tế. Không phải khuyến nghị đầu tư — chỉ là công cụ đọc thị trường nhanh hơn.
            </p>
            {/* 11/11/2026: nut DUNG THU dau tien (truoc hero 4 nut ngang hang, khong co nut dang ky); dien thoai chi giu 2 nut chinh de khach thay so lieu som hon. */}
            <div className="flex flex-wrap gap-3 mt-6 text-sm" style={{ fontFamily: "var(--font-chu)" }}>
              <div className="[&>button]:px-4 [&>button]:py-2.5 [&>button]:text-sm">
                <TaiKhoanNut compact taiLai nhan="Dùng thử miễn phí tuần đầu" />
              </div>
              <Link href="/bo-loc" className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border font-semibold" style={{ borderColor: "#6C5CE7", color: TEXT }}>
                Mở Bộ lọc cổ phiếu
                <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/bieu-do" className="hidden sm:inline-flex px-4 py-2.5 rounded-lg border font-semibold" style={{ borderColor: VIEN, color: TEXT }}>
                Xem biểu đồ kỹ thuật
              </Link>
              <Link href="/danh-gia-danh-muc" className="hidden sm:inline-flex px-4 py-2.5 rounded-lg border font-semibold" style={{ borderColor: VIEN, color: TEXT }}>
                Chấm điểm danh mục của bạn
              </Link>
              {/* Anh chia nho (chup ca trang dai va bi cat o man hinh nho): the co dinh 720px, xem components/TheThiTruong.js / TheTinHieu.js */}
              <span className="hidden sm:contents">
                <XuatAnh nhan="Ảnh thị trường" the={<TheThiTruong tatCa={tatCa} vnindex={chiSoVNIndex} ngay={ngayAnh} />} rong={RONG_THE_THI_TRUONG} tenFile={`CloudStock-thi-truong-${ngayPhien ?? "hom-nay"}.png`} tieuDe="Tổng quan thị trường" />
              </span>
            </div>
          </div>
        </div>

      )}

      <div id="chup-thi-truong" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loi && (
          <p className="text-sm mb-6" style={{ color: DO }}>
            Lỗi tải dữ liệu: {loi}
          </p>
        )}

        {/* VN-INDEX + NHAN DINH (gop 2 the cu "Nhan dinh nhanh" + "PTKT VNINDEX", 04/11/2026): gia + 2 nhan (sac thai, xu huong) -> 1 doan nhan dinh -> 5 so lieu chi so.
            Nhan dinh la doan van tu dong sinh tu ~390 ma dang theo doi; chi so tinh cung he thong chi bao nhu tung ma (xem AFL: LaVNIndex). */}
        {/* HANG TOM TAT (10/11/2026, hoc Stockfly / Simplize: tom tat truoc, chi tiet sau): VN-Index + nhan dinh (trai) | Xu huong cac ma + von hoa (phai). */}
        <div className="grid xl:grid-cols-5 gap-4 mb-3">
        {(nhanDinh || chiSoVNIndex) && (
          <div className="xl:col-span-3 rounded-2xl border p-5 sm:p-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              {chiSoVNIndex ? (
                <div>
                  <p className="text-sm mb-0.5" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
                    VN-Index
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
                      {fmt(chiSoVNIndex.gia)}
                    </span>
                    <span className="text-base font-semibold" style={{ fontFamily: "var(--font-chu)", color: chiSoVNIndex.doi >= 0 ? XANH : DO }}>
                      {pct(chiSoVNIndex.doi, 2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: MUTED }}>
                  Nhận định thị trường
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {/* 2 nhan ghi ro PHIEN HOM NAY (so ma tang/giam) va XU HUONG cua chi so - truoc ghi "Thi truong tich cuc" canh "Xu huong giam" de doc nham la mau thuan. */}
                {nhanDinh && (
                  <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ color: nhanDinh.mau, background: nhe(nhanDinh.mau, 13), fontFamily: "var(--font-chu)" }}>
                    Phiên hôm nay: {nhanDinh.sacThai.toLowerCase()}
                  </span>
                )}
                {/* Chi so khong "nam giu" duoc - hien xu huong thay cho nhan lenh MUA / NAM GIU / BAN. */}
                {chiSoVNIndex && (
                  <span className="text-xs font-bold px-2 py-1 rounded-md" data-may="xu-huong-tt" style={{ color: phanLoaiTrend(chiSoVNIndex.trend).mau, background: nhe(phanLoaiTrend(chiSoVNIndex.trend).mau, 13), fontFamily: "var(--font-chu)" }}>
                    Xu hướng chỉ số: {phanLoaiTrend(chiSoVNIndex.trend).nhan.toLowerCase()}
                  </span>
                )}
              </div>
            </div>
            {nhanDinh && (
              <p className="text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-chu)", color: "var(--chu-2)" }}>
                {nhanDinh.doanVan}
              </p>
            )}
            {chiSoVNIndex && (
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-x-4 gap-y-3 mt-5 pt-5 border-t" style={{ borderColor: VIEN }}>
                <div>
                  <p className="text-xs mb-1" style={{ color: MUTED }}>
                    <GiaiNghia khoa="diem-tong-hop-vni">Điểm tổng hợp</GiaiNghia>
                  </p>
                  <p className="text-lg" style={{ fontFamily: "var(--font-chu)", fontWeight: 700, color: chiSoVNIndex.diem >= 0 ? XANH : DO }}>
                    {soVN(chiSoVNIndex.diem, 2, true)}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: MUTED }}>
                    <GiaiNghia khoa="kijun-vni">Đường cân bằng</GiaiNghia>
                  </p>
                  <p className="text-lg" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
                    {fmt(chiSoVNIndex.kijun)}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: MUTED }}>
                    <GiaiNghia khoa="gg-vni">Vùng cân bằng dài hạn</GiaiNghia>
                  </p>
                  <p className="text-lg" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
                    {fmt(chiSoVNIndex.gg_bot)} – {fmt(chiSoVNIndex.gg_top)}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: MUTED }}>
                    Đỉnh 52 tuần
                  </p>
                  <p className="text-lg" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
                    {fmt(chiSoVNIndex.dinh_52t)}
                  </p>
                </div>
                {/* May tuong lai chi co gia tri o phien may doi chieu - khong co thi an (khong hien "—"). */}
                {chiSoVNIndex.kumo_twist && (
                  <p className="col-span-full text-sm" style={{ color: chiSoVNIndex.kumo_twist === "TANG" ? XANH : DO }}>
                    <GiaiNghia khoa="tag-Mây tương lai">Mây tương lai</GiaiNghia> của VN-Index sắp đổi chiều {chiSoVNIndex.kumo_twist === "TANG" ? "tăng" : "giảm"}.
                  </p>
                )}
              </div>
            )}
            {/* Do rong phien, thanh khoan, khoi ngoai, ban do nhiet... chi o Dashboard (10/11/2026 bo trung lap giua 2 trang). */}
            <Link href="/dashboard" className="inline-block text-xs mt-4" style={{ color: "var(--tim-chu)" }}>
              Độ rộng, thanh khoản, khối ngoại, bản đồ nhiệt: xem Dashboard →
            </Link>
          </div>
        )}
        {tong > 0 && <TheXuHuongCacMa soXanh={soXanh} soSideway={soSideway} soDo={soDo} tong={tong} pctXanh={pctXanh} pctDo={pctDo} doRongVonHoa={doRongVonHoa} />}
        </div>
        {!chiSoVNIndex && !loi && (
          <p className="text-sm mb-6" style={{ color: MUTED }}>
            Chưa có dữ liệu PTKT VN-Index — cần chạy lại Explore + upload sau khi cập nhật công thức AFL mới nhất.
          </p>
        )}

        <NhanCapNhat luc={capNhat} className={xemTinHieu ? "mb-1" : "mb-5"} />
        {xemTinHieu && (
          <Suspense fallback={null}>
            <NhanThiTruong5Phien className="mb-5" />
          </Suspense>
        )}

        {/* HANG SO NHANH: 4 con so can hanh dong (khach thay ban lam mo). 10/11/2026 bo 2 o "Ma dang theo doi" / "Xu huong tang" vi the Xu huong cac ma ngay tren da co. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {xemTinHieu ? (
            <>
              <TheKPI nhan="Tín hiệu MUA" giaTri={soMua} phu="hôm nay" mau={PRIMARY} href="/bo-loc?tin=MUA" />
              <TheKPI may="mat-than" nhan="Cảnh báo Mắt Thần" giaTri={soMatThan} phu="rủi ro đảo chiều" mau={soMatThan > 0 ? DO : MUTED} href="/bo-loc?matthan=1" />
              <TheKPI nhan="Cơ hội chốt lời" giaTri={soChotLoi} phu="đã chạm TP" mau={soChotLoi > 0 ? "var(--vang)" : MUTED} href="/bo-loc?chotloi=1" />
              <TheKPI nhan="Cảnh báo bán bớt" giaTri={soBanBot} phu="điểm dưới ngưỡng hoặc dưới Tenkan" mau={soBanBot > 0 ? "var(--cam)" : MUTED} href="/bo-loc?banbot=1" />
            </>
          ) : (
            <>
              <TheKPI nhan="Tín hiệu MUA" giaTri="88" phu="Đăng nhập để xem" mau={PRIMARY} mo />
              <TheKPI nhan="Cảnh báo Mắt Thần" giaTri="88" phu="Đăng nhập để xem" mau={DO} mo />
              <TheKPI nhan="Cơ hội chốt lời" giaTri="88" phu="Đăng nhập để xem" mau="var(--vang)" mo />
              <TheKPI nhan="Cảnh báo bán bớt" giaTri="88" phu="Đăng nhập để xem" mau="var(--cam)" mo />
            </>
          )}
        </div>

        {/* THU TU (10/11/2026): thanh vien - Top co hoi (viec can lam trong phien) roi moi Radar; khach - Radar (xem tu do) roi khung moi dang nhap.
            TOP CO HOI DANG CHU Y: 4 o lenh CUA PHIEN HOM NAY - hang tren Mua | Ban, hang duoi Mua moi | Ban bot. Chi tiet thi truong o trang /dashboard rieng. */}
        {xemTinHieu && tatCa.length > 0 && <CoHoiHomNay tatCa={tatCa} dongLenh={dongLenh} ngay={ngayPhien} muaPhucHoi={muaPhucHoi} diemBGanDay={diemBGanDay} />}
        {radar && <RadarTinHieu cacMa={radarMa} suKien={radar.suKien} dem={radar.dem} ngay={ngayAnh} gio={radarGio} khoa={!xemTinHieu} />}
        {!xemTinHieu && <KhoaTinHieuTrangChu choDuyet={choDuyet} />}
      </div>
    </div>
  );
}
