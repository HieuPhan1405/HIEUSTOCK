# PHAI SINH VN30F1M - ket qua kieu PHA VO KHOANG MO CUA voi DUNG BIEU PHI MBS (xem phaisinh_chung.phi) va nhieu muc truot gia.
# Luat: dinh / day N phut dau; nen 1 phut dong cua vuot ra thi vao theo huong do (truoc 13:30); cat lo o bien doi dien; dong 14:29. 1 lenh / ngay cho moi N.
# Chay: python engine/dich-vu/phaisinh_mbs.py
import numpy as np, pandas as pd
from phaisinh_chung import nap, phi, MOC, PHI_CO_DINH
X = nap(); ngay, O, H, L, C = X["ngay"], X["O"], X["H"], X["L"], X["C"]
N = len(ngay); nD = sum(1 for x in ngay if x < MOC); nV = N - nD
def orb(Nm):
    gd = []
    for a in range(N):
        o, h, l, c = O[a], H[a], L[a], C[a]; hi, lo = h[:Nm].max(), l[:Nm].min()
        for k in range(Nm, 180):
            p = 1 if c[k] > hi else -1 if c[k] < lo else 0
            if not p: continue
            st = lo if p > 0 else hi; ra = c[240]
            for j in range(k + 1, 241):
                if p > 0 and l[j] <= st: ra = min(o[j], st); break
                if p < 0 and h[j] >= st: ra = max(o[j], st); break
            gd.append((ngay[a], p, c[k], ra)); break
    return pd.DataFrame(gd, columns=["ngay", "phia", "vao", "ra"])
GD = {n: orb(n) for n in (5, 15, 30)}
def lai(t, truot):  # % gia tri hop dong va diem, sau phi MBS + truot gia
    d = t.phia * (t.ra - t.vao) - phi(t.vao, truot); return d, d / t.vao * 100
G = 1867.5
print(f"BIEU PHI MBS cho 1 vong, 1 hop dong o muc {G}: phi + thue = {PHI_CO_DINH + 0.00017*G:.3f} diem = {(PHI_CO_DINH + 0.00017*G)*100000:,.0f} dong (trong do thue {0.00017*G*100000:,.0f} dong); o muc 900: {PHI_CO_DINH + 0.00017*900:.3f} diem")
print(f"So ngay: {N} | den 06/2022: {nD} | tu 07/2022: {nV}\n")
print("=== 1. KET QUA THEO MUC TRUOT GIA (% gia tri hop dong / nam, sau phi MBS) ===")
print(f"   {'truot gia ca vong':28s} | {'ORB 15: den 06/2022':>20s} | {'tu 07/2022':>12s} | {'3 khoang: den 06/2022':>22s} | {'tu 07/2022':>12s} | sut toi da (3 khoang, ca ky)")
for tr in (0.0, 0.2, 0.4, 0.6, 0.8, 1.2, 1.6):
    _, p15 = lai(GD[15], tr); t15 = GD[15].assign(pct=p15)
    kh = pd.concat([GD[n].assign(pct=lai(GD[n], tr)[1] / 3) for n in (5, 15, 30)]); nd = kh.groupby("ngay").pct.sum(); e = nd.cumsum()
    print(f"   {tr:.1f} diem ({tr/0.1/2:.0f} buoc gia moi chieu){'':3s} | {t15[t15.ngay < MOC].pct.sum()/(nD/250):19.1f}% | {t15[t15.ngay >= MOC].pct.sum()/(nV/250):11.1f}% | {nd[nd.index < MOC].sum()/(nD/250):21.1f}% | {nd[nd.index >= MOC].sum()/(nV/250):11.1f}% | {(e-e.cummax()).min():.1f}%")
print("\n=== 2. THEO TUNG NAM, truot gia 0,4 diem (% gia tri hop dong) ===")
for ten, t in (("ORB 15 phut", GD[15].assign(pct=lai(GD[15], 0.4)[1])), ("Ket hop 5 + 15 + 30", pd.concat([GD[n].assign(pct=lai(GD[n], 0.4)[1] / 3) for n in (5, 15, 30)]))):
    print(f"   {ten:20s}: " + "  ".join(f"{y}: {g.pct.sum():5.1f}%" for y, g in t.groupby(t.ngay.str[:4])))
print("\n=== 3. QUY RA TIEN cho 1 HOP DONG, kieu ORB 15 phut, giai doan tu 07/2022 (truot gia 0,4 diem) ===")
d, p = lai(GD[15], 0.4); t = GD[15].assign(diem=d, pct=p); v = t[t.ngay >= MOC]
tho = (v.phia * (v.ra - v.vao)); so_nam = nV / 250
print(f"   so lenh / nam: {len(v)/so_nam:.0f} | lai TRUOC phi TB {tho.mean():.2f} diem / lenh | phi + thue TB {(PHI_CO_DINH + 0.00017*v.vao).mean():.2f} diem | truot gia 0,40 | con lai {v.diem.mean():.2f} diem / lenh")
print(f"   tong diem / nam: {v.diem.sum()/so_nam:.0f} diem = {v.diem.sum()/so_nam*100000/1e6:.1f} trieu dong / hop dong / nam | tong phi + thue da tra: {(PHI_CO_DINH + 0.00017*v.vao).sum()/so_nam*100000/1e6:.1f} trieu / nam")
e = v.groupby("ngay").diem.sum().cumsum(); print(f"   sut giam lon nhat: {(e-e.cummax()).min():.0f} diem = {(e-e.cummax()).min()*100000/1e6:.1f} trieu dong | lenh thua TB {v.diem[v.diem<=0].mean():.1f} diem, lenh thang TB {v.diem[v.diem>0].mean():.1f} diem | ty le thang {(v.diem>0).mean()*100:.0f}%")
print(f"   phi quan ly tai san ky quy (toi thieu 100.000d / thang / tai khoan): 1,2 trieu / nam, chua tru o tren")
hv = tho.mean() - (PHI_CO_DINH + 0.00017 * v.vao).mean()
print(f"   DIEM HOA VON: truot gia toi da chiu duoc = {hv:.2f} diem ca vong ({hv/2:.2f} diem moi chieu) truoc khi het lai (giai doan tu 07/2022); giai doan den 06/2022: {((GD[15][GD[15].ngay < MOC].phia * (GD[15][GD[15].ngay < MOC].ra - GD[15][GD[15].ngay < MOC].vao)).mean() - (PHI_CO_DINH + 0.00017 * GD[15][GD[15].ngay < MOC].vao).mean()):.2f} diem")
