import React from "react";
import { Region } from "@/types/region";
import { User } from "@/types/user";

interface RegionsListProps {
  regions: Region[];
  users: User[];
  loading: boolean;
  userName: (userId: string) => string;
  handleRemoveOwnerFromRegion: (region: Region, userId: string) => void;
  handleAssignOwnerToRegion: (userId: string, region: Region) => void;
  handleDeleteRegion: (regionId: string) => void;
}

export default function RegionsList({
  regions,
  users,
  loading,
  handleRemoveOwnerFromRegion,
  handleAssignOwnerToRegion,
  handleDeleteRegion,
}: RegionsListProps) {
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h2 className="text-lg font-semibold mb-4">Regions</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {regions.map(region => (
            <div key={region.id} className="bg-gray-800 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-bold">{region.name}</div>
                <div className="flex flex-wrap gap-2 my-2">
                  {region.owners && region.owners.length > 0 ? (
                    region.owners.map(ownerId => (
                      <span
                        key={ownerId}
                        className="flex items-center bg-blue-700 text-white rounded-full px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-blue-800 transition relative group"
                      >
                        {users.find(u => u.id === ownerId)?.name}
                        <button
                          className="ml-2 text-white bg-blue-900 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          title="Remove owner"
                          onClick={() => handleRemoveOwnerFromRegion(region, ownerId)}
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs">No owners</span>
                  )}
                </div>
                <div className="text-sm text-gray-400">Dimension: {region.dimension}</div>
                <div className="text-sm text-gray-400">
                  Bounds: {region.bounds && region.bounds.length > 0
                    ? `(${region.bounds[0].min_x},${region.bounds[0].min_y},${region.bounds[0].min_z}) → (${region.bounds[0].max_x},${region.bounds[0].max_y},${region.bounds[0].max_z})`
                    : "None"}
                </div>
                {/* Assign owner dropdown */}
                <div className="mt-2">
                  <select
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) handleAssignOwnerToRegion(e.target.value, region);
                    }}
                  >
                    <option value="" disabled>Add owner to region...</option>
                    {users
                      .filter(u => !(Array.isArray(region.owners) ? region.owners : []).includes(u.id))
                      .map(user => (
                        <option key={user.id} value={user.id}></option>
                      ))}
                  </select>
                </div>
              </div>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded mt-2 md:mt-0"
                onClick={() => handleDeleteRegion(region.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
