// DICH VU DONG TIEN THOI GIAN THUC (Hieu 2026-10-25): ket noi WebSocket DNSE OpenAPI, nhan tung lenh khop co CHIEU (tick_extra), khoi ngoai (foreign), do rong chi so (market_index),
// gom bang engine/loi/dongTienChuDong.js va DAY LEN WEB moi vai chuc giay (POST /api/upload-dong-tien, noi dung JSON nen gzip).
// Chay chung tien trinh voi chayEngineRealTime.mjs (khoiDongDongTien) hoac rieng bang chayDongTienRealTime.mjs. CHI DOC du lieu thi truong - khong co lenh dat lenh nao.
//
// Ket noi: gioi han tier tai khoan = 200 stream / ket noi, toi da 10 ket noi / tai khoan (xem chu thich chayEngineRealTime.mjs). Moi ket noi toi da 196 ma: tick_extra 2 + foreign 2 + chi so 1 = 5 ket noi
// (engine cu: ohlc 2 + top_price 2 = 4) -> 9 / 10.
import { gzipSync } from "node:zlib";
import { ketNoiWebSocketDNSE } from "../dnse/wsClient.js";
import { BoGopDongTien, tongHopThiTruong } from "../loi/dongTienChuDong.js";
import { chiaNhoMang } from "../loi/quetToanBo.js";
import { VN30 } from "../danh-sach/vonHoa.js";
import { nganhCuaMa } from "../danh-sach/nganh.js";

export const CHU_KY_TOM_TAT_MS = 60_000; // tom tat tung ma + thi truong
export const CHU_KY_CHI_TIET_MS = 180_000; // + chuoi theo phut va volume profile cua tung ma (nang hon)
export const CHI_SO_THEO_DOI = ["VNINDEX", "VN30", "VN100", "HNX", "HNX30", "UPCOM"]; // ten hop le cua DNSE (da thu REST market-index)

// gio VN: thu 2-6, 08:55-15:10
export function trongGioDongTien(d = new Date()) {
  const v = new Date(d.getTime() + 7 * 3600e3);
  const thu = v.getUTCDay(), phut = v.getUTCHours() * 60 + v.getUTCMinutes();
  return thu >= 1 && thu <= 5 && phut >= 8 * 60 + 55 && phut <= 15 * 60 + 10;
}

export function khoiDongDongTien({ apiKey, apiSecret, dsMa, upload = null, kichThuoc = 196, log = (s) => console.log(`[dong-tien] ${s}`), ketNoi = ketNoiWebSocketDNSE, chiTrongGio = true }) {
  const bo = new BoGopDongTien({ vn30: VN30 });
  const demLoai = {};
  const onData = (loai, doi) => {
    demLoai[loai] = (demLoai[loai] ?? 0) + 1;
    if (loai === "te") bo.nhanTick(doi);
    else if (loai === "f") bo.nhanNuocNgoai(doi);
    else if (loai === "mi") bo.nhanChiSo(doi);
  };
  const dsKetNoi = [];
  const nhom = chiaNhoMang(dsMa.filter((m) => m !== "VNINDEX"), kichThuoc);
  nhom.forEach((ds, i) => {
    for (const [kenh, ten] of [["tick_extra.G1.json", "tick"], ["foreign.G1.json", "nn"]]) {
      dsKetNoi.push(
        ketNoi({ apiKey, apiSecret }, { kenh: [{ name: kenh, symbols: ds }], onTrangThai: (s) => log(`[${ten}#${i + 1}] ${s}`), onLoi: (e) => log(`[${ten}#${i + 1}] LOI ${e.message}`), onData })
      );
    }
  });
  if (nhom.length * 2 + 1 + 4 > 10) log(`CANH BAO: ${nhom.length * 2 + 1} ket noi dong tien + 4 ket noi cua engine > 10 ket noi toi da cua tai khoan - kiem tra so ma (${dsMa.length}).`);
  dsKetNoi.push(
    ketNoi({ apiKey, apiSecret }, { kenh: CHI_SO_THEO_DOI.map((n) => ({ name: `market_index.${n}.json`, symbols: [] })), onTrangThai: (s) => log(`[chi so] ${s}`), onLoi: (e) => log(`[chi so] LOI ${e.message}`), onData })
  );

  let dangGui = false;
  let tickLanTruoc = -1;
  async function gui({ chiTiet }) {
    if (!upload || dangGui) return;
    if (bo.ngay == null || (bo.soTick === 0 && bo.chiSo.size === 0)) return;
    if (bo.soTick === tickLanTruoc && !chiTiet) return; // khong co khop moi
    dangGui = true;
    try {
      const anh = bo.chupAnh({ chiTiet });
      const tongHop = tongHopThiTruong(anh, { nganhCuaMa });
      const goi = { ngay: anh.ngay, luc: new Date().toISOString(), nguong: anh.nguong, chiTiet, thiTruong: { ...anh.thiTruong, ...tongHop }, ma: anh.ma };
      const body = gzipSync(JSON.stringify(goi));
      const res = await fetch(`${upload.goc}/api/upload-dong-tien`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Encoding": "gzip", "x-api-key": upload.key },
        body,
        signal: AbortSignal.timeout(60000),
      });
      tickLanTruoc = bo.soTick;
      log(`upload ${chiTiet ? "chi tiet" : "tom tat"}: HTTP ${res.status} (${(body.length / 1024).toFixed(0)} KB nen, ${Object.keys(anh.ma).length} ma, ${bo.soTick} tick)`);
    } catch (e) {
      log(`upload LOI: ${e.message}`);
    } finally {
      dangGui = false;
    }
  }

  const hen1 = setInterval(() => {
    if (chiTrongGio && !trongGioDongTien()) return;
    gui({ chiTiet: false });
  }, CHU_KY_TOM_TAT_MS);
  const hen2 = setInterval(() => {
    if (chiTrongGio && !trongGioDongTien()) return;
    gui({ chiTiet: true });
  }, CHU_KY_CHI_TIET_MS);
  // nhat ky suc khoe 5 phut / lan: so ban tin theo loai (te = tick co chieu, f = khoi ngoai, mi = chi so), so chieu khop la
  const hen3 = setInterval(() => {
    if (chiTrongGio && !trongGioDongTien()) return;
    log(`suc khoe: ban tin ${JSON.stringify(demLoai)} | ngay ${bo.ngay} | ${bo.ma.size} ma | chieu la ${bo.demChieuLa}`);
  }, 5 * 60_000);

  return {
    bo,
    demLoai,
    // goi lan cuoi cung (ket qua ATC ~14:45:05 + chi tiet) truoc khi dung dich vu
    async chotCuoiNgay() {
      await gui({ chiTiet: true });
    },
    dong() {
      clearInterval(hen1);
      clearInterval(hen2);
      clearInterval(hen3);
      dsKetNoi.forEach((k) => k.dong());
    },
  };
}
