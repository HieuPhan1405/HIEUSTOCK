# NGHIEN CUU QUANT (2026-10-12): xac suat thang uoc tinh - hieu chinh (calibration) va YEU TO NAO ANH HUONG. Chay: python nghienCuuQuant_yeuTo.py <lenh.csv>
import sys, warnings
import numpy as np, pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
warnings.filterwarnings("ignore")
d = pd.read_csv(sys.argv[1]).sort_values(["ngayVao", "ma"]).reset_index(drop=True)
d["y"] = d.rB.clip(-3, 6); d["w"] = (d.rB > 0).astype(int); d["nam"] = d.ngayVao.str[:4].astype(int)
BO = {"ma", "ngay", "ngayVao", "ngayThoatB", "loai", "rA", "retA", "rB", "retB", "rC", "retC", "phienB", "y", "yE", "rSizeA", "w", "nam"}
F = [c for c in d.columns if c not in BO]
d["_d"] = pd.to_datetime(d.ngayVao); d["_t"] = pd.to_datetime(d.ngayThoatB)

def chuan_hoa(tr, te):
    A, B = [], []
    for c in F:
        s = np.sort(tr[c].dropna().values)
        if len(s) < 50 or s[0] == s[-1]: A.append(np.zeros(len(tr))); B.append(np.zeros(len(te))); continue
        f = lambda x: np.where(np.isnan(x), 0.0, np.searchsorted(s, x, side="right") / len(s) * 2 - 1)
        A.append(f(tr[c].values)); B.append(f(te[c].values))
    return np.column_stack(A), np.column_stack(B)

moc = pd.date_range("2021-01-01", "2026-07-01", freq="6MS")
ky = list(zip(moc, list(moc[1:]) + [pd.Timestamp("2027-01-01")]))
hs, tam, pim = [], [], []
rng = np.random.RandomState(0)
for a, b in ky:
    te = d[(d._d >= a) & (d._d < b)]; tr = d[d._t < a]
    if len(te) == 0 or len(tr) < 800: continue
    Xtr, Xte = chuan_hoa(tr, te)
    m = LogisticRegression(C=0.02, max_iter=500).fit(Xtr, tr.w)
    p = m.predict_proba(Xte)[:, 1]; hs.append(m.coef_[0]); tam.append(pd.DataFrame({"p": p, "w": te.w.values, "nam": te.nam.values, "ky": a}))
    base = roc_auc_score(te.w, p); g = []
    for j in range(len(F)):  # do tam quan trong hoan vi: xao 1 cot trong ky kiem tra, AUC giam bao nhieu
        dr = []
        for _ in range(5):
            Xp = Xte.copy(); Xp[:, j] = rng.permutation(Xp[:, j]); dr.append(base - roc_auc_score(te.w, m.predict_proba(Xp)[:, 1]))
        g.append(np.mean(dr))
    pim.append(g)
hs, pim = np.array(hs), np.array(pim); T = pd.concat(tam)
print(f"Ngoai mau cuon chieu: {len(T)} lenh | ti le thang that {100*T.w.mean():.1f}% | AUC {roc_auc_score(T.w, T.p):.3f}\n")

print("=== HIEU CHINH: xac suat uoc tinh vs ti le thang that (nhom theo xac suat tuyet doi, ngoai mau) ===")
T["nhom"] = pd.cut(T.p, [0, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 1])
g = T.groupby("nhom", observed=True)
print(pd.DataFrame({"n": g.size(), "uoc tinh TB": g.p.mean().round(3), "thang that": g.w.mean().round(3)}).to_string())

print("\n=== YEU TO ANH HUONG (xep theo dong gop AUC ngoai mau; huong = dau he so TB qua cac ky; on dinh = so ky cung dau / tong) ===")
ten = {
 "rSizeB": "Khoang cach cat lo (day 5 phien) %", "tp1R": "TP1 / khoang cat lo", "tang5": "Tang 5 phien truoc", "tang20": "Tang 20 phien truoc", "tang60": "Tang 60 phien truoc",
 "cbKc": "Gia so voi duong can bang dai han %", "kijunKc": "Gia so voi Kijun %", "mayKc": "Gia so voi may Kumo %", "kcDinh60": "Khoang cach toi dinh 60 phien",
 "sma50": "Gia so voi SMA50 %", "sma200": "Gia so voi SMA200 %", "atrPct": "ATR / gia %", "atrRel": "ATR hien tai / ATR TB 50", "nenChat": "Do chat cua nen 20 phien", "nenDai": "Do dai nen tich luy",
 "relvol": "Khoi luong tuong doi nen tin hieu", "relvol5": "Khoi luong tuong doi 5 phien truoc", "vol5v20": "KL TB5 / TB20", "upDn": "KL phien tang / giam 10 phien", "effort": "No luc / ket qua (VSA)",
 "gap": "Gap mo cua phien vao %", "gapDinh": "Mo cua so voi dinh nen tin hieu %", "rngAtr": "Bien do nen / ATR", "clv": "Vi tri dong cua trong nen", "thanNen": "Than nen / bien do", "rauTren": "Rau tren / bien do", "rauDuoi": "Rau duoi / bien do",
 "rank": "Diem rank engine", "conf": "Diem confidence engine", "diem": "Tong diem engine", "adx": "ADX", "rs20": "Suc manh so voi VN-Index 20 phien", "gtgd": "Thanh khoan (log GTGD)",
 "vniSma50": "VN-Index so voi SMA50 %", "vniSma200": "VN-Index so voi SMA200 %", "vni5": "VN-Index 5 phien", "vni20": "VN-Index 20 phien", "vniTrenKijun": "VN-Index tren Kijun", "rong50": "Do rong >SMA50", "rongKijun": "Do rong >Kijun",
 "spring": "Wyckoff Spring", "sos": "Wyckoff SOS", "engulf": "Bullish engulfing", "inside": "Inside bar"}
X = d[d._d >= "2021-01-01"]
rows = []
for j, c in enumerate(F):
    h = hs[:, j]; sg = np.sign(h.mean()); on = (np.sign(h) == sg).sum()
    # ti le thang that: nua cao vs nua thap cua dac trung (ngoai mau), theo nam
    s = X[[c, "w", "nam"]].dropna()
    if s[c].nunique() > 3:
        med = s[c].median(); cao = s[s[c] > med]; thap = s[s[c] <= med]
        dw = 100 * (cao.w.mean() - thap.w.mean())
        nam_cung = sum(1 for _, g2 in s.groupby("nam") if np.sign(g2[g2[c] > med].w.mean() - g2[g2[c] <= med].w.mean()) == np.sign(dw))
    else: dw, nam_cung = np.nan, 0
    rows.append((c, ten.get(c, c), pim[:, j].mean() * 1000, "+" if sg > 0 else "-", on, len(hs), dw, nam_cung))
R = pd.DataFrame(rows, columns=["k", "yeu_to", "AUC_x1000", "huong", "on_dinh", "ky", "chenh_thang_cao_vs_thap(diem%)", "nam_cung_dau"]).sort_values("AUC_x1000", ascending=False)
print(R.drop(columns="k").head(16).round(2).to_string(index=False))
print("\n(cot 'chenh_thang...': ti le thang cua nua CAO tru nua THAP cua yeu to, don vi diem phan tram, 6 nam 2021-2026; 'nam_cung_dau' = so nam cung dau)")
