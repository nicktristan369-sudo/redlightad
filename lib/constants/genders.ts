export const GENDERS = [
  "Female",
  "Male",
  "Trans",
  "Couple",
] as const;

export type Gender = (typeof GENDERS)[number];
