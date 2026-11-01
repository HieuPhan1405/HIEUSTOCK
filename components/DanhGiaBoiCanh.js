"use client";

import { ExternalLink } from "lucide-react";
import { Khoi, The, Thanh, TEXT, MUTED, XANH, DO, VANG, sans, dau } from "@/components/DanhGiaChung";
import { fmt } from "@/components/dungChung";

const GOC = { Leading: "Dẫn dắt", Improving: "Cải thiện", Weakening: "Yếu dần", Lagging: "Tụt hậu" };
const ngayGio = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");

// Trang thai VN-Index theo cac duong (cung cach doc nhu tung ma)
export function trangThaiVni(v) {
  if (!v?.gia) return null;
  if (v.gg_bot > 0 && v.gia < v.gg_bot) return { muc: 0, ten: "Dưới đường cân bằng dài hạn", noiDung: "Thị trường yếu — ưu tiên phòng thủ: giữ tỷ trọng cổ phiếu thấp, không dùng margin, cắt lỗ kỷ luật." };
  if (v.kijun > 0 && v.gia < v.kijun) return { muc: 1, ten: "Dưới Kijun, trên cân bằng dài hạn", noiDung: "Điều chỉnh trong xu hướng dài hạn còn tốt — hạn chế mua đuổi, chờ VN-Index lấy lại Kijun." };
  return { muc: 2, ten: "Trên Kijun và đường cân bằng dài hạn", noiDung: "Xu hướng thị trường đang ủng hộ — các mã khỏe dễ đi lên hơn." };
}

export default function DanhGiaBoiCanh({ boiCanh, kq, gocNganh = {} }) {
  if (!boiCanh) return <p className="text-sm mb-6" style={{ color: MUTED }}>Đang tải bối cảnh thị trường…</p>;
  const v = boiCanh.vni;
  const tt = trangThaiVni(v);
  const nganh = (kq?.pb?.nganh ?? []).filter((g) => g.ten !== "Khác");
  const theoGoc = (ds) => nganh.filter((g) => ds.includes(gocNganh[g.ten])).reduce((s, g) => s + g.tyTrong, 0);
  const song = theoGoc(["Leading", "Improving"]);
  const yeu = theoGoc(["Weakening", "Lagging"]);
  const Tin = ({ t }) => (
    <li className="text-sm" style={sans}>
      <a href={t.link} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex gap-1 items-start">
        <span>{t.tieuDe}</span>
        <ExternalLink size={12} className="mt-1 shrink-0" style={{ color: MUTED }} />
      </a>
      <div className="text-[11px]" style={{ color: MUTED }}>
        {ngayGio(t.ngayISO)} · CafeF{t.ma?.length ? ` · ${t.ma.join(", ")}` : ""}
      </div>
    </li>
  );
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <The nhan="VN-Index" phu={`20 phiên ${dau(v?.lai20)}`}>{v?.gia != null ? fmt(v.gia) : "—"}</The>
        <The nhan="Xu hướng thị trường" mau={tt ? [DO, VANG, XANH][tt.muc] : TEXT} phu={tt?.ten}>{tt ? ["Yếu", "Điều chỉnh", "Tốt"][tt.muc] : "—"}</The>
        <The nhan="Danh mục ở ngành đang có sóng" phu="Góc Dẫn dắt / Cải thiện trên RRG ngành">{nganh.length ? `${Math.round(song * 100)}%` : "—"}</The>
        <The nhan="Ở ngành yếu dần / tụt hậu" mau={yeu > 0.5 ? VANG : TEXT}>{nganh.length ? `${Math.round(yeu * 100)}%` : "—"}</The>
      </div>
      {tt && <p className="text-sm mb-6" style={sans}><b>Thị trường: </b>{tt.noiDung}</p>}

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Khoi tieuDe="Ngành trong danh mục" className="" phu="Tỷ trọng theo ngành và vị trí của ngành trên RRG (sức mạnh tương đối so với VN-Index).">
          {nganh.length ? (
            nganh.map((g) => <Thanh key={g.ten} ten={`${g.ten}${gocNganh[g.ten] ? ` · ${GOC[gocNganh[g.ten]]}` : ""}`} v={g.tyTrong} />)
          ) : (
            <p className="text-sm" style={{ color: MUTED }}>Chưa xác định được ngành của các mã.</p>
          )}
        </Khoi>
        <Khoi tieuDe="Tin nhắc tới mã của bạn" className="" phu="Tin CafeF gần đây có nhắc mã hoặc tên công ty trong danh mục (lọc theo tiêu đề, có thể sót tin).">
          {boiCanh.tinMa?.length ? <ul className="grid gap-2.5">{boiCanh.tinMa.map((t) => <Tin key={t.link} t={t} />)}</ul> : <p className="text-sm" style={{ color: MUTED }}>Không có tin mới nào nhắc tới các mã trong danh mục.</p>}
        </Khoi>
      </div>
      <Khoi tieuDe="Tin vĩ mô mới nhất" phu="Bối cảnh để đọc cùng danh mục — tự động từ CafeF, cập nhật mỗi 10 phút. Các thử nghiệm của web cho thấy bối cảnh vĩ mô / thị trường không tự tạo ra lợi thế mua bán, chỉ giúp điều chỉnh mức rủi ro.">
        <div className="grid gap-4 lg:grid-cols-2">
          <ul className="grid gap-2.5 content-start">{(boiCanh.viMo ?? []).map((t) => <Tin key={t.link} t={t} />)}</ul>
          <ul className="grid gap-2.5 content-start">{(boiCanh.quocTe ?? []).map((t) => <Tin key={t.link} t={t} />)}</ul>
        </div>
      </Khoi>
    </>
  );
}

export { GOC };
