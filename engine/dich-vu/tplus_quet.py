# HE THONG T+ CO PHIEU - QUET HANG NGAY (2026-10-14). Chi DOC du lieu va IN danh sach; KHONG dat lenh. Ket qua la dau ra cua mo hinh thong ke, KHONG phai khuyen nghi dau tu.
#
# CACH DUNG (sau gio dong cua, 4 lenh; mat khoang 5-8 phut):
#   node engine/dich-vu/taiDuLieuDai.mjs      (gia ngay, VNDirect)
#   node engine/dich-vu/taiVniDai.mjs         (VN-Index)
#   node engine/dich-vu/taiDuLieuNgoai.mjs    (khoi ngoai theo ma)
#   python engine/dich-vu/tplus_dacTrung.py   (dung bang dac trung)
#   python engine/dich-vu/tplus_quet.py       (hoc mo hinh tren toan bo lich su co nhan + cham diem phien moi nhat)
# Can: pip install lightgbm
#
# LUAT CUA HE (dung nhu da kiem chung ngoai mau 2019-2026 trong tplus_moHinh.py / tplus_moPhong.py):
#   1. Mo hinh q3 cham diem moi ma: du doan lai rong T+2,5 SO VOI trung vi cac ma cung ngay (chi xep hang ma, khong doan thi truong).
#   2. Bo loc thi truong: chi mua khi >= 40% so ma (thanh khoan >= 5 ty) dang tren MA50. Khong dat thi hom do DUNG NGOAI.
#   3. Chon toi da 5 ma diem cao nhat, thanh khoan >= 10 ty / phien, khong co phien giam san trong 5 phien gan nhat.
#   4. Mua lenh ATO phien sau (bo qua neu gia mo cua sat tran), ban ATC chieu T+2. Chia von 3 phan, moi ngay dung 1 phan, moi ma 1/5 phan do (toi da 15 vi the).
import sys, time, warnings
import numpy as np, pandas as pd
warnings.filterwarnings("ignore")
try:
    import lightgbm as lgb
except ImportError:
    sys.exit("Thieu thu vien lightgbm. Chay: python -m pip install lightgbm")
GOC = "engine/output/"
DR_TOI_THIEU, TK_TOI_THIEU, K = 40.0, 10.0, 5
D = pd.read_pickle(GOC + "tplus_dactrung.pkl")
BO = {"ma", "ngay", "nganh", "gia", "muaDuoc", "y3", "y5", "y10", "y3tb", "gt20"}
F = [c for c in D.columns if c not in BO]
hoc = D[D.muaDuoc & D.y3.notna()].copy()
hoc["x3"] = (hoc.y3 - hoc.groupby("ngay").y3.transform("median")).clip(-12, 12)
ngay_moi = D.ngay.max()
T = D[D.ngay == ngay_moi].copy()
P = dict(objective="huber", alpha=3.0, learning_rate=0.03, num_leaves=31, min_data_in_leaf=400, feature_fraction=0.6, bagging_fraction=0.7, bagging_freq=1, lambda_l2=20.0, n_estimators=400, verbose=-1, n_jobs=-1)
t0 = time.time(); T["diem"] = 0.0
for seed in (7, 2026):
    T["diem"] += lgb.LGBMRegressor(**P, random_state=seed).fit(hoc[F], hoc.x3).predict(T[F]) / 2
print(f"Hoc tu {len(hoc):,} dong ({hoc.ngay.min()} -> {hoc.ngay.max()}) trong {time.time()-t0:.0f}s | cham diem phien {ngay_moi}: {len(T)} ma du thanh khoan >= 5 ty")
dr = T.drMa50.iloc[0]
print(f"\nBO LOC THI TRUONG: {dr:.0f}% so ma dang tren MA50 (can >= {DR_TOI_THIEU:.0f}%)  ->  {'DAT: duoc mua' if dr >= DR_TOI_THIEU else 'KHONG DAT: hom nay DUNG NGOAI'}")
print(f"   VN-Index: 1 phien {T.vn1.iloc[0]:.2f}% | 5 phien {T.vn5.iloc[0]:.2f}% | 20 phien {T.vn20.iloc[0]:.2f}% | so voi MA50 {T.vnMa50.iloc[0]:.1f}% | so voi MA200 {T.vnMa200.iloc[0]:.1f}% | {T.drMa20.iloc[0]:.0f}% so ma tren MA20")
U = T[(T.gt20 >= TK_TOI_THIEU) & (T.soSan5 == 0)].sort_values("diem", ascending=False)
cot = lambda r: f"{r.ma:5s} diem {r.diem:5.2f} | gia {r.gia:7.2f} | 1 phien {r.r1:5.1f}% | 5 phien {r.r5:6.1f}% | 20 phien {r.r20:6.1f}% | RSI2 {r.rsi2:3.0f} | ngoai 5 phien {r.ng5:5.1f}% KL | thanh khoan {r.gt20:5.0f} ty | {r.nganh}"
print(f"\n{K} MA DIEM CAO NHAT (ung vien mua ATO phien sau, ban ATC chieu T+2){'' if dr >= DR_TOI_THIEU else '  -- CHI DE THAM KHAO vi bo loc thi truong khong dat'}:")
for r in U.head(K).itertuples(): print("   " + cot(r))
print("\n5 ma ke tiep:")
for r in U.iloc[K:K + 5].itertuples(): print("   " + cot(r))
print("\n5 ma diem THAP nhat (mo hinh danh gia kem nhat cho 3 phien toi):")
for r in U.tail(5).iloc[::-1].itertuples(): print("   " + cot(r))
print("\nLuu y: day la ket qua thong ke tu mo hinh, khong phai khuyen nghi mua ban. Loi the lich su mong (+0,4% moi lenh sau phi), mat het neu phi + truot gia len 0,8% / vong.")
