// TI LE MUA / BAN CUA SO LENH (hien tren app giao dich: "M 89,28% | 10,72% B") = tong KL dat mua 3 buoc gia tot nhat / (tong KL dat mua 3 buoc + tong KL dat ban 3 buoc).
// Du lieu: kenh DNSE "top_price.G1.json" (message T = "q": { symbol, bid: [{price, qtty} x3], offer: [{price, qtty} x3] }). Ham THUAN, test tay: engine/test/topGia.test.mjs.
const so = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// msg: payload cua kenh top_price. Tra ve { mua3, ban3, tiLe } (tiLe = % mua, 0-100) hoac null neu khong hop le / khong co lenh nao.
export function tinhTiLeMua(msg) {
  if (!msg || !Array.isArray(msg.bid) || !Array.isArray(msg.offer)) return null;
  const mua3 = msg.bid.slice(0, 3).reduce((s, x) => s + so(x?.qtty), 0);
  const ban3 = msg.offer.slice(0, 3).reduce((s, x) => s + so(x?.qtty), 0);
  if (!(mua3 + ban3 > 0)) return null;
  return { mua3, ban3, tiLe: (mua3 / (mua3 + ban3)) * 100 };
}
