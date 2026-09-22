// Test cho phan THUAN cua engine/dnse/wsClient.js (taoAuthMessage, laControlAction) - KHONG mo ket
// noi mang that. Ban than viec ket noi/auth/subscribe THAT chi kiem tra duoc qua
// engine/dich-vu/chayThuWebSocket.mjs voi credential that (xem huong dan trong file do).
import { taoAuthMessage, laControlAction, CONTROL_ACTIONS } from "../dnse/wsClient.js";
import { createHmac } from "node:crypto";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

{
  const now = 1750000000123;
  const nanos = 456789; // String(456789).slice(-3) = "789"
  const a = taoAuthMessage("KEY1", "SECRET1", { now, nanos });
  ok("action = 'auth'", a.action === "auth");
  ok("api_key giu nguyen", a.api_key === "KEY1");
  ok("timestamp = giay (Math.floor(now/1000))", a.timestamp === 1750000000);
  ok("nonce = now + 3 chu so cuoi cua nanos (789)", a.nonce === "1750000000123789", a.nonce);

  const kyLaiTayThu = createHmac("sha256", "SECRET1").update(`KEY1:1750000000:1750000000123789`).digest("hex");
  ok("signature dung dinh dang HMAC-SHA256 hex (khop tinh tay)", a.signature === kyLaiTayThu, a.signature);

  const b = taoAuthMessage("KEY1", "SECRET2", { now, nanos });
  ok("doi api_secret -> signature khac di", a.signature !== b.signature);

  const c = taoAuthMessage("KEY1", "SECRET1", { now: now + 1, nanos });
  ok("doi now (du chi 1ms, doi timestamp giay neu qua nguong) hoac nonce -> signature khac di", a.signature !== c.signature || a.nonce !== c.nonce);
}

{
  ok("welcome la control action", laControlAction("welcome"));
  ok("auth_success la control action", laControlAction("auth_success"));
  ok("error la control action", laControlAction("error"));
  ok("undefined (data message thuong khong co action) KHONG phai control action", !laControlAction(undefined));
  ok("'estimated_market_index' (ten channel, khong phai action that) KHONG phai control action", !laControlAction("estimated_market_index"));
  ok("CONTROL_ACTIONS co dung 8 gia tri theo tai lieu", CONTROL_ACTIONS.size === 8, CONTROL_ACTIONS.size);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
