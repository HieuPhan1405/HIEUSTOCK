# PHAI SINH VN30F1M - nghien cuu tiep phaisinh_lientuc5.py: ho "PHA DINH / DAY CUA NGAY, DAO CHIEU KHI NGUOC k ATR5p TU DINH / DAY" (kieu danh lien tuc tot nhat o buoc quet dau).
# Quet k (2..8), bat dau (nen thu may), va xem THEO NAM de biet co ben khong (tranh chon tham so tot nhat tren cung mau). Phi MBS + truot 0,4 (va 0 / 1,0).
# Chay: python engine/dich-vu/phaisinh_lientuc5_b.py
import numpy as np
from phaisinh_chung import nap, MOC
from phaisinh_chibao import nen_n, chay_vt, tom_tat, trang_thai
X = nap(); ngay = X["ngay"]; N = len(ngay); B = nen_n(X, 5); nb = B["C"].shape[1]
Hh, Ll, Cc = B["H"], B["L"], B["C"]
dau = np.zeros(N * nb, bool); dau[::nb] = True; F = lambda a: a.reshape(-1); idx = np.tile(np.arange(nb), (N, 1))
h, l, c = F(Hh), F(Ll), F(Cc); pc = np.r_[c[0], c[:-1]]; tr = np.maximum(h - l, np.maximum(np.abs(h - pc), np.abs(l - pc)))
def wil(x, n):
    out = np.empty(len(x)); e = x[:n].mean(); out[:n] = e
    for i in range(n, len(x)): e = e + (x[i] - e) / n; out[i] = e
    return out
ATR = wil(tr, 48).reshape(N, nb); ATRp = np.concatenate([ATR[:, :1], ATR[:, :-1]], axis=1)
def truoc(a, k=1):
    out = a.copy(); out[:, k:] = a[:, :-k]; return out
dN = truoc(np.maximum.accumulate(Hh, axis=1)); gN = truoc(np.minimum.accumulate(Ll, axis=1))
nam = np.array([x[:4] for x in ngay])
def chay(k, s0, kCuoi=None, ts=0.4):
    z = np.zeros(N * nb, bool)
    pos = trang_thai(F((Cc > dN) & (idx >= s0)), F(Cc < dN - k * ATRp), F((Cc < gN) & (idx >= s0)), F(Cc > gN + k * ATRp), dau).reshape(N, nb)
    return chay_vt(pos, Cc, s0=s0, truot=ts, kCuoi=kCuoi)
print("k   s0  lenh/ngay | KC %/nam (truot 0 / 0.4 / 1.0) | KP(0.4) | sut KC | theo nam (% tong, truot 0.4)")
for k in (2, 3, 4, 5, 6, 8):
    for s0 in (6, 12):
        r = {}
        for ts in (0.0, 0.4, 1.0):
            lai, so = chay(k, s0, ts=ts); r[ts] = (lai, so, tom_tat(np.asarray(lai, float), np.asarray(so, float), ngay))
        lai, so, (D, V) = r[0.4]
        ynam = "  ".join(f"{y[2:]}:{lai[nam == y].sum():5.1f}" for y in sorted(set(nam)))
        print(f"{k:<3d} {s0:<3d} {V['lenh']:4.2f}      | {r[0.0][2][1]['nam']:6.1f} / {V['nam']:6.1f} / {r[1.0][2][1]['nam']:6.1f} | {D['nam']:6.1f} | {V['dd']:6.1f}% | {ynam}")
