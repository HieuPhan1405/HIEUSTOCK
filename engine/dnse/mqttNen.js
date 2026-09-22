// Ket noi MQTT (qua WebSocket Secure) toi DNSE LightSpeed de nhan nen OHLC real-time. Chi tiet
// ket noi (host/port/xac thuc) tra tu tai lieu ky thuat DNSE 2026-09-22 - CHUA xac nhan dung cau
// truc JSON payload thuc te (tai lieu khong cong khai, can nguoi dung tu chay thu de xac nhan -
// xem engine/dich-vu/chayThuMqtt.mjs).
import mqtt from "mqtt";

const BROKER_URL = "wss://datafeed-lts.dnse.com.vn:443/wss";

// { investorId, token } tu engine/dnse/dangNhap.js. Tra ve client MQTT (da mqtt.connect, tu ket
// noi lai neu rot mang) - goi client.subscribe/unsubscribe/end nhu binh thuong.
export function ketNoiMqttDNSE({ investorId, token }, { onMessage, onError, onConnect, onClose } = {}) {
  const clientId = `dnse-price-json-mqtt-ws-sub-${investorId}-${Math.random().toString(16).slice(2, 10)}`;
  const client = mqtt.connect(BROKER_URL, {
    username: investorId,
    password: token,
    clientId,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 15000,
    protocolVersion: 4,
  });
  client.on("connect", () => onConnect?.(client));
  client.on("message", (topic, payload) => onMessage?.(topic, payload));
  client.on("error", (loi) => onError?.(loi));
  client.on("close", () => onClose?.());
  return client;
}

// resolution: "1D" (ngay, mac dinh du dung cho toan bo he thong), "1" (phut), "1H" (gio), "W" (tuan).
export function topicOHLC(loai, ma, resolution = "1D") {
  return `plaintext/quotes/${loai}/OHLC/${resolution}/${ma}`;
}
