import React, { useState, useEffect } from "react";
import { Shop } from "@/types/shop";
import { Region } from "@/types/region";
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from "next/image";

// Helper: parse a single bound (string or object) to object with numbers
type BoundLike =
  | string
  | {
      min_x: number;
      min_y: number;
      min_z: number;
      max_x: number;
      max_y: number;
      max_z: number;
    };

function parseBounds(bound: BoundLike) {
  if (typeof bound === 'string') {
    const coords = bound.slice(1, -1).split(',').map(Number);
    return {
      min_x: coords[0],
      min_y: coords[1],
      min_z: coords[2],
      max_x: coords[3],
      max_y: coords[4],
      max_z: coords[5]
    };
  }
  // If already an object, ensure all are numbers
  return {
    min_x: Number(bound.min_x),
    min_y: Number(bound.min_y),
    min_z: Number(bound.min_z),
    max_x: Number(bound.max_x),
    max_y: Number(bound.max_y),
    max_z: Number(bound.max_z)
  };
}

// Helper: check if shop bounds are within region bounds
function isBoundsInsideRegion(shopBounds: BoundLike, regionBounds: BoundLike) {
  const shop = parseBounds(shopBounds);
  const region = parseBounds(regionBounds);
  return (
    shop.min_x >= region.min_x &&
    shop.max_x <= region.max_x &&
    shop.min_y >= region.min_y &&
    shop.max_y <= region.max_y &&
    shop.min_z >= region.min_z &&
    shop.max_z <= region.max_z
  );
}

interface ShopEditAddModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (shop: Partial<Shop>) => void;
  owner: string;
  initialShop?: Shop | null;
  regionBounds: Region["bounds"];
}

type BoundsObj = {
  min_x: string;
  min_y: string;
  min_z: string;
  max_x: string;
  max_y: string;
  max_z: string;
};

const emptyBounds: BoundsObj = {
  min_x: "",
  min_y: "",
  min_z: "",
  max_x: "",
  max_y: "",
  max_z: "",
};

export default function ShopEditAddModal({
  open,
  onClose,
  onSubmit,
  owner: initialOwner,
  initialShop,
  regionBounds,
}: ShopEditAddModalProps) {
  const isEdit = !!initialShop;
  const [hasFloating, setHasFloating] = useState(initialShop?.has_floating ?? false);
  const [exchangeItems, setExchangeItems] = useState<string[]>(initialShop?.exchange_items ?? []);
  const [name, setName] = useState(initialShop?.name || "");
  const [dimension, setDimension] = useState(initialShop?.dimension || "overworld");
  const [bounds, setBounds] = useState<BoundsObj[]>(
    initialShop?.bounds?.length
      ? initialShop.bounds.map(b => ({
          min_x: b.min_x?.toString() ?? "",
          min_y: b.min_y?.toString() ?? "",
          min_z: b.min_z?.toString() ?? "",
          max_x: b.max_x?.toString() ?? "",
          max_y: b.max_y?.toString() ?? "",
          max_z: b.max_z?.toString() ?? "",
        }))
      : [{ ...emptyBounds }]
  );
  const [image, setImage] = useState(initialShop?.image || "");
  const [owner, setOwner] = useState(initialShop?.owner || initialOwner || "");
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (initialShop) {
      setName(initialShop.name || "");
      setDimension(initialShop.dimension || "overworld");
      setBounds(
        initialShop.bounds?.length
          ? initialShop.bounds.map(b => ({
              min_x: b.min_x?.toString() ?? "",
              min_y: b.min_y?.toString() ?? "",
              min_z: b.min_z?.toString() ?? "",
              max_x: b.max_x?.toString() ?? "",
              max_y: b.max_y?.toString() ?? "",
              max_z: b.max_z?.toString() ?? "",
            }))
          : [{ ...emptyBounds }]
      );
      setImage(initialShop.image || "");
      setOwner(initialShop.owner || initialOwner || "");
      setHasFloating(initialShop?.has_floating ?? false);
      setExchangeItems(initialShop?.exchange_items ?? []);
    } else if (open) {
      setName("");
      setDimension("overworld");
      setBounds([{ ...emptyBounds }]);
      setImage("");
      setOwner(initialOwner || "");
    }
  }, [initialShop, open, initialOwner]);

  const handleBoundsChange = (idx: number, field: keyof BoundsObj, value: string) => {
    setBounds(prev =>
      prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b))
    );
  };

  const handleAddRegion = () => {
    setBounds(prev => [...prev, { ...emptyBounds }]);
  };

  const handleRemoveRegion = (idx: number) => {
    setBounds(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Shop name is required.");
    if (!owner.trim()) return setError("Owner is required.");
    if (
      bounds.some(b =>
        [b.min_x, b.min_y, b.min_z, b.max_x, b.max_y, b.max_z].some(v => v === "")
      )
    ) {
      return setError("All bounds fields are required for each region.");
    }

    // Parse all values as numbers and always assign min/max correctly
    const boundsArr = bounds.map(b => {
      const x1 = Number(b.min_x), x2 = Number(b.max_x);
      const y1 = Number(b.min_y), y2 = Number(b.max_y);
      const z1 = Number(b.min_z), z2 = Number(b.max_z);
      return {
        min_x: Math.min(x1, x2),
        max_x: Math.max(x1, x2),
        min_y: Math.min(y1, y2),
        max_y: Math.max(y1, y2),
        min_z: Math.min(z1, z2),
        max_z: Math.max(z1, z2),
      };
    });

    // Validate bounds inside region
    if (regionBounds && regionBounds.length > 0) {
      const region = parseBounds(regionBounds[0]);
      for (const b of boundsArr) {
        if (!isBoundsInsideRegion(b, region)) {
          setError("Bounds are outside of the region area.");
          return; // Do not close modal
        }
      }
    }

    if (hasFloating && exchangeItems.filter(i => i.trim()).length === 0) {
      setError("Please add at least one floating exchange item or disable floating exchanges.");
      return;
    }

    const shopData: Partial<Shop> = {
      ...(isEdit && initialShop?.id ? { id: initialShop.id } : {}),
      name,
      owner,
      dimension,
      bounds: boundsArr,
      image,
      has_floating: hasFloating,
      exchange_items: hasFloating ? exchangeItems.filter(i => i.trim()) : [],
    };

    onSubmit(shopData);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
      <div className="bg-black border border-pv-accent-border rounded-lg shadow-lg p-6 w-full max-w-md relative">
        {/* X Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-pv-accent-border hover:text-white p-1 rounded-full focus:outline-none"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">
          {isEdit ? "Edit Shop" : "Create Shop"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Shop Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Owner</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image Link (Optional)</label>
            <input
              type="url"
              value={image}
              onChange={e => {
                setImage(e.target.value);
                setImageError(false);
              }}
              className="w-full border rounded px-2 py-1"
              placeholder="https://example.com/image.png"
              pattern="https?://.+"
            />
            {image && !imageError && (
              <div className="mt-2 flex justify-center">
                <Image
                  src={image}
                  alt="Shop preview"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded border border-pv-border"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <input
                type ="checkbox"
                checked={hasFloating}
                onChange={e => setHasFloating(e.target.checked)}
                className="mr-2"
              />
              Has Floating Exchanges
            </label>
          </div>

          {hasFloating && (
            <div>
              <label className="block text-sm font-medium mb-1">Floating Exchange Items</label>
              {exchangeItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-1">
                  <input
                  type="text"
                  value={item}
                  onChange={e => {
                    const newItems = [...exchangeItems];
                    newItems[idx] = e.target.value;
                    setExchangeItems(newItems);
                  }}
                  className="border rounded px-2 py-1 flex-1"
                  placeholder="minecraft:item_id"
                  />
                  <button
                  type="button"
                  onClick={() => setExchangeItems(exchangeItems.filter((_, i) => i !== idx))}
                  className="text-red-500"
                  >
                    Remove
                    </button>
                    </div>
                  ))}
                  <button
                  type="button"
                  onClick={() => setExchangeItems([...exchangeItems, ""])}
                  className="mt-1 px-2 py-1 bg-pv-border text-white rounded"
                  >
                    + Add Item 
                    </button>
                    </div>
                    )}

          <div>
            <label className="block text-sm font-medium mb-1">Bounds Regions</label>
            {bounds.map((b, idx) => (
              <div key={idx} className="mb-2 border border-pv-border rounded p-2 relative">
                {bounds.length > 1 && (
                  <button
                    type="button"
                    className="absolute top-1 right-1 text-red-400 hover:text-red-600"
                    onClick={() => handleRemoveRegion(idx)}
                    title="Remove region"
                  >
                    &times;
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min X"
                    value={b.min_x}
                    onChange={e => handleBoundsChange(idx, "min_x", e.target.value)}
                    className="border rounded px-2 py-1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Max X"
                    value={b.max_x}
                    onChange={e => handleBoundsChange(idx, "max_x", e.target.value)}
                    className="border rounded px-2 py-1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Min Y"
                    value={b.min_y}
                    onChange={e => handleBoundsChange(idx, "min_y", e.target.value)}
                    className="border rounded px-2 py-1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Max Y"
                    value={b.max_y}
                    onChange={e => handleBoundsChange(idx, "max_y", e.target.value)}
                    className="border rounded px-2 py-1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Min Z"
                    value={b.min_z}
                    onChange={e => handleBoundsChange(idx, "min_z", e.target.value)}
                    className="border rounded px-2 py-1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Max Z"
                    value={b.max_z}
                    onChange={e => handleBoundsChange(idx, "max_z", e.target.value)}
                    className="border rounded px-2 py-1"
                    required
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="mt-2 px-3 py-1 rounded bg-pv-border border border-pv-accent-border text-white hover:bg-pv-primary-dark"
              onClick={handleAddRegion}
            >
              + Region
            </button>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="submit" className="px-4 py-2 rounded-lg bg-pv-border border border-pv-accent-border text-white hover:bg-pv-primary-dark">
              {isEdit ? "Save Changes" : "Create Shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}