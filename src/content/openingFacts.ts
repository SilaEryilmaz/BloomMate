export type OpeningFact = {
  id: string;
  title: string;
  body: string;
  category: "cycle" | "hormones" | "fertility" | "body-clues";
  enabled: boolean;
};

export const OPENING_FACTS: OpeningFact[] = [
  {
    id: "brain-ovary-signals",
    title: "Hormone messages",
    body: "Your brain and ovaries trade hormone signals all month, adjusting estrogen and progesterone like a tiny internal group chat.",
    category: "hormones",
    enabled: true
  },
  {
    id: "ovulation-shifts",
    title: "Ovulation can move",
    body: "Ovulation is not always exactly mid-cycle. Stress, sleep, travel, illness, and routine changes can shift timing.",
    category: "fertility",
    enabled: true
  },
  {
    id: "cervical-fluid",
    title: "A built-in clue",
    body: "Cervical fluid can change through the cycle. Around fertile days, it may become clearer, slipperier, or stretchier.",
    category: "body-clues",
    enabled: true
  },
  {
    id: "temperature-shift",
    title: "A subtle warm-up",
    body: "After ovulation, basal body temperature often rises slightly because progesterone has a warming effect.",
    category: "body-clues",
    enabled: true
  },
  {
    id: "luteal-phase",
    title: "The steadier half",
    body: "For many people, the luteal phase after ovulation is more consistent than the first half of the cycle.",
    category: "cycle",
    enabled: true
  },
  {
    id: "body-patterns",
    title: "Your body leaves hints",
    body: "Cravings, breast tenderness, energy dips, headaches, and sleep changes can all be cycle clues worth tracking.",
    category: "body-clues",
    enabled: true
  },
  {
    id: "uterine-lining",
    title: "A monthly reset",
    body: "A period is the uterine lining shedding when pregnancy does not happen that cycle. It is one phase of a larger rhythm.",
    category: "cycle",
    enabled: true
  },
  {
    id: "fertile-window",
    title: "Fertile days are a window",
    body: "The fertile window is more than one day because sperm can survive for several days, while an egg lives much less time.",
    category: "fertility",
    enabled: true
  }
];

const RECENT_LIMIT = 6;

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

export const getOpeningFacts = () => OPENING_FACTS.filter((fact) => fact.enabled);

export const pickOpeningFacts = (recentFactIds: string[], count = 2) => {
  const enabledFacts = getOpeningFacts();
  const recent = new Set(recentFactIds);
  const freshFacts = enabledFacts.filter((fact) => !recent.has(fact.id));
  const pool = freshFacts.length >= count ? freshFacts : enabledFacts;

  return shuffle(pool).slice(0, count);
};

export const mergeRecentFactIds = (previousIds: string[], shownIds: string[]) => {
  const merged = [...shownIds, ...previousIds.filter((id) => !shownIds.includes(id))];
  return merged.slice(0, RECENT_LIMIT);
};
