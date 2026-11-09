// Test tay: node engine/test/diemChatLuong.test.mjs
import { diemChatLuong, bacChatLuong, diemChatLuongCho, cauThongKeLichSu, MOC_PHAN_VI_VI_TRI, BANG_LICH_SU } from "../../lib/diemChatLuong.js";
let loi = 0;
const dat = (ten, dk) => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten); loi++; } };
dat("khong co so lieu -> null", diemChatLuong(null) === null && diemChatLuong("") === null && diemChatLuong(undefined) === null && diemChatLuong(NaN) === null);
dat("pos <= moc dau -> 0", diemChatLuong(0) === 0 && diemChatLuong(0.0485) === 0);
dat("pos >= moc cuoi -> 100", diemChatLuong(1) === 100);
dat("pos o moc 50% -> 50 (trung vi cac lan hien tin hieu)", diemChatLuong(MOC_PHAN_VI_VI_TRI[10]) === 50);
dat("pos o moc 80% -> 80", diemChatLuong(MOC_PHAN_VI_VI_TRI[16]) === 80);
dat("chuoi so van doc duoc", diemChatLuong("0.8339") === diemChatLuong(0.8339));
let tang = true, truoc = -1; for (let p = 0; p <= 1; p += 0.01) { const d = diemChatLuong(p); if (d < truoc) tang = false; truoc = d; }
dat("diem tang don dieu theo pos", tang);
dat("diem trong 0..100", [0, 0.3, 0.6, 0.9, 1].every((p) => { const d = diemChatLuong(p); return d >= 0 && d <= 100; }));
dat("bac: 85 rat tot, 60 tot, 45 trung binh, 25 yeu, 10 rat yeu", bacChatLuong(85).khoa === "rat_tot" && bacChatLuong(60).khoa === "tot" && bacChatLuong(45).khoa === "trung_binh" && bacChatLuong(25).khoa === "yeu" && bacChatLuong(10).khoa === "rat_yeu");
dat("bac null khi khong co diem", bacChatLuong(null) === null);
dat("chi cham cho tin MUA", diemChatLuongCho({ tin: "NAM GIU", vi_tri_120: 0.9 }) === null && diemChatLuongCho({ tin: "MUA", vi_tri_120: 0.9 }) !== null && diemChatLuongCho({ tin: "MUA", vi_tri_120: null }) === null && diemChatLuongCho(null) === null);
const x = diemChatLuongCho({ tin: "MUA", vi_tri_120: 0.95 });
dat("mo ta kem canh bao, khong lo nguong vi tri", x.moTa.includes("không phải khuyến nghị") && !/0[,.]8/.test(x.moTa));
dat("bang lich su phu 0..100 khong ho", BANG_LICH_SU[0].tu === 0 && BANG_LICH_SU.at(-1).den === 100 && BANG_LICH_SU.every((b, i) => i === 0 || b.tu === BANG_LICH_SU[i - 1].den + 1));
dat("ty le lai tang theo diem", BANG_LICH_SU.every((b, i) => i === 0 || b.tyLeLai >= BANG_LICH_SU[i - 1].tyLeLai));
dat("cau thong ke co canh bao du lieu (khong rong)", cauThongKeLichSu().includes("lệnh có lãi"));
console.log(loi ? `\n${loi} SAI` : "\nTat ca dat");
process.exit(loi ? 1 : 0);
