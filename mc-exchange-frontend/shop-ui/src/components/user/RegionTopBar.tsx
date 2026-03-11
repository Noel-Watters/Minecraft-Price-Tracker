import { getBoundsCenter } from '@/app/utils/formatBounds';
import Link from 'next/link';

interface RegionTopBarProps {
  region?: {
    name?: string;
    bounds?: any;
  };
  ownerButtonRef?: React.Ref<HTMLAnchorElement>;
}

export function RegionTopBar({ region, ownerButtonRef }: RegionTopBarProps) {
  return (
    <div className="p-4 ml-6 mb-10 flex flex-col gap-4">
      {/* Row: Region info left, button right */}
      <div className="flex justify-between items-start w-full">
        <div className="flex-1">
          <h1 className="text-8xl font-bold text-glow-cyan text-accent-deep mb-2 text-left">
            {region?.name || "Region"}
          </h1>
          {region && (
            <h2 className="text-left text-3xl text-text-muted mb-2">
              Location: {getBoundsCenter(region.bounds) || "N/A"}
            </h2>
          )}
        </div>
        <Link
          ref={ownerButtonRef}
          href="/login"
          className="bg-pv-surface-elevated hover:bg-hover border border-accent-deep text-secondary px-6 py-2 rounded-lg font-medium transition-colors w-auto ml-6"
        >
          Nation Owner
        </Link>
      </div>
    </div>
  );
}