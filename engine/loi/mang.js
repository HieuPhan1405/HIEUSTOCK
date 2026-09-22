// Cac ham mang THUAN dung chung, mo phong dung ngu nghia ham AmiBroker AFL tren mot mang JS
// thuong (index 0 = nen CU NHAT, index cuoi = nen MOI NHAT - giong thu tu AmiBroker noi bo).
// Cac gia tri "chua du du lieu" (vd HHV(H,9) o nen thu 2) tra ve null, giong AmiBroker tra Null.

// HHV(mang, n): cao nhat trong n nen gan nhat (bao gom nen hien tai).
export function hhv(mang, n) {
  const kq = new Array(mang.length).fill(null);
  for (let i = 0; i < mang.length; i++) {
    if (i < n - 1) continue;
    let max = -Infinity;
    for (let k = i - n + 1; k <= i; k++) if (mang[k] > max) max = mang[k];
    kq[i] = max;
  }
  return kq;
}

// LLV(mang, n): thap nhat trong n nen gan nhat.
export function llv(mang, n) {
  const kq = new Array(mang.length).fill(null);
  for (let i = 0; i < mang.length; i++) {
    if (i < n - 1) continue;
    let min = Infinity;
    for (let k = i - n + 1; k <= i; k++) if (mang[k] < min) min = mang[k];
    kq[i] = min;
  }
  return kq;
}

// Ref(mang, n): n<0 = gia tri N nen TRUOC (qua khu); n>0 = N nen SAU (tuong lai, chi dung duoc
// trong du lieu lich su da co san, giong AFL). Ngoai vung -> null.
export function ref(mang, n) {
  const kq = new Array(mang.length).fill(null);
  for (let i = 0; i < mang.length; i++) {
    const j = i + n;
    if (j >= 0 && j < mang.length) kq[i] = mang[j];
  }
  return kq;
}

// Sum(mang, n): tong n nen gan nhat.
export function sum(mang, n) {
  const kq = new Array(mang.length).fill(null);
  let chay = 0;
  for (let i = 0; i < mang.length; i++) {
    chay += num(mang[i]);
    if (i >= n) chay -= num(mang[i - n]);
    if (i >= n - 1) kq[i] = chay;
  }
  return kq;
}

// MA(mang, n): trung binh cong don gian n nen.
export function sma(mang, n) {
  const s = sum(mang, n);
  return s.map((v) => (v == null ? null : v / n));
}

// Toan tu 2 mang theo tung phan tu, giu null neu 1 trong 2 la null (giong AmiBroker: phep toan
// tren gia tri Null cho ra Null).
export function zip2(a, b, f) {
  const n = Math.min(a.length, b.length);
  const kq = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (a[i] == null || b[i] == null) continue;
    kq[i] = f(a[i], b[i]);
  }
  return kq;
}

export function max2(a, b) {
  return zip2(a, b, Math.max);
}
export function min2(a, b) {
  return zip2(a, b, Math.min);
}

// ValueWhen(dieuKien, mang, n): gia tri cua `mang` tai lan thu n GAN NHAT (n=1 la gan nhat, TINH
// CA nen hien tai neu dieuKien[i] dung ngay tai i) ma dieuKien dung, giu nguyen cho toi lan dung
// tiep theo. Chua co lan nao dung du -> null.
export function valueWhen(dieuKien, mang, n = 1) {
  const ketQua = new Array(mang.length).fill(null);
  const lichSu = [];
  for (let i = 0; i < mang.length; i++) {
    if (dieuKien[i]) lichSu.push(mang[i]);
    const viTri = lichSu.length - n;
    ketQua[i] = viTri >= 0 ? lichSu[viTri] : null;
  }
  return ketQua;
}

function num(v) {
  return v == null ? 0 : v;
}
