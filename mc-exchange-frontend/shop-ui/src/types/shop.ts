import {Bounds} from './region';
import {Exchange} from './exchanges';
import {FloatingExchange} from './exchanges';

export interface Shop {
    id: string;
    name: string;
    created_at: string; // ISO String
    owner: string;
    dimension: string;
    bounds: Bounds[];
    region: string;
    image?: string; // URL to image
    has_floating: boolean;
    exchange_items?: string[];
}



export type ShopWithEvents = Shop & { 
  events: Exchange[] 
  floating_exchanges?: FloatingExchange[];
};