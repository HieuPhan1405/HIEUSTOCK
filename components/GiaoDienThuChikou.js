import Link from "next/link";
import { soSanhChikou } from "@/lib/soSanhChikou";
import BangLenhMo from "@/components/BangLenhMo";
import SignalPill from "@/components/SignalPill";
import { fmt, pct } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";

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

function BangSoSanh({ tieuDe, moTa, dong, coCotChikou }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        {tieuDe} ({dong.length})
      </h2>
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        {moTa}
      </p>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                <th className="py-3 px-3 font-normal">Mã</th>
                <th className="py-3 px-3 font-normal text-right">Giá</th>
                <th className="py-3 px-3 font-normal text-right">Bản thường</th>
                <th className="py-3 px-3 font-normal text-right">Lãi/Lỗ (thường)</th>
                <th className="py-3 px-3 font-normal text-right">Số phiên giữ</th>
                <th className="py-3 px-3 font-normal text-right">{coCotChikou ? "Bản Chikou" : "Bản Chikou (không giữ)"}</th>
              </tr>
            </thead>
            <tbody>
              {dong.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-5 text-center text-sm" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Không có mã nào.
                  </td>
                </tr>
              )}
              {dong.map((x, i) => {
                const r = x.thuong || x.chikou;
                return (
                  <tr key={x.ma} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                    <td className="py-2.5 px-3">
                      <Link href={`/ma/${x.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        {x.ma}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-right">{fmt(r?.gia)}</td>
                    <td className="py-2.5 px-3 text-right">{x.thuong ? <SignalPill tin={x.thuong.tin} /> : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: (x.thuong?.lai_lo_pct ?? 0) >= 0 ? XANH : DO }}>
                      {x.thuong ? pct(x.thuong.lai_lo_pct, 2) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right" style={{ color: MUTED }}>
                      {x.thuong?.so_phien_giu ?? "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">{x.chikou ? <SignalPill tin={x.chikou.tin} /> : <span style={{ color: MUTED }}>không có dữ liệu</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const dinhDangGio = (v) => (v ? new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "chưa có");


// Giao dien trang thu nghiem Chikou - tach rieng de kiem tra bang du lieu gia lap.
export default function GiaoDienThuChikou({ thuong, chikou, loi }) {
  const chuaCoDuLieu = !loi && chikou.length === 0;
  const s = !loi && !chuaCoDuLieu ? soSanhChikou(thuong, chikou) : null;
  const chikouMo = chikou.filter((r) => r.tin === "MUA" || r.tin === "NAM GIU");
  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Thử nghiệm Chikou thoáng
      </h1>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        So sánh bản thường với bản chỉ mua khi Chikou Span thông thoáng (trên giá và trên mây). Đây là dữ liệu thử — <b>không ảnh hưởng</b> dữ liệu thật
        và không gửi thông báo.
      </p>

      {loi && (
        <p className="text-sm mb-6" style={{ color: DO }}>
          Lỗi tải dữ liệu: {loi}
        </p>
      )}

      {chuaCoDuLieu && (
        <div className="rounded-2xl border p-5 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
          <p className="mb-2" style={{ color: TEXT, fontWeight: 700 }}>
            Chưa có dữ liệu bản Chikou.
          </p>
          <p>
            Trong AmiBroker chạy Explore bằng file <b>10_Export_ChikouFilter.afl</b> (Apply to = All Symbols) rồi bấm <b>DAY_LEN_WEB.bat</b> trên Desktop — file{" "}
            <code>tin_hieu_hom_nay_TEST_chikou.csv</code> sẽ được đưa vào đây.
          </p>
        </div>
      )}

      {s && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <The so={s.soThuong} nhan="Đang giữ — bản thường" />
            <The so={s.soChikou} nhan="Đang giữ — bản Chikou" mau={VANG} />
            <The
              so={s.biLoai.length}
              nhan="Bị Chikou loại"
              phu={s.biLoai.length ? `${s.soBiLoaiLo} đang lỗ · ${s.soBiLoaiLai} đang lãi` : undefined}
              mau={s.biLoai.length ? DO : MUTED}
            />
            <The
              so={s.cungGiu.length}
              nhan="Giữ ở cả hai bản"
              phu={s.cungGiu.length ? `${s.soCungGiuLo} đang lỗ · ${s.soCungGiuLai} đang lãi` : undefined}
              mau={XANH}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <The so={s.laiTBBiLoai == null ? "—" : pct(s.laiTBBiLoai, 2)} nhan="Lãi/lỗ TB nhóm bị loại (theo bản thường)" mau={(s.laiTBBiLoai ?? 0) >= 0 ? XANH : DO} />
            <The so={s.laiTBCungGiu == null ? "—" : pct(s.laiTBCungGiu, 2)} nhan="Lãi/lỗ TB nhóm giữ ở cả hai (theo bản thường)" mau={(s.laiTBCungGiu ?? 0) >= 0 ? XANH : DO} />
          </div>
          <p className="text-[11px] mb-8" style={{ color: MUTED }}>
            Cách đọc: nếu nhóm bị loại lãi/lỗ TB <b>thấp hơn</b> nhóm còn lại thì bộ lọc Chikou đang gạt đúng các lệnh yếu; nếu <b>cao hơn</b> thì đang gạt nhầm lệnh tốt.
            Dữ liệu thường cập nhật lúc {dinhDangGio(s.capNhatThuong)}, dữ liệu Chikou lúc {dinhDangGio(s.capNhatChikou)} — hai thời điểm càng gần nhau
            (nên cùng một lần Explore) thì so sánh càng đáng tin. Đây chỉ là ảnh chụp hôm nay, không thay backtest trong AmiBroker.
          </p>

          <BangSoSanh
            tieuDe="Bản thường đang giữ nhưng Chikou LOẠI"
            moTa="Các mã bản thường đã MUA/NẮM GIỮ nhưng bản Chikou không giữ (chưa vào lệnh hoặc đã bán)."
            dong={s.biLoai}
          />
          <BangSoSanh
            tieuDe="Chỉ bản Chikou đang giữ"
            moTa="Các mã bản Chikou đang giữ mà bản thường không giữ (thường do khác thời điểm vào/ra lệnh)."
            dong={s.chiChikou}
            coCotChikou
          />

          <h2 className="text-lg mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Lệnh đang mở theo bản Chikou ({chikouMo.length})
          </h2>
          <p className="text-xs mb-3" style={{ color: MUTED }}>
            Cùng bảng vùng mua / cắt lỗ / chốt lời như Sổ lệnh, nhưng lấy từ bản thử.
          </p>
          <BangLenhMo duLieu={chikouMo} />
        </>
      )}
    </div>
  );
}
