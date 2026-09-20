import { Mail, Phone, MessageCircle, Music2, Link2, Landmark } from "lucide-react";
import { layThongTinLienHe } from "@/lib/thongTinLienHe";
import FormGuiTinNhan from "@/components/FormGuiTinNhan";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Liên hệ",
  description: "Thông tin liên hệ và gửi tin nhắn tới CloudStock.",
};

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";

function DongKenh({ Icon, nhan, giaTri, laLink }) {
  if (!giaTri) return null;
  return (
    <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: "#1D1D26" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#1D1D26" }}>
        <Icon size={16} color={PRIMARY} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>
          {nhan}
        </p>
        {laLink ? (
          <a
            href={giaTri.startsWith("http") ? giaTri : `https://${giaTri}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline break-all"
            style={{ color: TEXT, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {giaTri}
          </a>
        ) : (
          <p className="text-sm break-all" style={{ color: TEXT, fontFamily: "'JetBrains Mono', monospace" }}>
            {giaTri}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function TrangLienHe() {
  let tt = null;
  try {
    tt = await layThongTinLienHe();
  } catch {
    tt = null;
  }

  const coThongTinKenh = tt && (tt.sdt || tt.zalo || tt.tiktok || tt.facebook || tt.so_tk);

  return (
    <div className="max-w-xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <div className="flex items-center gap-2 mb-1">
        <Mail size={20} color={PRIMARY} strokeWidth={2} aria-hidden="true" />
        <h1 className="text-2xl" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          Liên hệ
        </h1>
      </div>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Theo dõi các kênh bên dưới, hoặc gửi trực tiếp tin nhắn cho chúng tôi.
      </p>

      {coThongTinKenh ? (
        <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <DongKenh Icon={Phone} nhan="Số điện thoại" giaTri={tt.sdt} />
          <DongKenh Icon={MessageCircle} nhan="Nhóm Zalo" giaTri={tt.zalo} laLink />
          <DongKenh Icon={Music2} nhan="TikTok" giaTri={tt.tiktok} laLink />
          <DongKenh Icon={Link2} nhan="Facebook" giaTri={tt.facebook} laLink />
          {tt.so_tk && (
            <div className="flex items-center gap-3 pt-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#1D1D26" }}>
                <Landmark size={16} color={PRIMARY} strokeWidth={2} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>
                  Ủng hộ qua ngân hàng
                </p>
                <p className="text-sm" style={{ color: TEXT, fontFamily: "'JetBrains Mono', monospace" }}>
                  {tt.ngan_hang ? `${tt.ngan_hang} — ` : ""}
                  {tt.so_tk}
                  {tt.chu_tk ? ` (${tt.chu_tk})` : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border p-6 mb-6 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
          Chưa có thông tin liên hệ — chủ trang cần nhập qua trang quản trị.
        </div>
      )}

      <FormGuiTinNhan />
    </div>
  );
}
