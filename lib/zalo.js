import { withDb, daoDamBangZaloOA } from "@/lib/db";

// Tich hop Zalo Official Account (OA) de bao tin hieu MUA moi qua Zalo. Zalo
// KHONG cho app ngoai tu y nhan tin cho tai khoan Zalo ca nhan - phai qua 1
// OA chinh chu, va nguoi nhan phai da "quan tam"/nhan tin truoc cho OA do.
//
// Luong hoat dong:
//  1. Chu web tao 1 Official Account tren oa.zalo.me (mien phi), dang ky App
//     tren developers.zalo.me de co App ID + Secret Key.
//  2. Nhap App ID + Secret Key qua /quan-tri, bam "Ket noi Zalo" -> duoc dan
//     sang trang Zalo de cap quyen (OAuth) -> Zalo goi ve /api/zalo/oauth-callback
//     kem 1 "code" -> code nay duoc doi lay access_token + refresh_token.
//  3. Chu web tu nhan tin (bat ky noi dung gi) cho chinh OA cua minh tren app
//     Zalo -> Zalo goi webhook toi /api/zalo/webhook -> ta luu lai user_id do
//     lam "nguoi nhan thong bao".
//  4. Moi lan upload-signals phat hien co ma MOI chuyen sang tin hieu MUA,
//     goi guiTinNhanZalo() de bao qua Zalo.

const OAUTH_TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
const GUI_TIN_URL = "https://openapi.zalo.me/v3.0/oa/message/cs";

export async function layCauHinhZalo() {
  return withDb(async (client) => {
    await daoDamBangZaloOA(client);
    const { rows } = await client.query(`SELECT * FROM zalo_oa WHERE id = 1`);
    return rows[0] || null;
  });
}

export async function luuCauHinhZalo(data) {
  return withDb(async (client) => {
    await daoDamBangZaloOA(client);
    const hienTai = (await client.query(`SELECT * FROM zalo_oa WHERE id = 1`)).rows[0] || {};
    const moi = { ...hienTai, ...data };
    await client.query(
      `INSERT INTO zalo_oa (id, app_id, secret_key, access_token, refresh_token, access_token_het_han, user_id, cap_nhat_luc)
       VALUES (1, $1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (id) DO UPDATE SET
         app_id = EXCLUDED.app_id,
         secret_key = EXCLUDED.secret_key,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         access_token_het_han = EXCLUDED.access_token_het_han,
         user_id = EXCLUDED.user_id,
         cap_nhat_luc = now()`,
      [
        moi.app_id || null,
        moi.secret_key || null,
        moi.access_token || null,
        moi.refresh_token || null,
        moi.access_token_het_han || null,
        moi.user_id || null,
      ]
    );
  });
}

// Doi "code" (tu buoc OAuth redirect) lay access_token + refresh_token lan dau.
export async function doiCodeLayToken(appId, secretKey, code) {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: secretKey,
    },
    body: new URLSearchParams({ code, app_id: appId, grant_type: "authorization_code" }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error("Zalo khong tra ve access_token: " + JSON.stringify(d));
  await luuCauHinhZalo({
    app_id: appId,
    secret_key: secretKey,
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    access_token_het_han: new Date(Date.now() + (Number(d.expires_in) || 3600) * 1000).toISOString(),
  });
  return d;
}

// Lam moi access_token bang refresh_token (Zalo XOAY refresh_token moi lan -
// PHAI luu lai refresh_token MOI, khong dung lai cai cu).
async function lamMoiAccessToken(cauHinh) {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: cauHinh.secret_key,
    },
    body: new URLSearchParams({
      refresh_token: cauHinh.refresh_token,
      app_id: cauHinh.app_id,
      grant_type: "refresh_token",
    }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error("Lam moi token Zalo that bai: " + JSON.stringify(d));
  await luuCauHinhZalo({
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    access_token_het_han: new Date(Date.now() + (Number(d.expires_in) || 3600) * 1000).toISOString(),
  });
  return d.access_token;
}

// Tra ve access_token con hieu luc - tu dong lam moi neu sap/da het han (Zalo
// access_token thuong song ~1 gio).
async function layAccessTokenHopLe() {
  const cauHinh = await layCauHinhZalo();
  if (!cauHinh || !cauHinh.access_token || !cauHinh.refresh_token) return null;
  const conHan = cauHinh.access_token_het_han && new Date(cauHinh.access_token_het_han).getTime() - Date.now() > 5 * 60 * 1000;
  if (conHan) return cauHinh.access_token;
  return lamMoiAccessToken(cauHinh);
}

// Gui 1 tin nhan van ban toi nguoi dung da luu (qua webhook). Tra ve
// { gui: true } neu thanh cong, { gui: false, ly_do } neu chua san sang/loi -
// KHONG throw, de 1 loi Zalo khong lam hong ca luot upload-signals.
export async function guiTinNhanZalo(noiDung) {
  try {
    const cauHinh = await layCauHinhZalo();
    if (!cauHinh || !cauHinh.user_id) {
      return { gui: false, ly_do: "Chua ket noi Zalo hoac chua co nguoi nhan (user_id) - xem huong dan o /quan-tri." };
    }
    const accessToken = await layAccessTokenHopLe();
    if (!accessToken) return { gui: false, ly_do: "Chua co access_token hop le." };

    const res = await fetch(GUI_TIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: accessToken },
      body: JSON.stringify({ recipient: { user_id: cauHinh.user_id }, message: { text: noiDung } }),
    });
    const d = await res.json();
    if (d.error) return { gui: false, ly_do: `Zalo bao loi ${d.error}: ${d.message}` };
    return { gui: true };
  } catch (loi) {
    return { gui: false, ly_do: String(loi?.message || loi) };
  }
}
