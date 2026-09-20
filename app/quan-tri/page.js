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

  const [dsNguoiDung, setDsNguoiDung] = useState([]);
  const [dangTaiNguoiDung, setDangTaiNguoiDung] = useState(false);

  const [zaloAppId, setZaloAppId] = useState("");
  const [zaloSecretKey, setZaloSecretKey] = useState("");
  const [zaloTrangThai, setZaloTrangThai] = useState(null);
  const [zaloThongBao, setZaloThongBao] = useState("");
  const [dangXuLyZalo, setDangXuLyZalo] = useState(false);

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
    // Doc localStorage sau khi mount (khong goi setState dong bo trong effect).
    const t = setTimeout(() => setApiKey(locApiKey()), 0);
    return () => clearTimeout(t);
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
    if (!apiKey) return;
    const t = setTimeout(() => taiLienHe(apiKey), 0);
    return () => clearTimeout(t);
  }, [apiKey, taiLienHe]);

  const taiNguoiDung = useCallback(async (key) => {
    if (!key) return;
    setDangTaiNguoiDung(true);
    try {
      const res = await fetch("/api/danh-sach-nguoi-dung", { headers: { "x-api-key": key } });
      const d = await res.json();
      if (res.ok) setDsNguoiDung(d.nguoiDung || []);
    } finally {
      setDangTaiNguoiDung(false);
    }
  }, []);

  async function datAdmin(id, laAdmin) {
    await fetch("/api/dat-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ id, laAdmin }),
    });
    taiNguoiDung(apiKey);
  }

  useEffect(() => {
    if (!apiKey) return;
    const t = setTimeout(() => taiNguoiDung(apiKey), 0);
    return () => clearTimeout(t);
  }, [apiKey, taiNguoiDung]);

  const taiTrangThaiZalo = useCallback(async (key) => {
    if (!key) return;
    try {
      const res = await fetch("/api/zalo-config", { headers: { "x-api-key": key } });
      const d = await res.json();
      if (res.ok) {
        setZaloTrangThai(d);
        if (d.appId) setZaloAppId(d.appId);
      }
    } catch {
      /* bo qua */
    }
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    const t = setTimeout(() => taiTrangThaiZalo(apiKey), 0);
    return () => clearTimeout(t);
  }, [apiKey, taiTrangThaiZalo]);

  async function ketNoiZalo(e) {
    e.preventDefault();
    if (!zaloAppId.trim() || !zaloSecretKey.trim()) {
      setZaloThongBao("Lỗi: cần nhập đủ App ID và Secret Key.");
      return;
    }
    setDangXuLyZalo(true);
    setZaloThongBao("");
    try {
      const res = await fetch("/api/zalo-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ appId: zaloAppId.trim(), secretKey: zaloSecretKey.trim(), baseUrl: window.location.origin }),
      });
      const d = await res.json();
      if (res.ok && d.linkKetNoi) {
        window.open(d.linkKetNoi, "_blank");
        setZaloThongBao("Đã mở tab mới để cấp quyền trên Zalo — cấp quyền xong quay lại đây bấm 'Tải lại trạng thái'.");
      } else {
        setZaloThongBao("Lỗi: " + (d.loi || "không rõ"));
      }
    } catch (e) {
      setZaloThongBao("Lỗi: " + String(e?.message || e));
    } finally {
      setDangXuLyZalo(false);
    }
  }

  async function guiThuZalo() {
    setDangXuLyZalo(true);
    setZaloThongBao("");
    try {
      const res = await fetch("/api/zalo-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ hanhDong: "guiThu" }),
      });
      const d = await res.json();
      setZaloThongBao(d.gui ? "Đã gửi tin nhắn test — kiểm tra Zalo xem đã nhận chưa." : "Lỗi: " + (d.ly_do || "không rõ"));
    } catch (e) {
      setZaloThongBao("Lỗi: " + String(e?.message || e));
    } finally {
      setDangXuLyZalo(false);
    }
  }

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

      {/* DANH SACH SDT DA DANG KY (thu thap de tu van) */}
      {apiKey && (
        <div className="rounded-lg border p-5 mb-8" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide" style={{ color: "#8B8B99" }}>
              Số điện thoại đã đăng ký ({dsNguoiDung.length})
            </p>
            <button onClick={() => taiNguoiDung(apiKey)} className="text-xs" style={{ color: "#6C5CE7" }}>
              {dangTaiNguoiDung ? "Đang tải..." : "Tải lại"}
            </button>
          </div>
          {dsNguoiDung.length === 0 && !dangTaiNguoiDung && (
            <p className="text-xs py-2" style={{ color: "#8B8B99" }}>
              Chưa có ai đăng ký.
            </p>
          )}
          {dsNguoiDung.map((nd) => (
            <div key={nd.id} className="flex items-center justify-between py-2 border-b text-sm gap-2" style={{ borderColor: "#1D1D26" }}>
              <span>
                <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{nd.sdt}</strong>
                {nd.ten && <span style={{ color: "#8B8B99" }}> — {nd.ten}</span>}
                {nd.la_admin && (
                  <span
                    className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded"
                    style={{ background: "#22C55E", color: "#0B0B10" }}
                  >
                    ADMIN
                  </span>
                )}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs" style={{ color: "#8B8B99" }}>
                  {new Date(nd.tao_luc).toLocaleString("vi-VN")}
                </span>
                <button onClick={() => datAdmin(nd.id, !nd.la_admin)} className="text-xs" style={{ color: nd.la_admin ? "#EF4444" : "#6C5CE7" }}>
                  {nd.la_admin ? "Bỏ Admin" : "Đặt Admin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BAO TIN HIEU MUA QUA ZALO OA */}
      {apiKey && (
        <div className="rounded-lg border p-5 mb-8" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B99" }}>
            Báo tín hiệu MUA qua Zalo
          </p>

          {zaloTrangThai && (
            <div className="flex flex-wrap gap-3 mb-3 text-xs">
              <span style={{ color: zaloTrangThai.daCoAppId ? "#22C55E" : "#8B8B99" }}>
                {zaloTrangThai.daCoAppId ? "✓" : "○"} Đã nhập App ID
              </span>
              <span style={{ color: zaloTrangThai.daKetNoi ? "#22C55E" : "#8B8B99" }}>
                {zaloTrangThai.daKetNoi ? "✓" : "○"} Đã cấp quyền OAuth
              </span>
              <span style={{ color: zaloTrangThai.daCoNguoiNhan ? "#22C55E" : "#8B8B99" }}>
                {zaloTrangThai.daCoNguoiNhan ? "✓" : "○"} Đã xác định người nhận
              </span>
            </div>
          )}

          <form onSubmit={ketNoiZalo} className="grid sm:grid-cols-2 gap-2 mb-3">
            <input
              value={zaloAppId}
              onChange={(e) => setZaloAppId(e.target.value)}
              placeholder="App ID (từ developers.zalo.me)"
              className="px-2 py-1.5 text-sm outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            />
            <input
              value={zaloSecretKey}
              onChange={(e) => setZaloSecretKey(e.target.value)}
              placeholder="Secret Key"
              type="password"
              className="px-2 py-1.5 text-sm outline-none"
              style={{ background: "#0B0B10", border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            />
            <button
              type="submit"
              disabled={dangXuLyZalo}
              className="px-3 py-1.5 text-sm font-medium"
              style={{ background: "#6C5CE7", color: "#FFFFFF", fontWeight: 600, opacity: dangXuLyZalo ? 0.6 : 1 }}
            >
              Lưu &amp; Kết nối Zalo
            </button>
            <button
              type="button"
              onClick={() => taiTrangThaiZalo(apiKey)}
              className="px-3 py-1.5 text-sm font-medium"
              style={{ border: `1px solid ${VIEN}`, color: "#F5F5F7" }}
            >
              Tải lại trạng thái
            </button>
          </form>

          <button
            type="button"
            onClick={guiThuZalo}
            disabled={dangXuLyZalo}
            className="px-3 py-1.5 text-sm font-medium"
            style={{ border: `1px solid #22C55E`, color: "#22C55E", opacity: dangXuLyZalo ? 0.6 : 1 }}
          >
            Gửi tin nhắn test
          </button>

          {zaloThongBao && (
            <p className="text-xs mt-3" style={{ color: zaloThongBao.startsWith("Lỗi") ? "#EF4444" : "#22C55E" }}>
              {zaloThongBao}
            </p>
          )}

          <p className="text-[11px] mt-3" style={{ color: "#8B8B99" }}>
            Hướng dẫn: (1) Tạo Official Account miễn phí tại oa.zalo.me. (2) Tạo App tại developers.zalo.me, lấy App ID +
            Secret Key, dán vào đây. (3) Bấm &quot;Lưu & Kết nối Zalo&quot; — 1 tab mới mở ra để cấp quyền, bấm &quot;Cho phép&quot;. (4) Mở
            app Zalo, tìm đúng OA vừa tạo, tự nhắn 1 tin bất kỳ (vd &quot;hi&quot;) cho nó. (5) Quay lại đây bấm &quot;Tải lại trạng
            thái&quot; rồi &quot;Gửi tin nhắn test&quot; để kiểm tra.
          </p>
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
