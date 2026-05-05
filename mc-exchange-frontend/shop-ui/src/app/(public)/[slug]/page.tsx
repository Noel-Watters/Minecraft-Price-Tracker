"use client";
import React, { useRef, useEffect, useState } from "react";
import { Shop, ShopWithEvents } from "@/types/shop";
import ShopCard from "@/components/user/ShopCard";
import { RegionTopBar } from "@/components/user/RegionTopBar";
import SearchNavBar from "@/components/Search/SearchNavBar";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Bounds } from "@/types/region";
import { FilterState } from "@/types/filters";

export default function RegionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [region, setRegion] = useState<{ id: string; name: string; bounds: Bounds[] } | null>(null);
  const [shops, setShops] = useState<ShopWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const ownerButtonRef = useRef<HTMLAnchorElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  const filterKeys = new Set<keyof FilterState>([
    "output_enchants",
    // Add filters once supported 
  ]);

  // Parse filters from URL
  const initialFilters: FilterState = {};
  searchParams.forEach((value, key) => {
    if (key !== "query" && filterKeys.has(key as keyof FilterState)) {
      if (key === "output_enchants") {
        initialFilters["output_enchants"] = value.split(",") as string[];
      }
    }
  });

  // Handlers for SearchNavBar
  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("search_output", newQuery);
    params.set("region", slug);
    router.push('?' + params.toString());
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key as keyof FilterState] !== undefined) {
        params.set(key, String(newFilters[key as keyof FilterState]));
      } else {
        params.delete(key);
      }
    });
    params.set("region", slug);
    router.push(`?$ {params.toString()}`, { scroll: false });
  };

async function fetchShopsPage(currentOffset: number) {
  const shopsRes = await fetch(`/api/user/regions/${slug}/shops?limit=5&offset=${currentOffset}`);
  const shopsData = await shopsRes.json();
  if (shopsData && shopsData.shops) {
    const shopsWithEvents = await Promise.all(
      shopsData.shops.map(async (shop: Shop) => {
        const eventsRes = await fetch(`/api/user/exchanges/shop?shop=${shop.id}`);
        const eventsData = await eventsRes.json();
        return {
          ...shop,
          events: eventsData.data || [],
          floating_exchanges: eventsData.floating_exchanges || [],
        };
      })
    );
    setShops(prev => [...prev, ...shopsWithEvents]);  // append, not replace
    setHasMore(shopsData.pagination.hasMore);
    setOffset(currentOffset + shopsData.shops.length);
  }
}

  useEffect(() => {
    async function fetchRegionAndShops() {
      setLoading(true);
      setShops([]);
      setOffset(0);
      setHasMore(true);

      // 1. Fetch region by slug
      const regionRes = await fetch(`/api/user/regions?slug=${slug}`);
      const regionData = await regionRes.json();
      const foundRegion = regionData.regions?.[0];
      setRegion(foundRegion);

      if (foundRegion) {
        await fetchShopsPage(0);
      }
      setLoading(false);
    }
    fetchRegionAndShops();
  }, [slug]);

  useEffect(() => {
  if (!sentinelRef.current) return;

  const observer = new IntersectionObserver(async ([entry]) => {
    if (entry.isIntersecting && hasMore && !loadingMore) {
      setLoadingMore(true);
      await fetchShopsPage(offset);
      setLoadingMore(false);
    }
  });

  observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasMore, loadingMore, offset, slug]);

 useEffect(() => {
  if (!region || !ownerButtonRef.current) return;

  const observer = new window.IntersectionObserver(
    ([entry]) => {
      setIsSticky(!entry.isIntersecting); // sticky when button is NOT visible
    },
    { threshold: 0.01 }
  );

  observer.observe(ownerButtonRef.current);

  return () => observer.disconnect();
}, [region]);

  return (
    <div className="min-h-screen">

      <div className="sticky top-0 z-40">
        <SearchNavBar
          region={slug}
          isSticky={isSticky}
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          initialFilters={initialFilters}
        />
      </div>
      
      {/* Region info */}
      {region && (
        <RegionTopBar
          region={{
            name: region.name,
            bounds: region.bounds,
          }}
          ownerButtonRef={ownerButtonRef}
        />
      )}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div>
          {shops.length === 0 && !loading ? (
            <div className="text-center text-gray-500">No shops found for this region.</div>
          ) : (
            shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)
          )}
          {/*Sentinel - triggers next page load when scrolled into view*/}
          <div ref={sentinelRef} />
          {loadingMore&& (
            <div className = "flex justify-center items-center h-16">
              <div className=" animate-spi round-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}