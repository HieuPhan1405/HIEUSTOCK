// Lop boc ESM mong quanh SDK chinh thuc cua DNSE (engine/dnse/vendorSdk/*.cjs, giu nguyen ban
// goc tu GitHub) + ham lay lich su OHLC dung dinh dang { t, o, h, l, c, v } giong het
// lib/lichSuGia.js de tai su dung cach xu ly da co san trong du an.
//
// CHI dung apiKey/apiSecret tu BIEN MOI TRUONG do nguoi dung tu set (vd .env.dnse.local) - KHONG
// hardcode/luu o dau khac. Day la khoa API cua tai khoan giao dich that.
import clientCjs from "./vendorSdk/client.cjs";
const { DNSEClient } = clientCjs;

export function taoOpenApiClient({ apiKey, apiSecret, baseUrl } = {}) {
  if (!apiKey || !apiSecret) {
    throw new Error("Thieu apiKey/apiSecret DNSE - phai truyen tu bien moi truong, khong duoc hardcode.");
  }
  return new DNSEClient({ apiKey, apiSecret, ...(baseUrl ? { baseUrl } : {}) });
}

// type: "STOCK" | "DERIVATIVE" | "INDEX". resolution: "1D" cho nen ngay (mac dinh toan he thong).
// Tra ve mang nen tang dan theo ngay [{ t: "YYYY-MM-DD", o, h, l, c, v }], giong het dinh dang
// lib/lichSuGia.js dang dung, hoac nem loi neu request that bai/phan hoi bat thuong.
export async function layNenOHLC(client, { symbol, type = "STOCK", resolution = "1D", tu, den }) {
  const { status, body } = await client.getOhlc(type, { query: { symbol, resolution, from: tu, to: den } });
  if (status !== 200) throw new Error(`DNSE OpenAPI tra ve loi (HTTP ${status}): ${body?.slice(0, 500)}`);
  let j;
  try {
    j = JSON.parse(body);
  } catch {
    throw new Error("DNSE OpenAPI tra ve du lieu khong phai JSON hop le: " + String(body).slice(0, 200));
  }
  if (!Array.isArray(j.t)) throw new Error("Phan hoi OHLC thieu mang 't' - cau truc bat thuong: " + JSON.stringify(j).slice(0, 300));
  const ngayIso = (giay) => new Date(giay * 1000).toISOString().slice(0, 10);
  return j.t.map((t, i) => ({ t: ngayIso(t), o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 }));
}
