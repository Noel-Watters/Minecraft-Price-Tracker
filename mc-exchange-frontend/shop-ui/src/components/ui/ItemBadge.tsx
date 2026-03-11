"use client";

import Image from "next/image";
import React, { useState } from "react";
import { formatItemId, normalizeItemImageId } from "@/lib/items";

type ItemBadgeSize = "sm" | "md" | "lg";

interface ItemBadgeProps {
  id: string | number;
  quantity?: number;
  /**
   * Size controls icon + font sizing.
   * sm: 24px, md: 32px, lg: 40px
   */
  size?: ItemBadgeSize;
  /**
   * Show the formatted item name under the icon.
   */
  showLabel?: boolean;
  /**
   * Override the label text if you don't want the auto-formatted one.
   */
  labelOverride?: string;
  /**
   * Optional extra className for outer wrapper.
   */
  className?: string;
}

export function ItemBadge({
  id,
  quantity,
  size = "md",
  showLabel = false,
  labelOverride,
  className,
}: ItemBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const idString = String(id);
  const imageId = normalizeItemImageId(idString);
  const label = labelOverride ?? formatItemId(idString);

  const sizePx = size === "sm" ? 24 : size === "lg" ? 40 : 32;
  const qtyTextSize =
    size === "sm" ? "text-[10px]" : size === "lg" ? "text-xs" : "text-[11px]";
  const labelTextSize =
    size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      {!imageFailed && (
        <div className="relative inline-block rounded">
          <Image
            src={`https://mc.nerothe.com/img/1.21.8/minecraft_${imageId}.png`}
            alt={idString}
            width={sizePx}
            height={sizePx}
            onError={() => setImageFailed(true)}
          />
          {typeof quantity === "number" && (
            <span
              className={[
                "absolute bottom-0 right-0 translate-x-1 translate-y-1",
                "rounded-sm bg-black/70 px-1 font-semibold leading-none text-white",
                qtyTextSize,
              ].join(" ")}
            >
              {quantity}
            </span>
          )}
        </div>
      )}

      {showLabel && (
        <div className={`mt-1 text-center text-icon-muted ${labelTextSize}`}>
          {label}
        </div>
      )}
    </div>
  );
}
