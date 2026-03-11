"use client";

import React from "react";
import { CheckboxDropdown } from "@/components/ui/CheckboxDropdown";
import {ENCHANT_OPTIONS, FilterState, SortOrder, SORT_FIELDS,} from "@/types/filters";
import {SelectDropdown} from "@/components/ui/SelectDropdown";

interface FilterMenuProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void;
  sidebarMode?: boolean;
}

export function FilterMenu({ filters, onFilterChange, sidebarMode }: FilterMenuProps) {
  return (
    <div className={
        sidebarMode
        ? "fixed right-16 top-32 z-50 mt-2 min-w-[250px] border rounded-lg border-border-medium bg-surface text-secondary p-4 shadow-lg text-sm"
        : "absolute right-0 top-full z-20 mt-2 min-w-[250px] border rounded-lg border-border-medium bg-surface text-secondary p-4 shadow-lg text-sm"
    }>
      {/* Sort By */}
      <SelectDropdown
      label="Sort By"
      options={[...SORT_FIELDS]}
      value={filters.sort_by || ""}
      onChange={(val) => onFilterChange("sort_by", val || undefined)}
      />
      
      {/* Order */}
      <SelectDropdown
      label="Order"
      options={[
        { value: "ascending", label: "Ascending" },
        { value: "descending", label: "Descending" },
    ]}
    value={filters.order || ""}
    onChange={(val) => onFilterChange("order", val as SortOrder)}
    />

      {/* Enchant dropdown */}
      <CheckboxDropdown
        label="Output Enchant"
        options={ENCHANT_OPTIONS}
        selected={filters.output_enchants || []}
        onChange={(selected) => onFilterChange("output_enchants", selected)}
      />

      {/* Check Boxes */}
      <div className="mt-2 flex-col flex-wrap items-center space-y-2 text-xs">
        <label className="flex items-center gap-1  font-semibold">
          <input
            type="checkbox"
            checked={!!filters.compacted_input}
            onChange={(e) =>
              onFilterChange("compacted_input", e.target.checked || undefined)
            }
          />
          Compacted Input
        </label>

        <label className="flex items-center gap-1 font-semibold">
          <input
            type="checkbox"
            checked={!!filters.compacted_output}
            onChange={(e) =>
              onFilterChange("compacted_output", e.target.checked || undefined)
            }
          />
          Compacted Output
        </label>
         <label className="flex items-center gap-1 font-semibold">
          <input
            type="checkbox"
            checked={!!filters.available_only}
            onChange={(e) =>
              onFilterChange("available_only", e.target.checked || undefined)
            }
          />
          Only show available exchanges
        </label>
      </div>
    </div>
  );
}
