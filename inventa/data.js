window.INVENTA_DATA = {
"stage": [
{
"stage": "Retrieve prior work",
"bench": "ScholarCatalyst",
"metric": "Mean of 8 retrieval metrics (%)",
"base": "OpenCode + DeepSeek V3.2",
"b": 36.5,
"inv": 44.5,
"gain": "+21.9%"
},
{
"stage": "Generate ideas",
"bench": "IdeaBench",
"metric": "Distinct novel ideas / paper (rated ≥7)",
"base": "ResearchAgent",
"b": 18.6,
"inv": 26.0,
"gain": "+39.8%"
},
{
"stage": "Write proposals",
"bench": "IdeaScientist",
"metric": "Combined score (%)",
"base": "IdeaScientist-Base",
"b": 77.7,
"inv": 82.7,
"gain": "+6.4%"
},
{
"stage": "Discover laws",
"bench": "EurekaBench",
"metric": "Conditioned score (%)",
"base": "CORAL",
"b": 56.2,
"inv": 73.6,
"gain": "+31.0%"
},
{
"stage": "Discover laws",
"bench": "SciLaws-Bench",
"metric": "Held-out fit S_N (%)",
"base": "ReAct + Grok 4.7",
"b": 59.3,
"inv": 62.8,
"gain": "+5.9%"
}
],
"cost": {
"baselines": [
{
"name": "Best of agents ①–⑭",
"pts": [
[
40,
31.6
],
[
80,
37.2
],
[
120,
40.3
],
[
160,
42.2
],
[
200,
43.7
],
[
240,
44.7
],
[
280,
45.6
],
[
320,
46.4
],
[
360,
47.0
],
[
400,
47.5
],
[
440,
47.9
],
[
480,
48.3
],
[
520,
48.8
],
[
560,
49.1
],
[
600,
49.5
],
[
640,
49.8
],
[
680,
50.1
],
[
720,
50.4
],
[
760,
50.7
],
[
800,
51.0
]
]
},
{
"name": "OpenEvolve",
"pts": [
[
40,
44.0
],
[
80,
45.9
],
[
120,
47.0
],
[
160,
47.6
],
[
200,
48.3
],
[
240,
48.7
],
[
280,
49.1
],
[
320,
49.5
],
[
360,
49.8
],
[
400,
50.1
],
[
440,
50.3
],
[
480,
50.5
],
[
520,
50.8
],
[
560,
51.0
],
[
600,
51.2
],
[
640,
51.3
],
[
680,
51.5
],
[
720,
51.6
],
[
760,
51.8
],
[
800,
51.9
]
]
},
{
"name": "MILO",
"pts": [
[
40,
21.0
],
[
80,
24.2
],
[
120,
30.1
],
[
160,
32.7
],
[
200,
38.5
],
[
240,
44.4
],
[
280,
45.8
],
[
320,
50.5
],
[
360,
50.5
],
[
400,
52.7
],
[
440,
52.7
],
[
480,
52.7
],
[
520,
52.8
],
[
560,
54.1
],
[
600,
54.1
],
[
640,
54.1
],
[
680,
54.2
],
[
720,
54.2
],
[
760,
54.2
],
[
800,
54.2
]
]
},
{
"name": "Agentic Scientist",
"pts": [
[
40,
28.3
],
[
80,
40.2
],
[
120,
44.4
],
[
160,
45.2
],
[
200,
48.0
],
[
240,
50.0
],
[
280,
50.0
],
[
320,
50.0
],
[
360,
52.2
],
[
400,
52.8
],
[
440,
53.0
],
[
480,
53.1
],
[
520,
54.0
],
[
560,
54.0
],
[
600,
54.3
],
[
640,
54.6
],
[
680,
54.7
],
[
720,
54.7
],
[
760,
55.2
],
[
800,
55.6
]
]
},
{
"name": "CORAL",
"pts": [
[
40,
23.2
],
[
80,
26.1
],
[
120,
30.8
],
[
160,
35.2
],
[
200,
38.0
],
[
240,
38.0
],
[
280,
39.3
],
[
320,
42.2
],
[
360,
47.5
],
[
400,
50.0
],
[
440,
51.2
],
[
480,
51.3
],
[
520,
51.3
],
[
560,
51.7
],
[
600,
53.2
],
[
640,
53.2
],
[
680,
53.5
],
[
720,
55.4
],
[
760,
55.4
],
[
800,
55.8
]
]
}
],
"inventa": [
[
393,
64.7
],
[
786,
72.5
]
],
"notes": {
"r10": "10 rounds: 64.7% vs at most 52.8% for SoTA evolutionary methods (+11.9)",
"r20": "20 rounds: 72.5% vs 55.5% for CORAL (+17.0)"
}
},
"ideas": {
"Inventa": [
[
45,
26.0
],
[
95,
61.6
],
[
293,
130.2
]
],
"MILO": [
[
56,
13.4
],
[
250,
48.2
],
[
489,
83.4
]
],
"Best-of-N": [
[
50,
4.7
],
[
242,
8.8
]
]
},
"eureka": [
[
"OpenHands · Grok 4.7",
28.0,
"agent"
],
[
"OpenCode · Grok 4.7",
31.4,
"agent"
],
[
"Goose · Grok 4.7",
37.2,
"agent"
],
[
"Best of agents ①–⑭",
38.1,
"agent"
],
[
"OpenEvolve",
34.0,
"evo"
],
[
"EvoX",
36.2,
"evo"
],
[
"InternAgent-1.5",
36.3,
"evo"
],
[
"GEPA",
38.5,
"evo"
],
[
"MILO",
47.7,
"evo"
],
[
"Agentic Scientist",
47.8,
"evo"
],
[
"CORAL",
56.2,
"evo"
],
[
"Inventa",
73.6,
"ours"
]
],
"eurekaFull": {
"cols": [
"Constraint fails ↓",
"PA %",
"SI %",
"CS %"
],
"rows": [
[
"Best of agents ①–⑭",
"5/16",
46.9,
44.5,
38.1
],
[
"OpenEvolve",
"6/16",
59.1,
31.3,
34.0
],
[
"GEPA",
"4/16",
53.9,
38.4,
38.5
],
[
"EvoX",
"3/16",
56.0,
29.1,
36.2
],
[
"MILO",
"4/16",
78.8,
44.2,
47.7
],
[
"CORAL",
"3/16",
81.7,
50.3,
56.2
],
[
"Agentic Scientist",
"1/16",
59.8,
42.1,
47.8
],
[
"InternAgent-1.5",
"5/16",
65.2,
34.0,
36.3
],
[
"Inventa",
"0/16",
85.1,
67.0,
73.6
]
]
},
"scilaws": [
[
"ReAct · Grok 4.7 (Best-of-50)",
59.3,
28
],
[
"ReAct · GLM 5.3 (Best-of-50)",
59.1,
24
],
[
"MILO",
58.9,
25
],
[
"Kimi K3 (Best-of-50)",
58.6,
26
],
[
"CORAL",
57.9,
24
],
[
"Grok 4.7 (Best-of-2)",
56.9,
22
],
[
"GEPA",
54.4,
18
],
[
"Agentic Scientist",
53.8,
21
],
[
"InternAgent-1.5",
53.3,
20
],
[
"OpenEvolve",
52.0,
18
],
[
"EvoX",
47.2,
14
],
[
"Inventa",
62.8,
31
]
],
"ideascientist": [
[
"IdeaScientist-Trained",
74.6
],
[
"IdeaScientist-Base",
77.7
],
[
"Inventa",
82.7
]
],
"scholar": [
[
"BM25",
24.2
],
[
"Cohere Embed v4",
35.4
],
[
"Cohere v4 + BM25 fusion",
34.1
],
[
"Cohere v4 + Rerank 3.5",
35.6
],
[
"Tool-calling Agent",
34.5
],
[
"+ real metadata",
34.7
],
[
"Deep-research Agent",
35.2
],
[
"OpenCode",
36.5
],
[
"OpenHands",
36.3
],
[
"Seed agent (initialization)",
33.1
],
[
"Inventa",
44.5
]
],
"ideabench27": [
[
"Single prompt",
3,
1.2
],
[
"Over-generate + rerank",
21,
4.1
],
[
"Best-of-N, N=26",
50,
4.7
],
[
"GEPA",
56,
12.3
],
[
"OpenEvolve",
56,
14.7
],
[
"EvoX",
56,
8.2
],
[
"CORAL",
41,
2.7
],
[
"ResearchAgent",
247,
18.6
],
[
"MILO, 3 islands",
56,
13.4
],
[
"Inventa",
45,
26.0
]
],
"judges": [
[
"Primary judge",
[
[
"OpenEvolve",
14.7
],
[
"MILO, 3 islands",
13.4
],
[
"Inventa",
26.0
]
]
],
[
"Second judge",
[
[
"OpenEvolve",
13.1
],
[
"MILO, 3 islands",
12.1
],
[
"Inventa",
17.5
]
]
],
[
"Judge: Grok 4.7",
[
[
"OpenEvolve",
11.3
],
[
"MILO, 3 islands",
8.8
],
[
"Inventa",
13.5
]
]
]
]
};
