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

const NGUONG = { tapTrungMa: 0.3, tapTrungMaNang: 0.45, tapTrungNganh: 0.5, loNang: -10, sapCatLo: 3, ganTP: 3 };

// Nhan xet tung ma: muc 0 = nghiem trong, 1 = can chu y, 2 = tot.
export function nhanXetMa(r, laiLoPct) {
  const o = [];
  if (!r) return [{ muc: 1, nhan: "Chưa có dữ liệu giá của mã này trong hệ thống." }];
  const gia = so(r.gia);
  if (r.tin === "BAN") o.push({ muc: 0, nhan: "Hệ thống đang báo BÁN mã này" });
  else if (r.ban_bot) o.push({ muc: 1, nhan: "Điểm đang yếu đi — cân nhắc bán bớt" });
  const sl = so(r.stop_loss);
  if (gia != null && sl != null && sl > 0) {
    if (gia <= sl) o.push({ muc: 0, nhan: `Giá đã chạm mốc cắt lỗ của hệ thống (${sl})` });
    else if ((gia / sl - 1) * 100 <= NGUONG.sapCatLo) o.push({ muc: 0, nhan: `Giá chỉ cách mốc cắt lỗ ${((gia / sl - 1) * 100).toFixed(1).replace(".", ",")}%` });
  }
  const kj = so(r.kijun);
  const gbot = so(r.gg_bot);
  if (gia != null && gbot != null && gbot > 0 && gia < gbot) o.push({ muc: 0, nhan: "Giá dưới đường cân bằng dài hạn (xu hướng dài hạn yếu)" });
  else if (gia != null && kj != null && kj > 0 && gia < kj) o.push({ muc: 1, nhan: "Giá dưới Kijun (xu hướng trung hạn yếu)" });
  else if (gia != null && kj != null && kj > 0 && gia >= kj && r.tin !== "BAN") o.push({ muc: 2, nhan: "Giá trên Kijun — xu hướng trung hạn còn giữ" });
  const tp1 = so(r.tp1);
  if (gia != null && tp1 != null && tp1 > gia && (tp1 / gia - 1) * 100 <= NGUONG.ganTP) o.push({ muc: 2, nhan: `Gần mốc chốt lời TP1 (${tp1})` });
  if (laiLoPct != null && laiLoPct <= NGUONG.loNang) o.push({ muc: 1, nhan: `Đang lỗ ${Math.abs(laiLoPct).toFixed(1).replace(".", ",")}% so với giá vốn` });
  return o;
}

export function danhGiaDanhMuc(vitri = [], theoMa = {}) {
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
  const nganhLon = nganh[0]?.tyTrong ?? 0;

  // ---- DIEM 0-100: da dang (40) + suc khoe ky thuat (40) + rui ro (20)
  let daDang = 40;
  const n = co.length;
  if (n < 3) daDang -= 20;
  else if (n < 5) daDang -= 10;
  else if (n < 8) daDang -= 4;
  if (top1 > NGUONG.tapTrungMaNang) daDang -= 15;
  else if (top1 > NGUONG.tapTrungMa) daDang -= 8;
  if (nganhLon > 0.6) daDang -= 10;
  else if (nganhLon > NGUONG.tapTrungNganh) daDang -= 5;
  daDang = Math.max(0, daDang);
  const tot = co.filter((h) => h.r && h.tin !== "BAN" && so(h.r.kijun) > 0 && h.gia >= so(h.r.kijun)).reduce((s, h) => s + h.giaTri, 0);
  const kyThuat = tong > 0 ? Math.round(40 * (tot / tong)) : 0;
  const lo = co.filter((h) => h.laiLoPct != null && h.laiLoPct <= NGUONG.loNang).reduce((s, h) => s + h.giaTri, 0);
  const ban = co.filter((h) => h.tin === "BAN").reduce((s, h) => s + h.giaTri, 0);
  const ruiRo = Math.max(0, Math.round(20 - 20 * (tong > 0 ? Math.min(1, (lo + ban) / tong) : 0)));
  const diem = n === 0 ? null : Math.max(0, Math.min(100, daDang + kyThuat + ruiRo));
  const xepLoai = diem == null ? null : diem >= 75 ? "Tốt" : diem >= 60 ? "Khá" : diem >= 45 ? "Trung bình" : "Yếu";

  // ---- NHAN XET BANG LOI (nang truoc)
  const pc = (x) => `${(x * 100).toFixed(0)}%`;
  const nx = [];
  if (n === 0 && hang.length) nx.push({ muc: 1, nhan: "Chưa có dữ liệu giá của các mã đã nhập nên chưa đánh giá được." });
  if (n > 0 && n < 5) nx.push({ muc: 1, nhan: `Danh mục chỉ có ${n} mã — rủi ro dồn vào ít mã; thường nên có tối thiểu 5–8 mã khác ngành.` });
  if (top1 > NGUONG.tapTrungMa) nx.push({ muc: top1 > NGUONG.tapTrungMaNang ? 0 : 1, nhan: `${sx[0].ma} chiếm ${pc(top1)} danh mục${top1 > NGUONG.tapTrungMaNang ? " — quá tập trung vào một mã" : " — khá tập trung"}.` });
  if (nganhLon > NGUONG.tapTrungNganh) nx.push({ muc: nganhLon > 0.6 ? 0 : 1, nhan: `Ngành ${nganh[0].ten} chiếm ${pc(nganhLon)} danh mục — cả danh mục sẽ cùng lên xuống theo ngành này.` });
  const yeu = co.filter((h) => h.nhanXet.some((x) => x.muc === 0));
  if (yeu.length) nx.push({ muc: 0, nhan: `${yeu.length} mã có cảnh báo nặng (${yeu.slice(0, 4).map((h) => h.ma).join(", ")}${yeu.length > 4 ? "…" : ""}) — chiếm ${pc(yeu.reduce((s, h) => s + h.giaTri, 0) / tong)} giá trị.` });
  const duoiKijun = co.filter((h) => h.r && so(h.r.kijun) > 0 && h.gia < so(h.r.kijun));
  if (duoiKijun.length && tong > 0) nx.push({ muc: 1, nhan: `${duoiKijun.length} mã đang dưới Kijun, chiếm ${pc(duoiKijun.reduce((s, h) => s + h.giaTri, 0) / tong)} giá trị danh mục.` });
  const loNangDs = co.filter((h) => h.laiLoPct != null && h.laiLoPct <= NGUONG.loNang);
  if (loNangDs.length) nx.push({ muc: 1, nhan: `${loNangDs.length} mã đang lỗ từ 10% trở lên (${loNangDs.slice(0, 4).map((h) => h.ma).join(", ")}) — nên xem lại có đúng kế hoạch cắt lỗ không.` });
  if (laiLoPct != null) nx.push({ muc: laiLoPct >= 0 ? 2 : 1, nhan: `Toàn danh mục đang ${laiLoPct >= 0 ? "lãi" : "lỗ"} ${Math.abs(laiLoPct).toFixed(1).replace(".", ",")}% so với giá vốn.` });
  if (kyThuat >= 32 && n > 0) nx.push({ muc: 2, nhan: "Phần lớn giá trị nằm ở các mã trên Kijun và chưa có tín hiệu bán — xu hướng chung của danh mục còn tốt." });
  nx.sort((a, b) => a.muc - b.muc);

  return {
    hang, soMa: hang.length, soMaCoGia: n, tongGiaTri: tong, tongVon: tongVon || null, laiLo, laiLoPct,
    tyTrong: { top1, top3, maTop1: sx[0]?.ma ?? null }, nganh, nhomVonHoa,
    diem, xepLoai, chiTietDiem: { daDang, kyThuat, ruiRo }, nhanXet: nx, thieu: hang.filter((h) => !h.coDuLieu).map((h) => h.ma),
  };
}
