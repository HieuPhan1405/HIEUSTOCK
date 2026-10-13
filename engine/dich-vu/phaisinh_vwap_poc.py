# PHAI SINH VN30F1M - VWAP KET HOP POC (2026-10-14): VWAP co nang cap duoc gi khi di cung POC khong?
#   VWAP  = gia binh quan theo khoi luong tinh tu dau phien (tinh den het phut k)
#   dPOC  = muc gia co khoi luong lon nhat TU DAU PHIEN den het phut k (POC "dang hinh thanh"), bac gia 0,5 diem, khoi luong moi phut rai deu tren [thap, cao]
#   pPOC / pVWAP / pVAH / pVAL = POC, VWAP ca phien, bien tren / duoi vung gia tri 70% cua PHIEN TRUOC
# 4 phan: (1) boi canh - ben nao cua VWAP / POC thi gia di tiep ve dau; (2) dung lam BO LOC cho 2 kieu pha vo da kiem chung;
#         (3) dung lam DIEM THOAT cho 2 kieu do; (4) cac kieu danh rieng VWAP + POC.
# Chi phi: bieu phi MBS + truot gia 0,4 diem / vong (phaisinh_chung.phi). KP = kham pha (truoc 07/2022), KC = kiem chung (tu 07/2022).
# Chay: python engine/dich-vu/phaisinh_vwap_poc.py
import numpy as np
from phaisinh_chung import nap, phi, MOC
X = nap(); ngay, O, H, L, C, V, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["V"], X["sauDao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); nKP, nKC = dK.sum(), (~dK).sum()
bd = H.max(axis=1) - L.min(axis=1); pBD = np.r_[np.nan, bd[:-1]]

# ---- VWAP, do lech chuan quanh VWAP, POC dang hinh thanh ----
tp = (H + L + C) / 3; Vd = V + 1e-9
cV = np.cumsum(Vd, axis=1); VW = np.cumsum(tp * Vd, axis=1) / cV
SD = np.sqrt(np.maximum(np.cumsum(tp * tp * Vd, axis=1) / cV - VW * VW, 0))
dPOC = np.full((N, 241), np.nan); pPOC = np.full(N, np.nan); pVAH = np.full(N, np.nan); pVAL = np.full(N, np.nan)
for a in range(N):
    lo0 = int(np.floor(L[a].min() * 2)); hs = np.zeros(int(np.floor(H[a].max() * 2)) - lo0 + 1)
    for k in range(241):
        i0, i1 = int(np.floor(L[a, k] * 2)) - lo0, int(np.floor(H[a, k] * 2)) - lo0
        hs[i0:i1 + 1] += Vd[a, k] / (i1 - i0 + 1)
        dPOC[a, k] = (hs.argmax() + lo0) / 2 + 0.25
    i = hs.argmax(); lo = hi = i; s = hs[i]; tong = hs.sum()
    while s < 0.7 * tong and (lo > 0 or hi < len(hs) - 1):
        if (hs[lo - 1] if lo > 0 else -1) >= (hs[hi + 1] if hi < len(hs) - 1 else -1): lo -= 1; s += hs[lo]
        else: hi += 1; s += hs[hi]
    if a + 1 < N: pPOC[a + 1] = (i + lo0) / 2 + 0.25; pVAH[a + 1] = (hi + lo0) / 2 + 0.5; pVAL[a + 1] = (lo + lo0) / 2
pVW = np.r_[np.nan, VW[:-1, 240]]
print(f"{N} phien {ngay[0]} -> {ngay[-1]} | kham pha {nKP}, kiem chung {nKC}")
print(f"Khoang cach VWAP - POC cuoi phien: trung vi {np.median(np.abs(VW[:,240]-dPOC[:,240])):.2f} diem = {np.median(np.abs(VW[:,240]-dPOC[:,240])/bd)*100:.0f}% bien do ngay; VWAP > POC {100*(VW[:,240]>dPOC[:,240]).mean():.0f}% so phien")

def dg(ten, gd):
    if not gd: print(f"  {ten:66s} | khong co lenh"); return None
    a = np.array([g[0] for g in gd]); p = np.array([g[1] for g in gd]); v = np.array([g[2] for g in gd], float); r = np.array([g[3] for g in gd], float)
    d = p * (r - v) - phi(v); pct = d / v * 100; ra = []
    for nhan, m, nd in (("KP", dK[a], nKP), ("KC", ~dK[a], nKC)):
        if m.sum() < 3: ra.append(f"{nhan} n={m.sum():4d}" + " " * 44); continue
        x = d[m]; t = x.mean() / x.std(ddof=1) * np.sqrt(len(x))
        ra.append(f"{nhan} n={m.sum():4d} TB {x.mean():+5.2f}d thang {100*(x>0).mean():3.0f}% {pct[m].sum()/(nd/250):+6.1f}%/nam t={t:+4.1f}")
    print(f"  {ten:66s} | " + " | ".join(ra)); return d

# mo phong: vao tai (k, gia), cat lo co dinh `cat`, thoat som khi thoat(j) dung (xet o gia dong cua phut j, moi `buoc` phut), con lai dong 14:29
def chay(a, p, k, gia, cat=None, chot=None, thoat=None, buoc=5):
    o, h, l, c = O[a], H[a], L[a], C[a]
    for j in range(k + 1, 241):
        if p > 0:
            if cat is not None and l[j] <= cat: return min(o[j], cat)
            if chot is not None and h[j] >= chot: return max(o[j], chot)
        else:
            if cat is not None and h[j] >= cat: return max(o[j], cat)
            if chot is not None and l[j] <= chot: return min(o[j], chot)
        if thoat is not None and j % buoc == buoc - 1 and j < 240 and thoat(j): return c[j]
    return c[240]

def orb(Nm=15, thoat=None, catKhac=None):
    gd = []
    for a in range(1, N):
        hi, lo = H[a, :Nm].max(), L[a, :Nm].min()
        for k in range(Nm, 180):
            p = 1 if C[a, k] > hi else -1 if C[a, k] < lo else 0
            if p:
                cat = lo if p > 0 else hi
                gd.append((a, p, k, C[a, k], chay(a, p, k, C[a, k], cat=cat if catKhac is None else catKhac(a, p, k, cat), thoat=None if thoat is None else (lambda j, a=a, p=p: thoat(a, p, j))))); break
    return gd
def vb(k_=0.3, thoat=None, catKhac=None):
    gd = []
    for a in range(1, N):
        if sauDao[a] or np.isnan(pBD[a]): continue
        o0 = O[a, 0]; tr, du = o0 + k_ * pBD[a], o0 - k_ * pBD[a]
        for k in range(1, 180):
            p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
            if p:
                gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du)
                gd.append((a, p, k, gia, chay(a, p, k, gia, cat=o0 if catKhac is None else catKhac(a, p, k, o0), thoat=None if thoat is None else (lambda j, a=a, p=p: thoat(a, p, j))))); break
    return gd
bo = lambda gd: [(a, p, v, r) for a, p, k, v, r in gd]
loc = lambda gd, dk: [(a, p, v, r) for a, p, k, v, r in gd if dk(a, p, k, v)]
GOC_VB, GOC_ORB = vb(0.3), orb(15)

print("\n=== 1. BOI CANH: dung o moc gio, danh theo phia cua gia so voi VWAP / POC, giu den 14:29, khong cat lo ===")
for k0, gio in ((30, "9:30"), (60, "10:00"), (120, "11:00"), (160, "13:10")):
    print(f" -- luc {gio} --")
    s = {"VWAP": [], "dPOC": [], "pPOC": [], "VWAP + dPOC cung phia": [], "VWAP va dPOC nguoc phia (theo VWAP)": [], "VWAP + dPOC + pPOC cung phia": [], "Theo dau (VWAP - dPOC): VWAP tren POC thi mua": []}
    for a in range(1, N):
        c = C[a, k0]; pv = np.sign(c - VW[a, k0]); pd_ = np.sign(c - dPOC[a, k0]); pp = np.sign(c - pPOC[a]) if not np.isnan(pPOC[a]) else 0
        if pv: s["VWAP"].append((a, pv, c, C[a, 240]))
        if pd_: s["dPOC"].append((a, pd_, c, C[a, 240]))
        if pp: s["pPOC"].append((a, pp, c, C[a, 240]))
        if pv and pv == pd_: s["VWAP + dPOC cung phia"].append((a, pv, c, C[a, 240]))
        if pv and pd_ and pv != pd_: s["VWAP va dPOC nguoc phia (theo VWAP)"].append((a, pv, c, C[a, 240]))
        if pv and pv == pd_ == pp: s["VWAP + dPOC + pPOC cung phia"].append((a, pv, c, C[a, 240]))
        sk = np.sign(VW[a, k0] - dPOC[a, k0])
        if sk: s["Theo dau (VWAP - dPOC): VWAP tren POC thi mua"].append((a, sk, c, C[a, 240]))
    for ten, gd in s.items(): dg(ten, gd)

print("\n=== 2. BO LOC cho 2 kieu pha vo (thong tin biet TRUOC khi vao lenh) ===")
def boLoc(ten, G):
    print(f" -- {ten} --"); dg("GOC (khong loc)", bo(G))
    V1 = lambda a, k: VW[a, k - 1]; D1 = lambda a, k: dPOC[a, k - 1]
    cs = [
        ("pPOC thuan (gia vao da qua POC hom truoc)", lambda a, p, k, v: p * (v - pPOC[a]) > 0),
        ("pPOC nghich (POC hom truoc con o phia truoc)", lambda a, p, k, v: p * (v - pPOC[a]) < 0),
        ("   ... va POC o gan (< 0,3 bien do hom truoc)", lambda a, p, k, v: p * (v - pPOC[a]) < 0 and abs(v - pPOC[a]) < 0.3 * pBD[a]),
        ("   ... va POC o xa (>= 0,3 bien do)", lambda a, p, k, v: p * (v - pPOC[a]) < 0 and abs(v - pPOC[a]) >= 0.3 * pBD[a]),
        ("pVWAP thuan (da qua VWAP hom truoc)", lambda a, p, k, v: p * (v - pVW[a]) > 0),
        ("pVWAP nghich", lambda a, p, k, v: p * (v - pVW[a]) < 0),
        ("pPOC + pVWAP deu thuan", lambda a, p, k, v: p * (v - pPOC[a]) > 0 and p * (v - pVW[a]) > 0),
        ("pPOC + pVWAP deu nghich", lambda a, p, k, v: p * (v - pPOC[a]) < 0 and p * (v - pVW[a]) < 0),
        ("pPOC va pVWAP lech nhau", lambda a, p, k, v: (p * (v - pPOC[a]) > 0) != (p * (v - pVW[a]) > 0)),
        ("VWAP hom nay thuan (gia vao ngoai VWAP)", lambda a, p, k, v: p * (v - V1(a, k)) > 0),
        ("VWAP hom nay nghich", lambda a, p, k, v: p * (v - V1(a, k)) <= 0),
        ("dPOC hom nay thuan", lambda a, p, k, v: p * (v - D1(a, k)) > 0),
        ("dPOC hom nay nghich", lambda a, p, k, v: p * (v - D1(a, k)) <= 0),
        ("VWAP lech ve phia lenh so voi dPOC (VWAP - POC cung dau)", lambda a, p, k, v: p * (V1(a, k) - D1(a, k)) > 0),
        ("VWAP lech nguoc phia lenh so voi dPOC", lambda a, p, k, v: p * (V1(a, k) - D1(a, k)) < 0),
        ("Hom truoc VWAP - POC cung dau voi lenh", lambda a, p, k, v: p * (pVW[a] - pPOC[a]) > 0),
        ("Hom truoc VWAP - POC nguoc dau voi lenh", lambda a, p, k, v: p * (pVW[a] - pPOC[a]) < 0),
        ("Mo cua NGOAI vung gia tri hom truoc, lenh cung huong", lambda a, p, k, v: (O[a, 0] > pVAH[a] and p > 0) or (O[a, 0] < pVAL[a] and p < 0)),
        ("Mo cua NGOAI vung gia tri hom truoc, lenh nguoc huong (quay vao)", lambda a, p, k, v: (O[a, 0] > pVAH[a] and p < 0) or (O[a, 0] < pVAL[a] and p > 0)),
        ("Mo cua TRONG vung gia tri hom truoc", lambda a, p, k, v: pVAL[a] <= O[a, 0] <= pVAH[a]),
        ("   ... va gia vao da ra khoi vung gia tri", lambda a, p, k, v: pVAL[a] <= O[a, 0] <= pVAH[a] and ((p > 0 and v > pVAH[a]) or (p < 0 and v < pVAL[a]))),
        ("   ... va gia vao con trong vung gia tri", lambda a, p, k, v: pVAL[a] <= O[a, 0] <= pVAH[a] and pVAL[a] <= v <= pVAH[a]),
    ]
    for t, f in cs: dg(t, loc(G, lambda a, p, k, v, f=f: not np.isnan(pPOC[a]) and not np.isnan(pBD[a]) and f(a, p, k, v)))
boLoc("PHA VO BIEN DONG 0,3", GOC_VB); boLoc("KHOANG MO CUA 15 PHUT", GOC_ORB)

print("\n=== 3. DIEM THOAT: giu cat lo goc, them thoat som khi nen 5 phut dong cua ve ben kia cua ... ===")
tV = lambda a, p, j: p * (C[a, j] - VW[a, j]) < 0
tD = lambda a, p, j: p * (C[a, j] - dPOC[a, j]) < 0
tVD = lambda a, p, j: p * (C[a, j] - VW[a, j]) < 0 and p * (C[a, j] - dPOC[a, j]) < 0
tV1 = lambda a, p, j: p * (C[a, j] - VW[a, j]) < -1.0
for ten, f in (("PHA VO BIEN DONG 0,3", vb), ("KHOANG MO CUA 15 PHUT", orb)):
    print(f" -- {ten} --"); dg("GOC", bo(f()))
    dg("+ thoat khi dong cua qua VWAP", bo(f(thoat=tV))); dg("+ thoat khi qua VWAP hon 1 diem", bo(f(thoat=tV1)))
    dg("+ thoat khi dong cua qua dPOC", bo(f(thoat=tD))); dg("+ thoat khi qua CA VWAP va dPOC", bo(f(thoat=tVD)))
    dg("Bo cat lo goc, chi thoat khi qua VWAP", bo(f(thoat=tV, catKhac=lambda a, p, k, cat: None)))
    dg("Bo cat lo goc, chi thoat khi qua CA VWAP va dPOC", bo(f(thoat=tVD, catKhac=lambda a, p, k, cat: None)))
    dg("Cat lo dat tai dPOC luc vao (neu gan hon cat lo goc)", bo(f(catKhac=lambda a, p, k, cat: (max(cat, dPOC[a, k - 1]) if p > 0 else min(cat, dPOC[a, k - 1])) if p * (C[a, k - 1] - dPOC[a, k - 1]) > 0 else cat)))

print("\n=== 4. KIEU DANH RIENG VWAP + POC (toi da 1 lenh / ngay, chi vao 9:30 - 13:29, dong 14:29) ===")
def keoVe(dkPOC, catHS=0.2):  # gia giu tren VWAP 20 phut, hoi ve cham VWAP -> mua (va nguoc lai)
    gd = []
    for a in range(1, N):
        if np.isnan(pBD[a]): continue
        for k in range(30, 180):
            vw = VW[a, k - 1]; cu = C[a, k - 20:k]
            p = 1 if (cu > VW[a, k - 20:k]).all() and L[a, k] <= vw else -1 if (cu < VW[a, k - 20:k]).all() and H[a, k] >= vw else 0
            if p and dkPOC(a, p, k):
                gia = min(O[a, k], vw) if p > 0 else max(O[a, k], vw); gd.append((a, p, gia, chay(a, p, k, gia, cat=gia - p * catHS * pBD[a]))); break
            if p: break
    return gd
dg("Hoi ve VWAP trong xu huong: khong xet POC", keoVe(lambda a, p, k: True))
dg("   ... chi khi VWAP nam ve phia lenh so voi dPOC", keoVe(lambda a, p, k: p * (VW[a, k - 1] - dPOC[a, k - 1]) > 0))
dg("   ... chi khi VWAP nguoc phia lenh so voi dPOC", keoVe(lambda a, p, k: p * (VW[a, k - 1] - dPOC[a, k - 1]) < 0))
dg("   ... chi khi gia da qua pPOC (thuan)", keoVe(lambda a, p, k: p * (VW[a, k - 1] - pPOC[a]) > 0))
dg("   ... VWAP trung dPOC (cach < 0,05 bien do): hop luu", keoVe(lambda a, p, k: abs(VW[a, k - 1] - dPOC[a, k - 1]) < 0.05 * pBD[a]))

def catVWAP(dkPOC, catHS=0.3):  # nen 5 phut dong cua cat len VWAP -> mua
    gd = []
    for a in range(1, N):
        if np.isnan(pBD[a]): continue
        for k in range(34, 180, 5):
            p = 1 if C[a, k - 5] <= VW[a, k - 5] and C[a, k] > VW[a, k] else -1 if C[a, k - 5] >= VW[a, k - 5] and C[a, k] < VW[a, k] else 0
            if p and dkPOC(a, p, k): gd.append((a, p, C[a, k], chay(a, p, k, C[a, k], cat=C[a, k] - p * catHS * pBD[a]))); break
    return gd
dg("Nen 5 phut cat VWAP (lan dau du dieu kien): khong xet POC", catVWAP(lambda a, p, k: True))
dg("   ... va gia dong cua da qua dPOC", catVWAP(lambda a, p, k: p * (C[a, k] - dPOC[a, k]) > 0))
dg("   ... va da qua ca dPOC lan pPOC", catVWAP(lambda a, p, k: p * (C[a, k] - dPOC[a, k]) > 0 and p * (C[a, k] - pPOC[a]) > 0))
dg("   ... nhung dPOC con o phia truoc (nghich)", catVWAP(lambda a, p, k: p * (C[a, k] - dPOC[a, k]) < 0))

def danhNguoc(dkPOC, z0=2.0):  # gia lech VWAP >= z0 do lech chuan -> danh nguoc ve VWAP, cat lo khi lech them 1,5 do lech chuan
    gd = []
    for a in range(1, N):
        if np.isnan(pBD[a]): continue
        for k in range(60, 180):
            sd = SD[a, k]
            if sd < 0.3: continue
            z = (C[a, k] - VW[a, k]) / sd
            if abs(z) >= z0:
                p = -int(np.sign(z))
                if dkPOC(a, p, k): gd.append((a, p, C[a, k], chay(a, p, k, C[a, k], cat=C[a, k] - p * 1.5 * sd, chot=VW[a, k])))
                break
    return gd
dg("Lech VWAP >= 2 do lech chuan -> danh nguoc ve VWAP: khong xet POC", danhNguoc(lambda a, p, k: True))
dg("   ... chi khi VWAP trung dPOC (cach < 0,1 bien do): ngay can bang", danhNguoc(lambda a, p, k: abs(VW[a, k] - dPOC[a, k]) < 0.1 * pBD[a]))
dg("   ... chi khi VWAP xa dPOC (>= 0,1 bien do): ngay lech", danhNguoc(lambda a, p, k: abs(VW[a, k] - dPOC[a, k]) >= 0.1 * pBD[a]))
dg("   ... chi khi dPOC nam giua gia va VWAP hoac ngoai VWAP (dich ro)", danhNguoc(lambda a, p, k: p * (dPOC[a, k] - C[a, k]) > 0))

def chamPOC(dk, catHS=0.2, xuyen=False):  # mo cua cach pPOC > 0,1 bien do; lan dau gia cham pPOC -> danh bat lai (xuyen = danh tiep theo huong dang di)
    gd = []
    for a in range(1, N):
        if np.isnan(pBD[a]) or np.isnan(pPOC[a]): continue
        o0 = O[a, 0]; poc = pPOC[a]
        if abs(o0 - poc) < 0.1 * pBD[a]: continue
        p = 1 if o0 > poc else -1
        for k in range(1, 180):
            if (p > 0 and L[a, k] <= poc) or (p < 0 and H[a, k] >= poc):
                if dk(a, p, k):
                    gia = min(O[a, k], poc) if p > 0 else max(O[a, k], poc); q = -p if xuyen else p
                    gd.append((a, q, gia, chay(a, q, k, gia, cat=gia - q * catHS * pBD[a])))
                break
    return gd
dg("Lan dau cham POC hom truoc -> danh bat lai: khong xet VWAP", chamPOC(lambda a, p, k: True))
dg("   ... chi khi VWAP hom nay trung POC do (cach < 0,1 bien do): hop luu", chamPOC(lambda a, p, k: abs(VW[a, k - 1] - pPOC[a]) < 0.1 * pBD[a]))
dg("   ... chi khi VWAP hom nay o xa POC do", chamPOC(lambda a, p, k: abs(VW[a, k - 1] - pPOC[a]) >= 0.1 * pBD[a]))
dg("   ... chi khi VWAP hom truoc cung trung POC (cach < 0,1 bien do)", chamPOC(lambda a, p, k: abs(pVW[a] - pPOC[a]) < 0.1 * pBD[a]))
dg("Lan dau cham POC hom truoc -> danh XUYEN QUA: khong xet VWAP", chamPOC(lambda a, p, k: True, xuyen=True))
dg("   ... chi khi VWAP hom nay da o ben kia POC (thuan huong xuyen)", chamPOC(lambda a, p, k: p * (VW[a, k - 1] - pPOC[a]) < 0, xuyen=True))
dg("   ... chi khi VWAP hom nay con o ben nay POC", chamPOC(lambda a, p, k: p * (VW[a, k - 1] - pPOC[a]) > 0, xuyen=True))

print("\n=== 5. DAO SAU diem duy nhat co ve nhat quan: vi tri GIA VAO LENH so voi vung gia tri hom truoc (pVAL .. pVAH) ===")
pH = np.r_[np.nan, H.max(axis=1)[:-1]]; pL = np.r_[np.nan, L.min(axis=1)[:-1]]; pC = np.r_[np.nan, C[:-1, 240]]
print(f"  Vung gia tri hom truoc rong trung vi {np.nanmedian((pVAH-pVAL)/pBD)*100:.0f}% bien do hom truoc")
def nhomVA(a, p, k, v):
    if pVAL[a] <= v <= pVAH[a]: return "trong vung gia tri"
    return "ngoai, di RA xa vung" if (p > 0 and v > pVAH[a]) or (p < 0 and v < pVAL[a]) else "ngoai, di VAO vung"
def nhomGia(a, p, k, v, bien=0.15):  # doi chung KHONG dung khoi luong: vi tri trong bien do gia hom truoc
    q = (v - pL[a]) / (pH[a] - pL[a])
    if bien <= q <= 1 - bien: return "trong 70% giua bien do"
    return "ngoai, di RA" if (p > 0 and q > 1 - bien) or (p < 0 and q < bien) else "ngoai, di VAO"
hl = lambda a: not np.isnan(pVAH[a]) and not np.isnan(pBD[a]) and pBD[a] > 0
rng = np.random.default_rng(7); thangN = np.array([x[:7] for x in ngay])
def chenh(G, f, n1, n0, B=3000):  # chenh lech diem TB giua 2 nhom, khoang tin cay 90% lay mau lai theo THANG
    rows = [(a, p * (r - v) - phi(v), f(a, p, k, v)) for a, p, k, v, r in G if hl(a)]
    ra = []
    for nhan, m in (("KP", True), ("KC", False)):
        rr = [x for x in rows if dK[x[0]] == m]; ths = sorted({thangN[x[0]] for x in rr}); theo = {t: [x for x in rr if thangN[x[0]] == t] for t in ths}
        ds = []
        for _ in range(B):
            chon = [y for t in rng.choice(ths, len(ths)) for y in theo[t]]
            x1 = [d for _, d, g in chon if g == n1]; x0 = [d for _, d, g in chon if g == n0]
            if x1 and x0: ds.append(np.mean(x1) - np.mean(x0))
        x1 = [d for _, d, g in rr if g == n1]; x0 = [d for _, d, g in rr if g == n0]
        ra.append(f"{nhan}: {np.mean(x1)-np.mean(x0):+.2f}d [{np.percentile(ds,5):+.2f} .. {np.percentile(ds,95):+.2f}]")
    print(f"     chenh lech ({n1}) - ({n0}): " + " | ".join(ra))
for ten, G in (("PHA VO BIEN DONG 0,3", GOC_VB), ("KHOANG MO CUA 15 PHUT", GOC_ORB)):
    print(f" -- {ten} --")
    for g in ("ngoai, di RA xa vung", "trong vung gia tri", "ngoai, di VAO vung"): dg("Vung gia tri (co khoi luong): " + g, loc(G, lambda a, p, k, v, g=g: hl(a) and nhomVA(a, p, k, v) == g))
    chenh(G, nhomVA, "ngoai, di RA xa vung", "trong vung gia tri")
    for g in ("ngoai, di RA", "trong 70% giua bien do", "ngoai, di VAO"): dg("Doi chung chi dung GIA: " + g, loc(G, lambda a, p, k, v, g=g: hl(a) and nhomGia(a, p, k, v) == g))
    chenh(G, nhomGia, "ngoai, di RA", "trong 70% giua bien do")
    dg("Doi chung: gia vao da VUOT dinh / thung day hom truoc", loc(G, lambda a, p, k, v: hl(a) and ((p > 0 and v > pH[a]) or (p < 0 and v < pL[a]))))
    dg("Doi chung: gia vao con TRONG bien do hom truoc", loc(G, lambda a, p, k, v: hl(a) and pL[a] <= v <= pH[a]))
    dg("Doi chung: lenh cung huong so voi gia dong cua hom truoc", loc(G, lambda a, p, k, v: hl(a) and p * (v - pC[a]) > 0))
    dg("Doi chung: lenh nguoc huong so voi gia dong cua hom truoc", loc(G, lambda a, p, k, v: hl(a) and p * (v - pC[a]) <= 0))
    print("   Bang cheo (diem TB sau phi, n): hang = vung gia tri, cot = 70% giua bien do gia")
    for m, nhan in ((True, "KP"), (False, "KC")):
        for gv in ("trong vung gia tri", "ngoai, di RA xa vung"):
            o_ = []
            for gg in ("trong 70% giua bien do", "ngoai, di RA"):
                x = [p * (r - v) - phi(v) for a, p, k, v, r in G if hl(a) and dK[a] == m and nhomVA(a, p, k, v) == gv and nhomGia(a, p, k, v) == gg]
                o_.append(f"{gg}: {np.mean(x) if x else float('nan'):+5.2f}d n={len(x):3d}")
            print(f"     {nhan} {gv:22s} | " + " | ".join(o_))
    print("   Theo nam (tong % gia tri hop dong): goc / bo lenh 'trong vung gia tri' / rieng nhom 'trong vung'")
    for y in sorted({x[:4] for x in ngay}):
        t0 = sum((p * (r - v) - phi(v)) / v * 100 for a, p, k, v, r in G if ngay[a][:4] == y)
        t1 = sum((p * (r - v) - phi(v)) / v * 100 for a, p, k, v, r in G if ngay[a][:4] == y and not (hl(a) and nhomVA(a, p, k, v) == "trong vung gia tri"))
        n1 = sum(1 for a, p, k, v, r in G if ngay[a][:4] == y and hl(a) and nhomVA(a, p, k, v) == "trong vung gia tri")
        print(f"     {y}: goc {t0:+6.1f}% | bo loc {t1:+6.1f}% | nhom bi bo {t0-t1:+6.1f}% ({n1} lenh)")
    def sut(gd):
        x = np.zeros(N)
        for a, p, v, r in gd: x[a] += (p * (r - v) - phi(v)) / v * 100
        e = np.cumsum(x[~dK]); return (e - np.maximum.accumulate(np.r_[0, e])[1:]).min()
    loc_ = loc(G, lambda a, p, k, v: not (hl(a) and nhomVA(a, p, k, v) == "trong vung gia tri"))
    print(f"   Sut giam lon nhat giai doan kiem chung: goc {sut(bo(G)):.1f}% | bo lenh trong vung gia tri {sut(loc_):.1f}%")

print("\n -- Bien the: thay vi bo lenh, DOI gia ra khoi vung gia tri moi vao (muc mua = max(muc goc, pVAH), muc ban = min(muc goc, pVAL)); cat lo giu nguyen --")
def vbDoi(k_=0.3):
    gd = []
    for a in range(1, N):
        if sauDao[a] or not hl(a): continue
        o0 = O[a, 0]; tr, du = max(o0 + k_ * pBD[a], pVAH[a] + 0.1), min(o0 - k_ * pBD[a], pVAL[a] - 0.1)
        for k in range(1, 180):
            p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
            if p: gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du); gd.append((a, p, gia, chay(a, p, k, gia, cat=o0))); break
    return gd
def orbDoi(Nm=15):
    gd = []
    for a in range(1, N):
        if not hl(a): continue
        hi, lo = H[a, :Nm].max(), L[a, :Nm].min(); tr, du = max(hi, pVAH[a]), min(lo, pVAL[a])
        for k in range(Nm, 180):
            p = 1 if C[a, k] > tr else -1 if C[a, k] < du else 0
            if p: gd.append((a, p, C[a, k], chay(a, p, k, C[a, k], cat=lo if p > 0 else hi))); break
    return gd
dg("Bien dong 0,3 - doi ra khoi vung gia tri", vbDoi()); dg("Khoang mo cua 15 phut - doi ra khoi vung gia tri", orbDoi())
