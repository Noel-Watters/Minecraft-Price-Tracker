import { formatBounds } from '@/app/utils/formatBounds';
import React from 'react';
import { Bounds } from '@/types/region';

interface RegionCardProps {
  shopCount: string | number;
  bounds: Bounds;
}

export default function RegionCard({
  shopCount,
  bounds,
}: RegionCardProps) {
  const boundsData = formatBounds([bounds]);

  return (
    <div className="flex flex-row gap-6 justify-start m-1">
      <div className="flex flex-col items-start min-w-[120px] max-w-[120px] bg-pv-surface border-pv-border border p-2 rounded-md shadow space-y-1">
        <p className="text-xs text-pv-muted">Shops</p>
        <p className="font-bold text-lg text-pv-text-primary">{shopCount}</p>
      </div>
      <div className="flex flex-col items-start min-w-[220px] max-w-[260px] bg-pv-surface border-pv-border border p-2 rounded-md shadow space-y-1">
        <p className="text-xs text-pv-muted">Region Bounds</p>
        <div className="space-y-1 w-full">
          <div className="flex justify-between items-center text-xs w-full">
            <span className="text-pv-text-secondary">Corner 1:</span>
            <span className="text-pv-text-primary font-mono bg-pv-surface px-1 py-0.5 rounded ml-2 whitespace-nowrap overflow-x-auto">
              {boundsData.corner1}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs w-full">
            <span className="text-pv-text-secondary">Corner 2:</span>
            <span className="text-pv-text-primary font-mono bg-pv-surface px-1 py-0.5 rounded ml-2 whitespace-nowrap overflow-x-auto">
              {boundsData.corner2}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
// Top Bar with Region Name, Shop Count, Last Updated, Cords, Region Owners