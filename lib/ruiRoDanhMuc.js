// PHAN TICH RUI RO DANH MUC tu lich su gia (trang /danh-gia-danh-muc) - ham THUAN, test tay: engine/test/ruiRoDanhMuc.test.mjs.
// Dau vao: chuoi gia dong cua da canh theo lich phien VN-Index (cung do dai, null truoc ngay co gia), gia tri tung vi the (dong), GTGD binh quan 20 phien (dong/phien).
// Tinh: bien dong nam, beta, tuong quan, dong gop rui ro (risk contribution), he so da dang hoa (DR) va "so cuoc doc lap" ~ DR^2 (Choueifaty), sut giam toi da,
// VaR / CVaR 95% 1 phien (lich su), kich ban soc (theo beta + dot giam manh nhat cua VN-Index trong cua so), thanh khoan (so phien de ban het), ty trong can bang bien dong.
// Tat ca dua tren 1 nam du lieu QUA KHU voi TY TRONG HIEN TAI giu nguyen - khong phai du bao. Nguong cham diem la cach cham tu dat cua web.

export const PHIEN_NAM = 250;
const SO_PHIEN_TOI_THIEU = 120; // ma co it hon chua dua vao tinh rui ro (moi niem yet / thieu du lieu)
const TY_LE_BAN_MOI_PHIEN = 0.2; // gia dinh ban toi da 20% GTGD binh quan moi phien de khong dap gia
const p1 = (x) => x.toFixed(1).replace(".", ",");
const p0 = (x) => x.toFixed(0);

// Canh 1 mang nen [{t, c}] theo mang ngay (tang dan): lay gia dong cua ngay do, ngay khong giao dich thi giu gia truoc (ffill); truoc nen dau tien = null.
export function canhTheoNgay(ngay, nen) {
  const m = new Map((nen || []).map((b) => [b.t, b.c]));
  let truoc = null;
  return ngay.map((t) => {
    const c = m.get(t);
    if (c > 0) truoc = c;
    return truoc;
  });
}

const tb = (a) => a.reduce((s, x) => s + x, 0) / a.length;
function cov(a, b, ma, mb) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb);
  return s / (a.length - 1);
}
function sutGiamToiDa(chiSo) {
  let dinh = -Infinity;
  let dd = 0;
  let iDinh = 0;
  let tu = 0;
  let den = 0;
  chiSo.forEach((v, i) => {
    if (v > dinh) {
      dinh = v;
      iDinh = i;
    }
    const x = v / dinh - 1;
    if (x < dd) {
      dd = x;
      tu = iDinh;
      den = i;
    }
  });
  return { pct: dd * 100, tu, den };
}

// { ngay, vni, gia: {MA: [close|null]}, giaTri: {MA: dong}, gtgd: {MA: dong/phien}, tienMat, no, nguongCB, nguongGC }
export function phanTichRuiRo({ ngay = [], vni = [], gia = {}, giaTri = {}, gtgd = {}, tienMat = 0, no = 0, nguongCB = 35, nguongGC = 30 } = {}) {
  const n = ngay.length;
  const tongGT = Object.values(giaTri).reduce((s, v) => s + (v > 0 ? v : 0), 0);
  if (n < SO_PHIEN_TOI_THIEU + 1 || !(tongGT > 0)) return null;
  const dauTien = (a) => a.findIndex((x) => x > 0);
  const lichSuNgan = [];
  const dsMa = [];
  for (const [ma, gt] of Object.entries(giaTri)) {
    if (!(gt > 0)) continue;
    const a = gia[ma];
    const i0 = Array.isArray(a) && a.length === n ? dauTien(a) : -1;
    if (i0 < 0 || n - 1 - i0 < SO_PHIEN_TOI_THIEU) lichSuNgan.push(ma);
    else dsMa.push(ma);
  }
  if (!dsMa.length) return { lichSuNgan, dsMa: [] };
  const batDau = Math.max(dauTien(vni), ...dsMa.map((ma) => dauTien(gia[ma])));
  const L = n - 1 - batDau; // so loi suat
  const ls = (a) => {
    const r = [];
    for (let t = batDau + 1; t < n; t++) r.push(a[t] / a[t - 1] - 1);
    return r;
  };
  const R = dsMa.map((ma) => ls(gia[ma]));
  const rv = ls(vni);
  const gtCo = dsMa.reduce((s, ma) => s + giaTri[ma], 0);
  const w = dsMa.map((ma) => giaTri[ma] / gtCo);
  const mu = R.map(tb);
  const muV = tb(rv);
  const k = dsMa.length;
  const S = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => (j < i ? 0 : cov(R[i], R[j], mu[i], mu[j]))));
  for (let i = 0; i < k; i++) for (let j = 0; j < i; j++) S[i][j] = S[j][i];
  const varV = cov(rv, rv, muV, muV);
  const sd = S.map((row, i) => Math.sqrt(row[i]));
  const Sw = S.map((row) => row.reduce((s, x, j) => s + x * w[j], 0));
  const varP = w.reduce((s, wi, i) => s + wi * Sw[i], 0);
  const sdP = Math.sqrt(varP);
  const beta = R.map((r, i) => cov(r, rv, mu[i], muV) / varV);
  const betaP = w.reduce((s, wi, i) => s + wi * beta[i], 0);
  const rc = w.map((wi, i) => (varP > 0 ? (wi * Sw[i]) / varP : 0));
  const dr = sdP > 0 ? w.reduce((s, wi, i) => s + wi * sd[i], 0) / sdP : 1;
  const tq = S.map((row, i) => row.map((x, j) => (sd[i] > 0 && sd[j] > 0 ? x / (sd[i] * sd[j]) : 0)));
  let tongTQ = 0;
  let soCap = 0;
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) {
      tongTQ += tq[i][j];
      soCap++;
    }

  // chuoi danh muc (ty trong co dinh) va VN-Index, chuan 100
  const rp = rv.map((_, t) => R.reduce((s, r, i) => s + w[i] * r[t], 0));
  const chiSoP = [100];
  const chiSoV = [100];
  for (let t = 0; t < L; t++) {
    chiSoP.push(chiSoP[t] * (1 + rp[t]));
    chiSoV.push(chiSoV[t] * (1 + rv[t]));
  }
  const ngayCs = ngay.slice(batDau);
  const ddP = sutGiamToiDa(chiSoP);
  const ddV = sutGiamToiDa(chiSoV);
  const sx = [...rp].sort((a, b) => a - b);
  const iq = Math.max(0, Math.floor(0.05 * L) - 1);
  const var95 = -sx[iq];
  const cvar95 = -tb(sx.slice(0, iq + 1));
  // dot giam manh nhat cua VN-Index trong 20 phien -> danh muc trong cung dot
  let xau = null;
  for (let t = 20; t <= L; t++) {
    const v = chiSoV[t] / chiSoV[t - 20] - 1;
    if (!xau || v < xau.vni) xau = { vni: v, port: chiSoP[t] / chiSoP[t - 20] - 1, tu: ngayCs[t - 20], den: ngayCs[t] };
  }
  const iNgayXauV = rv.indexOf(Math.min(...rv));
  const lai = (cs, m) => (cs.length > m ? (cs[cs.length - 1] / cs[cs.length - 1 - m] - 1) * 100 : null);

  // von & margin: soc theo beta va theo dot giam that
  const nav = tongGT + tienMat - no;
  const kichBan = (ten, portPct, vniPct, ghiChu) => {
    const doiGT = (tongGT * portPct) / 100;
    const ts = tienMat + tongGT + doiGT;
    const tyLe = no > 0 && ts > 0 ? ((ts - no) / ts) * 100 : null;
    return { ten, vniPct, portPct, doiGiaTri: doiGT, navPct: nav > 0 ? (doiGT / nav) * 100 : null, tyLeKyQuy: tyLe, chamCB: tyLe != null && tyLe <= nguongCB, chamGC: tyLe != null && tyLe <= nguongGC, ghiChu };
  };
  const soc = [-5, -10, -20].map((s) => kichBan(`VN-Index ${s}%`, betaP * s, s, `ước theo beta ${betaP.toFixed(2).replace(".", ",")}`));
  if (xau) soc.push(kichBan(`Lặp lại đợt giảm mạnh nhất 1 năm qua`, xau.port * 100, xau.vni * 100, `${xau.tu.slice(8, 10)}/${xau.tu.slice(5, 7)} – ${xau.den.slice(8, 10)}/${xau.den.slice(5, 7)}/${xau.den.slice(0, 4)}, giá thật của các mã`));

  // thanh khoan
  const thanhKhoan = Object.entries(giaTri)
    .filter(([, gt]) => gt > 0)
    .map(([ma, gt]) => ({ ma, soPhien: gtgd[ma] > 0 ? gt / (TY_LE_BAN_MOI_PHIEN * gtgd[ma]) : null }));
  const gt1Phien = thanhKhoan.filter((x) => x.soPhien != null && x.soPhien <= 1).reduce((s, x) => s + giaTri[x.ma], 0);
  const coTK = thanhKhoan.filter((x) => x.soPhien != null);

  // ty trong can bang bien dong (nghich dao do lech chuan) - tham khao
  const iv = sd.map((x) => (x > 0 ? 1 / x : 0));
  const tongIv = iv.reduce((s, x) => s + x, 0);
  const wIv = iv.map((x) => x / tongIv);
  const varIv = wIv.reduce((s, wi, i) => s + wi * S[i].reduce((a, x, j) => a + x * wIv[j], 0), 0);
  const drIv = wIv.reduce((s, wi, i) => s + wi * sd[i], 0) / Math.sqrt(varIv);

  const nam = Math.sqrt(PHIEN_NAM);
  return {
    dsMa, lichSuNgan, soPhien: L, tuNgay: ngayCs[0], denNgay: ngayCs[L], phuGiaTri: gtCo / tongGT,
    ma: dsMa.map((ma, i) => ({ ma, w: w[i], vol: sd[i] * nam * 100, beta: beta[i], tqVni: sd[i] > 0 ? cov(R[i], rv, mu[i], muV) / (sd[i] * Math.sqrt(varV)) : 0, rc: rc[i], lai1Nam: (gia[ma][n - 1] / gia[ma][batDau] - 1) * 100, wCanBang: wIv[i] })),
    tuongQuan: tq, tqTrungBinh: soCap ? tongTQ / soCap : null,
    volP: sdP * nam * 100, volV: Math.sqrt(varV) * nam * 100, betaP, dr, soCuocDocLap: dr * dr,
    laiP: chiSoP[L] - 100, laiV: chiSoV[L] - 100, lai3ThangP: lai(chiSoP, 60), lai3ThangV: lai(chiSoV, 60),
    ddP: { pct: ddP.pct, tu: ngayCs[ddP.tu], den: ngayCs[ddP.den] }, ddV: ddV.pct,
    var95: var95 * 100, cvar95: cvar95 * 100, var95Dong: var95 * tongGT, phienXauNhat: { pct: sx[0] * 100, ngay: ngayCs[rp.indexOf(sx[0]) + 1] },
    ngayXauNhatVni: { ngay: ngayCs[iNgayXauV + 1], vni: rv[iNgayXauV] * 100, port: rp[iNgayXauV] * 100 },
    chuoi: { ngay: ngayCs, danhMuc: chiSoP, vni: chiSoV }, kichBan: soc,
    thanhKhoan: { ds: thanhKhoan.sort((a, b) => (b.soPhien ?? 0) - (a.soPhien ?? 0)), tyLeBan1Phien: coTK.length ? gt1Phien / tongGT : null, lauNhat: coTK.length ? Math.max(...coTK.map((x) => x.soPhien)) : null },
    canBangBienDong: { volP: Math.sqrt(varIv) * nam * 100, soCuocDocLap: drIv * drIv },
  };
}

// DIEM SUC KHOE 0-100 = 4 tru x 25: Da dang hoa (so cuoc doc lap, tap trung rui ro / nganh), Rui ro (bien dong so voi VN-Index, dem margin), Xu huong (ty trong gia tri o ma khoe), Thanh khoan.
// pb = ket qua danhGiaDanhMuc (lib/danhGiaDanhMuc.js), rr = phanTichRuiRo (co the null khi chua tai xong / thieu du lieu -> dung cach cham don gian cua pb).
export function chamDiemSucKhoe(pb, rr) {
  if (!pb || pb.soMaCoGia === 0) return null;
  const kep = (x, a = 0, b = 25) => Math.max(a, Math.min(b, x));
  let daDang;
  if (rr?.dsMa?.length) {
    daDang = 25 * kep((rr.soCuocDocLap - 1) / (2 - 1), 0, 1); // ~10 ma deu nhau, tuong quan 0,45 -> ~2 cuoc doc lap = du diem
    if (Math.max(...rr.ma.map((x) => x.rc)) > 0.4) daDang -= 5;
  } else daDang = (pb.chiTietDiem.daDang * 25) / 40;
  if (!pb.nganhDangSong && (pb.nganh.find((g) => g.ten !== "Khác")?.tyTrong ?? 0) > 0.6) daDang -= 5;
  let ruiRo = 20;
  if (rr?.volV > 0) {
    const tl = rr.volP / rr.volV;
    ruiRo = tl <= 1 ? 25 : tl >= 1.6 ? 10 : 25 - ((tl - 1) / 0.6) * 15;
  }
  const m = pb.margin;
  if (m?.giamDenCanhBao != null) ruiRo -= m.giamDenCanhBao <= 10 ? 10 : m.giamDenCanhBao <= 20 ? 5 : 0;
  if (m?.donBay > 1.5) ruiRo -= 3;
  const xuHuong = (pb.chiTietDiem.kyThuat * 25) / 40;
  let thanhKhoan = 20;
  if (rr?.thanhKhoan?.tyLeBan1Phien != null) thanhKhoan = 25 * rr.thanhKhoan.tyLeBan1Phien - (rr.thanhKhoan.lauNhat > 5 ? 5 : 0);
  const tru = { daDang: Math.round(kep(daDang)), ruiRo: Math.round(kep(ruiRo)), xuHuong: Math.round(kep(xuHuong)), thanhKhoan: Math.round(kep(thanhKhoan)) };
  const diem = tru.daDang + tru.ruiRo + tru.xuHuong + tru.thanhKhoan;
  const xepLoai = diem >= 85 ? "Xuất sắc" : diem >= 70 ? "Tốt" : diem >= 50 ? "Trung bình" : "Cần cải thiện";
  return { diem, xepLoai, tru, dayDu: !!rr?.dsMa?.length };
}

// NHAN XET RUI RO kieu bao cao chuyen gia: { muc: 0 nang / 1 chu y / 2 tot, uuTien (nho = quan trong hon), tieuDe, noiDung }.
export function nhanXetRuiRo(rr, pb) {
  if (!rr?.dsMa?.length) return [];
  const o = [];
  const pc = (x) => `${p0(x * 100)}%`;
  const lechMax = [...rr.ma].sort((a, b) => b.rc - b.w - (a.rc - a.w))[0];
  if (rr.ma.length > 1 && lechMax.rc - lechMax.w > 0.08)
    o.push({ muc: lechMax.rc > 0.4 ? 0 : 1, uuTien: 2, tieuDe: "Rủi ro dồn vào một mã", noiDung: `${lechMax.ma} chiếm ${pc(lechMax.w)} vốn nhưng gánh ${pc(lechMax.rc)} rủi ro (biến động) của cả danh mục — mã này quyết định phần lớn việc danh mục lên hay xuống.` });
  if (rr.ma.length >= 3) {
    const sc = rr.soCuocDocLap;
    o.push({
      muc: sc < 1.4 ? 0 : sc < 1.7 ? 1 : 2,
      uuTien: 3,
      tieuDe: "Mức đa dạng hóa thật",
      noiDung: `${rr.ma.length} mã nhưng chỉ tương đương khoảng ${p1(sc)} khoản đầu tư độc lập${rr.tqTrungBinh != null ? ` (tương quan trung bình giữa các mã ${rr.tqTrungBinh.toFixed(2).replace(".", ",")})` : ""} — ${sc < 1.4 ? "các mã gần như đi cùng một chiều, thêm mã cùng kiểu không giảm được rủi ro" : sc < 1.7 ? "các mã khá giống nhau; muốn giảm rủi ro cần mã khác ngành, khác chu kỳ" : "mức tốt so với thị trường Việt Nam (các mã thường đi cùng chiều)"}.`,
    });
  }
  const navTL = pb?.taiSan?.nav > 0 ? pb.taiSan.coPhieu / pb.taiSan.nav : 1;
  o.push({
    muc: rr.betaP > 1.3 ? 1 : 2,
    uuTien: 4,
    tieuDe: "Độ nhạy với thị trường",
    noiDung: `Beta ${rr.betaP.toFixed(2).replace(".", ",")}: khi VN-Index giảm 10%, danh mục thường giảm khoảng ${p1(rr.betaP * 10)}%${navTL > 1.05 ? `, tài sản ròng giảm khoảng ${p1(rr.betaP * 10 * navTL)}% vì đang dùng margin` : ""}. Biến động năm ${p0(rr.volP)}% so với ${p0(rr.volV)}% của VN-Index.`,
  });
  o.push({
    muc: rr.var95 > 3 ? 1 : 2,
    uuTien: 5,
    tieuDe: "Một phiên xấu",
    noiDung: `Trong 5% phiên tệ nhất 1 năm qua, danh mục mất từ ${p1(rr.var95)}% trở lên (bình quân các phiên đó ${p1(rr.cvar95)}%); phiên tệ nhất ${p1(Math.abs(rr.phienXauNhat.pct))}%.`,
  });
  const xau = rr.kichBan.find((k) => k.ten.startsWith("Lặp lại"));
  if (xau) {
    const coMargin = pb?.margin;
    o.push({
      muc: xau.chamGC ? 0 : xau.chamCB ? 0 : xau.portPct < -15 ? 1 : 2,
      uuTien: xau.chamCB ? 1 : 6,
      tieuDe: "Kiểm tra sức chịu đựng",
      noiDung: `Nếu lặp lại đợt giảm mạnh nhất của VN-Index trong 1 năm qua (${xau.ghiChu.split(",")[0]}, VN-Index ${p1(xau.vniPct)}%), danh mục hiện tại ${xau.portPct >= 0 ? "+" : ""}${p1(xau.portPct)}%${coMargin ? `, tỷ lệ ký quỹ còn ${p0(xau.tyLeKyQuy)}%${xau.chamGC ? " — DƯỚI ngưỡng xử lý, có thể bị bán giải chấp" : xau.chamCB ? " — chạm ngưỡng cảnh báo, sẽ bị gọi ký quỹ" : ""}` : ""}.`,
    });
  }
  const tk = rr.thanhKhoan;
  const kho = tk.ds.filter((x) => x.soPhien != null && x.soPhien > 3);
  if (kho.length)
    o.push({ muc: kho[0].soPhien > 10 ? 0 : 1, uuTien: 7, tieuDe: "Thanh khoản", noiDung: `${kho.slice(0, 3).map((x) => `${x.ma} cần ~${p0(x.soPhien)} phiên`).join(", ")} để bán hết nếu mỗi phiên chỉ bán 20% thanh khoản bình quân — khi thị trường xấu sẽ khó thoát nhanh.` });
  if (rr.ma.length > 1 && rr.canBangBienDong.volP < rr.volP - 2)
    o.push({ muc: 2, uuTien: 9, tieuDe: "Tham khảo: cân bằng biến động", noiDung: `Nếu chia lại tỷ trọng theo nghịch đảo biến động (mã dao động mạnh cầm ít hơn), biến động năm giảm từ ${p0(rr.volP)}% xuống khoảng ${p0(rr.canBangBienDong.volP)}% với cùng các mã. Đây là phép tính minh họa, không phải khuyến nghị.` });
  o.push({ muc: rr.laiP >= rr.laiV ? 2 : 1, uuTien: 8, tieuDe: "Nếu cầm 1 năm qua", noiDung: `Với tỷ trọng hiện tại, danh mục ${rr.laiP >= 0 ? "+" : ""}${p1(rr.laiP)}% so với VN-Index ${rr.laiV >= 0 ? "+" : ""}${p1(rr.laiV)}%; sụt giảm tối đa ${p1(Math.abs(rr.ddP.pct))}% (VN-Index ${p1(Math.abs(rr.ddV))}%). Kết quả quá khứ, không đảm bảo tương lai.` });
  return o.sort((a, b) => a.muc - b.muc || a.uuTien - b.uuTien);
}
