export const COIN_PACKAGES = [
  { id: "coins_100",  coins: 100,  price_eur: 10.99, price_cents: 1099, popular: false, bonus: 0,  label: "Starter",  per_coin: 0.110 },
  { id: "coins_300",  coins: 300,  price_eur: 27.99, price_cents: 2799, popular: false, bonus: 0,  label: "Standard", per_coin: 0.093 },
  { id: "coins_600",  coins: 600,  price_eur: 50.99, price_cents: 5099, popular: true,  bonus: 0,  label: "Popular",  per_coin: 0.085 },
  { id: "coins_1200", coins: 1200, price_eur: 94.99, price_cents: 9499, popular: false, bonus: 0,  label: "Pro",      per_coin: 0.079 },
  { id: "coins_2500", coins: 2500, price_eur: 184.99,price_cents: 18499,popular: false, bonus: 0,  label: "Elite",    per_coin: 0.074 },
  { id: "coins_5000", coins: 5000, price_eur: 339.99,price_cents: 33999,popular: false, bonus: 0,  label: "Ultimate", per_coin: 0.068 },
] as const

// First purchase bonus: +25% coins
export const FIRST_PURCHASE_BONUS = 0.25

// Split: seller gets 80%, platform gets 20%
export const SELLER_SHARE = 0.80
export const PLATFORM_SHARE = 0.20

// Face value: 1 Red Coin = €0.10
export const COIN_FACE_VALUE_EUR = 0.10

// Seller payout per coin (80% of face value)
export const COIN_SELL_RATE = 0.08  // EUR per coin
export const MIN_PAYOUT_COINS = 500
