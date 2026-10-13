# PHAI SINH VN30F1M - DON BAY (2026-10-14): cung he pha vo trong ngay, neu dung don bay thi lai / sut giam / nguy co thieu ky quy ra sao.
#   Don bay L = gia tri hop dong dang giu / von. L = 1: de du tien bang ca gia tri hop dong (~187 trieu / HD o muc 1.870). Toi da ~5,4 lan vi ky quy ~18,5%.
#   (1) Don bay CO DINH, lai nhap von (moi ngay giu dung L lan von - ly tuong hoa, coi nhu mua duoc so le hop dong)
#   (2) 1 HOP DONG co dinh voi so von ban dau khac nhau, tinh bang TIEN that (diem x 100.000d), kiem tra co luc nao von < ky quy khong
#   (3) Xao tron lich su theo thang (5.000 lan) de biet trong 1 nam bat ky co the gap muc sut giam nao
# Chi phi: bieu phi chinh thuc MBS + truot gia 0,4 diem (phaisinh_chung.phi). Chay: python engine/dich-vu/phaisinh_donbay.py
import numpy as np, pandas as pd
from phaisinh_chung import nap, chay_lenh, phi, MOC
X = nap(); ngay, O, H, L_, C, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["sauDao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); bd = H.max(axis=1) - L_.min(axis=1); pBD = np.r_[np.nan, bd[:-1]]
KY_QUY = 0.185
def orb(Nm):
    gd = []
    for a in range(N):
        hi, lo = H[a, :Nm].max(), L_[a, :Nm].min()
        for k in range(Nm, 180):
            p = 1 if C[a, k] > hi else -1 if C[a, k] < lo else 0
            if p: j, ra = chay_lenh(O[a], H[a], L_[a], C[a], p, k, C[a, k], cat=lo if p > 0 else hi); gd.append((a, p, C[a, k], ra)); break
    return gd
def vb(k_):
    gd = []
    for a in range(1, N):
        if sauDao[a] or np.isnan(pBD[a]): continue
        o0 = O[a, 0]; tr, du = o0 + k_ * pBD[a], o0 - k_ * pBD[a]
        for k in range(1, 180):
            p = 1 if H[a, k] >= tr else -1 if L_[a, k] <= du else 0
            if p: gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du); j, ra = chay_lenh(O[a], H[a], L_[a], C[a], p, k, gia, cat=o0); gd.append((a, p, gia, ra)); break
    return gd
def chuoi(gd):  # % gia tri hop dong moi ngay, va diem moi ngay
    x = np.zeros(N); d = np.zeros(N)
    for a, p, v, r in gd: z = p * (r - v) - phi(v); x[a] += z / v * 100; d[a] += z
    return x, d
KIEU = {"Bien dong 0,3": vb(0.3), "Khoang mo cua 15 phut": orb(15)}
S = {k: chuoi(v) for k, v in KIEU.items()}
S["Ghep 5 kieu pha vo"] = (np.mean([chuoi(g)[0] for g in (orb(5), orb(15), orb(30), vb(0.3), vb(0.5))], axis=0), None)
thang = np.array([x[:7] for x in ngay])

print("=== 1. DON BAY CO DINH, LAI NHAP VON (ca ky 08/2018 - 10/2026) ===")
for ten, (x, _) in S.items():
    print(f"\n  {ten}: lai TB {x.mean():.3f}% / ngay, do lech chuan {x.std():.2f}%, ngay te nhat {x.min():.2f}%, ngay tot nhat {x.max():.2f}%")
    print(f"     {'don bay':>8s} | {'von can cho 1 HD o 1.870':>26s} | {'lai kep / nam':>14s} | {'sut giam lon nhat':>18s} | {'ngay te nhat':>12s} | {'thang te nhat':>13s} | {'thang lo':>9s} | {'ngay o duoi dinh dai nhat':>26s} | rieng tu 07/2022")
    for Lv in (1, 2, 3, 4, 5, 5.4):
        r = Lv * x / 100; e = np.cumprod(1 + r); nam_ = N / 250; dd = e / np.maximum.accumulate(e) - 1
        th = pd.Series(r).groupby(thang).apply(lambda s: np.prod(1 + s) - 1) * 100
        duoi = 0; dai = 0
        for v in dd:
            duoi = duoi + 1 if v < 0 else 0; dai = max(dai, duoi)
        r2 = r[~dK]; e2 = np.cumprod(1 + r2)
        print(f"     {Lv:6.1f} x | {187/Lv:20.0f} trieu | {(e[-1]**(1/nam_)-1)*100:13.1f}% | {dd.min()*100:17.1f}% | {r.min()*100:11.1f}% | {th.min():12.1f}% | {(th<0).mean()*100:8.0f}% | {dai:22d} ngay | {(e2[-1]**(250/len(r2))-1)*100:5.1f}%/nam, sut {((e2/np.maximum.accumulate(e2)-1).min())*100:.1f}%")

print("\n=== 2. MOT HOP DONG CO DINH, tinh bang TIEN (diem x 100.000d), giai doan tu 07/2022; ky quy can = 18,5% gia tri hop dong ngay do ===")
for ten in ("Bien dong 0,3", "Khoang mo cua 15 phut"):
    x, d = S[ten]; m = ~dK; tien = d[m] * 100000 / 1e6; gia = O[m, 0]; kq = KY_QUY * gia * 100000 / 1e6; so_nam = m.sum() / 250
    cum = np.cumsum(tien); dinh = np.maximum.accumulate(np.r_[0, cum])[1:]
    print(f"\n  {ten}: tong lai {cum[-1]:.0f} trieu trong {so_nam:.1f} nam ({cum[-1]/so_nam:.1f} trieu/nam) | sut giam lon nhat {(cum-dinh).min():.1f} trieu | ngay thua nang nhat {tien.min():.1f} trieu | ngay thang lon nhat {tien.max():.1f} trieu | ky quy 1 HD: {kq.min():.0f} - {kq.max():.0f} trieu (hien nay ~{KY_QUY*1867.5*0.1:.0f})")
    print(f"     {'von ban dau':>12s} | {'lai / nam tren von':>19s} | {'von thap nhat':>14s} | {'sut giam so voi von ban dau':>28s} | so ngay dau phien KHONG DU ky quy de vao lenh")
    for K in (40, 50, 70, 100, 150, 190):
        von = K + np.r_[0, cum[:-1]]; thieu = (von < kq).sum()
        print(f"     {K:8d} trieu | {cum[-1]/so_nam/K*100:18.1f}% | {(K + cum).min():9.1f} trieu | {(cum-dinh).min()/K*100:27.1f}% | {thieu:4d} / {m.sum()} ngay" + ("  <- co luc khong vao duoc lenh" if thieu else ""))

print("\n=== 3. XAO TRON LICH SU THEO THANG (5.000 nam gia dinh, moi nam = 12 thang boc ngau nhien tu 96 thang da co) ===")
rng = np.random.default_rng(2026)
for ten in ("Bien dong 0,3", "Ghep 5 kieu pha vo"):
    x = S[ten][0]; nhom = [x[thang == t] for t in sorted(set(thang))]
    print(f"\n  {ten}")
    print(f"     {'don bay':>8s} | {'lai nam: trung vi':>18s} | {'5% nam te nhat':>15s} | {'5% nam tot nhat':>16s} | {'kha nang ca nam LO':>19s} | kha nang trong nam co luc sut giam qua 20% / 30% / 50%")
    for Lv in (1, 2, 3, 4, 5.4):
        kq_ = []; dd_ = []
        for _ in range(5000):
            r = np.concatenate([nhom[i] for i in rng.integers(0, len(nhom), 12)]) * Lv / 100; e = np.cumprod(1 + r); kq_.append(e[-1] - 1); dd_.append((e / np.maximum.accumulate(e) - 1).min())
        kq_ = np.array(kq_) * 100; dd_ = np.array(dd_) * 100
        print(f"     {Lv:6.1f} x | {np.median(kq_):17.0f}% | {np.percentile(kq_, 5):14.0f}% | {np.percentile(kq_, 95):15.0f}% | {(kq_ < 0).mean()*100:18.0f}% | {(dd_ < -20).mean()*100:5.0f}% / {(dd_ < -30).mean()*100:3.0f}% / {(dd_ < -50).mean()*100:3.0f}%")
print("\n  Luu y: bien do toi da 1 phien cua hop dong la 7%. Neu gia chay nguoc het bien do ma khong thoat duoc (mat thanh khoan), 1 hop dong lo ~7% gia tri = ", end="")
print(" | ".join(f"{Lv}x: -{7*Lv:.0f}% von" for Lv in (1, 2, 3, 4, 5.4)))
