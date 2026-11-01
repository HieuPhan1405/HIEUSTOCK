"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, NotebookPen, Bell } from "lucide-react";
import { NHAN } from "@/lib/phongCachDauTu";
import { giaVonSauMua, soCpDeVeGiaVon } from "@/lib/xuLyDanhMuc";
import { soNguyenNhap, soNhap } from "@/lib/danhGiaDanhMuc";
import { fmt } from "@/components/dungChung";
import TaiKhoanNut from "@/components/TaiKhoanNut";
import { Khoi, NhanTrangThai, VIEN, TEXT, MUTED, PRIMARY, DO, VANG, XANH, sans, soVN, p1, dau, tien, mauLai, ngayVN } from "@/components/DanhGiaChung";

const NHAN_LOAI = { ban_het: "Bán hết", ban_bot: "Bán bớt", chot_bot: "Chốt lời một phần", mua_them: "Mua thêm", tra_no: "Giảm nợ" };

// So sanh truoc - sau ke hoach (kq = danhGiaToanBo)
export function BangTruocSau({ truoc, sau, ad }) {
  if (!truoc || !sau) return null;
  // rui ro tinh tren TAI SAN RONG (co tien mat, tru no): ban ma xau ve tien mat lam phan co phieu it ma hon nhung tai san it rui ro hon
  const heSo = (k) => (k.pb.taiSan.nav > 0 ? k.pb.tongGiaTri / k.pb.taiSan.nav : null);
  const nhan = (k, f) => (k.rr?.dsMa?.length && heSo(k) != null ? f(k.rr) * heSo(k) : null);
  const hang = [
    ["Số mã", truoc.pb.soMaCoGia, sau.pb.soMaCoGia, (v) => soVN(v), 0],
    ["Cổ phiếu / tài sản ròng", heSo(truoc), heSo(sau), (v) => (v == null ? "—" : `${Math.round(v * 100)}%`), 0],
    ["Biến động năm của tài sản ròng", nhan(truoc, (r) => r.volP), nhan(sau, (r) => r.volP), (v) => (v == null ? "—" : `${Math.round(v)}%`), -1],
    ["VN-Index −10% → tài sản ròng", nhan(truoc, (r) => -r.betaP * 10), nhan(sau, (r) => -r.betaP * 10), (v) => (v == null ? "—" : `${p1(v)}%`), 1],
    ["Một phiên xấu (VaR 95%) trên tài sản ròng", nhan(truoc, (r) => r.var95), nhan(sau, (r) => r.var95), (v) => (v == null ? "—" : `−${p1(v)}%`), -1],
    ["Tỷ trọng mã cần thoát (phần cổ phiếu)", truoc.tyLeThoat, sau.tyLeThoat, (v) => `${Math.round((v ?? 0) * 100)}%`, -1],
    ["Khoản đầu tư độc lập (phần cổ phiếu)", truoc.rr?.soCuocDocLap, sau.rr?.soCuocDocLap, (v) => (v == null ? "—" : `≈ ${p1(v)}`), 0],
    ["Điểm sức khỏe (phần cổ phiếu)", truoc.suc?.diem, sau.suc?.diem, (v) => (v == null ? "—" : `${v}/100`), 0],
    ...(truoc.pb.margin || sau.pb.margin
      ? [
          ["Tỷ lệ ký quỹ", truoc.pb.margin?.tyLeKyQuy, sau.pb.margin?.tyLeKyQuy ?? (sau.pb.taiSan.no > 0 ? null : 100), (v) => (v == null ? "—" : `${Math.round(v)}%`), 1],
          ["Giảm bao nhiêu thì chạm cảnh báo", truoc.pb.margin?.giamDenCanhBao, sau.pb.taiSan.no > 0 ? sau.pb.margin?.giamDenCanhBao : null, (v) => (v == null ? "Không còn nợ" : `−${Math.round(v)}%`), 1],
        ]
      : []),
    ["Tiền mặt", truoc.pb.taiSan.tienMat, sau.pb.taiSan.tienMat, tien, 0],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={sans}>
        <thead>
          <tr className="text-left text-xs" style={{ color: MUTED }}>
            <th className="py-1.5 pr-2 font-normal">Chỉ số</th>
            <th className="py-1.5 px-2 font-normal text-right">Hiện tại</th>
            <th className="py-1.5 pl-2 font-normal text-right">Sau kế hoạch</th>
          </tr>
        </thead>
        <tbody>
          {hang.map(([ten, a, b, f, huong]) => {
            const tot = a != null && b != null && huong !== 0 && Math.abs(b - a) > 1e-9 ? (b - a) * huong > 0 : null;
            return (
              <tr key={ten} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                <td className="py-2 pr-2">{ten}</td>
                <td className="py-2 px-2 text-right">{f(a)}</td>
                <td className="py-2 pl-2 text-right" style={{ fontWeight: 700 }}>
                  {f(b)}
                  {tot != null && <span className="text-[11px] ml-1" style={{ color: tot ? XANH : VANG }}>{tot ? "▲ tốt hơn" : "▼ kém hơn"}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ad && (
        <p className="text-[11px] mt-2" style={{ color: MUTED }}>
          Tiền bán {tien(ad.tienBan)}
          {ad.tienMua > 0 ? ` · tiền mua ${tien(ad.tienMua)}` : ""}
          {ad.laiChot != null ? ` · lãi/lỗ hiện thực hóa ${tien(ad.laiChot)}` : ""}. Tiền bán được trả nợ margin trước. Chưa trừ phí và thuế; giá giả định bằng giá hiện tại.
          {ad.thieuTien ? " Tiền mặt không đủ cho phần mua thêm — bỏ bớt lệnh mua." : ""} Điểm sức khỏe chỉ chấm phần cổ phiếu còn lại (ít mã hơn thì điểm đa dạng thấp hơn) — rủi ro thật của tài khoản xem ở các dòng “tài sản ròng”.
        </p>
      )}
    </div>
  );
}

// MAY TINH trung binh gia / ban bot - cong khai (chi la phep tinh)
export function MayTinh({ hangMa = [], nhan = {}, tongGiaTri = 0, laThanhVien }) {
  const [ma, setMa] = useState("");
  const [kieu, setKieu] = useState("mua");
  const [kl, setKl] = useState("");
  const [gia, setGia] = useState("");
  const [mucTieu, setMucTieu] = useState("");
  const h = hangMa.find((x) => x.ma === (ma || hangMa[0]?.ma));
  const g = soNhap(gia) ?? h?.gia ?? null;
  const n = soNguyenNhap(kl) ?? 0;
  const kq = useMemo(() => {
    if (!h || !(g > 0)) return null;
    if (kieu === "mua") {
      const gv = giaVonSauMua(h.kl, h.giaVon, n, g);
      const them = n * g * 1000;
      return { klMoi: h.kl + n, gvMoi: gv, tien: them, laiMoi: gv > 0 && h.gia ? (h.gia / gv - 1) * 100 : null, tyTrongMoi: tongGiaTri > 0 ? ((h.giaTri ?? 0) + n * (h.gia ?? g) * 1000) / (tongGiaTri + n * (h.gia ?? g) * 1000) : null };
    }
    const b = Math.min(n, h.kl);
    const ve = b * g * 1000;
    return { klMoi: h.kl - b, gvMoi: h.giaVon, tien: ve, laiChot: h.giaVon > 0 ? (g - h.giaVon) * b * 1000 : null, tyTrongMoi: tongGiaTri > 0 ? ((h.giaTri ?? 0) - b * (h.gia ?? g) * 1000) / Math.max(1, tongGiaTri - b * (h.gia ?? g) * 1000) : null };
  }, [h, g, n, kieu, tongGiaTri]);
  const canMua = h ? soCpDeVeGiaVon(h.kl, h.giaVon, g, soNhap(mucTieu)) : null;
  const nh = h ? nhan[h.ma] : null;
  const duoiXuHuong = h && (h.r?.gg_bot > 0 && h.gia < h.r.gg_bot);
  const o = "px-2.5 py-1.5 rounded-lg text-sm border w-full";
  const oS = { borderColor: VIEN, background: "transparent", color: TEXT, ...sans };
  if (!hangMa.length) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="grid grid-cols-2 gap-3 content-start">
        <label className="text-[11px] col-span-2 sm:col-span-1" style={{ color: MUTED }}>
          Mã
          <select value={h?.ma ?? ""} onChange={(e) => setMa(e.target.value)} className={`${o} mt-1`} style={{ ...oS, fontWeight: 700 }}>
            {hangMa.map((x) => (
              <option key={x.ma} value={x.ma}>
                {x.ma}
              </option>
            ))}
          </select>
        </label>
        <div className="text-[11px] col-span-2 sm:col-span-1" style={{ color: MUTED }}>
          Lệnh
          <div className="flex mt-1 rounded-lg border overflow-hidden" style={{ borderColor: VIEN }}>
            {[
              ["mua", "Mua thêm"],
              ["ban", "Bán bớt"],
            ].map(([k, t]) => (
              <button key={k} type="button" onClick={() => setKieu(k)} className="flex-1 py-1.5 text-sm" style={{ ...sans, fontWeight: 700, background: kieu === k ? PRIMARY : "transparent", color: kieu === k ? "#fff" : TEXT }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <label className="text-[11px]" style={{ color: MUTED }}>
          Số lượng (cp)
          <input value={kl} onChange={(e) => setKl(e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="numeric" placeholder="1.000" className={`${o} mt-1`} style={oS} />
        </label>
        <label className="text-[11px]" style={{ color: MUTED }}>
          Giá (nghìn đồng)
          <input value={gia} onChange={(e) => setGia(e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="decimal" placeholder={h?.gia != null ? fmt(h.gia) : ""} className={`${o} mt-1`} style={oS} />
        </label>
        <p className="col-span-2 text-[11px]" style={{ color: MUTED }}>
          Đang giữ {soVN(h?.kl)} cp{h?.giaVon ? `, giá vốn ${fmt(h.giaVon)}` : ""}, giá hiện tại {h?.gia != null ? fmt(h.gia) : "—"}. Để trống giá = dùng giá hiện tại.
        </p>
      </div>
      <div className="rounded-xl border p-3 text-sm" style={{ borderColor: VIEN, ...sans }}>
        {kq && n > 0 ? (
          <div className="grid gap-1.5">
            <div className="flex justify-between"><span style={{ color: MUTED }}>Số lượng sau lệnh</span><b>{soVN(kq.klMoi)} cp</b></div>
            {kieu === "mua" && <div className="flex justify-between"><span style={{ color: MUTED }}>Giá vốn mới</span><b>{kq.gvMoi != null ? fmt(kq.gvMoi) : "—"}{h?.giaVon ? <span className="text-xs font-normal" style={{ color: MUTED }}> (từ {fmt(h.giaVon)})</span> : null}</b></div>}
            {kieu === "mua" && kq.laiMoi != null && <div className="flex justify-between"><span style={{ color: MUTED }}>Lãi / lỗ theo giá hiện tại</span><b style={{ color: mauLai(kq.laiMoi) }}>{dau(kq.laiMoi)}</b></div>}
            <div className="flex justify-between"><span style={{ color: MUTED }}>{kieu === "mua" ? "Tiền cần" : "Tiền về (chưa trừ phí, thuế)"}</span><b>{tien(kq.tien)}</b></div>
            {kieu === "ban" && kq.laiChot != null && <div className="flex justify-between"><span style={{ color: MUTED }}>Lãi / lỗ hiện thực hóa</span><b style={{ color: mauLai(kq.laiChot) }}>{tien(kq.laiChot)}</b></div>}
            {kq.tyTrongMoi != null && <div className="flex justify-between"><span style={{ color: MUTED }}>Tỷ trọng mã sau lệnh</span><b>{p1(kq.tyTrongMoi * 100)}%</b></div>}
          </div>
        ) : (
          <p style={{ color: MUTED }}>Nhập số lượng để xem giá vốn, tiền cần và tỷ trọng sau lệnh.</p>
        )}
        {h?.giaVon > 0 && h.gia < h.giaVon && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--vien-nhe)" }}>
            <label className="text-[11px] flex items-center gap-2" style={{ color: MUTED }}>
              Muốn giá vốn về
              <input value={mucTieu} onChange={(e) => setMucTieu(e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="decimal" placeholder={fmt((h.gia + h.giaVon) / 2)} className="px-2 py-1 rounded-lg text-sm border w-24" style={oS} />
            </label>
            {canMua != null ? (
              <p className="mt-1.5">
                Cần mua thêm <b>{soVN(canMua)} cp</b> giá {fmt(g)} ≈ <b>{tien(canMua * g * 1000)}</b>
              </p>
            ) : (
              soNhap(mucTieu) != null && <p className="mt-1.5 text-xs" style={{ color: MUTED }}>Giá vốn mục tiêu phải nằm giữa giá mua ({fmt(g)}) và giá vốn hiện tại ({fmt(h.giaVon)}).</p>
            )}
          </div>
        )}
        {kieu === "mua" && h && (laThanhVien ? NHAN[nh?.nhan]?.muc >= 2 : duoiXuHuong) && (
          <p className="mt-3 text-xs" style={{ color: DO }}>
            {h.ma} đang {laThanhVien ? `ở trạng thái “${NHAN[nh.nhan].ten}”` : "dưới đường cân bằng dài hạn"} — mua thêm lúc này là bình quân giá khi xu hướng đã gãy, rủi ro cao.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DanhGiaXuLy({ kq, keHoach, chon, setChon, sau, laThanhVien, lichSuNhan = [], coLuu, onGhiNhatKy }) {
  const pc = kq.phongCach;
  const dsNhan = kq.hangMa.filter((h) => kq.nhan[h.ma]).sort((a, b) => (kq.nhan[b.ma].muc - kq.nhan[a.ma].muc) || (b.tyTrong ?? 0) - (a.tyTrong ?? 0));
  const canXuLy = dsNhan.filter((h) => kq.nhan[h.ma].muc >= 2);
  const nutPhu = "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold";

  if (!laThanhVien) {
    return (
      <>
        <div className="rounded-2xl border p-5 mb-6 flex flex-wrap items-center justify-between gap-4" style={{ borderColor: PRIMARY, background: "color-mix(in srgb, #6C5CE7 10%, var(--card))" }}>
          <div className="max-w-2xl">
            <p className="text-base mb-1" style={{ ...sans, fontWeight: 800 }}>
              <Lock size={15} className="inline -mt-1 mr-1" />
              {canXuLy.length ? `Theo phong cách ${pc.ngan.toLowerCase()}, ${canXuLy.length} mã trong danh mục cần xử lý` : `Xem nên giữ hay bán từng mã theo phong cách ${pc.ngan.toLowerCase()}`}
            </p>
            <p className="text-sm" style={{ color: MUTED }}>
              Thành viên (miễn phí) thấy trạng thái Giữ / Theo dõi / Giảm tỷ trọng / Thoát của từng mã kèm lý do, kế hoạch cắt lỗ – chốt lời – trung bình giá với số lượng cụ thể, so sánh danh mục trước và sau khi làm theo, và nhận cảnh báo về máy khi mã chuyển xấu.
            </p>
          </div>
          <TaiKhoanNut nhan="Đăng ký miễn phí" />
        </div>
        <Khoi tieuDe="Máy tính trung bình giá / bán bớt" phu="Phép tính giá vốn, tiền cần và tỷ trọng sau lệnh — không phải khuyến nghị.">
          <MayTinh hangMa={kq.hangMa.filter((h) => h.coDuLieu)} nhan={kq.nhan} tongGiaTri={kq.pb.tongGiaTri} laThanhVien={false} />
        </Khoi>
      </>
    );
  }

  const ds = keHoach?.hanhDong ?? [];
  return (
    <>
      <Khoi tieuDe="Trạng thái từng mã" phu={`Theo phong cách “${pc.ten}”. ${pc.moTa}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={sans}>
            <thead>
              <tr className="text-left text-xs" style={{ color: MUTED }}>
                <th className="py-1.5 pr-3 font-normal">Mã</th>
                <th className="py-1.5 px-3 font-normal text-right">Tỷ trọng</th>
                <th className="py-1.5 px-3 font-normal text-right">Lãi/lỗ</th>
                <th className="py-1.5 px-3 font-normal">Trạng thái</th>
                <th className="py-1.5 pl-3 font-normal">Vì sao</th>
              </tr>
            </thead>
            <tbody>
              {dsNhan.map((h) => {
                const n = kq.nhan[h.ma];
                return (
                  <tr key={h.ma} className="border-t align-top" style={{ borderColor: "var(--vien-nhe)" }}>
                    <td className="py-2 pr-3 font-bold"><Link href={`/ma/${h.ma}`} className="hover:underline">{h.ma}</Link></td>
                    <td className="py-2 px-3 text-right">{h.tyTrong != null ? `${p1(h.tyTrong * 100)}%` : "—"}</td>
                    <td className="py-2 px-3 text-right" style={{ color: mauLai(h.laiLoPct) }}>{dau(h.laiLoPct)}</td>
                    <td className="py-2 px-3"><NhanTrangThai nhan={n.nhan} ten={NHAN[n.nhan].ten} /></td>
                    <td className="py-2 pl-3 min-w-[260px] text-xs">
                      {n.lyDo.join("; ")}
                      {n.phu.length > 0 && <div style={{ color: MUTED }}>Thêm: {n.phu.join("; ")}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Khoi>

      <Khoi
        tieuDe="Kế hoạch xử lý đề xuất"
        phu="Tick để đưa từng bước vào phần “Sau kế hoạch”, sửa số lượng nếu muốn. Bán trước, mua sau; tiền bán trả nợ margin trước. Đây là gợi ý theo quy tắc, không phải khuyến nghị đầu tư."
      >
        {ds.length === 0 ? (
          <p className="text-sm" style={{ color: MUTED }}>Không có việc cần làm ngay — các mã đang ổn theo phong cách này. Tiếp tục giữ và theo dõi trạng thái.</p>
        ) : (
          <ul className="grid gap-2.5">
            {ds.map((a) => {
              const o = chon[a.id] ?? {};
              const dangChon = o.chon ?? a.chon;
              const kl = o.kl ?? a.kl;
              return (
                <li key={a.id} className="rounded-xl border p-3 grid gap-x-2.5 gap-y-2 grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] items-start" style={{ borderColor: dangChon ? PRIMARY : VIEN, ...sans }}>
                  <input type="checkbox" checked={!!dangChon} onChange={(e) => setChon((c) => ({ ...c, [a.id]: { ...c[a.id], chon: e.target.checked } }))} className="mt-1" aria-label={`Đưa vào kế hoạch: ${a.tieuDe}`} />
                  <div>
                    <div className="text-sm" style={{ fontWeight: 700 }}>
                      <span className="text-[11px] px-1.5 py-0.5 rounded mr-1.5" style={{ background: "var(--vien-nhe)", color: a.loai === "mua_them" ? XANH : a.loai === "chot_bot" ? TEXT : DO }}>{NHAN_LOAI[a.loai]}</span>
                      {a.tieuDe}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: MUTED }}>{a.lyDo}</div>
                    {a.ghiChu && <div className="text-xs mt-0.5" style={{ color: MUTED }}>{a.ghiChu}</div>}
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex flex-wrap items-center gap-2 sm:justify-end text-sm">
                    {a.loai === "tra_no" ? (
                      <b>{tien(a.giaTri)}</b>
                    ) : (
                      <>
                        <input value={kl} onChange={(e) => setChon((c) => ({ ...c, [a.id]: { ...c[a.id], kl: soNguyenNhap(e.target.value) ?? 0 } }))} inputMode="numeric" className="px-2 py-1 rounded-lg border w-24 text-right" style={{ borderColor: VIEN, background: "transparent", color: TEXT }} aria-label="Số lượng" />
                        <span className="text-xs" style={{ color: MUTED }}>cp × {fmt(a.gia)} ≈ <b style={{ color: TEXT }}>{tien(kl * a.gia * 1000)}</b></span>
                        {onGhiNhatKy && (
                          <button type="button" onClick={() => onGhiNhatKy({ ma: a.ma, loai: a.loai === "mua_them" ? "mua" : "ban", kl, gia: a.gia })} className={nutPhu} style={{ borderColor: VIEN, color: TEXT }} title="Đã đặt lệnh này: ghi vào nhật ký và cập nhật danh mục">
                            <NotebookPen size={12} /> Đã làm
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {keHoach?.ghiChu?.length > 0 && (
          <ul className="mt-3 grid gap-1 text-xs" style={{ color: MUTED }}>
            {keHoach.ghiChu.map((g, i) => <li key={i}>• {g}</li>)}
          </ul>
        )}
      </Khoi>

      {ds.length > 0 && sau && (
        <Khoi tieuDe="Danh mục trước và sau kế hoạch" phu="Tính lại toàn bộ (điểm, rủi ro 1 năm, margin) với các bước đã tick.">
          <BangTruocSau truoc={kq} sau={sau.kq} ad={sau.ad} />
        </Khoi>
      )}

      <Khoi
        tieuDe="Cảnh báo khi mã chuyển xấu"
        phai={<span className="inline-flex items-center gap-1 text-[11px]" style={{ color: MUTED }}><Bell size={12} /> Bật ở biểu tượng chuông</span>}
        phu={coLuu ? "Danh mục này đã lưu vào tài khoản: sau mỗi lần cập nhật tín hiệu, web tính lại trạng thái và gửi thông báo về máy khi một mã chuyển sang Giảm tỷ trọng hoặc Thoát (mỗi mã một lần mỗi phiên)." : "Lưu danh mục vào tài khoản (thanh trên cùng) để web theo dõi và báo về máy khi một mã chuyển sang Giảm tỷ trọng hoặc Thoát."}
      >
        {lichSuNhan.length ? (
          <ul className="grid gap-1.5 text-sm" style={sans}>
            {lichSuNhan.slice(0, 12).map((l, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span className="text-xs w-20 shrink-0" style={{ color: MUTED }}>{ngayVN(l.ngay)}</span>
                <b>{l.ma}</b>
                <NhanTrangThai nhan={l.tu} ten={NHAN[l.tu]?.ten ?? l.tu} />→<NhanTrangThai nhan={l.nhan} ten={NHAN[l.nhan]?.ten ?? l.nhan} />
                <span className="text-xs" style={{ color: MUTED }}>{l.lyDo}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs" style={{ color: MUTED }}>{coLuu ? "Chưa có thay đổi trạng thái nào kể từ khi lưu." : ""}</p>
        )}
      </Khoi>

      <Khoi tieuDe="Máy tính trung bình giá / bán bớt" phu="Thử trước khi đặt lệnh: giá vốn mới, tiền cần, tỷ trọng sau lệnh, hoặc cần mua bao nhiêu để giá vốn về mức mong muốn.">
        <MayTinh hangMa={kq.hangMa.filter((h) => h.coDuLieu)} nhan={kq.nhan} tongGiaTri={kq.pb.tongGiaTri} laThanhVien />
      </Khoi>
    </>
  );
}
