"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Camera, Copy, Download, Share2, X } from "lucide-react";
import { chupNode, taiXuong, saoChep, coTheSaoChep, coTheChiaSe, chiaSe } from "@/lib/xuatAnh";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#4A8AD6";
const XANH = "var(--xanh)";
const sans = { fontFamily: "var(--font-chu)" };

function Nut({ children, ...p }) {
  return (
    <button type="button" className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border font-semibold" style={{ borderColor: VIEN, color: TEXT, ...sans }} {...p}>
      {children}
    </button>
  );
}

// NUT XUAT ANH + hop xem truoc (de gui cho khach). 2 che do:
//  - muc: bo chon CSS cua khoi DANG HIEN tren trang can chup (vd "#chup-thi-truong");
//  - the: 1 the chia se dung rieng (React node, rong co dinh `rong` px), ve ngoai man hinh roi chup - anh dep, khong phu thuoc kich thuoc man hinh.
// Chup xong hien hop xem truoc voi: Tai anh / Sao chep anh / Chia se (dien thoai).
export default function XuatAnh({ nhan = "Chụp ảnh", tenFile = "cloudstock.png", muc = null, the = null, rong = 1080, tieuDe = "", kieu = "nut" }) {
  const [trangThai, setTrangThai] = useState("nghi"); // nghi | chup
  const [anh, setAnh] = useState(null); // { url, blob }
  const [thongBao, setThongBao] = useState("");
  const [loi, setLoi] = useState("");
  const theRef = useRef(null);
  const daVaoTrinhDuyet = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // giai phong URL anh khi dong
  useEffect(() => () => anh && URL.revokeObjectURL(anh.url), [anh]);

  // chup khi o trang thai "chup"
  useEffect(() => {
    if (trangThai !== "chup") return;
    let huy = false;
    (async () => {
      try {
        // doi trinh duyet ve xong the / khoi can chup (2 khung hinh) roi moi chup
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const node = the ? theRef.current : document.querySelector(muc);
        if (!node) throw new Error("Không tìm thấy phần cần chụp");
        const blob = await chupNode(node, { chanTrang: !the, tieuDe });
        if (huy) return;
        setAnh({ url: URL.createObjectURL(blob), blob });
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
        disabled={trangThai === "chup"}
        className={kieu === "nho" ? "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-semibold" : "inline-flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-lg border font-semibold"}
        style={{ borderColor: VIEN, color: TEXT, opacity: trangThai === "chup" ? 0.6 : 1, ...sans }}
        title="Tạo ảnh để gửi cho khách"
      >
        <Camera size={kieu === "nho" ? 13 : 15} />
        {trangThai === "chup" ? "Đang tạo ảnh…" : nhan}
      </button>

      {/* the chia se ve ngoai man hinh (chi che do `the`) */}
      {daVaoTrinhDuyet && the && trangThai === "chup" &&
        createPortal(
          <div aria-hidden="true" style={{ position: "fixed", left: -99999, top: 0, width: rong, pointerEvents: "none" }}>
            <div ref={theRef}>{the}</div>
          </div>,
          document.body
        )}

      {daVaoTrinhDuyet && (anh || loi) &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label="Ảnh đã tạo" className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={dong}>
            <div className="rounded-2xl border w-full max-w-3xl max-h-[92vh] flex flex-col" style={{ borderColor: VIEN, background: NEN_CARD, color: TEXT }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: VIEN }}>
                <span className="font-bold" style={sans}>{loi ? "Không tạo được ảnh" : "Ảnh đã sẵn sàng"}</span>
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
                    <img src={anh.url} alt="Ảnh xuất" className="mx-auto max-w-full h-auto rounded-lg" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t" style={{ borderColor: VIEN }}>
                    <Nut onClick={() => lam(async () => taiXuong(anh.blob, tenFile), "Đã tải ảnh về máy.")}>
                      <Download size={15} /> Tải ảnh
                    </Nut>
                    {coTheSaoChep() && (
                      <Nut onClick={() => lam(() => saoChep(anh.blob), "Đã sao chép ảnh — dán thẳng vào Zalo / Messenger.")}>
                        <Copy size={15} /> Sao chép ảnh
                      </Nut>
                    )}
                    {coTheChiaSe(anh.blob, tenFile) && (
                      <Nut onClick={() => lam(() => chiaSe(anh.blob, tenFile, tieuDe || "CloudStock"), "")}>
                        <Share2 size={15} /> Chia sẻ
                      </Nut>
                    )}
                    {thongBao && <span className="text-xs" style={{ color: XANH, ...sans }}>{thongBao}</span>}
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
