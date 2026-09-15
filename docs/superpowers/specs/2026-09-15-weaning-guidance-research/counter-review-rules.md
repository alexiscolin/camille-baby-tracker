# Independent counter-review: the rules in `weaning-rules.ts`, `weaning-progress.ts`, `next-foods.ts` and the portion table

> Adversarial review by a reviewer who did not see the research reports, run against commit 1121a2b. Every finding was resolved or deliberately kept in the next commit; see the design spec §14.

I checked all 14 claims against the primary sources. Several rules are right. The order and pace logic is presented as more "official" than the sources support, and a few places in the code deserve fixing before this family relies on it. No files were changed.

**About the JGFA2026 draft:** I read the public-comment version through its viewer, but it says it must not be quoted or reproduced (「いかなる形式・手段による転載・引用も許可いたしません」). For that document I summarise and give page numbers only.

**Sources**
- **Guide:** 授乳・離乳の支援ガイド 2019, https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/6790a829-15c7-49d3-9156-9e40e8d9c20c/b0946e59/20230401_policies_boshihoken_junyuu_01.pdf (page numbers below are the printed ones).
- **Start leaflet:** the official 離乳スタートガイド and its schedule sheet, …/20921f30/…junyuu_05.pdf and …/59a3df7e/…junyuu_06.pdf.

## Verdicts

**1. Start with porridge, one spoon, once a day, around 5–6 months — CONFIRMED, with one caveat.**
- Guide p.32: 「離乳の開始は、おかゆ（米）から始める。新しい食品を始める時には離乳食用のスプーンで１さじずつ与え」 and 「初めは「つぶしがゆ」とし」.
- Guide p.30: 「その時期は生後５～６か月頃が適当である」 and 「離乳食は１日１回与える」. The table on p.34: 「１日１回１さじずつ始める」.
- 10倍がゆ is municipal wording, not the guide's. Wakayama city: 「10倍がゆを離乳食用のスプーン1口から始めましょう」.
- Caveat: the guide ties the start to readiness signs, not age alone (p.30): 「首のすわりがしっかりして寝返りができ、５秒以上座れる…」 and 「月齢はあくまでも目安」. The app starts purely on age.

**2. One new food at a time, one spoon; app uses "one new food per day" — PARTLY.**
- One spoon is in the guide (p.32). "One new food per day" is not in the guide; it comes from city leaflets:
  - Nara 「初めて与える食材は1日1品」 (https://www.city.nara.lg.jp/site/kosodate/10440.html)
  - Wakayama 「1日に新たに始める食材は1種類にしましょう」 (https://www.city.wakayama.wakayama.jp/kurashi/kenko_iryo/1001092/1036401/1036414.html)
- The same Wakayama page contradicts treating it as a daily target: 「毎日新しい食材を始める必要はないので、2～3日続けて同じ食材に慣らして、少しずつ量を増やしていきましょう」.
- First-month calendars add about one new food a week (Naha, Minato, Tomigusuku). The shopping list (`NEW_PER_SLOT`, shopping-list.ts:51) can plan 3 new vegetables in the very first vegetable week. The `Pace` comment "the guide's practice is one new food a day" is not sourced.

**3. Order, plus vegetables from ~day 7 and protein from ~day 14 — order CONFIRMED; days PARTLY.**
- The order is in the guide (p.32): 「慣れてきたらじゃがいもや人参等の野菜、果物、さらに慣れたら豆腐や白身魚、固ゆでした卵黄など」.
- **The guide gives no day counts**, and neither does the official schedule sheet.
- City leaflets do give days:
  - **Naha** (https://www.city.naha.okinawa.jp/_res/projects/default_project/_page_/001/002/837/susumekata1.pdf): vegetables on days 7–10, 「つぶしがゆを始めてから約1週間たったら 野菜を1さじからプラス」; protein on days 11–15, 「野菜を始めてから約1週間たったら たんぱく質を1さじからプラス」.
  - **Minato** (r8rinyushokuhajime.pdf): vegetables in week 2, protein in week 3.
  - **Tomigusuku, Okinawa** (https://www.city.tomigusuku.lg.jp/material/files/group/21/hazimenotuki.pdf): first vegetable on day 8, second on day 15, tofu or white fish on days 19–21.
  - Nara and Wakayama: porridge for about one week first.
- So day 7 is well supported. Day 14 matches Naha and Minato but is earlier than Tomigusuku.
- **Code bug:** weaning-progress.ts:70 counts the 14 days from the start of weaning, not from the first vegetable. A first vegetable logged on day 13 opens protein on day 14. That contradicts Naha's "about a week after vegetables".

**4. Egg yolk only after tofu or white fish; whole egg only after yolk — first half UNSOURCED, second half CONFIRMED.**
- The guide lists 「豆腐や白身魚、固ゆでした卵黄など」 as one step with no order inside it.
- The cities list them together too:
  - Naha puts 豆腐・白身魚・卵黄 in one row.
  - Minato: 「たんぱく質は、豆腐・白身魚・固ゆでした卵黄等を1種類ずつ与えましょう」.
  - Osaka's table has 卵黄（固ゆで） in 初期 alongside 豆腐 and 白身魚.
- Yolk before whole egg is confirmed. Guide p.32: 「卵は卵黄から全卵へと進めていく」. Minato: 「最初は必ず卵黄から始めます」.
- Low risk: it delays egg by days, not weeks.

**5. Fish white → red → blue, and which fish go where — order CONFIRMED; groups PARTLY.**
- Guide p.32: 「魚は白身魚から赤身魚、青皮魚へ」.
- Osaka city table, printed p.30 (https://www.city.osaka.lg.jp/kodomo/cmsfiles/contents/0000309/309034/rinyuunosusumekata_202406.pdf): 初期 白身魚・しらす干し; 中期 赤身魚・鮭・ツナ/さけ水煮缶; 後期 青皮魚. Kyoto: 白身魚 = 「たい、かれい、ひらめ、たら、すずき、あんこうなど」.
- The app's white group (cod, flounder, sea bream, shirasu) is correct.
- Salmon: Osaka lists 鮭 on its own next to 赤身魚 in 中期. Biologically it is a white-fleshed fish, so "red" is a convention, but the stage is right.
- Tuna, katsuo, aji, mackerel, sardine, saury and yellowtail are correct.
- Sawara in "blue-backed", swordfish in "red" and shishamo in "blue-backed" have no source. Sawara is usually treated as white fish in Japanese cooking, and shishamo is not a blue-backed fish. All three are placed late, so the error only delays them.

**6. Meat order sasami → lean chicken/liver → pork, beef, other liver → processed — PARTLY.**
- The guide only says (p.32) 「脂肪の少ない肉類…脂肪の多い肉類は少し遅らせる」.
- Osaka's table: 中期 鶏レバー・鶏ささみ; 後期 牛赤身肉・豚赤身肉・鶏肉; 完了期 ウインナーソーセージ・ハム・牛肉・豚肉. The app broadly matches this.
- Two differences:
  - Osaka puts liver and sasami at the same step.
  - The app puts fattier cuts (pork loin, beef and pork mince) with lean meat, where Osaka waits until 完了期.

**7. Two meals at 7–8 months, three at 9–11; plus ≥30 days and protein before stage 2 — ages CONFIRMED; the extra rule is not contradicted, but it is the wrong kind of signal.**
- Guide p.31: 「離乳食は１日２回にして」 for 中期 and 「離乳食は１日３回にし」 for 後期.
- Naha: 「離乳開始して１か月を過ぎた頃から １日２回食にすすめます」. Its 中期 leaflet: 「離乳食をはじめて1～2か月したら1日2回」. Tomigusuku moves to two meals after day 30.
- The Naha Q&A says to decide by what the baby eats, not by age: 「月齢で回数を判断するのではなく、お子さんの食べる内容で判断しましょう」. It uses about 50 cc per meal for two meals and about 100 cc for three (https://www.city.naha.okinawa.jp/child/kosodateouen/rinyuuqandoa.html).
- The app has no signal for how much the baby eats. The 60- and 90-day thresholds have no source, but they only ever slow progress down, so they are harmless.

**8. Portion table — stages 2–4 CONFIRMED; stage 1 matches Naha.**
- The guide's p.34 table gives these per-meal ranges:

| | Grain | Veg/fruit | Fish / meat | Tofu | Egg | Dairy |
|---|---|---|---|---|---|---|
| 中期 | 全がゆ50～80 | 20～30 | 10～15 | 30～40 | 卵黄1～全卵1/3 | 50～70 |
| 後期 | 全がゆ90～軟飯80 | 30～40 | 15 | 45 | 全卵1/2 | 80 |
| 完了期 | 軟飯90～ご飯80 | 40～50 | 15～20 | 50～55 | 全卵1/2～2/3 | 100 |

- `PORTIONS` uses the upper bound of each range for stages 2–4, which is correct. The code also correctly splits meals across protein kinds, matching the table's 「又は」 (one protein per meal, not all of them).
- The guide gives no grams for 初期. Naha's end-of-month amounts are 「およそ30g」 porridge, 「およそ15g」 vegetables and 「およそ5～10g」 protein, so 30/15/10 is the top of Naha's range.
- Using end-of-month amounts for every week of stage 1 over-buys in week 1, which costs money but is not a safety issue.

**9. Egg is the one allergen not to delay; nuts, shrimp, crab, buckwheat and salmon roe go to the paediatrician — PARTLY. The in-app wording is misleading.**
- Egg does have a specific recommendation:
  - 食物アレルギーの診療の手引き2023, 表7, p.11: 「生後5〜6か月から加熱鶏卵を微量もしくは少量から摂取開始してよい」 (https://www.foodallergy.jp/wp-content/uploads/2026/04/FAmanual2023_260410.pdf).
  - The JGFA2026 draft (表6-2, p.53) recommends starting heated egg around 5–6 months.
- But Japanese guidance says not to delay any food, not just egg. Guide p.33: 「特定の食物の摂取開始を遅らせても、食物アレルギーの予防効果があるという科学的根拠はない」.
- The official start leaflet names egg, dairy and wheat together: 「卵、乳製品、小麦は、大切な栄養源でもあります。怖がらずに少量で様子をみながら食べさせていきましょう」.
- 表7 in the 手引き also covers continuing formula milk for milk-allergy prevention. The string "Egg is the one allergen Japanese guidance says not to delay" (next-foods.ts:246) should be reworded.
- Peanut and tree nuts: correct that there is no Japanese early-introduction recommendation.
  - JGFA2026 draft p.54: early peanut is described as international consensus for high-prevalence countries, and the evidence for other nuts is weaker.
  - Sakihara 2024 (アレルギー 73:264, https://www.jstage.jst.go.jp/article/arerugi/73/3/73_260/_pdf/-char/ja) treats this as an open question for Japan.
- Shrimp, crab, buckwheat and salmon roe: the guide says nothing about them. Routing them to the doctor has no source; it is cautious but reasonable.
- **Code bug:** the doctor check runs before the age check (next-foods.ts:212 before :220). Salmon roe (raw, minimum 36 months) and shrimp/crab (24 months) show "decide with your paediatrician" at 6 months instead of "not yet". The official start leaflet bans 「肉・魚・卵の生もの」 during weaning.

**10. With eczema, introduce egg, milk and wheat with a doctor — PARTLY; too narrow in scope.**
- The guide's instruction covers weaning as a whole, not three foods (p.33): 「子どもに湿疹がある場合…基本的には原因食物以外の摂取を遅らせる必要はないが…必ず医師の指示に基づいて行うよう情報提供を行うこと」.
- 栄養食事指導の手引き2022 v1.4, p.16: 「患者にかゆみを伴う湿疹がある場合は、医師の指導のもとで早期に湿疹の改善を目指し、離乳食を開始する」.
- Nara: 「（湿疹など）気になる症状があるときは、かかりつけのお医者さんに相談してから始めましょう」.
- JSPACI 2017 (https://www.jspaci.jp/uploads/2017/06/teigen20170616.pdf) supports egg specifically: 「医師の管理のもと、生後6か月から鶏卵の微量摂取」, after getting the eczema into remission.
- No source I found singles out milk or wheat. The larger gap: an eczema baby gets everything else suggested freely, and the app never prompts "get the eczema treated first".

**11. At least 3 days between new mandatory allergens — UNSOURCED.**
- No Japanese official source sets a number of days between allergens, or a fixed wait after every new food.
- The nearest are Wakayama's "2–3 days on the same food", which is about getting used to it, and Minato's 「同じ食品を連続して与えないように注意」, which points the other way.
- It is a reasonable way to tell which food caused a reaction and carries low risk. Note that next-foods.ts:129 uses `startOfDay(+3)`, so the real gap is about 2.5 days.

**12. Re-expose at least weekly — PARTLY.**
- "Weekly" is Canadian guidance (CSACI) as quoted by Sakihara 2024, p.264: 「早期開始かつ定期的に摂取する（少なくとも週1回以上）」.
- Japanese guidance (JGFA2026 draft p.54) says regular, continued intake with no number.
- Applying it to all 29 labelling allergens (apple, gelatin, yam…) has no evidence behind it.

**13. Labelling lists as of 2026 — CONFIRMED.**
- The Consumer Affairs Agency sheet, 「令和８年４月時点」, lists the mandatory 9 and the recommended 20 exactly as in the app (https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/assets/food_labeling_cms204_260401_01.pdf).
- Its 2026-04-01 notice also sets 「２年間の経過措置期間」 for cashew. Packaged foods may legitimately not declare cashew until 2028.

**14. Honey not before 12 months; cow's milk as a drink not before 12 months — CONFIRMED.**
- Guide p.30: 「蜂蜜は…1歳を過ぎるまでは与えない」. Guide p.32: 「牛乳を飲用として与える場合は…１歳を過ぎてからが望ましい」.
- Cooking with milk starts at 中期, not before. Kyoto: 「離乳中期（７〜８か月頃）から料理に使うことはできます」. The app's `milk-whole` at stage 2 is correct.

## Missed by the rules

1. **Moving on only once the baby is used to a food (「慣れてきたら」).** Every step in the guide depends on acceptance. The app moves on by days since start plus "any one food logged", and never looks at how much the baby ate.
2. **All new foods, not just mandatory allergens, on a weekday during clinic hours.** 栄養食事指導の手引き p.16: 「初めての食物を与えるときは…充分に加熱し、少量から与える。平日の昼間に与えると…」. The app shows this advice only for mandatory allergens (next-foods.ts:272).
3. **Eczema should be treated before weaning starts** (手引き2023 表7, JGFA2026 draft 表6-2). Not modelled, and the eczema flag is opt-in.
4. **Egg yolk risks.**
   - JGFA2026 draft p.112: vomiting a few hours after yolk points to FPIES, a delayed non-IgE reaction.
   - p.113: hard-boiled yolk absorbs egg white the longer it sits.
   - Wakayama and Minato say to separate the yolk immediately after boiling. The seed note for yolk says neither.
5. **Texture progression** (p.32–34: 「なめらかにすりつぶした状態」 → 舌 → 歯ぐき, つぶしがゆ → 軟飯) and **no seasoning at the start** (p.33: 「離乳の開始時期は、調味料は必要ない」; 「油脂類も少量」). The rules don't encode either.
6. **Hard "not during weaning" items** from the start leaflet: 「香辛料（1歳まで）」, 「肉・魚・卵の生もの」, 「カフェイン」, 「のどに詰まりやすいもの」. The Consumer Affairs Agency 2021 warning adds cutting round foods into quarters. These live only in seed notes.
7. **Preterm and low-birth-weight babies.** Guide p.13: 「低出生体重児など個別の配慮が必要な子どもへのきめ細か な支援」. The app uses age from birth only. I did not verify a source requiring corrected age.
8. **Amounts are a guide, judged against the growth curve** (schedule sheet: 「この通りにいかなくても、成長曲線のカーブに沿っているなら大丈夫」). Buying for the upper bounds could read as a target to reach.
9. **Wheat is allowed in 初期** (Osaka lists udon, somen and bread; Minato has a 初期 bread porridge). The seed puts udon at stage 2, a small unnecessary delay.

## Overall assessment

1. As a Japanese paediatric dietitian I would not sign off on this as "consistent with official guidance". Portions, labelling lists, honey/milk and the fish/egg order are right; much of the rest is city practice or the author's own choices labelled as guidance.
2. The official guide gives no days, no one-per-day rule, no tofu-before-yolk rule and no 3-day spacing. Those are fine as practice, but the in-app wording must stop implying the Ministry says so.
3. Two real logic errors: protein opens 14 days after weaning started rather than about a week after vegetables, and the doctor message appears before the age check, so raw salmon roe gets "ask your paediatrician" at 6 months.
4. Eczema handling is too narrow: Japanese guidance puts the whole start of weaning under a doctor and asks for the eczema to be treated first, not just egg, milk and wheat.
5. Fix those three, reword "the one allergen not to delay", apply the weekday-daytime advice to every new food, and add a signal for how much the baby eats. Then it is a defensible Okinawa-style (Naha/Tomigusuku) practice tool.
