import { differenceInDays } from 'date-fns';

/**
 * What is coming, and when the nights are likely to get worse.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * WHAT IS DELIBERATELY ABSENT, AND MUST STAY ABSENT
 *
 * No "developmental leaps" (Wonder Weeks), no "sleep regressions", no "growth
 * spurts". All three were researched and rejected on 2026-09-22:
 *
 *  - Wonder Weeks: the entire human evidence base is ~80-90 infants since 1992.
 *    The original study (van de Rijt-Plooij & Plooij 1992) is n=15 maternal
 *    self-report; the one independent replication failed (de Weerth & van Geert
 *    1998, Br J Dev Psychol 16:15-44, "The results failed to support the
 *    10-period pattern"). The site, the book and the 2019 edition publish three
 *    contradictory week tables, differing by 1-3 weeks on 6 of the 10 leaps, so
 *    there is no number to encode even if one wanted to.
 *  - "Sleep regression": zero hits in PubMed Title/Abstract, no MeSH heading, no
 *    ICSD-3 entry. And the data run the other way — Henderson 2010 (Pediatrics,
 *    n=75) shows 1-4 months is the fastest-IMPROVING window of the first year.
 *  - Growth spurts: the 3wk/6wk/3mo/6mo list traces to a La Leche League book
 *    with no primary source. The WHO meta-analysis (Rios-Leyvraz & Yao 2023,
 *    167 studies) fits a smooth log curve with no bumps at those ages.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * WHY THERE IS NO FRENCH WORD "RÉGRESSION" ANYWHERE IN THIS FILE
 *
 * The carnet de santé 2025 repeats on every exam page that "une régression des
 * compétences" must trigger neurodevelopmental screening; HAS reco299 says the
 * same. In French paediatrics the word is an autism red flag. Using it as
 * reassurance would import a clinical alarm term. Do not add it back.
 */

/** Average days in a month; the bands below are months, the app counts days. */
const DAYS_PER_MONTH = 30.4375;

export interface RoughNightBand {
  key: string;
  label: string;
  fromMonths: number;
  toMonths: number;
  /** Where inside the band it is worst, for the detail line. */
  peaksAtMonths: number[];
  what: string;
  caveat: string;
  source: string;
}

/**
 * The only two rough patches that are predictable from a calendar.
 *
 * Everything else that disturbs sleep — learning to crawl, to stand, to talk —
 * is keyed to the child rather than the date (Scher & Cohen 2005/2015,
 * Atun-Einy & Scher 2016, Waugh & Berger 2026), which is why those live in
 * WHO_MOTOR_WINDOWS as ranges instead of here as dates.
 */
export const ROUGH_NIGHT_BANDS: RoughNightBand[] = [
  {
    key: 'crying-peak',
    label: 'Pic de pleurs',
    fromMonths: 0.5,
    toMonths: 3.2,
    peaksAtMonths: [1.4],
    what: 'Les pleurs augmentent dès la 2ᵉ semaine, culminent vers 6 semaines, puis retombent vers 3-4 mois. Jusqu’à 2-3 h par jour au pic, souvent groupées en fin de journée.',
    caveat: 'Si rien ne la console et qu’elle ne se comporte pas comme d’habitude, si elle a de la fièvre ou vomit, appelez un professionnel — ce n’est pas ça.',
    source: 'Santé publique France (1000 premiers jours) · INSPQ Québec',
  },
  {
    key: 'separation',
    label: 'Angoisse de séparation',
    fromMonths: 8,
    toMonths: 18,
    peaksAtMonths: [9.5, 13.5],
    what: 'Les réveils nocturnes reprennent, et elle proteste au coucher. Deux pointes mesurées : vers 9 mois et demi, puis vers 13 mois et demi.',
    caveat: 'Environ 1 bébé sur 8 ne connaît pas du tout cette phase — sur 1 285 enfants suivis, 12 % deviennent moins craintifs au fil de la première année.',
    source: 'Kearsley 1975, Pediatrics (n=52) · Brooker 2013 (N=1 285) · INSPQ',
  },
];

export interface Checkpoint {
  ageMonths: number;
  /** Verbatim from the carnet de santé 2025 — paraphrasing defeats the point. */
  items: string[];
}

/**
 * The parent-facing boxes of the carnet de santé 2025 ("À X mois, votre
 * bébé : "), at the ages of the mandatory examinations.
 *
 * Deliberately NOT the clinician screening grids from the same carnet. Those
 * carry a referral rule — two "non" in two different colour bands sends you to
 * a PCO — and a parent self-scoring them either panics or is wrongly reassured.
 * These boxes were written for parents to read; the grids were not.
 */
export const CARNET_CHECKPOINTS: Checkpoint[] = [
  {
    ageMonths: 2,
    items: [
      'réagit à votre voix et gazouille',
      'commence à manifester des émotions comme la colère, la peur et la joie',
      'sur le ventre commence à soulever sa tête puis ses épaules',
      'commence à agripper certains objets',
    ],
  },
  {
    ageMonths: 3,
    items: [
      'comprend et exprime ses émotions',
      'réagit à votre voix et aux présences familières',
      'commence à soutenir sa tête',
      'sourit et bouge les 4 membres de manière symétrique',
    ],
  },
  {
    ageMonths: 4,
    items: [
      's’agite ou pleure pour attirer l’attention',
      's’arrête de pleurer au son de votre voix',
    ],
  },
  {
    ageMonths: 5,
    items: [
      'manifeste ses émotions',
      's’accroche à vous quand il est dans vos bras',
      'remarque la présence de personnes qu’il ne connaît pas',
    ],
  },
  {
    ageMonths: 8,
    items: [
      'tient bien assis',
      'aime jeter ses jouets pour que vous les ramassiez',
      'commence à faire les marionnettes, « au revoir » avec la main ou le bras',
    ],
  },
  {
    ageMonths: 11,
    items: [
      'exprime ses émotions',
      'comprend certaines phrases simples',
      'aime vous imiter (bravo, au revoir…)',
      'devient de plus en plus autonome',
      'explore le monde qui l’entoure avec beaucoup de curiosité',
    ],
  },
  {
    ageMonths: 12,
    items: [
      'reconnaît mieux les personnes et les visages différents',
      'fait des câlins/des bisous/des sourires',
    ],
  },
];

export type MotorStatus = 'before' | 'within' | 'after';

export interface MotorWindow {
  key: string;
  label: string;
  /** 1st and 99th percentile, in months. */
  p1: number;
  median: number;
  p99: number;
  note?: string;
}

/**
 * WHO Multicentre Growth Reference Study, windows of achievement (n=816, five
 * countries). The 1st-to-99th percentile spread is the point of showing these:
 * walking alone spans 8.2 to 17.6 months and every month of it is normal.
 *
 * Labels avoid gender agreement — the app does not know, and does not need to.
 */
export const WHO_MOTOR_WINDOWS: MotorWindow[] = [
  { key: 'sitting', label: 'Position assise sans appui', p1: 3.8, median: 5.9, p99: 9.2 },
  { key: 'standingWithAssistance', label: 'Debout avec appui', p1: 4.8, median: 7.4, p99: 11.4 },
  {
    key: 'crawling',
    label: 'Quatre pattes',
    p1: 5.2,
    median: 8.3,
    p99: 13.5,
    note: '4,3 % des enfants ne passent jamais par le quatre pattes.',
  },
  { key: 'walkingWithAssistance', label: 'Marche avec appui', p1: 5.9, median: 9.0, p99: 13.7 },
  { key: 'standingAlone', label: 'Debout sans appui', p1: 6.9, median: 10.8, p99: 16.9 },
  { key: 'walkingAlone', label: 'Marche autonome', p1: 8.2, median: 12.0, p99: 17.6 },
];

export interface DevelopmentOutlook {
  ageMonths: number;
  roughNights: {
    current: RoughNightBand[];
    upcoming: Array<RoughNightBand & { startsInDays: number }>;
  };
  nextCheckpoint: (Checkpoint & { inDays: number }) | null;
  motor: Array<MotorWindow & { status: MotorStatus }>;
}

/** Everything the timeline needs, from a birth date and a moment. */
export function getDevelopmentOutlook(
  birthDate: Date,
  now: Date = new Date(),
): DevelopmentOutlook {
  const ageMonths = differenceInDays(now, birthDate) / DAYS_PER_MONTH;
  const inDays = (months: number) => Math.round((months - ageMonths) * DAYS_PER_MONTH);

  const nextCheckpoint = CARNET_CHECKPOINTS.find((c) => c.ageMonths > ageMonths);

  return {
    ageMonths,
    roughNights: {
      current: ROUGH_NIGHT_BANDS.filter(
        (b) => ageMonths >= b.fromMonths && ageMonths < b.toMonths,
      ),
      upcoming: ROUGH_NIGHT_BANDS.filter((b) => ageMonths < b.fromMonths).map((b) => ({
        ...b,
        startsInDays: inDays(b.fromMonths),
      })),
    },
    nextCheckpoint: nextCheckpoint
      ? { ...nextCheckpoint, inDays: inDays(nextCheckpoint.ageMonths) }
      : null,
    motor: WHO_MOTOR_WINDOWS.map((m) => ({
      ...m,
      status: ageMonths < m.p1 ? 'before' : ageMonths > m.p99 ? 'after' : 'within',
    })),
  };
}
