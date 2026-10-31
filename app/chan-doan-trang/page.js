import { layLichSuGia } from "@/lib/lichSuGia";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";

// TAM THOI (31/10/2026): do thoi gian TRONG NGU CANH TRANG (khac route handler) de tim nguyen nhan web dung 16-27 giay. Can ?k=<UPLOAD_API_KEY>. Xoa sau khi xong.
export const dynamic = "force-dynamic";
export const metadata = { robots: "noindex" };

const do1 = async (kq, ten, fn) => {
  const t0 = performance.now();
  try {
    await fn();
    kq[ten] = Math.round(performance.now() - t0);
  } catch (e) {
    kq[ten] = { ms: Math.round(performance.now() - t0), loi: String(e?.message || e).slice(0, 100) };
  }
};

export default async function Trang({ searchParams }) {
  const sp = await searchParams;
  if (!process.env.UPLOAD_API_KEY || sp?.k !== process.env.UPLOAD_API_KEY) return <p>—</p>;
  const kq = {};
  const den = Math.floor(Date.now() / 1000);
  const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/index?symbol=VNINDEX&resolution=1D&from=${den - 86400 * 80}&to=${den}`;
  await do1(kq, "fetchTran", () => fetch(url, { signal: AbortSignal.timeout(30000) }).then((r) => r.text()));
  await do1(kq, "fetchRevalidate", () => fetch(url + "&a=1", { next: { revalidate: 120 }, signal: AbortSignal.timeout(30000) }).then((r) => r.text()));
  await do1(kq, "fetchNoStore", () => fetch(url + "&a=2", { cache: "no-store", signal: AbortSignal.timeout(30000) }).then((r) => r.text()));
  await do1(kq, "layLichSuGiaVNI50", () => layLichSuGia("VNINDEX", 50));
  await do1(kq, "layTatCaTinHieu", () => layTatCaTinHieu());
  await do1(kq, "layNguoiDungHienTai", () => layNguoiDungHienTai());
  return <pre id="kq">{JSON.stringify(kq)}</pre>;
}
