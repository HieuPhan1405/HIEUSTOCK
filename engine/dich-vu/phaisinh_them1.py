# PHAI SINH VN30F1M - MO RONG 1 (2026-10-14): quy luat theo GIO / THU, cac CHI BAO tren nen 5 va 15 phut, cac kieu GIU QUA DEM.
# Khung chung: bieu phi MBS + truot gia 0,4 diem / vong (phaisinh_chung.phi); 2 giai doan KP (den 06/2022) va KC (tu 07/2022); % tinh tren gia tri hop dong, chua don bay.
# Cac kieu theo chi bao: vi the chi mo trong ngay (tu 9:15), dong het luc 14:29. "Sh" = Sharpe, "sut" = sut giam lon nhat (cong don %).
# Chay: python engine/dich-vu/phaisinh_them1.py
import numpy as np, pandas as pd
from phaisinh_chung import nap, phi, MOC
from phaisinh_chibao import *
X = nap(); ngay, O, H, L, C, V, ATC, sauDao, dao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["V"], X["ATC"], X["sauDao"], X["dao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); pATC = np.r_[np.nan, ATC[:-1]]
thu = pd.to_datetime(pd.Series(ngay)).dt.dayofweek.values

print("=== A. QUY LUAT THEO GIO (loi suat trung binh tung khung 15 phut, % gia, CHUA tru phi; t = do tin cay, |t| > 2 moi dang ke) ===")
gio = lambda k: f"{(540 + k if k <= 150 else 780 + k - 151)//60:02d}:{(540 + k if k <= 150 else 780 + k - 151)%60:02d}"
khung = [(0, 14), (15, 29), (30, 44), (45, 59), (60, 89), (90, 119), (120, 150), (151, 165), (166, 180), (181, 195), (196, 210), (211, 225), (226, 240)]
for a, b in khung:
    r = (C[:, b] / (O[:, a]) - 1) * 100
    def tt(x): return f"{x.mean():7.3f}% (t {x.mean()/x.std()*np.sqrt(len(x)):5.1f}, duong {(x>0).mean()*100:.0f}%)"
    print(f"   {gio(a)} -> {gio(b)}: KP {tt(r[dK])} | KC {tt(r[~dK])}")
r = (ATC / C[:, 240] - 1) * 100; print(f"   14:29 -> ATC  : KP {r[dK].mean():7.3f}% (t {r[dK].mean()/r[dK].std()*np.sqrt(dK.sum()):5.1f}) | KC {r[~dK].mean():7.3f}% (t {r[~dK].mean()/r[~dK].std()*np.sqrt((~dK).sum()):5.1f})")
print("\n=== A2. THEO THU (mo cua -> 14:29, % gia, chua tru phi) va cac kieu danh theo lich (DA tru phi) ===")
tn = (C[:, 240] / O[:, 0] - 1) * 100
for t in range(5): print(f"   Thu {t+2}: KP {tn[dK & (thu==t)].mean():7.3f}% (t {tn[dK & (thu==t)].mean()/tn[dK & (thu==t)].std()*np.sqrt((dK & (thu==t)).sum()):5.1f}) | KC {tn[~dK & (thu==t)].mean():7.3f}% (t {tn[~dK & (thu==t)].mean()/tn[~dK & (thu==t)].std()*np.sqrt((~dK & (thu==t)).sum()):5.1f})")
def lich(dk, phia, ten, k0=0, k1=240):
    lai = np.where(dk, (phia * (C[:, k1] - C[:, k0]) - phi(C[:, k0])) / C[:, k0] * 100, 0.0); ghi("lich", ten, lai, dk.astype(float), ngay)
lich(thu == 0, -1, "BAN KHONG thu Hai (9:00 -> 14:29)"); lich(thu == 2, 1, "MUA thu Tu (9:00 -> 14:29)"); lich(thu == 4, 1, "MUA thu Sau (9:00 -> 14:29)")
tuanDao = np.zeros(N, bool)
for i in np.where(dao)[0]: tuanDao[max(0, i - 4):i + 1] = True
lich(tuanDao, 1, "MUA trong tuan dao han"); lich(tuanDao, -1, "BAN KHONG trong tuan dao han"); lich(dao, -1, "BAN KHONG ngay dao han"); lich(sauDao, 1, "MUA ngay dau hop dong moi")
s = pd.to_datetime(pd.Series(ngay)); dauThang = (s.dt.month != s.shift(1).dt.month).values; cuoiThang = (s.dt.month != s.shift(-1).dt.month).values
lich(dauThang | np.r_[False, dauThang[:-1]], 1, "MUA 2 phien dau thang"); lich(cuoiThang | np.r_[cuoiThang[1:], False], 1, "MUA 2 phien cuoi thang")
lich(np.ones(N, bool), 1, "MUA 13:00 -> 14:29 moi ngay", 151, 240); lich(np.ones(N, bool), -1, "BAN KHONG 9:00 -> 9:30 moi ngay", 0, 29)
# nghi trua, ATC
tr = np.sign(O[:, 151] - C[:, 150]); ghi("lich", "Theo huong khoang nhay nghi trua (13:00 -> 14:29)", np.where(tr != 0, (tr * (C[:, 240] - C[:, 151]) - phi(C[:, 151])) / C[:, 151] * 100, 0), (tr != 0).astype(float), ngay)
m = np.sign(C[:, 240] - C[:, 210]); ghi("lich", "Theo huong 14:00-14:29 -> giu qua phien ATC", np.where(m != 0, (m * (ATC - C[:, 240]) - phi(C[:, 240])) / C[:, 240] * 100, 0), (m != 0).astype(float), ngay)
ghi("lich", "NGUOC huong 14:00-14:29 -> giu qua phien ATC", np.where(m != 0, (-m * (ATC - C[:, 240]) - phi(C[:, 240])) / C[:, 240] * 100, 0), (m != 0).astype(float), ngay)

for n_ in (5, 15):
    B = nen_n(X, n_); nb = B["C"].shape[1]; h, l, c, v = B["H"].reshape(-1), B["L"].reshape(-1), B["C"].reshape(-1), B["V"].reshape(-1)
    dau = np.zeros(N * nb, bool); dau[::nb] = True; s0 = 3 if n_ == 5 else 1; R = lambda p: p.reshape(N, nb)
    def T(ten, pos, s0=s0, kCuoi=None):
        lai, so = chay_vt(R(pos), B["C"], s0=s0, kCuoi=kCuoi); ghi(f"{n_}p", f"[{n_}p] {ten}", lai, so, ngay)
    print(f"\n=== B. CHI BAO TREN NEN {n_} PHUT (vi the trong ngay, dong 14:29; da tru phi MBS + truot gia) ===")
    sai = np.zeros(N * nb, bool)
    for a_, m_ in ((10, 3.0), (10, 2.0), (20, 4.0)): T(f"Supertrend ATR{a_} x{m_}", supertrend(h, l, c, a_, m_))
    for nn in ((12, 24, 36) if n_ == 5 else (4, 8)):
        hh = np.r_[np.nan, lan(h, nn, np.max)[:-1]]; ll = np.r_[np.nan, lan(l, nn, np.min)[:-1]]
        T(f"Donchian {nn} nen: pha dinh mua, pha day ban (dao chieu)", trang_thai(c > hh, sai, c < ll, sai, dau))
        mid = (hh + ll) / 2; T(f"Donchian {nn} nen: thoat khi ve giua kenh", trang_thai(c > hh, c < mid, c < ll, c > mid, dau))
    e12, e26 = ema(c, 12), ema(c, 26); mac = e12 - e26; hist = mac - ema(mac, 9)
    T("MACD 12-26-9: theo dau histogram", np.sign(hist)); T("MACD: duong MACD tren / duoi 0", np.sign(mac))
    for a_, b_ in ((9, 21), (20, 50), (50, 200)): T(f"EMA {a_} / {b_} cat nhau", np.sign(ema(c, a_) - ema(c, b_)))
    r14 = rsi(c, 14); r2 = rsi(c, 2)
    T("RSI14 quan tinh: > 60 mua, < 40 ban, thoat khi ve 50", trang_thai(r14 > 60, r14 < 50, r14 < 40, r14 > 50, dau))
    T("RSI14 dao chieu: < 30 mua, > 70 ban, thoat khi ve 50", trang_thai(r14 < 30, r14 > 50, r14 > 70, r14 < 50, dau))
    T("RSI2 dao chieu: < 5 mua, > 95 ban, thoat khi qua 50", trang_thai(r2 < 5, r2 > 50, r2 > 95, r2 < 50, dau))
    e50 = ema(c, 50); T("Mua nhip chinh trong xu huong: gia > EMA50 & RSI2 < 10 (nguoc lai ban), thoat RSI2 qua 60 / 40", trang_thai((c > e50) & (r2 < 10), r2 > 60, (c < e50) & (r2 > 90), r2 < 40, dau))
    m20 = sma(c, 20); sd = lan(c, 20, np.std); tren, duoi = m20 + 2 * sd, m20 - 2 * sd
    T("Bollinger 20,2 pha vo: dong cua ngoai dai thi theo, thoat khi ve duong giua", trang_thai(c > tren, c < m20, c < duoi, c > m20, dau))
    T("Bollinger 20,2 dao chieu: dong cua ngoai dai thi danh nguoc, thoat o duong giua", trang_thai(c < duoi, c > m20, c > tren, c < m20, dau))
    rong = (tren - duoi) / m20; hep = rong <= np.r_[np.full(49, np.nan), lan(rong, 50, np.min)[49:]] * 1.1 if False else rong < np.nan_to_num(lan(rong, 100, lambda w, axis: np.quantile(w, 0.2, axis=1)), nan=0)
    hepTruoc = np.r_[False, hep[:-1]]; T("Bollinger that hep (20% hep nhat cua 100 nen) roi pha vo", trang_thai(hepTruoc & (c > tren), c < m20, hepTruoc & (c < duoi), c > m20, dau))
    ad, pdi, mdi = adx(h, l, c, 14)
    T("ADX > 25 va +DI > -DI mua (nguoc lai ban), thoat khi ADX < 20", trang_thai((ad > 25) & (pdi > mdi), (ad < 20) | (pdi < mdi), (ad > 25) & (mdi > pdi), (ad < 20) | (mdi < pdi), dau))
    T("ADX < 20 (di ngang): RSI14 < 35 mua / > 65 ban, thoat o 50", trang_thai((ad < 20) & (r14 < 35), r14 > 50, (ad < 20) & (r14 > 65), r14 < 50, dau))
    for (a_, b_, c_, ten) in ((9, 26, 52, "9-26-52"), (9, 17, 33, "9-17-33 (cua he thong)")):
        tk_ = (lan(h, a_, np.max) + lan(l, a_, np.min)) / 2; kj = (lan(h, b_, np.max) + lan(l, b_, np.min)) / 2
        sa = np.r_[np.full(26, np.nan), ((tk_ + kj) / 2)[:-26]]; sb = np.r_[np.full(26, np.nan), ((lan(h, c_, np.max) + lan(l, c_, np.min)) / 2)[:-26]]
        mt, md = np.fmax(sa, sb), np.fmin(sa, sb)
        T(f"Ichimoku {ten}: gia tren may & Tenkan > Kijun mua (nguoc lai ban), thoat khi gia cat Kijun", trang_thai((c > mt) & (tk_ > kj), c < kj, (c < md) & (tk_ < kj), c > kj, dau))
        T(f"Ichimoku {ten}: chi Tenkan / Kijun cat nhau", np.nan_to_num(np.sign(tk_ - kj)))
        T(f"Ichimoku {ten}: gia tren / duoi may", trang_thai(c > mt, c < mt, c < md, c > md, dau))
    T("Parabolic SAR 0,02 / 0,2", psar(h, l))
    hc = (B["O"].reshape(-1) + h + l + c) / 4; ho = np.empty(len(c)); ho[0] = c[0]
    for i in range(1, len(c)): ho[i] = (ho[i - 1] + hc[i - 1]) / 2
    T("Heikin-Ashi: nen xanh mua, nen do ban", np.sign(hc - ho))
    k_, d_ = stoch(h, l, c, 14, 3); kT = np.r_[np.nan, k_[:-1]]; dT = np.r_[np.nan, d_[:-1]]
    T("Stochastic 14,3: %K cat len %D duoi 20 mua, cat xuong tren 80 ban, thoat o 50", trang_thai((k_ > d_) & (kT <= dT) & (k_ < 20), k_ > 50, (k_ < d_) & (kT >= dT) & (k_ > 80), k_ < 50, dau))
    cc = cci(h, l, c, 20); T("CCI 20: vuot +100 mua, thung -100 ban, thoat khi ve 0", trang_thai(cc > 100, cc < 0, cc < -100, cc > 0, dau))
    T("CCI 20 dao chieu: < -150 mua, > 150 ban, thoat khi ve 0", trang_thai(cc < -150, cc > 0, cc > 150, cc < 0, dau))
    e20 = ema(c, 20); a14 = atr(h, l, c, 14)
    T("Keltner EMA20 +- 2 ATR pha vo, thoat khi ve EMA20", trang_thai(c > e20 + 2 * a14, c < e20, c < e20 - 2 * a14, c > e20, dau))
    T("Keltner dao chieu: ngoai kenh danh nguoc, thoat o EMA20", trang_thai(c < e20 - 2 * a14, c > e20, c > e20 + 2 * a14, c < e20, dau))
    moCua = np.repeat(B["O"][:, 0], nb); T("Gia tren gia mo cua + 0,15% mua / duoi - 0,15% ban", trang_thai(c > moCua * 1.0015, c < moCua, c < moCua * 0.9985, c > moCua, dau))
    homTruoc = np.repeat(np.nan_to_num(pATC, nan=O[0, 0]), nb); T("Gia tren ATC hom truoc + 0,15% mua / duoi ban", trang_thai(c > homTruoc * 1.0015, c < homTruoc, c < homTruoc * 0.9985, c > homTruoc, dau))
    vtb = np.r_[np.nan, sma(v, 20)[:-1]]; bd_ = h - l; bdtb = np.r_[np.nan, sma(bd_, 20)[:-1]]; o_ = B["O"].reshape(-1)
    cao = (v > 3 * vtb) & (bd_ > 2 * bdtb); caoT = np.r_[False, cao[:-1]]; cT = np.r_[c[0], c[:-1]]; oT = np.r_[o_[0], o_[:-1]]
    dem = np.zeros(len(c));
    T("Nen cao trao (KL > 3 lan, bien do > 2 lan TB): danh NGUOC nen do, giu 6 nen", trang_thai(caoT & (cT < oT), np.r_[np.zeros(6, bool), (caoT & (cT < oT))[:-6]], caoT & (cT > oT), np.r_[np.zeros(6, bool), (caoT & (cT > oT))[:-6]], dau))
    T("Nen cao trao: danh THEO nen do, giu 6 nen", trang_thai(caoT & (cT > oT), np.r_[np.zeros(6, bool), (caoT & (cT > oT))[:-6]], caoT & (cT < oT), np.r_[np.zeros(6, bool), (caoT & (cT < oT))[:-6]], dau))

print("\n=== E. GIU QUA DEM / THEO NGAY (lai lo ATC -> ATC; dem dao han: chuyen hop dong, mat 1 vong phi; doi vi the mat nua vong moi chieu) ===")
ser = pd.Series(ATC); dch = np.r_[0.0, (ATC[1:] / ATC[:-1] - 1) * 100]; dch[sauDao] = 0.0; phiPct = phi(ATC) / ATC * 100
def qua_dem(pos, ten):
    p = np.r_[0, np.asarray(pos, float)[:-1]]; doi = np.abs(np.diff(np.r_[0, p])); lai = p * dch - doi * phiPct / 2 - (sauDao & (p != 0)) * phiPct
    ghi("ngay", ten, np.nan_to_num(lai), doi / 2, ngay)
hD = pd.Series(H.max(axis=1)); lD = pd.Series(L.min(axis=1))
def giu(dk_mua, dk_ban, ra_mua=None, ra_ban=None):
    p = 0; out = []
    for i in range(N):
        if p == 1 and ra_mua is not None and ra_mua[i]: p = 0
        if p == -1 and ra_ban is not None and ra_ban[i]: p = 0
        if dk_mua[i]: p = 1
        elif dk_ban is not None and dk_ban[i]: p = -1
        out.append(p)
    return np.array(out)
for n_ in (20, 55):
    hh = hD.rolling(n_).max().shift(1).values; ll = lD.rolling(n_).min().shift(1).values
    qua_dem(giu(ATC > hh, ATC < ll), f"Donchian {n_} ngay mua / ban khong (Rua)"); qua_dem(giu(ATC > hh, None, ra_mua=ATC < lD.rolling(n_ // 2).min().shift(1).values), f"Donchian {n_} ngay CHI MUA, thoat khi thung day {n_//2} ngay")
e12 = ser.ewm(span=12, adjust=False).mean(); e26 = ser.ewm(span=26, adjust=False).mean(); mac = e12 - e26; sig = mac.ewm(span=9, adjust=False).mean()
qua_dem(np.sign(mac - sig).values, "MACD ngay: theo histogram (mua / ban)"); qua_dem(np.where(mac > sig, 1, 0), "MACD ngay: chi mua khi histogram duong")
d_ = ser.diff(); r14 = (100 - 100 / (1 + d_.clip(lower=0).ewm(alpha=1 / 14, adjust=False).mean() / (-d_).clip(lower=0).ewm(alpha=1 / 14, adjust=False).mean())).values
qua_dem(np.where(r14 > 50, 1, -1), "RSI14 ngay > 50 mua / < 50 ban"); qua_dem(np.where(r14 > 55, 1, 0), "RSI14 ngay > 55 chi mua")
m20 = ser.rolling(20).mean(); s20 = ser.rolling(20).std(ddof=0)
qua_dem(giu((ATC > (m20 + 2 * s20)).values, (ATC < (m20 - 2 * s20)).values, ra_mua=(ATC < m20).values, ra_ban=(ATC > m20).values), "Bollinger ngay pha vo, thoat o duong giua")
qua_dem(giu((ATC < (m20 - 2 * s20)).values, (ATC > (m20 + 2 * s20)).values, ra_mua=(ATC > m20).values, ra_ban=(ATC < m20).values), "Bollinger ngay dao chieu, thoat o duong giua")
st = supertrend(hD.values, lD.values, ATC, 10, 3.0); qua_dem(st, "Supertrend ngay 10 x3 (mua / ban)"); qua_dem(np.where(st > 0, 1, 0), "Supertrend ngay 10 x3 chi mua")
tk_ = (hD.rolling(9).max() + lD.rolling(9).min()) / 2; kj = (hD.rolling(17).max() + lD.rolling(17).min()) / 2; sa = ((tk_ + kj) / 2).shift(26); sb = ((hD.rolling(33).max() + lD.rolling(33).min()) / 2).shift(26)
mt, md = np.fmax(sa, sb).values, np.fmin(sa, sb).values
qua_dem(giu((ATC > mt) & (tk_ > kj).values, (ATC < md) & (tk_ < kj).values, ra_mua=(ATC < kj).values, ra_ban=(ATC > kj).values), "Ichimoku ngay 9-17-33: tren may & Tenkan > Kijun mua / nguoc lai ban, thoat khi cat Kijun")
qua_dem(np.where((ATC > mt) & (tk_ > kj).values, 1, 0), "Ichimoku ngay 9-17-33: chi mua khi tren may & Tenkan > Kijun")
vt = (ATC - lD.values) / np.where(hD.values - lD.values == 0, 1, hD.values - lD.values)
qua_dem(np.where(vt >= 0.8, 1, np.where(vt <= 0.2, -1, 0)), "Dong cua MANH (20% tren bien do) mua 1 ngay / dong cua YEU ban 1 ngay")
qua_dem(np.where(vt <= 0.2, 1, np.where(vt >= 0.8, -1, 0)), "NGUOC: dong cua yeu mua 1 ngay / dong cua manh ban 1 ngay")
r1 = np.r_[0.0, (ATC[1:] / ATC[:-1] - 1) * 100]
qua_dem(np.where(r1 <= -2, 1, 0), "Sau ngay giam >= 2%: mua 1 ngay"); qua_dem(np.where(r1 >= 2, 1, 0), "Sau ngay tang >= 2%: mua 1 ngay"); qua_dem(np.where(r1 >= 2, -1, 0), "Sau ngay tang >= 2%: ban khong 1 ngay")
c3 = (ser.diff() < 0) & (ser.diff().shift(1) < 0) & (ser.diff().shift(2) < 0); qua_dem(np.where(c3, 1, 0), "3 ngay giam lien tiep: mua 1 ngay")
t3 = (ser.diff() > 0) & (ser.diff().shift(1) > 0) & (ser.diff().shift(2) > 0); qua_dem(np.where(t3, -1, 0), "3 ngay tang lien tiep: ban khong 1 ngay")
xep_hang(20)
