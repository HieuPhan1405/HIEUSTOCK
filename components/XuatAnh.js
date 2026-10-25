"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, Copy, Download, Loader2, Share2, X } from "lucide-react";
import { chupNode, taiXuong, saoChep, coTheSaoChep, coTheChiaSe, chiaSe, napSanXuatAnh, doiSangJpeg, dungLuong, khungHinh } from "@/lib/xuatAnh";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const sans = { fontFamily: "var(--font-chu)" };

function Nut({ children, chinh = false, ...p }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg border font-semibold"
      style={chinh ? { background: PRIMARY, borderColor: PRIMARY, color: "#fff", ...sans } : { borderColor: VIEN, color: TEXT, ...sans }}
      {...p}
    >
      {children}
    </button>
  );
}

// NUT XUAT ANH + hop xem truoc (de gui cho khach). 2 che do:
//  - muc: bo chon CSS cua khoi DANG HIEN tren trang can chup (vd "#chup-thi-truong");
//  - the: 1 the chia se dung rieng (React node, rong co dinh `rong` px), ve ngoai man hinh roi chup - anh dep, khong phu thuoc kich thuoc man hinh.
// Chup xong hien hop xem truoc voi: Tai anh / Sao chep anh / Chia se (dien thoai) + chon PNG sac net hay JPG nhe (de gui Zalo).
export default function XuatAnh({ nhan = "Chụp ảnh", tenFile = "cloudstock.png", muc = null, the = null, rong = 720, tieuDe = "", kieu = "nut" }) {
  const [trangThai, setTrangThai] = useState("nghi"); // nghi | chup
  const [anh, setAnh] = useState(null); // { png: {url, blob}, jpg: {url, blob} | null }
  const [kieuFile, setKieuFile] = useState("png");
  const [thongBao, setThongBao] = useState("");
  const [loi, setLoi] = useState("");
  const theRef = useRef(null);
  const daVaoTrinhDuyet = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // giai phong URL anh khi dong / thay anh
  useEffect(
    () => () => {
      if (anh) {
        URL.revokeObjectURL(anh.png.url);
        if (anh.jpg) URL.revokeObjectURL(anh.jpg.url);
      }
    },
    [anh]
  );

  // chup khi o trang thai "chup"
  useEffect(() => {
    if (trangThai !== "chup") return;
    let huy = false;
    (async () => {
      try {
        // doi trinh duyet ve xong the / khoi can chup (2 khung hinh) roi moi chup
        await khungHinh();
        await khungHinh();
        const node = the ? theRef.current : document.querySelector(muc);
        if (!node) throw new Error("Không tìm thấy phần cần chụp");
        const blob = await chupNode(node, { chanTrang: !the, tieuDe, tiLeToiDa: the ? 3 : 2 });
        if (huy) return;
        setKieuFile("png");
        setAnh({ png: { url: URL.createObjectURL(blob), blob }, jpg: null });
        setLoi("");
      } catch (e) {
        if (!huy) setLoi(e?.message || "Không chụp được ảnh");
      } finally {
        if (!huy) setTrangThai("nghi");
      }
    })();
    return () => {
      huy = true;
    };
  }, [trangThai, the, muc, tieuDe]);

  const dong = () => {
    setAnh(null);
    setLoi("");
    setThongBao("");
  };
  useEffect(() => {
    if (!anh && !loi) return;
    const k = (e) => e.key === "Escape" && dong();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [anh, loi]);

  const lam = async (viec, ok) => {
    try {
      await viec();
      setThongBao(ok);
    } catch (e) {
      if (e?.name !== "AbortError") setThongBao("Không thực hiện được — thử Tải ảnh rồi gửi thủ công.");
    }
  };

  // chon JPG: doi tu anh PNG da chup (khong ve lai)
  const chonKieu = async (k) => {
    setThongBao("");
    if (k === "jpg" && anh && !anh.jpg) {
      try {
        const blob = await doiSangJpeg(anh.png.blob);
        setAnh((a) => (a ? { ...a, jpg: { url: URL.createObjectURL(blob), blob } } : a));
      } catch {
        setThongBao("Không đổi được sang JPG.");
        return;
      }
    }
    setKieuFile(k);
  };

  const hien = anh ? (kieuFile === "jpg" && anh.jpg ? anh.jpg : anh.png) : null;
  const tenTai = kieuFile === "jpg" ? tenFile.replace(/\.png$/i, ".jpg") : tenFile;
  const dangChup = trangThai === "chup";

  return (
    <>
      <button
        type="button"
        data-khong-chup
        onClick={() => {
          setThongBao("");
          setLoi("");
          setTrangThai("chup");
        }}
        onMouseEnter={napSanXuatAnh}
        onFocus={napSanXuatAnh}
        onTouchStart={napSanXuatAnh}
        disabled={dangChup}
        className={kieu === "nho" ? "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-semibold" : "inline-flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-lg border font-semibold"}
        style={{ borderColor: VIEN, color: TEXT, opacity: dangChup ? 0.7 : 1, ...sans }}
        title="Tạo ảnh để gửi cho khách"
        aria-busy={dangChup}
      >
        {dangChup ? <Loader2 size={kieu === "nho" ? 13 : 15} className="animate-spin" /> : <Camera size={kieu === "nho" ? 13 : 15} />}
        {dangChup ? "Đang tạo ảnh…" : nhan}
      </button>

      {/* the chia se ve ngoai man hinh (chi che do `the`) */}
      {daVaoTrinhDuyet && the && dangChup &&
        createPortal(
          <div aria-hidden="true" style={{ position: "fixed", left: -99999, top: 0, width: rong, pointerEvents: "none" }}>
            <div ref={theRef}>{the}</div>
          </div>,
          document.body
        )}

      {daVaoTrinhDuyet && (anh || loi) &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label="Ảnh đã tạo" className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(5,5,10,0.72)" }} onClick={dong}>
            <div className="rounded-2xl border w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD, color: TEXT, boxShadow: "0 30px 80px -20px rgba(108,92,231,0.45)", animation: "cs-len 0.3s var(--ease-ra) backwards" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: VIEN }}>
                <div className="min-w-0">
                  <p className="font-bold" style={sans}>{loi ? "Không tạo được ảnh" : "Ảnh đã sẵn sàng"}</p>
                  {hien && (
                    <p className="text-[11px]" style={{ color: MUTED }}>
                      {hien.blob.rong} × {hien.blob.cao} px · {dungLuong(hien.blob.size)}
                    </p>
                  )}
                </div>
                {!loi && (
                  <div role="tablist" aria-label="Định dạng ảnh" className="inline-flex rounded-lg border p-0.5 text-xs" style={{ borderColor: VIEN }}>
                    {[
                      ["png", "PNG sắc nét"],
                      ["jpg", "JPG nhẹ"],
                    ].map(([k, t]) => (
                      <button
                        key={k}
                        type="button"
                        role="tab"
                        aria-selected={kieuFile === k}
                        onClick={() => chonKieu(k)}
                        className="px-2.5 py-1 rounded-md font-semibold"
                        style={kieuFile === k ? { background: PRIMARY, color: "#fff", ...sans } : { color: MUTED, ...sans }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={dong} aria-label="Đóng" style={{ color: MUTED }}>
                  <X size={18} />
                </button>
              </div>
              {loi ? (
                <p className="p-5 text-sm" style={{ color: "var(--do)" }}>{loi}. Thử tải lại trang rồi bấm lại.</p>
              ) : (
                <>
                  <div className="overflow-auto p-3 flex-1 min-h-0" style={{ background: "rgba(0,0,0,0.25)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={hien.url} alt="Ảnh xuất" className="mx-auto max-w-full h-auto rounded-lg" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t" style={{ borderColor: VIEN }}>
                    <Nut chinh onClick={() => lam(async () => taiXuong(hien.blob, tenTai), "Đã tải ảnh về máy.")}>
                      <Download size={15} /> Tải ảnh
                    </Nut>
                    {coTheSaoChep() && (
                      <Nut onClick={() => lam(() => saoChep(hien.blob), "Đã sao chép ảnh — dán thẳng vào Zalo / Messenger.")}>
                        <Copy size={15} /> Sao chép ảnh
                      </Nut>
                    )}
                    {coTheChiaSe(hien.blob, tenTai) && (
                      <Nut onClick={() => lam(() => chiaSe(hien.blob, tenTai, tieuDe || "CloudStock"), "")}>
                        <Share2 size={15} /> Chia sẻ
                      </Nut>
                    )}
                    {thongBao && (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: thongBao.startsWith("Không") ? "var(--do)" : XANH, ...sans }}>
                        {!thongBao.startsWith("Không") && <Check size={13} />} {thongBao}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
