import { fmt, pct } from "@/components/dungChung";
import GiaiThichThem from "@/components/GiaiThichThem";
import { thongKeXuatHien, chenhLech } from "@/lib/xuatHienTinHieu";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const NGOC = "#22D3EE";
const CHU_SO = "'JetBrains Mono', monospace";

const TEN_LOAI = { goc: "Mua", giua: "Mua mới", moi: "Mua mới (sau TP3)" };
const ngayVN = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "—");
const gioVN = (v) =>
  v ? new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—";
const mauChenh = (v) => (v == null ? MUTED : v > 1 ? DO : v > 0.3 ? VANG : XANH);

function O({ nhan, giaTri, phu, mau }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: VIEN, background: "#0B0B10" }}>
      <p className="text-[11px]" style={{ color: MUTED }}>
        {nhan}
      </p>
      <p className="text-lg font-bold" style={{ fontFamily: CHU_SO, color: mau ?? TEXT }}>
        {giaTri}
      </p>
      {phu && (
        <p className="text-[10px]" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

function trangThai(r, ngayHomNay) {
  if (r.mat_tin_hieu) return r.ngay_mua >= ngayHomNay ? ["Đang mất (có thể hiện lại)", VANG] : ["Vượt giả — mất trước khi đóng cửa", DO];
  if (r.ngay_hien !== r.ngay_mua) return ["Hiện trễ (bỏ lỡ lần đẩy dữ liệu ngày tín hiệu)", MUTED];
  if (Number(r.so_lan_mat) > 0) return [`Chập chờn ${r.so_lan_mat} lần, giữ được`, VANG];
  return ["Giữ được đến cuối ngày", XANH];
}

// GIA THUC TE LUC TIN HIEU HIEN (trang Lenh da dong): gia vao tren web la gia MOC CHUYEN MUA (mua dung luc gia vuot moc) - o day ghi gia luc tin hieu hien LAN DAU tren web,
// gia cuoi ngay tin hieu va cac tin hieu hien trong phien roi mat truoc khi dong cua (vuot gia), de biet nguoi that mua duoc cach moc bao xa. rows: bang tin_hieu_xuat_hien (layXuatHien).
export default function ChatLuongTinHieu({ rows = [], ngayHomNay, loi }) {
  const tk = thongKeXuatHien(rows, ngayHomNay);
  const ganNhat = rows.slice(0, 25);
  return (
    <section className="mt-10">
      <h2 className="text-lg mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        <span data-may="gia-thuc-te">Giá thực tế lúc tín hiệu hiện</span>
      </h2>
      <GiaiThichThem className="mb-4" tomTat="Giá lúc tín hiệu hiện lần đầu so với mốc, và các tín hiệu vượt giả (hiện rồi mất trước khi đóng cửa).">
        Giá mua của lệnh Mua trên web là <b>mốc chuyển mua</b> — chỉ đạt được nếu mua đúng lúc giá vượt mốc. Phần này ghi giá lúc tín hiệu hiện <b>lần đầu</b> trên web, giá cuối
        ngày tín hiệu, và những tín hiệu hiện trong phiên rồi <b>mất trước khi đóng cửa</b> (vượt giả) — để biết người mua thật cách mốc bao xa. Backtest 11 năm: mua cao hơn mốc quá 1%
        thì trung bình lỗ. Bắt đầu ghi từ 27/09/2026.
      </GiaiThichThem>
      {loi && (
        <p className="text-sm mb-3" style={{ color: DO }}>
          Không tải được dữ liệu: {loi}
        </p>
      )}
      {!loi && rows.length === 0 && (
        <div className="rounded-2xl border p-5 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
          Chưa có dữ liệu — tín hiệu Mua / Mua mới đầu tiên sau lần đẩy dữ liệu tiếp theo sẽ được ghi ở đây.
        </div>
      )}
      {Object.entries(tk).map(([loai, t]) => (
        <div key={loai} className="mb-4">
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: loai === "goc" ? XANH : NGOC, fontFamily: CHU_SO }}>
            {TEN_LOAI[loai]} · {t.soTinHieu} tín hiệu ({t.soTrongPhien} hiện trong phiên)
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <O
              nhan={loai === "goc" ? "Giá lúc hiện so với mốc" : "Giá lúc hiện so với giá hệ thống"}
              giaTri={t.chenhLucHienTB == null ? "—" : pct(t.chenhLucHienTB, 2)}
              phu={t.chenhLucHienTrungVi == null ? `${t.soHienTre} tín hiệu hiện trễ không tính` : `trung vị ${pct(t.chenhLucHienTrungVi, 2)} · ${t.soDoChenh} tín hiệu`}
              mau={mauChenh(t.chenhLucHienTB)}
            />
            <O nhan={loai === "goc" ? "Giá cuối ngày tín hiệu so với mốc" : "Giá cuối ngày so với giá hệ thống"} giaTri={t.chenhCuoiNgayTB == null ? "—" : pct(t.chenhCuoiNgayTB, 2)} phu="lần đẩy dữ liệu cuối cùng trong ngày" mau={mauChenh(t.chenhCuoiNgayTB)} />
            <O
              nhan="Vượt giả (mất trước khi đóng cửa)"
              giaTri={t.soDaChot ? `${t.soVuotGia}/${t.soDaChot}` : "—"}
              phu={t.tyLeVuotGia == null ? "chưa có ngày tín hiệu nào kết thúc" : `${pct(t.tyLeVuotGia, 1).replace("+", "")} số tín hiệu`}
              mau={t.soVuotGia > 0 ? DO : TEXT}
            />
            <O nhan="Chập chờn nhưng giữ được" giaTri={t.soTungChapChon} phu={t.dangMat > 0 ? `${t.dangMat} tín hiệu hôm nay đang mất` : "mất rồi hiện lại trong ngày"} />
          </div>
        </div>
      ))}
      {ganNhat.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: CHU_SO }}>
              <thead>
                <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                  <th className="py-2.5 px-3 font-normal">Mã</th>
                  <th className="py-2.5 px-3 font-normal">Ngày tín hiệu</th>
                  <th className="py-2.5 px-3 font-normal text-right">Giá hệ thống</th>
                  <th className="py-2.5 px-3 font-normal text-right">Hiện lúc</th>
                  <th className="py-2.5 px-3 font-normal text-right">Giá lúc hiện</th>
                  <th className="py-2.5 px-3 font-normal text-right">Cuối ngày</th>
                  <th className="py-2.5 px-3 font-normal">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {ganNhat.map((r, i) => {
                  const c1 = chenhLech(r.gia_luc_hien, r.gia_moc);
                  const c2 = chenhLech(r.gia_cuoi_ngay, r.gia_moc);
                  const [tt, mauTT] = trangThai(r, ngayHomNay);
                  return (
                    <tr key={`${r.ma}|${r.loai}|${r.ngay_mua}`} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                      <td className="py-2 px-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <b>{r.ma}</b>
                        <span className="ml-1.5 text-[10px] font-bold" style={{ color: r.loai === "goc" ? MUTED : NGOC }}>
                          {TEN_LOAI[r.loai]}
                        </span>
                      </td>
                      <td className="py-2 px-3">{ngayVN(r.ngay_mua)}</td>
                      <td className="py-2 px-3 text-right">{fmt(r.gia_moc)}</td>
                      <td className="py-2 px-3 text-right" style={{ color: MUTED }}>
                        {gioVN(r.luc_hien)}
                        {r.trong_phien === false ? " · ngoài phiên" : ""}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {fmt(r.gia_luc_hien)} <span style={{ color: mauChenh(c1) }}>({pct(c1, 1)})</span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {r.gia_cuoi_ngay != null ? (
                          <>
                            {fmt(r.gia_cuoi_ngay)} <span style={{ color: mauChenh(c2) }}>({pct(c2, 1)})</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 px-3 text-[11px]" style={{ color: mauTT, fontFamily: "'Inter', sans-serif" }}>
                        {tt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
