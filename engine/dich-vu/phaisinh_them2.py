# PHAI SINH VN30F1M - MO RONG 2 (2026-10-14): cac kieu theo MUC GIA co cat lo (mo phong tren nen 1 phut) va CHENH LECH voi chi so VN30.
# Khung chung nhu phaisinh_them1.py: bieu phi MBS + truot gia 0,4 diem; KP = den 06/2022, KC = tu 07/2022; % gia tri hop dong; moi lenh dong truoc 14:29.
# Chay: python engine/dich-vu/phaisinh_them2.py
import numpy as np, pandas as pd
from phaisinh_chung import nap, nap_chi_so, phi, chay_lenh, MOC
from phaisinh_chibao import ghi, xep_hang, KQ
X = nap(); ngay, O, H, L, C, V, ATC, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["V"], X["ATC"], X["sauDao"]
N = len(ngay); vtN = {x: i for i, x in enumerate(ngay)}
pATC = np.r_[np.nan, ATC[:-1]]; dH = H.max(axis=1); dL = L.min(axis=1); pH = np.r_[np.nan, dH[:-1]]; pL = np.r_[np.nan, dL[:-1]]; pO = np.r_[np.nan, O[:-1, 0]]
bd = dH - dL; pBD = np.r_[np.nan, bd[:-1]]; bdTB = pd.Series(bd).rolling(20).mean().shift(1).values
tp = (H + L + C) / 3; VW = np.cumsum(tp * np.maximum(V, 1e-9), axis=1) / np.cumsum(np.maximum(V, 1e-9), axis=1)
def T(nhom, ten, gd):  # gd: list (a, phia, vao, ra)
    lai = np.zeros(N); so = np.zeros(N)
    for a, p, v, r in gd: lai[a] += (p * (r - v) - phi(v)) / v * 100; so[a] += 1
    ghi(nhom, ten, lai, so, ngay)
def L1(a, p, k, gia, cat=None, chot=None, kRa=240):
    j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, gia, cat=cat, chot=chot, kRa=kRa); return (a, p, gia, ra)
ok = lambda a: a >= 1 and not sauDao[a] and not np.isnan(pH[a])

print("=== C1. PIVOT co dien (tu cao / thap / ATC hom truoc) ===")
PP = (pH + pL + pATC) / 3; R1 = 2 * PP - pL; S1 = 2 * PP - pH; R2 = PP + (pH - pL); S2 = PP - (pH - pL)
gd1, gd2, gd3 = [], [], []
for a in range(N):
    if not ok(a): continue
    c, h, l = C[a], H[a], L[a]; xong = False
    for k in range(4, 200, 5):
        if c[k] > R1[a]: gd1.append(L1(a, 1, k, c[k], cat=PP[a])); break
        if c[k] < S1[a]: gd1.append(L1(a, -1, k, c[k], cat=PP[a])); break
    for k in range(1, 200):
        if O[a, 0] < R1[a] and h[k] >= R1[a]: gd2.append(L1(a, -1, k, R1[a], cat=R1[a] + 0.5 * (R2[a] - R1[a]), chot=PP[a])); break
        if O[a, 0] > S1[a] and l[k] <= S1[a]: gd2.append(L1(a, 1, k, S1[a], cat=S1[a] - 0.5 * (S1[a] - S2[a]), chot=PP[a])); break
    p = 1 if O[a, 0] > PP[a] else -1; gd3.append((a, p, C[a, 0], C[a, 240]))
T("muc", "Pivot: nen 5 phut dong cua vuot R1 mua / thung S1 ban, cat lo o P", gd1); T("muc", "Pivot: cham R1 ban / cham S1 mua (danh nguoc), chot o P", gd2); T("muc", "Pivot: mo cua tren P mua ca ngay / duoi P ban ca ngay", gd3)

print("\n=== C2. VUNG GIA TRI HOM TRUOC (volume profile nen 1 phut cua phien truoc: POC, VAH, VAL) ===")
POC = np.full(N, np.nan); VAH = np.full(N, np.nan); VAL = np.full(N, np.nan)
for a in range(N):
    g = np.round(tp[a] * 2) / 2; ks, inv = np.unique(g, return_inverse=True); kl = np.bincount(inv, weights=V[a] + 1e-9); i = kl.argmax(); lo = hi = i; s = kl[i]; tong = kl.sum()
    while s < 0.7 * tong and (lo > 0 or hi < len(ks) - 1):
        if (kl[lo - 1] if lo > 0 else -1) >= (kl[hi + 1] if hi < len(ks) - 1 else -1): lo -= 1; s += kl[lo]
        else: hi += 1; s += kl[hi]
    if a + 1 < N: POC[a + 1], VAH[a + 1], VAL[a + 1] = ks[i], ks[hi], ks[lo]
g80, gTren, gPoc, gVaoVA = [], [], [], []
for a in range(N):
    if not ok(a) or np.isnan(VAH[a]): continue
    c = C[a]; o0 = O[a, 0]
    if o0 > VAH[a] or o0 < VAL[a]:
        tren = o0 > VAH[a]
        for k in range(29, 180, 15):  # 2 nen 15 phut lien tiep dong cua trong vung gia tri -> di sang bien kia
            if VAL[a] <= c[k] <= VAH[a] and VAL[a] <= c[k - 15] <= VAH[a]:
                g80.append(L1(a, -1 if tren else 1, k, c[k], cat=(H[a, :k + 1].max() + 0.5) if tren else (L[a, :k + 1].min() - 0.5), chot=VAL[a] if tren else VAH[a])); break
        if (tren and c[14] > VAH[a]) or (not tren and c[14] < VAL[a]):  # mo cua ngoai vung va 15 phut dau van o ngoai: "chap nhan" -> theo
            gTren.append(L1(a, 1 if tren else -1, 14, c[14], cat=VAH[a] - 0.2 * (VAH[a] - VAL[a]) if tren else VAL[a] + 0.2 * (VAH[a] - VAL[a])))
    if abs(o0 / POC[a] - 1) > 0.003: p = -1 if o0 > POC[a] else 1; gPoc.append(L1(a, p, 0, C[a, 0], cat=C[a, 0] - p * abs(o0 - POC[a]), chot=POC[a]))
    if VAL[a] < o0 < VAH[a]:  # mo cua trong vung: pha ra ngoai thi theo
        for k in range(4, 180, 5):
            if c[k] > VAH[a]: gVaoVA.append(L1(a, 1, k, c[k], cat=POC[a])); break
            if c[k] < VAL[a]: gVaoVA.append(L1(a, -1, k, c[k], cat=POC[a])); break
T("muc", "Luat 80%: mo cua NGOAI vung gia tri roi quay vao 2 nen 15 phut -> di sang bien kia", g80); T("muc", "Mo cua ngoai vung gia tri va 15 phut dau van o ngoai -> danh theo", gTren)
T("muc", "POC hom truoc la nam cham: mo cua lech > 0,3% thi danh ve POC", gPoc); T("muc", "Mo cua TRONG vung gia tri, pha ra ngoai thi theo, cat lo o POC", gVaoVA)

print("\n=== C3. PHA VO BIEN DONG (Larry Williams): dat lenh dung tai gia mo cua +- k x bien do hom truoc ===")
def bien_dong(k_, cat="mo", loc=None, ten=""):
    gd = []
    for a in range(N):
        if not ok(a) or (loc is not None and not loc(a)): continue
        o0 = O[a, 0]; tr, du = o0 + k_ * pBD[a], o0 - k_ * pBD[a]
        for k in range(1, 180):
            if H[a, k] >= tr: gd.append(L1(a, 1, k, max(O[a, k], tr), cat=o0 if cat == "mo" else du)); break
            if L[a, k] <= du: gd.append(L1(a, -1, k, min(O[a, k], du), cat=o0 if cat == "mo" else tr)); break
    T("muc", ten or f"k = {k_}, cat lo o {'gia mo cua' if cat == 'mo' else 'muc doi dien'}", gd)
for k_ in (0.2, 0.3, 0.5, 0.7): bien_dong(k_)
bien_dong(0.3, "doi"); bien_dong(0.5, "doi")
nr7 = np.array([a >= 7 and pBD[a] <= np.nanmin(bd[a - 7:a]) for a in range(N)]); trong = np.array([a >= 2 and pH[a] <= dH[a - 2] and pL[a] >= dL[a - 2] for a in range(N)])
bien_dong(0.3, "mo", lambda a: nr7[a], "k = 0,3 chi sau ngay NEN (bien do hep nhat 7 ngay)"); bien_dong(0.3, "mo", lambda a: not nr7[a], "k = 0,3 cac ngay con lai")
bien_dong(0.3, "mo", lambda a: trong[a], "k = 0,3 chi sau ngay nam TRONG bien do ngay truoc do (inside day)")
bien_dong(0.3, "mo", lambda a: pBD[a] > 1.5 * bdTB[a], "k = 0,3 sau ngay bien do LON (> 1,5 lan TB)"); bien_dong(0.3, "mo", lambda a: pBD[a] < 0.7 * bdTB[a], "k = 0,3 sau ngay bien do NHO (< 0,7 lan TB)")

print("\n=== C4. CAC KIEU PHA VO KHAC ===")
def orb(k0, k1, truoc, loc=None, kl=False, phiaLoc=None):
    gd = []
    for a in range(N):
        if loc is not None and not loc(a): continue
        hi, lo = H[a, k0:k1].max(), L[a, k0:k1].min(); vtb = V[a, :k1].mean()
        for k in range(k1, truoc):
            p = 1 if C[a, k] > hi else -1 if C[a, k] < lo else 0
            if not p: continue
            if kl and V[a, k] < 2 * vtb: continue
            if phiaLoc is not None and p != phiaLoc(a): break
            gd.append(L1(a, p, k, C[a, k], cat=lo if p > 0 else hi)); break
    return gd
T("pha", "ORB 15 phut (GOC, de so sanh)", orb(0, 15, 180))
T("pha", "ORB 15 phut chi khi phut pha vo co KL >= 2 lan TB", orb(0, 15, 180, kl=True))
T("pha", "ORB 15 phut sau ngay NEN (NR7)", orb(0, 15, 180, loc=lambda a: nr7[a])); T("pha", "ORB 15 phut sau ngay nam trong (inside day)", orb(0, 15, 180, loc=lambda a: trong[a]))
T("pha", "ORB 15 phut chi theo huong GAP mo cua", orb(0, 15, 180, loc=ok, phiaLoc=lambda a: 1 if O[a, 0] > pATC[a] else -1))
T("pha", "ORB 15 phut chi NGUOC huong gap", orb(0, 15, 180, loc=ok, phiaLoc=lambda a: -1 if O[a, 0] > pATC[a] else 1))
homTruocTang = np.r_[False, (ATC[:-1] > O[:-1, 0])]
T("pha", "ORB 15 phut chi theo huong ngay hom truoc", orb(0, 15, 180, loc=ok, phiaLoc=lambda a: 1 if homTruocTang[a] else -1)); T("pha", "ORB 15 phut chi NGUOC huong ngay hom truoc", orb(0, 15, 180, loc=ok, phiaLoc=lambda a: -1 if homTruocTang[a] else 1))
T("pha", "ORB buoi CHIEU: khoang 13:00-13:15, pha vo truoc 14:15", orb(151, 166, 226)); T("pha", "Khoang ca BUOI SANG, pha vo o buoi chieu", orb(0, 151, 226))
T("pha", "Khoang 9:00-10:00, pha vo sau do", orb(0, 60, 200)); T("pha", "Khoang 9:15-9:45 (bo 15 phut dau), pha vo sau do", orb(15, 45, 180))
gd = []; gd2 = []
for a in range(N):
    if not ok(a): continue
    for k in range(4, 200, 5):
        if C[a, k] > pH[a]: gd.append(L1(a, 1, k, C[a, k], cat=pH[a] * 0.997)); break
        if C[a, k] < pL[a]: gd.append(L1(a, -1, k, C[a, k], cat=pL[a] * 1.003)); break
    if O[a, 0] > pH[a]: gd2.append(L1(a, 1, 0, C[a, 0], cat=pH[a]))
    elif O[a, 0] < pL[a]: gd2.append(L1(a, -1, 0, C[a, 0], cat=pL[a]))
T("pha", "Vuot dinh / thung day HOM TRUOC (nen 5 phut dong cua) -> theo, cat lo 0,3%", gd); T("pha", "Mo cua NGOAI bien do hom truoc -> theo ca ngay, cat lo o dinh / day cu", gd2)
gd = []
for a in range(N):
    h5, l5, c5, o5 = H[a, :5].max(), L[a, :5].min(), C[a, 4], O[a, 0]
    if h5 - l5 < 0.0015 * o5: continue
    v = (c5 - l5) / (h5 - l5)
    if v >= 0.75: gd.append(L1(a, 1, 4, c5, cat=l5))
    elif v <= 0.25: gd.append(L1(a, -1, 4, c5, cat=h5))
T("pha", "Nen 5 phut DAU TIEN manh (dong cua o 25% dau nen): theo, cat lo o dau kia", gd)
for ng in (0.8, 1.2):
    g1, g2 = [], []
    for a in range(N):
        r = (C[a, 180] / O[a, 0] - 1) * 100
        if abs(r) >= ng: p = 1 if r > 0 else -1; g1.append((a, p, C[a, 180], C[a, 240])); g2.append((a, -p, C[a, 180], C[a, 240]))
    T("pha", f"13:30 gia da di >= {ng}% tu mo cua: danh THEO den 14:29", g1); T("pha", f"13:30 gia da di >= {ng}% tu mo cua: danh NGUOC den 14:29", g2)
gd = []
for a in range(N):
    hi, lo = H[a, :151].max(), L[a, :151].min(); r = (C[a, 150] / O[a, 0] - 1) * 100
    if abs(r) < 0.4 or hi == lo: continue
    v = (C[a, 150] - lo) / (hi - lo)
    if r > 0 and v >= 0.8: gd.append(L1(a, 1, 151, O[a, 151], cat=(hi + lo) / 2))
    if r < 0 and v <= 0.2: gd.append(L1(a, -1, 151, O[a, 151], cat=(hi + lo) / 2))
T("pha", "Buoi sang di manh va dong cua sat cuc tri -> buoi chieu di tiep, cat lo o giua khoang sang", gd)

print("\n=== D. CHENH LECH VOI CHI SO VN30 (basis = gia hop dong - chi so; du lieu chi so tu 05/2020) ===")
I = nap_chi_so(ngay); coI = ~np.isnan(I[:, 0]); B = (C - I) / I * 100
print(f"   so ngay co chi so: {coI.sum()} | basis trung binh {np.nanmean(B):.3f}% | do lech chuan {np.nanstd(B):.3f}% | ty le phut basis am: {np.nanmean(B < 0)*100:.0f}%")
gd = []; gd2 = []
for a in range(N):
    if not coI[a]: continue
    b = pd.Series(B[a]); z = ((b - b.rolling(30).mean()) / b.rolling(30).std()).values; k = 35
    while k < 220:
        if abs(z[k]) >= 2.5:
            p = -1 if z[k] > 0 else 1; ra = None
            for j in range(k + 1, min(k + 31, 241)):
                if (p > 0 and z[j] >= 0) or (p < 0 and z[j] <= 0): ra = j; break
            ra = ra or min(k + 30, 240); gd.append((a, p, C[a, k], C[a, ra])); k = ra + 5
        else: k += 1
    b15 = B[a, 14]; hi, lo = H[a, :15].max(), L[a, :15].min()
    for k in range(15, 180):
        p = 1 if C[a, k] > hi else -1 if C[a, k] < lo else 0
        if p:
            if (p > 0) == (b15 > np.nanmedian(B[max(0, a - 20):a]) if a > 0 else True): gd2.append(L1(a, p, k, C[a, k], cat=lo if p > 0 else hi))
            break
T("basis", "Basis lech >= 2,5 do lech chuan (30 phut) -> danh nguoc cho basis ve binh thuong (toi da 30 phut)", gd)
T("basis", "ORB 15 phut chi khi basis luc 9:15 cung huong (cao hon trung vi 20 ngay thi chi mua)", gd2)
T("basis", "ORB 15 phut tren cung cac ngay co chi so (de so sanh)", orb(0, 15, 180, loc=lambda a: coI[a]))
# dan dat: chi so 5 phut vua qua -> hop dong 5 phut toi
x = []; y = []
for a in range(N):
    if not coI[a]: continue
    for k in range(20, 230, 5): x.append(I[a, k] / I[a, k - 5] - 1); y.append(C[a, k + 5] / C[a, k] - 1)
x, y = np.array(x), np.array(y); print(f"   Tuong quan: loi suat chi so 5 phut vua qua voi hop dong 5 phut toi = {np.corrcoef(x, y)[0, 1]:.3f} (n = {len(x)})")
x = []; y = []
for a in range(N):
    if not coI[a]: continue
    for k in range(20, 230, 5): x.append(C[a, k] / C[a, k - 5] - 1); y.append(I[a, k + 5] / I[a, k] - 1)
print(f"   Tuong quan: loi suat hop dong 5 phut vua qua voi CHI SO 5 phut toi = {np.corrcoef(np.array(x), np.array(y))[0, 1]:.3f}  (hop dong di truoc chi so)")
g1, g2 = [], []
bCuoi = B[:, 240]
for a in range(1, N - 1):
    if not coI[a] or sauDao[a + 1]: continue
    if bCuoi[a] <= -0.5: g1.append((a + 1, 1, O[a + 1, 0], C[a + 1, 240]))
    if bCuoi[a] >= 0.3: g2.append((a + 1, -1, O[a + 1, 0], C[a + 1, 240]))
T("basis", "Hom truoc dong cua basis AM sau (<= -0,5%): mua ca ngay hom sau", g1); T("basis", "Hom truoc dong cua basis DUONG (>= +0,3%): ban khong ca ngay hom sau", g2)
xep_hang(15)
