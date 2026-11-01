// DANH GIA DANH MUC TU DIEN (trang /danh-gia-danh-muc) - ham THUAN, test tay: engine/test/danhGiaDanhMuc.test.mjs.
// Nguoi dung tu nhap cac vi the that [{ ma, kl, giaVon }] (kl = so co phieu, giaVon = gia mua binh quan, NGHIN DONG/cp nhu gia tren web); ham ghep voi tin hieu he thong cua tung ma
// (dong tin hieu rut gon: gia, tin, diem, kijun, gg_bot, stop_loss, tp1, nganh...) va tra ve: bang tung ma, ty trong, phan bo nganh, diem 0-100 + xep loai va cac nhan xet bang loi.
// Diem va nguong la CACH CHAM DO TU DAT cua web (khong co backtest), chi de tham khao - khong phai khuyen nghi dau tu.

const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

// Doc van ban dan vao: moi dong "MA KL GIA" (cach nhau bang dau cach / phay / tab / dau cham phay); gia co the ghi 25,5 hoac 25.5. Tra { ds: [{ma, kl, giaVon}], boQua: [dong loi] }.
export function docDanDanhMuc(text) {
  const ds = [];
  const boQua = [];
  for (const dong of String(text || "").split(/\r?\n/)) {
    const d = dong.trim();
    if (!d) continue;
    const p = d.split(/[\s;\t]+/).filter(Boolean);
    const ma = (p[0] || "").toUpperCase();
    // khoi luong: dau cham / phay la dau NGAN CACH NGHIN (1.000 = 1000); gia: dau phay hoac cham la dau thap phan (25,5 = 25.5)
    const kl = p[1] == null ? null : so(String(p[1]).replace(/[.,]/g, ""));
    const giaVon = p[2] == null ? null : so(String(p[2]).replace(",", "."));
    if (!/^[A-Z0-9]{2,12}$/.test(ma) || !(kl > 0) || (p[2] != null && !(giaVon > 0))) {
      boQua.push(d);
      continue;
    }
    ds.push({ ma, kl: Math.round(kl), giaVon });
  }
  return { ds, boQua };
}

// So nguoi dung go vao o: so luong la SO NGUYEN (dau cham / phay = ngan cach nghin: 1.000 = 1000); gia / tien co the thap phan (25,5 hoac 25.5; 1.234,5 = 1234,5).
export const soNguyenNhap = (s) => {
  const x = Number(String(s ?? "").replace(/[.,\s]/g, ""));
  return String(s ?? "").trim() !== "" && Number.isFinite(x) ? x : null;
};
export const soNhap = (s) => {
  const t = String(s ?? "").trim();
  if (!t) return null;
  const x = Number(t.replace(/\./g, (m, i, str) => (/,/.test(str) ? "" : m)).replace(",", "."));
  return Number.isFinite(x) ? x : null;
};
// Danh sach o nhap [{ ma, kl, giaVon }] (chuoi) -> vi the hop le [{ ma, kl, giaVon|null }]
export function vitriTuNhap(ds = []) {
  return ds
    .map((x) => ({ ma: String(x.ma ?? "").trim().toUpperCase(), kl: soNguyenNhap(x.kl), giaVon: soNhap(x.giaVon) }))
    .filter((x) => /^[A-Z0-9]{2,12}$/.test(x.ma) && x.kl > 0)
    .map((x) => ({ ...x, giaVon: x.giaVon > 0 ? x.giaVon : null }));
}

const NGUONG = { tapTrungMa: 0.3, tapTrungMaNang: 0.45, tapTrungNganh: 0.5, loNang: -10, sapCatLo: 3, ganTP: 3 };

// Nhan xet tung ma: muc 0 = nghiem trong, 1 = can chu y, 2 = tot.
export function nhanXetMa(r, laiLoPct) {
  const o = [];
  if (!r) return [{ muc: 1, nhan: "Chưa có dữ liệu giá của mã này trong hệ thống." }];
  const gia = so(r.gia);
  // moc cat lo / TP1 / ban bot chi co nghia khi he thong DANG CAM ma (MUA / NAM GIU); TRUNG LAP / BAN con giu so cu cua lenh truoc
  const dangCam = r.tin === "MUA" || r.tin === "NAM GIU";
  const g2 = (x) => String(Math.round(x * 100) / 100).replace(".", ",");
  if (r.tin === "BAN") o.push({ muc: 0, nhan: "Hệ thống đang báo BÁN mã này" });
  else if (dangCam && r.ban_bot) o.push({ muc: 1, nhan: "Điểm đang yếu đi — cân nhắc bán bớt" });
  const sl = dangCam ? so(r.stop_loss) : null;
  if (gia != null && sl != null && sl > 0) {
    if (gia <= sl) o.push({ muc: 0, nhan: `Giá đã chạm mốc cắt lỗ của hệ thống (${g2(sl)})` });
    else if ((gia / sl - 1) * 100 <= NGUONG.sapCatLo) o.push({ muc: 0, nhan: `Giá chỉ cách mốc cắt lỗ ${((gia / sl - 1) * 100).toFixed(1).replace(".", ",")}%` });
  }
  const kj = so(r.kijun);
  const gbot = so(r.gg_bot);
  if (gia != null && gbot != null && gbot > 0 && gia < gbot) o.push({ muc: 0, nhan: "Giá dưới đường cân bằng dài hạn (xu hướng dài hạn yếu)" });
  else if (gia != null && kj != null && kj > 0 && gia < kj) o.push({ muc: 1, nhan: "Giá dưới Kijun (xu hướng trung hạn yếu)" });
  else if (gia != null && kj != null && kj > 0 && gia >= kj && r.tin !== "BAN") o.push({ muc: 2, nhan: "Giá trên Kijun — xu hướng trung hạn còn giữ" });
  const tp1 = dangCam ? so(r.tp1) : null;
  if (gia != null && tp1 != null && tp1 > gia && (tp1 / gia - 1) * 100 <= NGUONG.ganTP) o.push({ muc: 2, nhan: `Gần mốc chốt lời TP1 (${g2(tp1)})` });
  if (laiLoPct != null && laiLoPct <= NGUONG.loNang) o.push({ muc: 1, nhan: `Đang lỗ ${Math.abs(laiLoPct).toFixed(1).replace(".", ",")}% so với giá vốn` });
  return o;
}

// Von & margin (don vi DONG): tienMat = tien con lai, no = du no margin, laiSuat = %/nam (tuy chon), nguong = ty le ky quy (%) bi CANH BAO / bi GIAI CHAP (mac dinh 35 / 30, moi CTCK mot kieu - nguoi dung tu sua).
// gocNganh = { "Ten nganh": "Leading" | "Improving" | "Weakening" | "Lagging" } (RRG nganh) de nhan xet viec cam nhieu ma cung nganh khi dang song nganh.
// Ty le ky quy = (tong tai san - no) / tong tai san, tong tai san = co phieu + tien mat. Gia co phieu giam bao nhieu % thi cham nguong: GT*(1-x) + tienMat = no / (1 - nguong).
export function phanTramGiamDenNguong(gt, tienMat, no, nguongPct) {
  if (!(no > 0) || !(gt > 0)) return null;
  const x = 1 - (no / (1 - nguongPct / 100) - tienMat) / gt;
  return x <= 0 ? 0 : Math.min(100, x * 100);
}

export function danhGiaDanhMuc(vitri = [], theoMa = {}, { tienMat = 0, no = 0, laiSuat = null, nguong = {}, gocNganh = {} } = {}) {
  const daNhapTienMat = so(tienMat) != null; // khong nhap o tien mat -> khong nhan xet ve tien mat (tranh noi "tien mat 0%" khi nguoi dung chi chua dien)
  tienMat = so(tienMat) > 0 ? so(tienMat) : 0;
  no = so(no) > 0 ? so(no) : 0;
  const nguongCB = so(nguong.canhBao) > 0 ? so(nguong.canhBao) : 35;
  const nguongGC = so(nguong.giaiChap) > 0 ? so(nguong.giaiChap) : 30;
  const hang = [];
  for (const v of vitri) {
    const kl = so(v.kl);
    if (!(kl > 0) || !v.ma) continue;
    const r = theoMa[v.ma] ?? null;
    const gia = so(r?.gia);
    const giaVon = so(v.giaVon);
    const giaTri = gia != null ? kl * gia * 1000 : null;
    const von = giaVon != null ? kl * giaVon * 1000 : null;
    const laiLo = giaTri != null && von != null ? giaTri - von : null;
    const laiLoPct = laiLo != null && von > 0 ? (laiLo / von) * 100 : null;
    hang.push({ ma: v.ma, kl, giaVon, gia, doiPct: so(r?.doi), tin: r?.tin ?? null, diem: so(r?.diem), nganh: r?.nganh ?? null, vonHoa: r?.von_hoa ?? null, giaTri, von, laiLo, laiLoPct, nhanXet: nhanXetMa(r, laiLoPct), coDuLieu: gia != null, r });
  }
  const co = hang.filter((h) => h.coDuLieu);
  const tong = co.reduce((s, h) => s + h.giaTri, 0);
  for (const h of hang) h.tyTrong = h.coDuLieu && tong > 0 ? h.giaTri / tong : null;
  const coVon = hang.filter((h) => h.giaTri != null && h.von != null);
  const tongVon = coVon.reduce((s, h) => s + h.von, 0);
  const tongGiaTriCoVon = coVon.reduce((s, h) => s + h.giaTri, 0);
  const laiLo = tongVon > 0 ? tongGiaTriCoVon - tongVon : null;
  const laiLoPct = tongVon > 0 ? (laiLo / tongVon) * 100 : null;

  // phan bo nganh / nhom von hoa (theo gia tri)
  const gop = (khoa) => {
    const m = new Map();
    for (const h of co) {
      const k = h[khoa] || "Khác";
      m.set(k, (m.get(k) ?? 0) + h.giaTri);
    }
    return [...m.entries()].map(([ten, gt]) => ({ ten, tyTrong: tong > 0 ? gt / tong : 0 })).sort((a, b) => b.tyTrong - a.tyTrong);
  };
  const nganh = gop("nganh");
  const nhomVonHoa = gop("vonHoa");
  const sx = [...co].sort((a, b) => b.giaTri - a.giaTri);
  const top1 = sx[0]?.tyTrong ?? 0;
  const top3 = sx.slice(0, 3).reduce((s, h) => s + h.tyTrong, 0);
  // ma chua ro nganh ("Khác", vd ma ngoai danh sach web quet) khong tinh la 1 nganh khi xet tap trung
  const nganhCoTen = nganh.filter((g) => g.ten !== "Khác");
  const nganhLon = nganhCoTen[0]?.tyTrong ?? 0;

  // ---- DIEM 0-100: da dang (40) + suc khoe ky thuat (40) + rui ro (20)
  let daDang = 40;
  const n = co.length;
  if (n < 3) daDang -= 20;
  else if (n < 5) daDang -= 10;
  else if (n < 8) daDang -= 4;
  if (top1 > NGUONG.tapTrungMaNang) daDang -= 15;
  else if (top1 > NGUONG.tapTrungMa) daDang -= 8;
  // Dang SONG NGANH (RRG: Dan dat / Cai thien) thi cam nhieu ma cung nganh la co ly do: chi tru diem khi qua 70%.
  const gocLon = gocNganh[nganhCoTen[0]?.ten] ?? null;
  const dangSong = gocLon === "Leading" || gocLon === "Improving";
  if (dangSong) {
    if (nganhLon > 0.7) daDang -= 5;
  } else if (nganhLon > 0.6) daDang -= 10;
  else if (nganhLon > NGUONG.tapTrungNganh) daDang -= 5;
  daDang = Math.max(0, daDang);
  const tot = co.filter((h) => h.r && h.tin !== "BAN" && so(h.r.kijun) > 0 && h.gia >= so(h.r.kijun)).reduce((s, h) => s + h.giaTri, 0);
  const kyThuat = tong > 0 ? Math.round(40 * (tot / tong)) : 0;
  const lo = co.filter((h) => h.laiLoPct != null && h.laiLoPct <= NGUONG.loNang).reduce((s, h) => s + h.giaTri, 0);
  const ban = co.filter((h) => h.tin === "BAN").reduce((s, h) => s + h.giaTri, 0);
  const ruiRo = Math.max(0, Math.round(20 - 20 * (tong > 0 ? Math.min(1, (lo + ban) / tong) : 0)));
  // ---- VON & MARGIN
  const nav = tong + tienMat - no;
  const tongTaiSan = tong + tienMat;
  const margin = no > 0
    ? {
        no, donBay: nav > 0 ? tong / nav : null, tyLeKyQuy: tongTaiSan > 0 ? ((tongTaiSan - no) / tongTaiSan) * 100 : null,
        giamDenCanhBao: phanTramGiamDenNguong(tong, tienMat, no, nguongCB), giamDenGiaiChap: phanTramGiamDenNguong(tong, tienMat, no, nguongGC),
        laiMoiThang: so(laiSuat) > 0 ? (no * so(laiSuat)) / 100 / 12 : null,
      }
    : null;
  let phatMargin = 0;
  if (margin) {
    if (margin.giamDenCanhBao != null && margin.giamDenCanhBao <= 10) phatMargin += 8;
    else if (margin.giamDenCanhBao != null && margin.giamDenCanhBao <= 20) phatMargin += 4;
    if (margin.donBay != null && margin.donBay > 1.5) phatMargin += 4;
  }
  const ruiRoCuoi = Math.max(0, ruiRo - phatMargin);
  const diem = n === 0 ? null : Math.max(0, Math.min(100, daDang + kyThuat + ruiRoCuoi));
  const xepLoai = diem == null ? null : diem >= 75 ? "Tốt" : diem >= 60 ? "Khá" : diem >= 45 ? "Trung bình" : "Yếu";

  // ---- NHAN XET BANG LOI (nang truoc). loai "xu_huong" = nhan xet theo goc nhin xu huong (Kijun / can bang / tin hieu): trang dung phong cach (lib/danhGiaToanBo.js) thay bang tong ket theo phong cach
  const pc = (x) => `${(x * 100).toFixed(0)}%`;
  const nx = [];
  if (n === 0 && hang.length) nx.push({ muc: 1, nhan: "Chưa có dữ liệu giá của các mã đã nhập nên chưa đánh giá được." });
  if (n > 0 && n < 5) nx.push({ muc: 1, nhan: `Danh mục chỉ có ${n} mã — rủi ro dồn vào ít mã; thường nên có tối thiểu 5–8 mã khác ngành.` });
  if (top1 > NGUONG.tapTrungMa) nx.push({ muc: top1 > NGUONG.tapTrungMaNang ? 0 : 1, nhan: `${sx[0].ma} chiếm ${pc(top1)} danh mục${top1 > NGUONG.tapTrungMaNang ? " — quá tập trung vào một mã" : " — khá tập trung"}.` });
  if (nganhLon > NGUONG.tapTrungNganh) {
    const ten = nganhCoTen[0].ten;
    const soMaNganh = co.filter((h) => (h.nganh || "Khác") === ten).length;
    if (dangSong) {
      nx.push({ muc: nganhLon > 0.7 ? 1 : 2, nhan: `Ngành ${ten} chiếm ${pc(nganhLon)} danh mục (${soMaNganh} mã) và đang ở góc ${gocLon === "Leading" ? "Dẫn dắt" : "Cải thiện"} trên RRG — tập trung theo sóng ngành là có lý do. Vẫn nên chia ra ít nhất 3–4 mã, mỗi mã không quá khoảng 25–30% danh mục, chọn mã dẫn đầu trên Kijun và giữ kỷ luật cắt lỗ vì cả ngành cùng lên xuống.` });
    } else {
      nx.push({ muc: nganhLon > 0.6 ? 0 : 1, nhan: `Ngành ${ten} chiếm ${pc(nganhLon)} danh mục${gocLon ? ` trong khi ngành đang ở góc ${gocLon === "Weakening" ? "Yếu dần" : "Tụt hậu"} trên RRG` : ""} — cả danh mục sẽ cùng lên xuống theo ngành này.` });
    }
  }
  const yeu = co.filter((h) => h.nhanXet.some((x) => x.muc === 0));
  if (yeu.length) nx.push({ muc: 0, loai: "xu_huong", nhan: `${yeu.length} mã có cảnh báo nặng (${yeu.slice(0, 4).map((h) => h.ma).join(", ")}${yeu.length > 4 ? "…" : ""}) — chiếm ${pc(yeu.reduce((s, h) => s + h.giaTri, 0) / tong)} giá trị.` });
  const duoiKijun = co.filter((h) => h.r && so(h.r.kijun) > 0 && h.gia < so(h.r.kijun));
  if (duoiKijun.length && tong > 0) nx.push({ muc: 1, loai: "xu_huong", nhan: `${duoiKijun.length} mã đang dưới Kijun, chiếm ${pc(duoiKijun.reduce((s, h) => s + h.giaTri, 0) / tong)} giá trị danh mục.` });
  const loNangDs = co.filter((h) => h.laiLoPct != null && h.laiLoPct <= NGUONG.loNang);
  if (loNangDs.length) nx.push({ muc: 1, loai: "cat_lo", nhan: `${loNangDs.length} mã đang lỗ từ 10% trở lên (${loNangDs.slice(0, 4).map((h) => h.ma).join(", ")}${loNangDs.length > 4 ? "…" : ""}) — nên xem lại có đúng kế hoạch cắt lỗ không.` });
  if (laiLoPct != null) nx.push({ muc: laiLoPct >= 0 ? 2 : 1, nhan: `Toàn danh mục đang ${laiLoPct >= 0 ? "lãi" : "lỗ"} ${Math.abs(laiLoPct).toFixed(1).replace(".", ",")}% so với giá vốn.` });
  if (kyThuat >= 32 && n > 0) nx.push({ muc: 2, loai: "xu_huong", nhan: "Phần lớn giá trị nằm ở các mã trên Kijun và chưa có tín hiệu bán — xu hướng chung của danh mục còn tốt." });
  // von & margin
  const tyLeTM = tongTaiSan > 0 ? tienMat / tongTaiSan : 0;
  if (n > 0) {
    if (margin) {
      const g = margin.giamDenCanhBao;
      const gc = margin.giamDenGiaiChap;
      const dbay = margin.donBay != null ? margin.donBay.toFixed(2).replace(".", ",") : "—";
      if (g === 0) nx.push({ muc: 0, nhan: `Tỷ lệ ký quỹ đã chạm hoặc thấp hơn mức cảnh báo ${nguongCB}% — cần bổ sung tiền / giảm margin ngay (theo ngưỡng bạn nhập).` });
      else if (g != null) nx.push({ muc: g <= 10 ? 0 : g <= 25 ? 1 : 2, nhan: `Đang dùng margin (đòn bẩy ${dbay}x, nợ ${pc(no / Math.max(tong, 1))} giá trị cổ phiếu): nếu giá trị cổ phiếu giảm khoảng ${g.toFixed(0)}% thì chạm mức cảnh báo ${nguongCB}%${gc != null && gc > 0 ? `, giảm khoảng ${gc.toFixed(0)}% thì tới ngưỡng xử lý ${nguongGC}%` : ""}. ${g <= 10 ? "Rất mỏng — một phiên giảm mạnh là đủ." : g <= 25 ? "Khá mỏng — một nhịp điều chỉnh vừa là tới ngưỡng." : "Còn đệm tương đối."}` });
      if (margin.laiMoiThang != null) nx.push({ muc: 1, nhan: `Lãi margin ước tính khoảng ${(margin.laiMoiThang / 1e6).toFixed(1).replace(".", ",")} triệu đồng/tháng — cổ phiếu phải tăng ít nhất ${((margin.laiMoiThang / Math.max(nav, 1)) * 100).toFixed(1).replace(".", ",")}% giá trị tài sản ròng mỗi tháng mới hòa vốn lãi vay.` });
      if (tyLeTM < 0.05) nx.push({ muc: 1, nhan: "Gần như hết tiền mặt trong khi đang dùng margin — không còn dư địa bổ sung ký quỹ khi giá giảm." });
    } else if (!daNhapTienMat) {
      // chua nhap tien mat: bo qua
    } else if (tyLeTM >= 0.5) {
      nx.push({ muc: 1, nhan: `Tiền mặt chiếm ${pc(tyLeTM)} tài sản — an toàn nhưng đang chờ cơ hội; nếu thị trường tốt, có thể giải ngân dần từng phần thay vì một lần.` });
    } else if (tyLeTM < 0.1) {
      nx.push({ muc: 1, nhan: `Tiền mặt chỉ còn ${pc(tyLeTM)} tài sản — ít dư địa để trung bình giá hoặc đón cơ hội mới.` });
    } else {
      nx.push({ muc: 2, nhan: `Tiền mặt chiếm ${pc(tyLeTM)} tài sản — mức cân đối, vẫn còn dư địa giải ngân.` });
    }
  }
  nx.sort((a, b) => a.muc - b.muc);

  return {
    hang, soMa: hang.length, soMaCoGia: n, tongGiaTri: tong, tongVon: tongVon || null, laiLo, laiLoPct,
    tyTrong: { top1, top3, maTop1: sx[0]?.ma ?? null }, nganh, nhomVonHoa,
    taiSan: { coPhieu: tong, tienMat, no, nav, tyLeTienMat: tyLeTM, tongTaiSan }, margin, nguong: { canhBao: nguongCB, giaiChap: nguongGC }, nganhDangSong: dangSong, gocNganhLon: gocLon,
    diem, xepLoai, chiTietDiem: { daDang, kyThuat, ruiRo: ruiRoCuoi }, nhanXet: nx, thieu: hang.filter((h) => !h.coDuLieu).map((h) => h.ma),
  };
}
