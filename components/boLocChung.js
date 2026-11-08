"use client";

import { NGANH_NHAN } from "@/lib/nganh";

// Phan bo loc + chon cot DUNG CHUNG cho bang Bo loc co phieu va bang So lenh
// dang mo (2 bang cung nhom bo loc: tim ma, von hoa, xu huong, san, nganh, canh
// bao va tieu chi UU TIEN; moi bang them cac bo loc rieng qua "children").
import { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import { Search, Columns3, Lock } from "lucide-react";
import { phanLoaiXuHuong, chamTPCaoNhat, laDangGiu, datChuanUuTien } from "@/components/dungChung";
import { NHOM_COT } from "@/components/cotChung";
import { coCanhBaoBanBot } from "@/lib/ghiChuTuDong";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const PRIMARY = "#8B5CF6";

// Gia tri "nganh" AFL xuat ra KHONG dau (quy uoc chung toan he thong) - map
// sang nhan co dau de hien thi dep hon trong dropdown, nhung filter van so
// sanh dung gia tri goc khong dau tu DB.
export { NGANH_NHAN };
export const DS_NGANH = Object.keys(NGANH_NHAN);

// Cac bo loc chung - moi bang tu them khoa rieng vao object loc cua minh.
export const LOC_TRONG = {
  timKiem: "",
  vonHoa: "",
  xuHuong: "",
  san: "",
  nganh: "",
  chiMatThan: false,
  chiChotLoi: false,
  chiBanBot: false,
  chiUuTien: false,
};

export const NHAN_UU_TIEN = "Chỉ mã ưu tiên: giá > 10.000đ · vốn hoá ≥ 3.000 tỷ · KL ≥ 500.000 cp/phiên · GTGD > 10 tỷ/phiên (TB20)";

// Doc bo loc chung tu URL (vd tu the KPI o trang chu bam vao). "datchuan" la
// ten tham so cu - van chap nhan de link cu khong hong.
export function docLocChungTuUrl(searchParams) {
  return {
    timKiem: "",
    vonHoa: searchParams.get("vonhoa") || "",
    xuHuong: searchParams.get("xuhuong") || "",
    san: searchParams.get("san") || "",
    nganh: searchParams.get("nganh") || "",
    chiMatThan: searchParams.get("matthan") === "1",
    chiChotLoi: searchParams.get("chotloi") === "1",
    chiBanBot: searchParams.get("banbot") === "1",
    chiUuTien: searchParams.get("uutien") === "1" || searchParams.get("datchuan") === "1",
  };
}

export function locChung(ds, loc) {
  const tuKhoa = (loc.timKiem || "").trim().toUpperCase();
  return ds.filter(
    (r) =>
      (!tuKhoa || r.ma.includes(tuKhoa)) &&
      (!loc.vonHoa || r.von_hoa === loc.vonHoa) &&
      (!loc.xuHuong || phanLoaiXuHuong(r) === loc.xuHuong) &&
      (!loc.san || (r.san || "HOSE") === loc.san) &&
      (!loc.nganh || (r.nganh || "Khac") === loc.nganh) &&
      (!loc.chiMatThan || r.mat_than) &&
      // tp_da_cham cua ma KHONG con giu chi la lich su lan mua gan nhat - chi tinh ma dang giu.
      (!loc.chiChotLoi || (laDangGiu(r) && chamTPCaoNhat(r))) &&
      (!loc.chiBanBot || coCanhBaoBanBot(r)) &&
      (!loc.chiUuTien || datChuanUuTien(r))
  );
}

export function coLocChung(loc) {
  return !!(loc.timKiem || loc.vonHoa || loc.xuHuong || loc.san || loc.nganh || loc.chiMatThan || loc.chiChotLoi || loc.chiBanBot || loc.chiUuTien);
}

export function OSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 text-sm rounded-lg outline-none"
      style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)" }}
    >
      <option value="">{placeholder}</option>
      {options.map(([v, nhan]) => (
        <option key={v} value={v}>
          {nhan}
        </option>
      ))}
    </select>
  );
}

// O go so nho (vd moc free float): chi nhan 0-100, rong = khong loc.
export function OSo({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      max={100}
      step={1}
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-14 px-1.5 py-0.5 text-sm rounded-md outline-none text-center"
      style={{ background: "var(--nen-phu)", border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)" }}
    />
  );
}

export function OTich({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

// Hang dropdown: o tim ma + (chen them qua "truocChon") + von hoa/xu huong/san/
// nganh + nut Xoa bo loc + hop Cot hien thi (chonCot) neu co.
export function HangBoLocChung({ loc, datLoc, truocChon, sauChon, coBoLoc, onXoa, chonCot }) {
  const dat = (khoa) => (giaTri) => datLoc((cu) => ({ ...cu, [khoa]: giaTri }));
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative max-w-xs flex-1 min-w-[160px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={MUTED} />
        <input
          value={loc.timKiem}
          onChange={(e) => dat("timKiem")(e.target.value)}
          placeholder="Tìm mã cổ phiếu..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
          style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)" }}
        />
      </div>
      {truocChon}
      <OSelect
        value={loc.vonHoa}
        onChange={dat("vonHoa")}
        placeholder="Tất cả vốn hoá"
        options={[
          ["VN30", "VN30"],
          ["Midcap", "Midcap"],
          ["Smallcap", "Smallcap"],
        ]}
      />
      <OSelect
        value={loc.xuHuong}
        onChange={dat("xuHuong")}
        placeholder="Tất cả xu hướng"
        options={[
          ["xanh", "Tăng"],
          ["do", "Giảm"],
          ["sideway", "Sideway"],
        ]}
      />
      <OSelect
        value={loc.san}
        onChange={dat("san")}
        placeholder="Tất cả sàn"
        options={[
          ["HOSE", "HOSE"],
          ["HNX", "HNX"],
          ["UPCOM", "UPCOM"],
        ]}
      />
      <OSelect value={loc.nganh} onChange={dat("nganh")} placeholder="Tất cả ngành" options={DS_NGANH.map((n) => [n, NGANH_NHAN[n]])} />
      {sauChon}
      {coBoLoc && (
        <button onClick={onXoa} className="text-xs px-3 py-2 rounded-lg" style={{ color: "var(--tim-chu)", border: `1px solid ${VIEN}` }}>
          Xoá bộ lọc
        </button>
      )}
      {chonCot && <div className="ml-auto">{chonCot}</div>}
    </div>
  );
}

// Hang checkbox chung: canh bao + tieu chi UU TIEN (kem so ma dat chuan).
export function HangTichChung({ loc, datLoc, soUuTien, children }) {
  const dat = (khoa) => (giaTri) => datLoc((cu) => ({ ...cu, [khoa]: giaTri }));
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
      <OTich checked={loc.chiMatThan} onChange={dat("chiMatThan")}>
        Chỉ cảnh báo Mắt Thần
      </OTich>
      <OTich checked={loc.chiChotLoi} onChange={dat("chiChotLoi")}>
        Chỉ đã chạm chốt lời (TP)
      </OTich>
      <OTich checked={loc.chiBanBot} onChange={dat("chiBanBot")}>
        Chỉ cảnh báo Bán bớt
      </OTich>
      {children}
      <OTich checked={loc.chiUuTien} onChange={dat("chiUuTien")}>
        <span>
          {NHAN_UU_TIEN}
          {soUuTien != null && <b style={{ color: "var(--xanh)" }}> · {soUuTien} mã đạt</b>}
        </span>
      </OTich>
    </div>
  );
}

// Nho cot dang hien vao localStorage (moi bang 1 khoa) - moi doc/ghi bao trong
// try/catch vi trinh duyet co the chan localStorage (che do an danh...).
const SU_KIEN_DOI_COT = "cs-cot-doi";

function dangKyLuuTru(bao) {
  window.addEventListener("storage", bao);
  window.addEventListener(SU_KIEN_DOI_COT, bao);
  return () => {
    window.removeEventListener("storage", bao);
    window.removeEventListener(SU_KIEN_DOI_COT, bao);
  };
}

export function useCotHienThi(khoaLuuTru, dsKhoaCoThe, macDinh) {
  // Doc localStorage qua useSyncExternalStore: server luon tra null (dung mac
  // dinh) nen khong lech HTML luc hydrate, sau do client tu cap nhat theo lua chon da luu.
  const luuTru = useSyncExternalStore(
    dangKyLuuTru,
    () => {
      try {
        return localStorage.getItem(khoaLuuTru);
      } catch {
        return null;
      }
    },
    () => null
  );
  // Giu ban ghi de trong phien hien tai de doi cot van hoat dong du localStorage bi chan.
  const [ghiDe, setGhiDe] = useState(null);
  const chuoi = ghiDe ?? luuTru;

  const dangChon = useMemo(() => {
    try {
      const mang = JSON.parse(chuoi || "null");
      if (Array.isArray(mang)) return new Set(mang.filter((k) => dsKhoaCoThe.includes(k)));
    } catch {}
    return new Set(macDinh);
  }, [chuoi, dsKhoaCoThe, macDinh]);

  function dat(tapMoi) {
    const s = JSON.stringify([...tapMoi]);
    setGhiDe(s);
    try {
      localStorage.setItem(khoaLuuTru, s);
      window.dispatchEvent(new Event(SU_KIEN_DOI_COT));
    } catch {}
  }

  return {
    dangChon,
    bat: (khoa) => {
      const t = new Set(dangChon);
      if (t.has(khoa)) t.delete(khoa);
      else t.add(khoa);
      dat(t);
    },
    hienTatCa: () => dat(new Set(dsKhoaCoThe)),
    macDinh: () => dat(new Set(macDinh)),
  };
}

// Hop "Cot hien thi": tick de bat/tat tung chi so, nhom theo loai. Ma va Tin
// hieu luon hien nen khong nam trong hop nay.
export function ChonCotHienThi({ cot, dsKhoa, dangChon, onBat, onHienTatCa, onMacDinh, ghiChu }) {
  const [mo, setMo] = useState(false);
  const vung = useRef(null);

  useEffect(() => {
    if (!mo) return;
    const dong = (e) => {
      if (vung.current && !vung.current.contains(e.target)) setMo(false);
    };
    document.addEventListener("mousedown", dong);
    return () => document.removeEventListener("mousedown", dong);
  }, [mo]);

  return (
    <div className="relative" ref={vung}>
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg"
        style={{ background: NEN_CARD, border: `1px solid ${mo ? PRIMARY : VIEN}`, color: TEXT, fontFamily: "var(--font-chu)" }}
      >
        <Columns3 size={14} />
        Cột hiển thị ({dsKhoa.filter((k) => dangChon.has(k)).length}/{dsKhoa.length})
      </button>
      {mo && (
        <div
          className="absolute right-0 mt-2 w-72 max-h-[60vh] overflow-y-auto rounded-xl border p-3 z-30 shadow-2xl"
          style={{ background: NEN_CARD, borderColor: VIEN }}
        >
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={onHienTatCa} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ color: "var(--tim-chu)", border: `1px solid ${VIEN}` }}>
              Hiện tất cả
            </button>
            <button type="button" onClick={onMacDinh} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ color: MUTED, border: `1px solid ${VIEN}` }}>
              Mặc định
            </button>
          </div>
          {ghiChu && (
            <p className="text-[11px] mb-3" style={{ color: "var(--vang)" }}>
              {ghiChu}
            </p>
          )}
          {NHOM_COT.map((nhom) => {
            const dsNhom = dsKhoa.filter((k) => cot[k]?.nhom === nhom);
            if (dsNhom.length === 0) return null;
            return (
              <div key={nhom} className="mb-3 last:mb-0">
                <p className="text-[11px]  mb-1.5" style={{ color: MUTED }}>
                  {nhom}
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                  {dsNhom.map((k) => (
                    <label key={k} className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: TEXT }}>
                      <input type="checkbox" checked={dangChon.has(k)} onChange={() => onBat(k)} />
                      {cot[k].nhan}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- 04/11/2026: GON KIEU CAC BO LOC NOI TIENG (TradingView Screener, Finviz, Simplize) ----------
// Nho 1 lua chon chuoi (vd goc nhin dang chon) vao localStorage - doc qua useSyncExternalStore nhu useCotHienThi (server tra macDinh, khong lech luc hydrate).
export function useLuaChonLuu(khoaLuuTru, macDinh, dsHopLe) {
  const luuTru = useSyncExternalStore(
    dangKyLuuTru,
    () => {
      try {
        return localStorage.getItem(khoaLuuTru);
      } catch {
        return null;
      }
    },
    () => null
  );
  const [ghiDe, setGhiDe] = useState(null);
  const giaTri = ghiDe ?? luuTru;
  const hienTai = dsHopLe.includes(giaTri) ? giaTri : macDinh;
  function dat(v) {
    setGhiDe(v);
    try {
      localStorage.setItem(khoaLuuTru, v);
      window.dispatchEvent(new Event(SU_KIEN_DOI_COT));
    } catch {}
  }
  return [hienTai, dat];
}

// HANG "BO LOC NHANH": cac nut loc san (nhu "Signal" cua Finviz / "Screens" cua TradingView) - 1 cham la ra danh sach, kem so ma.
// ds: [{ khoa, nhan, dem, dang (bool), khoa: bool (can dang nhap), moTa }]; onChon(muc). Dien thoai: 1 hang cuon ngang.
export function HangLocNhanh({ ds, onChon, sau = null }) {
  return (
    <div className="flex items-center gap-2 mb-3 overflow-x-auto sm:flex-wrap pb-1 sm:pb-0 [scrollbar-width:none]" role="toolbar" aria-label="Bộ lọc nhanh">
      {ds.map((m) => (
        <button
          key={m.khoa}
          type="button"
          onClick={() => onChon(m)}
          aria-pressed={!!m.dang}
          title={m.moTa}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors"
          style={{
            borderColor: m.dang ? PRIMARY : VIEN,
            background: m.dang ? "rgba(139,92,246,0.18)" : NEN_CARD,
            color: m.dang ? TEXT : "var(--mo-2)",
            fontFamily: "var(--font-chu)",
            fontWeight: m.dang ? 700 : 500,
          }}
        >
          {m.biKhoa && <Lock size={12} aria-hidden="true" />}
          {m.nhan}
          {m.dem != null && !m.biKhoa && (
            <span className="text-xs px-1.5 rounded-full" style={{ background: m.dang ? "rgba(255,255,255,0.14)" : "var(--vien-nhe)", color: m.dang ? TEXT : MUTED }}>
              {m.dem}
            </span>
          )}
        </button>
      ))}
      {sau}
    </div>
  );
}

// THANH "GOC NHIN" cua bang (nhu cac tab Overview / Performance / Technical cua TradingView, Finviz): moi goc nhin la 1 bo cot vua du, khong do het hang chuc cot ra 1 luc.
// ds: [{ khoa, nhan }]; ben phai co the gan them (vd nut Cot hien thi).
export function ThanhGocNhin({ ds, dang, onChon, phai = null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
      <div className="inline-flex max-w-full overflow-x-auto rounded-xl p-1 gap-1 [scrollbar-width:none]" style={{ background: NEN_CARD, border: `1px solid ${VIEN}` }} role="tablist" aria-label="Góc nhìn của bảng">
        {ds.map((g) => (
          <button
            key={g.khoa}
            type="button"
            role="tab"
            aria-selected={dang === g.khoa}
            onClick={() => onChon(g.khoa)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
            style={dang === g.khoa ? { background: PRIMARY, color: "#fff", fontWeight: 700, fontFamily: "var(--font-chu)" } : { color: MUTED, fontFamily: "var(--font-chu)" }}
          >
            {g.nhan}
          </button>
        ))}
      </div>
      {phai}
    </div>
  );
}
