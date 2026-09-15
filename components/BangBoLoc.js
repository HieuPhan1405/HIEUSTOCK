"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import { fmt, pct, so1So, phanLoaiXuHuong, chamTPCaoNhat } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const TEXT = "#F5F5F7";
const XANH = "#22C55E";
const DO = "#EF4444";
const PRIMARY = "#6C5CE7";

const COT = [
  { khoa: "ma", nhan: "Mã", canPhai: false },
  { khoa: "san", nhan: "Sàn", canPhai: false },
  { khoa: "von_hoa", nhan: "Vốn hoá", canPhai: false },
  { khoa: "gia", nhan: "Giá", canPhai: true },
  { khoa: "doi", nhan: "%Hôm nay", canPhai: true },
  { khoa: "diem", nhan: "Điểm", canPhai: true },
  { khoa: "trend", nhan: "Xu hướng", canPhai: true },
  { khoa: "adx", nhan: "ADX", canPhai: true },
  { khoa: "rs_vni", nhan: "RS/VNI", canPhai: true },
  { khoa: "gtgd_tb20", nhan: "Thanh khoản", canPhai: true },
  { khoa: "tin", nhan: "Tín hiệu", canPhai: false },
];

const XU_HUONG_NHAN = { xanh: "Tăng", do: "Giảm", sideway: "Sideway" };

// Doc bo loc ban dau tu URL (vd tu the KPI o trang chu bam vao) - chi doc 1
// LAN luc khoi tao state, sau do nguoi dung tu do chinh sua tren giao dien.
function docLocTuUrl(searchParams) {
  return {
    tin: searchParams.get("tin") || "",
    vonHoa: searchParams.get("vonhoa") || "",
    xuHuong: searchParams.get("xuhuong") || "",
    san: searchParams.get("san") || "",
    chiMatThan: searchParams.get("matthan") === "1",
    chiChotLoi: searchParams.get("chotloi") === "1",
    chiBanBot: searchParams.get("banbot") === "1",
  };
}

function OSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 text-sm rounded-lg outline-none"
      style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'Inter', sans-serif" }}
    >
      <option value="">{placeholder}</option>
      {options.map(([v, nhan]) => (
        <option key={v} value={v}>
          {nhan}
        </option>
      ))}
    </select>
  );
}

export default function BangBoLoc({ duLieu }) {
  const searchParams = useSearchParams();
  const [timKiem, setTimKiem] = useState("");
  const [sapXep, setSapXep] = useState({ khoa: "diem", chieu: "desc" });
  const [locBanDau] = useState(() => docLocTuUrl(searchParams));
  const [locTin, setLocTin] = useState(locBanDau.tin);
  const [locVonHoa, setLocVonHoa] = useState(locBanDau.vonHoa);
  const [locXuHuong, setLocXuHuong] = useState(locBanDau.xuHuong);
  const [locSan, setLocSan] = useState(locBanDau.san);
  const [chiMatThan, setChiMatThan] = useState(locBanDau.chiMatThan);
  const [chiChotLoi, setChiChotLoi] = useState(locBanDau.chiChotLoi);
  const [chiBanBot, setChiBanBot] = useState(locBanDau.chiBanBot);

  const soTang = duLieu.filter((r) => r.doi > 0).length;
  const soGiam = duLieu.filter((r) => r.doi < 0).length;
  const soDung = duLieu.length - soTang - soGiam;

  const daLoc = useMemo(() => {
    const tuKhoa = timKiem.trim().toUpperCase();
    let ds = duLieu;
    if (tuKhoa) ds = ds.filter((r) => r.ma.includes(tuKhoa));
    if (locTin) ds = ds.filter((r) => r.tin === locTin);
    if (locVonHoa) ds = ds.filter((r) => r.von_hoa === locVonHoa);
    if (locXuHuong) ds = ds.filter((r) => phanLoaiXuHuong(r) === locXuHuong);
    if (locSan) ds = ds.filter((r) => (r.san || "HOSE") === locSan);
    if (chiMatThan) ds = ds.filter((r) => r.mat_than);
    if (chiChotLoi) ds = ds.filter((r) => r.tin === "NAM GIU" && chamTPCaoNhat(r));
    if (chiBanBot) ds = ds.filter((r) => r.ban_bot);

    ds = [...ds].sort((a, b) => {
      const va = a[sapXep.khoa];
      const vb = b[sapXep.khoa];
      let so = 0;
      if (typeof va === "string" || typeof vb === "string") {
        so = String(va ?? "").localeCompare(String(vb ?? ""));
      } else {
        so = (va ?? -Infinity) - (vb ?? -Infinity);
      }
      return sapXep.chieu === "asc" ? so : -so;
    });
    return ds;
  }, [duLieu, timKiem, sapXep, locTin, locVonHoa, locXuHuong, locSan, chiMatThan, chiChotLoi, chiBanBot]);

  function doiSapXep(khoa) {
    setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: "desc" }));
  }

  function xoaBoLoc() {
    setTimKiem("");
    setLocTin("");
    setLocVonHoa("");
    setLocXuHuong("");
    setLocSan("");
    setChiMatThan(false);
    setChiChotLoi(false);
    setChiBanBot(false);
  }

  const coBoLoc = timKiem || locTin || locVonHoa || locXuHuong || locSan || chiMatThan || chiChotLoi || chiBanBot;

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
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative max-w-xs flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={MUTED} />
          <input
            value={timKiem}
            onChange={(e) => setTimKiem(e.target.value)}
            placeholder="Tìm mã cổ phiếu..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'JetBrains Mono', monospace" }}
          />
        </div>
        <OSelect
          value={locTin}
          onChange={setLocTin}
          placeholder="Tất cả tín hiệu"
          options={[
            ["MUA", "MUA"],
            ["NAM GIU", "NẮM GIỮ"],
            ["BAN", "BÁN"],
            ["TRUNG LAP", "TRUNG LẬP"],
          ]}
        />
        <OSelect
          value={locVonHoa}
          onChange={setLocVonHoa}
          placeholder="Tất cả vốn hoá"
          options={[
            ["VN30", "VN30"],
            ["Midcap", "Midcap"],
            ["Smallcap", "Smallcap"],
          ]}
        />
        <OSelect
          value={locXuHuong}
          onChange={setLocXuHuong}
          placeholder="Tất cả xu hướng"
          options={[
            ["xanh", "Tăng"],
            ["do", "Giảm"],
            ["sideway", "Sideway"],
          ]}
        />
        <OSelect
          value={locSan}
          onChange={setLocSan}
          placeholder="Tất cả sàn"
          options={[
            ["HOSE", "HOSE"],
            ["HNX", "HNX"],
            ["UPCOM", "UPCOM"],
          ]}
        />
        {coBoLoc && (
          <button onClick={xoaBoLoc} className="text-xs px-3 py-2 rounded-lg" style={{ color: PRIMARY, border: `1px solid ${VIEN}` }}>
            Xoá bộ lọc
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }}>
          <input type="checkbox" checked={chiMatThan} onChange={(e) => setChiMatThan(e.target.checked)} />
          Chỉ cảnh báo Mắt Thần
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }}>
          <input type="checkbox" checked={chiChotLoi} onChange={(e) => setChiChotLoi(e.target.checked)} />
          Chỉ đã chạm chốt lời (TP)
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }}>
          <input type="checkbox" checked={chiBanBot} onChange={(e) => setChiBanBot(e.target.checked)} />
          Chỉ cảnh báo Bán bớt
        </label>
      </div>

      <p className="text-xs mb-2" style={{ color: MUTED }}>
        Hiển thị {daLoc.length} / {duLieu.length} mã · {soDung} mã đứng giá
      </p>

      {/* BANG */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                {COT.map((c) => (
                  <th
                    key={c.khoa}
                    className={`py-3 px-3 font-normal cursor-pointer select-none whitespace-nowrap ${c.canPhai ? "text-right" : "text-left"}`}
                    onClick={() => doiSapXep(c.khoa)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.nhan}
                      {sapXep.khoa === c.khoa ? (
                        sapXep.chieu === "desc" ? (
                          <ArrowDown size={12} color={PRIMARY} />
                        ) : (
                          <ArrowUp size={12} color={PRIMARY} />
                        )
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daLoc.map((row, i) => {
                const tp = chamTPCaoNhat(row);
                return (
                  <tr key={row.ma} className={`hover:bg-white/[0.04] transition-colors ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "#1D1D26" }}>
                    <td className="py-2.5 px-3">
                      <Link href={`/ma/${row.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        {row.ma}
                      </Link>
                      {row.mat_than && (
                        <span className="ml-1.5 text-[10px] font-bold" style={{ color: DO }}>
                          ⚠
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: MUTED }}>
                      {row.san || "HOSE"}
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: MUTED }}>
                      {row.von_hoa || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">{fmt(row.gia)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: row.doi >= 0 ? XANH : DO }}>
                      {pct(row.doi, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: row.diem >= 0 ? XANH : DO }}>
                      {row.diem?.toFixed(2) ?? "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">{so1So(row.trend)}</td>
                    <td className="py-2.5 px-3 text-right">{so1So(row.adx)}</td>
                    <td className="py-2.5 px-3 text-right">{pct(row.rs_vni, 1)}</td>
                    <td className="py-2.5 px-3 text-right text-xs" style={{ color: MUTED }}>
                      {row.gtgd_tb20 != null ? `${(row.gtgd_tb20 / 1000).toFixed(1)} tỷ` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <SignalPill tin={row.tin} />
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
                    </td>
                  </tr>
                );
              })}
              {daLoc.length === 0 && (
                <tr>
                  <td colSpan={COT.length} className="py-6 text-center text-sm" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Không tìm thấy mã nào khớp bộ lọc hiện tại.
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
