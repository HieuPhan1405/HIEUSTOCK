import { withDb, daoDamBangTinHieu } from "@/lib/db";
import { guiTinNhanZalo } from "@/lib/zalo";
import { tinhGiaVaoWeb, tinhGiaMuaThemWeb } from "@/lib/giaVaoWeb";
import { tinhVungLenh, chuoiVung } from "@/components/dungChung";
import {
  phatHienLenhDong,
  phatHienChotTP3,
  phatHienDongMuaMoi,
  phatHienDongMuaThemGiuaChung,
  ghiLenhDaDong,
  doiSoatLenhDaDong,
  dangTrongPhien,
  ngayGiaoDichVN,
} from "@/lib/lenhDaDong";
import { xoaBoNhoTinHieu } from "@/lib/tinHieu";

// Nhan CSV tu script day_du_lieu_len_web.py (duoc xuat boi AFL
// amibroker/7_Export_LenWeb.afl). Header CSV (45 cot; 7 cot cuoi gia_kich_hoat,
// moc_kich_hoat, moc_gia, moc_loai, moc_cach_pct, diem_neu_vuot, che_do_vao la MOI - CSV cu
// (38/40 cot) van nhan binh thuong, cac cot thieu de trong):
// ma,tin,diem,trend,mom,dt,adx,gia,doi,rs_vni,breadth_nganh,kijun,gg_top,gg_bot,dinh_52t,
// stop_loss,mat_than,tp1,tp2,tp3,gtgd_tb20,fvg_ok,so_phien_giu,lai_lo_pct,sanyaku,
// kumo_twist,ngay_bien_doi,von_hoa,gia_mua,ngay_mua,ban_bot,san,nganh,tp_da_cham,
// diem_rank,diem_confidence,khoi_luong_tb20,giai_ngan,gia_kich_hoat,moc_kich_hoat,
// moc_gia,moc_loai,moc_cach_pct,diem_neu_vuot,che_do_vao,loai_vao,cho_phien_sau,
// mua_moi,dang_giu_moi,cat_moi,gia_mua_moi,stop_moi,tp1_moi,tp2_moi,tp3_moi,ngay_mua_moi,
// ly_do_ban,dang_bao_ve_lai,stop_bao_ve,
// mua_giua,dang_giu_giua,cat_giua,gia_mua_giua,stop_giua,tp1_giua,tp2_giua,tp3_giua,ngay_mua_giua
// (9 cot cuoi la vi the "Mua them giua chung" bo sung 2026-09-23 - doc lap voi vong 2/mua_moi o
// tren, mo TRUOC khi cham du TP3, xem engine/tinhTinHieuChoMa.js. CSV cu chua co 9 cot nay van
// nhan binh thuong, cac cot thieu de trong.)

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// Tra ve { hangDL, soDongLoi } - dong nao co SO COT KHONG KHOP header se bi
// BO QUA (khong lam hong ca lo upload). Nguyen nhan thuong gap: AmiBroker
// chay Explore da luong (multi-thread), nhieu ma cung ghi 1 luc vao file CSV
// dung chung khien vai dong bi cat/dinh vao nhau. Fix goc: dat so luong
// threads cua Analysis ve 1. Day chi la lop chan an toan phia web.
function phanTichCSV(vanBan) {
  const dong = vanBan.trim().split(/\r?\n/);
  if (dong.length === 0) return { hangDL: [], soDongLoi: 0 };
  const header = dong[0].split(",").map((h) => h.trim());
  const ketQua = [];
  let soDongLoi = 0;
  for (let i = 1; i < dong.length; i++) {
    if (!dong[i].trim()) continue;
    const cot = dong[i].split(",");
    if (cot.length !== header.length) {
      soDongLoi++;
      continue;
    }
    const hang = {};
    header.forEach((ten, idx) => (hang[ten] = cot[idx]));
    ketQua.push(hang);
  }
  return { hangDL: ketQua, soDongLoi };
}

function soFloat(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function soBool(v) {
  return v === "1" || v === "true";
}

function soText(v) {
  return v || null;
}

// AFL xuat ngay theo dang "d/m/yyyy" (khong co so 0 dem truoc) - doi sang
// ISO "yyyy-mm-dd" de Postgres hieu dung kieu DATE.
function soNgayVN(v) {
  if (!v) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v.trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// Noi dung vung mua / cat lo / chot loi cho tin Zalo (lenh MUA moi chi can 3 thong tin nay).
function dongVung(h) {
  const gia = soFloat(h.gia);
  const v = tinhVungLenh({
    tin: "MUA",
    gia,
    gia_mua: soFloat(h.gia_mua) ?? gia,
    gia_kich_hoat: soFloat(h.gia_kich_hoat),
    stop_loss: soFloat(h.stop_loss),
    tp1: soFloat(h.tp1),
    tp2: soFloat(h.tp2),
    tp3: soFloat(h.tp3),
    kijun: soFloat(h.kijun),
    gg_top: soFloat(h.gg_top),
    gg_bot: soFloat(h.gg_bot),
  });
  if (!v) return `Giá: ${h.gia}`;
  const dong = [`Vùng mua: ${chuoiVung(v.mua.tu, v.mua.den)}`];
  if (v.sl) dong.push(`Cắt lỗ: ${chuoiVung(v.sl.tu, v.sl.den)}`);
  if (v.tp) dong.push(`Chốt lời: gần ${chuoiVung(v.tp.gan.tu, v.tp.gan.den)} · xa ${chuoiVung(v.tp.xa, v.tp.xa)}`);
  return dong.join("\n");
}

export async function POST(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }

  // Cho phep 1 lan upload GHI DU LIEU nhung KHONG gui Zalo - dung khi thu nghiem 1 nguon du lieu
  // moi (vd engine JS, xem engine/dich-vu/chayEngineRealTime.mjs) muon thay ket qua hien thi that
  // tren web ma chua chac chan du de bao that cho nguoi theo doi. AmiBroker/script cu khong gui
  // header nay nen hanh vi Zalo cua ho KHONG doi.
  const boQuaZalo = request.headers.get("x-skip-zalo") === "1";
  const guiZaloNeuDuocPhep = (noiDung) => (boQuaZalo ? Promise.resolve({ gui: false, ly_do: "da tat qua header x-skip-zalo" }) : guiTinNhanZalo(noiDung));

  const contentType = request.headers.get("content-type") || "";
  let vanBanCSV;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return Response.json({ loi: "Thieu file CSV trong form-data" }, { status: 400 });
    }
    vanBanCSV = await file.text();
  } else {
    vanBanCSV = await request.text();
  }

  if (!vanBanCSV || !vanBanCSV.trim()) {
    return Response.json({ loi: "Noi dung CSV rong" }, { status: 400 });
  }

  const { hangDL: hangThoRa, soDongLoi } = phanTichCSV(vanBanCSV);
  const hangDL = hangThoRa.filter((h) => h.ma);
  if (hangDL.length === 0) {
    return Response.json({ loi: "Khong doc duoc dong du lieu nao tu CSV", soDongLoi }, { status: 400 });
  }

  // Ghi 1 lan bang unnest() thay vi 1 cau INSERT rieng cho tung dong - voi
  // vai tram/nghin ma (quet toan bo thi truong) cach cu se qua cham va de
  // vuot qua thoi gian toi da cua Vercel Function.
  const cot = (ten, chuyenDoi) => hangDL.map((h) => chuyenDoi(h[ten]));
  let soDongDaXoa = 0;
  let daBoQuaXoa = false;

  // Lay tin hieu CU (truoc khi ghi de) cho dung cac ma sap upload, de sau do
  // so sanh phat hien "ma nao MOI chuyen sang MUA hom nay" (tin cu KHAC MUA,
  // tin moi = MUA) - tranh bao Zalo lap lai neu lo upload trung 1 ma nhieu lan.
  const dsMaLanNay0 = hangDL.map((h) => h.ma);
  let tinCuTheoMa = {};
  let giaiNganCuTheoMa = {};
  let banGhiCuTheoMa = {};
  await withDb(async (client) => {
    await daoDamBangTinHieu(client);
    const { rows } = await client.query(
      `SELECT ma, tin, giai_ngan, gia_vao_web, thoi_diem_vao_web, vao_stop_loss, vao_tp1, vao_tp2, vao_tp3,
              gia_mua, so_phien_giu, tp_da_cham, stop_loss, tp1, tp2, tp3,
              dang_giu_moi, gia_mua_moi, stop_moi, tp1_moi, tp2_moi, tp3_moi,
              dang_giu_giua, gia_mua_giua, stop_giua, tp1_giua, tp2_giua, tp3_giua,
              to_char(ngay_mua_moi, 'YYYY-MM-DD') AS ngay_mua_moi_txt,
              to_char(ngay_mua_giua, 'YYYY-MM-DD') AS ngay_mua_giua_txt,
              to_char(ngay_mua, 'YYYY-MM-DD') AS ngay_mua_txt
       FROM tin_hieu WHERE ma = ANY($1::text[])`,
      [dsMaLanNay0]
    );
    tinCuTheoMa = Object.fromEntries(rows.map((r) => [r.ma, r.tin]));
    giaiNganCuTheoMa = Object.fromEntries(rows.map((r) => [r.ma, r.giai_ngan]));
    banGhiCuTheoMa = Object.fromEntries(rows.map((r) => [r.ma, r]));
  });

  // GIA MUA GHI NHAN LUC MA LAN DAU CHUYEN SANG MUA (khi upload giua phien, gia
  // AmiBroker = gia MOI NHAT nen moi lan upload lai se doi theo). Web dong bang gia
  // tai lan dau thay MUA va giu nguyen trong suot thoi gian giu; xoa khi khong con
  // giu lenh, hoac khi ngay mua doi (ban roi mua lai giua 2 lan upload).
  const bayGio = new Date().toISOString();
  const giaVaoWeb = [];
  const thoiDiemVaoWeb = [];
  const vaoStopLoss = [];
  const vaoTp1 = [];
  const vaoTp2 = [];
  const vaoTp3 = [];
  for (const h of hangDL) {
    const kq = tinhGiaVaoWeb({
      tinMoi: h.tin || "TRUNG LAP",
      giaTriMoi: { gia: soFloat(h.gia), stop_loss: soFloat(h.stop_loss), tp1: soFloat(h.tp1), tp2: soFloat(h.tp2), tp3: soFloat(h.tp3) },
      ngayMuaMoi: soNgayVN(h.ngay_mua),
      cu: banGhiCuTheoMa[h.ma],
      bayGio,
      cheDoVao: h.che_do_vao,
    });
    giaVaoWeb.push(kq.gia);
    thoiDiemVaoWeb.push(kq.luc);
    vaoStopLoss.push(kq.stop_loss);
    vaoTp1.push(kq.tp1);
    vaoTp2.push(kq.tp2);
    vaoTp3.push(kq.tp3);
  }
  // LENH MUA MOI SAU TP3 / MUA THEM GIUA CHUNG: AFL xuat gia mua/Stop-loss/TP cua vi the phu giua
  // phien, gia dong cua doi theo tung lan upload. Dong bang tai lan dau thay lenh (cung ngay mua
  // rieng cua vi the phu) - giong cach dong bang gia mua cua lenh goc. Dung chung 1 ham
  // tinhGiaMuaThemWeb() (lib/giaVaoWeb.js) cho ca 2 vi the phu doc lap nay.
  const boolTriState = (v) => (v === "1" ? true : v === "0" ? false : null);
  const duong = (v) => {
    const n = soFloat(v);
    return n != null && n > 0 ? n : null;
  };
  const moiGia = [];
  const moiStop = [];
  const moiTp1 = [];
  const moiTp2 = [];
  const moiTp3 = [];
  const giuaGia = [];
  const giuaStop = [];
  const giuaTp1 = [];
  const giuaTp2 = [];
  const giuaTp3 = [];
  for (const h of hangDL) {
    const cu = banGhiCuTheoMa[h.ma];
    const moi = tinhGiaMuaThemWeb({
      dangGiuMoi: boolTriState(h.dang_giu_moi),
      ngayMuaMoi: soNgayVN(h.ngay_mua_moi),
      giaTriMoi: { gia: duong(h.gia_mua_moi), stop: duong(h.stop_moi), tp1: duong(h.tp1_moi), tp2: duong(h.tp2_moi), tp3: duong(h.tp3_moi) },
      cu: cu && { dangGiu: cu.dang_giu_moi, gia: cu.gia_mua_moi, stop: cu.stop_moi, tp1: cu.tp1_moi, tp2: cu.tp2_moi, tp3: cu.tp3_moi, ngayMuaTxt: cu.ngay_mua_moi_txt },
    });
    moiGia.push(moi.gia);
    moiStop.push(moi.stop);
    moiTp1.push(moi.tp1);
    moiTp2.push(moi.tp2);
    moiTp3.push(moi.tp3);

    const giua = tinhGiaMuaThemWeb({
      dangGiuMoi: boolTriState(h.dang_giu_giua),
      ngayMuaMoi: soNgayVN(h.ngay_mua_giua),
      giaTriMoi: { gia: duong(h.gia_mua_giua), stop: duong(h.stop_giua), tp1: duong(h.tp1_giua), tp2: duong(h.tp2_giua), tp3: duong(h.tp3_giua) },
      cu: cu && { dangGiu: cu.dang_giu_giua, gia: cu.gia_mua_giua, stop: cu.stop_giua, tp1: cu.tp1_giua, tp2: cu.tp2_giua, tp3: cu.tp3_giua, ngayMuaTxt: cu.ngay_mua_giua_txt },
    });
    giuaGia.push(giua.gia);
    giuaStop.push(giua.stop);
    giuaTp1.push(giua.tp1);
    giuaTp2.push(giua.tp2);
    giuaTp3.push(giua.tp3);
  }
  const cacMaMuaMoi = hangDL.filter((h) => (h.tin || "TRUNG LAP") === "MUA" && tinCuTheoMa[h.ma] !== "MUA");
  // Phien BO SUNG phan con lai sau khi mua tham do (giai ngan 1 phan) - bao 1 lan.
  const cacMaBoSung = hangDL.filter((h) => h.giai_ngan === "BO SUNG" && giaiNganCuTheoMa[h.ma] !== "BO SUNG");

  await withDb(async (client) => {
    await daoDamBangTinHieu(client);

    // cap_nhat_luc KHONG nam trong danh sach cot chen - dong moi se tu lay
    // gia tri DEFAULT now() cua bang, dong bi trung ma se duoc set lai now()
    // trong ON CONFLICT ben duoi. vung_tham_gia KHONG con ghi - tinh nang da
    // bi bo trong ban chien luoc FULL v16.
    await client.query(
      `INSERT INTO tin_hieu
        (ma, tin, diem, trend, mom, dt, adx, gia, doi, rs_vni, breadth_nganh,
         kijun, gg_top, gg_bot, dinh_52t,
         stop_loss, mat_than, tp1, tp2, tp3, gtgd_tb20, fvg_ok,
         so_phien_giu, lai_lo_pct, sanyaku, kumo_twist, ngay_bien_doi, von_hoa,
         gia_mua, ngay_mua, ban_bot, san, nganh, tp_da_cham,
         diem_rank, diem_confidence, khoi_luong_tb20, giai_ngan,
         gia_kich_hoat, moc_kich_hoat, moc_gia, moc_loai, moc_cach_pct, diem_neu_vuot,
         gia_vao_web, thoi_diem_vao_web, vao_stop_loss, vao_tp1, vao_tp2, vao_tp3, che_do_vao, loai_vao, cho_phien_sau,
         mua_moi, dang_giu_moi, cat_moi, gia_mua_moi, stop_moi, tp1_moi, tp2_moi, tp3_moi, ngay_mua_moi,
         ly_do_ban, dang_bao_ve_lai, stop_bao_ve,
         mua_giua, dang_giu_giua, cat_giua, gia_mua_giua, stop_giua, tp1_giua, tp2_giua, tp3_giua, ngay_mua_giua)
       SELECT * FROM unnest(
         $1::text[], $2::text[], $3::float8[], $4::float8[], $5::float8[],
         $6::float8[], $7::float8[], $8::float8[], $9::float8[], $10::float8[],
         $11::float8[], $12::float8[], $13::float8[], $14::float8[], $15::float8[],
         $16::float8[], $17::boolean[], $18::float8[], $19::float8[], $20::float8[],
         $21::float8[], $22::boolean[], $23::float8[], $24::float8[], $25::float8[],
         $26::text[], $27::boolean[], $28::text[], $29::float8[], $30::date[], $31::boolean[],
         $32::text[], $33::text[], $34::text[],
         $35::float8[], $36::float8[], $37::float8[], $38::text[],
         $39::float8[], $40::text[], $41::float8[], $42::text[], $43::float8[], $44::float8[],
         $45::float8[], $46::timestamptz[], $47::float8[], $48::float8[], $49::float8[], $50::float8[],
         $51::text[], $52::text[], $53::boolean[],
         $54::boolean[], $55::boolean[], $56::float8[], $57::float8[], $58::float8[], $59::float8[], $60::float8[], $61::float8[], $62::date[],
         $63::int2[], $64::boolean[], $65::float8[],
         $66::boolean[], $67::boolean[], $68::float8[], $69::float8[], $70::float8[], $71::float8[], $72::float8[], $73::float8[], $74::date[]
       )
       ON CONFLICT (ma) DO UPDATE SET
         tin = EXCLUDED.tin,
         diem = EXCLUDED.diem,
         trend = EXCLUDED.trend,
         mom = EXCLUDED.mom,
         dt = EXCLUDED.dt,
         adx = EXCLUDED.adx,
         gia = EXCLUDED.gia,
         doi = EXCLUDED.doi,
         rs_vni = EXCLUDED.rs_vni,
         breadth_nganh = EXCLUDED.breadth_nganh,
         kijun = EXCLUDED.kijun,
         gg_top = EXCLUDED.gg_top,
         gg_bot = EXCLUDED.gg_bot,
         dinh_52t = EXCLUDED.dinh_52t,
         stop_loss = EXCLUDED.stop_loss,
         mat_than = EXCLUDED.mat_than,
         tp1 = EXCLUDED.tp1,
         tp2 = EXCLUDED.tp2,
         tp3 = EXCLUDED.tp3,
         gtgd_tb20 = EXCLUDED.gtgd_tb20,
         fvg_ok = EXCLUDED.fvg_ok,
         so_phien_giu = EXCLUDED.so_phien_giu,
         lai_lo_pct = EXCLUDED.lai_lo_pct,
         sanyaku = EXCLUDED.sanyaku,
         kumo_twist = EXCLUDED.kumo_twist,
         ngay_bien_doi = EXCLUDED.ngay_bien_doi,
         von_hoa = EXCLUDED.von_hoa,
         gia_mua = EXCLUDED.gia_mua,
         ngay_mua = EXCLUDED.ngay_mua,
         ban_bot = EXCLUDED.ban_bot,
         san = EXCLUDED.san,
         nganh = EXCLUDED.nganh,
         tp_da_cham = EXCLUDED.tp_da_cham,
         diem_rank = EXCLUDED.diem_rank,
         diem_confidence = EXCLUDED.diem_confidence,
         khoi_luong_tb20 = EXCLUDED.khoi_luong_tb20,
         giai_ngan = EXCLUDED.giai_ngan,
         gia_kich_hoat = EXCLUDED.gia_kich_hoat,
         moc_kich_hoat = EXCLUDED.moc_kich_hoat,
         moc_gia = EXCLUDED.moc_gia,
         moc_loai = EXCLUDED.moc_loai,
         moc_cach_pct = EXCLUDED.moc_cach_pct,
         diem_neu_vuot = EXCLUDED.diem_neu_vuot,
         gia_vao_web = EXCLUDED.gia_vao_web,
         thoi_diem_vao_web = EXCLUDED.thoi_diem_vao_web,
         vao_stop_loss = EXCLUDED.vao_stop_loss,
         vao_tp1 = EXCLUDED.vao_tp1,
         vao_tp2 = EXCLUDED.vao_tp2,
         vao_tp3 = EXCLUDED.vao_tp3,
         che_do_vao = EXCLUDED.che_do_vao,
         loai_vao = EXCLUDED.loai_vao,
         cho_phien_sau = EXCLUDED.cho_phien_sau,
         mua_moi = EXCLUDED.mua_moi,
         dang_giu_moi = EXCLUDED.dang_giu_moi,
         cat_moi = EXCLUDED.cat_moi,
         gia_mua_moi = EXCLUDED.gia_mua_moi,
         stop_moi = EXCLUDED.stop_moi,
         tp1_moi = EXCLUDED.tp1_moi,
         tp2_moi = EXCLUDED.tp2_moi,
         tp3_moi = EXCLUDED.tp3_moi,
         ngay_mua_moi = EXCLUDED.ngay_mua_moi,
         ly_do_ban = EXCLUDED.ly_do_ban,
         dang_bao_ve_lai = EXCLUDED.dang_bao_ve_lai,
         stop_bao_ve = EXCLUDED.stop_bao_ve,
         mua_giua = EXCLUDED.mua_giua,
         dang_giu_giua = EXCLUDED.dang_giu_giua,
         cat_giua = EXCLUDED.cat_giua,
         gia_mua_giua = EXCLUDED.gia_mua_giua,
         stop_giua = EXCLUDED.stop_giua,
         tp1_giua = EXCLUDED.tp1_giua,
         tp2_giua = EXCLUDED.tp2_giua,
         tp3_giua = EXCLUDED.tp3_giua,
         ngay_mua_giua = EXCLUDED.ngay_mua_giua,
         cap_nhat_luc = now()`,
      [
        cot("ma", (v) => v),
        cot("tin", (v) => v || "TRUNG LAP"),
        cot("diem", soFloat),
        cot("trend", soFloat),
        cot("mom", soFloat),
        cot("dt", soFloat),
        cot("adx", soFloat),
        cot("gia", soFloat),
        cot("doi", soFloat),
        cot("rs_vni", soFloat),
        cot("breadth_nganh", soFloat),
        cot("kijun", soFloat),
        cot("gg_top", soFloat),
        cot("gg_bot", soFloat),
        cot("dinh_52t", soFloat),
        cot("stop_loss", soFloat),
        cot("mat_than", soBool),
        cot("tp1", soFloat),
        cot("tp2", soFloat),
        cot("tp3", soFloat),
        cot("gtgd_tb20", soFloat),
        cot("fvg_ok", soBool),
        cot("so_phien_giu", soFloat),
        cot("lai_lo_pct", soFloat),
        cot("sanyaku", soFloat),
        cot("kumo_twist", soText),
        cot("ngay_bien_doi", soBool),
        cot("von_hoa", soText),
        cot("gia_mua", soFloat),
        cot("ngay_mua", soNgayVN),
        cot("ban_bot", soBool),
        cot("san", soText),
        cot("nganh", soText),
        cot("tp_da_cham", soText),
        cot("diem_rank", soFloat),
        cot("diem_confidence", soFloat),
        cot("khoi_luong_tb20", soFloat),
        cot("giai_ngan", soText),
        cot("gia_kich_hoat", soFloat),
        cot("moc_kich_hoat", soText),
        cot("moc_gia", soFloat),
        cot("moc_loai", soText),
        cot("moc_cach_pct", soFloat),
        cot("diem_neu_vuot", soFloat),
        giaVaoWeb,
        thoiDiemVaoWeb,
        vaoStopLoss,
        vaoTp1,
        vaoTp2,
        vaoTp3,
        cot("che_do_vao", soText),
        cot("loai_vao", soText),
        // 1/0 do AFL xuat; CSV cu chua co cot nay -> null (khong biet), khac voi false (da biet la khong).
        cot("cho_phien_sau", (v) => (v === "1" ? true : v === "0" ? false : null)),
        // LENH MUA MOI SAU TP3 (CSV cu chua co cot -> null). Gia/SL/TP la mang da dong bang o tren.
        cot("mua_moi", boolTriState),
        cot("dang_giu_moi", boolTriState),
        cot("cat_moi", soFloat),
        moiGia,
        moiStop,
        moiTp1,
        moiTp2,
        moiTp3,
        cot("ngay_mua_moi", soNgayVN),
        cot("ly_do_ban", (v) => {
          const n = parseInt(v, 10);
          return Number.isFinite(n) && n > 0 ? n : null;
        }),
        cot("dang_bao_ve_lai", boolTriState),
        cot("stop_bao_ve", duong),
        // MUA THEM GIUA CHUNG (vong doc lap voi mua_moi, CSV cu chua co cot -> null). Gia/SL/TP la
        // mang da dong bang o tren (giua*).
        cot("mua_giua", boolTriState),
        cot("dang_giu_giua", boolTriState),
        cot("cat_giua", soFloat),
        giuaGia,
        giuaStop,
        giuaTp1,
        giuaTp2,
        giuaTp3,
        cot("ngay_mua_giua", soNgayVN),
      ]
    );

    // Xoa ma KHONG con trong lan quet nay (vd ETF/HNX/UPCOM tu cac lan
    // upload cu truoc khi AFL loc chi con HOSE VN30/Midcap/Smallcap) - giu
    // DB luon dung khop chinh xac vu tru dang quet, khong con rac ton dong.
    //
    // AN TOAN: chi xoa neu lan nay quet du SO_DONG_TOI_THIEU_DE_XOA ma tro
    // len. He thong quet toan bo HOSE VN30/Midcap/Smallcap luon ra ~280-300
    // dong; neu file upload chi co vai dong (vd AmiBroker Explore bi cau hinh
    // nham "Apply to" = 1 ma thay vi "All Symbols") thi day chac chan la loi
    // cua nguoi dung, KHONG PHAI mot lan quet that - tuyet doi khong duoc xoa
    // sach du lieu that con lai chi vi 1 lan upload thieu du lieu.
    const SO_DONG_TOI_THIEU_DE_XOA = 100;
    const dsMaLanNay = cot("ma", (v) => v);
    // Co dong bi loi dinh dang (AmiBroker Explore da luong ghi dinh dong vao nhau) thi CAC MA CUA
    // NHUNG DONG DO khong co trong danh sach nay - neu xoa thi chung bien mat khoi web chi vi loi
    // ghi file. Bo qua buoc xoa cho toi khi co 1 lan upload sach.
    if (hangDL.length >= SO_DONG_TOI_THIEU_DE_XOA && soDongLoi === 0) {
      const { rowCount } = await client.query(`DELETE FROM tin_hieu WHERE NOT (ma = ANY($1::text[]))`, [dsMaLanNay]);
      soDongDaXoa = rowCount;
    } else {
      daBoQuaXoa = true;
    }
  });

  xoaBoNhoTinHieu(); // du lieu vua doi - cac trang doc lai tu DB, khong doi het han bo nho 30 giay

  // Ghi nhan LENH DA DONG (ma vua tu NAM GIU chuyen sang BAN/TRUNG LAP) de co ket qua that theo doi.
  // Bao ve: loi o buoc nay KHONG duoc lam hong lan upload chinh (du lieu tin hieu da ghi xong o tren).
  // Them: lenh VUA cham du TP3 (chot 30/30/25, giu 15% chay) cung duoc ghi vao Lenh da dong.
  const lenhDaDong = { ghi: 0 };
  let dsBanMoi = []; // lenh vua dong lan upload nay - dung de bao Zalo BAN
  try {
    const ngayBan = ngayGiaoDichVN();
    const dsDong = phatHienLenhDong({
      dsMoi: hangDL.map((h) => ({
        ma: h.ma,
        tin: h.tin || "TRUNG LAP",
        gia: soFloat(h.gia),
        tp1: soFloat(h.tp1),
        tp2: soFloat(h.tp2),
        ly_do_ban: parseInt(h.ly_do_ban, 10) || 0,
      })),
      banGhiCuTheoMa,
      ngayBan,
    });
    const dsChotTP3 = phatHienChotTP3({
      dsMoi: hangDL.map((h) => ({
        ma: h.ma,
        tin: h.tin || "TRUNG LAP",
        tp_da_cham: h.tp_da_cham,
        ngay_mua: soNgayVN(h.ngay_mua),
        so_phien_giu: soFloat(h.so_phien_giu),
        tp1: soFloat(h.tp1),
        tp2: soFloat(h.tp2),
        tp3: soFloat(h.tp3),
      })),
      banGhiCuTheoMa,
      ngayBan,
    });
    dsBanMoi = dsDong;
    const dsDongMuaMoi = phatHienDongMuaMoi({
      dsMoi: hangDL.map((h) => ({ ma: h.ma, tin: h.tin || "TRUNG LAP", gia: soFloat(h.gia), dang_giu_moi: boolTriState(h.dang_giu_moi), cat_moi: soFloat(h.cat_moi) })),
      banGhiCuTheoMa,
      ngayBan,
    });
    const dsDongMuaGiua = phatHienDongMuaThemGiuaChung({
      dsMoi: hangDL.map((h) => ({ ma: h.ma, tin: h.tin || "TRUNG LAP", gia: soFloat(h.gia), dang_giu_giua: boolTriState(h.dang_giu_giua), cat_giua: soFloat(h.cat_giua) })),
      banGhiCuTheoMa,
      ngayBan,
    });
    lenhDaDong.dongMuaMoi = dsDongMuaMoi.length;
    lenhDaDong.dongMuaGiua = dsDongMuaGiua.length;
    lenhDaDong.ghi = await ghiLenhDaDong([...dsDong, ...dsChotTP3, ...dsDongMuaMoi, ...dsDongMuaGiua]);
    lenhDaDong.chotTP3 = dsChotTP3.length;
    // Doi soat: ma da bi ghi la dong nhung nay lai NAM GIU (tin hieu doi chieu trong phien) -> bo khoi Lenh da dong;
    // ma van BAN thi cap nhat gia chot theo gia moi nhat.
    const doiSoat = await doiSoatLenhDaDong({ ngayHomNay: ngayBan });
    lenhDaDong.moLai = doiSoat.moLai.map((x) => x.ma);
    lenhDaDong.capNhatGia = doiSoat.capNhat;
  } catch (e) {
    lenhDaDong.loi = String(e?.message || e);
  }

  // Bao Zalo cho tung ma MOI chuyen sang MUA hom nay - loi Zalo (chua ket noi,
  // token het han,...) KHONG duoc lam hong response upload, chi ghi vao ket
  // qua tra ve de admin biet.
  let zaloDaGui = 0;
  let zaloLoi = null;
  for (const h of cacMaMuaMoi) {
    const ketQua = await guiZaloNeuDuocPhep(
      `🟢 TÍN HIỆU ${h.loai_vao === "MUA LAI" ? "MUA LẠI" : "MUA MỚI"}: ${h.ma}\n${dongVung(h)}${
        h.giai_ngan === "MOT PHAN" ? "\n⚠ Giải ngân 1 phần (RS yếu) — chờ phiên sau để bổ sung" : ""
      }\nXem chi tiết: https://cloudstock.id.vn/ma/${h.ma}`
    );
    if (ketQua.gui) zaloDaGui++;
    else if (!zaloLoi) zaloLoi = ketQua.ly_do;
  }
  // Bao Zalo BAN / cat lo: ma tu NAM GIU vua chuyen sang BAN (gom ca chạm Stop-loss). Gio giao dich thi kem canh bao tin hieu tam thoi.
  const trongPhien = dangTrongPhien();
  for (const b of dsBanMoi) {
    try {
      const cu = banGhiCuTheoMa[b.ma];
      const stop = Number(cu?.vao_stop_loss) > 0 ? Number(cu.vao_stop_loss) : Number(cu?.stop_loss);
      const lai = `${b.lai_lo_pct >= 0 ? "+" : ""}${b.lai_lo_pct.toFixed(2)}%`;
      const dong = [
        `🔴 ${b.ly_do === "BAN" ? "TÍN HIỆU BÁN / CẮT LỖ" : "THOÁT LỆNH"}: ${b.ma}`,
        `Giá: ${b.gia_ban} (giá mua ${b.gia_mua}, ${lai})`,
        stop > 0 ? `Stop-loss của lệnh: ${stop}` : null,
        trongPhien ? "⚠ Dữ liệu trong phiên: tín hiệu có thể đổi chiều trước khi đóng cửa, xem lại sau ATC" : null,
        `Xem chi tiết: https://cloudstock.id.vn/ma/${b.ma}`,
      ];
      const ketQua = await guiZaloNeuDuocPhep(dong.filter(Boolean).join("\n"));
      if (ketQua.gui) zaloDaGui++;
      else if (!zaloLoi) zaloLoi = ketQua.ly_do;
    } catch {
      /* loi bao Zalo khong duoc lam hong upload */
    }
  }
  // Bao Zalo MUA THEM: lenh MUA MOI sau khi lenh goc chot du TP3 (vong 2) - bao 1 lan cho moi lenh moi (khong lap khi upload lai).
  for (let k = 0; k < hangDL.length; k++) {
    const h = hangDL[k];
    if (boolTriState(h.mua_moi) !== true) continue;
    const cu = banGhiCuTheoMa[h.ma];
    if (cu && cu.dang_giu_moi === true && cu.ngay_mua_moi_txt === soNgayVN(h.ngay_mua_moi)) continue;
    try {
      const dong = [
        `➕ MUA THÊM (sau khi chốt đủ TP3): ${h.ma}`,
        `Giá mua mới: ${moiGia[k] ?? h.gia}${moiStop[k] ? ` · Cắt lỗ riêng: ${moiStop[k]}` : ""}`,
        moiTp1[k] ? `Chốt lời mới: ${moiTp1[k]} / ${moiTp2[k] ?? "—"} / ${moiTp3[k] ?? "—"}` : null,
        cu?.gia_vao_web > 0 || cu?.gia_mua > 0 ? `Vị thế cũ còn giữ ~15%: giá mua ${cu.gia_vao_web > 0 ? cu.gia_vao_web : cu.gia_mua}` : null,
        trongPhien ? "⚠ Dữ liệu trong phiên: tín hiệu có thể đổi chiều trước khi đóng cửa" : null,
        `Xem chi tiết: https://cloudstock.id.vn/ma/${h.ma}`,
      ];
      const ketQua = await guiZaloNeuDuocPhep(dong.filter(Boolean).join("\n"));
      if (ketQua.gui) zaloDaGui++;
      else if (!zaloLoi) zaloLoi = ketQua.ly_do;
    } catch {
      /* loi bao Zalo khong duoc lam hong upload */
    }
  }
  // Bao Zalo MUA THEM GIUA CHUNG: vi the phu doc lap voi vong 2, mo TRUOC khi cham du TP3 (bo
  // sung 2026-09-23) - bao 1 lan cho moi lenh moi (khong lap khi upload lai).
  for (let k = 0; k < hangDL.length; k++) {
    const h = hangDL[k];
    if (boolTriState(h.mua_giua) !== true) continue;
    const cu = banGhiCuTheoMa[h.ma];
    if (cu && cu.dang_giu_giua === true && cu.ngay_mua_giua_txt === soNgayVN(h.ngay_mua_giua)) continue;
    try {
      const dong = [
        `➕ MUA THÊM (giữa chừng, trước TP3): ${h.ma}`,
        `Giá mua mới: ${giuaGia[k] ?? h.gia}${giuaStop[k] ? ` · Cắt lỗ riêng: ${giuaStop[k]}` : ""}`,
        giuaTp1[k] ? `Chốt lời mới: ${giuaTp1[k]} / ${giuaTp2[k] ?? "—"} / ${giuaTp3[k] ?? "—"}` : null,
        cu?.gia_vao_web > 0 || cu?.gia_mua > 0 ? `Vị thế gốc: đang giữ, giá mua ${cu.gia_vao_web > 0 ? cu.gia_vao_web : cu.gia_mua}` : null,
        trongPhien ? "⚠ Dữ liệu trong phiên: tín hiệu có thể đổi chiều trước khi đóng cửa" : null,
        `Xem chi tiết: https://cloudstock.id.vn/ma/${h.ma}`,
      ];
      const ketQua = await guiZaloNeuDuocPhep(dong.filter(Boolean).join("\n"));
      if (ketQua.gui) zaloDaGui++;
      else if (!zaloLoi) zaloLoi = ketQua.ly_do;
    } catch {
      /* loi bao Zalo khong duoc lam hong upload */
    }
  }
  for (const h of cacMaBoSung) {
    const ketQua = await guiZaloNeuDuocPhep(
      `➕ BỔ SUNG: ${h.ma}\nGiá: ${h.gia}\nĐủ điều kiện giải ngân nốt phần còn lại\nXem chi tiết: https://cloudstock.id.vn/ma/${h.ma}`
    );
    if (ketQua.gui) zaloDaGui++;
    else if (!zaloLoi) zaloLoi = ketQua.ly_do;
  }

  return Response.json({
    trangThai: "ok",
    lenhDaDong,
    soDongDaLuu: hangDL.length,
    tongSoDongNhan: hangDL.length,
    soDongLoiDaBoQua: soDongLoi,
    soDongDaXoa,
    soMaMuaMoi: cacMaMuaMoi.length,
    zaloDaGui,
    ...(zaloLoi && { zaloLoi }),
    ...(daBoQuaXoa && {
      canhBao:
        soDongLoi > 0
          ? `Co ${soDongLoi} dong bi loi dinh dang (thuong do AmiBroker Explore chay da luong ghi dinh dong) - cac ma o dong loi KHONG duoc cap nhat lan nay, da BO QUA buoc xoa du lieu cu. Dat so luong thread cua Analysis ve 1 roi Explore lai.`
          : `Chi nhan duoc ${hangDL.length} dong (< ${100}) - da BO QUA buoc xoa du lieu cu de tranh mat du lieu. Kiem tra lai AmiBroker "Apply to" co dang = "All Symbols" khong.`,
    }),
  });
}
