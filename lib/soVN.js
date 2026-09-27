// DINH DANG SO KIEU VIET NAM (ham THUAN, import tuong doi de test tay: engine/test/soVN.test.mjs): dau cham ngan hang nghin, dau phay thap phan - 1.785,11 · 26.769 ty · 1,48 trieu cp.
// Chi dung cho CHU HIEN THI (khong dung cho gia tri o nhap / CSV / toa do bieu do).

const trong = (v) => v === null || v === undefined || v === "" || Number.isNaN(Number(v));

const boDem = new Map();
function dinhDang(toiThieu, toiDa) {
  const khoa = `${toiThieu}|${toiDa}`;
  if (!boDem.has(khoa)) boDem.set(khoa, new Intl.NumberFormat("vi-VN", { minimumFractionDigits: toiThieu, maximumFractionDigits: toiDa }));
  return boDem.get(khoa);
}

// So thuong: toi da `chuSo` chu so thap phan, bo so 0 thua (1785.1 -> "1.785,1"; 243 -> "243"). codinh = true: luon du `chuSo` chu so (1785.1 -> "1.785,10").
export function soVN(v, chuSo = 2, coDinh = false) {
  if (trong(v)) return "—";
  const n = Number(v);
  // Tranh "-0" khi lam tron so am rat nho.
  const r = Math.abs(n) < 0.5 * 10 ** -chuSo ? 0 : n;
  return dinhDang(coDinh ? chuSo : 0, chuSo).format(r);
}

// Phan tram co dau: +1,25% / -0,4% / 0%. coDau = false: khong them "+" cho so duong.
export function pctVN(v, chuSo = 2, coDau = true) {
  if (trong(v)) return "—";
  const n = Number(Number(v).toFixed(chuSo));
  return `${coDau && n > 0 ? "+" : ""}${soVN(n, chuSo)}%`;
}

// Ty dong (von hoa, GTGD): >= 100 lam tron so nguyen, nho hon giu 1 chu so thap phan (10,4 ty khac 10 ty khi so voi nguong "tren 10 ty").
export function tyVN(v) {
  if (trong(v)) return "—";
  const n = Number(v);
  return soVN(n, Math.abs(n) >= 100 ? 0 : 1);
}

// Khoi luong co phieu: 1,48 trieu cp · 850 nghìn cp · 620 cp.
export function khoiLuongVN(v) {
  if (trong(v)) return "—";
  const n = Number(v);
  if (Math.abs(n) >= 1e6) return `${soVN(n / 1e6, 2)} triệu cp`;
  if (Math.abs(n) >= 1e3) return `${soVN(n / 1e3, 0)} nghìn cp`;
  return `${soVN(n, 0)} cp`;
}
