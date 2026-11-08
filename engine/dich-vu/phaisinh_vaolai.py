# PHAI SINH VN30F1M - VAO LAI SAU KHI BI CAT LO (kiem tra ky tu phaisinh_toiuu.py: toi da 2 lenh / ngay, chi vao lai khi lenh dau bi CAT LO ban dau, khong phai sau khoa lai).
# Tach LENH THU HAI rieng: so lenh, lai TB, thang %, theo chieu (cung chieu lenh dau / nguoc chieu), theo nam, theo gio cat lo, theo he so K. Phi MBS + truot 0,4. Chay: python engine/dich-vu/phaisinh_vaolai.py
import numpy as np, pandas as pd, warnings
from phaisinh_chung import nap, MOC, PHI_CO_DINH, TRUOT
warnings.filterwarnings("ignore")
X = nap(); ngay, O, H, L, C, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["sauDao"]
N = len(ngay); dK = np.array([x < MOC for x in ngay]); nam = np.array([int(x[:4]) for x in ngay])
bd = H.max(axis=1) - L.min(axis=1); pBD = np.r_[np.nan, bd[:-1]]; mo = O[:, 0]
valid = (np.arange(N) >= 25) & ~sauDao & ~np.isnan(pBD)
phiv = lambda g: PHI_CO_DINH + 0.00017 * g + TRUOT

def ngay_lenh(a, K=0.3, M=2, minSL=7, kich=7, khoa=2, kVaoLaiMax=179, cho=0):
    tr, du = mo[a] + K * pBD[a], mo[a] - K * pBD[a]; out = []; k = 1
    while k <= kVaoLaiMax and len(out) < M:
        p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
        if not p: k += 1; continue
        vao = max(O[a, k], tr) if p > 0 else min(O[a, k], du)
        stop = min(mo[a], vao - minSL) if p > 0 else max(mo[a], vao + minSL); lock = False; dinh = 0.0; ra = None; ly = "cuoi"; j = 240
        for j in range(k + 1, 241):
            if (L[a, j] <= stop) if p > 0 else (H[a, j] >= stop):
                ra = min(O[a, j], stop) if p > 0 else max(O[a, j], stop); ly = "khoa" if lock else "cat"; break
            dinh = max(dinh, (H[a, j] - vao) if p > 0 else (vao - L[a, j]))
            if not lock and dinh >= kich: stop = vao + p * khoa; lock = True
        if ra is None: ra = C[a, 240]; j = 240
        out.append(dict(a=a, p=p, kv=k, kr=j, ly=ly, d=p * (ra - vao) - phiv(vao)))
        if ly != "cat" or j >= 240: break
        k = j + 1 + cho
    return out

def chay(**kw):
    rows = []
    for a in range(N):
        if not valid[a]: continue
        for i, r in enumerate(ngay_lenh(a, **kw)): r["thu"] = i + 1; rows.append(r)
    t = pd.DataFrame(rows); t["nam"] = nam[t.a.values]; t["dK"] = dK[t.a.values]; return t

def tong(t, ten):
    x = np.zeros(N); np.add.at(x, t.a.values, t.d.values)
    out = []
    for m in (dK, ~dK):
        y = x[m]; nn = m.sum() / 250; e = np.cumsum(y); out.append(f"{y.sum()/nn:5.0f}d/nam Sh {y.mean()/y.std()*np.sqrt(250):4.2f} sut {(e-np.maximum.accumulate(e)).min():5.0f}")
    print(f"{ten:52s} | KP {out[0]} | KC {out[1]} | " + "  ".join(f"{y}:{x[nam==y].sum():5.0f}" for y in range(2018, 2027)))
    return x

b = chay(M=1); x1 = tong(b, "co so (1 lenh / ngay)")
t = chay(M=2); x2 = tong(t, "vao lai 1 lan sau CAT LO")
s = t[t.thu == 2]; f = t[t.thu == 1]
dau = f.set_index("a").loc[s.a.values]; s = s.assign(cung=(s.p.values == dau.p.values), khoangCat=(s.kv.values - dau.kr.values))
print(f"\nLenh THU HAI: {len(s)} lenh ({len(s)/len(f)*100:.0f}% so ngay co lenh dau), TB {s.d.mean():.2f} diem, thang {(s.d>0).mean()*100:.0f}%, tong {s.d.sum():.0f} diem; KP {s[s.dK].d.mean():.2f} ({int(s.dK.sum())}) | KC {s[~s.dK].d.mean():.2f} ({int((~s.dK).sum())})")
for ten, m in (("cung chieu lenh dau", s.cung), ("nguoc chieu lenh dau", ~s.cung)):
    q = s[m]; print(f"   {ten:22s}: {len(q):4d} lenh TB {q.d.mean():6.2f}d thang {(q.d>0).mean()*100:3.0f}% | KP {q[q.dK].d.mean():5.2f} ({int(q.dK.sum())}) KC {q[~q.dK].d.mean():5.2f} ({int((~q.dK).sum())})")
print("   theo nam (TB diem / so lenh): " + "  ".join(f"{y}: {g.d.mean():5.1f}/{len(g)}" for y, g in s.groupby("nam")))
gio = pd.cut(s.kv, [0, 30, 90, 150, 180], labels=["<09:30", "09:30-10:30", "10:30-11:30", "13:00-13:30"])
print("   theo gio vao lai: " + "  ".join(f"{k}: {g.d.mean():5.1f}/{len(g)}" for k, g in s.groupby(gio)))
kc = pd.cut(s.khoangCat, [-1, 5, 20, 60, 300], labels=["<=5p", "6-20p", "21-60p", ">60p"])
print("   theo thoi gian tu luc bi cat lo den luc vao lai: " + "  ".join(f"{k}: {g.d.mean():5.1f}/{len(g)}" for k, g in s.groupby(kc)))
print("\n--- nhay theo K va cat lo toi thieu (vao lai 1 lan sau cat lo) ---")
for K in (0.25, 0.3, 0.35, 0.4):
    for M in (5, 7, 9):
        tt = chay(M=2, K=K, minSL=M); bb = chay(M=1, K=K, minSL=M)
        xa, xb = np.zeros(N), np.zeros(N); np.add.at(xa, tt.a.values, tt.d.values); np.add.at(xb, bb.a.values, bb.d.values)
        nn = lambda m: m.sum() / 250
        print(f"   K {K} cat lo >= {M}: co so KP {xb[dK].sum()/nn(dK):4.0f} KC {xb[~dK].sum()/nn(~dK):4.0f} | vao lai KP {xa[dK].sum()/nn(dK):4.0f} KC {xa[~dK].sum()/nn(~dK):4.0f} | chenh KP {(xa-xb)[dK].sum()/nn(dK):+4.0f} KC {(xa-xb)[~dK].sum()/nn(~dK):+4.0f}")
print("\n--- cho vai phut sau khi bi cat lo roi moi duoc vao lai ---")
for cho in (0, 5, 15, 30): tong(chay(M=2, cho=cho), f"cho {cho} phut sau cat lo")
print("\n--- 3 lenh / ngay sau cat lo ---"); tong(chay(M=3), "vao lai toi da 2 lan sau cat lo (3 lenh)")
print("--- thang 01/2026 ---"); print(f"   co so {x1[np.array([n[:7]=='2026-01' for n in ngay])].sum():.1f} | vao lai {x2[np.array([n[:7]=='2026-01' for n in ngay])].sum():.1f}")
