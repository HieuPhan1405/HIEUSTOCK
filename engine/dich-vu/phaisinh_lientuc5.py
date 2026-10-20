# PHAI SINH VN30F1M - DANH LIEN TUC TRONG PHIEN tren nen 5 phut (Hieu muon danh nhieu lenh trong ngay, 2026-10-20).
# Quet cac HO kieu vao / ra lien tuc (vao lai nhieu lan trong ngay, dong het 14:29): dao chieu theo khoang mo cua, pha dinh / day cua ngay + trailing, xung luc 1 nen, theo / nguoc VWAP,
# Donchian cuon chieu, theo xu huong Ichimoku 5 phut. Moi kieu in lai rong theo 3 muc TRUOT GIA (0 / 0,4 / 1,0 diem moi vong) de thay chi phi an bao nhieu loi thuan.
# Phi MBS (phaisinh_chung.phi) + truot gia, 2 giai doan KP (den 06/2022) va KC (tu 07/2022), % tren gia tri hop dong (chua don bay), chuoi 5 phut noi lien cac ngay cho chi bao, vi the chi trong ngay.
# Chay: python engine/dich-vu/phaisinh_lientuc5.py
import numpy as np
from phaisinh_chung import nap, MOC
from phaisinh_chibao import nen_n, chay_vt, tom_tat, trang_thai, sma, lan

X = nap(); ngay = X["ngay"]; N = len(ngay)
B = nen_n(X, 5); nb = B["C"].shape[1]
Hh, Ll, Cc, Oo, Vv = B["H"], B["L"], B["C"], B["O"], B["V"]
dau = np.zeros(N * nb, bool); dau[::nb] = True
F = lambda a: a.reshape(-1)
R = lambda p: np.asarray(p).reshape(N, nb)
idx = np.tile(np.arange(nb), (N, 1))
Z = np.zeros((N, nb), bool)
h, l, c = F(Hh), F(Ll), F(Cc)
pc = np.r_[c[0], c[:-1]]; tr = np.maximum(h - l, np.maximum(np.abs(h - pc), np.abs(l - pc)))
def wil(x, n):
    out = np.empty(len(x)); e = x[:n].mean(); out[:n] = e
    for i in range(n, len(x)): e = e + (x[i] - e) / n; out[i] = e
    return out
ATR = R(wil(tr, 48))  # ATR 5 phut ~ 1 ngay
ATRp = np.concatenate([ATR[:, :1], ATR[:, :-1]], axis=1)
TS = (0.0, 0.4, 1.0)
KQ = []
def T(nhom, ten, pos, s0=3, kCuoi=None):
    pos = R(pos)
    ra = []
    for ts in TS:
        lai, so = chay_vt(pos, Cc, s0=s0, truot=ts, kCuoi=kCuoi)
        D, V = tom_tat(np.asarray(lai, float), np.asarray(so, float), ngay); ra.append((D, V))
    D4, V4 = ra[1]
    KQ.append((nhom, ten, D4, V4))
    print(f"   {ten:70s} | {V4['lenh']:4.2f}/ngay | truot 0/0.4/1.0 (KC %/nam): " + " / ".join(f"{r[1]['nam']:6.1f}" for r in ra) + f" | KP(0.4) {D4['nam']:6.1f} Sh {D4['sharpe']:5.2f} | KC Sh {V4['sharpe']:5.2f} sut {V4['dd']:6.1f}%")

def sar(vaoL, vaoS, raL=None, raS=None):
    z = np.zeros(N * nb, bool)
    return trang_thai(F(vaoL), F(raL) if raL is not None else z, F(vaoS), F(raS) if raS is not None else z, dau)

def truoc(a, k=1):  # gia tri k nen truoc trong cung ngay (nen dau = chinh no)
    out = a.copy(); out[:, k:] = a[:, :-k]; return out

print("=== A. DAO CHIEU THEO KHOANG MO CUA (vao lai ca ngay) ===")
for w in (3, 6):
    dinh = Hh[:, :w].max(axis=1, keepdims=True); day = Ll[:, :w].min(axis=1, keepdims=True); mid = (dinh + day) / 2
    after = idx >= w
    T("A", f"ORB {w*5}p dao chieu ca ngay (SAR o bien doi dien)", sar((Cc > dinh) & after, (Cc < day) & after), s0=w)
    T("A", f"ORB {w*5}p, cat o gia giua khoang, vao lai khi pha tiep", sar((Cc > dinh) & after, (Cc < day) & after, Cc < mid, Cc > mid), s0=w)

print("\n=== B. PHA DINH / DAY CUA NGAY + CAT LO TRAILING ===")
dinhNgay = truoc(np.maximum.accumulate(Hh, axis=1)); dayNgay = truoc(np.minimum.accumulate(Ll, axis=1))
for m in (6, 12):
    th = np.min([truoc(Ll, j) for j in range(1, m + 1)], axis=0); tl = np.max([truoc(Hh, j) for j in range(1, m + 1)], axis=0)
    T("B", f"Pha dinh/day cua ngay, thoat khi thung day / vuot dinh {m} nen gan nhat", sar((Cc > dinhNgay) & (idx >= 6), (Cc < dayNgay) & (idx >= 6), Cc < th, Cc > tl), s0=6)
for k in (2.0, 3.0):
    T("B", f"Pha dinh/day cua ngay, dao chieu khi nguoc {k} ATR5p tu dinh/day", sar((Cc > dinhNgay) & (idx >= 6), (Cc < dayNgay) & (idx >= 6), Cc < dinhNgay - k * ATRp, Cc > dayNgay + k * ATRp), s0=6)

print("\n=== C. DONCHIAN CUON CHIEU + XUNG LUC 1 NEN ===")
for n_ in (12, 24):
    hi = np.max([truoc(Hh, j) for j in range(1, n_ + 1)], axis=0); lo = np.min([truoc(Ll, j) for j in range(1, n_ + 1)], axis=0)
    T("C", f"Donchian {n_} nen (trong ngay) dao chieu", sar((Cc > hi) & (idx >= n_), (Cc < lo) & (idx >= n_)), s0=n_)
rng = Hh - Ll
for k in (1.5, 2.5):
    big = rng >= k * ATRp
    for hb in (3, 6):
        for huong, ten in ((1, "THEO"), (-1, "NGUOC")):
            up = big & (Cc >= Ll + 0.75 * rng) & (Cc > Oo); dn = big & (Cc <= Ll + 0.25 * rng) & (Cc < Oo)
            pos = np.zeros((N, nb), np.int8)
            for d in range(N):
                j = 3
                while j < nb - 1:
                    s = 1 if up[d, j] else -1 if dn[d, j] else 0
                    if s:
                        e = min(j + hb, nb - 1); pos[d, j:e] = s * huong; j = e
                    else: j += 1
            T("C", f"Xung luc 1 nen (bien do >= {k} ATR, dong cua o 25% mep) {ten} huong, giu {hb} nen", pos)

print("\n=== D. VWAP ===")
tp = (Hh + Ll + Cc) / 3
vw = np.cumsum(tp * np.maximum(Vv, 1), axis=1) / np.cumsum(np.maximum(Vv, 1), axis=1)
for bf in (0.0, 0.5):
    T("D", f"SAR theo VWAP (dong cua vuot VWAP +- {bf} ATR5p)", sar((Cc > vw + bf * ATRp) & (idx >= 6), (Cc < vw - bf * ATRp) & (idx >= 6)), s0=6)
for k in (2.0, 3.0):
    T("D", f"Danh nguoc: lech khoi VWAP {k} ATR5p -> ve VWAP", sar((Cc < vw - k * ATRp) & (idx >= 6), (Cc > vw + k * ATRp) & (idx >= 6), Cc >= vw, Cc <= vw), s0=6)

print("\n=== E. XU HUONG ICHIMOKU 5 PHUT (9-17-33 tren chuoi noi lien) ===")
def trungDiem(x_h, x_l, n_):
    hi = lan(x_h, n_, np.max); lo = lan(x_l, n_, np.min); return (hi + lo) / 2
tk = trungDiem(h, l, 9); kj = trungDiem(h, l, 17); sa = (tk + kj) / 2; sb = trungDiem(h, l, 33)
cT = np.fmax(sa, sb); cB = np.fmin(sa, sb)
T("E", "Gia tren may + Tenkan > Kijun: mua; duoi may + Tenkan < Kijun: ban khong (SAR)", sar(R((c > cT) & (tk > kj)), R((c < cB) & (tk < kj))), s0=3)
T("E", "Cat Tenkan-Kijun (SAR)", sar(R((tk > kj) & (np.r_[False, (tk <= kj)[:-1]] | True)), R(tk < kj)), s0=3)

print("\n=== F. LOC GIO: chi buoi sang (den 11:30) hoac chi buoi chieu cho kieu tot nhat o tren ===")
dinh = Hh[:, :3].max(axis=1, keepdims=True); day = Ll[:, :3].min(axis=1, keepdims=True); after = idx >= 3
v1, v2 = (Cc > dinh) & after, (Cc < day) & after
T("F", "ORB 15p dao chieu, chi den 11:30 (nen 30)", sar(v1, v2), s0=3, kCuoi=30)
T("F", "ORB 15p dao chieu, den 14:29", sar(v1, v2), s0=3)

print("\n=== XEP HANG (truot 0,4; chi kieu duong CA 2 giai doan) ===")
tot = sorted([k for k in KQ if k[2]["nam"] > 0 and k[3]["nam"] > 0], key=lambda k: -min(k[2]["sharpe"], k[3]["sharpe"]))
for nhom, ten, D, V in tot[:10]: print(f"   [{nhom}] {ten:70s} KP {D['nam']:6.1f} (Sh {D['sharpe']:.2f}) | KC {V['nam']:6.1f} (Sh {V['sharpe']:.2f}) | {V['lenh']:.2f} lenh/ngay")
print(f"   Tong {len(KQ)} kieu | duong ca 2 giai doan: {len(tot)} | am ca 2 giai doan: {sum(1 for k in KQ if k[2]['nam'] < 0 and k[3]['nam'] < 0)}")
