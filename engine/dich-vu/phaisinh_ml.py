# PHAI SINH VN30F1M - thu HOC MAY chon ngay cho kieu pha vo khoang mo cua 15 phut (ORB 15): mo hinh du doan lai / lo cua lenh ORB hom do tu thong tin co luc 9:15,
# hoc cuon chieu theo nam (chi hoc cac nam truoc), roi so "chi danh khi mo hinh du doan duong" voi "danh deu moi ngay".
# Chay: PYTHONPATH=<pylib> python engine/dich-vu/phaisinh_ml.py
import numpy as np, pandas as pd, lightgbm as lgb, warnings
from phaisinh_chung import nap, phi, MOC
warnings.filterwarnings("ignore")
X = nap(); ngay, O, H, L, C, V, ATC, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["V"], X["ATC"], X["sauDao"]
N = len(ngay); pATC = np.r_[np.nan, ATC[:-1]]; ser = pd.Series(ATC)
rows = []
for a in range(N):
    o, h, l, c = O[a], H[a], L[a], C[a]; hi, lo = h[:15].max(), l[:15].min(); p = 0
    for k in range(15, 180):
        if c[k] > hi: p = 1
        elif c[k] < lo: p = -1
        if p: break
    if not p: continue
    gia = c[k]; st = lo if p > 0 else hi; ra = c[240]
    for j in range(k + 1, 241):
        if p > 0 and l[j] <= st: ra = min(o[j], st); break
        if p < 0 and h[j] >= st: ra = max(o[j], st); break
    rows.append(dict(a=a, ngay=ngay[a], phia=p, kVao=k, pct=(p * (ra - gia) - phi(gia)) / gia * 100))
T = pd.DataFrame(rows); a = T.a.values
bd = pd.Series(H.max(axis=1) - L.min(axis=1)) / pd.Series(O[:, 0]) * 100
T["gap"] = np.where(sauDao[a], 0, (O[a, 0] / pATC[a] - 1) * 100)
T["r15"] = (C[a, 14] / O[a, 0] - 1) * 100
T["rong"] = (H[a, :15].max(axis=1) - L[a, :15].min(axis=1)) / O[a, 0] * 100
T["rongTyLe"] = T.rong / bd.rolling(20).mean().shift(1).values[a]
v15 = pd.Series(V[:, :15].sum(axis=1)); T["kl15"] = (v15 / v15.rolling(20).mean().shift(1)).values[a]
T["bd20"] = bd.rolling(20).mean().shift(1).values[a]; T["bdHomQua"] = bd.shift(1).values[a]
dch = ser.pct_change() * 100
for n in (1, 5, 20): T[f"xh{n}"] = (ser / ser.shift(n) - 1).shift(1).values[a] * 100
T["ma20"] = ((ser / ser.rolling(20).mean() - 1) * 100).shift(1).values[a]
T["vtHomQua"] = pd.Series((ATC - L.min(axis=1)) / (H.max(axis=1) - L.min(axis=1))).shift(1).values[a]
T["thu"] = pd.to_datetime(T.ngay).dt.dayofweek; T["kVao"] = T.kVao; T["cungGap"] = np.sign(T.gap) * T.phia; T["cungXh"] = np.sign(T.ma20) * T.phia
dao = np.where(X["dao"])[0]; T["denDaoHan"] = [int(dao[dao >= x][0] - x) if (dao >= x).any() else 20 for x in a]
T["orbHomQua"] = T.pct.shift(1)
F = ["gap", "r15", "rong", "rongTyLe", "kl15", "bd20", "bdHomQua", "xh1", "xh5", "xh20", "ma20", "vtHomQua", "thu", "phia", "cungGap", "cungXh", "denDaoHan", "orbHomQua"]
T["nam"] = T.ngay.str[:4].astype(int); T["du"] = np.nan
for Y in range(2021, 2027):
    tr, te = T[T.nam < Y], T.nam == Y
    if te.sum() == 0: continue
    du = np.zeros(te.sum())
    for s in (1, 2, 3):
        du += lgb.LGBMRegressor(objective="huber", alpha=0.5, n_estimators=150, learning_rate=0.03, num_leaves=7, min_data_in_leaf=40, feature_fraction=0.7, bagging_fraction=0.7, bagging_freq=1, lambda_l2=5, verbose=-1, random_state=s).fit(tr[F], tr.pct.clip(-1.5, 3)).predict(T.loc[te, F]) / 3
    T.loc[te, "du"] = du
Q = T[T.du.notna()]
def tk(g, ten):
    nd = g.groupby("ngay").pct.sum(); e = nd.cumsum(); so_nam = Q.ngay.nunique() / 250
    print(f"   {ten:52s} n={len(g):4d} | TB {g.pct.mean():.3f}% | thang {(g.pct>0).mean()*100:.0f}% | tong {g.pct.sum()/so_nam:5.1f}%/nam | sut toi da {(e-e.cummax()).min():5.1f}% | Sharpe {nd.mean()/nd.std()*np.sqrt(len(nd)/so_nam):.2f}")
print(f"NGOAI MAU 2021-2026 ({Q.ngay.nunique()} ngay co lenh ORB 15)")
tk(Q, "Danh deu moi ngay (ORB 15 goc)")
tk(Q[Q.du > 0], "Chi danh khi mo hinh du doan > 0")
tk(Q[Q.du > Q.du.median()], "Chi danh nua so ngay mo hinh cham cao hon")
tk(Q[Q.du <= Q.du.median()], "Nua so ngay mo hinh cham THAP hon")
tk(Q[Q.du <= 0], "Cac ngay mo hinh du doan <= 0")
from scipy.stats import spearmanr
print(f"   Tuong quan hang giua du doan va ket qua: {spearmanr(Q.du, Q.pct).statistic:.3f} | theo nam: " + "  ".join(f"{y}: {spearmanr(g.du, g.pct).statistic:.2f}" for y, g in Q.groupby("nam")))
print("   So sanh voi cac luat don gian tren cung giai doan:")
tk(Q[Q.thu == 0], "chi thu Hai"); tk(Q[Q.gap.abs() >= 0.3], "chi ngay gap >= 0,3%"); tk(Q[Q.cungXh > 0], "chi cung huong xu huong ngay (MA20)"); tk(Q[(Q.thu != 2)], "bo thu Tu")
