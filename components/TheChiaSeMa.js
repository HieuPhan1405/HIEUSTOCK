// THE CHIA SE 1 MA (ve ngoai man hinh roi chup thanh anh PNG de gui khach - xem components/XuatAnh.js). Mau co dinh (nen toi) de anh nhu nhau du nguoi xuat dang dung giao dien sang hay toi.
// Bo cuc (thiet ke lai 04/11/2026): Ma + gia + tin hieu -> BIEU DO NEN ~70 phien kem cac moc (gia mua, cat lo, TP1, TP2, Kijun) -> Ke hoach lenh dang mo (hoac nhan dinh khi chua co lenh)
// -> Lenh da dong gan day -> Chi bao tom tat -> Nhan dinh. KHONG hien TP3 (chi la moc tham khao, he thong chot 30% o TP1, 30% o TP2, giu phan con lai den tin hieu BAN).
// Thiet ke cho DIEN THOAI: rong 720px (Zalo thu nho anh ~0,4 lan), chu nho nhat 14px, 1 cot, so quan trong 24-56px, tuong phan cao.
import { fmt, pct, fmtTy, chuoiVung, chamTPCaoNhat, nhanLyDoBan, tinhVungLenh, VUNG } from "@/components/dungChung";
import { gomTheoLenh, thongKeLenhDaDong } from "@/lib/thongKeLenh";
import { gioChupVN } from "@/lib/xuatAnh";
import { NGANH_NHAN } from "@/lib/nganh";
import { soVN } from "@/lib/soVN";

export const RONG_THE = 720;
const C = { nen: "#0E0F1C", card: "#181A2E", the2: "#20234A", vien: "#2E3254", chu: "#F7F8FF", mo: "#B4B7D6", xanh: "#4ADE80", do: "#FF7A7A", vang: "#FBBF24", tim: "#8B7CF6", timNhat: "#CFC6FF", cyan: "#5EEAD4", luoi: "#252846" };
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
const LY_DO_DONG = { CAT_LO: "Cắt lỗ", BAO_VE_LAI: "Bảo vệ lãi", BAN: "Bán theo tín hiệu", THOAT: "Thoát lệnh", TP3: "Chốt lời", CHOT_TP3: "Chốt lời", TP1: "Chốt lời TP1", TP2: "Chốt lời TP2" };
const SO_NEN = 70;

function Tich({ mau = C.xanh, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" stroke={mau} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Khoi({ tieuDe, children, phu, bien = true }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 22, padding: "22px 24px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: bien ? 16 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 5, height: 20, borderRadius: 3, background: `linear-gradient(180deg, ${C.timNhat}, ${C.tim})` }} />
          <span style={{ fontSize: 21, fontWeight: 800, color: C.chu }}>{tieuDe}</span>
        </div>
        {phu && <span style={{ fontSize: 15, color: C.mo, textAlign: "right" }}>{phu}</span>}
      </div>
      {children}
    </div>
  );
}

function O({ nhan, giaTri, mau, phu, to = false }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 15, color: C.mo, marginBottom: 5 }}>{nhan}</div>
      <div style={{ fontSize: to ? 32 : 26, fontWeight: 800, color: mau ?? C.chu, lineHeight: 1.15 }}>{giaTri}</div>
      {phu && <div style={{ fontSize: 14, color: C.mo, marginTop: 4, lineHeight: 1.35 }}>{phu}</div>}
    </div>
  );
}

// O chi bao nho (luoi 3 cot): nen the2 bo goc, nhan nho + gia tri dam
function Chip({ nhan, giaTri, mau, phu }) {
  return (
    <div style={{ background: C.the2, borderRadius: 14, padding: "12px 14px", minWidth: 0 }}>
      <div style={{ fontSize: 14, color: C.mo, marginBottom: 3 }}>{nhan}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: mau ?? C.chu, lineHeight: 1.2 }}>{giaTri}</div>
      {phu && <div style={{ fontSize: 13, color: C.mo, marginTop: 2 }}>{phu}</div>}
    </div>
  );
}

// BIEU DO NEN (SVG thuan, khong phu thuoc thu vien -> chup anh on dinh): ~70 phien gan nhat + cot khoi luong + cac moc ngang co nhan o le phai.
// muc: [{ ten, gia, mau, net? }] - chi ve moc nam trong (hoac sat) khoang gia dang hien de khong keo gian bieu do.
function BieuDoNen({ nen, muc = [], rong = 636, cao = 280 }) {
  const ds = (nen ?? []).slice(-SO_NEN);
  if (ds.length < 10) return null;
  const LE_PHAI = 92;
  const CAO_KL = 44;
  const x0 = 6;
  const x1 = rong - LE_PHAI;
  const yTren = 10;
  const yDuoi = cao - CAO_KL - 12;
  let lo = Math.min(...ds.map((b) => b.l));
  let hi = Math.max(...ds.map((b) => b.h));
  const khoang = hi - lo || hi * 0.1;
  // chi dua vao nhung moc nam trong +-12% khoang gia
  const hienMuc = muc.filter((m) => m.gia > 0 && m.gia >= lo - khoang * 0.12 && m.gia <= hi + khoang * 0.12);
  for (const m of hienMuc) {
    lo = Math.min(lo, m.gia);
    hi = Math.max(hi, m.gia);
  }
  const pad = (hi - lo) * 0.05;
  lo -= pad;
  hi += pad;
  const y = (g) => yTren + ((hi - g) / (hi - lo)) * (yDuoi - yTren);
  const bw = (x1 - x0) / ds.length;
  const maxKL = Math.max(...ds.map((b) => b.v || 0)) || 1;
  const luoi = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);

  // nhan o le phai: sap theo vi tri, day ra xa nhau toi thieu 17px
  const nhan = hienMuc
    .map((m) => ({ ...m, y: y(m.gia) }))
    .sort((a, b) => a.y - b.y)
    .reduce((ra, m) => {
      const truoc = ra[ra.length - 1];
      ra.push({ ...m, yNhan: truoc && m.y - truoc.yNhan < 18 ? truoc.yNhan + 18 : m.y });
      return ra;
    }, []);

  const cuoi = ds[ds.length - 1];
  return (
    <svg width={rong} height={cao} viewBox={`0 0 ${rong} ${cao}`} style={{ display: "block" }}>
      {luoi.map((g, i) => (
        <g key={i}>
          <line x1={x0} x2={x1} y1={y(g)} y2={y(g)} stroke={C.luoi} strokeWidth="1" />
          <text x={x0 + 2} y={y(g) - 4} fontSize="12" fill="#7A7FA6">
            {soVN(g, g >= 100 ? 0 : 1)}
          </text>
        </g>
      ))}
      {ds.map((b, i) => {
        const cx = x0 + bw * i + bw / 2;
        const tang = b.c >= b.o;
        const mau = tang ? C.xanh : C.do;
        const thanTren = y(Math.max(b.o, b.c));
        const thanCao = Math.max(1.5, Math.abs(y(b.o) - y(b.c)));
        const khl = ((b.v || 0) / maxKL) * (CAO_KL - 4);
        return (
          <g key={b.t}>
            <rect x={cx - Math.max(bw * 0.34, 1)} y={cao - 4 - khl} width={Math.max(bw * 0.68, 2)} height={khl} fill={mau} opacity="0.35" rx="1" />
            <line x1={cx} x2={cx} y1={y(b.h)} y2={y(b.l)} stroke={mau} strokeWidth="1.4" />
            <rect x={cx - Math.max(bw * 0.34, 1.2)} y={thanTren} width={Math.max(bw * 0.68, 2.4)} height={thanCao} fill={mau} rx="1" />
          </g>
        );
      })}
      {nhan.map((m) => (
        <g key={m.ten}>
          <line x1={x0} x2={x1} y1={m.y} y2={m.y} stroke={m.mau} strokeWidth="1.6" strokeDasharray={m.net === "lien" ? undefined : "6 5"} opacity="0.95" />
          <rect x={x1 + 4} y={m.yNhan - 9} width={LE_PHAI - 8} height={18} rx="9" fill={m.mau} />
          <text x={x1 + 4 + (LE_PHAI - 8) / 2} y={m.yNhan + 4.5} fontSize="12" fontWeight="800" textAnchor="middle" fill="#0E0F1C">
            {m.ten} {fmt(m.gia)}
          </text>
        </g>
      ))}
      <circle cx={x1 - bw / 2} cy={y(cuoi.c)} r="4.5" fill="#fff" stroke={C.tim} strokeWidth="2.5" />
      <text x={x0} y={cao - CAO_KL - 1} fontSize="12" fill="#6E7298">
        {ngayNgan(ds[0].t)}
      </text>
      <text x={x1} y={cao - CAO_KL - 1} fontSize="12" textAnchor="end" fill="#6E7298">
        {ngayNgan(cuoi.t)}
      </text>
    </svg>
  );
}

function LenhMo({ l, gia, dau }) {
  const v = tinhVungLenh(l);
  const daCham = v?.tp?.daCham ?? 0;
  const tp = (ten, g, i) => {
    const xong = daCham >= i;
    const c = VUNG?.tyLeChot ?? { tp1: 30, tp2: 30, giu: 40 };
    return (
      <div key={ten} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: xong ? "rgba(74,222,128,0.14)" : C.the2, border: `1px solid ${xong ? "rgba(74,222,128,0.5)" : C.vien}` }}>
        {xong ? <Tich size={20} /> : <span style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${C.mo}`, boxSizing: "border-box", flexShrink: 0 }} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: xong ? C.xanh : C.chu, lineHeight: 1.1 }}>{fmt(g)}</div>
          <div style={{ fontSize: 14, color: C.mo, marginTop: 2 }}>
            {ten} · chốt {i === 1 ? c.tp1 : c.tp2}%{xong ? " · đã chạm" : ""}
          </div>
        </div>
      </div>
    );
  };
  const lech = gia != null && l.gia_mua > 0 ? (gia / l.gia_mua - 1) * 100 : null;
  return (
    <div style={dau ? undefined : { borderTop: `1px solid ${C.vien}`, paddingTop: 18, marginTop: 18 }}>
      {l.ten_lenh && <div style={{ fontSize: 16, fontWeight: 800, color: C.cyan, marginBottom: 12 }}>{l.ten_lenh}{l.la_lenh_moi ? " · Mua mới" : ""}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
        <O nhan="Giá mua" giaTri={fmt(l.gia_mua)} phu={`ngày ${ngayVN(l.ngay_mua)}${l.so_phien_giu === 0 ? " · hôm nay" : l.so_phien_giu != null ? ` · giữ ${l.so_phien_giu} phiên` : ""}`} />
        <O nhan="Lãi / lỗ hiện tại" giaTri={pct(l.lai_lo_pct ?? lech, 2)} mau={mauLai(l.lai_lo_pct ?? lech)} phu="chưa trừ phí" to />
        <O nhan="Vùng mua" giaTri={v ? chuoiVung(v.mua.tu, v.mua.den) : "—"} phu={v ? { trong: "giá đang trong vùng", tren: "giá đã vượt vùng", duoi: "giá dưới vùng" }[v.mua.trangThai] : null} />
        <O nhan="Cắt lỗ" giaTri={v?.sl ? chuoiVung(v.sl.tu, v.sl.den) : fmt(l.stop_loss)} mau={C.do} phu={v?.hoaVon ? `đã dời về hòa vốn ${fmt(v.hoaVon)}` : null} />
      </div>
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 15, color: C.mo, marginBottom: 10 }}>Chốt lời từng phần</div>
        <div style={{ display: "flex", gap: 12 }}>
          {tp("TP1", l.tp1, 1)}
          {tp("TP2", l.tp2, 2)}
        </div>
        <div style={{ fontSize: 14, color: C.mo, marginTop: 10 }}>Phần còn lại ({VUNG?.tyLeChot?.giu ?? 40}%) giữ đến khi hệ thống báo BÁN.</div>
      </div>
    </div>
  );
}

// props: row (dong tin hieu cua ma), cacLenh (lenh dang mo da chuan hoa, lenhDangMo), lichSuDaDong (dong lenh_da_dong cua ma), ketLuan (cau ket luan tu dong), vungGia ({ hoTro1, khangCu1 ... }), tag ({ xuHuong, dongTien, adxSucManh, vung })
export default function TheChiaSeMa({ row, cacLenh = [], lichSuDaDong = [], ketLuan = "", vungGia = {}, tag = {}, nen = null }) {
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
  const tpRaw = chamTPCaoNhat(row);
  const tpCao = tpRaw === "TP3" ? "Đã hoàn tất chốt lời" : tpRaw ? `Đã chạm ${tpRaw}` : null;
  // cac moc ve tren bieu do: lenh dang mo dau tien (gia mua, cat lo, TP1, TP2) + Kijun; chua co lenh thi ho tro / khang cu gan nhat
  const l0 = cacLenh[0];
  const v0 = l0 ? tinhVungLenh(l0) : null;
  const muc = [];
  if (l0) {
    if (l0.gia_mua > 0) muc.push({ ten: "Mua", gia: Number(l0.gia_mua), mau: C.tim, net: "lien" });
    const sl = v0?.sl?.tu ?? l0.stop_loss;
    if (sl > 0) muc.push({ ten: "Cắt lỗ", gia: Number(sl), mau: C.do });
    if (l0.tp1 > 0) muc.push({ ten: "TP1", gia: Number(l0.tp1), mau: C.xanh });
    if (l0.tp2 > 0) muc.push({ ten: "TP2", gia: Number(l0.tp2), mau: "#86EFAC" });
  } else {
    if (vungGia.khangCu1 > 0) muc.push({ ten: "Kháng cự", gia: Number(vungGia.khangCu1), mau: C.vang });
    if (vungGia.hoTro1 > 0) muc.push({ ten: "Hỗ trợ", gia: Number(vungGia.hoTro1), mau: C.cyan });
  }
  if (row.kijun > 0 && !muc.some((m) => Math.abs(m.gia - row.kijun) / row.kijun < 0.006)) muc.push({ ten: "Kijun", gia: Number(row.kijun), mau: C.timNhat });
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
            <div style={{ fontSize: 14, color: C.mo, marginTop: 4 }}>{[row.san ? `Sàn ${row.san}` : null, NGANH_NHAN[row.nganh] || row.nganh, row.von_hoa].filter(Boolean).join(" · ")}</div>
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
          {tpCao && <span style={{ color: C.xanh, fontWeight: 700, fontSize: 15 }}>{tpCao}</span>}
        </div>
      </div>

      {/* BIEU DO NEN + CAC MOC */}
      {nen && nen.length >= 10 && (
        <div style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 22, padding: "16px 12px 10px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 8px 8px 4px" }}>
            <span style={{ fontSize: 18, fontWeight: 800 }}>Diễn biến {Math.min(SO_NEN, nen.length)} phiên gần nhất</span>
            <span style={{ fontSize: 14, color: C.mo }}>nến ngày · cột dưới = khối lượng</span>
          </div>
          <BieuDoNen nen={nen} muc={muc} />
        </div>
      )}

      {/* LENH DANG MO */}
      <Khoi tieuDe={cacLenh.length ? "Kế hoạch lệnh đang mở" : "Lệnh đang mở"} phu={cacLenh.length ? `${cacLenh.length} lệnh` : null}>
        {cacLenh.length ? (
          cacLenh.slice(0, 3).map((l, i) => <LenhMo key={l.khoa_lenh ?? i} l={l} gia={row.gia} dau={i === 0} />)
        ) : (
          <div style={{ fontSize: 18, color: C.chu, lineHeight: 1.55 }}>
            Hiện không có lệnh nào đang mở với mã này.
            {ketLuan && <div style={{ color: C.mo, marginTop: 8 }}>{ketLuan}</div>}
          </div>
        )}
      </Khoi>

      {/* DIEM MUA - DIEM BAN DA QUA */}
      <Khoi tieuDe="Lệnh đã đóng gần đây" phu={tk.soLenh ? `${tk.soLenh} lệnh` : null}>
        {gan.length ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 6 }}>
              <Chip nhan="Tỷ lệ thắng" giaTri={`${fmt(tk.tyLeThang)}%`} mau={tk.tyLeThang >= 50 ? C.xanh : C.vang} />
              <Chip nhan="Lãi TB / lệnh" giaTri={pct(tk.laiTB, 2)} mau={mauLai(tk.laiTB)} />
              <Chip nhan="Số lệnh đã đóng" giaTri={tk.soLenh} />
            </div>
            {gan.map((n, i) => (
              <div key={n.khoa} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "14px 0", borderTop: `1px solid ${C.vien}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 17 }}>
                    <span style={{ color: C.mo }}>Mua</span> <b>{ngayNgan(n.ngayMua)}</b> · {fmt(n.giaMua)}
                    <span style={{ color: C.mo, margin: "0 8px" }}>→</span>
                    <span style={{ color: C.mo }}>Bán</span> <b>{ngayNgan(n.ngayBan)}</b> · {fmt(n.giaBan)}
                  </div>
                  <div style={{ fontSize: 14, color: C.mo, marginTop: 3 }}>
                    {n.soPhien != null ? `Giữ ${n.soPhien} phiên · ` : ""}
                    {n.lyDo}
                  </div>
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: mauLai(n.ketQuaPct), flexShrink: 0 }}>{pct(n.ketQuaPct, 2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 16, color: C.mo }}>Chưa có lệnh nào của mã này được hệ thống đóng.</div>
        )}
      </Khoi>

      {/* CHI BAO */}
      <Khoi tieuDe="Chỉ báo tóm tắt">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Chip nhan="Xu hướng" giaTri={tag.xuHuong?.nhan ?? "—"} mau={tag.xuHuong?.mau && tinhMau(tag.xuHuong.mau)} phu={row.trend != null ? `điểm ${soVN(row.trend, 1, true)}` : null} />
          <Chip nhan="Dòng tiền" giaTri={tag.dongTien?.nhan ?? "—"} mau={tag.dongTien?.mau && tinhMau(tag.dongTien.mau)} phu={row.dt != null ? `điểm ${soVN(row.dt, 1, true)}` : null} />
          <Chip nhan="Sức mạnh xu hướng" giaTri={tag.adxSucManh?.nhan ?? "—"} mau={tag.adxSucManh?.mau && tinhMau(tag.adxSucManh.mau)} phu={row.adx != null ? `ADX ${fmt(row.adx)}` : null} />
          <Chip nhan="Vùng giá" giaTri={tag.vung?.nhan ?? "—"} mau={tag.vung?.mau && tinhMau(tag.vung.mau)} phu="so với cân bằng dài hạn" />
          <Chip nhan="Hỗ trợ gần nhất" giaTri={fmt(vungGia.hoTro1)} mau={C.cyan} />
          <Chip nhan="Kháng cự gần nhất" giaTri={fmt(vungGia.khangCu1)} mau={C.vang} />
          {row.rs_vni != null && <Chip nhan="So với VN-Index" giaTri={pct(row.rs_vni, 1)} mau={mauLai(row.rs_vni)} phu="20 phiên gần nhất" />}
          <Chip nhan="Đỉnh 52 tuần" giaTri={fmt(row.dinh_52t)} />
          <Chip nhan="GTGD TB20" giaTri={row.gtgd_tb20 != null ? `${fmtTy(row.gtgd_tb20)} tỷ` : "—"} phu={row.von_hoa_ty != null ? `Vốn hóa ${fmtTy(row.von_hoa_ty)} tỷ` : null} />
        </div>
      </Khoi>

      {/* KET LUAN + MIEN TRU */}
      {ketLuan && cacLenh.length > 0 && (
        <div style={{ fontSize: 17, lineHeight: 1.6, color: C.chu, marginBottom: 16, padding: "18px 20px", borderRadius: 18, background: "rgba(108,92,231,0.12)", borderLeft: `4px solid ${C.tim}` }}>
          <b style={{ color: C.timNhat }}>Nhận định: </b>
          {ketLuan}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, fontSize: 13.5, color: C.mo, borderTop: `1px solid ${C.vien}`, paddingTop: 14, lineHeight: 1.45 }}>
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
