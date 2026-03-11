"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import OwnerTopBar from '@/components/Owner/OwnerTopBar';
import { Shop } from '@/types/shop';
import { Region } from '@/types/region'; 
import ShopCard from '@/components/Owner/OwnerShopCards';
import { supabaseBrowser } from '@/lib/supabase';
import ShopEditAddModal from '@/components/Owner/ShopEditAddModal';

export default function OwnerHomePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [regions, setRegions] = useState<Region[]>([]); 
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  // Memoize supabase so supabase.auth is stable
  const supabase = useMemo(() => supabaseBrowser(), []);

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }
        const response = await fetch('/api/regions', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch regions');
        }
        const data = await response.json();
        setRegions(data.regions || []);
        if (data.regions && data.regions.length > 0) {
          setSelectedRegion(data.regions[0]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, [supabase]);

  // Fetch shops for the selected region
  const refreshShops = useCallback(async () => {
    if (!selectedRegion) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        setShops([]);
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/regions/${selectedRegion.id}/shops`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch shops');
      }
      const data = await response.json();
      setShops(data.shops || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, supabase]);

  // Fetch shops when selectedRegion changes
  useEffect(() => {
    refreshShops();
  }, [selectedRegion, supabase, refreshShops]); 

  // Modal handlers
  const handleAddShop = () => {
    setEditingShop(null);
    setModalOpen(true);
  };

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setModalOpen(true);
  };

  const handleShopSubmit = async (shopData: Partial<Shop>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      if (!selectedRegion) {
        setError('No region selected');
        setLoading(false);
        return;
      }

      if (editingShop) {
        // EDIT: PATCH /api/regions/:id/shops
        const patchPayload = {
          shop_id: editingShop.id,
          name: shopData.name,
          owner: shopData.owner,
          has_floating: shopData.has_floating,
          exchange_items: shopData.exchange_items || [],
          
        };
        const response = await fetch(`/api/regions/${selectedRegion.id}/shops`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(patchPayload)
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to edit shop');
        }
      } else {
        // ADD: POST /api/regions/:id/shops
        const response = await fetch(`/api/regions/${selectedRegion.id}/shops`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(shopData)
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create shop');
        }
      }
  
      // Refresh shops after add/edit
      await refreshShops();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setModalOpen(false);
      setEditingShop(null);
    }
  };

  // Prepare region info for OwnerTopBar
  const regionName = selectedRegion?.name || '';
  const shopCount = shops.length;

  return (
    <div className="p-3 text-primary">
      
      <div>
        <OwnerTopBar
          name={regionName}
          shopCount={shopCount}
          bounds={selectedRegion?.bounds?.[0] ?? {
    min_x: 0, min_y: 0, min_z: 0, max_x: 0, max_y: 0, max_z: 0
  }}
          onAddShop={handleAddShop}
          regions={regions}
          selectedRegionId={selectedRegion?.id || ""}
          onRegionChange={regionId => {
            const region = regions.find(r => r.id === regionId);
            setSelectedRegion(region || null);
          }}
        />
      </div>

      {error && (
        <div className="p-4 mb-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      <div className="p-8 flex justify-center">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pv-primary"></div>
            <span className="ml-3 text-pv-text-secondary">Loading...</span>
          </div>
        ) : (
          <div className="inline-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
            {shops.map((shop, index) => (
              <ShopCard
                key={shop.name || index}
                shop={shop}
                onEdit={handleEditShop}
                onDelete={refreshShops}
                regionId={selectedRegion?.id || ""}
              />
            ))}
          </div>
        )}
      </div>

      <ShopEditAddModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingShop(null);
        }}
        onSubmit={handleShopSubmit}
        owner={selectedRegion?.owners?.[0] || ""}
        initialShop={editingShop}
        regionBounds={selectedRegion?.bounds || []}
      />
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p>Beacon</p>
      </footer>
    </div>
  );
}