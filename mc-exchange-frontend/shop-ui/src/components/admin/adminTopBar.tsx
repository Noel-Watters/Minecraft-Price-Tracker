import React from "react";

interface AdminTopBarProps {
  onCreateRegionClick: () => void;
  children?: React.ReactNode;
}

export default function AdminTopBar({ onCreateRegionClick, children }: AdminTopBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950">
      <h1 className="text-xl font-bold">Admin Page</h1>
      <div className="flex items-center gap-4">
        {children}
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          onClick={onCreateRegionClick}
        >
          Create Region
        </button>
      </div>
    </div>
  );
}