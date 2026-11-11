import Link from "next/link";
import { TUONG_QUAN } from "@/lib/tuongQuanDuLieu";
import { Khoi, TEXT, MUTED, VIEN, PRIMARY, sans } from "@/components/DanhGiaChung";

const so2 = (x) => (x == null ? "—" : x.toFixed(2).replace(".", ","));

// BETA THEO NGANH: ngay trung binh cong cac ma cung nganh so voi VN-Index (250 phien), xep beta giam dan. Thanh ngang = beta (day 1,0 = ngang VN-Index).
export default function BangBetaNganh() {
  const ds = [...TUONG_QUAN.nganh].sort((a, b) => b.beta - a.beta);
  const toiDa = Math.max(1, ...ds.map((g) => g.beta));
  const o = "px-3 py-2";
  return (
    <Khoi tieuDe="Beta theo ngành" phu="Ngành nào nhạy với VN-Index nhất. Beta ngành là beta của lợi suất ngày trung bình cộng các mã trong ngành, nên thấp hơn beta của từng mã riêng lẻ (các mã trong ngành không cùng chiều 100%).">
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: VIEN }}>
        <table className="w-full text-sm min-w-[720px]" style={sans}>
          <thead>
            <tr className="text-left" style={{ color: MUTED }}>
              <th scope="col" className={`${o} font-normal`}>
                Ngành
              </th>
              <th scope="col" className={`${o} font-normal text-right`}>
                Số mã
              </th>
              <th scope="col" className={`${o} font-normal`}>
                Beta so với VN-Index
              </th>
              <th scope="col" className={`${o} font-normal text-right`}>
                Beta khi VN-Index giảm
              </th>
              <th scope="col" className={`${o} font-normal text-right`}>
                Tương quan
              </th>
              <th scope="col" className={`${o} font-normal text-right`}>
                Biến động năm (%)
              </th>
              <th scope="col" className={`${o} font-normal`}>
                Mã beta cao nhất
              </th>
            </tr>
          </thead>
          <tbody>
            {ds.map((g) => (
              <tr key={g.ten} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                <th scope="row" className={`${o} text-left font-bold whitespace-nowrap`}>
                  {g.ten}
                </th>
                <td className={`${o} text-right tabular-nums`} style={{ color: MUTED }}>
                  {g.soMa}
                </td>
                <td className={o}>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-2 rounded" style={{ width: `${Math.round((g.beta / toiDa) * 90)}px`, background: PRIMARY }} aria-hidden="true" />
                    <b className="tabular-nums">{so2(g.beta)}</b>
                  </span>
                </td>
                <td className={`${o} text-right tabular-nums`}>{so2(g.betaGiam)}</td>
                <td className={`${o} text-right tabular-nums`}>{so2(g.tq)}</td>
                <td className={`${o} text-right tabular-nums`}>{g.vol.toFixed(1).replace(".", ",")}</td>
                <td className={`${o} whitespace-nowrap`} style={{ color: MUTED }}>
                  {g.maBetaCao.map((m, i) => (
                    <span key={m}>
                      {i > 0 && ", "}
                      <Link href={`/ma/${m}`} className="hover:underline" style={{ color: TEXT }}>
                        {m}
                      </Link>{" "}
                      <span className="text-[11px]">{so2(TUONG_QUAN.ma[m][0])}</span>
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Khoi>
  );
}
