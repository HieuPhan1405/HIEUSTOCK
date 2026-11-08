# PHAI SINH VN30F1M - VAO LAI SAU CAT LO va 2 LENH SONG SONG: SO VOI RUI RO (Hieu 08/11/2026). Dung ham ngay_lenh cua phaisinh_vaolai.py (luat web + vao lai toi da 2 lenh/ngay chi sau CAT LO).
# So sanh: co so (1 HD) | + vao lai (van 1 HD tai 1 thoi diem) | 2 HD song song K 0,3 + K 0,5 | 2 HD song song + vao lai | 2 x K 0,3. Do: diem/nam, sut, ngay/tuan/thang te nhat, ty le lai / sut, so HD toi da cung luc (ky quy), kiem dinh chenh (boc khoi 20 ngay).
import numpy as np, pandas as pd
src = open('phaisinh_vaolai.py', encoding='utf-8').read()
exec(src[:src.index('b = chay(M=1)')])
def serie(M, K=0.3):
    x = np.zeros(N); t = chay(M=M, K=K)
    np.add.at(x, t.a.values, t.d.values); return x, t
x1, t1 = serie(1); x2, t2 = serie(2); x5, _ = serie(1, 0.5); x5r, _ = serie(2, 0.5)
thang = np.array([n[:7] for n in ngay]); KCm = ~dK & valid; KPm = dK & valid
def rui_ro(ten, x, hd_max):
    out = []
    for m in (KPm, KCm):
        y = x[m]; nn = m.sum() / 250; e = np.cumsum(y); dd = (e - np.maximum.accumulate(e)).min()
        out.append((y.sum() / nn, y.mean() / y.std() * np.sqrt(250), dd))
    mk = pd.Series(x[KCm], index=thang[KCm]).groupby(level=0).sum(); w5 = pd.Series(x[KCm]).rolling(5).sum().min()
    print(f"{ten:40s}| KP {out[0][0]:4.0f}d/nam Sh {out[0][1]:4.2f} sut {out[0][2]:5.0f} | KC {out[1][0]:4.0f}d/nam Sh {out[1][1]:4.2f} sut {out[1][2]:5.0f} | lai/sut KC {out[1][0]/-out[1][2]:4.2f} | ngay te nhat {x[KCm].min():5.0f} 5 ngay {w5:5.0f} thang {mk.min():5.0f} (thang lo {np.mean(mk<0)*100:3.0f}%) | HD toi da {hd_max} | lai KC / HD {out[1][0]/hd_max:4.0f}")
    return out
print(f"=== {N} phien. diem/nam tinh theo ngay hop le; 1 diem = 100.000d / HD; sut = sut von toi da (diem) ===")
rui_ro("CO SO (1 HD)", x1, 1); r2 = rui_ro("+ VAO LAI sau cat lo (van 1 HD luc nao)", x2, 1)
rui_ro("2 HD: K 0,3 + K 0,5", x1 + x5, 2); rui_ro("2 HD: K 0,3 + K 0,5, ca hai co vao lai", x2 + x5r, 2)
rui_ro("2 x K 0,3 (nhan doi)", 2 * x1, 2)
print("\n--- VAO LAI: chenh so voi co so, tung ngay (diem/nam; khoang 90% boc khoi 20 ngay) ---")
rng = np.random.default_rng(3)
def boot(d, m, B=20, sims=4000):
    y = d[m]; nb = len(y) // B; o = [np.concatenate([y[i*B:(i+1)*B] for i in rng.integers(0, nb, nb)]).sum() / (len(y)/250) for _ in range(sims)]
    return np.percentile(o, [5, 95])
for ten, m in (("KP", KPm), ("KC", KCm), ("toan ky", valid)):
    d = x2 - x1; print(f"   {ten}: {d[m].sum()/(m.sum()/250):+.0f} diem/nam [{boot(d,m)[0]:+.0f} .. {boot(d,m)[1]:+.0f}], t theo ngay {d[m].mean()/d[m].std()*np.sqrt(m.sum()):.2f}")
s = t2[t2.thu == 2]; f = t2[t2.thu == 1]; both = s.merge(f[["a", "d"]], on="a", suffixes=("2", "1"))
print(f"\n--- RUI RO CUA LENH THU HAI ---")
print(f"   {len(s)} lenh ({len(s)/len(f)*100:.0f}% ngay co lenh dau; ~{len(s)/(valid.sum()/250):.0f} lenh/nam), thang {(s.d>0).mean()*100:.0f}%, lenh thu hai TB {s.d.mean():+.2f}d, lai TB {s[s.d>0].d.mean():.1f}d, lo TB {s[s.d<=0].d.mean():.1f}d, lo toi da {s.d.min():.1f}d")
print(f"   Ngay co 2 lenh: lenh dau TB {both.d1.mean():.1f}d + lenh hai TB {both.d2.mean():.1f}d = {(both.d1+both.d2).mean():+.1f}d/ngay; ca 2 lenh deu LO: {int(((both.d1<=0)&(both.d2<=0)).sum())} ngay ({((both.d1<=0)&(both.d2<=0)).mean()*100:.0f}%), tong lo TB {(both.d1+both.d2)[(both.d1<=0)&(both.d2<=0)].mean():.1f}d, te nhat {(both.d1+both.d2).min():.1f}d")
print(f"   Ngay te nhat 1 lenh: {x1[valid].min():.1f}d | co vao lai: {x2[valid].min():.1f}d | ngay lo >= 15 diem: {int((x1[valid]<=-15).sum())} -> {int((x2[valid]<=-15).sum())}; lo >= 20: {int((x1[valid]<=-20).sum())} -> {int((x2[valid]<=-20).sum())}")
ky_quy = 35.0
print("\n--- KY QUY / VON can co o dinh (35 trieu / HD) va lai tren moi trieu ky quy (KC) ---")
for ten, x, hd in (("co so 1 HD", x1, 1), ("vao lai (1 HD luc nao)", x2, 1), ("2 HD K 0,3 + K 0,5", x1 + x5, 2), ("2 x K 0,3", 2 * x1, 2)):
    nn = KCm.sum() / 250; e = np.cumsum(x[KCm]); dd = -(e - np.maximum.accumulate(e)).min() * 0.1
    print(f"   {ten:26s}: ky quy {hd*ky_quy:3.0f} trieu, lai TB {x[KCm].sum()/nn*0.1:5.1f} trieu/nam ({x[KCm].sum()/nn*0.1/(hd*ky_quy)*100:3.0f}% tren ky quy), sut lich su {dd:5.1f} trieu = {dd/(hd*ky_quy)*100:3.0f}% ky quy")
print("\n--- ngay 2 lenh song song cung chieu / nguoc chieu (K 0,3 va K 0,5 cung mo) ---")
a3 = t1.set_index("a"); t5 = chay(M=1, K=0.5).set_index("a"); co = a3.index.intersection(t5.index)
cung = (a3.loc[co, "p"] == t5.loc[co, "p"]); print(f"   Ngay K 0,5 cung co lenh: {len(co)} / {len(a3)}; cung chieu {cung.mean()*100:.0f}%; tuong quan diem theo ngay K0,3 vs K0,5: {np.corrcoef(x1[valid], x5[valid])[0,1]:.2f}")
print(f"   Ngay ca 2 cung THUA: {((x1<0)&(x5<0)&valid).sum()} ngay, tong lo TB {(x1+x5)[(x1<0)&(x5<0)&valid].mean():.1f}d | ngay 1 HD K0,3 lo: {((x1<0)&valid).sum()}")
