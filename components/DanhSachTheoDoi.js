"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Bell, Pencil, Plus, Trash2, X } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import NutThamGia from "@/components/NutThamGia";
import { CAC_COT } from "@/components/cotChung";
import { HangLocNhanh, ThanhGocNhin, useLuaChonLuu } from "@/components/boLocChung";
import { fmt, pct, soAn, laDangGiu } from "@/components/dungChung";
import { canhBaoDangCo } from "@/lib/canhBaoDanhMuc";
import { datDanhSach, thaoTacDanhSach, useDanhSachTheoDoi } from "@/lib/danhSachTheoDoiClient";
import { GIOI_HAN, ID_CHINH, chuanHoaMa } from "@/lib/danhSachTheoDoiThuan";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const PRIMARY = "#8B5CF6";
const CHU = "var(--font-chu)";

const THU_TU_TIN = { MUA: 4, "NAM GIU": 3, "TRUNG LAP": 2, BAN: 1 };
const ngayVN = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : "—");
// Cau canh bao dai "Gia dang duoi Kijun — xu huong..." -> nhan ngan truoc dau gach, cau day du o title.
const nganGon = (nhan) => String(nhan).split(" — ")[0];

// Cot bang gia gon (so lieu dung chung cach hien thi voi Bo loc - components/cotChung.js)
// (bo Dong tien: da nam trong Diem; bang can du cho cot Canh bao tren man 1366px)
const COT_SO = ["gia", "doi", "diem", "trend", "rs_vni", "gtgd_tb20", "lai_lo_pct"];
const NHAN_COT = { gia: "Giá", doi: "%Hôm nay", diem: "Điểm", trend: "Xu hướng", rs_vni: "RS/VNI", gtgd_tb20: "GTGD TB20 (tỷ)", lai_lo_pct: "Lãi/lỗ lệnh" };
const SAP_XEP_DT = [
  ["ngay", "Mới thêm gần nhất"],
  ["doi", "Tăng mạnh nhất hôm nay"],
  ["diem", "Điểm cao nhất"],
  ["canhBao", "Nhiều cảnh báo nhất"],
  ["ma", "Mã A → Z"],
];

function layGiaTri(r, khoa) {
  if (khoa === "ma") return r.ma;
  if (khoa === "ngay") return r.ngayThem ?? "";
  if (khoa === "tin") return THU_TU_TIN[r.tin] ?? 0;
  if (khoa === "canhBao") return r.canhBao.cacCanhBao.filter((c) => c.muc === 0).length * 10 + r.canhBao.cacCanhBao.length;
  return CAC_COT[khoa]?.lay?.(r) ?? null;
}

function OCanhBao({ cb, gon = false }) {
  const ds = cb?.cacCanhBao ?? [];
  if (!ds.length) return <span style={{ color: MUTED }}>—</span>;
  const dau = ds[0];
  const conLai = ds.length - 1 + (cb.them ?? 0);
  return (
    <span className="inline-flex items-start gap-1.5 text-[13px] leading-snug" title={ds.map((c) => c.nhan).join("\n")}>
      <span aria-hidden="true" className="mt-[6px] inline-block rounded-full shrink-0" style={{ width: 6, height: 6, background: dau.mau }} />
      <span className={gon ? "line-clamp-2" : undefined}>
        <span style={{ color: dau.mau, fontWeight: 600 }}>{nganGon(dau.nhan)}</span>
        {conLai > 0 && <span style={{ color: MUTED }}> +{conLai}</span>}
      </span>
    </span>
  );
}

function Pill({ r }) {
  if (!r.tin) return <span style={{ color: MUTED }}>—</span>;
  return <SignalPill tin={r.tin} banTheoDoiTu={r.ban_theo_doi ? r.ban_theo_doi_tu : null} webGiu={r.lenh_web === true} muaTheoDoiTu={r.mua_theo_doi_tu ?? null} daChotMua={r.da_chot_mua === true} />;
}

// DANH SACH THEO DOI (04/11/2026, kieu Watchlist cua TradingView / Simplize): nhieu danh sach, moi danh sach la 1 BANG GIA GON (gia, %, tin hieu, diem, canh bao) de xem
// nhieu ma 1 luc; them ma bang o go (nhieu ma cach nhau dau phay), bo ma bang nut X (co Hoan tac). Danh sach chinh co them goc nhin chi tiet (vi the, canh bao day du,
// lenh da dong) - do trang server ve san va truyen vao qua chiTietChinh.
export default function DanhSachTheoDoi({ danhSachBanDau, hang, canhBaoChinh, dsDauTien, chiTietChinh }) {
  const router = useRouter();
  const kho = useDanhSachTheoDoi({ tuTai: false });
  useEffect(() => {
    datDanhSach(danhSachBanDau);
  }, [danhSachBanDau]);
  const danhSach = kho.daTai && kho.danhSach ? kho.danhSach : danhSachBanDau;

  const [dangXemId, setDangXemId] = useState(() => {
    const id = dsDauTien === ID_CHINH ? ID_CHINH : Number(dsDauTien);
    return danhSachBanDau.some((d) => d.id === id) ? id : ID_CHINH;
  });
  const dangXem = danhSach.find((d) => d.id === dangXemId) ?? danhSach[0];
  const [cheDo, datCheDo] = useLuaChonLuu("cs_dstd_che_do", "gon", ["gon", "chiTiet"]);
  const xemChiTiet = dangXem.chinh && cheDo === "chiTiet";
  const [loc, setLoc] = useState("tatca");
  const [sapXep, setSapXep] = useState({ khoa: "ngay", chieu: "desc" });
  const [loi, setLoi] = useState(null);
  const [hoanTac, setHoanTac] = useState(null); // { id, ten, ma }
  const henGio = useRef(null);
  useEffect(() => () => clearTimeout(henGio.current), []);

  const theoMa = useMemo(() => new Map(hang.map((r) => [r.ma, r])), [hang]);

  function chon(id) {
    setDangXemId(id);
    setLoc("tatca");
    setLoi(null);
    try {
      window.history.replaceState(null, "", id === ID_CHINH ? "/danh-muc" : `/danh-muc?ds=${id}`);
    } catch {}
  }

  async function chay(hanhDong, { lamMoi = false } = {}) {
    setLoi(null);
    try {
      const kq = await thaoTacDanhSach(hanhDong);
      // danh sach chinh doi -> ve lai phan chi tiet (vi the, lenh da dong) va canh bao day du tu may chu
      if (lamMoi) router.refresh();
      return kq;
    } catch (e) {
      setLoi(e.message);
      return null;
    }
  }

  async function boMa(ma) {
    const d = dangXem;
    const kq = await chay({ loai: "bo", id: d.id, ma: [ma] }, { lamMoi: d.chinh });
    if (!kq) return;
    clearTimeout(henGio.current);
    setHoanTac({ id: d.id, ten: d.ten, ma, chinh: d.chinh });
    henGio.current = setTimeout(() => setHoanTac(null), 7000);
  }

  // Dong cua danh sach dang xem (ma chua co du lieu tin hieu van hien, cac o so de trong)
  const dong = useMemo(
    () =>
      dangXem.ma.map((x) => {
        const r = theoMa.get(x.ma) ?? { ma: x.ma, thieu: true };
        return { ...r, ngayThem: x.ngay, canhBao: canhBaoChinh[x.ma] ?? (r.thieu ? { cacCanhBao: [], them: 0 } : canhBaoDangCo(r, 3)) };
      }),
    [dangXem, theoMa, canhBaoChinh]
  );

  const LOC = useMemo(() => {
    const dem = (f) => dong.filter(f).length;
    return [
      { khoa: "tatca", nhan: "Tất cả", f: () => true },
      { khoa: "mua", nhan: "Tín hiệu MUA", f: (r) => r.tin === "MUA" },
      { khoa: "giu", nhan: "Đang nắm giữ", f: (r) => r.tin === "NAM GIU" },
      { khoa: "ban", nhan: "Tín hiệu BÁN", f: (r) => r.tin === "BAN" },
      { khoa: "xau", nhan: "Cảnh báo xấu", f: (r) => r.canhBao.cacCanhBao.some((c) => c.muc === 0), moTa: "Sắp / đã chạm cắt lỗ, Mắt Thần, giá dưới Kijun hoặc dưới mây..." },
      { khoa: "tang", nhan: "Tăng hôm nay", f: (r) => r.doi > 0 },
      { khoa: "giam", nhan: "Giảm hôm nay", f: (r) => r.doi < 0 },
    ]
      .map((m) => ({ ...m, dem: dem(m.f), dang: loc === m.khoa }))
      .filter((m) => m.khoa === "tatca" || m.dem > 0 || m.dang);
  }, [dong, loc]);

  const hien = useMemo(() => {
    const f = LOC.find((m) => m.khoa === loc)?.f ?? (() => true);
    return dong.filter(f).sort((a, b) => {
      const va = layGiaTri(a, sapXep.khoa);
      const vb = layGiaTri(b, sapXep.khoa);
      const so = typeof va === "string" || typeof vb === "string" ? String(va ?? "").localeCompare(String(vb ?? "")) : (va ?? -Infinity) - (vb ?? -Infinity);
      return (sapXep.chieu === "asc" ? so : -so) || a.ma.localeCompare(b.ma);
    });
  }, [dong, LOC, loc, sapXep]);

  const doiSapXep = (khoa) => setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: khoa === "ma" ? "asc" : "desc" }));
  const soTang = dong.filter((r) => r.doi > 0).length;
  const soGiam = dong.filter((r) => r.doi < 0).length;

  return (
    <div>
      {/* CAC DANH SACH */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Các danh sách theo dõi">
        {danhSach.map((d) => {
          const laDang = d.id === dangXem.id;
          return (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={laDang}
              onClick={() => chon(d.id)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors"
              style={{ borderColor: laDang ? PRIMARY : VIEN, background: laDang ? PRIMARY : NEN_CARD, color: laDang ? "#fff" : "var(--mo-2)", fontFamily: CHU, fontWeight: laDang ? 700 : 500 }}
            >
              {d.chinh && <Bell size={13} aria-hidden="true" />}
              <span className="max-w-[160px] truncate">{d.ten}</span>
              <span className="text-xs px-1.5 rounded-full" style={{ background: laDang ? "rgba(255,255,255,0.2)" : "var(--vien-nhe)" }}>
                {d.ma.length}
              </span>
            </button>
          );
        })}
        <TaoMoi
          soDanhSach={danhSach.length}
          onTao={async (ten) => {
            const kq = await chay({ loai: "tao", ten });
            if (kq?.idMoi) chon(kq.idMoi);
            return !!kq;
          }}
        />
      </div>

      {/* TEN + THAO TAC DANH SACH DANG XEM */}
      <ThanhDanhSach
        key={dangXem.id}
        d={dangXem}
        onDoiTen={(ten) => chay({ loai: "doiTen", id: dangXem.id, ten })}
        onXoa={async () => {
          const kq = await chay({ loai: "xoa", id: dangXem.id });
          if (kq) chon(ID_CHINH);
        }}
      />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <OThemMa
          hang={hang}
          dsDaCo={dangXem.ma.map((x) => x.ma)}
          onThem={(dsMa) => chay({ loai: "them", id: dangXem.id, ma: dsMa }, { lamMoi: dangXem.chinh })}
          onLoi={setLoi}
        />
        {dangXem.chinh && (
          <div className="sm:ml-auto">
            <ThanhGocNhin
              ds={[
                { khoa: "gon", nhan: "Bảng giá" },
                { khoa: "chiTiet", nhan: "Vị thế & lệnh đã đóng" },
              ]}
              dang={cheDo}
              onChon={datCheDo}
            />
          </div>
        )}
      </div>

      {loi && (
        <p className="text-sm mb-3" style={{ color: DO }} role="alert">
          {loi}
        </p>
      )}
      {hoanTac && (
        <div className="flex items-center gap-3 text-sm mb-3 px-3 py-2 rounded-xl border" style={{ borderColor: VIEN, background: NEN_CARD }} role="status">
          <span>
            Đã bỏ <b>{hoanTac.ma}</b> khỏi «{hoanTac.ten}».
          </span>
          <button
            type="button"
            className="font-semibold underline"
            style={{ color: "var(--tim-chu)" }}
            onClick={async () => {
              const h = hoanTac;
              setHoanTac(null);
              await chay({ loai: "them", id: h.id, ma: [h.ma] }, { lamMoi: h.chinh });
            }}
          >
            Hoàn tác
          </button>
        </div>
      )}

      {xemChiTiet ? (
        chiTietChinh ?? <Trong />
      ) : dong.length === 0 ? (
        <Trong />
      ) : (
        <>
          <HangLocNhanh ds={LOC} onChon={(m) => setLoc(m.dang && m.khoa !== "tatca" ? "tatca" : m.khoa)} />
          <p className="text-xs mb-2" style={{ color: MUTED }}>
            <b style={{ color: TEXT }}>{hien.length}</b> / {dong.length} mã · <span style={{ color: XANH }}>{soTang} tăng</span> · <span style={{ color: DO }}>{soGiam} giảm</span> · {dong.length - soTang - soGiam} đứng giá
          </p>

          {/* DIEN THOAI: the */}
          <div className="sm:hidden">
            <label className="flex items-center gap-2 text-sm mb-2" style={{ color: MUTED }}>
              Sắp xếp
              <select
                value={SAP_XEP_DT.some(([k]) => k === sapXep.khoa) ? sapXep.khoa : ""}
                onChange={(e) => e.target.value && setSapXep({ khoa: e.target.value, chieu: e.target.value === "ma" ? "asc" : "desc" })}
                className="flex-1 px-2 py-1.5 rounded-lg text-sm"
                style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT }}
              >
                {!SAP_XEP_DT.some(([k]) => k === sapXep.khoa) && <option value="">—</option>}
                {SAP_XEP_DT.map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
              {hien.map((r, i) => (
                <div key={r.ma} className={`flex items-center gap-2.5 px-3 py-2.5 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
                  <Link href={`/ma/${r.ma}`} className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold" style={{ fontFamily: CHU }}>
                        {r.ma}
                      </span>
                      <span className="text-xs truncate" style={{ color: MUTED }}>
                        {r.ten_ngan}
                      </span>
                    </p>
                    <div className="text-xs mt-0.5">
                      {r.canhBao.cacCanhBao.length ? (
                        <OCanhBao cb={r.canhBao} gon />
                      ) : (
                        <span style={{ color: MUTED }}>{r.thieu ? "Chưa có dữ liệu" : `Điểm ${soAn(r.diem)}${laDangGiu(r) && r.lai_lo_pct != null ? ` · lệnh ${pct(r.lai_lo_pct, 1)}` : ""}`}</span>
                      )}
                    </div>
                  </Link>
                  <div className="text-right shrink-0">
                    <p className="font-bold" style={{ fontFamily: CHU }}>
                      {fmt(r.gia)}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: r.doi > 0 ? XANH : r.doi < 0 ? DO : MUTED }}>
                      {pct(r.doi, 2)}
                    </p>
                  </div>
                  <div className="shrink-0 flex justify-end">
                    <Pill r={r} />
                  </div>
                  <NutBo ma={r.ma} onBo={boMa} />
                </div>
              ))}
              {hien.length === 0 && (
                <p className="py-6 text-center text-sm" style={{ color: MUTED }}>
                  Không có mã nào khớp.
                </p>
              )}
            </div>
          </div>

          {/* MAY TINH: bang gia gon, tieu de cot dinh */}
          <div className="hidden sm:block rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <div className="overflow-auto bang-cuon max-h-[calc(100vh-150px)]">
              <table className="w-full text-sm" style={{ fontFamily: CHU }}>
                <thead>
                  <tr style={{ color: MUTED }}>
                    <Th khoa="ma" sapXep={sapXep} onSapXep={doiSapXep} className="text-left sticky left-0 z-[3]">
                      Mã
                    </Th>
                    {COT_SO.slice(0, 2).map((k) => (
                      <Th key={k} khoa={k} sapXep={sapXep} onSapXep={doiSapXep} className="text-right">
                        {NHAN_COT[k]}
                      </Th>
                    ))}
                    <Th khoa="tin" sapXep={sapXep} onSapXep={doiSapXep} className="text-left">
                      Tín hiệu
                    </Th>
                    {COT_SO.slice(2).map((k) => (
                      <Th key={k} khoa={k} sapXep={sapXep} onSapXep={doiSapXep} className="text-right">
                        {NHAN_COT[k]}
                      </Th>
                    ))}
                    <Th khoa="canhBao" sapXep={sapXep} onSapXep={doiSapXep} className="text-left">
                      Cảnh báo
                    </Th>
                    <th className="sticky top-0 z-[2] border-b w-10" style={{ background: NEN_CARD, borderColor: VIEN }} aria-label="Bỏ khỏi danh sách" />
                  </tr>
                </thead>
                <tbody>
                  {hien.map((r, i) => (
                    <tr key={r.ma} className={`hover:bg-[color:var(--hover-nhe)] transition-colors ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
                      <td className="py-2 px-3 sticky left-0 z-[1]" style={{ background: NEN_CARD }} title={r.ngayThem ? `Thêm vào danh sách ngày ${ngayVN(r.ngayThem)}` : undefined}>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/ma/${r.ma}`} className="hover:underline font-bold">
                            {r.ma}
                          </Link>
                          {r.mat_than && (
                            <span className="text-[11px] font-bold" style={{ color: DO }} title="Cảnh báo Mắt Thần: rủi ro đảo chiều">
                              ⚠
                            </span>
                          )}
                          <NutThamGia ma={r.ma} soNguoiThamGia={0} daThamGia={dangXem.chinh} onDoiTrangThai={() => router.refresh()} />
                        </div>
                        {r.ten_ngan && (
                          <span className="block max-w-[170px] truncate text-[11px] leading-tight mt-0.5" style={{ color: MUTED }} title={r.ten_cong_ty}>
                            {r.ten_ngan}
                          </span>
                        )}
                      </td>
                      {r.thieu ? (
                        <td colSpan={COT_SO.length + 2} className="py-2 px-3 text-xs" style={{ color: MUTED }}>
                          Chưa có dữ liệu tín hiệu cho mã này
                        </td>
                      ) : (
                        <>
                          {COT_SO.slice(0, 2).map((k) => (
                            <td key={k} className="py-2 px-3 text-right whitespace-nowrap">
                              {CAC_COT[k].hien(r, {})}
                            </td>
                          ))}
                          <td className="py-2 px-3">
                            <Pill r={r} />
                          </td>
                          {COT_SO.slice(2).map((k) => (
                            <td key={k} className="py-2 px-3 text-right whitespace-nowrap">
                              {CAC_COT[k].hien(r, {})}
                            </td>
                          ))}
                        </>
                      )}
                      <td className="py-2 px-3 min-w-[200px] max-w-[260px]">
                        <OCanhBao cb={r.canhBao} />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <NutBo ma={r.ma} onBo={boMa} />
                      </td>
                    </tr>
                  ))}
                  {hien.length === 0 && (
                    <tr>
                      <td colSpan={COT_SO.length + 4} className="py-6 text-center text-sm" style={{ color: MUTED }}>
                        Không có mã nào khớp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {dangXem.chinh && (
            <button type="button" onClick={() => datCheDo("chiTiet")} className="mt-3 text-sm underline" style={{ color: "var(--tim-chu)" }}>
              Xem vị thế từng lệnh, cảnh báo chi tiết và lệnh đã đóng →
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Th({ khoa, sapXep, onSapXep, className = "", children }) {
  const dang = sapXep.khoa === khoa;
  return (
    <th className={`sticky top-0 z-[2] py-2.5 px-3 font-normal whitespace-nowrap border-b cursor-pointer select-none hover:text-[color:var(--chu)] ${className}`} style={{ background: NEN_CARD, borderColor: VIEN }} onClick={() => onSapXep(khoa)}>
      <span className="inline-flex items-center gap-1">
        {children}
        {dang ? sapXep.chieu === "desc" ? <ArrowDown size={12} color={PRIMARY} /> : <ArrowUp size={12} color={PRIMARY} /> : <ArrowUpDown size={12} opacity={0.35} />}
      </span>
    </th>
  );
}

function NutBo({ ma, onBo }) {
  const [dang, setDang] = useState(false);
  return (
    <button
      type="button"
      disabled={dang}
      onClick={async () => {
        setDang(true);
        try {
          await onBo(ma);
        } finally {
          setDang(false);
        }
      }}
      title={`Bỏ ${ma} khỏi danh sách`}
      aria-label={`Bỏ ${ma} khỏi danh sách`}
      className="shrink-0 p-1.5 rounded-lg hover:bg-[color:var(--hover-dam)]"
      style={{ color: MUTED, opacity: dang ? 0.5 : 1 }}
    >
      <X size={15} />
    </button>
  );
}

function Trong() {
  return (
    <div className="rounded-2xl border p-8 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-base mb-2" style={{ fontWeight: 600 }}>
        Danh sách này đang trống
      </p>
      <p className="text-sm mb-4" style={{ color: MUTED }}>
        Gõ mã vào ô &quot;Thêm mã&quot; ở trên (nhiều mã cách nhau dấu phẩy), hoặc vào Bộ lọc để lưu cả kết quả lọc vào danh sách.
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <Link href="/bo-loc" className="px-4 py-2 rounded-lg" style={{ background: PRIMARY, color: "#FFFFFF" }}>
          Mở Bộ lọc cổ phiếu
        </Link>
        <Link href="/lenh-mo" className="px-4 py-2 rounded-lg border" style={{ borderColor: VIEN, color: TEXT }}>
          Xem lệnh đang mở
        </Link>
      </div>
    </div>
  );
}

// O THEM MA: go 1 hoac nhieu ma (cach nhau dau phay / khoang trang), goi y theo danh sach ma cua web. Chi nhan ma web co du lieu.
function OThemMa({ hang, dsDaCo, onThem, onLoi }) {
  const [chu, setChu] = useState("");
  const [dang, setDang] = useState(false);
  const coMa = useMemo(() => new Set(hang.map((r) => r.ma)), [hang]);
  async function them(e) {
    e.preventDefault();
    const ds = chuanHoaMa(chu.split(/[\s,;]+/));
    if (!ds.length || dang) return;
    const sai = ds.filter((m) => !coMa.has(m));
    const moi = ds.filter((m) => coMa.has(m) && !dsDaCo.includes(m));
    if (!moi.length) {
      onLoi(sai.length ? `Web chưa có dữ liệu mã ${sai.join(", ")}.` : "Các mã này đã có trong danh sách.");
      return;
    }
    if (dsDaCo.length + moi.length > GIOI_HAN.soMa) {
      onLoi(`Mỗi danh sách tối đa ${GIOI_HAN.soMa} mã.`);
      return;
    }
    setDang(true);
    const kq = await onThem(moi);
    setDang(false);
    if (kq) {
      setChu("");
      if (sai.length) onLoi(`Đã thêm ${moi.join(", ")}. Web chưa có dữ liệu mã ${sai.join(", ")}.`);
    }
  }
  return (
    <form onSubmit={them} className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
      <input
        value={chu}
        onChange={(e) => setChu(e.target.value.toUpperCase())}
        list="cs-ds-ma"
        placeholder="Thêm mã, vd: FPT, HPG, VCB"
        aria-label="Thêm mã vào danh sách"
        autoComplete="off"
        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg outline-none"
        style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: CHU }}
      />
      <datalist id="cs-ds-ma">
        {hang.map((r) => (
          <option key={r.ma} value={r.ma}>
            {r.ten_ngan ?? ""}
          </option>
        ))}
      </datalist>
      <button type="submit" disabled={dang || !chu.trim()} className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg font-semibold" style={{ background: PRIMARY, color: "#fff", opacity: dang || !chu.trim() ? 0.6 : 1 }}>
        <Plus size={15} /> Thêm
      </button>
    </form>
  );
}

// Nut "+ Danh sach moi" o cuoi hang danh sach -> o go ten ngay tai cho.
function TaoMoi({ soDanhSach, onTao }) {
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState("");
  const [dang, setDang] = useState(false);
  if (soDanhSach >= GIOI_HAN.soDanhSach) return null;
  if (!mo)
    return (
      <button type="button" onClick={() => setMo(true)} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-dashed" style={{ borderColor: VIEN, color: "var(--tim-chu)", fontFamily: CHU }}>
        <Plus size={14} /> Danh sách mới
      </button>
    );
  return (
    <form
      className="shrink-0 flex items-center gap-1.5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ten.trim() || dang) return;
        setDang(true);
        const ok = await onTao(ten.trim());
        setDang(false);
        if (ok) {
          setTen("");
          setMo(false);
        }
      }}
    >
      <input
        autoFocus
        value={ten}
        onChange={(e) => setTen(e.target.value)}
        maxLength={GIOI_HAN.doDaiTen}
        placeholder="Tên danh sách"
        aria-label="Tên danh sách mới"
        onKeyDown={(e) => e.key === "Escape" && setMo(false)}
        className="w-40 px-3 py-1.5 rounded-full text-sm outline-none"
        style={{ background: NEN_CARD, border: `1px solid ${PRIMARY}`, color: TEXT, fontFamily: CHU }}
      />
      <button type="submit" disabled={dang || !ten.trim()} className="px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: PRIMARY, color: "#fff", opacity: dang || !ten.trim() ? 0.6 : 1 }}>
        Tạo
      </button>
      <button type="button" onClick={() => setMo(false)} className="px-2 py-1.5 text-sm" style={{ color: MUTED }}>
        Huỷ
      </button>
    </form>
  );
}

// Ten danh sach dang xem + Doi ten / Xoa (danh sach chinh khong doi ten, khong xoa).
function ThanhDanhSach({ d, onDoiTen, onXoa }) {
  const [sua, setSua] = useState(false);
  const [ten, setTen] = useState(d.ten);
  const [hoiXoa, setHoiXoa] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 min-h-[36px]">
      {sua ? (
        <form
          className="flex items-center gap-1.5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!ten.trim()) return;
            const kq = await onDoiTen(ten.trim());
            if (kq) setSua(false);
          }}
        >
          <input autoFocus value={ten} onChange={(e) => setTen(e.target.value)} maxLength={GIOI_HAN.doDaiTen} aria-label="Tên danh sách" className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none" style={{ background: NEN_CARD, border: `1px solid ${PRIMARY}`, color: TEXT }} />
          <button type="submit" className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: PRIMARY, color: "#fff" }}>
            Lưu
          </button>
          <button type="button" onClick={() => setSua(false)} className="px-2 py-1.5 text-sm" style={{ color: MUTED }}>
            Huỷ
          </button>
        </form>
      ) : (
        <h2 className="text-lg" style={{ fontFamily: CHU, fontWeight: 700 }}>
          {d.ten}{" "}
          <span className="text-sm font-normal" style={{ color: MUTED }}>
            · {d.ma.length} mã{d.chinh ? " · dùng cho thông báo" : ""}
          </span>
        </h2>
      )}
      {!d.chinh && !sua && (
        <div className="flex items-center gap-1 text-sm">
          <button type="button" onClick={() => setSua(true)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[color:var(--hover-nhe)]" style={{ color: MUTED }}>
            <Pencil size={13} /> Đổi tên
          </button>
          {hoiXoa ? (
            <span className="inline-flex items-center gap-2 pl-1">
              <span style={{ color: TEXT }}>Xoá danh sách này?</span>
              <button type="button" onClick={onXoa} className="px-2.5 py-1 rounded-lg font-semibold" style={{ background: "var(--do)", color: "#fff" }}>
                Xoá
              </button>
              <button type="button" onClick={() => setHoiXoa(false)} style={{ color: MUTED }}>
                Huỷ
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setHoiXoa(true)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[color:var(--hover-nhe)]" style={{ color: MUTED }}>
              <Trash2 size={13} /> Xoá
            </button>
          )}
        </div>
      )}
    </div>
  );
}
