"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import { NHAN } from "@/lib/phongCachDauTu";
import { thongKeNhatKy } from "@/lib/nhatKyGiaoDich";
import { fmt } from "@/components/dungChung";
import { DongHoDiem, TruDiem, BieuDoHieuSuat } from "@/components/DanhGiaDanhMucBieuDo";
import { BangTruocSau } from "@/components/DanhGiaXuLy";
import { trangThaiVni, GOC } from "@/components/DanhGiaBoiCanh";
import { NhanXet, NhanTrangThai, sans, soVN, p1, p0, dau, tien, mauLai, ngayVN } from "@/components/DanhGiaChung";

// BAO CAO DANH MUC de gui khach: xem truoc tren man hinh (nen trang, kho A4) roi In / Luu PDF bang hop thoai in cua trinh duyet.
// In: globals.css (@media print) an moi thu ngoai .cs-in-bao-cao. Mau giao dien SANG co dinh (bien CSS dat lai trong khung bao cao) - khong theo giao dien toi cua web.
const SANG = {
  "--nen": "#FFFFFF", "--card": "#FFFFFF", "--chu": "#12121C", "--mo": "#5A5A6E", "--vien": "#DDDFE8", "--vien-nhe": "#ECEDF3",
  "--xanh": "#16A34A", "--do": "#DC2626", "--vang": "#D97706", "--cam": "#EA580C", "--bd-1": "#8B5CF6", "--bd-2": "#B7791F", "--tim-nhat": "#7C3AED",
};
const TEN_TRU = { daDang: "Đa dạng hóa", ruiRo: "Rủi ro", xuHuong: "Xu hướng", thanhKhoan: "Thanh khoản", doanhNghiep: "Doanh nghiệp" };
const LOAI_HD = { ban_het: "Bán hết", ban_bot: "Bán bớt", chot_bot: "Chốt lời một phần", mua_them: "Mua thêm", tra_no: "Giảm nợ" };

function Muc({ so, tieuDe, children }) {
  return (
    <section className="mb-5">
      <h2 className="cs-bao-cao-tieu-de text-[15px] mb-2 pb-1 border-b" style={{ ...sans, fontWeight: 800, borderColor: "#DDDFE8", color: "#4B3FD1" }}>
        {so}. {tieuDe}
      </h2>
      {children}
    </section>
  );
}
function O({ nhan, gt, phu, mau }) {
  return (
    <div className="rounded-lg border px-3 py-2" style={{ borderColor: "#DDDFE8" }}>
      <div className="text-[10.5px]" style={{ color: "#5A5A6E" }}>{nhan}</div>
      <div className="text-[17px]" style={{ fontWeight: 800, color: mau ?? "#12121C" }}>{gt}</div>
      {phu && <div className="text-[10px]" style={{ color: "#5A5A6E" }}>{phu}</div>}
    </div>
  );
}
const Bang = ({ cot, hang, phai = [] }) => (
  <table className="w-full text-[11.5px]" style={sans}>
    <thead>
      <tr className="text-left" style={{ color: "#5A5A6E" }}>
        {cot.map((c, i) => <th key={i} className={`py-1 px-1.5 font-normal border-b ${phai.includes(i) ? "text-right" : ""}`} style={{ borderColor: "#DDDFE8" }}>{c}</th>)}
      </tr>
    </thead>
    <tbody>
      {hang.map((h, k) => (
        <tr key={k} className="align-top">
          {h.map((v, i) => <td key={i} className={`py-1 px-1.5 border-b ${phai.includes(i) ? "text-right whitespace-nowrap" : ""}`} style={{ borderColor: "#ECEDF3" }}>{v}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
);

export default function BaoCaoDanhMuc({ mo, dong, kq, sau, hanhDongChon = [], du, gocNganh = {}, laThanhVien, baoCao = {}, setBaoCao, ngay, nhatKy = [], tenDanhMuc = "", goiY = null, goiYDu = null }) {
  const [tuyChon, setTuyChon] = useState({ anTien: false, keHoach: true, goiY: true, nhatKy: true, boiCanh: true });
  useEffect(() => {
    if (!mo) return;
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && dong();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = cu;
      window.removeEventListener("keydown", esc);
    };
  }, [mo, dong]);
  if (!mo || !kq || typeof document === "undefined") return null;
  const { pb, rr, suc, dn, phongCach: pc } = kq;
  const an = tuyChon.anTien;
  const ten = baoCao.khach?.trim();
  const tk = thongKeNhatKy(nhatKy, { catLo: pc.catLo });
  const vni = du?.boiCanh?.vni;
  const ttv = trangThaiVni(vni);
  const rcMa = Object.fromEntries((rr?.ma ?? []).map((x) => [x.ma, x.rc]));
  const ds = kq.hangMa.filter((h) => h.coDuLieu).sort((a, b) => (b.tyTrong ?? 0) - (a.tyTrong ?? 0));
  const nganh = (pb.nganh ?? []).filter((g) => g.ten !== "Khác");
  const song = nganh.filter((g) => ["Leading", "Improving"].includes(gocNganh[g.ten])).reduce((s, g) => s + g.tyTrong, 0);
  const o = "px-2.5 py-1.5 rounded-lg text-sm border w-full";
  const oS = { borderColor: "#DDDFE8", background: "#fff", color: "#12121C", ...sans };
  const sua = (k) => (e) => setBaoCao((b) => ({ ...b, [k]: e.target.value }));
  let soMuc = 0;
  const muc = () => ++soMuc;

  return createPortal(
    <div className="cs-in-bao-cao fixed inset-0 z-[200] overflow-auto" style={{ background: "rgba(10,10,20,0.72)" }} role="dialog" aria-modal="true" aria-label="Báo cáo danh mục">
      {/* THANH CONG CU (khong in) */}
      <div className="cs-khong-in sticky top-0 z-10 px-4 py-3 border-b" style={{ background: "#1F3D2B", borderColor: "#2F5A41", color: "#F6F0E1", ...sans }}>
        <div className="max-w-[860px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <b className="text-sm">Báo cáo danh mục — xem trước</b>
            <div className="flex gap-2">
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: "#8B5CF6", color: "#fff" }}>
                <Printer size={15} /> In / Lưu PDF
              </button>
              <button type="button" onClick={dong} className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border" style={{ borderColor: "#3A3A48" }} aria-label="Đóng báo cáo">
                <X size={15} /> Đóng
              </button>
            </div>
          </div>
          <details>
            <summary className="text-xs cursor-pointer select-none" style={{ color: "#B8B8C8" }}>Thông tin trên báo cáo (tên khách, người lập, nhận định) và tùy chọn</summary>
            <div className="grid sm:grid-cols-3 gap-2 mt-2">
              <input value={baoCao.khach ?? ""} onChange={sua("khach")} placeholder="Khách hàng (vd: Anh Nguyễn Văn A)" className={o} style={oS} maxLength={80} />
              <input value={baoCao.nguoiLap ?? ""} onChange={sua("nguoiLap")} placeholder="Người lập báo cáo" className={o} style={oS} maxLength={80} />
              <input value={baoCao.lienHe ?? ""} onChange={sua("lienHe")} placeholder="Liên hệ (SĐT / email)" className={o} style={oS} maxLength={120} />
              <textarea value={baoCao.ghiChu ?? ""} onChange={sua("ghiChu")} placeholder="Nhận định của chuyên viên (hiện ở đầu báo cáo)" rows={3} className={`${o} sm:col-span-3`} style={oS} maxLength={800} />
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-xs">
              {[
                ["anTien", "Ẩn số tiền (chỉ hiện %)"],
                ...(laThanhVien ? [["keHoach", "Gồm kế hoạch xử lý"], ["goiY", "Gồm mã gợi ý mua"]] : []),
                ["nhatKy", "Gồm nhật ký giao dịch"],
                ["boiCanh", "Gồm bối cảnh thị trường"],
              ].map(([k, t]) => (
                <label key={k} className="inline-flex items-center gap-1.5">
                  <input type="checkbox" checked={tuyChon[k]} onChange={(e) => setTuyChon((c) => ({ ...c, [k]: e.target.checked }))} /> {t}
                </label>
              ))}
            </div>
            <p className="text-[11px] mt-2" style={{ color: "#8B8B99" }}>Trên điện thoại: bấm “In / Lưu PDF” rồi chọn “Lưu thành PDF” để gửi qua tin nhắn. Thông tin này được lưu cùng danh mục.</p>
          </details>
        </div>
      </div>

      {/* TRANG BAO CAO */}
      <div className="cs-trang mx-auto my-6 bg-white shadow-2xl" style={{ ...SANG, width: "min(820px, calc(100vw - 16px))", padding: "28px 30px", color: "#12121C", ...sans }}>
        <header className="cs-bao-cao-khoi flex flex-wrap items-start justify-between gap-3 mb-4 pb-3 border-b-2" style={{ borderColor: "#8B5CF6" }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-day-du.png" alt="CloudStock" style={{ height: 34, width: "auto" }} />
            <h1 className="text-[20px] mt-2" style={{ fontWeight: 800, letterSpacing: 0.2 }}>BÁO CÁO ĐÁNH GIÁ DANH MỤC</h1>
            <p className="text-[12px]" style={{ color: "#5A5A6E" }}>
              {ten ? <>Khách hàng: <b style={{ color: "#12121C" }}>{ten}</b> · </> : tenDanhMuc ? <>Danh mục: <b style={{ color: "#12121C" }}>{tenDanhMuc}</b> · </> : null}
              Phong cách: <b style={{ color: "#12121C" }}>{pc.ten}</b>
            </p>
          </div>
          <div className="text-right text-[11.5px]" style={{ color: "#5A5A6E" }}>
            <div>Dữ liệu {ngay || "—"}</div>
            <div>Lập lúc {new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}</div>
            {baoCao.nguoiLap && <div>Người lập: <b style={{ color: "#12121C" }}>{baoCao.nguoiLap}</b></div>}
            {baoCao.lienHe && <div>{baoCao.lienHe}</div>}
          </div>
        </header>

        {baoCao.ghiChu?.trim() && (
          <section className="cs-bao-cao-khoi mb-5 rounded-lg p-3 text-[12.5px] whitespace-pre-line" style={{ background: "#F3F1FF", borderLeft: "4px solid #8B5CF6" }}>
            <b>Nhận định của chuyên viên: </b>
            {baoCao.ghiChu.trim()}
          </section>
        )}

        <Muc so={muc()} tieuDe="Tóm tắt">
          <div className="cs-bao-cao-khoi grid gap-4 sm:grid-cols-[200px_1fr_1.3fr] items-start">
            <div className="text-center">
              <DongHoDiem diem={suc?.diem} xepLoai={suc?.xepLoai} size={190} />
              {suc?.gioiHan && <p className="text-[10px]" style={{ color: "#5A5A6E" }}>Giới hạn ở mức Trung bình vì {Math.round(suc.tyLeNang * 100)}% giá trị nằm ở mã cần thoát / cảnh báo nặng</p>}
            </div>
            <div>{suc && Object.keys(suc.tru).map((k) => <TruDiem key={k} ten={TEN_TRU[k]} v={suc.tru[k]} toiDa={suc.toiDa[k]} />)}</div>
            <ul className="grid gap-2">{kq.nhanXet.filter((x) => !an || !/\d\s*(triệu|tỷ)/.test(x.noiDung)).slice(0, 5).map((x, i) => <NhanXet key={i} x={x} />)}</ul>
          </div>
        </Muc>

        <Muc so={muc()} tieuDe="Tài sản">
          <div className="cs-bao-cao-khoi grid grid-cols-2 sm:grid-cols-4 gap-2">
            {!an && <O nhan="Giá trị cổ phiếu" gt={tien(pb.tongGiaTri)} phu={`${pb.soMaCoGia} mã`} />}
            <O nhan="Lãi / lỗ so với giá vốn" gt={pb.laiLoPct != null ? dau(pb.laiLoPct) : "—"} mau={mauLai(pb.laiLoPct)} phu={!an && pb.laiLo != null ? tien(pb.laiLo) : undefined} />
            {!an && <O nhan="Tài sản ròng (NAV)" gt={tien(pb.taiSan.nav)} phu={pb.taiSan.no > 0 ? `Nợ ${tien(pb.taiSan.no)}` : undefined} />}
            <O nhan="Tiền mặt / tổng tài sản" gt={`${Math.round(pb.taiSan.tyLeTienMat * 100)}%`} />
            {pb.margin && <O nhan="Tỷ lệ ký quỹ" gt={`${p0(pb.margin.tyLeKyQuy)}%`} phu={`Đòn bẩy ${pb.margin.donBay?.toFixed(2).replace(".", ",") ?? "—"}x`} />}
            {pb.margin && <O nhan={`Giảm bao nhiêu thì chạm ${pb.nguong.canhBao}%`} gt={pb.margin.giamDenCanhBao != null ? `−${p0(pb.margin.giamDenCanhBao)}%` : "—"} mau={pb.margin.giamDenCanhBao <= 10 ? "#DC2626" : pb.margin.giamDenCanhBao <= 25 ? "#D97706" : undefined} />}
          </div>
        </Muc>

        <Muc so={muc()} tieuDe="Vị thế và trạng thái">
          <Bang
            cot={[
              "Mã",
              ...(an ? [] : ["Số lượng"]),
              "Giá vốn",
              "Giá",
              "Lãi/lỗ",
              "Tỷ trọng",
              "Rủi ro gánh",
              ...(laThanhVien ? ["Trạng thái", "Vì sao"] : []),
            ]}
            phai={an ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]}
            hang={ds.map((h) => [
              <b key="m">{h.ma}</b>,
              ...(an ? [] : [soVN(h.kl)]),
              h.giaVon != null ? fmt(h.giaVon) : "—",
              h.gia != null ? fmt(h.gia) : "—",
              <span key="l" style={{ color: mauLai(h.laiLoPct) }}>{dau(h.laiLoPct)}</span>,
              h.tyTrong != null ? `${p1(h.tyTrong * 100)}%` : "—",
              rcMa[h.ma] != null ? `${p1(rcMa[h.ma] * 100)}%` : "—",
              ...(laThanhVien ? [<NhanTrangThai key="n" nhan={kq.nhan[h.ma]?.nhan} ten={NHAN[kq.nhan[h.ma]?.nhan]?.ten} />, <span key="v" className="text-[10.5px]">{kq.nhan[h.ma]?.lyDo.join("; ")}</span>] : []),
            ])}
          />
        </Muc>

        {rr?.dsMa?.length > 0 && (
          <Muc so={muc()} tieuDe="Rủi ro (1 năm dữ liệu giá)">
            <div className="cs-bao-cao-khoi grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              <O nhan="Biến động dự báo" gt={`${p0(rr.volP)}%`} phu={`VN-Index ${p0(rr.volV)}%`} />
              <O nhan="Beta" gt={rr.betaP.toFixed(2).replace(".", ",")} />
              <O nhan="Khoản độc lập" gt={`≈ ${p1(rr.soCuocDocLap)}`} phu={`từ ${rr.ma.length} mã`} />
              <O nhan="Một phiên xấu" gt={`−${p1(rr.var95)}%`} phu="VaR 95%" />
              {rr.duBao ? <O nhan="Sụt giảm 6 tháng tới" gt={`≤ ${p0(rr.duBao.p80)}%`} phu={`4/5 trường hợp · thường ${p0(rr.duBao.trungVi)}%`} /> : <O nhan="Sụt giảm tối đa" gt={`−${p1(Math.abs(rr.ddP.pct))}%`} phu={`VN-Index −${p1(Math.abs(rr.ddV))}%`} />}
              <O nhan="1 năm qua" gt={dau(rr.laiP)} phu={`VN-Index ${dau(rr.laiV)}`} mau={mauLai(rr.laiP - rr.laiV)} />
            </div>
            <div className="cs-bao-cao-khoi mb-3"><BieuDoHieuSuat chuoi={rr.chuoi} /></div>
            <Bang
              cot={["Kịch bản", "Danh mục", "Tài sản ròng", ...(pb.margin ? ["Ký quỹ"] : [])]}
              phai={[1, 2, 3]}
              hang={[...rr.kichBan, ...(rr.khungHoang ?? [])].map((k) => [
                <span key="t">{k.ten}<div className="text-[10px]" style={{ color: "#5A5A6E" }}>{k.ghiChu}</div></span>,
                `${p1(k.portPct)}%`,
                k.navPct != null ? `${p1(k.navPct)}%${an ? "" : ` (${tien(k.doiGiaTri)})`}` : "—",
                ...(pb.margin ? [`${k.tyLeKyQuy != null ? `${Math.round(k.tyLeKyQuy)}%` : "—"}${k.chamGC ? " · giải chấp" : k.chamCB ? " · gọi ký quỹ" : ""}`] : []),
              ])}
            />
          </Muc>
        )}

        {dn && (
          <Muc so={muc()} tieuDe={`Doanh nghiệp (BCTC phủ ${p0(dn.phuGiaTri * 100)}% giá trị)`}>
            <div className="cs-bao-cao-khoi grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
              <O nhan="P/E danh mục" gt={dn.pe ? p1(dn.pe.v) : "—"} phu={du?.thiTruong?.pe ? `Thị trường ${p1(du.thiTruong.pe)}` : undefined} />
              <O nhan="P/B" gt={dn.pb ? p1(dn.pb.v) : "—"} />
              <O nhan="ROE" gt={dn.roe ? `${p1(dn.roe.v)}%` : "—"} phu={du?.thiTruong?.roe != null ? `Thị trường ${p1(du.thiTruong.roe)}%` : undefined} />
              <O nhan="Lợi nhuận 4 quý" gt={dn.lnYoY ? dau(dn.lnYoY.v, 0) : "—"} />
              <O nhan="Cổ tức" gt={dn.coTuc ? `${p1(dn.coTuc.v)}%` : "—"} />
            </div>
            <Bang
              cot={["Mã", "P/E (ngành)", "ROE", "LN 4 quý", "Z / F", "Đánh giá 360"]}
              phai={[1, 2, 3]}
              hang={ds.filter((h) => du?.coBan?.[h.ma]).map((h) => {
                const c = du.coBan[h.ma];
                const tc = c.loai && c.loai !== "pi";
                return [<b key="m">{h.ma}</b>, `${c.pe != null ? p1(c.pe) : c.lnTTM <= 0 ? "lỗ" : "—"}${c.peNganh != null ? ` (${p1(c.peNganh)})` : ""}`, c.roe != null ? `${p1(c.roe)}%` : "—", dau(c.lnYoY, 0), tc ? (c.sinhLoi != null ? `sinh lời ${c.sinhLoi}/5` : "—") : `${c.vungZ2 ?? "—"} · F ${c.f ?? "—"}/9`, c.d360 != null ? `${p1(c.d360)} · ${c.xepLoai}` : "—"];
              })}
            />
            {dn.coDo.length > 0 && <p className="text-[11px] mt-2" style={{ color: "#DC2626" }}>Cờ đỏ: {dn.coDo.map((x) => `${x.ma} (${x.cacCo.join(", ")})`).join("; ")}.</p>}
          </Muc>
        )}

        {laThanhVien && tuyChon.keHoach && (
          <Muc so={muc()} tieuDe="Kế hoạch xử lý đề xuất">
            {hanhDongChon.length === 0 ? (
              <p className="text-[12px]">Không có việc cần làm ngay — tiếp tục giữ và theo dõi trạng thái từng mã.</p>
            ) : (
              <>
                <Bang
                  cot={["Bước", "Việc", ...(an ? [] : ["Số lượng", "Giá"]), "Lý do"]}
                  phai={an ? [] : [2, 3]}
                  hang={hanhDongChon.map((a, i) => {
                    // thoat 3 buoc: B1 ban ngay, B2-B3 lenh cho hoi, muc cat cung cho phan con lai
                    const tp = a.loai === "ban_het" && a.cachThoat === "tung_phan" ? a.tungPhan : null;
                    return [
                      i + 1,
                      <b key="t">{a.loai === "tra_no" ? `${LOAI_HD[a.loai]}${an ? "" : ` ${tien(a.giaTri)}`}` : tp ? `Thoát 3 bước ${a.ma}` : `${LOAI_HD[a.loai]} ${a.ma}`}</b>,
                      ...(an ? [] : [a.loai === "tra_no" ? "—" : soVN(tp ? tp.buoc[0].kl : a.kl), a.gia ? fmt(a.gia) : "—"]),
                      <span key="l" className="text-[10.5px]">
                        {a.lyDo}
                        {a.ghiChu ? ` — ${a.ghiChu}` : ""}
                        {tp ? ` — B1 bán ngay${an ? "" : ` ${soVN(tp.buoc[0].kl)} cp`}; ${tp.buoc.slice(1).map((b) => `chờ bán${an ? "" : ` ${soVN(b.kl)} cp`} khi hồi lên ${fmt(b.gia)}`).join("; ")}; cắt cứng phần còn lại nếu đóng cửa dưới ${fmt(tp.catCung)}.` : ""}
                      </span>,
                    ];
                  })}
                />
                {sau && <div className="mt-3"><BangTruocSau truoc={kq} sau={sau.kq} ad={an ? null : sau.ad} /></div>}
              </>
            )}
          </Muc>
        )}

        {tuyChon.nhatKy && tk.soLenh > 0 && (
          <Muc so={muc()} tieuDe="Nhật ký giao dịch">
            {tk.soLenhBan > 0 && (
              <p className="text-[12px] mb-2">
                {tk.soLenhBan} lệnh bán: {tk.soThang} lãi, {tk.soThua} lỗ{tk.tyLeThang != null ? ` (${p0(tk.tyLeThang * 100)}% có lãi)` : ""}. Lãi TB {dau(tk.laiTBThangPct)}, lỗ TB {dau(tk.loTBThuaPct)}
                {!an ? ` · lãi/lỗ đã chốt ${tien(tk.laiDaChot)}` : ""}.
              </p>
            )}
            <Bang
              cot={["Ngày", "Mã", "Lệnh", ...(an ? [] : ["Số lượng"]), "Giá", "Lãi/lỗ"]}
              phai={an ? [3, 4] : [3, 4, 5]}
              hang={[...nhatKy].sort((a, b) => String(b.ngay).localeCompare(String(a.ngay))).slice(0, 25).map((g) => [ngayVN(g.ngay), <b key="m">{g.ma}</b>, g.loai === "mua" ? "Mua" : "Bán", ...(an ? [] : [soVN(g.kl)]), g.gia != null ? fmt(g.gia) : "—", g.laiChotPct != null ? dau(g.laiChotPct) : ""])}
            />
          </Muc>
        )}

        {laThanhVien && tuyChon.goiY && goiY && goiYDu && (
          <Muc so={muc()} tieuDe="Mã gợi ý mua (bộ điều kiện đã kiểm chứng)">
            <p className="text-[11.5px] mb-1.5">
              Điều kiện: hệ thống báo MUA, giá trong vùng mua (≤ mốc +1%), không cao hơn SMA50 quá 3%, RSI14 ≤ 59, VN-Index 20 phiên tăng ≤ 5% (hiện {goiYDu.vni20 != null ? dau(goiYDu.vni20) : "—"}). Tối đa 6 mã, mỗi mã 1/6 tài sản, cắt lỗ ≤ 6%. Danh mục có {goiY.soMaHienCo} mã → còn {goiY.conCho} chỗ.
            </p>
            {goiY.goiY.filter((x) => x.trongCho).length === 0 ? (
              <p className="text-[12px]">Chưa có mã nào đạt đủ điều kiện — giữ tiền mặt, chờ điểm mua, không mua đuổi.</p>
            ) : (
              <Bang
                cot={["Mã", "Ngành", "Vùng mua", "Cắt lỗ", "TP1", ...(an ? [] : ["Số lượng", "Tiền"])]}
                phai={an ? [2, 3, 4] : [2, 3, 4, 5, 6]}
                hang={goiY.goiY.filter((x) => x.trongCho).map((x) => [<b key="m">{x.ma}</b>, x.nganh, `${fmt(x.moc)}–${fmt(x.moc * 1.01)}`, `${fmt(x.catLo)} (−${p1(x.catLoPct)}%)`, x.tp1 ? fmt(x.tp1) : "—", ...(an ? [] : [x.kl ? soVN(x.kl) : "—", x.kl ? tien(x.tien) : "—"])])}
              />
            )}
            {goiYDu.cho?.length > 0 && <p className="text-[11px] mt-1.5" style={{ color: "#5A5A6E" }}>Đang chờ điểm mua: {goiYDu.cho.slice(0, 8).map((x) => `${x.ma} (ra MUA nếu đóng cửa ${fmt(x.muaTu)}–${fmt(x.muaDen)})`).join(", ")}.</p>}
            <p className="text-[10.5px] mt-1.5" style={{ color: "#5A5A6E" }}>Kiểm chứng 2014–10/2026 (6 mã, chia đều): tích lũy ×3,61 so với VN-Index ×3,45; 2022 −7,7% (VN-Index −32,8%), 2018 −22,8% (−9,3%), 2017 +17,3% (+48%). Ngưỡng chọn sau khi xem dữ liệu đến 2023; chỉ 2024–2026 là kiểm tra thật.</p>
          </Muc>
        )}

        {tuyChon.boiCanh && du?.boiCanh && (
          <Muc so={muc()} tieuDe="Bối cảnh thị trường">
            <p className="text-[12px] mb-1.5">
              <b>VN-Index {vni?.gia != null ? fmt(vni.gia) : ""}</b>
              {ttv ? ` — ${ttv.ten.toLowerCase()}. ${ttv.noiDung}` : ""}
            </p>
            {nganh.length > 0 && (
              <p className="text-[12px] mb-1.5">
                Ngành: {nganh.slice(0, 5).map((g) => `${g.ten} ${Math.round(g.tyTrong * 100)}%${gocNganh[g.ten] ? ` (${GOC[gocNganh[g.ten]].toLowerCase()})` : ""}`).join(", ")}. {Math.round(song * 100)}% danh mục ở ngành đang có sóng.
              </p>
            )}
            {du.boiCanh.viMo?.length > 0 && (
              <ul className="text-[11.5px] list-disc pl-5" style={{ color: "#3A3A4A" }}>
                {du.boiCanh.viMo.slice(0, 3).map((t) => <li key={t.link}>{t.tieuDe} <span style={{ color: "#8B8B99" }}>(CafeF)</span></li>)}
              </ul>
            )}
          </Muc>
        )}

        <section className="cs-bao-cao-khoi mt-6 pt-3 border-t text-[10px] leading-relaxed" style={{ borderColor: "#DDDFE8", color: "#5A5A6E" }}>
          <p>
            <b>Phương pháp:</b> rủi ro tính trên khoảng 1 năm giá đóng cửa đã điều chỉnh (DNSE) với tỷ trọng hiện tại giữ nguyên; biến động năm = độ lệch chuẩn lợi suất ngày × √250; “khoản đầu tư độc lập” = bình phương hệ số đa dạng hóa; VaR 95% lịch sử; kịch bản theo beta và theo đợt
            giảm mạnh nhất của VN-Index trong năm. Doanh nghiệp: BCTC quý mới nhất (VNDirect), đánh giá 360 = thứ hạng so với mã cùng loại. Trạng thái và kế hoạch theo quy tắc của phong cách “{pc.ten}” — ngưỡng do CloudStock tự đặt{pc.ngan === "Xu hướng" ? " theo hệ thống tín hiệu của web" : ", chưa kiểm chứng bằng backtest"}.
          </p>
          <p className="mt-1">
            <b>Lưu ý:</b> báo cáo dựa trên dữ liệu quá khứ và danh mục do người dùng nhập, chỉ để tham khảo, không phải khuyến nghị mua bán. Lãi/lỗ chưa trừ phí và thuế (trừ nhật ký). Kết quả quá khứ không đảm bảo tương lai.
          </p>
          <p className="mt-2 text-center" style={{ color: "var(--tim-chu)", fontWeight: 700 }}>CloudStock · cloudstock.id.vn/danh-gia-danh-muc</p>
        </section>
      </div>
    </div>,
    document.body
  );
}
