import { withDb } from "@/lib/db";

// PHAN TICH CO BAN (RRG nganh + Z/F/DuPont/Danh gia 360 tung ma): engine/dich-vu/taoDuLieuPhanTichWeb.mjs + dayPhanTichCoBan.mjs day len sau khi co bao cao tai chinh moi
// (moi quy 1 lan) hoac cuoi phien (RRG). 1 bang khoa-gia tri: khoa "RRG" = RRG nganh, khoa "ma:HPG" = phan tich 1 ma. Doc nho 60 giay trong bo nho instance.
const HAN_MS = 60_000;
const kho = new Map();
let daTao = null;

function taoBang(client) {
  daTao ??= client
    .query(`CREATE TABLE IF NOT EXISTS phan_tich_co_ban (khoa TEXT PRIMARY KEY, du_lieu JSONB NOT NULL, cap_nhat TIMESTAMPTZ NOT NULL DEFAULT now())`)
    .catch((e) => {
      daTao = null;
      throw e;
    });
  return daTao;
}

async function doc(khoa) {
  const e = kho.get(khoa);
  if (e && Date.now() - e.luc < HAN_MS) return e.gt;
  const gt = await withDb(async (client) => {
    await taoBang(client);
    const { rows } = await client.query(`SELECT du_lieu, cap_nhat FROM phan_tich_co_ban WHERE khoa = $1`, [khoa]);
    return rows[0] ? { ...rows[0].du_lieu, capNhat: rows[0].cap_nhat } : null;
  });
  kho.set(khoa, { luc: Date.now(), gt });
  return gt;
}

export const layRRGNganh = () => doc("RRG");
export function layPhanTichMa(ma) {
  const m = String(ma || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return m ? doc(`ma:${m}`) : Promise.resolve(null);
}

// muc: { khoa: doi tuong } - upsert tung khoa
export async function ghiPhanTichCoBan(muc) {
  const khoa = Object.keys(muc);
  if (!khoa.length) return 0;
  await withDb(async (client) => {
    await taoBang(client);
    await client.query(
      `INSERT INTO phan_tich_co_ban (khoa, du_lieu, cap_nhat) SELECT k, v::jsonb, now() FROM unnest($1::text[], $2::text[]) AS t(k, v)
       ON CONFLICT (khoa) DO UPDATE SET du_lieu = EXCLUDED.du_lieu, cap_nhat = now()`,
      [khoa, khoa.map((k) => JSON.stringify(muc[k]))]
    );
  });
  kho.clear();
  return khoa.length;
}
