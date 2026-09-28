import { withDb, daoDamBangChiBao } from "@/lib/db";
import { COT_CHI_BAO } from "@/lib/cotChiBaoKyThuat";

// Doc / ghi bang chi_bao_ky_thuat (chi bao ky thuat cho bo loc). Engine day len sau moi lan tinh (~1 phut/lan trong phien), trang Bo loc doc.
// Nho 30 giay trong bo nho instance nhu lib/tinHieu.js - nhieu nguoi mo trang cung luc chi truy van DB 1 lan.
const HAN_BO_NHO_MS = 30_000;
let boNho = { luc: 0, du: null, dangTai: null };
let theHe = 0;

export function xoaBoNhoChiBao() {
  theHe++;
  boNho = { luc: 0, du: null, dangTai: null };
}

// { hang: [{ ma, ngay_nen, cap_nhat_luc, ...COT_CHI_BAO }], capNhatLuc } - capNhatLuc = lan day gan nhat (null neu bang rong).
export async function layChiBaoKyThuat() {
  if (boNho.du && Date.now() - boNho.luc < HAN_BO_NHO_MS) return boNho.du;
  if (boNho.dangTai) return boNho.dangTai;
  const heLucBatDau = theHe;
  const dangTai = withDb(async (client) => {
    await daoDamBangChiBao(client);
    const { rows } = await client.query(
      `SELECT ma, to_char(ngay_nen, 'YYYY-MM-DD') AS ngay_nen, cap_nhat_luc, ${COT_CHI_BAO.join(", ")} FROM chi_bao_ky_thuat`
    );
    const capNhatLuc = rows.reduce((max, r) => (r.cap_nhat_luc && (!max || r.cap_nhat_luc > max) ? r.cap_nhat_luc : max), null);
    return { hang: rows, capNhatLuc };
  })
    .then((du) => {
      if (theHe === heLucBatDau) boNho = { luc: Date.now(), du, dangTai: null };
      return du;
    })
    .catch((loi) => {
      if (theHe === heLucBatDau) boNho.dangTai = null;
      throw loi;
    });
  boNho.dangTai = dangTai;
  return dangTai;
}

// hang: [{ ma, ngay_nen, ...COT_CHI_BAO }] (cot thieu / khong phai so -> NULL). Upsert theo ma, KHONG xoa ma nao (ma da het niem yet tu mat khi trang noi voi tin_hieu).
export async function ghiChiBaoKyThuat(client, hang) {
  await daoDamBangChiBao(client);
  const cot = (ten, chuyenDoi) => hang.map((h) => chuyenDoi(h[ten]));
  const so = (v) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  const ngay = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v : null);
  const tenCot = ["ma", "ngay_nen", ...COT_CHI_BAO];
  const kieu = ["text[]", "date[]", ...COT_CHI_BAO.map(() => "float8[]")];
  const giaTri = [cot("ma", (v) => v), cot("ngay_nen", ngay), ...COT_CHI_BAO.map((c) => cot(c, so))];
  await client.query(
    `INSERT INTO chi_bao_ky_thuat (${tenCot.join(", ")}, cap_nhat_luc)
     SELECT *, now() FROM unnest(${kieu.map((k, i) => `$${i + 1}::${k}`).join(", ")})
     ON CONFLICT (ma) DO UPDATE SET ${tenCot.slice(1).map((c) => `${c} = EXCLUDED.${c}`).join(", ")}, cap_nhat_luc = now()`,
    giaTri
  );
  xoaBoNhoChiBao();
}
