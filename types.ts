
import type React from 'react';

// FIX: Add AppMode type to be shared across components.
export type AppMode = 'renovation' | 'exterior';

// Exterior mode sub-modes
export type ExteriorSubMode = 'sketch2arch' | 'exterior_painting';

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

// Exterior painting types
export interface ExteriorColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface ExteriorMaterialOption {
  id: string;
  name: string;
  promptFragment: string;
}

export type ColorMode = 'single' | 'two_tone_horizontal' | 'two_tone_vertical';

export interface TwoToneColorConfig {
  mode: ColorMode;
  primaryColor: string;  // Color ID or 'custom'
  primaryRgb: { r: number; g: number; b: number };
  secondaryColor: string; // Color ID or 'custom'
  secondaryRgb: { r: number; g: number; b: number };
  splitRatio: number; // 30, 50, or 70 (percentage for primary color area)
}

export interface PaintProduct extends RegisteredProduct {
  manufacturer?: string;        // メーカー名
  productName?: string;         // 商品名
  grade?: PaintTypeId;          // 塗料グレード
  color?: string;               // 色名
  colorCode?: string;           // カラーコード（例: #FFFFFF）
  durability?: number;          // 耐用年数
  pricePerSqm?: number;         // ㎡単価
  description?: string;         // 商品説明
}

// Wallpaper product types
export type WallpaperMaterialId = 'non_woven' | 'vinyl' | 'paper' | 'fabric' | 'other';

export interface WallpaperProduct extends RegisteredProduct {
  manufacturer?: string;        // メーカー名
  productName?: string;         // 商品名
  design?: string;              // 柄・デザイン名
  colorCode?: string;           // カラー/色番
  material?: WallpaperMaterialId; // 素材
  size?: string;                // サイズ（例: 92cm×10m）
  pricePerRoll?: number;        // 1ロール単価
  pricePerSqm?: number;         // ㎡単価
  description?: string;         // 商品説明
}

// Furniture product types
export type FurnitureCategoryId = 'sofa' | 'table' | 'chair' | 'storage' | 'bed' | 'desk' | 'shelf' | 'other';
export type FurnitureMaterialId = 'wood' | 'metal' | 'fabric' | 'leather' | 'glass' | 'plastic' | 'mixed' | 'other';

export interface FurnitureProduct extends RegisteredProduct {
  manufacturer?: string;        // メーカー/ブランド名
  productName?: string;         // 商品名
  furnitureCategory?: FurnitureCategoryId; // 家具カテゴリー
  material?: FurnitureMaterialId; // 素材
  size?: string;                // サイズ（例: W120×D80×H75cm）
  color?: string;               // カラー
  price?: number;               // 価格
  description?: string;         // 商品説明
}

// Paint type for exterior painting quotation
export type PaintTypeId = 'silicon' | 'fluorine' | 'inorganic' | 'heat_shield' | 'ai_choice' | 'other';

export interface PaintType {
  id: PaintTypeId;
  name: string;
  description: string;
}

// Tenant quotation settings
export interface TenantQuotationSettings {
  id?: string;
  tenantId: string;

  // Company information
  companyInfo: {
    name: string;
    logo?: string;
    logoSize?: number; // ロゴの高さ（ピクセル）デフォルト: 48
    postalCode: string;
    address: string;
    tel: string;
    fax?: string;
    email: string;
    website?: string;
    registrationNumber?: string; // 登録番号
  };

  // Quotation defaults
  quotationDefaults: {
    validityPeriod: number; // 有効期限（日数）
    paymentTerms: string; // 支払条件
    taxRate: number; // 消費税率
    notes: string; // デフォルト備考
  };

  // AI assistance custom data
  aiCustomData: {
    companyPolicy: string; // 会社方針・強み
    pricingGuidelines: string; // 価格設定ガイドライン
    commonDiscounts: string; // 一般的な値引き条件
    specialNotes: string; // 特記事項のパターン
  };
}

// Formal quotation document
export type QuotationStatus = 'draft' | 'confirmed' | 'sent';

export interface FormalQuotationItem {
  id: string;
  category: string; // 項目カテゴリー（例：塗装工事、内装工事）
  description: string; // 項目説明
  quantity: number; // 数量
  unit: string; // 単位（㎡、式、個など）
  unitPrice: number; // 単価
  amount: number; // 金額（quantity × unitPrice）
}

export interface FormalQuotation {
  id?: string;
  tenantId: string;
  quotationNumber?: string; // 見積番号
  createdAt?: Date;
  updatedAt?: Date;
  status: QuotationStatus;

  // Source data (from AI renovation)
  originalImageUrl?: string;
  renovatedImageUrl?: string;

  // Estimated data (AI generated)
  estimatedItems?: QuotationItem[];
  estimatedTotalRange?: string;

  // Customer information
  customerInfo: {
    name: string;
    email?: string; // 顧客メールアドレス
    address: string;
    propertyInfo: string; // 物件情報
  };

  // Formal quotation items
  items: FormalQuotationItem[];
  subtotal: number; // 小計
  tax: number; // 消費税
  total: number; // 合計
  notes: string; // 備考
  validUntil?: Date; // 有効期限

  // Template reference
  templateId?: string;
}

// Quotation counter for auto-numbering
export interface QuotationCounter {
  id?: string;
  tenantId: string;
  year: number;
  lastNumber: number; // Last used number for this year
}

// Quotation item master for frequently used items
export interface QuotationItemMaster {
  id?: string;
  tenantId: string;
  category: string;
  description: string;
  defaultUnit: string;
  defaultUnitPrice: number;
  sortOrder?: number;
  createdAt?: Date;
}

// Quotation template for reusable quotation patterns
export interface QuotationTemplate {
  id?: string;
  tenantId: string;
  name: string; // テンプレート名（例：外壁塗装標準パッケージ）
  description?: string; // 説明
  items: FormalQuotationItem[];
  defaultNotes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tenant email settings for SendGrid integration
export interface TenantEmailSettings {
  id?: string;
  tenantId: string;
  provider: 'sendgrid'; // 将来的に他のプロバイダーも対応可能

  // SendGrid settings
  sendgridApiKey: string; // 暗号化して保存
  senderEmail: string; // 送信元メールアドレス
  senderName?: string; // 送信者名（任意）

  // Verification status
  isVerified: boolean; // テスト送信成功済みか
  lastTestedAt?: Date; // 最後にテストした日時
  testResult?: 'success' | 'failed'; // テスト結果
  errorMessage?: string; // エラーメッセージ

  // Statistics
  emailsSentToday?: number;
  emailsSentThisMonth?: number;
  dailyLimit?: number; // ユーザーが設定する送信上限

  createdAt?: Date;
  updatedAt?: Date;
}

// ===== Commercial Facility Renovation Types (Development Only) =====

/**
 * Renovation sub-mode for selecting residential or commercial facility renovation
 * Commercial mode is only available when VITE_ENABLE_COMMERCIAL_MODE=true
 */
export type RenovationSubMode = 'residential' | 'commercial';

/**
 * Commercial facility types
 * Each type has specific adjustment items and workflow requirements
 */
export type FacilityType =
  | 'office'      // オフィス空間
  | 'hotel'       // ホテル・宿泊施設
  | 'retail'      // 小売店舗
  | 'medical'     // 医療・クリニック
  | 'education'   // 教育施設
  | 'fitness'     // フィットネス・ジム
  | 'salon'       // サロン・スパ
  | 'coworking';  // コワーキングスペース

/**
 * Original space type before renovation
 * Important for AI to understand starting conditions
 */
export type OriginalSpaceType =
  | 'warehouse'        // 倉庫
  | 'existing_office'  // 既存オフィス
  | 'former_store'     // 元店舗
  | 'residence'        // 住宅
  | 'skeleton';        // スケルトン

/**
 * Commercial renovation workflow steps
 * Each step builds upon the previous, requiring 2-4 iterations per step
 */
export type CommercialStep =
  | 'facility_definition'  // 施設定義（1-2回生成）
  | 'zoning'               // ゾーニング・レイアウト（3-5回生成）
  | 'detail_design'        // 詳細デザイン（6-8回生成）
  | 'finishing';           // 仕上げ（9-12回生成）

/**
 * Adjustment item for commercial facility customization
 * Each facility type has its own set of adjustment items
 */
export interface CommercialAdjustmentItem {
  id: string;
  name: string;
  promptFragment: string;
  options?: string[]; // For dropdown items
}

/**
 * Adjustment category for organizing adjustment items
 */
export interface CommercialAdjustmentCategory {
  id: string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  items: CommercialAdjustmentItem[];
}

/**
 * Commercial renovation context for cumulative prompt building
 * Stores all selections and prompt history to maintain consistency across 10+ generations
 */
export interface CommercialRenovationContext {
  facilityType: FacilityType | null;
  originalSpaceType: OriginalSpaceType | null;
  currentStep: CommercialStep;
  generationCount: number; // Current generation number (1-12+)

  // Phase 1: Facility Definition
  conceptKeywords: string[]; // 基本コンセプト
  targetScale: string; // 規模（面積・収容人数など）

  // Phase 2: Zoning
  zoningData: {
    areas: string[]; // 配置したエリア
    flowPattern: string; // 動線パターン
  };

  // Phase 3: Detail Design
  designDetails: {
    themes: Map<string, string>; // エリアごとのテーマ
    colorScheme: string[]; // カラースキーム
    materials: string[]; // 素材選択
  };

  // Cumulative prompt history
  promptHistory: string[]; // Previous prompts to build upon
  lastGeneratedImageUrl: string | null;
}
