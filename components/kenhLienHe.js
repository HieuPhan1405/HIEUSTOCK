// Chuan hoa duong dan cac kenh lien he do chu web nhap tay o /quan-tri (co the thieu "https://").

// Chi chap nhan http/https - chan javascript:, data: ... vi gia tri do nguoi nhap (khong tin cay).
export function linkNgoai(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  const url = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
  return /^https?:\/\//i.test(url) ? url : null;
}

// Uu tien link nhom/kenh Zalo chu web nhap; neu khong co thi mo chat truc tiep theo so dien thoai.
export function linkZalo(tt) {
  const nhom = linkNgoai(tt?.zalo);
  if (nhom) return nhom;
  const so = String(tt?.sdt || "").replace(/\D/g, "");
  return so.length >= 9 ? `https://zalo.me/${so}` : null;
}
