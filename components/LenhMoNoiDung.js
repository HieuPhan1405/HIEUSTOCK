"use client";

import { useMemo, useState } from "react";
import TraCuuMa from "@/components/TraCuuMa";
import BangLenhMo, { LOC_LENH_MO_TRONG, locLenhMo } from "@/components/BangLenhMo";
import HieuSuatVsVnindex from "@/components/HieuSuatVsVnindex";
import HieuQuaDauTu from "@/components/HieuQuaDauTu";
import { pct, chamTPCaoNhat, pctChotLoi } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const DO = "#EF4444";
const XANH = "#22C55E";
const PRIMARY = "#6C5CE7";
const TIM = "#A78BFA";

function The({ so, mau, nhan, phu, mauPhu }) {
  return (
    <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: mau }}>
        {so}
      </p>
      <p className="text-xs mt-1" style={{ color: MUTED }}>
        {nhan}
      </p>
      {phu && (
        <p className="text-[11px]" style={{ color: mauPhu ?? MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

// Phan than trang So lenh dang mo: the thong ke + bieu do so sanh VNINDEX + bang. Bo loc nam O DAY (khong o trong bang) de
// bam loc (vd "chi ma dat chuan") thi CA thong ke lan bieu do doi theo, khong chi bang.
// MOT DANH SACH DUY NHAT: lenh goc + cac diem mua them / mua moi gop chung (gopLenhMo, gop o trang cha) - 1 ma co the co 2 dong, dong mua them co ghi chu rieng. Gia von
// trung binh (chon "da mua dot dau chua") khong o day ma nam trong trang tung ma (components/TheGiaVon.js). Lenh DA CHAM TP3 (ket thuc lenh) da bi loc bo o trang cha.
const CAC_TAB = ["lenh", "hieuQua", "tungMa"];

// tabDau: the mo san; locDau: "them" (chi lenh mua them) | "goc" - dung cho lien ket tu trang dau (/lenh-mo?loai=them).
export default function LenhMoNoiDung({ lenhMo, vnindex, tabDau, locDau }) {
  const tabBanDau = CAC_TAB.includes(tabDau) ? tabDau : "lenh";
  const [loc, datLoc] = useState({ ...LOC_LENH_MO_TRONG, loai: locDau === "them" || locDau === "goc" ? locDau : "" });
  // THANH GAT (tab) gom cac khoi phu de trang khong roi: mac dinh chi hien danh sach lenh. Khoi Hieu qua chi tai du lieu khi mo lan dau, roi giu nguyen
  // (an di chu khong go bo) de khong tai lai.
  const [tab, setTab] = useState(tabBanDau);
  const [daMoHieuQua, setDaMoHieuQua] = useState(tabBanDau === "hieuQua");
  const chonTab = (t) => {
    setTab(t);
    if (t === "hieuQua") setDaMoHieuQua(true);
  };
  const lenhGop = lenhMo;
  const soMuaThem = lenhGop.filter((r) => r.la_mua_them).length;
  const soMuaThemHomNay = useMemo(() => lenhGop.filter((r) => r.la_mua_them && r.mua_them_hom_nay).length, [lenhGop]);
  const daLoc = useMemo(() => locLenhMo(lenhGop, loc), [lenhGop, loc]);

  // Thong ke nhanh hieu qua cac lenh DANG HIEN (sau loc, gom ca dong mua them - moi dong la 1 lenh) - khong tinh lenh da dong, vi trang nay chi hien vi the mo.
  const tk = useMemo(() => {
    const soLenh = daLoc.length;
    const soLai = daLoc.filter((r) => r.lai_lo_pct > 0).length;
    const soLo = daLoc.filter((r) => r.lai_lo_pct < 0).length;
    // Ty le chot loi = % SO LENH da cham it nhat 1 muc TP tren tong so lenh dang hien (giong Ty le lai/Ty le lo, khong phai lai TB).
    const daChotLoi = daLoc.filter((r) => chamTPCaoNhat(r) != null);
    return {
      soLenh,
      soMuaThem: daLoc.filter((r) => r.la_mua_them).length,
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
    ["lenh", "Lệnh đang mở", lenhGop.length, soMuaThemHomNay > 0 ? TIM : null],
    ["hieuQua", "Hiệu quả", null, null],
    ["tungMa", "So sánh từng mã", null, null],
  ];

  return (
    <>
      <div className="inline-flex max-w-full overflow-x-auto rounded-xl p-1 mb-6 gap-1" style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, fontFamily: "'Inter', sans-serif" }} role="tablist">
        {TABS.map(([k, nhan, dem, mauDem]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => chonTab(k)}
            className="px-4 py-2 rounded-lg text-sm whitespace-nowrap flex items-center gap-2"
            style={tab === k ? { background: PRIMARY, color: "#fff", fontWeight: 700 } : { color: MUTED }}
          >
            {nhan}
            {dem != null && (
              <span
                className="text-[11px] px-1.5 rounded-full"
                style={tab === k ? { background: "rgba(255,255,255,0.2)" } : { background: mauDem ? "rgba(167,139,250,0.15)" : "#1D1D26", color: mauDem ?? MUTED }}
              >
                {dem}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: LENH DANG MO - the thong ke (doi theo bo loc) + bang co bo loc (lenh goc va lenh mua them chung 1 danh sach) */}
      <div className={tab === "lenh" ? "" : "hidden"}>
      {dangLoc && (
        <p className="text-xs mb-2" style={{ color: MUTED }}>
          Thống kê bên dưới đang tính trên <b>{daLoc.length}</b> / {lenhGop.length} lệnh khớp bộ lọc.
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <The
          so={tk.soLenh}
          nhan="Lệnh đang mở"
          phu={tk.soMuaThem > 0 ? `gồm ${tk.soMuaThem} lệnh mua thêm` : dangLoc ? `trên tổng ${lenhGop.length}` : undefined}
          mauPhu={tk.soMuaThem > 0 ? TIM : undefined}
        />
        <The so={`${tk.tyLeLai.toFixed(0)}%`} mau={XANH} nhan={`Tỷ lệ lãi (${tk.soLai} lệnh)`} />
        <The so={`${tk.tyLeLo.toFixed(0)}%`} mau={DO} nhan={`Tỷ lệ lỗ (${tk.soLo} lệnh)`} />
        <The so={pct(tk.laiLoTB, 2)} mau={tk.laiLoTB >= 0 ? XANH : DO} nhan="Lãi/lỗ trung bình" />
        <The
          so={`${tk.tyLeChotLoi.toFixed(0)}%`}
          mau="#FBBF24"
          nhan={`Tỷ lệ chốt lời (${tk.soDaChotLoi} lệnh)`}
          phu={tk.soDaChotLoi > 0 ? `TB ${pct(tk.chotLoiTB, 2)}/lệnh` : undefined}
          mauPhu={tk.chotLoiTB >= 0 ? XANH : DO}
        />
      </div>

      <BangLenhMo duLieu={lenhGop} loc={loc} datLoc={datLoc} />
      {soMuaThem > 0 && (
        <p className="text-[11px] mt-3" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          Mã có lệnh mua thêm hiện nút <b style={{ color: TIM }}>➕ mua thêm ▾</b> ngay dưới tên mã: bấm để mở / ẩn lệnh mua thêm, dòng mở ra gắn liền dưới lệnh gốc. Lệnh mua thêm có giá mua, cắt lỗ, chốt lời riêng nên lãi/lỗ ở dòng đó tính theo giá mua thêm; muốn xem{" "}
          <b>giá vốn trung bình</b> khi bạn đã mua đợt đầu, mở trang của mã đó.
        </p>
      )}

      <div className="mt-8 max-w-md rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Tra cứu mã khác
        </p>
        <TraCuuMa />
      </div>
      </div>

      {/* TAB 2: HIEU QUA - duong TSSL cua he thong vs VN-Index theo thoi gian */}
      {daMoHieuQua && (
        <div className={tab === "hieuQua" ? "" : "hidden"}>
          <HieuQuaDauTu />
        </div>
      )}

      {/* TAB 3: SO SANH TUNG MA voi VN-Index cung ky (theo bo loc o tab Lenh dang mo) */}
      <div className={tab === "tungMa" ? "" : "hidden"}>
        {dangLoc && (
          <p className="text-xs mb-2" style={{ color: MUTED }}>
            Biểu đồ đang tính trên <b>{daLoc.length}</b> / {lenhGop.length} lệnh khớp bộ lọc ở tab Lệnh đang mở.
          </p>
        )}
        <HieuSuatVsVnindex ds={daLoc} vnindex={vnindex} />
      </div>
    </>
  );
}
