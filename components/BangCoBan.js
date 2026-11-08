"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { moCot } from "@/lib/goiCot";
import { SlidersHorizontal } from "lucide-react";
import { soVN } from "@/lib/soVN";
import NutThamGia from "@/components/NutThamGia";
import NutLuuDanhSach from "@/components/NutLuuDanhSach";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";
import GiaiThichThem from "@/components/GiaiThichThem";
import { HangLocNhanh, ThanhGocNhin } from "@/components/boLocChung";
import { napDanhSach, useDanhSachTheoDoi } from "@/lib/danhSachTheoDoiClient";

// BO LOC CO BAN (/co-ban): bang toan thi truong theo diem Z, F, ROE, dinh gia, tang truong, co tuc, Danh gia 360 (lib/phanTichCoBanDb.js layBangCoBan, quy moi nhat cua tung ma).
// Loc + sap xep tren trinh duyet. Nhom "Doanh nghiep" co Z va F; "Ngan hang / CK / BH" chi co DuPont + diem sinh loi (khong co Z, F, co tuc).
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const sans = { fontFamily: "var(--font-chu)" };
// 40 dong moi lan (truoc la 100): ban dien thoai (the) va ban may tinh (bang) deu duoc ve san trong HTML nen moi dong tinh 2 lan; 40 dong + "Xem them" giam ~60% HTML ban dau.
const SO_DONG = 40;
const LOC_RONG = { f: "", roe: "", pe: "", pb: "", coTuc: "", ln: "", d360: "", gtgd: "2", vonHoa: "" };

const f1 = (x, d = 1) => (x == null || !Number.isFinite(x) ? "—" : soVN(x, d, true));
const pc = (x) => (x == null ? "—" : `${x > 0 ? "+" : ""}${soVN(x, 0)}%`);
const mauTang = (v) => (v == null ? MUTED : v > 0 ? XANH : DO);
const mauZ = (v) => (v === "an toàn" ? XANH : v === "xám" ? VANG : v === "nguy cơ" ? DO : MUTED);
const mauF = (f) => (f == null ? MUTED : f >= 7 ? XANH : f <= 3 ? DO : VANG);
const mauXL = { Tốt: XANH, Khá: "#5BA8FF", "Trung bình": VANG, Yếu: DO };
const tenQuy = (q) => (q ? `Q${Math.ceil(Number(q.slice(5, 7)) / 3)}/${q.slice(2, 4)}` : "");

// bo loc nhanh: moi cai la ham (hang) => bool
const NHANH = [
  { k: "chat", ten: "Chất lượng", mota: "F ≥ 7, Z″ an toàn, ROE ≥ 12%, lợi nhuận 4 quý tăng, dòng tiền ≥ 50% lợi nhuận", pi: true, loc: (h) => h.f >= 7 && h.vungZ2 === "an toàn" && h.roe >= 12 && (h.lnYoY ?? -1) > 0 && (h.cfoLN ?? 0) > 0.5 },
  { k: "gia", ten: "Rẻ & hiệu quả", mota: "P/E 0–12 và ROE ≥ 12%", loc: (h) => h.pe > 0 && h.pe <= 12 && h.roe >= 12 },
  { k: "tang", ten: "Tăng trưởng", mota: "Lợi nhuận 4 quý tăng > 30% và lợi nhuận quý gần nhất tăng", loc: (h) => h.lnYoY > 30 && h.lnQuyYoY > 0 },
  { k: "tuc", ten: "Cổ tức", mota: "Tỷ suất cổ tức tiền mặt ≥ 5% và lợi nhuận dương", pi: true, loc: (h) => h.coTuc >= 5 && h.roe > 0 },
  { k: "canh", ten: "Cảnh báo", mota: "Z″ vùng nguy cơ hoặc F ≤ 3", pi: true, loc: (h) => h.vungZ2 === "nguy cơ" || (h.f != null && h.f <= 3) },
];

function Chip({ bat, onClick, children, title }) {
  return (
    <button type="button" onClick={onClick} title={title} className="px-3 py-1.5 rounded-full text-xs border whitespace-nowrap" style={{ borderColor: bat ? "var(--tim-nhat)" : VIEN, color: bat ? "var(--chu)" : MUTED, background: bat ? "var(--vien-nhe)" : "transparent", ...sans, fontWeight: bat ? 700 : 500 }}>
      {children}
    </button>
  );
}
function So({ nhan, gt, dat, buoc = 1, don = "" }) {
  return (
    <label className="flex flex-col gap-0.5 text-[11px]" style={{ color: MUTED }}>
      {nhan}
      <span className="flex items-center gap-1">
        <input type="number" inputMode="decimal" step={buoc} value={gt} onChange={(e) => dat(e.target.value)} placeholder="—" aria-label={nhan} className="w-20 px-2 py-1 rounded-lg border" style={{ borderColor: VIEN, background: "transparent", color: "var(--chu)", ...sans }} />
        {don && <span>{don}</span>}
      </span>
    </label>
  );
}

const COT = [
  { k: "ma", t: "Mã", l: true },
  { k: "nhanNganh", t: "Ngành", l: true, an: "max-md:hidden" },
  { k: "vonHoa", t: "Vốn hoá (tỷ)" },
  { k: "pe", t: "P/E", asc: true },
  { k: "pb", t: "P/B", asc: true },
  { k: "coTuc", t: "Cổ tức %", pi: true },
  { k: "roe", t: "ROE %" },
  { k: "bienLN", t: "Biên LN %", an: "max-md:hidden" },
  { k: "f", t: "F (0–9)", may: "ptcb-f", pi: true },
  { k: "z2", t: "Z″", may: "ptcb-z", pi: true },
  { k: "sinhLoi", t: "Điểm sinh lời", tc: true },
  { k: "lnYoY", t: "LN 4 quý", an: "max-sm:hidden" },
  { k: "lnQuyYoY", t: "LN quý", an: "max-md:hidden" },
  { k: "d360", t: "Điểm 360", may: "ptcb-360" },
  { k: "gtgd", t: "GTGD (tỷ)", an: "max-md:hidden" },
];

export default function BangCoBan({ hang: hangTho = null, hangGon = null, capNhat }) {
  // Trang gui dang cot (lib/goiCot.js); mo lai thanh mang doi tuong 1 lan.
  const hang = useMemo(() => hangTho ?? moCot(hangGon), [hangTho, hangGon]);
  const [nhom, datNhom] = useState("pi");
  const [tim, datTim] = useState("");
  const [nganh, datNganh] = useState("");
  const [nhanh, datNhanh] = useState(null);
  const [v, datV] = useState(LOC_RONG);
  const [vungZ, datVungZ] = useState("");
  const [sap, datSap] = useState({ k: "d360", hd: -1 });
  const [soHien, datSoHien] = useState(SO_DONG);
  // O loc so (ROE, P/E...) gon sau 1 nut nhu Bo loc ky thuat - bang hien len som hon
  const [moChiTiet, datMoChiTiet] = useState(false);
  const [moTK, datMoTK] = useState(false);
  // da dang nhap = kho danh sach theo doi tra ve mang (khach: null) - de nut theo doi / luu danh sach mo hop dang nhap cho khach
  const kho = useDanhSachTheoDoi();
  const coDangNhap = kho.daTai && kho.danhSach != null;

  const dat = (k) => (gt) => {
    datV((c) => ({ ...c, [k]: gt }));
    datSoHien(SO_DONG);
  };
  const doiNhom = (n) => {
    datNhom(n);
    datNhanh(null);
    datNganh("");
    datVungZ("");
    datV((c) => ({ ...c, f: "", coTuc: "" }));
    datSap({ k: "d360", hd: -1 });
    datSoHien(SO_DONG);
  };
  const laPi = nhom === "pi";
  const theoNhom = useMemo(() => hang.filter((h) => (laPi ? h.loai === "pi" : h.loai !== "pi")), [hang, laPi]);
  const dsNganh = useMemo(() => [...new Set(theoNhom.map((h) => h.nhanNganh))].sort((a, b) => a.localeCompare(b, "vi")), [theoNhom]);
  const cot = useMemo(() => COT.filter((c) => (laPi ? !c.tc : !c.pi)), [laPi]);

  const ds = useMemo(() => {
    const so = (x) => (x === "" ? null : Number(x));
    const [nf, nroe, npe, npb, nct, nln, n360, ngt, nvh] = [v.f, v.roe, v.pe, v.pb, v.coTuc, v.ln, v.d360, v.gtgd, v.vonHoa].map(so);
    const q = tim.trim().toUpperCase();
    const nh = NHANH.find((x) => x.k === nhanh);
    let a = theoNhom.filter((h) => {
      if (q && !h.ma.includes(q)) return false;
      if (nganh && h.nhanNganh !== nganh) return false;
      if (nh && !nh.loc(h)) return false;
      if (vungZ && h.vungZ2 !== vungZ) return false;
      if (nf != null && !(h.f >= nf)) return false;
      if (nroe != null && !(h.roe >= nroe)) return false;
      if (npe != null && !(h.pe > 0 && h.pe <= npe)) return false;
      if (npb != null && !(h.pb > 0 && h.pb <= npb)) return false;
      if (nct != null && !(h.coTuc >= nct)) return false;
      if (nln != null && !(h.lnYoY >= nln)) return false;
      if (n360 != null && !(h.d360 >= n360)) return false;
      if (ngt != null && !(h.gtgd >= ngt)) return false;
      if (nvh != null && !(h.vonHoa >= nvh)) return false;
      return true;
    });
    const { k, hd } = sap;
    const cs = COT.find((c) => c.k === k);
    a = [...a].sort((x, y) => {
      const p = x[k];
      const r = y[k];
      const tp = p == null || (cs?.asc && !(p > 0));
      const tr = r == null || (cs?.asc && !(r > 0));
      if (tp || tr) return tp === tr ? 0 : tp ? 1 : -1; // thieu du lieu (hoac lo voi P/E) luon xuong cuoi
      return (typeof p === "string" ? p.localeCompare(r, "vi") : p - r) * hd;
    });
    return a;
  }, [theoNhom, tim, nganh, nhanh, vungZ, v, sap]);

  const xoaLoc = () => {
    datTim("");
    datNganh("");
    datNhanh(null);
    datVungZ("");
    datV(LOC_RONG);
    datSoHien(SO_DONG);
  };
  const doiSap = (c) => datSap((s) => (s.k === c.k ? { k: c.k, hd: -s.hd } : { k: c.k, hd: c.l || c.asc ? 1 : -1 }));
  const soLocChiTiet = Object.entries(v).filter(([k, x]) => x !== "" && !(k === "gtgd" && x === LOC_RONG.gtgd)).length + (vungZ ? 1 : 0);
  const coSoNhanh = useMemo(() => {
    const q = tim.trim().toUpperCase();
    return theoNhom.filter((h) => (!q || h.ma.includes(q)) && (!nganh || h.nhanNganh === nganh));
  }, [theoNhom, tim, nganh]);
  const ngayCN = capNhat ? new Date(capNhat).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "";
  const nhanhHienCo = NHANH.filter((n) => laPi || !n.pi);

  const dsNhanh = [
    { khoa: "", nhan: "Tất cả", dem: coSoNhanh.length, dang: !nhanh },
    ...nhanhHienCo.map((n) => ({ khoa: n.k, nhan: n.ten, moTa: n.mota, dem: coSoNhanh.filter(n.loc).length, dang: nhanh === n.k })),
  ];

  return (
    <section aria-label="Bộ lọc cơ bản">
      <ThanhGocNhin
        ds={[
          { khoa: "pi", nhan: "Doanh nghiệp" },
          { khoa: "tc", nhan: "Ngân hàng · Chứng khoán · Bảo hiểm" },
        ]}
        dang={nhom}
        onChon={doiNhom}
      />
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        {laPi ? "Có điểm Z″ (rủi ro phá sản), điểm F (sức khoẻ tài chính), cổ tức." : "Không có điểm Z, F: chỉ DuPont, điểm sinh lời và định giá."}
      </p>

      <div data-may="cb-nhanh">
        <HangLocNhanh
          ds={dsNhanh}
          onChon={(m) => {
            datNhanh(m.khoa && nhanh !== m.khoa ? m.khoa : null);
            datSoHien(SO_DONG);
          }}
        />
      </div>
      {nhanh && <p className="text-xs mb-3" style={{ color: MUTED }}>{NHANH.find((n) => n.k === nhanh)?.mota}</p>}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          value={tim}
          onChange={(e) => {
            datTim(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10));
            datSoHien(SO_DONG);
          }}
          placeholder="Tìm mã…"
          aria-label="Tìm mã"
          className="px-3 py-2 rounded-lg text-sm border w-[130px]"
          style={{ borderColor: VIEN, background: NEN_CARD, color: "var(--chu)", ...sans }}
        />
        <select
          value={nganh}
          onChange={(e) => {
            datNganh(e.target.value);
            datSoHien(SO_DONG);
          }}
          aria-label="Ngành"
          className="px-3 py-2 rounded-lg text-sm border"
          style={{ borderColor: VIEN, background: NEN_CARD, color: nganh ? "var(--chu)" : MUTED, ...sans }}
        >
          <option value="">Mọi ngành</option>
          {dsNganh.map((n) => (
            <option key={n} value={n} style={{ color: "#000" }}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => datMoChiTiet((x) => !x)}
          aria-expanded={moChiTiet}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border"
          style={{ borderColor: soLocChiTiet ? "var(--tim-nhat)" : VIEN, background: NEN_CARD, color: "var(--chu)", ...sans }}
        >
          <SlidersHorizontal size={14} />
          Lọc theo chỉ số
          {soLocChiTiet > 0 && <b style={{ color: "var(--tim-chu)" }}>· {soLocChiTiet}</b>}
        </button>
        {(soLocChiTiet > 0 || nhanh || tim || nganh) && (
          <button type="button" onClick={xoaLoc} className="px-3 py-2 rounded-lg text-xs border" style={{ borderColor: VIEN, color: "var(--tim-chu)", ...sans }}>
            Xoá lọc
          </button>
        )}
      </div>

      {moChiTiet && (
        <div className="flex flex-wrap items-end gap-3 mb-3 rounded-xl border p-3" style={{ borderColor: VIEN, background: NEN_CARD }}>
          {laPi && <So nhan="Điểm F ≥" gt={v.f} dat={dat("f")} />}
          {laPi && (
            <label className="flex flex-col gap-0.5 text-[11px]" style={{ color: MUTED }}>
              Vùng Z″
              <select
                value={vungZ}
                onChange={(e) => {
                  datVungZ(e.target.value);
                  datSoHien(SO_DONG);
                }}
                aria-label="Vùng Z″"
                className="px-2 rounded-lg border"
                style={{ borderColor: VIEN, background: "transparent", color: "var(--chu)", ...sans, height: 34 }}
              >
                <option value="" style={{ color: "#000" }}>Tất cả</option>
                <option value="an toàn" style={{ color: "#000" }}>An toàn</option>
                <option value="xám" style={{ color: "#000" }}>Xám</option>
                <option value="nguy cơ" style={{ color: "#000" }}>Nguy cơ</option>
              </select>
            </label>
          )}
          <So nhan="ROE ≥" gt={v.roe} dat={dat("roe")} don="%" />
          <So nhan="P/E ≤" gt={v.pe} dat={dat("pe")} />
          <So nhan="P/B ≤" gt={v.pb} dat={dat("pb")} buoc={0.1} />
          {laPi && <So nhan="Cổ tức ≥" gt={v.coTuc} dat={dat("coTuc")} don="%" />}
          <So nhan="LN 4 quý tăng ≥" gt={v.ln} dat={dat("ln")} don="%" />
          <So nhan="Điểm 360 ≥" gt={v.d360} dat={dat("d360")} buoc={0.5} />
          <So nhan="GTGD ≥" gt={v.gtgd} dat={dat("gtgd")} don="tỷ" />
          <So nhan="Vốn hoá ≥" gt={v.vonHoa} dat={dat("vonHoa")} don="tỷ" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs" style={{ color: MUTED }}>
        <span>
          <b style={{ color: "var(--chu)" }}>{ds.length}</b> / {theoNhom.length} mã{v.gtgd ? ` · thanh khoản ≥ ${v.gtgd} tỷ/phiên` : ""}
          {ngayCN ? ` · BCTC quý, cập nhật ${ngayCN}` : ""}
        </span>
        <NutLuuDanhSach dsMa={ds.map((h) => h.ma)} coDangNhap={coDangNhap} moChuaDangNhap={() => datMoTK(true)} />
      </div>

      {/* DIEN THOAI: the - ma, nganh, ROE, P/E, diem 360 */}
      <div className="sm:hidden rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        {ds.slice(0, soHien).map((h, i) => (
          <Link key={h.ma} href={`/ma/${h.ma}`} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5">
                <span className="font-bold" style={sans}>
                  {h.ma}
                </span>
                <NutThamGia ma={h.ma} soNguoiThamGia={0} daThamGia={false} coDangNhap={coDangNhap} moChuaDangNhap={() => datMoTK(true)} />
                <span className="text-xs truncate" style={{ color: MUTED }}>
                  {h.nhanNganh}
                </span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                ROE <b style={{ color: h.roe == null ? MUTED : h.roe >= 15 ? XANH : h.roe < 8 ? DO : "var(--chu)" }}>{f1(h.roe)}%</b> · P/E {h.pe == null ? "lỗ" : f1(h.pe)} · P/B {f1(h.pb)}
                {laPi && h.f != null && (
                  <>
                    {" · F "}
                    <b style={{ color: mauF(h.f) }}>{h.f}</b>
                  </>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold" style={{ color: mauXL[h.xepLoai] ?? MUTED, ...sans }}>
                {f1(h.d360)}
              </p>
              <p className="text-[11px]" style={{ color: mauXL[h.xepLoai] ?? MUTED }}>
                {h.xepLoai ?? "điểm 360"}
              </p>
            </div>
          </Link>
        ))}
        {ds.length === 0 && (
          <p className="py-8 text-center text-sm" style={{ color: MUTED }}>
            Không có mã nào khớp bộ lọc.
          </p>
        )}
      </div>

      <div className="hidden sm:block overflow-auto bang-cuon rounded-2xl border max-h-[calc(100vh-150px)]" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {cot.map((c) => (
                <th
                  key={c.k}
                  className={`py-2.5 px-2.5 text-xs font-normal whitespace-nowrap cursor-pointer select-none ${c.l ? "text-left" : "text-right"} ${c.an ?? ""} ${c.k === "ma" ? "sticky left-0 z-[3]" : ""}`}
                  style={{ color: sap.k === c.k ? "var(--chu)" : MUTED, background: NEN_CARD, borderBottom: `1px solid ${VIEN}` }}
                  onClick={() => doiSap(c)}
                  data-may={c.may}
                >
                  {c.t}
                  {sap.k === c.k ? (sap.hd === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ds.slice(0, soHien).map((h) => (
              <tr key={h.ma} className="border-t hover:bg-[color:var(--hover-nhe)]" style={{ borderColor: "var(--vien-nhe)" }}>
                <td className="py-1.5 px-2.5 sticky left-0 z-[1] whitespace-nowrap" style={{ background: NEN_CARD }}>
                  <span className="inline-flex items-center gap-1.5">
                    <Link href={`/ma/${h.ma}`} className="font-bold hover:underline" style={sans}>
                      {h.ma}
                    </Link>
                    <NutThamGia ma={h.ma} soNguoiThamGia={0} daThamGia={false} coDangNhap={coDangNhap} moChuaDangNhap={() => datMoTK(true)} />
                    <span className="text-[11px]" style={{ color: MUTED }} title="Quý báo cáo tài chính">
                      {tenQuy(h.quy)}
                    </span>
                  </span>
                </td>
                <td className="py-1.5 px-2.5 text-xs max-md:hidden whitespace-nowrap" style={{ color: MUTED }}>{h.nhanNganh}</td>
                <td className="py-1.5 px-2.5 text-right">{h.vonHoa == null ? "—" : soVN(h.vonHoa, 0)}</td>
                <td className="py-1.5 px-2.5 text-right">{h.pe == null ? "lỗ" : f1(h.pe)}</td>
                <td className="py-1.5 px-2.5 text-right">{f1(h.pb)}</td>
                {laPi && <td className="py-1.5 px-2.5 text-right">{f1(h.coTuc)}</td>}
                <td className="py-1.5 px-2.5 text-right" style={{ color: h.roe == null ? MUTED : h.roe >= 15 ? XANH : h.roe < 8 ? DO : "var(--chu)", fontWeight: 600 }}>{f1(h.roe)}</td>
                <td className="py-1.5 px-2.5 text-right max-md:hidden">{f1(h.bienLN)}</td>
                {laPi && <td className="py-1.5 px-2.5 text-right" style={{ color: mauF(h.f), fontWeight: 700 }}>{h.f ?? "—"}</td>}
                {laPi && <td className="py-1.5 px-2.5 text-right" style={{ color: mauZ(h.vungZ2), fontWeight: 600 }}>{f1(h.z2)}</td>}
                {!laPi && <td className="py-1.5 px-2.5 text-right" style={{ color: h.sinhLoi >= 4 ? XANH : h.sinhLoi <= 2 ? DO : VANG, fontWeight: 700 }}>{h.sinhLoi == null ? "—" : `${h.sinhLoi}/5`}</td>}
                <td className="py-1.5 px-2.5 text-right max-sm:hidden" style={{ color: mauTang(h.lnYoY) }}>{pc(h.lnYoY)}</td>
                <td className="py-1.5 px-2.5 text-right max-md:hidden" style={{ color: mauTang(h.lnQuyYoY) }}>{pc(h.lnQuyYoY)}</td>
                <td className="py-1.5 px-2.5 text-right whitespace-nowrap">
                  <b style={{ color: mauXL[h.xepLoai] ?? MUTED }}>{f1(h.d360)}</b> <span className="text-[11px]" style={{ color: mauXL[h.xepLoai] ?? MUTED }}>{h.xepLoai ?? ""}</span>
                </td>
                <td className="py-1.5 px-2.5 text-right max-md:hidden">{h.gtgd == null ? "—" : soVN(h.gtgd, 0)}</td>
              </tr>
            ))}
            {ds.length === 0 && (
              <tr>
                <td colSpan={cot.length} className="py-8 text-center text-sm" style={{ color: MUTED }}>
                  Không có mã nào khớp bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {ds.length > soHien && (
        <div className="text-center mt-3">
          <Chip bat={false} onClick={() => datSoHien((n) => n + SO_DONG)}>
            Xem thêm {Math.min(SO_DONG, ds.length - soHien)} mã
          </Chip>
        </div>
      )}
      <GiaiThichThem nhanMo="Cách đọc các chỉ số" className="mt-3">
        Số liệu tính trên 4 quý gần nhất so với cùng kỳ năm trước. Z″ trên 5,85 an toàn · 4,15–5,85 xám · dưới 4,15 nguy cơ; F là điểm Piotroski 0–9. Điểm 360 là thứ hạng so với các mã cùng nhóm (10 = tốt nhất),
        không phải ngưỡng tuyệt đối. P/E, P/B theo giá đóng cửa phiên gần nhất. Báo cáo hợp nhất theo quý (VNDirect). Bảng chỉ để sàng lọc, không phải khuyến nghị đầu tư; mã tái cơ cấu hoặc thoái vốn có thể cho điểm nhiễu.
      </GiaiThichThem>
      <ModalTaiKhoan open={moTK} onClose={() => datMoTK(false)} onThanhCong={() => napDanhSach()} tieuDeGoiY="Đăng ký hoặc đăng nhập miễn phí để lưu mã vào danh sách theo dõi." />
    </section>
  );
}
