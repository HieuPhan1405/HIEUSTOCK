// GOI Y XU LY DANH MUC (cat lo / ban bot / chot loi / mua them - trung binh gia / giam no margin) + ap dung ke hoach de so sanh TRUOC - SAU.
// Ham THUAN (test tay: engine/test/xuLyDanhMuc.test.mjs). Quy tac theo phong cach (lib/phongCachDauTu.js), nguong la web TU DAT - chi de tham khao, khong phai khuyen nghi.
// Don vi: gia NGHIN DONG / cp (nhu tren web), tien DONG. Lo chan 100 cp.
import { layPhongCach } from "./phongCachDauTu.js";
import { phanTramGiamDenNguong } from "./danhGiaDanhMuc.js";

const LO = 100;
const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const p0 = (x) => `${Math.round(x)}`;
const p1 = (x) => x.toFixed(1).replace(".", ",");
const xuong = (n) => (n >= LO ? Math.floor(n / LO) * LO : Math.max(0, Math.floor(n)));
const len = (n, toiDa) => Math.min(toiDa, n >= LO ? Math.ceil(n / LO) * LO : Math.ceil(n));
const DEM_MARGIN_MUC_TIEU = 25; // % gia co phieu con giam duoc truoc khi cham nguong canh bao

// Gia von binh quan sau khi mua them klThem cp gia `gia`
export function giaVonSauMua(kl, giaVon, klThem, gia) {
  kl = so(kl) ?? 0;
  klThem = so(klThem) ?? 0;
  if (!(kl + klThem > 0) || !(so(gia) > 0)) return null;
  if (!(so(giaVon) > 0)) return klThem > 0 ? so(gia) : null;
  return (kl * giaVon + klThem * gia) / (kl + klThem);
}

// Can mua them bao nhieu cp gia `gia` de gia von ve `mucTieu` (chi co nghia khi gia < mucTieu < giaVon). Lam tron len lo 100.
export function soCpDeVeGiaVon(kl, giaVon, gia, mucTieu) {
  if (!(kl > 0 && giaVon > 0 && gia > 0 && mucTieu > 0) || !(gia < mucTieu && mucTieu < giaVon)) return null;
  const n = (kl * (giaVon - mucTieu)) / (mucTieu - gia);
  return n >= LO ? Math.ceil(n / LO) * LO : Math.ceil(n);
}

// Gop cac dong cung ma (nguoi dung nhap 1 ma 2 lan) -> 1 vi the, gia von binh quan
export function gopViThe(hang) {
  const m = new Map();
  for (const h of hang) {
    if (!(h.kl > 0)) continue;
    const c = m.get(h.ma);
    if (!c) m.set(h.ma, { ma: h.ma, kl: h.kl, giaVon: h.giaVon ?? null, gia: h.gia ?? null });
    else {
      const gv = c.giaVon != null && h.giaVon != null ? (c.kl * c.giaVon + h.kl * h.giaVon) / (c.kl + h.kl) : c.giaVon ?? h.giaVon ?? null;
      m.set(h.ma, { ...c, kl: c.kl + h.kl, giaVon: gv });
    }
  }
  return m;
}

// THOAT TUNG PHAN cho vi the LON (cat 1 lan se chot lo lon / ban dung day / thanh khoan khong du): 3 buoc
//   B1 ban ngay: phan vuot ty trong toi da (it nhat 1/3 vi the) - giam tap trung ngay;
//   B2, B3: lenh cho ban khi gia HOI len khang cu gan nhat phia tren (Tenkan / Kijun / duong can bang dai han; khong co thi +3% / +6%);
//   phan con lai co MUC CAT CUNG = duoi day 20 phien 1% (khoang cach 3-8%): dong cua duoi muc nay thi ban het.
// So sanh voi BAN HET NGAY (chenh lech tien, khong can gia von): neu hoi khop het B2, B3 -> do lo bao nhieu; neu thung muc cat cung -> lo them toi da bao nhieu;
// GIU NGUYEN -> neu VN-Index giam them 10% lo them ~ beta x 10% (khong co gioi han). Khong phai du bao: khong ai biet gia se hoi hay thung truoc.
// p = { ma, kl, giaVon, gia }, ls = { tenkan, kijun, gg_bot, thap20 } (nen tu API), tong = gia tri co phieu danh muc, tran = ty trong toi da / ma.
export function thoatTungPhan(p, ls = {}, { tong = 0, tran = 0.3, beta = null } = {}) {
  const gia = so(p.gia);
  if (!(gia > 0) || !(p.kl > 0)) return null;
  const giaTri = p.kl * gia * 1000;
  const vuotTran = tong > 0 && giaTri / tong > tran ? (giaTri - tran * tong) / (1 - tran) / (gia * 1000) : 0;
  const kl1 = Math.min(p.kl, len(Math.max(vuotTran, p.kl / 3), p.kl));
  const con = p.kl - kl1;
  if (con <= 0) return null;
  const tren = [so(ls.tenkan), so(ls.kijun), so(ls.gg_bot)].filter((x) => x > gia * 1.01).sort((a, b) => a - b);
  const muc1 = tren[0] ?? gia * 1.03;
  const muc2 = tren.find((x) => x > muc1 * 1.01) ?? Math.max(muc1 * 1.03, gia * 1.06);
  const kl2 = con >= 2 * LO ? xuong(con / 2) : con;
  const kl3 = con - kl2;
  const thap = so(ls.thap20);
  const catCung = Math.max(Math.min(thap > 0 && thap < gia ? thap * 0.99 : gia * 0.95, gia * 0.97), gia * 0.92);
  const tron = (x) => Math.round(x * 100) / 100;
  const buoc = [
    { kieu: "ngay", kl: kl1, gia, moTa: vuotTran > p.kl / 3 ? `Bán ngay phần vượt ${Math.round(tran * 100)}% danh mục` : "Bán ngay 1/3 vị thế" },
    { kieu: "cho_hoi", kl: kl2, gia: tron(muc1), moTa: `Đặt lệnh chờ bán khi giá hồi lên ${String(tron(muc1)).replace(".", ",")}${tren[0] ? "" : " (+3%)"}` },
    ...(kl3 > 0 ? [{ kieu: "cho_hoi", kl: kl3, gia: tron(muc2), moTa: `Đặt lệnh chờ bán phần cuối khi giá hồi lên ${String(tron(muc2)).replace(".", ",")}` }] : []),
  ];
  const tienNeuHoi = (kl2 * (muc1 - gia) + kl3 * (muc2 - gia)) * 1000;
  const tienNeuThung = -(con * (gia - catCung)) * 1000;
  return {
    buoc,
    catCung: tron(catCung),
    klCon: con,
    banNgay: { kl: kl1, tien: kl1 * gia * 1000, laiChot: p.giaVon > 0 ? (gia - p.giaVon) * kl1 * 1000 : null },
    banHet: { laiChot: p.giaVon > 0 ? (gia - p.giaVon) * p.kl * 1000 : null },
    soVoiBanHet: { neuHoi: tienNeuHoi, neuThung: tienNeuThung },
    giuNguyen: beta != null ? { vni10: -Math.max(0, beta) * 0.1 * giaTri } : null,
  };
}

// TRUNG BINH GIA CO DIEU KIEN (ma dang lo): CHI mua them khi chinh ma do co DIEM MUA cua he thong, khong mua them luc xu huong dang gay.
// Diem mua theo thu tu uu tien: dang MUA (tin hieu he thong) -> diem B mua phuc hoi (giam 20-30% roi lay lai Tenkan + Kijun, <= 3 phien) -> vung mua (kich ban: dong cua
// trong [mua_tu, mua_den] thi he thong ra MUA). Khong co -> "chua_co" (cho). r = dong tin hieu cua thanh vien (+ pb_*, mua_tu, mua_den).
// So luong: nho nhat trong (1/2 vi the dang giu, 1/2 tien mat, muc rui ro: neu lenh mua them cham cat lo thi mat <= 1% tai san rong); lo 100. Dang dung margin -> khong mua.
// Ban: khi gia ve gia von moi (hoa von) - hoac cat lo phan mua them neu cham cat lo cua diem mua.
export function trungBinhGiaCoDieuKien(p, r = {}, { tienMat = 0, no = 0, nav = 0, tong = 0 } = {}) {
  const gia = so(p.gia);
  const gv = so(p.giaVon);
  if (!(gia > 0) || !(gv > gia) || !(p.kl > 0)) return null; // chi cho ma dang lo
  let diem = null;
  if (r.tin === "MUA" && so(r.stop_loss) > 0 && so(r.stop_loss) < gia) diem = { loai: "dang_mua", gia, catLo: so(r.stop_loss), moTa: "Hệ thống đang báo MUA mã này" };
  else if (so(r.pb_cach) != null && so(r.pb_cach) <= 2 && so(r.pb_gia) > 0 && so(r.pb_sl) > 0 && gia > so(r.pb_sl) && gia <= so(r.pb_gia) * 1.05)
    diem = { loai: "diem_b", gia, catLo: so(r.pb_sl), moTa: `Có điểm mua phục hồi (điểm B) ${so(r.pb_cach) === 0 ? "hôm nay" : `${so(r.pb_cach)} phiên trước`} ở giá ${String(so(r.pb_gia)).replace(".", ",")}` };
  else if (so(r.mua_tu) > 0 && so(r.mua_den) >= so(r.mua_tu)) {
    const P = so(r.mua_tu);
    diem = { loai: "vung_mua", gia: P, catLo: P * 0.94, moTa: `Hệ thống sẽ báo MUA nếu giá đóng cửa trong khoảng ${String(so(r.mua_tu)).replace(".", ",")}–${String(so(r.mua_den)).replace(".", ",")}`, choXacNhan: true };
  }
  if (!diem) return { trangThai: "chua_co", hoiCanTruoc: (gv / gia - 1) * 100 };
  const P = diem.gia;
  const S = diem.catLo;
  const navDung = nav > 0 ? nav : tong;
  const theoRuiRo = P > S ? (0.01 * navDung) / ((P - S) * 1000) : Infinity;
  const theoTien = no > 0 ? 0 : (Math.max(0, tienMat) * 0.5) / (P * 1000);
  const kl = xuong(Math.min(p.kl * 0.5, theoTien, theoRuiRo));
  const tron = (x) => Math.round(x * 100) / 100;
  const kq = { trangThai: diem.loai, moTa: diem.moTa, choXacNhan: !!diem.choXacNhan, giaMua: tron(P), catLo: tron(S), kl, hoiCanTruoc: (gv / gia - 1) * 100, thieuTien: no > 0 ? "margin" : theoTien < LO ? "tien_mat" : null };
  if (kl > 0) {
    const gvMoi = giaVonSauMua(p.kl, gv, kl, P);
    Object.assign(kq, {
      gvMoi: tron(gvMoi),
      hoiCanSau: (gvMoi / P - 1) * 100,
      tien: kl * P * 1000,
      loNeuCatLo: kl * (P - S) * 1000, // rieng phan mua them
      loViTheCuNeuCatLo: p.kl * (gia - S) * 1000, // vi the dang giu cung giam toi muc do
      tyTrongSau: tong > 0 ? (p.kl * gia * 1000 + kl * P * 1000) / (tong + kl * P * 1000) : null,
    });
  }
  return kq;
}

// Ma CUNG NGANH dang khoe theo he thong (MUA / NAM GIU, tren Kijun va duong can bang dai han, chua ban bot), diem cao truoc - de hoan doi neu muon giu ty trong nganh.
// Chi dung du lieu tin hieu (thanh vien). theoMa = { MA: dong tin hieu rut gon }.
export function maCungNganhKhoe(ma, theoMa = {}, { soLuong = 3, boQua = [] } = {}) {
  const goc = theoMa[ma];
  if (!goc?.nganh || goc.nganh === "Khác") return [];
  return Object.values(theoMa)
    .filter((r) => r.ma !== ma && !boQua.includes(r.ma) && r.nganh === goc.nganh && (r.tin === "MUA" || r.tin === "NAM GIU") && !r.ban_bot && so(r.gia) > 0 && so(r.gia) >= (so(r.kijun) ?? 0) && so(r.gia) >= (so(r.gg_bot) ?? 0))
    .sort((a, b) => (so(b.diem) ?? 0) - (so(a.diem) ?? 0))
    .slice(0, soLuong)
    .map((r) => ({ ma: r.ma, tin: r.tin, diem: so(r.diem), gia: so(r.gia) }));
}

// Ban R dong co phieu chia deu theo ty trong de tra no -> so tien can (chia nhi phan) de dem margin dat muc tieu.
function canGiamNo(gt, tienMat, no, nguong, mucTieu = DEM_MARGIN_MUC_TIEU) {
  const f = (r) => phanTramGiamDenNguong(gt - r, tienMat, no - r, nguong) ?? 100;
  const tran = Math.min(no, gt);
  if (f(0) >= mucTieu) return 0;
  if (f(tran) < mucTieu) return tran;
  let a = 0;
  let b = tran;
  for (let k = 0; k < 40; k++) {
    const g = (a + b) / 2;
    if (f(g) >= mucTieu) b = g;
    else a = g;
  }
  return b;
}

// hang = pb.hang; nhanTheoMa = { MA: ket qua nhanTrangThai }; cbTheoMa = BCTC; rTheoMa = dong tin hieu he thong (thanh vien: tin, tp1).
// lsTheoMa = { MA: { tenkan, kijun, gg_bot, thap20 } } (nen tu API), betaTheoMa / soPhienTheoMa (rui ro 1 nam: beta, so phien de ban het) - dung cho THOAT TUNG PHAN.
// Tra { hanhDong: [{ id, ma, loai, kl, gia, giaTri, tieuDe, lyDo, ghiChu, chon, tungPhan?, cachThoat? }], ghiChu: [chuoi] }.
// loai: ban_het | ban_bot | chot_bot | mua_them | tra_no. chon = mac dinh co tinh vao "Sau khi lam theo" hay khong.
// ban_het cua vi the LON (vuot ty trong toi da, hoac cat het lo > 3% tai san rong, hoac can > 1 phien de ban het) co them tungPhan (thoatTungPhan);
// cachThoat mac dinh "tung_phan" (luot song: "ban_het" - ky luat cat nhanh), nguoi dung doi duoc. "tung_phan" -> chi B1 duoc ban ngay trong "sau ke hoach".
export function goiYXuLy({ hang = [], nhanTheoMa = {}, phongCach, taiSan = {}, margin = null, nguong = {}, cbTheoMa = {}, rTheoMa = {}, lsTheoMa = {}, betaTheoMa = {}, soPhienTheoMa = {}, coTinHieu = false } = {}) {
  const pc = layPhongCach(phongCach);
  const vt = gopViThe(hang);
  const tong = [...vt.values()].reduce((s, p) => s + (p.gia > 0 ? p.kl * p.gia * 1000 : 0), 0);
  const hd = [];
  const ghiChu = [];
  const ungVienMua = [];
  let tienBan = 0;
  for (const p of vt.values()) {
    const n = nhanTheoMa[p.ma];
    if (!n || !(p.gia > 0)) continue;
    const giaTri = p.kl * p.gia * 1000;
    const tt = tong > 0 ? giaTri / tong : 0;
    const lai = p.giaVon > 0 ? (p.gia / p.giaVon - 1) * 100 : null;
    const ten = (k) => `${p.ma}: ${k}`;
    if (n.nhan === "thoat") {
      const tp = thoatTungPhan(p, { ...rTheoMa[p.ma], ...lsTheoMa[p.ma] }, { tong, tran: pc.tyTrongToiDa, beta: betaTheoMa[p.ma] ?? null });
      const navDung = so(taiSan.nav) > 0 ? so(taiSan.nav) : tong;
      const lon = !!tp && (tt > pc.tyTrongToiDa || (tp.banHet.laiChot != null && -tp.banHet.laiChot > 0.03 * navDung) || so(soPhienTheoMa[p.ma]) > 1);
      const cachThoat = lon ? "tung_phan" : "ban_het";
      hd.push({
        id: `${p.ma}:ban_het`, ma: p.ma, loai: "ban_het", kl: p.kl, gia: p.gia,
        tieuDe: ten(lai != null && lai < 0 ? "Cắt lỗ toàn bộ" : lai != null && lai > 0 ? "Bán hết, chốt lời" : "Bán hết"), lyDo: n.lyDo.join("; "), chon: true,
        tungPhan: lon ? tp : null, cachThoat,
      });
      tienBan += cachThoat === "tung_phan" ? tp.banNgay.tien : giaTri;
      continue;
    }
    if (n.nhan === "giam") {
      const vuotTran = tt > pc.tyTrongToiDa ? len((giaTri - pc.tyTrongToiDa * tong) / (1 - pc.tyTrongToiDa) / (p.gia * 1000), p.kl) : 0;
      const chiVuotTran = n.lyDo.every((l) => /danh mục|rủi ro của cả/.test(l));
      const nuaVt = len(p.kl / 2, p.kl);
      const kl = chiVuotTran ? Math.max(vuotTran, 0) || nuaVt : Math.max(vuotTran, nuaVt);
      hd.push({ id: `${p.ma}:ban_bot`, ma: p.ma, loai: "ban_bot", kl, gia: p.gia, tieuDe: ten(chiVuotTran ? `Bán bớt về ~${p0(pc.tyTrongToiDa * 100)}% danh mục` : "Giảm một nửa vị thế"), lyDo: n.lyDo.join("; "), chon: true });
      tienBan += kl * p.gia * 1000;
      continue;
    }
    // theo doi: gan TP1 (thanh vien) -> dat san lenh chot 30% o TP1; vuot tran nhe -> tuy chon ban ve tran
    const r = rTheoMa[p.ma];
    const tp1 = so(r?.tp1);
    if (coTinHieu && n.nhan === "theo_doi" && tp1 > p.gia && (tp1 / p.gia - 1) * 100 <= 3) {
      hd.push({ id: `${p.ma}:chot_bot`, ma: p.ma, loai: "chot_bot", kl: len(p.kl * 0.3, p.kl), gia: tp1, tieuDe: ten(`Đặt sẵn lệnh chốt 30% ở TP1 ${tp1}`), lyDo: n.lyDo.join("; "), ghiChu: "Lệnh chờ — chỉ khớp nếu giá chạm TP1.", chon: false });
    }
    if (n.nhan === "theo_doi" && tt > pc.tyTrongToiDa) {
      const kl = len((giaTri - pc.tyTrongToiDa * tong) / (1 - pc.tyTrongToiDa) / (p.gia * 1000), p.kl);
      if (kl > 0) hd.push({ id: `${p.ma}:ban_bot`, ma: p.ma, loai: "ban_bot", kl, gia: p.gia, tieuDe: ten(`Bán bớt về ~${p0(pc.tyTrongToiDa * 100)}% danh mục (tùy chọn)`), lyDo: n.lyDo.join("; "), chon: false });
    }
    if (n.nhan === "giu") ungVienMua.push({ p, tt, lai, r });
  }

  // MUA THEM / TRUNG BINH GIA - chi ma dang "Giu" va dung dieu kien cua phong cach; KHONG mua them khi dang dung margin.
  const no = so(taiSan.no) ?? 0;
  const tienMat = so(taiSan.tienMat) ?? 0;
  const k = phongCach;
  const muaDuoc = ungVienMua
    .map((u) => {
      const cb = cbTheoMa[u.p.ma];
      const lai = u.lai;
      if (u.tt >= pc.tyTrongToiDa * 0.9) return null;
      if (k === "trung_han" || !k) {
        if (lai != null && lai < -5) return null;
        return { ...u, tieuDe: lai != null && lai < 0 ? "Trung bình giá (xu hướng còn giữ)" : "Mua thêm theo xu hướng", lyDo: `Giá trên Kijun và đường cân bằng dài hạn${lai != null ? `, đang ${lai >= 0 ? "lãi" : "lỗ"} ${p1(Math.abs(lai))}%` : ""}` };
      }
      if (!cb) return null;
      // dai_han
      const taiChinh = cb.loai && cb.loai !== "pi";
      const khoe = (taiChinh ? so(cb.sinhLoi) >= 4 : so(cb.f) >= 6) && cb.vungZ2 !== "nguy cơ" && so(cb.lnTTM) > 0;
      if (!khoe) return null;
      return { ...u, tieuDe: lai != null && lai <= -10 ? "Trung bình giá (doanh nghiệp vẫn khỏe)" : "Tích lũy thêm", lyDo: `${taiChinh ? `Sinh lời ${cb.sinhLoi}/5` : `Điểm F ${cb.f}/9`}${cb.vungZ2 === "an toàn" ? ", Z an toàn" : ""}, lợi nhuận 4 quý dương`, chia: true };
    })
    .filter(Boolean);
  if (muaDuoc.length) {
    if (no > 0) ghiChu.push("Đang dùng margin — ưu tiên giảm nợ trước khi mua thêm, nên kế hoạch không đề xuất mua.");
    else {
      const tienCo = tienMat + tienBan;
      const nganSach = (tienCo * 0.5) / muaDuoc.length; // giu lai mot nua tien mat
      for (const u of muaDuoc) {
        const tran = Math.max(0, (pc.tyTrongToiDa * tong - u.p.kl * u.p.gia * 1000) / (1 - pc.tyTrongToiDa));
        const tien = Math.min(nganSach, tran) * (u.chia ? 0.5 : 1);
        const kl = xuong(tien / (u.p.gia * 1000));
        if (kl >= LO) {
          const gvMoi = giaVonSauMua(u.p.kl, u.p.giaVon, kl, u.p.gia);
          hd.push({
            id: `${u.p.ma}:mua_them`, ma: u.p.ma, loai: "mua_them", kl, gia: u.p.gia, tieuDe: `${u.p.ma}: ${u.tieuDe}`, lyDo: u.lyDo,
            ghiChu: [u.chia ? "Chia 2–3 lần, lần sau cách vài tuần hoặc sau BCTC quý tới" : null, gvMoi != null && u.p.giaVon > 0 ? `giá vốn ${p1(u.p.giaVon)} → ${p1(gvMoi)}` : null].filter(Boolean).join(" · "),
            chon: false,
          });
        } else if (tienCo <= 0) {
          ghiChu.push(`${u.p.ma} đủ điều kiện mua thêm nhưng chưa có tiền mặt (nhập ở “Vốn & margin”). Dùng máy tính bên dưới để thử.`);
        }
      }
    }
  }
  const danhSachBinhQuanXuong = ungVienMua.length === 0 && [...vt.values()].some((p) => p.giaVon > 0 && p.gia < p.giaVon * 0.9 && nhanTheoMa[p.ma]?.muc >= 2);
  if (danhSachBinhQuanXuong && k !== "dai_han") ghiChu.push("Không bình quân giá xuống các mã đang lỗ mà xu hướng đã gãy — đây là cách mất nhiều tiền nhất.");

  // GIAM NO MARGIN: sau khi ban theo ke hoach (tien ban tra no truoc) ma dem van < 20% -> de xuat giam them
  if (margin && no > 0) {
    const gt1 = tong - tienBan;
    const no1 = Math.max(0, no - tienBan);
    const tm1 = tienMat + Math.max(0, tienBan - no);
    const dem = no1 > 0 ? phanTramGiamDenNguong(gt1, tm1, no1, nguong.canhBao ?? 35) : null;
    if (dem != null && dem < 20) {
      const R = canGiamNo(gt1, tm1, no1, nguong.canhBao ?? 35);
      if (R > 0)
        hd.push({ id: "tra_no", ma: null, loai: "tra_no", giaTri: R, tieuDe: "Giảm nợ margin", lyDo: `${tienBan > 0 ? "Sau khi bán theo các bước khác, giá" : "Giá"} cổ phiếu chỉ cần giảm ${p0(dem)}% là chạm ngưỡng cảnh báo ${nguong.canhBao ?? 35}%`, ghiChu: `Bán bớt đều các mã hoặc nộp thêm khoảng ${p1(R / 1e6)} triệu để đệm lên ~${DEM_MARGIN_MUC_TIEU}%.`, chon: true });
    }
  }
  const thuTu = { ban_het: 0, tra_no: 1, ban_bot: 2, chot_bot: 3, mua_them: 4 };
  hd.sort((a, b) => thuTu[a.loai] - thuTu[b.loai]);
  for (const a of hd) if (a.loai !== "tra_no") a.giaTri = a.kl * a.gia * 1000;
  return { hanhDong: hd, ghiChu };
}

// AP DUNG ke hoach (cac hanh dong duoc chon, kl co the da sua) -> vi the moi + tien mat / no moi. Tien ban tra no margin truoc.
export function apDungKeHoach(hang = [], { tienMat = 0, no = 0 } = {}, hanhDong = []) {
  const vt = gopViThe(hang);
  tienMat = so(tienMat) ?? 0;
  no = so(no) ?? 0;
  let tienBan = 0;
  let tienMua = 0;
  let laiChot = 0;
  let coLai = false;
  const ban = (p, kl, gia) => {
    kl = Math.min(kl, p.kl);
    if (!(kl > 0) || !(gia > 0)) return 0;
    p.kl -= kl;
    const tien = kl * gia * 1000;
    if (p.giaVon > 0) {
      laiChot += (gia - p.giaVon) * kl * 1000;
      coLai = true;
    }
    return tien;
  };
  for (const a of hanhDong) {
    if (!["ban_het", "ban_bot", "chot_bot"].includes(a.loai)) continue;
    const p = vt.get(a.ma);
    // thoat tung phan: chi buoc 1 ban ngay; buoc 2-3 la lenh cho (hoi / cat cung) - phan con lai van nam trong danh muc
    const kl = a.loai === "ban_het" && a.cachThoat === "tung_phan" && a.tungPhan ? a.tungPhan.buoc[0].kl : so(a.kl) ?? 0;
    if (p) tienBan += ban(p, kl, so(a.gia) ?? p.gia);
  }
  const traNo = (tien) => {
    const t = Math.min(no, tien);
    no -= t;
    tienMat += tien - t;
  };
  traNo(tienBan);
  const giam = hanhDong.find((a) => a.loai === "tra_no");
  if (giam && no > 0) {
    const gt = [...vt.values()].reduce((s, p) => s + (p.gia > 0 ? p.kl * p.gia * 1000 : 0), 0);
    const R = Math.min(so(giam.giaTri) ?? 0, gt);
    let thu = 0;
    if (gt > 0 && R > 0) for (const p of vt.values()) if (p.gia > 0) thu += ban(p, Math.round(((p.kl * p.gia * 1000) / gt) * R / (p.gia * 1000)), p.gia);
    tienBan += thu;
    traNo(thu);
  }
  let thieuTien = false;
  for (const a of hanhDong) {
    if (a.loai !== "mua_them") continue;
    const p = vt.get(a.ma);
    const kl = so(a.kl) ?? 0;
    const gia = so(a.gia) ?? p?.gia;
    if (!p || !(kl > 0) || !(gia > 0)) continue;
    const tien = kl * gia * 1000;
    if (tien > tienMat + 1) thieuTien = true;
    p.giaVon = giaVonSauMua(p.kl, p.giaVon, kl, gia);
    p.kl += kl;
    tienMat -= tien;
    tienMua += tien;
  }
  return {
    vitri: [...vt.values()].filter((p) => p.kl > 0).map((p) => ({ ma: p.ma, kl: p.kl, giaVon: p.giaVon })),
    tienMat,
    no,
    tienBan,
    tienMua,
    laiChot: coLai ? laiChot : null,
    thieuTien,
  };
}
