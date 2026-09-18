import { withDb, daoDamBangTinHieu } from "@/lib/db";
import { guiTinNhanZalo } from "@/lib/zalo";

// Nhan CSV tu script day_du_lieu_len_web.py (duoc xuat boi AFL
// amibroker/7_Export_LenWeb.afl). Header CSV bat buoc (37 cot):
// ma,tin,diem,trend,mom,dt,adx,gia,doi,rs_vni,breadth_nganh,kijun,gg_top,gg_bot,dinh_52t,
// stop_loss,mat_than,tp1,tp2,tp3,gtgd_tb20,fvg_ok,so_phien_giu,lai_lo_pct,sanyaku,
// kumo_twist,ngay_bien_doi,von_hoa,gia_mua,ngay_mua,ban_bot,san,nganh,tp_da_cham,
// diem_rank,diem_confidence,khoi_luong_tb20

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

export async function POST(request) {
  if (!kiemTraApiKey(request)) {
    return Response.json({ loi: "API key khong dung" }, { status: 401 });
  }

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
  await withDb(async (client) => {
    await daoDamBangTinHieu(client);
    const { rows } = await client.query(`SELECT ma, tin FROM tin_hieu WHERE ma = ANY($1::text[])`, [dsMaLanNay0]);
    tinCuTheoMa = Object.fromEntries(rows.map((r) => [r.ma, r.tin]));
  });
  const cacMaMuaMoi = hangDL.filter((h) => (h.tin || "TRUNG LAP") === "MUA" && tinCuTheoMa[h.ma] !== "MUA");

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
         diem_rank, diem_confidence, khoi_luong_tb20)
       SELECT * FROM unnest(
         $1::text[], $2::text[], $3::float8[], $4::float8[], $5::float8[],
         $6::float8[], $7::float8[], $8::float8[], $9::float8[], $10::float8[],
         $11::float8[], $12::float8[], $13::float8[], $14::float8[], $15::float8[],
         $16::float8[], $17::boolean[], $18::float8[], $19::float8[], $20::float8[],
         $21::float8[], $22::boolean[], $23::float8[], $24::float8[], $25::float8[],
         $26::text[], $27::boolean[], $28::text[], $29::float8[], $30::date[], $31::boolean[],
         $32::text[], $33::text[], $34::text[],
         $35::float8[], $36::float8[], $37::float8[]
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
    if (hangDL.length >= SO_DONG_TOI_THIEU_DE_XOA) {
      const { rowCount } = await client.query(`DELETE FROM tin_hieu WHERE NOT (ma = ANY($1::text[]))`, [dsMaLanNay]);
      soDongDaXoa = rowCount;
    } else {
      daBoQuaXoa = true;
    }
  });

  // Bao Zalo cho tung ma MOI chuyen sang MUA hom nay - loi Zalo (chua ket noi,
  // token het han,...) KHONG duoc lam hong response upload, chi ghi vao ket
  // qua tra ve de admin biet.
  let zaloDaGui = 0;
  let zaloLoi = null;
  for (const h of cacMaMuaMoi) {
    const ketQua = await guiTinNhanZalo(
      `🟢 TÍN HIỆU MUA MỚI: ${h.ma}\nGiá: ${h.gia}\nĐiểm: ${Number(h.diem).toFixed(2)}\nXem chi tiết: https://cloudstock.id.vn/ma/${h.ma}`
    );
    if (ketQua.gui) zaloDaGui++;
    else if (!zaloLoi) zaloLoi = ketQua.ly_do;
  }

  return Response.json({
    trangThai: "ok",
    soDongDaLuu: hangDL.length,
    tongSoDongNhan: hangDL.length,
    soDongLoiDaBoQua: soDongLoi,
    soDongDaXoa,
    soMaMuaMoi: cacMaMuaMoi.length,
    zaloDaGui,
    ...(zaloLoi && { zaloLoi }),
    ...(daBoQuaXoa && {
      canhBao: `Chi nhan duoc ${hangDL.length} dong (< ${100}) - da BO QUA buoc xoa du lieu cu de tranh mat du lieu. Kiem tra lai AmiBroker "Apply to" co dang = "All Symbols" khong.`,
    }),
  });
}
