// Lay SAN NIEM YET (HOSE/HNX/UPCOM) tu API cong khai VNDirect (cung nguon gia dang dung o
// lib/lichSuGia.js) - THAY THE hoan toan DS_SanHNX/DS_SanUPCOM gõ tay cua AFL, vi day CHI la
// nhan hien thi/loc (khong anh huong breadth_nganh/diem_rank hay vu tru quet) nen KHONG co rui ro
// lech so khi doi chieu voi AmiBroker - da xac nhan bang tay: VNM/QNS/CEO/DXG/AAA deu tra dung
// HOSE/HNX/UPCOM (xem lich su trao doi 2026-09-22).
const VNDIRECT_STOCKS = "https://api-finfo.vndirect.com.vn/v4/stocks";

// Tra ve Map<ma, "HOSE"|"HNX"|"UPCOM"|null>. Chia nho theo tung nhom `kichThuocNhom` ma/request
// de tranh URL qua dai (API chap nhan code:A,B,C,... noi day phay trong 1 tham so q).
export async function laySanTheoDanhSachMa(dsMa, { kichThuocNhom = 100 } = {}) {
  const ketQua = new Map();
  for (let i = 0; i < dsMa.length; i += kichThuocNhom) {
    const nhom = dsMa.slice(i, i + kichThuocNhom);
    const url = `${VNDIRECT_STOCKS}?q=code:${nhom.join(",")}&size=${nhom.length}&fields=code,floor`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) continue; // 1 nhom loi khong lam hong ca lo - cac ma trong nhom do se null (xu ly o noi goi)
    const j = await res.json();
    for (const d of j.data || []) ketQua.set(d.code, d.floor ?? null);
  }
  return ketQua;
}

// CHUA LAM: phan loai ngành DU PHONG qua VNDirect industry_classification (ICB) cho ma KHONG
// nam trong ca 15 danh sach tinh (engine/danh-sach/nganh.js) - endpoint da xac nhan hoat dong:
//   GET https://api-finfo.vndirect.com.vn/v4/industry_classification?q=codeList:<MA>&size=5
// tra ve nhieu cap do ICB (level 2/3/4), can 1 bang anh xa ICB -> 1 trong 15 nhom AFL truoc khi
// dung duoc - CHUA xay dung bang anh xa nay (rui ro lam sai neu voi vang, va hau nhu khong can
// thiet vi 389 ma trong 3 danh sach von hoa da bao het vu tru quet hien tai). Lam khi thuc su gap
// 1 ma moi chua co trong danh sach, khong lam truoc de tranh doan mo hinh phan loai sai.
