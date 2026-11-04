# PHAI SINH VN30F1M - PHA VO BIEN DONG k = 0,3: THEM DIEU KIEN VAO LENH CHAT HON (Hieu 05/11/2026: "khong can ngay nao cung giao dich").
# Co so: lenh dung tai gia mo cua +- 0,3 x bien do hom truoc, cat lo o gia mo cua, giu den 14:29 (phaisinh_them3.py vb()). Moi lenh gan cac DAC TRUNG BIET TRUOC LUC VAO (gap, bien do hom truoc, vi tri vao so voi dinh / day hom truoc,
# vung gia tri hom truoc, xu huong ngay, gio vao, khoi luong...), roi xem chi giu lenh thoa dieu kien thi sao. Chon dieu kien tren KP (den 06/2022), KIEM CHUNG o KC (tu 07/2022). Phi MBS + truot gia 0,4 diem / vong.
# Chay: python engine/dich-vu/phaisinh_bd03_loc.py    (PS_TRUOT=0.8 de thu truot gia khac)
import numpy as np, pandas as pd, warnings, itertools
from phaisinh_chung import nap, phi, chay_lenh, MOC
warnings.filterwarnings("ignore")
X = nap(); ngay, O, H, L, C, V, ATC, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["V"], X["ATC"], X["sauDao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); nam = np.array([x[:4] for x in ngay])
pATC = np.r_[np.nan, ATC[:-1]]; dH = H.max(axis=1); dL = L.min(axis=1); pH = np.r_[np.nan, dH[:-1]]; pL = np.r_[np.nan, dL[:-1]]
bd = dH - dL; pBD = np.r_[np.nan, bd[:-1]]; bdTB = pd.Series(bd).rolling(20).mean().shift(1).values
thu = pd.to_datetime(pd.Series(ngay)).dt.dayofweek.values
dC = C[:, 240]; ma20 = pd.Series(dC).rolling(20).mean().shift(1).values; pC = np.r_[np.nan, dC[:-1]]; pC3 = np.r_[np.full(3, np.nan), dC[:-3]]
tp = (H + L + C) / 3
# vung gia tri hom truoc (70% khoi luong): VAH / VAL / POC cho ngay a = tu phien a-1
POC = np.full(N, np.nan); VAH = np.full(N, np.nan); VAL = np.full(N, np.nan)
for a in range(N):
    g = np.round(tp[a] * 2) / 2; ks, inv = np.unique(g, return_inverse=True); kl = np.bincount(inv, weights=V[a] + 1e-9); i = kl.argmax(); lo = hi = i; s = kl[i]; tong = kl.sum()
    while s < 0.7 * tong and (lo > 0 or hi < len(ks) - 1):
        if (kl[lo - 1] if lo > 0 else -1) >= (kl[hi + 1] if hi < len(ks) - 1 else -1): lo -= 1; s += kl[lo]
        else: hi += 1; s += kl[hi]
    if a + 1 < N: POC[a + 1], VAH[a + 1], VAL[a + 1] = ks[i], ks[hi], ks[lo]
cumV = np.cumsum(V, axis=1); pCumV = np.vstack([np.full((1, V.shape[1]), np.nan), cumV[:-1]])  # khoi luong luy ke cung phut cua hom truoc
ok = lambda a: a >= 25 and not sauDao[a] and not np.isnan(pBD[a]) and not np.isnan(ma20[a]) and not np.isnan(VAH[a])

# ---- sinh lenh co so + dac trung
K = 0.3
rows = []
for a in range(N):
    if not ok(a): continue
    o0 = O[a, 0]; tr, du = o0 + K * pBD[a], o0 - K * pBD[a]
    for k in range(1, 180):
        p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
        if not p: continue
        gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du)
        j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, gia, cat=o0)
        pct = (p * (ra - gia) - phi(gia)) / gia * 100
        gap = (o0 / pATC[a] - 1) * 100
        vr = cumV[a, k] / pCumV[a, k] if pCumV[a, k] > 0 else np.nan
        rows.append(dict(a=a, ngay=ngay[a], nam=nam[a], dK=dK[a], p=p, k=k, vao=gia, pct=pct, diem=pct * 18.7, thu=thu[a], gap=gap, gapCung=p * gap,
                         bdR=pBD[a] / bdTB[a], vuotPH=(p > 0 and gia > pH[a]) or (p < 0 and gia < pL[a]),
                         tren=p * (pC[a] / ma20[a] - 1) * 100, mom3=p * (pC[a] / pC3[a] - 1) * 100,
                         vitri=(pATC[a] - pL[a]) / (pH[a] - pL[a]) if pH[a] > pL[a] else np.nan,
                         vaTrong=VAL[a] <= gia <= VAH[a], vaNgoai=(gia > VAH[a]) if p > 0 else (gia < VAL[a]),
                         chay=(H[a, :k + 1].max() - L[a, :k + 1].min()) / pBD[a], vr=vr, moDauTrong=VAL[a] <= o0 <= VAH[a]))
        break
D = pd.DataFrame(rows)
D["vitriCung"] = np.where(D.p > 0, D.vitri, 1 - D.vitri)  # vi tri dong cua hom truoc theo huong lenh: 1 = dong o dinh (cung chieu mua)
nKP, nKC = dK[[ok(a) for a in range(N)]].sum(), (~dK)[[ok(a) for a in range(N)]].sum()
nNgay = {True: int(nKP), False: int(nKC)}

def tom(m, nhan, in_ten=True):
    s = D[m]; out = []
    for kp in (True, False):
        t = s[s.dK == kp]; nd = nNgay[kp]
        if len(t) < 15: out.append("   (it lenh)" + " " * 60); continue
        w, l = t.pct[t.pct > 0].sum(), -t.pct[t.pct <= 0].sum(); e = t.groupby("a").pct.sum().reindex(range(N)).fillna(0).values[dK == kp] if False else None
        tn = t.pct.sum() / (nd / 250); tstat = t.pct.mean() / t.pct.std() * np.sqrt(len(t))
        out.append(f"n {len(t):4d} ({len(t)/nd*100:3.0f}% ngay) TB {t.diem.mean():5.2f}d thang {(t.pct>0).mean()*100:3.0f}% PF {w/l if l else np.nan:4.2f} {tn:6.1f}%/nam t {tstat:4.1f}")
    print(f"{nhan:62s} | KP {out[0]} | KC {out[1]}")

print(f"=== PHA VO BIEN DONG 0,3 (cat lo gia mo cua), phi MBS + truot, {int(nKP)} ngay KP / {int(nKC)} ngay KC; TB tinh theo diem o muc 1.870 ===")
base = np.ones(len(D), bool); tom(base, "CO SO: moi ngay co lenh")
print("\n--- A. TUNG DIEU KIEN DON ---")
F = {
    "gap cung chieu lenh >= 0,2%": D.gapCung >= 0.2, "gap cung chieu lenh >= 0,4%": D.gapCung >= 0.4, "gap NGUOC chieu lenh >= 0,2%": D.gapCung <= -0.2, "gap nho (|gap| < 0,2%)": D.gap.abs() < 0.2,
    "bien do hom truoc > 1,2 x TB20": D.bdR > 1.2, "bien do hom truoc < 0,8 x TB20": D.bdR < 0.8,
    "vao khi da vuot dinh (mua) / day (ban) hom truoc": D.vuotPH, "vao CHUA vuot dinh / day hom truoc": ~D.vuotPH,
    "dong cua hom truoc cung chieu lenh (nua tren khi mua)": D.vitriCung >= 0.6, "dong cua hom truoc nguoc chieu lenh": D.vitriCung <= 0.4,
    "gia hom truoc cung phia MA20 voi lenh": D.tren > 0, "gia hom truoc xa MA20 cung phia > 3%": D.tren > 3, "gia hom truoc NGUOC phia MA20": D.tren < 0,
    "da tang / giam cung chieu 3 phien (mom3 > 0)": D.mom3 > 0, "mom3 NGUOC chieu": D.mom3 < 0,
    "vao trong 30 phut dau (k <= 30)": D.k <= 30, "vao truoc 10:30 (k <= 90)": D.k <= 90, "vao sau 10:30": D.k > 90,
    "gia vao TRONG vung gia tri hom truoc": D.vaTrong, "gia vao NGOAI vung gia tri (cung chieu lenh)": D.vaNgoai,
    "mo cua TRONG vung gia tri": D.moDauTrong, "mo cua NGOAI vung gia tri": ~D.moDauTrong,
    "khoang chay tu mo cua toi luc vao < 0,5 x bien do hom truoc": D.chay < 0.5, "khoang chay >= 0,8 x bien do hom truoc": D.chay >= 0.8,
    "khoi luong luy ke luc vao >= 1,2 x hom truoc": D.vr >= 1.2, "khoi luong luy ke luc vao < 0,8 x hom truoc": D.vr < 0.8,
}
for ten, m in F.items(): tom(m.fillna(False).values, ten)
print("\n--- B. THEO THU ---")
for t in range(5): tom((D.thu == t).values, f"Thu {t+2}")
print("\n--- C. CHON TREN KP, KIEM CHUNG TREN KC: ghep 2 dieu kien (chi hien cap co TB KP >= 3 diem, >= 40 lenh KP, TB KC > 0, >= 30 lenh KC) ---")
ten = list(F); kq = []
for a_, b_ in itertools.combinations(ten, 2):
    m = (F[a_] & F[b_]).fillna(False).values
    kp, kc = D[m & D.dK.values], D[m & ~D.dK.values]
    if len(kp) < 40 or len(kc) < 30: continue
    kq.append((kp.diem.mean(), kc.diem.mean(), len(kp), len(kc), a_, b_, m))
kq = [x for x in kq if x[0] >= 3 and x[1] > 0]; kq.sort(key=lambda x: -(x[0] + x[1]))
for x in kq[:12]: tom(x[6], f"{x[4][:30]} + {x[5][:30]}")
print(f"   ({len(kq)} cap thoa tren {len(list(itertools.combinations(ten, 2)))} cap - de y thien lech chon loc: chon nhieu cap thi co cap tot ngau nhien)")
print("\n--- D. THEO NAM voi co so va vai dieu kien tot (diem tong / nam, 1 hop dong) ---")
def nam_(m, nhan):
    s = D[m]; print(f"{nhan:62s} | " + "  ".join(f"{y}: {s[s.nam==y].diem.sum():6.0f}({(s.nam==y).sum():3d})" for y in sorted(set(nam)) if y >= '2018'))
nam_(base, "CO SO")
for ten_ in ("vao khi da vuot dinh (mua) / day (ban) hom truoc", "gap cung chieu lenh >= 0,2%", "gia vao TRONG vung gia tri hom truoc", "vao truoc 10:30 (k <= 90)"): nam_(F[ten_].fillna(False).values, ten_)

print("\n--- E. LUAT GHEP DON GIAN (dat truoc, KHONG do tim cap tot nhat): so lenh / nam, %/nam, Sharpe theo ngay, sut toi da (cong don %), thang lai ---")
def dongtien(m):
    x = np.zeros(N)
    for a, v in D[m].groupby("a").pct.sum().items(): x[a] = v
    return x
def luat(m, nhan, truot_them=None):
    x = dongtien(m); out = []
    for kp in (True, False):
        mk = dK == kp; y = x[mk]; nn = mk.sum() / 250; e = np.cumsum(y); t = D[m & (D.dK.values == kp)]
        thg = pd.Series(y, index=np.array(ngay)[mk]).groupby(lambda s: s[:7]).sum()
        out.append(f"{len(t)/nn:5.0f} lenh/nam TB {t.diem.mean():5.2f}d | {y.sum()/nn:5.1f}%/nam Sh {y.mean()/y.std()*np.sqrt(250):4.2f} sut {(e-np.maximum.accumulate(e)).min():5.1f}% thang lai {(thg>0).mean()*100:3.0f}%")
    print(f"{nhan:50s} | KP {out[0]} | KC {out[1]}")
V_ = lambda x: x.fillna(False).values
trongSang = (D.k <= 90).values; ngoaiVA = V_(F["gia vao NGOAI vung gia tri (cung chieu lenh)"]); t2 = (D.thu == 0).values; t5 = (D.thu == 3).values; bo34 = ~D.thu.isin([1, 2]).values
luat(base, "CO SO moi ngay")
luat(ngoaiVA, "R1 vao NGOAI vung gia tri hom truoc")
luat(trongSang, "R2 vao truoc 10:30")
luat(ngoaiVA & trongSang, "R3 = R1 + R2")
luat(ngoaiVA & trongSang & bo34, "R4 = R3 + bo thu Ba, thu Tu")
luat(t2, "R5 chi thu Hai")
luat(t2 | t5, "R6 thu Hai + thu Nam")
luat(ngoaiVA & (t2 | t5), "R7 thu Hai + thu Nam, vao ngoai vung gia tri")
luat(ngoaiVA & trongSang & (D.bdR < 1.0).values, "R8 = R3 + bien do hom truoc < 1,0 x TB20")
luat(bo34, "R9 chi bo thu Ba, thu Tu")
print("\n   -- do nhay truot gia (R3 va R4): tong %/nam KP | KC --")
for tr in (0.4, 0.8, 1.2, 1.6):
    out = []
    for nhan, m in (("R3", ngoaiVA & trongSang), ("R4", ngoaiVA & trongSang & bo34), ("CO SO", base)):
        s_ = D[m]; adj = s_.pct - (tr - 0.4) / s_.vao * 100
        r = [adj[s_.dK].sum() / (nKP / 250), adj[~s_.dK].sum() / (nKC / 250)]; out.append(f"{nhan} {r[0]:5.1f}|{r[1]:5.1f}")
    print(f"   truot {tr:.1f} diem/vong: " + "   ".join(out))
print("\n   -- theo nam (diem tong, 1 hop dong; trong ngoac = so lenh) --")
nam_(base, "CO SO"); nam_(ngoaiVA & trongSang, "R3 vao ngoai vung gia tri + truoc 10:30"); nam_(ngoaiVA & trongSang & bo34, "R4 = R3 + bo thu Ba, thu Tu"); nam_(t2, "R5 chi thu Hai")
