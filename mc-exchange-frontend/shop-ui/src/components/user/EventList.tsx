"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Exchange } from "@/types/exchanges";
import {  EXCHANGE_TABS, ExchangeTab, EXCHANGE_TAB_LABELS, getExchangeKind, } from "@/types/exchanges";
import { ExchangeTabs } from "./ExchangeTabs";
import { ExchangeTable } from "./ExchangeTable";

interface EventsListProps {
  events: Exchange[];
  showLocation?: boolean;
}

export default function EventsList({
  events,
  showLocation = true,
}: EventsListProps) {
  // Which tabs are actually relevant for the given events?
  const availableTabs = useMemo<ExchangeTab[]>(() => {
    return EXCHANGE_TABS.filter((tab) =>
      events.some((e) => getExchangeKind(e) === tab)
    );
  }, [events]);

  const [activeTab, setActiveTab] = useState<ExchangeTab>(
    availableTabs[0] ?? "sell"
  );

  // Reset activeTab whenever availableTabs changes
  useEffect(() => {
    if (availableTabs.length === 0) {
      setActiveTab("sell");
      return;
    }

    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs]);

  // Filter events based on active tab
  const filteredEvents = useMemo(
    () => events.filter((event) => getExchangeKind(event) === activeTab),
    [events, activeTab]
  );

  const emptyMessage = `No ${EXCHANGE_TAB_LABELS[
    activeTab
  ].toLowerCase()} events.`;

  return (
    <div>
      <ExchangeTabs
        tabs={availableTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ExchangeTable
        events={filteredEvents}
        showLocation={showLocation}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
