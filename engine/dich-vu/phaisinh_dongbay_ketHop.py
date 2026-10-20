# PHAI SINH VN30F1M - DON BAY + QUAN TRI RUI RO + KET HOP (Hieu 2026-10-20: "van ko on, toi muon danh co don bay, tim cach danh khac").
# 1) DON BAY CO LAI NHAP VON cho he ghep 5 kieu pha vo (moi kieu 1 HD): CAGR, sut von, ngay / thang te nhat, xac suat sut > 30% / 50% (xao tron theo khoi 20 ngay, 3.000 lan, 3 nam), muc sut kich ky quy.
#    "Don bay toi da" L = tong gia tri toi da 5 HD / von; von = 5 x gia tri 1 HD / L (o 1.870 diem 1 HD ~ 187 trieu).
# 2) LOP QUAN TRI RUI RO tren he ghep: muc tieu bien dong, dung giao dich cuoi thang khi lo thang vuot nguong, loc theo duong von (chi vao khi duong von tren MA).
# 3) KET HOP voi cach it tuong quan: EMA 5/20 + ADX>20 (5 phut), ban khong thu Hai, tin hieu BE RONG tu he co phieu (% ma tren SMA50 / VN-Index tren SMA20) loc HUONG lenh.
# Phi MBS + truot 0,4 diem / vong. KP = den 06/2022, KC = tu 07/2022; so lieu theo % gia tri hop dong cua ngay do. Chay: python engine/dich-vu/phaisinh_dongbay_ketHop.py
import json, os, numpy as np, pandas as pd
from phaisinh_chung import nap, phi, chay_lenh, MOC, GOC
from phaisinh_chibao import nen_n, ema, adx, chay_vt, trang_thai
X = nap(); ngay, O, H, L, C, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["sauDao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); KC = ~dK
dH, dL = H.max(axis=1), L.min(axis=1); bd = dH - dL; pBD = np.r_[np.nan, bd[:-1]]
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
SYS = {"ORB5": orb(5), "ORB15": orb(15), "ORB30": orb(30), "BD0.3": vb(0.3), "BD0.5": vb(0.5)}
def chuoi(gd, mask=None):
    x = np.zeros(N)
    for a, (p, v, r) in gd.items():
        if mask is not None and not mask(a, p): continue
        x[a] += (p * (r - v) - phi(v)) / v * 100
    return x
ens = np.mean([chuoi(g) for g in SYS.values()], axis=0)

def tk(x, m=None):
    y = x if m is None else x[m]; e = np.cumsum(y); n_ = len(y) / 250
    return dict(nam=y.sum() / n_, sh=y.mean() / y.std() * np.sqrt(250) if y.std() > 0 else np.nan, dd=(e - np.maximum.accumulate(e)).min())
def dong(ten, x):
    D, V = tk(x, dK), tk(x, KC); print(f"   {ten:62s} | KP {D['nam']:6.1f}%/nam Sh {D['sh']:5.2f} sut {D['dd']:6.1f}% | KC {V['nam']:6.1f}%/nam Sh {V['sh']:5.2f} sut {V['dd']:6.1f}%")

print("=== 0. HE GHEP 5 KIEU (co so) ===")
dong("Ghep 5 kieu (co so)", ens)

# ---------------- 1. DON BAY ----------------
print("\n=== 1. DON BAY CO LAI NHAP VON, tu 07/2022 (941 phien) ===")
r = ens[KC] / 100
GT_HD = 187.0  # trieu dong / HD o 1.870 diem
rng = np.random.default_rng(11)
def mc(rr, L, nsim=3000, horizon=750, blk=20):
    n = len(rr); sut = np.empty(nsim); fin = np.empty(nsim)
    for s in range(nsim):
        idx = []
        while len(idx) < horizon: st = rng.integers(0, n - blk); idx.extend(range(st, st + blk))
        eq = np.cumprod(1 + L * rr[idx[:horizon]]); eq = np.maximum(eq, 1e-6)
        sut[s] = (eq / np.maximum.accumulate(eq) - 1).min(); fin[s] = eq[-1]
    return sut, fin
print(f"{'Don bay toi da':>14s} {'Von cho 5 HD':>13s} | {'CAGR':>6s} {'Sut lich su':>11s} {'Ngay te':>8s} {'Thang te':>9s} | {'P(sut>30%)':>10s} {'P(sut>50%)':>10s} {'Trung vi 3 nam':>14s} | sut kich ky quy (17%)")
thang = np.array([x[:7] for x in ngay])[KC]
for L_ in (1, 1.5, 2, 3, 4, 5):
    eq = np.cumprod(1 + L_ * r); sut_ls = (eq / np.maximum.accumulate(eq) - 1).min()
    cagr = eq[-1] ** (250 / len(r)) - 1
    mth = pd.Series(L_ * r).groupby(thang).apply(lambda s: (1 + s).prod() - 1).min()
    sut_s, fin_s = mc(r, L_)
    von = 5 * GT_HD / L_
    print(f"{L_:14.1f} {von:11.0f} tr | {cagr*100:5.1f}% {sut_ls*100:10.1f}% {L_*r.min()*100:7.1f}% {mth*100:8.1f}% | {np.mean(sut_s < -0.3)*100:9.1f}% {np.mean(sut_s < -0.5)*100:9.1f}% {np.median(fin_s):13.2f}x | {(1 - L_/5.9)*-100:6.0f}% (sut lich su {sut_ls*100:.0f}%)")

# ---------------- 2. QUAN TRI RUI RO ----------------
print("\n=== 2. LOP QUAN TRI RUI RO TREN HE GHEP (KC; % cong don, khong nhap von) ===")
dong("Co so", ens)
# muc tieu bien dong: co lenh ~ 1 / do lech chuan 20 ngay truoc do
sd = pd.Series(ens).rolling(20).std().shift(1).values; med = np.nanmedian(sd)
w = np.clip(med / np.where(sd > 0, sd, med), 0.5, 2.0); w = np.nan_to_num(w, nan=1.0); w = w / w[KC].mean()
dong("Muc tieu bien dong (co lenh ~ 1/sigma 20 ngay, 0,5-2x)", ens * w)
# dung giao dich cuoi thang khi lo thang vuot nguong (nguong = 1,5 x do lech chuan thang cua KP)
thang_all = np.array([x[:7] for x in ngay])
mkp = pd.Series(ens[dK]).groupby(thang_all[dK]).sum(); X_ = 1.5 * mkp.std()
def dung_thang(x, nguong):
    out = x.copy(); cur = None; cum = 0.0; dung = False
    for i in range(N):
        if thang_all[i] != cur: cur = thang_all[i]; cum = 0.0; dung = False
        if dung: out[i] = 0.0
        else:
            cum += x[i]
            if cum <= -nguong: dung = True
    return out
for ng_ in (1.0, 1.5, 2.0, 3.0):
    dong(f"Dung giao dich cuoi thang khi lo thang <= -{ng_:.1f}% (% gia tri HD, TB 5 kieu)", dung_thang(ens, ng_))
# loc theo duong von: chi giao dich ngay khi duong von (cong don) ngay truoc > MA 30 ngay cua no
cum = np.cumsum(ens); ma = pd.Series(cum).rolling(30).mean().values; cho = np.r_[False, (cum[:-1] > ma[:-1])]
cho[:30] = True
dong("Loc theo duong von: chi giao dich khi duong von > MA30 (ap hom truoc)", np.where(cho, ens, 0.0))
print(f"      (ngay giao dich: {cho[KC].mean()*100:.0f}% - ngay bo lo se KHONG co lai khi duong von thap)")

# ---------------- 3. KET HOP / LOC HUONG ----------------
print("\n=== 3. KET HOP VOI CACH IT TUONG QUAN + LOC HUONG BANG BE RONG CO PHIEU ===")
# EMA 5/20 + ADX>20 tren nen 5 phut (kieu dung duoc sau phi o KC)
B5 = nen_n(X, 5); nb = B5["C"].shape[1]; h5, l5, c5 = B5["H"].reshape(-1), B5["L"].reshape(-1), B5["C"].reshape(-1)
dau = np.zeros(N * nb, bool); dau[::nb] = True; prev = lambda a: np.r_[False, a[:-1]]
ad5, p5, m5 = adx(h5, l5, c5, 14); ea, eb = ema(c5, 5), ema(c5, 20)
vL = (ea > eb) & prev(ea <= eb) & (ad5 > 20); vS = (ea < eb) & prev(ea >= eb) & (ad5 > 20); z = np.zeros(len(c5), bool)
pos = trang_thai(vL, z, vS, z, dau).reshape(N, nb); lai_ma, _ = chay_vt(pos, B5["C"], s0=3); ma5 = np.asarray(lai_ma, float)
thu = pd.to_datetime(pd.Series(ngay)).dt.dayofweek.values
t2 = np.where(thu == 0, (-(C[:, 240] if False else 0) - 0), 0.0)  # (thay the o duoi - dung nen 1 phut)
# ban khong thu Hai: nen 5 phut dau -> cuoi (dung ma tran 5 phut)
Cb = B5["C"]; Ob = B5["O"]
t2 = np.where(thu == 0, (-(Cb[:, -1] - Ob[:, 0]) - phi(Ob[:, 0])) / Ob[:, 0] * 100, 0.0)
S3 = {"He ghep 5 kieu": ens, "EMA5/20 + ADX>20 (5p)": ma5, "Ban khong thu Hai": t2}
ten = list(S3); Mc = np.corrcoef(np.array([S3[t][KC] for t in ten]))
print("   Tuong quan lai tung ngay (KC):")
for i, t in enumerate(ten): print(f"     {t:24s}" + "".join(f"{Mc[i, j]:8.2f}" for j in range(3)))
for t, x in S3.items(): dong(t, x)
def ket(ws):  # chia von theo trong so (tong = 1)
    return sum(w_ * S3[t] for t, w_ in ws.items())
dong("Ghep 5 kieu (70%) + EMA/ADX (30%)", ket({"He ghep 5 kieu": 0.7, "EMA5/20 + ADX>20 (5p)": 0.3}))
dong("Ghep 5 kieu (50%) + EMA/ADX (50%)", ket({"He ghep 5 kieu": 0.5, "EMA5/20 + ADX>20 (5p)": 0.5}))
dong("Ghep 5 kieu (60%) + EMA/ADX (30%) + ban khong thu Hai (10%)", ket({"He ghep 5 kieu": 0.6, "EMA5/20 + ADX>20 (5p)": 0.3, "Ban khong thu Hai": 0.1}))
# BE RONG tu he co phieu (cache ngay den het du lieu): % ma dong cua > SMA50; VN-Index > SMA20
nen_dai = json.load(open(GOC + "nen_dai.json")); vni = json.load(open(GOC + "vnindex_dai.json"))
tat = sorted({b["t"] for b in vni}); idx = {d: i for i, d in enumerate(tat)}; tren = np.zeros(len(tat)); tong = np.zeros(len(tat))
for ma_, bars in nen_dai.items():
    cl = pd.Series([b["c"] for b in bars]); s50 = cl.rolling(50).mean().values
    for i, b in enumerate(bars):
        j = idx.get(b["t"])
        if j is not None and not np.isnan(s50[i]): tong[j] += 1; tren[j] += cl.iloc[i] > s50[i]
be_rong = np.where(tong > 50, tren / np.maximum(tong, 1) * 100, np.nan)
vc = pd.Series([b["c"] for b in vni]); vsma20 = vc.rolling(20).mean().values
bre = {d: be_rong[idx[d]] for d in tat}; vtr = {d: (vc.iloc[idx[d]] > vsma20[idx[d]]) for d in tat}
brs = pd.Series(be_rong, index=tat)
bre_change = (brs - brs.shift(5)).shift(1)  # thay doi be rong 5 phien, lay den hom truoc (khong nhin truoc)
vtr_prev = pd.Series([vtr[d] for d in tat], index=tat).shift(1)
cut = "2026-10-13"
def loc_huong(kieu):
    def f(a, p):
        d = ngay[a]
        if d > cut or d not in bre_change.index: return True
        if kieu == "be_rong":
            v = bre_change.get(d, np.nan)
            return True if np.isnan(v) else (p > 0) == (v > 0)
        v = vtr_prev.get(d)
        return True if v is None or pd.isna(v) else (p > 0) == bool(v)
    return f
mm = np.array([x <= cut for x in ngay])
base = np.mean([chuoi(g) for g in SYS.values()], axis=0)
for ten_, f in (("Chi MUA khi be rong 5 phien tang / chi BAN khi giam", loc_huong("be_rong")), ("Chi MUA khi VN-Index > SMA20 / chi BAN khi duoi", loc_huong("vni"))):
    y = np.mean([chuoi(g, f) for g in SYS.values()], axis=0)
    D, V = tk(y, dK), tk(y, KC & mm); Db, Vb = tk(base, dK), tk(base, KC & mm)
    print(f"   {ten_:55s} | KP {D['nam']:6.1f}%/nam (co so {Db['nam']:5.1f}) Sh {D['sh']:5.2f} | KC den 13/10 {V['nam']:6.1f}%/nam (co so {Vb['nam']:5.1f}) Sh {V['sh']:5.2f} sut {V['dd']:6.1f}% (co so {Vb['dd']:6.1f}%)")
