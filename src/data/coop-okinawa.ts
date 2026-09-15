/**
 * Where a family in Okinawa can buy each food. Coop products are from
 * すくすくスマイル 2026年6月号 (Coop Okinawa edition) and あっぷる 611; the range
 * rotates, so product names are hints, not a catalogue — no numbers or prices.
 * CO-OP brand items arrive the week after ordering; other brands in
 * すくすくスマイル take two weeks. Seasons: くゎっちーおきなわ, JAおきなわ.
 * Evidence: docs/superpowers/specs/2026-09-15-weaning-guidance-research/coop-okinawa.md
 */
export type BuyHint =
  | { kind: 'coop'; product: string; packGrams?: number; leadWeeks: 1 | 2 }
  | { kind: 'local'; name: string; months: readonly number[] }
  | { kind: 'store' };

const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const coop = (product: string, packGrams?: number, leadWeeks: 1 | 2 = 1): BuyHint =>
  ({ kind: 'coop', product, packGrams, leadWeeks });
const local = (name: string, months: readonly number[] = ALL_YEAR): BuyHint =>
  ({ kind: 'local', name, months });

const WHITE_OKAYU = coop('CO-OP きらきらステップ 白かゆ (8倍がゆ)', 260);

export const COOP_OKINAWA: Record<string, readonly BuyHint[]> = {
  'okayu-10x': [WHITE_OKAYU],
  'okayu-8x': [WHITE_OKAYU],
  carrot: [local('島にんじん', [10, 11, 12, 1, 2, 3]), coop('CO-OP 北海道のうらごしにんじん', 310)],
  kabocha: [local('島かぼちゃ', [10, 11, 12, 1, 2, 3, 4, 5, 6]), coop('CO-OP 北海道のうらごしかぼちゃ', 280)],
  spinach: [coop('CO-OP 九州のうらごしほうれん草', 120)],
  'broccoli-boiled': [coop('CO-OP 北海道のうらごしブロッコリー', 150)],
  'edamame-boiled': [coop('CO-OP 北海道のうらごし枝豆', 120)],
  'sweet-potato': [coop('ジーピーフーズ さつまいものうらごし', 240, 2)],
  'potato-boiled': [coop('パイオニアフーズ うらごしポテト', 400, 2)],
  'sweetcorn-boiled': [coop('ノースイ うらごしコーン', 200, 2)],
  'komatsuna-boiled': [coop('JAフーズみやざき こまつな 小さめカット', 180, 2)],
  'udon-boiled': [coop('CO-OP きらきらステップ やわらかいミニうどん', 480)],
  natto: [coop('CO-OP 国産大豆で作った納豆ペースト', 120)],
  'hikiwari-natto': [coop('CO-OP 国産大豆で作った納豆ペースト', 120)],
  cod: [coop('CO-OP 北海道産白身魚のほぐし身', 60)],
  shirasu: [coop('CO-OP 食塩不使用ふっくらしらす干し', 60)],
  shirasuboshi: [coop('CO-OP 食塩不使用ふっくらしらす干し', 60)],
  'silken-tofu': [coop('CO-OP 国産大豆カット絹とうふ', 360)],
  'salmon-boiled': [coop('松岡水産 小さめダイスカット秋鮭', 80, 2)],
  'chicken-sasami-boiled': [coop('いなば とりささみフレーク 食塩無添加', 210, 2)],
  'tuna-canned-water': [coop('いなば ライトツナフレーク 食塩・オイル無添加', 210, 2)],
  'beni-imo': [local('紅いも', [8, 9, 10, 11, 12, 1])],
  'togan-boiled': [local('シブイ')],
  banana: [local('島バナナ', [6, 7, 8, 9, 10])],
  'ta-imo': [local('田芋', [12, 1, 2, 3, 4])],
  'shima-dofu': [local('島豆腐')],
  'yushi-dofu': [local('ゆし豆腐')],
  'mozuku-desalted': [local('もずく (unseasoned)')],
  'tuna-boiled': [local('マグロ, very fresh')],
  'katsuo-boiled': [local('カツオ, very fresh')],
};

/** The first hint available that month; a local food out of season falls through. */
export function pickBuyHint(foodId: string, month: number): BuyHint {
  const hints = COOP_OKINAWA[foodId] ?? [];
  return hints.find((h) => h.kind !== 'local' || h.months.includes(month)) ?? { kind: 'store' };
}
