import { withDb } from "@/lib/db";
import { LoiNguoiDung } from "@/lib/loiAnToan";
import { PHONG_CACH, PHONG_CACH_MAC_DINH, NHAN, nhanTrangThai, dauVaoNhan } from "@/lib/phongCachDauTu";
import { vitriTuNhap } from "@/lib/danhGiaDanhMuc";
import { layBangCoBan } from "@/lib/phanTichCoBanDb";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";

// DANH MUC DA LUU THEO TAI KHOAN (trang /danh-gia-danh-muc): moi tai khoan nhieu danh muc (vd moi gioi luu danh muc tung khach), moi danh muc gom
// vi the + von / margin + phong cach dau tu + nhat ky giao dich + thong tin bao cao (ten khach, nguoi lap). Chi chu tai khoan doc / sua duoc.
// CANH BAO: sau moi lan upload tin hieu (lib/thongBaoDb.js thongBaoPhien) tinh lai nhan Giu / Theo doi / Giam / Thoat cua tung ma (tai khoan da duyet),
// ma CHUYEN XAU sang Giam / Thoat -> gui thong bao ve may cho chu danh muc (moi ma + nhan chi 1 lan / phien), ghi vao lich_su_nhan de hien tren trang.
const TOI_DA_DANH_MUC = 30;
const TOI_DA_DANH_MUC_ADMIN = 300;
const TOI_DA_LICH_SU = 40;
let daTao = null;

function taoBang(client) {
  daTao ??= client
    .query(
      `CREATE TABLE IF NOT EXISTS danh_muc_luu (
        id SERIAL PRIMARY KEY,
        nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
        ten TEXT NOT NULL,
        du_lieu JSONB NOT NULL,
        nhan_cuoi JSONB NOT NULL DEFAULT '{}'::jsonb,
        lich_su_nhan JSONB NOT NULL DEFAULT '[]'::jsonb,
        tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
        cap_nhat TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS danh_muc_luu_nguoi_dung ON danh_muc_luu (nguoi_dung_id);`
    )
    .catch((e) => {
      daTao = null;
      throw e;
    });
  return daTao;
}

const chuoi = (v, n) => (v == null ? "" : String(v).slice(0, n));
const soHoacNull = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

// Lam sach du lieu tu trinh duyet (khong tin du lieu gui len): gioi han so dong / do dai, chi giu cac truong biet truoc.
export function chuanHoaDuLieu(d) {
  d = d && typeof d === "object" ? d : {};
  const ds = (Array.isArray(d.ds) ? d.ds : [])
    .slice(0, 30)
    .map((x) => ({ ma: chuoi(x?.ma, 12).toUpperCase().replace(/[^A-Z0-9]/g, ""), kl: chuoi(x?.kl, 16).replace(/[^0-9.,]/g, ""), giaVon: chuoi(x?.giaVon, 16).replace(/[^0-9.,]/g, "") }))
    .filter((x) => x.ma || x.kl);
  const v = d.von && typeof d.von === "object" ? d.von : {};
  const von = Object.fromEntries(["tienMat", "no", "laiSuat", "canhBao", "giaiChap", "phi"].map((k) => [k, chuoi(v[k], 16).replace(/[^0-9.,]/g, "")]));
  const nhatKy = (Array.isArray(d.nhatKy) ? d.nhatKy : []).slice(-1000).map((g) => ({
    id: chuoi(g?.id, 40),
    ngay: /^\d{4}-\d{2}-\d{2}$/.test(g?.ngay ?? "") ? g.ngay : null,
    ma: chuoi(g?.ma, 12).toUpperCase().replace(/[^A-Z0-9]/g, ""),
    loai: g?.loai === "ban" ? "ban" : "mua",
    kl: soHoacNull(g?.kl),
    gia: soHoacNull(g?.gia),
    ghiChu: g?.ghiChu ? chuoi(g.ghiChu, 120) : undefined,
    giaVonTruoc: soHoacNull(g?.giaVonTruoc),
    laiChot: soHoacNull(g?.laiChot),
    laiChotPct: soHoacNull(g?.laiChotPct),
  }));
  const b = d.baoCao && typeof d.baoCao === "object" ? d.baoCao : {};
  const baoCao = { khach: chuoi(b.khach, 80), nguoiLap: chuoi(b.nguoiLap, 80), lienHe: chuoi(b.lienHe, 120), ghiChu: chuoi(b.ghiChu, 800) };
  return { ds, von, phongCach: PHONG_CACH[d.phongCach] ? d.phongCach : PHONG_CACH_MAC_DINH, nhatKy, baoCao };
}

export async function layDanhMucLuu(nguoiDungId) {
  return withDb(async (client) => {
    await taoBang(client);
    const { rows } = await client.query(`SELECT id, ten, du_lieu, lich_su_nhan, cap_nhat FROM danh_muc_luu WHERE nguoi_dung_id = $1 ORDER BY cap_nhat DESC`, [nguoiDungId]);
    return rows;
  });
}

export async function luuDanhMucLuu(nguoiDung, { id, ten, duLieu }) {
  const tenSach = chuoi(ten, 80).trim() || "Danh mục của tôi";
  const du = chuanHoaDuLieu(duLieu);
  const json = JSON.stringify(du);
  if (json.length > 300_000) throw new LoiNguoiDung("Danh mục quá lớn để lưu.");
  return withDb(async (client) => {
    await taoBang(client);
    if (id) {
      const { rows } = await client.query(`UPDATE danh_muc_luu SET ten = $1, du_lieu = $2::jsonb, cap_nhat = now() WHERE id = $3 AND nguoi_dung_id = $4 RETURNING id, cap_nhat`, [tenSach, json, Number(id), nguoiDung.id]);
      if (!rows[0]) throw new LoiNguoiDung("Không tìm thấy danh mục này trong tài khoản của bạn.");
      return rows[0];
    }
    const { rows: dem } = await client.query(`SELECT COUNT(*)::int AS n FROM danh_muc_luu WHERE nguoi_dung_id = $1`, [nguoiDung.id]);
    const toiDa = nguoiDung.la_admin ? TOI_DA_DANH_MUC_ADMIN : TOI_DA_DANH_MUC;
    if (dem[0].n >= toiDa) throw new LoiNguoiDung(`Mỗi tài khoản lưu tối đa ${toiDa} danh mục — xóa bớt danh mục cũ trước.`);
    const { rows } = await client.query(`INSERT INTO danh_muc_luu (nguoi_dung_id, ten, du_lieu) VALUES ($1, $2, $3::jsonb) RETURNING id, cap_nhat`, [nguoiDung.id, tenSach, json]);
    return rows[0];
  });
}

export async function xoaDanhMucLuu(nguoiDungId, id) {
  return withDb(async (client) => {
    await taoBang(client);
    const { rowCount } = await client.query(`DELETE FROM danh_muc_luu WHERE id = $1 AND nguoi_dung_id = $2`, [Number(id), nguoiDungId]);
    if (!rowCount) throw new LoiNguoiDung("Không tìm thấy danh mục này trong tài khoản của bạn.");
  });
}

// Tinh nhan tung ma cua 1 danh muc da luu tu du lieu server (dong tin hieu + BCTC + Tenkan tu bang chi bao). rc (rui ro ganh) khong co o day -> bo qua.
export function nhanDanhMucLuu(duLieu, { theoMa, cbMa, tkMa }) {
  const vitri = vitriTuNhap(duLieu?.ds ?? []);
  const gop = new Map();
  for (const v of vitri) {
    const c = gop.get(v.ma);
    if (!c) gop.set(v.ma, { ...v });
    else gop.set(v.ma, { ma: v.ma, kl: c.kl + v.kl, giaVon: c.giaVon != null && v.giaVon != null ? (c.kl * c.giaVon + v.kl * v.giaVon) / (c.kl + v.kl) : c.giaVon ?? v.giaVon });
  }
  const hang = [...gop.values()].map((v) => {
    const r = theoMa.get(v.ma);
    const gia = Number(r?.gia) > 0 ? Number(r.gia) : null;
    return { ...v, r, gia, giaTri: gia ? v.kl * gia * 1000 : null, laiLoPct: gia && v.giaVon > 0 ? (gia / v.giaVon - 1) * 100 : null };
  });
  const tong = hang.reduce((s, h) => s + (h.giaTri ?? 0), 0);
  const kq = {};
  for (const h of hang) {
    if (!h.r || !h.gia) continue;
    const tk = tkMa.get(h.ma);
    const cachTk = Number(tk?.cach_tenkan_pct);
    const tenkan = Number.isFinite(cachTk) ? h.gia / (1 + cachTk / 100) : null;
    const x = dauVaoNhan({ gia: h.gia, tyTrong: tong > 0 ? h.giaTri / tong : null, laiLoPct: h.laiLoPct }, { r: h.r, ls: { tenkan }, cb: cbMa.get(h.ma) ?? null, coTinHieu: true });
    kq[h.ma] = nhanTrangThai(x, duLieu?.phongCach);
  }
  return kq;
}

// Goi sau moi lan upload tin hieu. KHONG throw ra ngoai (loi thi tra { loi }).
export async function canhBaoDanhMucLuu({ tatCa = [], ngay = null, trongPhien = false, gui = true } = {}) {
  try {
    const ds = await withDb(async (client) => {
      await taoBang(client);
      const { rows } = await client.query(
        `SELECT dm.id, dm.nguoi_dung_id, dm.ten, dm.du_lieu, dm.nhan_cuoi, dm.lich_su_nhan, nd.thong_bao_pham_vi
         FROM danh_muc_luu dm JOIN nguoi_dung nd ON nd.id = dm.nguoi_dung_id WHERE nd.da_duyet = true OR nd.la_admin = true`
      );
      return rows;
    });
    if (!ds.length) return { soDanhMuc: 0 };
    const [cb, cbk] = await Promise.all([layBangCoBan().catch(() => null), layChiBaoKyThuat().catch(() => null)]);
    const ngu = { theoMa: new Map(tatCa.map((r) => [r.ma, r])), cbMa: new Map((cb?.hang ?? []).map((h) => [h.ma, h])), tkMa: new Map((cbk?.hang ?? []).map((h) => [h.ma, h])) };
    const capNhat = [];
    const canGui = [];
    const luc = new Date().toISOString();
    for (const dm of ds) {
      const nhan = nhanDanhMucLuu(dm.du_lieu, ngu);
      const nhanMoi = Object.fromEntries(Object.entries(nhan).map(([m, n]) => [m, n.nhan]));
      const cu = dm.nhan_cuoi ?? {};
      const lichSu = Array.isArray(dm.lich_su_nhan) ? [...dm.lich_su_nhan] : [];
      const xau = [];
      for (const [ma, n] of Object.entries(nhan)) {
        const truoc = cu[ma];
        if (!truoc || truoc === n.nhan) continue; // ma moi them: lay lam moc, khong bao
        if (lichSu.some((l) => l.ma === ma && l.nhan === n.nhan && l.ngay === ngay)) continue; // 1 lan / ma / nhan / phien
        const muc = { ma, tu: truoc, nhan: n.nhan, lyDo: n.lyDo[0] ?? "", ngay, luc };
        lichSu.unshift(muc);
        if (NHAN[n.nhan].muc > (NHAN[truoc]?.muc ?? 0) && NHAN[n.nhan].muc >= 2) xau.push(muc);
      }
      const doi = JSON.stringify(nhanMoi) !== JSON.stringify(cu);
      if (doi) capNhat.push({ id: dm.id, nhanMoi, lichSu: lichSu.slice(0, TOI_DA_LICH_SU) });
      if (xau.length && dm.thong_bao_pham_vi !== "khong") canGui.push({ dm, xau });
    }
    if (capNhat.length) {
      await withDb(async (client) => {
        for (const c of capNhat) await client.query(`UPDATE danh_muc_luu SET nhan_cuoi = $1::jsonb, lich_su_nhan = $2::jsonb WHERE id = $3`, [JSON.stringify(c.nhanMoi), JSON.stringify(c.lichSu), c.id]);
      });
    }
    let daGui = 0;
    if (gui && canGui.length) {
      const { guiDay } = await import("@/lib/thongBaoDb");
      for (const { dm, xau } of canGui) {
        const kq = await guiDay(
          [
            {
              khoa: `danh_muc:${dm.id}:${ngay}:${xau.map((x) => `${x.ma}-${x.nhan}`).join(",")}`,
              loai: "danh_muc",
              tieu_de: `Danh mục “${dm.ten}”: ${xau.length} mã cần xử lý`,
              noi_dung: xau.map((x) => `${x.ma} → ${NHAN[x.nhan].ten}${x.lyDo ? `: ${x.lyDo}` : ""}`).join("\n"),
              duong_dan: `/danh-gia-danh-muc?dm=${dm.id}`,
            },
          ],
          { trongPhien, chiNguoiDungId: dm.nguoi_dung_id }
        );
        daGui += kq.daGui ?? 0;
      }
    }
    return { soDanhMuc: ds.length, capNhat: capNhat.length, canhBao: canGui.reduce((s, x) => s + x.xau.length, 0), daGui };
  } catch (e) {
    return { loi: String(e?.message || e) };
  }
}
