# Independent counter-review: the seed-table changes in `food-seed.ts`

> Adversarial review by a reviewer who did not see the research reports, run against commit 1121a2b. Every finding was resolved or deliberately kept in the next commit; see the design spec §14.

# Review of the weaning-stage changes in `food-seed.ts` (main..feat/weaning-guidance)

Most of the changes hold up against Japanese sources. The one real safety error left is the kombu dashi note, which suggests an iodine amount well above the Japanese infant upper limit. Its sibling: kizami kombu and the liver rows carry no warning at all.

**How I checked.** I diffed the two branches row by row with a script, then checked each change against sources I read directly:
- **Guide 2019:** the national 授乳・離乳の支援ガイド. I read the text on p.32 and the stage table (p.34) as an image of the page.
- **Okinawa leaflet:** the 沖縄県小児保健協会 leaflet (2020.4), rendered as an image.
- **City tables:** 藤井寺市, 川崎市麻生区 and 草加市.
- **Parent references:** たまひよ's 10 food-by-stage tables and ベビーカレンダー's full food list, both parsed from the raw HTML.
- **Choking guidance:** 日本小児科学会's choking column (Ver.3, 2025-08-31); こども家庭庁's 2016 daycare guideline and its FY2024 food table; 消費者庁 caution_047.
- **Numbers:** MEXT food composition pages, the 2025 national intake standards table, and MAFF on hijiki.

The 和光堂 checklist blocked access. Where I only saw a search-result snippet, I say "(snippet)".

**Short names used in the table.** Links are in the Sources list at the end.
- G2019 = Guide 2019
- OKI = Okinawa leaflet
- FUJ / KAW / SOK = 藤井寺市 / 川崎市麻生区 / 草加市 tables
- TH = たまひよ tables
- BC = ベビーカレンダー list
- JPS = 日本小児科学会 choking column
- CFA16 / CFA24 = こども家庭庁 daycare guideline (2016) / food table (FY2024)
- DRI2025 = Japanese intake standards 2025

## 1. Verdicts for A (stage changes) and B (age floors)

| id | change | verdict | sources (quote) |
|---|---|---|---|
| chicken-sasami-boiled | 1→2 | CONFIRMED | G2019 lists only 豆腐・白身魚・卵黄 for 初期. TH: "豆腐や白身魚などに慣れた離乳中期から". OKI: ささみ in the 中期 row. FUJ: 鶏ささみ at 中期. BC: 初期△, 中期〇 |
| firm-tofu | 1→2 | DISPUTED (1–2) | OKI: 絹ごし豆腐 at 初期, 沖縄豆腐 at 中期. TH marks 豆腐 〇 from 初期 but "つぶして食べさせる場合は絹ごし豆腐のほうが…おすすめ". BC: 豆腐 at 初期, no distinction. Harmless delay |
| katsuobushi | 1→2 | CONFIRMED | TH: "そのまま食べさせるなら、離乳中期から…だし汁の材料としては離乳初期からOK". FUJ: かつおだし at 中期. KAW: かつおだし in the 7–8 month list |
| aji-boiled | 2→3 | CONFIRMED | TH: "離乳後期からにしましょう". BC: 後期. FUJ: "青背魚…あじ" at 後期. OKI: 青魚 at 後期 |
| sawara-boiled | 2→3 | DISPUTED (2–4); 3 is the middle | TH: "離乳後期から". FUJ: "たら、さわら" at 中期. BC: さわら at 完了期 |
| pork-liver / beef-liver | 2→3 | CONFIRMED (range 2–4) | TH: レバー（鶏・豚・牛） 中期△, 後期〇. OKI: レバー at 後期. BC: 豚レバー at 後期. KAW: 牛・豚レバー at 12–18 m. SOK: レバー at 中期 |
| cream-cheese | 2→3 | CONFIRMED (3–4) | TH: "食べさせるなら離乳後期から". BC: 後期. KAW: 中期 "チーズ（クリームチーズ以外）", クリームチーズ at 12–18 m |
| avocado | 2→3 | CONFIRMED | TH: "離乳後期ごろから様子を見ながら" (後期△). BC: 後期△. mynavi (snippet): 後期 |
| blueberry | 2→3 | CONFIRMED | TH: 後期△, 完了期〇. eversense (snippet): "離乳食後期を目安に" |
| peanut-paste | 2→4 | DISPUTED (1–4) | Morinaga エンゼル110: "離乳中期から後期となった段階で". BC: ナッツ類 × until 18 m. NCCHD 2024: paste/powder from about 6 m, "誤嚥や窒息は発生せず". G2019: delaying "予防効果があるという科学的根拠はない". ERCA (Okinawan allergist): early intake worth considering "沖縄県などの有病率が高い地域に限定して、かつ湿疹のある子どもに" |
| walnut / almond / cashew ground | 3→4 | DISPUTED (1 to >18 m) | BC: ナッツ類 × through 18 m. NCCHD: walnut and cashew powder from 初期 was feasible. CAA's "5歳以下" rule covers whole nuts only |
| egg-white-boiled | 3→2 | CONFIRMED | G2019 table, 中期: "卵黄１～全卵１／３". OKI: 全卵 at 中期. BC: 卵白 at 中期. KAW: "卵黄～全卵" at 7–8 m |
| katsuo-boiled | 3→2 | CONFIRMED | TH: "離乳中期から" (△). BC: 中期△. KAW: "赤身魚（かつお、まぐろ…）" at 7–8 m. SOK: まぐろ・かつお at 中期 |
| chicken-mince-cooked | 3→2 | DISPUTED (2–3) | TH and BC: 鶏ひき肉 at 中期. KAW: "鶏、豚、牛ひき肉" at 9–11 m. OKI and FUJ: 鶏肉 (other than ささみ) at 後期 |
| saury-grilled | 4→3 | CONFIRMED | TH: 後期△, 完了期〇. BC: 後期. FUJ: さんま at 後期. KAW: "青皮魚（イワシ、さば、さんま）" at 9–11 m |
| cooked-white-rice | 3→4 | CONFIRMED | G2019 table: 後期 "全がゆ90～軟飯80", 完了期 "軟飯90～ご飯80". OKI and KAW: ご飯 at 完了期 |
| soy sauce ×2 / miso ×2 / salt | →3 | DISPUTED (2–3); 3 matches Okinawa | TH: しょうゆ・塩・みそ at 離乳後期. OKI: 初期・中期 "つかわない", 後期 "（1日で）塩・しょうゆ 1g". Against: KAW "ごく少量の食塩、しょうゆ、みそ" at 7–8 m; SOK and FUJ at 中期; BC 中期△ |
| sugar-white | 4→2 | CONFIRMED | TH: 砂糖 at "7ヶ月ごろ". KAW and FUJ: 砂糖 at 中期. BC: 中期△ |
| prune-dried | 2→3 | CONFIRMED | TH: ドライフルーツ 中期△, 後期〇. BC: 後期 |
| mango / papaya | 3→4 | CONFIRMED | TH mango: "食べさせるなら幼児食期になってから" (完了期△). BC: × through 18 m |
| mikan-canned / peach-canned | 2→3 | CONFIRMED, weak | mynavi (snippet): canned mikan from 後期. Neither TH nor BC lists canned fruit |
| apple-juice / orange-juice | 2→4 | CONFIRMED | TH: 市販のジュース at 完了期. G2019: juice before weaning has no nutritional value |
| vegetable-juice | 3→4 | CONFIRMED | TH: トマトジュース（無塩） "そのまま飲ませるのは離乳完了期から" |
| barley / quinoa / millet | 3→4 | CONFIRMED (could be later) | TH: 雑穀米 "食べさせるなら幼児食期になってから" |
| button-mushroom | 3→4 | CONFIRMED | TH: マッシュルーム "離乳完了期から". BC: きのこ類 完了期〇 |
| shiitake-dried | 3→4 | CONFIRMED | TH: "離乳完了期になるまでは食べさせません" |
| atsuage | 3→4 | CONFIRMED | TH: 厚揚げ "離乳完了期から". KAW and FUJ: 厚揚げ at 12–18 m |
| okara | 3→4 | CONFIRMED | TH: "離乳完了期から". BC: 完了期 |
| dashi-granules | 3→4 | CONFIRMED | TH: 市販のだし（大人用） at 完了期. SOK: 顆粒だし under "まだ与えたくないもの" at 中期 |
| kanten-powder | 2→3 | CONFIRMED | TH: "離乳後期から". BC: 後期 |
| honey | +12 m | CONFIRMED | G2019: "1歳を過ぎるまでは与えない" |
| sencha | +19 m | CONFIRMED | TH: 煎茶・緑茶 at 幼児食 (1歳7ヶ月～), diluted "3歳になるまで" |
| eringi | +19 m | CONFIRMED | TH: "幼児期食期になるまでは食べさせられません". BC: × through 18 m. JPS only says cut to 1 cm (no age) |
| tarako | +19 m | DISPUTED (12–18 m) | TH and BC: 完了期△. 19 m is slightly more cautious; harmless |
| unagi-kabayaki | +19 m | CONFIRMED, weak | Parent sites (snippets): "1歳半～2歳ごろから" |
| shrimp / oyster / scallop | +24 m | CONFIRMED | JPS: "エビ、貝類 2歳以上になってから". CFA24: えび・貝類 "離乳期に提供することは避ける". CFA16: 0–1歳児クラス avoid. TH says it deliberately goes earlier than the pediatric society's 2才 rule |
| crab | +24 m | DISPUTED (19–24 m) | JPS does not name crab. TH: かに 後期△. BC: × through 18 m |
| squid / octopus | +36 m | CONFIRMED | TH: "形がある状態で食べさせるのは3才になるまでNG". CFA16 and CFA24: いか on the avoid list |
| ikura | +36 m | CONFIRMED (range 19–36 m) | 母子栄養協会: "3歳以降が安心". TH: 幼児食期△. BC: × through 18 m |
| konnyaku | +36 m | DISPUTED (12–19 m if cut small) | TH: "食べさせるなら幼児食期から。みじん切り". KAW: こんにゃく at 12–18 m. JPS: "1㎝に切った糸こんにゃくを使用する". CFA24: avoid, "「糸こんにゃく」で代用する". No source gives 36 |
| abalone | +72 m | CONFIRMED (one source) | TH: "小学生ぐらいから" |

Also correct: dropping the matsutake allergen tag. 消費者庁 removed まつたけ from the recommended allergen list on 2024-03-28.

## 2. C: foods marked `suggest: false`

- **Dashi is the only real problem.** Katsuo, kombu and awase dashi are never suggested, but Japanese practice introduces dashi on purpose from 初期:
  - FUJ: 初期 "昆布だしや野菜スープの味だけで", then 中期 "かつおだしが使えるようになります".
  - BC: 出汁 〇 at 5–6 m.
  - TH: 削り節 "だし汁の材料としては離乳初期からOK".
  - G2019 itself never mentions dashi.
  - Katsuo dashi is the baby's first bonito (fish) exposure. A reaction tracker that never prompts for it will miss that exposure.
- **The rest are defensible:** omoyu (G2019 starts with つぶしがゆ, not omoyu), okayu textures, oils, seasonings, formula, teas, water/ORS, lemon/yuzu juice, curry powder, mayonnaise, margarine, kizami kombu.
- **The rule is inconsistent.** Rice flour and katakuriko are hidden as ingredients, but wheat flour, panko, gelatin, kanten and skim milk powder are still suggested.

## 3. D: notes checked (27)

**Correct but should be reworded**
- **Apple, western pear, nashi ("Cook until soft until 18 months — never raw or only grated"):** the substance matches the national guidance.
  - CFA24: "やわらかくなるまで加熱する ●生の状態、すりおろしただけの状態では与えない" (離乳期).
  - JPS: "離乳完了期までは、リンゴは加熱する（すりおろしても、大きめのカケラが混入する可能性がある）".
  - The English can be read as "only grated is fine", which is the opposite. Suggest "never raw, not even grated".
  - TH and BC do allow grated raw apple from 初期, so this note is stricter than the parent sites. That is the right call.

**Wrong on quantity**
- **Kombu dashi ("a few spoons a day"):** warning about iodine is right, the amount is not.
  - MEXT 17020 (昆布だし 水出し): iodine 5,300 µg/100 g.
  - The row sets 5 g per spoon, so three spoons ≈ 800 µg.
  - DRI2025 upper limits: 250 µg/day (0–5 m), 350 µg/day (6–11 m), 600 µg/day (1–2 y).
  - Three spoons is roughly 2–3 times the limit, every day, from stage 1.
- **Awase dashi (same note):** 1,500–2,900 µg/100 g (MEXT 17021 / 17148). Borderline.

**Correct**
- **Grape and cherry tomato ("peel and cut into quarters"):** CAA: "4等分する". JPS: "乳幼児（特に4歳以下）は1/4にカット". CFA24 for ぶどう: "口内に残る皮も取り除く".
- **Cherry and blueberry (quarters / crush):** reasonable. CFA24 lists さくらんぼ as a food to avoid in daycare.
- **Shirasu and shirasuboshi (pour boiling water over):** TH: "熱湯を回しかけて塩分を取り除きましょう". SOK: "下茹でするか熱湯をかけて".
- **Hijiki, both rows (soak, boil, discard water):** MAFF: 水戻し removes about 5割, ゆでこぼし about 9割.
- **Cow's milk (drink from 12 months):** G2019: "牛乳を飲用として与える場合は…１歳を過ぎてからが望ましい". Skim milk powder note also fine.
- **Kinako (mix into moist food):** TH: "むせないように、おかゆなどに混ぜて". "Choke" slightly overstates むせる.
- **Natto ("Chop; warm it at first"):** acceptable. TH says to pour boiling water over it "離乳完了期まで", so "at first" is shorter than TH advises.
- **Egg yolk (hard-boiled yolk only):** G2019: "固ゆでした卵黄".
- **Quail egg (never whole):** TH: "必ず切る". CFA24 lists it as a food to avoid.
- **Bread ×3 (bread porridge, choking):** CFA24: "近年の誤嚥に関する重大事故は、離乳期のこどもが「りんご」、「パン」を食べた時に多く発生".
- **Wiener (cut lengthwise):** JPS: "ソーセージは縦半分に切る".
- **Ham, kamaboko, chikuwa, hanpen (blanch):** TH: "熱湯を回しかけたり、さっとゆでて塩分を抜いて".
- **Somen and dried udon (rinse off salt):** TH agrees.
- **Peanut and nut pastes (paste or powder only):** NCCHD and CAA agree.
- **Beans ("no whole beans before age 6"):** matches CAA "5歳以下".
  - CAA's wording is "硬い豆", so the note is over-cautious for edamame and soramame, but not wrong.
  - "Skins off" matches TH: "薄皮は3才になるまではむいて".
- **Yaki-nori (crumble, no whole sheets):** matches JPS (焼き海苔 "2歳以上", 刻みのり "もみほぐし細かくする").
- **Mayonnaise (only once whole egg is tolerated):** KAW: "全卵が食べられてから".
- **Tamago bolo:** G2019 only mentions snacks (補食) at 完了期.
- **Nagaimo (always cooked):** TH: "生で食べさせられるのは3才ごろから".
- **Ta-imo (itchy):** TH's 里いも row: "かゆみ成分".
- **Mozuku:** TH: "三杯酢など味がついているものは避け、こまかく刻んで".
- **Beni-imo ("Not ヤマン, which is a yam"):** true. くゎっちーおきなわ: ヤマン = だいじょ, ヤマノイモ科.
- **Shima-dofu and yushi-dofu salt figures:** match MEXT exactly (0.4 and 0.6 g/100 g).
  - I checked all five new Okinawan rows against MEXT 04036, 04037, 02049, 02014 and 09037. Energy, protein, fat, carbs, fibre, sodium, potassium, calcium, iron, zinc, folate and vitamin C all match.
  - Also, OKI lists 沖縄豆腐 at 中期, which confirms stage 2 for shima-dofu.

**Weak**
- **Cucumber ("grate or cook until 18 months"):** no Japanese source I found says this. TH allows it raw about a month after weaning starts. Over-cautious but harmless.

## 4. E: rows the author did not change that I would still change

No unchanged row is placed two or more stages too early. The worst problems are missing safety notes and inconsistencies.

1. **kizami-kombu (stage 3, no note):** MEXT 09020 gives 230,000 µg iodine and 10.9 g salt per 100 g. One gram is about 6.5 times the 6–11 m iodine limit. The iodine warning exists only in `sourceRef`, which users do not see. Clearly relevant for Okinawan クーブイリチー.
2. **chicken-liver (stage 2) and pork-liver (stage 3), no notes:**
   - The rows themselves say 14,000 and 13,000 µgRAE vitamin A per 100 g. DRI2025's infant limit is 600 µgRAE/day, so about 5 g reaches it.
   - A 中期 meat portion is 10–15 g (G2019), which is 2–3 times the limit.
   - The note should limit the amount and say "about once a week" (a parent-site snippet says 週1回).
3. **chicken-liver stage 2 is inconsistent** with moving pork and beef liver to 3. BC (鶏レバー 後期), OKI (レバー 後期) and KAW (鶏レバー at 9–11 m) all say 3.
4. **konnyaku:** add the JPS/CFA24 prep note (1 cm 糸こんにゃく only), whatever age floor is kept.
5. **persimmon (stage 3, no note):** CFA16 says "柿 完了期まではりんごで代用する" and lists "熟れた柿やメロン" among smooth foods that choke. Needs "mashed only".
6. **raisin and other dried fruit (stage 3–4, no note):** TH: "少量を湯でやわらかくもどし、こまかく刻めば".
7. **shiitake, shimeji, maitake, enoki (no notes):** JPS says "繊維に逆らい、1cm程度に切る". Eringi alone got a 19-month floor, while these get no warning.
8. **kanten (stage 3, no note):** TH: "ゼラチンと違って口の中で溶けないので、誤えんしないようにやわらかめに作ったものを小さく切って".
9. **wakame-desalted (stage 2):**
   - Even after desalting it is still 1.4 g salt/100 g (MEXT 09045; row sodium 530 mg).
   - That is saltier than shima-dofu, which got a "Salty" warning.
   - TH says "塩蔵わかめは避け、塩分の少ない乾燥わかめを".
10. **Too late, but harmless:** edamame (3; TH and BC say 初期), soybeans (3; TH 初期△), cornflakes (4; TH 中期, BC 初期), hojicha (4; TH 初期, diluted). Low priority.

## 5. Overall assessment

1. The table is now largely consistent with mainstream Japanese practice. About 35 of the 51 changes are confirmed by at least two independent sources, and none contradicts the national guidance.
2. The author's choices closely track たまひよ (seasonings, fruit, eringi, sencha, squid/octopus, abalone) and the Okinawa leaflet (salt/soy at 3, shima-dofu at 2). Where city tables disagree (soy/miso at 中期, chicken mince at 後期), the chosen values are defensible, not wrong.
3. Peanut and nuts at stage 4 follow common practice, not the national guide. G2019 says delaying doesn't prevent allergy, and an Okinawan allergist notes Okinawa has higher peanut-allergy rates. If the baby has eczema, ask a doctor rather than trust the table.
4. Konnyaku 36 m and crab 24 m are stricter than any source I found. Unsupported, but not dangerous.
5. **Most important remaining error:** the kombu dashi note ("a few spoons a day") recommends roughly 2–3 times the Japanese infant iodine limit from stage 1, while kizami kombu and the liver rows (vitamin A) carry no warning at all. The table checks choking and stages carefully, but not iodine or vitamin A amounts.

## Sources
- G2019: https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/6790a829-15c7-49d3-9156-9e40e8d9c20c/b0946e59/20230401_policies_boshihoken_junyuu_01.pdf
- OKI: https://www.town.yonabaru.okinawa.jp/uploaded/attachment/708.pdf
- FUJ: https://www.city.fujiidera.lg.jp/material/files/group/11/itirann.pdf
- KAW: https://www.city.kawasaki.jp/asao/cmsfiles/contents/0000111/111443/rinyushoku2-2.pdf
- SOK: https://www.city.soka.saitama.jp/cont/s1506/020/010/070/tanoshikususumerurinyuusyoku.pdf
- TH (たまひよ tables): https://st.benesse.ne.jp/ikuji/content/?id= followed by 121408 (fish), 121409 (meat), 121410 (seasonings), 121411 (drinks), 121540 (vegetables, mushrooms), 121541 (dried goods), 127376 (fruit), 127496 (egg, dairy), 128791 (soy), 118378 (grains)
- BC: https://baby-calendar.jp/baby-food-guide/all
- JPS: https://www.jpeds.or.jp/society-activities/column/proposals-assertions/50123.html
- CAA: https://www.caa.go.jp/policies/policy/consumer_safety/caution/caution_047/
- CFA16: https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/03f45df9-97e1-4016-b0c3-8496712699a3/39b6fd36/20230607_policies_child-safety_effort_guideline_02.pdf
- CFA24: https://www.irric.co.jp/pdf/reason/research/2024_research_report_3.pdf
- NCCHD: https://www.ncchd.go.jp/press/2024/0613.html
- ERCA: https://www.erca.go.jp/yobou/zensoku/sukoyaka/column/202507_1/
- Morinaga エンゼル110: https://www.angel110.jp/faq/%E9%9B%A2%E4%B9%B3%E9%A3%9F%E3%81%A7%E3%81%AE%E3%83%94%E3%83%BC%E3%83%8A%E3%83%83%E3%83%84%E3%83%90%E3%82%BF%E3%83%BC%E3%81%AE%E6%91%82%E5%8F%96%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/
- MAFF hijiki: https://www.maff.go.jp/j/syouan/tikusui/gyokai/g_kenko/busitu/pdf/hijiki02.pdf
- MEXT food database, pattern: https://fooddb.mext.go.jp/details/details.pl?ITEM_NO=17_17020_7 (also 17_17021, 17_17148, 9_09020, 9_09045, 4_04036, 4_04037, 2_02049, 2_02014, 9_09037)
- DRI2025: https://www.kenpakusha.co.jp/data/seigo1/005004-05.pdf
- 母子栄養協会 (ikura): https://boshieiyou.org/ikura-itsukara/
- くゎっちーおきなわ (ヤマン): https://kuwachii-okinawa.com/agricultural/2530/
- Matsutake removal: https://www.city.sendai.jp/sekatsuese-shokuhin/makadamia-matsutake.html
