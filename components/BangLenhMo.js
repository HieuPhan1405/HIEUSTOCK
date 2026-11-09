"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TriangleAlert, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import NutThamGia from "@/components/NutThamGia";
import NhanPhuTinHieu, { dsNhanPhu } from "@/components/NhanPhuTinHieu";
import { CAC_COT } from "@/components/cotChung";
import { NGANH_NHAN, LOC_TRONG, NHAN_UU_TIEN, locChung, coLocChung, OSelect, HangBoLocChung, useCotHienThi, ChonCotHienThi, HangLocNhanh } from "@/components/boLocChung";
import { fmt, pct, chuoiVung, tinhVungLenh, chamTPCaoNhat, datChuanUuTien, nhanLenhWeb } from "@/components/dungChung";
import { coCanhBaoBanBot } from "@/lib/ghiChuTuDong";
import { laCanChuY } from "@/lib/canChuYLenh";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const PRIMARY = "#6C5CE7";
const NGOC = "var(--cyan)";

const pillCua = (row) => <SignalPill tin={row.tin} banTheoDoiTu={row.ban_theo_doi ? row.ban_theo_doi_tu : null} webGiu={Array.isArray(row.lenh_web) && row.lenh_web.length > 0} muaTheoDoiTu={row.mua_theo_doi_tu ?? null} daChotMua={row.da_chot_mua === true} />;

// Cot ma + trang thai co logic rieng (nut Tham gia, canh bao Mat Than/Ban bot);
// cac cot chi so con lai lay tu cotChung.js - dung chung voi bang Bo loc.
const COT_RIENG = {
  ma: {
    nhan: "Mã CP",
    canPhai: false,
    lay: (r) => r.ma,
    // MOI LENH 1 DONG RIENG: ma co nhieu lenh mo thi ten_lenh = "VPB (1)", "VPB (2)" (danh so theo ngay mua, xem lenhDangMo). Lenh MUA MOI (dot sau khi bo qua lenh dau) co ghi chu rieng.
    hien: (row, ctx) => (
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <Link href={`/ma/${row.ma}`} className="flex items-center gap-1 hover:underline" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
            {row.mat_than && <TriangleAlert size={13} color={DO} strokeWidth={2} aria-label="Cảnh báo Mắt Thần" className="shrink-0" />}
            {row.ten_lenh ?? row.ma}
          </Link>
          {(row.so_lenh ?? 1) === 1 && (
            <NutThamGia ma={row.ma} soNguoiThamGia={ctx.banDoThamGia[row.ma]?.soNguoiThamGia ?? 0} daThamGia={ctx.banDoThamGia[row.ma]?.daThamGia ?? false} onDoiTrangThai={ctx.doiTrangThaiThamGia} />
          )}
        </div>
        {row.la_lenh_moi && (
          <span className="text-[11px] font-bold mt-0.5" data-may="mua-moi" style={{ color: NGOC, fontFamily: "var(--font-chu)" }} title="Lệnh mua mới (đợt sau): có giá mua, mức cắt lỗ, chốt lời và lãi/lỗ tính riêng">
            Mua mới{row.mua_moi_hom_nay ? " · hôm nay" : ""}
          </span>
        )}
        {nhanLenhWeb(row) && (
          <span className="text-[11px] font-bold mt-0.5" data-may="lenh-web" style={{ color: nhanLenhWeb(row).mau, fontFamily: "var(--font-chu)" }} title={nhanLenhWeb(row).moTa}>
            {nhanLenhWeb(row).nhan}
          </span>
        )}
        {row.ten_ngan && (
          <span className="block max-w-[170px] truncate text-[11px] font-normal leading-tight mt-0.5" style={{ color: MUTED, fontFamily: "var(--font-chu)" }} title={row.ten_cong_ty}>
            {row.ten_ngan}
          </span>
        )}
      </div>
    ),
  },
  tin: {
    nhan: "Trạng thái",
    canPhai: true,
    lay: (r) => r.tin,
    // 1 nhan trang thai + 1 nhan phu quan trong nhat (+n, re chuot xem du) - truoc day xep chong toi 7 nhan.
    hien: (row) => (
      <div className="flex flex-col items-end gap-1">
        {pillCua(row)}
        <NhanPhuTinHieu ds={dsNhanPhu(row, { canhBaoVao: true })} />
      </div>
    ),
  },
};

const COT = { ...CAC_COT, gia: { ...CAC_COT.gia, nhan: "Giá hiện tại" }, ...COT_RIENG };

// Thu tu cot: bo cuc cu cua So lenh truoc, roi Stop-loss/TP, roi tat ca chi so
// con lai (bam "Cot hien thi" de bat them).
const THU_TU_COT = [
  "ma",
  "gia",
  "doi",
  "ngay_mua",
  "gia_mua",
  "vung_mua",
  "vung_sl",
  "vung_tp",
  "lai_lo_pct",
  "gia_kich_hoat",
  "ngay_ban",
  "gia_ban",
  "so_phien_giu",
  "chot_loi",
  "stop_loss",
  "tp1",
  "tp2",
  "tp3",
  "san",
  "von_hoa",
  "von_hoa_ty",
  "free_float",
  "von_hoa_tu_do_ty",
  "nganh",
  "diem",
  "diem_rank",
  "diem_confidence",
  "trend",
  "dt",
  "mom",
  "adx",
  "rs_vni",
  "vi_tri_120",
  "diem_chat_luong",
  "sanyaku",
  "breadth_nganh",
  "khoi_luong_tb20",
  "gtgd_tb20",
  "uu_tien",
  "kijun",
  "gg_top",
  "gg_bot",
  "dinh_52t",
  "tin",
];
const DS_KHOA_CHON = THU_TU_COT.filter((k) => k !== "ma" && k !== "tin");
// Mac dinh GON: vung mua, vung cat lo, vung chot loi (+ gia hien tai, lai/lo, so phien giu, trang thai).
const MAC_DINH = ["gia", "vung_mua", "vung_sl", "vung_tp", "lai_lo_pct", "so_phien_giu"];

// Bo loc cua So lenh mo - state nam o trang cha (LenhMoNoiDung) de thong ke / bieu do o tren doi theo cung bo loc voi bang.
export const LOC_LENH_MO_TRONG = { ...LOC_TRONG, tin: "", laiLo: "", chiGiaiNgan: false, chiCanChuY: false };
const coChuY = { tinhVung: tinhVungLenh, banBot: coCanhBaoBanBot };

export function locLenhMo(duLieu, loc) {
  let ds = locChung(duLieu, loc);
  if (loc.tin) ds = ds.filter((r) => r.tin === loc.tin);
  if (loc.laiLo === "lai") ds = ds.filter((r) => r.lai_lo_pct > 0);
  if (loc.laiLo === "lo") ds = ds.filter((r) => r.lai_lo_pct < 0);
  if (loc.chiGiaiNgan) ds = ds.filter((r) => r.giai_ngan === "MOT PHAN" || r.giai_ngan === "GIU 1 PHAN");
  if (loc.chiCanChuY) ds = ds.filter((r) => laCanChuY(r, coChuY));
  return ds;
}

const xoaNhanh = (l) => ({ ...l, tin: "", laiLo: "", chiGiaiNgan: false, chiCanChuY: false, chiChotLoi: false, chiUuTien: false, chiMatThan: false, chiBanBot: false });

function mauNenDong(row) {
  return row.mat_than ? "var(--do-nen)" : row.ban_bot ? "var(--vang-nen)" : NEN_CARD;
}

// Moc chot loi tiep theo cua lenh (TP1 -> TP2 -> TP3) - cho the dien thoai
function tpTiep(r) {
  const da = chamTPCaoNhat(r);
  return !da ? ["TP1", r.tp1] : da === "TP1" ? ["TP2", r.tp2] : da === "TP2" ? ["TP3", r.tp3] : null;
}

// loc/datLoc: bo loc do TRANG CHA giu (So lenh dang mo - de thong ke o tren doi theo). Noi khac dung bang nay khong truyen thi bang tu giu bo loc rieng.
export default function BangLenhMo({ duLieu, loc: locNgoai, datLoc: datLocNgoai }) {
  const [locNoiBo, datLocNoiBo] = useState(LOC_LENH_MO_TRONG);
  const loc = locNgoai ?? locNoiBo;
  const datLoc = datLocNgoai ?? datLocNoiBo;
  // Mac dinh: canh bao Mat Than len dau (rui ro can chu y truoc), giu nguyen
  // hanh vi cu cho toi khi nguoi dung tu bam sap xep cot khac.
  const [sapXep, setSapXep] = useState(null);
  const cotHienThi = useCotHienThi("cs_cot_lenhmo_v4", DS_KHOA_CHON, MAC_DINH);
  // Trang nay da bat buoc dang nhap tu server (xem app/lenh-mo/page.js) nen luon coi la da dang nhap - chi can nap ban do Tham gia.
  const [banDoThamGia, setBanDoThamGia] = useState({});

  useEffect(() => {
    fetch("/api/tham-gia")
      .then((r) => r.json())
      .then((d) => {
        const maCuaToi = new Set(d.maCuaToi || []);
        const ban = {};
        for (const [ma, dem] of Object.entries(d.demTatCa || {})) {
          ban[ma] = { soNguoiThamGia: dem, daThamGia: maCuaToi.has(ma) };
        }
        for (const ma of maCuaToi) {
          if (!ban[ma]) ban[ma] = { soNguoiThamGia: 0, daThamGia: true };
        }
        setBanDoThamGia(ban);
      })
      .catch(() => {});
  }, []);

  function doiTrangThaiThamGia(ma, trangThaiMoi) {
    setBanDoThamGia((cu) => ({ ...cu, [ma]: trangThaiMoi }));
  }

  // BO LOC NHANH (dem tren tap da qua o tim / san / von hoa / nganh)
  const coSo = useMemo(() => locChung(duLieu, xoaNhanh(loc)), [duLieu, loc]);
  const locNhanh = useMemo(() => {
    const dem = (f) => coSo.filter(f).length;
    const khongNhanh = !(loc.tin || loc.laiLo || loc.chiGiaiNgan || loc.chiCanChuY || loc.chiChotLoi || loc.chiUuTien || loc.chiMatThan || loc.chiBanBot);
    return [
      { khoa: "tatca", nhan: "Tất cả", dem: coSo.length, dang: khongNhanh, ap: xoaNhanh },
      { khoa: "canChuY", nhan: "Cần chú ý", dem: dem((r) => laCanChuY(r, coChuY)), dang: loc.chiCanChuY, ap: (l) => ({ ...xoaNhanh(l), chiCanChuY: true }), moTa: "Mắt Thần, giá trong vùng cắt lỗ hoặc cảnh báo bán bớt" },
      { khoa: "mua", nhan: "Mua hôm nay", dem: dem((r) => r.tin === "MUA"), dang: loc.tin === "MUA", ap: (l) => ({ ...xoaNhanh(l), tin: "MUA" }) },
      { khoa: "lai", nhan: "Đang lãi", dem: dem((r) => r.lai_lo_pct > 0), dang: loc.laiLo === "lai", ap: (l) => ({ ...xoaNhanh(l), laiLo: "lai" }) },
      { khoa: "lo", nhan: "Đang lỗ", dem: dem((r) => r.lai_lo_pct < 0), dang: loc.laiLo === "lo", ap: (l) => ({ ...xoaNhanh(l), laiLo: "lo" }) },
      { khoa: "chotLoi", nhan: "Đã chạm chốt lời", dem: dem((r) => chamTPCaoNhat(r) != null), dang: loc.chiChotLoi, ap: (l) => ({ ...xoaNhanh(l), chiChotLoi: true }) },
      { khoa: "giaiNgan", nhan: "Giải ngân 1 phần", dem: dem((r) => r.giai_ngan === "MOT PHAN" || r.giai_ngan === "GIU 1 PHAN"), dang: loc.chiGiaiNgan, ap: (l) => ({ ...xoaNhanh(l), chiGiaiNgan: true }) },
      { khoa: "uuTien", nhan: "Thanh khoản tốt", dem: dem(datChuanUuTien), dang: loc.chiUuTien, ap: (l) => ({ ...xoaNhanh(l), chiUuTien: true }), moTa: NHAN_UU_TIEN },
    ].filter((m) => m.khoa === "tatca" || m.dem > 0 || m.dang);
  }, [coSo, loc]);

  const daLoc = useMemo(() => {
    const ds = locLenhMo(duLieu, loc);
    if (!sapXep) {
      // mac dinh: lenh can chu y len dau, roi lai/lo tu thap len cao (lenh dang lo de thay)
      return [...ds].sort((a, b) => Number(laCanChuY(b, coChuY)) - Number(laCanChuY(a, coChuY)) || (b.mat_than ? 1 : 0) - (a.mat_than ? 1 : 0));
    }
    const lay = COT[sapXep.khoa]?.lay;
    if (!lay) return ds;
    return [...ds].sort((a, b) => {
      const va = lay(a);
      const vb = lay(b);
      let so;
      if (typeof va === "string" || typeof vb === "string") {
        so = String(va ?? "").localeCompare(String(vb ?? ""));
      } else {
        so = (va ?? -Infinity) - (vb ?? -Infinity);
      }
      return sapXep.chieu === "asc" ? so : -so;
    });
  }, [duLieu, loc, sapXep]);

  function doiSapXep(khoa) {
    if (!COT[khoa]?.lay) return;
    setSapXep((s) => (s?.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: "desc" }));
  }

  if (duLieu.length === 0) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="py-6 px-4 text-sm" style={{ color: MUTED }}>
          Chưa có mã nào đang MUA/NẮM GIỮ trong lần quét gần nhất.
        </p>
      </div>
    );
  }

  const coBoLoc = coLocChung(loc) || loc.tin || loc.laiLo || loc.chiGiaiNgan || loc.chiCanChuY;
  const dsCot = THU_TU_COT.filter((k) => k === "ma" || k === "tin" || cotHienThi.dangChon.has(k));
  const ctx = { nhanNganh: NGANH_NHAN, banDoThamGia, doiTrangThaiThamGia };

  return (
    <div>
      <HangLocNhanh ds={locNhanh} onChon={(m) => datLoc((cu) => (m.dang && m.khoa !== "tatca" ? xoaNhanh(cu) : m.ap(cu)))} />

      <div className="hidden sm:block">
        <HangBoLocChung
          loc={loc}
          datLoc={datLoc}
          coBoLoc={coBoLoc}
          onXoa={() => datLoc(LOC_LENH_MO_TRONG)}
          truocChon={
            <OSelect
              value={loc.tin}
              onChange={(v) => datLoc((cu) => ({ ...cu, tin: v }))}
              placeholder="Tất cả trạng thái"
              options={[
                ["MUA", "MUA (mới hôm nay)"],
                ["NAM GIU", "NẮM GIỮ"],
              ]}
            />
          }
          chonCot={<ChonCotHienThi cot={COT} dsKhoa={DS_KHOA_CHON} dangChon={cotHienThi.dangChon} onBat={cotHienThi.bat} onHienTatCa={cotHienThi.hienTatCa} onMacDinh={cotHienThi.macDinh} />}
        />
      </div>

      <p className="text-xs mb-2" style={{ color: MUTED }}>
        Hiển thị <b style={{ color: "var(--chu)" }}>{daLoc.length}</b> / {duLieu.length} lệnh{!sapXep ? " · lệnh cần chú ý xếp trên cùng" : ""}
      </p>

      {/* DIEN THOAI: moi lenh 1 the - lai/lo, gia, cat lo, chot loi tiep theo */}
      <div className="sm:hidden rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        {daLoc.map((r, i) => {
          const sl = tinhVungLenh(r)?.sl;
          const tp = tpTiep(r);
          return (
            <Link key={r.khoa_lenh ?? r.ma} href={`/ma/${r.ma}`} className={`block px-3 py-2.5 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)", background: r.mat_than ? "var(--do-nen)" : undefined }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5">
                    {r.mat_than && <TriangleAlert size={13} color={DO} strokeWidth={2} aria-label="Cảnh báo Mắt Thần" />}
                    <span className="font-bold" style={{ fontFamily: "var(--font-chu)" }}>
                      {r.ten_lenh ?? r.ma}
                    </span>
                    <span className="text-xs truncate" style={{ color: MUTED }}>
                      {r.la_lenh_moi ? "Mua mới" : r.ten_ngan}
                    </span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                    Giá {fmt(r.gia)} · mua {fmt(r.gia_mua)} · {r.so_phien_giu === 0 ? "mua hôm nay" : `${r.so_phien_giu ?? "—"} phiên`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold" style={{ fontFamily: "var(--font-chu)", color: r.lai_lo_pct >= 0 ? XANH : DO }}>
                    {pct(r.lai_lo_pct, 2)}
                  </p>
                  {pillCua(r)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs">
                <span style={{ color: MUTED }}>
                  Cắt lỗ <b style={{ color: DO }}>{sl ? chuoiVung(sl.tu, sl.den) : fmt(r.stop_loss)}</b>
                </span>
                <span style={{ color: MUTED }}>{tp ? <>Chốt lời {tp[0]} <b style={{ color: XANH }}>{fmt(tp[1])}</b></> : "Đã chạm TP3"}</span>
                <NhanPhuTinHieu ds={dsNhanPhu(r, { canhBaoVao: true })} />
              </div>
            </Link>
          );
        })}
        {daLoc.length === 0 && (
          <p className="py-6 text-center text-sm" style={{ color: MUTED }}>
            Không có lệnh nào khớp bộ lọc hiện tại.
          </p>
        )}
      </div>

      {/* MAY TINH: bang, tieu de cot dinh khi cuon */}
      <div className="hidden sm:block rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-auto bang-cuon max-h-[calc(100vh-150px)]">
          <table className="w-full text-sm" style={{ fontFamily: "var(--font-chu)" }}>
            <thead>
              <tr className="text-left" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
                {dsCot.map((k, i) => {
                  const c = COT[k];
                  return (
                    <th
                      key={k}
                      className={`sticky top-0 py-2.5 font-normal whitespace-nowrap border-b ${c.canPhai ? "text-right" : "text-left"} ${i === 0 ? "pl-4 pr-3 left-0 z-[3]" : i === dsCot.length - 1 ? "pr-4 pl-3 z-[2]" : "px-3 z-[2]"} ${c.lay ? "cursor-pointer select-none hover:text-[color:var(--chu)]" : ""}`}
                      style={{ background: NEN_CARD, borderColor: VIEN }}
                      onClick={() => doiSapXep(k)}
                    >
                      <span className="inline-flex items-center gap-1" data-may={`cot-${k}`}>
                        {c.nhan}
                        {c.lay &&
                          (sapXep?.khoa === k ? (
                            sapXep.chieu === "desc" ? (
                              <ArrowDown size={12} color={PRIMARY} />
                            ) : (
                              <ArrowUp size={12} color={PRIMARY} />
                            )
                          ) : (
                            <ArrowUpDown size={12} opacity={0.35} />
                          ))}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {daLoc.map((row, i) => {
                const nen = mauNenDong(row);
                return (
                  <tr
                    key={row.khoa_lenh ?? row.ma}
                    className={i > 0 ? "border-t" : ""}
                    style={{
                      borderColor: row.mat_than ? "var(--do-vien)" : row.ban_bot ? "var(--vang-vien)" : "var(--vien-nhe)",
                      background: nen === NEN_CARD ? "transparent" : nen,
                    }}
                  >
                    {dsCot.map((k, j) => {
                      const c = COT[k];
                      return (
                        <td key={k} className={`py-2.5 ${c.canPhai ? "text-right" : ""} ${j === 0 ? "pl-4 pr-3 sticky left-0 z-[1]" : j === dsCot.length - 1 ? "pr-4 pl-3" : "px-3"}`} style={j === 0 ? { background: nen } : undefined}>
                          {c.hien(row, ctx)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {daLoc.length === 0 && (
                <tr>
                  <td colSpan={dsCot.length} className="py-6 text-center text-sm" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
                    Không có lệnh nào khớp bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
