export const GENDERS = [
  "Woman",
  "Man",
  "Trans / Non-binary",
] as const;

export type Gender = (typeof GENDERS)[number];
