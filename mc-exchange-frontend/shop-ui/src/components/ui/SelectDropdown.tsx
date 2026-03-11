"use client";
import React, { useState } from "react";

interface SelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function SelectDropdown({
  label,
  options,
  value,
  onChange,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || label;

  return (
    <div className="relative mb-2">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md border px-2 py-1 text-left text-sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-md border bg-surface text-sm shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`flex w-full items-center px-2 py-1 text-left hover:bg-hover ${
                value === opt.value ? "font-semibold" : ""
              }`}
              onClick={() => handleSelect(opt.value)}
            >
              <span className="mr-2">
                <input
                  type="radio"
                  checked={value === opt.value}
                  readOnly
                  className="accent-cyan-500"
                />
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}