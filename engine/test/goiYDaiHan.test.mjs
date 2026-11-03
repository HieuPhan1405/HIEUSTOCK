// Test tay: node engine/test/goiYDaiHan.test.mjs
import { goiYDaiHan } from "../../lib/goiYDaiHan.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };
const m = (ma, gia, giaHopLy, nganh = "Ngân hàng") => ({ ma, gia, giaHopLy, nganh, sma50: gia * 1.02, sma200: gia * 1.05, ggTop: gia * 0.9 });
const pp = {
  buffett: { ds: [m("AAA", 20, 30), m("BBB", 50, 40), m("CCC", 100, 60), m("DDD", 10, 25, "Thép")] },
  coTuc: { ds: [m("AAA", 20, 30), m("EEE", 30, 32)] },
  graham: { ds: [m("BBB", 50, 40)] },
  itBienDong: { ds: [] },
};
const g = goiYDaiHan(pp, { dangCam: [{ ma: "EEE", nganh: "Ngân hàng" }], taiSan: { tienMat: 100e6, no: 0, nav: 100e6 } });
dat("bo ma dang cam (EEE)", !g.mua.some((x) => x.ma === "EEE") && g.soMaHienCo === 1 && g.conCho === 7);
dat("ma dat hon 1,1 x gia hop ly (CCC r=1,67) vao danh sach cho, kem gia can", g.cho.length === 2 && g.cho.find((x) => x.ma === "CCC").giaCan === 66 && g.cho.every((x) => x.canGiam < 0));
dat("BBB r=1,25 cung vao cho, khong phai mua", g.cho.some((x) => x.ma === "BBB") && !g.mua.some((x) => x.ma === "BBB"));
const gr = goiYDaiHan({ buffett: { ds: [m("RE", 10, 30, "A"), m("OK", 20, 25, "B")] } }, { taiSan: { nav: 100e6 } });
dat("r < 0,5 (RE r=0,33) xep sau ma r binh thuong", gr.mua[0].ma === "OK" && gr.mua[1].ma === "RE" && gr.mua[1].canhBaoGia, JSON.stringify(gr.mua.map((x) => x.ma)));
dat("khac nganh voi danh muc truoc (DDD Thep truoc AAA ngan hang trung nganh EEE)", g.mua[0].ma === "DDD" && g.mua[1].ma === "AAA" && g.mua[1].trungNganh?.join() === "EEE", JSON.stringify(g.mua.map((x) => x.ma)));
dat("AAA do 2 phuong phap ghi ca hai", g.mua.find((x) => x.ma === "AAA").phuongPhap.map((p) => p.ten).join() === "Buffett,Cổ tức");
dat("tien muc tieu moi ma = 1/8 tai san (12,5%), dot 1 = 20% -> 2,5 trieu", Math.abs(g.moiMa - 12.5e6) < 1 && Math.abs(g.tienDot1 - 2.5e6) < 1, `${g.moiMa} ${g.tienDot1}`);
const d = g.mua.find((x) => x.ma === "DDD");
dat("DDD: 2,5 trieu / 10.000 d = 250 cp -> lo 100 = 200 cp; co 5 dot gia", d.kl === 200 && d.lich.dot.length === 5 && d.lich.dot[0].gia === 10, `${d.kl}`);
dat("giai ngan khong loc xu huong: dot 1 luon co gia (ggTop thap hon gia hay khong)", g.mua.every((x) => x.lich.quaXuHuong));
const g2 = goiYDaiHan(pp, { dangCam: [], taiSan: { tienMat: 1e6, no: 0, nav: 100e6 } });
dat("tien mat 1 trieu chi du chia cho cac ma: dot 1 <= 1tr / so ma", g2.tienDot1 <= 1e6 / g2.mua.filter((x) => x.trongCho).length + 1e-6);
const g3 = goiYDaiHan(pp, { dangCam: [], taiSan: { tienMat: 100e6, no: 50e6, nav: 100e6 } });
dat("dang margin: so luong 0 + ghi chu", g3.mua.every((x) => x.kl === 0) && g3.ghiChu.some((t) => /margin/.test(t)));
const g4 = goiYDaiHan(pp, { dangCam: Array.from({ length: 8 }, (_, i) => ({ ma: `X${i}` })), taiSan: { nav: 100e6, tienMat: 100e6 } });
dat("du 8 ma: conCho 0, khong ma nao trong cho + ghi chu", g4.conCho === 0 && g4.mua.every((x) => !x.trongCho && x.kl === 0) && g4.ghiChu.length >= 1);
dat("danh muc rong va chua nhap tien: khong loi, co ghi chu", goiYDaiHan(pp, {}).ghiChu.some((t) => /tiền mặt/.test(t)));
console.log(loi ? `${loi} SAI` : "Tat ca dung");
process.exit(loi ? 1 : 0);
