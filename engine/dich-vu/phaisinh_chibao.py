# PHAI SINH - bo CHI BAO dung chung (numpy thuan) + may mo phong VI THE tren nen 5 / 15 phut. Dung boi phaisinh_them*.py.
# Quy uoc: chuoi nen duoc NOI LIEN cac ngay (de chi bao khong bi dut dau ngay), nhung vi the chi mo trong ngay va LUON dong o nen cuoi ngay (14:29).
import numpy as np
from phaisinh_chung import phi, MOC

# Gop ma tran phut (ngay x 241) thanh nen n phut: n = 5 -> 48 nen, n = 15 -> 16 nen, n = 30 -> 8 nen; nen cuoi ngay gom ca phan du (den 14:29).
def gop(M, n, ham):
    canh = list(range(0, 240, n))
    return np.stack([ham(M[:, c:(241 if i == len(canh) - 1 else c + n)]) for i, c in enumerate(canh)], axis=1)
def nen_n(X, n):
    return dict(O=gop(X["O"], n, lambda a: a[:, 0]), H=gop(X["H"], n, lambda a: a.max(axis=1)), L=gop(X["L"], n, lambda a: a.min(axis=1)),
                C=gop(X["C"], n, lambda a: a[:, -1]), V=gop(X["V"], n, lambda a: a.sum(axis=1)))

def ema(x, n):
    k = 2 / (n + 1); out = np.empty(len(x)); e = x[0]
    for i in range(len(x)): e = x[i] * k + e * (1 - k); out[i] = e
    return out
def wilder(x, n):
    out = np.empty(len(x)); e = x[0]
    for i in range(len(x)): e = e + (x[i] - e) / n; out[i] = e
    return out
def sma(x, n):
    c = np.cumsum(np.insert(x, 0, 0.0)); out = np.full(len(x), np.nan); out[n - 1:] = (c[n:] - c[:-n]) / n; return out
def lan(x, n, ham):  # cua so truot (gom ca nen hien tai)
    out = np.full(len(x), np.nan)
    from numpy.lib.stride_tricks import sliding_window_view
    out[n - 1:] = ham(sliding_window_view(x, n), axis=1); return out
def rsi(c, n=14):
    d = np.diff(c, prepend=c[0]); au = wilder(np.maximum(d, 0), n); ad = wilder(np.maximum(-d, 0), n)
    return np.where(ad == 0, 100.0, 100 - 100 / (1 + au / np.where(ad == 0, 1, ad)))
def atr(h, l, c, n=14):
    pc = np.r_[c[0], c[:-1]]; tr = np.maximum(h - l, np.maximum(np.abs(h - pc), np.abs(l - pc))); return wilder(tr, n)
def adx(h, l, c, n=14):
    up = np.diff(h, prepend=h[0]); dn = -np.diff(l, prepend=l[0])
    pdm = np.where((up > dn) & (up > 0), up, 0.0); mdm = np.where((dn > up) & (dn > 0), dn, 0.0); a = atr(h, l, c, n)
    pdi = 100 * wilder(pdm, n) / np.where(a == 0, 1, a); mdi = 100 * wilder(mdm, n) / np.where(a == 0, 1, a)
    return wilder(100 * np.abs(pdi - mdi) / np.where(pdi + mdi == 0, 1, pdi + mdi), n), pdi, mdi
def supertrend(h, l, c, n=10, m=3.0):
    a = atr(h, l, c, n); mid = (h + l) / 2; tren = mid + m * a; duoi = mid - m * a; huong = np.ones(len(c)); ft, fd = tren[0], duoi[0]
    for i in range(1, len(c)):
        ft_m = tren[i] if (tren[i] < ft or c[i - 1] > ft) else ft; fd_m = duoi[i] if (duoi[i] > fd or c[i - 1] < fd) else fd
        huong[i] = 1 if c[i] > ft_m else -1 if c[i] < fd_m else huong[i - 1]; ft, fd = ft_m, fd_m
    return huong
def psar(h, l, af0=0.02, afm=0.2):
    n = len(h); huong = np.ones(n); sar = l[0]; ep = h[0]; af = af0; up = True
    for i in range(1, n):
        sar = sar + af * (ep - sar)
        if up:
            if l[i] < sar: up = False; sar = ep; ep = l[i]; af = af0
            else:
                if h[i] > ep: ep = h[i]; af = min(af + af0, afm)
        else:
            if h[i] > sar: up = True; sar = ep; ep = h[i]; af = af0
            else:
                if l[i] < ep: ep = l[i]; af = min(af + af0, afm)
        huong[i] = 1 if up else -1
    return huong
def stoch(h, l, c, n=14, d=3):
    hh, ll = lan(h, n, np.max), lan(l, n, np.min); k = 100 * (c - ll) / np.where(hh - ll == 0, 1, hh - ll); return k, sma(np.nan_to_num(k, nan=50.0), d)
def cci(h, l, c, n=20):
    tp = (h + l + c) / 3; m = sma(tp, n); md = lan(tp, n, lambda w, axis: np.abs(w - w.mean(axis=1, keepdims=True)).mean(axis=1)); return (tp - m) / (0.015 * np.where(md == 0, 1, md))

# May trang thai: vao / ra theo 4 mang dieu kien (da trai phang); dauNgay = mang bool danh dau nen dau tien cua moi ngay (vi the ve 0)
def trang_thai(vaoL, raL, vaoS, raS, dauNgay):
    n = len(vaoL); pos = np.zeros(n, dtype=np.int8); p = 0
    for i in range(n):
        if dauNgay[i]: p = 0
        if p == 1 and raL[i]: p = 0
        elif p == -1 and raS[i]: p = 0
        if p == 0:
            if vaoL[i]: p = 1
            elif vaoS[i]: p = -1
        elif p == 1 and vaoS[i]: p = -1
        elif p == -1 and vaoL[i]: p = 1
        pos[i] = p
    return pos

# Mo phong vi the tren nen: pos[a, b] = vi the SAU khi nen b dong cua (khop tai gia dong cua nen do). Khong vao truoc nen s0, nen cuoi ngay luon = 0.
def chay_vt(pos, Cb, s0=3, truot=None, kCuoi=None):
    pos = pos.astype(float).copy(); pos[:, :s0] = 0
    if kCuoi is not None: pos[:, kCuoi:] = 0
    pos[:, -1] = 0
    gross = (pos[:, :-1] * np.diff(Cb, axis=1)).sum(axis=1)
    truoc = np.c_[np.zeros(len(pos)), pos[:, :-1]]
    vao = (pos != 0) & (pos != truoc)
    return (gross - (vao * phi(Cb, truot)).sum(axis=1)) / Cb[:, 0] * 100, vao.sum(axis=1)

def tom_tat(lai, so, ngay):  # lai: % moi ngay; so: so lenh moi ngay
    d = np.array([x < MOC for x in ngay]); ra = []
    for m in (d, ~d):
        x = lai[m]; e = np.cumsum(x); nam = m.sum() / 250
        ra.append(dict(nam=x.sum() / nam, sharpe=x.mean() / x.std() * np.sqrt(250) if x.std() > 0 else np.nan, dd=(e - np.maximum.accumulate(e)).min(), lenh=so[m].mean(), tb=x.sum() / max(so[m].sum(), 1)))
    return ra
KQ = []  # (nhom, ten, D, V)
def ghi(nhom, ten, lai, so, ngay):
    D, V = tom_tat(np.asarray(lai, float), np.asarray(so, float), ngay); KQ.append((nhom, ten, D, V))
    print(f"   {ten:66s} | KP {D['nam']:6.1f}%/nam Sh {D['sharpe']:5.2f} sut {D['dd']:6.1f}% | KC {V['nam']:6.1f}%/nam Sh {V['sharpe']:5.2f} sut {V['dd']:6.1f}% | {V['lenh']:.2f} lenh/ngay, TB {V['tb']*18.7:5.2f} diem")
def xep_hang(so=15):
    print("\n=== XEP HANG: cac kieu DUONG o CA 2 giai doan, xep theo Sharpe thap hon trong 2 giai doan ===")
    tot = sorted([k for k in KQ if k[2]["nam"] > 0 and k[3]["nam"] > 0], key=lambda k: -min(k[2]["sharpe"], k[3]["sharpe"]))
    for nhom, ten, D, V in tot[:so]: print(f"   [{nhom}] {ten:60s} KP {D['nam']:5.1f}%/nam (Sh {D['sharpe']:.2f}) | KC {V['nam']:5.1f}%/nam (Sh {V['sharpe']:.2f}) | sut {min(D['dd'], V['dd']):.1f}%")
    print(f"   Tong so kieu da thu: {len(KQ)} | duong ca 2 giai doan: {len(tot)} | am ca 2 giai doan: {sum(1 for k in KQ if k[2]['nam'] < 0 and k[3]['nam'] < 0)} | doi dau: {sum(1 for k in KQ if (k[2]['nam'] > 0) != (k[3]['nam'] > 0))}")
