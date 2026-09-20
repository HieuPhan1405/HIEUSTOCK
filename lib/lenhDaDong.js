// LENH DA DONG: web chi luu TRANG THAI HIEN TAI cua tung ma (bang tin_hieu) nen khi 1 lenh ban xong
// thi lich su lenh do bien mat. Moi lan upload, so sanh trang thai CU voi MOI: ma tu NAM GIU chuyen
// sang BAN / TRUNG LAP = 1 lenh vua dong -> ghi vao bang lenh_da_dong (ket qua that de theo doi).
//
// LUU Y do chinh xac: AFL khong xuat ngay/gia ban, nen ngay ban = ngay giao dich gan nhat luc upload
// (T7/CN -> thu 6), gia ban = gia hien tai cua lan upload do (xap xi gia dong cua phien ban).
// Chi tinh cac ma da NAM GIU tu phien truoc (MUA -> TRUNG LAP trong cung ngay la tin hieu chap chon
// giua phien, khong phai lenh that).
import { withDb, daoDamBangLenhDaDong } from "@/lib/db";

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

// Ghi 1 lan bang unnest(); UNIQUE (ma, ngay_mua) + DO NOTHING nen upload lap khong tao dong trung.
export async function ghiLenhDaDong(ds) {
  if (!ds.length) return 0;
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const cot = (k) => ds.map((x) => x[k]);
    const { rowCount } = await client.query(
      `INSERT INTO lenh_da_dong (ma, ngay_mua, gia_mua, ngay_ban, gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp)
       SELECT * FROM unnest($1::text[], $2::date[], $3::float8[], $4::date[], $5::float8[], $6::float8[], $7::float8[], $8::text[], $9::text[])
       ON CONFLICT (ma, ngay_mua) DO NOTHING`,
      [cot("ma"), cot("ngay_mua"), cot("gia_mua"), cot("ngay_ban"), cot("gia_ban"), cot("lai_lo_pct"), cot("so_phien"), cot("ly_do"), cot("da_cham_tp")]
    );
    return rowCount;
  });
}

export async function layLenhDaDong() {
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      `SELECT ma, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, gia_mua, to_char(ngay_ban, 'YYYY-MM-DD') AS ngay_ban,
              gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp
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
