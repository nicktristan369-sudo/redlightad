export type MarketplaceCategory = "photos" | "videos" | "camshow" | "underwear" | "toy" | "other";
export type ContentType = "image" | "video" | "physical";
export type MarketplaceStatus = "pending" | "approved" | "rejected";

export interface MarketplaceItem {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: MarketplaceCategory;
  coin_price: number;
  thumbnail_url: string | null;
  preview_url: string | null;
  teaser_url: string | null;       // 9-sec free teaser video
  full_content_urls: string[] | null;
  content_type: ContentType;
  stock: number | null;
  status: MarketplaceStatus;
  created_at: string;
  purchase_count: number;
  // joined fields
  seller_name?: string;
  seller_avatar?: string;
}

// Coin rates: buyer pays COIN_BUY_RATE per coin, seller gets COIN_SELL_RATE after 19% cut
export const COIN_BUY_RATE  = 0.08;  // USD per coin for buyer
export const COMMISSION_PCT = 0.19;   // 19% platform fee
export function coinsToEur(coins: number): string {
  return (coins * COIN_BUY_RATE * 0.92).toFixed(2); // rough EUR conversion
}
export function eurToCoins(eur: number): number {
  return Math.ceil((eur / 0.92) / COIN_BUY_RATE);
}

export interface MarketplacePurchase {
  id: string;
  buyer_id: string;
  item_id: string;
  coins_paid: number;
  created_at: string;
}

export const MARKETPLACE_CATEGORIES: { value: MarketplaceCategory; label: string }[] = [
  { value: "photos",    label: "Photos" },
  { value: "videos",    label: "Videos" },
  { value: "camshow",   label: "Cam Shows" },
  { value: "underwear", label: "Underwear" },
  { value: "toy",       label: "Toys" },
  { value: "other",     label: "Other" },
];

export const CATEGORY_LABELS: Record<MarketplaceCategory, string> = {
  photos:    "Photos",
  videos:    "Videos",
  camshow:   "Cam Show",
  underwear: "Underwear",
  toy:       "Toy",
  other:     "Other",
};

export type SortOption = "newest" | "popular" | "price_asc" | "price_desc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest",     label: "Newest" },
  { value: "popular",    label: "Most Popular" },
  { value: "price_asc",  label: "Lowest Price" },
  { value: "price_desc", label: "Highest Price" },
];
