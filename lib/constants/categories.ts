export const CATEGORIES = [
  "Escort",
  "Massage",
  "Webcam",
  "Fetish",
  "Couples",
  "OnlyFans",
] as const;

export type Category = (typeof CATEGORIES)[number];
