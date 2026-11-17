"use client";

import { useEffect, useState } from "react";
import BieuDoKyThuat from "@/components/BieuDoKyThuat";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const KHOA_LUU = "cs-da-khung-ds";
const KHOA_LUU_BC = "cs-da-khung-bocuc";

// DA KHUNG TREN 1 MAN HINH (17/11/2026, Hieu: "xem da khung tren 1 man hinh", "them khung thang", "them bao nhieu khung deu duoc, chi can 3 hoac 2 khung thoi", "doi bo cuc tung khung, 1 to 2 be"):
// cung 1 ma, nhieu bieu do o cac khung thoi gian tu chon (1-8 khung) xep luoi; 3 kieu bo cuc: LUOI DEU, 1 LON TRAI + cac o be xep doc ben phai, 1 LON TREN + cac o be hang duoi.
// Moi o la 1 bieu do day du (BieuDoKyThuat) - van doi duoc khung rieng bang thanh khung cua o do.
const KHUNG = [
  { khoa: "MO", nhan: "Tháng" },
  { khoa: "W", nhan: "Tuần" },
  { khoa: "D", nhan: "Ngày" },
  { khoa: "H", nhan: "1 giờ" },
  { khoa: "M30", nhan: "30 phút" },
  { khoa: "M15", nhan: "15 phút" },
  { khoa: "M5", nhan: "5 phút" },
  { khoa: "M1", nhan: "1 phút" },
];
const THU_TU = KHUNG.map((k) => k.khoa);
const MAC_DINH = ["MO", "W", "D", "H"];
const MAU_NHANH = [
  { nhan: "Dài hạn", ds: ["MO", "W", "D"] },
  { nhan: "Giao dịch", ds: ["W", "D", "H"] },
  { nhan: "Trong ngày", ds: ["D", "H", "M15", "M5"] },
];
const BO_CUC = [
  { khoa: "deu", nhan: "Lưới đều", tip: "Các ô bằng nhau" },
  { khoa: "trai", nhan: "1 lớn + nhỏ bên phải", tip: "1 ô lớn bên trái, các ô nhỏ xếp dọc bên phải" },
  { khoa: "tren", nhan: "1 lớn trên + nhỏ dưới", tip: "1 ô lớn phía trên, các ô nhỏ xếp thành hàng phía dưới" },
];
const GAP = 8;
const PHI_O = 100; // chieu cao thanh khung + chu thich + chan cua 1 o (ngoai vung ve)
const sapXep = (ds) => THU_TU.filter((k) => ds.includes(k));

export default function LuoiDaKhung({ ma, tenMa = null, vung = null, ngayMua = null }) {
  const [dsKhung, setDsKhung] = useState(MAC_DINH);
  const [boCuc, setBoCuc] = useState("deu");
  const [khungLon, setKhungLon] = useState("D");
  const [dongBo, setDongBo] = useState(true);
  const [dongBoZoom, setDongBoZoom] = useState(true);
  const [caoMH, setCaoMH] = useState(800);
  const [rong, setRong] = useState(1400);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KHOA_LUU) || "null");
      if (Array.isArray(v)) {
        const ds = sapXep(v);
        if (ds.length >= 1) setDsKhung(ds);
      }
      const bc = JSON.parse(localStorage.getItem(KHOA_LUU_BC) || "null");
      if (bc && BO_CUC.some((b) => b.khoa === bc.boCuc)) {
        setBoCuc(bc.boCuc);
        if (THU_TU.includes(bc.khungLon)) setKhungLon(bc.khungLon);
      }
    } catch {}
    const doi = () => {
      setCaoMH(window.innerHeight);
      setRong(window.innerWidth);
    };
    doi();
    window.addEventListener("resize", doi);
    return () => window.removeEventListener("resize", doi);
  }, []);

  const luuBC = (bc, kl) => {
    try {
      localStorage.setItem(KHOA_LUU_BC, JSON.stringify({ boCuc: bc, khungLon: kl }));
    } catch {}
  };
  const doiBoCuc = (bc) => {
    setBoCuc(bc);
    luuBC(bc, khungLon);
  };
  const doiKhungLon = (kl) => {
    setKhungLon(kl);
    luuBC(boCuc, kl);
  };
  const datDs = (ds) => {
    const m = sapXep(ds);
    if (m.length < 1) return; // luon giu it nhat 1 khung
    setDsKhung(m);
    try {
      localStorage.setItem(KHOA_LUU, JSON.stringify(m));
    } catch {}
  };
  const bam = (k) => datDs(dsKhung.includes(k) ? dsKhung.filter((x) => x !== k) : [...dsKhung, k]);

  const n = dsKhung.length;
  const manHep = rong < 1024;
  // O lon: khung da chon (neu khung dang chon da bi bo khoi danh sach thi lay khung dau tien)
  const lon = dsKhung.includes(khungLon) ? khungLon : dsKhung[0];
  const kieu = n < 2 || manHep ? "deu" : boCuc;
  const vungCao = Math.max(300, caoMH - 190); // chieu cao con lai cua man hinh cho luoi

  // Thu tu ve: o lon dau, roi cac khung con lai theo thu tu goc
  const dsVe = kieu === "deu" ? dsKhung : [lon, ...dsKhung.filter((k) => k !== lon)];
  const soBe = n - 1;
  let cot = 1;
  let cao = 300; // o thuong (luoi deu) / o be
  let caoLon = 300;
  let khungLuoi = {};
  let kieuO = () => undefined;

  if (kieu === "deu") {
    cot = manHep ? 1 : n === 1 ? 1 : n === 2 ? 2 : n === 3 ? (rong >= 1536 ? 3 : 2) : n <= 4 ? 2 : rong >= 1536 ? 3 : 2;
    const hang = Math.ceil(n / cot);
    cao = manHep ? 300 : Math.max(230, Math.floor(vungCao / hang) - PHI_O);
    caoLon = cao;
    khungLuoi = { gridTemplateColumns: `repeat(${cot}, minmax(0, 1fr))` };
    kieuO = (i) => (cot > 1 && n % cot === 1 && i === n - 1 ? { gridColumn: "1 / -1" } : undefined);
  } else if (kieu === "trai") {
    // 1 lon ben trai (2/3 chieu rong) chiem tron chieu cao, cac o be xep doc ben phai (1/3)
    cao = Math.max(200, Math.floor(vungCao / soBe) - PHI_O);
    caoLon = Math.max(260, soBe * (cao + PHI_O) + (soBe - 1) * GAP - PHI_O);
    khungLuoi = { gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gridTemplateRows: `repeat(${soBe}, auto)` };
    kieuO = (i) => (i === 0 ? { gridColumn: 1, gridRow: `1 / span ${soBe}` } : { gridColumn: 2, gridRow: i });
  } else {
    // 1 lon phia tren (cao ~60%), cac o be thanh 1 hang phia duoi (toi da 4 o / hang)
    const colBe = Math.min(soBe, 4);
    const hangBe = Math.ceil(soBe / colBe);
    caoLon = Math.max(260, Math.floor(vungCao * 0.6) - PHI_O);
    cao = Math.max(200, Math.floor((vungCao * 0.4) / hangBe) - PHI_O);
    cot = colBe;
    khungLuoi = { gridTemplateColumns: `repeat(${colBe}, minmax(0, 1fr))` };
    kieuO = (i) => (i === 0 ? { gridColumn: "1 / -1" } : undefined);
  }

  const nutPhu = { background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontWeight: 600 };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="text-xs" style={{ color: MUTED }}>
          Khung hiển thị:
        </span>
        {KHUNG.map((k) => {
          const dang = dsKhung.includes(k.khoa);
          return (
            <button
              key={k.khoa}
              type="button"
              onClick={() => bam(k.khoa)}
              aria-pressed={dang}
              title={dang ? (n === 1 ? "Phải giữ ít nhất 1 khung" : `Bỏ khung ${k.nhan.toLowerCase()}`) : `Thêm khung ${k.nhan.toLowerCase()}`}
              className="h-7 px-2.5 rounded-md text-xs cursor-pointer"
              style={{
                background: dang ? "rgba(108,92,231,0.22)" : NEN_CARD,
                border: `1px solid ${dang ? "var(--tim-chu)" : VIEN}`,
                color: dang ? TEXT : MUTED,
                fontWeight: 600,
              }}
            >
              {k.nhan}
            </button>
          );
        })}
        <span className="text-xs ml-1" style={{ color: MUTED }}>
          Nhanh:
        </span>
        {MAU_NHANH.map((p) => (
          <button key={p.nhan} type="button" onClick={() => datDs(p.ds)} title={p.ds.map((k) => KHUNG.find((x) => x.khoa === k).nhan).join(" · ")} className="h-7 px-2.5 rounded-md text-xs cursor-pointer" style={nutPhu}>
            {p.nhan}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="text-xs" style={{ color: MUTED }}>
          Bố cục:
        </span>
        {BO_CUC.map((b) => {
          const dang = boCuc === b.khoa;
          const tat = b.khoa !== "deu" && n < 2;
          return (
            <button
              key={b.khoa}
              type="button"
              disabled={tat}
              onClick={() => doiBoCuc(b.khoa)}
              aria-pressed={dang}
              title={tat ? "Cần ít nhất 2 khung" : b.tip}
              className="h-7 px-2.5 rounded-md text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ ...nutPhu, background: dang ? "rgba(108,92,231,0.22)" : NEN_CARD, border: `1px solid ${dang ? "var(--tim-chu)" : VIEN}` }}
            >
              {b.nhan}
            </button>
          );
        })}
        {boCuc !== "deu" && n >= 2 && (
          <label className="inline-flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
            Ô lớn:
            <select value={lon} onChange={(e) => doiKhungLon(e.target.value)} className="h-7 rounded-md text-xs px-1.5 cursor-pointer" style={{ ...nutPhu, outline: "none" }}>
              {dsKhung.map((k) => (
                <option key={k} value={k}>
                  {KHUNG.find((x) => x.khoa === k).nhan}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer ml-2" style={{ color: TEXT, fontWeight: 600 }} title="Rê chuột ở một ô, con trỏ ở các ô còn lại chạy theo cùng thời điểm">
          <input type="checkbox" checked={dongBo} onChange={(e) => setDongBo(e.target.checked)} style={{ accentColor: "#6C5CE7" }} />
          Đồng bộ con trỏ
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: TEXT, fontWeight: 600 }} title="Kéo hoặc cuộn ở một ô, các ô còn lại đổi theo cùng khoảng thời gian">
          <input type="checkbox" checked={dongBoZoom} onChange={(e) => setDongBoZoom(e.target.checked)} style={{ accentColor: "#6C5CE7" }} />
          Đồng bộ zoom
        </label>
      </div>
      <div className="grid gap-2" style={khungLuoi}>
        {dsVe.map((k, i) => (
          <div key={k} className="min-w-0" style={kieuO(i)}>
            <BieuDoKyThuat tenMa={tenMa} ma={ma} vung={vung} ngayMua={ngayMua} chieuCao={kieu !== "deu" && i === 0 ? caoLon : cao} khungMacDinh={k} dongBo={dongBo ? "dk" : null} dongBoZoom={dongBoZoom ? "dkz" : null} veTrai />
          </div>
        ))}
      </div>
    </div>
  );
}
