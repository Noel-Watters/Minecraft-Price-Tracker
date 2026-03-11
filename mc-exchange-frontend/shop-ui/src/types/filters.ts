export type SortOrder = "ascending" | "descending";

export interface FilterState {
    query?: string;
  shop?: string;
  sort_by?: string;
  order?: SortOrder;
  output_enchants?: string[];
  compacted_input?: boolean;
  compacted_output?: boolean;
  available_only?: boolean;
}

export const SORT_FIELDS = [
  { value: "ts", label: "Time" },
  { value: "input_qty", label: "Price" },
  { value: "output_qty", label: "Quantity" },
] as const;

export const ENCHANT_OPTIONS: string[] = [
  "Unbreaking 3",
  "Looting 3",
  "Fire Aspect 2",
  "Sharpness 5",
  "Knockback 2",
  "Protection 4",
  "Feather Falling 4",
  "Depth Strider 3",
  "Aqua Affinity 1",
  "Respiration 3",
  "Soul Speed 3",
  "Silk Touch 1",
  "Efficiency 5",
  "Fortune 3",
];