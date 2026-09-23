// Logic DUNG CHUNG giua chayPipelineDayDu.mjs (chay 1 lan qua REST) va chayEngineRealTime.mjs
// (chay nen lien tuc, cap nhat qua WebSocket) - lay lich su gia toan bo vu tru quet + tinh tin
// hieu tung ma. Tach rieng file nay de tranh lap code giua 2 kich ban dung, dam bao CUNG 1 cong
// thuc duoc dung du chay theo kieu nao.
import { layNenOHLC } from "../dnse/openApiClient.js";
import { VN30, VN_MIDCAP, VN_SMALLCAP } from "../danh-sach/vonHoa.js";
import { laySanTheoDanhSachMa } from "./vndirectSanNganh.js";
import { tinhTatCaBreadth } from "./breadth.js";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { sma } from "./mang.js";

export const SO_NGAY_LICH_SU = 1600; // ~4.4 nam lich, du cho HHV(H,252) + Ichimoku + on dinh Kijun/duong can bang
const CHO_GIUA_MOI_MA_MS = 200; // gian cach nhe giua cac request REST luc tai lich su - tranh bi coi la spam API that

// Chia 1 mang thanh nhieu mang con toi da `kichThuoc` phan tu - dung de chia nho danh sach ma
// subscribe WebSocket (DNSE OpenAPI gioi han so "streams"/ket noi theo tier tai khoan - tier
// "normalUser" toi da 200, xac nhan qua loi that SUBSCRIBE_FAILED/MAX_CHANNELS_EXCEEDED khi thu
// subscribe het ~390 ma trong 1 ket noi duy nhat, xem chayEngineRealTime.mjs).
export function chiaNhoMang(mang, kichThuoc) {
  const ketQua = [];
  for (let i = 0; i < mang.length; i += kichThuoc) ketQua.push(mang.slice(i, i + kichThuoc));
  return ketQua;
}

export function danhSachMaQuet() {
  return [...new Set([...VN30, ...VN_MIDCAP, ...VN_SMALLCAP])].sort();
}

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

export async function layNenAnToan(client, symbol, type) {
  const den = Math.floor(Date.now() / 1000);
  const tu = den - SO_NGAY_LICH_SU * 86400;
  let loiCuoi;
  for (let lan = 1; lan <= 3; lan++) {
    try {
      return await layNenOHLC(client, { symbol, type, resolution: "1D", tu, den });
    } catch (loi) {
      loiCuoi = loi;
      if (lan < 3) await cho(500 * lan);
    }
  }
  throw loiCuoi;
}

// Lay TOAN BO lich su gia (REST, goi 1 LAN) cho vu tru quet + VNINDEX + san niem yet. Dung luc
// khoi dong ca 2 kich ban (chay 1 lan hoac chay nen) - du lieu sau do CHI duoc cap nhat tiep qua
// WebSocket (chayEngineRealTime.mjs), khong goi lai REST lien tuc.
export async function taiLichSuToanBo(client, { onTienDo } = {}) {
  const dsMa = danhSachMaQuet();
  onTienDo?.(`Vu tru quet: ${dsMa.length} ma. Dang lay VNINDEX...`);

  const vniNen = await layNenAnToan(client, "VNINDEX", "INDEX");
  onTienDo?.(`VNINDEX: ${vniNen.length} nen.`);

  onTienDo?.("Dang lay san niem yet (HOSE/HNX/UPCOM) tu VNDirect...");
  const sanTheoMa = await laySanTheoDanhSachMa(dsMa).catch((loi) => {
    onTienDo?.(`  CANH BAO: khong lay duoc san (${loi.message}) - cot 'san' se de trong, khong anh huong tin hieu MUA/BAN.`);
    return new Map();
  });

  const nenTheoMa = new Map();
  const loiTheoMa = [];
  onTienDo?.("Dang lay lich su gia tung ma (co the mat vai phut)...");
  for (let i = 0; i < dsMa.length; i++) {
    const ma = dsMa[i];
    try {
      const nen = await layNenAnToan(client, ma, "STOCK");
      if (!nen || nen.length < 60) throw new Error(`chi ${nen?.length ?? 0} nen - qua it de tinh chi bao`);
      nenTheoMa.set(ma, nen);
    } catch (loi) {
      loiTheoMa.push({ ma, loi: String(loi.message || loi) });
    }
    if ((i + 1) % 20 === 0 || i === dsMa.length - 1) onTienDo?.(`  ${i + 1}/${dsMa.length} ma (${loiTheoMa.length} loi)...`);
    await cho(CHO_GIUA_MOI_MA_MS);
  }

  return { dsMa, vniNen, sanTheoMa, nenTheoMa, loiTheoMa };
}

// Tinh breadth toan thi truong + tin hieu tung ma tu du lieu DA CO SAN trong bo nho (khong goi
// mang) - dung duoc ca cho lan tinh dau tien (ngay sau taiLichSuToanBo) lan moi lan tinh LAI TOAN
// BO khi co nen moi ve tu WebSocket (xem plan: tinh lai toan bo moi lan, khong tinh tang dan, cho
// an toan - voi ~389 ma va du lieu da co san trong bo nho thi tinh lai het chi mat vai giay).
export function tinhTinHieuToanBo({ nenTheoMa, vniNen, sanTheoMa }) {
  const vniCloseByDate = new Map(vniNen.map((b) => [b.t, b.c]));

  const ketQuaBreadth = tinhTatCaBreadth((ma) => {
    const nen = nenTheoMa.get(ma);
    if (!nen) return undefined;
    const close = nen.map((b) => b.c);
    const ma50 = sma(close, 50);
    return { gia: close[close.length - 1], ma50: ma50[ma50.length - 1] };
  });

  const hang = [];
  const loiTinhToan = [];
  for (const [ma, nen] of nenTheoMa) {
    try {
      const vniClose = nen.map((b) => vniCloseByDate.get(b.t) ?? null);
      hang.push(tinhTinHieuChoMa({ ma, nen, vniClose, san: sanTheoMa.get(ma) ?? null, ketQuaBreadth }));
    } catch (loi) {
      loiTinhToan.push({ ma, loi: String(loi.message || loi) });
    }
  }
  // VNINDEX cung xuat 1 dong (hien thi nhu 1 chi so tren web - xem nhanh ma==="VNINDEX" trong tinhTinHieuChoMa).
  try {
    const vniCloseAligned = vniNen.map((b) => vniCloseByDate.get(b.t));
    hang.push(tinhTinHieuChoMa({ ma: "VNINDEX", nen: vniNen, vniClose: vniCloseAligned, san: "HOSE", ketQuaBreadth }));
  } catch (loi) {
    loiTinhToan.push({ ma: "VNINDEX", loi: String(loi.message || loi) });
  }

  return { ketQuaBreadth, hang, loiTinhToan };
}

// Cap nhat 1 nen "moi nhat" vao mang lich su hien co (dung khi nhan tin OHLC tu WebSocket): neu
// ngay TRUNG voi nen cuoi -> GHI DE (nen dang hinh thanh, cap nhat lien tuc trong phien - dung ca
// khi gia tri giong het, khong sao); neu la ngay MOI HON -> THEM nen moi vao cuoi mang; neu ngay
// CU HON nen cuoi (du lieu tre/goi lap qua mang) -> bo qua, khong ghi de lich su cu. Sua TRUC TIEP
// tren mang (mutate) de tranh cap phat lai mang dai (~1000+ nen) moi lan co 1 tick.
export function capNhatNenMoiNhat(nen, nenMoi) {
  const cuoi = nen[nen.length - 1];
  if (cuoi && cuoi.t === nenMoi.t) {
    cuoi.o = nenMoi.o;
    cuoi.h = nenMoi.h;
    cuoi.l = nenMoi.l;
    cuoi.c = nenMoi.c;
    cuoi.v = nenMoi.v;
  } else if (!cuoi || nenMoi.t > cuoi.t) {
    nen.push({ ...nenMoi });
  }
}
