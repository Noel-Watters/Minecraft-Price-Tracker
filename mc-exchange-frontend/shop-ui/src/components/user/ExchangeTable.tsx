import React from "react";
import type { Exchange } from "@/types/exchanges";
import { ExchangeItemCell } from "./ExchangeItemCell";

interface ExchangeTableProps {
  events: Exchange[];
  showLocation?: boolean;
  emptyMessage?: string;
}

export function ExchangeTable({
  events,
  showLocation = true,
  emptyMessage = "No events.",
}: ExchangeTableProps) {
  if (!events || events.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-pv-border text-primary p-4 text-center">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg text-primary">
      {events.map((event, idx) => {
        const isEven = idx % 2 === 0;

        const inputEnchantments = Array.isArray(event.input_enchantments)
          ? event.input_enchantments
          : typeof event.input_enchantments === "string"
          ? [event.input_enchantments]
          : undefined;

        const outputEnchantments = Array.isArray(event.output_enchantments)
          ? event.output_enchantments
          : typeof event.output_enchantments === "string"
          ? [event.output_enchantments]
          : undefined;

        const compactedInput =
          !!event.compacted_input && event.compacted_input !== "false";

        const compactedOutput =
          !!event.compacted_output && event.compacted_output !== "false";

        const shopName =
          typeof event.shop === "object" &&
          event.shop !== null &&
          "name" in event.shop
            ? (event.shop as { name: string }).name
            : event.shop;

        const formattedDate = new Date(event.ts).toLocaleDateString(
          undefined,
          { month: "2-digit", day: "2-digit" }
        );

        return (
          <div
            key={event.ts + event.input_item_id + event.output_item_id + idx}
            className={[
              "flex flex-wrap items-center p-2",
              isEven ? "bg-black/10" : "",
              "hover:bg-gray-700 mb-2 border border-border-strong shadow-soft rounded-lg text-primary",
            ].join(" ")}
          >
            <div className="px-3 py-2 text-center align-middle flex-1 min-w-[120px]">
              <ExchangeItemCell
                id={event.input_item_id}
                quantity={event.input_qty}
                isCompacted={compactedInput}
                enchantments={inputEnchantments}
              />
            </div>

            <div className="px-3 py-2 text-center align-middle text-lg  flex-none">
              →
            </div>

            <div className="px-3 py-2 text-center align-middle flex-1 min-w-[120px]">
              <ExchangeItemCell
                id={event.output_item_id}
                quantity={event.output_qty}
                isCompacted={compactedOutput}
                enchantments={outputEnchantments}
              />
            </div>

            {showLocation && (
              <div className="px-3 py-2 text-center align-middle flex-1 min-w-[120px] ">
                <div>{shopName}</div>
                <div className="text-xs">
                  ({event.x}, {event.y}, {event.z})
                </div>
              </div>
            )}

            <div className="text-center flex justify-center items-center flex-1 min-w-[100px]">
              <span className="inline-flex flex-col items-center w-auto border border-border-soft max-w-fit px-3 py-1 rounded-lg shadow-medium bg-surface-2 text-primary text-sm font-medium">
                <span>Exchanges:</span>
                <span>{event.exchange_possible}</span>
              </span>
            </div>

            <div className="text-center flex justify-center items-center flex-1 min-w-[100px]">
              <span className="inline-flex flex-col items-center py-1 w-auto  border border-border-soft max-w-fit px-6 rounded-lg shadow-medium bg-surface-2 text-primary text-sm font-medium">
                <span> Updated:</span>
                <span>{formattedDate}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}