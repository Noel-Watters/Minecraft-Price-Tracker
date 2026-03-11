import React, { useState } from "react";
import EditAddShopButton from "./EditAddShopButton";
import RegionCard from "./RegionCard";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Bounds } from "@/types/region";
import {Region} from "@/types/region";

interface OwnerTopBarProps {
  name: string;
  shopCount: number;
  bounds: Bounds;
  onAddShop: () => void;
  regions: Region[];
  selectedRegionId: string;
  onRegionChange: (regionId: string) => void;
}

export default function OwnerTopBar({
  name,
  shopCount,
  bounds,
  onAddShop,
  regions,
  selectedRegionId,
  onRegionChange,
}: OwnerTopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentRegion = regions.find((r) => r.id === selectedRegionId);

  return (
    <div className="flex flex-col border-pv-accent-border bg-pv-surface border-2 p-6 rounded-lg shadow">
      {/* Name, Dropdown & Add Shop Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative">
        {/* Region Name with Dropdown */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center text-4xl m-2 pb-4 font-bold text-pv-secondary focus:outline-none"
            onClick={() => regions.length > 1 && setDropdownOpen((v) => !v)}
            tabIndex={0}
          >
            <span>{currentRegion?.name || name}</span>
            {regions.length > 1 && (
              <ChevronDownIcon
                className={`h-7 w-7 ml-2 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>
          {/* Dropdown List */}
          {regions.length > 1 && dropdownOpen && (
            <div className="absolute z-20 mt-1 left-0 bg-pv-surface shadow-lg rounded-lg min-w-full">
              {regions.map((region) => (
                <button
                  key={region.id}
                  className={`block w-full text-left px-4 py-2 hover:bg-pv-border text-pv-text-primary ${
                    region.id === selectedRegionId ? "font-semibold bg-pv-border" : ""
                  }`}
                  onClick={() => {
                    setDropdownOpen(false);
                    onRegionChange(region.id);
                  }}
                >
                  {region.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <EditAddShopButton mode="add" onClick={onAddShop} />
      </div>

      <RegionCard
        shopCount={shopCount}
        bounds={bounds}
      />
    </div>
  );
}



