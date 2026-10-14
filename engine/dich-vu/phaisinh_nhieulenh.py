# PHAI SINH VN30F1M - NHIEU LENH 1 NGAY (2026-10-14): 2 kieu pha vo dang dung chi vao toi da 1 lenh / ngay. Cho vao lai (sau khi bi cat lo) thi sao?
#   "dao chieu" : bi cat lo thi chi duoc vao lai theo HUONG NGUOC (muc ben kia)
#   "cung chieu": bi cat lo thi chi duoc vao lai CUNG HUONG khi gia cham lai muc cu
#   "ca hai"    : bi cat lo hay dong lenh thi vao lai theo bat ky muc nao duoc cham tiep
#   Toi da 2 hoac 3 lenh / ngay, van chi vao truoc 13:30, dong het 14:29. Moi luc chi giu 1 hop dong.
#   Them: chay CA 2 kieu cung luc (moi kieu 1 hop dong) va ghep 5 kieu pha vo.
# Chi phi: bieu phi MBS + truot gia 0,4 diem / vong (phaisinh_chung.phi). KP = truoc 07/2022, KC = tu 07/2022.
# Chay: python engine/dich-vu/phaisinh_nhieulenh.py
import numpy as np
from phaisinh_chung import nap, phi, MOC
X = nap(); ngay, O, H, L, C, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["sauDao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); nKP, nKC = dK.sum(), (~dK).sum()
bd = H.max(axis=1) - L.min(axis=1); pBD = np.r_[np.nan, bd[:-1]]

def chay(a, p, k, gia, cat):  # giu tu phut k+1, cat lo `cat`, dong 14:29 -> (phut ra, gia ra)
    for j in range(k + 1, 241):
        if p > 0 and L[a, j] <= cat: return j, min(O[a, j], cat)
        if p < 0 and H[a, j] >= cat: return j, max(O[a, j], cat)
    return 240, C[a, 240]

def duoc(kieu, n, cu, p):
    return n == 0 or kieu == "ca hai" or (kieu == "dao chieu" and p != cu) or (kieu == "cung chieu" and p == cu)

def vb(k_=0.3, toi_da=1, kieu="ca hai"):
    gd = []
    for a in range(1, N):
        if sauDao[a] or np.isnan(pBD[a]): continue
        o0 = O[a, 0]; tr, du = o0 + k_ * pBD[a], o0 - k_ * pBD[a]; k, n, cu = 1, 0, 0
        while k < 180 and n < toi_da:
            vao = None
            for j in range(k, 180):
                lg, sh = H[a, j] >= tr and duoc(kieu, n, cu, 1), L[a, j] <= du and duoc(kieu, n, cu, -1)
                if lg or sh:
                    p = 1 if lg else -1
                    vao = (j, p, max(O[a, j], tr) if p > 0 else min(O[a, j], du)); break
            if vao is None: break
            j, p, gia = vao; jr, ra = chay(a, p, j, gia, o0); gd.append((a, p, gia, ra, n + 1)); n += 1; cu = p; k = jr + 1
            if jr >= 240: break
    return gd

def orb(Nm=15, toi_da=1, kieu="ca hai"):
    gd = []
    for a in range(1, N):
        hi, lo = H[a, :Nm].max(), L[a, :Nm].min(); k, n, cu = Nm, 0, 0
        while k < 180 and n < toi_da:
            vao = None
            for j in range(k, 180):
                p = 1 if C[a, j] > hi else -1 if C[a, j] < lo else 0
                if p and duoc(kieu, n, cu, p): vao = (j, p); break
            if vao is None: break
            j, p = vao; jr, ra = chay(a, p, j, C[a, j], lo if p > 0 else hi); gd.append((a, p, C[a, j], ra, n + 1)); n += 1; cu = p; k = jr + 1
            if jr >= 240: break
    return gd

def tk(gd, m):
    g = [x for x in gd if m[x[0]]]
    if not g: return "khong co lenh".ljust(110)
    d = np.array([x[1] * (x[3] - x[2]) - phi(x[2]) for x in g]); v = np.array([x[2] for x in g]); pct = d / v * 100
    ngay_ = np.zeros(N); np.add.at(ngay_, [x[0] for x in g], pct); e = np.cumsum(ngay_[m]); dd = (e - np.maximum.accumulate(np.r_[0, e])[1:]).min()
    nd = m.sum(); nam = nd / 250
    return (f"{len(g)/nd:4.2f} lenh/ngay | TB {d.mean():+5.2f} diem | thang {100*(d>0).mean():3.0f}% | {pct.sum()/nam:+6.1f}%/nam | sut {dd:6.1f}% | "
            f"{d.sum()*0.1/nam:+6.1f} trieu/nam/HD")
def bao(ten, gd):
    print(f"  {ten:58s} KP {tk(gd, dK)}")
    print(f"  {'':58s} KC {tk(gd, ~dK)}")
    for th in (2, 3):
        g = [x for x in gd if x[4] == th]
        if g:
            dd_ = [x[1] * (x[3] - x[2]) - phi(x[2]) for x in g if not dK[x[0]]]
            d0 = [x[1] * (x[3] - x[2]) - phi(x[2]) for x in g if dK[x[0]]]
            print(f"  {'':58s}    rieng lenh thu {th}: KP n={len(d0):4d} TB {np.mean(d0) if d0 else float('nan'):+5.2f} diem | KC n={len(dd_):4d} TB {np.mean(dd_) if dd_ else float('nan'):+5.2f} diem")

if __name__ == "__main__":
    print(f"{N} phien, kham pha {nKP}, kiem chung {nKC}. Lai / lo tinh cho 1 hop dong; % la tren gia tri hop dong (chua don bay).\n")
    for ten, f in (("PHA VO BIEN DONG 0,3", lambda **kw: vb(0.3, **kw)), ("KHOANG MO CUA 15 PHUT", lambda **kw: orb(15, **kw))):
        print(f"=== {ten} ===")
        bao("GOC: toi da 1 lenh / ngay", f(toi_da=1))
        for kieu in ("dao chieu", "cung chieu", "ca hai"):
            for td in (2, 3):
                bao(f"{kieu}, toi da {td} lenh / ngay", f(toi_da=td, kieu=kieu))
        print()

    print("=== CHAY NHIEU KIEU CUNG LUC (moi kieu toi da 1 lenh / ngay, moi kieu 1 hop dong) ===")
    VB3, ORB15 = vb(0.3), orb(15)
    bao("Bien dong 0,3 + khoang mo cua 15 (2 hop dong)", VB3 + ORB15)
    bao("5 kieu: khoang mo cua 5 / 15 / 30 + bien dong 0,3 / 0,5 (5 hop dong)", VB3 + ORB15 + orb(5) + orb(30) + vb(0.5))
    # ngay nao 2 kieu cung vao, cung huong hay nguoc huong
    a1 = {x[0]: x[1] for x in VB3}; a2 = {x[0]: x[1] for x in ORB15}; chung = set(a1) & set(a2)
    print(f"  Ngay ca 2 kieu cung vao lenh: {len(chung)} / {len(set(a1) | set(a2))} ngay co lenh; cung huong {100*np.mean([a1[a] == a2[a] for a in chung]):.0f}%")
