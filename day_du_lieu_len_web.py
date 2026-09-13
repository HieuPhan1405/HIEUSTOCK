"""
day_du_lieu_len_web.py
------------------------
Doc file CSV do AmiBroker xuat (amibroker/7_Export_LenWeb.afl) va day len
website (API route Next.js tren Vercel: /api/upload-signals).

Cach dung:
  1. Cai thu vien:  pip install requests
  2. Sua 2 bien CAU HINH ben duoi cho dung.
  3. Chay tay:       python day_du_lieu_len_web.py
     Hoac tu dong hoa bang Windows Task Scheduler: dat lich chay file nay
     NGAY SAU khi AmiBroker chay xong Explore xuat CSV (vi du 15:10 hang
     ngay, neu AmiBroker xuat luc 15:05).

CAU HINH - SUA CHO KHOP DU AN:
"""

import sys
import requests

DUONG_DAN_CSV = r"C:\DaoGam_Data\tin_hieu_hom_nay.csv"
# LUU Y: phai la "www.cloudstock.id.vn" (co www) - domain khong "www" se tra ve
# HTTP 308 redirect sang ban co www, va mot so moi truong (proxy/antivirus/thu
# vien cu) khong theo redirect nay dung cach cho request POST, khien du lieu
# KHONG BAO GIO thuc su toi duoc server dù script khong bao loi ro rang.
URL_API = "https://www.cloudstock.id.vn/api/upload-signals"
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
            timeout=90,  # quet toan bo thi truong co the mat vai chuc giay
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
        print(f"OK: da day len {ket_qua.get('soDongDaLuu')} / {ket_qua.get('tongSoDongNhan')} dong.")
    else:
        print(f"LOI tu server (HTTP {res.status_code}): {res.text}")
        sys.exit(1)


if __name__ == "__main__":
    day_du_lieu()
