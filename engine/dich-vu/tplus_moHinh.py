# HE THONG T+ (2026-10-14) - BUOC 2: mo hinh + KIEM CHUNG CUON CHIEU + mo phong danh muc.
# Cuon chieu: voi moi nam Y (2019..2026) chi hoc tu du lieu DEN 10/12 nam Y-1 roi cham diem ca nam Y -> moi con so ben duoi la NGOAI MAU (mo hinh chua tung thay).
# Mo hinh: LightGBM (tham so co dinh tu truoc, khong do tren du lieu kiem chung), 2 hat giong lay trung binh.
#   p3 / p5 : du doan lai rong (%) cua lenh mua mo cua phien sau, ban T+2,5 / T+5   (gom ca chon ma lan chon thoi diem)
#   q3      : du doan lai rong T+2,5 SO VOI TRUNG VI cac ma cung ngay            (chi chon ma)
# Mo phong: moi ngay sau dong cua, chon toi da K ma co diem cao nhat (du doan >= nguong), mua mo cua phien sau, ban dong cua sau H phien; von chia H phan quay vong.
# Chay: PYTHONPATH=<pylib> python engine/dich-vu/tplus_moHinh.py   -> luu engine/output/tplus_oos.pkl
import sys, time, warnings
import numpy as np, pandas as pd, lightgbm as lgb
from scipy.stats import spearmanr
warnings.filterwarnings("ignore")
GOC = "engine/output/"
D = pd.read_pickle(GOC + "tplus_dactrung.pkl")
BO = {"ma", "ngay", "nganh", "gia", "muaDuoc", "y3", "y5", "y10", "y3tb", "gt20"}
F = [c for c in D.columns if c not in BO]
F_KHONG_SMC = [c for c in F if not c.startswith("smc")]
D["nam"] = D.ngay.str[:4].astype(int)
ok = D.muaDuoc & D.y3.notna() & D.y5.notna()
D = D[ok].reset_index(drop=True)
D["t3"] = D.y3.clip(-12, 12)
D["t5"] = D.y5.clip(-15, 15)
D["x3"] = (D.y3 - D.groupby("ngay").y3.transform("median")).clip(-12, 12)
P = dict(objective="huber", alpha=3.0, learning_rate=0.03, num_leaves=31, min_data_in_leaf=400, feature_fraction=0.6, bagging_fraction=0.7, bagging_freq=1, lambda_l2=20.0, n_estimators=400, verbose=-1, n_jobs=16)
NAM = list(range(2019, 2027))
# cot du doan -> (muc tieu, bo dac trung).  q3b = q3 nhung KHONG co dac trung SMC (de biet SMC dong gop bao nhieu)
MUC = {"p3": ("t3", F), "p5": ("t5", F), "q3": ("x3", F), "q3b": ("x3", F_KHONG_SMC)}
for c in MUC:
    D[c] = np.nan
qt = {}
t0 = time.time()
mh_cuoi = None
for Y in NAM:
    tr = D[D.ngay <= f"{Y-1}-12-10"]
    te = D.nam == Y
    if te.sum() == 0:
        continue
    for cot, (muc, FF) in MUC.items():
        du = np.zeros(te.sum())
        for seed in (7, 2026):
            m = lgb.LGBMRegressor(**P, random_state=seed).fit(tr[FF], tr[muc])
            du += m.predict(D.loc[te, FF]) / 2
            if cot == "q3" and seed == 7:
                mh_cuoi = m
        D.loc[te, cot] = du
    print(f"  nam {Y}: hoc {len(tr):,} dong, cham {te.sum():,} dong | {time.time()-t0:.0f}s", flush=True)
O = D[D.nam >= 2019].copy()
O.to_pickle(GOC + "tplus_oos.pkl")

f2 = lambda v: "-" if v is None or not np.isfinite(v) else f"{v:.2f}"
print("\n=== A. KHA NANG XEP HANG (tuong quan hang giua diem du doan va ket qua thuc, tinh tung ngay roi lay trung binh; 0 = vo dung) ===")
for cot in ("p3", "q3", "q3b", "p5"):
    y = "y5" if cot == "p5" else "y3"
    ic = O.groupby("ngay").apply(lambda g: spearmanr(g[cot], g[y]).statistic if len(g) >= 20 else np.nan).dropna()
    theo = ic.groupby(ic.index.str[:4]).mean()
    print(f"   {cot}: TB {ic.mean():.4f} (t = {ic.mean()/ic.std()*np.sqrt(len(ic)):.1f}, {(ic>0).mean()*100:.0f}% so ngay duong) | theo nam: " + "  ".join(f"{k}:{v:.3f}" for k, v in theo.items()))

print("\n=== B. KET QUA THUC THEO NHOM DIEM DU DOAN p3 (ngoai mau 2019-2026, tat ca ma du thanh khoan) ===")
r = O.p3.rank(pct=True)
for a, b, ten in [(0, .1, "10% thap nhat"), (.1, .5, "10-50%"), (.5, .9, "50-90%"), (.9, .95, "90-95%"), (.95, .98, "95-98%"), (.98, .99, "98-99%"), (.99, .995, "99-99,5%"), (.995, 1.01, "0,5% cao nhat")]:
    g = O[(r > a) & (r <= b)]
    print(f"   {ten:16s} n={len(g):6d} | du doan TB {g.p3.mean():6.2f}% | thuc te T+2,5 {g.y3.mean():6.2f}% (thang {(g.y3>0).mean()*100:.0f}%) | T+5 {g.y5.mean():6.2f}% | so ngay khac nhau {g.ngay.nunique()}")
print("   Theo nam, nhom du doan p3 >= 1% : " + "  ".join(f"{y}: {g.y3.mean():.2f}% (n={len(g)}, {g.ngay.nunique()} ngay)" for y, g in O[O.p3 >= 1].groupby("nam")))
print("   Theo nam, tat ca ma              : " + "  ".join(f"{y}: {g.y3.mean():.2f}%" for y, g in O.groupby("nam")))

# ---------- mo phong danh muc ----------
NGAY = sorted(O.ngay.unique())
VN = pd.read_json(GOC + "vnindex_dai.json").assign(ngay=lambda x: x.t.astype(str).str[:10]).set_index("ngay").c
def mo_phong(cot, H, K, nguong=None, tk=10, phi_them=0.0, loc=None):
    y = f"y{H}"
    C = O[(O.gt20 >= tk)]
    if loc is not None:
        C = C[loc(C)]
    if nguong is not None:
        C = C[C[cot] >= nguong]
    chon = C.sort_values(["ngay", cot], ascending=[True, False]).groupby("ngay").head(K)
    lai_ngay = chon.groupby("ngay")[y].mean() - phi_them
    von = np.ones(H); duong = []; ro = {}
    for t, d in enumerate(NGAY):
        s = t % H
        if s in ro:  # tat toan ro da mo o ngay t-H
            von[s] *= 1 + ro.pop(s) / 100
        if d in lai_ngay.index and t + H < len(NGAY):
            ro[s] = lai_ngay[d]
        duong.append(von.mean())
    e = pd.Series(duong, index=NGAY)
    nam_ = len(NGAY) / 250
    dd = (e / e.cummax() - 1).min() * 100
    thay = e.pct_change().dropna()
    tr_ = chon[y] - phi_them
    thang, thua = tr_[tr_ > 0], tr_[tr_ <= 0]
    theo_nam = e.groupby(e.index.str[:4]).apply(lambda x: (x.iloc[-1] / x.iloc[0] - 1) * 100)
    return dict(cagr=(e.iloc[-1] ** (1 / nam_) - 1) * 100, dd=dd, sharpe=thay.mean() / thay.std() * np.sqrt(250) if thay.std() > 0 else np.nan, n=len(tr_), tb=tr_.mean(), thang=(tr_ > 0).mean() * 100,
                pf=thang.sum() / -thua.sum() if len(thua) else np.nan, te=tr_.min(), ngayCoLenh=lai_ngay.size / len(NGAY) * 100, tbNgay=lai_ngay.mean(), ngayLai=(lai_ngay > 0).mean() * 100, cuoi=e.iloc[-1], theoNam=theo_nam, e=e, chon=chon)
def dong(ten, k):
    print(f"   {ten:58s} | lai kep/nam {k['cagr']:6.1f}% | sut giam toi da {k['dd']:6.1f}% | Sharpe {f2(k['sharpe'])} | {k['n']:5d} lenh, TB {k['tb']:5.2f}%, thang {k['thang']:.0f}%, PF {f2(k['pf'])}, te nhat {k['te']:.0f}% | co lenh {k['ngayCoLenh']:.0f}% so ngay, ro TB {k['tbNgay']:.2f}% ({k['ngayLai']:.0f}% ro lai)")
vn = VN.reindex(NGAY).ffill()
print(f"\n=== C. MO PHONG DANH MUC NGOAI MAU {NGAY[0]} -> {NGAY[-1]} ({len(NGAY)/250:.1f} nam), phi 0,4% / vong, thanh khoan >= 10 ty/phien ===")
print(f"   MOC: giu VN-Index: lai kep/nam {((vn.iloc[-1]/vn.iloc[0])**(250/len(NGAY))-1)*100:.1f}% | sut giam toi da {((vn/vn.cummax()-1).min())*100:.1f}%")
O["ngau"] = np.random.default_rng(1).random(len(O))
dong("MOC: mua 5 ma NGAU NHIEN moi ngay, ban T+2,5", mo_phong("ngau", 3, 5))
dong("MOC: mua 5 ma ngau nhien moi ngay, ban T+5", mo_phong("ngau", 5, 5))
print("   -- HE CHINH (dat truoc khi xem ket qua): p3, ban T+2,5, toi da 5 ma / ngay, chi mua khi du doan lai rong >= 1% --")
CHINH = mo_phong("p3", 3, 5, 1.0)
dong("HE CHINH: p3 >= 1%, K = 5, T+2,5", CHINH)
print("   -- cac bien the lan can (de xem ket qua co ben khong) --")
for ten, a in [("p3 khong nguong (luc nao cung mua 5 ma diem cao nhat)", ("p3", 3, 5, None)), ("p3 >= 0,5%", ("p3", 3, 5, 0.5)), ("p3 >= 1,5%", ("p3", 3, 5, 1.5)), ("p3 >= 2%", ("p3", 3, 5, 2.0)), ("p3 >= 1%, K = 3", ("p3", 3, 3, 1.0)), ("p3 >= 1%, K = 10", ("p3", 3, 10, 1.0)),
               ("p5 >= 1%, K = 5, ban T+5", ("p5", 5, 5, 1.0)), ("p5 >= 2%, K = 5, ban T+5", ("p5", 5, 5, 2.0)), ("p3 >= 1% nhung giu den T+5", ("p3", 5, 5, 1.0)), ("q3 (chi chon ma), luc nao cung mua 5 ma", ("q3", 3, 5, None)), ("q3b (chi chon ma, KHONG co SMC), mua 5 ma", ("q3b", 3, 5, None)), ("q3 chon ma, chi nhung ngay p3 >= 1%", None)]:
    if a is None:
        k = mo_phong("q3", 3, 5, None, loc=lambda C: C.p3 >= 1.0)
    else:
        k = mo_phong(*a)
    dong(ten, k)
print("   -- do nhay voi chi phi va thanh khoan (he chinh) --")
dong("phi + truot gia 0,6% / vong (them 0,2%)", mo_phong("p3", 3, 5, 1.0, phi_them=0.2))
dong("phi + truot gia 0,8% / vong (them 0,4%)", mo_phong("p3", 3, 5, 1.0, phi_them=0.4))
dong("chi ma thanh khoan >= 30 ty / phien", mo_phong("p3", 3, 5, 1.0, tk=30))
dong("chi ma thanh khoan >= 100 ty / phien", mo_phong("p3", 3, 5, 1.0, tk=100))
print("\n   HE CHINH theo tung nam (% lai cua danh muc) : " + "  ".join(f"{y}: {v:.1f}%" for y, v in CHINH["theoNam"].items()))
print("   VN-Index theo tung nam                      : " + "  ".join(f"{y}: {(g.iloc[-1]/g.iloc[0]-1)*100:.1f}%" for y, g in vn.groupby(vn.index.str[:4])))
c = CHINH["chon"]
print("   So lenh theo nam: " + "  ".join(f"{y}: {len(g)} lenh / {g.ngay.nunique()} ngay, TB {g.y3.mean():.2f}%" for y, g in c.groupby("nam")))
# CI bootstrap theo cum thang cho lai TB moi ro
ro = c.groupby("ngay").y3.mean(); th = ro.groupby(ro.index.str[:7]).agg(["sum", "count"])
rng = np.random.default_rng(3); bs = []
for _ in range(3000):
    k = rng.integers(0, len(th), len(th)); bs.append(th["sum"].values[k].sum() / th["count"].values[k].sum())
print(f"   Lai TB moi ro (1 ngay 1 phieu): {ro.mean():.2f}%  [khoang tin cay 95% theo cum thang: {np.percentile(bs,2.5):.2f} .. {np.percentile(bs,97.5):.2f}] | {len(ro)} ngay co lenh trong {len(th)} thang")

print("\n=== D. MO HINH CHON MA (q3) DUA VAO GI (30 dac trung quan trong nhat, mo hinh hoc den het 2025) ===")
imp = pd.Series(mh_cuoi.booster_.feature_importance("gain"), index=F).sort_values(ascending=False)
print("   " + " | ".join(f"{k} {v/imp.sum()*100:.1f}%" for k, v in imp.head(30).items()))
print("   Thu hang cac dac trung SMC: " + ", ".join(f"{k} #{list(imp.index).index(k)+1} ({imp[k]/imp.sum()*100:.1f}%)" for k in imp.index if k.startswith("smc")))
print("\n=== E. LENH DUOC CHON (he chinh) KHAC MA THUONG O DAU (trung vi) ===")
ss = ["r1", "r3", "r5", "r20", "bbB", "rsi2", "rsi14", "ma20", "klTuongDoi", "ng5", "ng20", "atr", "vn1", "vn5", "vnBbB", "drMa20", "drSan", "drDuoiBien", "ttR5", "gt20"]
print("   " + " | ".join(f"{k}: {c[k].median():.1f} (tat ca {O[k].median():.1f})" for k in ss))
