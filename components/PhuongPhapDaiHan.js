"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ShieldAlert, TriangleAlert } from "lucide-react";
import { nhe } from "@/components/dungChung";
import { soVN, pctVN } from "@/lib/soVN";
import { HAN_CHO_THANG } from "@/lib/phuongPhapDaiHan";
import { BANG_NAM, BAT_DAU_2026, KET_LUAN, KHONG_DUNG, CACH_BAN, LOI_VE_TINH, DINH_GIA, GIAI_DOAN } from "@/lib/phuongPhapDaiHanKetQua";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const PRIMARY = "#6C5CE7";
const sans = { fontFamily: "var(--font-chu)" };
const MAU = { xanh: XANH, do: DO, vang: VANG, mo: MUTED, chu: TEXT };

const Chip = ({ mau, children, title }) => (
  <span title={title} className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap" style={{ background: nhe(mau, 14), color: mau, border: `1px solid ${nhe(mau, 30)}`, ...sans }}>
    {children}
  </span>
);
const The = ({ tieuDe, children, className = "" }) => (
  <section className={`rounded-2xl border p-5 mb-6 ${className}`} style={{ borderColor: VIEN, background: NEN_CARD }}>
    {tieuDe && <h2 className="text-lg mb-3" style={{ ...sans, fontWeight: 700 }}>{tieuDe}</h2>}
    {children}
  </section>
);
const mauLai = (v) => (v > 0 ? XANH : v < 0 ? DO : TEXT);

function DongMa({ m, pp, mo, onMo }) {
  const l = m.lich;
  const dinhGia = m.dinhGia;
  const d1 = l.dot[0];
  const d2 = l.dot[1];
  return (
    <>
      <tr className="border-b cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ borderColor: VIEN }} onClick={onMo} aria-expanded={mo}>
        <td className="px-3 py-2.5 font-bold whitespace-nowrap" style={sans}>
          <Link href={`/ma/${m.ma}`} onClick={(e) => e.stopPropagation()} className="underline decoration-dotted underline-offset-2" style={{ color: PRIMARY }}>{m.ma}</Link>
          {m.canhBao?.length > 0 && <TriangleAlert size={13} className="inline-block ml-1 align-text-top" style={{ color: VANG }} aria-label="Có cảnh báo, bấm để xem" />}
          <div className="text-[11px] font-normal" style={{ color: MUTED }}>{m.ten}</div>
        </td>
        <td className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>{m.nganhNhan}</td>
        <td className="px-3 py-2.5 text-right whitespace-nowrap" style={sans}>
          <b>{soVN(m.gia, 2)}</b>
          {m.doi != null && <div className="text-[11px]" style={{ color: mauLai(m.doi) }}>{pctVN(m.doi, 2)}</div>}
        </td>
        <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.vonHoaTy, 0)}</td>
        <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.roe, 1)}%</td>
        <td className="px-3 py-2.5 text-right" style={{ ...sans, color: mauLai(m.lnTang) }}>{m.lnTang != null ? pctVN(m.lnTang, 0) : "—"}</td>
        <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.pe, 1)}</td>
        {pp === "coTuc" && <td className="px-3 py-2.5 text-right font-bold" style={{ ...sans, color: XANH }}>{soVN(m.tySuatCoTuc, 1)}%</td>}
        {pp === "graham" && <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.peXpb, 1)}</td>}
        {pp === "itBienDong" && <td className="px-3 py-2.5 text-right" style={sans}>{soVN(m.doLech, 1)}%</td>}
        <td className="px-3 py-2.5 text-right whitespace-nowrap" style={sans}>
          <b>{soVN(m.giaHopLy, 2)}</b>
          <div className="mt-0.5"><Chip mau={MAU[dinhGia.mau]} title={m.r != null ? `Giá bằng ${soVN(m.r * 100, 0)}% giá hợp lý` : ""}>{dinhGia.nhan}</Chip></div>
        </td>
        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={sans}>
          {l.quaXuHuong ? (
            <>
              <Chip mau={XANH}>{pp === "buffett" ? "Đã qua xu hướng" : "Giải ngân được"}</Chip>
              <div className="mt-1" style={{ color: MUTED }}>Đợt 1: {soVN(d1?.gia, 2)} · Đợt 2: ≤ {soVN(d2?.gia, 2)}</div>
            </>
          ) : (
            <>
              <Chip mau={VANG}>Chờ xu hướng</Chip>
              <div className="mt-1" style={{ color: MUTED }}>Chờ đóng cửa trên {soVN(l.choGiaVuot, 2)}</div>
            </>
          )}
        </td>
        <td className="px-2 py-2.5"><ChevronDown size={16} style={{ color: MUTED, transform: mo ? "rotate(180deg)" : undefined, transition: "transform .15s" }} aria-hidden="true" /></td>
      </tr>
      {mo && (
        <tr style={{ background: "var(--nen)" }}>
          <td colSpan={13} className="px-3 py-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs mb-2" style={{ color: MUTED, ...sans }}>
                  <b style={{ color: TEXT }}>Lịch giải ngân 5 đợt (mỗi đợt 20% vốn dự định)</b> · hiệu lực {HAN_CHO_THANG} tháng, hết hạn thì mua theo thị trường phần chưa khớp
                </p>
                <table className="w-full text-xs" style={sans}>
                  <thead>
                    <tr className="text-left" style={{ color: MUTED }}><th className="py-1 pr-2">Đợt</th><th className="py-1 pr-2">Điều kiện</th><th className="py-1 pr-2 text-right">Mức giá</th><th className="py-1 text-right">Khớp (test)</th></tr>
                  </thead>
                  <tbody>
                    {l.dot.map((d) => (
                      <tr key={d.so} className="border-t" style={{ borderColor: VIEN }}>
                        <td className="py-1 pr-2 font-bold">{d.so}</td>
                        <td className="py-1 pr-2">{d.nhan}<div style={{ color: MUTED }}>{d.ghiChu}</div></td>
                        <td className="py-1 pr-2 text-right font-bold">{d.gia != null ? `≤ ${soVN(d.gia, 2)}` : "—"}</td>
                        <td className="py-1 text-right" style={{ color: MUTED }}>{d.khop != null ? `${d.khop}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs leading-relaxed" style={{ color: TEXT, ...sans }}>
                <p className="mb-1"><b>Giá hợp lý {soVN(m.giaHopLy, 2)}</b> (trung vị 4 cách định giá) · giá hiện tại bằng <b>{m.r != null ? `${soVN(m.r * 100, 0)}%` : "—"}</b> giá hợp lý. Vùng chiết khấu đáng quan tâm: giá {soVN(m.giaHopLy * 0.5, 2)} – {soVN(m.giaHopLy * 0.8, 2)} (chiết khấu 20–50%).</p>
                <p className="mb-1" style={{ color: MUTED }}>Mốc tham chiếu: SMA50 {soVN(m.sma50, 2)} · SMA200 {soVN(m.sma200, 2)} · đường cân bằng dài hạn {soVN(m.ggTop, 2)} · cách đỉnh 1 năm {m.cachDinh != null ? pctVN(m.cachDinh, 0) : "—"}.</p>
                {m.vayVcsh != null && <p className="mb-1" style={{ color: MUTED }}>Nợ vay / vốn chủ: {soVN(m.vayVcsh, 2)} lần.</p>}
                {m.canhBao?.map((c, i) => (
                  <p key={i} className="flex gap-1.5 mt-1" style={{ color: VANG }}><TriangleAlert size={13} className="shrink-0 mt-0.5" aria-hidden="true" />{c}</p>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function BangMa({ pp, ds }) {
  const [mo, setMo] = useState(null);
  if (!ds.length) return <p className="text-sm" style={{ color: MUTED }}>Hiện chưa có mã nào đạt toàn bộ điều kiện.</p>;
  const cotThem = pp === "coTuc" ? "Cổ tức" : pp === "graham" ? "P/E×P/B" : pp === "itBienDong" ? "Biến động/năm" : null;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: VIEN }}>
      <div className="overflow-x-auto bang-cuon">
        <table className="w-full text-sm" style={sans}>
          <thead>
            <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, background: "var(--nen)" }}>
              <th className="px-3 py-2">Mã</th><th className="px-3 py-2">Ngành</th><th className="px-3 py-2 text-right">Giá</th><th className="px-3 py-2 text-right">Vốn hóa (tỷ)</th><th className="px-3 py-2 text-right">ROE</th><th className="px-3 py-2 text-right">LN 12T</th><th className="px-3 py-2 text-right">P/E</th>
              {cotThem && <th className="px-3 py-2 text-right">{cotThem}</th>}
              <th className="px-3 py-2 text-right">Giá hợp lý</th><th className="px-3 py-2">Giải ngân</th><th className="w-6" />
            </tr>
          </thead>
          <tbody>
            {ds.map((m) => <DongMa key={m.ma} m={m} pp={pp} mo={mo === m.ma} onMo={() => setMo(mo === m.ma ? null : m.ma)} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KhungLoiVeTinh({ khung }) {
  const dong = (ds, nhan, mau) => (
    <div className="mb-4">
      <p className="text-sm mb-2" style={{ ...sans, fontWeight: 700, color: mau }}>{nhan}</p>
      {ds.length === 0 ? <p className="text-xs" style={{ color: MUTED }}>Chưa có mã đạt điều kiện.</p> : (
        <div className="flex flex-wrap gap-2">
          {ds.map((m) => (
            <Link key={m.ma} href={`/ma/${m.ma}`} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: VIEN, background: "var(--nen)", ...sans }}>
              <b style={{ color: PRIMARY }}>{m.ma}</b> <span style={{ color: MUTED }}>{m.nganhNhan}</span>
              <div className="mt-0.5"><b>{soVN(m.ty, 1)}%</b> danh mục · {m.lich.quaXuHuong ? <span style={{ color: XANH }}>giải ngân được</span> : <span style={{ color: VANG }}>chờ xu hướng</span>}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <The tieuDe="Mô hình Lõi & Vệ tinh (60–70% / 30–40%)">
      <p className="text-sm mb-4" style={{ color: MUTED }}>
        Chia danh mục thành phần lõi (công nghệ + ngân hàng, nhóm tăng trưởng ổn định nhất) và phần vệ tinh (các ngành khác, tối đa 2 mã mỗi ngành) để phân tán rủi ro. Mã trong mô hình lấy từ các phương pháp Buffett và Cổ tức ở trên, không chọn theo tên.
      </p>
      {dong(khung.loi, `Lõi — khoảng 65% danh mục (${khung.loi.length} mã)`, PRIMARY)}
      {dong(khung.veTinh, `Vệ tinh — khoảng 35% danh mục (${khung.veTinh.length} mã)`, TEXT)}
      <p className="text-xs" style={{ color: MUTED }}>
        Test mô hình lõi & vệ tinh (FPT + 7 ngân hàng lớn + bán lẻ, BĐS khu công nghiệp) từ các mốc bắt đầu 2014–2025: trung bình {LOI_VE_TINH.cagrTB}%/năm so với khoảng {LOI_VE_TINH.vniTB}% của VN-Index, hơn VN-Index ở {LOI_VE_TINH.homVni}. Nhưng {LOI_VE_TINH.gayDay} Danh sách mã trong test được chọn sau nên số liệu bị thổi phồng. {LOI_VE_TINH.canhBao}
      </p>
    </The>
  );
}

export default function PhuongPhapDaiHan({ du }) {
  const khoa = Object.keys(du.phuongPhap);
  const [tab, setTab] = useState("buffett");
  const hienTai = du.phuongPhap[tab] ?? du.phuongPhap[khoa[0]];
  const meta = hienTai.meta;
  return (
    <div style={{ color: TEXT }}>
      <div className="rounded-xl border p-4 mb-6 flex gap-3 text-sm" style={{ borderColor: nhe(VANG, 40), background: nhe(VANG, 8), ...sans }}>
        <ShieldAlert size={20} className="shrink-0 mt-0.5" style={{ color: VANG }} aria-hidden="true" />
        <p className="leading-relaxed">
          <b>Thông tin tham khảo, không phải khuyến nghị đầu tư.</b> Các phương pháp được kiểm tra trên dữ liệu {GIAI_DOAN} (khoảng 4,75 năm, một chu kỳ thị trường, chỉ gồm mã còn niêm yết). Kết quả quá khứ không đảm bảo tương lai, và có năm phương pháp thua VN-Index rõ rệt (xem bảng kết quả theo năm).
          Bộ lọc chỉ nhìn báo cáo tài chính và giá, <b>không phát hiện được rủi ro pháp lý hay tin xấu</b> — hãy tự kiểm tra tin tức trước khi mua.
        </p>
      </div>

      <The tieuDe="Khung đầu tư dài hạn: 4 bước">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm" style={sans}>
          {[
            ["1. Nền: mua đều chỉ số", "Với phần vốn không muốn chọn mã, mua đều VN-Index hoặc ETF mỗi tháng. Kết quả gần bằng thị trường (khoảng 9–10%/năm 2014–2026), không cần theo dõi."],
            ["2. Chọn doanh nghiệp bằng tiêu chí", "Chọn mã từ các bộ lọc Buffett hoặc Cổ tức bên dưới thay vì theo tin đồn. Cầm ít nhất 8–10 mã, mỗi mã tối đa 10–15% danh mục."],
            ["3. Giải ngân chia 5 đợt", "Chia vốn 5 đợt 20%, mỗi đợt một mức giá (xem từng mã). Chờ giá không tăng lợi nhuận, chỉ giúp giá vốn tốt hơn; hết hạn 3 tháng thì mua theo kế hoạch."],
            ["4. Bán khi doanh nghiệp xấu đi", "Không cắt lỗ theo giá. Bán khi lợi nhuận 12 tháng ≤ 0 / giảm mạnh, ROE tụt dưới 12%, hết đạt bộ lọc hoặc có tin pháp lý xấu."],
          ].map(([t, n]) => (
            <div key={t} className="rounded-xl border p-3" style={{ borderColor: VIEN, background: "var(--nen)" }}>
              <p className="mb-1" style={{ fontWeight: 700 }}>{t}</p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{n}</p>
            </div>
          ))}
        </div>
      </The>

      <The tieuDe="Danh sách mã theo phương pháp">
        <div role="tablist" aria-label="Phương pháp" className="flex gap-1 overflow-x-auto mb-4 border-b" style={{ borderColor: VIEN }}>
          {khoa.map((k) => {
            const chon = k === tab;
            return (
              <button key={k} type="button" role="tab" aria-selected={chon} onClick={() => setTab(k)} className="px-3 py-2 text-sm whitespace-nowrap border-b-2" style={{ borderColor: chon ? PRIMARY : "transparent", color: chon ? TEXT : MUTED, fontWeight: chon ? 700 : 500, ...sans }}>
                {du.phuongPhap[k].meta.ten} <span className="text-[11px]" style={{ color: MUTED }}>({du.phuongPhap[k].ds.length})</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm mb-1" style={{ ...sans }}><b>{meta.ten}</b> · <span style={{ color: MUTED }}>{meta.nguoi}</span></p>
        <p className="text-sm mb-3 leading-relaxed" style={{ color: MUTED }}>{meta.moTa}</p>
        <ul className="grid gap-1 mb-3 text-xs sm:grid-cols-2" style={{ color: TEXT, ...sans }}>
          {meta.dieuKien.map((d, i) => <li key={i}>• {d}</li>)}
        </ul>
        {meta.ghiChuXuHuong && <p className="text-xs mb-3 leading-relaxed" style={{ color: MUTED }}><b style={{ color: TEXT }}>Xu hướng giá:</b> {meta.ghiChuXuHuong}</p>}
        <BangMa key={tab} pp={tab} ds={hienTai.ds} />
        <p className="text-[11px] mt-2" style={{ color: MUTED }}>
          Chỉ số cơ bản theo báo cáo tài chính quý {du.quyBaoCao.split("-").reverse().slice(1).join("/")}; giá {du.coGiaMoi ? "cập nhật theo phiên gần nhất trên web" : `tại ngày ${du.giaDen.split("-").reverse().join("/")}`}. Bấm vào từng dòng để xem lịch giải ngân 5 đợt và giá hợp lý. {DINH_GIA.moTa}
        </p>
        <div className="mt-3 grid gap-1 text-xs sm:grid-cols-2" style={{ color: MUTED }}>
          {DINH_GIA.nhom.map((n) => <span key={n.nhan}><b style={{ color: TEXT }}>{n.nhan}</b>: {n.ghiChu}</span>)}
        </div>
        <p className="text-xs mt-2" style={{ color: MUTED }}>{DINH_GIA.ghiChu}</p>
      </The>

      <KhungLoiVeTinh khung={du.khung} />

      <The tieuDe={`Kết quả kiểm tra ${GIAI_DOAN}`}>
        <p className="text-sm mb-3" style={{ color: MUTED }}>Lợi suất từng năm lịch (%), mua chia đều tối đa 15 mã, kiểm tra mỗi quý sau báo cáo tài chính, phí 0,2% mỗi chiều. *2026 tính đến 21/10.</p>
        <div className="rounded-xl border overflow-hidden mb-4" style={{ borderColor: VIEN }}>
          <div className="overflow-x-auto bang-cuon">
            <table className="w-full text-sm" style={sans}>
              <thead>
                <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, background: "var(--nen)" }}>
                  <th className="px-3 py-2">Phương pháp</th>
                  {BANG_NAM.nam.map((n) => <th key={n} className="px-3 py-2 text-right">{n}</th>)}
                  <th className="px-3 py-2 text-right">Lãi/năm</th><th className="px-3 py-2 text-right">Sụt giảm tối đa</th>
                </tr>
              </thead>
              <tbody>
                {BANG_NAM.dong.map((d) => (
                  <tr key={d.khoa} className="border-b" style={{ borderColor: VIEN, background: d.khoa === "vni" ? "var(--nen)" : undefined }}>
                    <td className="px-3 py-2" style={{ fontWeight: d.khoa === "vni" ? 700 : 500 }}>{d.ten}</td>
                    {d.nam.map((v, i) => <td key={i} className="px-3 py-2 text-right" style={{ color: mauLai(v) }}>{pctVN(v, 0)}</td>)}
                    <td className="px-3 py-2 text-right font-bold">{soVN(d.cagr, 1)}%</td>
                    <td className="px-3 py-2 text-right" style={{ color: DO }}>{d.sut}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border p-4 mb-4 text-sm" style={{ borderColor: nhe(DO, 35), background: nhe(DO, 6), ...sans }}>
          <p className="mb-2" style={{ fontWeight: 700 }}>Nếu bắt đầu từ đầu 2026 (đến 21/10/2026): VN-Index {pctVN(BAT_DAU_2026.vni, 1)}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-2">
            {BAT_DAU_2026.dong.map((d) => <span key={d.ten}>{d.ten.split(" — ")[0]}: <b style={{ color: mauLai(d.lai) }}>{pctVN(d.lai, 1)}</b></span>)}
          </div>
          <p className="text-xs" style={{ color: MUTED }}>{BAT_DAU_2026.ghiChu}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 text-sm mb-4" style={sans}>
          {KET_LUAN.map((k) => (
            <li key={k.tieu} className="rounded-xl border p-3" style={{ borderColor: VIEN, background: "var(--nen)" }}>
              <p className="mb-1" style={{ fontWeight: 700 }}>{k.tieu}</p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{k.noi}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm mb-2" style={{ fontWeight: 700, ...sans }}>Đã thử nhưng không đưa vào bộ phương pháp</p>
        <ul className="text-xs grid gap-1" style={{ color: MUTED, ...sans }}>
          {KHONG_DUNG.map((k) => <li key={k.ten}>• <b style={{ color: TEXT }}>{k.ten}</b>: {k.ketQua}</li>)}
        </ul>
      </The>

      <The tieuDe="Khi nào bán cho đúng?">
        <div className="grid gap-3 sm:grid-cols-2 text-sm mb-4" style={sans}>
          {[
            ["Doanh nghiệp xấu đi", "Lợi nhuận 12 tháng ≤ 0, giảm hơn 20%, ROE tụt dưới 12% hoặc mã hết đạt bộ lọc. Trong test, bán theo lý do này hơn việc không bán 2,7% (12 tháng) đến 7,5% (24 tháng)."],
            ["Tin xấu / rủi ro pháp lý", "Điều tra, kiện tụng, vi phạm công bố thông tin… Bộ lọc không tự thấy, nên web có danh sách mã bị đánh dấu rủi ro."],
            ["Định giá quá cao", "Nếu bán theo định giá, hãy bán trễ: khi giá bằng khoảng 1,2 lần giá hợp lý tốt hơn khi vừa chạm giá hợp lý."],
            ["Tỷ trọng một mã quá lớn", "Một mã vượt 25–30% danh mục thì bán bớt về mức này. Giới hạn rủi ro bằng đa dạng hóa (từ 8–10 mã), không bằng cắt lỗ theo giá."],
          ].map(([t, n]) => (
            <div key={t} className="rounded-xl border p-3" style={{ borderColor: VIEN, background: "var(--nen)" }}>
              <p className="mb-1" style={{ fontWeight: 700 }}>{t}</p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{n}</p>
            </div>
          ))}
        </div>
        <p className="text-sm mb-2" style={{ ...sans, fontWeight: 700 }}>Vì sao không cắt lỗ theo giá?</p>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: MUTED }}>
          Thị trường Việt Nam thường điều chỉnh 25–40% rồi hồi phục. Test 36 tháng cho thấy mọi quy tắc bán theo giá (cắt lỗ, trailing stop, thủng SMA200…) làm giảm lãi 9–44 điểm vì bán sớm 60–100% vị thế, đổi lại chỉ cắt được đuôi xấu nhất (−91% xuống −27% đến −43%). {CACH_BAN.ghiChu}
        </p>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: VIEN }}>
          <div className="overflow-x-auto bang-cuon">
            <table className="w-full text-xs" style={sans}>
              <thead><tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, background: "var(--nen)" }}><th className="px-3 py-2">Cách bán</th><th className="px-3 py-2 text-right">Lãi TB sau 36 tháng</th><th className="px-3 py-2 text-right">Vị thế bị bán sớm</th><th className="px-3 py-2 text-right">Mã xấu nhất</th></tr></thead>
              <tbody>
                {CACH_BAN.dong.map((d) => (
                  <tr key={d.ten} className="border-b" style={{ borderColor: VIEN }}>
                    <td className="px-3 py-1.5">{d.ten}</td><td className="px-3 py-1.5 text-right font-bold">{pctVN(d.lai, 1)}</td><td className="px-3 py-1.5 text-right">{d.ban}%</td><td className="px-3 py-1.5 text-right" style={{ color: DO }}>{d.xau}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </The>

      {du.daLoai.length > 0 && (
        <The tieuDe="Mã đã bị loại khỏi danh sách vì rủi ro">
          <ul className="grid gap-2 text-sm" style={sans}>
            {du.daLoai.map((x) => (
              <li key={x.ma} className="flex flex-wrap items-center gap-2">
                <Chip mau={DO}>{x.ma}</Chip>
                <span style={{ color: MUTED }}>{x.lyDo} (đánh dấu {x.ngay.split("-").reverse().join("/")})</span>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-2" style={{ color: MUTED }}>Danh sách do quản trị cập nhật thủ công; hệ thống không tự phát hiện rủi ro pháp lý.</p>
        </The>
      )}
    </div>
  );
}
