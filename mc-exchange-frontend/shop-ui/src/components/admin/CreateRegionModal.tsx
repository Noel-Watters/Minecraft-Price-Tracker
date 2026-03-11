import React from "react";
import { Bounds } from "@/types/region";

interface CreateRegionModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newRegion: { name: string; slug: string; dimension: string; owner: string };
  setNewRegion: React.Dispatch<React.SetStateAction<{ name: string; slug: string; dimension: string; owner: string }>>;
  bounds: Bounds;
  setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
}

export default function CreateRegionModal({
  show,
  onClose,
  onSubmit,
  newRegion,
  setNewRegion,
  bounds,
  setBounds,
}: CreateRegionModalProps) {
  if (!show) return null;

  return (
    <div className="bg-gray-800 p-6 rounded shadow-md max-w-md mx-auto my-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
          placeholder="Name"
          value={newRegion.name}
          onChange={e => setNewRegion(r => ({ ...r, name: e.target.value }))}
          required
        />
        <input
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
          placeholder="Slug"
          value={newRegion.slug}
          onChange={e => setNewRegion(r => ({ ...r, slug: e.target.value }))}
          required
        />
        <input
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
          placeholder="Dimension"
          value={newRegion.dimension}
          onChange={e => setNewRegion(r => ({ ...r, dimension: e.target.value }))}
          required
        />
        <input
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
          placeholder="Owner"
          value={newRegion.owner}
          onChange={e => setNewRegion(r => ({ ...r, owner: e.target.value }))}
          required
        />
        <div>
          <label className="block text-sm font-medium mb-1">Bounds</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min X"
              value={bounds.min_x}
              onChange={e => setBounds(b => ({ ...b, min_x: Number(e.target.value) }))}
              className="border rounded px-2 py-1"
              required
            />
            <input
              type="number"
              placeholder="Max X"
              value={bounds.max_x}
              onChange={e => setBounds(b => ({ ...b, max_x: Number(e.target.value) }))}
              className="border rounded px-2 py-1"
              required
            />
            <input
              type="number"
              placeholder="Min Y"
              value={bounds.min_y}
              onChange={e => setBounds(b => ({ ...b, min_y: Number(e.target.value) }))}
              className="border rounded px-2 py-1"
              required
            />
            <input
              type="number"
              placeholder="Max Y"
              value={bounds.max_y}
              onChange={e => setBounds(b => ({ ...b, max_y: Number(e.target.value) }))}
              className="border rounded px-2 py-1"
              required
            />
            <input
              type="number"
              placeholder="Min Z"
              value={bounds.min_z}
              onChange={e => setBounds(b => ({ ...b, min_z: Number(e.target.value) }))}
              className="border rounded px-2 py-1"
              required
            />
            <input
              type="number"
              placeholder="Max Z"
              value={bounds.max_z}
              onChange={e => setBounds(b => ({ ...b, max_z: Number(e.target.value) }))}
              className="border rounded px-2 py-1"
              required
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">Create</button>
          <button type="button" className="bg-gray-700 px-4 py-2 rounded" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}