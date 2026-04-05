export const CATEGORIES = [
  "Escort",
  "Massage",
  "Webcam",
  "Fetish",
  "Couples",
] as const;

export type Category = (typeof CATEGORIES)[number];
