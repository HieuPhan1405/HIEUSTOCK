# PHAI SINH VN30F1M - so sanh ket qua 2 kieu pha vo chinh duoi CAC BIEU PHI KHAC NHAU (2026-10-14).
#   A. Trang chinh thuc MBS (mbs.com.vn/bieu-phi-giao-dich-chung-khoan-phai-sinh, doc 14/10/2026): 3.000d MBS + 2.700d So + 2.550d bu tru moi luot; thue = gia x 100.000 x 17% x 0,1% / 2
#   B. Bang Hieu gui 14/10/2026 (chua ro nguon): 10.000d / luot trong ngay; thue 0,01% gia tri hop dong / luot (khong ghi phi tra So)
#   C. Nhu B + 2.700d phi tra So moi luot (truong hop 10.000d chua gom phi So)
# Truot gia 0,4 diem / vong cho ca 3. Danh trong ngay nen khong co phi qua dem (16.000d) va phi quan ly vi the (2.550d / ngay).
# Chay: python engine/dich-vu/phaisinh_phi2.py
import numpy as np, pandas as pd
from phaisinh_chung import nap, chay_lenh, MOC
X = nap(); ngay, O, H, L, C, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["sauDao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); nam = np.array([x[:4] for x in ngay]); bd = H.max(axis=1) - L.min(axis=1); pBD = np.r_[np.nan, bd[:-1]]
def orb(Nm):
    gd = []
    for a in range(N):
        hi, lo = H[a, :Nm].max(), L[a, :Nm].min()
        for k in range(Nm, 180):
            p = 1 if C[a, k] > hi else -1 if C[a, k] < lo else 0
            if p: j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, C[a, k], cat=lo if p > 0 else hi); gd.append((a, p, C[a, k], ra)); break
    return gd
def vb(k_):
    gd = []
    for a in range(1, N):
        if sauDao[a] or np.isnan(pBD[a]): continue
        o0 = O[a, 0]; tr, du = o0 + k_ * pBD[a], o0 - k_ * pBD[a]
        for k in range(1, 180):
            p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
            if p: gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du); j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, gia, cat=o0); gd.append((a, p, gia, ra)); break
    return gd
GD = {"Khoang mo cua 15 phut": orb(15), "Bien dong 0,3": vb(0.3), "ORB5": orb(5), "ORB30": orb(30), "BD05": vb(0.5)}
BIEU = {"A. Trang chinh thuc MBS (3.000 + 2.700 + 2.550d, thue 0,0085%)": (8250, 0.000085), "B. Bang anh gui (10.000d, thue 0,01%)": (10000, 0.0001), "C. Bang anh gui + 2.700d phi So": (12700, 0.0001)}
def phi(gia, cd, thue, truot=0.4): return 2 * cd / 100000 + 2 * thue * gia + truot
def lai(gd, cd, thue, truot=0.4):
    x = np.zeros(N); d = []
    for a, p, v, r in gd: z = p * (r - v) - phi(v, cd, thue, truot); x[a] += z / v * 100; d.append((a, z))
    return x, d
G = 1867.5
print(f"Chi phi 1 vong mua - ban, 1 hop dong, o muc {G} diem (chua tinh truot gia):")
for ten, (cd, th) in BIEU.items(): print(f"   {ten:66s}: {(2*cd + 2*th*G*100000):8,.0f} dong = {2*cd/100000 + 2*th*G:.3f} diem")
for kieu in ("Bien dong 0,3", "Khoang mo cua 15 phut"):
    print(f"\n=== {kieu.upper()} (truot gia 0,4 diem / vong) ===")
    for ten, (cd, th) in BIEU.items():
        x, d = lai(GD[kieu], cd, th); e = np.cumsum(x); dv = [z for a, z in d if not dK[a]]; soNam = (~dK).sum() / 250
        tho = np.mean([p * (r - v) for a, p, v, r in GD[kieu] if not dK[a]]); ph = np.mean([phi(v, cd, th, 0) for a, p, v, r in GD[kieu] if not dK[a]])
        print(f"   {ten[:34]:34s} | den 06/2022 {x[dK].sum()/(dK.sum()/250):5.1f}%/nam | tu 07/2022 {x[~dK].sum()/soNam:5.1f}%/nam | sut {(e-np.maximum.accumulate(e)).min():5.1f}% | nam lo {sum(1 for y in sorted(set(nam)) if x[nam==y].sum() < 0)}/9 | 1 HD tu 07/2022: {np.sum(dv)/soNam*100000/1e6:5.1f} trieu/nam (con {np.mean(dv):.2f} diem/lenh, phi+thue {ph:.2f}) | hoa von khi truot gia {tho - ph:.2f} diem")
print("\n=== GHEP 5 KIEU PHA VO (khoang 5, 15, 30 phut + bien dong 0,3 va 0,5), truot gia 0,4 ===")
for ten, (cd, th) in BIEU.items():
    x = np.mean([lai(GD[k], cd, th)[0] for k in GD], axis=0); e = np.cumsum(x)
    print(f"   {ten[:34]:34s} | den 06/2022 {x[dK].sum()/(dK.sum()/250):5.1f}%/nam (Sharpe {x[dK].mean()/x[dK].std()*np.sqrt(250):.2f}) | tu 07/2022 {x[~dK].sum()/((~dK).sum()/250):5.1f}%/nam (Sharpe {x[~dK].mean()/x[~dK].std()*np.sqrt(250):.2f}) | sut {(e-np.maximum.accumulate(e)).min():5.1f}% | theo nam: " + " ".join(f"{y[2:]}:{x[nam==y].sum():.0f}" for y in sorted(set(nam))))
print("\n=== Bieu C (nang nhat) voi cac muc truot gia - bien dong 0,3, tu 07/2022 ===")
for tr in (0.2, 0.4, 0.6, 0.8, 1.2):
    x, d = lai(GD["Bien dong 0,3"], 12700, 0.0001, tr); print(f"   truot gia {tr} diem: {x[~dK].sum()/((~dK).sum()/250):5.1f}%/nam")
