// Muc "HOI SAU GIAM DAI" cua trang Checklist bat day (Hieu 2026-10-21): dung danh sach tu cot hg_* cua bang chi_bao_ky_thuat (engine/loi/hoiSauGiamDai.js) + tin_hieu (gia, nganh, tin).
// Ham THUAN (khong import "@/") de test tay: engine/test/hoiSauGiamDai.test.mjs.
const coSo = (v) => typeof v === "number" && Number.isFinite(v);

const boDau = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

// Nhan nganh theo ket qua nghien cuu (engine/dich-vu/nghienCuuMoHinhTheoNganh.mjs, tham khao): "uu" = bang chung kha (Chung khoan, Thep, Hoa chat - Cao su, Det may - Go),
// "yeu" = khong co loi the hoac T4 yeu (Ngan hang, CN - Vien thong, Nong nghiep, Thuc pham, Du lich, Bat dong san), con lai = trung tinh.
export function nhanNganh(ten) {
  const n = boDau(ten);
  if (!n) return { loai: "trung", nhan: "", ghiChu: "" };
  if (["ngan hang", "cong nghe", "nong nghiep", "thuc pham", "du lich"].some((k) => n.includes(k))) return { loai: "yeu", nhan: "Ngành ít lợi thế", ghiChu: "Nghiên cứu lịch sử: mô hình này gần như không có lãi ở ngành này" };
  if (n.includes("bat dong san") || n.includes("bds")) return { loai: "yeu", nhan: "BĐS: tín hiệu yếu", ghiChu: "Với BĐS, kiểm chứng cho thấy 'phá vùng tích lũy có khối lượng' hợp hơn tín hiệu này" };
  if (["chung khoan", "thep", "hoa chat", "det may"].some((k) => n.includes(k))) return { loai: "uu", nhan: "Ngành có bằng chứng", ghiChu: "Nghiên cứu lịch sử: lãi/lệnh khá hơn mặt bằng chung ở ngành này (chỉ tham khảo)" };
  return { loai: "trung", nhan: "", ghiChu: "" };
}

// hang: dong chi_bao_ky_thuat ({ ma, hg_*: ... }); tatCa: dong tin_hieu ({ ma, gia, doi, nganh, tin }).
export function dungHoiSauGiamDai({ hang = [], tatCa = [] }) {
  const tin = new Map(tatCa.map((r) => [r.ma, r]));
  const dangCam = [];
  const gan = [];
  let soGiamDai = 0;
  for (const h of hang) {
    const t = tin.get(h.ma);
    if (!t) continue;
    if (h.hg_giam_dai === 1) soGiamDai++;
    const gia = coSo(t.gia) ? t.gia : null;
    const chung = { ma: h.ma, nganh: t.nganh ?? "", nhanNganh: nhanNganh(t.nganh), tinHeThong: t.tin ?? null, gia, doi: coSo(t.doi) ? t.doi : null };
    if (coSo(h.hg_cach) && coSo(h.hg_gia_vao)) {
      dangCam.push({
        ...chung,
        cach: h.hg_cach,
        giaVao: h.hg_gia_vao,
        sl: h.hg_sl,
        ma50: coSo(h.hg_ma50) ? h.hg_ma50 : null,
        ch4: coSo(h.hg_ch4) ? h.hg_ch4 : null,
        canBan: h.hg_ban === 1 || (gia != null && coSo(h.hg_ma50) && gia < h.hg_ma50),
        thungSL: gia != null && coSo(h.hg_sl) && gia <= h.hg_sl,
        laiPct: gia != null ? (gia / h.hg_gia_vao - 1) * 100 : null,
      });
      continue;
    }
    if (h.hg_giam_dai !== 1 || h.hg_gtgd_ok !== 1) continue;
    const dk = [h.hg_giam_dai === 1, h.hg_gtgd_ok === 1, h.hg_day_cao === 1, h.hg_tren_tk_kj === 1];
    const soDat = dk.filter(Boolean).length;
    if (soDat < 3) continue;
    gan.push({ ...chung, dk, soDat, cachDinhPct: coSo(h.cach_dinh_52t_pct) ? h.cach_dinh_52t_pct : null });
  }
  dangCam.sort((a, b) => a.cach - b.cach || a.ma.localeCompare(b.ma));
  gan.sort((a, b) => b.soDat - a.soDat || (a.cachDinhPct ?? 0) - (b.cachDinhPct ?? 0) || a.ma.localeCompare(b.ma));
  return { dangCam, gan, soGiamDai };
}
