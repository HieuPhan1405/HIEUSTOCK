# PHAI SINH VN30F1M - MO RONG 3 (2026-10-14): (1) dao sau kieu PHA VO BIEN DONG, (2) cac kieu tot nhat co TRUNG nhau khong va ghep lai thi sao, (3) mo hinh HOC MAY tong hop.
# Khung chung: bieu phi MBS + truot gia 0,4 diem (tru khi ghi khac); KP = den 06/2022, KC = tu 07/2022; % gia tri hop dong; dong het truoc 14:29.
# Chay: PYTHONPATH=<pylib co lightgbm> python engine/dich-vu/phaisinh_them3.py
import numpy as np, pandas as pd, warnings
from phaisinh_chung import nap, nap_chi_so, phi, chay_lenh, MOC, PHI_CO_DINH
warnings.filterwarnings("ignore")
X = nap(); ngay, O, H, L, C, V, ATC, sauDao, dao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["V"], X["ATC"], X["sauDao"], X["dao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); nam = np.array([x[:4] for x in ngay])
pATC = np.r_[np.nan, ATC[:-1]]; dH = H.max(axis=1); dL = L.min(axis=1); bd = dH - dL; pBD = np.r_[np.nan, bd[:-1]]
thu = pd.to_datetime(pd.Series(ngay)).dt.dayofweek.values
tp = (H + L + C) / 3; VW = np.cumsum(tp * np.maximum(V, 1e-9), axis=1) / np.cumsum(np.maximum(V, 1e-9), axis=1)
ok = lambda a: a >= 1 and not sauDao[a] and not np.isnan(pBD[a])

def vb(k_, cat="mo", phia=None):  # tra ve list (a, phia, vao, ra)
    gd = []
    for a in range(N):
        if not ok(a): continue
        o0 = O[a, 0]; tr, du = o0 + k_ * pBD[a], o0 - k_ * pBD[a]
        for k in range(1, 180):
            p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
            if not p: continue
            if phia and p != phia: break
            gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du)
            j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, gia, cat=(o0 if cat == "mo" else (du if p > 0 else tr)))
            gd.append((a, p, gia, ra)); break
    return gd
def orb(Nm):
    gd = []
    for a in range(N):
        hi, lo = H[a, :Nm].max(), L[a, :Nm].min()
        for k in range(Nm, 180):
            p = 1 if C[a, k] > hi else -1 if C[a, k] < lo else 0
            if p:
                j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, C[a, k], cat=lo if p > 0 else hi); gd.append((a, p, C[a, k], ra)); break
    return gd
def lai_ngay(gd, truot=0.4):
    x = np.zeros(N)
    for a, p, v, r in gd: x[a] += (p * (r - v) - phi(v, truot)) / v * 100
    return x
def tt(x, m):
    y = x[m]; e = np.cumsum(y); return f"{y.sum()/(m.sum()/250):6.1f}%/nam Sh {y.mean()/y.std()*np.sqrt(250):5.2f} sut {(e-np.maximum.accumulate(e)).min():6.1f}%"

print("=== 1. PHA VO BIEN DONG: dat lenh dung tai gia mo cua +- k x bien do hom truoc; khop thi giu den 14:29 ===")
G = {}
for k_ in (0.2, 0.25, 0.3, 0.4, 0.5, 0.6):
    for cat in ("mo", "doi"):
        g = vb(k_, cat); G[(k_, cat)] = g; x = lai_ngay(g)
        print(f"   k = {k_:<4} cat lo o {'gia mo cua ' if cat == 'mo' else 'muc doi dien'} | KP {tt(x, dK)} | KC {tt(x, ~dK)} | {len(g)/N:.2f} lenh/ngay | thang {np.mean([(p*(r-v)-phi(v)) > 0 for a, p, v, r in g])*100:.0f}%")
print("   -- theo tung nam (% / nam), truot gia 0,4 --")
for key in ((0.3, "mo"), (0.3, "doi"), (0.5, "mo")):
    x = lai_ngay(G[key]); print(f"   k = {key[0]} cat lo {'mo cua' if key[1]=='mo' else 'doi dien'}: " + "  ".join(f"{y}: {x[nam == y].sum():5.1f}" for y in sorted(set(nam))))
print("   -- do nhay truot gia (k = 0,3, cat lo o gia mo cua): tong %/nam KP | KC --")
for tr in (0.0, 0.2, 0.4, 0.6, 0.8, 1.2, 1.6):
    x = lai_ngay(G[(0.3, "mo")], tr); print(f"   truot gia {tr:.1f} diem / vong: KP {x[dK].sum()/(dK.sum()/250):6.1f}% | KC {x[~dK].sum()/((~dK).sum()/250):6.1f}%")
xm = lai_ngay(vb(0.3, "mo", 1)); xb = lai_ngay(vb(0.3, "mo", -1)); print(f"   chi MUA: KP {tt(xm, dK)} | KC {tt(xm, ~dK)}"); print(f"   chi BAN: KP {tt(xb, dK)} | KC {tt(xb, ~dK)}")
x = lai_ngay(G[(0.3, "mo")]); print("   theo thu (k = 0,3): " + " | ".join(f"T{t+2}: KP {x[dK & (thu==t)].sum()/(dK.sum()/250):.1f} KC {x[~dK & (thu==t)].sum()/((~dK).sum()/250):.1f}" for t in range(5)))

print("\n=== 2. CAC KIEU TOT NHAT CO TRUNG NHAU KHONG? (tuong quan lai / lo tung ngay; 1 = giong het) ===")
S = {"ORB5": lai_ngay(orb(5)), "ORB15": lai_ngay(orb(15)), "ORB30": lai_ngay(orb(30)), "BD0.3": lai_ngay(G[(0.3, "mo")]), "BD0.5": lai_ngay(G[(0.5, "mo")]), "BD0.3doi": lai_ngay(G[(0.3, "doi")])}
g5 = []
for a in range(N):
    h5, l5, c5, o5 = H[a, :5].max(), L[a, :5].min(), C[a, 4], O[a, 0]
    if h5 - l5 < 0.0015 * o5: continue
    v = (c5 - l5) / (h5 - l5)
    if v >= 0.75: j, ra = chay_lenh(O[a], H[a], L[a], C[a], 1, 4, c5, cat=l5); g5.append((a, 1, c5, ra))
    elif v <= 0.25: j, ra = chay_lenh(O[a], H[a], L[a], C[a], -1, 4, c5, cat=h5); g5.append((a, -1, c5, ra))
S["Nen5dau"] = lai_ngay(g5)
S["BanT2"] = np.where(thu == 0, (-(C[:, 240] - C[:, 0]) - phi(C[:, 0])) / C[:, 0] * 100, 0.0)
ten = list(S); M = np.corrcoef(np.array([S[t] for t in ten]))
print("   " + " " * 10 + "".join(f"{t:>10s}" for t in ten))
for i, t in enumerate(ten): print(f"   {t:10s}" + "".join(f"{M[i, j]:10.2f}" for j in range(len(ten))))
print("\n   -- ghep (chia deu von cho cac kieu) --")
def ghep(ds, nhan):
    x = np.mean([S[t] for t in ds], axis=0); thg = pd.Series(x, index=ngay).groupby(lambda s: s[:7]).sum(); am = sum(1 for y in sorted(set(nam)) if x[nam == y].sum() < 0)
    print(f"   {nhan:44s} | KP {tt(x, dK)} | KC {tt(x, ~dK)} | thang lai {(thg > 0).mean()*100:.0f}% | thang te nhat {thg.min():5.1f}% | nam lo {am}/9")
    return x
ghep(["ORB15"], "ORB 15 (goc)"); ghep(["BD0.3"], "Pha vo bien dong k = 0,3"); ghep(["ORB5", "ORB15", "ORB30"], "ORB 5 + 15 + 30")
ghep(["ORB15", "BD0.3"], "ORB 15 + bien dong 0,3"); xg = ghep(["ORB5", "ORB15", "ORB30", "BD0.3", "BD0.5"], "ORB 5 + 15 + 30 + bien dong 0,3 + 0,5")
ghep(["ORB15", "BD0.3", "Nen5dau"], "ORB 15 + bien dong 0,3 + nen 5 phut dau"); ghep(["ORB5", "ORB15", "ORB30", "BD0.3", "BD0.5", "BanT2"], "5 kieu pha vo + ban khong thu Hai")
print("   Ghep 5 kieu pha vo theo nam: " + "  ".join(f"{y}: {xg[nam == y].sum():5.1f}%" for y in sorted(set(nam))))
for tr in (0.2, 0.4, 0.8, 1.2):
    y = np.mean([lai_ngay(orb(5), tr), lai_ngay(orb(15), tr), lai_ngay(orb(30), tr), lai_ngay(G[(0.3, "mo")], tr), lai_ngay(G[(0.5, "mo")], tr)], axis=0); print(f"   Ghep 5 kieu, truot gia {tr}: KP {tt(y, dK)} | KC {tt(y, ~dK)}")

print("\n=== 3. MO HINH HOC MAY TONG HOP: tai moi moc gio, du doan loi suat tu luc do den 14:29; hoc cuon chieu theo nam (ngoai mau 2021-2026) ===")
try:
    import lightgbm as lgb
    I = nap_chi_so(ngay); ser = pd.Series(ATC); ma20 = (ser / ser.rolling(20).mean() - 1).shift(1).values * 100; r5d = (ser / ser.shift(5) - 1).shift(1).values * 100; r1d = (ser / ser.shift(1) - 1).shift(1).values * 100
    bdTB = pd.Series(bd / O[:, 0] * 100).rolling(20).mean().shift(1).values; vtHQ = pd.Series((ATC - dL) / np.where(bd == 0, 1, bd)).shift(1).values
    daoIdx = np.where(dao)[0]; denDao = np.array([int(daoIdx[daoIdx >= a][0] - a) if (daoIdx >= a).any() else 20 for a in range(N)])
    MOCK = [14, 29, 44, 59, 89, 119, 150, 165, 195]; r1p = np.diff(C, axis=1) / C[:, :-1] * 100
    rows = []
    for a in range(21, N):
        cumV = np.cumsum(V[a]); hi15, lo15 = H[a, :15].max(), L[a, :15].min()
        for k in MOCK:
            c = C[a, k]; hi, lo = H[a, :k + 1].max(), L[a, :k + 1].min(); f = dict(a=a, k=k, y=(C[a, 240] / c - 1) * 100)
            f["rMo"] = (c / O[a, 0] - 1) * 100; f["gap"] = 0.0 if sauDao[a] else (O[a, 0] / pATC[a] - 1) * 100
            for n_ in (5, 15, 30, 60): f[f"r{n_}"] = (c / C[a, max(0, k - n_)] - 1) * 100
            f["vt"] = (c - lo) / (hi - lo) if hi > lo else 0.5; f["bdNay"] = (hi - lo) / O[a, 0] * 100 / bdTB[a] if bdTB[a] > 0 else np.nan
            f["vwap"] = (c / VW[a, k] - 1) * 100; f["kl"] = cumV[k] / np.mean([V[b, :k + 1].sum() for b in range(a - 20, a)])
            f["orb"] = 1 if c > hi15 else -1 if c < lo15 else 0; f["cachOrbTren"] = (c / hi15 - 1) * 100; f["cachOrbDuoi"] = (c / lo15 - 1) * 100
            f["bdTruoc"] = (c - O[a, 0]) / pBD[a] if pBD[a] > 0 else np.nan; f["bdPhut"] = r1p[a, :k].std()
            f["r1d"] = r1d[a]; f["r5d"] = r5d[a]; f["ma20"] = ma20[a]; f["vtHQ"] = vtHQ[a]; f["bdTB"] = bdTB[a]; f["thu"] = thu[a]; f["denDao"] = denDao[a]
            f["basis"] = (c / I[a, k] - 1) * 100 if not np.isnan(I[a, k]) else np.nan
            rows.append(f)
    T = pd.DataFrame(rows); T["nam"] = [int(ngay[a][:4]) for a in T.a]; F = [c for c in T.columns if c not in ("a", "y", "nam")]; T["du"] = np.nan
    for Y in range(2021, 2027):
        tr_, te = T[T.nam < Y], T.nam == Y
        if te.sum() == 0: continue
        du = np.zeros(te.sum())
        for s in (1, 2, 3): du += lgb.LGBMRegressor(objective="huber", alpha=0.5, n_estimators=200, learning_rate=0.03, num_leaves=15, min_data_in_leaf=100, feature_fraction=0.7, bagging_fraction=0.7, bagging_freq=1, lambda_l2=10, verbose=-1, random_state=s).fit(tr_[F], tr_.y.clip(-2, 2)).predict(T.loc[te, F]) / 3
        T.loc[te, "du"] = du
    Q = T[T.du.notna()].copy(); Q["gia"] = [C[a, k] for a, k in zip(Q.a, Q.k)]; nNgay = Q.a.nunique()
    from scipy.stats import spearmanr
    gio = lambda k: f"{(540 + k if k <= 150 else 780 + k - 151)//60:02d}:{(540 + k if k <= 150 else 780 + k - 151)%60:02d}"
    print(f"   {'moc gio':8s} {'tuong quan hang':>16s} | danh khi |du doan| >= 0,05% | >= 0,10% | >= 0,15%   (tong %/nam sau phi, Sharpe, so lenh/ngay)")
    for k in MOCK:
        q = Q[Q.k == k]; dong_ = f"   {gio(k + 1):8s} {spearmanr(q.du, q.y).statistic:16.3f} |"
        for th_ in (0.05, 0.10, 0.15):
            z = q[q.du.abs() >= th_]; pnl = np.sign(z.du) * z.y - phi(z.gia) / z.gia * 100; x = np.zeros(N); np.add.at(x, z.a.values, pnl.values); x = x[sorted(Q.a.unique())]
            dong_ += f" {pnl.sum()/(nNgay/250):6.1f}%/nam Sh {x.mean()/x.std()*np.sqrt(250) if x.std() > 0 else 0:5.2f} ({len(z)/nNgay:.2f}) |"
        print(dong_)
    # 1 lenh / ngay: moc dau tien co |du doan| >= 0,10%, giu den 14:29
    z = Q[Q.du.abs() >= 0.10].sort_values(["a", "k"]).groupby("a").head(1); pnl = np.sign(z.du) * z.y - phi(z.gia) / z.gia * 100; x = np.zeros(N); np.add.at(x, z.a.values, pnl.values); idx = sorted(Q.a.unique()); x = x[idx]; e = np.cumsum(x)
    print(f"   Moi ngay 1 lenh (moc dau tien |du doan| >= 0,10%): {pnl.sum()/(nNgay/250):.1f}%/nam | Sharpe {x.mean()/x.std()*np.sqrt(250):.2f} | sut {(e-np.maximum.accumulate(e)).min():.1f}% | {len(z)/nNgay:.2f} lenh/ngay | thang {(pnl>0).mean()*100:.0f}%")
    xo = S["ORB15"][idx]; xv = S["BD0.3"][idx]; print(f"   So sanh cung giai doan: ORB 15 {xo.sum()/(nNgay/250):.1f}%/nam (Sh {xo.mean()/xo.std()*np.sqrt(250):.2f}) | bien dong 0,3 {xv.sum()/(nNgay/250):.1f}%/nam (Sh {xv.mean()/xv.std()*np.sqrt(250):.2f}) | tuong quan mo hinh voi ORB 15: {np.corrcoef(x, xo)[0,1]:.2f}")
    imp = pd.Series(lgb.LGBMRegressor(objective="huber", alpha=0.5, n_estimators=200, learning_rate=0.03, num_leaves=15, min_data_in_leaf=100, verbose=-1, random_state=1).fit(T[F], T.y.clip(-2, 2)).booster_.feature_importance("gain"), index=F).sort_values(ascending=False)
    print("   Mo hinh dua vao: " + " | ".join(f"{k} {v/imp.sum()*100:.0f}%" for k, v in imp.head(10).items()))
except ImportError:
    print("   (bo qua: chua cai lightgbm)")
