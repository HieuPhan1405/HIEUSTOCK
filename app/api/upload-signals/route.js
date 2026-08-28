import { withDb, daoDamBangTinHieu } from "@/lib/db";

// Nhan CSV tu script day_du_lieu_len_web.py (duoc xuat boi AFL
// amibroker/7_Export_LenWeb.afl). Header CSV bat buoc:
// ma,tin,diem,trend,mom,dt,adx,gia,doi,rs_vni,breadth_nganh,vung_tham_gia

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

function soFloat(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
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

  const hangDL = phanTichCSV(vanBanCSV).filter((h) => h.ma);
  if (hangDL.length === 0) {
    return Response.json({ loi: "Khong doc duoc dong du lieu nao tu CSV" }, { status: 400 });
  }

  // Ghi 1 lan bang unnest() thay vi 1 cau INSERT rieng cho tung dong - voi
  // vai tram/nghin ma (quet toan bo thi truong) cach cu se qua cham va de
  // vuot qua thoi gian toi da cua Vercel Function.
  const cot = (ten, chuyenDoi) => hangDL.map((h) => chuyenDoi(h[ten]));

  await withDb(async (client) => {
    await daoDamBangTinHieu(client);

    // cap_nhat_luc KHONG nam trong danh sach cot chen - dong moi se tu lay
    // gia tri DEFAULT now() cua bang, dong bi trung ma se duoc set lai now()
    // trong ON CONFLICT ben duoi.
    await client.query(
      `INSERT INTO tin_hieu
        (ma, tin, diem, trend, mom, dt, adx, gia, doi, rs_vni, breadth_nganh, vung_tham_gia)
       SELECT * FROM unnest(
         $1::text[], $2::text[], $3::float8[], $4::float8[], $5::float8[],
         $6::float8[], $7::float8[], $8::float8[], $9::float8[], $10::float8[],
         $11::float8[], $12::boolean[]
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
         vung_tham_gia = EXCLUDED.vung_tham_gia,
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
        cot("vung_tham_gia", (v) => v === "1" || v === "true"),
      ]
    );
  });

  return Response.json({ trangThai: "ok", soDongDaLuu: hangDL.length, tongSoDongNhan: hangDL.length });
}
