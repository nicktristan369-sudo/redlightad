export const COIN_PACKAGES = [
  { id: "coins_100", coins: 100, price_usd: 9.99, price_cents: 999, popular: false, label: "Starter" },
  { id: "coins_250", coins: 250, price_usd: 19.99, price_cents: 1999, popular: false, label: "Standard" },
  { id: "coins_500", coins: 500, price_usd: 39.99, price_cents: 3999, popular: true, label: "Popular" },
  { id: "coins_1000", coins: 1000, price_usd: 69.99, price_cents: 6999, popular: false, label: "Premium" },
] as const

export const COIN_SELL_RATE = 0.065 // USD per coin for payout to seller
export const COIN_BUY_RATE = 0.08   // USD per coin for buyer
export const MIN_PAYOUT_COINS = 500
