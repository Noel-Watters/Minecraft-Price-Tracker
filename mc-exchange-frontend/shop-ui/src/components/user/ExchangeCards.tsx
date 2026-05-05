'use client';
import { Exchange } from "@/types/exchanges";
import Image from "next/image";
import React, { useState } from "react";
import { normalizeItemImageId } from "@/lib/items";

export default function EventsList({ events }: { events: Exchange[] }) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const formatItemId = (id: string) => {
    return id
      .split("_")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  };

  const renderDescriptors = (
    descriptors: Array<{ label: string; color: string }>
  ) => {
    if (!descriptors || descriptors.length === 0) return null;
    return (
      <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
        {descriptors.map((d, i) => {
          let bg = "";
          let text = "";
          switch (d.color) {
            case "red":
              bg = "bg-red-500/15";
              text = "text-red-400";
              break;
            case "blue":
              bg = "bg-blue-500/15";
              text = "text-blue-400";
              break;
          }
          return (
            <span
              key={`${d.label}-${i}`}
              className={`rounded ${bg} px-1.5 py-0.5 text-[11px] font-medium ${text}`}
            >
              {d.label}
            </span>
          );
        })}
      </div>
    );
  };



  const renderItemColumn = (
    id: string | number,
    qty: number,
    isCompacted?: boolean,
    enchantments?: string[]
  ) => {
    const idString = String(id);
    const hasFailed = failedImages.has(idString);
    const imageId = normalizeItemImageId(idString);

    let descriptors: Array<{ label: string; color: string }> = [];
    if (isCompacted)
      descriptors = [...descriptors, { label: "Compacted", color: "red" }];

    if (enchantments)
      descriptors = [
        ...descriptors,
        ...enchantments.map((enchantment) => ({
          label: enchantment,
          color: "blue",
        })),
      ];

    return (
      <div className="flex h-full flex-col items-center justify-center">
        {!hasFailed && (
          <div className="relative inline-block rounded">
            <Image
              src={`https://mc.nerothe.com/img/1.21.8/minecraft_${imageId}.png`}
              alt={idString}
              width={48}
              height={48}
              onError={() =>
                setFailedImages((prev) => {
                  const next = new Set(prev);
                  next.add(idString);
                  return next;
                })
              }
            />
            <span
              className={`absolute bottom-0 right-0 translate-x-1 translate-y-1 rounded-sm bg-black/70 px-1 text-[12px] font-semibold leading-none ${
                isCompacted ? "text-red-400" : "text-white"
              }`}
            >
              {qty}
            </span>
          </div>
        )}
        <div className="mt-2 text-center text-sm text-white">
          {formatItemId(idString)}
        </div>
        <div className="mt-1 w-full">{renderDescriptors(descriptors)}</div>
      </div>
    );
  };

  if (!events || events.length === 0) {
    return <div className="text-gray-400">No events for this shop.</div>;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3">
      {events.map((event) => (
        <div
          key={event.ts + event.input_item_id + event.output_item_id}
          className="aspect-square rounded-lg border border-pv-accent-border bg-black/20 p-3 shadow"
        >
          <div className="grid h-full grid-rows-[auto_1fr_auto]">
            <div className="mb-2 text-center text-xs font-bold uppercase text-white/90">
              {event.input_item_id === "diamond" ? (
                <span className="text-green-400">Buy</span>
              ) : event.output_item_id === "diamond" ? (
                <span className="text-red-400">Sell</span>
              ) : (
                <span>Trade</span>
              )}
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              {renderItemColumn(
                event.input_item_id,
                event.input_qty,
                !!event.compacted_input && event.compacted_input !== "false",
                Array.isArray(event.input_enchantments)
                  ? event.input_enchantments
                  : typeof event.input_enchantments === "string"
                  ? [event.input_enchantments]
                  : undefined
              )}
              <div className="flex items-center justify-center text-white/70">
                <span className="text-lg">→</span>
              </div>
              {renderItemColumn(
                event.output_item_id,
                event.output_qty,
                !!event.compacted_output && event.compacted_output !== "false",
                Array.isArray(event.output_enchantments)
                  ? event.output_enchantments
                  : typeof event.output_enchantments === "string"
                  ? [event.output_enchantments]
                  : undefined
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
              <span className="truncate">Exchanges: {event.exchange_possible}</span>
              <span className="whitespace-nowrap">
                {new Date(event.ts).toLocaleDateString(undefined, {
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}