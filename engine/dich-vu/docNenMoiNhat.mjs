// Doc nen ngay cua ~390 ma: uu tien nen_gan.json (taiNenGanDay.mjs, ~700 phien, lam moi hang ngay) neu MOI HON nen_dai.json (taiDuLieuDai.mjs, 13 nam, tai tay), nguoc lai dung nen_dai.json.
import { existsSync, readFileSync, statSync } from "node:fs";

export function docNenMoiNhat() {
  const gan = new URL("../output/nen_gan.json", import.meta.url);
  const dai = new URL("../output/nen_dai.json", import.meta.url);
  const dungGan = existsSync(gan) && (!existsSync(dai) || statSync(gan).mtimeMs >= statSync(dai).mtimeMs);
  return JSON.parse(readFileSync(dungGan ? gan : dai, "utf8"));
}
