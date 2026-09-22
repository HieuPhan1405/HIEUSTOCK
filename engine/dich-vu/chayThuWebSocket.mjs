// CONG CU CHAN DOAN - ket noi WebSocket Market Data cua DNSE OpenAPI (KHAC voi LightSpeed MQTT cu
// da bi tu choi subscribe), dung CHUNG API Key/Secret voi chayThuOpenApi.mjs, subscribe kenh OHLC
// real-time cho vai ma thu, in ra tung nen nhan duoc de xac nhan ket noi/xac thuc/subscribe hoat
// dong dung tren tai khoan that.
//
// CACH CHAY (can DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local - xem chayThuOpenApi.mjs):
//   node --env-file=.env.dnse.local engine/dich-vu/chayThuWebSocket.mjs VJC,HPG,VNINDEX
// Dung Ctrl+C de dung. Chay thu vai phut trong gio giao dich de thay nen "1D" cap nhat lien tuc.
import { ketNoiWebSocketDNSE } from "../dnse/wsClient.js";

const apiKey = process.env.DNSE_API_KEY;
const apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) {
  console.error("Thieu DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local. Xem huong dan o chayThuOpenApi.mjs.");
  process.exit(1);
}

const dsMa = (process.argv[2] || "VJC,HPG,VNINDEX").toUpperCase().split(",").map((s) => s.trim());
console.log(`Dang ket noi WebSocket DNSE OpenAPI, subscribe nen 1D cho: ${dsMa.join(", ")}...`);

const ketNoi = ketNoiWebSocketDNSE(
  { apiKey, apiSecret },
  {
    kenh: [{ name: "ohlc.1D.json", symbols: dsMa }],
    onTrangThai: (chuoi) => console.log(`[trang thai] ${chuoi}`),
    onLoi: (loi) => console.error(`[loi] ${loi.message}`),
    onData: (loaiDuLieu, doi) => {
      console.log(`[nen ${loaiDuLieu ?? "?"}] ${doi.symbol} ${doi.resolution}: O=${doi.open} H=${doi.high} L=${doi.low} C=${doi.close} V=${doi.volume} (luc ${new Date(doi.time * 1000).toLocaleTimeString("vi-VN")})`);
    },
  }
);

console.log("Dang lang nghe... (Ctrl+C de dung)");
process.on("SIGINT", () => {
  console.log("\nDang dong ket noi...");
  ketNoi.dong();
  process.exit(0);
});
