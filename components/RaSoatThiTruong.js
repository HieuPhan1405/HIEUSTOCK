import Link from "next/link";
import { nhanTamLy } from "@/lib/thiTruong";
import { tenCongTy } from "@/lib/tenMa";
import { fmt, pct, nhe } from "@/components/dungChung";
import { soVN, tyVN } from "@/lib/soVN";

// CAC O THI TRUONG cua Dashboard (10/11/2026 lam lai kieu FireAnt: tung o gon, moi chi so 1 con so + 1 hinh nho, chu giai thich toi thieu).
// Truoc day la 1 khoi "Ra soat nhanh" 6 hang dai ~1.100px + 3 the "Xu huong / Tam ly / Muc giu lenh" (gia + xu huong VN-Index bo vi trung voi dai chi so + trang Tong quan).
// Tat ca tinh tren cac ma he thong dang theo doi (lib/thiTruong.js tinhTongQuanThiTruong), KHONG phai toan thi truong - tieu de o ghi ro.

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const sans = { fontFamily: "var(--font-chu)" };

// Khung o dung chung: tieu de + chu phu nho + phan phai (vd link "Xem them"), than o.
export function OThiTruong({ tieuDe, phu, phai, children, className = "", may }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 h-full flex flex-col min-w-0 ${className}`} style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 mb-3">
        <h2 className="text-[15px]" style={{ ...sans, fontWeight: 700 }} data-may={may}>
          {tieuDe}
          {phu && <span className="text-xs" style={{ color: MUTED, fontWeight: 400 }}> · {phu}</span>}
        </h2>
        {phai}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// 1 dong cua o Thong ke phien: nhan trai, so phai, hinh nho ben duoi.
function DongThongKe({ nhan, phu, gia, mau = TEXT, children, may }) {
  return (
    <div className="py-3 border-t first:border-t-0 first:pt-0 last:pb-0" style={{ borderColor: "var(--vien-nhe)" }} data-may={may}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] min-w-0" style={{ ...sans, color: "var(--mo-2)" }}>
          {nhan}
          {phu && (
            <span className="block text-[11px]" style={{ color: MUTED }}>
              {phu}
            </span>
          )}
        </p>
        <b className="text-[17px] whitespace-nowrap" style={{ ...sans, color: mau }}>
          {gia}
        </b>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function ThanhChong({ phan, cao = 8 }) {
  const tong = phan.reduce((s, [n]) => s + n, 0) || 1;
  return (
    <div className="flex rounded-full overflow-hidden gap-[2px]" style={{ height: cao }} aria-hidden="true">
      {phan.filter(([n]) => n > 0).map(([n, mau], i) => (
        <div key={i} style={{ width: `${(n / tong) * 100}%`, background: mau }} />
      ))}
    </div>
  );
}

// Cot nho N phien (thanh khoan 20 phien): cot cuoi = phien moi nhat, to dam.
function CotNho({ ds, mau }) {
  const max = Math.max(...ds, 1);
  return (
    <div className="flex items-end gap-[2px] h-7" aria-hidden="true">
      {ds.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${Math.max(6, (v / max) * 100)}%`, background: mau, opacity: i === ds.length - 1 ? 1 : 0.4 }} />
      ))}
    </div>
  );
}

function TyLeNho({ nhan, ty, mau }) {
  return (
    <div className="min-w-0">
      <div className="flex justify-between text-[11px] mb-1" style={{ color: MUTED }}>
        <span className="truncate">{nhan}</span>
        <b style={{ color: TEXT, ...sans }}>{ty == null ? "—" : `${Math.round(ty)}%`}</b>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--vien)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, ty ?? 0))}%`, background: mau }} />
      </div>
    </div>
  );
}

// O "THONG KE PHIEN" (kieu FireAnt): do rong, thanh khoan HOSE so voi TB20 (cot 20 phien), khoi ngoai rong HOSE, ty le ma tren Kijun / can bang / dat diem, tam ly, muc giu lenh.
// thanhKhoan: chuoi layChuoiThanhKhoanHOSE (tang dan, phan tu cuoi = phien moi nhat) hoac null; khoiNgoai: layDongTienNuocNgoai() hoac null - thieu thi bo dong do.
export function TheThongKePhien({ tq, thanhKhoan, khoiNgoai }) {
  const dr = tq.doRong;
  const tamLy = nhanTamLy(tq.tamLy);
  let tk = null;
  if (thanhKhoan?.length >= 2) {
    const homNay = thanhKhoan[thanhKhoan.length - 1];
    const truoc20 = thanhKhoan.slice(-21, -1);
    const tb20 = truoc20.reduce((s, x) => s + x.giaTriTy, 0) / truoc20.length;
    tk = { giaTri: homNay.giaTriTy, khop: homNay.khopTy, ss: (homNay.giaTriTy / tb20 - 1) * 100, chuoi: thanhKhoan.slice(-20).map((x) => x.giaTriTy) };
  }
  return (
    <OThiTruong tieuDe="Thống kê phiên" phu={`${tq.tong} mã hệ thống theo dõi`} may="thong-ke-phien">
      <DongThongKe nhan="Độ rộng" phu={`tăng mạnh >3%: ${dr.tangManh} · giảm mạnh <−3%: ${dr.giamManh}`} gia={`${dr.tang} / ${dr.giam}`} mau={dr.tang >= dr.giam ? XANH : DO}>
        <ThanhChong phan={[[dr.tang, XANH], [dr.dung, VANG], [dr.giam, DO]]} />
        <p className="flex justify-between text-[11px] mt-1" style={sans}>
          <span style={{ color: XANH }}>{dr.tang} tăng</span>
          <span style={{ color: VANG }}>{dr.dung} đứng giá</span>
          <span style={{ color: DO }}>{dr.giam} giảm</span>
        </p>
      </DongThongKe>
      {tk && (
        <DongThongKe nhan="Thanh khoản HOSE" phu={`khớp lệnh ${tyVN(tk.khop)} tỷ · ${tk.ss >= 0 ? "cao" : "thấp"} hơn TB20 ${soVN(Math.abs(tk.ss), 1)}%`} gia={`${tyVN(tk.giaTri)} tỷ`} mau={tk.ss >= 0 ? XANH : DO}>
          <CotNho ds={tk.chuoi} mau="var(--tim-nhat)" />
        </DongThongKe>
      )}
      {khoiNgoai && (
        <DongThongKe nhan="Khối ngoại ròng HOSE" phu={`phiên ${khoiNgoai.ngay.split("-").reverse().slice(0, 2).join("/")}`} gia={`${khoiNgoai.rongHose > 0 ? "+" : ""}${tyVN(khoiNgoai.rongHose)} tỷ`} mau={khoiNgoai.rongHose >= 0 ? XANH : DO} />
      )}
      <DongThongKe nhan="Vị trí giá của các mã">
        <div className="grid grid-cols-3 gap-3">
          <TyLeNho nhan="Trên Kijun" ty={tq.tren.kijun} mau="#3B9EFF" />
          <TyLeNho nhan="Trên cân bằng" ty={tq.tren.canBang} mau="var(--tim-nhat)" />
          <TyLeNho nhan="Đạt điểm MUA" ty={tq.tren.datDiem} mau={XANH} />
        </div>
      </DongThongKe>
      <DongThongKe may="tam-ly" nhan="Tâm lý thị trường" phu="trung bình 4 tỷ lệ: mã tăng, trên Kijun, trên cân bằng, đạt điểm" gia={tq.tamLy == null ? "—" : `${tq.tamLy} · ${tamLy.nhan}`} mau={tamLy.mau}>
        <div className="relative h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--do), var(--cam), var(--vang), var(--chanh), var(--xanh))" }} aria-hidden="true">
          {tq.tamLy != null && <span className="absolute -top-1 w-1 h-3.5 rounded-full" style={{ left: `calc(${tq.tamLy}% - 2px)`, background: "var(--chu)" }} />}
        </div>
      </DongThongKe>
      <DongThongKe may="muc-giu-lenh" nhan="Mức giữ lệnh của hệ thống" phu={`${tq.dangGiu}/${tq.tong} mã đang MUA hoặc NẮM GIỮ`} gia={tq.tyLeDangGiu == null ? "—" : `${Math.round(tq.tyLeDangGiu)}%`} mau="var(--tim-chu)" />
    </OThiTruong>
  );
}

function DongMa({ r, mau }) {
  const ten = r.ten_ngan ?? tenCongTy(r.ma)?.ten; // ten ngan ("Chung khoan SSI") de khong bi cat cut "Cong ty Co phan..."
  return (
    <Link href={`/ma/${r.ma}`} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-b-0 hover:opacity-80" style={{ borderColor: "var(--vien-nhe)" }}>
      <span className="min-w-0">
        <b className="text-[13px]" style={sans}>
          {r.ma}
        </b>
        {ten && (
          <span className="block text-[11px] truncate" style={{ color: MUTED }}>
            {ten}
          </span>
        )}
      </span>
      <b className="text-[13px] whitespace-nowrap" style={{ color: mau, ...sans }}>
        {pct(r.doi, 2)}
      </b>
    </Link>
  );
}

// O "TOP BIEN DONG": 6 ma tang / 6 ma giam manh nhat (chi ma GTGD TB20 tu 5 ty) - 2 cot.
export function TheBienDong({ tq }) {
  return (
    <OThiTruong tieuDe="Top biến động" phu="mã GTGD TB20 từ 5 tỷ">
      <div className="grid grid-cols-2 gap-x-5">
        <div className="min-w-0">
          <p className="text-xs mb-1" style={{ color: XANH, ...sans, fontWeight: 600 }}>
            Tăng mạnh
          </p>
          {tq.topTang.slice(0, 6).map((r) => (
            <DongMa key={r.ma} r={r} mau={XANH} />
          ))}
        </div>
        <div className="min-w-0">
          <p className="text-xs mb-1" style={{ color: DO, ...sans, fontWeight: 600 }}>
            Giảm mạnh
          </p>
          {tq.topGiam.slice(0, 6).map((r) => (
            <DongMa key={r.ma} r={r} mau={DO} />
          ))}
        </div>
      </div>
    </OThiTruong>
  );
}

function Chip({ href, mau, chinh, phu }) {
  const noiDung = (
    <>
      <b style={{ ...sans, fontWeight: 700 }}>{chinh}</b>
      {phu && <span style={{ opacity: 0.85, fontSize: 11 }}>{phu}</span>}
    </>
  );
  const kieu = { background: nhe(mau, 12), color: mau, border: `1px solid ${nhe(mau, 20)}` };
  return href ? (
    <Link href={href} className="inline-flex items-baseline gap-1.5 px-2 py-1 rounded-md text-xs hover:brightness-125 transition" style={kieu}>
      {noiDung}
    </Link>
  ) : (
    <span className="inline-flex items-baseline gap-1.5 px-2 py-1 rounded-md text-xs" style={kieu}>
      {noiDung}
    </span>
  );
}

function NhomChip({ nhan, mau, children }) {
  return (
    <div className="py-3 border-t first:border-t-0 first:pt-0 last:pb-0" style={{ borderColor: "var(--vien-nhe)" }}>
      <p className="text-xs mb-2" style={{ color: mau, ...sans, fontWeight: 600 }}>
        {nhan}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// O "NGANH & DIEM NOI BAT": nganh tich cuc / tieu cuc (trung binh % trong phien), ma vuot dinh 52 tuan, ma dat diem dang cho phien sau.
export function TheNoiBat({ tq }) {
  return (
    <OThiTruong
      tieuDe="Ngành & điểm nổi bật"
      phai={
        <Link href="/nganh" className="text-xs" style={{ color: "var(--tim-chu)" }}>
          Phân tích ngành →
        </Link>
      }
    >
      <NhomChip nhan="Ngành tích cực" mau={XANH}>
        {tq.nganhTot.map((n) => (
          <Chip key={n.khoa} mau={XANH} chinh={n.nhan} phu={pct(n.tb, 2)} />
        ))}
      </NhomChip>
      <NhomChip nhan="Ngành tiêu cực" mau={DO}>
        {tq.nganhXau.map((n) => (
          <Chip key={n.khoa} mau={DO} chinh={n.nhan} phu={pct(n.tb, 2)} />
        ))}
      </NhomChip>
      <NhomChip nhan={`Vượt đỉnh 52 tuần · ${tq.soVuotDinh} mã`} mau={XANH}>
        {tq.vuotDinh.length ? tq.vuotDinh.slice(0, 8).map((r) => <Chip key={r.ma} href={`/ma/${r.ma}`} mau={XANH} chinh={r.ma} phu={pct(r.doi, 1)} />) : <span className="text-xs" style={{ color: MUTED }}>Không có mã nào</span>}
      </NhomChip>
      <NhomChip nhan="Đạt điểm, đang chờ phiên sau" mau={VANG}>
        {tq.choPhienSau.length ? tq.choPhienSau.slice(0, 10).map((r) => <Chip key={r.khoa ?? r.ma} href={`/ma/${r.ma}`} mau={VANG} chinh={r.ma} phu={`điểm ${fmt(r.diem)}`} />) : <span className="text-xs" style={{ color: MUTED }}>Không có mã nào</span>}
      </NhomChip>
    </OThiTruong>
  );
}

