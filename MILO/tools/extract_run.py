#!/usr/bin/env python3
"""Extract the MILO search run behind the paper's Table 2(b) into a compact JSON for the page's demo animation.

Source: the Terminal-Bench 2.1 / gpt-oss-120b run
  harness-evolution/evolution/tb2/workdirs/workdir_3island_gptoss120b_128K_initWorst3_hr70
Every node's lineage comes from the directory nesting under islands/ (node.json carries hid, origin,
parent/co-parent hids, round, admitted); pass-rate is the mean of eval.json["passes"]; the mutator
that produced a node is read from rounds/round_<t>__i<island>__<parent>/round.json; orchestrator
decisions come from orchestration/round_<t>/decision.json.

Nodes are keyed by path (not hid): the run contains one duplicated short hash (0ed13ff9fad0), an
admitted R21 graft (pass 0.5507) and an unrelated rejected R26 mutation (pass 0.5173).

Usage:  python3 MILO/tools/extract_run.py [workdir]  ->  MILO/static/demo-run.js (window.MILO_RUN = {...})
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "static", "demo-run.js"))
DEFAULT_WORKDIR = os.path.normpath(os.path.join(
    HERE, "..", "..", "..", "harness-evolution", "evolution", "tb2", "workdirs",
    "workdir_3island_gptoss120b_128K_initWorst3_hr70"))

MUTATOR_CODE = {"claude_code": "cc", "codex": "cx", "deepagents:gpt-5.5": "d:g", "deepagents:qwen": "d:q"}
MUTATOR_NAME = {"cc": "Claude Code (Opus 4.8)", "cx": "Codex (GPT-5.5)",
                "d:g": "DeepAgents (GPT-5.5)", "d:q": "DeepAgents (Qwen3-Coder-480B)"}


# One condensed note per orchestrator invocation, written from decision.json["diagnosis"] in the page's island
# numbering (Island 1 = island_0, Island 2 = island_1, Island 3 = island_2); shown on the page in place of the raw
# diagnosis, which is full of node hashes and internal middleware names. The raw text stays in the JSON.
SUMMARY = {
    3: "Island 1 is stuck at its seed with all three children rejected; its mutator keeps re-proposing a persist-and-verify idea that Island 3, grown from the weakest seed, has already made work and now leads at 50.7%.",
    6: "Island 3's plan-and-persist middleware is the biggest needle-mover in the population, and Islands 1 and 2 plateau near 45.5% without it. Island 1's mutator has run dry: four rejects and one marginal admit, all retrying the same theme.",
    9: "Whole-population plateau: all three islands stalled near a shared ceiling. The one decisive lever lives only in Island 3's lineage, and the earlier grafts of it failed from prompt bloat, not because the mechanism was wrong.",
    12: "Now a dry-mutator problem: both mutators used so far have gone dry. Island 1's is looping on prompt trims and Island 2's has never beaten its round-1 child. Grafting the leader's mechanism into the laggards failed four times, so try the reverse direction.",
    15: "Island 3 leads at 50.7% but its mutator sits in a local optimum: seven consecutive rejected tweaks of the same harness. Islands 1 and 2 still lack plan-and-persist, and Island 1's clean lineage is the least-cluttered recipient for a graft.",
    18: "Island 2's mutator over-stacks middleware and crashes the harness (pass-rates from 0 to 33%). Island 3 has been frozen at 50.7% since round 3 and lacks the transcript-safety fix that made Island 1 the leader at 52.0%.",
    21: "Island 1 is the clear leader and still climbing (52.0, 53.6, 54.3%) on a stack of three middlewares. Island 2 is frozen at its round-1 best and Island 3 at its round-3 best: the winning stack does not exist there, so graft it in rather than keep mutating dead ends.",
    25: "All three islands have converged on the same core stack, and their own variation now yields only dominated tweaks. But per-task strengths are complementary: Island 3 alone solves two hard tasks the others fail, and Island 2 alone solves a third. Graft both into the leader.",
    28: "Island 3 broke ahead to 59.9% by adding a visible-test-contract middleware, the biggest recent gain at +8.2 points. Islands 1 and 2 are stalled at 56.7% and 55.6% and lack it; both mutators still produce admitted gains, so graft rather than reassign.",
}


def code(opt):
    if opt in MUTATOR_CODE:
        return MUTATOR_CODE[opt]
    for k, v in MUTATOR_CODE.items():
        if opt.startswith(k):
            return v
    return opt


def main():
    wd = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_WORKDIR
    islands_dir = os.path.join(wd, "islands")
    nodes = []
    by_path = {}
    for iid_name in sorted(os.listdir(islands_dir)):
        iid = int(iid_name.split("_")[1])
        root = os.path.join(islands_dir, iid_name)
        for dirpath, dirnames, filenames in os.walk(root):
            if "node.json" not in filenames:
                continue
            nj = json.load(open(os.path.join(dirpath, "node.json")))
            ej = json.load(open(os.path.join(dirpath, "eval.json")))
            passes = list(ej["passes"].values())
            costs = ej.get("costs", {})
            toks = [c.get("total_tokens", 0) for c in costs.values()] or [0]
            origin = nj["origin"]
            kind = "seed" if origin == "seed" else ("graft" if origin.startswith("recombine") else "mutation")
            n = {
                "id": os.path.relpath(dirpath, islands_dir),
                "hid": nj["hid"], "island": iid, "round": nj["round"], "admitted": bool(nj["admitted"]),
                "kind": kind, "parent_hid": nj.get("parent_hid"), "coparent_hid": nj.get("coparent_hid"),
                "pass": round(sum(passes) / len(passes), 4), "tokens": round(sum(toks) / len(toks) / 1000),
                "_dir": dirpath,
            }
            nodes.append(n)
            by_path[n["id"]] = n
    # parents by directory nesting
    for n in nodes:
        parent_dir = os.path.dirname(n["id"])
        n["parent"] = parent_dir if parent_dir and parent_dir in by_path else None
    # co-parents: hid lookup in other islands, preferring admitted nodes
    for n in nodes:
        n["coparent"] = None
        if n["coparent_hid"]:
            cands = [m for m in nodes if m["hid"] == n["coparent_hid"] and m["island"] != n["island"]]
            cands.sort(key=lambda m: (not m["admitted"], m["round"]))
            if cands:
                n["coparent"] = cands[0]["id"]
    # mutator per mutation node from its round record
    rounds_dir = os.path.join(wd, "rounds")
    round_opt = {}   # (round, island) -> optimizer code
    for d in os.listdir(rounds_dir):
        m = re.match(r"round_(\d+)__i(\d+)__([0-9a-f]+)$", d)
        if not m:
            continue
        rj = json.load(open(os.path.join(rounds_dir, d, "round.json")))
        round_opt[(int(m.group(1)), int(m.group(2)))] = code(rj["optimizer"])
    for n in nodes:
        n["mutator"] = round_opt.get((n["round"], n["island"])) if n["kind"] == "mutation" else None
    # island -> mutator assignment per round (carried forward)
    max_round = max(n["round"] for n in nodes)
    assignment = {}
    cur = {0: "cc", 1: "cc", 2: "cc"}
    for r in range(0, max_round + 1):
        for i in range(3):
            if (r, i) in round_opt:
                cur[i] = round_opt[(r, i)]
        assignment[r] = [cur[0], cur[1], cur[2]]
    # orchestration decisions + graft outcomes
    orch = []
    odir = os.path.join(wd, "orchestration")
    for d in sorted(os.listdir(odir), key=lambda x: int(x.split("_")[1])):
        r = int(d.split("_")[1])
        dj = json.load(open(os.path.join(odir, d, "decision.json")))
        reassign = []
        for mv in dj.get("reassign", []) or []:
            isl = int(mv["island"])
            reassign.append({"island": isl, "from": assignment[r][isl], "to": code(mv["optimizer"]), "why": mv.get("why", "")[:220]})
        grafts = []
        for mv in dj.get("recombine", []) or []:
            dest, donor = int(mv["dest_island"]), int(mv["donor_island"])
            child = next((n for n in nodes if n["kind"] == "graft" and n["island"] == dest
                          and n["round"] in (r, r + 1) and f":i{donor}:" in json.load(open(os.path.join(n["_dir"], "node.json")))["origin"]), None)
            grafts.append({"donor": donor, "dest": dest, "admitted": bool(child and child["admitted"]),
                           "child": child["id"] if child else None, "why": mv.get("why", "")[:220]})
        orch.append({"round": r, "diagnosis": dj.get("diagnosis", "")[:420], "summary": SUMMARY.get(r, ""), "loci": dj.get("loci", []),
                     "reassign": reassign, "grafts": grafts, "speciate": dj.get("speciate", []) or []})
    # per-island admitted best-so-far per round, and population best
    best = {i: [] for i in range(3)}
    for i in range(3):
        cur_b = 0.0
        for r in range(0, max_round + 1):
            for n in nodes:
                if n["island"] == i and n["round"] == r and n["admitted"]:
                    cur_b = max(cur_b, n["pass"])
            best[i].append(round(cur_b, 4))
    pop = [round(max(best[i][r] for i in range(3)), 4) for r in range(max_round + 1)]
    seeds = {n["island"]: n["pass"] for n in nodes if n["kind"] == "seed"}
    out = {
        "source": os.path.basename(wd), "benchmark": "Terminal-Bench 2.1 (62-task high-regret search split)",
        "backbone": "gpt-oss-120b", "rounds": max_round, "seeds": [seeds[0], seeds[1], seeds[2]],
        "mutators": MUTATOR_NAME, "assignment": assignment,
        "nodes": [{k: v for k, v in n.items() if not k.startswith("_")} for n in sorted(nodes, key=lambda n: (n["round"], n["island"], n["id"]))],
        "orchestration": orch, "best": best, "pop_best": pop,
    }
    with open(OUT, "w") as f:
        f.write("window.MILO_RUN=" + json.dumps(out, separators=(",", ":")) + ";\n")
    print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes): {len(nodes)} nodes, {sum(n['admitted'] for n in nodes)} admitted, "
          f"{sum(n['kind']=='graft' for n in nodes)} grafts ({sum(n['kind']=='graft' and n['admitted'] for n in nodes)} admitted), {len(orch)} orchestrator rounds")
    print("seeds:", out["seeds"], " optimizer codes seen:", sorted(set(round_opt.values())))
    for i in range(3):
        changes = [(r, best[i][r]) for r in range(max_round + 1) if r == 0 or best[i][r] != best[i][r - 1]]
        print(f"island_{i} best-so-far:", changes)
    for o in orch:
        print(f"R{o['round']}: reassign={[(m['island'], m['from'], m['to']) for m in o['reassign']]} grafts={[(g['donor'], g['dest'], 'ADM' if g['admitted'] else 'rej') for g in o['grafts']]} speciate={o['speciate']}")
    print("assignment changes:", [(r, a) for r, a in assignment.items() if r == 0 or a != assignment[r - 1]])


if __name__ == "__main__":
    main()
