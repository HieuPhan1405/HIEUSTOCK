// SO SANH ban thuong (file AFL 7) voi ban thu Chikou thong thoang (file AFL 10) theo TRANG THAI HOM NAY.
// Chi la so sanh anh chup 1 thoi diem: ban Chikou co the vao lenh MUON HON hoac KHONG vao nen lai/lo cua
// tung ma khac nhau - khong thay the backtest trong AmiBroker.
const dangGiu = (t) => t === "MUA" || t === "NAM GIU";
const tb = (a, lay) => {
  const v = a.map(lay).filter((x) => x != null && Number.isFinite(Number(x)));
  return v.length ? v.reduce((s, x) => s + Number(x), 0) / v.length : null;
};

export function soSanhChikou(thuong, chikou) {
  const mapThuong = new Map(thuong.map((r) => [r.ma, r]));
  const mapChikou = new Map(chikou.map((r) => [r.ma, r]));

  const giuThuong = thuong.filter((r) => dangGiu(r.tin));
  const giuChikou = chikou.filter((r) => dangGiu(r.tin));

  const cungGiu = [];
  const biLoai = [];
  for (const r of giuThuong) {
    const c = mapChikou.get(r.ma);
    if (c && dangGiu(c.tin)) cungGiu.push({ ma: r.ma, thuong: r, chikou: c });
    else biLoai.push({ ma: r.ma, thuong: r, chikou: c || null });
  }
  const chiChikou = giuChikou
    .filter((r) => !(mapThuong.get(r.ma) && dangGiu(mapThuong.get(r.ma).tin)))
    .map((r) => ({ ma: r.ma, thuong: mapThuong.get(r.ma) || null, chikou: r }));

  return {
    soThuong: giuThuong.length,
    soChikou: giuChikou.length,
    cungGiu,
    biLoai,
    chiChikou,
    // Lai/lo hien tai theo ban THUONG cua nhom bi Chikou loai va nhom duoc giu: neu nhom bi loai
    // lo nhieu hon thi bo loc Chikou dang "gat" dung cac lenh xau.
    laiTBBiLoai: tb(biLoai, (x) => x.thuong.lai_lo_pct),
    laiTBCungGiu: tb(cungGiu, (x) => x.thuong.lai_lo_pct),
    soBiLoaiLo: biLoai.filter((x) => x.thuong.lai_lo_pct < 0).length,
    soBiLoaiLai: biLoai.filter((x) => x.thuong.lai_lo_pct > 0).length,
    soCungGiuLo: cungGiu.filter((x) => x.thuong.lai_lo_pct < 0).length,
    soCungGiuLai: cungGiu.filter((x) => x.thuong.lai_lo_pct > 0).length,
    capNhatThuong: thuong.reduce((m, r) => (r.cap_nhat_luc && (!m || r.cap_nhat_luc > m) ? r.cap_nhat_luc : m), null),
    capNhatChikou: chikou.reduce((m, r) => (r.cap_nhat_luc && (!m || r.cap_nhat_luc > m) ? r.cap_nhat_luc : m), null),
  };
}
