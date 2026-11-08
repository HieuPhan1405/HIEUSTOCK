"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ClipboardPaste, Sparkles, Lock, FileText } from "lucide-react";
import { docDanDanhMuc, vitriTuNhap, soNhap } from "@/lib/danhGiaDanhMuc";
import { nhanXetRuiRo } from "@/lib/ruiRoDanhMuc";
import { danhGiaToanBo } from "@/lib/danhGiaToanBo";
import { PHONG_CACH, PHONG_CACH_MAC_DINH, NHAN } from "@/lib/phongCachDauTu";
import { goiYXuLy, apDungKeHoach } from "@/lib/xuLyDanhMuc";
import { apDungGiaoDich } from "@/lib/nhatKyGiaoDich";
import { fmt, pct } from "@/components/dungChung";
import { DongHoDiem, TruDiem, BieuDoHieuSuat, VonVaRuiRo, MaTranTuongQuan } from "@/components/DanhGiaDanhMucBieuDo";
import XuatAnh from "@/components/XuatAnh";
import TheDanhGiaDanhMuc, { RONG_THE_DANH_GIA } from "@/components/TheDanhGiaDanhMuc";
import TaiKhoanNut from "@/components/TaiKhoanNut";
import DanhGiaLuuThanh from "@/components/DanhGiaLuuThanh";
import DanhGiaXuLy from "@/components/DanhGiaXuLy";
import DanhGiaDoanhNghiep from "@/components/DanhGiaDoanhNghiep";
import DanhGiaBoiCanh from "@/components/DanhGiaBoiCanh";
import DanhGiaNhatKy, { homNayVN } from "@/components/DanhGiaNhatKy";
import BaoCaoDanhMuc from "@/components/BaoCaoDanhMuc";
import DanhGiaGoiYMua from "@/components/DanhGiaGoiYMua";
import DanhGiaGoiYDaiHan from "@/components/DanhGiaGoiYDaiHan";
import { goiYDaiHan } from "@/lib/goiYDaiHan";
import { goiYTheoDanhMuc } from "@/lib/goiYMua";
import { Khoi, The, Thanh, NhanXet, NhanTrangThai, VIEN, NEN_CARD, TEXT, MUTED, PRIMARY, XANH, DO, VANG, MAU_MUC, sans, soVN, p0, p1, tien, mauLai } from "@/components/DanhGiaChung";

const KHOA_LUU = "cs_danh_gia_danh_muc_v1";
const MAU_TIN = { MUA: XANH, "NAM GIU": "#5BA8FF", BAN: DO, "TRUNG LAP": MUTED };
const NHAN_TIN = { MUA: "Mua", "NAM GIU": "Nắm giữ", BAN: "Bán", "TRUNG LAP": "Trung lập" };
const MAU_THU = [
  { ma: "FPT", kl: "500" },
  { ma: "HPG", kl: "3000" },
  { ma: "VCB", kl: "800" },
  { ma: "MWG", kl: "1000" },
  { ma: "SSI", kl: "2000" },
  { ma: "DGC", kl: "400" },
];
const VON_MAC_DINH = { tienMat: "", no: "", laiSuat: "", canhBao: "35", giaiChap: "30", phi: "" };
const BAO_CAO_MAC_DINH = { khach: "", nguoiLap: "", lienHe: "", ghiChu: "" };
const TRU = [
  ["daDang", "Đa dạng hóa", "Số khoản đầu tư độc lập thật (theo tương quan), mức rủi ro dồn vào 1 mã, tập trung ngành — chấm liên tục"],
  ["ruiRo", "Rủi ro", "Biến động dự báo của danh mục so với VN-Index (yếu tố báo trước sụt giảm rõ nhất khi kiểm chứng), độ dày đệm margin, đòn bẩy"],
  ["xuHuong", "Xu hướng", "Tỷ trọng giá trị ở các mã còn xu hướng (trên Kijun và chưa báo bán; phong cách dài hạn: trên đường cân bằng dài hạn)"],
  ["thanhKhoan", "Thanh khoản", "Tỷ trọng giá trị có thể bán hết trong 1 phiên (20% thanh khoản bình quân)"],
  ["doanhNghiep", "Doanh nghiệp", "Chất lượng doanh nghiệp theo BCTC quý (thứ hạng so với mã cùng loại), chấm theo phong cách"],
];
const TABS = [
  ["xu_ly", "Nên làm gì"],
  ["rui_ro", "Rủi ro"],
  ["doanh_nghiep", "Doanh nghiệp"],
  ["boi_canh", "Bối cảnh"],
  ["goi_y", "Gợi ý mua"],
  ["nhat_ky", "Nhật ký"],
  ["chi_tiet", "Chi tiết"],
];

let dem = 0;
const moi = (o = {}) => ({ id: `h${Date.now()}${dem++}`, ma: "", kl: "", giaVon: "", ...o });
const soO = (x) => (x == null ? "" : String(+Number(x).toFixed(3)).replace(".", ","));
const trieu = (x) => (soNhap(x) > 0 ? soNhap(x) * 1e6 : 0);
// so sanh du lieu khong phu thuoc thu tu khoa (JSONB tren may chu sap lai khoa)
const chuan = (v) => (Array.isArray(v) ? v.map(chuan) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => [k, chuan(v[k])])) : v);
const khoaSo = (v) => JSON.stringify(chuan(v));

const so2 = (x) => (x == null || !Number.isFinite(x) ? "—" : x.toFixed(2).replace(".", ","));

// Bang kich ban: danh muc / tai san rong / ky quy (dung chung cho soc theo beta va khung hoang that)
function BangKichBan({ ds, coMargin, cotDau = "Kịch bản" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={sans}>
        <thead>
          <tr className="text-left text-xs" style={{ color: MUTED }}>
            <th className="py-1.5 pr-2 font-normal">{cotDau}</th>
            <th className="py-1.5 px-2 font-normal text-right">VN-Index</th>
            <th className="py-1.5 px-2 font-normal text-right">Danh mục</th>
            <th className="py-1.5 px-2 font-normal text-right">Tài sản ròng</th>
            {coMargin && <th className="py-1.5 pl-2 font-normal text-right">Ký quỹ</th>}
          </tr>
        </thead>
        <tbody>
          {ds.map((k) => (
            <tr key={k.ten} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
              <td className="py-2 pr-2">
                {k.ten}
                <div className="text-[11px]" style={{ color: MUTED }}>{k.ghiChu}</div>
              </td>
              <td className="py-2 px-2 text-right" style={{ color: MUTED }}>{p1(k.vniPct)}%</td>
              <td className="py-2 px-2 text-right" style={{ color: mauLai(k.portPct) }}>{p1(k.portPct)}%</td>
              <td className="py-2 px-2 text-right">
                {k.navPct != null ? `${p1(k.navPct)}%` : "—"}
                <div className="text-[11px]" style={{ color: MUTED }}>{tien(k.doiGiaTri)}</div>
              </td>
              {coMargin && (
                <td className="py-2 pl-2 text-right whitespace-nowrap" style={{ color: k.chamGC ? DO : k.chamCB ? VANG : TEXT, fontWeight: k.chamCB ? 700 : 400 }}>
                  {k.tyLeKyQuy != null ? `${Math.round(k.tyLeKyQuy)}%` : "—"}
                  {k.chamGC ? " · giải chấp" : k.chamCB ? " · gọi ký quỹ" : ""}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// o so sanh truoc -> sau (tot = -1: nho hon la tot hon)
function TruocSau({ ten, a, b, dinhDang = p0, dv = "%", tot = -1 }) {
  const doi = Number.isFinite(a) && Number.isFinite(b) ? (b - a) * tot : 0;
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: VIEN }}>
      <div className="text-[11px]" style={{ color: MUTED }}>{ten}</div>
      <div className="text-base" style={{ ...sans, fontWeight: 700 }}>
        {dinhDang(a)}{dv} → <span style={{ color: doi > 0 ? XANH : doi < 0 ? VANG : TEXT }}>{dinhDang(b)}{dv}</span>
      </div>
    </div>
  );
}

// Ty trong toi uu theo rui ro: bang hien tai -> de xuat + so co phieu mua / ban (lo 100) tren gia tri hien co cua cac ma do
function ToiUuTyTrong({ tu, hangMa }) {
  const theoMa = Object.fromEntries((hangMa ?? []).map((h) => [h.ma, h]));
  const tong = tu.ma.reduce((s, x) => s + (theoMa[x.ma]?.giaTri ?? 0), 0);
  const dong = tu.ma.map((x) => {
    const h = theoMa[x.ma];
    const kl = h?.gia > 0 && x.canDoi ? Math.round(((x.wToiUu * tong - (h.giaTri ?? 0)) / (h.gia * 1000)) / 100) * 100 : 0;
    return { ...x, kl };
  });
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <TruocSau ten="Biến động dự báo / năm" a={tu.truoc.volP} b={tu.sau.volP} />
        <TruocSau ten="Một phiên xấu (VaR 95%)" a={tu.truoc.var95} b={tu.sau.var95} dinhDang={p1} />
        <TruocSau ten="Rủi ro dồn vào mã lớn nhất" a={tu.truoc.rcMax * 100} b={tu.sau.rcMax * 100} />
        <TruocSau ten="Khoản đầu tư độc lập" a={tu.truoc.soCuocDocLap} b={tu.sau.soCuocDocLap} dinhDang={p1} dv="" tot={1} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={sans}>
          <thead>
            <tr className="text-left text-xs" style={{ color: MUTED }}>
              <th className="py-1.5 pr-2 font-normal">Mã</th>
              <th className="py-1.5 px-2 font-normal text-right">Hiện tại</th>
              <th className="py-1.5 px-2 font-normal text-right">Đề xuất</th>
              <th className="py-1.5 pl-2 font-normal text-right">Điều chỉnh</th>
            </tr>
          </thead>
          <tbody>
            {dong.map((x) => (
              <tr key={x.ma} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                <td className="py-2 pr-2" style={{ fontWeight: 700 }}>{x.ma}</td>
                <td className="py-2 px-2 text-right">{p0(x.wHienTai * 100)}%</td>
                <td className="py-2 px-2 text-right" style={{ fontWeight: 700 }}>{p0(x.wToiUu * 100)}%</td>
                <td className="py-2 pl-2 text-right whitespace-nowrap" style={{ color: !x.canDoi ? MUTED : x.doi > 0 ? XANH : VANG }}>
                  {!x.canDoi ? "Giữ nguyên" : `${x.doi > 0 ? "Mua thêm" : "Bán bớt"} ${x.kl ? `~${soVN(Math.abs(x.kl))} cp` : `${p0(Math.abs(x.doi) * 100)}%`}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
        Cách chia: biến động nhỏ nhất trên ma trận tương quan đã làm mượt (Ledoit-Wolf), mỗi mã tối đa {p0(tu.tran * 100)}%, chỉ điều chỉnh mã lệch từ 5 điểm % trở lên để đỡ phí giao dịch.
        {tu.boQua.length ? ` Không tính ${tu.boQua.join(", ")} vì đang cần thoát.` : ""} Kiểm chứng trên 8.640 danh mục mô phỏng 2014–2026: so với tỷ trọng chia tùy ý, sụt giảm 6 tháng trung bình 18% thay vì 21%, lợi nhuận không thấp hơn, tốt hơn ở khoảng 3/4 trường hợp. Không xét tín hiệu hay định giá từng mã — làm kế hoạch xử lý trước.
      </p>
    </>
  );
}

// PHAN RUI RO (1 nam gia + du bao + khung hoang that + toi uu ty trong + rui ro mo)
function PhanRuiRo({ rr, pb, kq }) {
  if (!rr?.dsMa?.length) return <p className="text-sm mb-6" style={{ color: MUTED }}>{rr?.lichSuNgan?.length ? `Chưa đủ 120 phiên lịch sử để tính rủi ro cho: ${rr.lichSuNgan.join(", ")}.` : "Đang tải lịch sử giá 1 năm…"}</p>;
  const db = rr.duBao;
  const hq = rr.hieuQua;
  const rm = kq?.ruiRoMo;
  const rmMo = rm?.ds?.filter((x) => x.trangThai !== "khong_ro") ?? [];
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <The nhan="Biến động dự báo / năm" phu={`VN-Index ${Math.round(rr.volV)}% · 1 năm qua ${Math.round(rr.volP1Nam ?? rr.volP)}%`} mau={rr.volP > rr.volV * 1.3 ? VANG : TEXT}>{Math.round(rr.volP)}%</The>
        {db && (
          <The nhan="Sụt giảm 6 tháng tới (thống kê)" phu={`thường ≤ ${p0(db.trungVi)}% · 1/20 trường hợp > ${p0(db.p95)}%`} mau={db.p80 >= 35 ? DO : db.p80 >= 28 ? VANG : TEXT}>
            ≤ {p0(db.p80)}% <span className="text-sm" style={{ color: MUTED }}>(4/5 trường hợp)</span>
          </The>
        )}
        <The nhan="Beta" phu="VN-Index −10% → danh mục ≈" mau={rr.betaP > 1.3 ? VANG : TEXT}>
          {so2(rr.betaP)} <span className="text-sm" style={{ color: MUTED }}>({p1(-rr.betaP * 10)}%)</span>
        </The>
        <The nhan="Khoản đầu tư độc lập" phu={`từ ${rr.ma.length} mã (tương quan TB ${rr.tqTrungBinh != null ? so2(rr.tqTrungBinh) : "—"})`} mau={rr.soCuocDocLap < 1.4 ? DO : rr.soCuocDocLap < 1.7 ? VANG : TEXT}>
          ≈ {p1(rr.soCuocDocLap)}
        </The>
        <The nhan="Một phiên xấu (VaR 95%)" phu={`≈ ${tien(rr.var95Dong)} · tệ nhất 1 năm ${p1(rr.phienXauNhat.pct)}%`}>−{p1(rr.var95)}%</The>
        {rm && !rm.ds.some((x) => x.trangThai === "mo") && rm.daCham.length > 0 ? (
          <The nhan="Rủi ro mở (chạm mốc thoát)" phu={rm.daCham.slice(0, 4).join(", ") + (rm.daCham.length > 4 ? "…" : "")} mau={DO}>
            {rm.daCham.length} mã <span className="text-sm" style={{ color: MUTED }}>đã dưới mốc thoát</span>
          </The>
        ) : rm?.navPct != null ? (
          <The nhan="Rủi ro mở (chạm mốc thoát)" phu={`≈ ${tien(rm.tongMat)}${rm.daCham.length ? ` · ${rm.daCham.length} mã đã dưới mốc` : ""}`} mau={rm.navPct > 15 ? DO : rm.navPct > 10 ? VANG : TEXT}>
            −{p1(rm.navPct)}% <span className="text-sm" style={{ color: MUTED }}>tài sản ròng</span>
          </The>
        ) : (
          <The nhan="Sụt giảm tối đa 1 năm" phu={`VN-Index −${p1(Math.abs(rr.ddV))}%`} mau={Math.abs(rr.ddP.pct) > Math.abs(rr.ddV) * 1.3 ? VANG : TEXT}>−{p1(Math.abs(rr.ddP.pct))}%</The>
        )}
      </div>
      {db && (
        <Khoi tieuDe="6 tháng tới có thể ra sao" phu={`Phân bố kết quả của các danh mục có biến động tương tự (${p0(rr.volP)}%/năm) trên sàn Việt Nam 2014–2026 — thống kê, không phải dự đoán hướng thị trường.`}>
          <div className="grid gap-4 sm:grid-cols-2 text-sm" style={sans}>
            <div>
              <div className="text-xs mb-1.5" style={{ color: MUTED }}>Sụt giảm tối đa từ đỉnh trong 6 tháng</div>
              {[["Một nửa số trường hợp không quá", db.trungVi, db.nav?.trungVi], ["4/5 số trường hợp không quá", db.p80, db.nav?.p80], ["1/20 trường hợp tệ hơn", db.p95, db.nav?.p95]].map(([t, a, b]) => (
                <div key={t} className="flex justify-between border-t py-1.5" style={{ borderColor: "var(--vien-nhe)" }}>
                  <span>{t}</span>
                  <span style={{ fontWeight: 700 }}>−{p0(a)}%{b != null && <span className="text-xs font-normal" style={{ color: MUTED }}> · tài sản ròng −{p0(b)}%</span>}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs mb-1.5" style={{ color: MUTED }}>Lãi / lỗ sau 6 tháng (giữ nguyên)</div>
              {[["1/10 trường hợp kém nhất dưới", db.lai10], ["Trường hợp ở giữa", db.lai50], ["1/10 trường hợp tốt nhất trên", db.lai90]].map(([t, a]) => (
                <div key={t} className="flex justify-between border-t py-1.5" style={{ borderColor: "var(--vien-nhe)" }}>
                  <span>{t}</span>
                  <span style={{ fontWeight: 700, color: mauLai(a) }}>{a > 0 ? "+" : ""}{p1(a)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Khoi>
      )}
      <Khoi tieuDe="Nếu cầm danh mục này 1 năm qua" phu={`Tỷ trọng hiện tại giữ nguyên, ${rr.soPhien} phiên từ ${rr.tuNgay.split("-").reverse().join("/")}. Quá khứ, không phải dự báo.`}>
        <BieuDoHieuSuat chuoi={rr.chuoi} />
        {hq && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm" style={sans}>
            {[
              ["Lãi trên mỗi đơn vị rủi ro (Sharpe)", so2(hq.sharpe), `VN-Index ${so2(hq.sharpeVni)}`],
              ["Chỉ tính rủi ro giảm (Sortino)", so2(hq.sortino), "trừ lãi tiền gửi 5%/năm"],
              ["Phiên VN-Index tăng, danh mục đi theo", hq.batTang != null ? `${p0(hq.batTang * 100)}%` : "—", "trên 100% = tăng mạnh hơn"],
              ["Phiên VN-Index giảm, danh mục giảm theo", hq.batGiam != null ? `${p0(hq.batGiam * 100)}%` : "—", "dưới 100% = giảm ít hơn"],
            ].map(([t, v, phu]) => (
              <div key={t} className="rounded-xl border p-3" style={{ borderColor: VIEN }}>
                <div className="text-[11px]" style={{ color: MUTED }}>{t}</div>
                <div className="text-base" style={{ fontWeight: 700 }}>{v}</div>
                <div className="text-[11px]" style={{ color: MUTED }}>{phu}</div>
              </div>
            ))}
          </div>
        )}
      </Khoi>
      <Khoi tieuDe="Kiểm tra sức chịu đựng" phu="Danh mục, tài sản ròng và tỷ lệ ký quỹ sẽ ra sao nếu thị trường giảm.">
        <BangKichBan ds={rr.kichBan} coMargin={!!pb.margin} />
      </Khoi>
      {rr.khungHoang?.length > 0 && (
        <Khoi tieuDe="Nếu các đợt khủng hoảng thật lặp lại" phu="Giá thật từng mã (đã điều chỉnh cổ tức) từ ngày đỉnh tới ngày đáy của VN-Index trong mỗi đợt, với tỷ trọng hiện tại.">
          <BangKichBan ds={rr.khungHoang} coMargin={!!pb.margin} cotDau="Đợt" />
        </Khoi>
      )}
      {rr.toiUu?.ma?.length >= 2 && (
        <Khoi tieuDe="Tỷ trọng tối ưu theo rủi ro" phu={rr.toiUu.coThayDoi ? "Cùng các mã đang cầm, chia lại tỷ trọng để danh mục dao động ít nhất." : "Tỷ trọng hiện tại đã gần với cách chia ít rủi ro nhất — không cần điều chỉnh."}>
          <ToiUuTyTrong tu={rr.toiUu} hangMa={kq?.hangMa} />
        </Khoi>
      )}
      {rmMo.length > 0 && (
        <Khoi tieuDe="Rủi ro mở theo mốc thoát" phu={`Mốc thoát gần nhất dưới giá: cắt lỗ hệ thống, đường cân bằng dài hạn hoặc lỗ ${Math.abs((kq?.phongCach?.catLo ?? -10) - 5)}% so với giá vốn. Nhiều nhà giao dịch giữ tổng mức này dưới 6–10% tài sản (quy tắc phổ biến, không phải kiểm chứng của web).`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={sans}>
              <thead>
                <tr className="text-left text-xs" style={{ color: MUTED }}>
                  <th className="py-1.5 pr-2 font-normal">Mã</th>
                  <th className="py-1.5 px-2 font-normal text-right">Mốc thoát</th>
                  <th className="py-1.5 px-2 font-normal text-right">Cách giá</th>
                  <th className="py-1.5 pl-2 font-normal text-right">Mất nếu chạm</th>
                </tr>
              </thead>
              <tbody>
                {rmMo.map((x) => (
                  <tr key={x.ma} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                    <td className="py-2 pr-2" style={{ fontWeight: 700 }}>{x.ma}</td>
                    <td className="py-2 px-2 text-right">{soVN(x.moc, 2)}</td>
                    <td className="py-2 px-2 text-right">{x.trangThai === "da_cham" ? <span style={{ color: DO }}>đã dưới mốc</span> : `−${p1(x.cachPct)}%`}</td>
                    <td className="py-2 pl-2 text-right whitespace-nowrap">{x.trangThai === "da_cham" ? "cần xử lý" : `${tien(x.mat)} · ${p1(x.navPct)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Khoi>
      )}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Khoi tieuDe="Vốn bỏ vào vs rủi ro gánh" className="" phu="Mã có thanh tím dài hơn thanh cam là mã đang gánh rủi ro nhiều hơn phần vốn của nó.">
          <VonVaRuiRo ma={rr.ma} />
        </Khoi>
        <Khoi tieuDe="Các mã có thực sự khác nhau?" className="" phu="Tương quan lợi suất ngày trong 1 năm (tối đa 12 mã lớn nhất).">
          {rr.ma.length >= 2 ? <MaTranTuongQuan rr={rr} /> : <p className="text-sm" style={{ color: MUTED }}>Cần ít nhất 2 mã.</p>}
        </Khoi>
      </div>
      {rr.lichSuNgan?.length > 0 && <p className="text-xs mb-4" style={{ color: VANG }}>Chưa đủ 120 phiên lịch sử nên chưa tính rủi ro cho: {rr.lichSuNgan.join(", ")}.</p>}
    </>
  );
}

// duLieu: { MA: dong tin hieu rut gon } (khach chi co truong cong khai: gia, kijun, can bang, nganh...); laThanhVien: da duoc duyet -> co tin hieu / cat lo / chot loi he thong.
// dangNhap: co tai khoan -> luu nhieu danh muc len may chu (/api/danh-muc-luu) + canh bao.
export default function DanhGiaDanhMuc({ duLieu, daiHan = null, ngay = "", gocNganh = {}, laThanhVien = false, dangNhap = false }) {
  const [ds, setDs] = useState([moi()]);
  const [von, setVon] = useState(VON_MAC_DINH);
  const [phongCach, setPhongCach] = useState(PHONG_CACH_MAC_DINH);
  const [nhatKy, setNhatKy] = useState([]);
  const [baoCao, setBaoCao] = useState(BAO_CAO_MAC_DINH);
  const [dm, setDm] = useState({ id: null, ten: "" });
  const [dsLuu, setDsLuu] = useState([]);
  const [trangThaiLuu, setTrangThaiLuu] = useState("");
  const [lichSuNhan, setLichSuNhan] = useState([]);
  const [san, setSan] = useState(false);
  const [dan, setDan] = useState(false);
  const [vanBan, setVanBan] = useState("");
  const [thongBao, setThongBao] = useState("");
  const [lichSu, setLichSu] = useState({ khoa: "", du: null, dangTai: false, loi: "" });
  const [anMa, setAnMa] = useState(false);
  const [tab, setTab] = useState("xu_ly");
  const [chonKH, setChonKH] = useState({});
  const [moBaoCao, setMoBaoCao] = useState(false);
  const [goiYDu, setGoiYDu] = useState({ du: null, dangTai: true, loi: "" });
  const daLuuRef = useRef("");
  const henLuuRef = useRef(null);

  const anhChup = useCallback(() => ({ ds: ds.filter((x) => x.ma || x.kl || x.giaVon).map(({ ma, kl, giaVon }) => ({ ma, kl, giaVon })), von, phongCach, nhatKy, baoCao }), [ds, von, phongCach, nhatKy, baoCao]);
  const apDung = useCallback((du, { id = null, ten = "", lichSuNhan: ls = [] } = {}) => {
    setDs(du?.ds?.length ? du.ds.map((x) => moi(x)) : [moi()]);
    setVon({ ...VON_MAC_DINH, ...(du?.von ?? {}) });
    if (du?.phongCach && PHONG_CACH[du.phongCach]) setPhongCach(du.phongCach);
    setNhatKy(Array.isArray(du?.nhatKy) ? du.nhatKy : []);
    setBaoCao({ ...BAO_CAO_MAC_DINH, ...(du?.baoCao ?? {}) });
    setDm({ id, ten });
    setLichSuNhan(Array.isArray(ls) ? ls : []);
    setChonKH({});
  }, []);

  // doc danh muc dang mo tren MAY nay; co tai khoan thi tai danh sach da luu (danh muc dang chon / ?dm= lay ban tren may chu)
  useEffect(() => {
    let huy = false;
    const t = setTimeout(async () => {
      let local = null;
      try {
        local = JSON.parse(localStorage.getItem(KHOA_LUU) || "null");
        if (Array.isArray(local)) local = { ds: local };
      } catch {}
      // ban tren may chi la nhap: chi gan lai voi danh muc da luu SAU KHI may chu tra ve (tranh ghi de ban moi hon sua o thiet bi khac)
      if (local) apDung(local);
      setSan(true);
      // link tu thong bao ve may (?tab=goi_y): mo dung tab va cuon toi muc do
      const tabUrl = new URLSearchParams(window.location.search).get("tab");
      if (TABS.some(([k]) => k === tabUrl)) {
        setTab(tabUrl);
        setTimeout(() => document.querySelector('section[aria-label="Mã gợi ý mua"]')?.scrollIntoView({ behavior: "smooth", block: "start" }), 2500);
      }
      if (!dangNhap) return;
      try {
        const r = await fetch("/api/danh-muc-luu", { cache: "no-store" });
        const j = await r.json();
        if (huy || !r.ok) return;
        setDsLuu(j.ds ?? []);
        const tuUrl = Number(new URLSearchParams(window.location.search).get("dm"));
        const chon = (j.ds ?? []).find((d) => d.id === (tuUrl || local?.dmId));
        if (chon) {
          daLuuRef.current = khoaSo(chon.du_lieu);
          apDung(chon.du_lieu, { id: chon.id, ten: chon.ten, lichSuNhan: chon.lich_su_nhan });
          if (tuUrl) setTab("xu_ly");
        }
      } catch {}
    }, 0);
    return () => {
      huy = true;
      clearTimeout(t);
    };
  }, [dangNhap, apDung]);
  useEffect(() => {
    if (!san) return;
    try {
      localStorage.setItem(KHOA_LUU, JSON.stringify({ ...anhChup(), dmId: dm.id, dmTen: dm.ten }));
    } catch {}
  }, [anhChup, dm, san]);

  const luuLen = useCallback(
    async (id, ten, duLieu) => {
      setTrangThaiLuu("Đang lưu…");
      try {
        const r = await fetch("/api/danh-muc-luu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ten, duLieu }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.loi || "Không lưu được");
        daLuuRef.current = khoaSo(duLieu);
        setDsLuu((c) => {
          const co = c.some((d) => d.id === j.id);
          const dong = { id: j.id, ten, du_lieu: duLieu, cap_nhat: j.cap_nhat, lich_su_nhan: c.find((d) => d.id === j.id)?.lich_su_nhan ?? [] };
          return co ? c.map((d) => (d.id === j.id ? dong : d)) : [dong, ...c];
        });
        setTrangThaiLuu(`Đã lưu lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`);
        return j.id;
      } catch (e) {
        setTrangThaiLuu(`Lỗi lưu: ${e.message}`);
        return null;
      }
    },
    []
  );
  // danh muc da luu: tu luu 1,5 giay sau lan sua cuoi
  useEffect(() => {
    if (!san || !dm.id) return;
    const du = anhChup();
    if (khoaSo(du) === daLuuRef.current) return;
    henLuuRef.current = setTimeout(() => {
      henLuuRef.current = null;
      luuLen(dm.id, dm.ten, du);
    }, 1500);
    return () => clearTimeout(henLuuRef.current);
  }, [anhChup, dm, san, luuLen]);
  const luuNgay = () => {
    if (henLuuRef.current && dm.id) {
      clearTimeout(henLuuRef.current);
      henLuuRef.current = null;
      luuLen(dm.id, dm.ten, anhChup());
    }
  };
  const chonDanhMuc = (id) => {
    luuNgay();
    if (!id) {
      setDm({ id: null, ten: "" });
      setLichSuNhan([]);
      return;
    }
    const d = dsLuu.find((x) => x.id === id);
    if (!d) return;
    daLuuRef.current = khoaSo(d.du_lieu);
    apDung(d.du_lieu, { id: d.id, ten: d.ten, lichSuNhan: d.lich_su_nhan });
    setTrangThaiLuu("");
  };
  const luuMoi = async (ten) => {
    const id = await luuLen(null, ten, anhChup());
    if (id) setDm({ id, ten });
  };
  const doiTen = (ten) => {
    setDm((c) => ({ ...c, ten }));
    luuLen(dm.id, ten, anhChup());
  };
  const xoaDanhMuc = async () => {
    try {
      const r = await fetch(`/api/danh-muc-luu?id=${dm.id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.loi || "Không xóa được");
      setDsLuu((c) => c.filter((d) => d.id !== dm.id));
      setDm({ id: null, ten: "" });
      setLichSuNhan([]);
      setTrangThaiLuu("Đã xóa khỏi tài khoản");
    } catch (e) {
      setTrangThaiLuu(`Lỗi: ${e.message}`);
    }
  };
  const danhMucMoi = () => {
    luuNgay();
    apDung(null);
    setTrangThaiLuu("");
  };

  const vitri = useMemo(() => vitriTuNhap(ds), [ds]);
  const khoaMa = useMemo(() => [...new Set(vitri.map((x) => x.ma))].sort().join(","), [vitri]);

  // LICH SU GIA 1 NAM + BCTC + boi canh (1 lan goi cho ca danh muc), cho nguoi dung go xong 0,7 giay moi tai
  useEffect(() => {
    if (!khoaMa) return;
    let huy = false;
    const t = setTimeout(async () => {
      setLichSu((c) => ({ ...c, dangTai: true, loi: "" }));
      try {
        const r = await fetch(`/api/lich-su-danh-muc?ma=${encodeURIComponent(khoaMa)}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.thongBao || "Lỗi tải dữ liệu");
        if (!huy) setLichSu({ khoa: khoaMa, du: j, dangTai: false, loi: "" });
      } catch (e) {
        if (!huy) setLichSu((c) => ({ ...c, dangTai: false, loi: e.message || "Lỗi tải dữ liệu" }));
      }
    }, 700);
    return () => {
      huy = true;
      clearTimeout(t);
    };
  }, [khoaMa]);
  const du = lichSu.khoa === khoaMa ? lichSu.du : null;

  // MA GOI Y MUA (bo dieu kien da backtest, lib/goiYMua.js): 1 lan khi mo trang; thanh vien nhan danh sach, khach chi nhan so luong
  useEffect(() => {
    let huy = false;
    (async () => {
      try {
        const r = await fetch("/api/goi-y-mua", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.loi || "Lỗi tải dữ liệu");
        if (!huy) setGoiYDu({ du: j, dangTai: false, loi: "" });
      } catch (e) {
        if (!huy) setGoiYDu({ du: null, dangTai: false, loi: e.message || "Lỗi tải dữ liệu" });
      }
    })();
    return () => {
      huy = true;
    };
  }, []);

  // Ghep du lieu he thong voi du lieu tinh tu nen (ma ngoai danh sach web quet van danh gia duoc)
  const theoMa = useMemo(() => {
    const ra = { ...duLieu };
    const ls = lichSu.du?.ma ?? {};
    for (const [ma, x] of Object.entries(ls)) {
      if (!ra[ma]) ra[ma] = { ma, gia: x.gia, doi: x.doi, kijun: x.kijun, gg_bot: x.gg_bot, nganh: "Khác", ngoaiDanhSach: true };
      else if (ra[ma].kijun == null) ra[ma] = { ...ra[ma], kijun: x.kijun, gg_bot: ra[ma].gg_bot ?? x.gg_bot };
    }
    return ra;
  }, [duLieu, lichSu.du]);

  const vonOpts = useMemo(
    () => ({ tienMat: String(von.tienMat).trim() === "" ? null : trieu(von.tienMat), no: trieu(von.no), laiSuat: soNhap(von.laiSuat), nguong: { canhBao: soNhap(von.canhBao), giaiChap: soNhap(von.giaiChap) } }),
    [von]
  );
  const kq = useMemo(() => danhGiaToanBo({ vitri, theoMa, du, von: vonOpts, gocNganh, phongCach, coTinHieu: laThanhVien }), [vitri, theoMa, du, vonOpts, gocNganh, phongCach, laThanhVien]);
  const pb = kq?.pb ?? null;
  const rr = kq?.rr ?? null;
  const suc = kq?.suc ?? null;
  const pc = PHONG_CACH[phongCach];
  const keHoach = useMemo(() => {
    if (!kq) return null;
    const betaTheoMa = Object.fromEntries((kq.rr?.ma ?? []).map((x) => [x.ma, x.beta]));
    const soPhienTheoMa = Object.fromEntries((kq.rr?.thanhKhoan?.ds ?? []).map((x) => [x.ma, x.soPhien]));
    return goiYXuLy({ hang: kq.pb.hang, nhanTheoMa: kq.nhan, phongCach, taiSan: kq.pb.taiSan, margin: kq.pb.margin, nguong: kq.pb.nguong, cbTheoMa: du?.coBan ?? {}, rTheoMa: theoMa, lsTheoMa: du?.ma ?? {}, betaTheoMa, soPhienTheoMa, coTinHieu: laThanhVien });
  }, [kq, phongCach, du, theoMa, laThanhVien]);
  const hanhDongChon = useMemo(() => (keHoach?.hanhDong ?? []).map((a) => ({ ...a, ...(chonKH[a.id] ?? {}) })).filter((a) => a.chon), [keHoach, chonKH]);
  const sau = useMemo(() => {
    if (!kq || !hanhDongChon.length) return null;
    const ad = apDungKeHoach(kq.pb.hang, { tienMat: kq.pb.taiSan.tienMat, no: kq.pb.taiSan.no }, hanhDongChon);
    const kq2 = danhGiaToanBo({ vitri: ad.vitri, theoMa, du, von: { ...vonOpts, tienMat: ad.tienMat, no: ad.no }, gocNganh, phongCach, coTinHieu: laThanhVien });
    return kq2 ? { kq: kq2, ad } : null;
  }, [kq, hanhDongChon, theoMa, du, vonOpts, gocNganh, phongCach, laThanhVien]);
  // goi y theo DANH MUC KHACH: bo ma dang cam, so cho con lai (toi da 6), trung nganh, so luong theo 1/6 tai san va tien mat (danh muc rong = khach moi: tai san = tien mat)
  const goiY = useMemo(() => {
    const d = goiYDu.du;
    if (!d || d.khoa) return null;
    const dangCam = kq ? kq.hangMa.map((h) => ({ ma: h.ma, nganh: h.nganh })) : vitri.map((v) => ({ ma: v.ma, nganh: theoMa[v.ma]?.nganh }));
    const nav = kq ? kq.pb.taiSan.nav : (vonOpts.tienMat ?? 0) - (vonOpts.no ?? 0);
    return goiYTheoDanhMuc((d.mua ?? []).filter((x) => x.dat), { dangCam, taiSan: { tienMat: vonOpts.tienMat, no: vonOpts.no, nav } });
  }, [goiYDu.du, kq, vitri, theoMa, vonOpts]);
  // goi y mua theo phong cach DAI HAN: danh sach trang /dai-han (BCTC), khong dung tin hieu MUA / BAN
  const goiYDH = useMemo(() => {
    if (phongCach !== "dai_han" || !daiHan) return null;
    const dangCam = kq ? kq.hangMa.map((h) => ({ ma: h.ma, nganh: h.nganh })) : vitri.map((v) => ({ ma: v.ma, nganh: theoMa[v.ma]?.nganh }));
    const nav = kq ? kq.pb.taiSan.nav : (vonOpts.tienMat ?? 0) - (vonOpts.no ?? 0);
    return goiYDaiHan(daiHan, { dangCam, taiSan: { tienMat: vonOpts.tienMat, no: vonOpts.no, nav } });
  }, [phongCach, daiHan, kq, vitri, theoMa, vonOpts]);
  const nxThe = useMemo(() => [...nhanXetRuiRo(rr, pb), ...(kq?.dn?.nhanXet ?? [])].sort((a, b) => a.muc - b.muc || a.uuTien - b.uuTien), [rr, pb, kq]);
  const theoMaRR = useMemo(() => Object.fromEntries((rr?.ma ?? []).map((x) => [x.ma, x])), [rr]);
  const thanhKhoanMa = useMemo(() => Object.fromEntries((rr?.thanhKhoan?.ds ?? []).map((x) => [x.ma, x.soPhien])), [rr]);
  const dsMa = useMemo(() => Object.keys(duLieu).sort(), [duLieu]);
  const giaTheoMa = useMemo(() => Object.fromEntries(Object.entries(theoMa).map(([m, r]) => [m, r.gia])), [theoMa]);

  const sua = (id, k, v) => setDs((c) => c.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  const nhapDan = () => {
    const { ds: moiDs, boQua } = docDanDanhMuc(vanBan);
    if (!moiDs.length) {
      setThongBao("Không đọc được dòng nào. Mỗi dòng dạng: HPG 1000 25,5 (mã, số lượng, giá vốn).");
      return;
    }
    setDs((c) => {
      const co = c.filter((x) => x.ma || x.kl || x.giaVon);
      const m = new Map(co.map((x) => [x.ma.toUpperCase(), x]));
      for (const x of moiDs) m.set(x.ma, moi({ ma: x.ma, kl: String(x.kl), giaVon: x.giaVon != null ? String(x.giaVon).replace(".", ",") : "" }));
      return [...m.values()];
    });
    setThongBao(`Đã nhập ${moiDs.length} mã${boQua.length ? `, bỏ qua ${boQua.length} dòng không đọc được` : ""}.`);
    setVanBan("");
    setDan(false);
  };
  // GHI LENH vao nhat ky + cap nhat vi the (giu thu tu dong; ma moi them cuoi; ban het thi bo dong)
  const themLenh = (gd) => {
    const r = apDungGiaoDich(vitri, { ...gd, ngay: gd.ngay || homNayVN(), id: `g${Date.now()}${dem++}` }, { phiPct: soNhap(von.phi) ?? 0 });
    if (r.loi) return r.loi;
    const moiMa = new Map(r.ds.map((x) => [x.ma, x]));
    setDs((c) => {
      const ra = [];
      const daCo = new Set();
      for (const x of c) {
        const m = x.ma.trim().toUpperCase();
        if (m !== r.ghi.ma) {
          ra.push(x);
          continue;
        }
        if (daCo.has(m)) continue;
        daCo.add(m);
        const n = moiMa.get(m);
        if (n) ra.push({ ...x, ma: m, kl: String(n.kl), giaVon: soO(n.giaVon) });
      }
      if (!daCo.has(r.ghi.ma) && moiMa.get(r.ghi.ma)) {
        const n = moiMa.get(r.ghi.ma);
        const trong = ra.findIndex((x) => !x.ma && !x.kl);
        const dong = moi({ ma: n.ma, kl: String(n.kl), giaVon: soO(n.giaVon) });
        if (trong >= 0) ra[trong] = dong;
        else ra.push(dong);
      }
      return ra.length ? ra : [moi()];
    });
    setNhatKy((n) => [...n, r.ghi]);
    return null;
  };
  const daLamTheoKeHoach = (gd) => {
    const loi = themLenh(gd);
    setThongBao(loi ? loi : `Đã ghi ${gd.loai === "mua" ? "mua" : "bán"} ${gd.kl} ${gd.ma} vào nhật ký và cập nhật danh mục.`);
  };

  const o = "px-2.5 py-1.5 rounded-lg text-sm border w-full";
  const oStyle = { borderColor: VIEN, background: "transparent", color: TEXT, ...sans };
  const nutPhu = "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold";
  const soCanXuLy = kq ? Object.values(kq.nhan).filter((n) => n.muc >= 2).length : 0;
  const soGoiY = phongCach === "dai_han" ? goiYDH?.soMaTrongCho ?? 0 : goiY ? goiY.goiY.filter((x) => x.trongCho).length : goiYDu.du?.khoa ? goiYDu.du.soDat ?? 0 : 0;

  return (
    <div>
      <DanhGiaLuuThanh dangNhap={dangNhap} dsLuu={dsLuu} dmId={dm.id} ten={dm.ten} trangThai={trangThaiLuu} onChon={chonDanhMuc} onLuuMoi={luuMoi} onDoiTen={doiTen} onXoa={xoaDanhMuc} onMoi={danhMucMoi} />

      {/* NHAP DANH MUC */}
      <Khoi tieuDe="1. Danh mục" phai={<span className="text-[11px]" style={{ color: MUTED }}>{dm.id ? `Đang sửa “${dm.ten}” — tự lưu vào tài khoản` : "Lưu trên máy này"}</span>}>
        <datalist id="ds-ma-danh-gia">{dsMa.map((m) => <option key={m} value={m} />)}</datalist>
        <div className="grid grid-cols-[minmax(70px,1fr)_minmax(90px,1.2fr)_minmax(90px,1.2fr)_32px] gap-2 text-[11px] mb-1" style={{ color: MUTED }}>
          <span>Mã</span>
          <span>Số lượng (cp)</span>
          <span title="Giá mua bình quân, đơn vị nghìn đồng như giá trên web (vd 25,5 = 25.500đ)">Giá vốn (nghìn đồng, tùy chọn)</span>
          <span />
        </div>
        {ds.map((x) => (
          <div key={x.id} className="grid grid-cols-[minmax(70px,1fr)_minmax(90px,1.2fr)_minmax(90px,1.2fr)_32px] gap-2 mb-2 items-center">
            <input list="ds-ma-danh-gia" value={x.ma} onChange={(e) => sua(x.id, "ma", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))} placeholder="HPG" className={o} style={{ ...oStyle, fontWeight: 700 }} aria-label="Mã cổ phiếu" />
            <input value={x.kl} onChange={(e) => sua(x.id, "kl", e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="numeric" placeholder="1.000" className={o} style={oStyle} aria-label="Số lượng" />
            <input value={x.giaVon} onChange={(e) => sua(x.id, "giaVon", e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="decimal" placeholder="25,5" className={o} style={oStyle} aria-label="Giá vốn" />
            <button type="button" onClick={() => setDs((c) => (c.length > 1 ? c.filter((y) => y.id !== x.id) : [moi()]))} aria-label="Xóa dòng" style={{ color: MUTED }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button type="button" onClick={() => setDs((c) => [...c, moi()])} className={nutPhu} style={{ borderColor: VIEN, color: TEXT, ...sans }}>
            <Plus size={13} /> Thêm mã
          </button>
          <button type="button" onClick={() => setDan((v) => !v)} className={nutPhu} style={{ borderColor: VIEN, color: TEXT, ...sans }}>
            <ClipboardPaste size={13} /> Dán nhiều dòng
          </button>
          {vitri.length === 0 && (
            <button type="button" onClick={() => setDs(MAU_THU.map((x) => moi(x)))} className={nutPhu} style={{ borderColor: PRIMARY, color: PRIMARY, ...sans }}>
              <Sparkles size={13} /> Thử với danh mục mẫu
            </button>
          )}
          <button type="button" onClick={() => { setDs([moi()]); setThongBao(""); }} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: MUTED, ...sans }}>Xóa hết</button>
          {thongBao && <span className="text-xs" style={{ color: MUTED }}>{thongBao}</span>}
        </div>
        {dan && (
          <div className="mt-3">
            <textarea value={vanBan} onChange={(e) => setVanBan(e.target.value)} rows={5} placeholder={"HPG 1000 25,5\nVCB 500 57,2\nSSI 2.000 19"} className={`${o} font-mono`} style={oStyle} aria-label="Dán danh mục" />
            <button type="button" onClick={nhapDan} className="mt-2 text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: PRIMARY, color: "#fff", ...sans }}>Nhập vào danh mục</button>
            <p className="text-[11px] mt-1" style={{ color: MUTED }}>Mỗi dòng: mã, số lượng, giá vốn (cách nhau bằng dấu cách). Có thể copy thẳng từ bảng danh mục của app chứng khoán rồi sửa lại.</p>
          </div>
        )}

        {/* PHONG CACH DAU TU */}
        <div className="mt-5">
          <div className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>Phong cách đầu tư</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" role="radiogroup" aria-label="Phong cách đầu tư">
            {Object.entries(PHONG_CACH).map(([k, p]) => (
              <button key={k} type="button" role="radio" aria-checked={phongCach === k} onClick={() => { setPhongCach(k); setChonKH({}); }} className="text-left rounded-xl border px-3 py-2" style={{ borderColor: phongCach === k ? PRIMARY : VIEN, background: phongCach === k ? "color-mix(in srgb, #6C5CE7 12%, var(--card))" : "transparent", ...sans }}>
                <div className="text-sm" style={{ fontWeight: 700 }}>{p.ten}</div>
                <div className="text-[11px] hidden sm:block" style={{ color: MUTED }}>{k === "trung_han" ? "Theo hệ thống CloudStock" : `Tỷ trọng tối đa ${Math.round(p.tyTrongToiDa * 100)}%/mã${p.catLo != null ? `, cắt lỗ ${p.catLo}%` : ", không cắt lỗ theo giá"}`}</div>
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: MUTED }}>{pc.moTa} Phong cách đổi trọng số điểm, cách gắn trạng thái từng mã và kế hoạch xử lý — cùng một bộ dữ liệu.</p>
        </div>

        <details className="mt-4">
          <summary className="text-sm cursor-pointer select-none" style={{ ...sans, fontWeight: 700 }}>Vốn & margin (tùy chọn)</summary>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
            {[
              ["tienMat", "Tiền mặt còn lại (triệu đồng)", "50"],
              ["no", "Dư nợ margin (triệu đồng)", "0"],
              ["laiSuat", "Lãi suất margin (%/năm)", "12"],
              ["canhBao", "Ngưỡng cảnh báo ký quỹ (%)", "35"],
              ["giaiChap", "Ngưỡng xử lý / giải chấp (%)", "30"],
              ["phi", "Phí giao dịch (%/lệnh)", "0,15"],
            ].map(([k, nhan, ph]) => (
              <label key={k} className="block text-[11px]" style={{ color: MUTED }}>
                {nhan}
                <input value={von[k]} onChange={(e) => setVon((v) => ({ ...v, [k]: e.target.value.replace(/[^0-9.,]/g, "") }))} inputMode="decimal" placeholder={ph} className={`${o} mt-1`} style={oStyle} />
              </label>
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: MUTED }}>Tỷ lệ ký quỹ = (tài sản − nợ) / tài sản. Ngưỡng cảnh báo / xử lý mỗi công ty chứng khoán một kiểu (thường 30–40%) — sửa theo CTCK của bạn. Web coi mọi mã trong danh mục đều được vay. Phí giao dịch dùng cho nhật ký (lãi đã chốt).</p>
        </details>
      </Khoi>

      {!pb && (
        <>
          <p className="text-sm mb-4" style={{ color: MUTED }}>Nhập ít nhất một mã và số lượng (hoặc bấm “Thử với danh mục mẫu”) để xem đánh giá. Khách chưa có mã nào: nhập tiền mặt ở “Vốn & margin” để xem kế hoạch mua bên dưới.</p>
          {phongCach === "dai_han" ? <DanhGiaGoiYDaiHan goiY={goiYDH} onGhiNhatKy={daLamTheoKeHoach} /> : <DanhGiaGoiYMua du={goiYDu.du} dangTai={goiYDu.dangTai} loi={goiYDu.loi} goiY={goiY} laThanhVien={laThanhVien} phongCach={phongCach} onGhiNhatKy={daLamTheoKeHoach} />}
        </>
      )}

      {pb && (
        <>
          {/* 2. KET LUAN */}
          <Khoi
            tieuDe="2. Kết luận"
            phai={
              <span className="inline-flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                  <input type="checkbox" checked={anMa} onChange={(e) => setAnMa(e.target.checked)} /> Ẩn tên mã trong ảnh
                </label>
                <XuatAnh kieu="nho" nhan="Tạo ảnh chia sẻ" tieuDe="Đánh giá danh mục" tenFile="CloudStock-danh-gia-danh-muc.png" rong={RONG_THE_DANH_GIA} the={<TheDanhGiaDanhMuc suc={suc} rr={rr} pb={pb} nhanXet={nxThe} anMa={anMa} ngay={ngay} phongCach={pc.ten} />} />
                <button type="button" onClick={() => setMoBaoCao(true)} className={nutPhu} style={{ borderColor: PRIMARY, background: PRIMARY, color: "#fff", ...sans }}>
                  <FileText size={13} /> Xuất báo cáo PDF
                </button>
              </span>
            }
          >
            <div className="grid gap-5 lg:grid-cols-[230px_1fr_1.4fr] items-start">
              <div className="text-center">
                <DongHoDiem diem={suc?.diem} xepLoai={suc?.xepLoai} size={210} />
                <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                  {suc?.gioiHan
                    ? `Giới hạn ở mức Trung bình vì ${Math.round(suc.tyLeNang * 100)}% giá trị nằm ở mã cần thoát`
                    : lichSu.dangTai
                      ? "Đang tải lịch sử giá và BCTC…"
                      : suc?.dayDu
                        ? `Chấm theo phong cách ${pc.ngan.toLowerCase()} · 1 năm dữ liệu giá`
                        : lichSu.loi
                          ? `Chưa tải được lịch sử giá (${lichSu.loi}) — điểm tạm tính`
                          : "Điểm tạm tính"}
                </p>
              </div>
              <div>
                {TRU.filter(([k]) => suc?.tru?.[k] != null).map(([k, ten, moTa]) => (
                  <TruDiem key={k} ten={ten} v={suc.tru[k]} toiDa={suc.toiDa[k]} moTa={moTa} />
                ))}
                {suc?.thieuDN && <p className="text-[11px]" style={{ color: MUTED }}>Doanh nghiệp: chưa đủ BCTC, tạm tính 50%.</p>}
              </div>
              <div>
                <h3 className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>Điều quan trọng nhất</h3>
                <ul className="grid gap-2.5">
                  {kq.nhanXet.slice(0, 3).map((x, k) => <NhanXet key={k} x={x} />)}
                </ul>
              </div>
            </div>
          </Khoi>

          {/* 3. TAI SAN */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <The nhan="Giá trị cổ phiếu" phu={`${pb.soMaCoGia}/${pb.soMa} mã có giá${ngay ? ` · ${ngay}` : ""}`}>{tien(pb.tongGiaTri)}</The>
            <The nhan="Lãi / lỗ so với giá vốn" mau={mauLai(pb.laiLo)} phu={pb.laiLo != null ? tien(pb.laiLo) : "Chưa nhập giá vốn"}>{pb.laiLoPct != null ? pct(pb.laiLoPct, 1) : "—"}</The>
            <The nhan="Tài sản ròng (NAV)" phu={pb.taiSan.no > 0 ? `Nợ ${tien(pb.taiSan.no)} · tiền ${tien(pb.taiSan.tienMat)}` : `Tiền mặt ${tien(pb.taiSan.tienMat)} (${Math.round(pb.taiSan.tyLeTienMat * 100)}%)`}>{tien(pb.taiSan.nav)}</The>
            {pb.margin ? (
              <The nhan={`Giảm bao nhiêu thì chạm ${pb.nguong.canhBao}%`} mau={pb.margin.giamDenCanhBao == null ? MUTED : pb.margin.giamDenCanhBao <= 10 ? DO : pb.margin.giamDenCanhBao <= 25 ? VANG : XANH} phu={`Đòn bẩy ${pb.margin.donBay != null ? pb.margin.donBay.toFixed(2).replace(".", ",") : "—"}x · ký quỹ ${pb.margin.tyLeKyQuy != null ? Math.round(pb.margin.tyLeKyQuy) : "—"}%${pb.margin.laiMoiThang != null ? ` · lãi ~${tien(pb.margin.laiMoiThang)}/tháng` : ""}`}>
                {pb.margin.giamDenCanhBao != null ? `−${Math.round(pb.margin.giamDenCanhBao)}%` : "—"}
              </The>
            ) : (
              <The nhan="Margin" phu="Mở mục “Vốn & margin” để nhập">Không dùng</The>
            )}
          </div>

          {/* CAC TAB */}
          <div className="flex gap-1 overflow-x-auto mb-4 border-b bang-cuon" style={{ borderColor: VIEN }} role="tablist">
            {TABS.map(([k, t]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="px-3.5 py-2 text-sm whitespace-nowrap -mb-px border-b-2" style={{ ...sans, fontWeight: tab === k ? 800 : 600, borderColor: tab === k ? PRIMARY : "transparent", color: tab === k ? TEXT : MUTED }}>
                {t}
                {k === "xu_ly" && soCanXuLy > 0 && <span className="ml-1.5 text-[11px] px-1.5 rounded-full" style={{ background: DO, color: "#fff" }}>{soCanXuLy}</span>}
                {k === "goi_y" && soGoiY > 0 && <span className="ml-1.5 text-[11px] px-1.5 rounded-full" style={{ background: XANH, color: "#fff" }}>{soGoiY}</span>}
              </button>
            ))}
          </div>

          {tab === "xu_ly" && <DanhGiaXuLy kq={kq} keHoach={keHoach} chon={chonKH} setChon={setChonKH} sau={sau} laThanhVien={laThanhVien} lichSuNhan={lichSuNhan} coLuu={!!dm.id} onGhiNhatKy={daLamTheoKeHoach} theoMa={theoMa} />}
          {tab === "rui_ro" && <PhanRuiRo rr={rr} pb={pb} kq={kq} />}
          {tab === "goi_y" && (phongCach === "dai_han" ? <DanhGiaGoiYDaiHan goiY={goiYDH} onGhiNhatKy={daLamTheoKeHoach} /> : <DanhGiaGoiYMua du={goiYDu.du} dangTai={goiYDu.dangTai} loi={goiYDu.loi} goiY={goiY} laThanhVien={laThanhVien} phongCach={phongCach} onGhiNhatKy={daLamTheoKeHoach} />)}
          {tab === "doanh_nghiep" && <DanhGiaDoanhNghiep kq={kq} coBan={du?.coBan ?? {}} thiTruong={du?.thiTruong} />}
          {tab === "boi_canh" && <DanhGiaBoiCanh boiCanh={du?.boiCanh} kq={kq} gocNganh={gocNganh} />}
          {tab === "nhat_ky" && <DanhGiaNhatKy nhatKy={nhatKy} phiPct={soNhap(von.phi) ?? 0} catLo={pc.catLo} giaTheoMa={giaTheoMa} onThem={themLenh} onXoa={(id) => setNhatKy((n) => n.filter((g) => g.id !== id))} tenDanhMuc={dm.ten} />}

          {tab === "chi_tiet" && (
            <>
              <Khoi tieuDe="Báo cáo chi tiết">
                <ul className="grid gap-2.5">
                  {kq.nhanXet.map((x, k) => <NhanXet key={k} x={x} />)}
                </ul>
                {pb.thieu.length > 0 && <p className="text-xs mt-3" style={{ color: VANG }}>Chưa có dữ liệu giá cho: {pb.thieu.join(", ")} — không tính vào tỷ trọng.</p>}
              </Khoi>
              <div className="grid gap-4 lg:grid-cols-2 mb-6">
                <Khoi tieuDe="Theo ngành" className="" phu={pb.gocNganhLon ? `Ngành lớn nhất đang ở góc ${{ Leading: "Dẫn dắt", Improving: "Cải thiện", Weakening: "Yếu dần", Lagging: "Tụt hậu" }[pb.gocNganhLon]} trên RRG ngành.` : undefined}>
                  {pb.nganh.map((n) => <Thanh key={n.ten} ten={n.ten} v={n.tyTrong} />)}
                </Khoi>
                <Khoi tieuDe="Theo mã" className="">
                  {[...kq.hangMa].filter((h) => h.tyTrong != null).sort((a, b) => b.tyTrong - a.tyTrong).map((h) => <Thanh key={h.ma} ten={h.ma} v={h.tyTrong} />)}
                </Khoi>
              </div>
              <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
                <div className="overflow-x-auto bang-cuon">
                  <table className="w-full text-sm" style={sans}>
                    <thead>
                      <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED }}>
                        {["Mã", "Số lượng", "Giá vốn", "Giá", "Lãi/lỗ", "Giá trị", "Tỷ trọng", "Rủi ro gánh", "Biến động năm", "Beta", "Phiên để bán hết", "Trạng thái", "Tín hiệu hệ thống", "Nhận xét"].map((t, i) => (
                          <th key={t} className={`py-3 px-3 font-normal whitespace-nowrap ${i > 0 && i < 11 ? "text-right" : ""}`}>{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pb.hang.map((h, i) => {
                        const r = theoMaRR[h.ma];
                        const tk = thanhKhoanMa[h.ma];
                        const n = kq.nhan[h.ma];
                        return (
                          <tr key={`${h.ma}${i}`} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                            <td className="py-2.5 px-3 font-bold"><Link href={`/ma/${h.ma}`} className="hover:underline">{h.ma}</Link></td>
                            <td className="py-2.5 px-3 text-right">{soVN(h.kl)}</td>
                            <td className="py-2.5 px-3 text-right">{h.giaVon != null ? fmt(h.giaVon) : "—"}</td>
                            <td className="py-2.5 px-3 text-right">{h.gia != null ? fmt(h.gia) : "—"}</td>
                            <td className="py-2.5 px-3 text-right" style={{ color: mauLai(h.laiLoPct) }}>{h.laiLoPct != null ? pct(h.laiLoPct, 1) : "—"}</td>
                            <td className="py-2.5 px-3 text-right">{tien(h.giaTri)}</td>
                            <td className="py-2.5 px-3 text-right">{h.tyTrong != null ? `${p1(h.tyTrong * 100)}%` : "—"}</td>
                            <td className="py-2.5 px-3 text-right" style={{ color: r && r.rc - r.w > 0.08 ? VANG : TEXT }}>{r ? `${p1(r.rc * 100)}%` : "—"}</td>
                            <td className="py-2.5 px-3 text-right">{r ? `${Math.round(r.vol)}%` : "—"}</td>
                            <td className="py-2.5 px-3 text-right">{r ? r.beta.toFixed(2).replace(".", ",") : "—"}</td>
                            <td className="py-2.5 px-3 text-right" style={{ color: tk > 5 ? DO : tk > 1 ? VANG : TEXT }}>{tk != null ? (tk < 1 ? "< 1" : p1(tk)) : "—"}</td>
                            <td className="py-2.5 px-3">{laThanhVien ? <NhanTrangThai nhan={n?.nhan} ten={NHAN[n?.nhan]?.ten} /> : <span className="inline-flex items-center gap-1 text-xs" style={{ color: MUTED }}><Lock size={12} /> Thành viên</span>}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {laThanhVien ? (
                                <span style={{ color: MAU_TIN[h.tin] ?? MUTED, fontWeight: 700 }}>{NHAN_TIN[h.tin] ?? (theoMa[h.ma]?.ngoaiDanhSach ? "Ngoài danh sách" : "—")}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs" style={{ color: MUTED }}><Lock size={12} /> Thành viên</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 min-w-[260px]">
                              <div className="flex flex-col gap-1">
                                {h.nhanXet.length === 0 ? <span style={{ color: MUTED }}>—</span> : h.nhanXet.map((x, j) => <span key={j} className="text-xs" style={{ color: MAU_MUC[x.muc] }}>{x.nhan}</span>)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!laThanhVien && tab !== "xu_ly" && tab !== "goi_y" && (
            <div className="rounded-2xl border p-5 mb-6 flex flex-wrap items-center justify-between gap-4" style={{ borderColor: PRIMARY, background: "color-mix(in srgb, #6C5CE7 10%, var(--card))" }}>
              <div className="max-w-xl">
                <p className="text-base mb-1" style={{ ...sans, fontWeight: 800 }}>Nên giữ hay bán từng mã? Có nên trung bình giá?</p>
                <p className="text-sm" style={{ color: MUTED }}>Thành viên (miễn phí) thấy trạng thái và kế hoạch xử lý từng mã theo phong cách của mình, tín hiệu MUA / BÁN, mốc cắt lỗ – chốt lời, và nhận cảnh báo khi mã trong danh mục chuyển xấu.</p>
              </div>
              <TaiKhoanNut nhan="Đăng ký miễn phí" />
            </div>
          )}

          <BaoCaoDanhMuc mo={moBaoCao} dong={() => setMoBaoCao(false)} kq={kq} sau={sau} hanhDongChon={hanhDongChon} du={du} gocNganh={gocNganh} laThanhVien={laThanhVien} baoCao={baoCao} setBaoCao={setBaoCao} ngay={ngay} nhatKy={nhatKy} tenDanhMuc={dm.ten} goiY={phongCach === "dai_han" ? null : goiY} goiYDu={goiYDu.du} />
        </>
      )}

      <details className="text-[11px] mb-2 mt-4" style={{ color: MUTED }}>
        <summary className="cursor-pointer select-none" style={{ fontWeight: 700 }}>Cách tính & giới hạn</summary>
        <div className="mt-2 grid gap-1.5 leading-relaxed">
          <p>Dữ liệu: giá đóng cửa đã điều chỉnh cổ tức (DNSE) khoảng 1 năm gần nhất, tỷ trọng hiện tại giữ nguyên suốt cả năm. Mã có dưới 120 phiên lịch sử không được tính rủi ro. BCTC quý mới nhất từ VNDirect.</p>
          <p>Biến động dự báo = trung bình độ lệch chuẩn lợi suất ngày 1 năm và độ lệch chuẩn có trọng số giảm dần theo thời gian (EWMA λ 0,97 của RiskMetrics), × √250 — kiểm chứng 2014–2026 dự báo biến động 3 tháng sau sát hơn chỉ dùng 1 năm. Beta so với VN-Index. “Rủi ro gánh” = phần đóng góp vào phương sai danh mục (risk contribution). “Khoản đầu tư độc lập” = bình phương hệ số đa dạng hóa (tổng biến động từng mã theo tỷ trọng / biến động danh mục) — xấp xỉ số nguồn rủi ro độc lập.</p>
          <p>Một phiên xấu (VaR 95%) = 1,645 × biến động ngày dự báo (VaR lấy thẳng từ 1 năm lịch sử bị vượt ở 6,1% số phiên thay vì 5%). Kịch bản VN-Index −5/−10/−20% ước theo beta (tuyến tính); “đợt giảm mạnh nhất 1 năm” và 6 đợt khủng hoảng 2015–2026 dùng giá thật từng mã giữa ngày đỉnh và ngày đáy của VN-Index (mã chưa niêm yết lúc đó ước theo beta). Phiên để bán hết = giá trị vị thế / (20% giá trị giao dịch bình quân 20 phiên).</p>
          <p>Sụt giảm 6 tháng tới và tỷ trọng tối ưu lấy từ mô phỏng 8.640 danh mục 3–10 mã (chọn ngẫu nhiên trong các mã thanh khoản, một nửa dồn vào một ngành) mỗi tháng từ 2014 tới 2026, đo kết quả 126 phiên sau. Chỉ có mã còn niêm yết hiện nay (thiên lệch sống sót) và một thị trường — thống kê, không phải dự đoán. Rủi ro mở = số tiền mất nếu mọi mã giảm về mốc thoát gần nhất rồi bán.</p>
          <p>Phong cách đầu tư không phải 2 hệ thống tín hiệu riêng: cùng một bộ dữ liệu, mỗi phong cách đổi trọng số 5 trụ điểm, quy tắc gắn trạng thái Giữ / Theo dõi / Giảm tỷ trọng / Thoát và quy tắc mua thêm. “Theo xu hướng trung hạn” dùng tín hiệu, cắt lỗ, Kijun và đường cân bằng dài hạn của hệ thống; “Dài hạn” dùng ngưỡng doanh nghiệp web tự đặt. Kế hoạch xử lý: bán trước mua sau, tiền bán trả nợ margin trước, lô 100 cp, không đề xuất mua thêm khi đang dùng margin.</p>
          <p>Điểm sức khỏe: trọng số trụ Đa dạng / Rủi ro / Xu hướng chọn theo mức báo trước sụt giảm 6 tháng (tìm trên 2014–2019, kiểm lại trên 2020–2026: tương quan với sụt giảm thực tế 0,41 so với 0,28 của cách chấm cũ); điểm cao nghĩa là ít rủi ro hơn, không có nghĩa lãi nhiều hơn. Trụ Thanh khoản, Doanh nghiệp và mức tối đa 64 khi quá nửa giá trị nằm ở mã cần thoát vẫn là ngưỡng web tự đặt. Lãi/lỗ chưa trừ phí và thuế (nhật ký có trừ). Chỉ để tham khảo, không phải khuyến nghị đầu tư.</p>
        </div>
      </details>
    </div>
  );
}
