# HE THONG T+ - BUOC 3: mo phong danh muc tu diem du doan NGOAI MAU (engine/output/tplus_oos.pkl, sinh boi tplus_moHinh.py) - khong hoc lai mo hinh.
# Trong tam: mo hinh CHON MA q3 (du doan lai T+2,5 so voi trung vi cac ma cung ngay). Kiem: do thuc te (gia khop, phi, thanh khoan), loc thi truong, so ma, nguong diem, tung nam.
# Luat mo phong: sau dong cua ngay i chon K ma diem cao nhat -> mua MO CUA i+1 -> ban DONG CUA i+3 (chieu T+2). Von chia 3 phan quay vong. Phi 0,4% / vong da tru trong y3.
# Chay: python engine/dich-vu/tplus_moPhong.py
import numpy as np, pandas as pd
GOC = "engine/output/"
O = pd.read_pickle(GOC + "tplus_oos.pkl")
NGAY = sorted(O.ngay.unique())
VN = pd.read_json(GOC + "vnindex_dai.json").assign(ngay=lambda x: x.t.astype(str).str[:10]).set_index("ngay").c.reindex(NGAY).ffill()
f2 = lambda v: "-" if v is None or not np.isfinite(v) else f"{v:.2f}"

def mo_phong(cot="q3", H=3, K=5, nguong=None, tk=10, phi_them=0.0, loc=None, y=None, tk_max=None):
    y = y or f"y{H}"
    C = O[O.gt20 >= tk]
    if tk_max: C = C[C.gt20 < tk_max]
    if loc is not None: C = C[loc(C)]
    if nguong is not None: C = C[C[cot] >= nguong]
    chon = C.sort_values(["ngay", cot], ascending=[True, False]).groupby("ngay").head(K)
    lai = chon.groupby("ngay")[y].mean() - phi_them
    von = np.ones(H); duong = []; ro = {}
    for t, d in enumerate(NGAY):
        s = t % H
        if s in ro: von[s] *= 1 + ro.pop(s) / 100
        if d in lai.index and t + H < len(NGAY): ro[s] = lai[d]
        duong.append(von.mean())
    e = pd.Series(duong, index=NGAY); nam_ = len(NGAY) / 250
    thay = e.pct_change().dropna(); tr = chon[y] - phi_them; w, ls = tr[tr > 0], tr[tr <= 0]
    return dict(cagr=(e.iloc[-1] ** (1 / nam_) - 1) * 100, dd=(e / e.cummax() - 1).min() * 100, sharpe=thay.mean() / thay.std() * np.sqrt(250) if thay.std() > 0 else np.nan, n=len(tr), tb=tr.mean(),
                thang=(tr > 0).mean() * 100, pf=w.sum() / -ls.sum() if len(ls) else np.nan, coLenh=lai.size / len(NGAY) * 100, ngayLai=(lai > 0).mean() * 100, e=e, chon=chon, lai=lai,
                theoNam=e.groupby(e.index.str[:4]).apply(lambda x: (x.iloc[-1] / x.iloc[0] - 1) * 100), ddNam=e.groupby(e.index.str[:4]).apply(lambda x: (x / x.cummax() - 1).min() * 100))
def dong(ten, k):
    am = (k["theoNam"] < 0).sum()
    print(f"   {ten:66s} | lai kep {k['cagr']:6.1f}%/nam | sut toi da {k['dd']:6.1f}% | Sharpe {f2(k['sharpe'])} | {k['n']:5d} lenh TB {k['tb']:5.2f}% thang {k['thang']:.0f}% PF {f2(k['pf'])} | co lenh {k['coLenh']:.0f}% ngay | so nam lo {am}/8")

print(f"NGOAI MAU {NGAY[0]} -> {NGAY[-1]} ({len(NGAY)/250:.1f} nam) | VN-Index: lai kep {((VN.iloc[-1]/VN.iloc[0])**(250/len(NGAY))-1)*100:.1f}%/nam, sut toi da {((VN/VN.cummax()-1).min())*100:.1f}%")
O["ngau"] = np.random.default_rng(1).random(len(O))
GOC_ = mo_phong()
print("\n=== 1. MO HINH CHON MA q3 - ban goc va cac moc ===")
dong("MOC: 5 ma ngau nhien / ngay", mo_phong("ngau"))
dong("q3: 5 ma diem cao nhat / ngay (GOC)", GOC_)
dong("NGUOC LAI: 5 ma diem THAP nhat / ngay", mo_phong("q3", loc=None, K=5, y="y3") if False else (lambda: (O.__setitem__("q3am", -O.q3), mo_phong("q3am"))[1])())
print("\n=== 2. DO THUC TE ===")
dong("gia mua = TRUNG BINH phien (khong phai gia mo cua)", mo_phong(y="y3tb"))
for p in (0.2, 0.4, 0.6): dong(f"them {p}% phi + truot gia (tong {0.4+p:.1f}% / vong)", mo_phong(phi_them=p))
for a, b in ((10, 30), (30, 100), (100, None)): dong(f"chi ma thanh khoan {a}-{b or 'tro len'} ty / phien", mo_phong(tk=a, tk_max=b))
dong("thanh khoan >= 30 ty", mo_phong(tk=30)); dong("thanh khoan >= 50 ty", mo_phong(tk=50)); dong("thanh khoan >= 100 ty", mo_phong(tk=100))
dong("bo ma vua co phien giam san trong 5 phien (kho mua / rui ro tin xau)", mo_phong(loc=lambda C: C.soSan5 == 0))
dong("bo ma gia < 10 nghin", mo_phong(loc=lambda C: C.gia >= 10))
print("\n=== 3. SO MA / NGUONG DIEM / KY GIU ===")
for K in (1, 3, 5, 10, 20): dong(f"K = {K} ma / ngay", mo_phong(K=K))
for ng in (0.5, 1.0, 1.5, 2.0): dong(f"chi mua khi diem q3 >= {ng}% (toi da 5 ma)", mo_phong(nguong=ng))
dong("giu den T+5 (5 phan von)", mo_phong(H=5)); dong("giu den T+10", mo_phong(H=10))
print("\n=== 4. LOC THI TRUONG (dieu kien tinh luc dong cua ngay tin hieu; khong dat thi hom do khong mua) ===")
LOC = [("khong loc (GOC)", None), ("VN-Index tren MA200", lambda C: C.vnMa200 > 0), ("VN-Index tren MA50", lambda C: C.vnMa50 > 0), ("VN-Index tren MA50 VA MA200", lambda C: (C.vnMa50 > 0) & (C.vnMa200 > 0)),
       ("do rong: >= 40% ma tren MA50", lambda C: C.drMa50 >= 40), ("do rong: >= 50% ma tren MA20", lambda C: C.drMa20 >= 50), ("VN-Index 20 phien khong giam qua 5%", lambda C: C.vn20 > -5),
       ("VN-Index 60 phien > 0", lambda C: C.vn60 > 0), ("chi khi VN-Index giam > 3% / 5 phien (bat day)", lambda C: C.vn5 < -3), ("KHONG mua khi VN-Index giam > 3% / 5 phien", lambda C: C.vn5 >= -3),
       ("VN-Index tren MA200 HOAC giam > 3% / 5 phien", lambda C: (C.vnMa200 > 0) | (C.vn5 < -3)), ("bien dong VN-Index 10 phien < 1,5%", lambda C: C.vnBd10 < 1.5)]
KQ = {}
for ten, fn in LOC:
    KQ[ten] = mo_phong(loc=fn); dong(ten, KQ[ten])
print("\n=== 5. TUNG NAM (% lai danh muc | sut giam lon nhat trong nam) ===")
print("   " + "nam".ljust(46) + "  ".join(f"{y:>13s}" for y in GOC_["theoNam"].index))
print("   " + "VN-Index".ljust(46) + "  ".join(f"{(g.iloc[-1]/g.iloc[0]-1)*100:6.1f}%      " for y, g in VN.groupby(VN.index.str[:4])))
for ten in ("khong loc (GOC)", "VN-Index tren MA200", "VN-Index tren MA50", "do rong: >= 40% ma tren MA50", "VN-Index tren MA200 HOAC giam > 3% / 5 phien"):
    k = KQ[ten]; print("   " + ten.ljust(46) + "  ".join(f"{k['theoNam'][y]:6.1f}%|{k['ddNam'][y]:5.0f}%" for y in k["theoNam"].index))
c = GOC_["chon"]
print("\n=== 6. LENH DUOC CHON LA NHUNG MA NHU THE NAO (trung vi; trong ngoac = tat ca ma) ===")
for k in ("r1", "r3", "r5", "r20", "rsi2", "bbB", "ma20", "atr", "bienDo", "klTuongDoi", "ng5", "gt20", "gia", "soSan5", "dinh252"): print(f"   {k}: {c[k].median():.2f} ({O[k].median():.2f})", end=" |")
print(f"\n   ty le lenh sau phien giam > 5%: {(c.r1 < -5).mean()*100:.0f}% | sau phien giam san: {(c.r1 <= -6.5).mean()*100:.0f}% | sau phien TANG: {(c.r1 > 0).mean()*100:.0f}%")
print("   10 ma duoc chon nhieu nhat: " + ", ".join(f"{m} ({n})" for m, n in c.ma.value_counts().head(10).items()))
print(f"   Lenh tot nhat / te nhat: {c.y3.max():.0f}% / {c.y3.min():.0f}% | 1% lenh tot nhat dong gop {c.y3.nlargest(len(c)//100).sum()/c.y3.sum()*100:.0f}% tong lai | bo 1% lenh tot nhat thi TB con {c.y3.nsmallest(len(c)-len(c)//100).mean():.2f}%")
lai = GOC_["lai"]; th = lai.groupby(lai.index.str[:7]).agg(["sum", "count"]); rng = np.random.default_rng(3)
bs = [th["sum"].values[k].sum() / th["count"].values[k].sum() for k in (rng.integers(0, len(th), len(th)) for _ in range(3000))]
print(f"   Lai TB moi ngay mua (ro 5 ma): {lai.mean():.2f}% [khoang tin cay 95% theo cum thang: {np.percentile(bs,2.5):.2f} .. {np.percentile(bs,97.5):.2f}] | thang lai: {(lai.groupby(lai.index.str[:7]).mean()>0).mean()*100:.0f}% so thang")

# ---------- 7. HE DE XUAT ----------
print("\n=== 7. HE DE XUAT: q3 + bo loc do rong (>= 40% ma tren MA50) + bo ma co phien giam san trong 5 phien + thanh khoan >= 10 ty, 5 ma / ngay, ban T+2,5 ===")
DX = lambda C: (C.drMa50 >= 40) & (C.soSan5 == 0)
k7 = mo_phong(loc=DX); dong("HE DE XUAT (gia mua = mo cua, phi 0,4%)", k7)
dong("  gia mua = trung binh phien", mo_phong(loc=DX, y="y3tb"))
dong("  phi + truot gia 0,6% / vong", mo_phong(loc=DX, phi_them=0.2)); dong("  phi + truot gia 0,8% / vong", mo_phong(loc=DX, phi_them=0.4)); dong("  phi + truot gia 1,0% / vong", mo_phong(loc=DX, phi_them=0.6))
dong("  gia mua trung binh phien VA phi 0,6%", mo_phong(loc=DX, y="y3tb", phi_them=0.2))
dong("  3 ma / ngay", mo_phong(loc=DX, K=3)); dong("  10 ma / ngay", mo_phong(loc=DX, K=10)); dong("  thanh khoan >= 30 ty", mo_phong(loc=DX, tk=30)); dong("  thanh khoan >= 100 ty", mo_phong(loc=DX, tk=100))
dong("  chi khong co bo loc do rong (van bo ma giam san)", mo_phong(loc=lambda C: C.soSan5 == 0))
print("   theo nam (% lai | sut giam trong nam): " + "  ".join(f"{y}: {k7['theoNam'][y]:.1f}%|{k7['ddNam'][y]:.0f}%" for y in k7["theoNam"].index))
lai7 = k7["lai"]; thg = lai7.groupby(lai7.index.str[:7]).mean()
th7 = lai7.groupby(lai7.index.str[:7]).agg(["sum", "count"]); rng = np.random.default_rng(11)
bs7 = [th7["sum"].values[k].sum() / th7["count"].values[k].sum() for k in (rng.integers(0, len(th7), len(th7)) for _ in range(3000))]
print(f"   lai TB moi ro mua: {lai7.mean():.2f}% [95% theo cum thang: {np.percentile(bs7,2.5):.2f} .. {np.percentile(bs7,97.5):.2f}] | {(lai7>0).mean()*100:.0f}% ro lai | {(thg>0).mean()*100:.0f}% so thang lai | so ngay mua {len(lai7)} / {len(NGAY)}")
e7 = k7["e"]; dd7 = e7 / e7.cummax() - 1
print(f"   von 1 -> {e7.iloc[-1]:.1f} sau {len(NGAY)/250:.1f} nam | dot sut giam sau nhat: day {dd7.idxmin()} ({dd7.min()*100:.1f}%)")
