"use client";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from '@/lib/supabase';
import EventsList from "@/components/user/EventList";
import { Exchange } from "@/types/exchanges";
import SearchNavBar from "@/components/Search/SearchNavBar";
import { FilterState } from "@/types/filters";

const LIMIT = 30;

export default function SearchResultsContent() {
  const [results, setResults] = useState<Exchange[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const search_output = searchParams.get("search_output") || "";
  const region = searchParams.get("region") || "";
  const [filters, setFilters] = useState<FilterState>({});
  const supabase = useMemo(() => supabaseBrowser(), []);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  function buildQueryString(
    search_output: string,
    region: string,
    filters: FilterState,
    limit: number,
    offset: number
  ) {
    const params = new URLSearchParams();
    if (search_output) params.append("search_output", search_output);
    if (region) params.append("region", region);
    params.append("sort_by", filters.sort_by || "ts");
    params.append("order", filters.order || "descending");
    if (filters.compacted_input && filters.compacted_output)
      params.append("compacted", "both");
    else if (filters.compacted_input)
      params.append("compacted", "input");
    else if (filters.compacted_output)
      params.append("compacted", "output");
    if (filters.output_enchants) {
      filters.output_enchants.forEach((e: string) =>
        params.append("output_enchants", e)
      );
    }
    if (filters.available_only) params.append("available_only", "true");
    params.append("limit", String(limit));
    params.append("offset", String(offset));
    return params.toString();
  }

  // Reset results when search_output/region/filters change
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
  }, [search_output, region, filters]);

  const fetchResults = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const qs = buildQueryString(search_output, region, filters, LIMIT, offset);
    const url = region
      ? `/api/user/exchanges?${qs}`
      : `/api/admin/exchanges?${qs}`;

    const res = await fetch(url, { headers });
    const json = await res.json();
    const newResults: Exchange[] = json.data || [];

    setResults((prev) => (offset === 0 ? newResults : [...prev, ...newResults]));

    setHasMore(newResults.length > 0 && newResults.length === LIMIT);

    setLoading(false);
  }, [
    search_output,
    region,
    filters,
    offset,
    supabase,
    hasMore,   
  ]);

  // Fetch on mount and when offset / filters / search change
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setOffset((prev) => prev + LIMIT);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]); // this is fine

  const handleSearch = (newSearchOutput: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("search_output", newSearchOutput);
    if (region) params.set("region", region);
    router.push(`?${params.toString()}`);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    if (!region) {
      router.replace("/search?region=pavia");
    }
  }, [region, router]);

  return (
    <div className="max-w-5xl bg-pv-surface-elevated mx-auto mt-12">
      <SearchNavBar
        region={region}
        onSearch={handleSearch}
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />
      <EventsList events={results} />
      {hasMore && (
        <div
          ref={loaderRef}
          className="h-12 flex justify-center items-center text-secondary"
        >
          {loading ? "Loading more..." : ""}
        </div>
      )}
    </div>
  );
}
