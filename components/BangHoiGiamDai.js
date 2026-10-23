import Link from "next/link";
import { fmt, pct, nhe } from "@/components/dungChung";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const sans = { fontFamily: "var(--font-chu)" };
const mono = { fontFamily: "var(--font-chu)" };
const MAU_NHAN = { uu: XANH, yeu: VANG };

const ngayLai = (cach) => (cach === 0 ? "hôm nay" : `${cach} phiên trước`);

function NhanNganh({ x }) {
  if (!x.nhanNganh.nhan) return null;
  const mau = MAU_NHAN[x.nhanNganh.loai];
  return (
    <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-sm whitespace-nowrap" style={{ background: nhe(mau, 13), color: mau, ...sans }} title={x.nhanNganh.ghiChu}>
      {x.nhanNganh.nhan}
    </span>
  );
}

function Khung({ tieuDe, moTa, soLuong, mau, children }) {
  return (
    <section className="rounded-2xl border mb-8 overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD, borderTop: `3px solid ${mau}` }}>
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--vien-nhe)" }}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base" style={{ ...sans, fontWeight: 700, color: mau }}>{tieuDe}</h2>
          <span className="text-2xl" style={{ ...mono, fontWeight: 700, color: soLuong > 0 ? mau : MUTED }}>{soLuong}</span>
        </div>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: MUTED }}>{moTa}</p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

const TH = "py-2.5 px-3 font-normal whitespace-nowrap";
const Ma = ({ x }) => (
  <td className="py-2.5 px-3">
    <Link href={`/ma/${x.ma}`} className="hover:underline" style={{ ...sans, fontWeight: 700 }}>{x.ma}</Link>
    <NhanNganh x={x} />
    {x.nganh && <span className="block text-[10px]" style={{ color: MUTED, ...sans }}>{x.nganh}</span>}
  </td>
);

export default function BangHoiGiamDai({ dangCam, gan }) {
  return (
    <>
      <Khung
        tieuDe="Đang cầm nhịp hồi"
        mau={XANH}
        soLuong={dangCam.length}
        moTa="Mã đã đủ 4 điều kiện và đang trong nhịp hồi — cầm cho tới khi đóng cửa dưới MA50 (bán mở cửa phiên sau) hoặc thủng cắt lỗ −10% so với giá vào."
      >
        <table className="w-full text-sm" style={mono}>
          <thead>
            <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, ...sans }}>
              <th className={TH}>Mã</th>
              <th className={TH}>Tín hiệu vào</th>
              <th className={`${TH} text-right`}>Giá vào</th>
              <th className={`${TH} text-right`}>Giá hiện</th>
              <th className={`${TH} text-right`}>Lãi/lỗ</th>
              <th className={`${TH} text-right`}>Cắt lỗ −10%</th>
              <th className={`${TH} text-right`} title="Đóng cửa dưới MA50 = tín hiệu bán">Mốc thoát MA50</th>
              <th className={`${TH} text-right`} title="Đỉnh cao nhất từ lúc vào trừ 4 lần ATR14 - mốc tham khảo, thoát nhanh hơn MA50 chút khi giá đã tăng mạnh">Đỉnh − 4 ATR</th>
              <th className={TH}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {dangCam.map((x, i) => {
              const mau = x.thungSL ? DO : x.canBan ? DO : XANH;
              const tt = x.thungSL ? "Thủng cắt lỗ" : x.canBan ? "Dưới MA50: cân nhắc bán" : "Đang cầm";
              return (
                <tr key={x.ma} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                  <Ma x={x} />
                  <td className="py-2.5 px-3 text-xs" style={{ color: MUTED }}>{ngayLai(x.cach)}</td>
                  <td className="py-2.5 px-3 text-right">{fmt(x.giaVao)}</td>
                  <td className="py-2.5 px-3 text-right">{fmt(x.gia)}</td>
                  <td className="py-2.5 px-3 text-right font-bold" style={{ color: x.laiPct != null && x.laiPct >= 0 ? XANH : DO }}>{pct(x.laiPct, 2)}</td>
                  <td className="py-2.5 px-3 text-right" style={{ color: DO }}>{fmt(x.sl)}</td>
                  <td className="py-2.5 px-3 text-right">{x.ma50 != null ? fmt(x.ma50) : "—"}</td>
                  <td className="py-2.5 px-3 text-right" style={{ color: MUTED }}>{x.ch4 != null ? fmt(x.ch4) : "—"}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-sm whitespace-nowrap" style={{ background: nhe(mau, 13), color: mau, ...sans }}>{tt}</span>
                  </td>
                </tr>
              );
            })}
            {dangCam.length === 0 && (
              <tr><td colSpan={9} className="py-6 text-center text-sm" style={{ color: MUTED, ...sans }}>Hiện chưa có mã nào đang trong nhịp hồi theo mô hình này.</td></tr>
            )}
          </tbody>
        </table>
      </Khung>

      <Khung
        tieuDe="Gần đủ điều kiện (3/4)"
        mau={VANG}
        soLuong={gan.length}
        moTa="Cổ phiếu đã giảm dài, thanh khoản đủ và đang thỏa 1 trong 2 điều kiện còn lại — theo dõi để chờ đủ cả 4. Mã đủ 4/4 nhưng không có ở mục trên là mã đã vào hoặc đã thoát trong 20 phiên gần đây."
      >
        <table className="w-full text-sm" style={mono}>
          <thead>
            <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, ...sans }}>
              <th className={TH}>Mã</th>
              <th className={`${TH} text-center`} title="Đóng cửa ≤ 65% đỉnh 250 phiên, đỉnh cách ≥ 100 phiên">1. Giảm dài</th>
              <th className={`${TH} text-center`} title="GTGD trung bình 20 phiên ≥ 3 tỷ">2. Thanh khoản</th>
              <th className={`${TH} text-center`} title="Đáy 30 phiên gần nhất cao hơn đáy 30 phiên trước đó">3. Đáy sau cao hơn</th>
              <th className={`${TH} text-center`} title="Đóng cửa trên cả Tenkan và Kijun">4. Trên Tenkan + Kijun</th>
              <th className={`${TH} text-right`}>Giá</th>
              <th className={`${TH} text-right`}>Cách đỉnh 52 tuần</th>
            </tr>
          </thead>
          <tbody>
            {gan.map((x, i) => (
              <tr key={x.ma} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                <Ma x={x} />
                {x.dk.map((ok, k) => (
                  <td key={k} className="py-2.5 px-3 text-center font-bold" style={{ color: ok ? XANH : DO }}>{ok ? "✓" : "✗"}</td>
                ))}
                <td className="py-2.5 px-3 text-right">{fmt(x.gia)}</td>
                <td className="py-2.5 px-3 text-right" style={{ color: MUTED }}>{x.cachDinhPct != null ? pct(x.cachDinhPct, 1) : "—"}</td>
              </tr>
            ))}
            {gan.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-sm" style={{ color: MUTED, ...sans }}>Hiện chưa có mã nào gần đủ điều kiện.</td></tr>
            )}
          </tbody>
        </table>
      </Khung>
    </>
  );
}
