"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { fmt, nhe } from "@/components/dungChung";
import { soVN } from "@/lib/soVN";
import NutThamGia from "@/components/NutThamGia";
import GiaiThichThem from "@/components/GiaiThichThem";
import { HangLocNhanh, ThanhGocNhin } from "@/components/boLocChung";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const PRIMARY = "#8B5CF6";

// 3 kich ban gia cac phien sau (engine/dich-vu/kichBanMua.mjs). So phien toi da engine xet: 10.
const KICH_BAN = [
  { khoa: "giu", nhan: "Giữ giá", phu: "giá đứng yên" },
  { khoa: "tang", nhan: "Tăng đều", phu: "+1%/phiên" },
  { khoa: "giam", nhan: "Giảm đều", phu: "−1%/phiên" },
];

const ngayNgan = (v) => (v ? v.slice(8, 10) + "/" + v.slice(5, 7) : "—");
const so1 = (v) => soVN(v, 1);

// So phien SOM NHAT ra MUA trong 3 kich ban (0 = hom nay co khoang gia ra MUA); 99 = khong co.
function somNhat(r) {
  const ds = KICH_BAN.map((k) => r[`${k.khoa}_phien`]).filter((v) => v != null);
  if (r.mua_tu != null) ds.push(0);
  return ds.length ? Math.min(...ds) : 99;
}

// "xu huong 0,5 -> 2" - chi hien phan DOI so voi hien tai (xu huong / dong luong / dong tien), de biet dieu kien nao thay doi.
function chuoiThayDoi(r, k) {
  const cap = [
    ["Xu hướng", r.trend, r[`${k}_trend`]],
    ["Động lượng", r.mom, r[`${k}_mom`]],
    ["Dòng tiền", r.dt, r[`${k}_dt`]],
  ];
  const doi = cap.filter(([, a, b]) => a != null && b != null && Math.abs(a - b) > 1e-9);
  if (doi.length === 0) return "điểm thành phần giữ nguyên";
  return doi.map(([ten, a, b]) => `${ten} ${so1(a)}→${so1(b)}`).join(" · ");
}

function tomTatSomNhat(r) {
  if (r.mua_tu != null) return { nhan: `Hôm nay nếu đóng cửa ${fmt(r.mua_tu)}${r.mua_den !== r.mua_tu ? `–${fmt(r.mua_den)}` : ""}`, mau: XANH };
  const ds = KICH_BAN.map((k) => ({ k, p: r[`${k.khoa}_phien`] })).filter((x) => x.p != null).sort((a, b) => a.p - b.p);
  if (!ds.length) return { nhan: "Chưa có kịch bản trong 10 phiên", mau: MUTED };
  return { nhan: `Sớm nhất +${ds[0].p} phiên (${ds[0].k.nhan.toLowerCase()})`, mau: ds[0].p <= 3 ? XANH : TEXT };
}

function OKichBan({ r, k }) {
  const phien = r[`${k}_phien`];
  if (phien == null) return <span style={{ color: MUTED }}>—</span>;
  const doi = r[`${k}_doi`];
  return (
    <div className="leading-tight">
      <span className="font-bold" style={{ color: phien <= 3 ? XANH : TEXT }}>
        +{phien} phiên
      </span>
      <span className="text-[11px] ml-1" style={{ color: MUTED }}>
        ({ngayNgan(r[`${k}_ngay`])}, giá {fmt(r[`${k}_gia`])})
      </span>
      <div className="text-[11px]" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
        Điểm {soVN(r[`${k}_diem`], 2, true)} · {chuoiThayDoi(r, k)}
        {doi != null && doi < phien && <> · đủ điểm từ +{doi}, chờ xác nhận</>}
      </div>
    </div>
  );
}

const COT_GIA_MUA = { khoa: "gia_mua", nhan: "Giá mua", canPhai: true, lay: (r) => r.gia_mua };
const COT = [
  { khoa: "ma", nhan: "Mã", canPhai: false, lay: (r) => r.ma },
  { khoa: "gia", nhan: "Giá", canPhai: true, lay: (r) => r.gia },
  { khoa: "diem", nhan: "Điểm", canPhai: true, lay: (r) => r.diem },
  { khoa: "som", nhan: "Hôm nay", canPhai: false, lay: (r) => (r.mua_tu != null ? 0 : 99) },
  ...KICH_BAN.map((k) => ({ khoa: k.khoa, nhan: k.nhan, phu: k.phu, canPhai: false, lay: (r) => r[`${k.khoa}_phien`] ?? 99 })),
];

export default function BangKichBanMua({ duLieu: tatCa }) {
  // nhom: MUA = ma chua co lenh | GIUA = ma dang giu lenh goc, kich ban "Mua them giua chung" (hang cu chua co cot loai = MUA)
  const [nhom, setNhom] = useState("MUA");
  const soMua = useMemo(() => tatCa.filter((r) => (r.loai ?? "MUA") === "MUA").length, [tatCa]);
  const duLieu = useMemo(() => tatCa.filter((r) => (r.loai ?? "MUA") === nhom), [tatCa, nhom]);
  const laGiua = nhom === "GIUA";
  const cacCot = laGiua ? [COT[0], COT[1], COT_GIA_MUA, ...COT.slice(2)] : COT;
  const [timKiem, setTimKiem] = useState("");
  const [loc, setLoc] = useState("co"); // co = chi ma co kich ban | homnay | ba | tat
  const [sapXep, setSapXep] = useState({ khoa: "sn", chieu: "asc" });

  const daLoc = useMemo(() => {
    const tuKhoa = timKiem.trim().toUpperCase();
    let ds = tuKhoa ? duLieu.filter((r) => r.ma.includes(tuKhoa)) : duLieu;
    if (loc === "co") ds = ds.filter((r) => somNhat(r) < 99);
    else if (loc === "homnay") ds = ds.filter((r) => r.mua_tu != null);
    else if (loc === "ba") ds = ds.filter((r) => somNhat(r) <= 3);
    const cot = sapXep.khoa === "sn" ? { lay: somNhat } : cacCot.find((c) => c.khoa === sapXep.khoa) ?? { lay: somNhat };
    return [...ds].sort((a, b) => {
      const va = cot.lay(a);
      const vb = cot.lay(b);
      const so = typeof va === "string" || typeof vb === "string" ? String(va ?? "").localeCompare(String(vb ?? "")) : (va ?? -Infinity) - (vb ?? -Infinity);
      return (sapXep.chieu === "asc" ? so : -so) || a.ma.localeCompare(b.ma);
    });
  }, [duLieu, timKiem, loc, sapXep, cacCot]);

  function doiSapXep(khoa) {
    setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: khoa === "ma" ? "asc" : khoa === "diem" || khoa === "gia" ? "desc" : "asc" }));
  }

  const demLoc = (f) => (timKiem.trim() ? duLieu.filter((r) => r.ma.includes(timKiem.trim().toUpperCase())) : duLieu).filter(f).length;
  const LOC = [
    { khoa: "co", nhan: "Có kịch bản mua", f: (r) => somNhat(r) < 99 },
    { khoa: "ba", nhan: "Trong 3 phiên", f: (r) => somNhat(r) <= 3 },
    { khoa: "homnay", nhan: "Có thể MUA hôm nay", f: (r) => r.mua_tu != null },
    { khoa: "tat", nhan: "Tất cả mã", f: () => true },
  ].map((l) => ({ ...l, dem: demLoc(l.f), dang: loc === l.khoa }));

  return (
    <div>
      {/* 2 nhom: ma chua co lenh / ma dang giu (mua them giua chung) */}
      <ThanhGocNhin
        ds={[
          { khoa: "MUA", nhan: `Mua mới (${soMua})` },
          { khoa: "GIUA", nhan: `Mua thêm giữa chừng (${tatCa.length - soMua})` },
        ]}
        dang={nhom}
        onChon={setNhom}
      />
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        {laGiua ? "Mã đang giữ lệnh, chưa chạm TP3, chưa mua thêm giữa chừng." : "Mã chưa có lệnh."}
      </p>

      <HangLocNhanh ds={LOC} onChon={(l) => setLoc(l.khoa)} />
      <div className="relative max-w-sm mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={MUTED} />
        <input
          value={timKiem}
          onChange={(e) => setTimKiem(e.target.value)}
          placeholder="Tìm mã cổ phiếu..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
          style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)" }}
        />
      </div>

      <p className="text-xs mb-2" style={{ color: MUTED }}>
        <b style={{ color: TEXT }}>{daLoc.length}</b> / {duLieu.length} mã
      </p>

      {/* DIEN THOAI: the - moi ma 1 dong, ket luan "khi nao MUA" o ben phai */}
      <div className="sm:hidden rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        {daLoc.map((r, i) => {
          const tt = tomTatSomNhat(r);
          return (
            <Link key={r.ma} href={`/ma/${r.ma}`} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--vien-nhe)" }}>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className="font-bold" style={{ fontFamily: "var(--font-chu)" }}>
                    {r.ma}
                  </span>
                  <NutThamGia ma={r.ma} soNguoiThamGia={0} daThamGia={false} />
                  <span className="text-xs" style={{ color: MUTED }}>
                    {fmt(r.gia)} · điểm {soVN(r.diem, 2, true)}
                  </span>
                </p>
                <p className="text-xs mt-0.5 font-semibold" style={{ color: tt.mau }}>
                  {tt.nhan}
                </p>
              </div>
            </Link>
          );
        })}
        {daLoc.length === 0 && (
          <p className="py-6 text-center text-sm" style={{ color: MUTED }}>
            Chưa có dữ liệu phù hợp.
          </p>
        )}
      </div>

      {/* MAY TINH: bang, tieu de cot dinh khi cuon */}
      <div className="hidden sm:block rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-auto bang-cuon max-h-[calc(100vh-150px)]">
          <table className="w-full text-sm" style={{ fontFamily: "var(--font-chu)" }}>
            <thead>
              <tr className="text-left" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
                {cacCot.map((c) => (
                  <th
                    key={c.khoa}
                    className={`sticky top-0 z-[2] py-2.5 px-3 font-normal cursor-pointer select-none whitespace-nowrap border-b ${c.canPhai ? "text-right" : "text-left"}`}
                    style={{ background: NEN_CARD, borderColor: VIEN }}
                    onClick={() => doiSapXep(c.khoa)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.nhan}
                      {c.phu && (
                        <span className="text-[11px]" style={{ opacity: 0.7 }}>
                          ({c.phu})
                        </span>
                      )}
                      {sapXep.khoa === c.khoa ? (
                        sapXep.chieu === "desc" ? <ArrowDown size={12} color={PRIMARY} /> : <ArrowUp size={12} color={PRIMARY} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daLoc.map((r, i) => (
                <tr key={r.ma} className={`hover:bg-[color:var(--hover-nhe)] ${i > 0 ? "border-t align-top" : "align-top"}`} style={{ borderColor: "var(--vien-nhe)" }}>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/ma/${r.ma}`} className="hover:underline" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
                        {r.ma}
                      </Link>
                      <NutThamGia ma={r.ma} soNguoiThamGia={0} daThamGia={false} />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">{fmt(r.gia)}</td>
                  {laGiua && (
                    <td className="py-2.5 px-3 text-right">
                      {fmt(r.gia_mua)}
                      {r.gia_mua > 0 && r.gia > 0 && (
                        <div className="text-[11px]" style={{ color: r.gia >= r.gia_mua ? XANH : DO, fontFamily: "var(--font-chu)" }}>
                          {r.gia >= r.gia_mua ? "+" : ""}
                          {soVN((r.gia / r.gia_mua - 1) * 100, 1)}%
                        </div>
                      )}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-right">
                    <span style={{ color: r.diem >= 1.25 ? XANH : TEXT }}>{soVN(r.diem, 2, true)}</span>
                    <div className="text-[11px]" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
                      XH {so1(r.trend)} · ĐL {so1(r.mom)} · DT {so1(r.dt)}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {r.mua_tu != null ? (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-sm whitespace-nowrap" style={{ background: nhe(XANH, 14), color: XANH }}>
                        Đóng cửa {fmt(r.mua_tu)}
                        {r.mua_den !== r.mua_tu ? `–${fmt(r.mua_den)}` : ""}
                      </span>
                    ) : (
                      <span style={{ color: MUTED }}>—</span>
                    )}
                  </td>
                  {KICH_BAN.map((k) => (
                    <td key={k.khoa} className="py-2.5 px-3 min-w-[170px]">
                      <OKichBan r={r} k={k.khoa} />
                    </td>
                  ))}
                </tr>
              ))}
              {daLoc.length === 0 && (
                <tr>
                  <td colSpan={cacCot.length} className="py-6 text-center text-sm" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
                    Chưa có dữ liệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GiaiThichThem nhanMo="Cách đọc bảng" className="mt-3">
        <p>
          &quot;Hôm nay&quot; là khoảng giá đóng cửa của phiên hôm nay (trong biên độ ±7%) mà hệ thống sẽ ra tín hiệu MUA. Ba cột kịch bản cho biết nếu giá giữ nguyên / tăng đều 1% / giảm đều 1%
          mỗi phiên thì sau bao nhiêu phiên mã đủ điều kiện MUA (tối đa 10 phiên), kèm điểm lúc đó và thành phần nào thay đổi (XH = xu hướng, ĐL = động lượng, DT = dòng tiền).
        </p>
        {laGiua && (
          <p className="mt-1">
            Mua thêm giữa chừng chỉ áp dụng cho mã đang giữ lệnh gốc, chưa chạm TP3 và chưa mua thêm giữa chừng lần nào: giá hồi về vùng hỗ trợ rồi bật lên trong khi điểm vẫn tốt.
          </p>
        )}
        <p className="mt-1">
          Đây là mô phỏng với giả định khối lượng mỗi phiên bằng trung bình 20 phiên và chưa tính độ rộng ngành, nên có thể lệch nhẹ so với tín hiệu thật. Giá chạy khác kịch bản thì thời điểm sẽ
          khác. Thông tin tham khảo, không phải khuyến nghị đầu tư.
        </p>
      </GiaiThichThem>
    </div>
  );
}
