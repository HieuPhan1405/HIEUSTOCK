# PHAI SINH VN30F1M - CHI BAO "Future Trend Channel [ChartPrime]" tren nen 5 phut (Hieu nhat tren TradingView, 2026-10-20).
# Chi bao goc (Pine v5): trend = trang thai lat khi dong cua cat len SMA(close, length) + atr hoac cat xuong SMA - atr, trong do atr = HIGHEST(ATR(200), 100);
# kenh ve = hl2 +- atr x 3, duong giua tinh theo SMA(hl2, 20) keo dai phia truoc (chi de nhin, khong co tin hieu mua / ban rieng).
# Quy uoc chung nhu phaisinh_them*.py: bieu phi MBS + truot gia 0,4 diem / vong (phaisinh_chung.phi), chuoi 5 phut NOI LIEN cac ngay (de chi bao khong dut dau ngay),
# vi the CHI mo trong ngay (tu nen thu 4, ~9:15) va LUON dong o nen cuoi ngay (14:29); khop tai gia dong cua nen co tin hieu; 2 giai doan KP (den 06/2022) va KC (tu 07/2022).
# Chay: python engine/dich-vu/phaisinh_ftc5.py
import numpy as np
from phaisinh_chung import nap, MOC
from phaisinh_chibao import *

X = nap(); ngay = X["ngay"]; N = len(ngay)
B = nen_n(X, 5); nb = B["C"].shape[1]
h, l, c, o = B["H"].reshape(-1), B["L"].reshape(-1), B["C"].reshape(-1), B["O"].reshape(-1)
dau = np.zeros(N * nb, bool); dau[::nb] = True
R = lambda p: p.reshape(N, nb)
S0 = 3

def rma(x, n):  # RMA cua Pine (ta.rma), khoi tao bang trung binh n gia tri dau
    out = np.full(len(x), np.nan)
    if len(x) < n: return out
    e = x[:n].mean(); out[n - 1] = e
    for i in range(n, len(x)): e = e + (x[i] - e) / n; out[i] = e
    return out
def cao_nhat(x, n):
    out = np.full(len(x), np.nan)
    from numpy.lib.stride_tricks import sliding_window_view
    ok = ~np.isnan(x); i0 = np.argmax(ok)
    y = x[i0:]
    if len(y) < n: return out
    out[i0 + n - 1:] = sliding_window_view(y, n).max(axis=1); return out
pc = np.r_[c[0], c[:-1]]
tr = np.maximum(h - l, np.maximum(np.abs(h - pc), np.abs(l - pc)))
def ftc(length=100, atr_n=200, atr_hi=100, he_so=1.0):
    a = cao_nhat(rma(tr, atr_n), atr_hi) if atr_hi > 1 else rma(tr, atr_n)
    m = sma(c, length); ban = a * he_so
    tren, duoi = m + ban, m - ban
    cl = np.r_[np.nan, c[:-1]]
    len_len = (c > tren) & (cl <= np.r_[np.nan, tren[:-1]])  # crossover
    len_xuong = (c < duoi) & (cl >= np.r_[np.nan, duoi[:-1]])
    st = np.zeros(len(c), np.int8); p = 0
    for i in range(len(c)):
        if len_len[i]: p = 1
        elif len_xuong[i]: p = -1
        st[i] = p
    return st, len_len, len_xuong, a, m

def T(nhom, ten, pos):
    lai, so = chay_vt(R(pos), B["C"], s0=S0); ghi(nhom, ten, lai, so, ngay)

print("=== A. CHI BAO GOC (length 100, ATR 200, cao nhat 100, he so 1): theo TRANG THAI (moi ngay vao lai neu dang co xu huong) ===")
st, lenL, lenX, a, m = ftc()
print(f"   ATR trung binh cua 'atr' = {np.nanmean(a):.2f} diem ({np.nanmean(a)/np.nanmean(c)*100:.3f}% gia)")
T("A", "Goc: theo trang thai xu huong (dao chieu khi lat), dong 14:29", st)
T("A", "Goc: DAO nguoc trang thai (danh nguoc xu huong)", -st)
T("A", "Goc: CHI vao khi vua lat (vao theo nen lat), dao chieu khi lat nguoc, nghi cuoi ngay",
  trang_thai(lenL, np.zeros(len(c), bool), lenX, np.zeros(len(c), bool), dau))
T("A", "Goc: chi MUA khi lat len (thoat khi lat xuong), khong ban khong",
  trang_thai(lenL, lenX, np.zeros(len(c), bool), np.zeros(len(c), bool), dau))
T("A", "Goc: chi BAN KHONG khi lat xuong (thoat khi lat len), khong mua",
  trang_thai(np.zeros(len(c), bool), np.zeros(len(c), bool), lenX, lenL, dau))

print("\n=== B. QUET THAM SO (theo trang thai; length x atr x cao nhat x he so) ===")
for length in (20, 50, 100, 200):
    for atr_n, hi in ((50, 1), (50, 50), (200, 100)):
        for hs in (0.5, 1.0, 2.0):
            st2, *_ = ftc(length, atr_n, hi, hs)
            T("B", f"len {length:3d} ATR {atr_n:3d} cao-nhat {hi:3d} he-so {hs}: theo trang thai", st2)

print("\n=== C. KENH: hoi ve duong giua trong xu huong, va danh nguoc o bien kenh (hl2 +- atr x k) ===")
hl2 = (h + l) / 2; mid = sma(hl2, 20)
for k in (1.0, 2.0, 3.0):
    top, bot = hl2 + a * k, hl2 - a * k  # kenh goc ve quanh hl2 TAI nen lat; o day ve quanh duong giua SMA(hl2,20) de test bien kenh
    top, bot = mid + a * k, mid - a * k
    # dao chieu ve giua khi cham bien (danh nguoc)
    vaoS = (h >= top) & ~np.isnan(top); vaoL = (l <= bot) & ~np.isnan(bot)
    T("C", f"Nguoc bien kenh +-{k}atr quanh SMA20(hl2): ban khong o bien tren / mua o bien duoi, ra ve giua",
      trang_thai(vaoL, c >= mid, vaoS, c <= mid, dau))
# hoi ve giua trong xu huong
cm = np.r_[np.nan, c[:-1]]; mm = np.r_[np.nan, mid[:-1]]
len_giua = (c > mid) & (cm <= mm); xuong_giua = (c < mid) & (cm >= mm)
T("C", "Theo xu huong: tang + dong cua cat len SMA20(hl2) -> mua (ra khi lat xuong)",
  trang_thai(len_giua & (st == 1), lenX, xuong_giua & (st == -1), lenL, dau))

print("\n=== D. LOC + KET HOP: dung xu huong FTC lam bo loc cho luat da biet manh (pha vo khoang mo cua 15 phut) ===")
# Pha vo khoang mo cua 15 phut = 3 nen 5 phut dau: vao khi dong cua nen 5 phut vuot dinh / day, cat lo o bien doi dien, dong 14:29. Chi lay lenh DUNG huong FTC.
G = R(c); Hh, Ll = R(h), R(l)
dinh = Hh[:, :3].max(axis=1); day = Ll[:, :3].min(axis=1)
for ten, loc in (("khong loc", None), ("chi lenh CUNG huong FTC", True), ("chi lenh NGUOC huong FTC", False)):
    pos = np.zeros((N, nb), np.int8); stR = R(st)
    for d in range(N):
        p = 0
        for j in range(3, nb - 1):
            if p == 0:
                if G[d, j] > dinh[d] and (loc is None or (stR[d, j] == 1) == loc and stR[d, j] != 0): p = 1
                elif G[d, j] < day[d] and (loc is None or (stR[d, j] == -1) == loc and stR[d, j] != 0): p = -1
            elif p == 1 and G[d, j] < day[d]: p = 0
            elif p == -1 and G[d, j] > dinh[d]: p = 0
            pos[d, j] = p
    lai, so = chay_vt(pos, B["C"], s0=S0); ghi("D", f"ORB 15p (cat lo o bien doi dien), {ten}", lai, so, ngay)

xep_hang(12)
