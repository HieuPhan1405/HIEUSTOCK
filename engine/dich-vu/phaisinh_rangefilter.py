# PHAI SINH VN30F1M - RANGE FILTER (Pine v5 "Range Filter Buy and Sell 5min" cua DonovanWall / guikroth) ket hop EMA 34 / 89 (Hieu 05/11/2026: "test thu, range 4, ket hop voi ema 34 va 89").
# Port Pine: smoothrng(src, per, mult) = ema(ema(|src - src[1]|, per), 2*per - 1) * mult; rngfilt cap nhat theo huong; upward/downward dem so nen cung huong; longCond / shortCond; CondIni nho trang thai gan nhat;
# longCondition = longCond va CondIni[1] = -1 (dao chieu thanh MUA), shortCondition ngược lai. Chuoi nen NOI LIEN cac ngay (nhu TradingView), vi the chi mo trong ngay va LUON dong 14:29.
# Khop tai gia DONG CUA nen co tin hieu. Phi MBS + truot 0,4 diem / vong (moi lan dao chieu = 1 vong moi). % tren gia tri hop dong; KP den 06/2022, KC tu 07/2022.
# Chay: python engine/dich-vu/phaisinh_rangefilter.py
import numpy as np
from phaisinh_chung import nap
from phaisinh_chibao import nen_n, ema, trang_thai, chay_vt, ghi
X = nap(); ngay = X["ngay"]; N = len(ngay)

def range_filter(src, per, mult):
    d = np.abs(np.diff(src, prepend=src[0]))
    smrng = ema(ema(d, per), per * 2 - 1) * mult
    n = len(src); filt = np.empty(n); filt[0] = src[0]
    for i in range(1, n):
        f = filt[i - 1]; x = src[i]; r = smrng[i]
        if x > f: filt[i] = f if x - r < f else x - r
        else: filt[i] = f if x + r > f else x + r
    up = np.zeros(n); dn = np.zeros(n)
    for i in range(1, n):
        up[i] = up[i - 1] + 1 if filt[i] > filt[i - 1] else 0 if filt[i] < filt[i - 1] else up[i - 1]
        dn[i] = dn[i - 1] + 1 if filt[i] < filt[i - 1] else 0 if filt[i] > filt[i - 1] else dn[i - 1]
    s1 = np.r_[src[0], src[:-1]]
    longC = ((src > filt) & (src > s1) & (up > 0)) | ((src > filt) & (src < s1) & (up > 0))
    shortC = ((src < filt) & (src < s1) & (dn > 0)) | ((src < filt) & (src > s1) & (dn > 0))
    ini = np.zeros(n, dtype=np.int8)
    for i in range(1, n): ini[i] = 1 if longC[i] else -1 if shortC[i] else ini[i - 1]
    prev = np.r_[0, ini[:-1]]
    return filt, ini, longC & (prev == -1), shortC & (prev == 1)

def thu(nmin, per, mult, dem=None):
    B = nen_n(X, nmin); nb = B["C"].shape[1]; c = B["C"].reshape(-1)
    dau = np.zeros(N * nb, bool); dau[::nb] = True
    filt, ini, buy, sell = range_filter(c, per, mult)
    e34, e89 = ema(c, 34), ema(c, 89)
    xt = (c > e34) & (e34 > e89); xg = (c < e34) & (e34 < e89)  # xu huong tang / giam theo EMA 34 > 89
    R = lambda p: p.reshape(N, nb); so0 = 3 if nmin == 5 else 1; Cb = B["C"]
    def T(ten, pos):
        lai, so = chay_vt(R(pos), Cb, s0=so0); ghi("rf", f"[{nmin}p RF{per}x{mult:g}] {ten}", lai, so, ngay)
    T("Range Filter thuan (luon co vi the, dao chieu theo tin hieu)", ini.astype(float))
    T("RF + chi mua khi gia > EMA34 > EMA89, chi ban khi gia < EMA34 < EMA89 (con lai dung ngoai)", np.where((ini == 1) & xt, 1, np.where((ini == -1) & xg, -1, 0)).astype(float))
    T("RF + EMA: vao tai tin hieu Buy / Sell cung xu huong EMA, thoat khi RF dao chieu hoac mat xu huong", trang_thai(buy & xt, (ini == -1) | ~xt, sell & xg, (ini == 1) | ~xg, dau).astype(float))
    T("RF + EMA: chi loc 'gia tren / duoi EMA89' (long khi gia > EMA89, short khi gia < EMA89)", np.where((ini == 1) & (c > e89), 1, np.where((ini == -1) & (c < e89), -1, 0)).astype(float))
    if dem is not None:
        n_buy, n_sell = int(buy.sum()), int(sell.sum()); print(f"      (so tin hieu Buy {n_buy}, Sell {n_sell} tren {N} ngay = {(n_buy + n_sell) / N:.2f} / ngay)")
    return e34, e89

print("=== A. CHI EMA 34 / 89 (dat chuan so sanh): long khi gia > EMA34 > EMA89, short khi gia < EMA34 < EMA89 ===")
for nm in (5, 15):
    B = nen_n(X, nm); nb = B["C"].shape[1]; c = B["C"].reshape(-1); e34, e89 = ema(c, 34), ema(c, 89)
    pos = np.where((c > e34) & (e34 > e89), 1, np.where((c < e34) & (e34 < e89), -1, 0)).astype(float)
    lai, so = chay_vt(pos.reshape(N, nb), B["C"], s0=3 if nm == 5 else 1); ghi("ema", f"[{nm}p] chi EMA 34/89 (xu huong)", lai, so, ngay)

print("\n=== B. RANGE FILTER x EMA, nen 5 phut (mac dinh Pine: per 100, mult 3; theo Hieu: mult 4) ===")
for per, mult in ((100, 3.0), (100, 4.0), (50, 4.0), (30, 4.0), (20, 4.0), (100, 5.0)):
    thu(5, per, mult, dem=True)
print("\n=== C. RANGE FILTER x EMA, nen 15 phut ===")
for per, mult in ((50, 3.0), (50, 4.0), (30, 4.0), (100, 4.0)):
    thu(15, per, mult, dem=True)
