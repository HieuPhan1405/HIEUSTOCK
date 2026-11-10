"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { soVN, pctVN, khoiLuongVN } from "@/lib/soVN";
import { fmt } from "@/components/dungChung";

// O THONG TIN MA ben phai trang Bieu do (10/11/2026, Hieu: "thong tin hoi it" -> them kieu bang thong tin cua FireAnt): nhan nhanh, giao dich, khoi ngoai 10 phien,
// ky thuat, co ban. CHI truong CONG KHAI (allowlist lib/lamSachChoKhach.js + chi bao ky thuat + phan tich co ban - deu hien cho khach o Bo loc / trang ma).
// du: tao o app/bieu-do/page.js. Khoi ngoai tai rieng phia trinh duyet (/api/khoi-ngoai-ma, CDN 60 giay) de khong lam cham trang.
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const sans = { fontFamily: "var(--font-chu)" };
const coSo = (v) => v != null && Number.isFinite(Number(v));
const mauDau = (v) => (!coSo(v) ? TEXT : v > 0 ? XANH : v < 0 ? DO : VANG);

function Nhom({ ten, children }) {
  return (
    <div className="border-t pt-3" style={{ borderColor: "var(--vien)" }}>
      <p className="text-[11px] mb-1.5" style={{ color: MUTED, ...sans, fontWeight: 600 }}>
        {ten}
      </p>
      {children}
    </div>
  );
}

// dong: [nhan, gia tri hien thi, mau?] - bo dong khong co so lieu.
function Bang({ dong }) {
  const co = dong.filter((d) => d && d[1] != null && d[1] !== "");
  if (!co.length) return <p className="text-xs" style={{ color: MUTED }}>Chưa có dữ liệu.</p>;
  return (
    <dl className="flex flex-col gap-1 text-xs" style={sans}>
      {co.map(([k, v, mau]) => (
        <div key={k} className="flex justify-between gap-2">
          <dt style={{ color: MUTED }}>{k}</dt>
          <dd className="text-right" style={{ color: mau ?? TEXT, fontWeight: 600 }}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Nhan({ chu, mau }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap" style={{ color: mau, background: `color-mix(in srgb, ${mau} 14%, transparent)`, ...sans, fontWeight: 600 }}>
      {chu}
    </span>
  );
}

function KhoiNgoai10Phien({ ma }) {
  const [ds, setDs] = useState(null);
  useEffect(() => {
    let huy = false;
    fetch(`/api/khoi-ngoai-ma?ma=${encodeURIComponent(ma)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!huy) setDs(j.trangThai === "ok" ? j.phien : []);
      })
      .catch(() => {
        if (!huy) setDs([]);
      });
    return () => {
      huy = true;
    };
  }, [ma]);
  if (ds == null) return <p className="text-xs" style={{ color: MUTED }}>Đang tải…</p>;
  if (!ds.length) return <p className="text-xs" style={{ color: MUTED }}>Chưa có dữ liệu khối ngoại.</p>;
  const cuoi = ds[ds.length - 1];
  const tong = ds.reduce((s, x) => s + x.rongTy, 0);
  const max = Math.max(...ds.map((x) => Math.abs(x.rongTy)), 0.01);
  return (
    <>
      <Bang
        dong={[
          [`Ròng phiên ${cuoi.ngay.split("-").reverse().slice(0, 2).join("/")}`, `${cuoi.rongTy > 0 ? "+" : ""}${soVN(cuoi.rongTy, 1)} tỷ`, mauDau(cuoi.rongTy)],
          [`Ròng ${ds.length} phiên`, `${tong > 0 ? "+" : ""}${soVN(tong, 1)} tỷ`, mauDau(tong)],
        ]}
      />
      {/* cot nho: tren duong giua = mua rong, duoi = ban rong; cot cuoi la phien moi nhat */}
      <div className="flex items-center gap-[3px] h-10 mt-2" aria-hidden="true">
        {ds.map((x) => (
          <div key={x.ngay} className="flex-1 h-full flex flex-col" title={`${x.ngay}: ${soVN(x.rongTy, 1)} tỷ`}>
            <div className="flex-1 flex items-end">{x.rongTy > 0 && <div className="w-full rounded-t-sm" style={{ height: `${(x.rongTy / max) * 100}%`, background: XANH }} />}</div>
            <div className="h-px" style={{ background: "var(--vien-dam)" }} />
            <div className="flex-1">{x.rongTy < 0 && <div className="w-full rounded-b-sm" style={{ height: `${(-x.rongTy / max) * 100}%`, background: DO }} />}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function ThongTinMaBieuDo({ ma, du }) {
  if (!du) return null;
  const k = du.kyThuat;
  const g = du.giaoDich;
  const c = du.coBan;
  const vung = coSo(k.gia) && coSo(k.ggTop) && k.gia > k.ggTop ? ["Vùng Xanh", XANH] : coSo(k.gia) && coSo(k.ggBot) && k.gia < k.ggBot ? ["Vùng Đỏ", DO] : ["Vùng trung tính", "var(--mo-2)"];
  const xuHuong = k.trend > 0.5 ? ["Xu hướng tăng", XANH] : k.trend < -0.5 ? ["Xu hướng giảm", DO] : ["Đi ngang", VANG];
  const dongTien = k.dt > 0.2 ? ["Dòng tiền ủng hộ", XANH] : k.dt < -0.2 ? ["Dòng tiền rút ra", DO] : null;
  const adx = coSo(k.adx) ? `${soVN(k.adx, 0)} · ${k.adx >= 40 ? "mạnh" : k.adx >= 20 ? "trung bình" : "yếu"}` : null;
  const cachPct = (moc) => (coSo(k.gia) && coSo(moc) && moc > 0 ? (k.gia / moc - 1) * 100 : null);
  return (
    <>
      <div>
        {du.ten && (
          <p className="text-xs leading-snug mb-1" style={{ color: TEXT, ...sans, fontWeight: 600 }}>
            {du.ten}
          </p>
        )}
        <p className="text-[11px] mb-2" style={{ color: MUTED }}>
          {[du.san, du.nganh].filter(Boolean).join(" · ")}
        </p>
        <div className="flex flex-wrap gap-1">
          <Nhan chu={vung[0]} mau={vung[1]} />
          <Nhan chu={xuHuong[0]} mau={xuHuong[1]} />
          {dongTien && <Nhan chu={dongTien[0]} mau={dongTien[1]} />}
          {k.matThan && <Nhan chu="Cảnh báo Mắt Thần" mau={DO} />}
        </div>
      </div>

      <Nhom ten="Giao dịch">
        <Bang
          dong={[
            ["KL hôm nay / TB20", coSo(g.klTyLe) ? `${soVN(g.klTyLe, 1, true)} lần` : null, coSo(g.klTyLe) ? (g.klTyLe >= 1.5 ? XANH : g.klTyLe < 0.7 ? MUTED : TEXT) : undefined],
            ["KL TB20", coSo(g.klTb20) ? khoiLuongVN(g.klTb20) : null],
            ["GTGD TB20", coSo(g.gtgdTb20) ? `${soVN(g.gtgdTb20, 1)} tỷ/phiên` : null],
            ["Vốn hoá", coSo(g.vonHoaTy) ? `${soVN(g.vonHoaTy, 0)} tỷ` : null],
            ["Free float", coSo(g.freeFloat) ? `${soVN(g.freeFloat, 0)}%` : null],
            ["Vốn hoá tự do", coSo(g.vonHoaTuDoTy) ? `${soVN(g.vonHoaTuDoTy, 0)} tỷ` : null],
          ]}
        />
      </Nhom>

      <Nhom ten="Khối ngoại 10 phiên">
        <KhoiNgoai10Phien ma={ma} />
      </Nhom>

      <Nhom ten="Kỹ thuật">
        <Bang
          dong={[
            ["Điểm hợp lưu", coSo(k.diem) ? soVN(k.diem, 2, true) : null, mauDau(k.diem)],
            ["Kijun", coSo(k.kijun) ? `${fmt(k.kijun)} (${pctVN(cachPct(k.kijun), 1)})` : null, mauDau(cachPct(k.kijun))],
            ["Cân bằng dài hạn", coSo(k.ggBot) && coSo(k.ggTop) ? `${fmt(k.ggBot)} – ${fmt(k.ggTop)}` : null],
            ["Đỉnh 52 tuần", coSo(k.dinh52) ? `${fmt(k.dinh52)} (${pctVN(cachPct(k.dinh52), 1)})` : null],
            ["So VN-Index 20 phiên", coSo(k.rs20) ? pctVN(k.rs20, 1) : null, mauDau(k.rs20)],
            ["So VN-Index 60 phiên", coSo(k.rs60) ? pctVN(k.rs60, 1) : null, mauDau(k.rs60)],
            ["ADX", adx],
            ["RSI 14", coSo(k.rsi) ? soVN(k.rsi, 0) : null, coSo(k.rsi) ? (k.rsi >= 70 ? DO : k.rsi <= 30 ? XANH : TEXT) : undefined],
            ["MFI 14", coSo(k.mfi) ? soVN(k.mfi, 0) : null],
            ["Cách MA200", coSo(k.cachMa200) ? pctVN(k.cachMa200, 1) : null, mauDau(k.cachMa200)],
          ]}
        />
      </Nhom>

      {c && (
        <Nhom ten={`Cơ bản${c.quy ? ` · ${c.quy}` : ""}`}>
          <Bang
            dong={[
              ["P/E 4 quý", coSo(c.pe) ? `${soVN(c.pe, 1)}${coSo(c.peNganh) ? ` (ngành ${soVN(c.peNganh, 1)})` : ""}` : c.pe === null ? "lỗ / không có" : null, coSo(c.pe) && coSo(c.peNganh) ? (c.pe <= c.peNganh ? XANH : DO) : undefined],
              ["P/B", coSo(c.pb) ? `${soVN(c.pb, 2)}${coSo(c.pbNganh) ? ` (ngành ${soVN(c.pbNganh, 2)})` : ""}` : null, coSo(c.pb) && coSo(c.pbNganh) ? (c.pb <= c.pbNganh ? XANH : DO) : undefined],
              ["ROE", coSo(c.roe) ? `${soVN(c.roe, 1)}%` : null],
              ["Lợi nhuận 4 quý", coSo(c.lnYoY) ? `${pctVN(c.lnYoY, 0)} cùng kỳ` : null, mauDau(c.lnYoY)],
              ["Doanh thu 4 quý", coSo(c.dtYoY) ? `${pctVN(c.dtYoY, 0)} cùng kỳ` : null, mauDau(c.dtYoY)],
              ["Tỷ suất cổ tức", coSo(c.coTuc) ? `${soVN(c.coTuc, 1)}%` : null],
              ["Đánh giá 360", c.xepLoai ? `${c.xepLoai}${coSo(c.diem360) ? ` · ${soVN(c.diem360, 1)}/10` : ""}` : null],
            ]}
          />
        </Nhom>
      )}

      {ma !== "VNINDEX" && (
        <Link href={`/ma/${ma}`} className="text-xs" style={{ color: "var(--tim-chu)" }}>
          Xem chi tiết {ma} →
        </Link>
      )}
    </>
  );
}
