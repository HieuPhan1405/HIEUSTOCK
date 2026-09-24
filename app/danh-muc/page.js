import Link from "next/link";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import { layThamGiaCuaToi } from "@/lib/thamGia";
import { layLenhDaDong } from "@/lib/lenhDaDong";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import BangLenhMo from "@/components/BangLenhMo";
import LenhDaDongView from "@/components/LenhDaDongView";
import SignalPill from "@/components/SignalPill";
import NhanCapNhat from "@/components/NhanCapNhat";
import { fmt, pct, capNhatMoiNhat, chamTPCaoNhat } from "@/components/dungChung";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Danh mục theo dõi",
  description: "Danh mục các mã bạn đã tham gia: lệnh đang giữ, vùng mua, cắt lỗ, chốt lời, lãi/lỗ và các lệnh đã đóng.",
};

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const DO = "#EF4444";

const dangGiu = (r) => r.tin === "MUA" || r.tin === "NAM GIU";

function The({ so, nhan, phu, mau }) {
  return (
    <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: mau }}>
        {so}
      </p>
      <p className="text-xs mt-1" style={{ color: MUTED }}>
        {nhan}
      </p>
      {phu && (
        <p className="text-[11px]" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

function TieuDeMuc({ children, phu }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        {children}
      </h2>
      {phu && (
        <p className="text-xs" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

export default async function TrangDanhMuc() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Danh mục theo dõi"
        moTa="Đăng ký hoặc đăng nhập miễn phí để lập danh mục các mã bạn tham gia: lệnh đang giữ, lãi/lỗ, vùng mua - cắt lỗ - chốt lời và lệnh đã đóng."
        choDuyet={!!nguoiDung}
      />
    );
  }

  let thamGia = [];
  let tatCa = [];
  let loi = null;
  try {
    [thamGia, tatCa] = await Promise.all([layThamGiaCuaToi(nguoiDung.id), layTatCaTinHieu()]);
  } catch (e) {
    loi = String(e?.message || e);
  }
  // Lenh da dong tai rieng: loi o day khong duoc lam mat phan lenh dang giu.
  let daDong = [];
  let loiDaDong = null;
  try {
    daDong = await layLenhDaDong();
  } catch (e) {
    loiDaDong = String(e?.message || e);
  }

  const ngayThamGia = new Map(thamGia.map((t) => [t.ma, t.ngay_tham_gia]));
  const cuaToi = tatCa.filter((r) => ngayThamGia.has(r.ma));
  const dsDangGiu = cuaToi.filter(dangGiu);
  const dsTheoDoi = cuaToi.filter((r) => !dangGiu(r));
  const maChuaCoDuLieu = thamGia.filter((t) => !tatCa.some((r) => r.ma === t.ma));
  // Lenh da dong chi tinh tu luc tham gia (ban/chot tu ngay tham gia tro di).
  const dsDaDong = daDong.filter((x) => ngayThamGia.has(x.ma) && x.ngay_ban >= ngayThamGia.get(x.ma));

  const soLai = dsDangGiu.filter((r) => r.lai_lo_pct > 0).length;
  const laiLoTB = dsDangGiu.length ? dsDangGiu.reduce((t, r) => t + (r.lai_lo_pct ?? 0), 0) / dsDangGiu.length : null;
  const soDaChot = dsDangGiu.filter((r) => chamTPCaoNhat(r) != null).length;
  const mauLai = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Danh mục theo dõi
      </h1>
      <p className="text-sm mb-3" style={{ color: MUTED }}>
        Mã nào bạn bấm nút tham gia (biểu tượng người cạnh mã ở{" "}
        <Link href="/bo-loc" className="underline" style={{ color: PRIMARY }}>
          Bộ lọc
        </Link>{" "}
        hoặc{" "}
        <Link href="/lenh-mo" className="underline" style={{ color: PRIMARY }}>
          Sổ lệnh
        </Link>
        ) sẽ tự vào đây cùng lệnh hiện tại của mã đó, và tự chuyển sang &quot;Lệnh đã đóng&quot; khi lệnh kết thúc hoặc chốt đủ TP3.
      </p>
      <NhanCapNhat luc={capNhatMoiNhat(tatCa)} className="mb-6" />

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      {!loi && thamGia.length === 0 && (
        <div className="rounded-2xl border p-8 text-center mb-8" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-base mb-2" style={{ fontWeight: 600 }}>
            Danh mục của bạn đang trống
          </p>
          <p className="text-sm mb-4" style={{ color: MUTED }}>
            Vào Bộ lọc hoặc Sổ lệnh, bấm nút tham gia cạnh mã bạn đã vào lệnh (hoặc muốn theo dõi sát). Lệnh của mã đó sẽ tự hiện ở đây.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/lenh-mo" className="px-4 py-2 rounded-lg" style={{ background: PRIMARY, color: "#FFFFFF" }}>
              Mở Sổ lệnh đang mở
            </Link>
            <Link href="/bo-loc" className="px-4 py-2 rounded-lg border" style={{ borderColor: VIEN, color: TEXT }}>
              Mở Bộ lọc cổ phiếu
            </Link>
          </div>
        </div>
      )}

      {thamGia.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <The so={dsDangGiu.length} nhan="Lệnh đang giữ" phu={`${cuaToi.length}/${thamGia.length} mã có dữ liệu`} />
            <The so={laiLoTB == null ? "—" : pct(laiLoTB, 2)} nhan="Lãi/lỗ trung bình" mau={mauLai(laiLoTB)} />
            <The so={dsDangGiu.length ? `${soLai}/${dsDangGiu.length}` : "—"} nhan="Đang lãi" mau={XANH} />
            <The so={dsDangGiu.length ? `${soDaChot}/${dsDangGiu.length}` : "—"} nhan="Đã chạm chốt lời" mau="#FBBF24" />
          </div>

          <section className="mb-10">
            <TieuDeMuc phu="Giá mua, vùng mua, cắt lỗ, chốt lời và lãi/lỗ lấy theo lệnh của hệ thống, không phải giá khớp thật của bạn.">Đang nắm giữ</TieuDeMuc>
            {dsDangGiu.length > 0 ? (
              <BangLenhMo duLieu={dsDangGiu} />
            ) : (
              <div className="rounded-2xl border p-5 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
                Chưa có mã nào trong danh mục đang ở trạng thái MUA hoặc NẮM GIỮ.
              </div>
            )}
          </section>

          {(dsTheoDoi.length > 0 || maChuaCoDuLieu.length > 0) && (
            <section className="mb-10">
              <TieuDeMuc phu="Đã tham gia nhưng hiện chưa có lệnh mở (chưa có tín hiệu MUA hoặc lệnh đã kết thúc).">Đang theo dõi</TieuDeMuc>
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <thead>
                      <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                        <th className="py-3 px-3 font-normal">Mã</th>
                        <th className="py-3 px-3 font-normal">Trạng thái</th>
                        <th className="py-3 px-3 font-normal text-right">Giá</th>
                        <th className="py-3 px-3 font-normal text-right">Điểm</th>
                        <th className="py-3 px-3 font-normal text-right">Tham gia từ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dsTheoDoi.map((r, i) => (
                        <tr key={r.ma} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                          <td className="py-2.5 px-3">
                            <Link href={`/ma/${r.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                              {r.ma}
                            </Link>
                            {r.ten_ngan && (
                              <span className="block max-w-[190px] truncate text-[10px] leading-tight" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }} title={r.ten_cong_ty}>
                                {r.ten_ngan}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <SignalPill tin={r.tin} />
                          </td>
                          <td className="py-2.5 px-3 text-right">{fmt(r.gia)}</td>
                          <td className="py-2.5 px-3 text-right">{fmt(r.diem)}</td>
                          <td className="py-2.5 px-3 text-right" style={{ color: MUTED }}>
                            {ngayThamGia.get(r.ma)?.split("-").reverse().join("/")}
                          </td>
                        </tr>
                      ))}
                      {maChuaCoDuLieu.map((t) => (
                        <tr key={t.ma} className="border-t" style={{ borderColor: "#1D1D26" }}>
                          <td className="py-2.5 px-3" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                            {t.ma}
                          </td>
                          <td className="py-2.5 px-3 text-xs" colSpan={3} style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                            Chưa có dữ liệu tín hiệu cho mã này
                          </td>
                          <td className="py-2.5 px-3 text-right" style={{ color: MUTED }}>
                            {t.ngay_tham_gia.split("-").reverse().join("/")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          <section>
            {loiDaDong && (
              <p className="text-sm mb-3" style={{ color: DO }}>
                Không tải được lệnh đã đóng: {loiDaDong}
              </p>
            )}
            <LenhDaDongView
              nhung
              ds={dsDaDong}
              tieuDe="Lệnh đã đóng của tôi"
              moTa="Các lệnh của những mã bạn đã tham gia, bán/thoát hoặc chốt đủ TP3 kể từ ngày bạn tham gia mã đó."
            />
          </section>
        </>
      )}
    </div>
  );
}
