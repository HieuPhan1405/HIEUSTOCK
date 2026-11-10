"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Bell, BellRing, BookmarkPlus, Pencil, RefreshCw, Trash2, Lock, Check, X } from "lucide-react";
import { locTheoDinhNghia, cungDinhNghia, GIOI_HAN_BO_LOC } from "@/lib/boLocLuuThuan";
import { hoTroDay, laIOSChuaCaiDat, layDangKyHienTai, batDay } from "@/lib/dayTrinhDuyet";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const PRIMARY = "#6C5CE7";

async function goi(duongDan, thanSua) {
  const res = await fetch(duongDan, thanSua ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(thanSua) } : { cache: "no-store" });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.loi || "Máy chủ báo lỗi, thử lại sau.");
  return d;
}

// BO LOC CA NHAN (kieu FireAnt): luu bo loc dang chon, bam lai de ap dung, bat chuong de nhan thong bao ve may khi co ma MOI khop.
// loc / locChiBao / sapXep = trang thai bo loc hien tai cua BangBoLoc; onAp(dinhNghia) dat lai bo loc theo ban da luu; moDangNhap mo hop dang ky / dang nhap.
export default function KhungBoLocCuaToi({ loc, locChiBao, sapXep, duLieu, coBoLoc, nguoiDung, onAp, moDangNhap, idTuUrl = null }) {
  const [ds, setDs] = useState(null); // null = dang tai / khach
  const [chon, setChon] = useState(null); // id bo loc dang ap dung
  const [dangLuu, setDangLuu] = useState(false); // o nhap ten dang mo
  const [ten, setTen] = useState("");
  const [doiTen, setDoiTen] = useState(false);
  const [dangLam, setDangLam] = useState(false);
  const [loi, setLoi] = useState("");
  const [tin, setTin] = useState("");
  const [day, setDay] = useState({ hoTro: false, ios: false, dangBat: false });
  const khoaDay = useRef(null);
  const daApUrl = useRef(false);

  const ap = useCallback(
    (b) => {
      setChon(b.id);
      setDoiTen(false);
      setDangLuu(false);
      setLoi("");
      setTin("");
      onAp(b.dinhNghia);
    },
    [onAp]
  );

  useEffect(() => {
    if (!nguoiDung) return;
    let huy = false;
    goi("/api/bo-loc-luu")
      .then((d) => {
        if (huy) return;
        const list = d.danhSach ?? [];
        setDs(list);
        // Mo tu thong bao day (?loc=ID): ap dung bo loc do 1 lan khi danh sach da tai.
        const b = idTuUrl && !daApUrl.current ? list.find((x) => String(x.id) === String(idTuUrl)) : null;
        if (b) {
          daApUrl.current = true;
          ap(b);
        }
      })
      .catch((e) => !huy && setLoi(String(e.message || e)));
    // Khoa day lay san de luc bam chuong chi con viec xin quyen (trinh duyet chi cho xin quyen ngay sau 1 lan bam).
    goi("/api/thong-bao")
      .then((d) => (khoaDay.current = d.khoaDay ?? null))
      .catch(() => {});
    (async () => {
      const hoTro = hoTroDay();
      const sub = hoTro ? await layDangKyHienTai().catch(() => null) : null;
      if (!huy) setDay({ hoTro, ios: laIOSChuaCaiDat(), dangBat: !!sub });
    })();
    return () => {
      huy = true;
    };
  }, [nguoiDung, idTuUrl, ap]);

  const dang = useMemo(() => ({ loc, locChiBao }), [loc, locChiBao]);
  const dem = useMemo(() => (ds ?? []).map((b) => locTheoDinhNghia(duLieu, b.dinhNghia, { coNguoiDung: !!nguoiDung }).length), [ds, duLieu, nguoiDung]);

  const hienTai = ds?.find((b) => b.id === chon) ?? null;
  const daSua = hienTai ? !cungDinhNghia(dang, hienTai.dinhNghia) : false;
  const dinhNghiaHienTai = { loc, locChiBao, sapXep };

  async function lam(viec) {
    setDangLam(true);
    setLoi("");
    setTin("");
    try {
      await viec();
    } catch (e) {
      setLoi(String(e?.message || e));
    } finally {
      setDangLam(false);
    }
  }

  const luuMoi = () =>
    lam(async () => {
      const d = await goi("/api/bo-loc-luu", { loai: "tao", ten, dinhNghia: dinhNghiaHienTai });
      setDs(d.danhSach);
      setChon(d.idMoi);
      setDangLuu(false);
      setTen("");
      setTin("Đã lưu. Bấm chuông để nhận thông báo về máy khi có mã mới khớp bộ lọc này.");
    });
  const capNhat = () =>
    lam(async () => {
      const d = await goi("/api/bo-loc-luu", { loai: "capNhat", id: hienTai.id, dinhNghia: dinhNghiaHienTai });
      setDs(d.danhSach);
      setTin("Đã cập nhật bộ lọc theo điều kiện đang chọn.");
    });
  const luuTen = () =>
    lam(async () => {
      const d = await goi("/api/bo-loc-luu", { loai: "doiTen", id: hienTai.id, ten });
      setDs(d.danhSach);
      setDoiTen(false);
    });
  const xoa = () =>
    lam(async () => {
      if (!window.confirm(`Xoá bộ lọc “${hienTai.ten}”?`)) return;
      const d = await goi("/api/bo-loc-luu", { loai: "xoa", id: hienTai.id });
      setDs(d.danhSach);
      setChon(null);
    });
  const doiChuong = () =>
    lam(async () => {
      const bat = !hienTai.baoVeMay;
      if (bat && !day.dangBat) {
        if (day.ios) throw new Error("Trên iPhone/iPad: mở web từ biểu tượng trên Màn hình chính (Chia sẻ → Thêm vào Màn hình chính) rồi bật lại.");
        if (!day.hoTro) throw new Error("Trình duyệt này chưa hỗ trợ thông báo về máy. Hãy dùng Chrome, Edge hoặc Safari bản mới.");
        if (!khoaDay.current) throw new Error("Chưa lấy được khoá thông báo, tải lại trang rồi thử lại.");
        await batDay(khoaDay.current);
        setDay((c) => ({ ...c, dangBat: true }));
      }
      const d = await goi("/api/bo-loc-luu", { loai: "baoVeMay", id: hienTai.id, bat });
      setDs(d.danhSach);
      setTin(bat ? "Đã bật. Khi có mã mới khớp bộ lọc này, thông báo sẽ về máy bạn (kiểm tra mỗi lần dữ liệu cập nhật trong phiên)." : "Đã tắt thông báo cho bộ lọc này.");
    });

  const nut = "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border";

  // KHACH: gioi thieu tinh nang, bam de dang ky dung thu.
  if (!nguoiDung) {
    return (
      <section className="rounded-2xl border mb-4 px-4 py-3 flex flex-wrap items-center gap-3" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="Bộ lọc của tôi">
        <div className="flex items-center gap-2 min-w-0 flex-1" style={{ minWidth: 220 }}>
          <BellRing size={16} color={PRIMARY} aria-hidden="true" />
          <p className="text-sm" style={{ color: TEXT, fontFamily: "var(--font-chu)" }}>
            <b>Bộ lọc của tôi</b> — lưu bộ lọc yêu thích và nhận thông báo về máy khi có mã mới khớp.
          </p>
        </div>
        <button type="button" onClick={moDangNhap} className={nut} style={{ borderColor: PRIMARY, color: PRIMARY, fontFamily: "var(--font-chu)" }}>
          <Lock size={12} aria-hidden="true" />
          Dùng thử miễn phí để lưu bộ lọc
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border mb-4 px-4 py-3" style={{ borderColor: hienTai ? PRIMARY : VIEN, background: NEN_CARD }} aria-label="Bộ lọc của tôi">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-bold mr-1" style={{ color: TEXT, fontFamily: "var(--font-chu)" }}>
          <BellRing size={15} color={PRIMARY} aria-hidden="true" />
          Bộ lọc của tôi
        </span>
        {ds === null && !loi && (
          <span className="text-xs" style={{ color: MUTED }}>
            Đang tải…
          </span>
        )}
        {ds?.length === 0 && !dangLuu && (
          <span className="text-xs" style={{ color: MUTED }}>
            Chưa có bộ lọc nào. Chọn điều kiện bên dưới rồi bấm “Lưu bộ lọc này”.
          </span>
        )}
        {(ds ?? []).map((b, i) => {
          const dangChon = b.id === chon;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => ap(b)}
              aria-pressed={dangChon}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border"
              style={{ borderColor: dangChon ? PRIMARY : VIEN, background: dangChon ? "rgba(108,92,231,0.16)" : "transparent", color: dangChon ? "var(--tim-chu)" : TEXT, fontFamily: "var(--font-chu)", fontWeight: dangChon ? 700 : 500 }}
            >
              {b.baoVeMay && <BellRing size={11} aria-label="Đang báo về máy" />}
              {b.ten}
              <span style={{ color: MUTED, fontWeight: 400 }}>{dem[i] ?? 0}</span>
            </button>
          );
        })}
        {ds && !dangLuu && (
          <button
            type="button"
            onClick={() => {
              setDangLuu(true);
              setDoiTen(false);
              setTen("");
              setLoi("");
              setTin("");
            }}
            disabled={!coBoLoc || ds.length >= GIOI_HAN_BO_LOC.soBoLoc}
            title={!coBoLoc ? "Hãy chọn ít nhất một điều kiện lọc trước" : ds.length >= GIOI_HAN_BO_LOC.soBoLoc ? `Tối đa ${GIOI_HAN_BO_LOC.soBoLoc} bộ lọc` : "Lưu các điều kiện đang chọn"}
            className={`${nut} ml-auto disabled:opacity-40`}
            style={{ borderColor: PRIMARY, color: PRIMARY, fontFamily: "var(--font-chu)" }}
          >
            <BookmarkPlus size={13} aria-hidden="true" />
            Lưu bộ lọc này
          </button>
        )}
      </div>

      {dangLuu && (
        <form
          className="flex flex-wrap items-center gap-2 mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            luuMoi();
          }}
        >
          <input
            autoFocus
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            maxLength={GIOI_HAN_BO_LOC.doDaiTen}
            placeholder="Đặt tên, ví dụ: Quá bán + dòng tiền vào"
            aria-label="Tên bộ lọc"
            className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: "var(--nen-phu)", border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)" }}
          />
          <button type="submit" disabled={dangLam || !ten.trim()} className={`${nut} disabled:opacity-50`} style={{ background: PRIMARY, borderColor: PRIMARY, color: "#fff", fontFamily: "var(--font-chu)" }}>
            <Check size={13} aria-hidden="true" />
            Lưu
          </button>
          <button type="button" onClick={() => setDangLuu(false)} className={nut} style={{ borderColor: VIEN, color: MUTED }}>
            Huỷ
          </button>
        </form>
      )}

      {hienTai && !dangLuu && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: VIEN }}>
          {doiTen ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                luuTen();
              }}
            >
              <input autoFocus value={ten} onChange={(e) => setTen(e.target.value)} maxLength={GIOI_HAN_BO_LOC.doDaiTen} aria-label="Tên mới" className="px-3 py-1.5 text-sm rounded-lg outline-none" style={{ background: "var(--nen-phu)", border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)" }} />
              <button type="submit" disabled={dangLam || !ten.trim()} className={`${nut} disabled:opacity-50`} style={{ borderColor: PRIMARY, color: PRIMARY }}>
                <Check size={13} aria-hidden="true" />
                Lưu
              </button>
              <button type="button" onClick={() => setDoiTen(false)} className={nut} style={{ borderColor: VIEN, color: MUTED }} aria-label="Huỷ đổi tên">
                <X size={13} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <>
              <button type="button" onClick={doiChuong} disabled={dangLam} className={`${nut} disabled:opacity-50`} style={hienTai.baoVeMay ? { background: PRIMARY, borderColor: PRIMARY, color: "#fff", fontFamily: "var(--font-chu)" } : { borderColor: PRIMARY, color: PRIMARY, fontFamily: "var(--font-chu)" }} aria-pressed={hienTai.baoVeMay}>
                {hienTai.baoVeMay ? <BellRing size={13} aria-hidden="true" /> : <Bell size={13} aria-hidden="true" />}
                {hienTai.baoVeMay ? "Đang báo về máy" : "Báo về máy khi có mã mới"}
              </button>
              {daSua && (
                <button type="button" onClick={capNhat} disabled={dangLam || !coBoLoc} className={`${nut} disabled:opacity-50`} style={{ borderColor: VIEN, color: TEXT, fontFamily: "var(--font-chu)" }} title="Ghi đè bộ lọc đã lưu bằng điều kiện đang chọn">
                  <RefreshCw size={12} aria-hidden="true" />
                  Cập nhật theo điều kiện đang chọn
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setTen(hienTai.ten);
                  setDoiTen(true);
                }}
                className={nut}
                style={{ borderColor: VIEN, color: MUTED }}
              >
                <Pencil size={12} aria-hidden="true" />
                Đổi tên
              </button>
              <button type="button" onClick={xoa} disabled={dangLam} className={`${nut} disabled:opacity-50`} style={{ borderColor: VIEN, color: "var(--do)" }}>
                <Trash2 size={12} aria-hidden="true" />
                Xoá
              </button>
            </>
          )}
          {hienTai.baoVeMay && !day.dangBat && !doiTen && (
            <span className="text-[11px] w-full" style={{ color: "var(--vang)" }}>
              Thiết bị này chưa bật thông báo — bấm chuông ở thanh trên cùng hoặc tắt rồi bật lại nút này để nhận về máy.
            </span>
          )}
        </div>
      )}

      {(loi || tin) && (
        <p className="text-xs mt-2" role={loi ? "alert" : "status"} style={{ color: loi ? "var(--do)" : MUTED }}>
          {loi || tin}
        </p>
      )}
    </section>
  );
}
