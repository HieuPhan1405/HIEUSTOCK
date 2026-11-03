// Test tay cho lib/canChuYLenh.js. Chay: node engine/test/canChuYLenh.test.mjs
import { nhomCanChuY, laCanChuY, laGanCatLo } from "../../lib/canChuYLenh.js";

let loi = 0;
const ok = (ten, dk) => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten);
  } else console.log("ok:", ten);
};

// gia lap tinhVungLenh: sl theo truong _sl cua dong
const tinhVung = (r) => (r._sl ? { sl: r._sl } : null);
const banBot = (r) => !!r.ban_bot;
const ds = [
  { ma: "AAA", tin: "NAM GIU", mat_than: true },
  { ma: "BBB", tin: "NAM GIU", _sl: { trangThai: "trong", xa: false } },
  { ma: "CCC", tin: "NAM GIU", _sl: { trangThai: "cham", xa: true } }, // cat lo da xa -> chi tham khao, khong tinh
  { ma: "DDD", tin: "NAM GIU", ban_bot: true },
  { ma: "EEE", tin: "MUA" },
  { ma: "FFF", tin: "NAM GIU", la_lenh_moi: true, mua_moi_hom_nay: true },
  { ma: "GGG", tin: "NAM GIU", _sl: { trangThai: "tren", xa: false } },
];
const n = nhomCanChuY(ds, { tinhVung, banBot });
const theo = Object.fromEntries(n.map((g) => [g.khoa, g.ds.map((r) => r.ma).join()]));
ok("Mat Than", theo.matThan === "AAA");
ok("vung cat lo: trong / cham, bo muc da xa", theo.catLo === "BBB");
ok("ban bot", theo.banBot === "DDD");
ok("mua trong phien gom MUA + Mua moi hom nay", theo.muaMoi === "EEE,FFF");
ok("thu tu nhom: rui ro truoc", n.map((g) => g.khoa).join() === "matThan,catLo,banBot,muaMoi");
ok("nhom rong bi bo", nhomCanChuY([{ ma: "X", tin: "NAM GIU" }], { tinhVung, banBot }).length === 0);
ok("laGanCatLo bo muc xa", !laGanCatLo(ds[2], tinhVung) && laGanCatLo(ds[1], tinhVung));
ok("laCanChuY: Mat Than / cat lo / ban bot, khong tinh mua moi", laCanChuY(ds[0], { tinhVung, banBot }) && laCanChuY(ds[3], { tinhVung, banBot }) && !laCanChuY(ds[4], { tinhVung, banBot }));

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
