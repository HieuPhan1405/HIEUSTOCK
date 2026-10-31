// FETCH CO HAN NGAN + THU LAI (31/10/2026, web thi thoang dung 16-21 giay roi tu het): ket noi giu san (keep-alive) toi nguon gia / khoi ngoai co the da chet am tham khi instance serverless bi dong bang roi chay lai,
// yeu cau treo den het han 15 giay moi bao loi. Cho moi lan thu mot han NGAN (mac dinh 5 giay roi 8 giay); lan thu lai mo ket noi moi. Loi HTTP (res.ok = false) KHONG thu lai - do la phan hoi that tu nguon.
export async function fetchThuLai(url, opts = {}, hanMs = [5000, 8000]) {
  let loiCuoi;
  for (const han of hanMs) {
    try {
      return await fetch(url, { ...opts, signal: AbortSignal.timeout(han) });
    } catch (e) {
      loiCuoi = e;
    }
  }
  throw loiCuoi;
}
