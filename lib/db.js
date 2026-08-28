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
}
