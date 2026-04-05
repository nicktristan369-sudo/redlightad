// Premium abonnement pakker (betalt med Red Coins)
export const PREMIUM_PACKAGES = [
  { id: "premium_1m",  months: 1,  coins: 500,  label: "1 måned",    popular: false, discount: 0 },
  { id: "premium_3m",  months: 3,  coins: 1350, label: "3 måneder",  popular: true,  discount: 10 },
  { id: "premium_6m",  months: 6,  coins: 2400, label: "6 måneder",  popular: false, discount: 20 },
  { id: "premium_12m", months: 12, coins: 4200, label: "12 måneder", popular: false, discount: 30 },
] as const

// Push to Top pakker — score-baseret rangering (ingen timer)
// Jo flere coins du bruger, jo højere score → jo højere placering
// Samme score = nyeste push vinder
export const BOOST_PACKAGES = [
  { id: "boost_50",   coins: 50,   label: "Lille Push",  popular: false, description: "Kom højere op end gratis profiler" },
  { id: "boost_150",  coins: 150,  label: "Medium Push", popular: false, description: "Overgå de fleste konkurrenter" },
  { id: "boost_500",  coins: 500,  label: "Stor Push",   popular: true,  description: "Dominér din by og kategori" },
  { id: "boost_1000", coins: 1000, label: "Mega Push",   popular: false, description: "Absolut topplacering — #1 på forsiden" },
] as const
