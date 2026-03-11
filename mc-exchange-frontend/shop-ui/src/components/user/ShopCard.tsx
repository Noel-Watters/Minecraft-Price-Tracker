import React, { useState } from "react";
import EventList from "@/components/user/EventList";
import { ShopWithEvents } from "@/types/shop";
import { getBoundsCenter } from "@/app/utils/formatBounds";
import Image from "next/image";
import FloatingExchangeList from "@/components/user/FloatingExchangeList";

const FALLBACK_IMG = "/shop-icon.png";

// Helper to format contacts string and label
function getContactLabelAndNames(ownerString: string) {
  const owners = ownerString.split(",").map(o => o.trim()).filter(Boolean);
  const label = owners.length > 1 ? "Contacts" : "Contact";
  return { label, names: owners.join(", ") };
}

export default function ShopCard({ shop }: { shop: ShopWithEvents }) {
  const [imgError, setImgError] = useState(false);
  const displayImage = !imgError && shop.image ? shop.image : FALLBACK_IMG;
  const { label, names } = getContactLabelAndNames(shop.owner);

  return (
    <div className="max-w-400 mx-auto rounded-lg shadow p-6 text-white">
      <div className="flex items-center mb-4">
        <div className="w-30 h-30 bg-hover rounded-lg shadow-medium flex items-center justify-center overflow-hidden mr-4">
          <Image
            src={displayImage}
            alt={`${shop.name} icon`}
            className="w-full h-full object-cover rounded-lg"
            width={120}
            height={120}
            onError={() => setImgError(true)}
            unoptimized
          />
        </div>
        <div className="flex flex-row items-start justify-between w-full">
          <div>
            <h1 className="text-6xl font-bold text-accent-deep mb-1">
              {shop.name}
            </h1>
            <div className="text-secondary text-lg">
              {label}: {names}
            </div>
          </div>
          <div className="inline-flex flex-col items-center justify-center px-4 p-1 border border-accent-deep text-secondary rounded-full bg-surface-2 font-medium">
            {getBoundsCenter(shop.bounds) || "N/A"}
          </div>
        </div>
      </div>
      {shop.has_floating && Array.isArray(shop.floating_exchanges) && shop.floating_exchanges.length > 0 && (
        <div className="flex flex-row flex-wrap justify-start gap-2 mt-2 mb-4">
          {shop.floating_exchanges.map((exchange, idx) => (
            <FloatingExchangeList key={idx} exchanges={[exchange]} />
          ))}
        </div>
      )}
      {shop.events && shop.events.length > 0 && (
        <div>
          <EventList events={shop.events} showLocation={false} />
        </div>
      )}
    </div>
  );
}
