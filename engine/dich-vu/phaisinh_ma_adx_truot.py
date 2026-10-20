# PHAI SINH VN30F1M - tiep phaisinh_ma_adx.py: kieu MA / ADX THEO XU HUONG co loi the TRUOC PHI (khoang 20-30%/nam voi 2+ lenh/ngay) - TRUOT GIA bao nhieu thi hoa von / co lai? Va theo tung nam.
# Phi co dinh MBS giu nguyen (phi() - truot), chi doi truot gia 0 / 0,1 / 0,2 / 0,4 / 0,6 / 1,0 diem moi vong.
# Chay: python engine/dich-vu/phaisinh_ma_adx_truot.py
import numpy as np
from phaisinh_chung import nap, MOC
from phaisinh_chibao import nen_n, ema, sma, adx, chay_vt, tom_tat, trang_thai
X = nap(); ngay = X["ngay"]; N = len(ngay); nam = np.array([x[:4] for x in ngay]); dK = np.array([x < MOC for x in ngay])
def chuan(khung):
    B = nen_n(X, khung); nb = B["C"].shape[1]; h, l, c = B["H"].reshape(-1), B["L"].reshape(-1), B["C"].reshape(-1)
    dau = np.zeros(N * nb, bool); dau[::nb] = True; return B, nb, h, l, c, dau
prev = lambda a: np.r_[False, a[:-1]]
up = lambda a, b: (a > b) & prev(a <= b); dn = lambda a, b: (a < b) & prev(a >= b)
CA = {}
B5, nb5, h5, l5, c5, d5 = chuan(5); ad5, p5, m5 = adx(h5, l5, c5, 14)
sma5, sma20 = sma(c5, 5), sma(c5, 20); e5, e20 = ema(c5, 5), ema(c5, 20)
CA["[5p] SMA 5/20 cat nhau, khong loc"] = (B5, trang_thai(up(sma5, sma20), np.zeros(len(c5), bool), dn(sma5, sma20), np.zeros(len(c5), bool), d5))
CA["[5p] EMA 5/20 cat nhau, ADX>20"] = (B5, trang_thai(up(e5, e20) & (ad5 > 20), np.zeros(len(c5), bool), dn(e5, e20) & (ad5 > 20), np.zeros(len(c5), bool), d5))
CA["[5p] Trang thai ADX>20 & DI"] = (B5, trang_thai((p5 > m5) & (ad5 > 20), ad5 < 20, (m5 > p5) & (ad5 > 20), ad5 < 20, d5))
B15, nb15, h15, l15, c15, d15 = chuan(15); ad15, p15, m15 = adx(h15, l15, c15, 5)
em = np.nan_to_num(ema(c15, 7), nan=c15[0])
CA["[15p] ADX>25: gia > EMA20 & +DI>-DI"] = (B15, trang_thai((c15 > em) & (p15 > m15) & (ad15 > 25), c15 < em, (c15 < em) & (m15 > p15) & (ad15 > 25), c15 > em, d15))
e100 = np.nan_to_num(ema(c15, 33), nan=c15[0])
CA["[15p] Gia cat EMA100, ADX>25"] = (B15, trang_thai(up(c15, e100) & (ad15 > 25), np.zeros(len(c15), bool), dn(c15, e100) & (ad15 > 25), np.zeros(len(c15), bool), d15))
TS = (0.0, 0.1, 0.2, 0.4, 0.6, 1.0)
print("Lai KC (tu 07/2022) %/nam theo TRUOT GIA (diem / vong); phi co dinh MBS giu nguyen")
print(f"{'Kieu':44s} {'lenh/ngay':>9s} " + " ".join(f"{t:>6.1f}" for t in TS))
for ten, (B, pos) in CA.items():
    nb = B["C"].shape[1]; pos = pos.reshape(N, nb); out = []
    for ts in TS:
        lai, so = chay_vt(pos, B["C"], s0=3, truot=ts); D, V = tom_tat(np.asarray(lai, float), np.asarray(so, float), ngay); out.append(V["nam"]); lenh = V["lenh"]
    print(f"{ten:44s} {lenh:9.2f} " + " ".join(f"{x:6.1f}" for x in out))
print("\nTheo tung nam (% tong) o truot gia 0,2 diem:")
for ten, (B, pos) in CA.items():
    nb = B["C"].shape[1]; lai, so = chay_vt(pos.reshape(N, nb), B["C"], s0=3, truot=0.2); lai = np.asarray(lai, float)
    print(f"  {ten:44s} " + "  ".join(f"{y[2:]}:{lai[nam == y].sum():6.1f}" for y in sorted(set(nam))))
