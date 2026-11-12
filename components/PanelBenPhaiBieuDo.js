"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { useDanhSachTheoDoi, thaoTacDanhSach } from "@/lib/danhSachTheoDoiClient";
import { ID_CHINH } from "@/lib/danhSachTheoDoiThuan";
import { fmt } from "@/components/dungChung";

const VIEN = "var(--vien)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const PRIMARY = "#6C5CE7";
const sans = { fontFamily: "var(--font-chu)" };
const GOI_Y = ["VCB", "FPT", "HPG", "SSI", "STB", "VIC", "VHM", "MWG"];
const KHOA_TAB = "cs_bd_tab_phai";
const so2 = (x) => (x == null ? "—" : Math.abs(x).toFixed(2).replace(".", ","));
const dau = (x) => (x > 0 ? "+" : x < 0 ? "−" : "");
const mauDoi = (d) => (d == null ? MUTED : d > 0 ? "var(--xanh)" : d < 0 ? "var(--do)" : "var(--vang)");

// KHUNG BEN PHAI trang Bieu do (kieu FireAnt): 2 tab - "Thong tin ma" (noi dung truyen vao) va "Watchlist" (danh sach theo doi + gia / % doi gan thoi gian thuc, bam ma de doi bieu do).
// Thanh vien: chon 1 trong cac danh sach theo doi cua minh, them / bo ma ngay tai day. Khach: danh sach goi y co dinh.
export default function PanelBenPhaiBieuDo({ ma, children }) {
  const [tab, setTab] = useState("tt");
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const v = localStorage.getItem(KHOA_TAB);
        if (v === "wl" || v === "tt") setTab(v);
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const chon = (v) => {
    setTab(v);
    try {
      localStorage.setItem(KHOA_TAB, v);
    } catch {}
  };
  const nut = (khoa, nhan) => (
    <button key={khoa} type="button" onClick={() => chon(khoa)} aria-pressed={tab === khoa} className="flex-1 text-sm py-2 border-b-2" style={{ ...sans, borderColor: tab === khoa ? PRIMARY : "transparent", color: tab === khoa ? TEXT : MUTED, fontWeight: tab === khoa ? 700 : 500 }}>
      {nhan}
    </button>
  );
  return (
    <>
      <div className="flex -mx-3 -mt-3 px-3 border-b shrink-0" style={{ borderColor: VIEN }} role="tablist" aria-label="Khung bên phải">
        {nut("tt", "Thông tin mã")}
        {nut("wl", "Watchlist")}
      </div>
      {tab === "tt" ? children : <Watchlist ma={ma} />}
    </>
  );
}

function Watchlist({ ma }) {
  const { daTai, danhSach } = useDanhSachTheoDoi();
  const [idChon, setIdChon] = useState(null);
  const [gia, setGia] = useState({});
  const [nhap, setNhap] = useState("");
  const [loi, setLoi] = useState("");
  const [luc, setLuc] = useState(null);
  const dangNhap = Array.isArray(danhSach);
  const dsCuaToi = dangNhap ? danhSach : [];
  const dang = dsCuaToi.find((d) => d.id === idChon) ?? dsCuaToi.find((d) => d.ma.length) ?? dsCuaToi[0] ?? null;
  const dsMa = useMemo(() => (dangNhap ? (dang?.ma ?? []).map((x) => x.ma) : GOI_Y), [dangNhap, dang]);
  const khoaMa = dsMa.join(",");

  useEffect(() => {
    if (!khoaMa) return;
    let huy = false;
    const tai = () => {
      if (document.visibilityState === "hidden") return;
      fetch(`/api/bang-gia?ma=${encodeURIComponent(khoaMa)}`)
        .then((r) => r.json())
        .then((d) => {
          if (huy || !Array.isArray(d.ds)) return;
          setGia((c) => ({ ...c, ...Object.fromEntries(d.ds.map((x) => [x.ma, x])) }));
          setLuc(new Date());
        })
        .catch(() => {});
    };
    tai();
    const id = setInterval(tai, 30000);
    document.addEventListener("visibilitychange", tai); // quay lai tab / hien khung -> lam moi ngay
    return () => {
      huy = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tai);
    };
  }, [khoaMa]);

  async function them(m) {
    const v = String(m || "").trim().toUpperCase();
    if (!v || !dang) return;
    setLoi("");
    try {
      await thaoTacDanhSach({ loai: "them", id: dang.id ?? ID_CHINH, ma: [v] });
      setNhap("");
    } catch (e) {
      setLoi(String(e?.message || e));
    }
  }
  async function bo(m) {
    if (!dang) return;
    setLoi("");
    try {
      await thaoTacDanhSach({ loai: "bo", id: dang.id ?? ID_CHINH, ma: [m] });
    } catch (e) {
      setLoi(String(e?.message || e));
    }
  }

  return (
    <div className="flex flex-col gap-2 min-h-0">
      {dangNhap && dsCuaToi.length > 0 ? (
        <select value={dang?.id ?? ""} onChange={(e) => setIdChon(e.target.value === ID_CHINH ? ID_CHINH : Number(e.target.value))} aria-label="Chọn danh sách theo dõi" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--card)", border: `1px solid ${VIEN}`, color: TEXT, ...sans, fontWeight: 700 }}>
          {dsCuaToi.map((d) => (
            <option key={d.id} value={d.id}>
              {d.ten} ({d.ma.length})
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm" style={{ ...sans, fontWeight: 700 }}>
          Gợi ý theo dõi
        </p>
      )}
      <div className="divide-y rounded-xl border" style={{ borderColor: VIEN }}>
        {dsMa.map((m) => {
          const g = gia[m];
          const tang = g?.doi ?? null;
          const tuyetDoi = g?.gia != null && tang != null ? (g.gia * tang) / (100 + tang) : null;
          const dangXem = m === ma;
          return (
            <div key={m} className="group relative flex items-center gap-2 px-3 py-2" style={{ borderColor: "var(--vien-nhe)", background: dangXem ? "rgba(108,92,231,0.12)" : undefined }}>
              <Link href={`/bieu-do?ma=${m}`} className="min-w-0 flex-1" aria-current={dangXem ? "true" : undefined}>
                <span className="block text-sm font-bold" style={sans}>
                  {m}
                </span>
                <span className="block truncate text-[11px]" style={{ color: MUTED }}>
                  {g?.ten ?? " "}
                </span>
              </Link>
              <Link href={`/bieu-do?ma=${m}`} className="text-right shrink-0" tabIndex={-1} aria-hidden="true">
                <span className="block text-sm font-bold tabular-nums" style={{ ...sans, color: mauDoi(tang) }}>
                  {g?.gia != null ? fmt(g.gia) : "—"}
                </span>
                <span className="block text-[11px] tabular-nums" style={{ color: mauDoi(tang) }}>
                  {tang == null ? "—" : `${dau(tuyetDoi)}${so2(tuyetDoi)} / ${dau(tang)}${so2(tang)}%`}
                </span>
              </Link>
              {dangNhap && dang && (
                <button type="button" onClick={() => bo(m)} aria-label={`Bỏ ${m} khỏi danh sách`} title="Bỏ khỏi danh sách" className="absolute -right-1 -top-1 hidden group-hover:flex w-5 h-5 items-center justify-center rounded-full border" style={{ background: "var(--card)", borderColor: VIEN, color: MUTED }}>
                  <X size={11} aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
        {dsMa.length === 0 && daTai && (
          <p className="px-3 py-4 text-xs" style={{ color: MUTED }}>
            Danh sách trống. Thêm mã bên dưới hoặc bấm “Thêm {ma}”.
          </p>
        )}
      </div>
      {dangNhap && dang ? (
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            them(nhap);
          }}
        >
          <input value={nhap} onChange={(e) => setNhap(e.target.value.toUpperCase())} placeholder="Thêm mã…" maxLength={10} aria-label="Thêm mã vào danh sách" className="min-w-0 flex-1 px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--card)", border: `1px solid ${VIEN}`, color: TEXT, ...sans }} />
          <button type="submit" className="inline-flex items-center gap-1 px-3 text-xs rounded-lg" style={{ background: PRIMARY, color: "#fff", ...sans, fontWeight: 700 }}>
            <Plus size={13} aria-hidden="true" />
            Thêm
          </button>
        </form>
      ) : (
        daTai && (
          <p className="text-[11px]" style={{ color: MUTED }}>
            Đăng nhập để tạo danh sách theo dõi riêng và xem ở đây.
          </p>
        )
      )}
      {dangNhap && dang && ma !== "VNINDEX" && !dsMa.includes(ma) && (
        <button type="button" onClick={() => them(ma)} className="text-xs px-3 py-2 rounded-lg border" style={{ borderColor: VIEN, color: PRIMARY, ...sans }}>
          + Thêm {ma} vào “{dang.ten}”
        </button>
      )}
      {loi && (
        <p className="text-xs" role="alert" style={{ color: "var(--do)" }}>
          {loi}
        </p>
      )}
      <p className="text-[11px]" style={{ color: MUTED }}>
        Giá và % thay đổi theo dữ liệu hệ thống{luc ? `, làm mới lúc ${luc.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}. Di chuột vào dòng để bỏ mã.
      </p>
    </div>
  );
}
