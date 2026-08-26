"""
api_nhan_du_lieu.py
--------------------
Them doan nay vao file main.py (hoac 1 router rieng) trong backend FastAPI
dang co tren Railway. Dung de NHAN file CSV tu script day_du_lieu_len_web.py
va luu vao database.

Can cai: pip install fastapi python-multipart pandas sqlalchemy asyncpg
(hoac psycopg2 neu dung sync)
"""

import io
import os
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Header, HTTPException

app = FastAPI()

# ============================================================================
# CAU HINH - SUA CHO KHOP DU AN
# ============================================================================
API_KEY = os.environ.get("UPLOAD_API_KEY", "doi-thanh-chuoi-bi-mat-cua-ban")


def kiem_tra_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="API key khong dung")


@app.post("/api/upload-signals")
async def nhan_file_csv(file: UploadFile = File(...), x_api_key: str = Header(None)):
    kiem_tra_api_key(x_api_key)

    noi_dung = await file.read()
    van_ban = noi_dung.decode("utf-8")

    # File co 2 phan: dong dau la THONG_KE, phan sau la LENH - tach ra doc rieng
    dong_thong_ke = []
    dong_lenh = []
    header_hien_tai = None

    for dong in van_ban.strip().split("\n"):
        if dong.startswith("loai,ma"):
            header_hien_tai = dong.split(",")
            continue
        if dong.startswith("THONG_KE"):
            dong_thong_ke.append(dict(zip(header_hien_tai, dong.split(","))))
        elif dong.startswith("LENH"):
            dong_lenh.append(dict(zip(header_hien_tai, dong.split(","))))

    # ------------------------------------------------------------------
    # TODO: thay doan nay bang code luu vao database that (Postgres) cua
    # ban, VD dung SQLAlchemy. Hien tai chi in ra de kiem tra hoat dong.
    # ------------------------------------------------------------------
    print(f"Nhan file: {file.filename}")
    print(f"So dong thong ke: {len(dong_thong_ke)}, so lenh: {len(dong_lenh)}")
    if dong_thong_ke:
        print("Thong ke:", dong_thong_ke[0])

    # Vi du luu vao Postgres (bo comment va sua theo model that cua ban):
    #
    # from database import get_db_session, BangHieuSuat, BangLichSuLenh
    # async with get_db_session() as session:
    #     for row in dong_thong_ke:
    #         session.merge(BangHieuSuat(**row))
    #     for row in dong_lenh:
    #         session.merge(BangLichSuLenh(**row))
    #     await session.commit()

    return {
        "status": "ok",
        "file": file.filename,
        "so_dong_thong_ke": len(dong_thong_ke),
        "so_lenh": len(dong_lenh),
    }
