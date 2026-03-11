"use client";

import React from "react";
import { FloatingExchange } from "@/types/exchanges";
import { ItemBadge } from "@/components/ui/ItemBadge";
import { normalizeItemImageId, formatItemId } from "@/lib/items";
import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/24/outline";

interface FloatingExchangeListProps {
  exchanges: FloatingExchange[];
}

export default function FloatingExchangeList({ exchanges }: FloatingExchangeListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {exchanges.map((ex, idx) => {
        const itemImageId = normalizeItemImageId(ex.item_id);
        const itemName = formatItemId(ex.item_name);

        const diamondsGiven = 2;
        const itemsReceived = diamondsGiven * ex.per_diamond;
        const itemsGiven = 2 * ex.per_item;
        const diamondsReceived = 2;

        return (
          <div
            key={ex.item_id}
            className={`flex-1 flex flex-col items-center p-3 rounded-lg min-w-[300px] max-w-xs ${
              idx % 2 === 0 ? "bg-surface-2 shadow-glow-cyan" : "bg-pv-border"
            }`}
          >
            <div className="flex items-center justify-center w-full mb-2">
              <ItemBadge id={ex.item_id} size="lg" />
              <span className="text-base font-semibold ml-2">{itemName}</span>
            </div>

            {/* 2 Diamond → X Items */}
            <div className="w-full flex items-center text-xs text-gray-300">
              <div className="flex-1 flex justify-start">
                <ItemBadge id="diamond" quantity={diamondsGiven} size="md" showLabel />
              </div>
              <div className="flex-none flex justify-center items-center w-10">
                <ArrowLongRightIcon className="w-7 h-7 mx-auto" />
              </div>
              <div className="flex-1 flex justify-end">
                <ItemBadge id={ex.item_id} quantity={itemsReceived} size="md" showLabel />
              </div>
            </div>

            <div className="my-2 h-[1px] w-full bg-white/10" />

            {/* X Items → 2 Diamond */}
            <div className="w-full flex items-center text-xs text-gray-300">
              <div className="flex-1 flex justify-start">
                <ItemBadge id={ex.item_id} quantity={itemsGiven} size="md" showLabel />
              </div>
              <div className="flex-none flex justify-center items-center w-10">
                <ArrowLongLeftIcon className="w-7 h-7 mx-auto" />
              </div>
              <div className="flex-1 flex justify-end">
                <ItemBadge id="diamond" quantity={diamondsReceived} size="md" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
