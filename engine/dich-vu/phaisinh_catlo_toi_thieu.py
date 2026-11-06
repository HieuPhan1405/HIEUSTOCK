# PHAI SINH VN30F1M - CAT LO TOI THIEU cho cach pha vo bien dong 0,3 (06/11/2026).
# Co so: cat lo o gia mo cua (khoang cach vao -> mo cua = 0,3 x bien do hom truoc, nhieu ngay chi 3-4 diem -> bi quet). Thu: cat lo = min(mo cua, vao - F) (mua) / max(mo cua, vao + F) (ban khong).
# Cach ra con lai giong web: lai 7 diem -> doi cat lo len gia vao + 2, dong 14:29. Diem = sau phi MBS + truot 0,4 / vong. Chay: python engine/dich-vu/phaisinh_catlo_toi_thieu.py
import numpy as np, pandas as pd
from phaisinh_chung import nap, phi, MOC
X = nap(); ngay, O, H, L, C, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["sauDao"]
N = len(ngay); bd = H.max(axis=1) - L.min(axis=1); pBD = np.r_[np.nan, bd[:-1]]

def ra(a, p, k, gia, F):
    o0 = O[a, 0]; stop = min(o0, gia - F) if p > 0 else max(o0, gia + F); khoa = False; dinh = 0
    for j in range(k + 1, 241):
        o, h, l = O[a, j], H[a, j], L[a, j]
        if p > 0:
            if l <= stop: return min(o, stop)
            dinh = max(dinh, h - gia)
        else:
            if h >= stop: return max(o, stop)
            dinh = max(dinh, gia - l)
        if not khoa and dinh >= 7: khoa = True; stop = gia + p * 2
    return C[a, 240]

def chay(F):
    gd = []
    for a in range(1, N):
        if sauDao[a] or np.isnan(pBD[a]): continue
        d = 0.3 * pBD[a]; o0 = O[a, 0]; tr, du = o0 + d, o0 - d
        for k in range(1, 180):
            p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
            if not p: continue
            gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du)
            gd.append((ngay[a], p * (ra(a, p, k, gia, F) - gia) - phi(gia))); break
    return pd.DataFrame(gd, columns=["ngay", "diem"])

print("du lieu", ngay[0], "->", ngay[-1], N, "phien")
for F in (0, 5, 6, 7, 8, 9, 10):
    t = chay(F); e = t.groupby("ngay").diem.sum().cumsum()
    nam = " ".join(f"{y[2:]}:{g.diem.sum():5.0f}" for y, g in t.groupby(t.ngay.str[:4]))
    print(f"cat lo = min(mo cua, vao-{F:2d}) n={len(t)} thang {100*(t.diem>0).mean():3.0f}% tong {t.diem.sum():6.0f} (<2022.7 {t[t.ngay<MOC].diem.sum():5.0f} | >= {t[t.ngay>=MOC].diem.sum():5.0f}) sut {(e-e.cummax()).min():5.0f} | {nam}")
