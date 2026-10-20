# PHAI SINH VN30F1M - TONG HOP CUOI (2026-10-20, Hieu: "tim hieu tat ca cach danh phai sinh, test, cho cach trade ok nhat").
# (1) He CO SO = ghep 5 kieu pha vo trong ngay (ORB 5/15/30 phut + pha vo bien dong k = 0,3 / 0,5), moi kieu 1 hop dong chia deu von - ket qua tu phaisinh_them3.py.
# (2) Bo loc ngay (gap, thu, bien do hom truoc, ngay nen NR7...) - DANH GIA THEO KIEU WALK-FORWARD: moi nam chi chon bo loc bang du lieu CAC NAM TRUOC, xem co hon he co so khong.
# (3) Chinh co lenh theo bien dong (muc tieu bien dong) - ngay bien dong thap danh nhieu hon.
# (4) Xu huong QUA DEM theo ngay (Donchian 20/55, MA 20/50, dong luong 20 ngay, long/short) - cach kinh dien cua quy theo xu huong.
# Phi MBS + truot gia 0,4 diem/vong, KP = den 06/2022, KC = tu 07/2022, % gia tri hop dong. Chay: python engine/dich-vu/phaisinh_tonghop.py
import numpy as np, pandas as pd
from phaisinh_chung import nap, phi, chay_lenh, MOC
X = nap(); ngay, O, H, L, C, V, ATC, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["V"], X["ATC"], X["sauDao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); nam = np.array([x[:4] for x in ngay])
pATC = np.r_[np.nan, ATC[:-1]]; dH = H.max(axis=1); dL = L.min(axis=1); bd = dH - dL; pBD = np.r_[np.nan, bd[:-1]]
thu = pd.to_datetime(pd.Series(ngay)).dt.dayofweek.values
ok = lambda a: a >= 1 and not sauDao[a] and not np.isnan(pBD[a])

def vb(k_):
    gd = []
    for a in range(N):
        if not ok(a): continue
        o0 = O[a, 0]; tr, du = o0 + k_ * pBD[a], o0 - k_ * pBD[a]
        for k in range(1, 180):
            p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
            if not p: continue
            gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du)
            j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, gia, cat=o0); gd.append((a, p, gia, ra)); break
    return gd
def orb(Nm):
    gd = []
    for a in range(N):
        hi, lo = H[a, :Nm].max(), L[a, :Nm].min()
        for k in range(Nm, 180):
            p = 1 if C[a, k] > hi else -1 if C[a, k] < lo else 0
            if p:
                j, ra = chay_lenh(O[a], H[a], L[a], C[a], p, k, C[a, k], cat=lo if p > 0 else hi); gd.append((a, p, C[a, k], ra)); break
    return gd
def lai_ngay(gd, truot=0.4):
    x = np.zeros(N)
    for a, p, v, r in gd: x[a] += (p * (r - v) - phi(v, truot)) / v * 100
    return x
def tk(x, m, ten=""):
    y = x[m]; e = np.cumsum(y); nam_ = m.sum() / 250
    return dict(nam=y.sum() / nam_, sh=y.mean() / y.std() * np.sqrt(250) if y.std() > 0 else np.nan, dd=(e - np.maximum.accumulate(e)).min())
def dong(ten, x, mask=None):
    D, V_ = tk(x, dK), tk(x, ~dK)
    print(f"   {ten:66s} | KP {D['nam']:6.1f}%/nam Sh {D['sh']:5.2f} sut {D['dd']:6.1f}% | KC {V_['nam']:6.1f}%/nam Sh {V_['sh']:5.2f} sut {V_['dd']:6.1f}%" + ("" if mask is None else f" | {mask.mean()*100:3.0f}% ngay"))
    return D, V_

print("=== 1. HE CO SO: ghep 5 kieu pha vo trong ngay ===")
S = {"ORB5": lai_ngay(orb(5)), "ORB15": lai_ngay(orb(15)), "ORB30": lai_ngay(orb(30)), "BD0.3": lai_ngay(vb(0.3)), "BD0.5": lai_ngay(vb(0.5))}
co_so = np.mean(list(S.values()), axis=0)
for t, x in S.items(): dong(t, x)
dong("GHEP 5 KIEU (co so)", co_so)
print("   theo nam (% tong): " + "  ".join(f"{y}: {co_so[nam == y].sum():5.1f}" for y in sorted(set(nam))))

print("\n=== 2. BO LOC NGAY (ap len he co so; chi giao dich ngay thoa) ===")
gap = np.abs(O[:, 0] / pATC - 1) * 100
bdp = pd.Series(bd); trungVi = bdp.rolling(40).median().shift(1).values
nr7 = np.array([a >= 7 and pBD[a] <= np.nanmin(bd[a - 7:a]) for a in range(N)])
bdTB20 = (bdp / pd.Series(O[:, 0])).rolling(20).mean().shift(1).values * 100
tc = np.nan_to_num(bdTB20, nan=np.nanmedian(bdTB20))
FILTERS = {
    "gap >= 0,3%": np.nan_to_num(gap) >= 0.3,
    "gap < 0,3%": np.nan_to_num(gap) < 0.3,
    "thu Hai": thu == 0, "bo thu Tu": thu != 2, "bo thu Hai": thu != 0,
    "bien do hom truoc > trung vi 40 ngay": np.nan_to_num(pBD) > np.nan_to_num(trungVi),
    "bien do hom truoc < trung vi 40 ngay": np.nan_to_num(pBD) <= np.nan_to_num(trungVi),
    "ngay nen NR7": nr7, "khong NR7": ~nr7,
    "bien dong 20 ngay cao (nua tren)": tc > np.median(tc), "bien dong 20 ngay thap (nua duoi)": tc <= np.median(tc),
}
for t, m in FILTERS.items(): dong(f"Chi ngay: {t}", np.where(m, co_so, 0.0), m)
print("\n   -- WALK-FORWARD: moi nam (tu 2021) chon bo loc co Sharpe cao nhat tren TOAN BO du lieu CAC NAM TRUOC (neu khong bo loc nao hon co so thi khong loc) --")
nams = sorted(set(nam)); oos = np.zeros(N); chon = {}
for y in nams:
    if y < "2021": continue
    truoc = np.array([n_ < y for n_ in nam]); mm = truoc & ((nam >= "2019") | True)
    best, bs = None, np.mean(co_so[truoc]) / np.std(co_so[truoc]) if np.std(co_so[truoc]) > 0 else -9
    for t, m in FILTERS.items():
        z = np.where(m, co_so, 0.0)[truoc]
        sh = z.mean() / z.std() if z.std() > 0 else -9
        if sh > bs * 1.05: best, bs = t, sh
    chon[y] = best; sel = nam == y
    oos[sel] = np.where(FILTERS[best], co_so, 0.0)[sel] if best else co_so[sel]
m21 = np.array([n_ >= "2021" for n_ in nam])
print("   bo loc duoc chon tung nam: " + "; ".join(f"{y}: {v or 'khong loc'}" for y, v in chon.items()))
print(f"   Walk-forward (2021-2026): {tk(oos, m21)['nam']:6.1f}%/nam Sh {tk(oos, m21)['sh']:5.2f} sut {tk(oos, m21)['dd']:6.1f}%  |  He co so cung ky: {tk(co_so, m21)['nam']:6.1f}%/nam Sh {tk(co_so, m21)['sh']:5.2f} sut {tk(co_so, m21)['dd']:6.1f}%")

print("\n=== 3. CHINH CO LENH THEO BIEN DONG (muc tieu bien dong; trung binh co lenh = 1) ===")
for lo_, hi_ in ((0.5, 2.0), (0.7, 1.5)):
    w = np.clip(np.nanmedian(tc) / np.where(tc > 0, tc, np.nanmedian(tc)), lo_, hi_); w = w / w.mean()
    dong(f"Co lenh ~ 1 / bien dong 20 ngay (cap {lo_}-{hi_})", co_so * w)
dong("Co so (de doi chieu)", co_so)

print("\n=== 4. XU HUONG QUA DEM THEO NGAY (ATC -> ATC; bo phien dao han; dao chieu mat phi + truot) ===")
c = pd.Series(ATC); hi_d = pd.Series(dH); lo_d = pd.Series(dL)
ret = np.r_[0.0, (ATC[1:] / ATC[:-1] - 1)]; ret[sauDao] = 0.0
def swing(pos, ten):
    pos = np.r_[0, pos[:-1]].astype(float)  # vi the quyet dinh cuoi ngay hom truoc, ap vao ngay sau
    doi = np.abs(np.diff(np.r_[0.0, pos])); chi = doi * phi(ATC) / ATC
    x = (pos * ret - chi) * 100
    dong(ten, x)
    return x
for n_ in (20, 55):
    up = (c > c.rolling(n_).max().shift(1)).values; dn = (c < c.rolling(n_).min().shift(1)).values; p = 0; pos = np.zeros(N)
    for a in range(N):
        if up[a]: p = 1
        elif dn[a]: p = -1
        pos[a] = p
    swing(pos, f"Donchian {n_} ngay (dao chieu khi pha), long/short"); swing(np.maximum(pos, 0), f"Donchian {n_} ngay, chi mua")
for a_, b_ in ((20, 50), (10, 30)):
    ma_a = c.rolling(a_).mean(); ma_b = c.rolling(b_).mean(); pos = np.where(ma_a > ma_b, 1, np.where(ma_a < ma_b, -1, 0)); pos = np.nan_to_num(pos)
    swing(pos, f"MA {a_}/{b_} ngay, long/short")
mom = (c / c.shift(20) - 1).values; pos = np.where(np.nan_to_num(mom) > 0, 1, -1); swing(pos, "Dong luong 20 ngay (duong: mua, am: ban)")
ghep = np.mean([x for x in (co_so,)], axis=0)
print("\n   Mua giu VN30F1M qua dem (ATC -> ATC, co dinh): "); dong("Mua giu (doi chieu)", ret * 100)

print("\n=== 5. THAM CHIEU: he co so + muc don bay (von 187 trieu/HD; lai cong don khong dung lai, chi gian tuyen) ===")
for lev in (1, 2, 3):
    D, V_ = tk(co_so * lev, dK), tk(co_so * lev, ~dK)
    print(f"   don bay {lev}x: KP {D['nam']:6.1f}%/nam sut {D['dd']:6.1f}% | KC {V_['nam']:6.1f}%/nam sut {V_['dd']:6.1f}%")
