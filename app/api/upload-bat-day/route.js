import { withDb, daoDamBangBatDay } from "@/lib/db";

// Nhan CSV tu AFL amibroker/8_Export_ChecklistBatDay.afl - MOI dong la 1 lan
// checklist bat day kich hoat trong QUA KHU (khong phai trang thai hom nay
// nhu tin_hieu). Header CSV bat buoc (11 cot):
// ma,ngay,diem,gia_luc_tin_hieu,pct_sau_5,pct_sau_10,pct_sau_20,chiet_khau,rsi,capitulation,ftd

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

// Giong het phanTichCSV trong upload-signals: bo qua dong nao so cot khong
// khop header (phong khi AmiBroker Explore da luong lam hong vai dong).
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

// AFL xuat ngay theo dang "d/m/yyyy" - doi sang ISO "yyyy-mm-dd".
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
  const hangDL = hangThoRa.filter((h) => h.ma && soNgayVN(h.ngay));
  if (hangDL.length === 0) {
    return Response.json({ trangThai: "ok", soDongDaLuu: 0, tongSoDongNhan: 0, soDongLoiDaBoQua: soDongLoi });
  }

  // AFL tinh lai TOAN BO lich su (trong pham vi NamBatDauTheoDoi hien tai) moi
  // lan chay, nen upsert la du - cac su kien cu (da co gia sau 5/10/20 phien
  // that) se ghi lai y het gia tri cu (idempotent), su kien moi duoc dien dan.
  // NHUNG can XOA nhung dong khong con trong lan upload nay - vd khi doi
  // NamBatDauTheoDoi (loc bot lich su cu di), neu khong xoa thi du lieu cu
  // (2001-2023) se ton dong mai tren web du AmiBroker da loc dung.
  const cot = (ten, chuyenDoi) => hangDL.map((h) => chuyenDoi(h[ten]));
  let soDongDaXoa = 0;

  await withDb(async (client) => {
    await daoDamBangBatDay(client);
    await client.query(
      `INSERT INTO bat_day_su_kien
        (ma, ngay_tin_hieu, diem, gia_luc_tin_hieu, pct_sau_5, pct_sau_10, pct_sau_20, chiet_khau, rsi, capitulation, ftd)
       SELECT * FROM unnest(
         $1::text[], $2::date[], $3::float8[], $4::float8[], $5::float8[],
         $6::float8[], $7::float8[], $8::float8[], $9::float8[], $10::boolean[], $11::boolean[]
       )
       ON CONFLICT (ma, ngay_tin_hieu) DO UPDATE SET
         diem = EXCLUDED.diem,
         gia_luc_tin_hieu = EXCLUDED.gia_luc_tin_hieu,
         pct_sau_5 = EXCLUDED.pct_sau_5,
         pct_sau_10 = EXCLUDED.pct_sau_10,
         pct_sau_20 = EXCLUDED.pct_sau_20,
         chiet_khau = EXCLUDED.chiet_khau,
         rsi = EXCLUDED.rsi,
         capitulation = EXCLUDED.capitulation,
         ftd = EXCLUDED.ftd`,
      [
        cot("ma", (v) => v),
        cot("ngay", soNgayVN),
        cot("diem", soFloat),
        cot("gia_luc_tin_hieu", soFloat),
        cot("pct_sau_5", soFloat),
        cot("pct_sau_10", soFloat),
        cot("pct_sau_20", soFloat),
        cot("chiet_khau", soFloat),
        cot("rsi", soFloat),
        cot("capitulation", soBool),
        cot("ftd", soBool),
      ]
    );

    const { rowCount } = await client.query(
      `DELETE FROM bat_day_su_kien
       WHERE NOT EXISTS (
         SELECT 1 FROM unnest($1::text[], $2::date[]) AS moi(ma, ngay)
         WHERE moi.ma = bat_day_su_kien.ma AND moi.ngay = bat_day_su_kien.ngay_tin_hieu
       )`,
      [cot("ma", (v) => v), cot("ngay", soNgayVN)]
    );
    soDongDaXoa = rowCount;
  });

  return Response.json({
    trangThai: "ok",
    soDongDaLuu: hangDL.length,
    tongSoDongNhan: hangDL.length,
    soDongLoiDaBoQua: soDongLoi,
    soDongDaXoa,
  });
}
