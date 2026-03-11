"use client";

import React from "react";
import { FilterState, SORT_FIELDS } from "@/types/filters";
import { FilterPill } from "@/components/ui/FilterPill";

interface FilterPillsRowProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState, value?: string) => void;
}

export function FilterPillsRow({
  filters,
  onRemoveFilter,
}: FilterPillsRowProps) {
  const sortLabel =
    SORT_FIELDS.find((f) => f.value === filters.sort_by)?.label ||
    filters.sort_by;

  return (
    <div className=" flex flex-wrap gap-2">
      {filters.sort_by && (
        <FilterPill
          label={`Sort: ${sortLabel}`}
          onRemove={() => onRemoveFilter("sort_by")}
        />
      )}

      {filters.order && (
        <FilterPill
          label={`Order: ${filters.order}`}
          onRemove={() => onRemoveFilter("order")}
        />
      )}

      {(filters.output_enchants || []).map((enchant) => (
        <FilterPill
          key={`output_enchant_${enchant}`}
          label={`Output Enchant: ${enchant}`}
          onRemove={() => onRemoveFilter("output_enchants", enchant)}
        />
      ))}

      {filters.available_only && (
        <FilterPill
          label="Only available"
          onRemove={() => onRemoveFilter("available_only")}
        />
      )}

        {filters.compacted_input && (
          <FilterPill
            label="Compacted Input"
            onRemove={() => onRemoveFilter("compacted_input")}
          />
        )}

        {filters.compacted_output && (
          <FilterPill
            label="Compacted Output"
            onRemove={() => onRemoveFilter("compacted_output")}
          />
        )}
    </div>
  );
}
