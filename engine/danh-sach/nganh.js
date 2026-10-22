// PHAN LOAI NGANH (rà soát lại 2026-10-12): dựa trên ICB (VNDirect industry_classification, cấp 4) + ghi đè thủ công cho các mã mà ICB không hợp thực tế thị trường VN
// (thuỷ sản tách khỏi nông nghiệp, khu công nghiệp tách khỏi BĐS nhà ở, cao su gom cùng hoá chất, dầu khí tách khỏi điện-nước...). Sinh bằng engine/dich-vu/chiaLaiNganh.mjs.
// CHỈ liệt kê mã CÓ dữ liệu giá trong engine (389 mã): mẫu số breadth là số mã thật, không bị kéo xuống bởi mã đã hết niêm yết.
// VEA (VEAM, ICB Ôtô) thêm tay vì chưa có dữ liệu giá trong nen_dai.json nhưng engine quét 390 mã có mã này.
// Mã mới chưa có trong danh sách => nhóm "Khac" (breadth = trung bình các ngành). Thêm mã mới: chạy lại chiaLaiNganh.mjs hoặc thêm tay vào nhóm phù hợp.
// LƯU Ý: nganh chỉ ảnh hưởng nhãn ngành + diem_rank (breadth ngành); KHÔNG ảnh hưởng tín hiệu MUA/BÁN. Không còn khớp danh sách ngành trong AFL (AFL giữ nguyên danh sách cũ).
// TÊN NGÀNH (khoá của map) là chuỗi KHÔNG DẤU; web đổi sang có dấu ở lib/nganh.js (NGANH_NHAN).
const raw = {
  "Ngan hang": "ABB,ACB,BAB,BID,BVB,CTG,EIB,HDB,KLB,LPB,MBB,MSB,NAB,NVB,OCB,SHB,SSB,STB,TCB,TPB,VAB,VCB,VIB,VPB",
  "Chung khoan": "AAS,AGR,APG,APS,BMS,BSI,BVS,CTS,DSC,DSE,EVF,EVS,FTS,HCM,MBS,ORS,PSI,SBS,SHS,SSI,TCI,TCX,TVB,TVC,TVS,VCI,VCK,VDS,VIX,VND,WSS",
  "Bao hiem": "ABI,BIC,BMI,BVH,MIG,PGI,PRE,PTI,PVI,VNR",
  "Bat dong san": "AGG,ASM,CCL,CEO,CII,CKG,CRE,DIG,DXG,DXS,EVG,FIR,FIT,HAR,HDC,HDG,HLD,HPX,HQC,IDV,ITC,KDH,KHG,KOS,LGL,NBB,NHA,NLG,NTL,NVL,OGC,PDR,PTL,QCG,SCR,SGR,SJS,TCH,TDC,TDH,THG,TN1,TNT,VHM,VIC,VPH,VPI,VRC,VRE",
  "BDS Khu cong nghiep": "BCM,D2D,IDC,IJC,KBC,LHG,NTC,SIP,SZC,SZL,TIP,VGC",
  "Xay dung - Ha tang": "BCE,CCC,CDC,CIG,CTD,CTI,DC4,DPG,DTA,FCN,HBC,HHV,HID,HTI,HTN,HUB,HUT,L18,LCG,NO1,PHC,PTC,SBG,TV1,TV2,UIC,VCG,VSI",
  "Vat lieu xay dung": "ACC,ADP,BMP,C32,C47,DHA,DXV,HCD,HT1,LBM,NAV,NNC,NTP,PTB,RYG,TLD",
  "Thep": "GDA,HMC,HPG,HSG,NKG,POM,SMC,TLH,TVN,VCA,VGS",
  "Khoang san": "BMC,DHM,FCM,HGM,HII,KSB,KSV,MSR,TNI,VPG",
  "Dau khi": "ASP,BSR,CNG,GAS,OIL,PGC,PIT,PLC,PLX,PVB,PVC,PVD,PVG,PVS,SFC,TDG",
  "Dien - Nuoc": "BTP,BWE,CHP,DRL,GEG,HND,KHP,NT2,PC1,POW,PPC,QTP,REE,SJD,TEG,TTA,VSH",
  "Hoa chat - Cao su": "AAA,ADS,APH,BFC,BRC,CSM,CSV,DCM,DDV,DGC,DHC,DPM,DPR,DRC,DRI,GVR,HAP,HHP,LAS,LIX,MCP,NET,NHH,PHR,PLP,TDP,TRC,VFG,VPS,YBM",
  "Thuc pham - Do uong": "KDC,LSS,MCH,MCM,MSN,NAF,PAN,QNS,SAB,SBT,SLS,SMB,VCF,VNM",
  "Thuy san": "AAM,ABT,ACL,ANV,CMX,FMC,IDI,VHC",
  "Nong nghiep - Chan nuoi": "ABS,BAF,DBC,HAG,HNG,HSL,LAF,LTG,NSC,TAR,TSC",
  "Ban le - O to": "CRC,CTF,DGW,FRT,HAX,HHS,MWG,PET,PNJ,PSD,ST8,SVC,TLG,TMT,VEA",
  "Det may - Go": "BKG,DLG,GDT,GIL,HTG,KMR,MSH,SAV,STK,SVD,TCM,TNG,TTF,TVT,VGT",
  "Logistics - Van tai": "ACV,CLL,DVP,DXP,GMD,GSP,HAH,HTV,HVN,ILB,MHC,NCT,PHP,PVP,PVT,SAS,SCS,SFI,SGN,SKG,STG,TCL,TCO,TMS,VIP,VJC,VNA,VNL,VOS,VSC,VTO,VTP",
  "Cong nghe - Vien thong": "CMG,CTR,ELC,FOX,FPT,HVH,ICT,ITD,SAM,SGT,VGI,VTB",
  "Y te - Duoc": "DBD,DCL,DHG,DHT,DMC,IMP,JVC,LDP,SPM,TNH,TRA",
  "Thiet bi dien - Co khi": "CAV,DQC,EVE,GEE,GEX,PAC,RAL,SHA,SHI",
  "Du lich - Giai tri - Truyen thong": "ADG,AST,DAH,DSN,FOC,RIC,SVT,TCT,VPL,YEG",
};

// Mang co thu tu (Map giu dung thu tu khai bao) - dung khi 1 ma nam trong > 1 danh sach.
export const NGANH = new Map(Object.entries(raw).map(([ten, ds]) => [ten, new Set(ds.split(","))]));

// NGANH TRONG TAM (Hieu 2026-10-22): dung cho DIEM MUA PHUC HOI (diem B) - chi giu ma thuoc 11 nganh lon (top 11 theo GTGD: Ngan hang, BDS (+ BDS KCN), Chung khoan, Thep, Thuc pham, Ban le - O to, CN - Vien thong, Logistics, Dau khi, Hoa chat - Cao su, Xay dung - Ha tang);
// BO 10 nganh nho (Thiet bi dien - Co khi, Nong nghiep, Dien - Nuoc, Thuy san, Det may - Go, Khoang san, Du lich - Giai tri, Vat lieu xay dung, Bao hiem, Y te - Duoc) va ma chua gan nganh: diem B nhom nho ket qua kem (tu 2022-05 lai 10 phien -0,52%, nghien cuu diemBTheoNganhLonNho.mjs).
export const NGANH_TRONG_TAM = new Set(["Ngan hang", "Bat dong san", "BDS Khu cong nghiep", "Chung khoan", "Thep", "Thuc pham - Do uong", "Ban le - O to", "Cong nghe - Vien thong", "Logistics - Van tai", "Dau khi", "Hoa chat - Cao su", "Xay dung - Ha tang"]);

// Ten nganh dau tien (theo dung thu tu uu tien AFL) chua ma nay, hoac null neu khong thuoc nganh nao.
export function nganhCuaMa(ma) {
  for (const [ten, ds] of NGANH) if (ds.has(ma)) return ten;
  return null;
}

// true neu ma thuoc nganh trong tam (xem NGANH_TRONG_TAM).
export function laNganhTrongTam(ma) {
  const n = nganhCuaMa(ma);
  return n != null && NGANH_TRONG_TAM.has(n);
}
