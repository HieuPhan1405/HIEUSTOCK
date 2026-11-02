import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { NGANH_NHAN } from "@/lib/nganh";
import { DAI_HAN } from "@/lib/phuongPhapDaiHanDuLieu";
import { CO_RUI_RO } from "@/lib/coRuiRoDaiHan";
import { PHUONG_PHAP, nhanDinhGia, tyLeGiaTrenHopLy, loaiMaRuiRo, chiaKhungLoiVeTinh } from "@/lib/phuongPhapDaiHan";
import { capNhatMoiNhat } from "@/components/dungChung";

// DU LIEU TRANG /dai-han: danh sach ma theo phuong phap (lib/phuongPhapDaiHanDuLieu.js, sinh tu BCTC quy) + GIA / DUONG HIEN TAI tu DB (tin hieu: gia, duong can bang dai han; chi bao ky thuat: cach SMA50 / SMA200)
// de tinh lai trang thai xu huong (thong tin), muc chiet khau so voi gia hop ly; lich giai ngan 5 dot tinh o trinh duyet theo gia hien tai + tuy chon loc xu huong (components/PhuongPhapDaiHan.js). Khong co DB (may dev) hoac loi nguon -> dung gia luc chay script (du lieu van hien, chi cu hon).
const voiHan = (p, ms) => Promise.race([Promise.resolve(p).catch(() => null), new Promise((r) => setTimeout(() => r(null), ms))]);
const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

export async function layDuLieuDaiHan() {
  const [tinHieu, cbk] = await Promise.all([voiHan(layTatCaTinHieu(), 8000), voiHan(layChiBaoKyThuat(), 6000)]);
  const tin = new Map((tinHieu ?? []).map((r) => [r.ma, r]));
  const ct = new Map((cbk?.hang ?? []).map((h) => [h.ma, h]));
  const coGiaMoi = tin.size > 0;

  const them = (m) => {
    const t = tin.get(m.ma);
    const c = ct.get(m.ma);
    const gia = so(t?.gia) ?? m.gia;
    const ggTop = so(t?.gg_top) ?? m.ggTop;
    const sma = (cach, tinh) => (so(cach) != null && gia > 0 ? gia / (1 + so(cach) / 100) : tinh);
    const sma50 = sma(c?.cach_ma50_pct, m.sma50);
    const sma200 = sma(c?.cach_ma200_pct, m.sma200);
    const r = tyLeGiaTrenHopLy(gia, m.giaHopLy);
    return {
      ...m,
      nganhNhan: NGANH_NHAN[t?.nganh] || NGANH_NHAN[m.nganh] || m.nganh,
      gia, ggTop, sma50, sma200, r,
      dinhGia: nhanDinhGia(r),
      xuHuongTang: ggTop > 0 && gia > ggTop,
      doi: so(t?.doi),
    };
  };

  const phuongPhap = {};
  const daLoaiTatCa = new Map();
  for (const khoa of Object.keys(PHUONG_PHAP)) {
    const { ds, daLoai } = loaiMaRuiRo(DAI_HAN[khoa] ?? [], CO_RUI_RO);
    for (const x of daLoai) daLoaiTatCa.set(x.ma, x);
    phuongPhap[khoa] = { meta: PHUONG_PHAP[khoa], ds: ds.map((m) => them(m)) };
  }
  // Khung loi + ve tinh: ma bi gan rui ro tu bo, ty trong chia lai.
  const goc = [...DAI_HAN.buffett, ...DAI_HAN.coTuc];
  const gan = (x) => { const m = goc.find((g) => g.ma === x.ma); return m ? { ...them(m), nguon: x.nguon ?? "Buffett" } : null; };
  const loi = loaiMaRuiRo(DAI_HAN.khung.loi.map((x) => gan(x)).filter(Boolean), CO_RUI_RO);
  const veTinh = loaiMaRuiRo(DAI_HAN.khung.veTinh.map((x) => gan(x)).filter(Boolean), CO_RUI_RO);
  for (const x of [...loi.daLoai, ...veTinh.daLoai]) daLoaiTatCa.set(x.ma, x);
  const khung = chiaKhungLoiVeTinh({ loi: loi.ds, veTinh: veTinh.ds });

  return {
    capNhat: coGiaMoi ? capNhatMoiNhat([...tin.values()]) : null,
    coGiaMoi,
    giaDen: DAI_HAN.giaDen,
    quyBaoCao: DAI_HAN.quyBaoCao,
    phuongPhap,
    khung,
    daLoai: [...daLoaiTatCa.values()],
  };
}
