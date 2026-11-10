// KHUNG TRANG VAN BAN (Dieu khoan, Chinh sach bao mat - 11/11/2026): tieu de + ngay cap nhat + cac muc { tieuDe, doan[] }. Chu tho, de doc tren dien thoai.
export default function TrangVanBan({ tieuDe, capNhat, gioiThieu, muc }) {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        {tieuDe}
      </h1>
      <p className="text-xs mb-5" style={{ color: "var(--mo)" }}>
        Cập nhật lần cuối: {capNhat}
      </p>
      {gioiThieu && (
        <p className="text-[15px] leading-relaxed mb-6" style={{ color: "var(--chu-2)" }}>
          {gioiThieu}
        </p>
      )}
      {muc.map((m, i) => (
        <section key={m.tieuDe} className="mb-6">
          <h2 className="text-lg mb-2" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
            {i + 1}. {m.tieuDe}
          </h2>
          {m.doan.map((d, j) =>
            Array.isArray(d) ? (
              <ul key={j} className="list-disc pl-5 mb-2 space-y-1 text-[15px] leading-relaxed" style={{ color: "var(--chu-2)" }}>
                {d.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : (
              <p key={j} className="text-[15px] leading-relaxed mb-2" style={{ color: "var(--chu-2)" }}>
                {d}
              </p>
            )
          )}
        </section>
      ))}
    </article>
  );
}
