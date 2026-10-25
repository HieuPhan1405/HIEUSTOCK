// Moi lan chuyen trang, noi dung truot len nhe (CSS .cs-trang o app/globals.css). Template (khac layout) duoc dung lai tu dau o moi lan dieu huong nen hieu ung chay lai.
export default function Template({ children }) {
  return <div className="cs-trang">{children}</div>;
}
