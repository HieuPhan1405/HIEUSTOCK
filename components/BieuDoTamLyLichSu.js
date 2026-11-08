"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { nhe } from "@/components/dungChung";
import GiaiThichThem from "@/components/GiaiThichThem";

// Bieu do LICH SU "tam ly thi truong" (xap xi 3 ty le breadth, 2013 -> nay) + VN-Index, vung < 20 (qua ban / hoang loan) to do.
// Du lieu lich su sinh tinh boi scripts/capNhatTamLyLichSu.mjs (tai muon, khong nam trong bundle trang); diem cuoi "truc tiep" do Dashboard truyen vao (cung cong thuc 3 ty le).
// Dau hieu: tron do = lan dau chi so < 20 sau >= 20 phien khong < 20; tam giac xanh = VN-Index dong cua vuot dinh 5 phien (xac nhan, trong 15 phien sau tin hieu).
// Kiem chung (engine/dich-vu/nghienCuuTamLyDay.mjs): vung qua ban, KHONG phai diem day chinh xac.

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const DO = "var(--do)";
const XANH = "var(--xanh)";
const TIM = "var(--tim-nhat)";
const mono = { fontFamily: "var(--font-chu)" };

const NGUONG = 20;
const KHOANG = [
  { nhan: "1 năm", phien: 250 },
  { nhan: "3 năm", phien: 750 },
  { nhan: "5 năm", phien: 1250 },
  { nhan: "Tất cả", phien: Infinity },
];
const LE = { trai: 34, phai: 10, tren: 8, duoi: 22 };
const CAO_VNI = 110;
const CAO_TL = 150;
const KHE = 16;

const ngayVN = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const soVN = (x, n = 1) => x.toLocaleString("vi-VN", { minimumFractionDigits: n, maximumFractionDigits: n });

// tin hieu (lan dau < NGUONG sau >= 20 phien) + phien xac nhan (dong cua VN-Index > dinh 5 phien truoc, trong 15 phien)
function tinhSuKien(s, v) {
  const kq = [];
  let cuoi = -1e9;
  for (let i = 0; i < s.length; i++) {
    if (s[i] >= NGUONG) continue;
    if (i - cuoi >= 20) {
      let xn = null;
      for (let j = i + 1; j <= Math.min(s.length - 1, i + 15); j++) {
        let dinh = -Infinity;
        for (let k = Math.max(0, j - 5); k < j; k++) dinh = Math.max(dinh, v[k]);
        if (v[j] > dinh) {
          xn = j;
          break;
        }
      }
      kq.push({ i, xn });
    }
    cuoi = i;
  }
  return kq;
}

// props: hienTai = { ngay: "YYYY-MM-DD", s: tam ly 3 ty le hom nay, v: VN-Index } | null (diem truc tiep sau ngay cuoi cua lich su)
export default function BieuDoTamLyLichSu({ hienTai = null }) {
  const [goc, setGoc] = useState(null);
  const [loi, setLoi] = useState(false);
  const [khoang, setKhoang] = useState(1);
  const [rong, setRong] = useState(0);
  const [chon, setChon] = useState(null);
  const khung = useRef(null);

  useEffect(() => {
    let huy = false;
    import("@/lib/tamLyLichSuDuLieu")
      .then((m) => !huy && setGoc(m.TAM_LY_LICH_SU))
      .catch(() => !huy && setLoi(true));
    return () => {
      huy = true;
    };
  }, []);

  useEffect(() => {
    const el = khung.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRong(Math.floor(el.getBoundingClientRect().width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // chuoi day du = lich su + diem truc tiep (neu moi hon ngay cuoi lich su)
  const day = useMemo(() => {
    if (!goc) return null;
    const t = [...goc.t];
    const s = [...goc.s];
    const v = [...goc.v];
    let truc = -1;
    if (hienTai && hienTai.ngay > t.at(-1) && Number.isFinite(hienTai.s) && Number.isFinite(hienTai.v)) {
      t.push(hienTai.ngay);
      s.push(+hienTai.s.toFixed(1));
      v.push(+hienTai.v.toFixed(1));
      truc = t.length - 1;
    }
    return { t, s, v, truc, suKien: tinhSuKien(s, v) };
  }, [goc, hienTai]);

  if (loi) return null;

  const cx = Math.max(rong, 280);
  const dai = cx - LE.trai - LE.phai;
  const tongCao = LE.tren + CAO_VNI + KHE + CAO_TL + LE.duoi;
  let noiDung = null;
  let ghiChu = null;

  if (day && rong > 0) {
    const n = day.t.length;
    const tu = Math.max(0, n - KHOANG[khoang].phien);
    const m = n - tu;
    const x = (i) => LE.trai + ((i - tu) / Math.max(1, m - 1)) * dai;
    let vmin = Infinity;
    let vmax = -Infinity;
    for (let i = tu; i < n; i++) {
      vmin = Math.min(vmin, day.v[i]);
      vmax = Math.max(vmax, day.v[i]);
    }
    const bien = (vmax - vmin) * 0.06 || 1;
    const yV = (g) => LE.tren + CAO_VNI - ((g - (vmin - bien)) / (vmax - vmin + 2 * bien)) * CAO_VNI;
    const goc2 = LE.tren + CAO_VNI + KHE;
    const yS = (g) => goc2 + CAO_TL - (g / 100) * CAO_TL;

    const duongTruoc = (arr, y, den) => {
      let d = "";
      for (let i = tu; i <= den; i++) d += `${i === tu ? "M" : "L"}${x(i).toFixed(1)} ${y(arr[i]).toFixed(1)}`;
      return d;
    };
    const denLichSu = day.truc >= 0 ? day.truc - 1 : n - 1;
    const dV = duongTruoc(day.v, yV, denLichSu);
    const dS = duongTruoc(day.s, yS, denLichSu);
    const noiTruc = day.truc >= 0 && denLichSu >= tu ? `M${x(denLichSu).toFixed(1)} ${yS(day.s[denLichSu]).toFixed(1)}L${x(day.truc).toFixed(1)} ${yS(day.s[day.truc]).toFixed(1)}` : null;
    const noiTrucV = day.truc >= 0 && denLichSu >= tu ? `M${x(denLichSu).toFixed(1)} ${yV(day.v[denLichSu]).toFixed(1)}L${x(day.truc).toFixed(1)} ${yV(day.v[day.truc]).toFixed(1)}` : null;

    // vung < NGUONG: to do phan duong S nam duoi 20 -> ve khoi chu nhat toan chieu ngang duoi vach 20, ben trai la nen nhe; chi to dam cac doan S < 20
    const doanQuaBan = [];
    let batDau = -1;
    for (let i = tu; i < n; i++) {
      if (day.s[i] < NGUONG) {
        if (batDau < 0) batDau = i;
      } else if (batDau >= 0) {
        doanQuaBan.push([batDau, i - 1]);
        batDau = -1;
      }
    }
    if (batDau >= 0) doanQuaBan.push([batDau, n - 1]);

    const nam = [];
    let namTruoc = null;
    for (let i = tu; i < n; i++) {
      const y = day.t[i].slice(0, 4);
      if (y !== namTruoc) {
        nam.push([i, y]);
        namTruoc = y;
      }
    }
    // thua nhan nam neu qua day (<= ~1 nhan / 48px)
    const buocNam = Math.max(1, Math.ceil(nam.length / Math.max(1, Math.floor(dai / 48))));
    const nhanNam = nam.filter((_, k) => k % buocNam === 0);

    const sk = day.suKien.filter((e) => e.i >= tu);
    const iHien = chon ?? n - 1;
    const iDung = Math.min(n - 1, Math.max(tu, iHien));
    const vung = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const i = tu + Math.round(((e.clientX - r.left - LE.trai) / dai) * (m - 1));
      setChon(Math.min(n - 1, Math.max(tu, i)));
    };
    const laTruc = iDung === day.truc;
    const nhanTT = day.s[iDung] < NGUONG ? "Quá bán / hoảng loạn" : day.s[iDung] < 40 ? "Lo ngại" : day.s[iDung] < 60 ? "Trung lập" : day.s[iDung] < 80 ? "Lạc quan" : "Hưng phấn";
    ghiChu = (
      <p className="text-xs mb-2 flex flex-wrap gap-x-4 gap-y-1" style={{ color: MUTED, ...mono }} aria-live="polite">
        <span>
          {ngayVN(day.t[iDung])}
          {laTruc ? " (trực tiếp)" : ""}
        </span>
        <span>
          Tâm lý <b style={{ color: day.s[iDung] < NGUONG ? DO : TEXT }}>{soVN(day.s[iDung])}</b> · {nhanTT}
        </span>
        <span>
          VN-Index <b style={{ color: TEXT }}>{soVN(day.v[iDung])}</b>
        </span>
      </p>
    );

    noiDung = (
      <svg width={cx} height={tongCao} role="img" aria-label="Biểu đồ lịch sử tâm lý thị trường và VN-Index; vùng dưới 20 là quá bán" style={{ display: "block", touchAction: "pan-y" }}>
        {/* luoi + truc */}
        {[0, 20, 50, 80].map((g) => (
          <g key={g}>
            <line x1={LE.trai} x2={LE.trai + dai} y1={yS(g)} y2={yS(g)} stroke={g === NGUONG ? nhe(DO, 55) : VIEN} strokeWidth="1" strokeDasharray={g === NGUONG ? "4 3" : undefined} />
            <text x={LE.trai - 6} y={yS(g) + 3.5} textAnchor="end" fontSize="10.5" fill={g === NGUONG ? DO : MUTED} style={mono}>
              {g}
            </text>
          </g>
        ))}
        <rect x={LE.trai} y={yS(NGUONG)} width={dai} height={yS(0) - yS(NGUONG)} fill={nhe(DO, 7)} />
        {[0, 1, 2, 3].map((k) => {
          const g = vmin - bien + ((vmax - vmin + 2 * bien) * k) / 3;
          return (
            <g key={k}>
              <line x1={LE.trai} x2={LE.trai + dai} y1={yV(g)} y2={yV(g)} stroke={VIEN} strokeWidth="1" />
              <text x={LE.trai - 6} y={yV(g) + 3.5} textAnchor="end" fontSize="10.5" fill={MUTED} style={mono}>
                {Math.round(g)}
              </text>
            </g>
          );
        })}
        {nhanNam.map(([i, y]) => (
          <text key={y} x={x(i)} y={tongCao - 6} textAnchor="middle" fontSize="10.5" fill={MUTED} style={mono}>
            {y}
          </text>
        ))}

        {/* VN-Index */}
        <path d={dV} fill="none" stroke={TEXT} strokeWidth="1.4" strokeLinejoin="round" opacity="0.85" />
        {noiTrucV && <path d={noiTrucV} fill="none" stroke={TEXT} strokeWidth="1.4" strokeDasharray="3 3" opacity="0.6" />}

        {/* doan qua ban to dam tren duong tam ly */}
        {doanQuaBan.map(([a, b]) => (
          <rect key={a} x={x(a) - 0.5} y={goc2} width={Math.max(1.5, x(b) - x(a) + 1)} height={CAO_TL} fill={nhe(DO, 16)} />
        ))}
        <path d={dS} fill="none" stroke={TIM} strokeWidth="1.6" strokeLinejoin="round" />
        {noiTruc && <path d={noiTruc} fill="none" stroke={TIM} strokeWidth="1.6" strokeDasharray="3 3" />}

        {/* tin hieu < 20 va xac nhan */}
        {sk.map((e) => (
          <g key={e.i}>
            <line x1={x(e.i)} x2={x(e.i)} y1={LE.tren} y2={goc2 + CAO_TL} stroke={nhe(DO, 16)} strokeWidth="1" />
            <circle cx={x(e.i)} cy={yS(day.s[e.i])} r="4" fill={NEN_CARD} stroke={DO} strokeWidth="2" />
            {e.xn != null && e.xn >= tu && <path d={`M${x(e.xn)} ${yV(day.v[e.xn]) - 7}l4.5 8h-9z`} fill={XANH} stroke={NEN_CARD} strokeWidth="1" />}
          </g>
        ))}

        {/* diem dang xem */}
        <line x1={x(iDung)} x2={x(iDung)} y1={LE.tren} y2={goc2 + CAO_TL} stroke={MUTED} strokeWidth="1" opacity="0.7" />
        <circle cx={x(iDung)} cy={yV(day.v[iDung])} r="3.5" fill={TEXT} stroke={NEN_CARD} strokeWidth="1.5" />
        <circle cx={x(iDung)} cy={yS(day.s[iDung])} r="4" fill={TIM} stroke={NEN_CARD} strokeWidth="1.5" />

        <rect x={LE.trai} y={0} width={dai} height={tongCao - LE.duoi} fill="transparent" onPointerMove={vung} onPointerDown={vung} onPointerLeave={() => setChon(null)} />
      </svg>
    );
  }

  const dangQuaBan = day && day.s.at(-1) < NGUONG;

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="text-lg" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
          Lịch sử tâm lý thị trường
        </h2>
        <div className="flex gap-1" role="group" aria-label="Khoảng thời gian">
          {KHOANG.map((k, i) => (
            <button
              key={k.nhan}
              type="button"
              onClick={() => setKhoang(i)}
              aria-pressed={i === khoang}
              className="px-2.5 py-1 rounded-md text-xs"
              style={{ border: `1px solid ${i === khoang ? "#8B5CF6" : VIEN}`, background: i === khoang ? nhe("#8B5CF6", 22) : "transparent", color: i === khoang ? TEXT : MUTED, ...mono }}
            >
              {k.nhan}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        Vùng đỏ dưới 20 = quá bán / hoảng loạn.
      </p>

      {ghiChu}
      <div ref={khung} style={{ minHeight: tongCao }}>
        {noiDung ?? (
          <p className="text-sm py-10 text-center" style={{ color: MUTED }} aria-busy="true">
            Đang tải lịch sử…
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-[11px]" style={{ color: MUTED }}>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-4 h-0.5" style={{ background: TIM }} /> Tâm lý (0–100)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-4 h-0.5" style={{ background: TEXT, opacity: 0.85 }} /> VN-Index
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-3 h-3 rounded-full border-2" style={{ borderColor: DO }} /> Lần đầu xuống dưới 20
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="11" height="10" aria-hidden="true">
            <path d="M5.5 0l5 9h-10z" fill={XANH} />
          </svg>
          VN-Index đóng cửa vượt đỉnh 5 phiên (xác nhận)
        </span>
      </div>

      <div className="mt-4 pt-3 border-t text-xs leading-relaxed space-y-1.5" style={{ borderColor: "var(--vien-nhe)", color: MUTED }}>
        <p>
          <b style={{ color: TEXT }}>Dưới 20 là vùng quá bán, không phải điểm đáy.</b> Kiểm chứng 2013–2026: 17/21 đáy thật của VN-Index có chỉ số dưới 20 trong khoảng ±5 phiên, nhưng chỉ 13/26 lần chạm dưới 20 đầu tiên nằm gần đáy; VN-Index còn giảm thêm trung bình khoảng 4% trong 20 phiên sau, và trong các pha giảm kéo dài (2018, 2022, 2023, 2026) tín hiệu hiện sớm hơn đáy 26–53 phiên.
        </p>
        <p>
          Chờ VN-Index đóng cửa vượt đỉnh 5 phiên (tam giác xanh) làm mức giảm thêm còn khoảng 2% và giảm số lần còn rơi trên 5% từ 35% xuống 18%; lãi sau 20 phiên gần như không đổi, giá mua vẫn cao hơn đáy khoảng 7%. Hiệu ứng chỉ rõ trong ≤ 20 phiên, mẫu nhỏ (26 lần).
          {dangQuaBan && <b style={{ color: DO }}> Hiện chỉ số đang dưới 20.</b>}
        </p>
        <GiaiThichThem nhanMo="Cách tính">
          <p>
            Trung bình 3 tỷ lệ (mã tăng giá, mã trên Kijun, mã trên đường cân bằng dài hạn) tính trên các mã đang niêm yết, từ 2013. Chỉ số này xấp xỉ (không có tỷ lệ “mã đạt điểm MUA” như đồng hồ phía trên) và thiên lệch người sống sót; chỉ là thông tin tham khảo, không phải lệnh mua hay khuyến nghị tỷ trọng.
          </p>
        </GiaiThichThem>
      </div>
    </div>
  );
}
