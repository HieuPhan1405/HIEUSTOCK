// Trang quan tri la client component nen khong export duoc metadata - dat o layout cua nhanh nay.
// Khong cho cong cu tim kiem lap chi muc.
export const metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

export default function QuanTriLayout({ children }) {
  return children;
}
