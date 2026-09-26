"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import NutThamGia from "@/components/NutThamGia";
import { CAC_COT } from "@/components/cotChung";
import { fmt, pct, chamTPCaoNhat } from "@/components/dungChung";
import { ngayChuoi, chonViThe } from "@/lib/muaThemTinhToan";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const NGOC = "#22D3EE";
const TIM = "#A78BFA";
const PRIMARY = "#6C5CE7";
const CHU_THAN = "'Inter', sans-serif";
const CHU_SO = "'JetBrains Mono', monospace";

const ngayVN = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "—");
const mauLai = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);

// Bo loc vi the (moi ma chi hien vi the phu hop): xem chonViThe trong lib/muaThemTinhToan.js.
const BO_LOC = [
  { khoa: "tatca", nhan: "Tất cả vị thế", moTa: "Hiện mọi vị thế đang mở của từng mã" },
  { khoa: "tot", nhan: "Vị thế tốt nhất", moTa: "Mỗi mã chỉ hiện vị thế đang lãi nhiều nhất (lỗ ít nhất)" },
  { khoa: "sau", nhan: "Vị thế sau", moTa: "Mỗi mã chỉ hiện vị thế mở gần nhất (ngày mua muộn nhất)" },
];
const NHAN_TB = { tatca: "trung bình", tot: "vị thế tốt nhất", sau: "vị thế sau" };

// Cac cot cua bang VI THE (moi lenh cua ma) - dung lai cach hien thi cua bang Bo loc / So lenh (components/cotChung.js) de cac con so giong het cho khac.
const COT_VI_THE = [
  ["ngay_mua", "Ngày mua", false],
  ["gia_mua", "Giá mua", true],
  ["gia", "Giá hiện tại", true],
  ["lai_lo_pct", "Lãi/lỗ", true],
  ["vung_sl", "Vùng cắt lỗ", true],
  ["vung_tp", "Vùng chốt lời", true],
  ["so_phien_giu", "Số phiên", true],
  ["chot_loi", "Chốt lời", true],
];

function The({ so, nhan, phu, mau }) {
  return (
    <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-2xl" style={{ fontFamily: CHU_SO, fontWeight: 700, color: mau }}>
        {so}
      </p>
      <p className="text-xs mt-1" style={{ color: MUTED }}>
        {nhan}
      </p>
      {phu && (
        <p className="text-[11px]" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

// Bang cac VI THE cua 1 ma (moi lenh 1 dong, danh so (1), (2)... theo ngay mua): nhan "Lenh dau" / "Mua moi" cho biet do la dot mua nao; ghi ro lenh mo TRUOC hay SAU khi ban theo doi ma;
// khi ma co tu 2 vi the co them nhan "Tot nhat" (lai nhieu nhat) va "Vi the sau" (mo gan nhat). hien = cac vi the dang duoc hien theo bo loc; tatCa = moi vi the cua ma (de gan nhan).
function BangViThe({ m, hien }) {
  const nhieu = m.lenh.length > 1;
  const totNhat = nhieu ? chonViThe(m.lenh, "tot")[0] : null;
  const viTheSau = nhieu ? chonViThe(m.lenh, "sau")[0] : null;
  return (
    <div className="px-3 pb-3 pt-1" style={{ background: "#0F0F16" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: CHU_SO }}>
          <thead>
            <tr className="border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: CHU_THAN }}>
              <th className="py-2 px-2 font-normal text-left">Vị thế</th>
              {COT_VI_THE.map(([khoa, nhan, canPhai]) => (
                <th key={khoa} className={`py-2 px-2 font-normal whitespace-nowrap ${canPhai ? "text-right" : "text-left"}`}>
                  {nhan}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hien.map((l, i) => {
              const truocKhiTheoDoi = m.ngayThamGia && (ngayChuoi(l.ngay_mua) ?? "") < m.ngayThamGia;
              return (
                <tr key={l.khoa_lenh} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5" style={{ fontFamily: CHU_THAN }}>
                      <span className="font-bold text-sm">{l.ten_lenh}</span>
                      <span className="text-[10px] font-bold" style={{ color: l.la_lenh_moi ? NGOC : MUTED }}>
                        {l.la_lenh_moi ? "Mua mới" : "Lệnh đầu"}
                        {l.mua_moi_hom_nay ? " · hôm nay" : ""}
                      </span>
                      {l === totNhat && (
                        <span className="text-[10px] font-bold px-1 rounded" style={{ background: "rgba(251,191,36,0.15)", color: VANG }} title="Vị thế đang lãi nhiều nhất của mã này">
                          ★ Tốt nhất
                        </span>
                      )}
                      {l === viTheSau && (
                        <span className="text-[10px] font-bold px-1 rounded" style={{ background: "rgba(167,139,250,0.15)", color: TIM }} title="Vị thế mở gần nhất của mã này">
                          Vị thế sau
                        </span>
                      )}
                    </div>
                    <span className="block text-[10px]" style={{ color: MUTED, fontFamily: CHU_THAN }}>
                      Mở {truocKhiTheoDoi ? "trước" : "sau"} khi bạn theo dõi mã · mua {ngayVN(l.ngay_mua)}
                    </span>
                  </td>
                  {COT_VI_THE.map(([khoa, , canPhai]) => (
                    <td key={khoa} className={`py-2 px-2 whitespace-nowrap ${canPhai ? "text-right" : "text-left"}`}>
                      {CAC_COT[khoa].hien(l, {})}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// DANH MUC THEO DOI = danh sach MA ban theo doi (moi ma 1 dong). Ma dang co vi the thi co mui ten ▾ ben trai: bam de xo ra cac VI THE (lenh) cua ma do. Bo loc vi the (tat ca / tot nhat /
// sau) ap cho moi ma va cac the thong ke o tren. dsMa (do trang cha dung): [{ ma, ngayThamGia, coDuLieu, tenNgan, tenCongTy, tin, gia, diem, lenh: [lenh dang mo cua ma - lenhDangMo] }].
export default function DanhMucMa({ dsMa, soCoDuLieu, soTheoDoi }) {
  const [moRong, setMoRong] = useState(() => new Set());
  const [loc, setLoc] = useState("tatca");
  const [banDoThamGia, setBanDoThamGia] = useState({});

  useEffect(() => {
    fetch("/api/tham-gia")
      .then((r) => r.json())
      .then((d) => {
        const maCuaToi = new Set(d.maCuaToi || []);
        const ban = {};
        for (const [ma, dem] of Object.entries(d.demTatCa || {})) ban[ma] = { soNguoiThamGia: dem, daThamGia: maCuaToi.has(ma) };
        for (const ma of maCuaToi) if (!ban[ma]) ban[ma] = { soNguoiThamGia: 0, daThamGia: true };
        setBanDoThamGia(ban);
      })
      .catch(() => {});
  }, []);

  // Vi the dang hien cua tung ma theo bo loc; cac the thong ke tinh tren dung cac vi the nay.
  const hienTheoMa = dsMa.map((m) => ({ m, hien: chonViThe(m.lenh, loc) }));
  const dsHien = hienTheoMa.flatMap((x) => x.hien);
  const soMa = new Set(dsHien.map((l) => l.ma)).size;
  const soLai = dsHien.filter((l) => l.lai_lo_pct > 0).length;
  const laiTBChung = dsHien.length ? dsHien.reduce((t, l) => t + (l.lai_lo_pct ?? 0), 0) / dsHien.length : null;
  const soDaChot = dsHien.filter((l) => chamTPCaoNhat(l) != null).length;
  const tongViThe = dsMa.reduce((t, m) => t + m.lenh.length, 0);

  const maCoViThe = dsMa.filter((m) => m.lenh.length > 0).map((m) => m.ma);
  const moHet = maCoViThe.length > 0 && maCoViThe.every((ma) => moRong.has(ma));
  const doi = (ma) =>
    setMoRong((cu) => {
      const moi = new Set(cu);
      if (moi.has(ma)) moi.delete(ma);
      else moi.add(ma);
      return moi;
    });

  return (
    <div>
      {tongViThe > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4" role="tablist" aria-label="Lọc vị thế">
          <span className="text-xs mr-1" style={{ color: MUTED, fontFamily: CHU_THAN }}>
            Hiện:
          </span>
          {BO_LOC.map((b) => {
            const dangChon = loc === b.khoa;
            return (
              <button
                key={b.khoa}
                type="button"
                role="tab"
                aria-selected={dangChon}
                title={b.moTa}
                onClick={() => setLoc(b.khoa)}
                className="text-xs px-3 py-1.5 rounded-lg border"
                style={
                  dangChon
                    ? { borderColor: PRIMARY, background: "rgba(108,92,231,0.15)", color: "#F5F5F7", fontFamily: CHU_THAN, fontWeight: 700 }
                    : { borderColor: VIEN, color: "#A6A6B3", fontFamily: CHU_THAN }
                }
              >
                {b.nhan}
              </button>
            );
          })}
          {loc !== "tatca" && (
            <span className="text-[11px]" style={{ color: MUTED, fontFamily: CHU_THAN }}>
              {BO_LOC.find((b) => b.khoa === loc).moTa} · các con số bên dưới tính theo bộ lọc này
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <The
          so={dsHien.length}
          nhan={loc === "tatca" ? "Vị thế đang giữ" : `${BO_LOC.find((b) => b.khoa === loc).nhan} (mỗi mã 1)`}
          phu={`${soMa < dsHien.length ? `của ${soMa} mã · ` : ""}${soCoDuLieu}/${soTheoDoi} mã có dữ liệu`}
        />
        <The so={laiTBChung == null ? "—" : pct(laiTBChung, 2)} nhan="Lãi/lỗ trung bình" mau={mauLai(laiTBChung)} />
        <The so={dsHien.length ? `${soLai}/${dsHien.length}` : "—"} nhan="Đang lãi" mau={XANH} />
        <The so={dsHien.length ? `${soDaChot}/${dsHien.length}` : "—"} nhan="Đã chạm chốt lời" mau={VANG} />
      </div>

      {maCoViThe.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setMoRong(moHet ? new Set() : new Set(maCoViThe))}
            className="text-xs px-3 py-1.5 rounded-lg border"
            style={{ borderColor: VIEN, color: "#A6A6B3", fontFamily: CHU_THAN }}
          >
            {moHet ? "Thu gọn tất cả vị thế" : "Mở tất cả vị thế"}
          </button>
        </div>
      )}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: CHU_SO }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: CHU_THAN }}>
                <th className="py-3 pl-3 pr-0 w-8" aria-label="Xổ các vị thế"></th>
                <th className="py-3 px-3 font-normal">Mã</th>
                <th className="py-3 px-3 font-normal">Trạng thái</th>
                <th className="py-3 px-3 font-normal">Vị thế</th>
                <th className="py-3 px-3 font-normal text-right">Giá</th>
                <th className="py-3 px-3 font-normal text-right">Lãi/lỗ</th>
                <th className="py-3 px-3 font-normal text-right">Điểm</th>
                <th className="py-3 px-3 font-normal text-right">Theo dõi từ</th>
              </tr>
            </thead>
            <tbody>
              {hienTheoMa.map(({ m, hien }, i) => {
                const coViThe = m.lenh.length > 0;
                const mo = coViThe && moRong.has(m.ma);
                const soMoi = hien.filter((l) => l.la_lenh_moi).length;
                const moiHomNay = hien.some((l) => l.mua_moi_hom_nay);
                const laiTB = hien.length ? hien.reduce((t, l) => t + (l.lai_lo_pct ?? 0), 0) / hien.length : null;
                const biLoc = hien.length < m.lenh.length;
                return (
                  <Fragment key={m.ma}>
                    <tr className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                      <td className="py-2.5 pl-3 pr-0 align-top">
                        {coViThe && (
                          <button
                            type="button"
                            onClick={() => doi(m.ma)}
                            aria-expanded={mo}
                            aria-label={`${mo ? "Thu gọn" : "Xổ ra"} các vị thế của ${m.ma}`}
                            className="p-1 rounded hover:bg-white/10"
                          >
                            <ChevronRight size={16} color="#A6A6B3" style={{ transform: mo ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/ma/${m.ma}`} className="hover:underline" style={{ fontFamily: CHU_THAN, fontWeight: 700 }}>
                            {m.ma}
                          </Link>
                          <NutThamGia
                            ma={m.ma}
                            soNguoiThamGia={banDoThamGia[m.ma]?.soNguoiThamGia ?? 0}
                            daThamGia={banDoThamGia[m.ma]?.daThamGia ?? true}
                            onDoiTrangThai={(ma, tt) => setBanDoThamGia((cu) => ({ ...cu, [ma]: tt }))}
                          />
                        </div>
                        {m.tenNgan && (
                          <span className="block max-w-[190px] truncate text-[10px] leading-tight" style={{ color: MUTED, fontFamily: CHU_THAN }} title={m.tenCongTy ?? undefined}>
                            {m.tenNgan}
                          </span>
                        )}
                      </td>
                      {m.coDuLieu ? (
                        <>
                          <td className="py-2.5 px-3 align-top">
                            <SignalPill tin={m.tin} />
                          </td>
                          <td className="py-2.5 px-3 align-top" style={{ fontFamily: CHU_THAN }}>
                            {coViThe ? (
                              <button type="button" onClick={() => doi(m.ma)} className="text-left">
                                <span className="font-bold">{biLoc ? `${hien.length}/${m.lenh.length} vị thế` : `${m.lenh.length} vị thế`}</span>
                                <span className="block text-[10px]" style={{ color: MUTED }}>
                                  {hien.length - soMoi > 0 ? `${hien.length - soMoi} lệnh đầu` : ""}
                                  {hien.length - soMoi > 0 && soMoi > 0 ? " · " : ""}
                                  {soMoi > 0 ? `${soMoi} mua mới` : ""}
                                  {biLoc ? ` · ${NHAN_TB[loc]}` : ""}
                                </span>
                                {moiHomNay && (
                                  <span className="block text-[10px] font-bold" style={{ color: NGOC }}>
                                    Mua mới hôm nay
                                  </span>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs" style={{ color: MUTED }}>
                                Chưa có vị thế
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right align-top">{fmt(m.gia)}</td>
                          <td className="py-2.5 px-3 text-right align-top">
                            {laiTB == null ? (
                              <span style={{ color: MUTED }}>—</span>
                            ) : (
                              <>
                                <span className="font-bold" style={{ color: mauLai(laiTB) }}>
                                  {pct(laiTB, 2)}
                                </span>
                                {(biLoc || hien.length > 1) && (
                                  <span className="block text-[10px]" style={{ color: MUTED, fontFamily: CHU_THAN }}>
                                    {NHAN_TB[loc]}
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right align-top">{fmt(m.diem)}</td>
                        </>
                      ) : (
                        <td className="py-2.5 px-3 text-xs align-top" colSpan={5} style={{ color: MUTED, fontFamily: CHU_THAN }}>
                          Chưa có dữ liệu tín hiệu cho mã này
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right align-top" style={{ color: MUTED }}>
                        {ngayVN(m.ngayThamGia)}
                      </td>
                    </tr>
                    {mo && (
                      <tr style={{ background: "#0F0F16" }}>
                        <td colSpan={8} className="p-0">
                          <BangViThe m={m} hien={hien} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
