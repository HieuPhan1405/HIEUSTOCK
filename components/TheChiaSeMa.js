// THE CHIA SE 1 MA (ve ngoai man hinh roi chup thanh anh PNG de gui khach - xem components/XuatAnh.js). Mau co dinh (nen toi) de anh nhu nhau du nguoi xuat dang dung giao dien sang hay toi.
// Gom: gia / tin hieu / diem, LENH DANG MO (gia mua, lai-lo, vung mua, cat lo, TP1-3), cac lenh DA DONG gan nhat (diem mua, diem ban, lai-lo), chi bao tom tat va ket luan.
// Thiet ke cho DIEN THOAI (26/10/2026): rong 720px (anh 1080 cu bi thu nho ~0,36 lan tren Zalo nen chu 13px chi con ~5px), chu nho nhat 13px, 1 cot, so quan trong 24-52px.
import { fmt, pct, fmtTy, chuoiVung, chamTPCaoNhat, nhanLyDoBan, tinhVungLenh } from "@/components/dungChung";
import { gomTheoLenh, thongKeLenhDaDong } from "@/lib/thongKeLenh";
import { gioChupVN } from "@/lib/xuatAnh";

export const RONG_THE = 720;
const C = { nen: "#0E0F1C", card: "#181A2E", the2: "#1E2140", vien: "#2A2D48", chu: "#F4F5FB", mo: "#A3A6C4", xanh: "#4ADE80", do: "#F87171", vang: "#FBBF24", tim: "#8B7CF6", timNhat: "#C9BEFF", cyan: "#5EEAD4" };
const FONT = "var(--font-chu), 'Open Sans', system-ui, sans-serif";

const mauLai = (v) => (v == null ? C.mo : v >= 0 ? C.xanh : C.do);
const ngayVN = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "—");
const ngayNgan = (s) => (s ? `${String(s).slice(8, 10)}/${String(s).slice(5, 7)}` : "—");
const TIN = {
  MUA: { nhan: "MUA", mau: C.xanh },
  "NAM GIU": { nhan: "NẮM GIỮ", mau: C.cyan },
  BAN: { nhan: "BÁN", mau: C.do },
  "TRUNG LAP": { nhan: "TRUNG LẬP", mau: C.mo },
};
const LY_DO_DONG = { CAT_LO: "Cắt lỗ", BAO_VE_LAI: "Bảo vệ lãi", BAN: "Bán theo tín hiệu", THOAT: "Thoát lệnh", TP3: "Chạm TP3", CHOT_TP3: "Chạm TP3", TP1: "Chốt lời TP1", TP2: "Chốt lời TP2" };

function Tich({ mau = C.xanh, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" stroke={mau} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Khoi({ tieuDe, children, phu }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 20, padding: "22px 24px", marginBottom: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 4, height: 18, borderRadius: 2, background: `linear-gradient(180deg, ${C.timNhat}, ${C.tim})` }} />
          <span style={{ fontSize: 19, fontWeight: 800, color: C.chu }}>{tieuDe}</span>
        </div>
        {phu && <div style={{ fontSize: 14, color: C.mo, marginTop: 6, lineHeight: 1.4 }}>{phu}</div>}
      </div>
      {children}
    </div>
  );
}

function O({ nhan, giaTri, mau, phu, to = false }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 14, color: C.mo, marginBottom: 4 }}>{nhan}</div>
      <div style={{ fontSize: to ? 30 : 24, fontWeight: 800, color: mau ?? C.chu, lineHeight: 1.15 }}>{giaTri}</div>
      {phu && <div style={{ fontSize: 13, color: C.mo, marginTop: 4, lineHeight: 1.35 }}>{phu}</div>}
    </div>
  );
}

function LenhMo({ l, gia }) {
  const v = tinhVungLenh(l);
  const daCham = v?.tp?.daCham ?? 0;
  const tp = (ten, g, i) => {
    const xong = daCham >= i;
    return (
      <span key={ten} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, fontSize: 16, fontWeight: 800, color: xong ? C.xanh : C.chu, background: xong ? "rgba(74,222,128,0.12)" : C.the2, border: `1px solid ${xong ? "rgba(74,222,128,0.4)" : C.vien}` }}>
        {xong && <Tich />}
        {ten} {fmt(g)}
      </span>
    );
  };
  return (
    <div style={{ borderTop: `1px solid ${C.vien}`, paddingTop: 16, marginTop: 16 }}>
      {l.ten_lenh && <div style={{ fontSize: 15, fontWeight: 800, color: C.cyan, marginBottom: 10 }}>{l.ten_lenh}{l.la_lenh_moi ? " · Mua mới" : ""}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
        <O nhan="Giá mua" giaTri={fmt(l.gia_mua)} phu={`ngày ${ngayVN(l.ngay_mua)}`} />
        <O nhan="Lãi / lỗ hiện tại" giaTri={pct(l.lai_lo_pct, 2)} mau={mauLai(l.lai_lo_pct)} phu={l.so_phien_giu === 0 ? "mua hôm nay" : l.so_phien_giu != null ? `giữ ${l.so_phien_giu} phiên` : null} />
        <O nhan="Vùng mua" giaTri={v ? chuoiVung(v.mua.tu, v.mua.den) : "—"} phu={v ? { trong: "giá đang trong vùng", tren: "giá đã vượt vùng", duoi: "giá dưới vùng" }[v.mua.trangThai] : null} />
        <O nhan="Cắt lỗ" giaTri={v?.sl ? chuoiVung(v.sl.tu, v.sl.den) : fmt(l.stop_loss)} mau={C.do} phu={v?.hoaVon ? `đã dời về hòa vốn ${fmt(v.hoaVon)}` : null} />
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 14, color: C.mo, marginBottom: 8 }}>Chốt lời</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {tp("TP1", l.tp1, 1)}
          {tp("TP2", l.tp2, 2)}
          {tp("TP3", l.tp3, 3)}
        </div>
      </div>
      {gia != null && l.gia_mua > 0 && <div style={{ fontSize: 13, color: C.mo, marginTop: 10 }}>Lãi/lỗ tính từ giá mua đến giá hiện tại {fmt(gia)}, chưa trừ phí.</div>}
    </div>
  );
}

// props: row (dong tin hieu cua ma), cacLenh (lenh dang mo da chuan hoa, lenhDangMo), lichSuDaDong (dong lenh_da_dong cua ma), ketLuan (cau ket luan tu dong), vungGia ({ hoTro1, khangCu1 ... }), tag ({ xuHuong, dongTien, adxSucManh, vung })
export default function TheChiaSeMa({ row, cacLenh = [], lichSuDaDong = [], ketLuan = "", vungGia = {}, tag = {} }) {
  const tin = TIN[row.tin] ?? TIN["TRUNG LAP"];
  const lyDoBan = nhanLyDoBan(row);
  const daDong = (lichSuDaDong ?? []).filter((x) => !x.theo_doi);
  const nhom = gomTheoLenh(daDong);
  const tk = thongKeLenhDaDong(daDong);
  // cac lenh da dong GAN NHAT (toi da 5): ngay mua, gia mua, ngay ban + gia ban cua dong cuoi, ket qua ca lenh
  const gan = nhom
    .filter((n) => n.daDong && n.ketQuaPct != null)
    .sort((a, b) => (a.ngayMua < b.ngayMua ? 1 : -1))
    .slice(0, 5)
    .map((n) => {
      const dongLenh = daDong.filter((x) => `${x.ma}|${x.ngay_mua}|${x.vong === 2 ? "moi" : x.vong === 4 || x.vong === 7 || x.vong === 8 ? "giua" : "goc"}` === n.khoa).sort((a, b) => (a.ngay_ban < b.ngay_ban ? -1 : 1));
      const cuoi = dongLenh[dongLenh.length - 1];
      return { ...n, giaMua: dongLenh[0]?.gia_mua, ngayBan: cuoi?.ngay_ban, giaBan: cuoi?.gia_ban, lyDo: LY_DO_DONG[cuoi?.ly_do] ?? "Đóng lệnh" };
    });
  const tpCao = chamTPCaoNhat(row);
  const mauDiem = row.diem >= 0 ? C.xanh : C.do;

  return (
    <div
      style={{
        width: RONG_THE,
        background: `radial-gradient(620px 300px at 12% -60px, rgba(108,92,231,0.42), rgba(108,92,231,0) 70%), radial-gradient(460px 260px at 105% 40px, rgba(34,211,238,0.14), rgba(34,211,238,0) 70%), ${C.nen}`,
        color: C.chu,
        fontFamily: FONT,
        padding: "28px 28px 24px",
        boxSizing: "border-box",
      }}
    >
      {/* DAU */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-day-du-toi.png" alt="CloudStock" style={{ height: 44, width: "auto" }} />
        <span style={{ fontSize: 13, color: C.mo, textAlign: "right", lineHeight: 1.35 }}>
          Dữ liệu cập nhật
          <br />
          {row.cap_nhat_luc ? gioChupVN(new Date(row.cap_nhat_luc)) : gioChupVN()}
        </span>
      </div>

      {/* MA + GIA + TIN HIEU */}
      <div style={{ background: `linear-gradient(160deg, ${C.the2}, ${C.card})`, border: `1px solid ${C.vien}`, borderRadius: 24, padding: "24px 26px", marginBottom: 16, boxShadow: "0 18px 40px -22px rgba(108,92,231,0.7)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: -1 }}>{row.ma}</div>
            <div style={{ fontSize: 17, color: C.chu, marginTop: 10, lineHeight: 1.3 }}>{row.ten_cong_ty ?? ""}</div>
            <div style={{ fontSize: 14, color: C.mo, marginTop: 4 }}>{[row.san ? `Sàn ${row.san}` : null, row.nganh, row.von_hoa].filter(Boolean).join(" · ")}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1 }}>{fmt(row.gia)}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: mauLai(row.doi), marginTop: 8 }}>{pct(row.doi, 2)}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.vien}` }}>
          <span style={{ background: tin.mau, color: "#0E0F1C", fontWeight: 800, fontSize: 20, padding: "7px 20px", borderRadius: 999, boxShadow: `0 8px 22px -8px ${tin.mau}` }}>{tin.nhan}</span>
          <span style={{ fontSize: 15, color: C.mo }}>
            Điểm hợp lưu <b style={{ fontSize: 26, color: mauDiem, marginLeft: 6 }}>{fmt(row.diem)}</b>
          </span>
          {lyDoBan && <span style={{ color: C.vang, fontWeight: 700, fontSize: 15 }}>{lyDoBan.nhan}</span>}
          {tpCao && <span style={{ color: C.xanh, fontWeight: 700, fontSize: 15 }}>Đã chạm {tpCao}</span>}
        </div>
      </div>

      {/* LENH DANG MO */}
      <Khoi tieuDe="Lệnh đang mở" phu={cacLenh.length ? `${cacLenh.length} lệnh` : null}>
        {cacLenh.length ? (
          cacLenh.slice(0, 3).map((l, i) => <div key={l.khoa_lenh ?? i} style={i === 0 ? { marginTop: -16 } : undefined}><LenhMo l={l} gia={row.gia} /></div>)
        ) : (
          <div style={{ fontSize: 16, color: C.mo, lineHeight: 1.55 }}>
            Hiện không có lệnh nào đang mở với mã này. {ketLuan}
          </div>
        )}
      </Khoi>

      {/* DIEM MUA - DIEM BAN DA QUA */}
      <Khoi tieuDe="Điểm mua – bán gần đây" phu={tk.soLenh ? `${tk.soLenh} lệnh đã đóng · thắng ${fmt(tk.tyLeThang)}% · lãi TB ${pct(tk.laiTB, 2)}/lệnh` : null}>
        {gan.length ? (
          <div>
            {gan.map((n, i) => (
              <div key={n.khoa} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${C.vien}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16 }}>
                    <span style={{ color: C.mo }}>Mua</span> <b>{ngayNgan(n.ngayMua)}</b> · {fmt(n.giaMua)}
                    <span style={{ color: C.mo, margin: "0 8px" }}>→</span>
                    <span style={{ color: C.mo }}>Bán</span> <b>{ngayNgan(n.ngayBan)}</b> · {fmt(n.giaBan)}
                  </div>
                  <div style={{ fontSize: 13, color: C.mo, marginTop: 3 }}>
                    {n.soPhien != null ? `Giữ ${n.soPhien} phiên · ` : ""}
                    {n.lyDo}
                  </div>
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: mauLai(n.ketQuaPct), flexShrink: 0 }}>{pct(n.ketQuaPct, 2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 15, color: C.mo }}>Chưa có lệnh nào của mã này được hệ thống đóng.</div>
        )}
      </Khoi>

      {/* CHI BAO */}
      <Khoi tieuDe="Chỉ báo tóm tắt">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 20px" }}>
          <O nhan="Xu hướng" giaTri={tag.xuHuong?.nhan ?? "—"} mau={tag.xuHuong?.mau && tinhMau(tag.xuHuong.mau)} />
          <O nhan="Dòng tiền" giaTri={tag.dongTien?.nhan ?? "—"} mau={tag.dongTien?.mau && tinhMau(tag.dongTien.mau)} />
          <O nhan="Sức mạnh xu hướng (ADX)" giaTri={tag.adxSucManh?.nhan ?? "—"} phu={row.adx != null ? `ADX ${fmt(row.adx)}` : null} mau={tag.adxSucManh?.mau && tinhMau(tag.adxSucManh.mau)} />
          <O nhan="Vùng giá" giaTri={tag.vung?.nhan ?? "—"} mau={tag.vung?.mau && tinhMau(tag.vung.mau)} />
          <O nhan="Hỗ trợ gần nhất" giaTri={fmt(vungGia.hoTro1)} />
          <O nhan="Kháng cự gần nhất" giaTri={fmt(vungGia.khangCu1)} />
          <O nhan="Đỉnh 52 tuần" giaTri={fmt(row.dinh_52t)} />
          <O nhan="GTGD TB20" giaTri={row.gtgd_tb20 != null ? `${fmtTy(row.gtgd_tb20)} tỷ` : "—"} phu={row.von_hoa_ty != null ? `Vốn hóa ${fmtTy(row.von_hoa_ty)} tỷ` : null} />
        </div>
      </Khoi>

      {/* KET LUAN + MIEN TRU */}
      {ketLuan && cacLenh.length > 0 && (
        <div style={{ fontSize: 16, lineHeight: 1.6, color: C.chu, marginBottom: 16, padding: "16px 18px", borderRadius: 16, background: "rgba(108,92,231,0.12)", borderLeft: `4px solid ${C.tim}` }}>
          <b style={{ color: C.timNhat }}>Nhận định: </b>
          {ketLuan}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, fontSize: 12.5, color: C.mo, borderTop: `1px solid ${C.vien}`, paddingTop: 14, lineHeight: 1.45 }}>
        <span style={{ flexShrink: 0 }}>
          <b style={{ color: C.chu, fontSize: 14 }}>CloudStock</b>
          <br />
          cloudstock.id.vn
        </span>
        <span style={{ textAlign: "right" }}>Chụp lúc {gioChupVN()}. Không phải khuyến nghị đầu tư; tín hiệu có thể thay đổi theo từng phiên.</span>
      </div>
    </div>
  );
}

// Mau trong ChiTietMa la bien CSS (var(--xanh)...) - the chia se dung bang mau co dinh.
function tinhMau(v) {
  if (v.includes("xanh")) return C.xanh;
  if (v.includes("do")) return C.do;
  if (v.includes("vang")) return C.vang;
  return C.mo;
}
