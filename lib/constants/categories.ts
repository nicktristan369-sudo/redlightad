export const CATEGORIES = [
  "Escort",
  "Massage",
  "Webcam",
  "Fetish",
  "Trans",
  "Male escort",
] as const;

export type Category = (typeof CATEGORIES)[number];
