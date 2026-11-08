"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Search, ShieldAlert, TriangleAlert } from "lucide-react";
import { HangLocNhanh } from "@/components/boLocChung";
import NutThamGia from "@/components/NutThamGia";
import NutLuuDanhSach from "@/components/NutLuuDanhSach";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";
import { napDanhSach, useDanhSachTheoDoi } from "@/lib/danhSachTheoDoiClient";
import { nhe } from "@/components/dungChung";
import GiaiThichThem from "@/components/GiaiThichThem";
import { soVN, pctVN } from "@/lib/soVN";
import { HAN_CHO_THANG, lichGiaiNgan } from "@/lib/phuongPhapDaiHan";
import { CACH_BAN, LOI_VE_TINH, DINH_GIA, GIAI_DOAN } from "@/lib/phuongPhapDaiHanKetQua";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const PRIMARY = "#8B5CF6";
const sans = { fontFamily: "var(--font-chu)" };
const MAU = { xanh: XANH, do: DO, vang: VANG, mo: MUTED, chu: TEXT };

const Chip = ({ mau, children, title }) => (
  <span title={title} className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap" style={{ background: nhe(mau, 14), color: mau, border: `1px solid ${nhe(mau, 30)}`, ...sans }}>
    {children}
  </span>
);
const The = ({ tieuDe, children, className = "" }) => (
  <section className={`rounded-2xl border p-5 mb-6 ${className}`} style={{ borderColor: VIEN, background: NEN_CARD }}>
    {tieuDe && <h2 className="text-lg mb-3" style={{ ...sans, fontWeight: 700 }}>{tieuDe}</h2>}
    {children}
  </section>
);
const mauLai = (v) => (v > 0 ? XANH : v < 0 ? DO : TEXT);

function DongMa({ m, pp, mo, onMo, locXuHuong, coDangNhap, moDangNhap }) {
  const l = lichGiaiNgan({ gia: m.gia, sma50: m.sma50, sma200: m.sma200, ggTop: m.ggTop, locXuHuong });
  const dinhGia = m.dinhGia;
  const d1 = l.dot[0];
  const d2 = l.dot[1];
  return (
    <>
      <tr className="border-b cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ borderColor: VIEN }} onClick={onMo} aria-expanded={mo}>
        <td className="px-3 py-2.5 font-bold whitespace-nowrap" style={sans}>
          <Link href={`/ma/${m.ma}`} onClick={(e) => e.stopPropagation()} className="underline decoration-dotted underline-offset-2" style={{ color: "var(--tim-chu)" }}>{m.ma}</Link>
          <span className="ml-1.5 align-middle" onClick={(e) => e.stopPropagation()}><NutThamGia ma={m.ma} soNguoiThamGia={0} daThamGia={false} coDangNhap={coDangNhap} moChuaDangNhap={moDangNhap} /></span>
          {m.canhBao?.length > 0 && <TriangleAlert size={13} className="inline-block ml-1 align-text-top" style={{ color: VANG }} aria-label="Có cảnh báo, bấm để xem" />}
          <div className="text-[11px] font-normal" style={{ color: MUTED }}>{m.ten}</div>
        </td>
        <td className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>{m.nganhNhan}</td>
        <td className="px-3 py-2.5 text-right whitespace-nowrap" style={sans}>
          <b>{soVN(m.gia, 2)}</b>
          {m.doi != null && <div className="text-[11px]" style={{ color: mauLai(m.doi) }}>{pctVN(m.doi, 2)}</div>}
        </td>
        <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.vonHoaTy, 0)}</td>
        <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.roe, 1)}%</td>
        <td className="px-3 py-2.5 text-right" style={{ ...sans, color: mauLai(m.lnTang) }}>{m.lnTang != null ? pctVN(m.lnTang, 0) : "—"}</td>
        <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.pe, 1)}</td>
        {pp === "coTuc" && <td className="px-3 py-2.5 text-right font-bold" style={{ ...sans, color: XANH }}>{soVN(m.tySuatCoTuc, 1)}%</td>}
        {pp === "graham" && <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.peXpb, 1)}</td>}
        {pp === "itBienDong" && <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.doLech, 1)}%</td>}
        <td className="px-3 py-2.5 text-right whitespace-nowrap" style={sans}>
          <b>{soVN(m.giaHopLy, 2)}</b>
          <div className="mt-0.5"><Chip mau={MAU[dinhGia.mau]} title={m.r != null ? `Giá bằng ${soVN(m.r * 100, 0)}% giá hợp lý` : ""}>{dinhGia.nhan}</Chip></div>
        </td>
        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={sans}>
          {l.quaXuHuong ? (
            <div style={{ color: MUTED }}>Đợt 1: {soVN(d1?.gia, 2)} · Đợt 2: ≤ {soVN(d2?.gia, 2)}</div>
          ) : (
            <div style={{ color: MUTED }}>Chờ đóng cửa trên {soVN(l.choGiaVuot, 2)}</div>
          )}
          <div className="mt-1"><Chip mau={m.xuHuongTang ? XANH : VANG} title="So với đường cân bằng dài hạn">{m.xuHuongTang ? "Xu hướng tăng" : "Xu hướng giảm"}</Chip></div>
        </td>
        <td className="px-2 py-2.5"><ChevronDown size={16} style={{ color: MUTED, transform: mo ? "rotate(180deg)" : undefined, transition: "transform .15s" }} aria-hidden="true" /></td>
      </tr>
      {mo && (
        <tr style={{ background: "var(--nen)" }}>
          <td colSpan={13} className="px-3 py-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs mb-2" style={{ color: MUTED, ...sans }}>
                  <b style={{ color: TEXT }}>Lịch giải ngân 5 đợt (mỗi đợt 20% vốn dự định)</b> · hiệu lực {HAN_CHO_THANG} tháng, hết hạn thì mua theo thị trường phần chưa khớp
                </p>
                <table className="w-full text-xs" style={sans}>
                  <thead>
                    <tr className="text-left" style={{ color: MUTED }}><th className="py-1 pr-2">Đợt</th><th className="py-1 pr-2">Điều kiện</th><th className="py-1 pr-2 text-right">Mức giá</th><th className="py-1 text-right">Khớp (test)</th></tr>
                  </thead>
                  <tbody>
                    {l.dot.map((d) => (
                      <tr key={d.so} className="border-t" style={{ borderColor: VIEN }}>
                        <td className="py-1 pr-2 font-bold">{d.so}</td>
                        <td className="py-1 pr-2">{d.nhan}<div style={{ color: MUTED }}>{d.ghiChu}</div></td>
                        <td className="py-1 pr-2 text-right font-bold">{d.gia != null ? `≤ ${soVN(d.gia, 2)}` : "—"}</td>
                        <td className="py-1 text-right" style={{ color: MUTED }}>{d.khop != null ? `${d.khop}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs leading-relaxed" style={{ color: TEXT, ...sans }}>
                <p className="mb-1"><b>Giá hợp lý {soVN(m.giaHopLy, 2)}</b> (trung vị 4 cách định giá) · giá hiện tại bằng <b>{m.r != null ? `${soVN(m.r * 100, 0)}%` : "—"}</b> giá hợp lý. Vùng chiết khấu đáng quan tâm: giá {soVN(m.giaHopLy * 0.5, 2)} – {soVN(m.giaHopLy * 0.8, 2)} (chiết khấu 20–50%).</p>
                <p className="mb-1" style={{ color: MUTED }}>Mốc tham chiếu: SMA50 {soVN(m.sma50, 2)} · SMA200 {soVN(m.sma200, 2)} · đường cân bằng dài hạn {soVN(m.ggTop, 2)} · cách đỉnh 1 năm {m.cachDinh != null ? pctVN(m.cachDinh, 0) : "—"}.</p>
                {!m.xuHuongTang && !locXuHuong && <p className="mb-1" style={{ color: VANG }}>Giá đang dưới đường cân bằng dài hạn (xu hướng giảm): chia nhỏ vốn theo từng đợt, đừng dồn một lần.</p>}
                {m.vayVcsh != null && <p className="mb-1" style={{ color: MUTED }}>Nợ vay / vốn chủ: {soVN(m.vayVcsh, 2)} lần.</p>}
                {m.canhBao?.map((c, i) => (
                  <p key={i} className="flex gap-1.5 mt-1" style={{ color: VANG }}><TriangleAlert size={13} className="shrink-0 mt-0.5" aria-hidden="true" />{c}</p>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// BO LOC + SAP XEP (04/11/2026): tim theo ma / ten, nganh, bo loc nhanh (co so ma), nguong ROE / P/E; bam tieu de cot de sap xep; luu ca ket qua vao danh sach theo doi.
const NHANH = [
  { khoa: "re", nhan: "Đang rẻ", moTa: "Giá không quá 80% giá hợp lý (không tính mã 'rất rẻ - kiểm tra')", f: (m) => m.dinhGia?.khoa === "re" },
  { khoa: "tang", nhan: "Xu hướng tăng", moTa: "Giá trên đường cân bằng dài hạn", f: (m) => !!m.xuHuongTang },
  { khoa: "sach", nhan: "Không cảnh báo", moTa: "Không có cảnh báo rủi ro đi kèm", f: (m) => !(m.canhBao?.length > 0) },
  { khoa: "lon", nhan: "Vốn hóa ≥ 10.000 tỷ", moTa: "Doanh nghiệp lớn", f: (m) => m.vonHoaTy >= 10000 },
  { khoa: "roe", nhan: "ROE ≥ 20%", moTa: "Hiệu quả sinh lời cao", f: (m) => m.roe >= 20 },
];
// bo dau + chu hoa: go "hoa phat" van ra "Hòa Phát"
const boDau = (x) => String(x ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toUpperCase();
const COT_SX = (pp) => [
  ["ma", "Mã", (m) => m.ma, false],
  ["nganh", "Ngành", (m) => m.nganhNhan, false],
  ["gia", "Giá", (m) => m.gia, true],
  ["von", "Vốn hóa (tỷ)", (m) => m.vonHoaTy, true],
  ["roe", "ROE", (m) => m.roe, true],
  ["ln", "LN 12T", (m) => m.lnTang, true],
  ["pe", "P/E", (m) => m.pe, true],
  ...(pp === "coTuc" ? [["cotuc", "Cổ tức", (m) => m.tySuatCoTuc, true]] : pp === "graham" ? [["graham", "P/E×P/B", (m) => m.peXpb, true]] : pp === "itBienDong" ? [["bd", "Biến động/năm", (m) => m.doLech, true]] : []),
  ["hopLy", "Giá hợp lý", (m) => m.r, true],
];

function BangMa({ pp, ds, locXuHuong }) {
  const [mo, setMo] = useState(null);
  const [tim, setTim] = useState("");
  const [nganh, setNganh] = useState("");
  const [nhanh, setNhanh] = useState("");
  const [roeTu, setRoeTu] = useState("");
  const [peDen, setPeDen] = useState("");
  const [sx, setSx] = useState({ khoa: null, chieu: "desc" });
  const [moTK, setMoTK] = useState(false);
  const kho = useDanhSachTheoDoi();
  const coDangNhap = kho.daTai && kho.danhSach != null;
  const cot = COT_SX(pp);
  const dsNganh = useMemo(() => [...new Set(ds.map((m) => m.nganhNhan).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")), [ds]);

  const coSo = useMemo(() => {
    const q = boDau(tim.trim());
    return ds.filter((m) => (!q || boDau(m.ma).includes(q) || boDau(m.ten ?? "").includes(q)) && (!nganh || m.nganhNhan === nganh));
  }, [ds, tim, nganh]);
  const daLoc = useMemo(() => {
    const nh = NHANH.find((x) => x.khoa === nhanh);
    const r = roeTu === "" ? null : Number(roeTu);
    const pe = peDen === "" ? null : Number(peDen);
    let a = coSo.filter((m) => (!nh || nh.f(m)) && (r == null || m.roe >= r) && (pe == null || (m.pe > 0 && m.pe <= pe)));
    const c = COT_SX(pp).find((x) => x[0] === sx.khoa);
    if (c) {
      a = [...a].sort((x, y) => {
        const p = c[2](x);
        const q = c[2](y);
        if (p == null || q == null) return p == null && q == null ? 0 : p == null ? 1 : -1;
        const so = typeof p === "string" ? p.localeCompare(q, "vi") : p - q;
        return sx.chieu === "asc" ? so : -so;
      });
    }
    return a;
  }, [coSo, nhanh, roeTu, peDen, sx, pp]);

  if (!ds.length) return <p className="text-sm" style={{ color: MUTED }}>Hiện chưa có mã nào đạt toàn bộ điều kiện.</p>;
  const doiSx = (khoa, soHoc) => setSx((c) => (c.khoa === khoa ? { khoa, chieu: c.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: soHoc ? "desc" : "asc" }));
  const dsNhanh = [
    { khoa: "", nhan: "Tất cả", dem: coSo.length, dang: !nhanh },
    ...NHANH.map((x) => ({ khoa: x.khoa, nhan: x.nhan, moTa: x.moTa, dem: coSo.filter(x.f).length, dang: nhanh === x.khoa })),
  ];
  const dangLoc = tim || nganh || nhanh || roeTu !== "" || peDen !== "";
  const o = "px-3 py-2 rounded-lg text-sm border";
  const oStyle = { borderColor: VIEN, background: NEN_CARD, color: TEXT, ...sans };
  return (
    <div>
      <HangLocNhanh ds={dsNhanh} onChon={(m) => setNhanh(m.khoa && nhanh !== m.khoa ? m.khoa : "")} />
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} aria-hidden="true" />
          <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm mã hoặc tên công ty…" aria-label="Tìm mã hoặc tên công ty" className={`${o} w-full pl-9`} style={oStyle} />
        </div>
        <select value={nganh} onChange={(e) => setNganh(e.target.value)} aria-label="Ngành" className={o} style={{ ...oStyle, color: nganh ? TEXT : MUTED }}>
          <option value="">Mọi ngành</option>
          {dsNganh.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm" style={{ color: MUTED }}>
          ROE ≥
          <input type="number" inputMode="decimal" value={roeTu} onChange={(e) => setRoeTu(e.target.value)} placeholder="—" aria-label="ROE tối thiểu" className="w-16 px-2 py-2 rounded-lg border text-sm text-center" style={oStyle} />%
        </label>
        <label className="flex items-center gap-1.5 text-sm" style={{ color: MUTED }}>
          P/E ≤
          <input type="number" inputMode="decimal" value={peDen} onChange={(e) => setPeDen(e.target.value)} placeholder="—" aria-label="P/E tối đa" className="w-16 px-2 py-2 rounded-lg border text-sm text-center" style={oStyle} />
        </label>
        {dangLoc && (
          <button type="button" onClick={() => { setTim(""); setNganh(""); setNhanh(""); setRoeTu(""); setPeDen(""); }} className="text-xs px-3 py-2 rounded-lg border" style={{ borderColor: VIEN, color: "var(--tim-chu)", ...sans }}>
            Xóa lọc
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs" style={{ color: MUTED }}>
        <span><b style={{ color: TEXT }}>{daLoc.length}</b> / {ds.length} mã · bấm tiêu đề cột để sắp xếp, bấm dòng để xem lịch giải ngân</span>
        <NutLuuDanhSach dsMa={daLoc.map((m) => m.ma)} coDangNhap={coDangNhap} moChuaDangNhap={() => setMoTK(true)} />
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: VIEN }}>
        <div className="overflow-auto bang-cuon max-h-[calc(100vh-150px)]">
          <table className="w-full text-sm" style={sans}>
            <thead>
              <tr className="text-left" style={{ color: MUTED }}>
                {cot.map(([khoa, nhan, , soHoc]) => (
                  <th key={khoa} className={`sticky top-0 z-[2] border-b px-3 py-2 cursor-pointer select-none whitespace-nowrap hover:text-[color:var(--chu)] ${soHoc ? "text-right" : ""}`} style={{ background: "var(--nen)", borderColor: VIEN }} onClick={() => doiSx(khoa, soHoc)}>
                    <span className="inline-flex items-center gap-1">
                      {nhan}
                      {sx.khoa === khoa ? sx.chieu === "desc" ? <ArrowDown size={12} color={PRIMARY} /> : <ArrowUp size={12} color={PRIMARY} /> : <ArrowUpDown size={12} opacity={0.35} />}
                    </span>
                  </th>
                ))}
                <th className="sticky top-0 z-[2] border-b px-3 py-2" style={{ background: "var(--nen)", borderColor: VIEN }}>Giải ngân</th>
                <th className="sticky top-0 z-[2] border-b w-6" style={{ background: "var(--nen)", borderColor: VIEN }} />
              </tr>
            </thead>
            <tbody>
              {daLoc.map((m) => <DongMa key={m.ma} m={m} pp={pp} locXuHuong={locXuHuong} mo={mo === m.ma} onMo={() => setMo(mo === m.ma ? null : m.ma)} coDangNhap={coDangNhap} moDangNhap={() => setMoTK(true)} />)}
              {daLoc.length === 0 && (
                <tr><td colSpan={cot.length + 2} className="py-8 text-center text-sm" style={{ color: MUTED }}>Không có mã nào khớp bộ lọc.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ModalTaiKhoan open={moTK} onClose={() => setMoTK(false)} onThanhCong={() => napDanhSach()} tieuDeGoiY="Đăng ký hoặc đăng nhập miễn phí để lưu mã vào danh sách theo dõi." />
    </div>
  );
}

function KhungLoiVeTinh({ khung }) {
  const dong = (ds, nhan, mau) => (
    <div className="mb-4">
      <p className="text-sm mb-2" style={{ ...sans, fontWeight: 700, color: mau }}>{nhan}</p>
      {ds.length === 0 ? <p className="text-xs" style={{ color: MUTED }}>Chưa có mã đạt điều kiện.</p> : (
        <div className="flex flex-wrap gap-2">
          {ds.map((m) => (
            <Link key={m.ma} href={`/ma/${m.ma}`} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: VIEN, background: "var(--nen)", ...sans }}>
              <b style={{ color: "var(--tim-chu)" }}>{m.ma}</b> <span style={{ color: MUTED }}>{m.nganhNhan}</span>
              <div className="mt-0.5"><b>{soVN(m.ty, 1)}%</b> danh mục · {m.xuHuongTang ? <span style={{ color: XANH }}>xu hướng tăng</span> : <span style={{ color: VANG }}>xu hướng giảm</span>}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <The tieuDe="Mô hình Lõi & Vệ tinh (60–70% / 30–40%)">
      <p className="text-sm mb-4" style={{ color: MUTED }}>
        Chia danh mục thành phần lõi (công nghệ + ngân hàng, nhóm tăng trưởng ổn định nhất) và phần vệ tinh (các ngành khác, tối đa 2 mã mỗi ngành) để phân tán rủi ro. Mã trong mô hình lấy từ các phương pháp Buffett và Cổ tức ở trên, không chọn theo tên.
      </p>
      {dong(khung.loi, `Lõi — khoảng 65% danh mục (${khung.loi.length} mã)`, PRIMARY)}
      {dong(khung.veTinh, `Vệ tinh — khoảng 35% danh mục (${khung.veTinh.length} mã)`, TEXT)}
      <GiaiThichThem nhanMo="Kết quả kiểm tra mô hình">
        Test mô hình lõi & vệ tinh (FPT + 7 ngân hàng lớn + bán lẻ, BĐS khu công nghiệp) từ các mốc bắt đầu 2014–2025: trung bình {LOI_VE_TINH.cagrTB}%/năm so với khoảng {LOI_VE_TINH.vniTB}% của VN-Index, hơn VN-Index ở {LOI_VE_TINH.homVni}. Nhưng {LOI_VE_TINH.gayDay} Danh sách mã trong test được chọn sau nên số liệu bị thổi phồng. {LOI_VE_TINH.canhBao}
      </GiaiThichThem>
    </The>
  );
}

export default function PhuongPhapDaiHan({ du }) {
  const khoa = Object.keys(du.phuongPhap);
  const [tab, setTab] = useState("buffett");
  const [locXuHuong, setLocXuHuong] = useState(false); // tuy chon cua phuong phap Buffett: chi giai ngan khi gia tren duong can bang dai han (mac dinh tat)
  const hienTai = du.phuongPhap[tab] ?? du.phuongPhap[khoa[0]];
  const meta = hienTai.meta;
  return (
    <div style={{ color: TEXT }}>
      <div className="rounded-xl border p-4 mb-6 flex gap-3 text-sm" style={{ borderColor: nhe(VANG, 40), background: nhe(VANG, 8), ...sans }}>
        <ShieldAlert size={20} className="shrink-0 mt-0.5" style={{ color: VANG }} aria-hidden="true" />
        <div className="leading-relaxed">
          <p>
            <b>Thông tin tham khảo, không phải khuyến nghị đầu tư.</b> Bộ lọc chỉ nhìn báo cáo tài chính và giá, <b>không phát hiện được rủi ro pháp lý hay tin xấu</b> — hãy tự kiểm tra tin tức trước khi mua.
          </p>
          <GiaiThichThem nhanMo="Giới hạn của kiểm chứng" className="mt-1">
            Các phương pháp được kiểm tra trên dữ liệu {GIAI_DOAN} (khoảng 4,75 năm, một chu kỳ thị trường, chỉ gồm mã còn niêm yết). Kết quả quá khứ không đảm bảo tương lai, và có những năm các phương pháp thua VN-Index rõ rệt.
          </GiaiThichThem>
        </div>
      </div>

      <The tieuDe="Khung đầu tư dài hạn: 4 bước">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm" style={sans}>
          {[
            ["1. Nền: mua đều chỉ số", "Với phần vốn không muốn chọn mã, mua đều VN-Index hoặc ETF mỗi tháng. Kết quả gần bằng thị trường (khoảng 9–10%/năm 2014–2026), không cần theo dõi."],
            ["2. Chọn doanh nghiệp bằng tiêu chí", "Chọn mã từ các bộ lọc Buffett hoặc Cổ tức bên dưới thay vì theo tin đồn. Cầm ít nhất 8–10 mã, mỗi mã tối đa 10–15% danh mục."],
            ["3. Giải ngân chia 5 đợt", "Chia vốn 5 đợt 20%, mỗi đợt một mức giá (xem từng mã). Chờ giá không tăng lợi nhuận, chỉ giúp giá vốn tốt hơn; hết hạn 3 tháng thì mua theo kế hoạch."],
            ["4. Bán khi doanh nghiệp xấu đi", "Không cắt lỗ theo giá. Bán khi lợi nhuận 12 tháng ≤ 0 / giảm mạnh, ROE tụt dưới 12%, hết đạt bộ lọc hoặc có tin pháp lý xấu."],
          ].map(([t, n]) => (
            <div key={t} className="rounded-xl border p-3" style={{ borderColor: VIEN, background: "var(--nen)" }}>
              <p className="mb-1" style={{ fontWeight: 700 }}>{t}</p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{n}</p>
            </div>
          ))}
        </div>
      </The>

      <The tieuDe="Danh sách mã theo phương pháp">
        <div role="tablist" aria-label="Phương pháp" className="flex gap-1 overflow-x-auto mb-4 border-b" style={{ borderColor: VIEN }}>
          {khoa.map((k) => {
            const chon = k === tab;
            return (
              <button key={k} type="button" role="tab" aria-selected={chon} onClick={() => setTab(k)} className="px-3 py-2 text-sm whitespace-nowrap border-b-2" style={{ borderColor: chon ? PRIMARY : "transparent", color: chon ? TEXT : MUTED, fontWeight: chon ? 700 : 500, ...sans }}>
                {du.phuongPhap[k].meta.ten} <span className="text-[11px]" style={{ color: MUTED }}>({du.phuongPhap[k].ds.length})</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm mb-1" style={{ ...sans }}><b>{meta.ten}</b> · <span style={{ color: MUTED }}>{meta.nguoi}</span></p>
        <p className="text-sm mb-3 leading-relaxed" style={{ color: MUTED }}>{meta.moTa}</p>
        <ul className="grid gap-1 mb-3 text-xs sm:grid-cols-2" style={{ color: TEXT, ...sans }}>
          {meta.dieuKien.map((d, i) => <li key={i}>• {d}</li>)}
        </ul>
        {meta.ghiChuXuHuong && (
          <GiaiThichThem nhanMo="Có nên chờ xu hướng giá?" className="mb-3">
            {meta.ghiChuXuHuong}
          </GiaiThichThem>
        )}
        {meta.coLocXuHuong && (
          <label className="flex items-start gap-2 text-xs mb-3 cursor-pointer" style={sans}>
            <input type="checkbox" checked={locXuHuong} onChange={(e) => setLocXuHuong(e.target.checked)} className="mt-0.5" />
            <span>Chỉ giải ngân khi giá đã đóng cửa trên đường cân bằng dài hạn (tránh mã còn đang giảm; mã chưa đạt sẽ hiện mức giá cần vượt)</span>
          </label>
        )}
        <BangMa key={tab} pp={tab} ds={hienTai.ds} locXuHuong={!!meta.coLocXuHuong && locXuHuong} />
        <GiaiThichThem nhanMo="Nguồn số liệu và cách tính giá hợp lý" className="mt-2">
        <p>
          Chỉ số cơ bản theo báo cáo tài chính quý {du.quyBaoCao.split("-").reverse().slice(1).join("/")}; giá {du.coGiaMoi ? "cập nhật theo phiên gần nhất trên web" : `tại ngày ${du.giaDen.split("-").reverse().join("/")}`}. Bấm vào từng dòng để xem lịch giải ngân 5 đợt và giá hợp lý. {DINH_GIA.moTa}
        </p>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {DINH_GIA.nhom.map((n) => <span key={n.nhan}><b style={{ color: TEXT }}>{n.nhan}</b>: {n.ghiChu}</span>)}
        </div>
        <p className="mt-2">{DINH_GIA.ghiChu}</p>
        </GiaiThichThem>
      </The>

      <KhungLoiVeTinh khung={du.khung} />

      <The tieuDe="Khi nào bán cho đúng?">
        <div className="grid gap-3 sm:grid-cols-2 text-sm mb-4" style={sans}>
          {[
            ["Doanh nghiệp xấu đi", "Lợi nhuận 12 tháng ≤ 0, giảm hơn 20%, ROE tụt dưới 12% hoặc mã hết đạt bộ lọc. Trong test, bán theo lý do này hơn việc không bán 2,7% (12 tháng) đến 7,5% (24 tháng)."],
            ["Tin xấu / rủi ro pháp lý", "Điều tra, kiện tụng, vi phạm công bố thông tin… Bộ lọc không tự thấy, nên web có danh sách mã bị đánh dấu rủi ro."],
            ["Định giá quá cao", "Nếu bán theo định giá, hãy bán trễ: khi giá bằng khoảng 1,2 lần giá hợp lý tốt hơn khi vừa chạm giá hợp lý."],
            ["Tỷ trọng một mã quá lớn", "Một mã vượt 25–30% danh mục thì bán bớt về mức này. Giới hạn rủi ro bằng đa dạng hóa (từ 8–10 mã), không bằng cắt lỗ theo giá."],
          ].map(([t, n]) => (
            <div key={t} className="rounded-xl border p-3" style={{ borderColor: VIEN, background: "var(--nen)" }}>
              <p className="mb-1" style={{ fontWeight: 700 }}>{t}</p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{n}</p>
            </div>
          ))}
        </div>
        <p className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>Vì sao không cắt lỗ theo giá?</p>
        <p className="text-sm mb-1" style={{ color: "var(--chu-2)" }}>Thị trường Việt Nam thường điều chỉnh 25–40% rồi hồi phục; bán theo giá làm mất phần lớn lãi.</p>
        <GiaiThichThem nhanMo="Xem kết quả kiểm tra 36 tháng">
        <p className="mb-3">
          Test 36 tháng cho thấy mọi quy tắc bán theo giá (cắt lỗ, trailing stop, thủng SMA200…) làm giảm lãi 9–44 điểm vì bán sớm 60–100% vị thế, đổi lại chỉ cắt được đuôi xấu nhất (−91% xuống −27% đến −43%). {CACH_BAN.ghiChu}
        </p>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: VIEN }}>
          <div className="overflow-x-auto bang-cuon">
            <table className="w-full text-xs" style={sans}>
              <thead><tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, background: "var(--nen)" }}><th className="px-3 py-2">Cách bán</th><th className="px-3 py-2 text-right">Lãi TB sau 36 tháng</th><th className="px-3 py-2 text-right">Vị thế bị bán sớm</th><th className="px-3 py-2 text-right">Mã xấu nhất</th></tr></thead>
              <tbody>
                {CACH_BAN.dong.map((d) => (
                  <tr key={d.ten} className="border-b" style={{ borderColor: VIEN }}>
                    <td className="px-3 py-1.5">{d.ten}</td><td className="px-3 py-1.5 text-right font-bold">{pctVN(d.lai, 1)}</td><td className="px-3 py-1.5 text-right">{d.ban}%</td><td className="px-3 py-1.5 text-right" style={{ color: DO }}>{d.xau}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </GiaiThichThem>
      </The>

      {du.daLoai.length > 0 && (
        <The tieuDe="Mã đã bị loại khỏi danh sách vì rủi ro">
          <ul className="grid gap-2 text-sm" style={sans}>
            {du.daLoai.map((x) => (
              <li key={x.ma} className="flex flex-wrap items-center gap-2">
                <Chip mau={DO}>{x.ma}</Chip>
                <span style={{ color: MUTED }}>{x.lyDo} (đánh dấu {x.ngay.split("-").reverse().join("/")})</span>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-2" style={{ color: MUTED }}>Danh sách do quản trị cập nhật thủ công; hệ thống không tự phát hiện rủi ro pháp lý.</p>
        </The>
      )}
    </div>
  );
}
