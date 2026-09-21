// LENH DA DONG: web chi luu TRANG THAI HIEN TAI cua tung ma (bang tin_hieu) nen khi 1 lenh ban xong
// thi lich su lenh do bien mat. Moi lan upload, so sanh trang thai CU voi MOI: ma tu NAM GIU chuyen
// sang BAN / TRUNG LAP = 1 lenh vua dong -> ghi vao bang lenh_da_dong (ket qua that de theo doi).
//
// LUU Y do chinh xac: AFL khong xuat ngay/gia ban, nen ngay ban = ngay giao dich gan nhat luc upload
// (T7/CN -> thu 6), gia ban = gia hien tai cua lan upload do (xap xi gia dong cua phien ban).
// Chi tinh cac ma da NAM GIU tu phien truoc (MUA -> TRUNG LAP trong cung ngay la tin hieu chap chon
// giua phien, khong phai lenh that).
import { withDb, daoDamBangLenhDaDong } from "@/lib/db";
import { TY_LE_CHOT } from "@/lib/tyLeChot";

const dangGiu = (t) => t === "MUA" || t === "NAM GIU";

// Ngay giao dich gan nhat (theo gio Viet Nam): thu 7/CN lui ve thu 6. Khong tinh ngay le.
export function ngayGiaoDichVN(luc = new Date()) {
  const tz = "Asia/Ho_Chi_Minh";
  const ngay = new Date(luc);
  const thu = ngay.toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
  let lui = 0;
  if (thu === "Sat") lui = 1;
  else if (thu === "Sun") lui = 2;
  const goc = new Date(ngay.getTime() - lui * 86400e3);
  return goc.toLocaleDateString("en-CA", { timeZone: tz }); // yyyy-mm-dd
}

// dsMoi: [{ ma, tin, gia }] cua lan upload nay; banGhiCuTheoMa: { ma: dong DB truoc khi ghi de }.
// Tra ve danh sach lenh da dong can ghi.
export function phatHienLenhDong({ dsMoi, banGhiCuTheoMa, ngayBan }) {
  const ketQua = [];
  for (const m of dsMoi) {
    if (m.ma === "VNINDEX") continue;
    const cu = banGhiCuTheoMa[m.ma];
    if (!cu || cu.tin !== "NAM GIU" || dangGiu(m.tin)) continue;
    const giaMua = Number(cu.gia_vao_web > 0 ? cu.gia_vao_web : cu.gia_mua);
    const giaBan = Number(m.gia);
    if (!cu.ngay_mua_txt || !(giaMua > 0) || !(giaBan > 0)) continue;
    ketQua.push({
      ma: m.ma,
      ngay_mua: cu.ngay_mua_txt,
      gia_mua: giaMua,
      ngay_ban: ngayBan,
      gia_ban: giaBan,
      lai_lo_pct: (giaBan / giaMua - 1) * 100,
      so_phien: cu.so_phien_giu != null ? Number(cu.so_phien_giu) : null,
      ly_do: m.tin === "BAN" ? "BAN" : "THOAT",
      da_cham_tp: cu.tp_da_cham || null,
    });
  }
  return ketQua;
}

// LENH CHOT DU TP3: chot 30% o TP1, 30% o TP2, 25% o TP3 (ty le trong lib/tyLeChot.js), 15% cuoi nam giu lay vi the.
// Khi gia cham TP3 lenh duoc ghi vao Lenh da dong voi phan DA CHOT (85%): lai/lo = tong (ty le x lai tai moc) tren TOAN vi the,
// 15% con lai khong tinh (giu chay, thoat theo tin hieu BAN). Gia ban = gia chot binh quan cua 85% do.
export function tinhChotTP3({ giaMua, tp1, tp2, tp3, ngayMua, ngayBan, soPhien = null }) {
  const g = Number(giaMua);
  const t = [tp1, tp2, tp3].map(Number);
  if (!(g > 0) || t.some((x) => !(x > g)) || !(t[0] <= t[1] && t[1] <= t[2])) return null;
  const w = [TY_LE_CHOT.tp1, TY_LE_CHOT.tp2, TY_LE_CHOT.tp3];
  const phanChot = w.reduce((a, b) => a + b, 0);
  return {
    gia_mua: g,
    ngay_mua: ngayMua,
    ngay_ban: ngayBan,
    gia_ban: w.reduce((s, wi, i) => s + wi * t[i], 0) / phanChot,
    lai_lo_pct: w.reduce((s, wi, i) => s + wi * (t[i] / g - 1), 0),
    so_phien: soPhien,
    ly_do: "TP3",
    da_cham_tp: "TP3",
    phan_chot_pct: phanChot,
  };
}

// dsMoi: [{ ma, tin, tp_da_cham, ngay_mua (yyyy-mm-dd), so_phien_giu, tp1, tp2, tp3 }] cua lan upload nay.
// Chi ghi khi VUA cham TP3 (lan upload truoc chua TP3, cung 1 lenh) va van dang giu - lenh da cham TP3 tu truoc do
// duoc nap 1 lan bang /api/backfill-tp3.
export function phatHienChotTP3({ dsMoi, banGhiCuTheoMa, ngayBan }) {
  const ketQua = [];
  for (const m of dsMoi) {
    if (m.ma === "VNINDEX" || !dangGiu(m.tin) || m.tp_da_cham !== "TP3") continue;
    const cu = banGhiCuTheoMa[m.ma];
    if (!cu || cu.tp_da_cham === "TP3" || !m.ngay_mua || cu.ngay_mua_txt !== m.ngay_mua) continue;
    const tp = [1, 2, 3].map((i) => (Number(cu[`vao_tp${i}`]) > 0 ? cu[`vao_tp${i}`] : m[`tp${i}`]));
    const r = tinhChotTP3({
      giaMua: Number(cu.gia_vao_web) > 0 ? cu.gia_vao_web : cu.gia_mua,
      tp1: tp[0],
      tp2: tp[1],
      tp3: tp[2],
      ngayMua: m.ngay_mua,
      ngayBan,
      soPhien: m.so_phien_giu != null ? Number(m.so_phien_giu) : null,
    });
    if (r) ketQua.push({ ma: m.ma, ...r });
  }
  return ketQua;
}

// Nen dau tien SAU ngay mua co dinh >= muc TP (nen tang dan theo ngay: [{ t: "yyyy-mm-dd", h }]) -> { ngay, soPhien } hoac null.
export function ngayChamTP(nen, ngayMua, tp) {
  let soPhien = 0;
  for (const b of nen) {
    if (b.t <= ngayMua) continue;
    soPhien++;
    if (b.h >= tp) return { ngay: b.t, soPhien };
  }
  return null;
}

// Ma dang giu, da cham TP3 (theo AFL) ma CHUA co trong Lenh da dong - de nap 1 lan cac lenh da cham TP3 tu truoc.
export async function layUngVienTP3() {
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      `SELECT t.ma, t.tin, t.gia_mua, t.gia_vao_web, t.tp1, t.tp2, t.tp3, t.vao_tp1, t.vao_tp2, t.vao_tp3, t.so_phien_giu,
              to_char(t.ngay_mua, 'YYYY-MM-DD') AS ngay_mua_txt
       FROM tin_hieu t
       WHERE t.tin IN ('MUA', 'NAM GIU') AND t.tp_da_cham = 'TP3' AND t.ngay_mua IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM lenh_da_dong d WHERE d.ma = t.ma AND d.ngay_mua = t.ngay_mua)`
    );
    return rows;
  });
}

// Ghi 1 lan bang unnest(); UNIQUE (ma, ngay_mua) + DO NOTHING nen upload lap khong tao dong trung.
export async function ghiLenhDaDong(ds) {
  if (!ds.length) return 0;
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const cot = (k) => ds.map((x) => x[k]);
    const { rowCount } = await client.query(
      `INSERT INTO lenh_da_dong (ma, ngay_mua, gia_mua, ngay_ban, gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp, phan_chot_pct)
       SELECT * FROM unnest($1::text[], $2::date[], $3::float8[], $4::date[], $5::float8[], $6::float8[], $7::float8[], $8::text[], $9::text[], $10::float8[])
       ON CONFLICT (ma, ngay_mua) DO NOTHING`,
      [
        cot("ma"),
        cot("ngay_mua"),
        cot("gia_mua"),
        cot("ngay_ban"),
        cot("gia_ban"),
        cot("lai_lo_pct"),
        cot("so_phien"),
        cot("ly_do"),
        cot("da_cham_tp"),
        ds.map((x) => x.phan_chot_pct ?? 100),
      ]
    );
    return rowCount;
  });
}

export async function layLenhDaDong() {
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      `SELECT ma, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, gia_mua, to_char(ngay_ban, 'YYYY-MM-DD') AS ngay_ban,
              gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp, phan_chot_pct
       FROM lenh_da_dong ORDER BY ngay_ban DESC, ma ASC LIMIT 1000`
    );
    return rows;
  });
}

// Thong ke tong hop cho trang Lenh da dong.
export function thongKeLenhDaDong(ds) {
  const n = ds.length;
  const thang = ds.filter((x) => x.lai_lo_pct > 0);
  const thua = ds.filter((x) => x.lai_lo_pct < 0);
  const tb = (a, f) => (a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : null);
  return {
    soLenh: n,
    soThang: thang.length,
    soThua: thua.length,
    tyLeThang: n ? (thang.length / n) * 100 : null,
    laiTB: tb(ds, (x) => x.lai_lo_pct),
    laiTBThang: tb(thang, (x) => x.lai_lo_pct),
    loTBThua: tb(thua, (x) => x.lai_lo_pct),
    phienTB: tb(ds.filter((x) => x.so_phien != null), (x) => x.so_phien),
    tongLai: ds.reduce((s, x) => s + x.lai_lo_pct, 0),
  };
}
