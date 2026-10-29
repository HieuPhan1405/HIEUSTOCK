"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import NutThamGia from "@/components/NutThamGia";
import { CAC_COT } from "@/components/cotChung";
import { fmt, pct, chamTPCaoNhat } from "@/components/dungChung";
import { ngayChuoi, chonViThe } from "@/lib/muaThemTinhToan";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const NGOC = "var(--cyan)";
const TIM = "var(--tim-nhat)";
const PRIMARY = "#6C5CE7";
const CHU_THAN = "var(--font-chu)";
const CHU_SO = "var(--font-chu)";

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

// Cot "Chu y trong phien": nhung gi DA XAY RA trong phien (tu dong, canh bao xau len truoc) + 1-2 dong trang thai hien tai (duoi / tren Tenkan, Kijun, may; KC / HT gan nhat). Rong thi ghi "chua co".
function ChuYTrongPhien({ chuY, trangThai }) {
  const sk = chuY?.cacSuKien ?? [];
  const viTri = (trangThai ?? []).filter((c) => c.khoa !== "khang_cu" && c.khoa !== "ho_tro");
  const kcht = (trangThai ?? []).filter((c) => c.khoa === "khang_cu" || c.khoa === "ho_tro");
  return (
    <div>
      {sk.length > 0 ? (
        <ul className="space-y-1">
          {sk.map((e) => (
            <li key={e.khoa} className="flex items-start gap-1.5 text-[12px] leading-snug">
              <span aria-hidden="true" className="mt-[5px] inline-block rounded-full shrink-0" style={{ width: 6, height: 6, background: e.mau }} />
              <span style={{ color: e.mau, fontWeight: 600 }}>{e.nhan}</span>
            </li>
          ))}
          {chuY.them > 0 && (
            <li className="text-[11px]" style={{ color: MUTED }}>
              + {chuY.them} chú ý khác
            </li>
          )}
        </ul>
      ) : (
        <span className="text-[12px]" style={{ color: MUTED }}>
          Chưa có biến động đáng chú ý
        </span>
      )}
      {(viTri.length > 0 || kcht.length > 0) && (
        <div className="mt-1.5 pt-1.5 border-t text-[11px] leading-relaxed" style={{ borderColor: "var(--vien-nhe)", color: MUTED }}>
          {viTri.length > 0 && <div>{viTri.map((c) => c.nhan).join(" · ")}</div>}
          {kcht.map((c) => (
            <div key={c.khoa} style={{ color: c.manh ? c.mau : MUTED, fontWeight: c.manh ? 700 : 400 }}>
              {c.nhan}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Cot "Ghi chu": ghi chu RIENG cua nguoi dung cho tung ma (bam de sua, Enter / bam ra ngoai de luu, Esc de huy) - luu o DB qua PATCH /api/tham-gia.
function GhiChuSua({ ma, dau }) {
  const [giaTri, setGiaTri] = useState(dau || "");
  const [sua, setSua] = useState(false);
  const [nhap, setNhap] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState(null);
  const huy = useRef(false);

  async function luu() {
    setSua(false);
    if (huy.current) {
      huy.current = false;
      return;
    }
    const moi = nhap.replace(/s+/g, " ").trim();
    if (moi === giaTri) return;
    setDangLuu(true);
    setLoi(null);
    try {
      const r = await fetch("/api/tham-gia", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ma, ghiChu: moi }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.trangThai !== "ok") throw new Error(j.loi || j.thongBao || "Không lưu được");
      setGiaTri(j.ghiChu || "");
    } catch (e) {
      setLoi(e.message || "Không lưu được");
    } finally {
      setDangLuu(false);
    }
  }

  if (sua) {
    return (
      <textarea
        autoFocus
        rows={2}
        maxLength={300}
        value={nhap}
        onChange={(e) => setNhap(e.target.value)}
        onBlur={luu}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            huy.current = true;
            e.currentTarget.blur();
          }
        }}
        placeholder="Ví dụ: Kháng cự mạnh vùng 14,5"
        aria-label={"Ghi chú cho " + ma}
        className="w-[240px] rounded-lg border px-2 py-1.5 text-sm leading-snug outline-none"
        style={{ borderColor: PRIMARY, background: "var(--nen-phu)", color: "var(--chu)", fontFamily: CHU_THAN, resize: "none" }}
      />
    );
  }
  return (
    <div className="min-w-[160px] max-w-[260px]">
      <button
        type="button"
        onClick={() => {
          setNhap(giaTri);
          setSua(true);
        }}
        className="group flex items-start gap-1.5 text-left w-full"
        aria-label={"Sửa ghi chú cho " + ma}
      >
        {giaTri ? (
          <span className="text-sm leading-snug" style={{ color: "var(--chu)" }}>
            {giaTri}
          </span>
        ) : (
          <span className="text-[12px]" style={{ color: MUTED }}>
            + Thêm ghi chú
          </span>
        )}
        <Pencil size={12} className="mt-1 shrink-0 opacity-40 group-hover:opacity-100" aria-hidden="true" />
      </button>
      {dangLuu && (
        <span className="block text-[11px]" style={{ color: MUTED }}>
          Đang lưu…
        </span>
      )}
      {loi && (
        <span className="block text-[11px]" style={{ color: DO }}>
          {loi}
        </span>
      )}
    </div>
  );
}

function The({ so, nhan, phu, mau, may }) {
  return (
    <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-2xl" style={{ fontFamily: CHU_SO, fontWeight: 700, color: mau }}>
        {so}
      </p>
      <p className="text-xs mt-1" style={{ color: MUTED }} data-may={may}>
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
    <div className="px-3 pb-3 pt-1" style={{ background: "var(--nen-phu)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: CHU_SO }}>
          <thead>
            <tr className="border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: CHU_THAN }}>
              <th className="py-2 px-2 font-normal text-left">Vị thế</th>
              {COT_VI_THE.map(([khoa, nhan, canPhai]) => (
                <th key={khoa} className={`py-2 px-2 font-normal whitespace-nowrap ${canPhai ? "text-right" : "text-left"}`}>
                  <span data-may={`cot-${khoa}`}>{nhan}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hien.map((l, i) => {
              const truocKhiTheoDoi = m.ngayThamGia && (ngayChuoi(l.ngay_mua) ?? "") < m.ngayThamGia;
              return (
                <tr key={l.khoa_lenh} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5" style={{ fontFamily: CHU_THAN }}>
                      <span className="font-bold text-sm" data-may={nhieu ? "danh-so" : undefined}>
                        {l.ten_lenh}
                      </span>
                      <span className="text-[11px] font-bold" style={{ color: l.la_lenh_moi ? NGOC : MUTED }} data-may={l.la_lenh_moi ? "mua-moi" : "lenh-dau"}>
                        {l.la_lenh_moi ? "Mua mới" : "Lệnh đầu"}
                        {l.mua_moi_hom_nay ? " · hôm nay" : ""}
                      </span>
                      {l.lenh_web === true && (
                        <span className="text-[11px] font-bold" style={{ color: VANG }} data-may="lenh-web" title="Đã mua trong khung giờ nhưng tín hiệu mất trong phiên — web tự giữ lệnh">
                          Web giữ lệnh
                        </span>
                      )}
                      {l === totNhat && (
                        <span className="text-[11px] font-bold px-1 rounded" style={{ background: "rgba(251,191,36,0.15)", color: VANG }} title="Vị thế đang lãi nhiều nhất của mã này" data-may="vi-the-tot">
                          ★ Tốt nhất
                        </span>
                      )}
                      {l === viTheSau && (
                        <span className="text-[11px] font-bold px-1 rounded" style={{ background: "rgba(167,139,250,0.15)", color: TIM }} title="Vị thế mở gần nhất của mã này" data-may="vi-the-sau">
                          Vị thế sau
                        </span>
                      )}
                    </div>
                    <span className="block text-[11px]" style={{ color: MUTED, fontFamily: CHU_THAN }}>
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
          <span className="text-xs mr-1" style={{ color: MUTED, fontFamily: CHU_THAN }} data-may="loc-vi-the">
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
                    ? { borderColor: PRIMARY, background: "rgba(108,92,231,0.15)", color: "var(--chu)", fontFamily: CHU_THAN, fontWeight: 700 }
                    : { borderColor: VIEN, color: "var(--mo-2)", fontFamily: CHU_THAN }
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
            style={{ borderColor: VIEN, color: "var(--mo-2)", fontFamily: CHU_THAN }}
          >
            {moHet ? "Thu gọn tất cả vị thế" : "Mở tất cả vị thế"}
          </button>
        </div>
      )}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto bang-cuon">
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
                <th className="py-3 px-3 font-normal">Chú ý trong phiên</th>
                <th className="py-3 px-3 font-normal">Ghi chú</th>
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
                    <tr className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                      <td className="py-2.5 pl-3 pr-0 align-top">
                        {coViThe && (
                          <button
                            type="button"
                            onClick={() => doi(m.ma)}
                            aria-expanded={mo}
                            aria-label={`${mo ? "Thu gọn" : "Xổ ra"} các vị thế của ${m.ma}`}
                            data-may="xo-vi-the"
                            className="p-1 rounded hover:bg-[color:var(--hover-dam)]"
                          >
                            <ChevronRight size={16} color="var(--mo-2)" style={{ transform: mo ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
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
                          <span className="block max-w-[190px] truncate text-[11px] leading-tight" style={{ color: MUTED, fontFamily: CHU_THAN }} title={m.tenCongTy ?? undefined}>
                            {m.tenNgan}
                          </span>
                        )}
                      </td>
                      {m.coDuLieu ? (
                        <>
                          <td className="py-2.5 px-3 align-top">
                            <SignalPill tin={m.tin} banTheoDoiTu={m.ban_theo_doi ? m.ban_theo_doi_tu : null} webGiu={m.coLenhWeb} muaTheoDoiTu={m.mua_theo_doi_tu ?? null} daChotMua={m.da_chot_mua === true} />
                          </td>
                          <td className="py-2.5 px-3 align-top" style={{ fontFamily: CHU_THAN }}>
                            {coViThe ? (
                              <button type="button" onClick={() => doi(m.ma)} className="text-left">
                                <span className="font-bold">{biLoc ? `${hien.length}/${m.lenh.length} vị thế` : `${m.lenh.length} vị thế`}</span>
                                <span className="block text-[11px]" style={{ color: MUTED }}>
                                  {hien.length - soMoi > 0 ? `${hien.length - soMoi} lệnh đầu` : ""}
                                  {hien.length - soMoi > 0 && soMoi > 0 ? " · " : ""}
                                  {soMoi > 0 ? `${soMoi} mua mới` : ""}
                                  {biLoc ? ` · ${NHAN_TB[loc]}` : ""}
                                </span>
                                {moiHomNay && (
                                  <span className="block text-[11px] font-bold" style={{ color: NGOC }}>
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
                                  <span className="block text-[11px]" style={{ color: MUTED, fontFamily: CHU_THAN }}>
                                    {NHAN_TB[loc]}
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right align-top">{fmt(m.diem)}</td>
                          <td className="py-2.5 px-3 align-top min-w-[210px] max-w-[300px]" style={{ fontFamily: CHU_THAN }} data-may="chu-y-trong-phien">
                            <ChuYTrongPhien chuY={m.chuY} trangThai={m.trangThai} />
                          </td>
                          <td className="py-2.5 px-3 align-top" style={{ fontFamily: CHU_THAN }} data-may="ghi-chu-rieng">
                            <GhiChuSua ma={m.ma} dau={m.ghiChuRieng} />
                          </td>
                        </>
                      ) : (
                        <td className="py-2.5 px-3 text-xs align-top" colSpan={7} style={{ color: MUTED, fontFamily: CHU_THAN }}>
                          Chưa có dữ liệu tín hiệu cho mã này
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right align-top" style={{ color: MUTED }}>
                        {ngayVN(m.ngayThamGia)}
                      </td>
                    </tr>
                    {mo && (
                      <tr style={{ background: "var(--nen-phu)" }}>
                        <td colSpan={10} className="p-0">
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
