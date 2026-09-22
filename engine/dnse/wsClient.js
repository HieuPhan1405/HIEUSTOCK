// WebSocket Market Data cua DNSE OpenAPI (tai lieu: developers.dnse.com.vn/docs/sdk/build_websocket)
// - KHAC HOAN TOAN voi engine/dnse/mqttNen.js (LightSpeed MQTT cu, DA TAM DUNG vi tai khoan bi tu
//   choi subscribe). Kenh nay dung CHUNG apiKey/apiSecret cua DNSE OpenAPI (da xac nhan hoat dong
//   qua REST /price/ohlc trong engine/dnse/openApiClient.js) - xac thuc bang HMAC-SHA256 don gian
//   gui qua 1 message JSON sau khi ket noi, KHONG can dang ky dich vu rieng nhu LightSpeed.
// Dung WebSocket toan cuc co san tu Node (khong can cai them goi `ws`) - CAN Node ban du moi
// (da xac nhan co tren may nguoi dung: Node v24.20.0).
//
// CHI dung apiKey/apiSecret tu BIEN MOI TRUONG do nguoi dung tu set (vd .env.dnse.local) - KHONG
// hardcode/luu o dau khac. Day la khoa API cua tai khoan giao dich that.
import { createHmac } from "node:crypto";

export const URL_GOC_WS = "wss://ws-openapi.dnse.com.vn/v1/stream?encoding=json";
export const CONTROL_ACTIONS = new Set(["welcome", "auth_success", "subscribed", "unsubscribed", "ping", "pong", "connection_expired", "error"]);
const KHOANG_TU_PING_MS = 25000; // khuyen nghi tai lieu: client chu dong ping moi 25s (phong PING server bi mat do NAT)
const BACKOFF_TOI_DA_MS = 60000;

export function laControlAction(action) {
  return CONTROL_ACTIONS.has(action);
}

// Dung y het vi du JS chinh thuc cua DNSE (build_websocket): nonce = timestamp(ms) + 3 chu so cuoi
// cua phan nanosecond tu process.hrtime() - gia lap do phan giai microsecond, dam bao unique.
export function taoAuthMessage(apiKey, apiSecret, { now = Date.now(), nanos = process.hrtime()[1] } = {}) {
  const timestamp = Math.floor(now / 1000); // giay
  const nonce = String(now) + String(nanos).slice(-3);
  const message = `${apiKey}:${timestamp}:${nonce}`;
  const signature = createHmac("sha256", apiSecret).update(message).digest("hex");
  return { action: "auth", api_key: apiKey, signature, timestamp, nonce };
}

/**
 * @param {{apiKey:string, apiSecret:string}} cred
 * @param {object} tuyChon
 * @param {{name:string, symbols:string[]}[]} [tuyChon.kenh] - subscribe ngay sau khi auth xong.
 * @param {(loaiDuLieu:string, doi:object)=>void} [tuyChon.onData] - moi data message (loaiDuLieu = truong "T").
 * @param {(chuoi:string)=>void} [tuyChon.onTrangThai] - log trang thai ket noi/auth/subscribe (khong bat buoc).
 * @param {(loi:Error)=>void} [tuyChon.onLoi] - loi tu server (vd auth that bai).
 * @returns {{ subscribe(kenhMoi:{name:string,symbols:string[]}[]):void, dong():void }}
 */
export function ketNoiWebSocketDNSE({ apiKey, apiSecret }, { kenh = [], onData, onTrangThai, onLoi } = {}) {
  if (!apiKey || !apiSecret) throw new Error("Thieu apiKey/apiSecret DNSE - phai truyen tu bien moi truong, khong duoc hardcode.");
  if (typeof WebSocket === "undefined") {
    throw new Error("Moi truong Node hien tai khong co WebSocket toan cuc (can Node 22+). Chay `node -v` de kiem tra phien ban.");
  }

  const dsKenhDaDangKy = [...kenh];
  let ws = null;
  let dongChuDinh = false;
  let laDoPing = null;
  let doiBackoffMs = 1000;

  const ghiLog = (chuoi) => onTrangThai?.(chuoi);
  const guiJson = (doi) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(doi));
  };

  function batDauTuPing() {
    dungTuPing();
    laDoPing = setInterval(() => guiJson({ action: "ping" }), KHOANG_TU_PING_MS);
  }
  function dungTuPing() {
    if (laDoPing) clearInterval(laDoPing);
    laDoPing = null;
  }

  function datLichKetNoiLai() {
    if (dongChuDinh) return;
    ghiLog(`Mat ket noi - thu lai sau ${doiBackoffMs}ms...`);
    setTimeout(moKetNoi, doiBackoffMs);
    doiBackoffMs = Math.min(doiBackoffMs * 2, BACKOFF_TOI_DA_MS);
  }

  function moKetNoi() {
    ws = new WebSocket(URL_GOC_WS);

    ws.addEventListener("open", () => ghiLog("Da ket noi WebSocket, cho welcome..."));

    ws.addEventListener("message", (ev) => {
      let doi;
      try {
        doi = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString());
      } catch {
        return;
      }
      const action = doi.action;
      if (action === "welcome") {
        ghiLog(`Welcome (session_id=${doi.session_id}) - dang xac thuc...`);
        guiJson(taoAuthMessage(apiKey, apiSecret));
        return;
      }
      if (action === "auth_success") {
        ghiLog("Xac thuc thanh cong.");
        doiBackoffMs = 1000; // ket noi + auth on -> reset backoff cho lan mat ket noi tiep theo
        batDauTuPing();
        if (dsKenhDaDangKy.length > 0) guiJson({ action: "subscribe", channels: dsKenhDaDangKy });
        return;
      }
      if (action === "subscribed" || action === "unsubscribed") {
        ghiLog(`${action === "subscribed" ? "Subscribe" : "Unsubscribe"} thanh cong.`);
        return;
      }
      if (action === "ping") {
        guiJson({ action: "pong", timestamp: doi.timestamp });
        return;
      }
      if (action === "pong") return;
      if (action === "connection_expired") {
        ghiLog("Ket noi het han 8 tieng (binh thuong) - se tu ket noi lai.");
        return;
      }
      if (action === "error") {
        const thongBao = `Loi WebSocket DNSE: ${doi.code} - ${doi.message}`;
        ghiLog(thongBao);
        onLoi?.(new Error(thongBao));
        return;
      }
      // Data message - nhan biet qua truong "T" (xem tai lieu Market Data WebSocket), KHONG phai
      // qua viec thieu "action" (vd estimated_market_index co ca action lan T).
      onData?.(doi.T, doi);
    });

    ws.addEventListener("close", (ev) => {
      dungTuPing();
      ghiLog(`Ket noi dong (code=${ev.code}).`);
      datLichKetNoiLai();
    });

    ws.addEventListener("error", () => {
      // "close" se duoc goi ngay sau do voi cung nguyen nhan - khong xu ly rieng de tranh log lap.
    });
  }

  moKetNoi();

  return {
    subscribe(kenhMoi) {
      dsKenhDaDangKy.push(...kenhMoi);
      guiJson({ action: "subscribe", channels: kenhMoi });
    },
    dong() {
      dongChuDinh = true;
      dungTuPing();
      ws?.close();
    },
  };
}
