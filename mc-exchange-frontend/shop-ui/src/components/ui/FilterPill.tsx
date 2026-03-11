"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

interface FilterPillProps {
  label: string;
  onRemove: () => void;
}

export function FilterPill({ label, onRemove }: FilterPillProps) {
  return (
    <span className="flex items-center rounded-lg border border-accent-deep bg-surface-2 px-2 py-1 text-xs text-secondary">
      <span>{label}</span>
      <button
        type="button"
        className="ml-1 inline-flex"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </span>
  );
}
