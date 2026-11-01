"use client";

import { useState } from "react";

// BIEU DO cho trang Danh gia danh muc. Mau chuoi --bd-1 (danh muc / rui ro) va --bd-2 (VN-Index / von) da kiem bang validate_palette (CVD + tuong phan, ca giao dien sang / toi).
// Mau trang thai (--xanh / --vang / --do) chi dung cho DIEM (tot / trung binh / kem) va luon kem chu.
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const VIEN = "var(--vien)";
const C1 = "var(--bd-1)";
const C2 = "var(--bd-2)";
const sans = { fontFamily: "var(--font-chu)" };
const p1 = (x) => (x == null || !Number.isFinite(x) ? "—" : x.toFixed(1).replace(".", ","));
const ngayVN = (t) => (t ? `${t.slice(8, 10)}/${t.slice(5, 7)}/${t.slice(0, 4)}` : "");
export const mauDiem = (d) => (d == null ? MUTED : d >= 70 ? "var(--xanh)" : d >= 50 ? "var(--vang)" : "var(--do)");

// DONG HO DIEM 0-100 (nua vong) - so + xep loai o giua, khong dua vao mau
export function DongHoDiem({ diem, xepLoai, size = 200 }) {
  const r = 78;
  const cx = 100;
  const cy = 96;
  const diemCung = (p) => {
    const a = Math.PI * (1 - p / 100);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  };
  const cung = (tu, den) => {
    const [x1, y1] = diemCung(tu);
    const [x2, y2] = diemCung(den);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const d = Math.max(0, Math.min(100, diem ?? 0));
  return (
    <svg viewBox="0 0 200 118" width={size} height={(size * 118) / 200} role="img" aria-label={`Điểm sức khỏe ${diem ?? "—"} trên 100, ${xepLoai ?? ""}`}>
      <path d={cung(0.5, 99.5)} stroke="var(--vien)" strokeWidth="14" fill="none" strokeLinecap="round" />
      {d > 1 && <path d={cung(0.5, d)} stroke={mauDiem(diem)} strokeWidth="14" fill="none" strokeLinecap="round" />}
      <text x={cx} y={cy - 12} textAnchor="middle" fontSize="40" fontWeight="800" fill={TEXT} style={sans}>
        {diem ?? "—"}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="13" fill={MUTED} style={sans}>
        {xepLoai ?? ""} · /100
      </text>
    </svg>
  );
}

export function TruDiem({ ten, v, toiDa = 25, moTa }) {
  return (
    <div className="mb-2.5" title={moTa}>
      <div className="flex justify-between text-xs mb-1" style={sans}>
        <span>{ten}</span>
        <span style={{ color: MUTED }}>
          <b style={{ color: TEXT }}>{v}</b>/{toiDa}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--vien-nhe)" }}>
        <div className="h-full rounded-full" style={{ width: `${(v / toiDa) * 100}%`, background: C1 }} />
      </div>
    </div>
  );
}

// DANH MUC vs VN-INDEX (chuan 100) - 1 truc, 2 duong 2px, chu giai + nhan cuoi duong, re chuot hien gia tri tung ngay
export function BieuDoHieuSuat({ chuoi }) {
  const [i, setI] = useState(null);
  if (!chuoi?.ngay?.length) return null;
  const W = 640;
  const H = 230;
  const L = 44;
  const R = 70;
  const T = 14;
  const B = 26;
  const n = chuoi.ngay.length;
  const tatCa = [...chuoi.danhMuc, ...chuoi.vni];
  let lo = Math.min(...tatCa);
  let hi = Math.max(...tatCa);
  const dem = (hi - lo) * 0.08 || 5;
  lo -= dem;
  hi += dem;
  const X = (k) => L + (k / (n - 1)) * (W - L - R);
  const Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const duong = (a) => a.map((v, k) => `${k ? "L" : "M"}${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join("");
  const vach = Array.from({ length: 4 }, (_, k) => lo + ((k + 0.5) * (hi - lo)) / 4);
  const thang = Array.from({ length: 4 }, (_, k) => Math.round((k * (n - 1)) / 3));
  const cuoiP = chuoi.danhMuc[n - 1];
  const cuoiV = chuoi.vni[n - 1];
  const tachNhan = Math.abs(Y(cuoiP) - Y(cuoiV)) < 14 ? (cuoiP >= cuoiV ? [-7, 7] : [7, -7]) : [0, 0];
  const diChuot = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    setI(Math.max(0, Math.min(n - 1, Math.round(((x - L) / (W - L - R)) * (n - 1)))));
  };
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-4 text-xs mb-2" style={sans}>
        <span className="inline-flex items-center gap-1.5">
          <span style={{ width: 14, height: 2, background: C1, display: "inline-block" }} /> Danh mục (tỷ trọng hiện tại)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span style={{ width: 14, height: 2, background: C2, display: "inline-block" }} /> VN-Index
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} onMouseMove={diChuot} onMouseLeave={() => setI(null)} role="img" aria-label="Diễn biến danh mục so với VN-Index, chuẩn 100">
        {vach.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke={VIEN} strokeWidth="1" />
            <text x={L - 6} y={Y(v) + 4} textAnchor="end" fontSize="11" fill={MUTED} style={sans}>
              {Math.round(v)}
            </text>
          </g>
        ))}
        {lo < 100 && hi > 100 && <line x1={L} x2={W - R} y1={Y(100)} y2={Y(100)} stroke={MUTED} strokeDasharray="3 3" strokeWidth="1" />}
        {thang.map((k) => (
          <text key={k} x={X(k)} y={H - 8} textAnchor={k === 0 ? "start" : k === n - 1 ? "end" : "middle"} fontSize="11" fill={MUTED} style={sans}>
            {ngayVN(chuoi.ngay[k]).slice(0, 5)}/{chuoi.ngay[k].slice(2, 4)}
          </text>
        ))}
        <path d={duong(chuoi.vni)} fill="none" stroke={C2} strokeWidth="2" strokeLinejoin="round" />
        <path d={duong(chuoi.danhMuc)} fill="none" stroke={C1} strokeWidth="2" strokeLinejoin="round" />
        <text x={W - R + 6} y={Y(cuoiP) + 4 + tachNhan[0]} fontSize="11" fill={TEXT} style={sans} fontWeight="700">
          {cuoiP >= 100 ? "+" : ""}
          {p1(cuoiP - 100)}%
        </text>
        <text x={W - R + 6} y={Y(cuoiV) + 4 + tachNhan[1]} fontSize="11" fill={MUTED} style={sans}>
          {cuoiV >= 100 ? "+" : ""}
          {p1(cuoiV - 100)}%
        </text>
        {i != null && (
          <g>
            <line x1={X(i)} x2={X(i)} y1={T} y2={H - B} stroke={MUTED} strokeWidth="1" />
            <circle cx={X(i)} cy={Y(chuoi.danhMuc[i])} r="4" fill={C1} stroke="var(--card)" strokeWidth="2" />
            <circle cx={X(i)} cy={Y(chuoi.vni[i])} r="4" fill={C2} stroke="var(--card)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {i != null && (
        <div className="absolute pointer-events-none rounded-lg border px-2.5 py-1.5 text-xs" style={{ top: 28, left: `${Math.min(70, (X(i) / W) * 100)}%`, borderColor: VIEN, background: "var(--card)", ...sans }}>
          <div style={{ color: MUTED }}>{ngayVN(chuoi.ngay[i])}</div>
          <div>
            Danh mục <b>{p1(chuoi.danhMuc[i] - 100)}%</b>
          </div>
          <div>
            VN-Index <b>{p1(chuoi.vni[i] - 100)}%</b>
          </div>
        </div>
      )}
    </div>
  );
}

// VON vs RUI RO tung ma: 2 thanh canh nhau (ty trong von / phan dong gop rui ro)
export function VonVaRuiRo({ ma }) {
  const ds = [...ma].sort((a, b) => b.rc - a.rc);
  const toiDa = Math.max(...ds.map((x) => Math.max(x.w, x.rc)), 0.01);
  return (
    <div>
      <div className="flex flex-wrap gap-4 text-xs mb-3" style={sans}>
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded-sm" style={{ width: 10, height: 10, background: C2, display: "inline-block" }} /> Tỷ trọng vốn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded-sm" style={{ width: 10, height: 10, background: C1, display: "inline-block" }} /> Phần rủi ro gánh
        </span>
      </div>
      {ds.map((x) => (
        <div key={x.ma} className="grid grid-cols-[52px_1fr] gap-2 items-center mb-2.5" title={`${x.ma}: vốn ${p1(x.w * 100)}% · rủi ro ${p1(x.rc * 100)}% · biến động năm ${Math.round(x.vol)}% · beta ${x.beta.toFixed(2)}`}>
          <b className="text-sm" style={sans}>
            {x.ma}
          </b>
          <div className="grid gap-[2px]">
            {[
              [x.w, C2],
              [x.rc, C1],
            ].map(([v, mau], k) => (
              <div key={k} className="flex items-center gap-2">
                <div className="h-2.5 rounded-r" style={{ width: `${(Math.max(0, v) / toiDa) * 85}%`, background: mau, minWidth: 2 }} />
                <span className="text-[11px]" style={{ color: k ? TEXT : MUTED, ...sans }}>
                  {p1(v * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// MA TRAN TUONG QUAN (toi da 12 ma lon nhat): o cang dam = 2 ma cang di cung chieu; am (hiem) to mau thu 2
export function MaTranTuongQuan({ rr, toiDa = 12 }) {
  const thuTu = rr.ma
    .map((x, i) => ({ ...x, i }))
    .sort((a, b) => b.w - a.w)
    .slice(0, toiDa);
  if (thuTu.length < 2) return null;
  return (
    <div>
      <div className="grid text-[10px] sm:text-[11px]" style={{ gridTemplateColumns: `repeat(${thuTu.length + 1}, minmax(0, 1fr))`, ...sans }}>
        <span />
        {thuTu.map((x) => (
          <span key={x.ma} className="text-center pb-1 font-bold truncate">
            {x.ma}
          </span>
        ))}
        {thuTu.map((a) => (
          <div key={a.ma} className="contents">
            <span className="font-bold pr-1 self-center truncate">{a.ma}</span>
            {thuTu.map((b) => {
              const v = rr.tuongQuan[a.i][b.i];
              const cung = a.ma === b.ma;
              const nen = cung ? "var(--vien-nhe)" : `color-mix(in srgb, ${v >= 0 ? C1 : C2} ${Math.round(Math.min(1, Math.abs(v)) * 85)}%, var(--card))`;
              return (
                <span key={b.ma} title={cung ? a.ma : `${a.ma} – ${b.ma}: tương quan ${v.toFixed(2).replace(".", ",")}`} className="text-center py-1.5 m-[1px] rounded" style={{ background: nen, color: !cung && Math.abs(v) > 0.55 ? "#fff" : TEXT }}>
                  {cung ? "—" : v.toFixed(2).replace(".", ",")}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-[11px] mt-2" style={{ color: MUTED }}>
        1 = luôn đi cùng chiều, 0 = không liên quan. Ô càng đậm, hai mã càng “là một” — cầm cả hai không giảm được rủi ro.
      </p>
    </div>
  );
}
