# NGHIEN CUU QUANT (2026-10-12): huan luyen / kiem tra CUON CHIEU tren bang lenh (xuat tu nghienCuuQuant_xuat.mjs).
# Chay: python nghienCuuQuant_cuonChieu.py <lenh.csv>
# Moi ky kiem tra (nua nam, 2021H1 -> 2026H2): chi huan luyen bang lenh DA KET THUC (ngay thoat < dau ky kiem tra), khong nhin tuong lai.
import sys, warnings
import numpy as np, pandas as pd
from scipy.stats import spearmanr
from sklearn.linear_model import Ridge, LogisticRegression
from sklearn.ensemble import HistGradientBoostingRegressor
warnings.filterwarnings("ignore")

d = pd.read_csv(sys.argv[1]).sort_values(["ngayVao", "ma"]).reset_index(drop=True)
Y = "rB"  # R-multiple, cat lo day 5 phien, chot tung phan (goi G / B trong nghien cuu truoc)
d["y"] = d[Y].clip(-3, 6)          # muc tieu huan luyen: cat duoi/tren de khong bi lenh stop qua nho keo lech
d["yE"] = d[Y].clip(-5, 10)        # R dung de DANH GIA (cat duoi/tren cho on dinh)
BO = {"ma", "ngay", "ngayVao", "ngayThoatB", "loai", "rA", "retA", "rB", "retB", "rC", "retC", "phienB", "y", "yE", "rSizeA"}
FEATS = [c for c in d.columns if c not in BO]
print("so lenh", len(d), "| so dac trung", len(FEATS))

# ---- cac ky kiem tra
moc = pd.date_range("2021-01-01", "2026-07-01", freq="6MS")
ky = [(a, b) for a, b in zip(moc, list(moc[1:]) + [pd.Timestamp("2027-01-01")])]

def chuan_hoa(tr, te):
    """Xep hang phan vi theo tap huan luyen (chong ngoai lai) roi dua ve [-1,1]; thieu = trung vi huan luyen (=0)."""
    A, B = [], []
    for c in FEATS:
        s = np.sort(tr[c].dropna().values)
        if len(s) < 50 or s[0] == s[-1]:
            A.append(np.zeros(len(tr))); B.append(np.zeros(len(te))); continue
        f = lambda x: np.where(np.isnan(x), 0.0, np.searchsorted(s, x, side="right") / len(s) * 2 - 1)
        A.append(f(tr[c].values)); B.append(f(te[c].values))
    return np.column_stack(A), np.column_stack(B)

def diem_luat(tr, te, k=10):
    """Tai hien 'Diem chat luong 0-10' nhung chon luat CHI TU tap huan luyen cua tung ky."""
    luat = []
    for c in FEATS:
        v = tr[c].dropna()
        if len(v) < 300 or v.nunique() < 5: continue
        med = v.median()
        hi, lo = tr.loc[tr[c] > med, "y"], tr.loc[tr[c] <= med, "y"]
        if len(hi) < 100 or len(lo) < 100: continue
        luat.append((abs(hi.mean() - lo.mean()), c, med, 1 if hi.mean() > lo.mean() else 0))
    luat.sort(reverse=True)
    return sum(((te[c] > med).astype(int) == h).astype(int) for _, c, med, h in luat[:k]).values + np.random.RandomState(0).rand(len(te)) * 1e-3

mo_hinh = ["Luat 0-10 (huan luyen lai)", "Ridge (du doan R)", "Logistic (xac suat thang)", "GBM nong (du doan R)"]
d["_d"] = pd.to_datetime(d.ngayVao); d["_t"] = pd.to_datetime(d.ngayThoatB)
for m in mo_hinh: d[m] = np.nan
for nam, c in [("engine rank", "rank"), ("engine conf", "conf"), ("engine diem", "diem")]: d[nam] = d[c]
d["ky"] = -1
for ik, (a, b) in enumerate(ky):
    te_i = d.index[(d._d >= a) & (d._d < b)]
    tr = d[d._t < a]
    if len(te_i) == 0 or len(tr) < 800: continue
    te = d.loc[te_i]
    d.loc[te_i, "ky"] = ik
    Xtr, Xte = chuan_hoa(tr, te)
    d.loc[te_i, mo_hinh[0]] = diem_luat(tr, te)
    d.loc[te_i, mo_hinh[1]] = Ridge(alpha=300).fit(Xtr, tr.y).predict(Xte)
    d.loc[te_i, mo_hinh[2]] = LogisticRegression(C=0.02, max_iter=500).fit(Xtr, (tr.y > 0).astype(int)).predict_proba(Xte)[:, 1]
    d.loc[te_i, mo_hinh[3]] = HistGradientBoostingRegressor(max_depth=3, max_iter=120, learning_rate=0.04, min_samples_leaf=60, l2_regularization=5.0, random_state=0).fit(tr[FEATS].values, tr.y).predict(te[FEATS].values)

oos = d[d.ky >= 0].copy()
print(f"OOS: {len(oos)} lenh, {oos.ngayVao.min()} -> {oos.ngayVao.max()} | TB R(co tran) {oos.yE.mean():.3f} | thang {100*(oos.rB>0).mean():.1f}%\n")
diem_ten = mo_hinh + ["engine rank", "engine conf", "engine diem"]

def pf(x):
    g, l = x[x > 0].sum(), -x[x <= 0].sum()
    return g / l if l > 0 else np.nan

def boot_khac(a, b, n=2000, seed=1):
    r = np.random.RandomState(seed); a, b = np.asarray(a), np.asarray(b)
    dl = [r.choice(a, len(a)).mean() - r.choice(b, len(b)).mean() for _ in range(n)]
    return np.percentile(dl, [2.5, 97.5])

# ================= PHAN 2: mo hinh co loc lenh tot khong? =================
print("=" * 100)
print("PHAN 2. CHAT LUONG DU DOAN NGOAI MAU (cuon chieu): IC Spearman(diem, R) theo nam, va top 40% vs 60% con lai")
print("=" * 100)
print(f"{'mo hinh':32s} {'IC chung':>8s} " + " ".join(f"{y:>6d}" for y in range(2021, 2027)) + f" | {'top40 R':>8s} {'thang%':>7s} {'PF':>5s} | {'60% con':>8s} | {'chenh [95% CI]':>22s} {'nam tot':>8s}")
oos["nam"] = oos._d.dt.year
for m in diem_ten:
    x = oos.dropna(subset=[m])
    ic = spearmanr(x[m], x.yE)[0]
    ics = [spearmanr(g[m], g.yE)[0] if len(g) > 30 else np.nan for _, g in x.groupby("nam")]
    # top 40% theo xep hang trong tung ky (khong dung thong tin ngoai ky)
    x = x.assign(p=x.groupby("ky")[m].rank(pct=True))
    top, rest = x[x.p > 0.6], x[x.p <= 0.6]
    lo, hi = boot_khac(top.yE, rest.yE)
    nt = sum(1 for _, g in x.groupby("nam") if g[g.p > 0.6].yE.mean() > g[g.p <= 0.6].yE.mean())
    print(f"{m:32s} {ic:8.3f} " + " ".join(f"{v:6.2f}" for v in ics) + f" | {top.yE.mean():8.3f} {100*(top.rB>0).mean():7.1f} {pf(top.yE):5.2f} | {rest.yE.mean():8.3f} | {top.yE.mean()-rest.yE.mean():+.3f} [{lo:+.3f},{hi:+.3f}] {nt}/{x.nam.nunique()}")

# chi tu 2022.5 (cung moc voi nghien cuu truoc)
print("\n-- Chi tu 2022.5 (cung moc ngoai mau voi bao cao truoc): top 40% vs 60% con lai --")
y2 = oos[oos._d >= "2022-05-01"]
for m in diem_ten:
    x = y2.dropna(subset=[m]); x = x.assign(p=x.groupby("ky")[m].rank(pct=True)); top, rest = x[x.p > 0.6], x[x.p <= 0.6]
    lo, hi = boot_khac(top.yE, rest.yE)
    print(f"{m:32s} top40 {top.yE.mean():+.3f}R thang {100*(top.rB>0).mean():4.1f}% PF {pf(top.yE):4.2f} | con lai {rest.yE.mean():+.3f}R | chenh {top.yE.mean()-rest.yE.mean():+.3f} [{lo:+.3f},{hi:+.3f}]")

# ================= PHAN 1: chon top-K khi nhieu tin hieu (so slot co han) =================
print("\n" + "=" * 100)
print("PHAN 1. DANH MUC CO HAN SLOT: moi ngay chi con K slot trong; chon tin hieu theo diem nao thi tot nhat? (1 lenh = 1R rui ro)")
print("=" * 100)

def mo_phong(x, diem, K, seed=None, nguong=None):
    """x: lenh OOS sap theo ngay vao. Moi ngay vao, con trong slot thi chon cac lenh co diem cao nhat (diem=None -> ngau nhien)."""
    r = np.random.RandomState(seed)
    mo, kq = [], []  # mo: danh sach ngay thoat cua vi the dang mo
    for ngay, g in x.groupby("_d", sort=True):
        mo = [t for t in mo if t >= ngay]
        con = K - len(mo)
        if con <= 0: continue
        s = r.rand(len(g)) if diem is None else g[diem].values.copy()
        if nguong is not None and diem is not None: s = np.where(s >= nguong, s, -np.inf)
        for j in np.argsort(-s)[:con]:
            if not np.isfinite(s[j]): break
            row = g.iloc[j]; mo.append(row._t); kq.append((row._d, row.yE, row.rB > 0))
    return pd.DataFrame(kq, columns=["d", "R", "w"])

def tom_tat(k, nam_tu=None):
    k = k if nam_tu is None else k[k.d >= nam_tu]
    k = k.sort_values("d"); c = k.R.cumsum(); dd = (c.cummax() - c).max()
    nam = (k.d.max() - k.d.min()).days / 365.25
    return len(k), k.R.mean(), 100 * k.w.mean(), pf(k.R), k.R.sum() / nam, dd

oos_s = oos.sort_values(["_d", "ma"]).reset_index(drop=True)
for K in (3, 5):
    for ten_moc, tu in [("TOAN BO OOS (2021 -> 2026.9)", None), ("TU 2022.5", pd.Timestamp("2022-05-01"))]:
        print(f"\n-- K = {K} slot | {ten_moc} --")
        print(f"{'cach chon':36s} {'so lenh':>7s} {'R/lenh':>7s} {'thang%':>7s} {'PF':>5s} {'R/nam':>7s} {'rut von R':>9s}")
        kq = [tom_tat(mo_phong(oos_s, None, K, seed=s), tu) for s in range(60)]
        print(f"{'NGAU NHIEN (TB 60 lan)':36s} {np.mean([a[0] for a in kq]):7.0f} {np.mean([a[1] for a in kq]):7.3f} {np.mean([a[2] for a in kq]):7.1f} {np.nanmean([a[3] for a in kq]):5.2f} {np.mean([a[4] for a in kq]):7.1f} {np.mean([a[5] for a in kq]):9.1f}")
        for m in diem_ten:
            a = tom_tat(mo_phong(oos_s.dropna(subset=[m]), m, K), tu)
            print(f"{m:36s} {a[0]:7d} {a[1]:7.3f} {a[2]:7.1f} {a[3]:5.2f} {a[4]:7.1f} {a[5]:9.1f}")

# tham do: chi vao khi diem vuot nguong (khong chon day slot) - nguong theo phan vi trong ky
print("\n-- K=5, chi vao lenh khi diem thuoc top X% cua ky (phan vi tinh trong ky, tu 2022.5) --")
for m in [mo_hinh[1], mo_hinh[2], mo_hinh[3], mo_hinh[0]]:
    x = oos_s.dropna(subset=[m]).copy(); x["p"] = x.groupby("ky")[m].rank(pct=True)
    for q in (0.0, 0.4, 0.6, 0.8):
        a = tom_tat(mo_phong(x, "p", 5, nguong=q + 1e-9 if q > 0 else None), pd.Timestamp("2022-05-01"))
        print(f"{m:32s} top {int((1-q)*100):3d}% -> {a[0]:4d} lenh | R/lenh {a[1]:+.3f} | thang {a[2]:4.1f}% | PF {a[3]:4.2f} | R/nam {a[4]:+5.1f} | rut von {a[5]:5.1f}R")

# luu diem OOS de dung lai
oos.drop(columns=["_d", "_t"]).to_csv(sys.argv[1].replace(".csv", "_oos.csv"), index=False)
