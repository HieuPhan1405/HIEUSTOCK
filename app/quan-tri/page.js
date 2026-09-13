"use client";

import { useState, useEffect, useCallback } from "react";

const VIEN = "#2A2620";
const NEN_CARD = "#1B1913";

const NHAN_LOAI = {
  dong_luc: { nhan: "Động lực", mau: "#5FCF8A" },
  theo_doi: { nhan: "Theo dõi", mau: "#E8C873" },
  rui_ro: { nhan: "Rủi ro", mau: "#E86A6A" },
};

function locApiKey() {
  try {
    return localStorage.getItem("dg_api_key") || "";
  } catch {
    return "";
  }
}

function luuApiKey(v) {
  try {
    localStorage.setItem("dg_api_key", v);
  } catch {
    /* bo qua neu trinh duyet chan */
  }
}

export default function TrangQuanTri() {
  const [apiKey, setApiKey] = useState("");
  const [ma, setMa] = useState("");
  const [dinhGia, setDinhGia] = useState([]);
  const [cauChuyen, setCauChuyen] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [thongBao, setThongBao] = useState("");

  const [congTyCK, setCongTyCK] = useState("");
  const [ngayDinhGia, setNgayDinhGia] = useState("");
  const [giaMucTieu, setGiaMucTieu] = useState("");

  const [loaiCauChuyen, setLoaiCauChuyen] = useState("dong_luc");
  const [noiDungCauChuyen, setNoiDungCauChuyen] = useState("");
  const [ngayCauChuyen, setNgayCauChuyen] = useState("");

  useEffect(() => {
    setApiKey(locApiKey());
  }, []);

  const taiDuLieu = useCallback(async (maTraCuu) => {
    if (!maTraCuu) return;
    setDangTai(true);
    setThongBao("");
    try {
      const [rDG, rCC] = await Promise.all([
        fetch(`/api/dinh-gia?ma=${encodeURIComponent(maTraCuu)}`),
        fetch(`/api/cau-chuyen?ma=${encodeURIComponent(maTraCuu)}`),
      ]);
      const dDG = await rDG.json();
      const dCC = await rCC.json();
      setDinhGia(dDG.dinhGia || []);
      setCauChuyen(dCC.cauChuyen || []);
    } catch (e) {
      setThongBao("Lỗi tải dữ liệu: " + String(e?.message || e));
    } finally {
      setDangTai(false);
    }
  }, []);

  function guiTraCuu(e) {
    e.preventDefault();
    taiDuLieu(ma.trim().toUpperCase());
  }

  async function themDinhGia(e) {
    e.preventDefault();
    if (!ma.trim() || !congTyCK.trim() || !giaMucTieu) {
      setThongBao("Cần nhập đủ Mã, Công ty CK, Giá mục tiêu.");
      return;
    }
    setThongBao("");
    const res = await fetch("/api/dinh-gia", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        ma: ma.trim().toUpperCase(),
        congTyCK: congTyCK.trim(),
        ngayDinhGia: ngayDinhGia || null,
        giaMucTieu: Number(giaMucTieu),
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setCongTyCK("");
      setNgayDinhGia("");
      setGiaMucTieu("");
      taiDuLieu(ma.trim().toUpperCase());
    } else {
      setThongBao("Lỗi: " + (d.loi || "không rõ"));
    }
  }

  async function xoaDinhGia(id) {
    const res = await fetch(`/api/dinh-gia?id=${id}`, { method: "DELETE", headers: { "x-api-key": apiKey } });
    if (res.ok) taiDuLieu(ma.trim().toUpperCase());
  }

  async function themCauChuyen(e) {
    e.preventDefault();
    if (!ma.trim() || !noiDungCauChuyen.trim()) {
      setThongBao("Cần nhập đủ Mã và Nội dung.");
      return;
    }
    setThongBao("");
    const res = await fetch("/api/cau-chuyen", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        ma: ma.trim().toUpperCase(),
        loai: loaiCauChuyen,
        noiDung: noiDungCauChuyen.trim(),
        ngay: ngayCauChuyen || null,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setNoiDungCauChuyen("");
      setNgayCauChuyen("");
      taiDuLieu(ma.trim().toUpperCase());
    } else {
      setThongBao("Lỗi: " + (d.loi || "không rõ"));
    }
  }

  async function xoaCauChuyen(id) {
    const res = await fetch(`/api/cau-chuyen?id=${id}`, { method: "DELETE", headers: { "x-api-key": apiKey } });
    if (res.ok) taiDuLieu(ma.trim().toUpperCase());
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10" style={{ color: "#EDE7DD" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
        Quản trị nội dung
      </h1>
      <p className="text-sm mb-6" style={{ color: "#6F6C64" }}>
        Nhập tay Định giá tham khảo và Câu chuyện kỳ vọng cho từng mã — AmiBroker không có nguồn dữ liệu này.
      </p>

      <div className="rounded-lg border p-4 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <label className="text-xs uppercase tracking-wide block mb-1" style={{ color: "#6F6C64" }}>
          Mật khẩu (API key)
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            luuApiKey(e.target.value);
          }}
          placeholder="Trùng với UPLOAD_API_KEY trên Vercel"
          className="w-full px-3 py-2 text-sm outline-none"
          style={{ background: "#14120F", border: `1px solid ${VIEN}`, color: "#EDE7DD" }}
        />
      </div>

      <form onSubmit={guiTraCuu} className="flex gap-2 mb-8">
        <input
          value={ma}
          onChange={(e) => setMa(e.target.value)}
          placeholder="Nhập mã cổ phiếu (ví dụ: FPT)"
          className="px-3 py-2 text-sm flex-1 outline-none"
          style={{ background: "#1B1913", border: `1px solid ${VIEN}`, color: "#EDE7DD", fontFamily: "'JetBrains Mono', monospace" }}
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium"
          style={{ background: "#E8873A", color: "#241505", fontWeight: 600 }}
        >
          Tải dữ liệu
        </button>
      </form>

      {thongBao && (
        <p className="text-sm mb-4" style={{ color: "#E86A6A" }}>
          {thongBao}
        </p>
      )}

      {ma.trim() && (
        <>
          {/* DINH GIA */}
          <div className="rounded-lg border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#6F6C64" }}>
              Định giá tham khảo — {ma.trim().toUpperCase()}
            </p>

            {dinhGia.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b text-sm" style={{ borderColor: "#211F1A" }}>
                <span>
                  {d.cong_ty_ck} — {d.ngay_dinh_gia ? new Date(d.ngay_dinh_gia).toLocaleDateString("vi-VN") : "—"} —{" "}
                  <strong>{d.gia_muc_tieu}</strong>
                </span>
                <button onClick={() => xoaDinhGia(d.id)} className="text-xs" style={{ color: "#E86A6A" }}>
                  Xoá
                </button>
              </div>
            ))}
            {dinhGia.length === 0 && !dangTai && (
              <p className="text-xs py-2" style={{ color: "#6F6C64" }}>
                Chưa có định giá nào cho mã này.
              </p>
            )}

            <form onSubmit={themDinhGia} className="grid sm:grid-cols-4 gap-2 mt-4">
              <input
                value={congTyCK}
                onChange={(e) => setCongTyCK(e.target.value)}
                placeholder="Công ty CK (VD: VCI)"
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#14120F", border: `1px solid ${VIEN}`, color: "#EDE7DD" }}
              />
              <input
                type="date"
                value={ngayDinhGia}
                onChange={(e) => setNgayDinhGia(e.target.value)}
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#14120F", border: `1px solid ${VIEN}`, color: "#EDE7DD" }}
              />
              <input
                type="number"
                step="0.01"
                value={giaMucTieu}
                onChange={(e) => setGiaMucTieu(e.target.value)}
                placeholder="Giá mục tiêu"
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#14120F", border: `1px solid ${VIEN}`, color: "#EDE7DD" }}
              />
              <button type="submit" className="px-3 py-1.5 text-sm font-medium" style={{ background: "#E8873A", color: "#241505", fontWeight: 600 }}>
                Thêm
              </button>
            </form>
          </div>

          {/* CAU CHUYEN */}
          <div className="rounded-lg border p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#6F6C64" }}>
              Câu chuyện kỳ vọng — {ma.trim().toUpperCase()}
            </p>

            {cauChuyen.map((c) => (
              <div key={c.id} className="flex items-start justify-between py-2 border-b text-sm gap-2" style={{ borderColor: "#211F1A" }}>
                <span>
                  <span style={{ color: NHAN_LOAI[c.loai]?.mau || "#A8A296", fontWeight: 700 }}>
                    [{NHAN_LOAI[c.loai]?.nhan || c.loai}]
                  </span>{" "}
                  {c.noi_dung}{" "}
                  {c.ngay && <span style={{ color: "#6F6C64" }}>({new Date(c.ngay).toLocaleDateString("vi-VN")})</span>}
                </span>
                <button onClick={() => xoaCauChuyen(c.id)} className="text-xs shrink-0" style={{ color: "#E86A6A" }}>
                  Xoá
                </button>
              </div>
            ))}
            {cauChuyen.length === 0 && !dangTai && (
              <p className="text-xs py-2" style={{ color: "#6F6C64" }}>
                Chưa có câu chuyện nào cho mã này.
              </p>
            )}

            <form onSubmit={themCauChuyen} className="grid sm:grid-cols-4 gap-2 mt-4">
              <select
                value={loaiCauChuyen}
                onChange={(e) => setLoaiCauChuyen(e.target.value)}
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#14120F", border: `1px solid ${VIEN}`, color: "#EDE7DD" }}
              >
                <option value="dong_luc">Động lực</option>
                <option value="theo_doi">Theo dõi</option>
                <option value="rui_ro">Rủi ro</option>
              </select>
              <input
                value={noiDungCauChuyen}
                onChange={(e) => setNoiDungCauChuyen(e.target.value)}
                placeholder="Nội dung"
                className="px-2 py-1.5 text-sm outline-none sm:col-span-2"
                style={{ background: "#14120F", border: `1px solid ${VIEN}`, color: "#EDE7DD" }}
              />
              <input
                type="date"
                value={ngayCauChuyen}
                onChange={(e) => setNgayCauChuyen(e.target.value)}
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#14120F", border: `1px solid ${VIEN}`, color: "#EDE7DD" }}
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium sm:col-span-4"
                style={{ background: "#E8873A", color: "#241505", fontWeight: 600 }}
              >
                Thêm
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
