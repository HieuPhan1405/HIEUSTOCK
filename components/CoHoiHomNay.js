import Link from "next/link";
import { fmt, pct, tinhVungLenh, chuoiVung, nhanGiaiNgan, nhanLoaiVao, nhanLenhWeb } from "@/components/dungChung";
import { dungCoHoiHomNay } from "@/lib/coHoiHomNay";
import { tenCongTy } from "@/lib/tenMa";
import { CHUOI_TY_LE_CHOT } from "@/lib/tyLeChot";
import NhanTheoDoi from "@/components/NhanTheoDoi";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const NGOC = "var(--cyan)";
const CAM = "var(--cam)";
const sans = { fontFamily: "'Inter', sans-serif" };
const mono = { fontFamily: "'JetBrains Mono', monospace" };

const ngayVN = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "");
const ngayNgan = (s) => (s ? `${String(s).slice(8, 10)}/${String(s).slice(5, 7)}` : "");
const mauLai = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);
const TRANG_THAI_VUNG = {
  trong: ["trong vùng mua", XANH],
  tren: ["đã vượt vùng mua — chờ hồi, không đuổi giá", VANG],
  duoi: ["dưới vùng mua", MUTED],
};

// 1 O LENH: tieu de + so luong + mo ta, danh sach dong (moi dong 1 lenh, bam vao mo trang ma).
function OLenh({ tieuDe, mau, moTa, ds, trong, hien, may }) {
  return (
    <div className="rounded-2xl border flex flex-col min-w-0" style={{ borderColor: VIEN, background: NEN_CARD, borderTop: `3px solid ${mau}` }}>
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--vien-nhe)" }}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base" style={{ ...sans, fontWeight: 700, color: mau }} data-may={may}>
            {tieuDe}
          </h3>
          <span className="text-2xl" style={{ ...mono, fontWeight: 700, color: ds.length > 0 ? mau : MUTED }}>
            {ds.length}
          </span>
        </div>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: MUTED }}>
          {moTa}
        </p>
      </div>
      <div className="px-2 py-1 flex-1">
        {ds.length === 0 ? (
          <p className="px-2 py-4 text-sm" style={{ color: MUTED }}>
            {trong}
          </p>
        ) : (
          ds.map((x) => hien(x))
        )}
      </div>
    </div>
  );
}

// 1 DONG trong o: ma (+ ten ngan / nhan) ben trai, noi dung o giua, con so ben phai.
function Dong({ ma, ten, nhan, mauNhan, children, phai, the = null }) {
  const t = tenCongTy(ma);
  return (
    <Link
      href={`/ma/${ma}`}
      className="grid grid-cols-[76px_1fr_auto] items-start gap-3 px-2 py-2.5 border-b last:border-b-0 rounded-lg hover:bg-[color:var(--hover-nhe)] transition-colors"
      style={{ borderColor: "var(--vien-nhe)" }}
    >
      <span className="min-w-0">
        <span className="block" style={{ ...sans, fontWeight: 700, fontSize: 15, color: TEXT }}>
          {ten ?? ma}
        </span>
        {nhan ? (
          <span className="block text-[10px] font-bold" style={{ ...sans, color: mauNhan }} data-may={nhan === "Mua mới" ? "mua-moi" : undefined}>
            {nhan}
          </span>
        ) : (
          t?.ngan && (
            <span className="block truncate text-[10px]" style={{ ...sans, color: MUTED }} title={t.ten}>
              {t.ngan}
            </span>
          )
        )}
        {the}
      </span>
      <span className="text-xs leading-relaxed min-w-0" style={{ ...mono, color: MUTED }}>
        {children}
      </span>
      <span className="text-right" style={{ ...mono, fontSize: 13 }}>
        {phai}
      </span>
    </Link>
  );
}

// Vung mua / cat lo / chot loi cua 1 lenh MUA hoac MUA MOI (dong tin hieu hoac dong lenh dang mo).
function VungLenh({ row }) {
  const v = tinhVungLenh(row);
  if (!v) return <>Giá {fmt(row.gia_mua ?? row.gia)}</>;
  const [ttNhan, ttMau] = TRANG_THAI_VUNG[v.mua.trangThai] ?? TRANG_THAI_VUNG.trong;
  return (
    <>
      <span data-may="vung-mua">Mua</span> <b style={{ color: TEXT }}>{chuoiVung(v.mua.tu, v.mua.den)}</b>{" "}
      <span style={{ color: ttMau, fontWeight: 700, ...sans, fontSize: 10 }} data-may="vung-mua">
        · {ttNhan}
      </span>
      <br />
      <span data-may="cat-lo">Cắt lỗ</span> <b style={{ color: DO }}>{v.sl ? chuoiVung(v.sl.tu, v.sl.den) : "—"}</b>
      {" · "}
      <span data-may="tp">TP1/TP2</span>{" "}
      <b style={{ color: XANH }}>
        {v.tp ? `${fmt(row.tp1)} / ${fmt(row.tp2)}` : "—"}
      </b>
    </>
  );
}

// TOP CO HOI DANG CHU Y (trang dau): 4 O LENH CUA PHIEN HOM NAY - hang tren Mua | Ban, hang duoi Mua moi | Ban bot (dien thoai: xep doc cung thu tu). Du lieu: lib/coHoiHomNay.js.
export default function CoHoiHomNay({ tatCa, dongLenh, ngay }) {
  const { mua, ban, muaMoi, banBot } = dungCoHoiHomNay({ tatCa, dongLenh, ngay });
  return (
    <section aria-label="Top cơ hội đáng chú ý hôm nay" className="mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>
          Top cơ hội đáng chú ý
          {ngay && <span style={{ color: MUTED, fontWeight: 400 }}> · phiên {ngayVN(ngay)}</span>}
        </h2>
        <Link href="/lenh-mo" className="text-xs" style={{ color: PRIMARY, ...mono }}>
          xem lệnh đang mở →
        </Link>
      </div>
      <p className="text-xs mb-4" style={{ color: MUTED }}>
        Chỉ các lệnh phát sinh trong phiên này. Chốt lời: {CHUOI_TY_LE_CHOT}. Lệnh đang giữ từ trước xem ở Sổ lệnh đang mở.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <OLenh
          tieuDe="Mua"
          may="mua"
          mau={XANH}
          moTa="Tín hiệu MUA mới trong phiên — ngoài khung giờ vào lệnh hiện THEO DÕI, chỉ mua trong khung"
          ds={mua}
          trong="Phiên này không có tín hiệu MUA."
          hien={(r) => (
            <Dong
              key={r.khoa_lenh ?? r.ma}
              ma={r.ma}
              nhan={nhanLenhWeb(r)?.nhan ?? nhanLoaiVao(r)?.nhan ?? nhanGiaiNgan(r)?.nhan}
              mauNhan={nhanLenhWeb(r)?.mau ?? nhanLoaiVao(r)?.mau ?? nhanGiaiNgan(r)?.mau}
              the={r.lenh_web || r.da_chot_mua ? null : <NhanTheoDoi loai="mua" />}
              phai={
                <>
                  <span style={{ color: TEXT }}>{fmt(r.gia)}</span>
                  <span className="block text-[11px]" style={{ color: mauLai(r.doi) }}>
                    {pct(r.doi, 2)}
                  </span>
                </>
              }
            >
              <VungLenh row={r} />
            </Dong>
          )}
        />

        <OLenh
          tieuDe="Bán"
          may="ban"
          mau={DO}
          moTa="Lệnh đóng trong phiên: bán, cắt lỗ, hòa vốn, thoát lệnh — ngoài khung giờ hiện THEO DÕI, chốt ở khung kế tiếp nếu tín hiệu còn"
          ds={ban}
          trong="Phiên này không có lệnh bán."
          hien={(b) => (
            <Dong
              key={b.khoa}
              ma={b.ma}
              nhan={b.laMuaMoi ? "Mua mới" : null}
              mauNhan={NGOC}
              the={b.theoDoi ? <NhanTheoDoi loai="ban" tu={b.theoDoiTu} /> : null}
              phai={
                <>
                  <span className="font-bold" style={{ color: mauLai(b.ketQuaPct) }}>
                    {pct(b.ketQuaPct, 2)}
                  </span>
                  <span className="block text-[10px]" style={{ color: MUTED, ...sans }} data-may="ket-qua-ca-lenh">
                    {b.theoDoi ? "tạm tính" : "cả lệnh"}
                  </span>
                </>
              }
            >
              <span style={{ color: TEXT, ...sans, fontWeight: 600 }}>{b.lyDo}</span>
              {b.phanConLaiPct != null && <span> · phần còn lại {b.phanConLaiPct}%</span>}
              <br />
              {b.giaMua != null && `mua ${ngayNgan(b.ngayMua)} giá ${fmt(b.giaMua)} → `}
              {b.theoDoi ? "giá hiện " : "bán "}
              {fmt(b.giaBan)}
            </Dong>
          )}
        />

        <OLenh
          tieuDe="Mua mới"
          may="mua-moi"
          mau={NGOC}
          moTa="Lệnh vào đợt sau (giá hồi về hỗ trợ rồi bật lên) — cho người đã lỡ lệnh đầu"
          ds={muaMoi}
          trong="Phiên này không có lệnh mua mới."
          hien={(l) => (
            <Dong
              key={l.khoa_lenh}
              ma={l.ma}
              ten={l.ten_lenh}
              nhan={l.lenh_web ? "Mua mới · web giữ" : "Mua mới"}
              mauNhan={l.lenh_web ? "var(--vang)" : NGOC}
              the={l.lenh_web ? null : <NhanTheoDoi loai="mua" />}
              phai={
                <>
                  <span style={{ color: TEXT }}>{fmt(l.gia)}</span>
                  <span className="block text-[11px]" style={{ color: mauLai(l.lai_lo_pct) }}>
                    {pct(l.lai_lo_pct, 2)}
                  </span>
                </>
              }
            >
              <VungLenh row={l} />
            </Dong>
          )}
        />

        <OLenh
          tieuDe="Bán bớt"
          may="ban-bot"
          mau={CAM}
          moTa="Chốt 30% khi chạm TP1 / TP2 trong phiên, và cảnh báo giảm bớt khi điểm tụt"
          ds={banBot}
          trong="Phiên này không có lệnh bán bớt."
          hien={(x) =>
            x.loai === "chot" ? (
              <Dong
                key={x.khoa}
                ma={x.ma}
                nhan={x.laMuaMoi ? "Mua mới" : null}
                mauNhan={NGOC}
                phai={
                  <>
                    <span className="font-bold" style={{ color: mauLai(x.laiPct) }}>
                      {pct(x.laiPct, 2)}
                    </span>
                    <span className="block text-[10px]" style={{ color: MUTED, ...sans }}>
                      phần chốt
                    </span>
                  </>
                }
              >
                <span style={{ color: XANH, ...sans, fontWeight: 600 }} data-may="ban-bot">
                  Chạm {x.tp} — chốt {x.phanPct ?? 30}%
                </span>
                <br />
                giá chốt {x.moc.length > 1 ? x.moc.map((m) => `${m.tp} ${fmt(m.gia)}`).join(" · ") : fmt(x.gia)}
              </Dong>
            ) : (
              <Dong
                key={x.khoa}
                ma={x.ma}
                phai={
                  <>
                    <span style={{ color: mauLai(x.laiPct) }}>{pct(x.laiPct, 2)}</span>
                    <span className="block text-[10px]" style={{ color: MUTED, ...sans }}>
                      đang lãi/lỗ
                    </span>
                  </>
                }
              >
                <span style={{ color: CAM, ...sans, fontWeight: 600 }} data-may="canh-bao-giam-bot">
                  Cảnh báo giảm bớt
                </span>
                <br />
                điểm {fmt(x.diem)} dưới ngưỡng, chưa đủ điều kiện BÁN
              </Dong>
            )
          }
        />
      </div>
    </section>
  );
}
