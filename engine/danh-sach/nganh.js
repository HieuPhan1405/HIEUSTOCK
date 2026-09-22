// Copy Y NGUYEN tu amibroker/7_Export_LenWeb.afl dong 365-379 - GIU STATIC (khong doi sang API)
// vi day la co so tinh breadth_nganh/diem_rank: neu lech gan mot ma sang nganh khac se lam
// breadth_nganh khac AmiBroker, khong doi chieu duoc trong giai doan kiem chung song song.
// API (VNDirect industry_classification) CHI dung lam DU PHONG cho ma KHONG nam trong ca 15
// danh sach nay (xem engine/loi/nganhDuPhong.js) - khong thay the danh sach da co.
//
// THU TU trong mang NGANH ben duoi la THU TU UU TIEN khi 1 ma nam trong nhieu danh sach (vd
// BDS/KCN) - dung KHOP y het thu tu IIf long nhau trong AFL (NganhHienTai/BreadthPctNganh).
// Sua danh sach nao thi sua dong bo ca AFL.

const raw = {
  "Ngân hàng": "ACB,BID,BVB,CTG,EIB,HDB,KLB,LPB,MBB,MSB,NAB,OCB,SHB,SSB,STB,TCB,TPB,VAB,VBB,VCB,VIB,VPB,NVB,ABB,BAB",
  "Bất động sản":
    "AGG,ASM,CCL,CII,CKG,CRE,DIG,DXG,DXS,EVG,FDC,FIR,HAR,HDC,HDG,HPX,HQC,HTN,ITC,KDH,KHG,KOS,LDG,LGL,NBB,NHA,NLG,NTL,NVL,PDR,PTL,QCG,SCR,SGR,SJS,TCH,TDC,TDH,THG,TNT,VHM,VIC,VPH,VPI,VRC,VRE,BCM,D2D,GVR,KBC,LHG,NTC,PHR,SIP,SZC,SZL,TIP,TIX,VGC,IJC,CEO,L18,HLD,HUT,IDC,IDV",
  "Chứng khoán": "AGR,APG,BSI,CTS,DSC,DSE,EVF,FTS,HCM,ORS,SSI,TVB,TVS,VCI,VDS,VIX,VND,TCI,BVS,EVS,APS,SHS,MBS,TVC,PSI,BMS,SBS,WSS,AAS,TCX,VCK",
  "Bảo hiểm": "BIC,BMI,BVH,MIG,PGI,ABI,VNR,PVI,PRE,PTI",
  "Xây dựng":
    "ACC,BCE,C47,CDC,CIG,CTD,CTI,DC4,DPG,DLG,FCM,FCN,HHV,HID,HTI,L10,LCG,LGC,LM8,PHC,PTC,SC5,SRF,VCG,VSI,BMP,C32,CCC,CRC,CVT,DHA,DXV,HCD,HT1,KSB,LBM,MDG,NNC,TCR,TLD,HUB,NO1,NTP,HBC",
  "Thép - Khoáng sản": "DTL,HMC,HPG,HSG,NKG,SMC,TLH,VCA,BMC,DHM,PLP,VPG,YBM,TVN,VGS,POM,GDA,KSV,HGM",
  "Dầu khí - Điện - Nước":
    "ASP,BSR,CNG,COM,GAS,PGC,PGD,PLX,PVD,SFC,BTP,BWE,CHP,CLW,DRL,GEG,GHC,HNA,KHP,NT2,PC1,PGV,POW,PPC,REE,S4A,SBA,SHP,SJD,TBC,TDM,TDW,TMP,TTA,TV2,VPD,VSH,TDG,PIT,PVC,OIL,PVS,PLC,PVB,TV1,QTP,HND,PVG",
  "Hoá chất - Cao su": "BFC,CSV,DCM,DGC,DPM,HII,SFG,VFG,BRC,CSM,DPR,DRC,HRC,SRC,TNC,TRC,AAA,APH,TDP,TPC,NAV,NHH,VPS,NET,LAS,DRI",
  "Thực phẩm - Nông sản":
    "BBC,BHN,CLC,KDC,LSS,MCH,MSN,NAF,SAB,SBT,VCF,VNM,AAN,ABS,ANT,BAF,DBC,HAG,HSL,NSC,PAN,SSC,TSC,AAM,ABT,ACL,ANV,CMX,FMC,IDI,VHC,LAF,LIX,MCM,SMB,QNS,SLS,LTG,TAR,HNG",
  "Bán lẻ - Ô tô": "ADP,CMV,DGW,FRT,MWG,PET,PNJ,ST8,CTF,HAX,HHS,HTL,SVC,TMT,TLG,PTB,PSD",
  "Dệt may - Gỗ": "AAT,ADS,EVE,GIL,HTG,KMR,MSH,STK,SVD,TCM,TVT,ACG,BKG,GDT,GTA,SAV,TTF,DHC,HHP,MCP,SVI,VID,TNG,VGT",
  "Logistics - Vận tải":
    "CLL,DVP,GMD,HAH,HTV,ILB,NCT,PDN,QNP,SCS,SFI,SGN,STG,TCL,TCO,TMS,VSC,VTP,GSP,HVN,PJT,PVP,PVT,SKG,VJC,VNL,VNS,VOS,VTO,MHC,VIP,DXP,PHP",
  "Công nghệ - Viễn thông": "ADG,CMG,ELC,FPT,ICT,ITD,SVT,CTR,HAS,TSA,VTB,ABR,PNC,YEG,VGI,FOX,FOC",
  "Y tế - Dược": "DBD,DBT,DCL,DHG,DMC,IMP,JVC,OPC,SPM,TNH,TRA,VDP,VMD,LDP,DHT",
  "Thiết bị điện - Du lịch": "CAV,DQC,GEE,GEL,GEX,PAC,RAL,SHA,SHI,TYA,AST,DAH,DSN,NVT,OGC,TCT,VNG,VPL,RIC,ACV,SAS",
};

// Mang co thu tu (Map giu dung thu tu khai bao) - dung khi 1 ma nam trong > 1 danh sach.
export const NGANH = new Map(Object.entries(raw).map(([ten, ds]) => [ten, new Set(ds.split(","))]));

// Ten nganh dau tien (theo dung thu tu uu tien AFL) chua ma nay, hoac null neu khong thuoc nganh nao.
export function nganhCuaMa(ma) {
  for (const [ten, ds] of NGANH) if (ds.has(ma)) return ten;
  return null;
}
