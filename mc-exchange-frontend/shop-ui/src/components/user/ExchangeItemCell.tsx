import React from "react";
import { ItemBadge } from "@/components/ui/ItemBadge";

interface ExchangeItemCellProps {
  id: string | number;
  quantity: number;
  isCompacted?: boolean;
  enchantments?: string[];
}

export function ExchangeItemCell({
  id,
  quantity,
  isCompacted,
  enchantments,
}: ExchangeItemCellProps) {
  return (
    <div className="flex flex-col items-center">
      <ItemBadge id={id} quantity={quantity} size="md" showLabel />

      <div className="mt-1 flex flex-wrap gap-1.5">
        {isCompacted && (
          <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[11px] font-medium text-red-400">
            Compacted
          </span>
        )}
        {enchantments?.map((label) => (
          <span
            key={label}
            className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[11px] font-medium text-blue-400"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
