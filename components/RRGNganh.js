"use client";

import { useEffect, useMemo, useState } from "react";
import { soVN } from "@/lib/soVN";
import { tinhRRG, gocRRG } from "@/lib/rrgTinh";

// RRG (Relative Rotation Graph) tren Dashboard. Chuoi gia ngay cua tung nganh + benchmark do engine/dich-vu/tinhRRG.mjs dua len (/api/upload-phan-tich-co-ban),
// trinh duyet tu tinh lai theo bo loc: khung ngay/tuan, chu ky RS, do dai duoi, benchmark, chon nganh, them ma co phieu (gia lay tu /api/gia-lich-su).
// Cot "Nong" / "Tien rong uoc tinh" cua nganh la so engine tinh san (khung tuan); "Rong chu dong hom nay" lay tu /api/dong-tien (chi thanh vien da duyet).
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const sans = { fontFamily: "var(--font-chu)" };
const MAU_GOC = { Leading: "var(--xanh)", Improving: "#5BA8FF", Weakening: "var(--vang)", Lagging: "var(--do)" };
const NHAN_GOC = { Leading: "Dẫn dắt", Improving: "Cải thiện", Weakening: "Yếu dần", Lagging: "Tụt hậu" };
const W = 640;
const H = 560;
const LE = 46;
const CHU_KY = [10, 15, 30, 35, 50];
const DUOI = { W: [4, 8, 12, 20], D: [10, 20, 30, 50, 90] };
const MAC_DINH = { W: { cuaSo: 10, duoi: 8 }, D: { cuaSo: 30, duoi: 20 } };
const TOI_DA_MA = 8;
const MA_HOP_LE = /^[A-Z0-9]{2,12}$/;

// ten ngan tren bieu do: bo phan sau " - ", BDS khu cong nghiep -> BDS KCN
const nganGon = (n) => n.replace("BĐS khu công nghiệp", "BĐS KCN").replace("Vật liệu xây dựng", "VLXD").replace("Bất động sản", "BĐS").split(" - ")[0];
const f1 = (x, d = 1) => (x == null || !Number.isFinite(x) ? "—" : soVN(x, d, true));
const dau = (x, d = 1) => (x == null || !Number.isFinite(x) ? "—" : `${x > 0 ? "+" : ""}${f1(x, d)}`);
const mau = (v, nguong = 0) => (v == null ? MUTED : v > nguong ? XANH : v < -nguong ? DO : "var(--chu)");

function Chip({ bat, onClick, children, title }) {
  return (
    <button type="button" onClick={onClick} title={title} className="px-2.5 py-1 rounded-full text-xs border" style={{ borderColor: bat ? "var(--tim-nhat)" : VIEN, color: bat ? "var(--chu)" : MUTED, background: bat ? "var(--vien-nhe)" : "transparent", ...sans, fontWeight: bat ? 700 : 500 }}>
      {children}
    </button>
  );
}
function The({ children, onBo }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs border" style={{ borderColor: VIEN, background: "var(--vien-nhe)", ...sans }}>
      {children}
      <button type="button" onClick={onBo} aria-label="Bỏ" className="px-1 leading-none" style={{ color: MUTED }}>
        ✕
      </button>
    </span>
  );
}
function Nhom({ ten, children }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] mr-1" style={{ color: MUTED, minWidth: 54 }}>{ten}</span>
      {children}
    </div>
  );
}

function BieuDo({ ds, chon, datChon }) {
  const { X, Y } = useMemo(() => {
    // khung theo vi tri HIEN TAI; phan duoi vuot khung bi cat (clipPath) de khong keo gian ca bieu do
    const xs = ds.map((r) => r.pts.at(-1).ratio);
    const ys = ds.map((r) => r.pts.at(-1).mom);
    const dx = Math.max(3, ...xs.map((x) => Math.abs(x - 100)), 0) + 1;
    const dy = Math.max(3, ...ys.map((y) => Math.abs(y - 100)), 0) + 1;
    return {
      X: (v) => LE + ((v - (100 - dx)) / (2 * dx)) * (W - 2 * LE),
      Y: (v) => H - LE - ((v - (100 - dy)) / (2 * dy)) * (H - 2 * LE),
    };
  }, [ds]);
  // dat nhan ten tranh de len nhau: xep theo y, nhan nao cham nhan da dat thi day xuong den khi het cham
  const viTriNhan = useMemo(() => {
    // nhan nganh dung sat nhau: thu lan luot ben phai diem (lech doc 0, +13, -13, +26, -26...) roi ben trai diem, lay cho dau tien khong cham nhan da dat (~7px/ky tu)
    const dat = [];
    const kq = {};
    const THU = [0, 13, -13, 26, -26, 39, -39, 52, -52];
    [...ds]
      .map((r) => ({ r, px: X(r.pts.at(-1).ratio), y: Y(r.pts.at(-1).mom) + 4, w: r.nhanNgan.length * 7 + 4 }))
      .sort((a, b) => a.y - b.y)
      .forEach((n) => {
        let chon = { y: n.y, trai: false, x: n.px + 10 };
        tim: for (const trai of [false, true]) {
          const x = trai ? n.px - 10 - n.w : n.px + 10;
          for (const lech of THU) {
            const y = n.y + lech;
            if (y < LE + 14 || y > H - LE - 4) continue;
            if (!dat.some((d) => Math.abs(d.y - y) < 13 && d.x < x + n.w && x < d.x + d.w)) {
              chon = { y, trai, x };
              break tim;
            }
          }
        }
        dat.push({ x: chon.x, y: chon.y, w: n.w });
        kq[n.r.id] = chon;
      });
    return kq;
  }, [ds, X, Y]);
  const nhanGoc = (x, y, t, anchor, goc) => (
    <text x={x} y={y} textAnchor={anchor} fontSize="12" fill={MAU_GOC[goc]} opacity="0.75" style={sans} fontWeight="700">
      {t}
    </text>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Biểu đồ RRG">
      <defs>
        <clipPath id="rrg-khung">
          <rect x={LE} y={LE} width={W - 2 * LE} height={H - 2 * LE} />
        </clipPath>
      </defs>
      <rect x={LE} y={LE} width={W - 2 * LE} height={H - 2 * LE} fill="none" stroke="var(--vien)" />
      <rect x={X(100)} y={LE} width={W - LE - X(100)} height={Y(100) - LE} fill="var(--xanh)" opacity="0.05" />
      <rect x={LE} y={Y(100)} width={X(100) - LE} height={H - LE - Y(100)} fill="var(--do)" opacity="0.05" />
      <line x1={X(100)} x2={X(100)} y1={LE} y2={H - LE} stroke="var(--mo)" opacity="0.5" />
      <line y1={Y(100)} y2={Y(100)} x1={LE} x2={W - LE} stroke="var(--mo)" opacity="0.5" />
      {nhanGoc(W - LE - 8, LE + 18, "DẪN DẮT", "end", "Leading")}
      {nhanGoc(W - LE - 8, H - LE - 10, "YẾU DẦN", "end", "Weakening")}
      {nhanGoc(LE + 8, H - LE - 10, "TỤT HẬU", "start", "Lagging")}
      {nhanGoc(LE + 8, LE + 18, "CẢI THIỆN", "start", "Improving")}
      <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="11" fill={MUTED} style={sans}>
        RS-Ratio: sức mạnh so với mốc so sánh (&gt; 100 = hơn) →
      </text>
      <text transform={`translate(13 ${H / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill={MUTED} style={sans}>
        RS-Momentum: đang tăng tốc (&gt; 100) →
      </text>
      {ds.map((r) => {
        const c = MAU_GOC[r.goc];
        const l = r.pts.at(-1);
        const sang = !chon || chon === r.id;
        return (
          <g key={r.id} opacity={sang ? 1 : 0.18} style={{ cursor: "pointer" }} onClick={() => datChon(chon === r.id ? null : r.id)}>
            <g clipPath="url(#rrg-khung)">
              {r.pts.slice(0, -1).map((d, i) => (
                <line key={d.t} x1={X(d.ratio)} y1={Y(d.mom)} x2={X(r.pts[i + 1].ratio)} y2={Y(r.pts[i + 1].mom)} stroke={c} strokeWidth="2" strokeLinecap="round" opacity={0.12 + 0.55 * ((i + 1) / (r.pts.length - 1))} strokeDasharray={r.loai === "ma" ? "4 3" : undefined} />
              ))}
            </g>
            {r.loai === "ma" ? <rect x={X(l.ratio) - 5.5} y={Y(l.mom) - 5.5} width="11" height="11" fill={c} stroke="var(--chu)" strokeWidth="1.2" transform={`rotate(45 ${X(l.ratio)} ${Y(l.mom)})`} /> : <circle cx={X(l.ratio)} cy={Y(l.mom)} r="6" fill={c} />}
            <text x={viTriNhan[r.id].trai ? X(l.ratio) - 10 : X(l.ratio) + 10} y={viTriNhan[r.id].y} textAnchor={viTriNhan[r.id].trai ? "end" : "start"} fontSize="12" fill="var(--chu)" stroke="var(--card)" strokeWidth="3.5" paintOrder="stroke" strokeLinejoin="round" style={sans} fontWeight={r.loai === "ma" || chon === r.id ? 700 : 600}>
              {r.nhanNgan}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RRGNganh({ du }) {
  const rrg = du?.rrg;
  const ketQua = useMemo(() => rrg?.ketQua ?? [], [rrg]);
  const chuoi = rrg?.chuoi;
  const [khung, datKhung] = useState("W");
  const [cuaSo, datCuaSo] = useState(MAC_DINH.W.cuaSo);
  const [duoi, datDuoi] = useState(MAC_DINH.W.duoi);
  const [bench, datBench] = useState("tb"); // tb = trung binh deu | vni = VN-Index
  const [xem, datXem] = useState(() => new Set()); // nganh DUOC CHON de xem (rong = xem tat ca)
  const [chiMa, datChiMa] = useState(false); // chi ve cac ma da them, khong ve nganh
  const [maCK, datMaCK] = useState([]); // [{ ma, gia: [..] | null, loi, dangTai }]
  const [nhapMa, datNhapMa] = useState("");
  const [chon, datChon] = useState(null);
  const [dongTien, setDongTien] = useState(null); // { ten -> rong (trieu dong) } hoac null

  useEffect(() => {
    let dung = false;
    fetch("/api/dong-tien", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (dung || !j?.du?.nganh?.length) return;
        setDongTien(Object.fromEntries(j.du.nganh.map((g) => [g.ten, g.rong])));
      })
      .catch(() => {});
    return () => {
      dung = true;
    };
  }, []);

  const doiKhung = (k) => {
    datKhung(k);
    datCuaSo(MAC_DINH[k].cuaSo);
    datDuoi(MAC_DINH[k].duoi);
  };

  async function themMa(ma) {
    const m = ma.trim().toUpperCase();
    datNhapMa("");
    if (!MA_HOP_LE.test(m) || maCK.some((x) => x.ma === m) || maCK.length >= TOI_DA_MA || !chuoi) return;
    datMaCK((c) => [...c, { ma: m, gia: null, loi: null, dangTai: true }]);
    try {
      const r = await fetch(`/api/gia-lich-su?ma=${m}&kt=D`);
      const j = await r.json();
      if (!r.ok || !j.nen?.length) throw new Error(j.thongBao || "Không có dữ liệu giá");
      const theoNgay = new Map(j.nen.map((b) => [b.t, b.c]));
      datMaCK((c) => c.map((x) => (x.ma === m ? { ma: m, gia: chuoi.ngay.map((t) => theoNgay.get(t) ?? null), loi: null, dangTai: false } : x)));
    } catch (e) {
      datMaCK((c) => c.map((x) => (x.ma === m ? { ma: m, gia: null, loi: e.message || "Lỗi tải giá", dangTai: false } : x)));
    }
  }

  const mocSoSanh = chuoi ? (bench === "vni" ? chuoi.vni : chuoi.tb) : null;
  // RRG cua TAT CA nganh theo bo loc khung / chu ky / duoi / benchmark (de chon nhanh "Dan dat" va to mau nut ngành)
  const nganhTatCa = useMemo(() => {
    if (!chuoi) return [];
    const ra = [];
    for (const r of ketQua) {
      if (!chuoi.nganh[r.nganh]) continue;
      const pts = tinhRRG(chuoi.ngay, chuoi.nganh[r.nganh], mocSoSanh, { khung, cuaSo, duoi });
      if (pts.length >= 2) ra.push({ id: r.nganh, loai: "nganh", nhan: r.nhan ?? r.nganh, nhanNgan: nganGon(r.nhan ?? r.nganh), soMa: r.soMa, pts, goc: gocRRG(pts.at(-1).ratio, pts.at(-1).mom), goc0: r });
    }
    return ra;
  }, [chuoi, ketQua, khung, cuaSo, duoi, mocSoSanh]);
  const bieuDo = useMemo(() => {
    if (!chuoi) return [];
    const ra = chiMa ? [] : nganhTatCa.filter((r) => xem.size === 0 || xem.has(r.id));
    for (const m of maCK) {
      if (!m.gia) continue;
      const pts = tinhRRG(chuoi.ngay, m.gia, mocSoSanh, { khung, cuaSo, duoi });
      if (pts.length >= 2) ra.push({ id: `ma:${m.ma}`, loai: "ma", nhan: m.ma, nhanNgan: m.ma, pts, goc: gocRRG(pts.at(-1).ratio, pts.at(-1).mom) });
    }
    return ra;
  }, [chuoi, nganhTatCa, xem, chiMa, maCK, khung, cuaSo, duoi, mocSoSanh]);

  if (!ketQua.length) return null;
  const rongCua = (r) => (dongTien && r.goc0 ? dongTien[r.nhan] ?? dongTien[r.id] ?? null : null);
  const sx = [...bieuDo].sort((a, b) => b.pts.at(-1).ratio - a.pts.at(-1).ratio);
  const dan = bieuDo.filter((r) => r.loai === "nganh" && r.goc === "Leading").length;
  const ngayVN = rrg.ngay ? rrg.ngay.split("-").reverse().join("/") : "";
  const doiXem = (id) => {
    datChiMa(false);
    datXem((c) => {
      const n = new Set(c);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const maLoi = maCK.filter((m) => m.loi);
  const donVi = khung === "W" ? "tuần" : "phiên";
  return (
    <section className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="RRG ngành">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }} data-may="rrg-nganh">
          RRG ngành — ngành nào đang dẫn dắt
        </h2>
        <span className="text-xs" style={{ color: MUTED }}>
          Dữ liệu đến {ngayVN} · {dan} ngành đang dẫn dắt
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        Mỗi ngành (hoặc mã) là một chấm: càng sang phải càng mạnh hơn mốc so sánh, càng lên cao càng đang tăng tốc. Đuôi là {duoi} {donVi} gần nhất — thường quay vòng Cải thiện → Dẫn dắt → Yếu dần → Tụt hậu. Bấm vào chấm để làm nổi bật.
      </p>

      {/* BO LOC */}
      {chuoi && (
        <div className="grid gap-2 mb-4 rounded-xl border p-3" style={{ borderColor: VIEN }} data-may="rrg-bo-loc">
          <Nhom ten="Khung">
            <Chip bat={khung === "W"} onClick={() => doiKhung("W")}>Tuần</Chip>
            <Chip bat={khung === "D"} onClick={() => doiKhung("D")}>Ngày</Chip>
            <span className="ml-3 text-[11px]" style={{ color: MUTED }}>Chu kỳ RS ({donVi})</span>
            {CHU_KY.map((n) => (
              <Chip key={n} bat={cuaSo === n} onClick={() => datCuaSo(n)} title="Số nến lấy trung bình để so sánh sức mạnh tương đối (RS-Ratio)">
                {n}
              </Chip>
            ))}
          </Nhom>
          <Nhom ten="Đuôi">
            {DUOI[khung].map((n) => (
              <Chip key={n} bat={duoi === n} onClick={() => datDuoi(n)}>
                {n}
              </Chip>
            ))}
            <span className="ml-3 text-[11px]" style={{ color: MUTED }}>So với</span>
            <Chip bat={bench === "tb"} onClick={() => datBench("tb")} title="Chỉ số trung bình đều các mã thanh khoản ≥ 2 tỷ/phiên">Trung bình đều</Chip>
            <Chip bat={bench === "vni"} onClick={() => datBench("vni")} title="VN-Index (tính theo vốn hoá)">VN-Index</Chip>
          </Nhom>
          <Nhom ten="Ngành">
            <Chip bat={xem.size === 0 && !chiMa} onClick={() => { datXem(new Set()); datChiMa(false); }}>Tất cả</Chip>
            <Chip bat={false} onClick={() => { datChiMa(false); datXem(new Set(nganhTatCa.filter((r) => r.goc === "Leading").map((r) => r.id))); }} title="Chọn các ngành đang ở góc Dẫn dắt">Đang dẫn dắt</Chip>
            {maCK.some((m) => m.gia) && <Chip bat={chiMa} onClick={() => datChiMa((c) => !c)} title="Chỉ vẽ các mã bạn đã thêm">Chỉ mã</Chip>}
            <span className="w-full" />
            {nganhTatCa.map((r) => (
              <Chip key={r.id} bat={!chiMa && xem.has(r.id)} onClick={() => doiXem(r.id)} title={`${NHAN_GOC[r.goc]}${r.nhan ? ` · ${r.nhan}` : ""}`}>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 99, background: MAU_GOC[r.goc], marginRight: 5 }} />
                {r.nhanNgan}
              </Chip>
            ))}
            <span className="text-[11px] w-full" style={{ color: MUTED }}>
              {xem.size === 0 ? "Đang xem tất cả ngành — bấm vào ngành để chỉ xem ngành đó." : `Đang xem ${xem.size} ngành đã chọn.`}
            </span>
          </Nhom>
          <Nhom ten="Mã CK">
            {maCK.map((m) => (
              <The key={m.ma} onBo={() => datMaCK((c) => c.filter((x) => x.ma !== m.ma))}>
                {m.ma}
                {m.dangTai ? "…" : m.loi ? " ⚠" : ""}
              </The>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                themMa(nhapMa);
              }}
              className="inline-flex items-center"
            >
              <input
                value={nhapMa}
                onChange={(e) => datNhapMa(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))}
                placeholder={maCK.length >= TOI_DA_MA ? `Tối đa ${TOI_DA_MA} mã` : "+ Thêm mã, Enter"}
                disabled={maCK.length >= TOI_DA_MA}
                aria-label="Thêm mã cổ phiếu vào RRG"
                className="px-3 py-1 rounded-full text-xs border"
                style={{ borderColor: VIEN, background: "transparent", color: "var(--chu)", width: 170, ...sans }}
              />
            </form>
            {maLoi.length > 0 && (
              <span className="text-[11px]" style={{ color: DO }}>
                {maLoi.map((m) => `${m.ma}: ${m.loi}`).join(" · ")}
              </span>
            )}
          </Nhom>
        </div>
      )}

      {bieuDo.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: MUTED }}>
          Không có đủ dữ liệu với bộ lọc này (chu kỳ RS dài hơn lịch sử) — chọn chu kỳ ngắn hơn hoặc khung Ngày.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div>
            <BieuDo ds={bieuDo} chon={chon} datChon={datChon} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ color: MUTED }}>
                  <th className="py-1.5 pr-2 font-normal">Ngành / mã</th>
                  <th className="py-1.5 px-2 font-normal">Góc</th>
                  <th className="py-1.5 px-2 font-normal text-right">RS-Ratio</th>
                  <th className="py-1.5 px-2 font-normal text-right">Momentum</th>
                  <th className="py-1.5 px-2 font-normal text-right" data-may="rrg-nong">Nóng</th>
                  <th className="py-1.5 px-2 font-normal text-right" data-may="rrg-tien-rong">Tiền ròng ước tính</th>
                  {dongTien && <th className="py-1.5 pl-2 font-normal text-right" title="Mua chủ động trừ bán chủ động hôm nay (DNSE, thành viên đã duyệt)">Ròng chủ động</th>}
                </tr>
              </thead>
              <tbody>
                {sx.map((r) => {
                  const l = r.pts.at(-1);
                  const rong = rongCua(r);
                  return (
                    <tr key={r.id} className="border-t cursor-pointer" style={{ borderColor: "var(--vien-nhe)", opacity: !chon || chon === r.id ? 1 : 0.4 }} onClick={() => datChon(chon === r.id ? null : r.id)}>
                      <td className="py-1.5 pr-2">
                        {r.loai === "ma" ? <b>{r.nhan}</b> : r.nhan} <span className="text-[11px]" style={{ color: MUTED }}>{r.loai === "ma" ? "(mã)" : `(${r.soMa})`}</span>
                      </td>
                      <td className="py-1.5 px-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap" style={{ color: MAU_GOC[r.goc], borderColor: MAU_GOC[r.goc] }}>
                          {NHAN_GOC[r.goc]}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right" style={{ fontWeight: 600 }}>{f1(l.ratio)}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: mau(l.mom - 100, 0) }}>{f1(l.mom)}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: r.goc0 ? (r.goc0.nongDongTien >= 1.1 ? XANH : r.goc0.nongDongTien < 0.8 ? DO : "var(--chu)") : MUTED }}>{r.goc0 ? `${f1(r.goc0.nongDongTien, 2)}×` : "—"}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: r.goc0 ? mau(r.goc0.tienRong5p, 5) : MUTED }}>{r.goc0 ? `${dau(r.goc0.tienRong5p)}%` : "—"}</td>
                      {dongTien && (
                        <td className="py-1.5 pl-2 text-right" style={{ color: mau(rong) }}>
                          {rong == null ? "—" : `${dau(rong / 1000, 0)} tỷ`}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
        Mốc so sánh mặc định là chỉ số trung bình đều các mã thanh khoản ≥ 2 tỷ/phiên (VN-Index tính theo vốn hoá nên VIC, VHM, ngân hàng kéo, ngành nào cũng “thắng” nó). Chu kỳ RS càng ngắn đồ thị càng nhạy nhưng nhiễu hơn. <b>Nóng</b> = giá trị giao dịch 5 phiên / mức thường lệ 10 tuần trước.{" "}
        <b>Tiền ròng ước tính</b> chỉ đo giá đóng cửa nghiêng về đầu cao hay đầu thấp của nến theo giá trị giao dịch, không phải mua/bán chủ động thật; hai cột này chỉ có cho ngành. Ngành dưới 3 mã đủ thanh khoản không được vẽ. Mã cổ phiếu hình thoi, nét đứt. Không phải khuyến nghị đầu tư.
      </p>
    </section>
  );
}
