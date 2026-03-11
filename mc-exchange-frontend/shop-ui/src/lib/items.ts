// lib/items.ts

export function formatItemId(id: string): string {
  return id
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function normalizeItemImageId(id: string): string {
  let out = id;
  if (id.endsWith("_armor_trim")) {
    out = `${id}_smithing_template`;
  } else if (id === "eye_of_ender") {
    out = "ender_eye";
  }
  return out;
}
