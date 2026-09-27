# Motor milestones 0–24 months: sourced windows

Research date: 2026-09-27. Every figure below comes from a page or PDF that was actually opened. Where the only thing I could open was a WebFetch summary of a page (CDC), I say so.

## Sources opened

| Id | Source | URL | What it gives |
|---|---|---|---|
| WHO | WHO MGRS Group. *WHO Motor Development Study: windows of achievement for six gross motor development milestones.* Acta Paediatr Suppl 2006;450:86–95 (full PDF from WHO), plus the WHO percentile table | Paper: https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/who-motor-development-study-windows-of-achievement-for-six-gross-motor-development-milestones.pdf?sfvrsn=3425c1dc_0 · Table: https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_percentiles_table.pdf?sfvrsn=81f3b60b_5 | Longitudinal study, n=816, 5 countries. P1–P99 for 6 milestones, age in months = days / 30.4375 |
| MHLW | こども家庭庁 (Children and Families Agency), 令和5年 (2023) 乳幼児身体発育調査 結果の概要, 表9 「一般調査による乳幼児の運動機能通過率」 | https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b32105e4-fa26-42eb-97d0-2e5cbaef703a/25a6391e/20241225_policies_boshihoken_r5-nyuuyoujityousa_10.pdf (p.15) | Japanese national cross-sectional survey. % of children who can do each item, by one-month age band |
| MHLW-def | MHLW 2010 survey form and instructions (案) giving the item definitions | https://www.mhlw.go.jp/shingi/2010/04/dl/s0419-6c.pdf | Operational definitions of each item (see below) |
| CDC | CDC "Learn the Signs. Act Early." milestone pages (2022 revision) + Zubler et al., *Pediatrics* 2022;149(3):e2021052138 | https://www.cdc.gov/act-early/milestones/index.html · paper PDF: https://autismnavigator.learnercommunity.com/Files/Org/b7feabe6ed9e4713b02511fc0003214c/site/Zubler_et_al__Evidence-informed_milestones_for_developmental_surveillance_tools_Pediatrics_2022.pdf | Age by which **≥75%** of children do it ("things most children (75% or more) can do by a certain age"). Only a late-ish bound, never a median. The CDC site blocks curl, so I read it through WebFetch summaries that quoted the bullets |
| VWO-P90 | Dutch JGZ guideline *Motorische ontwikkeling*, Bijlage 7: P90 of Van Wiechen items vs Bayley-III-NL | https://www.jgzrichtlijnen.nl/richtlijn/jgz-richtlijn-motorische-ontwikkeling/8-bijlagen/8-6-bijlage-7-p90-waarden-van-motoriekkenmerken-in-het-van-wiechenonderzoek-en-in-de-bayley-iii-nl/ | Age by which **90%** pass (Dutch national well-child exam) |
| VWO-item | NCJ Van Wiechen item pages ("Referentiewaarden (percentage dat het kenmerk positief scoort)") | https://www.ncj.nl/van-wiechen/kenmerken/details/?item=N | % passing at the recommended exam age. Cross-sectional study from The Hague (the page says so). High pass rates only, so these give late bounds, not medians |
| THIS | Sudry T et al. *Standardization of a Developmental Milestone Scale Using Data From Children in Israel.* JAMA Netw Open 2022;5(3):e222184, Figure 2 | https://pmc.ncbi.nlm.nih.gov/articles/PMC9907346/ (figure: https://cdn.ncbi.nlm.nih.gov/pmc/blobs/ec98/9907346/60f6ebe899ad/jamanetwopen-e222184-g002.jpg) | 643,958 children, 3.77 M nurse assessments (8.7% based on what parents reported). The figure colour-codes the achievement rate as <75 / 75–90 / 90–95 / >95% **only at the ages where the item is tested**, so it gives no medians. I read the values off the figure image, so a cell could be misread by one colour band |
| Adolph | Adolph KE, Vereijken B, Denny MA. *Learning to crawl.* Child Dev 1998;69:1299–312 (PubMed abstract) + secondary summary on parentingscience.com | https://pubmed.ncbi.nlm.nih.gov/9839417/ · https://parentingscience.com/when-do-babies-crawl/ | n=28 followed over time; 15/28 belly-crawled first, and the other 13 skipped belly crawling |

### How MHLW items are defined (MHLW-def, verbatim)
- 首すわり: 「乳幼児を仰向けに寝かせ、両手を持って引き起こしたとき、首が遅れないでついてくるとき「できる」とします。」 (pull-to-sit with no head lag, checked by a physician at 3–5 months)
- ねがえり: 「左右どちらかの方向にでも仰位から腹位にかわることができるものを「できる」とします。」 → **back to tummy** only
- ひとりすわり: 「おおむね１分以上支えなしですわっていられるもので、このとき両手を床についていないもの」 (≥1 min, hands off the floor, stricter than WHO)
- はいはい: 「はって移動できるものを「できる」とします。」 → **any crawling, belly crawling included**; posture is not specified
- つかまり立ち: 「長時間かかっても何かにつかまってひとりで立ちあがれば「できる」」 → pulls up to stand by itself
- ひとり歩き: 「物につかまらないで、２～３歩あるくもの」 (2–3 unaided steps)

Caveat: these definitions come from the 2010 survey's draft form. I did not open the 2023 form, but the 2023 report names the same six items and plots 2010 and 2023 side by side.

### MHLW 2023 表9, verbatim (% who can do it, by age band)

| Age band | 首のすわり | ねがえり | ひとりすわり | はいはい | つかまり立ち | ひとり歩き |
|---|---|---|---|---|---|---|
| 0y 2–3 mo | 5.6 | 1.6 | | | | |
| 3–4 mo | 53.7 | 20.7 | | | | |
| 4–5 mo | 93.5 | 56.9 | | | | |
| 5–6 mo | 100.0 | 89.7 | 3.2 | 6.3 | 2.4 | |
| 6–7 mo | | 97.6 | 30.1 | 19.5 | 7.3 | |
| 7–8 mo | | 100.0 | 65.9 | 47.6 | 31.7 | |
| 8–9 mo | | | 84.4 | 67.4 | 61.2 | 2.3 |
| 9–10 mo | | | 91.7 | 76.9 | 81.3 | 6.0 |
| 10–11 mo | | | 98.5 | 91.0 | 88.1 | 9.0 |
| 11–12 mo | | | 99.3 | 99.3 | 96.3 | 30.9 |
| 1y 0–1 mo | | | 100.0 | 99.0 | 99.0 | 47.9 |
| 1y 1–2 mo | | | | 98.7 | 98.7 | 55.3 |
| 1y 2–3 mo | | | | 100.0 | 100.0 | 83.0 |
| 1y 3–4 mo | | | | | | 88.4 |
| 1y 4–5 mo | | | | | | 96.9 |

Report text, verbatim: 「「首のすわり」は、生後４～５か月未満の乳児の 90％以上でできると回答。」「「ねがえり」は、生後６～７か月未満…」 (the 2023 report text says 6–7 mo for rolling, the first band at or above 90%), 「「はいはい」は、生後１0～11 か月未満…」「「つかまり立ち」は、生後 11～12 か月未満…」「「ひとり歩き」は、生後１年４～５か月未満の幼児の 90％以上でできると回答。」

This is cross-sectional data, so a band's % is the share of children of that age who can already do it. How I read MHLW in the table below:
- **early** = first band with ≥5%
- **typical** = first band with ≥50%
- **late** = first band with ≥90%

The months given are the band bounds.

## Main table

Months are completed months of age. "Pctl" says what the early/late numbers actually are.

| key | Label FR | domain | early | typical | late | Pctl (early / late) | source | URL | quoted passage / cell | confidence |
|---|---|---|---|---|---|---|---|---|---|---|
| sitsWithoutSupport (existing) | Tient assis sans appui | grossMotor | 3.8 | 5.9 | 9.2 | P1 / P99 (median P50) | WHO | WHO table URL above | "1st 115 (112,118) 3.8 … 50th 179 … 5.9 … 99th 279 … 9.2" | high (confirmed) |
| standsWithAssistance (existing) | Tient debout avec appui | grossMotor | 4.8 | 7.4 | 11.4 | P1 / P99 | WHO | idem | "1st 4.8 … 50th 7.4 … 99th 11.4" | high (confirmed) |
| crawlsHandsKnees (existing) | Marche à quatre pattes | grossMotor | 5.2 | 8.3 | 13.5 | P1 / P99 | WHO | idem | "1st 5.2 … 50th 8.3 … 99th 13.5"; abstract: "4.3% did not exhibit hands-and-knees crawling" | high (confirmed) |
| walksWithAssistance (existing) | Marche avec aide | grossMotor | 5.9 | 9.0 | 13.7 | P1 / P99 | WHO | idem | "1st 5.9 … 50th 9.0 … 99th 13.7" | high (confirmed) |
| standsAlone (existing) | Tient debout seul | grossMotor | 6.9 | 10.8 | 16.9 | P1 / P99 | WHO | idem | "1st 6.9 … 50th 10.8 … 99th 16.9" | high (confirmed) |
| walksAlone (existing) | Marche seul | grossMotor | 8.2 | 12.0 | 17.6 | P1 / P99 | WHO | idem | "1st 8.2 … 50th 12.0 … 99th 17.6". Japanese check (MHLW ひとり歩き, 2–3 steps): 2.3% at 8–9, 55.3% at 13–14, 96.9% at 16–17 | high (confirmed) |
| headControl | Tient bien sa tête | grossMotor | 2 (band 2–3: 5.6%) | 3–4 (53.7%) | 4–5 (93.5%) | first band ≥5% / first band ≥90% (MHLW) | MHLW 2023 表9 | MHLW URL | 首のすわり: 2–3月 5.6 / 3–4月 53.7 / 4–5月 93.5 / 5–6月 100.0. CDC 4 mo (≥75%): "Holds head steady without support when you are holding him" | high |
| rollsBackToTummy | Se retourne du dos sur le ventre | grossMotor | 3 (band 3–4: 20.7%) | 4–5 (56.9%) | 6–7 (97.6%); 5–6 is 89.7% | first band ≥5% / first band ≥90% (MHLW) | MHLW 2023 表9 (ねがえり = 仰位→腹位) | MHLW URL | ねがえり: 2–3月 1.6 / 3–4月 20.7 / 4–5月 56.9 / 5–6月 89.7 / 6–7月 97.6 | high |
| rollsTummyToBack | Se retourne du ventre sur le dos | grossMotor | — | — (no median found) | 6 | ≥75% by that age (CDC) | CDC 6 mo | https://www.cdc.gov/act-early/milestones/6-months.html | "Rolls from tummy to back" (6 mo, ≥75%). THIS, both directions ("Rolls over from abdomen to back and back to abdomen"): 75–90% at 6–7 mo, 90–95% at 8, >95% at 9. VWO item 60 (both directions): 97.2% at 37–38 wk; P90 39 wk | medium for the late bound, **no median** |
| getsToSitting | S'assoit tout seul | grossMotor | — | — | 9 | ≥75% (CDC) | CDC 9 mo | https://www.cdc.gov/act-early/milestones/9-months.html | "Gets to a sitting position by herself". THIS "Gets to sit without support": <75% at 9, 75–90% at 10, 90–95% at 11, >95% at 12 mo | medium (late bound only) |
| bellyCrawls | Rampe sur le ventre | grossMotor | ~5 | — (no valid median) | ~11–12 | Adolph: onset range seen in 15 belly-crawlers / VWO: 92.6% pass at 47–48 wk, P90 = 12 mo | Adolph 1998; VWO item 64 + Bijlage 7 | https://pubmed.ncbi.nlm.nih.gov/9839417/ · https://www.ncj.nl/van-wiechen/kenmerken/details/?item=64 | Adolph abstract: "15 infants crawled on their bellies prior to crawling on hands and knees, but the other 13 infants skipped the belly-crawling period". Parentingscience (secondary, citing Adolph 1998): "most belly-crawlers began sometime between the ages of 5 and 8.5 months." VWO 64 "Kruipt vooruit, buik op de grond": "47-48 weken 92,6 % / 49-50 weken 93,8 % / 51-52 weken 96,1 %"; Bijlage 7: "Kruipt vooruit, buik op de grond (M) — 12 maanden [P90 VWO] — 13 maanden [P90 Bayley-III]" | **low**, see caveats |
| crawlsAnyForm (optional, cross-check) | Se déplace à quatre pattes ou en rampant | grossMotor | 5 (band 5–6: 6.3%) | 7–8 (47.6%) → 8–9 (67.4%) | 10–11 (91.0%) | first band ≥5% / first band ≥90% (MHLW) | MHLW 2023 表9 (はいはい = 「はって移動できる」) | MHLW URL | はいはい: 5–6月 6.3 / 6–7月 19.5 / 7–8月 47.6 / 8–9月 67.4 / 9–10月 76.9 / 10–11月 91.0 | high for "moves by crawling of any kind"; do **not** read it as hands-and-knees |
| pullsToStand | Se met debout seul en s'agrippant | grossMotor | 6 (band 6–7: 7.3%) | 8–9 (61.2%) | 11–12 (96.3%); 10–11 is 88.1% | first band ≥5% / first band ≥90% (MHLW) | MHLW 2023 表9 (つかまり立ち) | MHLW URL | つかまり立ち: 5–6月 2.4 / 6–7月 7.3 / 7–8月 31.7 / 8–9月 61.2 / 9–10月 81.3 / 10–11月 88.1 / 11–12月 96.3. CDC 12 mo (≥75%): "Pulls up to stand". VWO Bijlage 7 "Trekt zich op tot staan": P90 12 mo | high |
| cruises | Marche en se tenant aux meubles | grossMotor | — | — (no median found) | 12 (≥75%) … 15 (P90) | ≥75% (CDC) / P90 (VWO) | CDC 1 yr; VWO Bijlage 7 + item 67 | https://www.cdc.gov/act-early/milestones/1-year.html · https://www.ncj.nl/van-wiechen/kenmerken/details/?item=67 | CDC: "Walks, holding on to furniture". Bijlage 7: "Loopt langs (M) — 15 maanden [P90] — 15/16 maanden [Bayley]". Item 67: "61-62 weken 96,4 %" | medium (late bound only) |
| climbsOnFurniture | Grimpe sur le canapé et en descend seul | grossMotor | — | — | 18 | ≥75% (CDC) | CDC 18 mo | https://www.cdc.gov/act-early/milestones/18-months.html | "Climbs on and off a couch or chair without help" | low (one bound only) |
| walksUpStairs | Monte quelques marches (avec ou sans aide) | grossMotor | — | — | 18–24 | THIS >95% at 18 (with help) / CDC ≥75% at 24 | THIS; CDC 2 yr | https://www.cdc.gov/act-early/milestones/2-years.html | CDC: "Walks (not climbs) up a few stairs with or without help". THIS "Climbs upstairs with assistance": >95% at 18 mo (the only age tested) | low (the two items differ; no median) |
| runs | Court | grossMotor | — | — | 24 | ≥75% (CDC) | CDC 2 yr | idem | "Runs" | low |
| kicksBall | Tape dans un ballon | grossMotor | — | — | 24 | ≥75% (CDC) | CDC 2 yr | idem | "Kicks a ball" | low |
| graspsObject | Attrape un objet | fineMotor | 3 | — | 5–6 | THIS 75–90% at 3 mo / VWO 95% at 21–22 wk, P90 26 wk | THIS; VWO item 6 + Bijlage 7; CDC | https://www.ncj.nl/van-wiechen/kenmerken/details/?item=6 | THIS "Grasps an object": 75–90% at 3, 90–95% at 4, >95% at 5 mo. VWO 6 "Pakt in rugligging voorwerp binnen bereik": "21-22 weken Rechts: 95,0 %"; Bijlage 7 P90 26 wk. CDC 4 mo: "Holds a toy when you put it in his hand"; CDC 6 mo: "Reaches to grab a toy she wants" | medium (no median) |
| transfersHands | Passe un objet d'une main à l'autre | fineMotor | — | — | 9 | ≥75% (CDC) / VWO P90 39 wk (~9 mo) | CDC 9 mo; VWO item 7 + Bijlage 7 | https://www.ncj.nl/van-wiechen/kenmerken/details/?item=7 | CDC: "Moves things from one hand to her other hand". VWO 7 "Pakt blokje over": "37-38 weken 97,0 %"; Bijlage 7 P90 39 wk (VWO) / 44 wk (Bayley-III-NL). THIS "Transfers an object from one hand to the other": >95% at 6 mo, a conflict (see caveats) | medium (late bound), no median |
| rakesSmallObjects | Ratisse les petits morceaux avec les doigts | fineMotor | — | — | 9 | ≥75% (CDC) | CDC 9 mo | https://www.cdc.gov/act-early/milestones/9-months.html | "Uses fingers to "rake" food towards himself" | low (one source, one bound) |
| bangsTwoObjects | Tape deux objets l'un contre l'autre | fineMotor | — | — | 8–9 | THIS 90–95% at 8 / CDC ≥75% at 9 | THIS; CDC 9 mo | idem | CDC (cognitive section): "Bangs two things together". THIS "Taps 2 objects playfully": 75–90% at 6–7, 90–95% at 8, >95% at 9 mo | medium (no median) |
| pincerGrasp | Attrape un petit objet entre le pouce et l'index | fineMotor | — | — | 10–12 | THIS >95% at 10 / VWO P90 52 wk / CDC ≥75% at 12 | THIS; VWO item 10 + Bijlage 7; CDC 1 yr | https://www.ncj.nl/van-wiechen/kenmerken/details/?item=10 | CDC: "Picks things up between thumb and pointer finger, like small bits of food". VWO 10 "Pakt propje met duim en wijsvinger": "47-48 weken Rechts: 95,6 %"; Bijlage 7 P90 52 wk (VWO) / 48 wk (Bayley). THIS "Uses thumb-fingers grasp": 90–95% at 9, >95% at 10 mo | medium (no median) |
| putsInContainer | Met un objet dans un récipient | fineMotor | — | — | 12 | ≥75% (CDC) | CDC 1 yr (cognitive section); VWO item 11 | https://www.cdc.gov/act-early/milestones/1-year.html | CDC: "Puts something in a container, like a block in a cup". VWO 11 "Doet blokje in/uit doos": 98.8% (right hand) at 61–62 wk | low-medium |
| stacksTwoBlocks | Empile deux cubes | fineMotor | — | — | 15–18 | ≥75% (CDC 15) / P90 (VWO 18) | CDC 15 mo; VWO Bijlage 7 + item 13 | https://www.cdc.gov/act-early/milestones/15-months.html | CDC: "Stacks at least two small objects, like blocks". Bijlage 7 "Stapelt 2 blokjes": P90 18 mo (VWO) / 21 mo (Bayley-III-NL). VWO 13: boys 81.9% at 75–76 wk (the girls' figure was not captured) | medium (late bound) |
| scribbles | Gribouille | fineMotor | — | — | 18 | ≥75% (CDC) | CDC 18 mo | https://www.cdc.gov/act-early/milestones/18-months.html | "Scribbles" | low |
| drinksFromCup | Boit dans un verre sans couvercle | fineMotor | — | — | 12 (held by adult) / 18 (alone) | ≥75% (CDC) | CDC 1 yr, 18 mo | idem | 12 mo: "Drinks from a cup without a lid, as you hold it"; 18 mo: "Drinks from a cup without a lid and may spill sometimes" | low-medium |
| usesSpoon | Mange seul à la cuillère | fineMotor | — | — | 18 (tries) / 24 (eats) | ≥75% (CDC) | CDC 18 mo, 2 yr; THIS | idem | CDC 18 mo: "Tries to use a spoon"; 24 mo: "Eats with a spoon". THIS "Eats independently with a spoon" (classed personal-social): >95% at 18 mo | low (sources conflict, and depends on what parents allow) |

## Caveats (read before shipping)

1. **Medians exist only for WHO (the six already in the app) and MHLW** (head control, back-to-tummy roll, crawling of any kind, pull-to-stand, plus Japanese cross-checks for sitting and walking). For everything else I only have late bounds: CDC's age by which ≥75% do it, Dutch P90, and Israeli ≥90/95%. The app should show those rows as "most babies by X months", not as a window with a centre.
2. **MHLW vs WHO differ because the definitions differ.** Japanese ひとりすわり (≥1 min, hands off the floor) reaches 50% at 7–8 months vs the WHO median of 5.9. ひとり歩き (2–3 steps) reaches 50% at 13–14 months vs the WHO median of 12.0. Do not mix the two sources for the same item.
3. **MHLW はいはい is not hands-and-knees.** The definition 「はって移動できる」 includes belly crawling, so it cannot replace the WHO item.
4. **Belly crawling (reptation) is weakly sourced.** Adolph 1998 is n=28, and the "5 to 8.5 months" range comes via a secondary site. I could not open the paper's results. Van Wiechen item 64 is scored positive for any forward crawling ("Negatief: Het kind kruipt of tijgert niet"), so a hands-and-knees crawler also passes. Its ~93% at 11 months therefore means "moves forward by crawling of either kind" and is not the age at which babies start belly crawling. About half of infants skip belly crawling (13/28 in Adolph), so it must be optional, with no "late" flag.
5. **Tummy-to-back vs back-to-tummy.** The folk rule that tummy-to-back comes first is not supported by anything I opened. MHLW shows 57% rolling back-to-tummy at 4–5 months, and the CDC puts tummy-to-back at 6 months (75%). No source gave a median for tummy-to-back.
6. **The Israeli THIS scale says hand-to-hand transfer is >95% at 6 months, but CDC puts it at 9 months (75%) and the Dutch P90 at 39 weeks.** The THIS wording or its nurse criterion probably differs. Use the conservative CDC and Dutch values.
7. **THIS values were read by eye from a colour-coded figure**, and each milestone is only tested at a few clinic ages. That is fine for bounds, but not for exact numbers.
8. CDC is a surveillance checklist and not a normative study. Zubler 2022 picked ages from literature and expert opinion so that "≥75%" do the skill by then.

## Rejected / not found

- **MHLW 2010 table**: the 2023 table (above) supersedes it. The 2010 PDF (73-22-01.pdf) did not contain the motor table in the text layer I searched.
- **Denver II norms (P25/50/75/90)**: they are only in the proprietary manual. The one open derivative I found (Denver II-Jimma on ResearchGate) returned 403.
- **AIMS item ages** (e.g. "reciprocal crawling", AIMS's term for belly crawling): these are in the Piper & Darrah manual and in Darrah 2014 DMCN, which are not open. The Polish AIMS paper I opened has no item-level ages.
- **Ertem et al. 2018, Lancet Glob Health** (GMCD, n=4,949 healthy children, medians for 106 milestones including fine motor): open access, but thelancet.com and sciencedirect return 403 to both fetch and curl, and the Chrome extension was not connected. **This is the best missing source for fine-motor medians. Worth opening by hand.**
- **Krombholz 2025, Global Pediatrics**, "Gross and fine motor milestones in the first two years of life – representative data for Germany" (doi 10.1016/j.gpeds.2025.100254), and the related Cogent Psychology 2025 paper (18 milestones including belly crawling): these probably have percentiles for belly crawling (Robben) and the pincer grasp. Both returned 403, and the PsychArchives PDF gave 502. **The best candidate for a real belly-crawling window. Worth opening by hand.**
- **Van Wiechen P50 values**: a search snippet said the pincer grasp P50 is 10 months, but it came from Quizlet, which I did not open and do not trust. Not used.
- **French carnet de santé 2025 / HAS**: not researched. As far as I know they list checks at examination ages rather than normative percentiles, but I have not verified that.
- **Running, kicking a ball, climbing stairs, scribbling**: only CDC bounds (≥75% at 18–24 months). No median, confidence low.
- **WHO definition of "walking with assistance"** (does it include cruising along furniture?): the paper I opened does not repeat the definitions, so this is unverified.
