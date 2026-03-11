export interface Region {
    id: string;
    created_at: string; 
    name:string;
    slug:string;
    dimension:string;
    bounds: Bounds[];
    shops: string[];
    owners: string[] | null;
}

export interface Bounds {
    min_x: number;
    min_y: number;
    min_z: number;
    max_x: number;
    max_y: number;
    max_z: number;
}
