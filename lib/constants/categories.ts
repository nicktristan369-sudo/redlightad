export const CATEGORIES = [
  "Escort",
  "Escort & Massage",
  "Massage",
  "Thai Massage",
  "OnlyFans / Online Content",
  "BDSM & Dominance",
  "Dating",
  "Swinger / Couples",
  "Virtual Sex",
  "Fetish",
  "Transgender",
  "Webcam",
] as const;

export type Category = (typeof CATEGORIES)[number];
