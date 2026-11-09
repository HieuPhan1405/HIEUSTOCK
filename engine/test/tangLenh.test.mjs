import { tinhTangLenh } from "../../lib/tangLenh.js";

let loi = 0;
const ok = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { loi++; console.log("LOI:", ten, them); } };

// 160 nen tang dan; ngay "d000".."d159". Mua cuoi cung o gan dinh biên do.
const ngay = (i) => "d" + String(i).padStart(3, "0");
const dungNen = (gia) => gia.map((c, i) => ({ t: ngay(i), c, h: c * 1.01, l: c * 0.99 }));
const gia = Array.from({ length: 160 }, (_, i) => 100 + i * 0.3); // tang deu -> pos gan 1
const vniDeu = Array.from({ length: 160 }, (_, i) => ({ t: ngay(i), c: 1000 + i * 0.1 })); // tang cham hon ma
const ngoaiDuong = Array.from({ length: 160 }, (_, i) => ({ ngay: ngay(i), rongTy: 1 }));
const ngoaiAm = ngoaiDuong.map((x) => ({ ...x, rongTy: -1 }));
const T = 150;
const giaNong = Array.from({ length: 160 }, (_, i) => 100 * Math.pow(1.012, i)); // tang rat manh: RS 20 phien > 10 diem

let r = tinhTangLenh({ nen: dungNen(gia).slice(0, T + 1), vni: vniDeu, ngayTin: ngay(T), ngoai: ngoaiDuong });
ok("ngay tin hieu moi: chua biet phien sau -> cho", r && r.trangThai === "cho", JSON.stringify(r));
ok("pos cao -> co sao", r.sao === true);

r = tinhTangLenh({ nen: dungNen(giaNong), vni: vniDeu, ngayTin: ngay(T), ngoai: ngoaiDuong });
ok("phien sau tang -> xac nhan", r.trangThai === "xacNhan" && r.tang != null, JSON.stringify(r));
ok("ma tang manh hon thi truong rat nhieu (RS > 10) khong du RS; ngoai mua -> A+", r.rsOk === false && r.ngoaiOk === true && r.tang === "A+", JSON.stringify(r));

r = tinhTangLenh({ nen: dungNen(giaNong), vni: vniDeu, ngayTin: ngay(T), ngoai: ngoaiAm });
ok("khong RS, ngoai ban -> A", r.tang === "A", JSON.stringify(r));

// RS vua phai: ma tang ~ vni + 5 diem
const giaVua = Array.from({ length: 160 }, (_, i) => (i < 130 ? 100 + i * 0.3 : 139 * (1 + (i - 129) * 0.0036)));
const vniVua = Array.from({ length: 160 }, (_, i) => ({ t: ngay(i), c: i < 130 ? 1000 + i : 1129 * (1 + (i - 129) * 0.0020) }));
r = tinhTangLenh({ nen: dungNen(giaVua), vni: vniVua, ngayTin: ngay(T), ngoai: ngoaiDuong });
ok("RS 0..10 + ngoai mua -> A++ khi sao", r.sao ? (r.rsOk && r.ngoaiOk ? r.tang === "A++" : true) : r.tang === null, JSON.stringify(r));

// phien sau giam -> khong
const giamSau = gia.slice(); giamSau[T + 1] = giamSau[T] - 1;
r = tinhTangLenh({ nen: dungNen(giamSau), vni: vniDeu, ngayTin: ngay(T), ngoai: ngoaiDuong });
ok("phien sau khong cao hon -> khong xep tang", r.trangThai === "khong" && r.tang === null, JSON.stringify(r));

// gia o day bien do -> khong sao
const giaDay = Array.from({ length: 160 }, (_, i) => 200 - i * 0.3);
r = tinhTangLenh({ nen: dungNen(giaDay), vni: vniDeu, ngayTin: ngay(T), ngoai: ngoaiDuong });
ok("pos thap -> khong sao, khong tang", r.sao === false && r.tang === null, JSON.stringify(r));

// thieu so lieu -> null
ok("thieu khoi ngoai -> null", tinhTangLenh({ nen: dungNen(gia), vni: vniDeu, ngayTin: ngay(T), ngoai: null }) === null);
ok("khoi ngoai < 20 phien -> null", tinhTangLenh({ nen: dungNen(gia), vni: vniDeu, ngayTin: ngay(T), ngoai: ngoaiDuong.slice(0, 10) }) === null);
ok("nen < 120 -> null", tinhTangLenh({ nen: dungNen(gia).slice(0, 100), vni: vniDeu, ngayTin: ngay(90), ngoai: ngoaiDuong }) === null);
ok("khong co ngay tin hieu -> null", tinhTangLenh({ nen: dungNen(gia), vni: vniDeu, ngayTin: "x", ngoai: ngoaiDuong }) === null);
ok("khong dung khoi ngoai sau ngay tin hieu", (() => { const n2 = ngoaiDuong.map((x, i) => (i > T ? { ...x, rongTy: -1000 } : x)); return tinhTangLenh({ nen: dungNen(gia), vni: vniDeu, ngayTin: ngay(T), ngoai: n2 }).ngoaiOk === true; })());

console.log(loi ? `\n${loi} loi` : "\nTat ca dat");
process.exit(loi ? 1 : 0);
