# PHAI SINH VN30F1M - DAO SAU kieu PHA VO KHOANG MO CUA (ORB), ung vien tot nhat tu phaisinh_luat.py.
# Kiem: (1) tung nam, (2) do nhay phi / truot gia, (3) cach vao (cho nen dong cua hay dat lenh dung cham la khop), (4) cach thoat (cat lo doi, hoa von, chot loi, thoat som),
#       (5) bo loc (xu huong ngay, do rong khoang mo cua, thu, gap), (6) mua / ban rieng, (7) danh lai lan 2, (8) ket hop.
# Chi phi, du lieu, 2 giai doan: xem phaisinh_chung.py. Chay: python engine/dich-vu/phaisinh_orb.py
import numpy as np, pandas as pd
from phaisinh_chung import nap, bang, tk, bao_cao, phi, MOC
X = nap(); ngay, O, H, L, C, V, ATC, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["V"], X["ATC"], X["sauDao"]
N = len(ngay); nD = sum(1 for x in ngay if x < MOC)
pATC = np.r_[np.nan, ATC[:-1]]
ser = pd.Series(ATC); ma20 = ser.rolling(20).mean().shift(1).values; ma50 = ser.rolling(50).mean().shift(1).values
bdNgay = pd.Series(H.max(axis=1) - L.min(axis=1)); atr20 = (bdNgay / pd.Series(O[:, 0])).rolling(20).mean().shift(1).values * 100  # bien do ngay TB 20 phien (% gia), chi dung du lieu truoc ngay do
thu = pd.to_datetime(pd.Series(ngay)).dt.dayofweek.values

# ORB tong quat. vao: "dong" = nen 1 phut dong cua vuot bien; "cham" = dat lenh dung tai bien +- dem, cham la khop (khop tai gia do, hoac gia mo cua neu nhay qua)
def orb(Nm=15, vao="dong", dem=0.2, cat="doi", truoc=180, kRa=240, chot_R=None, hoa_von_R=None, duoi_R=None, loc=None, phia_chi=None, lan2=False):
    gd = []
    for a in range(N):
        if loc is not None and not loc(a): continue
        o, h, l, c = O[a], H[a], L[a], C[a]; hi, lo = h[:Nm].max(), l[:Nm].min(); rong = hi - lo
        if rong <= 0: continue
        k = Nm; so = 0
        while k < truoc and so < (2 if lan2 else 1):
            p = 0
            if vao == "dong":
                if c[k] > hi: p, gia = 1, c[k]
                elif c[k] < lo: p, gia = -1, c[k]
            else:
                if h[k] >= hi + dem: p, gia = 1, max(o[k], hi + dem)
                elif l[k] <= lo - dem: p, gia = -1, min(o[k], lo - dem)
            if not p or (phia_chi and p != phia_chi): k += 1; continue
            st = (lo if p > 0 else hi) if cat == "doi" else ((hi + lo) / 2 if cat == "giua" else None)
            R = abs(gia - st) if st is not None else rong
            tot = gia; ra = None; kj = kRa
            for j in range(k + 1, kRa + 1):
                if st is not None:
                    if p > 0 and l[j] <= st: ra = min(o[j], st); kj = j; break
                    if p < 0 and h[j] >= st: ra = max(o[j], st); kj = j; break
                if chot_R is not None:
                    tg = gia + p * chot_R * R
                    if p > 0 and h[j] >= tg: ra = max(o[j], tg); kj = j; break
                    if p < 0 and l[j] <= tg: ra = min(o[j], tg); kj = j; break
                tot = max(tot, h[j]) if p > 0 else min(tot, l[j])
                if hoa_von_R is not None and st is not None and p * (tot - gia) >= hoa_von_R * R: st = gia if p > 0 else gia  # doi cat lo ve gia von
                if duoi_R is not None and st is not None and p * (tot - gia) >= duoi_R * R:  # cat lo duoi: cach dinh / day tot nhat duoi_R * R
                    moi = tot - p * duoi_R * R
                    st = max(st, moi) if p > 0 else min(st, moi)
            if ra is None: ra = c[kRa]
            gd.append((ngay[a], p, gia, ra)); so += 1
            if ra == c[kRa] and kj == kRa: break
            k = kj + 1
            if lan2:  # lan 2 chi theo huong nguoc lai
                phia_chi_tam = -p
                while k < truoc:
                    if (phia_chi_tam > 0 and c[k] > hi) or (phia_chi_tam < 0 and c[k] < lo): break
                    k += 1
    return gd
def dong(ten, gd, hs=1.0):
    t = bang(gd, hs); print(f"   {ten:60s} KP {tk(t[t.ngay < MOC], nD)}"); print(f"   {'':60s} KC {tk(t[t.ngay >= MOC], N - nD)}"); return t

print("=== 1. BAN GOC theo tung nam (% gia tri hop dong / nam, da tru phi) ===")
for Nm in (5, 15, 30):
    t = bang(orb(Nm)); print(f"   ORB {Nm:2d} phut: " + "  ".join(f"{y}: {g.pct.sum():6.1f}% ({(g.pct>0).mean()*100:.0f}% thang)" for y, g in t.groupby(t.ngay.str[:4])))
print("\n=== 2. DO NHAY CHI PHI (he so nhan len tong phi + truot gia; 1,0 ~ 0,8 diem / vong o muc 1.870) ===")
for Nm in (5, 15, 30):
    for hs in (1.0, 1.5, 2.0, 3.0):
        t = bang(orb(Nm), hs); a, b = t[t.ngay < MOC], t[t.ngay >= MOC]
        print(f"   ORB {Nm:2d} | phi x{hs}: KP TB {a.pct.mean():.3f}% tong {a.pct.sum()/(nD/250):5.1f}%/nam | KC TB {b.pct.mean():.3f}% tong {b.pct.sum()/((N-nD)/250):5.1f}%/nam")
print("\n=== 3. CACH VAO LENH (ORB 15 phut) ===")
dong("cho nen 1 phut DONG CUA vuot bien (goc)", orb(15))
dong("dat lenh dung: CHAM bien + 0,2 diem la khop", orb(15, vao="cham", dem=0.2))
dong("dat lenh dung: cham bien + 1,0 diem", orb(15, vao="cham", dem=1.0))
dong("chi vao truoc 10:30", orb(15, truoc=90)); dong("chi vao truoc 11:30", orb(15, truoc=150)); dong("cho phep vao ca buoi chieu (truoc 14:00)", orb(15, truoc=210))
print("\n=== 4. CACH THOAT (ORB 15 phut, vao khi nen dong cua vuot bien) ===")
dong("cat lo bien doi dien, giu den 14:29 (goc)", orb(15))
dong("khong cat lo, giu den 14:29", orb(15, cat=None))
dong("cat lo o GIUA khoang", orb(15, cat="giua"))
dong("thoat het luc 11:29 (chi danh buoi sang)", orb(15, kRa=149))
for r in (1, 2, 3, 5): dong(f"chot loi tai {r}R (R = khoang cach den cat lo)", orb(15, chot_R=r))
dong("doi cat lo ve hoa von khi lai 1R", orb(15, hoa_von_R=1.0)); dong("doi cat lo ve hoa von khi lai 2R", orb(15, hoa_von_R=2.0))
for r in (1, 2, 3): dong(f"cat lo DUOI theo gia, cach {r}R", orb(15, duoi_R=r))
dong("thua lan dau thi danh lai theo huong nguoc (toi da 2 lenh / ngay)", orb(15, lan2=True))
print("\n=== 5. BO LOC (ORB 15 phut goc) ===")
rong15 = (H[:, :15].max(axis=1) - L[:, :15].min(axis=1)) / O[:, 0] * 100; tyRong = rong15 / atr20
gapp = (O[:, 0] / pATC - 1) * 100
dong("chi MUA", orb(15, phia_chi=1)); dong("chi BAN KHONG", orb(15, phia_chi=-1))
dong("chi mua khi ATC hom truoc > MA20, chi ban khi < MA20", orb(15, loc=lambda a: not np.isnan(ma20[a])) if False else [x for x in orb(15) if (lambda a, p: (not np.isnan(ma20[a])) and ((p > 0) == (pATC[a] > ma20[a])))(ngay.index(x[0]), x[1])])
dong("NGUOC xu huong ngay (mua khi < MA20, ban khi > MA20)", [x for x in orb(15) if (lambda a, p: (not np.isnan(ma20[a])) and ((p > 0) != (pATC[a] > ma20[a])))(ngay.index(x[0]), x[1])])
for a_, b_, ten in ((0, 0.15, "khoang mo cua HEP (< 15% bien do ngay TB)"), (0.15, 0.3, "khoang mo cua vua (15-30%)"), (0.3, 9, "khoang mo cua RONG (> 30%)")):
    dong(ten, orb(15, loc=lambda a, a_=a_, b_=b_: (not np.isnan(tyRong[a])) and a_ <= tyRong[a] < b_))
for t_ in range(5): dong(f"chi thu {t_+2}", orb(15, loc=lambda a, t_=t_: thu[a] == t_))
dong("ngay co gap mo cua >= 0,3% (bo ngay sau dao han)", orb(15, loc=lambda a: (not sauDao[a]) and abs(gapp[a]) >= 0.3)); dong("ngay gap nho < 0,3%", orb(15, loc=lambda a: (not sauDao[a]) and abs(gapp[a]) < 0.3))
dong("bien do ngay TB 20 phien CAO (> 1,5% gia)", orb(15, loc=lambda a: atr20[a] > 1.5)); dong("bien do ngay TB 20 phien THAP (<= 1,5%)", orb(15, loc=lambda a: atr20[a] <= 1.5))
print("\n=== 6. KET HOP 3 KHOANG (5 + 15 + 30 phut, moi cai 1/3 von) - on dinh hon 1 tham so ===")
T = pd.concat([bang(orb(n_)).assign(pct=lambda x: x.pct / 3) for n_ in (5, 15, 30)])
nd = T.groupby("ngay").pct.sum()
for nhan, g, so in (("kham pha  ", nd[nd.index < MOC], nD), ("KIEM CHUNG", nd[nd.index >= MOC], N - nD)):
    e = g.cumsum(); print(f"   {nhan} tong {g.sum()/(so/250):5.1f}%/nam | sut toi da {(e-e.cummax()).min():6.1f}% | Sharpe {g.mean()/g.std()*np.sqrt(250):.2f} | ngay lai {(g>0).mean()*100:.0f}% | ngay te nhat {g.min():.2f}% | ngay tot nhat {g.max():.2f}% | chuoi ngay lo dai nhat {max((len(list(v)) for k_, v in __import__('itertools').groupby(g < 0) if k_), default=0)}")
print("   theo nam: " + "  ".join(f"{y}: {g.sum():.1f}%" for y, g in nd.groupby(nd.index.str[:4])))
thg = nd.groupby(nd.index.str[:7]).sum(); print(f"   theo thang: {(thg>0).mean()*100:.0f}% so thang lai | thang te nhat {thg.min():.1f}% | thang tot nhat {thg.max():.1f}% | so thang {len(thg)}")
rng = np.random.default_rng(5); v = nd.values; th_ = pd.Series(v, index=nd.index).groupby(nd.index.str[:7]).agg(["sum", "count"])
bs = [th_["sum"].values[k].sum() / th_["count"].values[k].sum() for k in (rng.integers(0, len(th_), len(th_)) for _ in range(4000))]
print(f"   lai TB / ngay: {nd.mean():.3f}% [khoang tin cay 95% theo cum thang: {np.percentile(bs,2.5):.3f} .. {np.percentile(bs,97.5):.3f}]")
