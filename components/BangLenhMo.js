"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TriangleAlert, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import NutThamGia from "@/components/NutThamGia";
import { CAC_COT } from "@/components/cotChung";
import {
  NGANH_NHAN,
  LOC_TRONG,
  locChung,
  coLocChung,
  OSelect,
  OTich,
  HangBoLocChung,
  HangTichChung,
  useCotHienThi,
  ChonCotHienThi,
} from "@/components/boLocChung";
import { nhanGiaiNgan, nhanLoaiVao, datChuanUuTien } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const DO = "#EF4444";
const PRIMARY = "#6C5CE7";
const CAM = "#F97316";

// Cot ma + trang thai co logic rieng (nut Tham gia, canh bao Mat Than/Ban bot);
// cac cot chi so con lai lay tu cotChung.js - dung chung voi bang Bo loc.
const COT_RIENG = {
  ma: {
    nhan: "Mã CP",
    canPhai: false,
    lay: (r) => r.ma,
    hien: (row, ctx) => (
      <div className="flex items-center gap-1.5">
        <Link href={`/ma/${row.ma}`} className="flex items-center gap-1 hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          {row.mat_than && <TriangleAlert size={13} color={DO} strokeWidth={2} aria-hidden="true" className="shrink-0" />}
          {row.ma}
        </Link>
        <NutThamGia
          ma={row.ma}
          soNguoiThamGia={ctx.banDoThamGia[row.ma]?.soNguoiThamGia ?? 0}
          daThamGia={ctx.banDoThamGia[row.ma]?.daThamGia ?? false}
          onDoiTrangThai={ctx.doiTrangThaiThamGia}
        />
      </div>
    ),
  },
  tin: {
    nhan: "Trạng thái",
    canPhai: true,
    lay: (r) => r.tin,
    hien: (row) => (
      <div className="flex flex-col items-end gap-1">
        <SignalPill tin={row.tin} />
        {nhanGiaiNgan(row) && (
          <span className="text-[10px] font-bold tracking-wide" style={{ color: nhanGiaiNgan(row).mau }} title={nhanGiaiNgan(row).moTa}>
            ◐ {nhanGiaiNgan(row).nhan}
          </span>
        )}
        {nhanLoaiVao(row) && (
          <span className="text-[10px] font-bold tracking-wide" style={{ color: nhanLoaiVao(row).mau }} title={nhanLoaiVao(row).moTa}>
            ↺ {nhanLoaiVao(row).nhan}
          </span>
        )}
        {row.ban_bot && (
          <span className="text-[10px] font-bold tracking-wide" style={{ color: CAM }}>
            ⚠ Bán bớt
          </span>
        )}
      </div>
    ),
  },
};

const COT = { ...CAC_COT, gia: { ...CAC_COT.gia, nhan: "Giá hiện tại" }, ...COT_RIENG };

// Thu tu cot: bo cuc cu cua So lenh truoc, roi Stop-loss/TP, roi tat ca chi so
// con lai. Mac dinh HIEN TAT CA (theo yeu cau xem du moi chi so) tru Ngay ban /
// Gia ban - lenh dang mo luon de trong 2 cot nay (bam "Cot hien thi" de bat lai).
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
  "nganh",
  "diem",
  "diem_rank",
  "diem_confidence",
  "trend",
  "dt",
  "mom",
  "adx",
  "rs_vni",
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
// Mac dinh GON: chi can vung mua, vung cat lo, vung chot loi (+ gia hien tai, lai/lo, trang thai).
// Cac chi so khac van bat duoc bang nut "Cot hien thi" (hoac "Hien tat ca").
const MAC_DINH = ["ma", "gia", "vung_mua", "vung_sl", "vung_tp", "lai_lo_pct", "tin"];

function mauNenDong(row) {
  return row.mat_than ? "#241419" : row.ban_bot ? "#241C10" : NEN_CARD;
}

export default function BangLenhMo({ duLieu }) {
  // Mac dinh: canh bao Mat Than len dau (rui ro can chu y truoc), giu nguyen
  // hanh vi cu cho toi khi nguoi dung tu bam sap xep cot khac.
  const [sapXep, setSapXep] = useState(null);
  const [loc, datLoc] = useState({ ...LOC_TRONG, tin: "", laiLo: "", chiGiaiNgan: false });
  const cotHienThi = useCotHienThi("cs_cot_lenhmo_v3", DS_KHOA_CHON, MAC_DINH);
  // Trang nay da bat buoc dang nhap tu server (xem app/lenh-mo/page.js) nen
  // luon coi la da dang nhap - chi can nap ban do Tham gia, khong can kiem
  // tra lai phien dang nhap.
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

  const soUuTien = useMemo(() => duLieu.filter(datChuanUuTien).length, [duLieu]);

  const daLoc = useMemo(() => {
    let ds = locChung(duLieu, loc);
    if (loc.tin) ds = ds.filter((r) => r.tin === loc.tin);
    if (loc.laiLo === "lai") ds = ds.filter((r) => r.lai_lo_pct > 0);
    if (loc.laiLo === "lo") ds = ds.filter((r) => r.lai_lo_pct < 0);
    if (loc.chiGiaiNgan) ds = ds.filter((r) => r.giai_ngan === "MOT PHAN" || r.giai_ngan === "GIU 1 PHAN");

    if (!sapXep) {
      return [...ds].sort((a, b) => (b.mat_than ? 1 : 0) - (a.mat_than ? 1 : 0));
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

  const coBoLoc = coLocChung(loc) || loc.tin || loc.laiLo || loc.chiGiaiNgan;
  const dsCot = THU_TU_COT.filter((k) => k === "ma" || k === "tin" || cotHienThi.dangChon.has(k));
  const ctx = { nhanNganh: NGANH_NHAN, banDoThamGia, doiTrangThaiThamGia };

  return (
    <div>
      <HangBoLocChung
        loc={loc}
        datLoc={datLoc}
        coBoLoc={coBoLoc}
        onXoa={() => datLoc({ ...LOC_TRONG, tin: "", laiLo: "", chiGiaiNgan: false })}
        truocChon={
          <>
            <OSelect
              value={loc.tin}
              onChange={(v) => datLoc((cu) => ({ ...cu, tin: v }))}
              placeholder="Tất cả trạng thái"
              options={[
                ["MUA", "MUA (mới hôm nay)"],
                ["NAM GIU", "NẮM GIỮ"],
              ]}
            />
            <OSelect
              value={loc.laiLo}
              onChange={(v) => datLoc((cu) => ({ ...cu, laiLo: v }))}
              placeholder="Lãi & lỗ"
              options={[
                ["lai", "Đang lãi"],
                ["lo", "Đang lỗ"],
              ]}
            />
          </>
        }
        chonCot={
          <ChonCotHienThi
            cot={COT}
            dsKhoa={DS_KHOA_CHON}
            dangChon={cotHienThi.dangChon}
            onBat={cotHienThi.bat}
            onHienTatCa={cotHienThi.hienTatCa}
            onMacDinh={cotHienThi.macDinh}
          />
        }
      />

      <HangTichChung loc={loc} datLoc={datLoc} soUuTien={soUuTien}>
        <OTich checked={loc.chiGiaiNgan} onChange={(v) => datLoc((cu) => ({ ...cu, chiGiaiNgan: v }))}>
          Chỉ lệnh đang giải ngân 1 phần
        </OTich>
      </HangTichChung>

      <p className="text-xs mb-2" style={{ color: MUTED }}>
        Hiển thị {daLoc.length} / {duLieu.length} lệnh
      </p>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                {dsCot.map((k, i) => {
                  const c = COT[k];
                  return (
                    <th
                      key={k}
                      className={`py-3 font-normal whitespace-nowrap ${c.canPhai ? "text-right" : "text-left"} ${
                        i === 0 ? "pl-4 pr-3 sticky left-0 z-[1]" : i === dsCot.length - 1 ? "pr-4 pl-3" : "px-3"
                      } ${c.lay ? "cursor-pointer select-none" : ""}`}
                      style={i === 0 ? { background: NEN_CARD } : undefined}
                      onClick={() => doiSapXep(k)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.nhan}
                        {c.lay &&
                          (sapXep?.khoa === k ? (
                            sapXep.chieu === "desc" ? (
                              <ArrowDown size={12} color={PRIMARY} />
                            ) : (
                              <ArrowUp size={12} color={PRIMARY} />
                            )
                          ) : (
                            <ArrowUpDown size={12} opacity={0.4} />
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
                    key={row.ma}
                    className={i > 0 ? "border-t" : ""}
                    style={{
                      borderColor: row.mat_than ? "#4A2230" : row.ban_bot ? "#4A3218" : "#1D1D26",
                      background: nen === NEN_CARD ? "transparent" : nen,
                    }}
                  >
                    {dsCot.map((k, j) => {
                      const c = COT[k];
                      return (
                        <td
                          key={k}
                          className={`py-3 ${c.canPhai ? "text-right" : ""} ${
                            j === 0 ? "pl-4 pr-3 sticky left-0 z-[1]" : j === dsCot.length - 1 ? "pr-4 pl-3" : "px-3"
                          }`}
                          style={j === 0 ? { background: nen } : undefined}
                        >
                          {c.hien(row, ctx)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {daLoc.length === 0 && (
                <tr>
                  <td colSpan={dsCot.length} className="py-6 text-center text-sm" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
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
