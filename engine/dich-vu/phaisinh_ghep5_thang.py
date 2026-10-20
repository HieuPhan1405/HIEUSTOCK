# PHAI SINH VN30F1M - BACKTEST TUNG THANG cua he ghep 5 kieu pha vo (ORB 5/15/30 phut + pha vo bien dong k = 0,3 / 0,5), MOI KIEU 1 HOP DONG (toi da 5 HD cung luc), tu 01/2022 den du lieu moi nhat.
# Luat: xem phaisinh_tonghop.py (vb / orb). Phi MBS + truot 0,4 diem / vong (phaisinh_chung.phi). 1 diem = 100.000 dong / hop dong.
# In bang thang: so ngay giao dich, so lenh, % lenh thang, diem rong (sau phi), trieu dong, luy ke, sut tu dinh luy ke; kem diem rong tung kieu va luy ke theo nam. Ghi ra CSV neu truyen duong dan: python phaisinh_ghep5_thang.py <ra.csv>
import sys, numpy as np, pandas as pd
from phaisinh_chung import nap, phi, chay_lenh
X = nap(); ngay, O, H, L, C, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["sauDao"]
N = len(ngay); dH, dL = H.max(axis=1), L.min(axis=1); bd = dH - dL; pBD = np.r_[np.nan, bd[:-1]]
ok = lambda a: a >= 1 and not sauDao[a] and not np.isnan(pBD[a])
def vb(k_):
    gd = {}
    for a in range(N):
        if not ok(a): continue
        o0 = O[a, 0]; tr, du = o0 + k_ * pBD[a], o0 - k_ * pBD[a]
        for k in range(1, 180):
            p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
            if not p: continue
            gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du)
            j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, gia, cat=o0); gd[a] = (p, gia, ra); break
    return gd
def orb(Nm):
    gd = {}
    for a in range(N):
        hi, lo = H[a, :Nm].max(), L[a, :Nm].min()
        for k in range(Nm, 180):
            p = 1 if C[a, k] > hi else -1 if C[a, k] < lo else 0
            if p:
                j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, C[a, k], cat=lo if p > 0 else hi); gd[a] = (p, C[a, k], ra); break
    return gd
S = {"ORB5": orb(5), "ORB15": orb(15), "ORB30": orb(30), "BD0.3": vb(0.3), "BD0.5": vb(0.5)}
rows = []
for ten, gd in S.items():
    for a, (p, v, r) in gd.items():
        rows.append(dict(ngay=ngay[a], kieu=ten, p=p, vao=v, ra=r, net=p * (r - v) - phi(v), gross=p * (r - v)))
T = pd.DataFrame(rows); T["thang"] = T.ngay.str[:7]
ngay_df = pd.DataFrame({"ngay": ngay}); ngay_df["thang"] = ngay_df.ngay.str[:7]
thang = sorted(m for m in ngay_df.thang.unique() if m >= "2022-01")
out = []
for m in thang:
    t = T[T.thang == m]; nd = (ngay_df.thang == m).sum()
    out.append(dict(thang=m, ngay=nd, lenh=len(t), thang_pct=(t.net > 0).mean() * 100 if len(t) else np.nan, diem=t.net.sum(), gross=t.gross.sum(), **{k: t[t.kieu == k].net.sum() for k in S}))
D = pd.DataFrame(out)
D["trieu"] = D.diem * 0.1; D["luyke"] = D.trieu.cumsum(); D["sut"] = D.luyke - D.luyke.cummax()
print(f"Du lieu: {ngay[0]} -> {ngay[-1]} | 5 kieu, moi kieu 1 HD (toi da 5 HD) | 1 diem = 100.000 dong / HD | sau phi MBS + truot 0,4")
print(f"{'Thang':8s}{'Ngay':>5s}{'Lenh':>6s}{'Thang%':>7s}{'Diem':>8s}{'Trieu':>8s}{'Luy ke':>9s}{'Sut':>8s} | " + "".join(f"{k:>7s}" for k in S))
for _, r in D.iterrows():
    flag = "  (thieu du lieu?)" if r.ngay < 15 else ""
    print(f"{r.thang:8s}{int(r.ngay):5d}{int(r.lenh):6d}{r.thang_pct:7.0f}{r.diem:8.0f}{r.trieu:8.1f}{r.luyke:9.1f}{r.sut:8.1f} | " + "".join(f"{r[k]:7.0f}" for k in S) + flag)
D["nam"] = D.thang.str[:4]
print("\nTheo nam (5 HD):")
for y, g in D.groupby("nam"):
    print(f"  {y}: {g.diem.sum():7.0f} diem = {g.trieu.sum():7.1f} trieu | {int((g.diem > 0).sum())}/{len(g)} thang lai | thang xau nhat {g.trieu.min():.1f} trieu, tot nhat {g.trieu.max():.1f} trieu")
tong = D.diem.sum(); print(f"\nTONG: {tong:.0f} diem = {tong*0.1:.0f} trieu dong | {int((D.diem>0).sum())}/{len(D)} thang lai ({(D.diem>0).mean()*100:.0f}%) | sut von toi da (cong don thang) {D.sut.min():.0f} trieu | truoc phi {D.gross.sum():.0f} diem")
if len(sys.argv) > 1: D.drop(columns=["nam"]).round(1).to_csv(sys.argv[1], index=False, encoding="utf-8-sig"); print("Da ghi", sys.argv[1])
