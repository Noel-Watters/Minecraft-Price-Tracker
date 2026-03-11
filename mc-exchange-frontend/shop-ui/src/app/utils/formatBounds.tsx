import { Bounds } from '@/types/region';

// Parse a single bound, handling both string and object formats
export const parseBounds = (bound: string | Bounds): Bounds => {
    if (typeof bound === 'string') {
        const coords = bound.slice(1, -1).split(',').map(Number);
        return {
            min_x: coords[0],
            min_y: coords[1],
            min_z: coords[2],
            max_x: coords[3],
            max_y: coords[4],
            max_z: coords[5]
        };
    }
    // If already an object, return as is
    return bound;
};

// Parse an array of bounds (strings or objects) into Bounds[]
export const parseAllBounds = (bounds: (string | Bounds)[] = []): Bounds[] => {
    if (!Array.isArray(bounds)) return [];
    return bounds.map(parseBounds);
};

// Format the first bound for display as corners
export const formatBounds = (bounds: (string | Bounds)[] = []) => {
    const parsed = parseAllBounds(bounds);
    if (!parsed.length) {
        return { corner1: 'No data', corner2: 'No data' };
    }
    const b = parsed[0];
    return {
        corner1: `${b.min_x}, ${b.min_y}, ${b.min_z}`,
        corner2: `${b.max_x}, ${b.max_y}, ${b.max_z}`
    };
};

// Format the first bound as a single string
export const formatBoundsString = (bounds: (string | Bounds)[] = []) => {
    const parsed = parseAllBounds(bounds);
    if (!parsed.length) return 'No bounds data';
    const b = parsed[0];
    return `${b.min_x},${b.min_y},${b.min_z} to ${b.max_x},${b.max_y},${b.max_z}`;
};

//Get Center of Bounds
export function getBoundsCenter(bounds: (string | Bounds)[] = []): string | null {
  if (!bounds || bounds.length === 0) return null;

  // Use your parseAllBounds utility to normalize the data
  const parsed = parseAllBounds(bounds);
  if (!parsed.length) return null;
  const b = parsed[0];

  // Now b is a Bounds object
  const centerX = Math.floor((b.min_x + b.max_x) / 2);
  const centerY = Math.floor((b.min_y + b.max_y) / 2);
  const centerZ = Math.floor((b.min_z + b.max_z) / 2);
  return `${centerX}, ${centerY}, ${centerZ}`;
}