export const GENDERS = [
  "female",
  "male",
  "trans",
] as const;

export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<string, string> = {
  female: "Woman",
  male: "Man",
  trans: "Trans",
};
