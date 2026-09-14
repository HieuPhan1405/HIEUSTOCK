"""
day_checklist_bat_day_len_web.py
------------------------
Doc file CSV do AmiBroker xuat (amibroker/8_Export_ChecklistBatDay.afl) va
day len website (API route Next.js tren Vercel: /api/upload-bat-day).

Khac voi day_du_lieu_len_web.py: file nay upload LICH SU su kien bat day
(moi dong la 1 lan checklist kich hoat trong qua khu), khong phai trang thai
hom nay - nen chay 1 lan sau khi Explore checklist bat day xong la du, khong
can chay hang ngay nhu file kia (tuy ban co the chay lai bat cu luc nao,
khong lam mat du lieu cu).

Cach dung:
  1. Cai thu vien:  pip install requests
  2. Sua 2 bien CAU HINH ben duoi cho dung.
  3. Chay tay:       python day_checklist_bat_day_len_web.py
"""

import sys
import requests

DUONG_DAN_CSV = r"C:\DaoGam_Data\bat_day_hom_nay.csv"
URL_API = "https://www.cloudstock.id.vn/api/upload-bat-day"
API_KEY = "CLOUD"  # phai TRUNG KHOP voi UPLOAD_API_KEY tren Vercel


def day_du_lieu():
    try:
        with open(DUONG_DAN_CSV, "r", encoding="utf-8") as f:
            noi_dung_csv = f.read()
    except FileNotFoundError:
        print(f"LOI: khong tim thay file {DUONG_DAN_CSV}")
        print("-> Kiem tra lai AmiBroker da chay Explore xuat CSV chua, va duong dan co khop khong.")
        sys.exit(1)

    if not noi_dung_csv.strip():
        print("LOI: file CSV rong, khong co gi de day len.")
        sys.exit(1)

    try:
        res = requests.post(
            URL_API,
            data=noi_dung_csv.encode("utf-8"),
            headers={
                "Content-Type": "text/csv",
                "x-api-key": API_KEY,
            },
            timeout=90,
        )
    except requests.exceptions.RequestException as loi:
        print(f"LOI ket noi toi {URL_API}: {loi}")
        sys.exit(1)

    if res.url != URL_API:
        print(f"CANH BAO: request bi redirect tu {URL_API} sang {res.url}")

    if res.status_code == 200:
        try:
            ket_qua = res.json()
        except ValueError:
            print(f"LOI: server tra ve HTTP 200 nhung noi dung khong phai JSON hop le.")
            print(f"Noi dung nhan duoc: {res.text[:500]}")
            sys.exit(1)
        print(f"OK: da day len {ket_qua.get('soDongDaLuu')} / {ket_qua.get('tongSoDongNhan')} dong lich su bat day.")
    else:
        print(f"LOI tu server (HTTP {res.status_code}): {res.text}")
        sys.exit(1)


if __name__ == "__main__":
    day_du_lieu()
