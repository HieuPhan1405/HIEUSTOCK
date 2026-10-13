# PHAI SINH VN30F1M (2026-10-14) - kiem cac KIEU DANH THEO LUAT tren nen 1 phut 08/2018 - 10/2026 (xem phaisinh_chung.py ve du lieu va chi phi).
# Moi kieu bao cao 2 giai doan: KHAM PHA den 06/2022, KIEM CHUNG tu 07/2022. Lai / lo da tru phi + truot gia, tinh theo % gia tri hop dong (va quy ra diem o muc 1.870).
# Chay: python engine/dich-vu/phaisinh_luat.py
import numpy as np, pandas as pd
from phaisinh_chung import nap, bao_cao, chay_lenh, phi, MOC
X = nap(); ngay, O, H, L, C, V, ATC, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["V"], X["ATC"], X["sauDao"]
N = len(ngay)
print(f"So ngay: {N} ({ngay[0]} -> {ngay[-1]}) | kham pha {sum(1 for x in ngay if x < MOC)} ngay, kiem chung {sum(1 for x in ngay if x >= MOC)} ngay | so ngay sau dao han: {sauDao.sum()}")
pATC = np.r_[np.nan, ATC[:-1]]
tp = (H + L + C) / 3
VW = np.cumsum(tp * np.maximum(V, 1e-9), axis=1) / np.cumsum(np.maximum(V, 1e-9), axis=1)

print("\n=== 0. MO TA: gia di dau trong ngay? (% gia, CHUA tru phi; bo cac dem dao han) ===")
qd = (O[:, 0] / pATC - 1) * 100; tn = (ATC / O[:, 0] - 1) * 100; sang = (C[:, 150] / O[:, 0] - 1) * 100; chieu = (C[:, 240] / O[:, 151] - 1) * 100; trua = (O[:, 151] / C[:, 150] - 1) * 100; atc = (ATC / C[:, 240] - 1) * 100
ok = ~sauDao & ~np.isnan(qd)
for ten, a, m in [("Qua dem (ATC hom truoc -> mo cua 9:00)", qd, ok), ("Trong ngay (mo cua -> ATC)", tn, ok), ("  buoi sang (9:00 -> 11:30)", sang, ok), ("  nghi trua (11:30 -> 13:00)", trua, ok), ("  buoi chieu (13:00 -> 14:29)", chieu, ok), ("  phien ATC (14:29 -> 14:45)", atc, ok)]:
    d_ = np.array([x < MOC for x in ngay])
    print(f"   {ten:42s} kham pha TB {np.nanmean(a[m & d_]):7.3f}% (duong {np.nanmean(a[m & d_] > 0)*100:.0f}%) | kiem chung TB {np.nanmean(a[m & ~d_]):7.3f}% (duong {np.nanmean(a[m & ~d_] > 0)*100:.0f}%) | do lech chuan {np.nanstd(a[m]):.2f}%")
thu = pd.to_datetime(pd.Series(ngay)).dt.dayofweek.values
print("   Theo thu (trong ngay, mo cua -> ATC): " + " | ".join(f"T{t+2}: {np.nanmean(tn[(thu == t) & ok]):.3f}%" for t in range(5)))

print("\n=== 1. PHA VO KHOANG MO CUA (ORB): lay dinh / day N phut dau; nen 1 phut DONG CUA vuot ra ngoai thi vao theo huong do; thoat 14:29 ===")
def orb(Nm, cat="doi", truoc=180, dao=False):
    gd = []
    for a in range(N):
        o, h, l, c = O[a], H[a], L[a], C[a]; hi, lo = h[:Nm].max(), l[:Nm].min()
        for k in range(Nm, truoc):
            p = 1 if c[k] > hi else -1 if c[k] < lo else 0
            if p:
                st = (lo if p > 0 else hi) if cat == "doi" else ((hi + lo) / 2 if cat == "giua" else None)
                if dao: p, st = -p, None
                j, ra = chay_lenh(o, h, l, c, p, k, c[k], cat=st); gd.append((ngay[a], p, c[k], ra)); break
    return gd
for Nm in (5, 15, 30, 60):
    bao_cao(f"ORB {Nm} phut, cat lo o bien doi dien", orb(Nm), ngay)
bao_cao("ORB 15 phut, cat lo o giua khoang", orb(15, "giua"), ngay)
bao_cao("ORB 30 phut, khong cat lo", orb(30, None), ngay)
bao_cao("NGUOC ORB 30 phut (danh nguoc pha vo, khong cat lo)", orb(30, None, dao=True), ngay)

print("\n=== 2. QUAN TINH TRONG NGAY ===")
def dau_ngay(k0, nguong=0.1, vao=None, ra=240, nguoc=False, goc="atc"):
    gd = []
    for a in range(1, N):
        if sauDao[a] and goc == "atc": continue
        base = pATC[a] if goc == "atc" else O[a, 0]
        r = (C[a, k0] / base - 1) * 100
        if abs(r) < nguong: continue
        p = (1 if r > 0 else -1) * (-1 if nguoc else 1); kv = k0 if vao is None else vao
        gd.append((ngay[a], p, C[a, kv], C[a, ra]))
    return gd
bao_cao("Huong 30 phut dau (so voi ATC hom truoc) -> giu tu 9:30 den 14:29", dau_ngay(29), ngay)
bao_cao("Huong 30 phut dau (so voi gia mo cua)   -> giu tu 9:30 den 14:29", dau_ngay(29, goc="mo"), ngay)
bao_cao("Huong 60 phut dau (so voi ATC hom truoc) -> giu tu 10:00 den 14:29", dau_ngay(59), ngay)
bao_cao("Huong 30 phut dau -> chi danh 30 phut CUOI (14:00 -> 14:29)", dau_ngay(29, vao=210), ngay)
bao_cao("Huong ca buoi sang (mo cua -> 11:30) -> danh buoi chieu (13:00 -> 14:29)", [(ngay[a], 1 if C[a, 150] > O[a, 0] else -1, O[a, 151], C[a, 240]) for a in range(N) if abs(C[a, 150] / O[a, 0] - 1) * 100 >= 0.2], ngay)
bao_cao("NGUOC buoi sang -> danh buoi chieu", [(ngay[a], -1 if C[a, 150] > O[a, 0] else 1, O[a, 151], C[a, 240]) for a in range(N) if abs(C[a, 150] / O[a, 0] - 1) * 100 >= 0.2], ngay)
bao_cao("Huong tu mo cua den 14:00 -> danh 29 phut cuoi", [(ngay[a], 1 if C[a, 210] > O[a, 0] else -1, C[a, 210], C[a, 240]) for a in range(N) if abs(C[a, 210] / O[a, 0] - 1) * 100 >= 0.3], ngay)

print("\n=== 3. KHOANG TRONG MO CUA (gap so voi ATC hom truoc, bo ngay sau dao han); vao cuoi phut dau tien ===")
def gap(nguong, nguoc, lap=False):
    gd = []
    for a in range(1, N):
        if sauDao[a]: continue
        g = (O[a, 0] / pATC[a] - 1) * 100
        if abs(g) < nguong: continue
        p = (1 if g > 0 else -1) * (-1 if nguoc else 1)
        if lap and nguoc:
            j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, 0, C[a, 0], chot=pATC[a], cat=C[a, 0] - p * abs(O[a, 0] - pATC[a]))
        else: ra = C[a, 240]
        gd.append((ngay[a], p, C[a, 0], ra))
    return gd
for ng in (0.2, 0.5, 1.0):
    bao_cao(f"gap >= {ng}%: danh THEO gap, giu den 14:29", gap(ng, False), ngay)
    bao_cao(f"gap >= {ng}%: danh NGUOC gap, giu den 14:29", gap(ng, True), ngay)
bao_cao("gap >= 0.3%: danh nguoc, chot khi lap gap, cat lo = 1 lan gap", gap(0.3, True, lap=True), ngay)

print("\n=== 4. HOI VE VWAP: gia lech VWAP qua k lan do lech chuan (tinh tu dau phien) thi danh nguoc, chot khi ve VWAP, toi da 3 lenh / ngay ===")
def vwap_hoi(kz, cat_z=None):
    gd = []
    for a in range(N):
        o, h, l, c, vw = O[a], H[a], L[a], C[a], VW[a]; dev = c - vw; so = 0; k = 30
        while k < 225 and so < 3:
            sd = dev[:k + 1].std()
            if sd > 0 and abs(dev[k]) >= kz * sd:
                p = -1 if dev[k] > 0 else 1; ra = None
                for j in range(k + 1, 241):
                    if (p > 0 and c[j] >= vw[j]) or (p < 0 and c[j] <= vw[j]): ra = (j, c[j]); break
                    if cat_z and abs(c[j] - vw[j]) >= cat_z * sd and np.sign(c[j] - vw[j]) == -p: ra = (j, c[j]); break
                if ra is None: ra = (240, c[240])
                gd.append((ngay[a], p, c[k], ra[1])); so += 1; k = ra[0] + 5
            else: k += 1
    return gd
bao_cao("lech >= 2 do lech chuan", vwap_hoi(2.0), ngay)
bao_cao("lech >= 2,5 do lech chuan, cat lo khi lech 4", vwap_hoi(2.5, 4.0), ngay)
bao_cao("lech >= 3 do lech chuan", vwap_hoi(3.0), ngay)

print("\n=== 5. THEO XU HUONG TRONG NGAY ===")
def vwap_xh(bien=0.1, tu=30):
    gd = []
    for a in range(N):
        c, vw = C[a], VW[a]; p = 0; vao = None
        for k in range(tu, 240, 5):
            m = 1 if c[k] > vw[k] * (1 + bien / 100) else -1 if c[k] < vw[k] * (1 - bien / 100) else p
            if m != p:
                if p: gd.append((ngay[a], p, vao, c[k]))
                p, vao = m, c[k]
        if p: gd.append((ngay[a], p, vao, c[240]))
    return gd
bao_cao("Ben nao cua VWAP thi danh ben do (bien 0,1%, xet moi 5 phut, dong cuoi phien)", vwap_xh(0.1), ngay)
bao_cao("Nhu tren, bien 0,25%", vwap_xh(0.25), ngay)
# EMA tren nen 5 phut noi lien cac ngay
c5 = C[:, 4::5]; phang = c5.reshape(-1)
def ema(x, n):
    k = 2 / (n + 1); out = np.empty_like(x); e = x[0]
    for i, v in enumerate(x): e = v * k + e * (1 - k); out[i] = e
    return out
def ema_cat(nh, ch):
    e1, e2 = ema(phang, nh).reshape(c5.shape), ema(phang, ch).reshape(c5.shape); gd = []
    for a in range(N):
        p = 0; vao = None
        for b in range(3, c5.shape[1]):
            m = 1 if e1[a, b] > e2[a, b] else -1
            if m != p:
                if p: gd.append((ngay[a], p, vao, c5[a, b]))
                p, vao = m, c5[a, b]
        if p: gd.append((ngay[a], p, vao, C[a, 240]))
    return gd
bao_cao("EMA 8 / 21 tren nen 5 phut (luon co vi the tu 9:20, dong cuoi phien)", ema_cat(8, 21), ngay)
bao_cao("EMA 20 / 50 tren nen 5 phut", ema_cat(20, 50), ngay)

print("\n=== 6. SMC TRONG NGAY (nen 5 phut) ===")
pH = np.r_[np.nan, H.max(axis=1)[:-1]]; pL = np.r_[np.nan, L.min(axis=1)[:-1]]
def quet(chot_vwap=True):
    gd = []
    for a in range(1, N):
        if sauDao[a]: continue
        o, h, l, c, vw = O[a], H[a], L[a], C[a], VW[a]; daD = daL = False
        for k in range(4, 225, 5):
            hi, lo = h[:k + 1].max(), l[:k + 1].min()
            if not daD and hi > pH[a] + 0.3 and c[k] < pH[a]:
                daD = True; j, ra = chay_lenh(o, h, l, c, -1, k, c[k], cat=hi + 0.5, chot=vw[k] if chot_vwap and vw[k] < c[k] else None); gd.append((ngay[a], -1, c[k], ra))
            if not daL and lo < pL[a] - 0.3 and c[k] > pL[a]:
                daL = True; j, ra = chay_lenh(o, h, l, c, 1, k, c[k], cat=lo - 0.5, chot=vw[k] if chot_vwap and vw[k] > c[k] else None); gd.append((ngay[a], 1, c[k], ra))
    return gd
bao_cao("QUET THANH KHOAN dinh / day HOM TRUOC roi dong cua 5 phut quay lai: danh nguoc, cat lo ngoai dinh / day moi, chot o VWAP", quet(True), ngay)
bao_cao("Nhu tren nhung giu den cuoi phien (khong chot o VWAP)", quet(False), ngay)
def smc5(rr=2.0, K=2):
    gd = []
    for a in range(N):
        o1, h1, l1, c1 = O[a], H[a], L[a], C[a]
        nb = 48; h5 = np.array([h1[5 * b:5 * b + 5].max() for b in range(nb)]); l5 = np.array([l1[5 * b:5 * b + 5].min() for b in range(nb)]); c5_ = np.array([c1[5 * b + 4] for b in range(nb)])
        sh = sl = None; cho = None; dang = False
        for b in range(nb - 1):
            j = b - K
            if j >= K:
                if h5[j] == h5[j - K:j + K + 1].max(): sh = [h5[j], False]
                if l5[j] == l5[j - K:j + K + 1].min(): sl = [l5[j], False]
            if dang: continue
            if cho is not None:  # co lenh cho o vung FVG
                p, vung_tren, vung_duoi, het = cho
                if b > het: cho = None
                elif p > 0 and l5[b] <= vung_tren:
                    vao = vung_tren; st = vung_duoi - 0.5; k = 5 * b + 4
                    if l5[b] <= st: gd.append((ngay[a], 1, vao, st)); cho = None; continue
                    jj, ra = chay_lenh(o1, h1, l1, c1, 1, k, vao, cat=st, chot=vao + rr * (vao - st)); gd.append((ngay[a], 1, vao, ra)); dang = True; cho = None; continue
                elif p < 0 and h5[b] >= vung_duoi:
                    vao = vung_duoi; st = vung_tren + 0.5; k = 5 * b + 4
                    if h5[b] >= st: gd.append((ngay[a], -1, vao, st)); cho = None; continue
                    jj, ra = chay_lenh(o1, h1, l1, c1, -1, k, vao, cat=st, chot=vao - rr * (st - vao)); gd.append((ngay[a], -1, vao, ra)); dang = True; cho = None; continue
            if b >= 2 and b < 40:
                if sh is not None and not sh[1] and c5_[b] > sh[0]:
                    sh[1] = True
                    for q in range(b, max(b - 4, 1), -1):
                        if l5[q] > h5[q - 2]: cho = (1, l5[q], h5[q - 2], b + 8); break
                if sl is not None and not sl[1] and c5_[b] < sl[0]:
                    sl[1] = True
                    for q in range(b, max(b - 4, 1), -1):
                        if h5[q] < l5[q - 2]: cho = (-1, l5[q - 2], h5[q], b + 8); break
    return gd
bao_cao("BOS 5 phut + cho gia hoi ve FVG: vao tai mep FVG, cat lo ngoai FVG, chot 2R (1 lenh / ngay)", smc5(2.0), ngay)
bao_cao("Nhu tren, chot 3R", smc5(3.0), ngay)
bao_cao("Nhu tren, chot 1R", smc5(1.0), ngay)

print("\n=== 7. GIU QUA DEM / THEO NGAY (lai lo tinh ATC -> ATC, dem dao han coi nhu chuyen hop dong: khong lai lo, mat 1 vong phi) ===")
dch = np.r_[np.nan, (ATC[1:] / ATC[:-1] - 1) * 100]; dch[sauDao] = 0.0
def ngay_xh(vt_ham, ten):
    pos = vt_ham(); pos = np.r_[0, pos[:-1]]  # vi the vao tu ATC hom truoc
    doi = np.abs(np.diff(np.r_[0, pos])); phi_pct = phi(ATC) / ATC * 100
    lai = pos * dch - doi * phi_pct / 2 - (sauDao & (pos != 0)) * phi_pct
    s = pd.Series(lai, index=ngay).dropna()
    for nhan, g in (("kham pha  ", s[s.index < MOC]), ("KIEM CHUNG", s[s.index >= MOC])):
        e = g.cumsum(); print(f"     {nhan} tong {g.sum()/(len(g)/250):6.1f}%/nam | sut toi da {(e-e.cummax()).min():6.1f}% | Sharpe {g.mean()/g.std()*np.sqrt(250):5.2f} | ty le ngay co vi the {(pos[[x in g.index for x in ngay]]!=0).mean()*100:.0f}% | so lan doi vi the {int(doi[[x in g.index for x in ngay]].sum())}")
ser = pd.Series(ATC)
def ma_vt(n, ban=True):
    m = ser.rolling(n).mean().values; return lambda: np.where(np.isnan(m), 0, np.where(ATC > m, 1, -1 if ban else 0))
for n in (10, 20, 50):
    print(f"  Mua khi ATC > MA{n}, ban khong khi < MA{n}"); ngay_xh(ma_vt(n), "")
print("  Chi MUA khi ATC > MA20 (duoi thi dung ngoai)"); ngay_xh(ma_vt(20, False), "")
print("  Luon MUA va giu (de so sanh)"); ngay_xh(lambda: np.ones(N), "")
def rsi2_vt():
    d = ser.diff(); au = d.clip(lower=0).ewm(alpha=0.5, adjust=False).mean(); ad = (-d).clip(lower=0).ewm(alpha=0.5, adjust=False).mean(); r = (100 - 100 / (1 + au / ad.replace(0, np.nan))).values
    return np.where(r < 10, 1, np.where(r > 90, -1, 0))
print("  RSI(2) < 10 mua 1 ngay / > 90 ban khong 1 ngay"); ngay_xh(rsi2_vt, "")
print("  Chi giu QUA DEM (mua ATC, ban mo cua hom sau), bo dem dao han")
gd = [(ngay[a], 1, pATC[a], O[a, 0]) for a in range(1, N) if not sauDao[a]]; bao_cao("     mua qua dem", gd, ngay)
bao_cao("     BAN KHONG qua dem", [(d_, -1, v, r) for d_, p, v, r in gd], ngay)
