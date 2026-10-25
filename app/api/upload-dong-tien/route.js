import { withDb, daoDamBangDongTien } from "@/lib/db";

// Nhan dong tien thoi gian thuc tu engine (engine/dich-vu/dongTienRealTime.mjs): JSON (co the nen gzip - header Content-Encoding: gzip)
// { ngay: "yyyy-mm-dd", luc, nguong, chiTiet: bool, thiTruong: {...}, ma: { SYM: { ...tomTat, chiTiet?: { phut, profile } } } }
// Upsert tung ma theo (ma, ngay); chi_tiet chi ghi khi goi co chiTiet = true (goi tom tat KHONG xoa chi tiet da co); thi truong 1 dong / ngay. Don dep: bo chi tiet cua cac ngay cu hon 4 ngay.
const SO_NGAY_GIU_CHI_TIET = 4;
const TOI_DA_MA = 800;

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
  const ngay = typeof goi?.ngay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(goi.ngay) ? goi.ngay : null;
  if (!ngay || !goi.ma || typeof goi.ma !== "object") return Response.json({ loi: "Thieu ngay hoac ma" }, { status: 400 });
  const ds = Object.entries(goi.ma).filter(([ma]) => /^[A-Z0-9]{1,12}$/.test(ma)).slice(0, TOI_DA_MA);
  if (ds.length === 0) return Response.json({ trangThai: "ok", soMa: 0 });
  const coChiTiet = goi.chiTiet === true;

  const maArr = ds.map(([ma]) => ma);
  const tomTatArr = ds.map(([, t]) => JSON.stringify({ ...t, chiTiet: undefined }));
  const chiTietArr = ds.map(([, t]) => (coChiTiet && t.chiTiet ? JSON.stringify(t.chiTiet) : null));
  await withDb(async (client) => {
    await daoDamBangDongTien(client);
    await client.query(
      `INSERT INTO dong_tien_ma (ma, ngay, tom_tat, chi_tiet, cap_nhat)
       SELECT m, $2::date, t::jsonb, c::jsonb, now() FROM unnest($1::text[], $3::text[], $4::text[]) AS x(m, t, c)
       ON CONFLICT (ma, ngay) DO UPDATE SET tom_tat = EXCLUDED.tom_tat, chi_tiet = COALESCE(EXCLUDED.chi_tiet, dong_tien_ma.chi_tiet), cap_nhat = now()`,
      [maArr, ngay, tomTatArr, chiTietArr]
    );
    if (goi.thiTruong) {
      const du = JSON.stringify({ ...goi.thiTruong, nguong: goi.nguong ?? null, luc: goi.luc ?? null });
      await client.query(
        `INSERT INTO dong_tien_thi_truong (ngay, du_lieu, cap_nhat) VALUES ($1::date, $2::jsonb, now())
         ON CONFLICT (ngay) DO UPDATE SET du_lieu = EXCLUDED.du_lieu, cap_nhat = now()`,
        [ngay, du]
      );
    }
    if (coChiTiet) await client.query(`UPDATE dong_tien_ma SET chi_tiet = NULL WHERE chi_tiet IS NOT NULL AND ngay < $1::date - $2::int`, [ngay, SO_NGAY_GIU_CHI_TIET]);
  });
  return Response.json({ trangThai: "ok", soMa: ds.length, chiTiet: coChiTiet });
}
