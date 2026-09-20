"""
day_tat_ca_len_web.py
------------------------
MOT FILE DUY NHAT day CA HAI file CSV cua AmiBroker len website:
  1. Tin hieu toan thi truong  (AFL 7)  -> /api/upload-signals
  2. Checklist bat day         (AFL 8)  -> /api/upload-bat-day

Cach dung:
  - Cai thu vien 1 lan:  pip install requests
  - Bam dup file nay (hoac chay:  python day_tat_ca_len_web.py)
  - File nao chua co / chua Explore thi tu bo qua, khong lam hong file con lai.

Thay cho 2 file cu day_du_lieu_len_web.py va day_checklist_bat_day_len_web.py
(2 file cu van dung duoc neu ban thich chay rieng tung cai).
"""

import os
import sys
import time
import requests

API_KEY = "CLOUD"  # phai TRUNG KHOP voi UPLOAD_API_KEY tren Vercel
# LUU Y: phai la "www.cloudstock.id.vn" (co www) - ban khong "www" bi redirect
# 308 va mot so moi truong khong theo redirect dung cach cho request POST.
GOC_WEB = os.environ.get("CS_GOC_WEB", "https://www.cloudstock.id.vn")

# (ten hien thi, duong dan CSV do AmiBroker xuat, duong dan API, nhan dong, khong bat buoc)
# Viec KHONG BAT BUOC: thieu file thi bo qua, khong tinh la loi.
CAC_VIEC = [
    ("Tin hieu toan thi truong", r"C:\DaoGam_Data\tin_hieu_hom_nay.csv", "/api/upload-signals", "dong tin hieu", False),
    ("Checklist bat day", r"C:\DaoGam_Data\bat_day_hom_nay.csv", "/api/upload-bat-day", "dong lich su bat day", False),
]

# File CSV cu hon so gio nay thi canh bao (co the chua Explore lai).
CANH_BAO_CU_SAU_GIO = 20


def day_mot_file(ten, duong_dan, api, nhan, khong_bat_buoc=False):
    """True = day thanh cong, False = loi/thieu file, None = bo qua (viec khong bat buoc, chua co file).
    Khong bao gio tu thoat."""
    print(f"\n=== {ten} ===")
    if not os.path.exists(duong_dan):
        if khong_bat_buoc:
            print(f"BO QUA (khong bat buoc): chua co file {duong_dan}")
            return None
        print(f"BO QUA: chua co file {duong_dan}")
        print("  -> Chay Explore trong AmiBroker de xuat file nay truoc.")
        return False

    tuoi_gio = (time.time() - os.path.getmtime(duong_dan)) / 3600
    luc_ghi = time.strftime("%H:%M %d/%m/%Y", time.localtime(os.path.getmtime(duong_dan)))
    print(f"File CSV ghi luc {luc_ghi}")
    if tuoi_gio > CANH_BAO_CU_SAU_GIO:
        print(f"CANH BAO: file da {tuoi_gio:.0f} gio truoc - co the ban chua Explore lai hom nay.")

    with open(duong_dan, "r", encoding="utf-8") as f:
        noi_dung = f.read()
    if not noi_dung.strip():
        print("LOI: file CSV rong, khong co gi de day len.")
        return False

    # Kiem tra truoc: dong nao co so cot khac header la dong BI HONG (AmiBroker Explore chay da luong
    # ghi dinh dong vao nhau) - web se bo qua cac dong nay nen cac ma do khong duoc cap nhat.
    dong = [d for d in noi_dung.splitlines() if d.strip()]
    so_dau_phay = dong[0].count(",")
    dong_loi = [d for d in dong[1:] if d.count(",") != so_dau_phay]
    if dong_loi:
        print(f"CANH BAO: {len(dong_loi)} dong bi loi dinh dang (AmiBroker Explore chay da luong ghi dinh dong vao nhau).")
        print("  -> Cac ma o dong loi KHONG duoc cap nhat lan nay. Dat so luong thread cua Analysis ve 1 roi Explore lai.")

    url = GOC_WEB + api
    try:
        res = requests.post(
            url,
            data=noi_dung.encode("utf-8"),
            headers={"Content-Type": "text/csv", "x-api-key": API_KEY},
            timeout=120,  # quet toan bo thi truong co the mat vai chuc giay
        )
    except requests.exceptions.RequestException as loi:
        print(f"LOI ket noi toi {url}: {loi}")
        return False

    if res.url != url:
        print(f"CANH BAO: request bi redirect tu {url} sang {res.url}")

    if res.status_code != 200:
        print(f"LOI tu server (HTTP {res.status_code}): {res.text[:500]}")
        return False
    try:
        kq = res.json()
    except ValueError:
        print("LOI: server tra ve HTTP 200 nhung noi dung khong phai JSON hop le.")
        print(f"Noi dung nhan duoc: {res.text[:500]}")
        return False

    print(f"OK: da day len {kq.get('soDongDaLuu')} / {kq.get('tongSoDongNhan')} {nhan}.")
    if kq.get("soDongLoiDaBoQua"):
        print(f"  (bo qua {kq['soDongLoiDaBoQua']} dong loi dinh dang)")
    if kq.get("canhBao"):
        print(f"  CANH BAO: {kq['canhBao']}")
    if kq.get("soMaMuaMoi"):
        print(f"  Ma MUA moi: {kq['soMaMuaMoi']}")
    dong = kq.get("lenhDaDong") or {}
    if dong.get("ghi"):
        print(f"  Lenh vua dong (da ghi vao trang Lenh da dong): {dong['ghi']}")
    if dong.get("loi"):
        print(f"  CANH BAO: khong ghi duoc lenh da dong: {dong['loi']}")
    return True


def main():
    ket_qua = [(ten, day_mot_file(ten, dd, api, nhan, kbb)) for ten, dd, api, nhan, kbb in CAC_VIEC]
    print("\n===== TONG KET =====")
    for ten, ok in ket_qua:
        print(f"  {'BO QUA' if ok is None else ('OK    ' if ok else 'LOI   ')} {ten}")
    # Giu cua so mo khi bam dup file .py de doc ket qua (file .bat tu dung lai bang pause).
    # Chay tu lenh (nut Run / terminal) thi them --khong-doi de thoat ngay, khong cho bam Enter.
    if not (os.environ.get("CS_KHONG_DOI") or "--khong-doi" in sys.argv):
        try:
            input("\nBam Enter de dong...")
        except (EOFError, OSError):
            pass
    sys.exit(0 if all(ok is not False for _, ok in ket_qua) else 1)


if __name__ == "__main__":
    main()
