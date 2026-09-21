// Tao cac phien ban logo cho web tu file goc (nen trang): node scripts/taoLogo.mjs <duong-dan-anh-goc>
// - Bo nen trang bang "color to alpha" (giu duoc do chuyen sac mem cua logo)
// - Tach: logo day du (bieu tuong + chu), chi bieu tuong, chi chu
// - Ban "toi" (dung tren nen toi): nang do sang cac vung tim dam de chu con doc duoc tren nen den
import sharp from "sharp";
import path from "node:path";

const nguon = process.argv[2];
if (!nguon) throw new Error("Thieu duong dan anh goc");
const RA = path.resolve("public");

// Toa do (anh goc 1536x1024): bieu tuong x 500-1035, y 250-610; chu y 630-760; logo day du x 395-1145, y 250-760.
const RONG = { dayDu: 640, bieuTuong: 260, chu: 420 }; // rong xuat ra (px) - du net cho man hinh 2x
const VUNG = {
  dayDu: { left: 395, top: 250, width: 750, height: 510 },
  bieuTuong: { left: 500, top: 250, width: 540, height: 365 },
  chu: { left: 395, top: 630, width: 750, height: 130 },
};

async function boNen(buf, nangSang = 0) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const min = Math.min(r, g, b);
    let a = (255 - min - 10) / (255 - 10);
    a = Math.max(0, Math.min(1, a * 1.08));
    if (a <= 0.01) {
      out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
      continue;
    }
    const un = (c) => Math.max(0, Math.min(255, (c - (1 - a) * 255) / a));
    let [rr, gg, bb] = [un(r), un(g), un(b)];
    if (nangSang > 0) {
      rr += (255 - rr) * nangSang;
      gg += (255 - gg) * nangSang;
      bb += (255 - bb) * nangSang;
    }
    out[i] = rr;
    out[i + 1] = gg;
    out[i + 2] = bb;
    out[i + 3] = Math.round(a * 255);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
}

for (const [ten, vung] of Object.entries(VUNG)) {
  const cat = await sharp(nguon).extract(vung).toBuffer();
  for (const [hauTo, nang] of [["", 0], ["-toi", 0.52]]) {
    const img = await boNen(cat, nang);
    const tenFile = { dayDu: "logo-day-du", bieuTuong: "logo-bieu-tuong", chu: "logo-chu" }[ten] + hauTo + ".png";
    const daCat = await img.trim({ threshold: 1 }).png().toBuffer();
    await sharp(daCat).resize({ width: RONG[ten] }).png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toFile(path.join(RA, tenFile));
    const m = await sharp(path.join(RA, tenFile)).metadata();
    console.log(tenFile, m.width + "x" + m.height);
  }
}
// favicon: bieu tuong ban "toi" tren nen tim dam de nhin ro tren moi thanh tab
const bt = await sharp(path.join(RA, "logo-bieu-tuong-toi.png")).resize({ width: 220, height: 220, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 12, g: 12, b: 20, alpha: 1 } } })
  .composite([{ input: bt, gravity: "center" }])
  .png()
  .toFile(path.resolve("app/icon.png"));
console.log("app/icon.png 256x256");
