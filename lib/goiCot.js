// GOI DU LIEU DANG COT de gui tu may chu xuong trinh duyet (ham THUAN, dung o ca 2 phia; test: engine/test/goiCot.test.mjs).
// Mang ~390 doi tuong x ~150 truong (trang Bo loc) neu gui nguyen thi ten truong lap lai o MOI dong: 670 KB (nen ~144 KB). Gui 1 lan danh sach ten cot + moi dong 1 mang gia tri
// va lam tron so thap phan con 6 chu so co nghia -> ~360 KB (nen ~99 KB), trinh duyet doc nhanh hon. Gia tri null / thieu khi mo goi deu bi BO (giong truoc: truong thieu = khong co).
export function donCot(ds, { soChuSo = 6 } = {}) {
  const cot = [];
  const viTri = new Map();
  for (const r of ds) for (const k in r) if (r[k] != null && !viTri.has(k)) viTri.set(k, cot.push(k) - 1);
  const tron = (v) => (typeof v === "number" && Number.isFinite(v) && !Number.isInteger(v) ? Number(v.toPrecision(soChuSo)) : v);
  const hang = ds.map((r) => {
    const v = cot.map((k) => (r[k] == null ? null : tron(r[k])));
    while (v.length && v[v.length - 1] === null) v.pop(); // bo null o cuoi dong
    return v;
  });
  return { cot, hang };
}

export function moCot(goi) {
  if (!goi || !Array.isArray(goi.cot) || !Array.isArray(goi.hang)) return [];
  const { cot, hang } = goi;
  return hang.map((v) => {
    const o = {};
    for (let i = 0; i < v.length; i++) if (v[i] != null) o[cot[i]] = v[i];
    return o;
  });
}
