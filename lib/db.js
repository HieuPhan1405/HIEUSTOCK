import { Client } from "pg";

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

// Serverless: moi request tu mo/dong 1 ket noi rieng (khong dung pool dai
// han) - phu hop voi Vercel Functions va Neon (co pooler o phia server roi).
export async function withDb(fn) {
  const cs = connectionString();
  if (!cs) {
    throw new Error(
      "Chua co bien moi truong DATABASE_URL/POSTGRES_URL. Vao Vercel -> Storage -> tao Postgres -> Connect vao project."
    );
  }
  const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function daoDamBangTinHieu(client) {
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
      ADD COLUMN IF NOT EXISTS tp_da_cham TEXT;
  `);
  // vung_tham_gia: tinh nang da bi BO trong chien luoc ban FULL v16 (gay
  // nham lan/khong dang tin cay). Giu lai cot cu tren DB (khong xoa, tranh
  // pha du lieu that lac) nhung AFL/API tu day khong con ghi/doc gia tri nay.
}

// Cau hinh Zalo OA de bao tin hieu MUA moi - chi 1 dong duy nhat (id=1).
// access_token/refresh_token duoc Zalo cap qua OAuth (xem lib/zalo.js) va
// TU DONG lam moi khi het han, khong can nguoi dung can thiep lai.
export async function daoDamBangZaloOA(client) {
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
}

// Nhap tay qua trang /quan-tri - AmiBroker khong co nguon du lieu nay.
export async function daoDamBangNoiDung(client) {
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
}

// Checklist do bat day - LICH SU su kien (khong phai trang thai hien tai nhu
// tin_hieu), moi lan AFL 8_Export_ChecklistBatDay.afl kich hoat 1 lan bat day
// la 1 dong. UNIQUE (ma, ngay_tin_hieu) vi AFL tinh lai TOAN BO lich su moi
// lan chay - upload dung ON CONFLICT DE thay vi INSERT trung.
export async function daoDamBangBatDay(client) {
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
}

// Thong tin gioi thieu/kenh lien he CUA CHU WEB - nhap 1 lan qua /quan-tri,
// hien cong khai o trang /lien-he. Chi 1 dong duy nhat (id co dinh = 1).
export async function daoDamBangThongTinLienHe(client) {
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
}

// Form Lien he cong khai (nguoi xem web tu dien, khong can API key) - chi
// luu vao DB de xem lai qua /quan-tri, khong gui email/SMS.
export async function daoDamBangLienHe(client) {
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
}

// Tai khoan dang ky bang SDT + mat khau - muc dich CHINH la thu thap SDT
// khach truy cap de tien tu van (khong dung de khoa noi dung, trang web
// van cong khai binh thuong). phien_dang_nhap la session token luu server-
// side (khong dung JWT) de co the thu hoi/xoa ngay khi dang xuat.
export async function daoDamBangNguoiDung(client) {
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
  await client.query(`
    CREATE TABLE IF NOT EXISTS phien_dang_nhap (
      token TEXT PRIMARY KEY,
      nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
      het_han TIMESTAMPTZ NOT NULL,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// Nut "Tham gia" 1 ma (giong nut theo doi/like ben cac app tin hieu khac) -
// UNIQUE (nguoi_dung_id, ma) de 1 nguoi chi tham gia 1 ma 1 lan (bam lai la
// roi/huy tham gia), phuc vu hien so nguoi quan tam moi ma tren Bo loc/So
// lenh dang mo.
export async function daoDamBangThamGia(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS tham_gia_ma (
      id SERIAL PRIMARY KEY,
      nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
      ma TEXT NOT NULL,
      tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (nguoi_dung_id, ma)
    );
  `);
}
