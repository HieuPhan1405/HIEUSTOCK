import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { layKichBanMua } from "@/lib/kichBanMuaDb";
import { layLichSuGia } from "@/lib/lichSuGia";
import { ngayChuoi } from "@/lib/muaThemTinhToan";
import { NGANH_NHAN } from "@/lib/nganh";
import { kiemTraDieuKien, rsiTai, cachSmaTai } from "@/lib/goiYMua";
import { capNhatMoiNhat } from "@/components/dungChung";

// MA GOI Y MUA theo bo dieu kien da backtest (lib/goiYMua.js) - dung chung cho API /api/goi-y-mua (trang /danh-gia-danh-muc) va thong bao ve may (lib/thongBaoDb.js thongBaoPhien).
//  - mua: ma he thong dang bao MUA + kiem tra tung dieu kien: vung mua, SMA50 / RSI14 phien TRUOC ngay tin hieu (nen DNSE), VN-Index 20 phien phien truoc.
//  - cho: ma CHUA co lenh ma kich ban mua (engine/dich-vu/kichBanMua.mjs) cho biet dong cua hom nay trong [mua_tu, mua_den] thi ra MUA, cach gia hien tai <= 3%,
//         dat dieu kien SMA50 / RSI14 / VN-Index theo chi bao HOM NAY (= phien truoc neu MUA ra o phien toi).
const HAN_MS = 60_000;
let kho = { luc: 0, du: null, dangTinh: null };
const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const voiHan = (p, ms) => Promise.race([Promise.resolve(p).catch(() => null), new Promise((r) => setTimeout(() => r(null), ms))]);

// tatCa: dong tin hieu da co san (thongBaoPhien vua doc sau upload) - khong truyen thi tu doc.
export async function tinhGoiYMua({ tatCa = null } = {}) {
  const [ds, cbk, kb, vniNen] = await Promise.all([tatCa ?? layTatCaTinHieu(), voiHan(layChiBaoKyThuat(), 6000), voiHan(layKichBanMua(), 6000), voiHan(layLichSuGia("VNINDEX", 90), 8000)]);
  const vc = (vniNen ?? []).map((b) => b.c);
  const vniIdx = new Map((vniNen ?? []).map((b, i) => [b.t, i]));
  const vni20Tai = (j) => (j != null && j >= 20 ? (vc[j] / vc[j - 20] - 1) * 100 : null);
  const jCuoi = vc.length - 1;
  const nganh = (r) => NGANH_NHAN[r?.nganh] || r?.nganh || "Khác";

  // 1) DANG BAO MUA
  const dsMua = ds.filter((r) => r.tin === "MUA" && so(r.gia_mua) > 0 && so(r.gia) > 0).slice(0, 40);
  const mua = [];
  let k = 0;
  const chay = async () => {
    while (k < dsMua.length) {
      const r = dsMua[k++];
      const nen = await voiHan(layLichSuGia(r.ma, 150), 6000);
      if (!nen?.length) continue;
      const c = nen.map((b) => b.c);
      const ng = ngayChuoi(r.ngay_mua);
      const iTin = nen.findIndex((b) => b.t === ng);
      const i = (iTin > 0 ? iTin : nen.length - 1) - 1; // phien truoc ngay tin hieu
      const jv = vniIdx.get(ng) ?? jCuoi;
      const u = {
        ma: r.ma, nganh: nganh(r), gia: so(r.gia), moc: so(r.gia_mua), stop_loss: so(r.stop_loss), tp1: so(r.tp1), tp2: so(r.tp2), diem: so(r.diem), ngayMua: ng,
        sma50Pct: cachSmaTai(c, i), rsi14: rsiTai(c, i), vni20: vni20Tai(jv - 1),
        // lenh MUA da "that" (da chot mua trong khung gio / web giu lenh) - ngoai khung gio vao lenh, tin hieu chua chot chi la THEO DOI
        daChot: r.da_chot_mua === true || (Array.isArray(r.lenh_web) && r.lenh_web.length > 0),
      };
      u.cachMoc = (u.gia / u.moc - 1) * 100;
      const kt = kiemTraDieuKien(u, { vni20: u.vni20 });
      mua.push({ ...u, dat: kt.dat, cac: kt.cac });
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, dsMua.length) }, chay));
  mua.sort((a, b) => Number(b.dat) - Number(a.dat) || a.cachMoc - b.cachMoc);

  // 2) CHO DIEM MUA (kich ban mua, ma chua co lenh)
  const theoMa = new Map(ds.map((r) => [r.ma, r]));
  const cb = new Map((cbk?.hang ?? []).map((h) => [h.ma, h]));
  const vni20Nay = vni20Tai(jCuoi);
  const cho = (kb?.hang ?? [])
    .filter((h) => (h.loai ?? "MUA") === "MUA" && so(h.mua_tu) > 0)
    .map((h) => {
      const r = theoMa.get(h.ma);
      const c = cb.get(h.ma);
      const gia = so(r?.gia) ?? so(h.gia);
      if (!(gia > 0) || r?.tin === "MUA" || r?.tin === "NAM GIU") return null;
      const u = { ma: h.ma, nganh: nganh(r), gia, muaTu: so(h.mua_tu), muaDen: so(h.mua_den), khoangCach: (so(h.mua_tu) / gia - 1) * 100, sma50Pct: so(c?.cach_ma50_pct), rsi14: so(c?.rsi14), diem: so(r?.diem) };
      const kt = kiemTraDieuKien(u, { vni20: vni20Nay });
      return { ...u, dat: kt.dat, cac: kt.cac };
    })
    .filter((u) => u && u.dat && u.khoangCach <= 3 && u.khoangCach >= -1)
    .sort((a, b) => a.khoangCach - b.khoangCach)
    .slice(0, 12);
  const du = { capNhat: capNhatMoiNhat(ds), ngayVni: vniNen?.at(-1)?.t ?? null, vni20: vni20Nay, mua, cho, capNhatKichBan: kb?.capNhatLuc ?? null };
  if (tatCa) kho = { luc: Date.now(), du, dangTinh: null }; // vua tinh voi du lieu moi upload -> lam moi bo nho cho API
  return du;
}

// Ban nho 60 giay / instance (giong nhau cho moi nguoi) - API /api/goi-y-mua.
export async function layGoiYMua() {
  if (kho.du && Date.now() - kho.luc < HAN_MS) return kho.du;
  kho.dangTinh ??= tinhGoiYMua()
    .then((du) => {
      kho = { luc: Date.now(), du, dangTinh: null };
      return du;
    })
    .catch((e) => {
      kho.dangTinh = null;
      throw e;
    });
  return kho.dangTinh;
}
