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
 * EXPECTED_MILESTONES as windows instead of here as dates.
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

export type MilestoneDomain = 'motor' | 'hands' | 'language' | 'social' | 'play' | 'teeth' | 'sleep';

/**
 * A step a parent can tick when it happens. `early`, `typical` and `late` are
 * months; what they mean depends on the source (1st–99th percentile, mean ± 1
 * SD, first occurrence, CDC 75th percentile…) and is spelt out beside each
 * group below. A bound the sources do not give is null rather than guessed:
 * `late` is null when a real share of children have still not done it at the
 * end of the study, `early` and `typical` when no study reports them. At least
 * one of `typical` and `late` is set — it decides the row.
 */
export interface ExpectedMilestone {
  key: string;
  label: string;
  domain: MilestoneDomain;
  early: number | null;
  typical: number | null;
  late: number | null;
  note?: string;
  source: string;
}

const WHO_SOURCE = 'OMS, étude multicentrique (n=816) — 1ᵉʳ au 99ᵉ percentile';
const JSPD_SOURCE = 'Société japonaise de dentisterie pédiatrique 2019 (n=8 724) — moyenne ± 1 écart-type';
const HENDERSON_SOURCE = 'Henderson 2010, Pediatrics (n=75) — première fois';

/**
 * Motor windows from the WHO Multicentre Growth Reference Study (n=816, five
 * countries). early/typical/late are the 1st percentile, median and 99th
 * percentile: walking alone spans 8.2 to 17.6 months and every month of it is
 * normal.
 */
const WHO_MOTOR: ExpectedMilestone[] = [
  { key: 'sitting', label: 'Assis sans appui', domain: 'motor', early: 3.8, typical: 5.9, late: 9.2, source: WHO_SOURCE },
  { key: 'standingWithAssistance', label: 'Debout avec appui', domain: 'motor', early: 4.8, typical: 7.4, late: 11.4, source: WHO_SOURCE },
  {
    key: 'crawling', label: 'Quatre pattes', domain: 'motor', early: 5.2, typical: 8.3, late: 13.5,
    note: '4,3 % des enfants ne passent jamais par le quatre pattes.', source: WHO_SOURCE,
  },
  { key: 'walkingWithAssistance', label: 'Marche avec appui', domain: 'motor', early: 5.9, typical: 9.0, late: 13.7, source: WHO_SOURCE },
  { key: 'standingAlone', label: 'Debout sans appui', domain: 'motor', early: 6.9, typical: 10.8, late: 16.9, source: WHO_SOURCE },
  { key: 'walkingAlone', label: 'Premiers pas seul', domain: 'motor', early: 8.2, typical: 12.0, late: 17.6, source: WHO_SOURCE },
];

/**
 * Japanese Society of Pediatric Dentistry, national survey 2015-16 (小児歯科学雑誌
 * 57(1):45-53, 2019, n=8 724). early/late are the society's own standard
 * eruption period, mean ± 1 SD (Table 8), boys and girls merged: about one
 * child in six is earlier and one in six later, both normal. typical is the
 * mean of the two sexes. Japanese norms, because that is where she lives; they
 * run about a month earlier than the 1988 table many clinics still show.
 */
const JSPD_TEETH: ExpectedMilestone[] = [
  {
    key: 'firstTooth', label: 'Première dent', domain: 'teeth', early: 5, typical: 7, late: 9,
    note: 'Presque toujours une incisive du bas. Vue chez des bébés en bonne santé entre 3 et 14 mois.',
    source: JSPD_SOURCE,
  },
  { key: 'upperCentralIncisors', label: 'Incisives centrales du haut', domain: 'teeth', early: 7, typical: 9, late: 11, source: JSPD_SOURCE },
  { key: 'upperLateralIncisors', label: 'Incisives latérales du haut', domain: 'teeth', early: 9, typical: 11, late: 14, source: JSPD_SOURCE },
  { key: 'lowerLateralIncisors', label: 'Incisives latérales du bas', domain: 'teeth', early: 9, typical: 12, late: 15, source: JSPD_SOURCE },
  {
    key: 'firstMolars', label: 'Premières molaires', domain: 'teeth', early: 13, typical: 16, late: 19,
    note: 'Chez les enfants japonais, elles arrivent avant les canines.', source: JSPD_SOURCE,
  },
  {
    key: 'canines', label: 'Canines', domain: 'teeth', early: 14, typical: 18, late: 21,
    note: 'Les filles un mois plus tard que les garçons en moyenne (15 à 21 mois).', source: JSPD_SOURCE,
  },
  {
    key: 'secondMolars', label: 'Deuxièmes molaires', domain: 'teeth', early: 23, typical: 28, late: 35,
    note: 'Souvent après 2 ans ; ce sont les dents dont l’âge varie le plus.', source: JSPD_SOURCE,
  },
];

/**
 * Henderson et al. 2010, Pediatrics 126(5):e1081 — 75 New Zealand infants,
 * monthly diaries checked on video. These are FIRST occurrences, which is what
 * a parent ticks: early is the most likely age, typical the age by which half
 * had done it. A real share had never done it at 12 months, so late is null.
 * One good night does not make every night good (Pennestri 2018, n=388: 43 %
 * of 12-month-olds do not usually sleep 8 hours straight, with no link to
 * development) — hence the notes.
 */
const HENDERSON_SLEEP: ExpectedMilestone[] = [
  {
    key: 'firstNight8h', label: 'Première nuit de 8 h d’affilée', domain: 'sleep', early: 2, typical: 3, late: null,
    note: 'Environ 15 % des bébés ne l’ont jamais fait à 1 an. Une bonne nuit ne veut pas dire que toutes le seront.',
    source: HENDERSON_SOURCE,
  },
  {
    key: 'firstNight22to6', label: 'Première nuit de 22 h à 6 h sans réveil', domain: 'sleep', early: 3, typical: 5, late: null,
    note: 'Environ 28 % des bébés ne l’ont jamais fait à 1 an, et c’est normal : à 12 mois, 43 % ne dorment pas 8 h d’affilée d’habitude (Pennestri 2018).',
    source: HENDERSON_SOURCE,
  },
];

/**
 * More motor steps, and the hands. Two kinds of source:
 *  - MHLW 2023 national survey (令和5年 乳幼児身体発育調査, 表9), pass rates by
 *    one-month band: early = start of the first band ≥ 5 %, typical = middle
 *    of the band crossing 50 %, late = end of the first band ≥ 90 %. Only for
 *    items the WHO study does not cover: its sitting and walking definitions
 *    are stricter than the WHO ones and must not be mixed with them.
 *  - Everything else has an upper bound only — the CDC 2022 age by which 3
 *    children in 4 do it, with the Dutch Van Wiechen 90th percentile in notes.
 * Belly crawling is the weakest row in the table: one study of 28 babies,
 * nearly half of whom skipped it.
 */
const cdc = (months: number) => `CDC 2022 (3 sur 4 à ${months} mois)`;
const MHLW_SOURCE = 'Enquête nationale japonaise 2023 — 5 %, 50 % et 90 % des bébés';

const MORE_MOTOR: ExpectedMilestone[] = [
  { key: 'headControl', label: 'Tient bien sa tête', domain: 'motor', early: 2, typical: 3.5, late: 5, source: MHLW_SOURCE },
  {
    key: 'rollsBackToTummy', label: 'Se retourne du dos sur le ventre', domain: 'motor', early: 3, typical: 4.5, late: 7,
    source: MHLW_SOURCE,
  },
  { key: 'rollsTummyToBack', label: 'Se retourne du ventre sur le dos', domain: 'motor', early: null, typical: null, late: 6, source: cdc(6) },
  {
    key: 'bellyCrawls', label: 'Rampe sur le ventre', domain: 'motor', early: 5, typical: null, late: 12,
    note: 'Beaucoup de bébés sautent cette étape et passent directement au quatre pattes : 13 sur 28 dans la seule étude qui l’a suivie.',
    source: 'Adolph 1998 (n=28) · Van Wiechen 2021 — peu de données',
  },
  { key: 'getsToSitting', label: 'S’assoit tout seul', domain: 'motor', early: null, typical: null, late: 9, source: cdc(9) },
  { key: 'pullsToStand', label: 'Se met debout en s’agrippant', domain: 'motor', early: 6, typical: 8.5, late: 12, source: MHLW_SOURCE },
  { key: 'climbsOnFurniture', label: 'Grimpe sur le canapé et en redescend', domain: 'motor', early: null, typical: null, late: 18, source: cdc(18) },
  { key: 'walksUpStairs', label: 'Monte quelques marches, même aidé', domain: 'motor', early: null, typical: null, late: 24, source: cdc(24) },
  { key: 'runs', label: 'Court', domain: 'motor', early: null, typical: null, late: 24, source: cdc(24) },
  { key: 'kicksBall', label: 'Tape dans un ballon', domain: 'motor', early: null, typical: null, late: 24, source: cdc(24) },
];

const HANDS: ExpectedMilestone[] = [
  {
    key: 'graspsObject', label: 'Attrape un objet', domain: 'hands', early: 3, typical: null, late: 6,
    source: 'Échelle nationale israélienne · Van Wiechen 2021 (9 sur 10 à 6 mois)',
  },
  { key: 'transfersHands', label: 'Passe un objet d’une main à l’autre', domain: 'hands', early: null, typical: null, late: 9, source: cdc(9) },
  { key: 'rakesSmallBits', label: 'Ratisse les petits morceaux avec les doigts', domain: 'hands', early: null, typical: null, late: 9, source: cdc(9) },
  { key: 'bangsTwoObjects', label: 'Tape deux objets l’un contre l’autre', domain: 'hands', early: null, typical: null, late: 9, source: cdc(9) },
  {
    key: 'pincerGrasp', label: 'Attrape un petit objet entre le pouce et l’index', domain: 'hands', early: null, typical: null, late: 12,
    note: 'Aux Pays-Bas, 9 enfants sur 10 à 1 an.', source: cdc(12),
  },
  { key: 'putsInContainer', label: 'Met un objet dans un récipient', domain: 'hands', early: null, typical: null, late: 12, source: cdc(12) },
  {
    key: 'stacksTwoBlocks', label: 'Empile deux cubes', domain: 'hands', early: null, typical: null, late: 15,
    note: 'Aux Pays-Bas, 9 enfants sur 10 à 18 mois.', source: cdc(15),
  },
  { key: 'drinksFromCup', label: 'Boit seul dans un verre sans couvercle', domain: 'hands', early: null, typical: null, late: 18, source: cdc(18) },
  { key: 'scribbles', label: 'Gribouille', domain: 'hands', early: null, typical: null, late: 18, source: cdc(18) },
  {
    key: 'usesSpoon', label: 'Mange seul à la cuillère', domain: 'hands', early: null, typical: null, late: 24,
    note: 'La plupart essaient dès 18 mois.', source: cdc(24),
  },
];

/**
 * Language, social and play. Weaker evidence than the WHO motor windows, and
 * it shows in the nulls. Sources, and what their numbers mean:
 *  - CDC/AAP 2022 (Zubler et al., Pediatrics): the age by which at least 3
 *    children in 4 do it — a 75th percentile, so one child in four is later
 *    and fine. Most `late` values below are this.
 *  - Wordbank (Frank et al., MacArthur-Bates CDI, several languages): the age
 *    at which half the children do it. Most `typical` values are this. French
 *    learners gesture a little later than the average.
 *  - Dosman 2012 (Paediatr Child Health): typical age ranges, low-grade
 *    evidence by its own account; used for `early` where nothing better exists.
 *  - Van Wiechen 2021 (The Hague, n≈7 000), SWYC 2019 (Sheldrick), Schneider
 *    2015: shares of children passing at a given age, quoted in the notes.
 * Research notes: docs/superpowers/specs/2026-09-27-milestone-calendar-research/.
 */
const LANGUAGE_SOCIAL: ExpectedMilestone[] = [
  {
    key: 'socialSmile', label: 'Premier sourire en réponse', domain: 'social', early: null, typical: null, late: 2,
    note: 'Aux Pays-Bas, 99 % des bébés sourient en retour vers 7-8 semaines.',
    source: 'CDC 2022 (3 sur 4 à 2 mois) · Van Wiechen 2021',
  },
  { key: 'coos', label: 'Gazouille (« aah », « ooo »)', domain: 'language', early: 2, typical: null, late: 4, source: 'Dosman 2012 · CDC 2022 (3 sur 4 à 4 mois)' },
  { key: 'laughsOutLoud', label: 'Premier éclat de rire', domain: 'social', early: 3, typical: null, late: 6, source: 'Dosman 2012 · CDC 2022 (3 sur 4 à 6 mois)' },
  { key: 'blowsRaspberries', label: 'Fait des bruits de lèvres (« prrr »)', domain: 'language', early: null, typical: null, late: 6, source: 'CDC 2022 (3 sur 4 à 6 mois)' },
  {
    key: 'canonicalBabbling', label: 'Babille « ba-ba », « da-da »', domain: 'language', early: 5, typical: 6, late: 10,
    note: 'Dans les études, tous les bébés au développement typique babillaient à 10 mois.',
    source: 'Études sur le babillage canonique · CDC 2022',
  },
  { key: 'respondsToName', label: 'Se retourne à l’appel de son prénom', domain: 'social', early: null, typical: 6, late: 9, source: 'SWYC 2019 · CDC 2022 (3 sur 4 à 9 mois)' },
  {
    key: 'strangerWariness', label: 'Se méfie d’un inconnu', domain: 'social', early: 5, typical: null, late: 9,
    note: 'Dépend du tempérament : certains enfants ne le montrent jamais clairement.',
    source: 'Carnet de santé 2025 · CDC 2022 (3 sur 4 à 9 mois)',
  },
  { key: 'laughsAtPeekaboo', label: 'Rit au jeu « coucou-caché »', domain: 'play', early: null, typical: 9, late: 12, source: 'SWYC 2019 · CDC 2022' },
  { key: 'liftsArms', label: 'Tend les bras pour être porté', domain: 'social', early: 9, typical: 10.5, late: 12, source: 'Wordbank (la moitié à 10,5 mois) · Dosman 2012' },
  { key: 'showsObject', label: 'Tend un objet pour vous le montrer', domain: 'social', early: 9, typical: 9.1, late: 15, source: 'Wordbank · CDC 2022 (3 sur 4 à 15 mois)' },
  {
    key: 'wavesByeBye', label: 'Fait « au revoir » de la main', domain: 'social', early: 8, typical: 10.3, late: 12,
    note: 'Aux Pays-Bas, 92 % le font vers 11 mois.',
    source: 'Wordbank · CDC 2022 · carnet de santé 2025',
  },
  { key: 'playsPatACake', label: 'Joue à « bravo » en tapant des mains', domain: 'play', early: null, typical: null, late: 12, source: 'CDC 2022 (3 sur 4 à 12 mois) · carnet de santé 2025' },
  { key: 'firstPoint', label: 'Pointe du doigt pour demander', domain: 'language', early: 9, typical: 10.4, late: 15, source: 'Wordbank · CDC 2022 (3 sur 4 à 15 mois)' },
  { key: 'pointsToShow', label: 'Pointe pour vous montrer quelque chose', domain: 'social', early: 12, typical: null, late: 18, source: 'Dosman 2012 · CDC 2022 (3 sur 4 à 18 mois)' },
  {
    key: 'mamaDada', label: 'Dit « maman » ou « papa » au bon parent', domain: 'language', early: null, typical: 10, late: 12,
    note: 'Plus de la moitié des enfants disent leur premier mot à 10 mois, plus de 3 sur 4 à 1 an.',
    source: 'Schneider 2015 · CDC 2022',
  },
  { key: 'understandsNo', label: 'S’arrête quand on dit « non »', domain: 'language', early: 6, typical: null, late: 12, source: 'Dosman 2012 · CDC 2022 (3 sur 4 à 12 mois)' },
  { key: 'firstOtherWord', label: 'Premier mot autre que « maman » ou « papa »', domain: 'language', early: null, typical: null, late: 15, source: 'CDC 2022 (3 sur 4 à 15 mois) · Van Wiechen 2021' },
  {
    key: 'followsOneStep', label: 'Suit une consigne simple sans geste', domain: 'language', early: 12, typical: null, late: 18,
    note: 'Par exemple « donne-moi le ballon », sans tendre la main.',
    source: 'Dosman 2012 · CDC 2022 (3 sur 4 à 18 mois)',
  },
  {
    key: 'threeWords', label: 'Dit 3 mots', domain: 'language', early: null, typical: null, late: 18,
    note: 'En plus de « maman » et « papa ». Aux Pays-Bas, 90 % vers 18 mois.',
    source: 'CDC 2022 · Van Wiechen 2021',
  },
  {
    key: 'tenWords', label: 'Dit 10 mots', domain: 'language', early: null, typical: null, late: 16,
    note: 'Un enfant sur quatre y arrive avant 13 mois, trois sur quatre avant 16 (données norvégiennes).',
    source: 'Wordbank',
  },
  { key: 'pointsToBodyParts', label: 'Montre 2 parties du corps quand on les nomme', domain: 'language', early: null, typical: null, late: 24, source: 'CDC 2022 (3 sur 4 à 24 mois)' },
  { key: 'blowsKiss', label: 'Envoie un bisou de la main', domain: 'social', early: null, typical: 16, late: 24, source: 'Wordbank · CDC 2022' },
  {
    key: 'twoWordPhrase', label: 'Première phrase de 2 mots (« encore lait »)', domain: 'language', early: null, typical: 19, late: 24,
    note: 'Environ 9 enfants sur 10 à 25 mois.',
    source: 'Wordbank · CDC 2022',
  },
  {
    key: 'pretendPlay', label: 'Premier jeu de « faire semblant »', domain: 'play', early: 13, typical: null, late: 30,
    note: 'Par exemple donner à manger à une poupée ou à un doudou.',
    source: 'Dosman 2012 · CDC 2022 (3 sur 4 à 30 mois)',
  },
];

/** The month a step is shown in: its typical age, or failing that its upper bound. */
export const placedAt = (m: ExpectedMilestone): number => (m.typical ?? m.late) as number;

/** Every step the calendar offers to tick. */
export const EXPECTED_MILESTONES: readonly ExpectedMilestone[] = [
  ...WHO_MOTOR,
  ...MORE_MOTOR,
  ...HANDS,
  ...LANGUAGE_SOCIAL,
  ...JSPD_TEETH,
  ...HENDERSON_SLEEP,
];
