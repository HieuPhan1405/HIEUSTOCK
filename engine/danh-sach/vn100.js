// Danh sach 100 ma dung cho Checklist bat day - copy Y NGUYEN tu VN100List trong
// amibroker/8_Export_ChecklistBatDay.afl (chi la danh sach tinh, khong tinh toan - rui ro thap,
// chi can copy dung). CA 100 ma nay da nam trong VN30+VN_MIDCAP+VN_SMALLCAP (lib/danh-sach/vonHoa.js -
// da doi chieu truc tiep 2026-09-24), nen checklist dung LAI du lieu nen da tai san, khong can fetch rieng.
const VN100_LIST =
  "ACB,BID,CTG,DGC,FPT,GAS,GVR,HDB,HPG,LPB," +
  "MBB,MSN,MWG,PLX,SAB,SHB,SSB,SSI,STB,TCB," +
  "TPB,VCB,VHM,VIB,VIC,VJC,VNM,VPB,VPL,VRE," +
  "ANV,BCM,BMP,BSI,BSR,BVH,BWE,CII,CMG,CTD," +
  "CTR,CTS,DBC,DCM,DGW,DIG,DPM,DSE,DXG,DXS," +
  "EIB,EVF,FRT,FTS,GEE,GEX,GMD,HAG,HCM,HDC," +
  "HDG,HHV,HSG,HT1,IMP,KBC,KDC,KDH,KOS,MSB," +
  "NAB,NKG,NLG,NT2,NVL,OCB,PAN,PC1,PDR,PHR," +
  "PNJ,POW,PVD,PVT,REE,SBT,SCS,SIP,SJS,SZC," +
  "TCH,VCG,VCI,VGC,VHC,VIX,VND,VPI,VSC,VTP";

export const VN100 = new Set(VN100_LIST.split(","));
