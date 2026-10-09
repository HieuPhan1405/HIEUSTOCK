import { withDb, daoDamBangKichBanMua, KICH_BAN_MUA_COT_SO, KICH_BAN_MUA_COT_NGAY } from "@/lib/db";

// Doc / ghi bang kich_ban_mua (engine/dich-vu/kichBanMua.mjs day len ~15 phut/lan, trang /kich-ban-mua doc).
// Nho 30 giay trong bo nho instance nhu lib/chiBaoLocDb.js - nhieu nguoi mo trang cung luc chi truy van DB 1 lan.
const HAN_BO_NHO_MS = 30_000;
let boNho = { luc: 0, du: null, dangTai: null };
let theHe = 0;

export function xoaBoNhoKichBan() {
  theHe++;
  boNho = { luc: 0, du: null, dangTai: null };
}

// { hang: [{ ma, tin, cap_nhat_luc, ngay_nen, ... }], capNhatLuc } - capNhatLuc = lan day gan nhat (null neu bang rong). Cot ngay tra ve dang "yyyy-mm-dd".
export async function layKichBanMua() {
  if (boNho.du && Date.now() - boNho.luc < HAN_BO_NHO_MS) return boNho.du;
  if (boNho.dangTai) return boNho.dangTai;
  const heLucBatDau = theHe;
  const dangTai = withDb(async (client) => {
    await daoDamBangKichBanMua(client);
    const cotNgay = KICH_BAN_MUA_COT_NGAY.map((c) => `to_char(${c}, 'YYYY-MM-DD') AS ${c}`);
    const { rows } = await client.query(`SELECT ma, tin, loai, cap_nhat_luc, ${KICH_BAN_MUA_COT_SO.join(", ")}, ${cotNgay.join(", ")} FROM kich_ban_mua`);
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

const so = (v) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
const ngay = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v : null);

// hang: [{ ma, tin, ngay_nen, gia, ... }]. Upsert theo ma. daydu=true (lan quet TOAN BO) thi xoa them cac ma khong con trong lan day nay
// (ma vua co lenh / het niem yet khong con kich ban mua) - chi xoa khi so dong >= 50 de mot lan day loi khong xoa het du lieu.
export async function ghiKichBanMua(client, hang, { daydu = false } = {}) {
  await daoDamBangKichBanMua(client);
  if (hang.length === 0) return 0;
  const cot = (ten, chuyenDoi) => hang.map((h) => chuyenDoi(h[ten]));
  const tenCot = ["ma", "tin", "loai", ...KICH_BAN_MUA_COT_SO, ...KICH_BAN_MUA_COT_NGAY];
  const kieu = ["text[]", "text[]", "text[]", ...KICH_BAN_MUA_COT_SO.map(() => "float8[]"), ...KICH_BAN_MUA_COT_NGAY.map(() => "date[]")];
  const giaTri = [
    cot("ma", (v) => v),
    cot("tin", (v) => (typeof v === "string" ? v.slice(0, 20) : null)),
    cot("loai", (v) => (v === "GIUA" ? "GIUA" : "MUA")),
    ...KICH_BAN_MUA_COT_SO.map((c) => cot(c, so)),
    ...KICH_BAN_MUA_COT_NGAY.map((c) => cot(c, ngay)),
  ];
  await client.query(
    `INSERT INTO kich_ban_mua (${tenCot.join(", ")}, cap_nhat_luc)
     SELECT *, now() FROM unnest(${kieu.map((k, i) => `$${i + 1}::${k}`).join(", ")})
     ON CONFLICT (ma) DO UPDATE SET ${tenCot.slice(1).map((c) => `${c} = EXCLUDED.${c}`).join(", ")}, cap_nhat_luc = now()`,
    giaTri
  );
  if (daydu && hang.length >= 50) {
    await client.query(`DELETE FROM kich_ban_mua WHERE NOT (ma = ANY($1::text[]))`, [hang.map((h) => h.ma)]);
  }
  xoaBoNhoKichBan();
  return hang.length;
}
