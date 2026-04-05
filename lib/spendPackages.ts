// Premium abonnement pakker (betalt med Red Coins)
export const PREMIUM_PACKAGES = [
  { id: "premium_1m",  months: 1,  coins: 500,  label: "1 måned",    popular: false, discount: 0 },
  { id: "premium_3m",  months: 3,  coins: 1350, label: "3 måneder",  popular: true,  discount: 10 },
  { id: "premium_6m",  months: 6,  coins: 2400, label: "6 måneder",  popular: false, discount: 20 },
  { id: "premium_12m", months: 12, coins: 4200, label: "12 måneder", popular: false, discount: 30 },
] as const

// Push to Top pakker
export const BOOST_PACKAGES = [
  { id: "boost_6h",  hours: 6,  coins: 50,  label: "6 timer"  },
  { id: "boost_24h", hours: 24, coins: 100, label: "24 timer", popular: true },
  { id: "boost_72h", hours: 72, coins: 250, label: "72 timer" },
] as const
