import React from "react";
import { ExchangeTab, EXCHANGE_TAB_LABELS, } from "@/types/exchanges";

interface ExchangeTabsProps {
  tabs: ExchangeTab[];
  activeTab: ExchangeTab;
  onTabChange: (tab: ExchangeTab) => void;
}

export function ExchangeTabs({ tabs, activeTab, onTabChange }: ExchangeTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="mb-4 flex gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={
              [
                "rounded-full px-4 py-2 text-sm transition",
                isActive
                  ? "bg-surface-2 border border-accent text-primary"
                  : "bg-surface-2 text-icon-muted hover:bg-gray-600",
              ].join(" ")
            }
          >
            {EXCHANGE_TAB_LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}
