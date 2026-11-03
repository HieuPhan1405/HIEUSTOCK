import { nhanLyDoBan, nhanChoHoi, laChoPhienSau, nhanGiaiNgan, nhanBaoVeLai, nhanLoaiVao, nhanMuaMoi, nhanLenhWeb } from "@/components/dungChung";
import { coCanhBaoBanBot } from "@/lib/ghiChuTuDong";
import { canhBaoVaoLenh } from "@/lib/canhBaoVaoLenh";
import { nhanViTri120 } from "@/lib/nhanTinHieu";

// NHAN PHU CUA 1 DONG (bang Bo loc / So lenh / the dien thoai): truoc day xep chong toi 6-7 nhan co bieu tuong duoi o Tin hieu -> nay gop lai, chi hien NHAN QUAN TRONG NHAT
// + "+n" (re chuot / giu xem du). Thu tu uu tien: rui ro / can ban truoc -> viec can lam (cho hoi, cho phien sau) -> canh bao luc vao -> thong tin.
export function dsNhanPhu(row, { tp = null, canhBaoVao = false, lenhWeb = false } = {}) {
  const ds = [];
  const them = (n, nhan = n?.nhan) => n && ds.push({ nhan, mau: n.mau, moTa: n.moTa });
  them(nhanLyDoBan(row));
  if (coCanhBaoBanBot(row)) ds.push({ nhan: row.ban_bot ? "Bán bớt" : "Bán bớt · dưới Tenkan", mau: "var(--cam)", moTa: row.ban_bot ? "Điểm đã tụt dưới ngưỡng bán nhưng chưa đủ điều kiện BÁN hẳn — gợi ý giảm bớt vị thế." : "Giá đóng cửa đang dưới Tenkan (nhãn tham khảo, chưa phải tín hiệu BÁN)." });
  them(nhanChoHoi(row), "Chờ hồi");
  if (laChoPhienSau(row)) ds.push({ nhan: "Chờ phiên sau", mau: "var(--vang)", moTa: "Đã đạt điểm MUA nhưng phiên đầu chưa đủ khối lượng xác nhận. Phiên sau vẫn trên ngưỡng điểm thì sẽ MUA." });
  if (canhBaoVao) for (const c of canhBaoVaoLenh(row)) ds.push({ nhan: c.nhan, mau: "var(--cam)", moTa: c.moTa });
  if (tp) ds.push({ nhan: `Đã chạm ${tp}`, mau: "var(--vang)", moTa: "Giá đã từng chạm mốc chốt lời này trong lúc giữ lệnh." });
  if (lenhWeb) them(nhanLenhWeb(row));
  them(nhanGiaiNgan(row));
  them(nhanBaoVeLai(row));
  them(nhanLoaiVao(row));
  them(nhanMuaMoi(row));
  them(nhanViTri120(row));
  return ds;
}

// Hien nhan dau + "+n"; title liet ke du cac nhan kem giai thich.
export default function NhanPhuTinHieu({ ds, className = "" }) {
  if (!ds?.length) return null;
  const [dau, ...con] = ds;
  return (
    <span className={`text-[11px] font-semibold whitespace-nowrap ${className}`} style={{ color: dau.mau, fontFamily: "var(--font-chu)" }} title={ds.map((n) => (n.moTa ? `${n.nhan}: ${n.moTa}` : n.nhan)).join("\n")}>
      {dau.nhan}
      {con.length > 0 && <span style={{ color: "var(--mo)" }}> +{con.length}</span>}
    </span>
  );
}
