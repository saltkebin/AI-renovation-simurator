import React from 'react';
import type { PaintTypeId, WallpaperMaterialId, FurnitureCategoryId, FurnitureMaterialId } from '../types';
import { PAINT_TYPES, WALLPAPER_MATERIALS, FURNITURE_CATEGORIES, FURNITURE_MATERIALS } from '../constants';

type CategoryType = 'paint' | 'wallpaper' | 'furniture';

interface BaseFormFields {
  manufacturer: string;
  productName: string;
  description: string;
}

interface PaintFormFields extends BaseFormFields {
  colorName: string;
  colorCode: string;
  grade: PaintTypeId | '';
  pricePerSqm: string;
  durability: string;
}

interface WallpaperFormFields extends BaseFormFields {
  design: string;
  colorCode: string;
  material: WallpaperMaterialId | '';
  size: string;
  pricePerRoll: string;
  pricePerSqm: string;
}

interface FurnitureFormFields extends BaseFormFields {
  furnitureCategory: FurnitureCategoryId | '';
  material: FurnitureMaterialId | '';
  size: string;
  color: string;
  price: string;
}

interface ProductRegistrationFormProps {
  categoryType: CategoryType;
  pendingImages: File[];
  onRegister: () => void;
  onCancel: () => void;

  // Paint fields
  paintFields?: {
    manufacturer: string;
    setManufacturer: (v: string) => void;
    productName: string;
    setProductName: (v: string) => void;
    colorName: string;
    setColorName: (v: string) => void;
    colorCode: string;
    setColorCode: (v: string) => void;
    grade: PaintTypeId | '';
    setGrade: (v: PaintTypeId | '') => void;
    pricePerSqm: string;
    setPricePerSqm: (v: string) => void;
    durability: string;
    setDurability: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
  };

  // Wallpaper fields
  wallpaperFields?: {
    manufacturer: string;
    setManufacturer: (v: string) => void;
    productName: string;
    setProductName: (v: string) => void;
    design: string;
    setDesign: (v: string) => void;
    colorCode: string;
    setColorCode: (v: string) => void;
    material: WallpaperMaterialId | '';
    setMaterial: (v: WallpaperMaterialId | '') => void;
    size: string;
    setSize: (v: string) => void;
    pricePerRoll: string;
    setPricePerRoll: (v: string) => void;
    pricePerSqm: string;
    setPricePerSqm: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
  };

  // Furniture fields
  furnitureFields?: {
    manufacturer: string;
    setManufacturer: (v: string) => void;
    productName: string;
    setProductName: (v: string) => void;
    furnitureCategory: FurnitureCategoryId | '';
    setFurnitureCategory: (v: FurnitureCategoryId | '') => void;
    material: FurnitureMaterialId | '';
    setMaterial: (v: FurnitureMaterialId | '') => void;
    size: string;
    setSize: (v: string) => void;
    color: string;
    setColor: (v: string) => void;
    price: string;
    setPrice: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
  };
}

const ProductRegistrationForm: React.FC<ProductRegistrationFormProps> = ({
  categoryType,
  pendingImages,
  onRegister,
  onCancel,
  paintFields,
  wallpaperFields,
  furnitureFields,
}) => {
  const getCategoryLabel = () => {
    switch (categoryType) {
      case 'paint': return '塗料';
      case 'wallpaper': return '壁紙';
      case 'furniture': return '家具';
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm font-semibold text-blue-800 mb-3">
        💡 {getCategoryLabel()}カテゴリー専用の詳細情報
      </p>
      <p className="text-xs text-blue-700 mb-4">
        以下の情報は<strong>オプション</strong>ですが、入力しておくと画像生成や見積もりの精度が向上します。
      </p>

      {/* Image Preview */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {pendingImages.map((file, index) => (
          <div key={index} className="relative">
            <img
              src={URL.createObjectURL(file)}
              alt={`選択された画像 ${index + 1}`}
              className="w-full h-24 object-cover rounded border border-gray-300"
            />
            <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
          </div>
        ))}
      </div>

      {/* Paint Fields */}
      {categoryType === 'paint' && paintFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">メーカー名</label>
            <input
              type="text"
              value={paintFields.manufacturer}
              onChange={(e) => paintFields.setManufacturer(e.target.value)}
              placeholder="例: 日本ペイント"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">商品名</label>
            <input
              type="text"
              value={paintFields.productName}
              onChange={(e) => paintFields.setProductName(e.target.value)}
              placeholder="例: パーフェクトトップ"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">色名</label>
            <input
              type="text"
              value={paintFields.colorName}
              onChange={(e) => paintFields.setColorName(e.target.value)}
              placeholder="例: クリーム"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">カラーコード</label>
            <input
              type="text"
              value={paintFields.colorCode}
              onChange={(e) => paintFields.setColorCode(e.target.value)}
              placeholder="例: #FFF8DC"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">塗料グレード</label>
            <select
              value={paintFields.grade}
              onChange={(e) => paintFields.setGrade(e.target.value as PaintTypeId)}
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">選択してください</option>
              {PAINT_TYPES.filter(pt => pt.id !== 'ai_choice').map(pt => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">㎡単価（円）</label>
            <input
              type="number"
              value={paintFields.pricePerSqm}
              onChange={(e) => paintFields.setPricePerSqm(e.target.value)}
              placeholder="例: 2800"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">耐用年数（年）</label>
            <input
              type="number"
              value={paintFields.durability}
              onChange={(e) => paintFields.setDurability(e.target.value)}
              placeholder="例: 12"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">商品説明</label>
            <textarea
              value={paintFields.description}
              onChange={(e) => paintFields.setDescription(e.target.value)}
              placeholder="例: 高耐候性シリコン樹脂塗料"
              rows={2}
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Wallpaper Fields */}
      {categoryType === 'wallpaper' && wallpaperFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">メーカー名</label>
            <input
              type="text"
              value={wallpaperFields.manufacturer}
              onChange={(e) => wallpaperFields.setManufacturer(e.target.value)}
              placeholder="例: サンゲツ"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">商品名</label>
            <input
              type="text"
              value={wallpaperFields.productName}
              onChange={(e) => wallpaperFields.setProductName(e.target.value)}
              placeholder="例: RE-51234"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">柄・デザイン名</label>
            <input
              type="text"
              value={wallpaperFields.design}
              onChange={(e) => wallpaperFields.setDesign(e.target.value)}
              placeholder="例: ストライプ"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">カラー/色番</label>
            <input
              type="text"
              value={wallpaperFields.colorCode}
              onChange={(e) => wallpaperFields.setColorCode(e.target.value)}
              placeholder="例: ホワイト"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">素材</label>
            <select
              value={wallpaperFields.material}
              onChange={(e) => wallpaperFields.setMaterial(e.target.value as WallpaperMaterialId)}
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">選択してください</option>
              {WALLPAPER_MATERIALS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">サイズ</label>
            <input
              type="text"
              value={wallpaperFields.size}
              onChange={(e) => wallpaperFields.setSize(e.target.value)}
              placeholder="例: 92cm×10m"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">1ロール単価（円）</label>
            <input
              type="number"
              value={wallpaperFields.pricePerRoll}
              onChange={(e) => wallpaperFields.setPricePerRoll(e.target.value)}
              placeholder="例: 3500"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">㎡単価（円）</label>
            <input
              type="number"
              value={wallpaperFields.pricePerSqm}
              onChange={(e) => wallpaperFields.setPricePerSqm(e.target.value)}
              placeholder="例: 1200"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">商品説明</label>
            <textarea
              value={wallpaperFields.description}
              onChange={(e) => wallpaperFields.setDescription(e.target.value)}
              placeholder="例: 防汚・抗菌機能付き"
              rows={2}
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Furniture Fields */}
      {categoryType === 'furniture' && furnitureFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">メーカー/ブランド名</label>
            <input
              type="text"
              value={furnitureFields.manufacturer}
              onChange={(e) => furnitureFields.setManufacturer(e.target.value)}
              placeholder="例: IKEA"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">商品名</label>
            <input
              type="text"
              value={furnitureFields.productName}
              onChange={(e) => furnitureFields.setProductName(e.target.value)}
              placeholder="例: EKTORP"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">カテゴリー</label>
            <select
              value={furnitureFields.furnitureCategory}
              onChange={(e) => furnitureFields.setFurnitureCategory(e.target.value as FurnitureCategoryId)}
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">選択してください</option>
              {FURNITURE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">素材</label>
            <select
              value={furnitureFields.material}
              onChange={(e) => furnitureFields.setMaterial(e.target.value as FurnitureMaterialId)}
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">選択してください</option>
              {FURNITURE_MATERIALS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">サイズ</label>
            <input
              type="text"
              value={furnitureFields.size}
              onChange={(e) => furnitureFields.setSize(e.target.value)}
              placeholder="例: W120×D80×H75cm"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">カラー</label>
            <input
              type="text"
              value={furnitureFields.color}
              onChange={(e) => furnitureFields.setColor(e.target.value)}
              placeholder="例: ナチュラルブラウン"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">価格（円）</label>
            <input
              type="number"
              value={furnitureFields.price}
              onChange={(e) => furnitureFields.setPrice(e.target.value)}
              placeholder="例: 49800"
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">商品説明</label>
            <textarea
              value={furnitureFields.description}
              onChange={(e) => furnitureFields.setDescription(e.target.value)}
              placeholder="例: 北欧スタイルの3人掛けソファ"
              rows={2}
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onRegister}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
        >
          登録する
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default ProductRegistrationForm;
