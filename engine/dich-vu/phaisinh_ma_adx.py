# PHAI SINH VN30F1M - DANH THEO MA va ADX/DI (Hieu hoi 2026-10-20), nen 5 va 15 phut, chuoi noi lien cac ngay (chi bao khong dut dau ngay), vi the chi trong ngay va dong 14:29.
# Cac kieu: (A) cat nhau 2 MA (SMA / EMA, nhieu cap do dai), (B) gia cat 1 MA, (C) he ADX kinh dien: +DI cat -DI khi ADX > nguong. Moi kieu quet: co / khong loc ADX (>20, >25, >30),
# vao ngay khi cat (SAR) hoac vao theo TRANG THAI khi ADX dat. In KC (tu 07/2022) lai rong %/nam o truot gia 0,4 diem, va LAI TRUOC PHI (khong phi + truot) de biet chi bao co thong tin khong.
# Chay: python engine/dich-vu/phaisinh_ma_adx.py
import numpy as np
from phaisinh_chung import nap, MOC
import phaisinh_chibao as pc
from phaisinh_chibao import nen_n, ema, sma, adx, chay_vt, tom_tat, trang_thai

X = nap(); ngay = X["ngay"]; N = len(ngay)
PHI_GOC = pc.phi
def chay(pos, Cb, s0, gross):
    pc.phi = (lambda g, t=None: 0 * g) if gross else PHI_GOC
    try: return chay_vt(pos, Cb, s0=s0)
    finally: pc.phi = PHI_GOC

KQ = []
def thu(khung):
    B = nen_n(X, khung); nb = B["C"].shape[1]
    h, l, c = B["H"].reshape(-1), B["L"].reshape(-1), B["C"].reshape(-1)
    dau = np.zeros(N * nb, bool); dau[::nb] = True
    k = 1 if khung == 5 else 1 / 3  # he so do dai MA (khung 15 phut: chia 3 de cung do dai thoi gian)
    L_ = lambda n: max(2, int(round(n * k)))
    ad, pdi, mdi = adx(h, l, c, L_(14))
    prev = lambda a: np.r_[False, a[:-1]]
    def T(nhom, ten, vaoL, raL, vaoS, raS, s0=3):
        pos = trang_thai(vaoL, raL, vaoS, raS, dau).reshape(N, nb)
        r = []
        for gross in (False, True):
            lai, so = chay(pos, B["C"], s0, gross); D, V = tom_tat(np.asarray(lai, float), np.asarray(so, float), ngay); r.append((D, V))
        (Dn, Vn), (Dg, Vg) = r
        KQ.append((nhom, f"[{khung}p] {ten}", Dn, Vn, Dg, Vg))
        print(f"   [{khung:2d}p] {ten:62s} | {Vn['lenh']:4.2f}/ngay | KP net {Dn['nam']:6.1f} KC net {Vn['nam']:6.1f} (Sh {Vn['sharpe']:5.2f}) | TRUOC PHI KP {Dg['nam']:6.1f} KC {Vg['nam']:6.1f}")
    cross_up = lambda a, b: (a > b) & prev(a <= b); cross_dn = lambda a, b: (a < b) & prev(a >= b)
    print(f"\n=== KHUNG {khung} PHUT ===")
    print(" -- A. CAT NHAU 2 MA --")
    for kieu, f in (("EMA", ema), ("SMA", sma)):
        for a_, b_ in ((5, 20), (9, 21), (10, 50), (20, 50), (20, 100), (50, 200)):
            fa, fb = f(c, L_(a_)), f(c, L_(b_))
            if np.isnan(fb).any(): fb = np.nan_to_num(fb, nan=c[0]); fa = np.nan_to_num(fa, nan=c[0])
            for th in (0, 20, 25, 30):
                ok = ad > th
                T("A", f"{kieu} {a_}/{b_} cat nhau" + (f", ADX>{th}" if th else ", khong loc") + " (SAR)",
                  cross_up(fa, fb) & ok, np.zeros_like(ok), cross_dn(fa, fb) & ok, np.zeros_like(ok))
    print(" -- B. GIA CAT 1 MA --")
    for kieu, f in (("EMA", ema), ("SMA", sma)):
        for n_ in (20, 50, 100, 200):
            m = f(c, L_(n_)); m = np.nan_to_num(m, nan=c[0])
            for th in (0, 25):
                ok = ad > th
                T("B", f"Gia cat {kieu}{n_}" + (f", ADX>{th}" if th else ", khong loc") + " (SAR)", cross_up(c, m) & ok, np.zeros_like(ok), cross_dn(c, m) & ok, np.zeros_like(ok))
    print(" -- C. HE ADX / DI --")
    for th in (20, 25, 30):
        T("C", f"+DI cat -DI khi ADX>{th} (SAR, thoat khi DI cat nguoc)", cross_up(pdi, mdi) & (ad > th), cross_dn(pdi, mdi), cross_dn(pdi, mdi) & (ad > th), cross_up(pdi, mdi))
        T("C", f"Theo TRANG THAI: ADX>{th} & +DI>-DI mua, ADX>{th} & -DI>+DI ban", (pdi > mdi) & (ad > th), ad < th, (mdi > pdi) & (ad > th), ad < th)
    print(" -- D. ADX CAO = XU HUONG MANH -> GIA CAT EMA20 theo chieu DI (ket hop) --")
    m = np.nan_to_num(ema(c, L_(20)), nan=c[0])
    for th in (25, 30):
        T("D", f"ADX>{th}: gia tren EMA20 & +DI>-DI -> mua; nguoc lai ban", (c > m) & (pdi > mdi) & (ad > th), (c < m), (c < m) & (mdi > pdi) & (ad > th), (c > m))

thu(5); thu(15)

print("\n=== TONG KET ===")
n = len(KQ)
duong_net = [k for k in KQ if k[2]["nam"] > 0 and k[3]["nam"] > 0]
print(f"   {n} kieu | duong SAU phi ca 2 giai doan: {len(duong_net)} | am ca 2: {sum(1 for k in KQ if k[2]['nam'] < 0 and k[3]['nam'] < 0)}")
print(f"   TRUOC phi: duong ca 2 giai doan: {sum(1 for k in KQ if k[4]['nam'] > 0 and k[5]['nam'] > 0)} | trung binh KC truoc phi: {np.mean([k[5]['nam'] for k in KQ]):.1f}%/nam | sau phi: {np.mean([k[3]['nam'] for k in KQ]):.1f}%/nam")
for k in sorted(duong_net, key=lambda k: -min(k[2]["sharpe"], k[3]["sharpe"]))[:8]:
    print(f"   {k[1]:75s} KP {k[2]['nam']:6.1f} KC {k[3]['nam']:6.1f} (Sh {k[3]['sharpe']:.2f})")
print("   Top truoc phi (KC):")
for k in sorted(KQ, key=lambda k: -k[5]["nam"])[:5]:
    print(f"   {k[1]:75s} KP truoc phi {k[4]['nam']:6.1f} KC truoc phi {k[5]['nam']:6.1f} | KC sau phi {k[3]['nam']:6.1f} | {k[3]['lenh']:.2f} lenh/ngay")
