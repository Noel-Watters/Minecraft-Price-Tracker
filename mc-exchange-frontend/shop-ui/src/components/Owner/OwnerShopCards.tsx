import { useState } from 'react';
import EditAddShopButton from './EditAddShopButton';
import { Shop } from '@/types/shop';
import { formatBounds } from '@/app/utils/formatBounds';
import { supabaseBrowser } from '@/lib/supabase';
import Image from "next/image";
import { Bounds } from '@/types/region';

interface ShopCardProps {
  shop: Shop;
  onEdit?: (shop: Shop) => void;
  onDelete?: (shopName: string) => void;
  regionId?: string;
}

export default function ShopCard({ shop, onEdit, onDelete, regionId }: ShopCardProps) {
  const [imageError, setImageError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = supabaseBrowser();

  // Format created date
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const fallbackImage = "/shop-icon.png";
  const displayImage = imageError ? fallbackImage : (shop.image || fallbackImage);

  // Format all bounds regions
  const allBounds = Array.isArray(shop.bounds) ? shop.bounds as (string | Bounds)[] : [];
  const formattedBounds = allBounds.map((b) => formatBounds([b]));

  // Delete handler
  const handleDelete = async () => {
    if (!regionId || !shop.id) {
      alert("Missing region or shop id");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${shop.name}"?`)) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert("Not authenticated");
        setDeleting(false);
        return;
      }
      const res = await fetch(`/api/regions/${regionId}/shops`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shop_id: shop.id })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete shop");
      } else {
        onDelete?.(shop.name);
      }
    } catch {
      alert("Failed to delete shop");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-pv-surface-elevated border border-pv-border p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 w-100">
      {/* Shop Image */}
      <div className="flex justify-center mb-4">
        <div className="relative w-16 h-16 bg-white rounded-lg  justify-center overflow-hidden">
          <Image
            src={displayImage}
            alt={`${shop.name} icon`}
            fill
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      </div>

      {/* Shop Name */}
      <h3 className="text-xl font-bold text-pv-text-primary text-center mb-4">
        {shop.name}
      </h3>

      {/* Shop Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-pv-text-secondary text-sm">Owner:</span>
          <span className="text-pv-text-primary text-sm font-medium">{shop.owner}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-pv-text-secondary text-sm">Created:</span>
          <span className="text-pv-text-primary text-sm font-medium">{formatDate(shop.created_at)}</span>
        </div>

        {shop.has_floating && Array.isArray(shop.exchange_items) && shop.exchange_items.length > 0 && (
          <div className="flex flex-col mb-2">
            <span className="text-pv-text-secondary text-sm mb-1">Floating Exchanges:</span>
            <ul className="list-disc list-inside text-pv-text-primary text-sm font-medium">
              {shop.exchange_items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="border-t border-pv-border pt-3">
          <span className="text-pv-text-secondary text-sm block mb-2">Shop Regions:</span>
          <div className="space-y-4">
            {formattedBounds.map((boundsData, idx) => (
              <div key={idx} className="pl-2">
                <div className="font-semibold text-pv-text-secondary mb-1">Region {idx + 1}:</div>
                <div className="flex justify-between items-center">
                  <span className="text-pv-text-secondary text-xs">Corner 1:</span>
                  <span className="text-pv-text-primary text-xs font-mono bg-pv-surface px-2 py-1 rounded">
                    {boundsData.corner1}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-pv-text-secondary text-xs">Corner 2:</span>
                  <span className="text-pv-text-primary text-xs font-mono bg-pv-surface px-2 py-1 rounded">
                    {boundsData.corner2}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <EditAddShopButton
          mode="edit"
          shopData={{
            name: shop.name,
            owner: shop.owner,
            bounds: JSON.stringify(shop.bounds),
          }}
          onClick={() => onEdit?.(shop)}
          className="flex-1"
        />

        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`
            bg-red-600 
            hover:bg-red-700 
            text-white 
            px-4 py-2 
            rounded-lg 
            font-medium 
            transition-colors 
            duration-200
            hover:shadow-lg
            active:scale-95
            ${deleting ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}