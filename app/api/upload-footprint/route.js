import { withDb, daoDamBangFootprint } from "@/lib/db";

// Nhan FOOTPRINT phai sinh tu engine (engine/dich-vu/dayFootprintPhaiSinh.mjs): JSON (co the gzip - header Content-Encoding: gzip)
// { ma: "VN30F1M", ngay: { "yyyy-mm-dd": [[tGiay, [[gia*10, mua, ban, khac], ...]], ...] } } - nen 1 phut tung ngay (lib/footprint.js tickThanhM1). Upsert theo (ma, ngay).
const TOI_DA_NGAY = 40;

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

async function docJson(request) {
  const nen = (request.headers.get("content-encoding") || "").toLowerCase();
  if (nen === "gzip" && request.body) {
    const giaiNen = request.body.pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(giaiNen).text());
  }
  return JSON.parse(await request.text());
}

export async function POST(request) {
  if (!kiemTraApiKey(request)) return Response.json({ loi: "API key khong dung" }, { status: 401 });
  let goi;
  try {
    goi = await docJson(request);
  } catch {
    return Response.json({ loi: "Noi dung khong phai JSON hop le" }, { status: 400 });
  }
  const ma = typeof goi?.ma === "string" && /^[A-Z0-9]{1,12}$/.test(goi.ma) ? goi.ma : null;
  if (!ma || !goi.ngay || typeof goi.ngay !== "object") return Response.json({ loi: "Thieu ma hoac ngay" }, { status: 400 });
  const ds = Object.entries(goi.ngay).filter(([ngay, m1]) => /^\d{4}-\d{2}-\d{2}$/.test(ngay) && Array.isArray(m1) && m1.length > 0).slice(0, TOI_DA_NGAY);
  if (ds.length === 0) return Response.json({ trangThai: "ok", soNgay: 0 });
  await withDb(async (client) => {
    await daoDamBangFootprint(client);
    await client.query(
      `INSERT INTO footprint_ngay (ma, ngay, du_lieu, cap_nhat)
       SELECT $1, n::date, d::jsonb, now() FROM unnest($2::text[], $3::text[]) AS x(n, d)
       ON CONFLICT (ma, ngay) DO UPDATE SET du_lieu = EXCLUDED.du_lieu, cap_nhat = now()`,
      [ma, ds.map(([n]) => n), ds.map(([, m1]) => JSON.stringify(m1))]
    );
  });
  return Response.json({ trangThai: "ok", soNgay: ds.length });
}
