// HUONG DAN DUNG CHECKLIST BAT DAY + DIEM MUA PHUC HOI (Hieu 2026-10-21) - tong hop tu cac nghien cuu (engine/dich-vu/nghienCuu*.mjs, moPhongChiaVonTheoCongCu.mjs). Server component, dung <details>.
// So lieu: tu 2022-05, mua mo cua phien sau, da tru phi 0,4%; chi la tham khao, ket qua phu thuoc che do thi truong va khong on dinh theo nam.
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const sans = { fontFamily: "'Inter', sans-serif" };

function Buoc({ so, tieuDe, children }) {
  return (
    <li className="mb-4">
      <p className="text-sm mb-1" style={{ ...sans, fontWeight: 700, color: TEXT }}>
        <span className="inline-block w-5 h-5 mr-2 text-center text-[11px] leading-5 rounded-full" style={{ background: XANH, color: "#fff" }}>{so}</span>
        {tieuDe}
      </p>
      <div className="text-xs leading-relaxed pl-7" style={{ color: MUTED }}>{children}</div>
    </li>
  );
}

export default function HuongDanDungHieuQua({ moSan = true }) {
  return (
    <details open={moSan} className="rounded-2xl border mb-8" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <summary className="cursor-pointer select-none px-4 py-3 text-sm" style={{ ...sans, fontWeight: 700, color: TEXT }}>
        Cách dùng hiệu quả: checklist bắt đáy + điểm mua phục hồi
      </summary>
      <div className="px-4 pb-4">
        <p className="text-xs mb-3" style={{ color: MUTED }}>
          <b>Checklist là cảnh báo sớm (đang bán tháo), điểm B là xác nhận đã quay đầu để vào lệnh.</b> Kết quả dưới đây tính từ 2022.5, mua mở cửa phiên sau, đã trừ phí 0,4% — chỉ để tham khảo, không ổn định theo từng năm.
        </p>
        <ol className="list-none p-0 m-0">
          <Buoc so="1" tieuDe="Kiểm tra thị trường trước">
            &quot;Thị trường yếu&quot; = VN-Index thấp hơn đỉnh 60 phiên từ 7%. Yếu: checklist cho lãi 10 phiên khoảng +1,2% (thắng 53%). Bình thường: khoảng −2,5% (thắng 39%) → <b>bỏ checklist, chỉ dùng điểm B có KL đáy hoặc hồi sau giảm dài</b>. Cột &quot;Thị trường&quot; trong bảng cho biết lúc điểm B xuất hiện thị trường yếu hay không.
          </Buoc>
          <Buoc so="2" tieuDe="Dùng checklist lập danh sách theo dõi, chưa vào lệnh">
            Ưu tiên mã có <b>KL đáy ≥ 2×</b> (bán tháo có khối lượng): sự kiện checklist có KL đáy ≥ 2× lãi khoảng +2,8% sau 10 phiên, không có thì khoảng −1,1%. Khi cả chục mã cùng báo trong 1 phiên thì đừng mua hết: khoảng 3/7 đợt như vậy thị trường vẫn rơi tiếp. Chờ điểm B.
          </Buoc>
          <Buoc so="3" tieuDe="Chỉ vào lệnh khi có điểm B">
            Điểm B = giá đóng cửa lấy lại cả Tenkan và Kijun, đáy cách ≥ 3 phiên. <b>Giảm 20–30% + KL đáy ≥ 2×</b> là nhóm đáng tin nhất (từ 2022.5 khoảng +4,2% sau 10 phiên, thắng 67%). <b>Bỏ nhóm giảm 15–20%</b> (lãi âm ở mọi cách đo). <b>Bỏ mã vừa có điểm mua thường của hệ thống trong 40–60 phiên</b> (−0,7% so với +1,3% sau 20 phiên). Vào gần giá B, không đuổi khi giá đã cách B hơn ~5%.
          </Buoc>
          <Buoc so="4" tieuDe="Quản lý lệnh">
            Cắt lỗ theo mốc SL của điểm B hoặc −7%; trade tối đa ~10 phiên, chốt +10% (kỳ vọng nhỏ, khoảng +0,6 đến +1%/lệnh). <b>Không lướt 2–3 phiên</b>: lãi sau 2 phiên khoảng −0,3% và ~25% lệnh chạm −5% trong 2 phiên đầu khi chưa bán được (T+2,5). Mã đã giảm nhiều tháng: dùng mục &quot;Hồi sau giảm dài&quot;, thoát khi đóng cửa dưới MA50.
          </Buoc>
          <Buoc so="5" tieuDe="Chia vốn">
            Đừng chia đều cho mọi công cụ: mô phỏng chia vốn 50/50 giữa nhóm sớm và hệ thống MUA lỗ lớn. Dồn phần lớn cho <b>điểm B + KL đáy</b> và <b>hồi sau giảm dài</b>, phần nhỏ cho checklist (chỉ khi thị trường yếu), mỗi lệnh nhỏ (vốn/10 trở xuống).
          </Buoc>
        </ol>
        <p className="text-[11px]" style={{ color: MUTED }}>
          Giới hạn: dữ liệu kiểm tra chưa gồm cổ phiếu đã hủy niêm yết; lợi thế chỉ khoảng +0,5 đến +4%/lệnh và phụ thuộc chế độ thị trường (KL đáy không giúp ở 2024 và 2026). Đây là công cụ tham khảo, không phải khuyến nghị đầu tư.
        </p>
      </div>
    </details>
  );
}
