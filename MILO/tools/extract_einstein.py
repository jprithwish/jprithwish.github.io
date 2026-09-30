#!/usr/bin/env python3
"""Extract MILO's EinsteinArena runs (third autocorrelation inequality, Erdős minimum overlap) for the page's
discovery animation: every candidate evaluation and every sub-record construction with its wall-clock time
(file mtimes on disk), plus the starting and record constructions themselves (decimated for the browser).

Source runs (harness-evolution/evolution/einstein-arena-plan/einstein/workdirs):
  workdir_c3_opus_real, workdir_erdos_opus_real
Usage: python3 MILO/tools/extract_einstein.py  ->  MILO/static/einstein-run.js (window.MILO_EINSTEIN = {...})
"""
import glob
import json
import os
import re
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "static", "einstein-run.js"))
EP = os.path.normpath(os.path.join(HERE, "..", "..", "..", "harness-evolution", "evolution", "einstein-arena-plan", "einstein"))

PROBLEMS = {
    "c3": {
        "workdir": "workdir_c3_opus_real",
        "title": "Third autocorrelation inequality",
        "objective": "minimize |max(f⋆f)| / (∫f)², f signed on [−1/4, 1/4]",
        "prior": 1.4508066395052834, "prior_who": "Poolish, arena #1 since 2026-08-23",
        "ours": 1.4488860142647635, "ours_when": "2026-09-15",
        "record_file": "discoveries/c3-r3-mirror_segments-s0_1.4488860142647635_a16a288b93ae.json",
        "start_file": "problems/c3/constructions/frozen/arena_rank_3_solution_2492.json",
        "start_who": "arena rank 3 (BasinHopper, 1.4515829)",
        "domain": [-0.25, 0.25], "kind": "signed", "dedup_pairs": True, "target_points": 3200,
        "others": {"AlphaEvolve": 1.4557, "EvoX": 1.4558},
    },
    "erdos": {
        "workdir": "workdir_erdos_opus_real",
        "title": "Erdős minimum overlap",
        "objective": "minimize maxₖ ∫ h(x)(1 − h(x+k)) dx, 0 ≤ h ≤ 1 on [0, 2]",
        "prior": 0.3808585748578584, "prior_who": "CodexProLong, arena #1 since 2026-08-15",
        "ours": 0.3808567743668193, "ours_when": "2026-08-31",
        "record_file": "discoveries/erdos-r5-mirror_segments-s1_0.38085677436681931_9878957f2146.json",
        "start_file": "problems/erdos/constructions/frozen/arena_rank_5_solution_2396.json",
        "start_who": "arena rank 5 (CHRONOS, 0.3808622)",
        "domain": [0, 2], "kind": "step", "dedup_pairs": False, "target_points": 512,
        "others": {"AlphaEvolve": 0.380924, "TTT-Discover": 0.3808753},
    },
}


def iso(ts):
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%dT%H:%MZ")


def decimate(vals, target, dedup_pairs):
    if dedup_pairs and all(vals[2 * k] == vals[2 * k + 1] for k in range(len(vals) // 2)):
        vals = vals[0::2]
    n = len(vals)
    if n <= target:
        return [round(v, 6) for v in vals]
    step = n / target
    out = []
    for i in range(target):
        a, b = int(i * step), max(int((i + 1) * step), int(i * step) + 1)
        out.append(round(sum(vals[a:b]) / (b - a), 6))
    return out


def main():
    result = {"problems": {}}
    for key, P in PROBLEMS.items():
        wd = os.path.join(EP, "workdirs", P["workdir"])
        # every candidate evaluation: best end_score across the 30 tasks, with the evaluation's finishing time
        nodes = []
        for rp in glob.glob(os.path.join(wd, "islands", "**", "report.json"), recursive=True):
            rj = json.load(open(rp))
            scores = [t["end_score"] for t in rj.get("tasks", []) if t.get("end_score") is not None and t.get("status", "ok") == "ok"]
            if not scores:
                continue
            nj = os.path.join(os.path.dirname(rp), "node.json")
            meta = json.load(open(nj)) if os.path.exists(nj) else {}
            nodes.append({"t": os.path.getmtime(rp), "score": min(scores), "round": meta.get("round"), "admitted": meta.get("admitted"),
                          "island": int(re.search(r"island_(\d+)", rp).group(1))})
        nodes.sort(key=lambda n: n["t"])
        # every sub-threshold construction the discovery hook saved (score in the filename)
        disc = []
        for f in glob.glob(os.path.join(wd, "discoveries", "*.json")):
            m = re.match(r"(.+)_([0-9.]+)_([0-9a-f]+)\.json$", os.path.basename(f))
            if not m:
                continue
            disc.append({"t": os.path.getmtime(f), "score": float(m.group(2)), "task": m.group(1)})
        disc.sort(key=lambda d: d["t"])
        t0 = min([n["t"] for n in nodes] + [os.path.getmtime(p) for p in glob.glob(os.path.join(wd, "rounds", "round_1__*", "round.json"))])
        t_end = max([n["t"] for n in nodes] + [d["t"] for d in disc])
        rec = json.load(open(os.path.join(wd, P["record_file"])))["values"]
        start = json.load(open(os.path.join(EP, P["start_file"])))["values"]
        # running minimum over both series, as (day, score) steps
        events = sorted([(n["t"], n["score"], "eval") for n in nodes] + [(d["t"], d["score"], "disc") for d in disc])
        best, run = None, []
        for t, sc, k in events:
            if best is None or sc < best:
                best = sc
                run.append([round((t - t0) / 86400, 4), sc, iso(t)])
        first_below = next((r for r in run if r[1] < P["prior"]), None)
        result["problems"][key] = {
            "title": P["title"], "objective": P["objective"], "prior": P["prior"], "prior_who": P["prior_who"],
            "ours": P["ours"], "ours_when": P["ours_when"], "others": P["others"],
            "t0": iso(t0), "days": round((t_end - t0) / 86400, 3), "n_evals": len(nodes), "n_discoveries": len(disc),
            "evals": [[round((n["t"] - t0) / 86400, 4), n["score"], n["island"], n["round"], n["admitted"]] for n in nodes],
            "discoveries": [[round((d["t"] - t0) / 86400, 4), d["score"]] for d in disc],
            "running_min": run, "first_below_prior": first_below,
            "domain": P["domain"], "kind": P["kind"], "start_who": P["start_who"],
            "start": decimate(start, P["target_points"], P["dedup_pairs"]), "record": decimate(rec, P["target_points"], P["dedup_pairs"]),
            "record_n": len(rec), "start_n": len(start),
        }
        pr = result["problems"][key]
        print(f"{key}: t0={pr['t0']} span={pr['days']}d evals={pr['n_evals']} discoveries={pr['n_discoveries']} "
              f"running-min steps={len(run)} first-below-prior={first_below} last={run[-1]} record_n={len(rec)}->{len(pr['record'])} start_n={len(start)}->{len(pr['start'])}")
        print("  eval score range:", min(n['score'] for n in nodes), max(n['score'] for n in nodes), " construction ranges: start", min(start), max(start), " record", min(rec), max(rec))
    with open(OUT, "w") as f:
        f.write("window.MILO_EINSTEIN=" + json.dumps(result, separators=(",", ":")) + ";\n")
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
