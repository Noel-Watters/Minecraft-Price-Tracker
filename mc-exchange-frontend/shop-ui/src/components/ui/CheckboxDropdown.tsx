"use client";

import React, { useState } from "react";

interface CheckboxDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function CheckboxDropdown({
  label,
  options,
  selected,
  onChange,
}: CheckboxDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((v) => v !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative mb-2">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md border px-2 py-1 text-left text-sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-md border bg-surface text-sm shadow-lg">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center px-2 py-1 hover:bg-hover"
            >
              <input
                type="checkbox"
                className="mr-2"
                checked={selected.includes(opt)}
                onChange={() => handleToggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
