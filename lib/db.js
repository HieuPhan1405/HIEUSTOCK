import { Pool } from "pg";
import { COT_CHI_BAO } from "@/lib/cotChiBaoKyThuat";

// Ket noi Postgres (Neon, tao qua Vercel -> Storage -> Create Database).
// Vercel tu dong bom cac bien nay vao project khi ban "Connect" database:
// POSTGRES_URL (co pool, uu tien dung) hoac DATABASE_URL / POSTGRES_PRISMA_URL
// tuy loai tich hop. Ho tro ca 3 de khong bi phu thuoc ten bien cu the.
function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

// Serverless (Vercel Functions + Neon): GIU 1 pool nho o cap module de cac request cung chay tren 1 instance dung lai ket noi
// (mo ket noi moi = TCP + TLS + xac thuc, ton nhieu vong di-ve toi DB moi lan). Pool nho vi Neon co pooler o phia server.
// Ket noi nhan roi (idle) bi dong sau vai giay de khong giu ket noi vo ich khi instance ngu.
let pool = null;
function layPool(cs) {
  if (!pool) {
    pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false }, max: 4, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
    // Ket noi idle bi server dong se phat 'error' - khong xu ly thi lam sap ca tien trinh.
    pool.on("error", () => {});
  }
  return pool;
}

export async function withDb(fn) {
  const cs = connectionString();
  if (!cs) {
    throw new Error(
      "Chua co bien moi truong DATABASE_URL/POSTGRES_URL. Vao Vercel -> Storage -> tao Postgres -> Connect vao project."
    );
  }
  const client = await layPool(cs).connect();
  let loi;
  try {
    return await fn(client);
  } catch (e) {
    loi = e;
    throw e;
  } finally {
    // Loi giua chung co the de lai ket noi o trang thai la: dong han thay vi tra lai pool.
    client.release(loi ? true : undefined);
  }
}

// Cac ham "dao dam bang" (CREATE TABLE / ALTER ... IF NOT EXISTS) chi can chay 1 LAN moi instance - truoc day chay lai
// o MOI request nen ton them vai vong di-ve toi DB va giu khoa DDL.
const daDaoDam = new Set();

export async function daoDamBangTinHieu(client) {
  if (daDaoDam.has("TinHieu")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS tin_hieu (
      ma TEXT PRIMARY KEY,
      tin TEXT NOT NULL,
      diem DOUBLE PRECISION,
      trend DOUBLE PRECISION,
      mom DOUBLE PRECISION,
      dt DOUBLE PRECISION,
      adx DOUBLE PRECISION,
      gia DOUBLE PRECISION,
      doi DOUBLE PRECISION,
      rs_vni DOUBLE PRECISION,
      breadth_nganh DOUBLE PRECISION,
      vung_tham_gia BOOLEAN,
      cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Them cot moi cho ban co san (bang da tao truoc khi co cac cot nay tren
  // production) - ALTER ... IF NOT EXISTS an toan khi chay lai nhieu lan.
  await client.query(`
    ALTER TABLE tin_hieu
      ADD COLUMN IF NOT EXISTS kijun DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS gg_top DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS gg_bot DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS dinh_52t DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS stop_loss DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS mat_than BOOLEAN,
      ADD COLUMN IF NOT EXISTS tp1 DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp2 DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp3 DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS gtgd_tb20 DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS fvg_ok BOOLEAN,
      ADD COLUMN IF NOT EXISTS so_phien_giu DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS lai_lo_pct DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS sanyaku DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS kumo_twist TEXT,
      ADD COLUMN IF NOT EXISTS ngay_bien_doi BOOLEAN,
      ADD COLUMN IF NOT EXISTS von_hoa TEXT,
      ADD COLUMN IF NOT EXISTS gia_mua DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS ngay_mua DATE,
      ADD COLUMN IF NOT EXISTS ban_bot BOOLEAN,
      ADD COLUMN IF NOT EXISTS san TEXT,
      ADD COLUMN IF NOT EXISTS nganh TEXT,
      ADD COLUMN IF NOT EXISTS tp_da_cham TEXT,
      ADD COLUMN IF NOT EXISTS diem_rank DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS diem_confidence DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS khoi_luong_tb20 DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS giai_ngan TEXT,
      ADD COLUMN IF NOT EXISTS gia_kich_hoat DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS moc_kich_hoat TEXT,
      ADD COLUMN IF NOT EXISTS moc_gia DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS moc_loai TEXT,
      ADD COLUMN IF NOT EXISTS moc_cach_pct DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS diem_neu_vuot DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS gia_vao_web DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS thoi_diem_vao_web TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS vao_stop_loss DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS vao_tp1 DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS vao_tp2 DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS vao_tp3 DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS che_do_vao TEXT,
      ADD COLUMN IF NOT EXISTS loai_vao TEXT,
      ADD COLUMN IF NOT EXISTS cho_phien_sau BOOLEAN,
      ADD COLUMN IF NOT EXISTS mua_moi BOOLEAN,
      ADD COLUMN IF NOT EXISTS dang_giu_moi BOOLEAN,
      ADD COLUMN IF NOT EXISTS cat_moi DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS gia_mua_moi DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS stop_moi DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp1_moi DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp2_moi DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp3_moi DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS ngay_mua_moi DATE,
      ADD COLUMN IF NOT EXISTS ly_do_ban SMALLINT,
      ADD COLUMN IF NOT EXISTS dang_bao_ve_lai BOOLEAN,
      ADD COLUMN IF NOT EXISTS stop_bao_ve DOUBLE PRECISION,
      -- MUA THEM GIUA CHUNG: vong vi the DOC LAP voi mua_moi/vong 2 (mo TRUOC khi cham du TP3,
      -- co the giu DONG THOI voi vong 2 cho CUNG 1 lenh goc - toi da 3 vi the: goc + giua chung +
      -- sau TP3) - bo sung 2026-09-23, xem engine/tinhTinHieuChoMa.js.
      ADD COLUMN IF NOT EXISTS mua_giua BOOLEAN,
      ADD COLUMN IF NOT EXISTS dang_giu_giua BOOLEAN,
      ADD COLUMN IF NOT EXISTS cat_giua DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS gia_mua_giua DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS stop_giua DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp1_giua DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp2_giua DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp3_giua DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS ngay_mua_giua DATE,
      ADD COLUMN IF NOT EXISTS tp_da_cham_giua TEXT;
  `);
  // vung_tham_gia: tinh nang da bi BO trong chien luoc ban FULL v16 (gay
  // nham lan/khong dang tin cay). Giu lai cot cu tren DB (khong xoa, tranh
  // pha du lieu that lac) nhung AFL/API tu day khong con ghi/doc gia tri nay.
  daDaoDam.add("TinHieu");
}

// Lenh DA DONG (ket qua that cua tung lenh mua-ban) - xem lib/lenhDaDong.js.
export async function daoDamBangLenhDaDong(client) {
  if (daDaoDam.has("LenhDaDong")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS lenh_da_dong (
      id SERIAL PRIMARY KEY,
      ma TEXT NOT NULL,
      ngay_mua DATE NOT NULL,
      gia_mua DOUBLE PRECISION,
      ngay_ban DATE,
      gia_ban DOUBLE PRECISION,
      lai_lo_pct DOUBLE PRECISION,
      so_phien DOUBLE PRECISION,
      ly_do TEXT,
      da_cham_tp TEXT,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (ma, ngay_mua)
    );
  `);
  // Phan tram vi the da chot (100 = dong het; cach tu 2026-09-26 TP1 30 + TP2 30, con 40% giu den BAN (dong dong lenh thuc su ghi phan con lai 40); cach "ket thuc o TP3" TP3 = 40; lenh cu 30/30/25/15 thi TP3 ghi 25 hoac gop 85, con 15% giu chay).
  await client.query(`ALTER TABLE lenh_da_dong ADD COLUMN IF NOT EXISTS phan_chot_pct DOUBLE PRECISION NOT NULL DEFAULT 100`);
  // 1 = lenh goc (dong binh thuong, hoac su kien chot du TP3 - ly_do='TP3'); 2 = lenh MUA MOI (mua them) sau TP3;
  // 3 = PHAN CON LAI (15%) cua lenh goc SAU KHI da ghi su kien chot TP3, khi phan do that su dong (xem phatHienLenhDong);
  // 4 = lenh MUA THEM GIUA CHUNG (vong doc lap voi 2, mo TRUOC khi cham du TP3 - co the dong thoi voi vong=2 cua CUNG 1 lenh goc).
  // 5/6 = dong chot 30% TP1 / 30% TP2 cua lenh dau; 7/8 = dong chot 30% TP1 / 30% TP2 cua lenh MUA MOI (vong 4) - tu 2026-09-27 lenh mua moi chot giong lenh Mua, dong vong 4
  // khi dong lenh chi ghi PHAN CON LAI (40% / 70% / 100%).
  await client.query(`ALTER TABLE lenh_da_dong ADD COLUMN IF NOT EXISTS vong SMALLINT NOT NULL DEFAULT 1`);
  // UNIQUE cu chi la (ma, ngay_mua) khong cho phep vua co dong "chot TP3" (vong=1) vua co dong "phan con lai dong that
  // su" (vong=3) cho CUNG 1 lenh - dong thu 2 se bi ON CONFLICT DO NOTHING am tham bo qua, mat ket qua that. Doi sang
  // UNIQUE (ma, ngay_mua, vong). Tim va xoa rang buoc UNIQUE 2 cot cu (ten do Postgres tu sinh, khong doan truoc chac
  // chan) roi tao lai bang unique index 3 cot - ca hai buoc deu an toan chay lai nhieu lan.
  await client.query(`
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'lenh_da_dong' AND con.contype = 'u'
          AND (SELECT array_agg(attname ORDER BY attname) FROM pg_attribute WHERE attrelid = rel.oid AND attnum = ANY(con.conkey))
              = ARRAY['ma','ngay_mua']::name[]
      LOOP
        EXECUTE format('ALTER TABLE lenh_da_dong DROP CONSTRAINT %I', r.conname);
      END LOOP;
    END $$;
  `);
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS lenh_da_dong_ma_ngay_mua_vong_idx ON lenh_da_dong (ma, ngay_mua, vong)`);
  // CHOT BAN THEO KHUNG GIO (2026-09-28, lib/khungGioVaoLenh.js): chot_luc = luc lenh ban duoc CHOT (trong khung gio vao lenh). NULL = dang THEO DOI - tin hieu ban / cat lo
  // xuat hien ngoai khung, gia ban la gia tam tinh, con co the mo lai neu tin hieu quay lai nam giu; den gio mo khung ke tiep thi chot. Them cot voi DEFAULT now() nen cac
  // dong CU deu coi nhu da chot; dong moi luon ghi ro chot_luc (ghiLenhDaDong).
  await client.query(`ALTER TABLE lenh_da_dong ADD COLUMN IF NOT EXISTS chot_luc TIMESTAMPTZ DEFAULT now()`);
  // CAT LO CHI TRONG KHUNG GIO (2026-09-28): lenh cat lo / hoa von dang THEO DOI luu muc_cat_lo (muc cat lo luc do); trong khung ma gia <= muc do moi cat. thay_trong_khung = da thay
  // gia TREN muc cat lo trong khung (co lan cap nhat trong khung) - het khung ma chua cham thi HUY ban, chuyen thanh lenh web giu (lenh_mua_chot) voi stop_goc / tp*_goc luc mua.
  await client.query(`
    ALTER TABLE lenh_da_dong
      ADD COLUMN IF NOT EXISTS muc_cat_lo DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS stop_goc DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp1_goc DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp2_goc DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS tp3_goc DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS thay_trong_khung BOOLEAN NOT NULL DEFAULT false
  `);
  daDaoDam.add("LenhDaDong");
}

// NHAT KY TIN HIEU XUAT HIEN (2026-09-27): moi lenh Mua / Mua moi ghi 1 dong LUC WEB THAY LAN DAU - gia luc do so voi gia vao cua he thong (lenh dau: moc chuyen mua),
// gia cuoi cung thay trong ngay tin hieu, va tin hieu co bi MAT trong cung ngay khong (vuot gia: hien trong phien roi mat truoc khi dong cua). Xem lib/xuatHienTinHieu.js.
// loai: 'goc' (lenh Mua) | 'giua' (Mua moi dot sau) | 'moi' (Mua moi sau TP3). ngay_mua = ngay tin hieu theo AFL; ngay_hien = ngay giao dich luc web thay lan dau.
export async function daoDamBangXuatHien(client) {
  if (daDaoDam.has("XuatHien")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS tin_hieu_xuat_hien (
      id SERIAL PRIMARY KEY,
      ma TEXT NOT NULL,
      loai TEXT NOT NULL,
      ngay_mua DATE NOT NULL,
      ngay_hien DATE NOT NULL,
      gia_moc DOUBLE PRECISION,
      gia_luc_hien DOUBLE PRECISION,
      luc_hien TIMESTAMPTZ NOT NULL,
      trong_phien BOOLEAN,
      gia_cuoi_ngay DOUBLE PRECISION,
      luc_cuoi_ngay TIMESTAMPTZ,
      mat_tin_hieu BOOLEAN NOT NULL DEFAULT FALSE,
      so_lan_mat INTEGER NOT NULL DEFAULT 0,
      luc_mat TIMESTAMPTZ,
      gia_luc_mat DOUBLE PRECISION,
      UNIQUE (ma, loai, ngay_mua)
    );
  `);
  daDaoDam.add("XuatHien");
}

// Cau hinh Zalo OA de bao tin hieu MUA moi - chi 1 dong duy nhat (id=1).
// access_token/refresh_token duoc Zalo cap qua OAuth (xem lib/zalo.js) va
// TU DONG lam moi khi het han, khong can nguoi dung can thiep lai.
export async function daoDamBangZaloOA(client) {
  if (daDaoDam.has("ZaloOA")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS zalo_oa (
      id INTEGER PRIMARY KEY DEFAULT 1,
      app_id TEXT,
      secret_key TEXT,
      access_token TEXT,
      refresh_token TEXT,
      access_token_het_han TIMESTAMPTZ,
      user_id TEXT,
      cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT zalo_oa_single_row CHECK (id = 1)
    );
  `);
  daDaoDam.add("ZaloOA");
}

// Nhap tay qua trang /quan-tri - AmiBroker khong co nguon du lieu nay.
export async function daoDamBangNoiDung(client) {
  if (daDaoDam.has("NoiDung")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS dinh_gia (
      id SERIAL PRIMARY KEY,
      ma TEXT NOT NULL,
      cong_ty_ck TEXT NOT NULL,
      ngay_dinh_gia DATE,
      gia_muc_tieu DOUBLE PRECISION NOT NULL,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Khuyen nghi (Mua/Ban/Kha quan/...) - bo sung 2026-09-24, thay cho kieu "dinh gia trung binh"
  // cu bang danh sach bao cao CTCK moi nhat kem khuyen nghi. Text tu do (giong cong_ty_ck) vi
  // cach goi ten khuyen nghi khac nhau giua cac CTCK, khong ep 1 danh sach co dinh.
  await client.query(`ALTER TABLE dinh_gia ADD COLUMN IF NOT EXISTS khuyen_nghi TEXT;`);
  await client.query(`CREATE INDEX IF NOT EXISTS dinh_gia_ma_idx ON dinh_gia (ma);`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS cau_chuyen (
      id SERIAL PRIMARY KEY,
      ma TEXT NOT NULL,
      loai TEXT NOT NULL, -- 'dong_luc' | 'theo_doi' | 'rui_ro'
      noi_dung TEXT NOT NULL,
      ngay DATE,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS cau_chuyen_ma_idx ON cau_chuyen (ma);`);
  daDaoDam.add("NoiDung");
}

// Checklist do bat day - LICH SU su kien (khong phai trang thai hien tai nhu
// tin_hieu), moi lan AFL 8_Export_ChecklistBatDay.afl kich hoat 1 lan bat day
// la 1 dong. UNIQUE (ma, ngay_tin_hieu) vi AFL tinh lai TOAN BO lich su moi
// lan chay - upload dung ON CONFLICT DE thay vi INSERT trung.
export async function daoDamBangBatDay(client) {
  if (daDaoDam.has("BatDay")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS bat_day_su_kien (
      id SERIAL PRIMARY KEY,
      ma TEXT NOT NULL,
      ngay_tin_hieu DATE NOT NULL,
      diem DOUBLE PRECISION,
      gia_luc_tin_hieu DOUBLE PRECISION,
      pct_sau_5 DOUBLE PRECISION,
      pct_sau_10 DOUBLE PRECISION,
      pct_sau_20 DOUBLE PRECISION,
      chiet_khau DOUBLE PRECISION,
      rsi DOUBLE PRECISION,
      capitulation BOOLEAN,
      ftd BOOLEAN,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (ma, ngay_tin_hieu)
    );
  `);
  daDaoDam.add("BatDay");
}

// CHI BAO KY THUAT cho bo loc kieu TradingView (RSI, MACD, Stochastic, Bollinger, MA...) - engine tinh tu lich su gia roi day len /api/upload-chi-bao, moi ma 1 dong (khoa ma).
// Cot so lay tu COT_CHI_BAO (lib/cotChiBaoKyThuat.js): them chi bao moi chi can them ten vao danh sach, cot moi tu duoc tao o day. Ten cot la hang so trong code nen noi chuoi vao SQL an toan.
let dangTaoBangChiBao = null;
export async function daoDamBangChiBao(client) {
  if (daDaoDam.has("ChiBao")) return;
  if (!dangTaoBangChiBao) dangTaoBangChiBao = taoBangChiBao(client).finally(() => (dangTaoBangChiBao = null));
  return dangTaoBangChiBao;
}

async function taoBangChiBao(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS chi_bao_ky_thuat (
      ma TEXT PRIMARY KEY,
      ngay_nen DATE,
      cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await client.query(`ALTER TABLE chi_bao_ky_thuat ${COT_CHI_BAO.map((c) => `ADD COLUMN IF NOT EXISTS ${c} DOUBLE PRECISION`).join(", ")};`);
  daDaoDam.add("ChiBao");
}

// Thong tin gioi thieu/kenh lien he CUA CHU WEB - nhap 1 lan qua /quan-tri,
// hien cong khai o trang /lien-he. Chi 1 dong duy nhat (id co dinh = 1).
export async function daoDamBangThongTinLienHe(client) {
  if (daDaoDam.has("ThongTinLienHe")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS thong_tin_lien_he (
      id INTEGER PRIMARY KEY DEFAULT 1,
      sdt TEXT,
      zalo TEXT,
      tiktok TEXT,
      facebook TEXT,
      ngan_hang TEXT,
      so_tk TEXT,
      chu_tk TEXT,
      cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT thong_tin_lien_he_single_row CHECK (id = 1)
    );
  `);
  daDaoDam.add("ThongTinLienHe");
}

// Form Lien he cong khai (nguoi xem web tu dien, khong can API key) - chi
// luu vao DB de xem lai qua /quan-tri, khong gui email/SMS.
export async function daoDamBangLienHe(client) {
  if (daDaoDam.has("LienHe")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS lien_he (
      id SERIAL PRIMARY KEY,
      ho_ten TEXT NOT NULL,
      lien_lac TEXT NOT NULL,
      noi_dung TEXT NOT NULL,
      da_doc BOOLEAN NOT NULL DEFAULT false,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  daDaoDam.add("LienHe");
}

// Tai khoan dang ky bang SDT + mat khau - muc dich CHINH la thu thap SDT
// khach truy cap de tien tu van (khong dung de khoa noi dung, trang web
// van cong khai binh thuong). phien_dang_nhap la session token luu server-
// side (khong dung JWT) de co the thu hoi/xoa ngay khi dang xuat.
export async function daoDamBangNguoiDung(client) {
  if (daDaoDam.has("NguoiDung")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS nguoi_dung (
      id SERIAL PRIMARY KEY,
      sdt TEXT UNIQUE NOT NULL,
      mat_khau_hash TEXT NOT NULL,
      ten TEXT,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await client.query(`
    ALTER TABLE nguoi_dung
      ADD COLUMN IF NOT EXISTS la_admin BOOLEAN NOT NULL DEFAULT false;
  `);
  // Duyet tai khoan (bo sung 2026-09-24): tai khoan DANG KY MOI mac dinh CHUA duyet (dangKy() tu
  // dat false khi INSERT) - phai admin bam "Duyet" o /quan-tri moi dung duoc cac trang can dang
  // nhap (Danh muc theo doi, So lenh dang mo, Lenh da dong, Checklist bat day). Cot mac dinh TRUE de
  // KHONG khoa nham cac tai khoan da dang ky TU TRUOC khi co tinh nang nay.
  await client.query(`
    ALTER TABLE nguoi_dung
      ADD COLUMN IF NOT EXISTS da_duyet BOOLEAN NOT NULL DEFAULT true;
  `);
  // Gmail/email (bo sung 2026-10-01): bat buoc voi tai khoan DANG KY MOI (kiem o dangKy()); tai khoan cu de trong. Chi muc duy nhat (khong phan biet hoa/thuong)
  // tren cac dong co email de 1 email khong tao nhieu tai khoan.
  await client.query(`
    ALTER TABLE nguoi_dung
      ADD COLUMN IF NOT EXISTS email TEXT;
  `);
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS nguoi_dung_email_duy_nhat ON nguoi_dung (lower(email)) WHERE email IS NOT NULL;`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS phien_dang_nhap (
      token TEXT PRIMARY KEY,
      nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
      het_han TIMESTAMPTZ NOT NULL,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  daDaoDam.add("NguoiDung");
}

// Bo dem gioi han so lan truy cap (chong doan mat khau / spam dang ky, lien he) - xem lib/gioiHan.js.
export async function daoDamBangGioiHan(client) {
  if (daDaoDam.has("GioiHan")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS gioi_han_truy_cap (
      khoa TEXT PRIMARY KEY,
      so_lan INTEGER NOT NULL,
      bat_dau TIMESTAMPTZ NOT NULL
    );
  `);
  // Thong tin de trang quan tri xem "ai dang bi chan" (bo sung 2026-10-01): nhan loai (Dang nhap / Dang ky / Lien he / Sai mat khau), nguon (IP that cua khach hoac SDT da che bot so),
  // ip_cuoi (IP gan nhat cham vao khoa), nguong_chan (so lan tu do bi chan), cua_so_giay. IP that chi luu o day va tu xoa sau 1 ngay.
  await client.query(`
    ALTER TABLE gioi_han_truy_cap
      ADD COLUMN IF NOT EXISTS nhan TEXT,
      ADD COLUMN IF NOT EXISTS nguon TEXT,
      ADD COLUMN IF NOT EXISTS ip_cuoi TEXT,
      ADD COLUMN IF NOT EXISTS nguong_chan INTEGER,
      ADD COLUMN IF NOT EXISTS cua_so_giay INTEGER;
  `);
  daDaoDam.add("GioiHan");
}

// Nut "Tham gia" 1 ma (giong nut theo doi/like ben cac app tin hieu khac) -
// UNIQUE (nguoi_dung_id, ma) de 1 nguoi chi tham gia 1 ma 1 lan (bam lai la
// roi/huy tham gia), phuc vu hien so nguoi quan tam moi ma tren Bo loc/So
// lenh dang mo.
// Lua chon RIENG TUNG TAI KHOAN cho "diem mua moi" o So lenh dang mo: nguoi dung da mua dot dau cua ma do chua
// (da mua -> tinh gia von trung binh, "MUA THEM"; chua -> "MUA MOI"). vong = "moi" (mua them sau TP3) hoac "giua"
// (mua them giua chung); ngay_mua = ngay cua CHINH diem mua moi do (de sang diem mua moi khac thi lua chon cu khong tu ap vao).
export async function daoDamBangMuaThemCaNhan(client) {
  if (daDaoDam.has("MuaThemCaNhan")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS mua_them_ca_nhan (
      nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
      ma TEXT NOT NULL,
      vong TEXT NOT NULL,
      ngay_mua DATE NOT NULL,
      da_mua_dot_dau BOOLEAN NOT NULL,
      cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (nguoi_dung_id, ma, vong, ngay_mua)
    );
  `);
  daDaoDam.add("MuaThemCaNhan");
}

// THONG BAO (2026-09-28): chuong thong bao tren thanh dau + thong bao day ve may (Web Push) - xem lib/thongBao.js, lib/thongBaoDb.js.
//  - thong_bao: moi su kien 1 dong (tin hieu cua phien / nguoi dang ky moi), khoa UNIQUE chong bao trung khi upload nhieu lan trong phien. chi_admin = chi quan tri thay.
//  - dang_ky_day: moi trinh duyet / dien thoai da bam "Bat thong bao ve may" 1 dong (endpoint do trinh duyet cap), gan voi tai khoan dang nhap luc bat.
//  - cau_hinh_day: cap khoa VAPID cua web (tu tao lan dau, 1 dong duy nhat) - trinh duyet dung khoa cong khai de xac nhan thong bao den tu dung web nay.
//  - nguoi_dung.thong_bao_xem_luc: lan mo chuong gan nhat (dem "chua xem"); thong_bao_pham_vi: 'tat_ca' | 'danh_muc' (chi ma dang theo doi) | 'khong'.
// Nhieu truy van cung luc (vd /api/thong-bao goi 3 ham song song) lan dau -> dung chung 1 lan tao bang (CREATE TABLE IF NOT EXISTS chay dong thoi van dung khoa trung trong Postgres).
let dangTaoBangThongBao = null;
export async function daoDamBangThongBao(client) {
  if (daDaoDam.has("ThongBao")) return;
  if (!dangTaoBangThongBao) dangTaoBangThongBao = taoBangThongBao(client).finally(() => (dangTaoBangThongBao = null));
  return dangTaoBangThongBao;
}

async function taoBangThongBao(client) {
  await daoDamBangNguoiDung(client);
  await client.query(`
    CREATE TABLE IF NOT EXISTS thong_bao (
      id SERIAL PRIMARY KEY,
      khoa TEXT UNIQUE NOT NULL,
      loai TEXT NOT NULL,
      chi_admin BOOLEAN NOT NULL DEFAULT false,
      ma TEXT,
      tieu_de TEXT NOT NULL,
      noi_dung TEXT,
      duong_dan TEXT,
      ngay DATE,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS thong_bao_tao_luc_idx ON thong_bao (tao_luc DESC);`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS dang_ky_day (
      id SERIAL PRIMARY KEY,
      nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS cau_hinh_day (
      id INTEGER PRIMARY KEY DEFAULT 1,
      khoa_cong_khai TEXT NOT NULL,
      khoa_bi_mat TEXT NOT NULL,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT cau_hinh_day_single_row CHECK (id = 1)
    );
  `);
  await client.query(`ALTER TABLE nguoi_dung ADD COLUMN IF NOT EXISTS thong_bao_xem_luc TIMESTAMPTZ;`);
  await client.query(`ALTER TABLE nguoi_dung ADD COLUMN IF NOT EXISTS thong_bao_pham_vi TEXT NOT NULL DEFAULT 'tat_ca';`);
  daDaoDam.add("ThongBao");
}

// LENH MUA DA CHOT TRONG KHUNG GIO (2026-09-28, lib/lenhMuaChot.js): tin hieu MUA / Mua moi hien trong khung gio vao lenh = da mua that. Tin hieu mat trong phien (he thong khong
// con giu) thi web tu giu lenh (web_giu = true): chot TP1 / TP2, cat lo, ban khi diem thap 3 phien. loai: 'goc' (lenh dau) | 'giua' (Mua moi). trang_thai: 'mo' | 'dong'.
// so_phien_diem_thap / ngay_diem / diem_cuoi: dem so phien lien tiep diem cuoi phien <= -1,5 (luat ban cua he thong).
export async function daoDamBangLenhMuaChot(client) {
  if (daDaoDam.has("LenhMuaChot")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS lenh_mua_chot (
      id SERIAL PRIMARY KEY,
      ma TEXT NOT NULL,
      loai TEXT NOT NULL DEFAULT 'goc',
      ngay_mua DATE NOT NULL,
      gia_mua DOUBLE PRECISION NOT NULL,
      gia_kich_hoat DOUBLE PRECISION,
      stop_loss DOUBLE PRECISION,
      tp1 DOUBLE PRECISION,
      tp2 DOUBLE PRECISION,
      tp3 DOUBLE PRECISION,
      luc_chot TIMESTAMPTZ NOT NULL DEFAULT now(),
      trang_thai TEXT NOT NULL DEFAULT 'mo',
      web_giu BOOLEAN NOT NULL DEFAULT false,
      tp_da_cham TEXT,
      so_phien_diem_thap INTEGER NOT NULL DEFAULT 0,
      ngay_diem DATE,
      diem_cuoi DOUBLE PRECISION,
      cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (ma, loai, ngay_mua)
    );
  `);
  daDaoDam.add("LenhMuaChot");
}

export async function daoDamBangThamGia(client) {
  if (daDaoDam.has("ThamGia")) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS tham_gia_ma (
      id SERIAL PRIMARY KEY,
      nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
      ma TEXT NOT NULL,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (nguoi_dung_id, ma)
    );
  `);
  daDaoDam.add("ThamGia");
}
