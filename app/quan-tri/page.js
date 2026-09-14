"use client";

import { useState, useEffect, useCallback } from "react";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";

const NHAN_LOAI = {
  dong_luc: { nhan: "Động lực", mau: "#22C55E" },
  theo_doi: { nhan: "Theo dõi", mau: "#FBBF24" },
  rui_ro: { nhan: "Rủi ro", mau: "#EF4444" },
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

  const [dsLienHe, setDsLienHe] = useState([]);
  const [dangTaiLienHe, setDangTaiLienHe] = useState(false);

  const [sdt, setSdt] = useState("");
  const [zalo, setZalo] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [nganHang, setNganHang] = useState("");
  const [soTk, setSoTk] = useState("");
  const [chuTk, setChuTk] = useState("");
  const [dangLuuTT, setDangLuuTT] = useState(false);
  const [thongBaoTT, setThongBaoTT] = useState("");

  useEffect(() => {
    setApiKey(locApiKey());
  }, []);

  useEffect(() => {
    fetch("/api/thong-tin-lien-he")
      .then((r) => r.json())
      .then((d) => {
        const tt = d.thongTin;
        if (!tt) return;
        setSdt(tt.sdt || "");
        setZalo(tt.zalo || "");
        setTiktok(tt.tiktok || "");
        setFacebook(tt.facebook || "");
        setNganHang(tt.ngan_hang || "");
        setSoTk(tt.so_tk || "");
        setChuTk(tt.chu_tk || "");
      })
      .catch(() => {});
  }, []);

  async function luuThongTinLienHe(e) {
    e.preventDefault();
    setDangLuuTT(true);
    setThongBaoTT("");
    try {
      const res = await fetch("/api/thong-tin-lien-he", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ sdt, zalo, tiktok, facebook, nganHang, soTk, chuTk }),
      });
      const d = await res.json();
      setThongBaoTT(res.ok ? "Đã lưu." : "Lỗi: " + (d.loi || "không rõ"));
    } catch (e) {
      setThongBaoTT("Lỗi: " + String(e?.message || e));
    } finally {
      setDangLuuTT(false);
    }
  }

  const taiLienHe = useCallback(async (key) => {
    if (!key) return;
    setDangTaiLienHe(true);
    try {
      const res = await fetch("/api/lien-he", { headers: { "x-api-key": key } });
      const d = await res.json();
      if (res.ok) setDsLienHe(d.lienHe || []);
    } finally {
      setDangTaiLienHe(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey) taiLienHe(apiKey);
  }, [apiKey, taiLienHe]);

  async function xoaLienHe(id) {
    await fetch(`/api/lien-he?id=${id}`, { method: "DELETE", headers: { "x-api-key": apiKey } });
    taiLienHe(apiKey);
  }

  async function danhDauDaDoc(id) {
    await fetch(`/api/lien-he?id=${id}`, { method: "PATCH", headers: { "x-api-key": apiKey } });
    taiLienHe(apiKey);
  }

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
    <div className="max-w-3xl mx-auto px-6 py-10" style={{ color: "#F5F5F7" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
        Quản trị nội dung
      </h1>
      <p className="text-sm mb-6" style={{ color: "#8B8B99" }}>
        Nhập tay Định giá tham khảo và Câu chuyện kỳ vọng cho từng mã — AmiBroker không có nguồn dữ liệu này.
      </p>

      <div className="rounded-lg border p-4 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <label className="text-xs uppercase tracking-wide block mb-1" style={{ color: "#8B8B99" }}>
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
          style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
        />
      </div>

      {/* THONG TIN GIOI THIEU / KENH LIEN HE - hien cong khai o trang /lien-he */}
      {apiKey && (
        <div className="rounded-lg border p-5 mb-8" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B99" }}>
            Thông tin liên hệ (hiện công khai ở /lien-he)
          </p>
          <form onSubmit={luuThongTinLienHe} className="grid sm:grid-cols-2 gap-2">
            <input
              value={sdt}
              onChange={(e) => setSdt(e.target.value)}
              placeholder="Số điện thoại"
              className="px-2 py-1.5 text-sm outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            />
            <input
              value={zalo}
              onChange={(e) => setZalo(e.target.value)}
              placeholder="Link nhóm Zalo"
              className="px-2 py-1.5 text-sm outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            />
            <input
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="Link TikTok"
              className="px-2 py-1.5 text-sm outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            />
            <input
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="Link Facebook"
              className="px-2 py-1.5 text-sm outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            />
            <input
              value={nganHang}
              onChange={(e) => setNganHang(e.target.value)}
              placeholder="Tên ngân hàng (VD: Vietcombank)"
              className="px-2 py-1.5 text-sm outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            />
            <input
              value={soTk}
              onChange={(e) => setSoTk(e.target.value)}
              placeholder="Số tài khoản"
              className="px-2 py-1.5 text-sm outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            />
            <input
              value={chuTk}
              onChange={(e) => setChuTk(e.target.value)}
              placeholder="Tên chủ tài khoản"
              className="px-2 py-1.5 text-sm outline-none sm:col-span-2"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            />
            <button
              type="submit"
              disabled={dangLuuTT}
              className="px-3 py-1.5 text-sm font-medium sm:col-span-2"
              style={{ background: "#6C5CE7", color: "#FFFFFF", fontWeight: 600, opacity: dangLuuTT ? 0.6 : 1 }}
            >
              {dangLuuTT ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </form>
          {thongBaoTT && (
            <p className="text-xs mt-2" style={{ color: thongBaoTT.startsWith("Lỗi") ? "#EF4444" : "#22C55E" }}>
              {thongBaoTT}
            </p>
          )}
        </div>
      )}

      {/* TIN NHAN LIEN HE - khong phu thuoc ma CK, hien ngay khi co API key */}
      {apiKey && (
        <div className="rounded-lg border p-5 mb-8" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide" style={{ color: "#8B8B99" }}>
              Tin nhắn liên hệ ({dsLienHe.length})
            </p>
            <button onClick={() => taiLienHe(apiKey)} className="text-xs" style={{ color: "#6C5CE7" }}>
              {dangTaiLienHe ? "Đang tải..." : "Tải lại"}
            </button>
          </div>
          {dsLienHe.length === 0 && !dangTaiLienHe && (
            <p className="text-xs py-2" style={{ color: "#8B8B99" }}>
              Chưa có tin nhắn nào.
            </p>
          )}
          {dsLienHe.map((tn) => (
            <div key={tn.id} className="py-3 border-b text-sm" style={{ borderColor: "#1D1D26", opacity: tn.da_doc ? 0.55 : 1 }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span style={{ fontWeight: 700 }}>{tn.ho_ten}</span>{" "}
                  <span style={{ color: "#8B8B99" }}>
                    ({tn.lien_lac}) — {new Date(tn.tao_luc).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!tn.da_doc && (
                    <button onClick={() => danhDauDaDoc(tn.id)} className="text-xs" style={{ color: "#22C55E" }}>
                      Đánh dấu đã đọc
                    </button>
                  )}
                  <button onClick={() => xoaLienHe(tn.id)} className="text-xs" style={{ color: "#EF4444" }}>
                    Xoá
                  </button>
                </div>
              </div>
              <p className="mt-1" style={{ color: "#D8D8E0" }}>
                {tn.noi_dung}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={guiTraCuu} className="flex gap-2 mb-8">
        <input
          value={ma}
          onChange={(e) => setMa(e.target.value)}
          placeholder="Nhập mã cổ phiếu (ví dụ: FPT)"
          className="px-3 py-2 text-sm flex-1 outline-none"
          style={{ background: "#15151F", border: `1px solid ${VIEN}`, color: "#F5F5F7", fontFamily: "'JetBrains Mono', monospace" }}
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium"
          style={{ background: "#6C5CE7", color: "#FFFFFF", fontWeight: 600 }}
        >
          Tải dữ liệu
        </button>
      </form>

      {thongBao && (
        <p className="text-sm mb-4" style={{ color: "#EF4444" }}>
          {thongBao}
        </p>
      )}

      {ma.trim() && (
        <>
          {/* DINH GIA */}
          <div className="rounded-lg border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B99" }}>
              Định giá tham khảo — {ma.trim().toUpperCase()}
            </p>

            {dinhGia.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b text-sm" style={{ borderColor: "#1D1D26" }}>
                <span>
                  {d.cong_ty_ck} — {d.ngay_dinh_gia ? new Date(d.ngay_dinh_gia).toLocaleDateString("vi-VN") : "—"} —{" "}
                  <strong>{d.gia_muc_tieu}</strong>
                </span>
                <button onClick={() => xoaDinhGia(d.id)} className="text-xs" style={{ color: "#EF4444" }}>
                  Xoá
                </button>
              </div>
            ))}
            {dinhGia.length === 0 && !dangTai && (
              <p className="text-xs py-2" style={{ color: "#8B8B99" }}>
                Chưa có định giá nào cho mã này.
              </p>
            )}

            <form onSubmit={themDinhGia} className="grid sm:grid-cols-4 gap-2 mt-4">
              <input
                value={congTyCK}
                onChange={(e) => setCongTyCK(e.target.value)}
                placeholder="Công ty CK (VD: VCI)"
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
              />
              <input
                type="date"
                value={ngayDinhGia}
                onChange={(e) => setNgayDinhGia(e.target.value)}
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
              />
              <input
                type="number"
                step="0.01"
                value={giaMucTieu}
                onChange={(e) => setGiaMucTieu(e.target.value)}
                placeholder="Giá mục tiêu"
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
              />
              <button type="submit" className="px-3 py-1.5 text-sm font-medium" style={{ background: "#6C5CE7", color: "#FFFFFF", fontWeight: 600 }}>
                Thêm
              </button>
            </form>
          </div>

          {/* CAU CHUYEN */}
          <div className="rounded-lg border p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
            <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B99" }}>
              Câu chuyện kỳ vọng — {ma.trim().toUpperCase()}
            </p>

            {cauChuyen.map((c) => (
              <div key={c.id} className="flex items-start justify-between py-2 border-b text-sm gap-2" style={{ borderColor: "#1D1D26" }}>
                <span>
                  <span style={{ color: NHAN_LOAI[c.loai]?.mau || "#A6A6B3", fontWeight: 700 }}>
                    [{NHAN_LOAI[c.loai]?.nhan || c.loai}]
                  </span>{" "}
                  {c.noi_dung}{" "}
                  {c.ngay && <span style={{ color: "#8B8B99" }}>({new Date(c.ngay).toLocaleDateString("vi-VN")})</span>}
                </span>
                <button onClick={() => xoaCauChuyen(c.id)} className="text-xs shrink-0" style={{ color: "#EF4444" }}>
                  Xoá
                </button>
              </div>
            ))}
            {cauChuyen.length === 0 && !dangTai && (
              <p className="text-xs py-2" style={{ color: "#8B8B99" }}>
                Chưa có câu chuyện nào cho mã này.
              </p>
            )}

            <form onSubmit={themCauChuyen} className="grid sm:grid-cols-4 gap-2 mt-4">
              <select
                value={loaiCauChuyen}
                onChange={(e) => setLoaiCauChuyen(e.target.value)}
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
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
                style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
              />
              <input
                type="date"
                value={ngayCauChuyen}
                onChange={(e) => setNgayCauChuyen(e.target.value)}
                className="px-2 py-1.5 text-sm outline-none"
                style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium sm:col-span-4"
                style={{ background: "#6C5CE7", color: "#FFFFFF", fontWeight: 600 }}
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
