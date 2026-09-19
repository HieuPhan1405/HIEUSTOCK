"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Lock } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import ModalTaiKhoan from "@/components/ModalTaiKhoan";
import NutThamGia from "@/components/NutThamGia";
import { CAC_COT } from "@/components/cotChung";
import {
  NGANH_NHAN,
  LOC_TRONG,
  docLocChungTuUrl,
  locChung,
  coLocChung,
  OSelect,
  OTich,
  HangBoLocChung,
  HangTichChung,
  useCotHienThi,
  ChonCotHienThi,
} from "@/components/boLocChung";
import { chamTPCaoNhat, nhanGiaiNgan, datChuanUuTien } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const PRIMARY = "#6C5CE7";

// "Gan diem MUA" - dung DUNG nguong vao lenh mac dinh trong AFL (EntryTh =
// Param("Nguong diem VAO lenh (Mua)", 1.25, ...) - neu ban doi thong so nay
// trong AmiBroker, bao lai de cap nhat cho khop). Hien cac ma TRUNG LAP co
// diem da tiem can nguong nhung CHUA du de kich hoat MUA, de theo doi trong
// phien xem co "vuot qua" duoc khong.
const NGUONG_MUA = 1.25;
const BIEN_DO_GAN_MUA = 0.5;

// Cot ma + tin hieu co logic rieng (nut Tham gia, khoa Tin hieu khi chua dang
// nhap) nen dinh nghia tai day; cac cot chi so con lai lay tu cotChung.js.
const COT_RIENG = {
  ma: {
    nhan: "Mã",
    canPhai: false,
    lay: (r) => r.ma,
    hien: (row, ctx) => (
      <div className="flex items-center gap-1.5">
        <Link href={`/ma/${row.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          {row.ma}
        </Link>
        {row.mat_than && (
          <span className="text-[10px] font-bold" style={{ color: DO }}>
            ⚠
          </span>
        )}
        <NutThamGia
          ma={row.ma}
          soNguoiThamGia={ctx.banDoThamGia[row.ma]?.soNguoiThamGia ?? 0}
          daThamGia={ctx.banDoThamGia[row.ma]?.daThamGia ?? false}
          coDangNhap={!!ctx.nguoiDung}
          moChuaDangNhap={ctx.moModalTK}
          onDoiTrangThai={ctx.doiTrangThaiThamGia}
        />
      </div>
    ),
  },
  tin: {
    nhan: "Tín hiệu",
    canPhai: false,
    lay: (r) => r.tin,
    hien: (row, ctx) => {
      const tp = chamTPCaoNhat(row);
      return (
        <div className="flex flex-col items-end gap-1">
          {ctx.nguoiDung ? (
            <>
              <SignalPill tin={row.tin} />
              {nhanGiaiNgan(row) && (
                <span className="text-[10px] font-bold" style={{ color: nhanGiaiNgan(row).mau }} title={nhanGiaiNgan(row).moTa}>
                  ◐ {nhanGiaiNgan(row).nhan}
                </span>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={ctx.moModalTK}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold"
              style={{ background: "rgba(255,255,255,0.06)", color: MUTED }}
              title="Đăng ký/Đăng nhập để xem tín hiệu"
            >
              <Lock size={10} />
              <span style={{ filter: "blur(3px)" }}>MUA</span>
            </button>
          )}
          {tp && (
            <span className="text-[10px] font-bold" style={{ color: "#FBBF24" }}>
              🎯 {tp}
            </span>
          )}
          {row.ban_bot && (
            <span className="text-[10px] font-bold" style={{ color: "#F97316" }}>
              ⚠ Bán bớt
            </span>
          )}
        </div>
      );
    },
  },
};

const COT = { ...CAC_COT, ...COT_RIENG };

// Thu tu cot tren bang. Mac dinh chi hien cac cot chinh - bam "Cot hien thi" de
// bat them (hoac "Hien tat ca") cho du moi chi so cua he thong.
const THU_TU_COT = [
  "ma",
  "san",
  "von_hoa",
  "von_hoa_ty",
  "nganh",
  "gia",
  "doi",
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
  "gia_mua",
  "ngay_mua",
  "so_phien_giu",
  "lai_lo_pct",
  "gia_kich_hoat",
  "stop_loss",
  "tp1",
  "tp2",
  "tp3",
  "chot_loi",
  "kijun",
  "gg_top",
  "gg_bot",
  "dinh_52t",
  "tin",
];
const MAC_DINH = ["ma", "san", "von_hoa", "von_hoa_ty", "nganh", "gia", "doi", "diem", "trend", "adx", "rs_vni", "khoi_luong_tb20", "gtgd_tb20", "tin"];
const DS_KHOA_CHON = THU_TU_COT.filter((k) => k !== "ma" && k !== "tin");

// Cot lo ra ma nao DANG GIU (gia mua/lai lo/stop-loss/TP chi co gia tri voi ma
// dang MUA/NAM GIU) - chi hien khi da dang nhap, neu khong khach chua dang ky
// se suy ra duoc cot Tin hieu dang bi lam mo.
const COT_CAN_DANG_NHAP = new Set(["gia_mua", "ngay_mua", "so_phien_giu", "lai_lo_pct", "gia_kich_hoat", "stop_loss", "tp1", "tp2", "tp3", "chot_loi"]);

export default function BangBoLoc({ duLieu }) {
  const searchParams = useSearchParams();
  const [sapXep, setSapXep] = useState({ khoa: "diem", chieu: "desc" });
  // Doc bo loc ban dau tu URL - chi doc 1 LAN luc khoi tao state, sau do nguoi
  // dung tu do chinh sua tren giao dien.
  const [loc, datLoc] = useState(() => ({
    ...docLocChungTuUrl(searchParams),
    tin: searchParams.get("tin") || "",
    chiGanDiemMua: searchParams.get("gandiemmua") === "1",
  }));
  const cotHienThi = useCotHienThi("cs_cot_boloc_v1", DS_KHOA_CHON, MAC_DINH);
  // Cot "Tin hieu" (MUA/BAN/NAM GIU/TRUNG LAP) bi lam mo cho khach CHUA dang
  // ky/dang nhap - de mac dinh la CHUA dang nhap (an toan hon, tranh nhap
  // nhoang lo tin hieu that truoc khi fetch xong).
  const [nguoiDung, setNguoiDung] = useState(null);
  const [moModalTK, setMoModalTK] = useState(false);
  // Ban do "Tham gia" - {ma: {daThamGia, soNguoiThamGia}}, nap 1 lan cho ca
  // bang (tranh goi API rieng tung dong).
  const [banDoThamGia, setBanDoThamGia] = useState({});

  useEffect(() => {
    fetch("/api/nguoi-dung-hien-tai")
      .then((r) => r.json())
      .then((d) => setNguoiDung(d.nguoiDung || null))
      .catch(() => {});
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

  const soTang = duLieu.filter((r) => r.doi > 0).length;
  const soGiam = duLieu.filter((r) => r.doi < 0).length;
  const soDung = duLieu.length - soTang - soGiam;
  const soUuTien = useMemo(() => duLieu.filter(datChuanUuTien).length, [duLieu]);

  const daLoc = useMemo(() => {
    let ds = locChung(duLieu, loc);
    if (loc.tin && nguoiDung) ds = ds.filter((r) => r.tin === loc.tin);
    if (loc.chiGanDiemMua) ds = ds.filter((r) => r.tin === "TRUNG LAP" && r.diem >= NGUONG_MUA - BIEN_DO_GAN_MUA && r.diem < NGUONG_MUA);

    const lay = COT[sapXep.khoa]?.lay;
    if (!lay) return ds;
    return [...ds].sort((a, b) => {
      const va = lay(a);
      const vb = lay(b);
      let so = 0;
      if (typeof va === "string" || typeof vb === "string") {
        so = String(va ?? "").localeCompare(String(vb ?? ""));
      } else {
        so = (va ?? -Infinity) - (vb ?? -Infinity);
      }
      return sapXep.chieu === "asc" ? so : -so;
    });
  }, [duLieu, loc, sapXep, nguoiDung]);

  function doiSapXep(khoa) {
    if (!COT[khoa]?.lay) return;
    // Sap xep theo Tin hieu se lo thu tu MUA/BAN - yeu cau dang nhap.
    if (khoa === "tin" && !nguoiDung) {
      setMoModalTK(true);
      return;
    }
    setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: "desc" }));
  }

  function xoaBoLoc() {
    datLoc({ ...LOC_TRONG, tin: "", chiGanDiemMua: false });
  }

  const coBoLoc = coLocChung(loc) || loc.tin || loc.chiGanDiemMua;
  const duocXemCot = (k) => !!nguoiDung || !COT_CAN_DANG_NHAP.has(k);
  const dsKhoaChon = DS_KHOA_CHON.filter(duocXemCot);
  const dsCot = THU_TU_COT.filter((k) => k === "ma" || k === "tin" || (cotHienThi.dangChon.has(k) && duocXemCot(k)));
  const ctx = {
    nhanNganh: NGANH_NHAN,
    nguoiDung,
    banDoThamGia,
    doiTrangThaiThamGia,
    moModalTK: () => setMoModalTK(true),
  };

  return (
    <div>
      {/* THANH THONG KE NHANH */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
            {duLieu.length}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Tổng cổ phiếu
          </p>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: XANH }}>
            {soTang}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Tăng giá
          </p>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: DO }}>
            {soGiam}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Giảm giá
          </p>
        </div>
      </div>

      {/* BO LOC */}
      <HangBoLocChung
        loc={loc}
        datLoc={datLoc}
        coBoLoc={coBoLoc}
        onXoa={xoaBoLoc}
        truocChon={
          nguoiDung ? (
            <OSelect
              value={loc.tin}
              onChange={(v) => datLoc((cu) => ({ ...cu, tin: v }))}
              placeholder="Tất cả tín hiệu"
              options={[
                ["MUA", "MUA"],
                ["NAM GIU", "NẮM GIỮ"],
                ["BAN", "BÁN"],
                ["TRUNG LAP", "TRUNG LẬP"],
              ]}
            />
          ) : (
            <button
              type="button"
              onClick={() => setMoModalTK(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg"
              style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: MUTED, fontFamily: "'Inter', sans-serif" }}
            >
              <Lock size={13} />
              Tất cả tín hiệu
            </button>
          )
        }
        chonCot={
          <ChonCotHienThi
            cot={COT}
            dsKhoa={dsKhoaChon}
            dangChon={cotHienThi.dangChon}
            onBat={cotHienThi.bat}
            onHienTatCa={cotHienThi.hienTatCa}
            onMacDinh={cotHienThi.macDinh}
            ghiChu={nguoiDung ? null : "Đăng nhập để xem thêm các cột vị thế: giá mua, lãi/lỗ, Stop-loss, TP."}
          />
        }
      />

      <HangTichChung loc={loc} datLoc={datLoc} soUuTien={soUuTien}>
        <OTich checked={loc.chiGanDiemMua} onChange={(v) => datLoc((cu) => ({ ...cu, chiGanDiemMua: v }))}>
          Chỉ mã sắp đến điểm MUA
        </OTich>
      </HangTichChung>

      <p className="text-xs mb-2" style={{ color: MUTED }}>
        Hiển thị {daLoc.length} / {duLieu.length} mã · {soDung} mã đứng giá
      </p>

      {/* BANG */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                {dsCot.map((k) => {
                  const c = COT[k];
                  return (
                    <th
                      key={k}
                      className={`py-3 px-3 font-normal select-none whitespace-nowrap ${c.lay ? "cursor-pointer" : ""} ${c.canPhai ? "text-right" : "text-left"} ${
                        k === "ma" ? "sticky left-0 z-[1]" : ""
                      }`}
                      style={k === "ma" ? { background: NEN_CARD } : undefined}
                      onClick={() => doiSapXep(k)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.nhan}
                        {c.lay &&
                          (sapXep.khoa === k ? (
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
              {daLoc.map((row, i) => (
                <tr key={row.ma} className={`hover:bg-white/[0.04] transition-colors ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "#1D1D26" }}>
                  {dsCot.map((k) => {
                    const c = COT[k];
                    return (
                      <td
                        key={k}
                        className={`py-2.5 px-3 ${c.canPhai ? "text-right" : ""} ${k === "ma" ? "sticky left-0 z-[1]" : ""}`}
                        style={k === "ma" ? { background: NEN_CARD } : undefined}
                      >
                        {c.hien(row, ctx)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {daLoc.length === 0 && (
                <tr>
                  <td colSpan={dsCot.length} className="py-6 text-center text-sm" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Không tìm thấy mã nào khớp bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ModalTaiKhoan
        open={moModalTK}
        onClose={() => setMoModalTK(false)}
        onThanhCong={setNguoiDung}
        tieuDeGoiY="Đăng ký hoặc đăng nhập miễn phí để xem cột Tín hiệu (MUA/BÁN/NẮM GIỮ)."
      />
    </div>
  );
}
