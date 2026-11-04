# PHAI SINH VN30F1M - LICH SU TUNG LENH cua cach PHA VO BIEN DONG 0,3 (cat lo o gia mo cua, giu den 14:29), tu 2024-01-01 den ngay moi nhat trong engine/output/vn30f1m_1p.json (cap nhat bang taiDuLieuPhaiSinh.mjs).
# Cot "diem sau phi" = chi tru phi + thue MBS (~0,48 diem, giong trang /phai-sinh); "diem sau phi + truot" = tru them 0,4 diem truot gia / vong (giong cac backtest). 1 diem = 100.000 dong / hop dong.
# Phien dau hop dong moi (sau ngay dao han) bo qua vi bien do hom truoc la cua hop dong cu.
# Chay: python engine/dich-vu/phaisinh_lichsu.py [tu=2024-01-01] [ra=<thu muc>]  -> ghi CSV + bao cao thang (Markdown)
import sys, os, numpy as np, pandas as pd
from phaisinh_chung import nap, phi, chay_lenh
tu = next((a.split("=")[1] for a in sys.argv[1:] if a.startswith("tu=")), "2024-01-01")
ra_dir = next((a.split("=")[1] for a in sys.argv[1:] if a.startswith("ra=")), ".")
X = nap(); ngay, O, H, L, C, sauDao = X["ngay"], X["O"], X["H"], X["L"], X["C"], X["sauDao"]
N = len(ngay); dH = H.max(axis=1); dL = L.min(axis=1); bd = dH - dL; pBD = np.r_[np.nan, bd[:-1]]
gio = lambda k: f"{(540 + k) // 60:02d}:{(540 + k) % 60:02d}" if k <= 150 else f"{(780 + k - 151) // 60:02d}:{(780 + k - 151) % 60:02d}"
thu = ["Thu 2", "Thu 3", "Thu 4", "Thu 5", "Thu 6", "Thu 7", "CN"]
rows = []
for a in range(N):
    if ngay[a] < tu: continue
    ngay_dt = pd.Timestamp(ngay[a])
    r = dict(ngay=ngay[a], thu=thu[ngay_dt.dayofweek], mo_cua=O[a, 0], bien_do_hom_truoc=pBD[a] if a else np.nan, khoang_cach=0.3 * pBD[a] if a else np.nan, dong_cua_1429=C[a, 240], ghi_chu="", phia="", gio_vao="", gia_vao=np.nan, gio_ra="", gia_ra=np.nan, ly_do="", diem_gop=np.nan, diem_sau_phi=np.nan, diem_sau_phi_truot=np.nan)
    if a < 1 or np.isnan(pBD[a]): r["ghi_chu"] = "khong du du lieu hom truoc"
    elif sauDao[a]: r["ghi_chu"] = "phien dau hop dong moi - bo qua"
    else:
        o0 = O[a, 0]; tr, du = o0 + 0.3 * pBD[a], o0 - 0.3 * pBD[a]
        for k in range(1, 180):
            p = 1 if H[a, k] >= tr else -1 if L[a, k] <= du else 0
            if not p: continue
            gia = max(O[a, k], tr) if p > 0 else min(O[a, k], du)
            j, rr = chay_lenh(O[a], H[a], L[a], C[a], p, k, gia, cat=o0)
            g = p * (rr - gia)
            r.update(phia="MUA" if p > 0 else "BAN KHONG", gio_vao=gio(k), gia_vao=gia, gio_ra=gio(j), gia_ra=rr, ly_do="cat lo" if j < 240 else "dong 14:29", diem_gop=g, diem_sau_phi=g - phi(gia, 0), diem_sau_phi_truot=g - phi(gia))
            break
        else: r["ghi_chu"] = "khong co lenh"
    rows.append(r)
D = pd.DataFrame(rows)
os.makedirs(ra_dir, exist_ok=True)
ten = f"Phan-Hieu-Stock-Phai-Sinh-Lich-Su-{tu[:4]}-{ngay[-1][:4]}"
D.to_csv(os.path.join(ra_dir, ten + ".csv"), index=False, encoding="utf-8-sig", float_format="%.2f")
L_ = D[D.phia != ""].copy(); L_["thang"] = L_.ngay.str[:7]
def nhom(g):
    return pd.Series(dict(ngay=int(g.shape[0]), lenh=int(len(g)), thang=int((g.diem_sau_phi > 0).sum()), diem=g.diem_sau_phi.sum(), diem_truot=g.diem_sau_phi_truot.sum()))
T = L_.groupby("thang").apply(nhom, include_groups=False) if hasattr(pd.DataFrame, "groupby") else None
songay = D.groupby(D.ngay.str[:7]).size()
md = [f"# Lich su phai sinh VN30F1M - pha vo bien dong 0,3 ({tu} -> {ngay[-1]})", "",
      "Cat lo o gia mo cua, giu den 14:29, toi da 1 lenh / ngay. Diem sau phi = chi tru phi + thue MBS (~0,48 diem); sau phi + truot = tru them 0,4 diem / vong. 1 diem = 100.000 dong / hop dong.", "",
      "| Thang | Ngay GD | Lenh | Thang | Diem (sau phi) | Trieu dong | Diem (sau phi + truot 0,4) | Luy ke trieu (sau phi) |", "|---|---|---|---|---|---|---|---|"]
lk = 0
for t, x in T.iterrows():
    lk += x.diem * 0.1
    md.append(f"| {t} | {songay[t]} | {int(x.lenh)} | {int(x.thang)} | {x.diem:.1f} | {x.diem * 0.1:.2f} | {x.diem_truot:.1f} | {lk:.1f} |")
md += ["", "## Theo nam", "", "| Nam | Lenh | Thang | % thang | Diem (sau phi) | Trieu dong | Diem (sau phi + truot) |", "|---|---|---|---|---|---|---|"]
L_["nam"] = L_.ngay.str[:4]
for y, g in L_.groupby("nam"):
    md.append(f"| {y} | {len(g)} | {int((g.diem_sau_phi > 0).sum())} | {(g.diem_sau_phi > 0).mean() * 100:.0f}% | {g.diem_sau_phi.sum():.1f} | {g.diem_sau_phi.sum() * 0.1:.1f} | {g.diem_sau_phi_truot.sum():.1f} |")
md += ["", f"**Tong:** {len(L_)} lenh, thang {int((L_.diem_sau_phi > 0).sum())} ({(L_.diem_sau_phi > 0).mean() * 100:.0f}%), {L_.diem_sau_phi.sum():.1f} diem sau phi = {L_.diem_sau_phi.sum() * 0.1:.1f} trieu dong / 1 hop dong; sau phi + truot 0,4: {L_.diem_sau_phi_truot.sum():.1f} diem.",
       "", "Tung lenh chi tiet xem file CSV cung ten. Backtest tren nen 1 phut, khop ly tuong; khong dam bao ket qua tuong lai."]
open(os.path.join(ra_dir, ten + ".md"), "w", encoding="utf-8").write("\n".join(md))
print("\n".join(md[:5 + len(T) + 14]))
print("\nGhi:", os.path.join(ra_dir, ten + ".csv"))
