import { withDb, daoDamBangTinHieu } from "@/lib/db";

// Nhan CSV tu script day_du_lieu_len_web.py (duoc xuat boi AFL
// amibroker/7_Export_LenWeb.afl). Header CSV bat buoc:
// ma,tin,diem,trend,mom,dt,adx,gia,doi,rs_vni,breadth_nganh,vung_tham_gia

// TAM THOI - de debug loi 401 API key. KHONG lo gia tri that, chi bao co/khong
// va do dai. Xoa endpoint nay sau khi xac nhan xong.
export async function GET() {
  const key = process.env.UPLOAD_API_KEY;
  return Response.json({ daCoBien: !!key, doDai: key ? key.length : 0 });
}

const CAC_COT = [
  "ma",
  "tin",
  "diem",
  "trend",
  "mom",
  "dt",
  "adx",
  "gia",
  "doi",
  "rs_vni",
  "breadth_nganh",
  "vung_tham_gia",
];

function kiemTraApiKey(request) {
  const key = request.headers.get("x-api-key");
  const dungKey = process.env.UPLOAD_API_KEY;
  return dungKey && key === dungKey;
}

function phanTichCSV(vanBan) {
  const dong = vanBan.trim().split(/\r?\n/);
  if (dong.length === 0) return [];
  const header = dong[0].split(",").map((h) => h.trim());
  const ketQua = [];
  for (let i = 1; i < dong.length; i++) {
    if (!dong[i].trim()) continue;
    const cot = dong[i].split(",");
    const hang = {};
    header.forEach((ten, idx) => (hang[ten] = cot[idx]));
    ketQua.push(hang);
  }
  return ketQua;
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

  const hangDL = phanTichCSV(vanBanCSV);
  if (hangDL.length === 0) {
    return Response.json({ loi: "Khong doc duoc dong du lieu nao tu CSV" }, { status: 400 });
  }

  let soDongDaLuu = 0;

  await withDb(async (client) => {
    await daoDamBangTinHieu(client);

    for (const hang of hangDL) {
      if (!hang.ma) continue;
      await client.query(
        `INSERT INTO tin_hieu
          (ma, tin, diem, trend, mom, dt, adx, gia, doi, rs_vni, breadth_nganh, vung_tham_gia, cap_nhat_luc)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
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
           vung_tham_gia = EXCLUDED.vung_tham_gia,
           cap_nhat_luc = now()`,
        [
          hang.ma,
          hang.tin || "TRUNG LAP",
          soFloat(hang.diem),
          soFloat(hang.trend),
          soFloat(hang.mom),
          soFloat(hang.dt),
          soFloat(hang.adx),
          soFloat(hang.gia),
          soFloat(hang.doi),
          soFloat(hang.rs_vni),
          soFloat(hang.breadth_nganh),
          hang.vung_tham_gia === "1" || hang.vung_tham_gia === "true",
        ]
      );
      soDongDaLuu++;
    }
  });

  return Response.json({ trangThai: "ok", soDongDaLuu, tongSoDongNhan: hangDL.length });
}

function soFloat(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
