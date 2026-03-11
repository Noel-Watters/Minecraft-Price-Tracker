export interface Exchange {
  [key: string]: unknown; 
  ts: string;
  input_item_id: string;
  input_qty: number;
  output_item_id: string;
  output_qty: number;
  exchange_possible: boolean;
  compacted_input: string;
  compacted_output: string;
  shop: string;
  x: number;
  y: number;
  z: number;
  output_enchantments?: string;
  input_enchantments?: string;
  output_item_name?: string;
  input_item_name?: string;
  kind?: string;
  price_d_per_unit?: number;
}

export interface FloatingExchange {
  shop_id: string;
  item_id: string;
  item_name: string;
  per_diamond: number;
  per_item: number;
}

export const EXCHANGE_TABS = ["sell", "buy", "trade"] as const;
export type ExchangeTab = (typeof EXCHANGE_TABS)[number];

export const EXCHANGE_TAB_LABELS: Record<ExchangeTab, string> = {
  sell: "For Sale",
  buy: "Buying",
  trade: "Trade",
};

export type ItemDescriptorTone = "danger" | "info";

export interface ItemDescriptor {
  label: string;
  tone: ItemDescriptorTone;
}

/**
 * Normalize item ID into a more human-readable form.
 * e.g. "diamond_sword" → "Diamond Sword"
 */
export function formatItemId(id: string): string {
  return id
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Map item IDs to the IDs expected by the icon CDN.
 * Handles a few special cases and aliases.
 */
export function normalizeItemImageId(id: string): string {
  let out = id;
  if (id.endsWith("_armor_trim")) {
    out = `${id}_smithing_template`;
  } else if (id === "eye_of_ender") {
    out = "ender_eye";
  }
  return out;
}

/**
 * Utility to get the "kind" of an exchange, defaulting to "trade"
 */
export function getExchangeKind(exchange: Exchange): Exchange["kind"] | "trade" {
  return exchange.kind || "trade";
}
