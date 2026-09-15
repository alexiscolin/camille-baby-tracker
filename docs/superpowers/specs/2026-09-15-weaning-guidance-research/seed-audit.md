## Japanese weaning-stage audit of the 290-row food table (as of 2026-09-15)

All 290 rows were checked. Rows not listed below match Japanese sources, or sit inside the range those sources give. No repository files were modified.

In the tables, **TH** means たまひよ, **BC** means ベビーカレンダー, and the other short codes are defined with their URLs in section 5. For TH and BC, marks read 初期/中期/後期/完了期 (TH adds a fifth mark for 1歳7ヶ月以降). × means "not yet", △ means "small amounts / not recommended", 〇 means OK.

**The one thing to check in code first:** honey (and cow milk as a drink) must be gated on **age ≥ 12 months**, not on reaching stage 4. MHLW's rule is "蜂蜜は1歳を過ぎるまでは与えない", and a baby can be put in 完了期 before its first birthday.

**Before you use this:**
- Municipal tables disagree a lot. 小牧市 is very cautious; 草加市 allows pork, beef and liver at 中期. "Consensus" below means the MHLW guide plus the majority of the other sources.
- The old MHLW PDF link (`mhlw.go.jp/content/11908000/000496257.pdf`) now returns 404. The guide is on the こども家庭庁 site; if the app cites the old link, update it.
- 和光堂's checklist returned "Access Denied", so it is not used.
- No Okinawa-prefecture food-by-stage table exists online. 那覇市 only publishes a two-week start guide (つぶしがゆ → vegetables → 豆腐・白身魚・卵黄), which matches MHLW.

---

### 1. Rows to change

**1a. Remove from suggestions under 18 months**

| id | cur | rec | reason | sources | conf |
|---|---|---|---|---|---|
| oral-rehydration-solution | 1 | remove | MHLW: イオン飲料 is not needed at any point in 授乳期 or 離乳期; heavy intake causes vitamin B1 deficiency; use only on a doctor's instruction | MHLW p30 fn16 | high |
| konnyaku | 4 | remove | On the 使用を避ける list (use 糸こんにゃく if unavoidable); TH ××××△; 小牧 all × | CFA-CHOKE, TH-dry, KOMAKI | high |
| squid-boiled | 4 | remove | On the avoid list; TH: no shaped pieces until age 3; 小牧 and BC all × | CFA-CHOKE, TH-fish, KOMAKI, BC | high |
| octopus-boiled | 4 | remove | Same as squid; TH ××××△ | TH-fish, KOMAKI, BC | high |
| abalone-boiled | 4 | remove | TH: all ×, "小学生ぐらいから"; CFA: 貝類 not during 離乳期 | TH-fish, CFA-CHOKE | high |
| ikura | 4 | remove | TH ××××△ (from 1y7m, crushed); 小牧 魚卵 all ×; 上尾 all ×; BC all ×; raw, salty, round | TH-fish, KOMAKI, AGEO, BC | high |
| sencha | 4 | remove | CFA leaflet "離乳食期に与えないで: カフェイン"; TH 煎茶 only from 1y7m, diluted | CFA-SG, TH-drink | med-high |
| kizami-kombu | 3 | remove | 230,000 µg iodine and 10.9 g salt per 100 g (MEXT). 0.1 g already reaches the 0-year upper limit of 250 µg/day. Tough texture. | MEXT, EATREAT | medium |
| oyster-cooked | 4 | remove (**disputed**: 3 to >18m) | CFA: 貝類 not during 離乳期; BC all ×; 小牧 完了△. But TH and 上尾 allow 後期 | CFA-CHOKE, BC, KOMAKI, TH-fish, AGEO | medium |
| scallop-boiled | 4 | remove (**disputed**: 3 to >18m) | Same CFA rule; BC all ×; TH 後期△; 上尾 後期△ | same as above | medium |
| shrimp-boiled | 4 | remove, or keep 4 as すり身 only (**disputed**: 3 to >18m) | CFA: えび not during 離乳期; 小牧 and BC all ×; 草加 lists it under まだ与えたくない (at 中期); 所沢 完了期 "慎重に"; TH 後期△ as すり身 | CFA-CHOKE, KOMAKI, BC, SOKA, TOKOROZAWA, TH-fish | medium |
| eringi-boiled | 4 | remove | TH ××××△; BC all × | TH-veg, BC | medium |
| tarako | 4 | remove (**disputed**: 4 to >18m) | 小牧 and 上尾 all ×; TH and BC 完了△ (cooked, tiny); very salty, a condiment | KOMAKI, AGEO, TH-fish, BC | low-med |
| unagi-kabayaki | 4 | remove | Only secondary sites found: 1.5–2 years (fat, sweet-salty tare, many small bones) | search results only | low-med |
| rooibos-tea | 1 | 4 or remove (**disputed**: 1–4) | No official source. 上尾 ハーブティー all ×; TH ハーブ茶 1y7m+; 母子栄養協会 says water or mugicha instead | AGEO, TH-drink, BOSHI-rooibos | low |

**1b. Move later**

| id | cur | rec | reason | sources | conf |
|---|---|---|---|---|---|
| chicken-sasami-boiled | 1 | 2 | MHLW's 初期 proteins are only 豆腐・白身魚・卵黄. キユーピー 鶏肉 ×/○ "ささみからはじめる"; TH ×〇; 小牧 ×○; 上尾 鶏肉 ×△○; 所沢 and 草加 中期; 那覇 lists no meat at 初期. Only BC gives △ at 初期. | MHLW p32, KEWPIE, TH-meat, KOMAKI, AGEO, TOKOROZAWA, SOKA, NAHA | high |
| cooked-white-rice | 3 | 4 | MHLW: 後期 = 全がゆ90–軟飯80; 完了期 = 軟飯90–ご飯80 | MHLW p34 | high |
| aji-boiled | 2 | 3 | MHLW order is 白身→赤身→青皮魚. TH ××〇; 小牧 ××○; BC ××O. (草加 groups アジ with 赤身 at 中期.) | MHLW p32, TH-fish, KOMAKI, BC | high |
| katsuobushi | 1 | 2 | As flakes: TH 削り節 × at 初期 (dashi OK), 〇 at 中期 | TH-fish | medium |
| sawara-boiled | 2 | 3 | TH ××〇; BC ×××O | TH-fish, BC | medium |
| beef-liver-boiled, pork-liver-boiled | 2 | 3 (**disputed**: 2–3) | 小牧 レバー ××○; BC 豚レバー 後期; 上尾 order: ささみ → レバー・牛・豚 (牛・豚 at 後期); beef/pork muscle is already 3 in the table. TH gives △ at 中期; 草加 allows 中期. | KOMAKI, BC, AGEO, TH-meat, SOKA | med-low |
| cream-cheese | 2 | 3 | TH ××〇; BC ××O | TH-egg, BC | med-high |
| kanten-powder | 2 | 3 | Agar gel doesn't melt in the mouth: TH ××〇; BC ××O; 小牧 ×××○ | TH-dry, BC, KOMAKI | med-high |
| avocado | 2 | 3 | TH ××△; BC ××△ | TH-fruit, BC | medium |
| blueberry | 2 | 3 | TH ××△〇; round fruit, crush it | TH-fruit | med-low |
| apple-juice, orange-juice | 2 | 4 (or remove) | MHLW: fruit juice has no nutritional value here; TH 市販ジュース 完了期; 小牧 幼児用ジュース ×××△ | MHLW p30, TH-drink, KOMAKI | medium |
| prune-dried | 2 | 3 (**disputed**: 2–4) | TH ×△〇; BC ××O; 小牧 ×××△ | TH-fruit, BC, KOMAKI | med-low |
| mikan-canned, peach-canned | 2 | 3 | 小牧 くだもの缶 ××△○ (rinse off syrup) | KOMAKI | low |
| dashi-granules | 3 | 4 | TH 市販のだし（大人用）完了期; 草加 顆粒だし under まだ与えたくない | TH-season, SOKA | med-high |
| mango | 3 | 4 (**disputed**: 4 to >18m) | TH ×××△〇 (skin rash risk); BC all × | TH-fruit, BC | medium |
| papaya | 3 | 4 (**disputed**) | TH ×××△〇; BC all × | TH-fruit, BC | medium |
| barley-boiled | 3 | 4 | 小牧 押し麦・玄米 ×××△; TH 雑穀米 ××××△ | KOMAKI, TH-grain | medium |
| millet-cooked, quinoa-cooked | 3 | 4 (**disputed**) | By analogy with TH 雑穀米 ××××△; no Japanese source covers these directly | TH-grain | low |
| button-mushroom-boiled | 3 | 4 | TH マッシュルーム ×××△ | TH-veg | med-low |
| shiitake-dried (eaten, not as dashi) | 3 | 4 | TH 干ししいたけ ×××△ | TH-dry | low |
| atsuage | 3 | 4 (**disputed**: 3–4) | TH ×××〇; 小牧 ×××△; BC and 上尾 油揚げ 後期△ | TH-soy, KOMAKI, BC, AGEO | low-med |
| okara | 3 | 4 (**disputed**: 3–4) | TH ×××〇; BC ×××O; 小牧 ××△○ | TH-soy, BC, KOMAKI | low-med |
| vegetable-juice | 3 | 4 | 小牧 野菜ジュース ×××△; TH tomato juice for cooking at 中期, as a drink only at 完了期 | KOMAKI, TH-drink | low-med |
| almond-, cashew-, walnut-ground | 3 | 4 (**disputed**: 1 to >18m) | BC ナッツ類 all ×; 小牧 落花生・ナッツ類 all ×; the MHLW guide deliberately leaves nuts out. Walnut is a mandatory allergen, and cashew became one in 2026-04. Nuts went from 8.2% to 24.5% of immediate-type food allergies (2018→2024). Counterpoint: NCCHD found powder/paste workable from about 6 months with no choking, but for infants with eczema only under an allergist. | BC, KOMAKI, BOSHI-pn, BOSHI-cashew, NCCHD | medium, disputed |
| peanut-paste | 2 | 4 (**disputed**: 1 to >18m) | Same reasons as tree nuts. ERCA (report from the 2024 Japanese pediatric allergy congress): Japan does not recommend early peanut for everyone (prevalence about 0.2%). **Okinawa has higher prevalence**, so early intake "might be considered" there for babies with eczema. This goes against US/UK early-introduction advice: a policy choice for the family and their pediatrician. | ERCA, BOSHI-pn, NCCHD, BC, KOMAKI | medium, disputed |
| firm-tofu | 1 | 2 (**disputed**: 1–3) | MHLW doesn't separate tofu types; 小牧 recommends 絹ごし; secondary sites put 木綿 at 後期. Stage 1 is fine if strained smooth. | KOMAKI, search results | low |

**1c. Move earlier (internal consistency)**

| id | cur | rec | reason | sources | conf |
|---|---|---|---|---|---|
| egg-white-boiled | 3 | 2 | egg-whole-boiled is already 2 and contains the white. MHLW 中期: 卵黄1–全卵1/3; 小牧 卵白・全卵 中期△; BC 卵白 中期; 上尾 全卵 中期 | MHLW p34, KEWPIE, KOMAKI, BC, AGEO | high |
| katsuo-boiled | 3 | 2 | A red fish like tuna (already 2): TH ×△〇; 小牧 ×△○; BC ×△O; 草加 赤身魚 at 中期 | TH-fish, KOMAKI, BC, SOKA | medium |
| chicken-mince-cooked | 3 | 2 | TH 鶏ひき肉 ×〇; BC ×O; キユーピー 鶏肉 at 中期 | TH-meat, BC, KEWPIE | medium |
| saury-grilled | 4 | 3 | TH ××△〇; BC ××O; 小牧 ××△○; 上尾 さんま 後期△; 所沢 青皮魚 at 後期 | TH-fish, BC, KOMAKI, AGEO, TOKOROZAWA | medium |
| salt, sugar-white vs soy-sauce-*, miso-* | 4 / 4 / 2 / 2 | put all four at 2 (tiny amounts) or all at 3 | Inconsistent: soy sauce is ~15% salt, yet salt is 4. CFA leaflet at 中期: "少しずつ調味料で味をつけ始めても"; BC and 上尾 中期△; TH 砂糖 at 7m, 塩・しょうゆ・みそ at 後期 | CFA-SG, BC, AGEO, TH-season | med (that it's inconsistent) / low (which stage) |

**Optional, low confidence.** These are later than sources say, so harmless to leave:
- nashi, melon, strawberry, watermelon, orange-navel, yaki-fu, shokupan: 2 → 1 (TH and BC give 初期).
- parmesan-grated: 3 → 2 (TH, 小牧, 所沢, 草加 at 中期).
- sesame-oil: 3 → 2 (TH 8m, 草加).
- aosa-dried: 3 → 2 (like TH 青のり).
- grape, cherry: 3 → 2 (TH and BC 中期, only quartered and peeled).
- edamame, soybeans, soramame, snap-peas, snow-peas: 3 → 2 (TH).
- cornflakes: 4 → 2 (TH, キユーピー).
- enoki: 4 → 3 (TH, same as しめじ).
- mayonnaise: 4 → 3 (TH, 所沢 後期; disputed 3–4 because it is raw-egg based).
- swordfish: 4 → 3 (TH 中期△, BC 完了).

---

### 2. Safety or preparation notes needed

| id(s) | issue | source |
|---|---|---|
| honey | Gate on age ≥12 months, not stage. Some 梅干し contain honey. | MHLW p30, TH-season, TH-dry |
| apple, pear-western, nashi | During 離乳期, cook until soft; never raw or only grated. Apple (and bread) cause the most serious 離乳期 choking accidents. | CFA-CHOKE |
| shokupan, roll-bread, french-bread | Bread is a top 離乳期 choking food: serve moistened (パン粥), small pieces, a drink first. | CFA-CHOKE |
| cherry-tomato, grape, cherry, blueberry | Never whole. Quarter them; also peel grapes and cherries. The cherry row says "halved", which is not enough. | CFA-CHOKE, CAA |
| quail-egg-boiled | On the avoid list; if used, cook and cut, never whole. | CFA-CHOKE, TH-egg |
| processed-cheese, mozzarella | Wrapped cheese pieces are on the avoid list: grate or chop. Mozzarella is elastic. | CFA-CHOKE, TH-egg |
| wiener-sausage | Cut lengthwise, then small; skinless; blanch to cut salt. | CFA-CHOKE, TH-meat |
| chickpeas, lentils, soybeans, edamame, azuki, kidney-beans, soramame, green-peas, sweetcorn | Soft-cooked, skins removed, mashed. Hard whole beans not until after age 5; CAA warns even small pieces can cause pneumonia. | CAA, TH-soy, TH-veg |
| almond / cashew / walnut / peanut / sesame rows | Powder or smooth paste only, never pieces. Eczema → see an allergist first. | CAA, NCCHD |
| kombu-dashi, awase-dashi | Iodine 5,300 µg/100 g (cold-brew kombu) and 1,500 µg/100 g (awase), against a 250 µg/day limit at age 0. Dilute, keep to a few teaspoons a day, alternate with katsuo dashi (about 1 µg). | MEXT, EATREAT |
| hijiki-dried, hijiki-boiled | Arsenic: soak, then boil and discard the water (ゆでこぼし), which removes about 90%. Iodine is 45,000 µg/100 g dry, so small amounts. Use 芽ひじき, finely chopped. | MAFF, MEXT, TH-dry |
| shirasu (kamaage), shirasuboshi | Salt 2.1 g and 4.2 g per 100 g; blanch to desalt. The kamaage row doesn't say "desalted". | MEXT, KOMAKI, AGEO |
| milk-whole (2), skim-milk-powder | Cooking only; as a drink from 12 months. | MHLW p32, CFA-SG |
| egg-yolk-boiled | Hard-boiled only; start with 耳かき1杯; no raw egg until age 3. | MHLW p32, KOMAKI, CFA-SG |
| boiled egg, mince rows | Both soak up saliva: moisten or thicken. | CFA-CHOKE |
| wakame-*, yaki-nori, aonori, leafy greens, mushrooms | Chop fine and cook soft. Crumbled nori, not sheets. Salted wakame: TH says avoid, 上尾 says desalt, so prefer dried cut wakame. | CFA-CHOKE, TH-dry, AGEO |
| udon-dried, somen-boiled | Boil and rinse off salt (小牧 recommends dried noodles). | KOMAKI |
| natto | Chop until 完了期. | TH-soy, KOMAKI |
| kinako | Stage 1 is fine (TH and 小牧 △, 上尾 ○), but mix into moist food; it makes babies choke. | TH-soy, KOMAKI, AGEO |
| nagaimo | Always cooked; raw grated とろろ only from 1.5–3 years. | AGEO, TH-grain |
| hojicha | Contains caffeine: CFA says none during 離乳食期; TH allows diluted. Keep at 4 diluted, or remove. | CFA-SG, TH-drink, KOMAKI |
| soba, crab | Major allergens. BC (both) and 小牧 (soba after 18m) say × through 18m; tiny first amount. | KOMAKI, BC, TH-fish |
| kamaboko, chikuwa, hanpen, ham | Salty and elastic: blanch and chop fine. 小牧 says × for all of 離乳期. | TH-fish, TH-meat, KOMAKI |
| mayonnaise | Raw-egg based: only after whole egg is tolerated, small amounts. | AGEO, TOKOROZAWA |
| tuna-*, swordfish | No stage change: Japan's mercury advisory targets pregnant women, "乳幼児等もその対象としていません". Just don't rely on one large predatory fish. | MHLW-Hg |
| cod | 小牧 delays it to 後期 for allergy; most sources say 初期. Keep; small first serving. | KOMAKI, TH-fish |
| formula-* | Not a new food; fine as an ingredient from 初期. Follow-up milk isn't needed. | TOKOROZAWA, MHLW p32 |
| tamago-bolo | Egg plus sugar; snacks aren't needed before age 1. | TOKOROZAWA |
| matsutake | Row says "raw": must be cooked, and it's tough. Data issue. | no source read |
| senbei-shoyu, pomegranate | Adult shoyu senbei are hard and salty (prefer baby rice crackers); pomegranate seeds are a choking risk. | no Japanese source read |
| cucumber-raw (2) | TH gives 初期 grated and cooked; 所沢 allows raw vegetables from 完了期. Cook or grate until then. | TH-veg, TOKOROZAWA |

---

### 3. Missing staples

白菜, きなこ, パン粥 (shokupan), 麩 (yaki-fu) and たら (cod) are already in the table.

| name | stage | allergens | source / confidence |
|---|---|---|---|
| ひらめ (flounder) | 1 | – | TH-fish, KEWPIE, BC · high |
| 島豆腐 (Okinawan firm tofu) | 2 (strain; boil to cut salt) | soy | MEXT: salt 0.4 g/100 g, vs 0 g for 木綿 or 絹ごし · low (no weaning source) |
| ゆし豆腐 (Okinawan soft tofu) | 2 (drain off the salty whey) | soy | MEXT: salt 0.6 g/100 g · low |
| もずく (plain, unseasoned, not 三杯酢) | 3 | – | TH-dry · medium |
| 鮭フレーク (salmon flakes) | 4 (salty; pour hot water over) | salmon | TH-fish 完了期〇; KOMAKI 完了期△ · medium |
| レタス, cooked | 2 | – | TH-veg (初期△, 中期〇), BC · medium |
| 赤ちゃんせんべい (e.g. ハイハイン) | 2 | none of the 28 labelled allergens (maker) | maker labels 7か月頃から (search result only); snacks optional before 1y · low |
| ベビーダノン (sweetened baby fromage frais) | 1–2 | milk | maker says from 6 months (search result only); contains sugar · low |
| 紅いも (Okinawan purple sweet potato) | 1 | – | by analogy with さつまいも (TH 初期〇) · low |
| 田芋 (Okinawan taro) | 2 | – | by analogy with 里いも (TH 中期) · low |
| 合いびき肉 (beef-pork mince) | 3 | beef, pork | BC 後期 · medium |
| ちりめんじゃこ (desalted) | 1 | – | TH-fish · medium; near-duplicate of shirasuboshi |

Keep ジーマーミ豆腐 (Okinawan peanut tofu, sticky starch) out of the list under 18 months. That rests on peanut and texture reasoning only; I read no source on it.

---

### 4. Prerequisite chains in Japanese sources

1. **Rice porridge:** つぶしがゆ (10倍) → 7倍 near the end of 初期 (a textbook step, not in MHLW; 8倍 is not standard either) → 全がゆ (5倍) 50–80 g at 中期 → 全がゆ 90 g to 軟飯 80 g at 後期 → 軟飯 90 g to ご飯 80 g at 完了期. [MHLW p32/34, BOSHI-okayu]
2. **First foods:** porridge for about a week → mashed vegetables (then fruit) → after about another week, 豆腐・白身魚・固ゆで卵黄. [MHLW p32, CFA-SG schedule, NAHA]
3. **Fish:** 白身魚 (たい・かれい・ひらめ・たら) → 赤身魚 (まぐろ, かつお; 鮭 after たい/たら) → 青皮魚 (あじ, さば, then いわし, さんま). Canned tuna after 鮭/かつお/まぐろ; canned mackerel after fresh mackerel. [MHLW p32, SOKA, TOKOROZAWA, TH-fish]
4. **Egg:** hard-boiled yolk (耳かき1杯 up to 1 yolk) → 卵白 or 全卵 1/3 at 中期 → 1/2 at 後期 → 1/2–2/3 at 完了期. Mayonnaise only after whole egg. No raw egg until age 3. [MHLW p34, TH-egg, TOKOROZAWA, KOMAKI]
5. **Meat:** after tofu and white fish: 鶏ささみ → 鶏ひき肉/むね → レバー → 豚・牛 lean or mince at 後期 → fattier cuts later ("脂肪の多い肉類は少し遅らせる"). [MHLW p32, KEWPIE, AGEO, TH-meat, SOKA]
6. **Soy:** 絹ごし豆腐 → きな粉 (after tofu) → 納豆 (chopped, heated at first) and 高野豆腐 at 中期 → 木綿 → 油揚げ・厚揚げ (remove oil) at 完了期. [TH-soy, KOMAKI]
7. **Dairy:** yoghurt and cottage cheese at 中期; milk in cooking at 中期 → processed or cream cheese at 後期 → milk as a drink at 12 months. [MHLW p32, CFA-SG, TH-egg]
8. **Wheat:** うどん / そうめん after porridge and potatoes → pasta after those → 中華めん from 後期 (TH) or 1.5 years (小牧). [TH-grain, KOMAKI]
9. **Seasoning:** dashi only at 初期 → tiny amounts at 中期/後期 → 完了期 at 1/3–1/2 of adult seasoning. Honey from 1 year; spices from 1 year. [CFA-SG, SOKA, TH-season]

---

### 5. Sources actually read (key → URL)

- **MHLW**: 授乳・離乳の支援ガイド 2019, pp30–34 (now on the CFA site): https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/6790a829-15c7-49d3-9156-9e40e8d9c20c/b0946e59/20230401_policies_boshihoken_junyuu_01.pdf
- **CFA-SG**: 離乳スタートガイド and its schedule sheet: …/20921f30/20230401_policies_boshihoken_junyuu_05.pdf and …/59a3df7e/20230401_policies_boshihoken_junyuu_06.pdf (same base path as above); index page https://www.cfa.go.jp/policies/boshihoken/junyuu
- **CFA-CHOKE**: 誤嚥事故防止のための食材整理表 (CFA-funded 2024 study): https://www.irric.co.jp/pdf/reason/research/2024_research_report_3.pdf
- **CAA**: https://www.caa.go.jp/policies/policy/consumer_safety/caution/caution_047/
- **MAFF**: https://www.maff.go.jp/j/syouan/nouan/kome/k_as/maff_hijiki.html
- **MHLW-Hg**: https://www.mhlw.go.jp/topics/bukyoku/iyaku/syoku-anzen/suigin/040817-2.html
- **MEXT** (food composition database): https://fooddb.mext.go.jp/details/details.pl?ITEM_NO= followed by 9_09020_7 (刻み昆布), 17_17020_7 (昆布だし 水出し), 17_17021_7 (合わせだし), 17_17019_7 (かつおだし), 9_09050_7 (ほしひじき), 4_04036_7 (沖縄豆腐), 4_04037_7 (ゆし豆腐), 10_10445_7 (釜揚げしらす), 10_10055_7 (しらす干し)
- **AGEO**: https://www.city.ageo.lg.jp/uploaded/attachment/64227.pdf
- **KOMAKI**: https://www.city.komaki.aichi.jp/material/files/group/27/meyasuhyou.pdf
- **TOKOROZAWA**: https://www.city.tokorozawa.saitama.jp/kenko/karadakenkou/kodomonohoken/nyuyoji/rinyuusyoku.files/nobinobi2020.pdf
- **SOKA**: https://www.city.soka.saitama.jp/cont/s1506/020/010/070/tanoshikususumerurinyuusyoku.pdf
- **NAHA**: https://www.city.naha.okinawa.jp/child/kosodateouen/rinyuuqandoa.html and https://www.city.naha.okinawa.jp/_res/projects/default_project/_page_/001/002/835/susumekata1.pdf
- **TH** (たまひよ, supervised by 太田百合子): `https://st.benesse.ne.jp/ikuji/content/?id=` followed by 118378 (grain), 121408 (fish), 121409 (meat), 121410 (season), 121411 (drink), 121540 (veg), 121541 (dry), 127376 (fruit), 127496 (egg), 128791 (soy)
- **BC**: https://baby-calendar.jp/baby-food-guide/all/
- **KEWPIE**: https://www.kewpie.co.jp/babyfood/advice/erabikata/
- **ERCA**: https://www.erca.go.jp/yobou/zensoku/sukoyaka/column/202507_1/
- **NCCHD**: https://www.ncchd.go.jp/press/2024/0613.html
- **BOSHI-pn**: https://boshieiyou.org/peanut-allergy-prevention/
- **BOSHI-cashew**: https://boshieiyou.org/pistachio-and-cashewnut-allergy/
- **BOSHI-okayu**: https://boshieiyou.org/okayunosusumekata/
- **BOSHI-rooibos**: https://boshieiyou.org/rooibostea/
- **EATREAT**: https://eat-treat.jp/columns/45

Search results only (not read in full): ベビーダノン and ハイハイン age labels, unagi age, 木綿豆腐 timing, かつお節 flakes at 中期 (ヤマキ/トモニテ).
