// DANH MUC GOI Y THEO NGUOI DUNG (Hieu 2026-10-22): nguoi dung nhap SO MA muon nam + cac ma DANG CAM (gia von) -> goi y GIU / BAN / CAT LO cho tung ma dang cam, dien cho trong bang ma MUA moi
// (hoac diem B), han che so ma cung nganh, chia ty trong theo muc rui ro (khoang cach toi cat lo). Ham THUAN (khong import "@/") de test tay: engine/test/danhMucGoiY.test.mjs.
// Quy tac DON GIAN, bam sat tin hieu da co tren web - khong phai khuyen nghi dau tu ca nhan hoa.
export const NGANH_TOI_DA = 2; // so ma cung nganh toi da trong danh muc
export const GTGD_TOI_THIEU_TY = 5; // GTGD TB20 (ty dong) toi thieu cua ma duoc goi y them
export const RUI_RO_NHO_NHAT = 0.03; // khoang cach cat lo toi thieu khi chia ty trong
export const RUI_RO_LON_NHAT = 0.1;
export const HE_SO_DIEM_B = 0.5; // diem B: giai ngan 1/2 phan du dinh, 1/2 con lai khi he thong bao MUA

const coSo = (v) => typeof v === "number" && Number.isFinite(v);
const so = (v) => (v == null || v === "" ? NaN : Number(v));
const duong = (v) => {
  const x = so(v);
  return Number.isFinite(x) && x > 0 ? x : null;
};

// Danh gia 1 ma NGUOI DUNG DANG CAM so voi tin hieu hien tai cua he thong. row = dong tin_hieu (da chuan hoa), giaVon = gia von nguoi dung (nghin dong).
// Tra ve { loai: "giu" | "theo_doi" | "giam" | "ban" | "cat_lo" | "khong_du_lieu", ... } - giu / theo_doi tinh la CON o lai trong danh muc.
export function danhGiaMaDangCam(row, giaVon) {
  const von = duong(giaVon);
  if (!row) return { loai: "khong_du_lieu", lyDo: "Mã không có trong danh sách theo dõi của hệ thống — chưa đánh giá được." };
  const gia = duong(row.gia);
  const sl = duong(row.stop_loss);
  const laiVonPct = gia && von ? (gia / von - 1) * 100 : null;
  const co = { gia, sl, laiVonPct, tin: row.tin, diem: coSo(row.diem) ? row.diem : null };
  const dangGiuHeThong = row.tin === "MUA" || row.tin === "NAM GIU";
  if (row.tin === "BAN") return { loai: "ban", lyDo: "Hệ thống đã báo BÁN.", ...co };
  if (dangGiuHeThong && sl && gia && gia <= sl) return { loai: "cat_lo", lyDo: `Giá đã chạm mức cắt lỗ của hệ thống (${sl}).`, ...co };
  if (dangGiuHeThong) {
    const tp = row.tp_da_cham ? ` Đã chạm ${row.tp_da_cham}: nên chốt phần đã tới mốc, phần còn lại giữ với cắt lỗ dời lên.` : "";
    return { loai: "giu", lyDo: `Hệ thống đang ${row.tin === "MUA" ? "báo MUA" : "NẮM GIỮ"}.${tp}`, ...co };
  }
  const kijun = duong(row.kijun);
  if (gia && kijun && gia < kijun) return { loai: "giam", lyDo: "Hệ thống trung lập và giá nằm dưới Kijun — nên cân nhắc giảm, chưa nên mua thêm.", ...co };
  return { loai: "theo_doi", lyDo: "Hệ thống trung lập, giá còn trên Kijun — giữ nhưng không mua thêm.", ...co };
}

// ung vien MUA MOI tu tin hieu he thong: tin MUA, hoac NAM GIU nhung gia con trong vung mua (khong duoi gia). row.vung_mua = "trong" | "tren" | "duoi" | null (web tinh san tu tinhVungLenh).
function ungVienHeThong(tatCa, daCo) {
  const kq = [];
  for (const r of tatCa) {
    if (daCo.has(r.ma)) continue;
    const gia = duong(r.gia), sl = duong(r.stop_loss);
    if (!gia || !sl || sl >= gia) continue;
    if (!(r.tin === "MUA" || (r.tin === "NAM GIU" && r.vung_mua === "trong"))) continue;
    if (r.vung_mua === "tren") continue;
    if (coSo(r.gtgd_tb20) && r.gtgd_tb20 < GTGD_TOI_THIEU_TY) continue;
    kq.push({ ma: r.ma, nganh: r.nganh ?? null, loai: "MUA", diem: coSo(r.diem) ? r.diem : 0, gia, sl, tp1: duong(r.tp1), tp2: duong(r.tp2), giaVao: gia, ghiChu: r.tin === "MUA" ? "Tín hiệu MUA mới" : "Đang nắm giữ, giá còn trong vùng mua" });
  }
  return kq.sort((a, b) => b.diem - a.diem);
}

// ung vien tu DIEM B (mua phuc hoi): da loc san o lib/muaPhucHoi.js (khong gom ma he thong dang MUA / NAM GIU). nganhTheoMa: Map ma -> nganh.
function ungVienDiemB(muaPhucHoi, daCo, nganhTheoMa) {
  const kq = [];
  for (const x of muaPhucHoi) {
    if (daCo.has(x.ma) || !duong(x.gia) || !duong(x.sl) || x.sl >= x.gia) continue;
    kq.push({
      ma: x.ma, nganh: nganhTheoMa.get(x.ma) ?? null, loai: "B", diem: (x.klDay != null && x.klDay >= 2 ? 100 : 0) - x.cach, gia: x.gia, sl: x.sl, tp1: duong(x.tp1), tp2: duong(x.tp2), giaVao: x.giaB,
      ghiChu: `Điểm B ${x.cach === 0 ? "hôm nay" : `${x.cach} phiên trước`}: đặt lệnh chờ ở giá B ${x.giaB}, giải ngân 1/2 phần dự định`,
    });
  }
  return kq.sort((a, b) => b.diem - a.diem);
}

// Chia ty trong ti le nghich voi khoang cach cat lo, tran 2/N moi ma. `mucTieu` = tong ty trong cho co phieu (phan con lai la tien mat). mang: [{ rui, he }] -> mang ty trong (tong = mucTieu neu du tran).
export function chiaTyTrong(mang, n, mucTieu) {
  if (!mang.length) return [];
  const tran = Math.min(1, 2 / n);
  const goc = mang.map((m) => (1 / Math.min(RUI_RO_LON_NHAT, Math.max(RUI_RO_NHO_NHAT, m.rui))) * m.he);
  let w = new Array(mang.length).fill(0);
  let khoa = new Array(mang.length).fill(false);
  let conLai = mucTieu;
  for (let vong = 0; vong < 6; vong++) {
    const tong = goc.reduce((s, g, i) => (khoa[i] ? s : s + g), 0);
    if (!(tong > 0)) break;
    let vuot = false;
    for (let i = 0; i < mang.length; i++) {
      if (khoa[i]) continue;
      w[i] = (goc[i] / tong) * conLai;
      if (w[i] > tran * mang[i].he) {
        w[i] = tran * mang[i].he;
        khoa[i] = true;
        vuot = true;
      }
    }
    if (!vuot) break;
    conLai = mucTieu - w.reduce((s, x, i) => (khoa[i] ? s + x : s), 0);
  }
  return w;
}

// soMa: so ma muon nam; dangCam: [{ ma, giaVon }]; tatCa: dong tin_hieu; muaPhucHoi: ket qua dungMuaPhucHoi; vonTrieu: tong von (trieu dong, tuy chon).
export function goiYDanhMuc({ soMa, dangCam = [], tatCa = [], muaPhucHoi = [], vonTrieu = null }) {
  const n = Math.max(1, Math.min(30, Math.round(Number(soMa)) || 1));
  const tin = new Map(tatCa.map((r) => [r.ma, r]));
  const nganhTheoMa = new Map(tatCa.map((r) => [r.ma, r.nganh ?? null]));

  // 1) ma DANG CAM (bo ma trung)
  const thay = new Set();
  const dsCam = [];
  for (const c of dangCam) {
    const ma = String(c?.ma ?? "").trim().toUpperCase();
    if (!ma || thay.has(ma)) continue;
    thay.add(ma);
    const row = tin.get(ma) ?? null;
    dsCam.push({ ma, giaVon: duong(c.giaVon), nganh: row?.nganh ?? null, row, ...danhGiaMaDangCam(row, c.giaVon) });
  }
  const giuDuoc = dsCam.filter((x) => x.loai === "giu" || x.loai === "theo_doi");
  // vuot so ma muon nam: giu ma tot nhat (giu > theo_doi, diem cao), phan du chuyen sang "du"
  giuDuoc.sort((a, b) => (a.loai === b.loai ? (b.diem ?? 0) - (a.diem ?? 0) : a.loai === "giu" ? -1 : 1));
  for (const x of giuDuoc.slice(n)) {
    x.loai = "du";
    x.lyDo = `Vượt số mã muốn nắm (${n}) — mã này xếp thấp hơn các mã còn lại, nên cân nhắc giảm.`;
  }
  const conLai = giuDuoc.slice(0, n);

  // 2) dien cho trong, han che ngay
  const demNganh = new Map();
  const tangNganh = (nganh) => nganh && demNganh.set(nganh, (demNganh.get(nganh) ?? 0) + 1);
  const duocThemNganh = (nganh) => !nganh || (demNganh.get(nganh) ?? 0) < NGANH_TOI_DA;
  for (const x of conLai) tangNganh(x.nganh);
  const daCo = new Set(dsCam.map((x) => x.ma));
  const cho = n - conLai.length;
  const them = [];
  const ungVien = [...ungVienHeThong(tatCa, daCo), ...ungVienDiemB(muaPhucHoi, daCo, nganhTheoMa)];
  const boQuaNganh = [];
  for (const u of ungVien) {
    if (them.length >= cho) break;
    if (them.some((t) => t.ma === u.ma)) continue;
    if (!duocThemNganh(u.nganh)) {
      boQuaNganh.push(u.ma);
      continue;
    }
    them.push(u);
    tangNganh(u.nganh);
  }

  // 3) ty trong muc tieu cho (ma con lai + ma them); o chua lap day = tien mat
  const mucTieu = (conLai.length + them.reduce((s, t) => s + (t.loai === "B" ? HE_SO_DIEM_B : 1), 0)) / n;
  const muc = [
    ...conLai.map((x) => ({ ma: x.ma, nguon: "dang_cam", gia: x.gia, rui: x.gia && x.sl ? (x.gia - x.sl) / x.gia : RUI_RO_LON_NHAT, he: 1 })),
    ...them.map((t) => ({ ma: t.ma, nguon: "them", gia: t.gia, rui: (t.gia - t.sl) / t.gia, he: t.loai === "B" ? HE_SO_DIEM_B : 1 })),
  ];
  const w = chiaTyTrong(muc, n, mucTieu);
  const tyTrong = new Map(muc.map((m, i) => [m.ma, w[i]]));
  const vonVnd = duong(vonTrieu) ? Number(vonTrieu) * 1e6 : null;
  const chiTiet = (ma, gia) => {
    const t = tyTrong.get(ma) ?? 0;
    if (!vonVnd || !gia) return { tyTrong: t, soTien: null, soCp: null };
    const soTien = t * vonVnd;
    return { tyTrong: t, soTien, soCp: Math.floor(soTien / (gia * 1000) / 100) * 100 };
  };
  for (const x of conLai) Object.assign(x, chiTiet(x.ma, x.gia));
  for (const t of them) Object.assign(t, chiTiet(t.ma, t.giaVao));
  const tongCoPhieu = [...tyTrong.values()].reduce((s, v) => s + v, 0);
  return {
    soMa: n,
    dangCam: dsCam,
    conLai,
    them,
    tienMat: Math.max(0, 1 - tongCoPhieu),
    tongCoPhieu,
    thieuMa: Math.max(0, cho - them.length),
    boQuaNganh,
  };
}
