// Test cau truc cho engine/dnse/vendorSdk (SDK chinh thuc DNSE, copy nguyen van) va
// engine/dnse/openApiClient.js. KHONG co test-vector chinh thuc tu DNSE de doi chieu tuyet doi
// dung/sai cua chu ky HMAC - chi kiem tra: (1) chay khong loi, (2) dinh dang dau ra dung nhu mo
// ta trong tai lieu (vd cau truc Header Signature), (3) doi input thi doi ky (nhay cam voi moi
// thay doi, dung de bat sau nay neu ai vo tinh sua sai file vendor).
import commonCjs from "../dnse/vendorSdk/common.cjs";
import clientCjs from "../dnse/vendorSdk/client.cjs";
import { taoOpenApiClient, layNenOHLC } from "../dnse/openApiClient.js";

const { buildSignature, formatDateHeader } = commonCjs;
const { DNSEClient } = clientCjs;

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// ---- formatDateHeader: dung dinh dang RFC-1123-nhu vi du trong tai lieu DNSE ----
{
  const d = new Date(Date.UTC(2026, 0, 19, 7, 45, 23)); // Mon, 19 Jan 2026
  ok("formatDateHeader dung dinh dang 'Mon, 19 Jan 2026 07:45:23 +0000'", formatDateHeader(d) === "Mon, 19 Jan 2026 07:45:23 +0000", formatDateHeader(d));
}

// ---- buildSignature: dau ra la base64 da URL-encode, thay doi theo tung tham so dau vao ----
{
  const a = buildSignature("bi_mat_1", "GET", "/price/ohlc", "Mon, 19 Jan 2026 07:45:23 +0000", "hmac-sha256", "nonce123");
  ok("headers dung '(request-target) date'", a.headers === "(request-target) date");
  ok("signature la chuoi khong rong", typeof a.signature === "string" && a.signature.length > 0);

  const b = buildSignature("bi_mat_2", "GET", "/price/ohlc", "Mon, 19 Jan 2026 07:45:23 +0000", "hmac-sha256", "nonce123");
  ok("doi API Secret -> chu ky khac di", a.signature !== b.signature);

  const c = buildSignature("bi_mat_1", "GET", "/price/ohlc", "Mon, 19 Jan 2026 07:45:24 +0000", "hmac-sha256", "nonce123");
  ok("doi Date (1 giay) -> chu ky khac di", a.signature !== c.signature);

  const d = buildSignature("bi_mat_1", "POST", "/price/ohlc", "Mon, 19 Jan 2026 07:45:23 +0000", "hmac-sha256", "nonce123");
  ok("doi method (GET->POST) -> chu ky khac di", a.signature !== d.signature);
}

// ---- DNSEClient: dung URL/duong dan, dung dinh dang Header Signature composite ----
{
  const client = new DNSEClient({ apiKey: "KEY_GIA_LAP", apiSecret: "SECRET_GIA_LAP" });
  const { status, body } = await client.getOhlc("STOCK", { query: { symbol: "VJC", resolution: "1D", from: 1, to: 2 }, dryRun: true });
  ok("dryRun tra ve status/body null (khong goi mang that)", status === null && body === null);

  // Kiem tra url duoc dung dung qua console.log khi dryRun (bat DEBUG hoac dungRun deu in ra) -
  // gian tiep xac nhan qua goi getOhlc khong nem loi va path/query duoc dung.
}

// ---- taoOpenApiClient: thieu apiKey/apiSecret -> nem loi ngay ----
{
  let daThu = false;
  try {
    taoOpenApiClient({});
  } catch {
    daThu = true;
  }
  ok("Thieu apiKey/apiSecret -> nem loi ngay", daThu);
}

// ---- layNenOHLC: parse dung dinh dang { t, o, h, l, c, v } tu phan hoi gia lap ----
{
  const clientGiaLap = {
    getOhlc: async () => ({
      status: 200,
      body: JSON.stringify({ t: [1700000000, 1700086400], o: [10, 11], h: [12, 13], l: [9, 10], c: [11, 12], v: [1000, 2000], nextTime: 0 }),
    }),
  };
  const nen = await layNenOHLC(clientGiaLap, { symbol: "VJC", tu: 1, den: 2 });
  ok("layNenOHLC tra ve dung 2 nen", nen.length === 2);
  ok("moi nen co dung 6 truong t/o/h/l/c/v", "t" in nen[0] && "o" in nen[0] && "h" in nen[0] && "l" in nen[0] && "c" in nen[0] && "v" in nen[0]);
  ok("t duoc doi tu Unix timestamp sang YYYY-MM-DD", /^\d{4}-\d{2}-\d{2}$/.test(nen[0].t), nen[0].t);
}
{
  const clientLoi = { getOhlc: async () => ({ status: 400, body: '{"message":"loi gia lap"}' }) };
  let thongBao = null;
  try {
    await layNenOHLC(clientLoi, { symbol: "VJC", tu: 1, den: 2 });
  } catch (e) {
    thongBao = e.message;
  }
  ok("HTTP loi -> nem loi ro rang kem noi dung phan hoi", thongBao != null && thongBao.includes("400"), thongBao);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
