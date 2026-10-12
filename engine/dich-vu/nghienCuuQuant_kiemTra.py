# NGHIEN CUU QUANT (2026-10-12) - kiem tra bo sung: (a) tai hien cach chia co dinh cu, (b) co dac trung nao thuc su co tin hieu khi kiem soat da kiem dinh (hoan vi),
# (c) che do thi truong, (d) cong suat thong ke (sai so chuan). Chay: python nghienCuuQuant_kiemTra.py <lenh.csv>
import sys, warnings
import numpy as np, pandas as pd
from scipy.stats import spearmanr
warnings.filterwarnings("ignore")
d = pd.read_csv(sys.argv[1]).sort_values(["ngayVao", "ma"]).reset_index(drop=True)
d["yE"] = d.rB.clip(-5, 10); d["y"] = d.rB.clip(-3, 6); d["nam"] = d.ngayVao.str[:4].astype(int)
BO = {"ma", "ngay", "ngayVao", "ngayThoatB", "loai", "rA", "retA", "rB", "retB", "rC", "retC", "phienB", "y", "yE", "rSizeA", "nam"}
F = [c for c in d.columns if c not in BO]
oos = d[d.ngayVao >= "2021-01-01"]
print(f"[cong suat] OOS 2021+: {len(oos)} lenh, do lech chuan R = {oos.yE.std():.2f} => sai so chuan cua R trung binh = {oos.yE.std()/np.sqrt(len(oos)):.3f}; "
      f"chenh giua 2 nhom 40/60 co CI95 rong ~ +-{1.96*oos.yE.std()*np.sqrt(1/(0.4*len(oos))+1/(0.6*len(oos))):.3f}R\n")

# (a) tai hien: luat chon tu train < 2022.5, kiem tra >= 2022.5
tr, te = d[d.ngayThoatB < "2022-05-01"], d[d.ngayVao >= "2022-05-01"]
luat = []
for c in F:
    v = tr[c].dropna();
    if len(v) < 300 or v.nunique() < 5: continue
    med = v.median(); hi, lo = tr.loc[tr[c] > med, "y"], tr.loc[tr[c] <= med, "y"]
    if len(hi) < 100 or len(lo) < 100: continue
    luat.append((abs(hi.mean() - lo.mean()), c, med, 1 if hi.mean() > lo.mean() else 0))
luat.sort(reverse=True); top10 = luat[:10]
sc = sum(((te[c] > med).astype(int) == h).astype(int) for _, c, med, h in top10)
print("(a) Cach chia co dinh (train < 2022.5, test >= 2022.5), 10 luat chon tu train:", ", ".join(c for _, c, _, _ in top10))
for a, b in [(0, 3), (4, 5), (6, 7), (8, 10)]:
    g = te[(sc >= a) & (sc <= b)]; print(f"   diem {a}-{b}: {len(g):4d} lenh | R(co tran) {g.yE.mean():+.3f} | thang {100*(g.rB>0).mean():4.1f}%")
hi_, lo_ = te[sc >= 7].yE, te[sc <= 5].yE
print(f"   diem>=7 ({len(hi_)}) vs <=5 ({len(lo_)}): chenh R {hi_.mean()-lo_.mean():+.3f}")

# (b) co dac trung nao co tin hieu that? kiem dinh hoan vi (kiem soat do nhieu khi thu 44 dac trung)
x = oos
def tstat(df):
    out = {}
    for c in F:
        s = df[[c, "yE"]].dropna()
        if len(s) < 200 or s[c].nunique() < 3: continue
        r = spearmanr(s[c], s.yE)[0]; out[c] = r * np.sqrt((len(s) - 2) / (1 - r * r))
    return out
th = tstat(x)
rng = np.random.RandomState(7); null_max = []
for _ in range(300):  # hoan vi R trong tung nam (giu dac diem nam), lay |t| lon nhat trong 44 dac trung
    xp = x.copy(); xp["yE"] = xp.groupby("nam")["yE"].transform(lambda s: rng.permutation(s.values))
    null_max.append(max(abs(v) for v in tstat(xp).values()))
nguong = np.percentile(null_max, 95)
print(f"\n(b) |t| lon nhat trong {len(th)} dac trung neu KHONG co tin hieu (hoan vi 300 lan): 95% <= {nguong:.2f}")
print("   Dac trung  | t that  | dau ben vung theo nam (so nam cung dau / tong)")
for c, t in sorted(th.items(), key=lambda kv: -abs(kv[1]))[:12]:
    ys = [np.sign(spearmanr(g[c].dropna(), g.loc[g[c].notna(), "yE"])[0]) for _, g in x.groupby("nam") if g[c].notna().sum() > 40]
    cung = max(sum(1 for v in ys if v > 0), sum(1 for v in ys if v < 0))
    print(f"   {c:12s} | {t:+6.2f} {'**VUOT NGUONG**' if abs(t) > nguong else '(trong vung nhieu)'} | {cung}/{len(ys)}")

# (c) che do thi truong
print("\n(c) R theo che do thi truong (OOS 2021+, theo nam: so nam nhom tot hon):")
for c, ten in [("vniSma200", "VN-Index tren SMA200"), ("rong50", "Do rong >SMA50 (%)"), ("vni20", "VN-Index 20 phien")]:
    s = x.dropna(subset=[c]); med = s[c].median()
    if c == "vniSma200": a, b = s[s[c] > 0], s[s[c] <= 0]
    else: a, b = s[s[c] > med], s[s[c] <= med]
    ys = [(g[g[c] > (0 if c == "vniSma200" else med)].yE.mean() - g[g[c] <= (0 if c == "vniSma200" else med)].yE.mean()) for _, g in s.groupby("nam")]
    print(f"   {ten:24s}: cao {a.yE.mean():+.3f}R ({len(a)}) vs thap {b.yE.mean():+.3f}R ({len(b)}) | chenh {a.yE.mean()-b.yE.mean():+.3f} | nam cao>thap: {sum(1 for v in ys if v>0)}/{len(ys)}")
print("\n(d) R trung binh theo nam (cat lo day 5 phien, chot tung phan):", {int(k): round(v, 3) for k, v in x.groupby('nam').yE.mean().items()})
