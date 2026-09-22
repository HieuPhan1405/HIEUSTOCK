// Test tay cho engine/loi/matThan.js - dung 1 mang 20 nen dung san: dinh pivot tren may o i=8,
// hoi vao may lan dau o j=16 (gan cuoi du lieu, BarCount-1=19 nen 19-16=3<=5 hop le).
import { tinhMatThan } from "../loi/matThan.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

function mangCoBan() {
  const n = 20;
  const high = new Array(n).fill(10);
  const low = new Array(n).fill(8);
  const close = new Array(n).fill(9);
  const cloudTop = new Array(n).fill(5);
  const cloudBot = new Array(n).fill(2);
  const tenkan = new Array(n).fill(9);
  high[8] = 100; // dinh pivot, tren may (cloudTop[8]=50)
  cloudTop[8] = 50;
  cloudBot[8] = 40;
  high[16] = 48; // hoi vao vung may [40,50] lan dau tai j=16
  low[16] = 45;
  return { high, low, close, cloudTop, cloudBot, tenkan };
}

// Ca 1: gia KHONG bao gio bat len qua Tenkan trong 5 nen sau khi hoi vao may -> canh bao 16..19.
{
  const d = mangCoBan();
  for (let k = 16; k <= 19; k++) {
    d.close[k] = 44;
    d.tenkan[k] = 50; // close luon <= tenkan -> khong bat len
  }
  const canhBao = tinhMatThan(d);
  ok("khong canh bao truoc luc hoi vao may", canhBao.slice(0, 16).every((v) => v === false));
  ok("canh bao dung 4 nen tu luc hoi vao may (16..19)", [16, 17, 18, 19].every((k) => canhBao[k] === true));
}

// Ca 2: gia CO bat len qua Tenkan 1 lan trong cua so -> KHONG canh bao nen nao ca.
{
  const d = mangCoBan();
  for (let k = 16; k <= 19; k++) {
    d.close[k] = 44;
    d.tenkan[k] = 50;
  }
  d.close[17] = 60; // 1 nen bat len qua Tenkan(50)
  const canhBao = tinhMatThan(d);
  ok("da bat len qua Tenkan 1 lan -> khong canh bao nen nao", canhBao.every((v) => v === false));
}

// Ca 3: hoi vao may xay ra QUA SOM (khong gan cuoi du lieu) -> khong canh bao du sau do khong bat len.
{
  const d = mangCoBan();
  d.high[16] = 10; // xoa lan hoi vao o j=16
  d.low[16] = 8;
  d.high[10] = 48; // hoi vao may som hon, o j=10 (BarCount-1-10=9 > 5 -> khong hop le)
  d.low[10] = 45;
  const canhBao = tinhMatThan(d);
  ok("hoi vao may qua som (khong gan cuoi du lieu) -> khong canh bao", canhBao.every((v) => v === false));
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
