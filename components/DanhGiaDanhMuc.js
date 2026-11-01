"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ClipboardPaste, Sparkles, Lock } from "lucide-react";
import { danhGiaDanhMuc, docDanDanhMuc } from "@/lib/danhGiaDanhMuc";
import { phanTichRuiRo, chamDiemSucKhoe, nhanXetRuiRo } from "@/lib/ruiRoDanhMuc";
import { fmt, pct } from "@/components/dungChung";
import { DongHoDiem, TruDiem, BieuDoHieuSuat, VonVaRuiRo, MaTranTuongQuan } from "@/components/DanhGiaDanhMucBieuDo";
import XuatAnh from "@/components/XuatAnh";
import TheDanhGiaDanhMuc, { RONG_THE_DANH_GIA } from "@/components/TheDanhGiaDanhMuc";
import TaiKhoanNut from "@/components/TaiKhoanNut";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const sans = { fontFamily: "var(--font-chu)" };
const KHOA_LUU = "cs_danh_gia_danh_muc_v1";
const MAU_MUC = [DO, VANG, XANH];
const NHAN_MUC = ["Cần xử lý", "Chú ý", "Tốt"];
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

const soVN = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString("vi-VN", { maximumFractionDigits: d }) : "—");
const p1 = (x) => (x == null || !Number.isFinite(x) ? "—" : x.toFixed(1).replace(".", ","));
function tien(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e9) return `${soVN(v / 1e9, 2)} tỷ`;
  if (a >= 1e6) return `${soVN(v / 1e6, 1)} triệu`;
  return `${soVN(v)} đ`;
}
const mauLai = (v) => (v == null ? MUTED : v > 0 ? XANH : v < 0 ? DO : TEXT);
const so = (s) => {
  const x = Number(String(s ?? "").replace(/\./g, (m, i, str) => (/,/.test(str) ? "" : m)).replace(",", "."));
  return Number.isFinite(x) ? x : null;
};
let dem = 0;
const moi = (o = {}) => ({ id: `h${Date.now()}${dem++}`, ma: "", kl: "", giaVon: "", ...o });

function Khoi({ tieuDe, phu, children, className = "mb-6", phai }) {
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${className}`} style={{ borderColor: VIEN, background: NEN_CARD }} aria-label={tieuDe}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>{tieuDe}</h2>
        {phai}
      </div>
      {phu && <p className="text-xs -mt-2 mb-3" style={{ color: MUTED }}>{phu}</p>}
      {children}
    </section>
  );
}
function The({ nhan, children, phu, mau }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="text-xs mb-1" style={{ color: MUTED }}>{nhan}</div>
      <div className="text-xl sm:text-2xl" style={{ ...sans, fontWeight: 800, color: mau ?? TEXT }}>{children}</div>
      {phu && <div className="text-[11px] mt-1" style={{ color: MUTED }}>{phu}</div>}
    </div>
  );
}
function Thanh({ ten, v, mau = "var(--bd-1)" }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1" style={sans}>
        <span>{ten}</span>
        <span style={{ color: MUTED }}>{(v * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--vien-nhe)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, v * 100)}%`, background: mau }} />
      </div>
    </div>
  );
}
function NhanXet({ x }) {
  return (
    <li className="flex gap-2.5 text-sm" style={sans}>
      <span aria-hidden="true" className="mt-1.5 shrink-0 rounded-full" style={{ width: 9, height: 9, background: MAU_MUC[x.muc] }} />
      <span>
        <span className="sr-only">{NHAN_MUC[x.muc]}: </span>
        {x.tieuDe && <b>{x.tieuDe}: </b>}
        {x.noiDung}
      </span>
    </li>
  );
}

// duLieu: { MA: dong tin hieu rut gon } (khach chi co truong cong khai: gia, kijun, can bang, nganh...); laThanhVien: da duoc duyet -> co tin hieu / cat lo / chot loi he thong.
export default function DanhGiaDanhMuc({ duLieu, ngay = "", gocNganh = {}, laThanhVien = false }) {
  const [ds, setDs] = useState([moi()]);
  const [von, setVon] = useState({ tienMat: "", no: "", laiSuat: "", canhBao: "35", giaiChap: "30" });
  const [san, setSan] = useState(false);
  const [dan, setDan] = useState(false);
  const [vanBan, setVanBan] = useState("");
  const [thongBao, setThongBao] = useState("");
  const [lichSu, setLichSu] = useState({ khoa: "", du: null, dangTai: false, loi: "" });
  const [anMa, setAnMa] = useState(false);

  // doc danh muc da luu tren MAY nay (khong gui len may chu)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const j = JSON.parse(localStorage.getItem(KHOA_LUU) || "null");
        const dsLuu = Array.isArray(j) ? j : j?.ds;
        if (Array.isArray(dsLuu) && dsLuu.length) setDs(dsLuu.map((x) => moi(x)));
        if (j && !Array.isArray(j) && j.von) setVon((v) => ({ ...v, ...j.von }));
      } catch {}
      setSan(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!san) return;
    try {
      localStorage.setItem(KHOA_LUU, JSON.stringify({ ds: ds.filter((x) => x.ma || x.kl || x.giaVon).map(({ ma, kl, giaVon }) => ({ ma, kl, giaVon })), von }));
    } catch {}
  }, [ds, von, san]);

  const vitri = useMemo(
    () =>
      ds
        .map((x) => ({ ma: x.ma.trim().toUpperCase(), kl: so(x.kl), giaVon: so(x.giaVon) }))
        .filter((x) => /^[A-Z0-9]{2,12}$/.test(x.ma) && x.kl > 0)
        .map((x) => ({ ...x, giaVon: x.giaVon > 0 ? x.giaVon : null })),
    [ds]
  );
  const khoaMa = useMemo(() => [...new Set(vitri.map((x) => x.ma))].sort().join(","), [vitri]);

  // LICH SU GIA 1 NAM (1 lan goi cho ca danh muc), cho nguoi dung go xong 0,7 giay moi tai
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

  const trieu = (x) => (so(x) > 0 ? so(x) * 1e6 : 0);
  const pb = useMemo(
    () => (vitri.length ? danhGiaDanhMuc(vitri, theoMa, { tienMat: trieu(von.tienMat), no: trieu(von.no), laiSuat: so(von.laiSuat), nguong: { canhBao: so(von.canhBao), giaiChap: so(von.giaiChap) }, gocNganh }) : null),
    [vitri, theoMa, von, gocNganh]
  );
  const rr = useMemo(() => {
    const du = lichSu.du;
    if (!pb || !du?.ngay || lichSu.khoa !== khoaMa) return null;
    const giaTri = {};
    for (const h of pb.hang) if (h.giaTri > 0) giaTri[h.ma] = (giaTri[h.ma] ?? 0) + h.giaTri;
    const gia = Object.fromEntries(Object.entries(du.ma).map(([m, x]) => [m, x.c]));
    const gtgd = Object.fromEntries(Object.entries(du.ma).map(([m, x]) => [m, x.gtgd20]));
    return phanTichRuiRo({ ngay: du.ngay, vni: du.vni, gia, giaTri, gtgd, tienMat: pb.taiSan.tienMat, no: pb.taiSan.no, nguongCB: pb.nguong.canhBao, nguongGC: pb.nguong.giaiChap });
  }, [pb, lichSu, khoaMa]);
  const suc = useMemo(() => chamDiemSucKhoe(pb, rr), [pb, rr]);
  const nxRR = useMemo(() => nhanXetRuiRo(rr, pb), [rr, pb]);
  const baoCao = useMemo(() => {
    if (!pb) return [];
    const tuPb = pb.nhanXet.map((x, k) => ({ muc: x.muc, uuTien: 3 + k * 0.1, tieuDe: null, noiDung: x.nhan }));
    return [...nxRR, ...tuPb].sort((a, b) => a.muc - b.muc || a.uuTien - b.uuTien);
  }, [pb, nxRR]);
  const theoMaRR = useMemo(() => Object.fromEntries((rr?.ma ?? []).map((x) => [x.ma, x])), [rr]);
  const thanhKhoanMa = useMemo(() => Object.fromEntries((rr?.thanhKhoan?.ds ?? []).map((x) => [x.ma, x.soPhien])), [rr]);
  const dsMa = useMemo(() => Object.keys(duLieu).sort(), [duLieu]);

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

  const o = "px-2.5 py-1.5 rounded-lg text-sm border w-full";
  const oStyle = { borderColor: VIEN, background: "transparent", color: TEXT, ...sans };
  const nutPhu = "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold";

  return (
    <div>
      {/* NHAP DANH MUC */}
      <Khoi
        tieuDe="1. Danh mục của bạn"
        phai={<span className="text-[11px]" style={{ color: MUTED }}>Lưu ngay trên máy bạn, không gửi lên máy chủ</span>}
      >
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

        <details className="mt-4">
          <summary className="text-sm cursor-pointer select-none" style={{ ...sans, fontWeight: 700 }}>Vốn & margin (tùy chọn)</summary>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
            {[
              ["tienMat", "Tiền mặt còn lại (triệu đồng)", "50"],
              ["no", "Dư nợ margin (triệu đồng)", "0"],
              ["laiSuat", "Lãi suất margin (%/năm)", "12"],
              ["canhBao", "Ngưỡng cảnh báo ký quỹ (%)", "35"],
              ["giaiChap", "Ngưỡng xử lý / giải chấp (%)", "30"],
            ].map(([k, nhan, ph]) => (
              <label key={k} className="block text-[11px]" style={{ color: MUTED }}>
                {nhan}
                <input value={von[k]} onChange={(e) => setVon((v) => ({ ...v, [k]: e.target.value.replace(/[^0-9.,]/g, "") }))} inputMode="decimal" placeholder={ph} className={`${o} mt-1`} style={oStyle} />
              </label>
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: MUTED }}>Tỷ lệ ký quỹ = (tài sản − nợ) / tài sản. Ngưỡng cảnh báo / xử lý mỗi công ty chứng khoán một kiểu (thường 30–40%) — sửa theo CTCK của bạn. Web coi mọi mã trong danh mục đều được vay.</p>
        </details>
      </Khoi>

      {!pb && <p className="text-sm mb-6" style={{ color: MUTED }}>Nhập ít nhất một mã và số lượng (hoặc bấm “Thử với danh mục mẫu”) để xem đánh giá.</p>}

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
                <XuatAnh
                  kieu="nho"
                  nhan="Tạo ảnh chia sẻ"
                  tieuDe="Đánh giá danh mục"
                  tenFile="CloudStock-danh-gia-danh-muc.png"
                  rong={RONG_THE_DANH_GIA}
                  the={<TheDanhGiaDanhMuc suc={suc} rr={rr} pb={pb} nhanXet={nxRR} anMa={anMa} ngay={ngay} />}
                />
              </span>
            }
          >
            <div className="grid gap-5 lg:grid-cols-[230px_1fr_1.4fr] items-start">
              <div className="text-center">
                <DongHoDiem diem={suc?.diem} xepLoai={suc?.xepLoai} size={210} />
                <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                  {lichSu.dangTai ? "Đang tải lịch sử giá để tính rủi ro…" : suc?.dayDu ? "Tính trên 1 năm dữ liệu giá" : lichSu.loi ? `Chưa tải được lịch sử giá (${lichSu.loi}) — điểm tạm tính` : "Điểm tạm tính"}
                </p>
              </div>
              <div>
                <TruDiem ten="Đa dạng hóa" v={suc?.tru.daDang ?? 0} moTa="Số khoản đầu tư độc lập thật (theo tương quan), mức tập trung rủi ro vào 1 mã, tập trung ngành" />
                <TruDiem ten="Rủi ro" v={suc?.tru.ruiRo ?? 0} moTa="Biến động của danh mục so với VN-Index, độ dày đệm margin, đòn bẩy" />
                <TruDiem ten="Xu hướng" v={suc?.tru.xuHuong ?? 0} moTa="Tỷ trọng giá trị nằm ở các mã trên Kijun và chưa có tín hiệu bán" />
                <TruDiem ten="Thanh khoản" v={suc?.tru.thanhKhoan ?? 0} moTa="Tỷ trọng giá trị có thể bán hết trong 1 phiên (20% thanh khoản bình quân)" />
              </div>
              <div>
                <h3 className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>Điều quan trọng nhất</h3>
                <ul className="grid gap-2.5">
                  {baoCao.slice(0, 3).map((x, k) => <NhanXet key={k} x={x} />)}
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

          {/* 4. RUI RO */}
          {rr?.dsMa?.length > 0 && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <The nhan="Biến động năm" phu={`VN-Index ${Math.round(rr.volV)}%`} mau={rr.volP > rr.volV * 1.3 ? VANG : TEXT}>{Math.round(rr.volP)}%</The>
                <The nhan="Beta" phu="VN-Index −10% → danh mục ≈" mau={rr.betaP > 1.3 ? VANG : TEXT}>
                  {rr.betaP.toFixed(2).replace(".", ",")} <span className="text-sm" style={{ color: MUTED }}>({p1(-rr.betaP * 10)}%)</span>
                </The>
                <The nhan="Khoản đầu tư độc lập" phu={`từ ${rr.ma.length} mã (tương quan TB ${rr.tqTrungBinh != null ? rr.tqTrungBinh.toFixed(2).replace(".", ",") : "—"})`} mau={rr.soCuocDocLap < 1.4 ? DO : rr.soCuocDocLap < 1.7 ? VANG : TEXT}>
                  ≈ {p1(rr.soCuocDocLap)}
                </The>
                <The nhan="Một phiên xấu (VaR 95%)" phu={`≈ ${tien(rr.var95Dong)} · tệ nhất ${p1(rr.phienXauNhat.pct)}%`}>−{p1(rr.var95)}%</The>
                <The nhan="Sụt giảm tối đa 1 năm" phu={`VN-Index −${p1(Math.abs(rr.ddV))}%`} mau={Math.abs(rr.ddP.pct) > Math.abs(rr.ddV) * 1.3 ? VANG : TEXT}>−{p1(Math.abs(rr.ddP.pct))}%</The>
              </div>

                <Khoi tieuDe="Nếu cầm danh mục này 1 năm qua" className="mb-6" phu={`Tỷ trọng hiện tại giữ nguyên, ${rr.soPhien} phiên từ ${rr.tuNgay.split("-").reverse().join("/")}. Quá khứ, không phải dự báo.`}>
                  <BieuDoHieuSuat chuoi={rr.chuoi} />
                </Khoi>
                <Khoi tieuDe="Kiểm tra sức chịu đựng" className="mb-6" phu="Danh mục, tài sản ròng và tỷ lệ ký quỹ sẽ ra sao nếu thị trường giảm.">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" style={sans}>
                      <thead>
                        <tr className="text-left text-xs" style={{ color: MUTED }}>
                          <th className="py-1.5 pr-2 font-normal">Kịch bản</th>
                          <th className="py-1.5 px-2 font-normal text-right">Danh mục</th>
                          <th className="py-1.5 px-2 font-normal text-right">Tài sản ròng</th>
                          {pb.margin && <th className="py-1.5 pl-2 font-normal text-right">Ký quỹ</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {rr.kichBan.map((k) => (
                          <tr key={k.ten} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                            <td className="py-2 pr-2">
                              {k.ten}
                              <div className="text-[11px]" style={{ color: MUTED }}>{k.ghiChu}</div>
                            </td>
                            <td className="py-2 px-2 text-right" style={{ color: mauLai(k.portPct) }}>{p1(k.portPct)}%</td>
                            <td className="py-2 px-2 text-right">
                              {k.navPct != null ? `${p1(k.navPct)}%` : "—"}
                              <div className="text-[11px]" style={{ color: MUTED }}>{tien(k.doiGiaTri)}</div>
                            </td>
                            {pb.margin && (
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
                </Khoi>
              <div className="grid gap-4 lg:grid-cols-2 mb-6">
                <Khoi tieuDe="Vốn bỏ vào vs rủi ro gánh" className="" phu="Mã có thanh tím dài hơn thanh cam là mã đang gánh rủi ro nhiều hơn phần vốn của nó.">
                  <VonVaRuiRo ma={rr.ma} />
                </Khoi>
                <Khoi tieuDe="Các mã có thực sự khác nhau?" className="" phu="Tương quan lợi suất ngày trong 1 năm (tối đa 12 mã lớn nhất).">
                  {rr.ma.length >= 2 ? <MaTranTuongQuan rr={rr} /> : <p className="text-sm" style={{ color: MUTED }}>Cần ít nhất 2 mã.</p>}
                </Khoi>
              </div>
            </>
          )}
          {rr?.lichSuNgan?.length > 0 && <p className="text-xs mb-4" style={{ color: VANG }}>Chưa đủ 120 phiên lịch sử nên chưa tính rủi ro cho: {rr.lichSuNgan.join(", ")}.</p>}

          {/* 5. BAO CAO DAY DU */}
          <Khoi tieuDe="Báo cáo chi tiết">
            <ul className="grid gap-2.5">
              {baoCao.map((x, k) => <NhanXet key={k} x={x} />)}
            </ul>
            {pb.thieu.length > 0 && <p className="text-xs mt-3" style={{ color: VANG }}>Chưa có dữ liệu giá cho: {pb.thieu.join(", ")} — không tính vào tỷ trọng.</p>}
          </Khoi>

          {/* 6. PHAN BO */}
          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <Khoi tieuDe="Theo ngành" className="" phu={pb.gocNganhLon ? `Ngành lớn nhất đang ở góc ${{ Leading: "Dẫn dắt", Improving: "Cải thiện", Weakening: "Yếu dần", Lagging: "Tụt hậu" }[pb.gocNganhLon]} trên RRG ngành.` : undefined}>
              {pb.nganh.map((n) => <Thanh key={n.ten} ten={n.ten} v={n.tyTrong} />)}
            </Khoi>
            <Khoi tieuDe="Theo mã" className="">
              {[...pb.hang].filter((h) => h.tyTrong != null).sort((a, b) => b.tyTrong - a.tyTrong).map((h) => <Thanh key={h.ma} ten={h.ma} v={h.tyTrong} />)}
            </Khoi>
          </div>

          {/* 7. CHI TIET TUNG MA */}
          <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <div className="overflow-x-auto bang-cuon">
              <table className="w-full text-sm" style={sans}>
                <thead>
                  <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED }}>
                    {["Mã", "Số lượng", "Giá vốn", "Giá", "Lãi/lỗ", "Giá trị", "Tỷ trọng", "Rủi ro gánh", "Biến động năm", "Beta", "Phiên để bán hết", "Tín hiệu hệ thống", "Nhận xét"].map((t, i) => (
                      <th key={t} className={`py-3 px-3 font-normal whitespace-nowrap ${i > 0 && i < 11 ? "text-right" : ""}`}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pb.hang.map((h, i) => {
                    const r = theoMaRR[h.ma];
                    const tk = thanhKhoanMa[h.ma];
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

          {!laThanhVien && (
            <div className="rounded-2xl border p-5 mb-6 flex flex-wrap items-center justify-between gap-4" style={{ borderColor: PRIMARY, background: "color-mix(in srgb, #6C5CE7 10%, var(--card))" }}>
              <div className="max-w-xl">
                <p className="text-base mb-1" style={{ ...sans, fontWeight: 800 }}>Xem thêm tín hiệu hệ thống cho từng mã trong danh mục</p>
                <p className="text-sm" style={{ color: MUTED }}>Thành viên (miễn phí) thấy tín hiệu MUA / NẮM GIỮ / BÁN, mốc cắt lỗ và chốt lời của từng mã ngay trong bảng đánh giá, kèm cảnh báo khi mã sắp chạm cắt lỗ.</p>
              </div>
              <TaiKhoanNut nhan="Đăng ký miễn phí" />
            </div>
          )}
        </>
      )}

      <details className="text-[11px] mb-2" style={{ color: MUTED }}>
        <summary className="cursor-pointer select-none" style={{ fontWeight: 700 }}>Cách tính & giới hạn</summary>
        <div className="mt-2 grid gap-1.5 leading-relaxed">
          <p>Dữ liệu: giá đóng cửa đã điều chỉnh cổ tức (DNSE) khoảng 1 năm gần nhất, tỷ trọng hiện tại giữ nguyên suốt cả năm. Mã có dưới 120 phiên lịch sử không được tính rủi ro.</p>
          <p>Biến động năm = độ lệch chuẩn lợi suất ngày × √250. Beta so với VN-Index. “Rủi ro gánh” = phần đóng góp vào phương sai danh mục (risk contribution). “Khoản đầu tư độc lập” = bình phương hệ số đa dạng hóa (tổng biến động từng mã theo tỷ trọng / biến động danh mục) — xấp xỉ số nguồn rủi ro độc lập.</p>
          <p>Một phiên xấu (VaR 95%) = mức lỗ của 5% phiên tệ nhất trong 1 năm. Kịch bản VN-Index −5/−10/−20% ước theo beta (tuyến tính); kịch bản “đợt giảm mạnh nhất” dùng giá thật của các mã trong 20 phiên VN-Index giảm sâu nhất của năm. Phiên để bán hết = giá trị vị thế / (20% giá trị giao dịch bình quân 20 phiên).</p>
          <p>Điểm sức khỏe = 4 trụ × 25 với ngưỡng do web tự đặt, chưa kiểm chứng bằng backtest. Lãi/lỗ chưa trừ phí và thuế. Chỉ để tham khảo, không phải khuyến nghị đầu tư.</p>
        </div>
      </details>
    </div>
  );
}
