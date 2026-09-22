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

// Dang trong gio giao dich lien tuc/ATC (T2-T6, 09:00-14:45 gio VN)? Du lieu day len luc nay la du lieu TRONG PHIEN: nen chua dong,
// tin hieu (nhat la BAN/cat lo) con co the doi chieu truoc khi dong cua.
export function dangTrongPhien(luc = new Date()) {
  const tz = "Asia/Ho_Chi_Minh";
  const thu = new Date(luc).toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
  if (thu === "Sat" || thu === "Sun") return false;
  const gio = new Date(luc).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", timeZone: tz });
  const [h, m] = gio.split(":").map(Number);
  const phut = h * 60 + m;
  return phut >= 9 * 60 && phut < 14 * 60 + 45;
}

// So gia hop le (> 0) hoac null.
const duongSo = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Ty le da CHOT theo tung moc TP tinh khi lenh DONG HOAN TOAN va CHUA tung cham TP3 (TP3 co duong rieng, xem ben duoi):
// tra ve cac cap [khoa, trongSo] da chot (dung thu tu TP1 truoc TP2 sau) va % con lai (tinh theo gia luc dong that su).
function tinhTrongSoDaChot(tpDaCham) {
  if (tpDaCham === "TP2")
    return { daChot: [["tp1", TY_LE_CHOT.tp1], ["tp2", TY_LE_CHOT.tp2]], conLai: 100 - TY_LE_CHOT.tp1 - TY_LE_CHOT.tp2 };
  if (tpDaCham === "TP1") return { daChot: [["tp1", TY_LE_CHOT.tp1]], conLai: 100 - TY_LE_CHOT.tp1 };
  return { daChot: [], conLai: 100 };
}

// Tinh lai lai/lo cho 1 dong lenh_da_dong DA CO SAN khi gia moi nhat thay doi (dung khi cung 1 ngay co nhieu lan
// upload, vd sau ATC) - GIU DUNG cach tinh ban dau: vong 1 co cham TP1/TP2 (chua TP3) thi tinh co trong so; cac
// truong hop con lai (vong 2, vong 3, hoac vong 1 chua tung cham TP) la ty le gia don gian nhu luc ghi lan dau.
// d: { gia_mua, da_cham_tp, vong, gia (gia moi nhat), vao_tp1, vao_tp2, tp1, tp2 }.
function tinhLaiLoTheoGiaMoi(d) {
  const giaMua = Number(d.gia_mua);
  const giaMoi = Number(d.gia);
  const donGian = (giaMoi / giaMua - 1) * 100;
  if (d.vong !== 1 || d.da_cham_tp === "TP3" || !d.da_cham_tp) return donGian;
  const trongSo = tinhTrongSoDaChot(d.da_cham_tp);
  const giaTaiMoc = { tp1: duongSo(d.vao_tp1) ?? duongSo(d.tp1), tp2: duongSo(d.vao_tp2) ?? duongSo(d.tp2) };
  let tong = trongSo.conLai * (giaMoi / giaMua - 1);
  for (const [khoa, w] of trongSo.daChot) {
    const p = giaTaiMoc[khoa];
    if (!(p > 0)) return donGian;
    tong += w * (p / giaMua - 1);
  }
  return tong;
}

// dsMoi: [{ ma, tin, gia, tp1, tp2 }] cua lan upload nay (tp1/tp2 la gia tri THO tu AFL, chi dung khi ban ghi cu thieu
// vao_tp1/vao_tp2); banGhiCuTheoMa: { ma: dong DB truoc khi ghi de }. Tra ve danh sach lenh da dong can ghi.
//
// CACH TINH LAI/LO khi lenh dong (BAN/THOAT), theo tp_da_cham cua LAN GIU NAY:
//  - Chua tung cham TP nao: lai/lo = gia dong / gia mua - 1 (nhu cu).
//  - Da cham TP1 (chua TP2/TP3): coi nhu 30% da chot tai gia TP1 (theo huong dan 30/30/25/15), 70% con lai moi thuc
//    su lai/lo theo gia dong cua that su -> lai/lo BLEND ca 2 phan, phan anh dung "da chot 1 phan, phan con lai la lai/lo
//    that khi dong". Da cham TP2 tuong tu voi 30% TP1 + 30% TP2 + 40% con lai.
//  - Da cham TP3: 85% coi nhu DA DONG rieng tu luc cham TP3 (xem phatHienChotTP3) - GHI RIENG mot dong khac (vong=3,
//    phan_chot_pct=15) cho DUNG 15% con lai moi thuc su dong bay gio, KHONG gop lai voi lai/lo cua lan chot TP3.
export function phatHienLenhDong({ dsMoi, banGhiCuTheoMa, ngayBan }) {
  const ketQua = [];
  for (const m of dsMoi) {
    if (m.ma === "VNINDEX") continue;
    const cu = banGhiCuTheoMa[m.ma];
    if (!cu || cu.tin !== "NAM GIU" || dangGiu(m.tin)) continue;
    const giaMua = Number(cu.gia_vao_web > 0 ? cu.gia_vao_web : cu.gia_mua);
    const giaBan = Number(m.gia);
    if (!cu.ngay_mua_txt || !(giaMua > 0) || !(giaBan > 0)) continue;
    // ly_do_ban do AFL xuat (1=tin hieu diem so, 2=Stop-loss thuong, 3=Bao ve lai) chi dung khi CHINH LA phien Sell
    // that su xay ra (m.tin === "BAN"); thieu du lieu (CSV cu) hoac roi vao ngay "THOAT" (bo lo ngay Ban) thi fallback.
    const lyDo = m.ly_do_ban === 3 ? "BAO_VE_LAI" : m.ly_do_ban === 2 ? "CAT_LO" : m.tin === "BAN" ? "BAN" : "THOAT";

    if (cu.tp_da_cham === "TP3") {
      // Da co 1 dong rieng ghi luc cham TP3 (85% coi nhu da chot). Day la PHAN CON LAI (15%) THAT SU dong bay gio.
      ketQua.push({
        ma: m.ma,
        ngay_mua: cu.ngay_mua_txt,
        gia_mua: giaMua,
        ngay_ban: ngayBan,
        gia_ban: giaBan,
        lai_lo_pct: (giaBan / giaMua - 1) * 100,
        so_phien: cu.so_phien_giu != null ? Number(cu.so_phien_giu) : null,
        ly_do: lyDo,
        da_cham_tp: "TP3",
        phan_chot_pct: TY_LE_CHOT.giu,
        vong: 3,
      });
      continue;
    }

    // Chua tung cham TP3: tinh lai/lo co trong so neu da cham TP1/TP2 (uu tien gia TP dong bang tren web, "vao_tp1/2";
    // thieu thi lay tam gia AFL dang xuat "tp1/2" cua lan upload nay). Thieu du lieu gia TP thi fallback ve cach cu.
    const trongSo = tinhTrongSoDaChot(cu.tp_da_cham);
    let laiLoPct = (giaBan / giaMua - 1) * 100;
    if (trongSo.daChot.length) {
      const giaTaiMoc = {
        tp1: duongSo(cu.vao_tp1) ?? duongSo(cu.tp1) ?? duongSo(m.tp1),
        tp2: duongSo(cu.vao_tp2) ?? duongSo(cu.tp2) ?? duongSo(m.tp2),
      };
      let tong = trongSo.conLai * (giaBan / giaMua - 1);
      let tinhDuoc = true;
      for (const [khoa, trongso] of trongSo.daChot) {
        const p = giaTaiMoc[khoa];
        if (!(p > 0)) {
          tinhDuoc = false;
          break;
        }
        tong += trongso * (p / giaMua - 1);
      }
      if (tinhDuoc) laiLoPct = tong;
    }

    ketQua.push({
      ma: m.ma,
      ngay_mua: cu.ngay_mua_txt,
      gia_mua: giaMua,
      ngay_ban: ngayBan,
      gia_ban: giaBan,
      lai_lo_pct: laiLoPct,
      so_phien: cu.so_phien_giu != null ? Number(cu.so_phien_giu) : null,
      ly_do: lyDo,
      da_cham_tp: cu.tp_da_cham || null,
      vong: 1,
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

// Chuyen sang lib/ngayChamMoc.js (ham thuan, khong dung DB) de dung duoc ca o component client - giu re-export
// o day de cac cho dang "import { ngayChamTP } from '@/lib/lenhDaDong'" (vd /api/backfill-tp3) khong phai sua.
export { ngayChamTP } from "@/lib/ngayChamMoc";

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

// DOI SOAT khi tin hieu doi chieu TRONG PHIEN (vd upload luc dang BAN, sau ATC gia keo len lai nen tra ve NAM GIU):
//  1. Ma dang giu lai dung lenh cu (cung ngay mua) ma da bi ghi la dong (ly do BAN/THOAT) -> lenh chua dong that: XOA dong sai.
//     (Lenh chot du TP3 - ly do TP3 - khong bi dong vi van con 15% giu chay.)
//  2. Ma van BAN/khong giu trong ngay do -> cap nhat gia ban/lai lo theo gia moi nhat (gia sau ATC moi la gia chot that).
// apDung = false: chi liet ke se lam gi. ngayHomNay = "yyyy-mm-dd" (ngay giao dich cua lan upload) hoac null de bo qua buoc 2.
export async function doiSoatLenhDaDong({ apDung = true, ngayHomNay = null } = {}) {
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const dkMoLai = `FROM lenh_da_dong d JOIN tin_hieu t ON t.ma = d.ma
         AND (
           (d.vong = 1 AND t.ngay_mua = d.ngay_mua)
           OR (d.vong = 2 AND t.dang_giu_moi IS TRUE AND t.ngay_mua_moi = d.ngay_mua)
           OR (d.vong = 3 AND t.ngay_mua = d.ngay_mua AND t.tp_da_cham = 'TP3')
         )
       WHERE t.tin IN ('MUA', 'NAM GIU') AND d.ly_do IN ('BAN', 'THOAT', 'CAT_LO', 'BAO_VE_LAI')`;
    const moLai = apDung
      ? await client.query(`DELETE FROM lenh_da_dong WHERE id IN (SELECT d.id ${dkMoLai}) RETURNING ma, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, to_char(ngay_ban, 'YYYY-MM-DD') AS ngay_ban, gia_ban, lai_lo_pct`)
      : await client.query(`SELECT d.ma, to_char(d.ngay_mua, 'YYYY-MM-DD') AS ngay_mua, to_char(d.ngay_ban, 'YYYY-MM-DD') AS ngay_ban, d.gia_ban, d.lai_lo_pct ${dkMoLai}`);
    // Cap nhat gia chot theo gia moi nhat (vd sau ATC) cho lenh dong DUNG TRONG NGAY hom nay: tinh lai bang JS (dung
    // ham tinh trong so TP1/TP2 giong luc ghi lan dau) chu KHONG dung cong thuc gia/gia_mua-1 tho trong SQL nua -
    // neu khong se ghi de mat phan da tinh co trong so cua lenh da tung cham TP1/TP2.
    let capNhat = [];
    if (apDung && ngayHomNay) {
      const { rows: ungVien } = await client.query(
        `SELECT d.id, d.ma, d.gia_mua, d.da_cham_tp, d.vong, t.gia, t.vao_tp1, t.vao_tp2, t.tp1, t.tp2
         FROM lenh_da_dong d JOIN tin_hieu t ON t.ma = d.ma
         WHERE d.ly_do IN ('BAN', 'THOAT', 'CAT_LO', 'BAO_VE_LAI') AND d.ngay_ban = $1::date AND t.tin IN ('BAN', 'TRUNG LAP')
           AND t.gia > 0 AND d.gia_mua > 0 AND d.gia_ban IS DISTINCT FROM t.gia`,
        [ngayHomNay]
      );
      if (ungVien.length) {
        const moi = ungVien.map((d) => ({ id: d.id, ma: d.ma, gia_ban: Number(d.gia), lai_lo_pct: tinhLaiLoTheoGiaMoi(d) }));
        await client.query(
          `UPDATE lenh_da_dong AS d SET gia_ban = m.gia_ban, lai_lo_pct = m.lai_lo_pct
           FROM unnest($1::int[], $2::float8[], $3::float8[]) AS m(id, gia_ban, lai_lo_pct)
           WHERE d.id = m.id`,
          [moi.map((m) => m.id), moi.map((m) => m.gia_ban), moi.map((m) => m.lai_lo_pct)]
        );
        capNhat = moi.map((m) => m.ma);
      }
    }
    return { moLai: moLai.rows, capNhat };
  });
}

// LENH MUA MOI (vong 2) SAU TP3 dong lai. Lenh moi co gia mua / Stop-loss / ngay mua RIENG, tach khoi lenh goc.
// dsMoi: [{ ma, tin, gia, dang_giu_moi, cat_moi }] cua lan upload nay; banGhiCuTheoMa: dong DB TRUOC khi ghi de (co dang_giu_moi,
// gia_mua_moi, stop_moi, ngay_mua_moi_txt). Chi xet ma lan truoc DANG giu lenh moi.
//  - Lenh goc bi Ban / thoat, hoac AFL bao cat_moi > 0: dong (cat_moi = 1: cham Stop-loss rieng, khop tai Stop-loss hoac gia thap hon).
//  - AFL het bao giu lenh moi ma khong co su kien dong: neu vao lenh HOM NAY thi coi la tin hieu trong phien doi chieu -> khong ghi;
//    neu vao tu truoc do thi ghi dong theo gia hien tai.
export function phatHienDongMuaMoi({ dsMoi, banGhiCuTheoMa, ngayBan }) {
  const ketQua = [];
  for (const m of dsMoi) {
    const cu = banGhiCuTheoMa[m.ma];
    if (!cu || cu.dang_giu_moi !== true || !cu.ngay_mua_moi_txt || !(Number(cu.gia_mua_moi) > 0)) continue;
    const giaBan = Number(m.gia);
    if (!(giaBan > 0)) continue;
    const gocConGiu = dangGiu(m.tin);
    const catRieng = Number(m.cat_moi) === 1;
    const catTheoGoc = !gocConGiu || Number(m.cat_moi) === 2;
    if (m.dang_giu_moi === true && gocConGiu) continue; // van dang giu lenh moi
    let lyDo;
    if (catRieng) lyDo = "CAT_LO";
    else if (catTheoGoc) lyDo = m.tin === "BAN" ? "BAN" : "THOAT";
    else if (cu.ngay_mua_moi_txt >= ngayBan) continue; // vao lenh hom nay roi mat tin hieu: doi chieu trong phien, khong ghi
    else lyDo = "THOAT";
    const giaMua = Number(cu.gia_mua_moi);
    const stop = Number(cu.stop_moi);
    const giaThoat = catRieng && stop > 0 ? Math.min(stop, giaBan) : giaBan;
    ketQua.push({
      ma: m.ma,
      ngay_mua: cu.ngay_mua_moi_txt,
      gia_mua: giaMua,
      ngay_ban: ngayBan,
      gia_ban: giaThoat,
      lai_lo_pct: (giaThoat / giaMua - 1) * 100,
      so_phien: null,
      ly_do: lyDo,
      da_cham_tp: null,
      phan_chot_pct: 100,
      vong: 2,
    });
  }
  return ketQua;
}

// Ghi 1 lan bang unnest(); UNIQUE (ma, ngay_mua, vong) + DO NOTHING nen upload lap khong tao dong trung.
export async function ghiLenhDaDong(ds) {
  if (!ds.length) return 0;
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const cot = (k) => ds.map((x) => x[k]);
    const { rowCount } = await client.query(
      `INSERT INTO lenh_da_dong (ma, ngay_mua, gia_mua, ngay_ban, gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp, phan_chot_pct, vong)
       SELECT * FROM unnest($1::text[], $2::date[], $3::float8[], $4::date[], $5::float8[], $6::float8[], $7::float8[], $8::text[], $9::text[], $10::float8[], $11::int2[])
       ON CONFLICT (ma, ngay_mua, vong) DO NOTHING`,
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
        ds.map((x) => x.vong ?? 1),
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
              gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp, phan_chot_pct, vong
       FROM lenh_da_dong ORDER BY ngay_ban DESC, ma ASC LIMIT 1000`
    );
    return rows;
  });
}

// Toan bo lenh DA DONG cua 1 ma (moi vong), sap xep theo thoi gian - dung cho "Nhat ky giao dich" o trang chi tiet ma.
export async function layLichSuGiaoDichMa(ma) {
  if (!ma) return [];
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      `SELECT ma, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, gia_mua, to_char(ngay_ban, 'YYYY-MM-DD') AS ngay_ban,
              gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp, phan_chot_pct, vong
       FROM lenh_da_dong WHERE ma = $1 ORDER BY ngay_mua ASC, vong ASC, ngay_ban ASC`,
      [ma.toUpperCase()]
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
