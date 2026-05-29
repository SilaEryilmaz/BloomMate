export type NotificationMessage = {
  id: string;
  text: string;
  category: "compliment" | "quote";
  enabled: boolean;
};

export const NOTIFICATION_MESSAGES: NotificationMessage[] = [
  {
    id: "warm-01",
    text: "You are allowed to move gently today. Your pace is still progress. 🌷",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-02",
    text: "Tiny reminder: you do not need to earn rest. You can simply take it. ✨",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-03",
    text: "Your body is doing quiet, clever work. Be kind to it today. 🌙",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-04",
    text: "You bring softness and strength into the same room. That counts. 💛",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-05",
    text: "Check in with yourself like someone you love. Gently, honestly, warmly. 🤍",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-06",
    text: "You are doing enough for today, even if your energy is asking for softness. 🌸",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-07",
    text: "Your body is not being dramatic. It is communicating. You can listen kindly. 🫶",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-08",
    text: "There is no perfect way to be today. There is only a kind next step. 🍯",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-09",
    text: "You deserve a moment that feels like exhaling. Take one if you can. ☁️",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-10",
    text: "Your softness is not weakness. It is part of your wisdom. 🌼",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-11",
    text: "A little water, a little stretch, a little kindness. Tiny care counts. 💧",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-12",
    text: "You are allowed to change with your cycle. You do not have to feel the same every day. 🌗",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-13",
    text: "Your future self will thank you for one gentle choice today. 🌿",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-14",
    text: "You can be powerful and need a slower day. Both can be true. 🔆",
    category: "compliment",
    enabled: true
  },
  {
    id: "warm-15",
    text: "Your body has carried you through every day so far. That is quietly amazing. 💫",
    category: "compliment",
    enabled: true
  },
  {
    id: "quote-01",
    text: "Small care is still care. Give yourself one kind thing today. 🌻",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-02",
    text: "A beautiful day can begin with one slower breath. 🕊️",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-03",
    text: "You are not behind. You are living at the speed of a real person. 🧡",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-04",
    text: "Let today be lighter where it can be lighter. ✨",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-05",
    text: "Your mood is information, not a flaw. Listen with kindness. 🌙",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-06",
    text: "Energy is seasonal. Honor the season you are in today. 🍃",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-07",
    text: "A calm minute can change the shape of the whole afternoon. ☕",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-08",
    text: "Let your body be a place you return to with tenderness. 🌺",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-09",
    text: "You do not have to push through every signal. Some signals ask for care. 🤍",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-10",
    text: "Today does not need to be perfect to be meaningful. 🌞",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-11",
    text: "Give yourself the same patience you would give someone dear to you. 💐",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-12",
    text: "Your rhythm is yours. It does not need to match anyone else's. 🪷",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-13",
    text: "A gentle start is still a start. Begin softly. 🌤️",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-14",
    text: "You can hold ambition in one hand and compassion in the other. 🫶",
    category: "quote",
    enabled: true
  },
  {
    id: "quote-15",
    text: "Rest is not a pause from becoming. It is part of becoming. 🌙",
    category: "quote",
    enabled: true
  },
  {
    id: "quiet-disabled-example",
    text: "Disabled messages stay out of the app until you enable them in code.",
    category: "quote",
    enabled: false
  }
];

export const getEnabledNotificationMessages = () => NOTIFICATION_MESSAGES.filter((message) => message.enabled);

export const pickNotificationMessage = (index: number) => {
  const messages = getEnabledNotificationMessages();
  return messages[index % messages.length] ?? NOTIFICATION_MESSAGES[0];
};
