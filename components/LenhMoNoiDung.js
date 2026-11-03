"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import BangLenhMo, { LOC_LENH_MO_TRONG, locLenhMo } from "@/components/BangLenhMo";
import HieuSuatVsVnindex from "@/components/HieuSuatVsVnindex";
import { pct, chamTPCaoNhat, pctChotLoi, tinhVungLenh, nhe } from "@/components/dungChung";
import { coCanhBaoBanBot } from "@/lib/ghiChuTuDong";
import { nhomCanChuY } from "@/lib/canChuYLenh";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const DO = "var(--do)";
const XANH = "var(--xanh)";
const PRIMARY = "#6C5CE7";
const TIM = "var(--tim-nhat)";

// 1 o trong dai thong ke gon
function OThongKe({ nhan, so, mau, phu }) {
  return (
    <div className="px-4 py-3 min-w-0">
      <p className="text-xs" style={{ color: MUTED }}>
        {nhan}
      </p>
      <p className="text-xl leading-tight" style={{ fontFamily: "var(--font-chu)", fontWeight: 700, color: mau }}>
        {so}
      </p>
      {phu && (
        <p className="text-xs" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

// CAN CHU Y HOM NAY: lenh can xu ly len dau trang (kieu "viec can lam" cua app moi gioi) - lib/canChuYLenh.js. Bam ma de mo trang ma.
function KhoiCanChuY({ nhom, onXemHet }) {
  if (nhom.length === 0) {
    return (
      <div className="rounded-2xl border px-4 py-3 mb-5 flex items-center gap-2 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: "var(--chu-2)" }}>
        <CircleCheck size={17} color={XANH} aria-hidden="true" />
        Hôm nay không có lệnh nào cần xử lý gấp (không Mắt Thần, không lệnh trong vùng cắt lỗ, không cảnh báo bán bớt).
      </div>
    );
  }
  return (
    <section className="mb-5" aria-label="Cần chú ý hôm nay">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 className="text-base" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
          Cần chú ý hôm nay
        </h2>
        <button type="button" onClick={onXemHet} className="text-xs" style={{ color: PRIMARY }}>
          Lọc bảng theo các lệnh này →
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {nhom.map((n) => (
          <div key={n.khoa} className="rounded-2xl border p-3.5" style={{ borderColor: nhe(n.mau, 40), background: nhe(n.mau, 7) }}>
            <p className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold" style={{ color: n.mau, fontFamily: "var(--font-chu)" }}>
                {n.nhan}
              </span>
              <span className="text-lg font-bold" style={{ color: n.mau, fontFamily: "var(--font-chu)" }}>
                {n.ds.length}
              </span>
            </p>
            <p className="text-xs mb-2" style={{ color: "var(--chu-2)" }}>
              {n.viec}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {n.ds.slice(0, 8).map((r) => (
                <Link key={r.khoa_lenh ?? r.ma} href={`/ma/${r.ma}`} className="text-xs px-2 py-0.5 rounded-md border hover:underline" style={{ borderColor: VIEN, background: NEN_CARD, fontFamily: "var(--font-chu)" }}>
                  <b>{r.ten_lenh ?? r.ma}</b> <span style={{ color: r.lai_lo_pct >= 0 ? XANH : DO }}>{pct(r.lai_lo_pct, 1)}</span>
                </Link>
              ))}
              {n.ds.length > 8 && (
                <span className="text-xs px-1 py-0.5" style={{ color: MUTED }}>
                  +{n.ds.length - 8}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Phan than trang So lenh dang mo: Can chu y -> thanh tab -> (dai thong ke + bang) | bieu do so sanh VNINDEX. Bo loc nam O DAY (khong o trong bang) de
// bam loc thi CA thong ke lan bieu do doi theo, khong chi bang.
// MOT DANH SACH DUY NHAT: moi LENH la 1 dong rieng (lenhDangMo, tinh o trang cha): lenh dau + cac lenh MUA MOI (dot sau) cua ma; ma co nhieu lenh thi danh so (1), (2).
// Khoi "Hieu qua dau tu" (components/HieuQuaDauTu.js, /api/hieu-qua-he-thong) da TAT khoi giao dien theo yeu cau cua Hieu 29/10/2026; ma nguon van con de bat lai.
const CAC_TAB = ["lenh", "tungMa"];

// tabDau: the mo san (lenh | tungMa).
export default function LenhMoNoiDung({ lenhMo, vnindex, tabDau }) {
  const tabBanDau = CAC_TAB.includes(tabDau) ? tabDau : "lenh";
  const [loc, datLoc] = useState(LOC_LENH_MO_TRONG);
  const [tab, setTab] = useState(tabBanDau);
  const lenhGop = lenhMo;
  const soMuaMoiHomNay = useMemo(() => lenhGop.filter((r) => r.la_lenh_moi && r.mua_moi_hom_nay).length, [lenhGop]);
  const daLoc = useMemo(() => locLenhMo(lenhGop, loc), [lenhGop, loc]);
  const canChuY = useMemo(() => nhomCanChuY(lenhGop, { tinhVung: tinhVungLenh, banBot: coCanhBaoBanBot }), [lenhGop]);

  // Thong ke nhanh cac lenh DANG HIEN (sau loc) - khong tinh lenh da dong, vi trang nay chi hien vi the mo.
  const tk = useMemo(() => {
    const soLenh = daLoc.length;
    const soLai = daLoc.filter((r) => r.lai_lo_pct > 0).length;
    const soLo = daLoc.filter((r) => r.lai_lo_pct < 0).length;
    // Ty le chot loi = % SO LENH da cham it nhat 1 muc TP tren tong so lenh dang hien (khong phai lai TB).
    const daChotLoi = daLoc.filter((r) => chamTPCaoNhat(r) != null);
    return {
      soLenh,
      soMa: new Set(daLoc.map((r) => r.ma)).size,
      soLai,
      soLo,
      tyLeLai: soLenh ? (soLai / soLenh) * 100 : 0,
      tyLeLo: soLenh ? (soLo / soLenh) * 100 : 0,
      laiLoTB: soLenh ? daLoc.reduce((tong, r) => tong + (r.lai_lo_pct ?? 0), 0) / soLenh : 0,
      soDaChotLoi: daChotLoi.length,
      tyLeChotLoi: soLenh ? (daChotLoi.length / soLenh) * 100 : 0,
      chotLoiTB: daChotLoi.length ? daChotLoi.reduce((tong, r) => tong + (pctChotLoi(r) ?? 0), 0) / daChotLoi.length : 0,
    };
  }, [daLoc]);

  const dangLoc = daLoc.length !== lenhGop.length;

  const TABS = [
    ["lenh", "Danh sách lệnh", lenhGop.length, soMuaMoiHomNay > 0 ? TIM : null],
    ["tungMa", "So sánh với VN-Index", null, null],
  ];

  return (
    <>
      <KhoiCanChuY
        nhom={canChuY}
        onXemHet={() => {
          setTab("lenh");
          datLoc({ ...LOC_LENH_MO_TRONG, chiCanChuY: true });
        }}
      />

      <div className="inline-flex max-w-full overflow-x-auto rounded-xl p-1 mb-4 gap-1" style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, fontFamily: "var(--font-chu)" }} role="tablist">
        {TABS.map(([k, nhan, dem, mauDem]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className="px-4 py-2 rounded-lg text-sm whitespace-nowrap flex items-center gap-2"
            style={tab === k ? { background: PRIMARY, color: "#fff", fontWeight: 700 } : { color: MUTED }}
          >
            {nhan}
            {dem != null && (
              <span className="text-[11px] px-1.5 rounded-full" style={tab === k ? { background: "rgba(255,255,255,0.2)" } : { background: mauDem ? "rgba(167,139,250,0.15)" : "var(--vien-nhe)", color: mauDem ?? MUTED }}>
                {dem}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: dai thong ke gon (doi theo bo loc) + bang */}
      <div className={tab === "lenh" ? "" : "hidden"}>
        {/* o cach nhau 1px tren nen vien = duong ke luoi gon */}
        <div className="rounded-2xl border mb-4 grid grid-cols-2 sm:grid-cols-5 gap-px overflow-hidden [&>*]:bg-[color:var(--card)] [&>*:first-child]:max-sm:col-span-2" style={{ borderColor: VIEN, background: "var(--vien-nhe)" }}>
          <OThongKe nhan={dangLoc ? "Lệnh khớp bộ lọc" : "Lệnh đang mở"} so={tk.soLenh} phu={tk.soMa < tk.soLenh ? `của ${tk.soMa} mã` : dangLoc ? `trên ${lenhGop.length}` : null} />
          <OThongKe nhan="Đang lãi" so={`${tk.tyLeLai.toFixed(0)}%`} mau={XANH} phu={`${tk.soLai} lệnh`} />
          <OThongKe nhan="Đang lỗ" so={`${tk.tyLeLo.toFixed(0)}%`} mau={DO} phu={`${tk.soLo} lệnh`} />
          <OThongKe nhan="Lãi/lỗ trung bình" so={pct(tk.laiLoTB, 2)} mau={tk.laiLoTB >= 0 ? XANH : DO} phu="chưa trừ phí" />
          <OThongKe nhan="Đã chạm chốt lời" so={`${tk.tyLeChotLoi.toFixed(0)}%`} mau="var(--vang)" phu={tk.soDaChotLoi > 0 ? `${tk.soDaChotLoi} lệnh · TB ${pct(tk.chotLoiTB, 1)}` : "0 lệnh"} />
        </div>

        <BangLenhMo duLieu={lenhGop} loc={loc} datLoc={datLoc} />
      </div>

      <div className={tab === "tungMa" ? "" : "hidden"}>
        {dangLoc && (
          <p className="text-xs mb-2" style={{ color: MUTED }}>
            Biểu đồ đang tính trên <b>{daLoc.length}</b> / {lenhGop.length} lệnh khớp bộ lọc ở tab Danh sách lệnh.
          </p>
        )}
        <HieuSuatVsVnindex ds={daLoc} vnindex={vnindex} />
      </div>
    </>
  );
}
