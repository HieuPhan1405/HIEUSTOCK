"use client";

import { useEffect, useSyncExternalStore } from "react";

// KHO CHUNG phia trinh duyet cho cac danh sach theo doi: moi nut theo doi tren bang (hang tram dong) doc chung 1 ban, chi goi /api/danh-sach 1 lan.
// trangThai.danhSach: null = chua tai / chua dang nhap; mang = cac danh sach (danh sach chinh dau tien). Xem lib/danhSachTheoDoi.js.
let trangThai = { daTai: false, danhSach: null };
let dangTai = null;
const nguoiNghe = new Set();

function phat(moi) {
  trangThai = { ...trangThai, ...moi };
  nguoiNghe.forEach((f) => f());
}

function dangKy(f) {
  nguoiNghe.add(f);
  return () => nguoiNghe.delete(f);
}

const BAN_DAU = { daTai: false, danhSach: null };

export function napDanhSach() {
  if (!dangTai)
    dangTai = fetch("/api/danh-sach")
      .then((r) => r.json())
      .then((d) => phat({ daTai: true, danhSach: d.danhSach ?? null }))
      .catch(() => phat({ daTai: true }))
      .finally(() => {
        dangTai = null;
      });
  return dangTai;
}

// Trang da co san du lieu tu server (Danh sach theo doi) thi nap thang, khong goi API.
export function datDanhSach(danhSach) {
  phat({ daTai: true, danhSach });
}

export function useDanhSachTheoDoi({ tuTai = true } = {}) {
  const tt = useSyncExternalStore(dangKy, () => trangThai, () => BAN_DAU);
  useEffect(() => {
    if (tuTai && !trangThai.daTai) napDanhSach();
  }, [tuTai]);
  return tt;
}

// Gui 1 thao tac (tao / doiTen / xoa / them / bo) - cap nhat kho ngay khi may chu tra ve. Loi -> throw Error(thong bao de hieu).
export async function thaoTacDanhSach(hanhDong) {
  const r = await fetch("/api/danh-sach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(hanhDong) });
  let d = {};
  try {
    d = await r.json();
  } catch {}
  if (!r.ok) throw new Error(d.loi || "Không lưu được, thử lại sau.");
  if (d.danhSach) phat({ daTai: true, danhSach: d.danhSach });
  return d;
}
