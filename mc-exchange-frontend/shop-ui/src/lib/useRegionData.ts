"use client";
import { useState, useEffect } from "react";
import { Shop, ShopWithEvents } from "@/types/shop";
import { Bounds } from "@/types/region";

interface RegionData {
  region: { id: string; name: string; bounds: Bounds[] } | null;
  shops: ShopWithEvents[];
  loading: boolean;
}

export function useRegionData(slug: string, searchParams: URLSearchParams): RegionData {
  const [region, setRegion] = useState<RegionData["region"]>(null);
  const [shops, setShops] = useState<ShopWithEvents[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRegionAndData() {
      setLoading(true);

      const queryParams = new URLSearchParams();

      // Extract filters from URL
      const urlQuery = searchParams.get("query");
      const availableOnly = searchParams.get("available_only");
      const sortBy = searchParams.get("sort_by");
      const order = searchParams.get("order");
      const outputEnchants = searchParams.getAll("output_enchants");

      // Build /exchanges query
      queryParams.set("region", slug);
      if (urlQuery) queryParams.set("search_output", urlQuery);
      if (availableOnly === "true") queryParams.set("available_only", "true");
      if (sortBy) queryParams.set("sort_by", sortBy);
      if (order) queryParams.set("order", order);

      // multiple output_enchants params
      outputEnchants.forEach((enchant) => {
        queryParams.append("output_enchants", enchant);
      });

      // Fetch region, shops, and exchanges concurrently
      const [regionRes, shopsRes, exchangesRes] = await Promise.all([
        fetch(`/api/user/regions?slug=${slug}`),
        fetch(`/api/user/regions/${slug}/shops`),
        fetch(`/api/user/exchanges?${queryParams.toString()}`),
      ]);

      const regionJson = await regionRes.json();
      const shopsJson = await shopsRes.json();
      const exchangesJson = await exchangesRes.json();

      const foundRegion = regionJson.regions?.[0] ?? null;
      setRegion(foundRegion);

      const shopsList: Shop[] = shopsJson.shops ?? [];
      const exchanges = exchangesJson.data ?? [];

      // Group exchanges by shop ID
      const exchangesByShop = new Map<string, any[]>();
      for (const ex of exchanges) {
        const shop = ex.shop;
        if (!shop) continue;
        const shopId = shop.id as string;

        if (!exchangesByShop.has(shopId)) {
          exchangesByShop.set(shopId, []);
        }
        exchangesByShop.get(shopId)!.push(ex);
      }

      // Merge exchanges into shops
      const shopsWithEvents = shopsList.map((shop) => ({
        ...shop,
        events: exchangesByShop.get(shop.id) ?? [],
      }));

      setShops(shopsWithEvents);
      setLoading(false);
    }

    fetchRegionAndData();
  }, [slug, searchParams]);

  return { region, shops, loading };
}
