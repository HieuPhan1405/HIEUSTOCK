# PHAI SINH VN30F1M - phan DUNG CHUNG: nap nen 1 phut, dung ma tran (ngay x phut), chi phi, thong ke.
# Phien lien tuc: 09:00-11:30 (151 phut, chi so 0..150) + 13:00-14:29 (90 phut, chi so 151..240). ATC 14:45 luu rieng. Phut khong co giao dich = giu gia dong cua phut truoc.
# CHI PHI 1 vong (mua + ban) cho 1 hop dong: theo BIEU PHI MBS (xem ham phi() ben duoi) + 0,4 diem truot gia (2 buoc gia moi chieu) ~ 0,88 diem / vong o muc 1.870.
#   Lai / lo tinh theo % GIA TRI HOP DONG (chua don bay); ky quy ~18% nen % tren tien ky quy lon gap ~5,5 lan (ca lai lan lo).
import json, os, numpy as np, pandas as pd
GOC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output") + os.sep
NP = 241
MOC = "2022-07-01"

def nap():
    d = pd.DataFrame(json.load(open(GOC + "vn30f1m_1p.json")))
    dt = pd.to_datetime(d.t, unit="s") + pd.Timedelta(hours=7)
    d["ngay"] = dt.dt.strftime("%Y-%m-%d"); ph = dt.dt.hour * 60 + dt.dt.minute
    d["k"] = np.where((ph >= 540) & (ph <= 690), ph - 540, np.where((ph >= 780) & (ph <= 869), 151 + ph - 780, -1))
    atc = d[ph == 885].groupby("ngay").c.last()
    d = d[d.k >= 0]
    ngay = sorted(d.ngay.unique()); vt = {x: i for i, x in enumerate(ngay)}
    n = len(ngay)
    O = np.full((n, NP), np.nan); H = np.full((n, NP), np.nan); L = np.full((n, NP), np.nan); C = np.full((n, NP), np.nan); V = np.zeros((n, NP))
    i = d.ngay.map(vt).values; k = d.k.values
    O[i, k] = d.o.values; H[i, k] = d.h.values; L[i, k] = d.l.values; C[i, k] = d.c.values; V[i, k] = d.v.values
    so = (~np.isnan(C)).sum(axis=1)
    for a in range(n):  # lap phut trong
        c = C[a]; last = np.nan
        for j in range(NP):
            if np.isnan(c[j]):
                if not np.isnan(last): O[a, j] = H[a, j] = L[a, j] = C[a, j] = last
            else:
                last = c[j]
        if np.isnan(C[a, 0]):  # dau phien thieu: lay gia dau tien co
            first = np.argmax(~np.isnan(C[a])); O[a, :first] = H[a, :first] = L[a, :first] = C[a, :first] = O[a, first]
    giu = so >= 200
    idx = np.where(giu)[0]
    ngay = [ngay[a] for a in idx]
    O, H, L, C, V = O[idx], H[idx], L[idx], C[idx], V[idx]
    ATC = np.array([atc.get(x, np.nan) for x in ngay]); ATC = np.where(np.isnan(ATC), C[:, -1], ATC)
    # ngay dao han = phien cuoi <= thu Nam tuan 3; phien NGAY SAU do la hop dong moi (khoang cach qua dem = chenh lech 2 hop dong, khong phai lai / lo that)
    s = pd.to_datetime(pd.Series(ngay)); dao = np.zeros(len(ngay), bool)
    for (y, m), g in s.groupby([s.dt.year, s.dt.month]):
        thu5 = [x for x in pd.date_range(f"{y}-{m:02d}-01", periods=31) if x.month == m and x.dayofweek == 3][2]
        ung = g[g <= thu5]
        if len(ung): dao[ung.index[-1]] = True
    sauDao = np.r_[False, dao[:-1]]
    return dict(ngay=ngay, O=O, H=H, L=L, C=C, V=V, ATC=ATC, dao=dao, sauDao=sauDao)

# BIEU PHI MBS (mbs.com.vn/bieu-phi-giao-dich-chung-khoan-phai-sinh, doc ngay 14/10/2026), tinh cho 1 hop dong, MOI LUOT (mua hoac ban):
#   3.000d phi giao dich MBS + 2.700d phi tra So + 2.550d phi bu tru VSDC = 8.250d ; thue TNCN = gia x 100.000 x 17% ky quy ban dau x 0,1% / 2 = 8,5d x gia
#   -> 1 vong (2 luot) = 16.500d + 17d x gia  = 0,165 diem + 0,00017 x gia  (o muc 1.870: ~0,48 diem ~ 48 nghin dong)
# Ngoai ra con phi quan ly tai san ky quy 0,0024% / thang (toi thieu 100.000d / tai khoan / thang) - khoan co dinh theo tai khoan, khong tinh vao tung lenh.
# TRUOT = truot gia ca vong tinh bang diem (mac dinh 0,4 = 2 buoc gia moi chieu); doi bang bien moi truong PS_TRUOT hoac tham so truot.
PHI_CO_DINH = 2 * (3000 + 2700 + 2550) / 100000
TRUOT = float(os.environ.get("PS_TRUOT", "0.4"))
def phi(gia, truot=None):
    return PHI_CO_DINH + 0.00017 * gia + (TRUOT if truot is None else truot)

# gd: list (ngay, phia, giaVao, giaRa) -> DataFrame co lai rong (%) va diem quy ve muc gia 1.870
def bang(gd, phi_he_so=1.0):
    if not gd: return pd.DataFrame(columns=["ngay", "phia", "vao", "ra", "diem", "pct"])
    t = pd.DataFrame(gd, columns=["ngay", "phia", "vao", "ra"])
    t["diem"] = t.phia * (t.ra - t.vao) - phi(t.vao) * phi_he_so
    t["pct"] = t.diem / t.vao * 100
    return t

def tk(t, so_ngay):
    if len(t) == 0: return "khong co lenh"
    w, l = t.pct[t.pct > 0], t.pct[t.pct <= 0]
    ngay_ = t.groupby("ngay").pct.sum()
    e = ngay_.cumsum(); dd = (e - e.cummax()).min()
    nam = so_ngay / 250
    return (f"n={len(t):5d} ({len(t)/so_ngay:.2f}/ngay) | TB {t.pct.mean():7.3f}% = {t.pct.mean()*18.7:6.2f} diem | thang {(t.pct>0).mean()*100:3.0f}% | PF {w.sum()/-l.sum() if len(l) and l.sum()!=0 else np.nan:5.2f} | "
            f"tong {t.pct.sum()/nam:6.1f}%/nam | sut toi da {dd:6.1f}% | Sharpe {ngay_.mean()/ngay_.std()*np.sqrt(len(ngay_)/nam) if len(ngay_)>2 and ngay_.std()>0 else np.nan:5.2f}")

def bao_cao(ten, gd, ngay, phi_he_so=1.0, theo_nam=False):
    t = bang(gd, phi_he_so)
    nD = sum(1 for x in ngay if x < MOC); nV = len(ngay) - nD
    print(f"  {ten}")
    print(f"     kham pha   {tk(t[t.ngay < MOC], nD)}")
    print(f"     KIEM CHUNG {tk(t[t.ngay >= MOC], nV)}")
    if theo_nam and len(t):
        print("     theo nam (% tong): " + "  ".join(f"{y}: {g.pct.sum():.1f}" for y, g in t.groupby(t.ngay.str[:4])))
    return t

# mo phong 1 lenh trong ngay tren nen 1 phut: vao tai (k, gia), co the co cat lo / chot loi, thoat cuoi phien (k = kRa) theo gia dong cua.
def chay_lenh(o, h, l, c, phia, k, gia, cat=None, chot=None, kRa=240):
    for j in range(k + 1, kRa + 1):
        if phia > 0:
            if cat is not None and l[j] <= cat: return j, min(o[j], cat)
            if chot is not None and h[j] >= chot: return j, max(o[j], chot)
        else:
            if cat is not None and h[j] >= cat: return j, max(o[j], cat)
            if chot is not None and l[j] <= chot: return j, min(o[j], chot)
    return kRa, c[kRa]
