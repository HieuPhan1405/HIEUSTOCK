// CONG CU CHAN DOAN - dang nhap DNSE that + ket noi MQTT that + IN RA nguyen van du lieu nhan
// duoc, KHONG xu ly gi ca. Muc dich: xac nhan dung cau truc JSON that su cua topic OHLC (tai lieu
// DNSE khong cong khai chi tiet nay) TRUOC KHI viet phan xu ly that.
//
// CACH CHAY (Windows PowerShell hoac Git Bash, Node 20.6+):
//   1. Tao file .env.dnse.local (KHONG commit - da nam trong .gitignore qua ".env*") voi noi dung:
//        DNSE_USERNAME=<email hoac so dien thoai hoac so luu ky tai khoan DNSE cua ban>
//        DNSE_PASSWORD=<mat khau dang nhap DNSE cua ban>
//      Chi ban tu go, khong dua cho ai/AI nao khac.
//   2. Chay: node --env-file=.env.dnse.local engine/dich-vu/chayThuMqtt.mjs VJC,HPG,VNINDEX
//   3. Doi vai giay - phai thay dong "Da dang ky <ma>" cho tung ma. Neu thi truong dang mo cua,
//      trong vong vai giay-vai phut se thay khoi "=== Nhan tin nhan tu ... ===" in ra JSON that.
//   4. COPY toan bo output (dac biet 2-3 khoi JSON dau tien) gui lai vao chat de xac nhan cau truc
//      truoc khi hoan thien phan xu ly that.
//   5. Bam Ctrl+C de dung.
import { taoPhienDNSE } from "../dnse/dangNhap.js";
import { ketNoiMqttDNSE, topicOHLC } from "../dnse/mqttNen.js";

const username = process.env.DNSE_USERNAME;
const password = process.env.DNSE_PASSWORD;
if (!username || !password) {
  console.error("Thieu DNSE_USERNAME/DNSE_PASSWORD. Xem huong dan o dau file nay (chay bang --env-file).");
  process.exit(1);
}

const dsMa = (process.argv[2] || "VJC,HPG,VNINDEX").split(",").map((s) => s.trim().toUpperCase());

console.log("Dang dang nhap DNSE...");
const phien = taoPhienDNSE({ username, password });
const { token, investorId, ten } = await phien.damBaoDangNhap();
console.log(`Da dang nhap. investorId=${investorId}${ten ? `, ten=${ten}` : ""}`);

let soTinNhanDaNhan = 0;
const client = ketNoiMqttDNSE(
  { investorId, token },
  {
    onConnect: () => {
      console.log("Da ket noi MQTT. Dang dang ky topic...");
      for (const ma of dsMa) {
        const loai = ma === "VNINDEX" || ma === "VN30" || ma === "HNX" || ma === "UPCOM" ? "index" : "stock";
        const topic = topicOHLC(loai, ma, "1D");
        client.subscribe(topic, (loi) => {
          if (loi) console.error(`Loi dang ky ${topic}:`, loi.message);
          else console.log(`Da dang ky: ${topic}`);
        });
      }
    },
    onMessage: (topic, payload) => {
      soTinNhanDaNhan++;
      console.log(`\n=== [${soTinNhanDaNhan}] Nhan tin nhan tu ${topic} ===`);
      const vanBan = payload.toString("utf8");
      try {
        console.log(JSON.stringify(JSON.parse(vanBan), null, 2));
      } catch {
        console.log("(khong phai JSON hop le, in nguyen van)", vanBan);
      }
    },
    onError: (loi) => console.error("Loi MQTT:", loi.message || loi),
    onClose: () => console.log("Ket noi MQTT da dong."),
  }
);

console.log("Dang lang nghe... (Ctrl+C de dung)");
process.on("SIGINT", () => {
  console.log(`\nDa nhan tong cong ${soTinNhanDaNhan} tin nhan. Dang thoat...`);
  client.end(true, () => process.exit(0));
  setTimeout(() => process.exit(0), 2000);
});
