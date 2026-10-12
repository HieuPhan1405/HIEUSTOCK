#!/usr/bin/env python3
"""Gióng lời Hiếu nói (plan.json → pieces[].text) với từ + mốc thời gian của whisper → tokens.json (theo timeline đã cắt).

Dùng:  python3 th_align.py <thư mục video>     (sau th_cut.py)

Mỗi đoạn nói được gióng RIÊNG (difflib trên chữ không dấu) nên sai lệch ở một đoạn không lan sang đoạn khác.
Whisper medium (sw??.json) là bản đầy đủ; nếu có bản large (lw??.json) thì chọn bản khớp lời hơn.
Từ không khớp được nội suy giữa hai từ đã khớp (hoặc rải đều trong đoạn nói).
Đoạn trong plan.json có thể thêm "force": [[chỉ số chữ, bắt đầu, kết thúc], …] (giây trên video gốc) để ép mốc khi whisper gióng lệch.
Ghi: tokens.json [{w, s, e}], script.txt (mỗi đoạn một dòng). In tỉ lệ khớp từng đoạn để soát.
"""
import difflib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from th_lib import norm  # noqa: E402


def whisper_words(p, a):
    out = []
    for s in json.loads(Path(p).read_text())["transcription"]:
        t = s["text"].strip()
        if not t or t.startswith("["):
            continue
        for part in t.split():
            n = norm(part)
            if n:
                out.append((n, a + s["offsets"]["from"] / 1000, a + s["offsets"]["to"] / 1000))
    return out


def match_piece(toks, wh):
    """→ [(s, e) | None] cho từng token kịch bản."""
    sn = [norm(t) for t in toks]
    wn = [w[0] for w in wh]
    res = [None] * len(toks)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, sn, wn, autojunk=False).get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                res[i1 + k] = (wh[j1 + k][1], wh[j1 + k][2], tag == "equal")
        elif tag == "replace" and j2 > j1:
            n = i2 - i1
            s0, e0 = wh[j1][1], wh[j2 - 1][2]     # chữ kịch bản ≠ chữ whisper: chia đều khoảng whisper cho các chữ kịch bản
            for k in range(n):
                res[i1 + k] = (s0 + (e0 - s0) * k / n, s0 + (e0 - s0) * (k + 1) / n, False)
    return res


def main():
    vd = Path(sys.argv[1])
    plan = json.loads((vd / "plan.json").read_text())
    work = Path(plan["work"])
    subs = json.loads((work / "subs.json").read_text())
    offs = json.loads((vd / "offs.json").read_text())

    def to_final(t):
        for _, off, dur, (a, b) in offs:
            if a - 1e-6 <= t <= b + 1e-6:
                return off + (t - a)
        raise ValueError(f"mốc nguồn {t:.2f}s nằm ngoài các đoạn giữ")

    tokens, lines = [], []
    for pc in plan["pieces"]:
        i = pc["sw"]
        _, a, b = subs[i]
        explicit = "range" in pc
        rlo, rhi = (pc["range"] if explicit else (a, b))   # biên thời gian (video gốc) mà chữ của đoạn này được phép nằm trong
        toks = pc["text"].split()
        lines.append(pc["text"])
        best = None
        for fn, name in ((f"sw{i:02d}.json", "medium"), (f"lw{i:02d}.json", "large")):
            p = work / fn
            if not p.exists():
                continue
            wh = whisper_words(p, a)
            if explicit:
                wh = [w for w in wh if rlo - 0.03 <= w[1] < rhi]   # đoạn vá: chỉ lấy từ whisper trong khoảng đã cắt
            res = match_piece(toks, wh)
            for k, fs, fe in pc.get("force", []):    # ép mốc (giây, video gốc) cho chữ số k khi whisper gióng lệch
                res[k] = (fs, fe, True)
            score = sum(1 for r in res if r and r[2])
            if best is None or score >= best[0]:
                best = (score, name, res)
        score, name, res = best
        # nội suy các chữ chưa khớp
        known = [k for k, r in enumerate(res) if r]
        sp = [(r[0], r[1]) if r else None for r in res]
        for k in range(len(toks)):
            if sp[k]:
                continue
            kl = max([x for x in known if x < k], default=None)
            kh = min([x for x in known if x > k], default=None)
            if kl is None and kh is None:
                n = len(toks)
                sp[k] = (rlo + (rhi - rlo) * k / n, rlo + (rhi - rlo) * (k + 1) / n)
            elif kl is None:
                t0, t1, n = rlo, res[kh][0], kh
                sp[k] = (t0 + (t1 - t0) * k / n, t0 + (t1 - t0) * (k + 1) / n)
            elif kh is None:
                t0, t1, n, j = res[kl][1], rhi, len(toks) - 1 - kl, k - kl - 1
                sp[k] = (t0 + (t1 - t0) * j / n, t0 + (t1 - t0) * (j + 1) / n)
            else:
                t0, t1, n, j = res[kl][1], res[kh][0], kh - kl - 1, k - kl - 1
                sp[k] = (t0 + (t1 - t0) * j / n, t0 + (t1 - t0) * (j + 1) / n)
        last = -1.0
        for tok, (s_, e_) in zip(toks, sp):
            s_ = max(to_final(max(rlo, min(s_, rhi))), last)
            e_ = max(to_final(max(rlo, min(e_, rhi))), s_ + 0.05)
            tokens.append({"w": tok, "s": round(s_, 3), "e": round(e_, 3)})
            last = s_
        print(f"sw{i:02d}{' (vá)' if explicit else ''} [{name}] khớp trực tiếp {score}/{len(toks)} ({100 * score // max(len(toks), 1)}%)")
    # bảo đảm tăng dần toàn cục
    last = 0.0
    for t in tokens:
        if t["s"] < last:
            t["e"] = max(t["e"], last + 0.05)
            t["s"] = last
        last = t["s"]
    (vd / "tokens.json").write_text(json.dumps(tokens, ensure_ascii=False, indent=0))
    (vd / "script.txt").write_text("\n".join(lines) + "\n")
    print(f"{len(tokens)} từ → tokens.json")


if __name__ == "__main__":
    main()
