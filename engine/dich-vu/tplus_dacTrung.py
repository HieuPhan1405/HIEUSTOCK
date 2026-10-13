# HE THONG T+ (2026-10-14) - BUOC 1: dung bang DAC TRUNG cho moi (ma, ngay) tu nen ngay + khoi ngoai + VN-Index + nganh.
# Moi dac trung chi dung du lieu DEN HET phien i (khong nhin truoc). Nhan (ket qua) = mua MO CUA phien i+1, ban DONG CUA phien i+H (H = 3 la chieu T+2 = "T+2,5"; 5; 10), da tru phi 0,4%.
#   - Khong mua duoc neu gia mo cua phien i+1 cao hon dong cua phien i tu 6,5% (sat tran)  -> cot `muaDuoc` = False
#   - Neu phien ban dong cua giam san (<= -6,5%) coi nhu khong ban duoc, ban MO CUA phien ke tiep.
# Ra: engine/output/tplus_dactrung.pkl (pandas). Chay: python engine/dich-vu/tplus_dacTrung.py
import json, sys, warnings
import numpy as np, pandas as pd
warnings.filterwarnings("ignore")
GOC = "engine/output/"
PHI = 0.4
nen = json.load(open(GOC + "nen_dai.json", encoding="utf-8"))
ngoai = json.load(open(GOC + "ngoai.json", encoding="utf-8"))
nganh = json.load(open(GOC + "nganh_map.json", encoding="utf-8"))
vni = pd.DataFrame(json.load(open(GOC + "vnindex_dai.json", encoding="utf-8")))

def wilder(x, n):
    return x.ewm(alpha=1 / n, adjust=False, min_periods=n).mean()

def rsi(c, n):
    d = c.diff()
    au, ad = wilder(d.clip(lower=0), n), wilder((-d).clip(lower=0), n)
    return (100 - 100 / (1 + au / ad.replace(0, np.nan))).where(ad > 0, 100.0).where(au.notna())

# SMC (Smart Money Concepts) tinh bang may, KHONG nhin truoc: dinh / day swing = cao / thap nhat trong +-K nen, chi dung sau khi da du K nen xac nhan.
#   cau truc : gia DONG CUA vuot dinh swing gan nhat -> pha vo tang (dang giam ma pha = CHoCH, con lai = BOS); nguoc lai cho pha vo giam
#   order block tang : nen GIAM gan nhat truoc cu tang pha cau truc; "cham" = lan dau gia quay lai vung [thap, cao] cua nen do ma chua dong cua thung day
#   FVG tang : thap[i] > cao[i-2] (khoang trong gia); "cham" = gia quay lai khoang do; bi xoa khi lap kin
#   quet thanh khoan : thap pha day swing gan nhat nhung dong cua lai tren (quet day = tin hieu tang); nguoc lai la quet dinh
#   premium / discount : vi tri gia trong khoang [day swing, dinh swing] gan nhat (duoi 0,5 = vung "giam gia")
def smc(o, h, l, c, K=3):
    n = len(c)
    xh = np.zeros(n); bosT = np.full(n, 99.0); chT = np.full(n, 99.0); bosG = np.full(n, 99.0); chG = np.full(n, 99.0)
    obCach = np.full(n, np.nan); obCham = np.zeros(n); fvgCach = np.full(n, np.nan); fvgCham = np.zeros(n); fvgGCach = np.full(n, np.nan)
    qDay = np.zeros(n); qDinh = np.zeros(n); vung = np.full(n, np.nan); dayBang = np.zeros(n); soFvg = np.zeros(n)
    sh = None; sl = None; dsSL = []; st = 0; tB = tC = gB = gC = None
    obs = []; fv = []; fg = []
    for i in range(n):
        j = i - K
        if j >= K:
            wh = h[j - K:j + K + 1]; wl = l[j - K:j + K + 1]
            if h[j] == wh.max() and (wh == h[j]).sum() == 1:
                sh = [j, h[j], False]
            if l[j] == wl.min() and (wl == l[j]).sum() == 1:
                sl = [j, l[j], False]; dsSL.append(l[j]); dsSL = dsSL[-6:]
        if sl is not None and not sl[2] and l[i] < sl[1] and c[i] > sl[1]:
            qDay[i] = 1
        if sh is not None and not sh[2] and h[i] > sh[1] and c[i] < sh[1]:
            qDinh[i] = 1
        if sh is not None and not sh[2] and c[i] > sh[1]:
            sh[2] = True
            if st == -1: tC = i
            else: tB = i
            st = 1
            a = sl[0] if sl is not None else i - 20
            for k in range(i - 1, max(a - 1, i - 30, 0), -1):
                if c[k] < o[k]:
                    obs.append([h[k], l[k], i, False]); obs = obs[-8:]; break
        if sl is not None and not sl[2] and c[i] < sl[1]:
            sl[2] = True
            if st == 1: gC = i
            else: gB = i
            st = -1
        xh[i] = st
        if tB is not None: bosT[i] = min(i - tB, 60)
        if tC is not None: chT[i] = min(i - tC, 60)
        if gB is not None: bosG[i] = min(i - gB, 60)
        if gC is not None: chG[i] = min(i - gC, 60)
        # order block tang
        giu = []; gan = np.nan
        for ob in obs:
            if ob[2] < i:
                if not ob[3] and l[i] <= ob[0] and c[i] >= ob[1]:
                    obCham[i] = 1; ob[3] = True
                if c[i] < ob[1]:
                    continue
            giu.append(ob)
            d = 0.0 if c[i] <= ob[0] else (c[i] - ob[0]) / c[i] * 100
            if not (d >= gan): gan = d
        obs = giu; obCach[i] = gan
        # FVG
        if i >= 2:
            if l[i] > h[i - 2]: fv.append([l[i], h[i - 2], i, False]); fv = fv[-8:]
            if h[i] < l[i - 2]: fg.append([l[i - 2], h[i], i]); fg = fg[-8:]
        giu = []; gan = np.nan
        for z in fv:
            if z[2] < i:
                if not z[3] and l[i] <= z[0] and c[i] >= z[1]:
                    fvgCham[i] = 1; z[3] = True
                if l[i] <= z[1]:
                    continue
            giu.append(z)
            d = 0.0 if c[i] <= z[0] else (c[i] - z[0]) / c[i] * 100
            if not (d >= gan): gan = d
        fv = giu; fvgCach[i] = gan; soFvg[i] = len(fv)
        giu = []; gan = np.nan
        for z in fg:
            if z[2] < i and h[i] >= z[0]:
                continue
            giu.append(z)
            d = 0.0 if c[i] >= z[1] else (z[1] - c[i]) / c[i] * 100
            if not (d >= gan): gan = d
        fg = giu; fvgGCach[i] = gan
        if sh is not None and sl is not None and sh[1] > sl[1]:
            vung[i] = (c[i] - sl[1]) / (sh[1] - sl[1])
        if sl is not None:
            dayBang[i] = sum(1 for x in dsSL[:-1] if abs(x / sl[1] - 1) < 0.01)
    return dict(smcXuHuong=xh, smcBosTang=bosT, smcChochTang=chT, smcBosGiam=bosG, smcChochGiam=chG, smcObCach=obCach, smcObCham=obCham, smcFvgCach=fvgCach, smcFvgCham=fvgCham,
                smcFvgGiamCach=fvgGCach, smcQuetDay=qDay, smcQuetDinh=qDinh, smcVung=vung, smcDayBang=dayBang, smcSoFvg=soFvg)

def bang_ma(ma, ds):
    d = pd.DataFrame(ds)
    if len(d) < 300:
        return None
    o, h, l, c, v = d.o, d.h, d.l, d.c, d.v.astype(float)
    c1 = c.shift(1)
    f = pd.DataFrame({"ma": ma, "ngay": d.t, "gia": c})
    # --- loi suat, hinh dang nen ---
    for k in (1, 2, 3, 5, 10, 20, 60, 120):
        f[f"r{k}"] = (c / c.shift(k) - 1) * 100
    bd = (h - l).replace(0, np.nan)
    f["gap"] = (o / c1 - 1) * 100
    f["than"] = (c / o - 1) * 100
    f["vtNen"] = ((c - l) / bd).fillna(0.5)
    f["rauTren"] = ((h - np.maximum(o, c)) / bd).fillna(0)
    f["rauDuoi"] = ((np.minimum(o, c) - l) / bd).fillna(0)
    f["bienDo"] = (h - l) / c1 * 100
    # --- duong trung binh, Bollinger ---
    for n in (5, 10, 20, 50, 100, 200):
        f[f"ma{n}"] = (c / c.rolling(n).mean() - 1) * 100
    m20, s20 = c.rolling(20).mean(), c.rolling(20).std(ddof=0)
    f["ma20Doc"] = (m20 / m20.shift(5) - 1) * 100
    f["bbB"] = (c - (m20 - 2 * s20)) / (4 * s20).replace(0, np.nan)
    f["bbRong"] = 4 * s20 / m20 * 100
    f["bbB1"] = f.bbB.shift(1)
    f["bbMin5"] = f.bbB.rolling(5).min()
    # --- dao dong ---
    for n in (2, 5, 14):
        f[f"rsi{n}"] = rsi(c, n)
    hh14, ll14 = h.rolling(14).max(), l.rolling(14).min()
    f["stoch"] = ((c - ll14) / (hh14 - ll14).replace(0, np.nan)) * 100
    e12, e26 = c.ewm(span=12, adjust=False).mean(), c.ewm(span=26, adjust=False).mean()
    macd = e12 - e26
    f["macdH"] = (macd - macd.ewm(span=9, adjust=False).mean()) / c * 100
    tr = pd.concat([h - l, (h - c1).abs(), (l - c1).abs()], axis=1).max(axis=1)
    atr = wilder(tr, 14)
    f["atr"] = atr / c * 100
    r1 = f.r1
    f["bd5"] = r1.rolling(5).std()
    f["bd20"] = r1.rolling(20).std()
    f["bdTyLe"] = f.bd5 / f.bd20.replace(0, np.nan)
    up, dn = h.diff(), -l.diff()
    pdm = pd.Series(np.where((up > dn) & (up > 0), up, 0.0), index=d.index)
    mdm = pd.Series(np.where((dn > up) & (dn > 0), dn, 0.0), index=d.index)
    pdi, mdi = 100 * wilder(pdm, 14) / atr, 100 * wilder(mdm, 14) / atr
    f["adx"] = wilder(100 * (pdi - mdi).abs() / (pdi + mdi).replace(0, np.nan), 14)
    f["diChenh"] = pdi - mdi
    tp = (h + l + c) / 3
    mf = tp * v
    duong, am = mf.where(tp > tp.shift(1), 0.0), mf.where(tp < tp.shift(1), 0.0)
    f["mfi"] = 100 - 100 / (1 + duong.rolling(14).sum() / am.rolling(14).sum().replace(0, np.nan))
    # --- vi tri so voi dinh / day ---
    for n in (20, 60, 252):
        f[f"dinh{n}"] = (c / h.rolling(n).max() - 1) * 100
        f[f"day{n}"] = (c / l.rolling(n).min() - 1) * 100
    dau = np.sign(c.diff()).fillna(0)
    nhom = (dau != dau.shift()).cumsum()
    f["chuoi"] = dau.groupby(nhom).cumsum()
    f["soSan5"] = (r1 <= -6.5).rolling(5).sum()
    f["soTran5"] = (r1 >= 6.5).rolling(5).sum()
    # --- Ichimoku (9-17-33, dich 26) va duong can bang dai han (65 / 129) cua he thong ---
    tenkan = (h.rolling(9).max() + l.rolling(9).min()) / 2
    kijun = (h.rolling(17).max() + l.rolling(17).min()) / 2
    spA = ((tenkan + kijun) / 2).shift(26)
    spB = ((h.rolling(33).max() + l.rolling(33).min()) / 2).shift(26)
    f["kijun"] = (c / kijun - 1) * 100
    f["tenKi"] = (tenkan / kijun - 1) * 100
    f["mayTren"] = (c / np.maximum(spA, spB) - 1) * 100
    f["mayDuoi"] = (c / np.minimum(spA, spB) - 1) * 100
    cb1 = (h.rolling(65).max() + l.rolling(65).min()) / 2
    cb2 = (h.rolling(129).max() + l.rolling(129).min()) / 2
    f["cbTren"] = (c / np.maximum(cb1, cb2) - 1) * 100
    f["cbDuoi"] = (c / np.minimum(cb1, cb2) - 1) * 100
    # --- khoi luong / thanh khoan ---
    v20 = v.rolling(20).mean()
    f["klTuongDoi"] = v / v20.shift(1).replace(0, np.nan)
    f["kl5_20"] = v.rolling(5).mean() / v20.replace(0, np.nan)
    gt = c * v / 1e6
    f["gt20"] = gt.rolling(20).mean()
    f["logGt"] = np.log10(f.gt20.clip(lower=0.01))
    f["logGia"] = np.log10(c.clip(lower=0.1))
    f["klTang10"] = v.where(c > c1, 0.0).rolling(10).sum() / v.rolling(10).sum().replace(0, np.nan)
    # --- khoi ngoai (co tu 30/08/2018; truoc do de trong) ---
    g = ngoai.get(ma)
    if g:
        fm = pd.DataFrame({"ngay": g["t"], "bv": g["bv"], "sv": g["sv"]})
        x = d[["t"]].rename(columns={"t": "ngay"}).merge(fm, on="ngay", how="left")
        net, tong = (x.bv - x.sv), (x.bv + x.sv)
        for n in (1, 3, 5, 10, 20):
            f[f"ng{n}"] = (net.rolling(n).sum() / v.rolling(n).sum().replace(0, np.nan)).clip(-1, 1) * 100
        f["ngThamGia5"] = (tong.rolling(5).sum() / (2 * v.rolling(5).sum()).replace(0, np.nan)).clip(0, 1) * 100
        dn_ = np.sign(net).fillna(0)
        f["ngChuoi"] = dn_.groupby((dn_ != dn_.shift()).cumsum()).cumsum().where(net.notna())
        f["ngZ"] = (f.ng5 - f.ng5.rolling(120).mean()) / f.ng5.rolling(120).std().replace(0, np.nan)
    else:
        for k in ("ng1", "ng3", "ng5", "ng10", "ng20", "ngThamGia5", "ngChuoi", "ngZ"):
            f[k] = np.nan
    # --- SMC ---
    for k, a in smc(o.values, h.values, l.values, c.values).items():
        f[k] = a
    f["smcDichChuyen"] = (c - o) / atr.replace(0, np.nan)
    # --- nhan ---
    # y3tb: nhu y3 nhung gia mua = trung binh (mo, cao, thap, dong) cua phien i+1 thay vi gia mo cua (kiem tra do nhay voi gia khop)
    f["y3tb"] = (c.shift(-3) / ((o + h + l + c) / 4).shift(-1) - 1) * 100 - PHI
    e = o.shift(-1)
    f["muaDuoc"] = (e > 0) & ((e / c - 1) < 0.065)
    for H in (3, 5, 10):
        ra = c.shift(-H)
        san = ra <= c.shift(-H + 1) * 0.935
        ra = ra.where(~san, o.shift(-H - 1))
        f[f"y{H}"] = (ra / e - 1) * 100 - PHI
    return f

ds = []
for i, (ma, x) in enumerate(nen.items()):
    if ma == "VNINDEX":
        continue
    b = bang_ma(ma, x)
    if b is not None:
        b["nganh"] = nganh.get(ma, "Khac")
        ds.append(b)
D = pd.concat(ds, ignore_index=True)
D = D[D.ngay >= "2014-06-01"].copy()

# --- VN-Index ---
vc = vni.c
V = pd.DataFrame({"ngay": vni.t})
for k in (1, 3, 5, 10, 20, 60):
    V[f"vn{k}"] = (vc / vc.shift(k) - 1) * 100
vm, vs = vc.rolling(20).mean(), vc.rolling(20).std(ddof=0)
V["vnBbB"] = (vc - (vm - 2 * vs)) / (4 * vs)
V["vnRsi"] = rsi(vc, 14)
V["vnRsi2"] = rsi(vc, 2)
V["vnMa50"] = (vc / vc.rolling(50).mean() - 1) * 100
V["vnMa200"] = (vc / vc.rolling(200).mean() - 1) * 100
V["vnBd10"] = V.vn1.rolling(10).std()
V["vnDay20"] = (vc / vni.l.rolling(20).min() - 1) * 100
V["vnDinh60"] = (vc / vni.h.rolling(60).max() - 1) * 100
D = D.merge(V, on="ngay", how="left")

# --- do rong thi truong + nganh (tinh tren cac ma du thanh khoan >= 5 ty) ---
L = D[D.gt20 >= 5]
g = L.groupby("ngay")
B = pd.DataFrame({"drMa20": g.ma20.apply(lambda s: (s > 0).mean() * 100), "drMa50": g.ma50.apply(lambda s: (s > 0).mean() * 100), "drTang": g.r1.apply(lambda s: (s > 0).mean() * 100),
                  "drSan": g.r1.apply(lambda s: (s <= -6.5).mean() * 100), "drDuoiBien": g.bbB.apply(lambda s: (s < 0).mean() * 100), "drTrenBien": g.bbB.apply(lambda s: (s > 1).mean() * 100),
                  "ttR1": g.r1.median(), "ttR5": g.r5.median(), "ttPhanTan": g.r1.std(), "ttNg5": g.ng5.median()}).reset_index()
D = D.merge(B, on="ngay", how="left")
S = L.groupby(["ngay", "nganh"]).agg(ngR5=("r5", "median"), ngR20=("r20", "median"), ngDr=("ma20", lambda s: (s > 0).mean() * 100), ngNgoai=("ng5", "median")).reset_index()
D = D.merge(S, on=["ngay", "nganh"], how="left")
D["soNgR5"] = D.r5 - D.ngR5
D["soNgR20"] = D.r20 - D.ngR20
D["soVn1"] = D.r1 - D.vn1
D["soVn5"] = D.r5 - D.vn5
D["soVn20"] = D.r20 - D.vn20
D["thu"] = pd.to_datetime(D.ngay).dt.dayofweek

D = D[(D.gt20 >= 5) & (D.gia >= 3)].reset_index(drop=True)
D.to_pickle(GOC + "tplus_dactrung.pkl")
BO = {"ma", "ngay", "nganh", "gia", "muaDuoc", "y3", "y5", "y10", "y3tb", "gt20"}
F = [c for c in D.columns if c not in BO]
print(f"so dong: {len(D):,} | so ma: {D.ma.nunique()} | tu {D.ngay.min()} den {D.ngay.max()} | so dac trung: {len(F)}")
print("dong theo nam:", D.groupby(D.ngay.str[:4]).size().to_dict())
print("ty le khong mua duoc (mo cua sat tran):", round((~D.muaDuoc).mean() * 100, 2), "%")
print("y3 TB:", round(D.y3.mean(), 3), "| y5 TB:", round(D.y5.mean(), 3), "| y10 TB:", round(D.y10.mean(), 3))
