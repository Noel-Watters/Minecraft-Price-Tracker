// lib/items.ts

export function formatItemId(id: string): string {
  return id
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const POTION_EFFECTS = new Set([
  "fire_resistance", "swiftness", "strength", "healing", "harming",
  "leaping", "regeneration", "slowness", "night_vision", "invisibility",
  "water_breathing", "luck", "slow_falling", "resistance", "poison",
  "weakness", "decay",
]);

export function normalizeItemImageId(id: string): string {
  // block_of_X → X_block (e.g. block_of_gold → gold_block)
  // Special case: block_of_lapis_lazuli → lapis_block
  if (id === "block_of_lapis_lazuli" || id === "block_of_lapis") {
    return "lapis_block";
  }
  if (id.startsWith("block_of_")) {
    return id.replace("block_of_", "") + "_block";
  }

  // Smithing templates
  if (id.endsWith("_armor_trim") || id === "netherite_upgrade") {
    return `${id}_smithing_template`;
  }

  // One-off renames
  if (id === "eye_of_ender")       return "ender_eye";
  if (id === "steak")              return "cooked_beef";
  if (id === "book_and_quill")     return "writable_book";
  if (id === "bucket_of_axolotl")  return "axolotl_bucket";
  if (id === "redstone_repeater")  return "repeater";
  if (id === "slimeball")          return "slime_ball";
  if (id === "redstone_comparator") return "comparator";
  if (id === "music_disc") return "music_disc_13";

  // Potion effect names → generic potion sprite
  if (/^(long_|strong_)/.test(id) || POTION_EFFECTS.has(id)) {
    return "potion";
  }

  return id;
}