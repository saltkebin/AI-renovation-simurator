
import type React from 'react';

// FIX: Add AppMode type to be shared across components.
export type AppMode = 'renovation' | 'sketch2arch';

export interface GeneratedImage {
  src: string;
  aspectRatio: string;
  description?: string;
}

export type RenovationMode = 'oneClick' | 'partial' | 'furniture' | 'person' | 'products';

export interface ProductCategory {
  id: string;
  name: string;
}

export interface RegisteredProduct {
  id: string;
  src: string;
  categoryId: string;
}

export type RenovationStyle = 
  // Design Taste
  | 'nordic' | 'japandi' | 'industrial' | 'minimalist' | 'bohemian'
  | 'french_country' | 'mid_century_modern' | 'scandinavian_dark' | 'coastal' | 'asian_resort'
  // Color Theme
  | 'white_based' | 'dark_chic' | 'earth_tones' | 'pastel_colors' | 'monotone'
  | 'greige_nuance' | 'vivid_pop' | 'forest_green' | 'navy_gold' | 'natural_beige'
  // Material
  | 'solid_wood' | 'exposed_concrete' | 'brick_wall' | 'marble' | 'plaster_wall'
  | 'mortar_floor' | 'tile_wall' | 'brass_accent' | 'rattan_material' | 'glass_partition'
  // Focus Improvement
  | 'improve_lighting' | 'increase_storage' | 'create_openness' | 'add_workspace' | 'soundproof'
  | 'optimize_flow' | 'improve_insulation' | 'barrier_free' | 'improve_ventilation' | 'indoor_greening'
  // Space Concept
  | 'cafe_style' | 'hotel_like' | 'art_gallery' | 'pet_friendly' | 'home_theater'
  | 'hobby_room' | 'kids_space' | 'home_gym' | 'tatami_corner' | 'library_space';


export interface RenovationStyleItem {
  id: RenovationStyle;
  name: string;
}

export interface RenovationCategory {
  id: string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  styles: RenovationStyleItem[];
}

export type FurnitureStyleId = 'none' | 'modern' | 'nordic' | 'industrial' | 'natural' | 'hotel_like' | 'country' | 'japanese' | 'other';
export type RoomTypeId = 'none' | 'living_room' | 'dining_room' | 'bed_room' | 'guest_room' | 'home_office' | 'kids_room' | 'other';

export interface FurnitureStyle {
  id: FurnitureStyleId;
  name: string;
}

export interface RoomType {
  id: RoomTypeId;
  name: string;
}

export interface QuotationItem {
  name: string;
  cost_range: string;
}

export interface QuotationResult {
  construction_items: QuotationItem[];
  total_cost_range: string;
  notes: string;
}

export interface ArchOption {
  id: string;
  name: string;
  promptFragment: string;
}

export interface SketchCategory {
  id: string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  options: ArchOption[];
}

export type SketchFinetuneTabId = 'details' | 'time' | 'scenery' | 'person';

export interface SketchFinetuneOption {
  id: string;
  name: string;
  promptFragment: string;
}

export interface SketchFinetuneTab {
  id: SketchFinetuneTabId;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  options?: SketchFinetuneOption[];
}
