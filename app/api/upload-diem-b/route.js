import { withDb, daoDamBangDiemB } from "@/lib/db";

// Nhan CSV lich su DIEM MUA PHUC HOI (diem B) tu engine (engine/loi/lichSuDiemB.js xayDungCsvDiemB) - moi dong la 1 diem B cua 1 ma, tinh lai TOAN BO tu dau 2026 moi lan.
// Header: ma,ngay,gia_b,giam,kl_day,day_20,sl,tp1,tp2,tp3,gia_vao,pct_sau_5,pct_sau_10,pct_sau_20,vni_yeu,gtgd (ngay dang yyyy-mm-dd, o rong = NULL).
// Upsert theo (ma, ngay); dong cu tu ngay nho nhat cua lan upload tro di ma khong con trong lan nay bi xoa (chi khi lan upload du lon, tranh xoa nham khi engine moi tai duoc vai ma).

const NGUONG_XOA_TOI_THIEU = 50;

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

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

const soFloat = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
const soBool = (v) => (v === "1" || v === "true" ? true : v === "0" || v === "false" ? false : null);
const soNgay = (v) => (/^\d{4}-\d{2}-\d{2}$/.test((v ?? "").trim()) ? v.trim() : null);

export async function POST(request) {
  if (!kiemTraApiKey(request)) return Response.json({ loi: "API key khong dung" }, { status: 401 });
  const vanBan = await request.text();
  if (!vanBan || !vanBan.trim()) return Response.json({ loi: "Noi dung CSV rong" }, { status: 400 });

  const { hangDL: hangTho, soDongLoi } = phanTichCSV(vanBan);
  const hangDL = hangTho.filter((h) => h.ma && soNgay(h.ngay));
  if (hangDL.length === 0) return Response.json({ trangThai: "ok", soDongDaLuu: 0, soDongLoiDaBoQua: soDongLoi });

  const cot = (ten, chuyenDoi) => hangDL.map((h) => chuyenDoi(h[ten]));
  const ngayNhoNhat = hangDL.reduce((m, h) => (h.ngay < m ? h.ngay : m), hangDL[0].ngay);
  let soDongDaXoa = 0;
  await withDb(async (client) => {
    await daoDamBangDiemB(client);
    await client.query(
      `INSERT INTO diem_b_su_kien (ma, ngay, gia_b, giam, kl_day, day_20, sl, tp1, tp2, tp3, gia_vao, pct_sau_5, pct_sau_10, pct_sau_20, vni_yeu, gtgd)
       SELECT * FROM unnest($1::text[], $2::date[], $3::float8[], $4::float8[], $5::float8[], $6::float8[], $7::float8[], $8::float8[], $9::float8[], $10::float8[],
                            $11::float8[], $12::float8[], $13::float8[], $14::float8[], $15::boolean[], $16::float8[])
       ON CONFLICT (ma, ngay) DO UPDATE SET
         gia_b = EXCLUDED.gia_b, giam = EXCLUDED.giam, kl_day = EXCLUDED.kl_day, day_20 = EXCLUDED.day_20, sl = EXCLUDED.sl, tp1 = EXCLUDED.tp1, tp2 = EXCLUDED.tp2, tp3 = EXCLUDED.tp3,
         gia_vao = EXCLUDED.gia_vao, pct_sau_5 = EXCLUDED.pct_sau_5, pct_sau_10 = EXCLUDED.pct_sau_10, pct_sau_20 = EXCLUDED.pct_sau_20, vni_yeu = EXCLUDED.vni_yeu, gtgd = EXCLUDED.gtgd`,
      [
        cot("ma", (v) => v), cot("ngay", soNgay), cot("gia_b", soFloat), cot("giam", soFloat), cot("kl_day", soFloat), cot("day_20", soFloat), cot("sl", soFloat), cot("tp1", soFloat), cot("tp2", soFloat), cot("tp3", soFloat),
        cot("gia_vao", soFloat), cot("pct_sau_5", soFloat), cot("pct_sau_10", soFloat), cot("pct_sau_20", soFloat), cot("vni_yeu", soBool), cot("gtgd", soFloat),
      ]
    );
    if (hangDL.length >= NGUONG_XOA_TOI_THIEU) {
      const { rowCount } = await client.query(
        `DELETE FROM diem_b_su_kien
         WHERE ngay >= $3::date AND NOT EXISTS (
           SELECT 1 FROM unnest($1::text[], $2::date[]) AS moi(ma, ngay) WHERE moi.ma = diem_b_su_kien.ma AND moi.ngay = diem_b_su_kien.ngay
         )`,
        [cot("ma", (v) => v), cot("ngay", soNgay), ngayNhoNhat]
      );
      soDongDaXoa = rowCount;
    }
  });
  return Response.json({ trangThai: "ok", soDongDaLuu: hangDL.length, soDongLoiDaBoQua: soDongLoi, soDongDaXoa });
}
