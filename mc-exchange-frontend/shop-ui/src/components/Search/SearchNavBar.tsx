"use client";

import React, { useState, useCallback } from "react";
import { AdjustmentsHorizontalIcon, HomeIcon, KeyIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { FilterMenu } from "./FilterMenu";
import { FilterPillsRow } from "./FilterPillRow";
import { FilterState } from "@/types/filters";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";

interface SearchTopBarProps {
  region?:string
  basePath?:string;
  onSearch: (query: string) => void;
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  isSticky?: boolean;
}

export default function SearchNavBar({
  region,
  basePath = "/search",
  onSearch,
  onFiltersChange,
  initialFilters = {},
  isSticky = false,
}: SearchTopBarProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const lastQuery = searchParams.get("query") || "Search...";

  const handleFilterChange = useCallback(
  <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const updated: FilterState = {
      ...filters,
      [key]: value,
    };
    Object.keys(updated).forEach((k) => {
      if (updated[k as keyof FilterState] === undefined) {
        delete updated[k as keyof FilterState];
      }
    });

    setFilters(updated);
    onFiltersChange(updated);

     // Update the URL with new filters
  const params = new URLSearchParams(window.location.search);
  
  // Clear all filter keys first so unchecked filters are removed from URL
  (["sort_by", "order", "compacted_input", "compacted_output", "output_enchants", "available_only"] as const)
    .forEach(k => params.delete(k));
  
  // Re-apply only active filters
  Object.entries(updated).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) {
      params.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }
  });
  
  params.set("region", region ?? "pavia");
  const newUrl = `${basePath}?${params.toString()}`;
  const currentUrl = window.location.pathname + window.location.search;
  if (currentUrl !== newUrl) {
    router.push(newUrl, { scroll: false });
  }
  },
  [filters, onFiltersChange, router]
);

  const handleRemoveFilter = useCallback(
    (key: keyof FilterState, value?: string) => {
      if (key === "output_enchants") {
        const current = filters.output_enchants || [];
        const next = current.filter((v) => v !== value);
        handleFilterChange("output_enchants", next);
        return;
      }
      handleFilterChange(key, undefined as unknown as FilterState[typeof key]);
    },
    [filters.output_enchants, handleFilterChange]
  );

  return (
    <div className="relative">
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-screen w-16 z-50 flex flex-col items-center py-4 gap-4 rounded-r-lg shadow
          transition-transform duration-300
          ${isSticky ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-full opacity-0 pointer-events-none"}
        `}
        style={{ zIndex: 50 }}
      >
        <Link href="/" aria-label="Home">
          <HomeIcon className="h-10 w-10 p-2 rounded-full text-icon-muted hover:text-accent bg-surface-2 transition-colors" />
        </Link>
        <button
          type="button"
          className="flex items-center justify-center rounded-full bg-surface-2"
          aria-label="Search"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <MagnifyingGlassIcon className="h-10 w-10 p-2 text-icon-muted hover:text-accent transition-colors" />
        </button>
        <button
          type="button"
          className="flex items-center justify-center rounded-full bg-surface-2"
          onClick={() => setShowFilterMenu((v) => !v)}
          aria-label="Show filters"
          aria-expanded={showFilterMenu}
        >
          <AdjustmentsHorizontalIcon className="h-10 w-10 p-2 text-icon-muted hover:text-accent-deep transition-colors" />
        </button>
        <Link href="/login">
          <KeyIcon className="h-10 w-10 p-2 rounded-full text-icon-muted hover:text-accent bg-surface-2 transition-colors" />
        </Link>
        {showFilterMenu && (
          <FilterMenu filters={filters} onFilterChange={handleFilterChange} sidebarMode={isSticky} />
        )}
      </div>

      {/* Top bar */}
      <div
        className={`
          transition-transform duration-300
          w-full max-w-full
          ${isSticky ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100 pointer-events-auto"}
        `}
        style={{ zIndex: 50 }}
      >
        <form
          className="flex items-center gap-2 rounded-xl w-full px-3 py-2 justify-end"
          onSubmit={e => e.preventDefault()}
        >
          <Link href="/" aria-label="Home">
            <HomeIcon className="h-10 w-10 p-2 rounded-full text-icon-muted hover:text-accent bg-surface-2 transition-colors" />
          </Link>
          <SearchBar
            region={region}
            placeholder={lastQuery}
            apiEndpoint="/api/user/exchanges"
            onResultClick={result => {
              router.push(`/search?search_output=${encodeURIComponent(result.output_item_id ?? "")}&region=${region}`);
            }}
            onSubmit={query => {
              router.push(`/search?search_output=${encodeURIComponent(query)}&region=${region}`);
            }}
          />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2"
            onClick={() => setShowFilterMenu((v) => !v)}
            aria-label="Show filters"
            aria-expanded={showFilterMenu}
          >
            <AdjustmentsHorizontalIcon className="h-9 w-9 p-2 text-icon-muted hover:text-accent-deep transition-colors" />
          </button>
          {showFilterMenu && (
            <FilterMenu filters={filters} onFilterChange={handleFilterChange}  />
          )}
        </form>
      </div>
      
      {!isSticky && (
        <FilterPillsRow
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        />
      )}
    </div>
  );
}