import React, { useState, useRef } from "react";

interface SearchResult {
  output_item_id?: string;
  compacted_output?: string;
  [key: string]: unknown;
}

interface SearchBarProps<T extends SearchResult> {
  placeholder?: string;
  apiEndpoint: string;
  onResultClick: (result: T) => void;
  onSubmit: (query: string) => void;
  getAuthHeaders?: () => Promise<Record<string, string>>;
  region?: string; 
}

export function SearchBar<T extends SearchResult>({
  placeholder,
  apiEndpoint,
  onResultClick,
  onSubmit,
  getAuthHeaders,
  region, 
}: SearchBarProps<T>) {
  const [query, setQuery] = useState("");
  const [uniqueResults, setUniqueResults] = useState<T[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(!!value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (value.trim()) {
        let headers: Record<string, string> = {};
        if (typeof getAuthHeaders === "function") {
          headers = await getAuthHeaders();
        }
        const joinChar = apiEndpoint.includes('?') ? '&' : '?';
        const res = await fetch(
          `${apiEndpoint}${joinChar}search_output=${encodeURIComponent(value)}&region=${encodeURIComponent(region ?? "pavia")}&limit=20`,
          { headers }
        );
        const data = await res.json();
        const allResults: T[] = data.data || [];
        const seen = new Set<string>();
        const deduped: T[] = [];
        for (const result of allResults) {
          const compacted_output = typeof result.compacted_output === 'string' ? result.compacted_output : undefined;
          const output_item_id = typeof result.output_item_id === 'string' ? result.output_item_id : '';
          const raw = compacted_output ? compacted_output : output_item_id;
          const formatted = String(raw)
            .split('_')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
            .trim();
          if (!seen.has(formatted)) {
            seen.add(formatted);
            deduped.push(result);
          }
        }
        setUniqueResults(deduped);
      } else {
        setUniqueResults([]);
      }
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    onSubmit(query);
  };

  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2 relative w-full">
      <input
        type="text"
        className="w-full rounded-full border border-border-medium bg-surface-2 px-3 py-2 text-sm text-primary placeholder:text-primary/70 focus:border-pv-accent-border focus:outline-none"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => setShowDropdown(!!query)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            setShowDropdown(false);
            onSubmit(query);
          }
        }}
      />
      {showDropdown && uniqueResults.length > 0 && (
        <ul className="absolute left-0 right-0 top-full text-secondary bg-surface rounded-lg border border-secondary shadow z-10 mt-1 max-h-60 overflow-auto">
          {uniqueResults.slice(0, 5).map((result, idx) => {
            const compacted_output = typeof result.compacted_output === 'string' ? result.compacted_output : undefined;
            const output_item_id = typeof result.output_item_id === 'string' ? result.output_item_id : '';
            const raw = compacted_output ? compacted_output : output_item_id;
            const formatted = String(raw)
              .split('_')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
              .trim();
            return (
              <li
                key={idx}
                className="px-3 py-2 hover:bg-hover cursor-pointer"
                onMouseDown={() => {
                  setShowDropdown(false);
                  onResultClick(result);
                }}
              >
                {formatted}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}