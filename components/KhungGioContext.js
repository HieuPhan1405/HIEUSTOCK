"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dangTrongKhungVaoLenh } from "@/lib/khungGioVaoLenh";

// Mac dinh true (= "sang", khong mo) khi chua co Provider bao ngoai hoac truoc khi effect chay
// lan dau (SSR) - an toan hon la mac dinh mo, tranh 1 nhip lam tin hieu MUA trong tay coi nhu
// "het hieu luc" ngay luc trang vua tai.
const KhungGioContext = createContext(true);

// Bao 1 lan duy nhat cho ca trang (dat o layout.js) - moi SignalPill doc lai qua Context thay vi
// tu chay interval rieng, tranh hang tram dong ho chay song song khi bang co nhieu dong.
export function KhungGioProvider({ children }) {
  const [trongKhung, setTrongKhung] = useState(true);

  useEffect(() => {
    const capNhat = () => setTrongKhung(dangTrongKhungVaoLenh());
    capNhat();
    const t = setInterval(capNhat, 15000);
    return () => clearInterval(t);
  }, []);

  return <KhungGioContext.Provider value={trongKhung}>{children}</KhungGioContext.Provider>;
}

export function useTrongKhungVaoLenh() {
  return useContext(KhungGioContext);
}
