// XUAT BANG RA EXCEL (.xlsx that, khong can thu vien) VA PDF (hop thoai in cua trinh duyet -> "Luu thanh PDF"). Ham THUAN, test tay: engine/test/xuatBang.test.mjs.
// .xlsx = goi zip (khong nen) gom workbook + 1 sheet, o chu dung inlineStr, o so dung so that de Excel sap xep / tinh duoc.

const BANG_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = BANG_CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Gia tri o -> so (giu so that) hoac chuoi; null / object / NaN -> "".
export function chuanHoaO(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? v : "";
  if (typeof v === "boolean") return v ? "Có" : "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.every((x) => ["string", "number"].includes(typeof x)) ? v.join(", ") : "";
  return "";
}

const thoat = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // ky tu dieu khien (tru tab / xuong dong) khong hop le trong XML 1.0
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

const tenCot = (i) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

export function xmlSheet(tieuDeCot, hang) {
  const o = (v, r, c) => {
    const ref = `${tenCot(c)}${r}`;
    if (typeof v === "number") return `<c r="${ref}"><v>${v}</v></c>`;
    return v === "" ? "" : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${thoat(v)}</t></is></c>`;
  };
  const dong = (ds, r) => `<row r="${r}">${ds.map((v, c) => o(v, r, c)).join("")}</row>`;
  const rows = [dong(tieuDeCot, 1), ...hang.map((h, i) => dong(h, i + 2))].join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>${rows}</sheetData></worksheet>`;
}

function zipKhongNen(tep) {
  const enc = new TextEncoder();
  const phan = [];
  const trungTam = [];
  let offset = 0;
  const u16 = (v) => [v & 255, (v >>> 8) & 255];
  const u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  for (const [ten, noi] of tep) {
    const tn = enc.encode(ten);
    const nd = enc.encode(noi);
    const crc = crc32(nd);
    const dau = Uint8Array.from([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(nd.length), ...u32(nd.length), ...u16(tn.length), ...u16(0)]);
    phan.push(dau, tn, nd);
    trungTam.push(Uint8Array.from([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(nd.length), ...u32(nd.length), ...u16(tn.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), tn);
    offset += dau.length + tn.length + nd.length;
  }
  const kichThuocTT = trungTam.reduce((s, x) => s + x.length, 0);
  const cuoi = Uint8Array.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(tep.length), ...u16(tep.length), ...u32(kichThuocTT), ...u32(offset), ...u16(0)]);
  return new Blob([...phan, ...trungTam, cuoi], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// tieuDeCot: [chuoi]; hang: [[o]] (o = so hoac chuoi, da qua chuanHoaO); tenSheet toi da 31 ky tu.
export function taoXlsx(tieuDeCot, hang, tenSheet = "Bo loc") {
  const ten = thoat(tenSheet.replace(/[\/?*[\]:]/g, " ").slice(0, 31) || "Sheet1");
  return zipKhongNen([
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${ten}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`],
    ["xl/worksheets/sheet1.xml", xmlSheet(tieuDeCot, hang)],
  ]);
}

const dinhDangSo = (v) => (typeof v === "number" ? v.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : v);

// HTML de in thanh PDF (ngang kho A4, chu nho, tieu de cot lap lai moi trang).
export function htmlIn(tieuDe, phu, tieuDeCot, hang) {
  const th = tieuDeCot.map((t) => `<th>${thoat(t)}</th>`).join("");
  const tr = hang.map((h) => `<tr>${h.map((v) => `<td${typeof v === "number" ? ' class="so"' : ""}>${thoat(dinhDangSo(v))}</td>`).join("")}</tr>`).join("");
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${thoat(tieuDe)}</title><style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial,sans-serif;color:#111;margin:0}h1{font-size:15px;margin:0 0 2px}p{font-size:10px;color:#555;margin:0 0 8px}table{border-collapse:collapse;width:100%;font-size:8.5px}th,td{border:1px solid #ccc;padding:2px 4px;white-space:nowrap}th{background:#eee;text-align:left}thead{display:table-header-group}tr{page-break-inside:avoid}td.so{text-align:right}</style></head><body><h1>${thoat(tieuDe)}</h1><p>${thoat(phu)}</p><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></body></html>`;
}
