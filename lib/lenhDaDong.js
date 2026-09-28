// LENH DA DONG: web chi luu TRANG THAI HIEN TAI cua tung ma (bang tin_hieu) nen khi 1 lenh ban xong
// thi lich su lenh do bien mat. Moi lan upload, so sanh trang thai CU voi MOI: ma tu NAM GIU chuyen
// sang BAN / TRUNG LAP = 1 lenh vua dong -> ghi vao bang lenh_da_dong (ket qua that de theo doi).
//
// LUU Y do chinh xac: AFL khong xuat ngay/gia ban, nen ngay ban = ngay giao dich gan nhat luc upload
// (T7/CN -> thu 6), gia ban = gia hien tai cua lan upload do (xap xi gia dong cua phien ban).
// Chi tinh cac ma da NAM GIU tu phien truoc (MUA -> TRUNG LAP trong cung ngay la tin hieu chap chon
// giua phien, khong phai lenh that).
import { withDb, daoDamBangLenhDaDong, daoDamBangLenhMuaChot } from "@/lib/db";
import { TY_LE_CHOT, TY_LE_CHOT_CU, TY_LE_CHOT_KET_THUC } from "@/lib/tyLeChot";
import { phatHienChotLoiTungPhan, tinhDongPhanConLai, khoaTP } from "@/lib/chotLoiTungPhan";
import { layLichPhien } from "@/lib/lichSuGia";
import { boSungSoPhienDong } from "@/lib/soPhienGiu";
import { canChoKhung, xuLyLenhTheoDoi } from "@/lib/khungGioVaoLenh";

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
  // TP3 chi la moc tham khao (cach 2 TP + giu den BAN): da chot TP1 + TP2, phan con lai van la 40%.
  if (tpDaCham === "TP2" || tpDaCham === "TP3")
    return { daChot: [["tp1", TY_LE_CHOT.tp1], ["tp2", TY_LE_CHOT.tp2]], conLai: 100 - TY_LE_CHOT.tp1 - TY_LE_CHOT.tp2 };
  if (tpDaCham === "TP1") return { daChot: [["tp1", TY_LE_CHOT.tp1]], conLai: 100 - TY_LE_CHOT.tp1 };
  return { daChot: [], conLai: 100 };
}

// Tinh lai lai/lo cho 1 dong lenh_da_dong DA CO SAN khi gia moi nhat thay doi (dung khi cung 1 ngay co nhieu lan
// upload, vd sau ATC) - GIU DUNG cach tinh ban dau: vong 1 co cham TP1/TP2 (chua TP3) thi tinh co trong so; cac
// truong hop con lai (vong 2, vong 3, hoac vong 1 chua tung cham TP) la ty le gia don gian nhu luc ghi lan dau.
// d: { gia_mua, da_cham_tp, vong, phan_chot_pct, gia (gia moi nhat), vao_tp1, vao_tp2, tp1, tp2 }.
function tinhLaiLoTheoGiaMoi(d) {
  const giaMua = Number(d.gia_mua);
  const giaMoi = Number(d.gia);
  const donGian = (giaMoi / giaMua - 1) * 100;
  // Dong chi la PHAN CON LAI (chot loi tung phan, phan_chot_pct < 100) hoac dong TP1/TP2: lai/lo la ty le gia cua phan do, khong tinh gop.
  if (Number(d.phan_chot_pct) < 100) return donGian;
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
export function phatHienLenhDong({ dsMoi, banGhiCuTheoMa, ngayBan, daGhi = new Set() }) {
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
    // 4 = thoat Kijun sau TP2, 5 = chot du TP3 (lenh KET THUC o TP3) - cach quan ly moi tu 2026-09-25 (engine/AFL: ly_do_ban).
    const lyDo =
      m.ly_do_ban === 5 ? "CHOT_TP3" : m.ly_do_ban === 4 ? "THOAT_KIJUN" : m.ly_do_ban === 3 ? "BAO_VE_LAI" : m.ly_do_ban === 2 ? "CAT_LO" : m.tin === "BAN" ? "BAN" : "THOAT";

    if (cu.tp_da_cham === "TP3" && daGhi.has(khoaTP(cu.ma, cu.ngay_mua_txt, 3))) {
      // LENH CU con phan giu chay (cach 30/30/25/15): da co dong rieng ghi luc cham TP3 (85% coi nhu da chot). Day la PHAN CON LAI (15%) THAT SU dong bay gio.
      // Lenh theo cach 2 TP + giu den BAN (khong ghi dong TP3) khong vao nhanh nay: phan con lai 40% ghi o nhanh tinhDongPhanConLai ben duoi; cach "ket thuc o TP3" xem CHOT_TP3.
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
        phan_chot_pct: TY_LE_CHOT_CU.giu,
        vong: 3,
      });
      continue;
    }

    if (lyDo === "CHOT_TP3") {
      // LENH KET THUC O TP3 (chot 30/30/40): ghi cac dong TP con thieu (TP1, TP2, TP3) tai DUNG muc TP, TP3 = 40% cuoi cung; khong ghi them dong "dong lenh"
      // chung (tranh tinh trung). Khong dung gia hien tai vi gia da co the chay xa hon TP3 sau khi khop.
      const cascade = phatHienChotLoiTungPhan({
        dsMoi: [{ ma: m.ma, tin: "NAM GIU", tp_da_cham: "TP3", ngay_mua: cu.ngay_mua_txt, so_phien_giu: cu.so_phien_giu, tp1: m.tp1, tp2: m.tp2, tp3: m.tp3 }],
        banGhiCuTheoMa: { [m.ma]: cu },
        ngayBan,
        daGhi,
        ketThucTP3: true,
      });
      for (const d of cascade.dong) ketQua.push(d);
      for (const { cu: c3, m: m3 } of cascade.tp3KieuCu) {
        // Vi the da cham TP1/TP2 tu TRUOC khi web ghi tung phan: 1 dong gop TP1+TP2+TP3 (30/30/40 = 100% vi the, lenh ket thuc).
        const tp = [1, 2, 3].map((i) => (Number(c3[`vao_tp${i}`]) > 0 ? c3[`vao_tp${i}`] : m3[`tp${i}`]));
        const r = tinhChotTP3({ giaMua: giaMua, tp1: tp[0], tp2: tp[1], tp3: tp[2], ngayMua: cu.ngay_mua_txt, ngayBan, soPhien: cu.so_phien_giu != null ? Number(cu.so_phien_giu) : null, tyLe: TY_LE_CHOT_KET_THUC });
        if (r) ketQua.push({ ma: m.ma, ...r });
      }
      if (cascade.dong.length || cascade.tp3KieuCu.length) continue;
      // Khong tinh duoc dong nao (thieu gia TP hop le) -> roi ve dong "dong lenh" thuong ben duoi de khong mat ket qua.
    }

    // KIEU MOI (xem lib/chotLoiTungPhan.js): vi the da cham TP1/TP2 va cac moc do DA duoc ghi thanh dong rieng luc cham -> lan dong nay chi
    // ghi PHAN CON LAI (70%/40%), lai/lo la ty le gia cua phan do, khong gop lai TP1/TP2 nua (tranh tinh trung).
    const conLai = tinhDongPhanConLai({ cu, giaMua, giaBan, daGhi });
    if (conLai) {
      ketQua.push({
        ma: m.ma,
        ngay_mua: cu.ngay_mua_txt,
        gia_mua: giaMua,
        ngay_ban: ngayBan,
        gia_ban: giaBan,
        lai_lo_pct: conLai.lai_lo_pct,
        so_phien: cu.so_phien_giu != null ? Number(cu.so_phien_giu) : null,
        ly_do: lyDo,
        da_cham_tp: cu.tp_da_cham || null,
        phan_chot_pct: conLai.phan_chot_pct,
        vong: 1,
      });
      continue;
    }

    // KIEU CU (chua co dong TP1/TP2 rieng): tinh lai/lo co trong so neu da cham TP1/TP2 (uu tien gia TP dong bang tren web, "vao_tp1/2";
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
// tyLe: mac dinh CACH CU (30/30/25 = 85% vi the, con 15% chay); truyen TY_LE_CHOT_KET_THUC (30/30/40 = 100%) cho lenh KET THUC o TP3 (khi AFL bat KetThucTaiTP3).
export function tinhChotTP3({ giaMua, tp1, tp2, tp3, ngayMua, ngayBan, soPhien = null, tyLe = TY_LE_CHOT_CU }) {
  const g = Number(giaMua);
  const t = [tp1, tp2, tp3].map(Number);
  if (!(g > 0) || t.some((x) => !(x > g)) || !(t[0] <= t[1] && t[1] <= t[2])) return null;
  const w = [tyLe.tp1, tyLe.tp2, tyLe.tp3];
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

// CHOT LOI TUNG PHAN (TP1 / TP2 / TP3) - ghi 1 dong lenh da dong NGAY LUC VUA CHAM moc (ma van dang giu). dsMoi: [{ ma, tin, tp_da_cham,
// ngay_mua (yyyy-mm-dd), so_phien_giu, tp1, tp2, tp3 }] cua lan upload nay; daGhi: Set khoa "MA|ngay_mua|vong" cua cac dong TP1/TP2 da co (layTPDaGhi).
// Vi the moi (chua cham TP nao khi web bat dau theo doi) ghi tung dong TP1 (30%), TP2 (30%), TP3 (25%) - xem lib/chotLoiTungPhan.js. Vi the da cham
// TP1/TP2 tu TRUOC (chua co dong tuong ung) giu KIEU CU: chi ghi 1 dong gop 85% khi cham TP3, ben duoi. Lenh da cham TP3 tu truoc nua duoc nap 1 lan
// bang /api/backfill-tp3, cac lenh dang o TP1/TP2 nap bu bang /api/backfill-tp12.
export function phatHienChotLoi({ dsMoi, banGhiCuTheoMa, ngayBan, daGhi = new Set() }) {
  const { dong, tp3KieuCu } = phatHienChotLoiTungPhan({ dsMoi, banGhiCuTheoMa, ngayBan, daGhi });
  const ketQua = [...dong];
  for (const { cu, m } of tp3KieuCu) {
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

// Cac dong TP1/TP2 (vong 5/6) da ghi cho cac ma trong lan upload nay - Set khoa "MA|ngay_mua|vong" (xem khoaTP trong chotLoiTungPhan.js).
export async function layTPDaGhi(dsMa) {
  if (!dsMa?.length) return new Set();
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      // Gom ca dong TP3 CACH CU (vong 1, ly_do TP3): khoa "MA|ngay_mua|1" trung khoaTP(ma, ngay_mua, 3) - de biet lenh nao da co dong TP3 (giu kieu cu) va lenh nao chua.
      `SELECT ma, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, vong FROM lenh_da_dong WHERE (vong IN (5, 6) OR (vong = 1 AND ly_do = 'TP3')) AND ma = ANY($1::text[])`,
      [dsMa]
    );
    return new Set(rows.map((r) => `${r.ma}|${r.ngay_mua}|${r.vong}`));
  });
}

// Ma DANG GIU da cham TP1/TP2 (chua TP3) - de nap bu 1 lan cac dong TP tuong ung (xem /api/backfill-tp12; dong nao da co thi bo qua).
export async function layUngVienTP12() {
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      `SELECT t.ma, t.tin, t.gia_mua, t.gia_vao_web, t.tp1, t.tp2, t.vao_tp1, t.vao_tp2, t.tp_da_cham, t.so_phien_giu,
              to_char(t.ngay_mua, 'YYYY-MM-DD') AS ngay_mua_txt
       FROM tin_hieu t
       WHERE t.tin IN ('MUA', 'NAM GIU') AND t.tp_da_cham IN ('TP1', 'TP2') AND t.ngay_mua IS NOT NULL`
    );
    return rows;
  });
}

// LENH CU con giu co dong "chot TP3" kieu cu (gop 85% theo cach 30/30/25 + 15% chay) - de CHUYEN sang cach moi (30% TP1 + 30% TP2, 40% giu den tin hieu BAN), xem
// /api/chuyen-tp3-cu. Chi lay lenh VAN DANG GIU (tin_hieu cung ngay mua, MUA / NAM GIU): lenh cu da ket thuc giu nguyen lich su.
export async function layTP3CuDangGiu() {
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      `SELECT d.id, d.ma, to_char(d.ngay_mua, 'YYYY-MM-DD') AS ngay_mua_txt, d.gia_mua AS gia_mua_lenh, d.phan_chot_pct, to_char(d.ngay_ban, 'YYYY-MM-DD') AS ngay_ban_tp3,
              d.gia_ban, d.lai_lo_pct, t.tin, t.tp1, t.tp2, t.vao_tp1, t.vao_tp2, t.so_phien_giu
       FROM lenh_da_dong d JOIN tin_hieu t ON t.ma = d.ma AND t.ngay_mua = d.ngay_mua AND t.tin IN ('MUA', 'NAM GIU')
       WHERE d.vong = 1 AND d.ly_do = 'TP3' AND d.phan_chot_pct >= 50
       ORDER BY d.ma`
    );
    return rows;
  });
}

// Xoa cac dong TP3 kieu cu (theo id) CHI KHI lenh do da co du dong TP1 (vong 5) va TP2 (vong 6) - tra ve cac dong da xoa (ban sao de khoi phuc neu can).
export async function xoaTP3CuDaCoTP12(ids) {
  if (!ids?.length) return [];
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      `DELETE FROM lenh_da_dong d
       WHERE d.id = ANY($1::int[]) AND d.vong = 1 AND d.ly_do = 'TP3'
         AND EXISTS (SELECT 1 FROM lenh_da_dong a WHERE a.ma = d.ma AND a.ngay_mua = d.ngay_mua AND a.vong = 5)
         AND EXISTS (SELECT 1 FROM lenh_da_dong b WHERE b.ma = d.ma AND b.ngay_mua = d.ngay_mua AND b.vong = 6)
       RETURNING d.id, d.ma, to_char(d.ngay_mua, 'YYYY-MM-DD') AS ngay_mua, d.gia_mua, to_char(d.ngay_ban, 'YYYY-MM-DD') AS ngay_ban, d.gia_ban, d.lai_lo_pct,
                 d.so_phien, d.ly_do, d.da_cham_tp, d.phan_chot_pct, d.vong`,
      [ids]
    );
    return rows;
  });
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
// CHOT BAN THEO KHUNG GIO (2026-09-28): chi lenh dang THEO DOI (chot_luc NULL - ghi ngoai khung gio vao lenh) moi con mo lai / doi gia. Den gio MO khung ke tiep (tinh tu luc ghi)
// thi CHOT: gia ban = gia lan cap nhat nay, ngay ban = phien hien tai, tu do giu nguyen (ke ca khi tin hieu quay lai nam giu). Lenh ghi trong khung da chot ngay tu luc ghi.
export async function doiSoatLenhDaDong({ apDung = true, ngayHomNay = null, bayGio = new Date() } = {}) {
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const dkMoLai = `FROM lenh_da_dong d JOIN tin_hieu t ON t.ma = d.ma
         AND (
           (d.vong = 1 AND t.ngay_mua = d.ngay_mua)
           OR (d.vong = 2 AND t.dang_giu_moi IS TRUE AND t.ngay_mua_moi = d.ngay_mua)
           OR (d.vong = 3 AND t.ngay_mua = d.ngay_mua AND t.tp_da_cham = 'TP3')
           OR (d.vong = 4 AND t.dang_giu_giua IS TRUE AND t.ngay_mua_giua = d.ngay_mua)
         )
       WHERE t.tin IN ('MUA', 'NAM GIU') AND d.ly_do IN ('BAN', 'THOAT', 'CAT_LO', 'BAO_VE_LAI', 'THOAT_KIJUN') AND d.chot_luc IS NULL`;
    const moLai = apDung
      ? await client.query(`DELETE FROM lenh_da_dong WHERE id IN (SELECT d.id ${dkMoLai}) RETURNING ma, to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua, to_char(ngay_ban, 'YYYY-MM-DD') AS ngay_ban, gia_ban, lai_lo_pct`)
      : await client.query(`SELECT d.ma, to_char(d.ngay_mua, 'YYYY-MM-DD') AS ngay_mua, to_char(d.ngay_ban, 'YYYY-MM-DD') AS ngay_ban, d.gia_ban, d.lai_lo_pct ${dkMoLai}`);
    // Lenh dang THEO DOI con lai (khong mo lai): gia ban tam tinh = gia moi nhat, da den gio mo khung ke tiep thi CHOT. Lai/lo tinh lai bang JS (dung ham tinh trong so
    // TP1/TP2 giong luc ghi lan dau) chu KHONG dung cong thuc gia/gia_mua-1 tho trong SQL - neu khong se ghi de mat phan da tinh co trong so cua lenh da tung cham TP1/TP2.
    // CAT LO CHI TRONG KHUNG GIO (xuLyLenhTheoDoi): cat lo / hoa von chi chot khi gia <= muc cat lo trong khung; het khung ma chua cham -> HUY ban, lenh chuyen thanh lenh WEB
    // GIU (lenh_mua_chot) voi stop / TP luc mua - he thong da coi lenh do la dong nen web tu quan ly tiep.
    let capNhat = [];
    let daChot = [];
    let daHuy = [];
    if (apDung) {
      const { rows: ungVien } = await client.query(
        `SELECT d.id, d.ma, to_char(d.ngay_mua, 'YYYY-MM-DD') AS ngay_mua, d.gia_mua, d.da_cham_tp, d.vong, d.phan_chot_pct, d.tao_luc, d.ly_do, d.muc_cat_lo, d.thay_trong_khung,
                d.stop_goc, d.tp1_goc, d.tp2_goc, d.tp3_goc, t.gia, t.vao_tp1, t.vao_tp2, t.tp1, t.tp2
         FROM lenh_da_dong d JOIN tin_hieu t ON t.ma = d.ma
         WHERE d.chot_luc IS NULL AND t.gia > 0 AND d.gia_mua > 0`
      );
      const moi = [];
      const huy = [];
      for (const d of ungVien) {
        const kq = xuLyLenhTheoDoi(d, Number(d.gia), bayGio);
        if (kq.ketQua === "huy") huy.push(d);
        else moi.push({ id: d.id, ma: d.ma, gia_ban: Number(d.gia), lai_lo_pct: tinhLaiLoTheoGiaMoi(d), chot: kq.ketQua === "chot", thay: kq.thayTrongKhung === true });
      }
      if (moi.length) {
        await client.query(
          `UPDATE lenh_da_dong AS d SET gia_ban = m.gia_ban, lai_lo_pct = m.lai_lo_pct,
                  chot_luc = CASE WHEN m.chot THEN now() ELSE NULL END,
                  ngay_ban = CASE WHEN m.chot THEN COALESCE($6::date, d.ngay_ban) ELSE d.ngay_ban END,
                  thay_trong_khung = d.thay_trong_khung OR m.thay
           FROM unnest($1::int[], $2::float8[], $3::float8[], $4::boolean[], $5::boolean[]) AS m(id, gia_ban, lai_lo_pct, chot, thay)
           WHERE d.id = m.id`,
          [moi.map((m) => m.id), moi.map((m) => m.gia_ban), moi.map((m) => m.lai_lo_pct), moi.map((m) => m.chot), moi.map((m) => m.thay), ngayHomNay]
        );
        capNhat = moi.map((m) => m.ma);
        daChot = moi.filter((m) => m.chot).map((m) => m.ma);
      }
      if (huy.length) {
        await daoDamBangLenhMuaChot(client);
        await client.query(`DELETE FROM lenh_da_dong WHERE id = ANY($1::int[])`, [huy.map((d) => d.id)]);
        await client.query(
          `INSERT INTO lenh_mua_chot (ma, loai, ngay_mua, gia_mua, stop_loss, tp1, tp2, tp3, tp_da_cham, web_giu, trang_thai)
           SELECT m.ma, m.loai, m.ngay_mua, m.gia_mua, m.stop_loss, m.tp1, m.tp2, m.tp3, m.tp_da_cham, true, 'mo'
           FROM unnest($1::text[], $2::text[], $3::date[], $4::float8[], $5::float8[], $6::float8[], $7::float8[], $8::float8[], $9::text[])
                AS m(ma, loai, ngay_mua, gia_mua, stop_loss, tp1, tp2, tp3, tp_da_cham)
           ON CONFLICT (ma, loai, ngay_mua) DO UPDATE SET trang_thai = 'mo', web_giu = true, cap_nhat_luc = now()`,
          [
            huy.map((d) => d.ma),
            huy.map((d) => (Number(d.vong) === 4 ? "giua" : "goc")),
            huy.map((d) => d.ngay_mua),
            huy.map((d) => Number(d.gia_mua)),
            huy.map((d) => d.stop_goc ?? d.muc_cat_lo),
            huy.map((d) => d.tp1_goc),
            huy.map((d) => d.tp2_goc),
            huy.map((d) => d.tp3_goc),
            huy.map((d) => (/^TP[12]$/.test(d.da_cham_tp ?? "") ? d.da_cham_tp : d.ly_do === "BAO_VE_LAI" ? "TP2" : null)),
          ]
        );
        daHuy = huy.map((d) => d.ma);
      }
    }
    return { moLai: moLai.rows, capNhat, daChot, daHuy };
  });
}

// Lenh MUA MOI dong / chot tung phan: ham thuan o lib/dongLenhMuaMoi.js (test duoc bang node).
export { phatHienDongMuaThem, phatHienChotLoiMuaMoi, VONG_TP_MUA_MOI } from "@/lib/dongLenhMuaMoi";
import { phatHienDongMuaThem } from "@/lib/dongLenhMuaMoi";

// Ten goi mong, giu tuong thich nguoc voi cac cho dang "import { phatHienDongMuaMoi }".
export function phatHienDongMuaMoi({ dsMoi, banGhiCuTheoMa, ngayBan }) {
  return phatHienDongMuaThem({ dsMoi, banGhiCuTheoMa, ngayBan, vong: 2, cotTienTo: "moi" });
}

// MUA THEM GIUA CHUNG (vi the doc lap voi vong 2, mo TRUOC khi cham du TP3) - bo sung 2026-09-23.
export function phatHienDongMuaThemGiuaChung({ dsMoi, banGhiCuTheoMa, ngayBan }) {
  return phatHienDongMuaThem({ dsMoi, banGhiCuTheoMa, ngayBan, vong: 4, cotTienTo: "giua" });
}

// Ghi 1 lan bang unnest(); UNIQUE (ma, ngay_mua, vong) + DO NOTHING nen upload lap khong tao dong trung.
// trongKhung: luc ghi dang trong khung gio vao lenh? Ban theo tin hieu / cat lo ghi NGOAI khung -> chot_luc NULL (THEO DOI, cho khung ke tiep - xem doiSoatLenhDaDong);
// con lai (trong khung, chot TP1/TP2/TP3) chot ngay. Mac dinh true: cac route nap bu / chuyen doi du lieu cu ghi nhu da chot.
export async function ghiLenhDaDong(ds, { trongKhung = true } = {}) {
  if (!ds.length) return 0;
  const bayGio = new Date().toISOString();
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const cot = (k) => ds.map((x) => x[k]);
    const { rowCount } = await client.query(
      `INSERT INTO lenh_da_dong (ma, ngay_mua, gia_mua, ngay_ban, gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp, phan_chot_pct, vong, chot_luc,
                                muc_cat_lo, stop_goc, tp1_goc, tp2_goc, tp3_goc, thay_trong_khung)
       SELECT * FROM unnest($1::text[], $2::date[], $3::float8[], $4::date[], $5::float8[], $6::float8[], $7::float8[], $8::text[], $9::text[], $10::float8[], $11::int2[], $12::timestamptz[],
                            $13::float8[], $14::float8[], $15::float8[], $16::float8[], $17::float8[], $18::boolean[])
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
        // choKhung: cat lo phat hien trong khung nhung co the da cham ngoai khung (catLoCanChoKhung) -> cung treo THEO DOI.
        ds.map((x) => ((!trongKhung && canChoKhung(x.ly_do)) || x.choKhung ? null : bayGio)),
        // Muc cat lo + stop / TP luc mua (chi co o dong cat lo / hoa von - de xu ly lenh THEO DOI trong khung gio, xem doiSoatLenhDaDong).
        cot("muc_cat_lo").map((v) => v ?? null),
        cot("stop_goc").map((v) => v ?? null),
        cot("tp1_goc").map((v) => v ?? null),
        cot("tp2_goc").map((v) => v ?? null),
        cot("tp3_goc").map((v) => v ?? null),
        ds.map((x) => x.choKhung === true),
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
              gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp, phan_chot_pct, vong, (chot_luc IS NULL) AS theo_doi
       FROM lenh_da_dong ORDER BY ngay_ban DESC, ma ASC LIMIT 1000`
    );
    return rows;
  }).then(boSungSoPhien);
}

// Dong thieu so_phien (lenh mua moi: luc dong khong biet so phien) duoc dem tu lich phien giao dich - xem lib/soPhienGiu.js. Chi goi nguon gia khi that su co dong thieu.
async function boSungSoPhien(rows) {
  if (!rows.some((x) => x.so_phien == null)) return rows;
  return boSungSoPhienDong(rows, await layLichPhien());
}

// Ngay (yyyy-mm-dd, gio VN) web BAT DAU ghi nhan lenh da dong = ngay dong dau tien duoc tao trong bang - moc bat dau cua bieu do Hieu qua dau tu (truoc
// do cac lenh da dong khong duoc luu nen chi biet cac lenh con song sot, ve tu day se lech). Null neu bang rong.
export async function layNgayBatDauGhiNhan() {
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(`SELECT to_char(MIN(tao_luc) AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS ngay FROM lenh_da_dong`);
    return rows[0]?.ngay ?? null;
  });
}

// Cac dong cua nhung LENH co su kien (chot TP / dong lenh) trong phien `ngay` ("yyyy-mm-dd") HOAC dang THEO DOI ban (chua chot - ke ca tu phien truoc, cho khung gio) - gom ca
// cac dong cu cua chinh lenh do de tinh ket qua CA LENH. Dung cho o "Top co hoi dang chu y" o trang dau (lib/coHoiHomNay.js).
export async function layLenhCoSuKienNgay(ngay) {
  if (!ngay) return [];
  return withDb(async (client) => {
    await daoDamBangLenhDaDong(client);
    const { rows } = await client.query(
      `SELECT d.ma, to_char(d.ngay_mua, 'YYYY-MM-DD') AS ngay_mua, d.gia_mua, to_char(d.ngay_ban, 'YYYY-MM-DD') AS ngay_ban,
              d.gia_ban, d.lai_lo_pct, d.so_phien, d.ly_do, d.da_cham_tp, d.phan_chot_pct, d.vong, (d.chot_luc IS NULL) AS theo_doi, d.tao_luc
       FROM lenh_da_dong d
       WHERE EXISTS (SELECT 1 FROM lenh_da_dong e WHERE e.ma = d.ma AND e.ngay_mua = d.ngay_mua AND (e.ngay_ban = $1::date OR e.chot_luc IS NULL))
       ORDER BY d.ma, d.ngay_mua, d.vong`,
      [ngay]
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
              gia_ban, lai_lo_pct, so_phien, ly_do, da_cham_tp, phan_chot_pct, vong, (chot_luc IS NULL) AS theo_doi
       FROM lenh_da_dong WHERE ma = $1 ORDER BY ngay_mua ASC, vong ASC, ngay_ban ASC`,
      [ma.toUpperCase()]
    );
    return rows;
  }).then(boSungSoPhien);
}

// Thong ke tong hop cho trang Lenh da dong: tinh THEO TUNG LENH (gom cac dong chot tung phan cua cung 1 lenh) - xem lib/thongKeLenh.js.
export { thongKeLenhDaDong } from "@/lib/thongKeLenh";
