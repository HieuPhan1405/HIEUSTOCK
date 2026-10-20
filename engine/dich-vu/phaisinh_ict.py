# PHAI SINH VN30F1M - ICT / SMC (Smart Money Concepts) DAY DU tren nen 5 phut (Hieu hoi 2026-10-20: "chi bao hien dai SMC, ICT thi sao?").
# Moi khai niem duoc cai dat NHAN QUA (chi dung nen da dong), 1 lenh / ngay / kieu, cat lo that, chot theo boi so R hoac cuoi phien (14:29). Phi MBS + truot 0,4 diem / vong.
# Cac kieu:
#  A. QUET THANH KHOAN (Turtle Soup / liquidity sweep): gia quet qua DINH / DAY NGAY HOM TRUOC (PDH / PDL) roi dong cua tro lai ben trong -> danh nguoc huong quet.
#  B. QUET + MSS (Market Structure Shift / CHoCH): sau khi quet, cho gia dong cua pha cau truc nho nguoc lai (ICT 2022 model) roi moi vao (vao ngay hoac hoi ve 50% song MSS).
#  C. JUDAS SWING / PHA VO ORB THAT BAI: pha vo khoang mo cua 15 phut roi dong cua tro lai ben trong trong <= 3 nen -> danh nguoc.
#  D. FVG (Fair Value Gap) CHUNG HUONG: nen xung luc tao khoang trong 3 nen, gia hoi ve lap khoang trong thi vao theo huong xung luc. Co / khong loc theo xu huong ngay va theo khung gio (silver bullet).
#  E. ORDER BLOCK: nen nguoc chieu cuoi cung truoc xung luc (>= 1,5 ATR, than >= 70%), gia hoi ve OB thi vao theo huong xung luc.
#  F. PREMIUM / DISCOUNT: trong ngay co xu huong, vao khi gia hoi ve 50% song (equilibrium) cua dinh - day ngay.
#  G. CHUAN DOI CHIEU: vao ngau nhien (cung cat lo / chot) de biet "khong co thong tin" cho ket qua nhu the nao.
# Chay: python engine/dich-vu/phaisinh_ict.py
import numpy as np
from phaisinh_chung import nap, phi, MOC
from phaisinh_chibao import nen_n

X = nap(); ngay = X["ngay"]; N = len(ngay)
B = nen_n(X, 5); nb = B["C"].shape[1]
O, H, L, C, V = B["O"], B["H"], B["L"], B["C"], B["V"]
dK = np.array([x < MOC for x in ngay]); nam = np.array([x[:4] for x in ngay])
dH, dL = H.max(axis=1), L.min(axis=1)
PDH, PDL = np.r_[np.nan, dH[:-1]], np.r_[np.nan, dL[:-1]]
sauDao = X["sauDao"]
# ATR 5 phut (Wilder 48 nen) tren chuoi noi lien
h_, l_, c_ = H.reshape(-1), L.reshape(-1), C.reshape(-1)
pc = np.r_[c_[0], c_[:-1]]; tr = np.maximum(h_ - l_, np.maximum(np.abs(h_ - pc), np.abs(l_ - pc)))
e = tr[:48].mean(); atr_f = np.empty(len(tr))
for i in range(len(tr)): e = e + (tr[i] - e) / 48 if i >= 48 else e; atr_f[i] = e
ATR = atr_f.reshape(N, nb)
TP_ = (H + L + C) / 3; VW = np.cumsum(TP_ * np.maximum(V, 1), axis=1) / np.cumsum(np.maximum(V, 1), axis=1)
CUOI = nb - 1

def chay(a, j, p, gia, cat, tg=None):
    """Vao o gia `gia` (sau khi nen j da dong / hoac khop gioi han trong nen j), giu tu nen j+1: cat lo `cat`, chot `tg` (hoac None), het ngay thoat o dong cua. Ca 2 cung nen -> cat lo truoc."""
    for k in range(j + 1, CUOI + 1):
        if p > 0:
            if L[a, k] <= cat: return min(O[a, k], cat)
            if tg is not None and H[a, k] >= tg: return max(O[a, k], tg)
        else:
            if H[a, k] >= cat: return max(O[a, k], cat)
            if tg is not None and L[a, k] <= tg: return min(O[a, k], tg)
    return C[a, CUOI]

import os
def phi_lenh(gia): return 0.0 if os.environ.get('PS_GROSS') else phi(gia)  # PS_GROSS=1: bo phi + truot de xem loi the TRUOC chi phi

KQ = []
def bao(ten, lenh, ghi_nho=True):
    """lenh: list (a, phia, vao, ra, R_diem). In so lenh, thang%, R TB, PF, KP / KC lai %/nam, Sharpe ngay, sut."""
    if not lenh:
        print(f"   {ten:72s} | khong co lenh"); return
    x = np.zeros(N); rr = []; pts = []
    for a, p, v, r, R in lenh:
        net = p * (r - v) - phi_lenh(v); x[a] += net / v * 100; pts.append(net); rr.append(net / R if R > 0 else np.nan)
    pts = np.array(pts); w, l_o = pts[pts > 0].sum(), -pts[pts <= 0].sum()
    def tk(m):
        y = x[m]; e = np.cumsum(y); n_ = m.sum() / 250
        return y.sum() / n_, (y.mean() / y.std() * np.sqrt(250) if y.std() > 0 else np.nan), (e - np.maximum.accumulate(e)).min()
    D, V_ = tk(dK), tk(~dK)
    print(f"   {ten:72s} | n={len(lenh):5d} ({len(lenh)/N:.2f}/ngay) thang {np.mean(pts > 0)*100:3.0f}% R TB {np.nanmean(rr):5.2f} PF {w/l_o if l_o else np.nan:4.2f} | KP {D[0]:6.1f}%/nam Sh {D[1]:5.2f} | KC {V_[0]:6.1f}%/nam Sh {V_[1]:5.2f} sut {V_[2]:6.1f}%")
    KQ.append((ten, D, V_))

MINR = 0.0
def so_luot(ten, ds):  # moi (a, p, vao, cat, tg) -> mo phong; MINR > 0: cat lo toi thieu MINR x ATR5p (chot theo cung boi so R)
    kq = []
    for a, j, p, vao, cat, tg in ds:
        if (vao - cat) * p <= 0: continue
        R = abs(vao - cat)
        if MINR > 0:
            R2 = max(R, MINR * ATR[a, j])
            if tg is not None: tg = vao + p * (abs(tg - vao) / R) * R2
            cat = vao - p * R2; R = R2
        ra = chay(a, j, p, vao, cat, tg); kq.append((a, p, vao, ra, R))
    bao(ten + (f" [cat lo >= {MINR:g} ATR]" if MINR > 0 else ""), kq)

def tat_ca():
    print("=== A. QUET THANH KHOAN (PDH / PDL) ROI DONG CUA TRO LAI -> DANH NGUOC HUONG QUET ===")
    for xr in (1.0, 2.0, None):
        for trong in (1, 3):
            ds = []
            for a in range(1, N):
                if sauDao[a] or np.isnan(PDH[a]): continue
                done = False
                for j in range(1, 40):
                    if done: break
                    for p, qua, tro in ((-1, H[a, j] > PDH[a], C[a, j] < PDH[a]), (1, L[a, j] < PDL[a], C[a, j] > PDL[a])):
                        if qua and tro:
                            cat = H[a, j] if p < 0 else L[a, j]; R = abs(C[a, j] - cat)
                            tg = None if xr is None else C[a, j] + p * xr * R
                            ds.append((a, j, p, C[a, j], cat, tg)); done = True; break
            so_luot(f"A. Quet PDH/PDL, dong cua tro lai ngay nen quet, chot {xr or 'cuoi phien'}R", ds)
            break

    print("\n=== B. QUET + MSS (cho pha cau truc nho nguoc lai roi moi vao) ===")
    for xr in (2.0, 3.0):
        for kieu in ("ngay", "hoi50"):
            ds = []
            for a in range(1, N):
                if sauDao[a] or np.isnan(PDH[a]): continue
                vaoRoi = False
                for j in range(1, 36):
                    if vaoRoi: break
                    for p, qua in ((-1, H[a, j] > PDH[a]), (1, L[a, j] < PDL[a])):
                        if not qua: continue
                        # cau truc nho truoc nen quet: day (p<0) / dinh (p>0) cua 4 nen truoc; MSS = dong cua pha qua do trong <= 10 nen sau
                        lo4 = L[a, max(0, j - 4):j].min() if len(L[a, max(0, j - 4):j]) else np.nan
                        hi4 = H[a, max(0, j - 4):j].max() if len(H[a, max(0, j - 4):j]) else np.nan
                        cat = H[a, j] if p < 0 else L[a, j]
                        ext = cat
                        for k in range(j + 1, min(j + 11, CUOI)):
                            ext = max(ext, H[a, k]) if p < 0 else min(ext, L[a, k])
                            if (p < 0 and C[a, k] < lo4) or (p > 0 and C[a, k] > hi4):
                                cat = ext
                                if kieu == "ngay":
                                    vao = C[a, k]; R = abs(vao - cat); tg = vao + p * xr * R
                                    ds.append((a, k, p, vao, cat, tg))
                                else:
                                    leg = (ext + C[a, k]) / 2  # hoi ve 50% song MSS (gia chua toi thi bo)
                                    for m in range(k + 1, min(k + 12, CUOI)):
                                        if (p < 0 and H[a, m] >= leg) or (p > 0 and L[a, m] <= leg):
                                            R = abs(leg - cat); ds.append((a, m - 1, p, leg, cat, leg + p * xr * R)); break
                                vaoRoi = True; break
                        break
            so_luot(f"B. Quet PDH/PDL + MSS, vao {'ngay luc MSS' if kieu=='ngay' else 'khi hoi ve 50% song MSS'}, chot {xr}R", ds)

    print("\n=== C. JUDAS SWING / PHA VO ORB THAT BAI (danh nguoc) ===")
    for w in (3, 6):
        for xr in (1.0, 2.0):
            ds = []
            for a in range(N):
                hi, lo = H[a, :w].max(), L[a, :w].min()
                for j in range(w, 30):
                    done = False
                    if H[a, j] > hi and C[a, j] < hi: p, cat = -1, H[a, j]; done = True
                    elif L[a, j] < lo and C[a, j] > lo: p, cat = 1, L[a, j]; done = True
                    if done:
                        R = abs(C[a, j] - cat); ds.append((a, j, p, C[a, j], cat, C[a, j] + p * xr * R)); break
            so_luot(f"C. Pha vo khoang mo cua {w*5}p that bai (dong cua tro lai), chot {xr}R", ds)

    print("\n=== D. FVG CHUNG HUONG (xung luc >= 1,2 ATR, hoi ve lap khoang trong) ===")
    for loc, ten_loc in ((None, "khong loc"), ("vw", "chi chung huong VWAP"), ("am", "chi 9:15-11:00 (killzone sang)"), ("pm", "chi 13:00-14:00 (killzone chieu)")):
        for xr in (1.5, 2.0):
            ds = []
            for a in range(N):
                vao_ = False
                for j in range(3, CUOI - 3):
                    if vao_: break
                    if loc == "am" and not (3 <= j <= 24): continue
                    if loc == "pm" and not (30 <= j <= 40): continue
                    rng = H[a, j - 1] - L[a, j - 1]
                    if rng < 1.2 * ATR[a, j - 1]: continue
                    for p, co in ((1, L[a, j] > H[a, j - 2] and C[a, j - 1] > O[a, j - 1]), (-1, H[a, j] < L[a, j - 2] and C[a, j - 1] < O[a, j - 1])):
                        if not co: continue
                        if loc == "vw" and (C[a, j] > VW[a, j]) != (p > 0): continue
                        top, bot = (L[a, j], H[a, j - 2]) if p > 0 else (L[a, j - 2], H[a, j])  # vung FVG: vao khi gia cham mep gan
                        cat = bot - 0.0 if p > 0 else bot
                        for k in range(j + 1, min(j + 12, CUOI)):
                            if (p > 0 and L[a, k] <= top) or (p < 0 and H[a, k] >= top):
                                R = abs(top - cat)
                                if R <= 0: break
                                ds.append((a, k - 1, p, top, cat, top + p * xr * R)); vao_ = True; break
                        if vao_: break
            so_luot(f"D. FVG chung huong, {ten_loc}, chot {xr}R", ds)

    print("\n=== E. ORDER BLOCK (xung luc >= 1,5 ATR, than >= 70%; vao khi gia hoi ve OB) ===")
    for xr in (1.5, 2.0):
        ds = []
        for a in range(N):
            vao_ = False
            for j in range(4, CUOI - 3):
                if vao_: break
                rng = H[a, j] - L[a, j]
                if rng < 1.5 * ATR[a, j - 1] or abs(C[a, j] - O[a, j]) < 0.7 * rng: continue
                p = 1 if C[a, j] > O[a, j] else -1
                ob = None
                for m in range(j - 1, max(j - 5, 0), -1):  # nen nguoc chieu gan nhat truoc xung luc
                    if (p > 0 and C[a, m] < O[a, m]) or (p < 0 and C[a, m] > O[a, m]): ob = m; break
                if ob is None: continue
                top, bot = H[a, ob], L[a, ob]
                vaoGia, cat = (top, bot) if p > 0 else (bot, top)
                for k in range(j + 1, min(j + 15, CUOI)):
                    if (p > 0 and L[a, k] <= vaoGia) or (p < 0 and H[a, k] >= vaoGia):
                        R = abs(vaoGia - cat)
                        if R <= 0: break
                        ds.append((a, k - 1, p, vaoGia, cat, vaoGia + p * xr * R)); vao_ = True; break
        so_luot(f"E. Order block chung huong xung luc, chot {xr}R", ds)

    print("\n=== F. PREMIUM / DISCOUNT: ngay co xu huong, vao khi gia hoi ve 50% song dinh-day ngay ===")
    for xr in (None, 1.0):
        ds = []
        for a in range(N):
            hi = H[a, :12].max(); lo = L[a, :12].min(); done = False
            for j in range(12, 40):
                if done: break
                hi = max(hi, H[a, j - 1]); lo = min(lo, L[a, j - 1]); eq = (hi + lo) / 2
                up = C[a, j - 1] > VW[a, j - 1] and (hi - lo) > 3 * ATR[a, j - 1]
                if up and L[a, j] <= eq and C[a, j] > O[a, j]:
                    R = C[a, j] - lo; ds.append((a, j, 1, C[a, j], lo, None if xr is None else C[a, j] + xr * R)); done = True
                dn = C[a, j - 1] < VW[a, j - 1] and (hi - lo) > 3 * ATR[a, j - 1]
                if not done and dn and H[a, j] >= eq and C[a, j] < O[a, j]:
                    R = hi - C[a, j]; ds.append((a, j, -1, C[a, j], hi, None if xr is None else C[a, j] - xr * R)); done = True
        so_luot(f"F. Hoi ve 50% song ngay theo huong VWAP, chot {xr or 'cuoi phien'}{'R' if xr else ''}", ds)

    print("\n=== G. CHUAN DOI CHIEU: vao ngau nhien (cung quy tac cat lo 3 ATR, chot 2R) ===")
    rng_ = np.random.default_rng(7)
    ds = []
    for a in range(N):
        j = int(rng_.integers(3, 40)); p = 1 if rng_.random() < 0.5 else -1
        R = 2.0 * ATR[a, j]; vao = C[a, j]
        ds.append((a, j, p, vao, vao - p * R, vao + p * 2 * R))
    so_luot("G. Vao ngau nhien 1 lenh / ngay, cat lo 2 ATR, chot 2R", ds)



for _m in (0.0, 1.0, 2.0):
    MINR = _m
    print(f"\n######## CAT LO TOI THIEU = {_m:g} ATR5p ########")
    tat_ca()

print("\n=== XEP HANG (KC, chi kieu duong CA 2 giai doan) ===")
tot = sorted([k for k in KQ if k[1][0] > 0 and k[2][0] > 0], key=lambda k: -min(k[1][1], k[2][1]))
for t, D, V_ in tot[:8]: print(f"   {t:72s} KP {D[0]:6.1f} (Sh {D[1]:.2f}) | KC {V_[0]:6.1f} (Sh {V_[1]:.2f})")
print(f"   Tong {len(KQ)} kieu | duong ca 2 giai doan: {len(tot)} | am ca 2: {sum(1 for k in KQ if k[1][0] < 0 and k[2][0] < 0)}")
