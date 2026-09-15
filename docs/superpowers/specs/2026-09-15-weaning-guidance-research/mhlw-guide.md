# Official Japanese weaning (離乳食) guidance for the food-recommendation engine, checked 2026-09-15

**Short answer.** The 2019 「授乳・離乳の支援ガイド」 is still the current official guide. I found no revision, study group or addendum from 2024 to 2026. Two of the app's nutrient values are out of date under the 2025 intake standards:
- **Iron** for 6–11 months should be **4.5 mg/day** for both sexes, not 5.0.
- **Zinc** should be **2.0 mg/day**, not 3.0.
- **Vitamin D** at 5.0 µg/day is still correct.

The guide gives the **order** of foods but no timings in days or weeks. Rules like "one new food per day, in the morning" and "protein after about 2 weeks" come from city leaflets, not from the guide. Those rules can be used, but they should be labelled as practice rather than official.


---

## Q1. Which version of the guide is current

- **The 2019 edition is the current version.** こども家庭庁's (CFA) page lists only 「授乳・離乳の支援ガイド（平成31(2019)年3月）」, the 2007 edition, and the 2020 companion leaflets. There is no newer date on the page. **H**
  - Current document URL: https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/6790a829-15c7-49d3-9156-9e40e8d9c20c/b0946e59/20230401_policies_boshihoken_junyuu_01.pdf
  - Parent page: https://www.cfa.go.jp/policies/boshihoken/junyuu
  - The old MHLW URL (`mhlw.go.jp/content/11908000/000496257.pdf`) now returns **404**. The MHLW study-group page (`other-kodomo_129050_00001.html`) is also 404.
- **No revision notices in 2023–2026.** I searched the CFA's maternal and child health notice pages for 2023, 2024, 2025 and 2026 (up to 2026-09-03). No entry mentions 授乳, 離乳, ボツリヌス or 窒息. **H**
  - Source: https://www.cfa.go.jp/policies/boshihoken/tsuuchi/2026 (and the /2024 and /2025 pages)
- **A 2025 CFA guide still points to the 2019 edition.** In 「児童福祉施設等における食事の提供ガイド」 (令和7年9月), the CFA writes:
  - Quote: 「授乳や離乳食については、「授乳・離乳の支援ガイド」を参考に進めていきます。月齢や目安量にこだわった画一的な進め方ではなく…」, followed by the reference 「授乳・離乳の支援ガイド」（平成31年３月公表） and the CFA URL above.
  - Translation: "Breastfeeding and weaning follow the 'Support Guide'; not a uniform approach fixated on age or target amounts…"
  - Source: PDF p.8 of https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/5f30b36e-6d64-49c2-812f-71fdef462c98/9e082688/20250924-policies-boshihoken-jidoufukukshi-eiyou-01.pdf **H**
- **A revision may be coming (my inference).** The 令和7年乳幼児栄養調査 (national infant nutrition survey) ran in September 2025. Its results are due 「調査実施年の翌年9月末までに公表」, meaning by the end of September 2026. The survey's stated purpose is 「授乳・離乳の支援…のための基礎資料を得る」 (to gather baseline data for breastfeeding and weaning support).
  - Earlier surveys each came before a new guide: the 2005 survey before the 2007 guide, and the 2015 survey before the 2019 revision. A revision study group in 2026–27 is therefore plausible, but nothing has been announced.
  - Source: https://www.cfa.go.jp/resources/research/r7-eiyo-chosa **M** (the prediction is mine)
  - **The engine's rules should be easy to update when a new guide appears.**

---

## Q2. Progression logic in the 2019 guide

### Start and signs of readiness
- **Quote:** 「開始時期の子どもの発達状況の目安としては、首のすわりがしっかりして寝返りができ、５秒以上座れる、スプーンなどを口に入れても舌で押し出すことが少なくなる（哺乳反射の減弱）、食べ物に興味を示すなどがあげられる。その時期は生後５～６か月頃が適当である。ただし、子どもの発育及び発達には個人差があるので、月齢はあくまでも目安であり、子どもの様子をよく観察しながら、親が子どもの「食べたがっているサイン」に気がつくように進められる支援が重要である。」
- **Translation:** Signs of readiness are firm head control and rolling over, sitting for 5 seconds or more, less tongue-thrust when a spoon goes in, and interest in food. About 5–6 months is appropriate. Age is only a guide; watch for the child's "wants to eat" signs.
- **Source:** Guide §Ⅱ-2 2(1) 離乳の開始, p.30. **H**
- **Header of the stage table:** 「以下に示す事項は、あくまでも目安であり、子どもの食欲や成長・発達の状況に応じて調整する。」 ("Everything below is only a guide; adjust to the child's appetite and development.") p.34. **H**
- **General principle:** 「画一的な進め方にならないよう留意しなければならない」 ("care must be taken not to follow a uniform progression"). p.29. **H**
- **Silent:** the final 2019 text says nothing about corrected age for preterm babies. A 2018 draft proposed it, but it was not kept.

### Order of foods in the early stage (初期)
- **Quote:** 「離乳の開始は、おかゆ（米）から始める。新しい食品を始める時には離乳食用のスプーンで１さじずつ与え、子どもの様子をみながら量を増やしていく。慣れてきたらじゃがいもや人参等の野菜、果物、さらに慣れたら豆腐や白身魚、固ゆでした卵黄など、種類を増やしていく。」
- **Translation:** Start with rice porridge. Give each new food one weaning spoon at a time and increase while watching the child. Once used to it, add vegetables such as potato and carrot, and fruit. Once used to those, add tofu, white fish and hard-boiled egg yolk.
- **Source:** p.32 §(4)ア. **H**
- **Table wording for 初期:** 「つぶしがゆから始める。すりつぶした野菜等も試してみる。慣れてきたら、つぶした豆腐・白身魚・卵黄等を試してみる。」 and 「子どもの様子をみながら１日１回１さじずつ始める。」 p.34. **H**
- **Silent:** the guide gives **no number of days or weeks** before vegetables or protein, and **no number of days between new foods**. It only says 「慣れてきたら」 ("once used to it").
- **What cities say, as practice (not the official guide):**
  - **Naha city health centre** (那覇市保健所, "ごっくん期" slide 7):
    - Quotes: 「つぶしがゆを始めてから約１週間たったら…野菜を１さじからプラス」; 「野菜を始めてから約１週間たったら…たんぱく質を１さじからプラス」
    - Porridge amounts: 1 spoon on days 1–2, 2 on days 3–4, 3 on days 5–6, then 4, 5 and 6 spoons, reaching about 30 g on days 26–30.
    - Vegetables from days 7–10; tofu, white fish or egg yolk from days 11–15, reaching about 5–10 g.
    - Footnote: 「上記はあくまでも目安です」 ("only a guide").
    - Source: https://www.city.naha.okinawa.jp/_res/projects/default_project/_page_/001/002/836/gokkunn2022.pdf **H** (for what Naha says)
  - **Minato ward, Tokyo** (みなと保健所, 2023 text, p.3 calendar): porridge from week 1, vegetables from week 2 (day 8), protein (tofu, white fish, egg yolk) from week 3 (about day 15).
    - Quote: 「※ たんぱく質は、豆腐・白身魚・固ゆでした卵黄等を順番に与えましょう。」 ("Give protein foods in turn: tofu, white fish, hard-boiled yolk.")
    - Source: https://www.city.minato.tokyo.jp/documents/5755/r5_rinyushokutext.pdf **H**
  - **Annaka city** one-month plan: vegetables from day 8, tofu on day 21, white fish on day 30.
    - Quote: 「かぼちゃを3日間続けて問題なく食べることができたので、新しい食材「人参」を」 ("pumpkin went fine for 3 days in a row, so we tried carrot next").
    - Source: https://www.city.annaka.lg.jp/uploaded/attachment/4870.pdf **M** (a worked example, not a rule)

### Moving from 1 meal a day to 2, and from 2 to 3
- **2019 guide:**
  - Early stage: 「離乳食は１日１回与える。」 (one meal a day). p.30
  - Middle stage: 「生後７～８か月頃からは舌でつぶせる固さのものを与える。離乳食は１日２回にして生活リズムを確立していく。」 (from 7–8 months, tongue-mashable texture, two meals a day). p.31
  - Late stage: 「歯ぐきでつぶせる固さのものを与える。離乳食は１日３回にし…」 (9–11 months, gum-mashable texture, three meals a day). p.31
  - Completion: 「生後 12 か月から 18 か月頃…食事は１日３回となり、その他に１日１～２回の補食を必要に応じて与える。」 (12–18 months, three meals plus 1–2 snacks as needed). p.31
  - Confidence: **H**
- **The "one month" rule was removed in 2019.** The 2007 guide said 「離乳を開始して１か月を過ぎた頃から、離乳食は1日2回にしていく。」 ("from just over one month after starting, move to two meals a day"). The final 2019 text contains neither 「１か月を過ぎた」 nor 「１か月」 in the weaning section; I checked the full text.
  - 2007 wording source: Japan Pediatric Society (JPS) forum slides 19–20, which quote it as the then-current text: https://www.jpeds.or.jp/uploads/files/shokuiku_12-2.pdf **H**
- **Naha still teaches the one-month rule:** 「離乳開始後、約１か月間は１日１回食」「離乳開始して１か月を過ぎた頃から１日２回食にすすめます」 ("about one month on one meal a day, then two meals"). Naha's own middle-stage leaflet says 「離乳食をはじめて１～２か月したら１日２回に」 ("1–2 months after starting"). **H**
- **2019 hint about when protein comes in:** 「離乳食に慣れ、１日２回食に進む頃には、穀類（主食）、野菜（副菜）・果物、たんぱく質性食品（主菜）を組み合わせた食事とする。」 ("By the time the baby moves to two meals a day, meals combine grain, vegetables/fruit and protein"). p.32. So protein foods should already be established before two meals a day. **H**

### Middle, late and completion stages
- **Quote:** 「離乳が進むにつれ、魚は白身魚から赤身魚、青皮魚へ、卵は卵黄から全卵へと進めていく。食べやすく調理した脂肪の少ない肉類、豆類、各種野菜、海藻と種類を増やしていく。脂肪の多い肉類は少し遅らせる。野菜類には緑黄色野菜も用いる。ヨーグルト、塩分や脂肪の少ないチーズも用いてよい。牛乳を飲用として与える場合は、鉄欠乏性貧血の予防の観点から、１歳を過ぎてからが望ましい。」
- **Translation:** Fish goes from white fish to red fish to blue-backed fish. Egg goes from yolk to whole egg. Add easy-to-eat lean meat, beans, vegetables and seaweed. Delay fatty meat a little. Use green and yellow vegetables. Yogurt and low-salt, low-fat cheese are fine. Cow's milk **as a drink** is best after 1 year, to prevent iron-deficiency anaemia.
- **Source:** p.32. **H**
- **Silent:** the guide does not say chicken comes first, or at which stage yogurt or cheese start.
  - Osaka city's facility table (令和6年3月作成, p.30) fills this in:
    - Middle stage (7–8 months): 鶏レバー, 鶏ささみ, 赤身魚, 鮭, ツナ/さけ水煮缶, 納豆, 卵黄→全卵, 牛乳, ヨーグルト, チーズ
    - Late stage (9–11 months): 青皮魚, 牛赤身肉, 豚赤身肉, 鶏肉
    - Completion (1–1.5 years): 牛肉, 豚肉, ウインナー, ハム
    - Source: https://www.city.osaka.lg.jp/kodomo/cmsfiles/contents/0000309/309034/rinyuunosusumekata_202406.pdf **M** (municipal)
- **Seasoning and fat:** 「離乳の開始時期は、調味料は必要ない。離乳の進行に応じて、食塩、砂糖など調味料を使用する場合は、それぞれの食品のもつ味を生かしながら、薄味でおいしく調理する。油脂類も少量の使用とする。」 ("No seasoning at the start; later, light seasoning only; little oil or fat"). p.33. **H**
- **Texture:** 「初めは「つぶしがゆ」とし、慣れてきたら粗つぶし、つぶさないままへと進め、軟飯へと移行する。」 (mashed porridge, then coarse, then unmashed, then soft rice). p.32. **H**

### Pace for new foods
- **Exact official wording:** 「新しい食品を始める時には離乳食用のスプーンで１さじずつ与え、子どもの様子をみながら量を増やしていく。」 p.32. **H**
- **The official guide gives no spacing in days and no time of day.**
- **Practice sources:**
  - **Naha:** 「初めてあげる食材は、日中の病院があいている時間に、１日１種類１さじをあげてください。特にたんぱく質食品を与えるときは、赤ちゃんの体調がよく、機嫌がいい日を選んでみましょう。」 ("Give a new food during daytime clinic hours, one kind per day, one spoon; for protein foods, pick a day when the baby is well and in a good mood.") Source: https://www.city.naha.okinawa.jp/_res/projects/default_project/_page_/001/002/836/arerugi.pdf **H**
  - **Minato:** 「はじめて与えるものは、1さじからにしましょう。」 ("Start any new food at one spoon.") **H**
  - **"2–3 days per food":** only an informal example (Annaka). **I found no official or prefectural source that sets it as a rule. L**

### Amount per meal (「離乳食の進め方の目安」 table, p.34)
Read from the table image; the numbers match the CFA's 「ざっくり離乳食スケジュール」 leaflet exactly. **H**

| per meal | 初期 5–6 months | 中期 7–8 months | 後期 9–11 months | 完了期 12–18 months |
|---|---|---|---|---|
| Meals per day | 1 | 2 | 3 | 3 + 1–2 snacks |
| Texture | なめらかにすりつぶした状態 (smooth purée) | 舌でつぶせる固さ (tongue-mashable) | 歯ぐきでつぶせる固さ (gum-mashable) | 歯ぐきで噛める固さ (gum-chewable) |
| Grains (g) | no grams given ("start with mashed porridge") | 全がゆ 50–80 | 全がゆ 90 → 軟飯 80 | 軟飯 90 → ご飯 80 |
| Vegetables and fruit (g) | no grams ("try puréed vegetables") | 20–30 | 30–40 | 40–50 |
| Fish (g) | no grams ("then try tofu, white fish, yolk") | 10–15 | 15 | 15–20 |
| **or** meat (g) | – | 10–15 | 15 | 15–20 |
| **or** tofu (g) | – | 30–40 | 45 | 50–55 |
| **or** egg (count) | – | 卵黄1 – 全卵1/3 (1 yolk to 1/3 whole egg) | 全卵1/2 | 全卵1/2–2/3 |
| **or** dairy (g) | – | 50–70 | 80 | 100 |

The protein rows are **alternatives** (「又は」 = "or"). They are not added together.

CFA leaflet source: https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/6790a829-15c7-49d3-9156-9e40e8d9c20c/59a3df7e/20230401_policies_boshihoken_junyuu_06.pdf

### Foods to avoid
- **Honey:** 「蜂蜜は、乳児ボツリヌス症を引き起こすリスクがあるため、1歳を過ぎるまでは与えない。」 ("No honey until after 1 year, because of infant botulism.") p.30. **H**
  - MHLW adds: 「１歳未満の赤ちゃんにハチミツやハチミツ入りの飲料・お菓子などの食品は与えないようにしましょう」 and 「通常の加熱や調理では死にません」 (this includes drinks and sweets containing honey; normal cooking does not kill the spores). Source: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000161461.html **H**
  - **Brown sugar (黒糖):** relevant in Okinawa. The MHLW and Tokyo pages I checked do not mention it, so there is no official basis to add it.
- **Juice and ion drinks before weaning starts:** 「離乳の開始前に果汁やイオン飲料を与えることの栄養学的な意義は認められていない」 ("no recognised nutritional benefit"). p.30. **H**
- **Cow's milk as a drink:** after 1 year (quoted above).
- **The guide has no explicit raw fish or raw egg rule.** It only says to cook food thoroughly and mind hygiene (「加熱調理」, 「衛生面に十分に配慮」), and specifies hard-boiled yolk.
  - The CFA-hosted leaflet 「離乳スタートガイド」 (p.3) lists 「離乳食期に与えないで！」 ("don't give during weaning"):
    - はちみつ（1歳まで）
    - 牛乳（1歳までは加熱調理のみ） (cow's milk: cooked only until 1 year)
    - 香辛料（1歳まで） (spices until 1 year)
    - 肉・魚・卵の生もの (raw meat, fish, egg)
    - カフェイン
    - のどに詰まりやすいもの (foods that choke easily)
  - Source: https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/6790a829-15c7-49d3-9156-9e40e8d9c20c/20921f30/20230401_policies_boshihoken_junyuu_05.pdf **H**. This leaflet came from a 2019 commissioned study, not the guide itself.

### Food allergy
- **Quote:** 「食物アレルギーの発症を心配して、離乳の開始や特定の食物の摂取開始を遅らせても、食物アレルギーの予防効果があるという科学的根拠はないことから、生後５～６か月頃から離乳を始めるように情報提供を行う。」 ("There is no scientific evidence that delaying weaning or specific foods prevents allergy; advise starting at 5–6 months.") p.33. **H**
- **Quote:** 「食物アレルギーが疑われる症状がみられた場合、自己判断で対応せずに、必ず医師の診断に基づいて進める」 ("If symptoms suggest allergy, don't self-manage; always proceed on a doctor's diagnosis.") p.33. **H**
- **Eczema:** 「子どもに湿疹がある場合や既に食物アレルギーの診断がされている場合、または離乳開始後に発症した場合は、基本的には原因食物以外の摂取を遅らせる必要はないが、自己判断で対応することで状態が悪化する可能性も想定されるため、必ず医師の指示に基づいて行う」 ("With eczema, a diagnosed allergy, or allergy appearing after weaning starts, foods other than the culprit need not be delayed, but always act on a doctor's instructions.") p.33. **H**
- **Risk factors named:** 「特定の食物の摂取開始時期の遅れ」 (late introduction of specific foods). The main culprits are 「鶏卵、牛乳、小麦」 (egg, milk, wheat). p.33. **H**
- **CFA leaflet:** 「卵、乳製品、小麦は…怖がらずに少量で様子をみながら食べさせていきましょう。卵はしっかり加熱したものを卵黄から始めます。」 ("Don't be afraid of egg, dairy and wheat; give small amounts while watching. Start egg with well-cooked yolk.") **H**
- **Change from 2007:** egg yolk moved from 「生後７～８か月頃」 to 「生後５～６か月頃」 (Nara city summary of the revision). https://www.city.nara.lg.jp/uploaded/attachment/129567.pdf **H**
- **Japanese Society of Pediatric Allergy (JSPACI), 2017:** for babies with atopic dermatitis, 「医師の管理のもと、生後 6 か月から鶏卵の微量摂取を開始することを推奨」 (start tiny amounts of egg from 6 months under a doctor), and 「アトピー性皮膚炎を寛解させることが望ましい」 (clear the eczema first).
  - Step 1: from 6 months, 50 mg (about 0.2 g cooked whole egg).
  - Step 2: from 9 months, 250 mg (about 1.1 g).
  - Source: https://www.jspaci.jp/uploads/2017/06/teigen20170616.pdf **H**

### Iron, vitamin D, follow-up formula, formula in cooking
- **Iron and vitamin D:** 「母乳育児の場合、生後６か月の時点で、ヘモグロビン濃度が低く、鉄欠乏を生じやすいとの報告がある。また、ビタミンＤ欠乏の指摘もあることから、母乳育児を行っている場合は、適切な時期に離乳を開始し、鉄やビタミンＤの供給源となる食品を積極的に摂取するなど、進行を踏まえてそれらの食品を意識的に取り入れることが重要である。」
  - Translation: breastfed babies tend toward iron deficiency at 6 months, and vitamin D deficiency has been flagged. Start weaning on time and deliberately include iron and vitamin D sources.
  - Footnote 18 names sun exposure as a factor alongside intake. p.32. **H**
- **Follow-up formula:** 「フォローアップミルクは母乳代替食品ではなく、離乳が順調に進んでいる場合は、摂取する必要はない。離乳が順調に進まず鉄欠乏のリスクが高い場合や、適当な体重増加が見られない場合には、医師に相談した上で…活用すること等を検討する。」 ("Not a breast-milk substitute; unnecessary if weaning goes well; consider it only after consulting a doctor.") p.32. **H**
- **Formula in cooking:** the 2019 guide is **silent**. The 2007 version suggested formula instead of cow's milk for cooking after 9 months (JPS slides). The CFA leaflet p.4 says 「湯や出汁、溶いた育児用ミルクを活用します」 ("use hot water, dashi or made-up formula to thin food"). **H**
- **Iron-rich foods (CFA leaflet):** 大豆製品, 卵, 小松菜, ほうれん草, まぐろ, 豚肉, 牛肉, 青背の魚, レバー. **H**

### Baby food (ベビーフード)
- **Quotes (Column 2, p.35):**
  - 「離乳食は、手作りが好ましいが、ベビーフード等の加工食品を上手に使用することにより…負担が少しでも軽減するのであれば、それも一つの方法である。」 ("Home-made is preferable, but using baby food to lighten the load is a valid option.")
  - Checks listed: taste-test before serving, check temperature, use as a model for texture and size, avoid relying on one type of product, combine with vegetables and protein once on two meals, do not serve leftovers, and 「不足しがちな鉄分の補給源として、レバーなどを取り入れた製品の利用も可能」 (products containing liver can help with iron).
  - Confidence: **H**

---

## Q3. 日本人の食事摂取基準（2025年版）

Report page: https://www.mhlw.go.jp/stf/newpage_44138.html (files updated with the errata of 令和7年3月25日). The values apply for FY2025 to FY2029 (日本栄養士会 summary, **M**). Values below were read from the table images. **H**

| Nutrient | 6–8 months | 9–11 months | 1–2 years | Source |
|---|---|---|---|---|
| **Iron** mg/day | 6–11 months as one group, no 6–8/9–11 split. Male: average requirement 3.5, **recommended 4.5**. Female: average requirement 3.0, **recommended 4.5**. | (same) | Male 3.0 / **4.0**; Female 3.0 / **4.0** | `001316469.pdf` p.345 |
| **Zinc** mg/day | **Adequate intake 2.0** (both sexes, 6–11 months) | (same) | Male 2.5 / **3.5**; Female 2.0 / **3.0** | same file, p.346 |
| **Vitamin D** µg/day | **Adequate intake 5.0**, upper limit 25 (6–11 months) | (same) | **Adequate intake 3.5**, upper limit 25 | `001316466.pdf` p.182 |
| **Protein** g/day | **Adequate intake 15** | **Adequate intake 25** | Average requirement 15, **recommended 20** | `001316462.pdf` p.103 |
| **Energy** kcal/day (reference table 2) | Male **650**, Female **600** | Male **700**, Female **650** | Male **950**, Female **900** | `001316461.pdf` p.78 |
| Sodium (salt equivalent) | Adequate intake 600 mg (1.5 g salt), 6–11 months | (same) | Goal: Male < 3.0 g, Female < 2.5 g salt | `001316468.pdf` p.281 |

All files are under `https://www.mhlw.go.jp/content/10904750/`.

- **Corrections for the app:**
  - Iron 5.0 was the **2020** recommended value for boys. The 2025 value is **4.5 for both sexes**.
  - Zinc 3.0 was the **2020** adequate intake. The 2025 value is **2.0**.
  - Vitamin D 5.0 is **still correct**.
  - Cross-check: 母子栄養協会 also reports iron 5.0/4.5 → 4.5 and zinc 3 → 2. https://boshieiyou.org/syokujisessyukijyun2025/ **H**
- **These totals include milk.** Infant values are built on assumed milk intake: 「6～8か月、9～11か月…それぞれ 0.60 L/日、0.45 L/日を哺乳量とした」 (0.60 L/day and 0.45 L/day of breast milk or formula). Infant chapter `001316472.pdf` p.367. **H**
  - **The engine must not treat these numbers as targets for solid food alone.**

---

## Q4. Choking guidance

- **Consumer Affairs Agency (消費者庁, CAA), news release 2021-01-20:**
  - 「（１）豆やナッツ類など、硬くてかみ砕く必要のある食品は５歳以下の子どもには食べさせないでください。…小さく砕いた場合でも、気管に入りこんでしまうと肺炎や気管支炎になるリスクがあります。」 ("Don't give hard beans or nuts to children aged 5 and under; even crushed pieces can cause pneumonia if inhaled.")
  - 「（２）ミニトマトやブドウ等の球状の食品を丸ごと食べさせると、窒息するリスクがあります。乳幼児には、４等分する、調理して軟らかくするなどして、よくかんで食べさせましょう。」 ("Cut cherry tomatoes and grapes into quarters or cook them soft for infants and toddlers.")
  - The same report names うずらの卵 (quail eggs) among causes in accident data.
  - **Change:** the 2018 warning said 「3歳頃まで」 ("until about 3"); 2021 raised it to "5 and under".
  - Sources: https://www.caa.go.jp/policies/policy/consumer_safety/caution/caution_047/ (PDF p.1); Vol.549 (2021-04-08) 「ミニトマトや大粒のブドウは4等分」: https://www.caa.go.jp/policies/policy/consumer_safety/child/project_001/mail/20210408/ **H**
- **Childcare accident-prevention guideline (2016, now hosted by the CFA), main text:**
  - 「過去に、誤嚥、窒息などの事故が起きた食材（例：白玉風のだんご、丸のままのミニトマト等）は…使用しないことが望ましい。」 ("Foods involved in past choking accidents, such as rice-flour dumplings and whole cherry tomatoes, should preferably not be used.")
  - Its appended example list (from Urayasu city) avoids: プチトマト (can be served quartered), dry nuts and beans, うずらの卵, candy and ラムネ, spherical cheese (fine if heated), ぶどう/さくらんぼ, 餅, 白玉団子, いか.
  - For 0–1-year classes it avoids えび, 貝類 and the nori sheet on rice balls. こんにゃく is cut into 1 cm 糸こんにゃく.
  - Source: https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/03f45df9-97e1-4016-b0c3-8496712699a3/39b6fd36/20230607_policies_child-safety_effort_guideline_02.pdf (pp.2–3; example list pp.20–21). **H**
- **CFA "food sorting table" (食材整理表), from a 2024 study, re-issued January 2026:**
  - **Avoid:** もち, 白玉団子, 乾いたナッツ・豆類, ミニトマト (quarter if used), ぶどう (quarter and remove skin), さくらんぼ, 個装チーズ (heat), うずらの卵, アメ・ラムネ, いか, こんにゃく (use 糸こんにゃく).
  - **りんご and なし during all of weaning:** 「やわらかくなるまで加熱する ●生の状態、すりおろしただけの状態では与えない。」 ("Cook until soft; never raw or merely grated.")
  - **えび, 貝類, おにぎりのり:** 「離乳期に提供することは避ける」 ("avoid during weaning"); use shredded nori instead.
  - Sausage cut lengthwise; minced meat thickened; pieces "about 1 cm" from 1.5 years.
  - 「近年の誤嚥に関する重大事故は、離乳期のこどもが「りんご」、「パン」を食べた時に多く発生」 ("Recent serious choking accidents in weaning-age children mostly involved apple and bread.")
  - Source: https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/787dd8a4-3b44-4eed-a661-b9d0729f70c9/7b13cf0d/20260126_policies_child-safety_effort_tsuchi_42.pdf **H** (written for childcare facilities)
  - Same apple/pear rule in the CFA's Sept 2025 meal guide: 「りんごや梨をやむを得ず給食に使用する場合、離乳食完了期までは加熱して提供してください。」 PDF p.42. **H**
- **Japan Pediatric Society column (Ver.3, revised 2025-08-31):**
  - Grapes and cherry tomatoes: 「乳幼児（特に4歳以下）は1/4にカットする」 (quarter them, especially at 4 and under).
  - Peanuts and other beans: 「未就学児（特に5歳以下）には避ける」 (avoid before school age, especially 5 and under).
  - エビ, 貝類 and 焼き海苔: 「2歳以上になってから」 (from age 2).
  - Apple: 「離乳完了期までは、リンゴは加熱する（すりおろしても、大きめのカケラが混入する可能性がある）」 (cook it until weaning ends; grating can leave large pieces).
  - Sausage cut lengthwise; 糸こんにゃく cut to 1 cm.
  - Source: https://www.jpeds.or.jp/modules/guidelines/index.php?content_id=123 **H**

---

## Implications for a food-recommendation engine

1. **Start.** Do not suggest solids before 5 months. Treat 5–6 months plus the readiness signs (firm head control, sits 5 s or more, less tongue-thrust, interest in food) as the trigger. Present ages as 目安 (guides), never as hard gates. *Source: Guide p.30, p.34.*
2. **First food.** The first food is always rice porridge (つぶしがゆ), one spoon, once a day. *Guide p.32, p.34.*
3. **One new food at a time.** Every new food starts at one weaning spoon.
   - One new food per day, during daytime clinic hours: **practice, not official** (Naha, Minato). Suggest a weekday morning as a soft hint.
   - Do not enforce a 2–3 day gap as official; at most offer it as an optional setting.
4. **Vegetables and fruit.** Unlock only after porridge is accepted: `porridge_accepted && days_since_start ≥ ~7` (Naha and Minato practice). The guide itself only says 「慣れてきたら」 ("once used to it").
5. **Protein (tofu, then white fish, then hard-boiled yolk).** Unlock only after vegetables are accepted: `veg_accepted && days_since_start ≥ ~14` (Naha days 11–15, Minato week 3, Annaka day 21). All protein must be fully cooked.
6. **Egg.** Start with hard-boiled yolk in the early stage. Whole egg only after yolk is tolerated, in the middle stage or later (yolk 1 up to whole egg 1/3). Never raw or soft-cooked egg. *Guide p.32, p.34.*
   - If eczema or allergy is recorded: show "consult a doctor" and do not auto-advance allergens. *Guide p.33; JSPACI 2017.*
7. **One meal a day to two.** Offer two meals when both are true: at least about 1 month on one meal a day, **and** protein foods already accepted. Treat ~7 months as the official default.
   - The "1 month" rule is from the 2007 guide and Naha; the 2019 text is age-based only.
   - Move to three meals at ~9 months. At 12–18 months: three meals plus 1–2 snacks.
8. **Fish.** White fish, then red fish (middle stage), then blue-backed fish (late stage). *Guide p.32; Osaka p.30.*
9. **Meat.** Lean meat only. Chicken breast (ささみ) and liver from the middle stage, lean pork, beef and chicken from the late stage, fatty meat, sausage and ham at completion. The guide says only "lean first, fatty later"; the stage order is Osaka practice.
10. **Dairy.** Yogurt and low-salt cheese from the middle stage (Osaka practice; the guide table has a dairy row from the middle stage). Cow's milk only in cooking before 1 year; as a drink only after 12 months.
11. **Hard blocks, by age.**
    - Honey (and foods containing honey): until 12 months.
    - Whole or hard nuts and dry beans: until age 6 (5 and under).
    - Mochi, 白玉団子, candy and ラムネ: block for infants.
    - Whole cherry tomatoes and grapes: block unless quartered (and skinned for grapes).
    - Quail eggs and spherical cheese: block, or only if cut or heated.
    - Konnyaku: block, or 糸こんにゃく cut to 1 cm.
    - Squid: block.
    - Shrimp, shellfish and nori sheets: block during weaning; JPS says until age 2.
    - Raw apple or pear, including grated: block until 18 months; show "cook until soft" instead.
12. **Seasoning.** None at the start; light seasoning from the middle stage.
13. **Nutrient targets (6–11 months).** Iron 4.5 mg, zinc 2.0 mg, vitamin D 5.0 µg, sodium ≤1.5 g salt. For 1–2 years: iron 4.0, zinc 3.5 (boys) / 3.0 (girls), vitamin D 3.5. These include milk intake, so do not score solids against the full target.
14. **Iron nudges.** From 6 months, and especially for breastfed babies, bias suggestions toward iron-rich foods: red fish, lean meat, liver, egg, soy, 小松菜. Follow-up formula: never recommend it by default; only "ask a doctor" if weaning is stalled. *Guide p.32.*

## Where sources disagree or the guide is silent

- **One meal to two after "1 month":** in the 2007 guide and Naha's leaflet (Naha's other leaflet says 1–2 months), but not in the 2019 guide.
- **Timing of vegetables, protein and new-food spacing:** the guide is silent. Days and weeks come only from city leaflets.
- **Grated raw apple:** a common home first food and still in older municipal material (Osaka's table lists 「すりおろしてとろみ」, grated and thickened, though its header says food is basically cooked). The CFA 2025/2026 materials and JPS 2025 say cook it until 18 months. **Follow the stricter rule.**
- **Nori:** Osaka lists 焼きのり (toasted nori) in the middle stage, while the CFA table and JPS avoid sheet nori until 2 years. Treat shredded, crumbled nori and whole sheets as separate items.
- **Peanut:** the CAA choking warning covers hard nuts and beans and says crushed pieces are still risky. Allergy research presented at the JSPACI 2024 meeting favours early peanut in a safe form. There is **no official Japanese guideline on peanut paste or powder**, so do not suggest peanut; leave it to a doctor.
- **Egg for eczema babies:** the guide says yolk in the early stage plus a doctor's advice. JSPACI recommends a doctor-supervised micro-dose of cooked **whole** egg from 6 months. Both agree on "don't delay" and "under a doctor".
- **Shrimp and shellfish:** the guide is silent. Facility materials say avoid during weaning; JPS says from age 2.
- **Guide is also silent on:** corrected age for preterm babies, brown sugar, formula in cooking (the 2007 advice was dropped), and the order in which meats are introduced.
- **Much of the choking material targets childcare facilities.** The CFA food-sorting table, the 2016 facility guideline and Osaka's chart are written for daycare. Applying them at home is a reasonable conservative choice, but they are not addressed to parents.
