# HE THONG T+ - kiem tra tung tin hieu SMC nhu 1 kieu vao lenh T+ DOC LAP (mua mo cua phien sau, ban T+2,5 / T+5 / T+10, da tru phi 0,4%).
# 2 giai doan: KHAM PHA den 06/2022, KIEM CHUNG tu 07/2022. "theo ngay" = moi ngay co tin hieu tinh 1 phieu (tranh vai ngay dong lenh chi phoi).
# Chay: python engine/dich-vu/tplus_smc.py
import numpy as np, pandas as pd
D = pd.read_pickle("engine/output/tplus_dactrung.pkl")
D = D[D.muaDuoc & D.y3.notna() & D.y10.notna() & (D.ngay >= "2015-01-01")]
MOC = "2022-07-01"
def bc(ten, m):
    g = D[m]
    for nhan, x in (("kham pha ", g[g.ngay < MOC]), ("KIEM CHUNG", g[g.ngay >= MOC])):
        tn = x.groupby("ngay").y5.mean()
        print(f"   {ten:62s} {nhan} n={len(x):6d} | T+2,5 {x.y3.mean():6.2f}% ({(x.y3>0).mean()*100:.0f}%) | T+5 {x.y5.mean():6.2f}% ({(x.y5>0).mean()*100:.0f}%) | T+10 {x.y10.mean():6.2f}% | T+5 theo ngay {tn.mean():6.2f}% ({len(tn)} ngay)")
tang = D.smcXuHuong == 1
bc("MOC: tat ca (ma, ngay)", D.ngay.notna())
print("-- Cau truc --")
bc("CHoCH TANG hom nay (dang giam, dong cua vuot dinh swing)", D.smcChochTang == 0)
bc("BOS TANG hom nay (dang tang, vuot dinh swing tiep)", D.smcBosTang == 0)
bc("CHoCH GIAM hom nay (dang tang, thung day swing)", D.smcChochGiam == 0)
bc("BOS GIAM hom nay", D.smcBosGiam == 0)
bc("Cau truc dang TANG (trang thai)", tang)
bc("Cau truc dang GIAM (trang thai)", D.smcXuHuong == -1)
print("-- Order block / FVG --")
bc("Cham ORDER BLOCK tang lan dau", D.smcObCham == 1)
bc("  + cau truc dang tang", (D.smcObCham == 1) & tang)
bc("  + nen rut chan (dong cua nua tren nen)", (D.smcObCham == 1) & (D.vtNen >= 0.6))
bc("Cham FVG tang lan dau", D.smcFvgCham == 1)
bc("  + cau truc dang tang", (D.smcFvgCham == 1) & tang)
bc("  + cau truc tang + nen rut chan", (D.smcFvgCham == 1) & tang & (D.vtNen >= 0.6))
print("-- Quet thanh khoan --")
bc("QUET DAY (pha day swing roi dong cua lai tren)", D.smcQuetDay == 1)
bc("  + co >= 1 day bang nhau (cum thanh khoan)", (D.smcQuetDay == 1) & (D.smcDayBang >= 1))
bc("  + khoi ngoai mua nhieu (5 phien >= 3,6%)", (D.smcQuetDay == 1) & (D.ng5 >= 3.6))
bc("  + VN-Index giam > 3% / 5 phien", (D.smcQuetDay == 1) & (D.vn5 < -3))
bc("QUET DINH (vuot dinh swing roi dong cua lai duoi)", D.smcQuetDinh == 1)
print("-- Premium / discount --")
bc("Vung DISCOUNT (< 30% khoang swing) + cau truc tang", (D.smcVung < 0.3) & tang)
bc("Vung DISCOUNT (< 30%) + cau truc giam", (D.smcVung < 0.3) & (D.smcXuHuong == -1))
bc("Vung PREMIUM (> 70%) + cau truc tang", (D.smcVung > 0.7) & tang)
print("-- Mo hinh SMC 'day du' --")
bc("Quet day trong 5 phien qua + CHoCH tang hom nay", (D.smcChochTang == 0) & (D.groupby("ma").smcQuetDay.transform(lambda s: s.rolling(5).sum()) >= 1))
bc("CHoCH tang trong 10 phien + hom nay cham FVG / OB tang", ((D.smcFvgCham == 1) | (D.smcObCham == 1)) & (D.smcChochTang <= 10) & tang)
bc("  + vung discount (< 50%)", ((D.smcFvgCham == 1) | (D.smcObCham == 1)) & (D.smcChochTang <= 10) & tang & (D.smcVung < 0.5))
bc("Nen DICH CHUYEN tang manh (than >= 1,5 ATR)", D.smcDichChuyen >= 1.5)
bc("Nen dich chuyen GIAM manh (than <= -1,5 ATR)", D.smcDichChuyen <= -1.5)
