#!/usr/bin/env python3
"""Render the MILO project page's charts and tables and splice them into index.html.

Every number on the page comes from the DATA block below, transcribed from the
paper (main.tex, Tables 1-5 and their sub-figures). The charts are inline SVG so
the page renders without JavaScript and prints cleanly; app.js only adds
tooltips, toggles and sorting on top.

Run from anywhere:

    python3 MILO/tools/build.py

Each block is written between a marker pair in index.html, e.g.

    <!--GEN:leaderboard-opus--> ... <!--/GEN:leaderboard-opus-->

so re-running replaces the previous render in place.
"""

import math
import os
import re
from html import escape as esc

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.normpath(os.path.join(HERE, "..", "index.html"))

# ----------------------------------------------------------------- palette
# Validated with the dataviz validator (all-pairs, white surface):
#   BLUE/RED/TEAL  worst CVD dE 8.8, normal 19.9, all >= 3:1 contrast.
#   ISL            worst CVD dE 10.7, normal 18.3, all >= 3:1 contrast.
#   RAMP           ordinal, monotone L, light end 2.11:1.
BLUE = "#2f6db3"   # automatically-discovered harnesses (SoTA evolutionary search)
RED = "#d9412f"    # MILO (ours)
TEAL = "#1a9e74"   # minimal harness (the model without harness engineering)
GRAY = "#8b93a0"   # expert-designed harnesses (de-emphasis)
SEED = "#3b4252"   # Best-of-3 seed
INK = "#101828"
ISL = ["#2a78d6", "#7d3c98", "#d55181"]
RAMP = ["#86b6ef", "#5598e7", "#256abf", "#104281"]
GOOD = "#1b7f3b"   # admitted graft (status: good)
STALL = "#f59e0b"  # stall band wash

CLASS_COLOR = {"minimal": TEAL, "sota": GRAY, "seed": SEED, "auto": BLUE, "ours": RED}
CLASS_NAME = {"minimal": "Minimal harness", "sota": "Expert-designed SoTA harness",
              "seed": "Best-of-3 seed", "auto": "Automatically discovered (SoTA search)",
              "ours": "MILO (ours)"}

# -------------------------------------------------------------------- data
# id, display name, qualifier, design, class
HARNESSES = [
    (0, "Minimal harness", "", "expert", "minimal"),
    (1, "Cline", "", "expert", "sota"),
    (2, "DeepAgents", "", "expert", "sota"),
    (3, "Goose", "", "expert", "sota"),
    (4, "Mini-SWE-Agent", "", "expert", "sota"),
    (5, "OpenCode", "", "expert", "sota"),
    (6, "OpenHands", "", "expert", "sota"),
    (7, "Qwen-Code", "", "expert", "sota"),
    (8, "Terminus-2", "", "expert", "sota"),
    (9, "Best-of-3", "seed", "expert", "seed"),
    (10, "GEPA", "prompt", "auto", "auto"),
    (11, "GEPA", "optimize anything", "auto", "auto"),
    (12, "A-Evolve", "skill, memory", "auto", "auto"),
    (13, "OpenEvolve", "", "auto", "auto"),
    (14, "ShinkaEvolve", "", "auto", "auto"),
    (15, "EvoX", "", "auto", "auto"),
    (16, "Meta-Harness", "", "auto", "auto"),
    (17, "MILO", "proposed", "auto", "ours"),
]
NAME = {h[0]: (h[1] + (f" ({h[2]})" if h[2] and h[4] == "auto" else "")) for h in HARNESSES}

# columns: (benchmark, metric, k)
COLS = [("Terminal-Bench 2.1", "pass@5"), ("Terminal-Bench 2.1", "PR@5"), ("Terminal-Bench 2.1", "RR@5"),
        ("PaperBench", "PR@3"), ("PaperBench", "RR@3"),
        ("DeepSWE", "pass@3"), ("DeepSWE", "PR@3"), ("DeepSWE", "RR@3")]

# Table 1(a): Opus 4.8. Each cell is value or (value, ci). None ci = pass@k (no interval).
OPUS = {
    0: [85.2, (74.9, 2.7), (68.0, 3.1), (65.7, 1.5), (15.0, 0.0), 23.9, (20.3, 3.1), (13.6, 2.7)],
    1: [87.5, (80.0, 2.1), (71.4, 3.0), (7.0, 0.3), (1.7, 1.7), 16.8, (14.0, 3.8), (5.6, 2.5)],
    2: [83.0, (76.8, 2.2), (70.9, 2.6), (75.1, 0.5), (31.7, 3.3), 77.9, (85.7, 2.9), (54.9, 4.1)],
    3: [89.8, (83.0, 1.9), (74.5, 2.7), (66.4, 1.3), (8.3, 1.7), 27.4, (24.2, 5.1), (9.1, 3.2)],
    4: [89.9, (83.2, 2.0), (73.9, 2.9), (57.2, 0.7), (3.3, 1.7), 43.4, (65.8, 2.9), (25.7, 3.4)],
    5: [87.5, (80.9, 1.8), (72.7, 2.6), (64.8, 2.3), (8.3, 4.4), 61.9, (84.8, 2.1), (40.4, 4.1)],
    6: [88.6, (79.4, 2.2), (72.5, 2.7), (66.0, 0.5), (13.3, 4.4), 76.1, (91.6, 1.3), (53.7, 4.1)],
    7: [88.6, (81.9, 2.2), (73.9, 2.9), (62.4, 0.4), (8.3, 1.7), 65.5, (86.3, 2.3), (38.6, 4.2)],
    8: [86.5, (80.0, 2.3), (68.3, 3.3), (61.4, 0.1), (3.3, 1.7), 49.6, (83.5, 2.3), (30.4, 3.6)],
    9: [87.5, (79.1, 2.0), (74.1, 2.4), (74.5, 0.8), (26.7, 6.0), 77.0, (90.6, 2.2), (59.0, 3.8)],
    10: [92.0, (82.8, 2.2), (78.6, 2.5), (79.3, 0.5), (33.3, 4.4), 73.5, (83.6, 3.3), (53.7, 4.1)],
    11: [87.5, (79.1, 2.0), (74.1, 2.4), (82.3, 0.3), (35.0, 2.9), 77.9, (89.4, 2.0), (58.7, 3.8)],
    12: [92.0, (84.4, 2.2), (78.2, 2.7), (74.5, 0.8), (26.7, 6.0), 66.4, (90.9, 3.6), (57.1, 4.0)],
    13: [88.6, (81.9, 2.0), (76.1, 2.6), (71.1, 0.6), (23.3, 1.7), 77.9, (91.8, 1.9), (53.7, 4.2)],
    14: [89.8, (84.1, 2.0), (77.7, 2.6), (71.4, 1.7), (15.0, 2.9), 78.8, (89.8, 2.1), (56.0, 4.1)],
    15: [89.8, (83.0, 2.0), (76.8, 2.5), (73.7, 0.7), (25.0, 2.9), 78.8, (90.0, 2.2), (58.7, 4.1)],
    16: [92.0, (82.9, 2.2), (78.2, 2.7), (85.6, 1.9), (45.0, 2.9), 77.0, (90.6, 2.2), (59.0, 3.8)],
    17: [93.2, (90.4, 1.3), (86.1, 2.0), (88.6, 0.5), (55.0, 5.0), 86.7, (96.4, 0.9), (69.3, 3.4)],
}
# cells the paper greys out: the search found no fitness gain over Best-of-3, so the seed is reported
OPUS_GRAY = {(11, 0), (11, 1), (11, 2), (12, 3), (12, 4), (16, 5), (16, 6), (16, 7)}

# Table 2(a): gpt-oss-120b
OSS = {
    0: [35.2, (38.6, 2.1), (18.6, 2.5), (14.4, 2.4), (0.0, 0.0), 0.0, (0.0, 0.0), (0.0, 0.0)],
    1: [36.4, (47.9, 1.8), (23.4, 2.4), (7.0, 0.6), (0.0, 0.0), 0.0, (0.0, 0.0), (0.0, 0.0)],
    2: [29.5, (36.8, 2.3), (15.5, 2.4), (13.8, 0.3), (0.0, 0.0), 0.0, (1.2, 0.8), (0.0, 0.0)],
    3: [40.9, (47.6, 2.1), (24.1, 2.6), (15.0, 0.6), (0.0, 0.0), 0.0, (0.5, 0.5), (0.0, 0.0)],
    4: [44.3, (53.6, 1.8), (29.8, 2.5), (8.4, 0.5), (0.0, 0.0), 0.0, (2.9, 1.1), (0.0, 0.0)],
    5: [34.1, (40.0, 2.1), (16.8, 2.6), (11.1, 0.8), (0.0, 0.0), 0.0, (2.0, 1.0), (0.0, 0.0)],
    6: [52.3, (48.6, 2.4), (31.2, 3.0), (17.1, 0.9), (0.0, 0.0), 0.9, (11.0, 2.3), (0.3, 0.6)],
    7: [26.1, (37.2, 1.9), (16.6, 2.2), (9.7, 0.6), (0.0, 0.0), 0.9, (3.3, 1.4), (0.3, 0.6)],
    8: [29.5, (42.4, 2.0), (17.5, 2.4), (6.2, 0.4), (0.0, 0.0), 0.9, (1.6, 0.9), (0.3, 0.6)],
    9: [39.8, (45.3, 2.5), (23.4, 2.5), (13.0, 0.7), (0.0, 0.0), 0.0, (0.8, 0.6), (0.0, 0.0)],
    10: [39.8, (44.2, 2.3), (22.7, 2.6), (14.7, 1.0), (0.0, 0.0), 0.0, (0.8, 0.6), (0.0, 0.0)],
    11: [39.8, (45.3, 2.5), (23.4, 2.5), (15.5, 0.7), (0.0, 0.0), 0.0, (0.8, 0.6), (0.0, 0.0)],
    12: [43.2, (44.0, 2.4), (25.9, 2.6), (13.0, 0.7), (0.0, 0.0), 0.0, (0.8, 0.6), (0.0, 0.0)],
    13: [39.8, (51.1, 2.2), (25.2, 2.5), (13.1, 1.1), (0.0, 0.0), 0.0, (0.9, 0.7), (0.0, 0.0)],
    14: [44.3, (53.5, 2.1), (28.9, 2.7), (12.7, 0.2), (0.0, 0.0), 0.0, (0.4, 0.5), (0.0, 0.0)],
    15: [44.3, (51.5, 2.2), (29.5, 2.5), (13.0, 0.7), (0.0, 0.0), 0.0, (0.6, 0.5), (0.0, 0.0)],
    16: [40.9, (51.0, 1.9), (26.8, 2.3), (17.8, 1.9), (0.0, 0.0), 0.0, (0.8, 0.6), (0.0, 0.0)],
    17: [60.2, (57.1, 2.0), (34.1, 3.1), (21.6, 0.6), (0.0, 0.0), 1.8, (15.6, 1.7), (0.6, 0.8)],
}
OSS_GRAY = {(10, 5), (10, 6), (10, 7), (11, 0), (11, 1), (11, 2), (11, 5), (11, 6), (11, 7),
            (12, 3), (12, 4), (12, 5), (12, 6), (12, 7), (15, 3), (15, 4), (16, 5), (16, 6), (16, 7)}

MODELS = {"opus": ("Opus 4.8", "frontier backbone", OPUS, OPUS_GRAY),
          "oss": ("gpt-oss-120b", "open-weight backbone", OSS, OSS_GRAY)}

# Table 1(d,e): mean cost per attempt vs. resolution rate, Opus 4.8. id -> (RR, tokens M, latency min)
COST_TB = {
    0: (68.0, 0.730, 16.2), 1: (71.4, 0.808, 5.66), 2: (70.9, 0.929, 14.8), 3: (74.5, 0.459, 8.87),
    4: (73.9, 0.899, 7.2), 5: (72.7, 0.892, 8.4), 6: (72.5, 0.457, 8.6), 7: (73.9, 1.9, 8.11),
    8: (68.3, 0.588, 8.2), 9: (74.1, 0.984, 14.5), 10: (78.6, 1.047, 14.8), 12: (78.2, 1.039, 14.3),
    13: (76.1, 0.955, 13.7), 14: (77.7, 1.029, 14.1), 15: (76.8, 0.953, 13.0), 16: (78.2, 0.922, 12.9),
    17: (86.1, 0.728, 18.2),
}
COST_DS = {
    0: (13.6, 0.107, 37.65), 1: (5.6, 0.901, 2.01), 2: (54.9, 22.42, 50.43), 3: (9.1, 1.588, 5.48),
    4: (25.7, 3.64, 9.24), 5: (40.4, 9.37, 17.56), 6: (53.7, 8.85, 20.14), 7: (38.6, 12.284, 17.75),
    8: (30.4, 5.09, 19.82), 9: (59.0, 21.12, 51.62), 10: (53.7, 18.65, 46.85), 12: (57.1, 15.76, 31.64),
    13: (53.7, 10.11, 25.20), 14: (56.0, 17.23, 37.73), 15: (58.7, 17.48, 36.00), 16: (57.5, 8.26, 18.82),
    17: (69.3, 21.18, 49.1),
}

# Table 1(c): search-mechanism ablation on TB2.1 with Opus 4.8
ABL = [
    ("A", "LLM mutator", 88.6, (82.5, 2.0), (76.4, 2.5)),
    ("B", "+ mutator agent", 89.8, (86.6, 1.8), (79.1, 2.4)),
    ("C", "+ lineage memory", 90.9, (86.2, 1.8), (79.3, 2.4)),
    ("D", "+ multiple islands", 92.0, (86.2, 1.8), (80.5, 2.4)),
    ("E", "+ orchestrator (MILO)", 93.2, (90.4, 1.3), (86.1, 2.0)),
]
ABL_ROWS = ["Mutator agent", "Lineage memory", "Multiple islands", "Orchestrator"]

# Table 2(c): MILO vs. SoTA evolutionary search on TB2.1 with gpt-oss-120b (step curves; value holds until next x)
SOTA = [
    ("GEPA (prompt)", "gepa",
     [(0, 45.05), (6, 45.05), (14.6, 45.63), (20.7, 45.63), (28, 45.63)],
     [(0, 10.67), (6, 10.67), (14.6, 11.75), (20.7, 11.75), (28, 11.75)],
     [(0, 8.14), (6, 8.14), (14.6, 8.27), (20.7, 8.27), (28, 8.27)]),
    ("OpenEvolve", "openevolve",
     [(0, 45.05), (0.31, 45.67), (1.56, 46.14), (1.87, 48.49), (8.09, 48.73), (9.02, 49.70), (21.78, 51.10), (28, 51.10)],
     [(0, 10.67), (0.31, 12.07), (1.56, 13.71), (1.87, 12.77), (8.09, 11.36), (9.02, 10.21), (21.78, 13.25), (28, 13.25)],
     [(0, 8.14), (0.31, 7.46), (1.56, 8.02), (1.87, 8.92), (8.09, 10.03), (9.02, 8.29), (21.78, 7.18), (28, 7.18)]),
    ("ShinkaEvolve", "shinka",
     [(0, 45.05), (1.33, 49.26), (9.33, 50.95), (10.67, 52.26), (14.67, 52.92), (28, 52.92)],
     [(0, 10.67), (1.33, 11.93), (9.33, 15.64), (10.67, 15.06), (14.67, 15.05), (28, 15.05)],
     [(0, 8.14), (1.33, 7.57), (9.33, 9.43), (10.67, 7.56), (14.67, 7.44), (28, 7.44)]),
    ("EvoX", "evox",
     [(0, 45.05), (7.47, 48.07), (17.73, 50.79), (19.6, 52.19), (28, 52.19)],
     [(0, 10.67), (7.47, 12.74), (17.73, 11.07), (19.6, 15.63), (28, 15.63)],
     [(0, 8.14), (7.47, 8.84), (17.73, 11.12), (19.6, 9.21), (28, 9.21)]),
    ("Meta-Harness", "metaharness",
     [(0, 45.05), (2.8, 45.05), (5.6, 49.96), (8.4, 49.96), (14, 50.75), (16.8, 50.75), (19.6, 50.75), (22.4, 50.75), (25.2, 51.00), (28, 51.00)],
     [(0, 10.67), (2.8, 10.67), (5.6, 13.51), (8.4, 13.51), (14, 15.49), (16.8, 15.49), (19.6, 15.49), (22.4, 15.49), (25.2, 13.12), (28, 13.12)],
     [(0, 8.14), (2.8, 8.14), (5.6, 8.04), (8.4, 8.04), (14, 8.21), (16.8, 8.21), (19.6, 8.21), (22.4, 8.21), (25.2, 9.15), (28, 9.15)]),
    ("MILO (ours)", "milo",
     [(0, 45.05), (1, 46.71), (3, 50.74), (17, 52.05), (19, 53.63), (20, 54.34), (21, 55.6), (23, 56.7), (27, 59.95), (28, 59.95)],
     [(0, 10.67), (1, 14.60), (3, 15.57), (17, 7.11), (19, 7.54), (20, 8.00), (21, 8.51), (23, 7.66), (27, 7.49), (28, 7.49)],
     [(0, 8.14), (1, 12.12), (3, 11.80), (17, 8.15), (19, 8.12), (20, 9.01), (21, 7.59), (23, 8.36), (27, 8.05), (28, 8.05)]),
]
METRICS = {  # key -> (label, axis title, ymin, ymax, ticks, unit)
    "pass": ("Pass-rate", "Pass-rate on the search split (%)", 43.5, 61.5, [44, 48, 52, 56, 60], "%"),
    "tokens": ("Tokens", "Mean tokens per attempt (K)", 6, 16.5, [8, 11, 14], "K"),
    "latency": ("Latency", "Mean latency per attempt (min)", 6, 13.5, [6, 8, 10, 12], " min"),
}

# Table 2(b): island trajectories (pass-rate, %) and orchestrator interventions, TB2.1 with gpt-oss-120b
ISLANDS = [
    ("Island 1", [(0, 45.05), (5, 45.5), (15, 47.42), (17, 52.05), (19, 53.63), (20, 54.34), (23, 56.7), (28, 56.7)]),
    ("Island 2", [(0, 43.97), (1, 45.55), (21, 55.6), (28, 55.6)]),
    ("Island 3", [(0, 39.21), (1, 46.71), (3, 50.74), (21, 55.07), (27, 59.95), (28, 59.95)]),  # R21 graft scores 0.5507 on disk (the paper figure's 0.5173 is a duplicate-hash rejected R26 node)
]
POP_BEST = [(0, 45.05), (1, 46.71), (3, 50.74), (17, 52.05), (19, 53.63), (20, 54.34), (21, 55.6), (23, 56.7), (27, 59.95), (28, 59.95)]
STALL_ROUNDS = (6, 14)
ORCH_ROUNDS = [3, 6, 9, 12, 15, 18, 21, 25, 28]
# ("graft", round, donor island, destination island, admitted?) / ("reassign", round, island, old mutator, new mutator)
EVENTS = [
    ("graft", 3, 3, 1, False),
    ("graft", 6, 3, 2, False), ("reassign", 6, 1, "cc", "cx"),
    ("graft", 9, 3, 1, False), ("graft", 9, 3, 2, False),
    ("graft", 12, 2, 3, False), ("reassign", 12, 1, "cx", "d:g"), ("reassign", 12, 2, "cc", "d:q"),
    ("graft", 15, 3, 1, True), ("reassign", 15, 3, "cc", "cx"),
    ("graft", 18, 1, 3, False), ("reassign", 18, 2, "d:q", "cc"),
    ("graft", 21, 1, 2, True), ("graft", 21, 1, 3, True),
    ("graft", 25, 3, 1, False), ("graft", 25, 2, 1, False),
    ("graft", 28, 3, 1, False), ("graft", 28, 3, 2, False),
]
MUTATORS = {"cc": "Claude Code (Opus 4.8)", "cx": "Codex (GPT-5.5)",
            "d:g": "DeepAgents (GPT-5.5)", "d:q": "DeepAgents (Qwen3-Coder-480B)"}

# Table 4: reusability on Frontier-Bench (RR@3 etc.), TB2.1-evolved harness without further search
FRONTIER = [
    ("Mini-SWE-Agent", "sota", 12.9, (44.0, 3.3), (5.2, 2.8)),
    ("Best-of-3", "seed", 21.4, (48.4, 2.7), (10.0, 3.4)),
    ("MILO (TB2.1-evolved)", "ours", 24.3, (51.4, 2.0), (13.8, 3.2)),
]

# Table 5 / Table 8: EinsteinArena records (minimisation; lower is better)
EINSTEIN = [
    ("Erdős minimum overlap", "minimize max<sub>k</sub> ∫ h(x)(1 − h(x+k)) dx",
     "0.380924", "0.3808753", "—", ("0.3808586", "CodexProLong, 2026-08-15"), "0.3808568",
     "1.8 × 10⁻⁶", "10⁻⁷"),
    ("First autocorrelation inequality", "minimize max(f⋆f) / (∫f)², f ≥ 0",
     "1.5032", "1.5028629", "—", ("1.50274365", "CodexProLong, 2026-08-14"), "1.50274360",
     "5.1 × 10⁻⁸", "10⁻⁸"),
    ("Third autocorrelation inequality", "minimize |max(f⋆f)| / (∫f)², f signed",
     "1.4557", "—", "1.4558", ("1.4508066", "Poolish, 2026-08-23"), "1.4488860",
     "1.9 × 10⁻³", "10⁻⁵"),
]

# ----------------------------------------------------------------- helpers

def fmt(v):
    return f"{v:.1f}"


def fmt1(v):
    """One decimal, halves rounded down, as the paper labels its figure points (59.95 -> 59.9)."""
    from decimal import Decimal, ROUND_HALF_DOWN
    return str(Decimal(str(v)).quantize(Decimal("0.1"), rounding=ROUND_HALF_DOWN))


def val(cell):
    return cell[0] if isinstance(cell, tuple) else cell


def ci(cell):
    return cell[1] if isinstance(cell, tuple) else None


def txt(x, y, s, cls="", anchor="start", extra=""):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    c = f' class="{cls}"' if cls else ""
    return f'<text{c} x="{x:.1f}" y="{y:.1f}"{a}{extra}>{esc(str(s))}</text>'


def line(x1, y1, x2, y2, cls="", extra=""):
    c = f' class="{cls}"' if cls else ""
    return f'<line{c} x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}"{extra}/>'


def step_path(pts, sx, sy):
    """const-plot-mark-left: each value holds until the next x."""
    d = [f"M {sx(pts[0][0]):.1f} {sy(pts[0][1]):.1f}"]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        d.append(f"H {sx(x1):.1f}")
        if y1 != y0:
            d.append(f"V {sy(y1):.1f}")
    return " ".join(d)


def star(cx, cy, r, fill, cls="mark", extra=""):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rad = r if i % 2 == 0 else r * 0.46
        pts.append(f"{cx + rad * math.cos(a):.1f},{cy + rad * math.sin(a):.1f}")
    return (f'<polygon class="{cls}" points="{" ".join(pts)}" fill="{fill}" '
            f'stroke="#fff" stroke-width="2" stroke-linejoin="round"{extra}/>')


def diamond(cx, cy, r, fill, cls="mark"):
    return (f'<polygon class="{cls}" points="{cx:.1f},{cy - r:.1f} {cx + r:.1f},{cy:.1f} '
            f'{cx:.1f},{cy + r:.1f} {cx - r:.1f},{cy:.1f}" fill="{fill}" stroke="#fff" stroke-width="2"/>')


def square(cx, cy, r, fill, cls="mark"):
    return (f'<rect class="{cls}" x="{cx - r:.1f}" y="{cy - r:.1f}" width="{2 * r:.1f}" height="{2 * r:.1f}" '
            f'rx="2" fill="{fill}" stroke="#fff" stroke-width="2"/>')


def dot(cx, cy, r, fill, cls="mark"):
    return f'<circle class="{cls}" cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fill}" stroke="#fff" stroke-width="2"/>'


def hit(x, y, w, h, name, value, color, sub=""):
    s = f' data-sub="{esc(sub)}"' if sub else ""
    return (f'<rect class="hit" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
            f'data-name="{esc(name)}" data-val="{esc(value)}" data-color="{color}"{s}/>')


def hit_circle(cx, cy, r, name, value, color, sub=""):
    s = f' data-sub="{esc(sub)}"' if sub else ""
    return (f'<circle class="hit" cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" '
            f'data-name="{esc(name)}" data-val="{esc(value)}" data-color="{color}"{s}/>')


def mark_shape(cls, x, y, r):
    c = CLASS_COLOR[cls]
    if cls == "ours":
        return star(x, y, r + 4, c)
    if cls == "minimal":
        return diamond(x, y, r + 1, c)
    if cls == "seed":
        return square(x, y, r - 0.5, c)
    return dot(x, y, r, c)


def svg(w, h, body, cls="plot", label=""):
    aria = f' role="img" aria-label="{esc(label)}"' if label else ""
    return (f'<svg class="{cls}" viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg"{aria}>'
            + body + "</svg>")


def legend(entries, shapes=None):
    items = []
    for i, (n, c) in enumerate(entries):
        shape = (shapes or [])[i] if shapes and i < len(shapes) else "rect"
        items.append(f'<span><i class="sw sw-{shape}" style="--c:{c}"></i>{esc(n)}</span>')
    return '<div class="legend">' + "".join(items) + "</div>"


# ---------------------------------------------------------- leaderboard table

def rank_marks(rows, gray):
    """Per column: best (bold) and second-best (underline), ignoring greyed cells; ties share."""
    marks = {}
    for c in range(len(COLS)):
        vals = sorted({val(rows[i][c]) for i in rows if (i, c) not in gray}, reverse=True)
        best = vals[0] if vals else None
        second = next((v for v in vals if v < best), None) if best is not None else None
        for i in rows:
            if (i, c) in gray:
                continue
            v = val(rows[i][c])
            if best and v == best:
                marks[(i, c)] = "best"
            elif second and second > 0 and v == second:
                marks[(i, c)] = "second"
    return marks


def leaderboard_table(model):
    label, sub, rows, gray = MODELS[model]
    marks = rank_marks(rows, gray)
    groups = [("Minimal harness", [0]), ("State-of-the-art harnesses (expert-designed)", range(1, 9)),
              ("Automatically discovered harnesses (SoTA evolutionary search vs. MILO)", range(9, 18))]
    out = [f'<div class="tablewrap lb" data-model="{model}">', '<table class="leaderboard">', "<thead>",
           '<tr><th class="idc" rowspan="2"><span class="vis-hidden">ID</span></th>'
           '<th class="method" rowspan="2"><button type="button" class="sortbtn" data-col="name">Harness</button></th>'
           '<th rowspan="2" class="design">Design</th>'
           '<th class="spangroup" colspan="3">Terminal-Bench 2.1</th>'
           '<th class="spangroup sep" colspan="2">PaperBench</th>'
           '<th class="spangroup sep" colspan="3">DeepSWE</th></tr>', "<tr>"]
    for c, (bench, metric) in enumerate(COLS):
        sep = " sep" if c in (3, 5) else ""
        out.append(f'<th class="num{sep}"><button type="button" class="sortbtn" data-col="{c}">{esc(metric)}'
                   '<span class="sortarrow" aria-hidden="true"></span></button></th>')
    out.append("</tr></thead><tbody>")
    for gname, ids in groups:
        out.append(f'<tr class="grouphead"><td colspan="{3 + len(COLS)}">{esc(gname)}</td></tr>')
        for i in ids:
            hid, name, qual, design, cls = HARNESSES[i]
            rcls = " ours" if cls == "ours" else ""
            q = f' <span class="qual">({esc(qual)})</span>' if qual and cls != "ours" else ""
            idm = f'<span class="idm idm-{cls}">{hid}</span>' if cls != "ours" else '<span class="idm idm-ours">★</span>'
            out.append(f'<tr class="row{rcls}" data-name="{esc(name)}">')
            out.append(f'<td class="idc">{idm}</td><td class="method">{esc(name)}{q}</td>'
                       f'<td class="design"><span class="dbadge dbadge-{design}">{design}</span></td>')
            for c in range(len(COLS)):
                cell = rows[i][c]
                v, e = val(cell), ci(cell)
                g = (i, c) in gray
                m = marks.get((i, c))
                classes = ["num"] + (["sep"] if c in (3, 5) else []) + (["gray"] if g else []) + ([m] if m else [])
                title = ' title="No fitness gain over Best-of-3 during search: the seed is reported"' if g else ""
                cival = f'<small class="ci">±{fmt(e)}</small>' if e is not None else '<small class="ci">&nbsp;</small>'
                out.append(f'<td class="{" ".join(classes)}" data-v="{v}"{title}>'
                           f'<span class="cellbar" aria-hidden="true"><i style="--w:{v}%"></i></span>'
                           f'<span class="v">{fmt(v)}</span>{cival}</td>')
            out.append("</tr>")
    out.append("</tbody></table></div>")
    return "\n".join(out)


# ------------------------------------------------------------- range strip

RANGE_METRICS = {  # metric key -> (axis title, [(benchmark, column index, column label)])
    "rr": ("Resolution rate (%)", [("Terminal-Bench 2.1", 2, "RR@5"), ("PaperBench", 4, "RR@3"), ("DeepSWE", 7, "RR@3")]),
    "pr": ("Pass rate (%)", [("Terminal-Bench 2.1", 1, "PR@5"), ("PaperBench", 3, "PR@3"), ("DeepSWE", 6, "PR@3")]),
}


def swarm_y(x, cy, placed, min_d=11.5, step=3):
    """Beeswarm placement: the smallest vertical offset at which a mark clears every placed mark."""
    for k in range(0, 60):
        for sign in ((1,) if k == 0 else (1, -1)):
            y = cy + sign * k * step
            if all(math.hypot(px - x, py - y) >= min_d for px, py in placed):
                return y
    return cy


def range_strip(model, metric="rr"):
    label, sub, rows, gray = MODELS[model]
    axis_title, benches = RANGE_METRICS[metric]
    W, H = 1000, 268
    left, right, top = 150, 40, 40
    rowh = 68
    sx = lambda v: left + (W - left - right) * v / 100
    b = []
    # grid
    for t in range(0, 101, 20):
        x = sx(t)
        b.append(line(x, top - 6, x, top + rowh * 3 - 10, "tick-line"))
        b.append(txt(x, top + rowh * 3 + 8, f"{t}", "tick-label", "middle"))
    b.append(txt(sx(50), H - 6, axis_title, "axis-title", "middle"))
    for r, (bench, c, metric) in enumerate(benches):
        cy = top + rowh * r + 20
        b.append(txt(left - 14, cy - 2, bench, "group-label", "end"))
        b.append(txt(left - 14, cy + 13, metric, "tick-label", "end"))
        pts = [(i, val(rows[i][c])) for i in rows if (i, c) not in gray]
        lo, hi = min(v for _, v in pts), max(v for _, v in pts)
        b.append(f'<line x1="{sx(lo):.1f}" y1="{cy}" x2="{sx(hi):.1f}" y2="{cy}" stroke="{RED}" stroke-opacity=".12" stroke-width="14" stroke-linecap="round"/>')
        b.append(f'<line x1="{sx(lo):.1f}" y1="{cy}" x2="{sx(hi):.1f}" y2="{cy}" stroke="{RED}" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/>')
        # beeswarm: coincident points pack around the row line instead of hiding each other.
        # MILO's star is reserved first so nothing lands on it.
        milo_x = sx(next(v for i, v in pts if HARNESSES[i][4] == "ours"))
        placed = [(milo_x, cy), (milo_x - 5, cy), (milo_x + 5, cy), (milo_x, cy - 5), (milo_x, cy + 5)]
        # six or more harnesses within ~1 point of each other collapse into one counted mark
        # (a greedy sweep along the axis); smaller groups swarm individually
        others = sorted(((i, v) for i, v in pts if HARNESSES[i][4] != "ours"), key=lambda p: (p[1], p[0]))
        groups, cur = [], []
        for p in others:
            if cur and sx(p[1]) - sx(cur[0][1]) > 8:
                groups.append(cur); cur = []
            cur.append(p)
        if cur:
            groups.append(cur)
        for g in groups:
            if len(g) >= 6:
                lo_v, hi_v = g[0][1], g[-1][1]
                x = sx(sum(v for _, v in g) / len(g))
                y = swarm_y(x, cy, placed, min_d=15)
                placed += [(x, y), (x - 6, y), (x + 6, y), (x, y - 6), (x, y + 6)]
                where = f"{fmt(lo_v)}%" if lo_v == hi_v else f"{fmt(lo_v)}–{fmt(hi_v)}%"
                b.append(f'<circle class="mark" cx="{x:.1f}" cy="{y:.1f}" r="9.5" fill="#5b6472" stroke="#fff" stroke-width="2"/>')
                b.append(txt(x, y + 3.6, str(len(g)), "id-label", "middle"))
                b.append(hit_circle(x, y, 15, f"{len(g)} harnesses at {metric} {where}", f"{metric} {where}", "#5b6472",
                                    ", ".join(NAME[i] for i, _ in g)))
                continue
            for i, v in g:
                cls = HARNESSES[i][4]
                x = sx(v)
                y = swarm_y(x, cy, placed)
                placed.append((x, y))
                b.append(mark_shape(cls, x, y, 5))
                b.append(hit_circle(x, y, 13, NAME[i], f"{metric} {fmt(v)}%", CLASS_COLOR[cls], CLASS_NAME[cls]))
        for i, v in pts:
            if HARNESSES[i][4] == "ours":
                x = sx(v)
                b.append(star(x, cy, 10, RED))
                b.append(txt(x + 14, cy + 4.5, f"{fmt(v)}", "pt-label pt-ours"))
                b.append(hit_circle(x, cy, 14, "MILO (ours)", f"{metric} {fmt(v)}%", RED, CLASS_NAME["ours"]))
        # low-end direct label (skipped next to the axis, where the "0" tick already says it)
        if sx(lo) - 12 > left + 28:
            b.append(txt(sx(lo) - 12, cy + 4.5, fmt(lo), "val-label", "end"))
    return svg(W, H, "".join(b), label=f"{axis_title[:-4]} of every harness on three benchmarks with {label}")


# ----------------------------------------------------------- cost scatter

def cost_panels():
    W, H = 1000, 520
    pw, ph = 430, 200
    x0s = [70, 560]
    y0s = [40, 300]
    b = []
    panels = [("Terminal-Bench 2.1", COST_TB, "RR@5 (%)", (55, 92), [60, 70, 80, 90]),
              ("DeepSWE", COST_DS, "RR@3 (%)", (0, 74), [0, 20, 40, 60])]
    rowspec = [("Tokens (M)", 1, {"tb": (0.30, 1.25, [0.4, 0.6, 0.8, 1.0, 1.2]), "ds": (-1, 25, [0, 5, 10, 15, 20, 25])}),
               ("Latency (min)", 2, {"tb": (2, 21, [5, 10, 15, 20]), "ds": (-2, 58, [0, 15, 30, 45])})]
    for ci_, (bench, data, xlab, (xmin, xmax), xticks) in enumerate(panels):
        key = "tb" if ci_ == 0 else "ds"
        x0 = x0s[ci_]
        sx = lambda v, xmin=xmin, xmax=xmax, x0=x0: x0 + pw * (v - xmin) / (xmax - xmin)
        b.append(txt(x0, 22, bench, "panel-title"))
        for ri, (ylab, idx, spec) in enumerate(rowspec):
            y0 = y0s[ri]
            ymin, ymax, yticks = spec[key]
            sy = lambda v, ymin=ymin, ymax=ymax, y0=y0: y0 + ph - ph * (v - ymin) / (ymax - ymin)
            # frame + grid
            for t in yticks:
                b.append(line(x0, sy(t), x0 + pw, sy(t), "tick-line"))
                b.append(txt(x0 - 8, sy(t) + 3.5, f"{t:g}", "tick-label", "end"))
            for t in xticks:
                b.append(line(sx(t), y0, sx(t), y0 + ph, "tick-line"))
                if ri == 1:
                    b.append(txt(sx(t), y0 + ph + 16, f"{t}", "tick-label", "middle"))
            b.append(line(x0, y0 + ph, x0 + pw, y0 + ph, "axis-line"))
            b.append(txt(x0 - 44, y0 + ph / 2, ylab, "axis-title", "middle", f' transform="rotate(-90 {x0 - 44:.1f} {y0 + ph / 2:.1f})"'))
            if ri == 1:
                b.append(txt(x0 + pw / 2, y0 + ph + 34, xlab, "axis-title", "middle"))
            # MILO guide lines (solid, faint): nothing to the right is higher in accuracy
            mx, my = data[17][0], data[17][idx]
            b.append(f'<line x1="{sx(mx):.1f}" y1="{y0}" x2="{sx(mx):.1f}" y2="{y0 + ph}" stroke="{RED}" stroke-opacity=".28" stroke-width="1"/>')
            b.append(f'<line x1="{x0}" y1="{sy(my):.1f}" x2="{sx(mx):.1f}" y2="{sy(my):.1f}" stroke="{RED}" stroke-opacity=".28" stroke-width="1"/>')
            # points
            for i, (rr, tok, lat) in sorted(data.items(), key=lambda kv: kv[0] == 17):
                v = tok if idx == 1 else lat
                cls = HARNESSES[i][4]
                col = CLASS_COLOR[cls]
                clipped = v > ymax
                yv = min(v, ymax)
                X, Y = sx(rr), sy(yv)
                unit = "M tokens" if idx == 1 else " min"
                if cls == "ours":
                    b.append(star(X, Y, 12, RED))
                    if X > x0 + pw * 0.82:
                        b.append(txt(X - 16, Y + 4, "MILO", "pt-label pt-ours", "end"))
                    else:
                        b.append(txt(X + 15, Y + 4, "MILO", "pt-label pt-ours"))
                else:
                    b.append(dot(X, Y, 8.5, col))
                    b.append(txt(X, Y + 3.3, str(i), "id-label", "middle"))
                    if clipped:
                        b.append(txt(X + 12, Y + 4, f"↑ {v:g}M", "val-label"))
                vs = f"{v:g}{unit} · {xlab.split()[0]} {fmt(rr)}%"
                b.append(hit_circle(X, Y, 14, NAME[i], vs, col, CLASS_NAME[cls]))
    return svg(W, H, "".join(b), label="Mean tokens and latency per attempt against resolution rate, Opus 4.8")


# ------------------------------------------------------------- ablation

def ablation():
    W, H = 760, 420
    x0, y0, pw, ph = 150, 40, 580, 210
    ymin, ymax = 0, 100
    sy = lambda v: y0 + ph - ph * (v - ymin) / (ymax - ymin)
    n = len(ABL)
    slot = pw / n
    bw = 24
    b = []
    for t in [0, 20, 40, 60, 80, 100]:
        b.append(line(x0, sy(t), x0 + pw, sy(t), "tick-line"))
        b.append(txt(x0 - 8, sy(t) + 3.5, f"{t}", "tick-label", "end"))
    b.append(line(x0, sy(0), x0 + pw, sy(0), "axis-line"))
    b.append(txt(x0 - 44, y0 + ph / 2, "RR@5 on Terminal-Bench 2.1 (%)", "axis-title", "middle",
                 f' transform="rotate(-90 {x0 - 44:.1f} {y0 + ph / 2:.1f})"'))
    prev = None
    for k, (key, name, p5, pr, rr) in enumerate(ABL):
        cx = x0 + slot * (k + 0.5)
        v, e = rr
        col = RED if key == "E" else RAMP[k]
        top = sy(v)
        b.append(f'<path class="mark" d="M {cx - bw / 2:.1f} {sy(0):.1f} L {cx - bw / 2:.1f} {top + 4:.1f} '
                 f'Q {cx - bw / 2:.1f} {top:.1f} {cx - bw / 2 + 4:.1f} {top:.1f} L {cx + bw / 2 - 4:.1f} {top:.1f} '
                 f'Q {cx + bw / 2:.1f} {top:.1f} {cx + bw / 2:.1f} {top + 4:.1f} L {cx + bw / 2:.1f} {sy(0):.1f} Z" fill="{col}"/>')
        b.append(f'<line x1="{cx:.1f}" y1="{sy(v - e):.1f}" x2="{cx:.1f}" y2="{sy(v + e):.1f}" stroke="{INK}" stroke-opacity=".45" stroke-width="1.2"/>')
        b.append(txt(cx, top - 10, fmt(v), "val-label hi", "middle"))
        if prev is not None:
            d = v - prev
            b.append(txt(cx, top - 24, f"+{d:.1f}", "gain-label", "middle"))
        prev = v
        b.append(txt(cx, y0 + ph + 20, key, "group-label", "middle"))
        b.append(hit(cx - slot / 2, y0, slot, ph, f"({key}) {name}", f"RR@5 {fmt(v)} ± {fmt(e)}%", col,
                     f"pass@5 {fmt(p5)} · PR@5 {fmt(pr[0])}"))
    # mechanism matrix
    my0 = y0 + ph + 40
    rh = 26
    for r, rname in enumerate(ABL_ROWS):
        yy = my0 + rh * r + 17
        b.append(txt(x0 - 8, yy, rname, "tick-label", "end"))
        b.append(line(x0, my0 + rh * r + rh, x0 + pw, my0 + rh * r + rh, "tick-line"))
        for k in range(n):
            cx = x0 + slot * (k + 0.5)
            on = k >= r + 1
            new = k == r + 1
            if on:
                col = RED if new else "#6d7583"
                wgt = ' font-weight="700"' if new else ""
                b.append(f'<text x="{cx:.1f}" y="{yy + 1:.1f}" text-anchor="middle" fill="{col}" font-size="13"{wgt}>✓</text>')
            else:
                b.append(f'<text x="{cx:.1f}" y="{yy:.1f}" text-anchor="middle" fill="#c3c9d2" font-size="12">–</text>')
    return svg(W, H, "".join(b), label="Search-mechanism ablation: RR@5 rises from 76.4 to 86.1 as each mechanism is added")


# ------------------------------------------------------- SoTA small multiples

def sota_multiples(metric):
    label, ytitle, ymin, ymax, yticks, unit = METRICS[metric]
    idx = {"pass": 2, "tokens": 3, "latency": 4}[metric]
    W = 1000
    cols, rows = 3, 2
    pw, ph = 252, 150
    gx, gy = 66, 60
    x0, y0 = 60, 36
    H = y0 + rows * ph + (rows - 1) * gy + 40
    sx = lambda v, px: px + pw * v / 28
    sy = lambda v, py: py + ph - ph * (v - ymin) / (ymax - ymin)
    milo = SOTA[-1][idx]
    b = []
    for k, entry in enumerate(SOTA):
        name, key, *_ = entry
        series = entry[idx]
        r, c = divmod(k, cols)
        px = x0 + c * (pw + gx)
        py = y0 + r * (ph + gy)
        ours = key == "milo"
        col = RED if ours else BLUE
        for t in yticks:
            b.append(line(px, sy(t, py), px + pw, sy(t, py), "tick-line"))
            if c == 0:
                b.append(txt(px - 8, sy(t, py) + 3.5, f"{t:g}", "tick-label", "end"))
        for t in [0, 7, 14, 21, 28]:
            b.append(line(sx(t, px), py + ph, sx(t, px), py + ph + 4, "axis-line"))
            b.append(txt(sx(t, px), py + ph + 16, f"{t}", "tick-label", "middle"))
        b.append(line(px, py + ph, px + pw, py + ph, "axis-line"))
        b.append(txt(px, py - 12, name, "panel-title" + (" pt-ours" if ours else "")))
        if not ours:
            b.append(f'<path d="{step_path(milo, lambda v: sx(v, px), lambda v: sy(v, py))}" fill="none" stroke="{RED}" stroke-opacity=".28" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>')
        b.append(f'<path class="mark" d="{step_path(series, lambda v: sx(v, px), lambda v: sy(v, py))}" fill="none" stroke="{col}" stroke-width="{2.6 if ours else 2}" stroke-linejoin="round" stroke-linecap="round"/>')
        for xx, yy in series[:-1]:
            b.append(dot(sx(xx, px), sy(yy, py), 4, col))
        # end label
        ex, ey = series[-1]
        b.append(txt(px + pw + 7, sy(ey, py) + 4, f"{fmt1(ey)}{unit}", "val-label hi" if ours else "val-label"))
        # hits per step
        for (xa, ya), (xb, _) in zip(series, series[1:]):
            b.append(hit(sx(xa, px), py, max(sx(xb, px) - sx(xa, px), 2), ph, name,
                         f"{label} {fmt1(ya)}{unit}", col, f"from round {xa:g}"))
        if r == rows - 1:
            b.append(txt(px + pw / 2, py + ph + 34, "Evolution round", "axis-title", "middle"))
    b.append(txt(14, y0 + (rows * ph + gy) / 2, ytitle, "axis-title", "middle",
                 f' transform="rotate(-90 14 {y0 + (rows * ph + gy) / 2:.1f})"'))
    return svg(W, H, "".join(b), label=f"{label} over evolution rounds for six search methods; MILO's curve is repeated faintly in each panel")


# ---------------------------------------------------------------- islands

def islands():
    W = 1000
    x0, pw = 118, 800
    y0, ph = 40, 270
    ly0, lh = y0 + ph + 70, 120
    H = ly0 + lh + 60
    ymin, ymax = 38, 62
    sx = lambda v: x0 + pw * v / 28
    sy = lambda v: y0 + ph - ph * (v - ymin) / (ymax - ymin)
    lane_y = {1: ly0 + 18, 2: ly0 + lh / 2, 3: ly0 + lh - 18}
    b = []
    # stall band + orchestrator ticks (span both panels)
    s0, s1 = STALL_ROUNDS
    b.append(f'<rect x="{sx(s0):.1f}" y="{y0}" width="{sx(s1) - sx(s0):.1f}" height="{ly0 + lh - y0:.1f}" fill="{STALL}" fill-opacity=".10"/>')
    b.append(txt((sx(s0) + sx(s1)) / 2, y0 + 14, "all islands stalled (R6–R14)", "zone-label", "middle"))
    for rnd in ORCH_ROUNDS:
        b.append(f'<line x1="{sx(rnd):.1f}" y1="{y0}" x2="{sx(rnd):.1f}" y2="{ly0 + lh:.1f}" stroke="#c9d2df" stroke-width="1"/>')
    for t in [40, 44, 48, 52, 56, 60]:
        b.append(line(x0, sy(t), x0 + pw, sy(t), "tick-line"))
        b.append(txt(x0 - 8, sy(t) + 3.5, f"{t}", "tick-label", "end"))
    for t in range(0, 29, 4):
        b.append(txt(sx(t), y0 + ph + 16, f"{t}", "tick-label", "middle"))
    b.append(line(x0, y0 + ph, x0 + pw, y0 + ph, "axis-line"))
    b.append(txt(x0 - 76, y0 + ph / 2, "Population pass-rate (%)", "axis-title", "middle",
                 f' transform="rotate(-90 {x0 - 76:.1f} {y0 + ph / 2:.1f})"'))
    b.append(txt(x0 + pw / 2, y0 + ph + 34, "Evolution round", "axis-title", "middle"))
    # population best ribbon
    b.append(f'<path d="{step_path(POP_BEST, sx, sy)}" fill="none" stroke="{INK}" stroke-opacity=".10" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>')
    for k, (name, pts) in enumerate(ISLANDS):
        col = ISL[k]
        b.append(f'<path class="mark" d="{step_path(pts, sx, sy)}" fill="none" stroke="{col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>')
        for xx, yy in pts[:-1]:
            b.append(dot(sx(xx), sy(yy), 4, col))
        seed_dy = {0: -2, 1: 9, 2: 3.5}[k]  # island 1 up, island 2 down: their seeds sit 1.1 points apart
        b.append(txt(x0 - 34, sy(pts[0][1]) + seed_dy, fmt1(pts[0][1]), "val-label", "end", f' style="fill:{col}" font-weight="700"'))
        for (xa, ya), (xb, _) in zip(pts, pts[1:]):
            b.append(hit(sx(xa), y0, max(sx(xb) - sx(xa), 2), ph, name, f"pass-rate {fmt1(ya)}%", col, f"from round {xa}"))
    # end labels with island keys (avoid collision: 56.7, 55.6, 59.9)
    b.append(star(sx(27), sy(59.95), 11, RED))
    b.append(txt(sx(27) - 15, sy(59.95) + 4, "59.9", "pt-label pt-ours", "end"))
    b.append(txt(x0 + pw + 8, sy(56.7) - 4, "Isl. 1  56.7", "val-label"))
    b.append(txt(x0 + pw + 8, sy(55.6) + 10, "Isl. 2  55.6", "val-label"))
    b.append(txt(x0 + pw + 8, sy(59.95) + 4, "Isl. 3  59.9", "val-label hi"))
    # lane
    b.append(txt(x0 - 76, ly0 + lh / 2, "Orchestrator events", "axis-title", "middle",
                 f' transform="rotate(-90 {x0 - 76:.1f} {ly0 + lh / 2:.1f})"'))
    for isl, yy in lane_y.items():
        b.append(line(x0, yy, x0 + pw, yy, "tick-line"))
        b.append(f'<circle cx="{x0 - 14:.1f}" cy="{yy:.1f}" r="6.5" fill="{ISL[isl - 1]}"/>')
        b.append(f'<text x="{x0 - 14:.1f}" y="{yy + 3.4:.1f}" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">{isl}</text>')
    b.append('<defs>'
             f'<marker id="ah-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="{GOOD}"/></marker>'
             f'<marker id="ah-no" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="{GRAY}"/></marker>'
             '</defs>')
    # spread simultaneous events horizontally
    per_round = {}
    for ev in EVENTS:
        per_round.setdefault(ev[1], []).append(ev)
    for rnd, evs in per_round.items():
        grafts = [e for e in evs if e[0] == "graft"]
        reass = [e for e in evs if e[0] == "reassign"]
        for gi, (_, _, src, dst, ok) in enumerate(grafts):
            xx = sx(rnd) - 7 - 9 * gi
            ya, yb = lane_y[src], lane_y[dst]
            col = GOOD if ok else GRAY
            dirn = -1 if yb < ya else 1
            b.append(f'<line x1="{xx:.1f}" y1="{ya + dirn * 8:.1f}" x2="{xx:.1f}" y2="{yb - dirn * 9:.1f}" stroke="{col}" stroke-width="{2 if ok else 1.6}" marker-end="url(#ah-{"ok" if ok else "no"})"/>')
            b.append(f'<circle cx="{xx:.1f}" cy="{ya:.1f}" r="4" fill="{col}" stroke="#fff" stroke-width="1.5"/>')
            b.append(hit(xx - 9, min(ya, yb) - 8, 18, abs(yb - ya) + 16, f"Round {rnd}: Graft island {src} → island {dst}",
                         "admitted" if ok else "rejected", col, "child cleared the Pareto admission test" if ok else "child rejected; kept as negative evidence"))
        for ri, (_, _, isl, old, new) in enumerate(reass):
            xx = sx(rnd) + 8
            yy = lane_y[isl]
            lab = f"{old}→{new}"
            wlab = 7 * len(lab) + 12
            b.append(f'<rect x="{xx:.1f}" y="{yy - 9:.1f}" width="{wlab:.1f}" height="18" rx="9" fill="#eef2f7" stroke="#33415c" stroke-opacity=".55" stroke-width="1"/>')
            b.append(f'<text x="{xx + wlab / 2:.1f}" y="{yy + 3.6:.1f}" text-anchor="middle" fill="#33415c" font-size="10" font-weight="700" font-family="var(--mono)">{esc(lab)}</text>')
            b.append(hit(xx, yy - 10, wlab, 20, f"Round {rnd}: Reassign mutator of island {isl}", f"{MUTATORS[old]} → {MUTATORS[new]}", "#33415c"))
    return svg(W, H, "".join(b), label="MILO's evolution trajectory on Terminal-Bench 2.1 with gpt-oss-120b: pass-rate per island and orchestrator interventions")


# ----------------------------------------------------------------- tables

def bar_td(v, e, mx, cls="", ours=False):
    c = f' class="num {cls}"' if cls else ' class="num"'
    civ = f'<small class="ci">±{fmt(e)}</small>' if e is not None else '<small class="ci">&nbsp;</small>'
    return f'<td{c} data-v="{v}"><span class="cellbar" aria-hidden="true"><i style="--w:{100 * v / mx:.1f}%"></i></span><span class="v">{fmt(v)}</span>{civ}</td>'


def frontier_table():
    mx = 100
    out = ['<div class="tablewrap small"><table class="mini">',
           '<thead><tr><th class="method">Harness</th><th class="num">pass@3</th><th class="num">PR@3</th><th class="num">RR@3</th></tr></thead><tbody>']
    cols = list(zip(*[(r[2], r[3][0], r[4][0]) for r in FRONTIER]))
    best = [max(c) for c in cols]
    for name, cls, p3, pr, rr in FRONTIER:
        rc = ' class="row ours"' if cls == "ours" else ' class="row"'
        out.append(f'<tr{rc}><td class="method">{esc(name)}</td>')
        for k, (v, e) in enumerate([(p3, None), pr, rr]):
            out.append(bar_td(v, e, mx, "best" if v == best[k] else ""))
        out.append("</tr>")
    out.append("</tbody></table></div>")
    return "\n".join(out)


def einstein_table():
    out = ['<div class="tablewrap"><table class="einstein">',
           '<thead><tr><th class="method">Open problem</th><th class="left">Objective (lower is better)</th>'
           '<th class="num">AlphaEvolve</th><th class="num">TTT-Discover</th><th class="num">EvoX</th>'
           '<th class="num">Prior best <small>(arena leader, Sep 2026)</small></th><th class="num ours">MILO (ours)</th>'
           '<th class="num">Margin</th></tr></thead><tbody>']
    for name, obj, ae, ttt, evox, (prior, who), ours, margin, minimp in EINSTEIN:
        # bold the digits where MILO departs from the prior best
        k = 0
        while k < min(len(prior), len(ours)) and prior[k] == ours[k]:
            k += 1
        ours_html = f'{esc(ours[:k])}<b>{esc(ours[k:])}</b>'
        out.append(f'<tr class="row"><td class="method">{esc(name)}</td><td class="left obj">{obj}</td>'
                   f'<td class="num mono">{esc(ae)}</td><td class="num mono">{esc(ttt)}</td><td class="num mono">{esc(evox)}</td>'
                   f'<td class="num mono">{esc(prior)}<small class="who">{esc(who)}</small></td>'
                   f'<td class="num mono ours">{ours_html}</td>'
                   f'<td class="num mono">{esc(margin)}<small class="who">min. for a new #1: {esc(minimp)}</small></td></tr>')
    out.append("</tbody></table></div>")
    return "\n".join(out)


# ------------------------------------------------------------------- splice

def block(name, inner):
    return f"<!--GEN:{name}-->\n{inner}\n<!--/GEN:{name}-->"


def main():
    src = open(INDEX, encoding="utf-8").read()
    gens = {
        "leaderboard-opus": leaderboard_table("opus"),
        "leaderboard-oss": leaderboard_table("oss"),
        "range-opus-rr": range_strip("opus", "rr"),
        "range-opus-pr": range_strip("opus", "pr"),
        "range-oss-rr": range_strip("oss", "rr"),
        "range-oss-pr": range_strip("oss", "pr"),
        "cost": cost_panels(),
        "ablation": ablation(),
        "sota-pass": sota_multiples("pass"),
        "sota-tokens": sota_multiples("tokens"),
        "sota-latency": sota_multiples("latency"),
        "islands": islands(),
        "frontier": frontier_table(),
        "einstein": einstein_table(),
        "legend-classes": legend([(CLASS_NAME["minimal"], TEAL), (CLASS_NAME["sota"], GRAY), (CLASS_NAME["seed"], SEED),
                                  (CLASS_NAME["auto"], BLUE), (CLASS_NAME["ours"], RED)],
                                 ["diamond", "dot", "square", "dot", "star"]),
        "legend-islands": legend([("Island 1 (seed 45.0)", ISL[0]), ("Island 2 (seed 44.0)", ISL[1]), ("Island 3 (seed 39.2)", ISL[2]),
                                  ("Population best so far", "#c9ccd3"), ("Graft admitted", GOOD), ("Graft rejected", GRAY)],
                                 ["line", "line", "line", "line", "arrow", "arrow"]),
        "legend-sota": legend([("Baseline search method", BLUE), ("MILO (ours)", RED), ("MILO, repeated for reference", "#f0b5ad")],
                              ["line", "line", "line"]),
    }
    missing = []
    for name, inner in gens.items():
        pat = re.compile(rf"<!--GEN:{re.escape(name)}-->.*?<!--/GEN:{re.escape(name)}-->", re.S)
        if not pat.search(src):
            missing.append(name)
            continue
        src = pat.sub(lambda m: block(name, inner), src, count=1)
    open(INDEX, "w", encoding="utf-8").write(src)
    print(f"wrote {INDEX}")
    if missing:
        print("markers not found:", ", ".join(missing))


if __name__ == "__main__":
    main()
