"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookmarkPlus } from "lucide-react";
import { KhungHop, OTaoDanhSach, useDongHop, viTriHop } from "@/components/HopChonDanhSach";
import { thaoTacDanhSach, useDanhSachTheoDoi } from "@/lib/danhSachTheoDoiClient";
import { GIOI_HAN, tenGoiY } from "@/lib/danhSachTheoDoiThuan";

const VIEN = "var(--vien)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const PRIMARY = "#6C5CE7";

function HopLuu({ dsMa, nutRef, danhSach, onDong }) {
  const hopRef = useRef(null);
  const [viTri, setViTri] = useState(null);
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState(null); // { id, ten, them } | { loi }
  useLayoutEffect(() => {
    if (nutRef.current) setViTri(viTriHop(nutRef.current));
  }, [nutRef]);
  useDongHop(true, onDong, [hopRef, nutRef]);
  const qua = dsMa.length > GIOI_HAN.soMa;
  // en-GB luon ra "dd/mm" (vi-VN tuy phien ban ICU co the ra "dd-mm")
  const ngay = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

  async function luu(hanhDong, ten) {
    setDang(true);
    setKq(null);
    try {
      const truoc = hanhDong.id != null ? (danhSach.find((d) => d.id === hanhDong.id)?.ma.length ?? 0) : 0;
      const d = await thaoTacDanhSach(hanhDong);
      const id = d.idMoi ?? hanhDong.id;
      const sau = d.danhSach.find((x) => x.id === id);
      setKq({ id, ten: sau?.ten ?? ten, them: (sau?.ma.length ?? 0) - truoc });
    } catch (e) {
      setKq({ loi: e.message });
    } finally {
      setDang(false);
    }
  }

  if (!viTri) return null;
  return (
    <KhungHop viTri={viTri} hopRef={hopRef} nhan="Lưu kết quả lọc vào danh sách">
      <p className="px-2 pt-1 pb-2 text-xs" style={{ color: MUTED }}>
        Lưu <b style={{ color: TEXT }}>{dsMa.length} mã</b> đang lọc vào danh sách
      </p>
      {qua ? (
        <p className="px-2 pb-2 text-sm" style={{ color: "var(--vang)" }}>
          Mỗi danh sách tối đa {GIOI_HAN.soMa} mã — hãy lọc bớt rồi lưu.
        </p>
      ) : (
        <>
          <OTaoDanhSach goiY={tenGoiY(danhSach?.map((d) => d.ten), `Lọc ${ngay}`)} nhanNut="Lưu" onTao={(ten) => luu({ loai: "tao", ten, ma: dsMa }, ten)} />
          {danhSach?.length > 0 && (
            <div className="border-t mt-1 pt-1 max-h-[40vh] overflow-y-auto" style={{ borderColor: "var(--vien-nhe)" }}>
              <p className="px-2 py-1 text-xs" style={{ color: MUTED }}>
                Hoặc thêm vào danh sách có sẵn
              </p>
              {danhSach.map((d) => (
                <button key={d.id} type="button" disabled={dang} onClick={() => luu({ loai: "them", id: d.id, ma: dsMa }, d.ten)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left hover:bg-[color:var(--hover-nhe)]">
                  <span className="flex-1 min-w-0 truncate">{d.ten}</span>
                  <span className="text-xs" style={{ color: MUTED }}>
                    {d.ma.length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {dang && (
        <p className="px-2 py-1 text-xs" style={{ color: MUTED }}>
          Đang lưu…
        </p>
      )}
      {kq?.loi && (
        <p className="px-2 py-1 text-xs" style={{ color: "var(--do)" }}>
          {kq.loi}
        </p>
      )}
      {kq?.id != null && (
        <p className="px-2 py-1.5 text-sm" style={{ color: "var(--xanh)" }}>
          Đã thêm {kq.them} mã vào «{kq.ten}».{" "}
          <Link href={`/danh-muc?ds=${kq.id}`} className="underline font-semibold" style={{ color: PRIMARY }}>
            Mở danh sách
          </Link>
        </p>
      )}
    </KhungHop>
  );
}

// NUT "LUU VAO DANH SACH" cua Bo loc: luu ca ket qua dang loc thanh danh sach moi (hoac them vao danh sach co san) - kieu "Save screen to watchlist" cua TradingView.
export default function NutLuuDanhSach({ dsMa, coDangNhap, moChuaDangNhap }) {
  const nutRef = useRef(null);
  const [mo, setMo] = useState(false);
  const { danhSach } = useDanhSachTheoDoi({ tuTai: coDangNhap });
  return (
    <>
      <button
        ref={nutRef}
        type="button"
        disabled={dsMa.length === 0}
        onClick={() => (coDangNhap ? setMo((v) => !v) : moChuaDangNhap?.())}
        aria-haspopup="dialog"
        aria-expanded={mo}
        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg"
        style={{ background: "var(--card)", border: `1px solid ${mo ? PRIMARY : VIEN}`, color: TEXT, fontFamily: "var(--font-chu)", opacity: dsMa.length === 0 ? 0.5 : 1 }}
        title="Lưu các mã đang lọc thành danh sách theo dõi"
      >
        <BookmarkPlus size={14} />
        Lưu vào danh sách
      </button>
      {mo && <HopLuu dsMa={dsMa} nutRef={nutRef} danhSach={danhSach} onDong={() => setMo(false)} />}
    </>
  );
}
