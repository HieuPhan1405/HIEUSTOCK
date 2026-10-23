// BO NHO TRONG BO NHO MAY CHU kieu "tra ngay ban cu, lam moi ngam" (stale-while-revalidate) cho cac nguon NGOAI cham (VNDirect, gia lich su...) de trang khong phai doi nguon do moi lan mo.
//  - co gia tri (du da cu): tra NGAY; neu da qua `hanMs` thi lam moi o nen (moi khoa chi 1 lan tai cung luc);
//  - chua co gia tri (instance moi khoi dong): cho toi da `choToiDaMs` roi tra null (lan tai van chay tiep va cap nhat bo nho cho lan sau);
//  - tai loi: giu gia tri cu, thu lai sau ~30 giay.
const kho = new Map();

export async function layCoDem(khoa, hanMs, taiFn, { choToiDaMs = 1500 } = {}) {
  let e = kho.get(khoa);
  if (!e) {
    e = { gt: undefined, luc: 0, dangTai: null };
    kho.set(khoa, e);
  }
  const hetHan = Date.now() - e.luc > hanMs;
  if ((e.gt === undefined || hetHan) && !e.dangTai) {
    const entry = e;
    entry.dangTai = Promise.resolve()
      .then(taiFn)
      .then(
        (v) => {
          if (v != null) {
            entry.gt = v;
            entry.luc = Date.now();
          } else entry.luc = Date.now() - hanMs + 30_000;
          return v;
        },
        () => {
          entry.luc = Date.now() - hanMs + 30_000;
          return null;
        }
      )
      .finally(() => {
        entry.dangTai = null;
      });
  }
  if (e.gt !== undefined) return e.gt;
  return Promise.race([e.dangTai, new Promise((r) => setTimeout(() => r(null), choToiDaMs))]);
}
