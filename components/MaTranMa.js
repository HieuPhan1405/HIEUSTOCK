"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X, Plus } from "lucide-react";
import { TUONG_QUAN } from "@/lib/tuongQuanDuLieu";
import { Khoi, TEXT, MUTED, VIEN, PRIMARY, sans } from "@/components/DanhGiaChung";
import LuoiTuongQuan from "@/components/LuoiTuongQuan";

const TOI_DA = 12;
const MAC_DINH = ["VCB", "BID", "TCB", "MBB", "FPT", "HPG", "VIC", "VHM"];
const so2 = (x) => x.toFixed(2).replace(".", ",");

function giaiMa(b64, n) {
  const bin = atob(b64);
  const a = new Int8Array(n * n);
  for (let i = 0; i < n * n; i++) a[i] = (bin.charCodeAt(i) << 24) >> 24;
  return a;
}

// CONG CU TUONG QUAN GIUA CAC MA: chon toi da 12 ma -> ma tran tuong quan loi suat ngay 250 phien + 5 ma di cung chieu nhat voi tung ma. Du lieu ma tran (~200 KB) chi tai khi trang mo.
// danhSach = [{ ma, ten, nganh, vh }] xep theo von hoa giam dan (de lay 8 ma lon nhat cua 1 nganh).
export default function MaTranMa({ danhSach }) {
  const hopLe = useMemo(() => new Set(Object.keys(TUONG_QUAN.ma)), []);
  const [chon, setChon] = useState(() => (danhSach.some((d) => d.vh != null) ? danhSach.slice(0, 8).map((d) => d.ma) : MAC_DINH.filter((m) => TUONG_QUAN.ma[m])));
  const [nhap, setNhap] = useState("");
  const [loi, setLoi] = useState("");
  const [tran, setTran] = useState(null);
  const [loiTai, setLoiTai] = useState(false);

  useEffect(() => {
    let huy = false;
    import("@/lib/tuongQuanMaTran")
      .then(({ MA_TRAN }) => {
        if (huy) return;
        setTran({ chiSo: new Map(MA_TRAN.ds.map((m, i) => [m, i])), n: MA_TRAN.ds.length, a: giaiMa(MA_TRAN.b64, MA_TRAN.ds.length) });
      })
      .catch(() => !huy && setLoiTai(true));
    return () => {
      huy = true;
    };
  }, []);

  const them = (maMoi) => {
    const m = String(maMoi).trim().toUpperCase();
    if (!m) return;
    if (!hopLe.has(m)) return setLoi(`Chưa có dữ liệu cho mã “${m}”.`);
    if (chon.includes(m)) return setLoi(`${m} đã có trong bảng.`);
    if (chon.length >= TOI_DA) return setLoi(`Tối đa ${TOI_DA} mã.`);
    setLoi("");
    setChon((c) => [...c, m]);
    setNhap("");
  };
  const theoNganh = (ten) => {
    const ds = danhSach.filter((d) => d.nganh === ten).slice(0, 8).map((d) => d.ma);
    if (ds.length) { setChon(ds); setLoi(""); }
  };
  const dsNganh = useMemo(() => [...new Set(danhSach.map((d) => d.nganh).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")), [danhSach]);

  const gt = (i, j) => {
    if (!tran) return null;
    const a = tran.chiSo.get(chon[i]), b = tran.chiSo.get(chon[j]);
    if (a == null || b == null) return null;
    const v = tran.a[a * tran.n + b];
    return v === -128 ? null : v / 100;
  };
  const thongKe = useMemo(() => {
    if (!tran || chon.length < 2) return null;
    const cap = [];
    for (let i = 0; i < chon.length; i++) for (let j = i + 1; j < chon.length; j++) { const a = tran.chiSo.get(chon[i]), b = tran.chiSo.get(chon[j]); const v = a != null && b != null ? tran.a[a * tran.n + b] : -128; if (v !== -128) cap.push({ a: chon[i], b: chon[j], r: v / 100 }); }
    if (!cap.length) return null;
    cap.sort((p, q) => q.r - p.r);
    return { tb: cap.reduce((s, x) => s + x.r, 0) / cap.length, cao: cap[0], thap: cap.at(-1) };
  }, [tran, chon]);
  const docTb = (tb) => (tb >= 0.6 ? "đi rất cùng chiều — giữ các mã này gần như là một cược chung, ít đa dạng hoá" : tb >= 0.4 ? "khá cùng chiều — đa dạng hoá ở mức vừa phải" : tb >= 0.2 ? "liên quan ở mức thấp — đa dạng hoá tương đối tốt" : "gần như độc lập với nhau");
  const ten = useMemo(() => new Map(danhSach.map((d) => [d.ma, d.ten])), [danhSach]);

  return (
    <Khoi tieuDe="Tương quan giữa các mã" phu="Chọn tối đa 12 mã để xem chúng đi cùng chiều đến mức nào (lợi suất ngày, 250 phiên). Hai mã tương quan cao thì khi một mã giảm, mã kia thường cũng giảm.">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            them(nhap);
          }}
        >
          <input list="ds-ma-tuong-quan" value={nhap} onChange={(e) => setNhap(e.target.value.toUpperCase())} placeholder="Thêm mã, vd VPB" aria-label="Thêm mã" maxLength={6} className="w-36 px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--card)", border: `1px solid ${VIEN}`, color: TEXT, ...sans }} />
          <datalist id="ds-ma-tuong-quan">
            {Object.keys(TUONG_QUAN.ma).map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <button type="submit" className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg border" style={{ borderColor: PRIMARY, color: PRIMARY, ...sans }}>
            <Plus size={13} aria-hidden="true" />
            Thêm
          </button>
        </form>
        {dsNganh.length > 0 && (
          <select value="" onChange={(e) => e.target.value && theoNganh(e.target.value)} aria-label="Lấy các mã lớn nhất của một ngành" className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--card)", border: `1px solid ${VIEN}`, color: TEXT, ...sans }}>
            <option value="">Lấy 8 mã lớn nhất của ngành…</option>
            {dsNganh.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
        <button type="button" onClick={() => setChon([])} className="text-xs px-3 py-2 rounded-lg border" style={{ borderColor: VIEN, color: MUTED, ...sans }}>
          Xoá hết
        </button>
      </div>
      {loi && (
        <p className="text-xs mb-2" role="alert" style={{ color: "var(--do)" }}>
          {loi}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {chon.map((m) => (
          <span key={m} className="inline-flex items-center gap-1 text-xs pl-3 pr-1.5 py-1 rounded-full border" style={{ borderColor: VIEN, ...sans }}>
            <Link href={`/ma/${m}`} className="font-bold hover:underline" title={ten.get(m) ?? undefined}>
              {m}
            </Link>
            <button type="button" onClick={() => setChon((c) => c.filter((x) => x !== m))} aria-label={`Bỏ ${m}`} className="p-0.5 rounded-full" style={{ color: MUTED }}>
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        {chon.length === 0 && (
          <span className="text-xs" style={{ color: MUTED }}>
            Chưa chọn mã nào.
          </span>
        )}
      </div>
      {loiTai && (
        <p className="text-sm" style={{ color: "var(--do)" }}>
          Không tải được dữ liệu tương quan, thử tải lại trang.
        </p>
      )}
      {!tran && !loiTai && (
        <p className="text-sm" style={{ color: MUTED }}>
          Đang tải dữ liệu…
        </p>
      )}
      {tran && chon.length >= 2 && (
        <>
          <LuoiTuongQuan nhan={chon} gt={gt} rongO={44} cao={34} />
          {thongKe && (
            <p className="text-sm mt-3" style={{ color: MUTED, ...sans }}>
              Tương quan trung bình giữa các cặp: <b style={{ color: TEXT }}>{so2(thongKe.tb)}</b> — {docTb(thongKe.tb)}. Cùng chiều nhất: {thongKe.cao.a} – {thongKe.cao.b} ({so2(thongKe.cao.r)}); ít liên quan nhất: {thongKe.thap.a} – {thongKe.thap.b} ({so2(thongKe.thap.r)}).
            </p>
          )}
        </>
      )}
      {chon.length === 1 && (
        <p className="text-sm" style={{ color: MUTED }}>
          Chọn thêm ít nhất 1 mã để xem tương quan.
        </p>
      )}
      {chon.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>
            5 mã đi cùng chiều nhất với từng mã (trong toàn bộ {Object.keys(TUONG_QUAN.ma).length} mã)
          </h3>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm" style={sans}>
            {chon.map((m) => (
              <p key={m} className="flex flex-wrap items-baseline gap-x-2">
                <Link href={`/ma/${m}`} className="font-bold hover:underline w-12">
                  {m}
                </Link>
                <span style={{ color: MUTED }}>
                  {(TUONG_QUAN.peers[m] ?? []).map(([p, r]) => (
                    <span key={p} className="mr-2">
                      <Link href={`/ma/${p}`} className="hover:underline" style={{ color: TEXT }}>
                        {p}
                      </Link>{" "}
                      {so2(r)}
                    </span>
                  ))}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}
    </Khoi>
  );
}
