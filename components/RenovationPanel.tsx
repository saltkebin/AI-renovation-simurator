import React, { useState, useEffect } from 'react';
// FIX: Import AppMode type.
import type { RenovationMode, FurnitureStyleId, RoomTypeId, RegisteredProduct, ProductCategory, ArchOption, AppMode, SketchCategory, SketchFinetuneTabId, SketchFinetuneOption, ExteriorSubMode } from '../types';
import { RENOVATION_CATEGORIES, OMAKASE_PROMPT, OMAKASE_SKETCH_PROMPT, FURNITURE_STYLES, ROOM_TYPES, SKETCH_CATEGORIES, SKETCH_FINETUNE_TABS, EXTERIOR_COLORS, EXTERIOR_MATERIALS } from '../constants';
import { MagicWandIcon, EditIcon, SparklesIcon, LightBulbIcon, SpinnerIcon, ArrowUturnLeftIcon, SofaIcon, UserGroupIcon, BuildingStorefrontIcon, HomeModernIcon, CubeIcon, SwatchIcon, DocumentTextIcon, PencilIcon, PaintBrushIcon, TrashIcon } from './Icon';
import { generateSuggestions } from '../services/geminiService';

interface RenovationPanelProps {
  // FIX: Added appMode prop to accept the application's current mode.
  appMode: AppMode;
  exteriorSubMode?: ExteriorSubMode;
  onExteriorSubModeChange?: (mode: ExteriorSubMode) => void;
  onGenerate: (mode: RenovationMode | 'sketch' | 'partial', prompt: string, products?: RegisteredProduct[]) => void;
  isDisabled: boolean;
  activeImage: string | null;
  mimeType: string;
  isFinetuningMode: boolean;
  onExitFinetuning: () => void;
  categories: ProductCategory[];
  products: RegisteredProduct[];
}

const TABS: { id: RenovationMode; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'oneClick', name: 'かんたん', icon: MagicWandIcon },
  { id: 'partial', name: '詳細', icon: EditIcon },
  { id: 'products', name: '商品', icon: BuildingStorefrontIcon },
  { id: 'furniture', name: '家具', icon: SofaIcon },
  { id: 'person', name: '人物', icon: UserGroupIcon },
];

const RenovationPanel: React.FC<RenovationPanelProps> = ({
  appMode,
  exteriorSubMode = 'sketch2arch',
  onExteriorSubModeChange,
  onGenerate,
  isDisabled,
  activeImage,
  mimeType,
  isFinetuningMode,
  onExitFinetuning,
  categories,
  products
}) => {
  const [activeTab, setActiveTab] = useState<RenovationMode>('oneClick');
  const [finetuneActiveTab, setFinetuneActiveTab] = useState<'partial' | 'furniture' | 'person' | 'products'>('partial');
  const [customPrompt, setCustomPrompt] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [selectedFurnitureStyle, setSelectedFurnitureStyle] = useState<FurnitureStyleId>(FURNITURE_STYLES[0].id);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomTypeId>(ROOM_TYPES[0].id);
  const [customFurnitureStyle, setCustomFurnitureStyle] = useState('');
  const [customRoomType, setCustomRoomType] = useState('');

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  // States for Sketch to Arch mode
  const [sketchOpenAccordion, setSketchOpenAccordion] = useState<string | null>(null);
  const [sketchActiveTab, setSketchActiveTab] = useState<'easy' | 'detailed'>('easy');
  const [sketchFinetuneActiveTab, setSketchFinetuneActiveTab] = useState<SketchFinetuneTabId>('details');
  const [customTimePrompt, setCustomTimePrompt] = useState('');
  const [customSceneryPrompt, setCustomSceneryPrompt] = useState('');

  // Exterior painting states
  const [exteriorPaintingActiveTab, setExteriorPaintingActiveTab] = useState<'easy' | 'detailed'>('easy');
  const [selectedExteriorColor, setSelectedExteriorColor] = useState<string>('');
  const [selectedExteriorMaterial, setSelectedExteriorMaterial] = useState<string>('');
  const [exteriorCustomPrompt, setExteriorCustomPrompt] = useState('');
  const [customR, setCustomR] = useState<number>(255);
  const [customG, setCustomG] = useState<number>(255);
  const [customB, setCustomB] = useState<number>(255);

  // Exterior painting presets by category
  const exteriorPresetCategories = [
    {
      id: 'white_series',
      name: '白系',
      icon: SwatchIcon,
      presets: [
        { id: 'pure_white', name: 'ピュアホワイト', color: 'white', material: 'siding' },
        { id: 'cream_white', name: 'クリームホワイト', color: 'cream', material: 'stucco' },
        { id: 'white_modern', name: 'ホワイトモダン', color: 'white', material: 'concrete' },
      ]
    },
    {
      id: 'beige_series',
      name: 'ベージュ系',
      icon: SwatchIcon,
      presets: [
        { id: 'natural_beige', name: 'ナチュラルベージュ', color: 'beige', material: 'stucco' },
        { id: 'warm_beige', name: '温かみベージュ', color: 'beige', material: 'wood' },
        { id: 'light_beige', name: 'ライトベージュ', color: 'cream', material: 'siding' },
      ]
    },
    {
      id: 'gray_series',
      name: 'グレー系',
      icon: SwatchIcon,
      presets: [
        { id: 'light_gray', name: 'ライトグレー', color: 'light_gray', material: 'siding' },
        { id: 'modern_gray', name: 'モダングレー', color: 'gray', material: 'concrete' },
        { id: 'urban_gray', name: 'アーバングレー', color: 'dark_gray', material: 'concrete' },
        { id: 'charcoal', name: 'チャコール', color: 'dark_gray', material: 'tile' },
      ]
    },
    {
      id: 'brown_series',
      name: 'ブラウン系',
      icon: SwatchIcon,
      presets: [
        { id: 'natural_wood', name: 'ナチュラルウッド', color: 'brown', material: 'wood' },
        { id: 'classic_brick', name: 'クラシックレンガ', color: 'brown', material: 'brick' },
        { id: 'warm_brown', name: 'ウォームブラウン', color: 'brown', material: 'stucco' },
      ]
    },
    {
      id: 'dark_series',
      name: 'ダーク系',
      icon: SwatchIcon,
      presets: [
        { id: 'elegant_navy', name: 'エレガントネイビー', color: 'navy', material: 'tile' },
        { id: 'deep_navy', name: 'ディープネイビー', color: 'navy', material: 'siding' },
        { id: 'sophisticated_black', name: 'ソフィスティケイテッドブラック', color: 'black', material: 'concrete' },
        { id: 'modern_black', name: 'モダンブラック', color: 'black', material: 'tile' },
      ]
    },
    {
      id: 'green_series',
      name: 'グリーン系',
      icon: SwatchIcon,
      presets: [
        { id: 'nature_green', name: 'ナチュラルグリーン', color: 'green', material: 'stucco' },
        { id: 'forest_green', name: 'フォレストグリーン', color: 'green', material: 'wood' },
        { id: 'sage_green', name: 'セージグリーン', color: 'green', material: 'siding' },
      ]
    },
  ];

  const [exteriorPresetOpenAccordion, setExteriorPresetOpenAccordion] = useState<string | null>(null);


  useEffect(() => {
    // When categories are loaded, if no category is selected or the selected one is not in the list, select the first one.
    if (categories.length > 0 && !categories.find(c => c.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);


  useEffect(() => {
    if (isFinetuningMode) {
      setCustomPrompt('');
      setSuggestions([]);
      setSuggestionError(null);
      setFinetuneActiveTab('partial');
      setSketchFinetuneActiveTab('details');
    }
  }, [isFinetuningMode]);

  useEffect(() => {
    // モードが切り替わったら状態をリセット
    setCustomPrompt('');
    setSuggestions([]);
    setSuggestionError(null);
    setActiveTab('oneClick');
    setSketchOpenAccordion(null);
    setSketchActiveTab('easy');
  }, [appMode]);

  const handleGenerate = () => {
    if (customPrompt.trim()) {
      const isProductsContext = (!isFinetuningMode && activeTab === 'products') || (isFinetuningMode && finetuneActiveTab === 'products');
      
      if (isProductsContext) {
        const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
        if (selectedProducts.length === 0) {
            alert("使用する商品を1つ以上選択してください。");
            return;
        }
        
        const category = categories.find(c => c.id === selectedCategoryId);
        const isWallpaper = category?.name.includes('壁紙');

        let finalPrompt = customPrompt;
        if (isWallpaper && selectedProducts.length > 0) {
            finalPrompt = `提供されている商品画像は、壁紙のテクスチャパターンです。これを、引き伸ばして一枚の絵のように適用するのではなく、自然なスケール感で壁全体に繰り返し（タイリングして）適用してください。シームレスなパターンになるようにしてください。ユーザーからの元々の指示は「${customPrompt}」です。この指示で指定された壁に、上記の要件で壁紙を適用してください。`;
        }
        
        onGenerate('products', finalPrompt, selectedProducts);
        return;
      }
      
      if (appMode === 'exterior' && exteriorSubMode === 'sketch2arch' && !isFinetuningMode) {
        onGenerate('sketch', customPrompt);
        return;
      }

      const mode = 'partial';
      let finalPrompt = customPrompt;
      
      const isFurnitureContext = (appMode === 'renovation') && ((isFinetuningMode && finetuneActiveTab === 'furniture') || (!isFinetuningMode && activeTab === 'furniture'));
      const isPersonContext = (isFinetuningMode && ( (appMode === 'renovation' && finetuneActiveTab === 'person') || (appMode === 'exterior' && exteriorSubMode === 'sketch2arch' && sketchFinetuneActiveTab === 'person') )) || (!isFinetuningMode && activeTab === 'person');

      if (isFurnitureContext) {
        const styleName = selectedFurnitureStyle === 'other'
          ? customFurnitureStyle.trim()
          : FURNITURE_STYLES.find(s => s.id === selectedFurnitureStyle)?.name;
        
        const roomTypeName = selectedRoomType === 'other'
          ? customRoomType.trim()
          : ROOM_TYPES.find(r => r.id === selectedRoomType)?.name;
        
        let promptPrefix = 'これは家具の追加・削除の指示です。提供された画像にある部屋の構造（壁、床、天井、窓など）と、指示にない既存の家具は、絶対に一切変更しないでください。';
        const contextParts: string[] = [];

        if (selectedFurnitureStyle !== 'none' && styleName) {
            contextParts.push(`${styleName}スタイル`);
        }
        if (selectedRoomType !== 'none' && roomTypeName) {
            contextParts.push(`${roomTypeName}に合う`);
        }
        
        if (contextParts.length > 0) {
            promptPrefix += ` これから追加する家具は、${contextParts.join('で')}という点を考慮してください。`;
        }
        
        promptPrefix += ' 以下の指示に従って、家具の追加または削除のみを実行してください：';
        finalPrompt = `${promptPrefix} ${customPrompt}`;
      } else if (isPersonContext) {
        let promptPrefix = `これは人物の追加・削除の指示です。提供された画像にある${appMode === 'exterior' && exteriorSubMode === 'sketch2arch' ? 'パースの' : '部屋の'}構造（壁、床、天井、窓など）と、すべての家具は、絶対に一切変更しないでください。追加する人物は、特に指定がない限り日本人として描写してください。以下の指示に従って、人物の追加または削除のみを実行してください：`;
        finalPrompt = `${promptPrefix} ${customPrompt}`;
      }
      onGenerate(mode, finalPrompt);
    }
  };

  const handleSuggest = async () => {
    if (!activeImage || !mimeType) return;

    setIsSuggesting(true);
    setSuggestions([]);
    setSuggestionError(null);

    try {
      const base64Data = activeImage.split(',')[1];
      if (!base64Data) {
          throw new Error("Invalid image data.");
      }
      
      let modeForSuggestion: 'initial' | 'finetune' | 'furniture' | 'person' | 'sketch' | 'sketch_person';
      let options;

      if (appMode === 'exterior' && exteriorSubMode === 'sketch2arch') {
        if(isFinetuningMode) {
          modeForSuggestion = sketchFinetuneActiveTab === 'person' ? 'sketch_person' : 'finetune';
        } else {
          modeForSuggestion = 'sketch';
        }
      } else { // renovation mode
        const isFurnitureContext = (isFinetuningMode && finetuneActiveTab === 'furniture') || (!isFinetuningMode && activeTab === 'furniture');
        const isPersonContext = (isFinetuningMode && finetuneActiveTab === 'person') || (!isFinetuningMode && activeTab === 'person');
        
        modeForSuggestion = isFinetuningMode
            ? (isFurnitureContext ? 'furniture' : isPersonContext ? 'person' : 'finetune')
            : (isFurnitureContext ? 'furniture' : isPersonContext ? 'person' : 'initial');

        if (isFurnitureContext) {
            options = {
                style: selectedFurnitureStyle === 'other'
                ? customFurnitureStyle.trim() || undefined
                : selectedFurnitureStyle !== 'none' ? FURNITURE_STYLES.find(s => s.id === selectedFurnitureStyle)?.name : undefined,
                roomType: selectedRoomType === 'other'
                ? customRoomType.trim() || undefined
                : selectedRoomType !== 'none' ? ROOM_TYPES.find(r => r.id === selectedRoomType)?.name : undefined,
            };
        }
      }
        
      const newSuggestions = await generateSuggestions(base64Data, mimeType, modeForSuggestion, options);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      setSuggestionError("提案の取得に失敗しました。");
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setCustomPrompt(suggestion);
  };

  const handleTabClick = (tabId: RenovationMode) => {
    setActiveTab(tabId);
    setSuggestions([]);
    setSuggestionError(null);
    setCustomPrompt('');
    setSelectedProductIds([]);
  };
  
  const handleFinetuneTabClick = (tabId: 'partial' | 'furniture' | 'person' | 'products') => {
    setFinetuneActiveTab(tabId);
    setSuggestions([]);
    setSuggestionError(null);
    setCustomPrompt('');
    setSelectedProductIds([]);
  };

  const handleSketchFinetuneTabClick = (tabId: SketchFinetuneTabId) => {
    setSketchFinetuneActiveTab(tabId);
    setSuggestions([]);
    setSuggestionError(null);
    setCustomPrompt('');
    setCustomTimePrompt('');
    setCustomSceneryPrompt('');
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const renderPromptSection = (isFinetune: boolean) => {
    const isFurnitureContext = (appMode === 'renovation') && ((isFinetune && finetuneActiveTab === 'furniture') || (!isFinetune && activeTab === 'furniture'));
    const isPersonContext = (isFinetune && ( (appMode === 'renovation' && finetuneActiveTab === 'person') || (appMode === 'exterior' && exteriorSubMode === 'sketch2arch' && sketchFinetuneActiveTab === 'person') )) || (!isFinetuningMode && activeTab === 'person');
    
    const placeholder = isPersonContext
      ? (appMode === 'exterior' && exteriorSubMode === 'sketch2arch'
          ? "例：庭でくつろいでいる家族を追加してください。 / 例：エントランスの人物を削除して。"
          : "例：ソファに座って本を読んでいる女性を追加して。 / 例：窓際の男性を削除して。")
      : isFurnitureContext
      ? "例：赤いソファを追加して。 / 例：中央のテーブルを削除して。"
      : isFinetune
      ? (appMode === 'exterior' && exteriorSubMode === 'sketch2arch'
          ? "例：建物の素材感をより際立たせてください。空を夕焼けに変えて、ドラマチックな印象にしてください。"
          : "例：壁の色をベージュに変更してください。")
      : (appMode === 'exterior' && exteriorSubMode === 'sketch2arch'
          ? "例：建物の外壁をコンクリート打ちっぱなしにして、屋根は片流れにしてください。植栽も豊かにお願いします。"
          : "例：壁をライトグレーに変更し、ナチュラルテイストのソファを配置してください。");
    
    const suggestButtonText = isPersonContext
      ? 'AIおすすめ人物配置案'
      : isFurnitureContext
      ? 'AIおすすめ追加/削除案'
      : isFinetune
      ? 'AIおすすめ修正案'
      : 'AIおすすめ提案';
    
    const generateButtonText = isFinetune ? '修正を生成' : '生成する';

    return (
      <div className="space-y-4">
        <button
          onClick={handleSuggest}
          disabled={isDisabled || isSuggesting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isSuggesting ? (
            <SpinnerIcon className="w-5 h-5 animate-spin" />
          ) : (
            <LightBulbIcon className="w-5 h-5" />
          )}
          <span>{isSuggesting ? '提案を生成中...' : suggestButtonText}</span>
        </button>

        {suggestionError && <p className="text-sm text-center text-red-500">{suggestionError}</p>}
        
        {suggestions.length > 0 && (
            <div className="space-y-2 pt-4 mt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600">提案を選択してください:</p>
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left p-2.5 text-sm text-gray-800 bg-white rounded-lg hover:bg-gray-100 border border-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        )}
        
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          disabled={isDisabled}
        />
        <button
          onClick={handleGenerate}
          disabled={isDisabled || !customPrompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
        >
          <SparklesIcon className="w-5 h-5" />
          <span>{generateButtonText}</span>
        </button>
      </div>
    );
  };

  const renderFurnitureOptions = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="furniture-style" className="block text-sm font-medium text-gray-700 mb-1">スタイル</label>
          <select
            id="furniture-style"
            value={selectedFurnitureStyle}
            onChange={(e) => {
              const value = e.target.value as FurnitureStyleId;
              setSelectedFurnitureStyle(value);
              if (value !== 'other') {
                setCustomFurnitureStyle('');
              }
            }}
            disabled={isDisabled}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            {FURNITURE_STYLES.map(style => (
              <option key={style.id} value={style.id}>{style.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="room-type" className="block text-sm font-medium text-gray-700 mb-1">部屋の用途</label>
          <select
            id="room-type"
            value={selectedRoomType}
            onChange={(e) => {
              const value = e.target.value as RoomTypeId;
              setSelectedRoomType(value);
              if (value !== 'other') {
                setCustomRoomType('');
              }
            }}
            disabled={isDisabled}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            {ROOM_TYPES.map(room => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </div>
      </div>
      {(selectedFurnitureStyle === 'other' || selectedRoomType === 'other') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            {selectedFurnitureStyle === 'other' && (
              <input
                type="text"
                value={customFurnitureStyle}
                onChange={(e) => setCustomFurnitureStyle(e.target.value)}
                placeholder="例：サイバーパンク"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                disabled={isDisabled}
              />
            )}
          </div>
          <div>
            {selectedRoomType === 'other' && (
              <input
                type="text"
                value={customRoomType}
                onChange={(e) => setCustomRoomType(e.target.value)}
                placeholder="例：趣味の部屋"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                disabled={isDisabled}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProductsPanel = () => {
    const filteredProducts = products.filter(p => p.categoryId === selectedCategoryId);
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-1">1. カテゴリーを選択</label>
          <select
            id="product-category"
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedProductIds([]);
            }}
            disabled={isDisabled || categories.length === 0}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            {categories.length === 0 ? (
                <option>カテゴリー未登録</option>
            ) : (
                categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                ))
            )}
          </select>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">2. 使用する商品を選択</h4>
          {categories.length === 0 || !selectedCategoryId ? (
              <p className="text-center text-sm text-gray-500 py-4">
                  データベースに商品カテゴリーがありません。
              </p>
          ) : filteredProducts.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">
                  このカテゴリーに商品がありません。
              </p>
          ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-gray-100 rounded-lg">
                  {filteredProducts.map(product => (
                      <button
                          key={product.id}
                          onClick={() => handleProductSelect(product.id)}
                          className={`relative w-full aspect-square rounded-md focus:outline-none transition-all duration-200 ${
                              selectedProductIds.includes(product.id) ? 'ring-4 ring-offset-1 ring-indigo-500' : 'ring-2 ring-transparent hover:ring-indigo-300'
                          }`}
                      >
                          <img src={product.src} alt="商品" className="w-full h-full object-cover rounded-md" />
                          {selectedProductIds.includes(product.id) && (
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-md">
                                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                              </div>
                          )}
                      </button>
                  ))}
              </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">3. 使い方を指示</h4>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="例: この壁紙を奥の壁に貼ってください。/ このソファを窓際に配置してください。"
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={isDisabled}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isDisabled || !customPrompt.trim() || selectedProductIds.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
        >
          <SparklesIcon className="w-5 h-5" />
          <span>{isFinetuningMode ? '商品を使って修正' : '商品を使って生成'}</span>
        </button>
      </div>
    );
  };
  
  const renderSketchEasyPanel = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">AIおまかせ生成</h3>
        <p className="text-sm text-gray-600 mt-1">
          スケッチを元にAIが最適なパースを自動で生成します。
        </p>
        <button
          onClick={() => onGenerate('sketch', OMAKASE_SKETCH_PROMPT)}
          disabled={isDisabled}
          className="w-full mt-3 flex items-center justify-center gap-3 px-4 py-3 font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg hover:from-blue-700 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <SparklesIcon className="w-6 h-6" />
          <span>AIおまかせパース生成</span>
        </button>
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-sm font-semibold text-gray-500">またはスタイルを選択</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div className="border rounded-md">
        {SKETCH_CATEGORIES.map((category: SketchCategory) => (
          <div key={category.id} className="border-b border-gray-200 last:border-b-0">
            <button
              onClick={() => setSketchOpenAccordion(sketchOpenAccordion === category.id ? null : category.id)}
              className="w-full flex justify-between items-center p-3 text-left font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-3">
                <category.icon className="w-6 h-6 text-blue-500" />
                {category.name}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${
                  sketchOpenAccordion === category.id ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {sketchOpenAccordion === category.id && (
              <div className="p-3 bg-gray-50">
                <div className="grid grid-cols-1 gap-2">
                  {category.options.map((option: ArchOption) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        const finalPrompt = `このスケッチを元に、以下の詳細設定を反映したフォトリアルな完成予想パース画像を生成してください。スケッチに描かれている構図、画角、アングルは完全に維持してください。詳細設定： ${option.promptFragment}。`;
                        onGenerate('sketch', finalPrompt);
                      }}
                      disabled={isDisabled}
                      className="w-full p-2.5 text-sm font-medium text-left text-gray-600 bg-white rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderExteriorPaintingPanel = () => {
    const OMAKASE_EXTERIOR_PROMPT = 'この建物の外観を分析し、建物の構造や形状は一切変更せず、外壁の色と素材のみを変更して、最も魅力的で調和のとれた外観デザインを提案してください。周囲の環境や建物のスタイルに合わせた配色と素材を選んでください。';

    const rgbToHex = (r: number, g: number, b: number): string => {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
    };

    const handleExteriorGenerate = () => {
      if (!selectedExteriorColor && !selectedExteriorMaterial && !exteriorCustomPrompt.trim()) {
        alert('色、素材、またはカスタム指示のいずれかを選択してください。');
        return;
      }

      let promptParts: string[] = [];

      // Improved base prompt with stronger constraints
      const basePrompt = `重要な制約：この建物の外観写真について、以下の要素は絶対に変更しないでください：
- 建物の構造（柱、梁、基礎）
- 建物の形状（高さ、幅、奥行き）
- 窓の位置、大きさ、形状
- ドアの位置、大きさ、形状
- 屋根の形状、色、素材
- 周囲の環境（植栽、地面、空、背景）
- 建物の配置や向き

変更してよいのは外壁の表面の色と質感のみです。外壁面だけをペイントするイメージで、以下の指示に従って変更してください。`;

      if (selectedExteriorColor) {
        const color = EXTERIOR_COLORS.find(c => c.id === selectedExteriorColor);
        if (color) {
          promptParts.push(`外壁の色を${color.name}（16進数カラーコード: ${color.hex}）に変更してください。この色は外壁の表面のみに適用し、窓枠やドア、屋根には適用しないでください。`);
        }
      } else {
        // Use custom RGB color if no preset color is selected
        const customHex = rgbToHex(customR, customG, customB);
        promptParts.push(`外壁の色をRGB(${customR}, ${customG}, ${customB})（16進数カラーコード: ${customHex}）に変更してください。この色は外壁の表面のみに適用し、窓枠やドア、屋根には適用しないでください。`);
      }

      if (selectedExteriorMaterial) {
        const material = EXTERIOR_MATERIALS.find(m => m.id === selectedExteriorMaterial);
        if (material) {
          promptParts.push(material.promptFragment);
        }
      }

      if (exteriorCustomPrompt.trim()) {
        promptParts.push(exteriorCustomPrompt.trim());
      }

      const finalPrompt = `${basePrompt}\n\n${promptParts.join('\n\n')}`;
      onGenerate('partial', finalPrompt);
    };

    const handleResetSelection = () => {
      setSelectedExteriorColor('');
      setSelectedExteriorMaterial('');
      setExteriorCustomPrompt('');
      setCustomR(255);
      setCustomG(255);
      setCustomB(255);
    };

    const handlePresetSelect = (preset: typeof exteriorPresets[0]) => {
      setSelectedExteriorColor(preset.color);
      setSelectedExteriorMaterial(preset.material);
    };

    const handlePresetGenerate = (preset: typeof exteriorPresets[0]) => {
      const color = EXTERIOR_COLORS.find(c => c.id === preset.color);
      const material = EXTERIOR_MATERIALS.find(m => m.id === preset.material);

      let promptParts: string[] = [];
      const basePrompt = `重要な制約：この建物の外観写真について、以下の要素は絶対に変更しないでください：
- 建物の構造（柱、梁、基礎）
- 建物の形状（高さ、幅、奥行き）
- 窓の位置、大きさ、形状
- ドアの位置、大きさ、形状
- 屋根の形状、色、素材
- 周囲の環境（植栽、地面、空、背景）
- 建物の配置や向き

変更してよいのは外壁の表面の色と質感のみです。外壁面だけをペイントするイメージで、以下の指示に従って変更してください。`;

      if (color) {
        promptParts.push(`外壁の色を${color.name}（16進数カラーコード: ${color.hex}）に変更してください。この色は外壁の表面のみに適用し、窓枠やドア、屋根には適用しないでください。`);
      }
      if (material) {
        promptParts.push(material.promptFragment);
      }

      const finalPrompt = `${basePrompt}\n\n${promptParts.join('\n\n')}`;
      onGenerate('partial', finalPrompt);
    };

    const EXTERIOR_PAINTING_TABS: { id: 'easy' | 'detailed'; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
      { id: 'easy', name: 'かんたん', icon: MagicWandIcon },
      { id: 'detailed', name: '詳細設定', icon: EditIcon }
    ];

    const renderEasyTab = () => (
      <div className="space-y-6">
        {/* AI Omakase */}
        <div>
          <h4 className="text-lg font-bold text-gray-800 mb-2">AIおまかせ一発塗装</h4>
          <p className="text-sm text-gray-600 mb-4">
            AIが建物を分析し、最適な外壁デザインを自動で提案します。
          </p>
          <button
            onClick={() => onGenerate('partial', OMAKASE_EXTERIOR_PROMPT)}
            disabled={isDisabled}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg hover:from-green-700 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <SparklesIcon className="w-6 h-6" />
            <span>AIおまかせで外壁デザイン</span>
          </button>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-sm font-semibold text-gray-500">またはスタイルを選択</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Preset Categories Accordion */}
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <SwatchIcon className="w-5 h-5 text-green-600" />
            カラー別おすすめスタイル
          </h4>
          <div className="border rounded-lg overflow-hidden">
            {exteriorPresetCategories.map((category) => (
              <div key={category.id} className="border-b last:border-b-0">
                <button
                  onClick={() => setExteriorPresetOpenAccordion(exteriorPresetOpenAccordion === category.id ? null : category.id)}
                  className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <category.icon className="w-5 h-5 text-green-600" />
                    {category.name}
                    <span className="text-xs text-gray-500 font-normal">（{category.presets.length}種類）</span>
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${
                      exteriorPresetOpenAccordion === category.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {exteriorPresetOpenAccordion === category.id && (
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 gap-3">
                      {category.presets.map((preset) => {
                        const color = EXTERIOR_COLORS.find(c => c.id === preset.color);
                        const material = EXTERIOR_MATERIALS.find(m => m.id === preset.material);
                        return (
                          <button
                            key={preset.id}
                            onClick={() => handlePresetGenerate(preset)}
                            disabled={isDisabled}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                          >
                            <div
                              className="w-12 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: color?.hex }}
                            />
                            <div className="flex-grow">
                              <div className="font-semibold text-gray-800">{preset.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {color?.name} × {material?.name}
                              </div>
                            </div>
                            <SparklesIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    const renderDetailedTab = () => (
      <div className="space-y-6">
        {(selectedExteriorColor || selectedExteriorMaterial || exteriorCustomPrompt) && (
          <div className="flex justify-end">
            <button
              onClick={handleResetSelection}
              className="text-sm text-gray-500 hover:text-red-600 underline transition-colors flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" />
              選択をリセット
            </button>
          </div>
        )}

        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <SwatchIcon className="w-5 h-5 text-green-600" />
            外壁の色を選択
          </h4>

          {/* Preset Color Palette */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">プリセットカラー（10色）</p>
            <div className="grid grid-cols-5 gap-2">
              {EXTERIOR_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedExteriorColor(color.id === selectedExteriorColor ? '' : color.id)}
                  className={`relative aspect-square rounded-lg border-2 transition-all ${
                    selectedExteriorColor === color.id
                      ? 'border-green-600 ring-2 ring-green-300 scale-105'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedExteriorColor === color.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXTERIOR_COLORS.map((color) => (
                <span
                  key={color.id}
                  className={`text-xs px-2 py-1 rounded ${
                    selectedExteriorColor === color.id
                      ? 'bg-green-100 text-green-800 font-semibold'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {color.name}
                </span>
              ))}
            </div>
          </div>

          {/* RGB Color Picker */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">カスタムカラー（RGB調整）</p>
            <div className="space-y-3">
              {/* R Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-600">R (赤)</label>
                  <span className="text-sm font-semibold text-red-600">{customR}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={customR}
                  onChange={(e) => {
                    setCustomR(Number(e.target.value));
                    setSelectedExteriorColor(''); // Clear preset selection when using custom RGB
                  }}
                  className="w-full h-2 bg-gradient-to-r from-black via-red-500 to-red-600 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: `rgb(${customR}, 0, 0)`
                  }}
                />
              </div>

              {/* G Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-600">G (緑)</label>
                  <span className="text-sm font-semibold text-green-600">{customG}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={customG}
                  onChange={(e) => {
                    setCustomG(Number(e.target.value));
                    setSelectedExteriorColor(''); // Clear preset selection when using custom RGB
                  }}
                  className="w-full h-2 bg-gradient-to-r from-black via-green-500 to-green-600 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: `rgb(0, ${customG}, 0)`
                  }}
                />
              </div>

              {/* B Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-600">B (青)</label>
                  <span className="text-sm font-semibold text-blue-600">{customB}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={customB}
                  onChange={(e) => {
                    setCustomB(Number(e.target.value));
                    setSelectedExteriorColor(''); // Clear preset selection when using custom RGB
                  }}
                  className="w-full h-2 bg-gradient-to-r from-black via-blue-500 to-blue-600 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: `rgb(0, 0, ${customB})`
                  }}
                />
              </div>

              {/* Color Preview */}
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-600 mb-2">プレビュー</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                    style={{ backgroundColor: rgbToHex(customR, customG, customB) }}
                  />
                  <div className="text-sm">
                    <p className="text-gray-700">RGB: <span className="font-mono font-semibold">({customR}, {customG}, {customB})</span></p>
                    <p className="text-gray-700">HEX: <span className="font-mono font-semibold">{rgbToHex(customR, customG, customB)}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CubeIcon className="w-5 h-5 text-green-600" />
            外壁の素材を選択（オプション）
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {EXTERIOR_MATERIALS.map((material) => (
              <button
                key={material.id}
                onClick={() => setSelectedExteriorMaterial(material.id === selectedExteriorMaterial ? '' : material.id)}
                className={`p-3 text-sm font-medium text-left rounded-lg border-2 transition-all ${
                  selectedExteriorMaterial === material.id
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-400 hover:bg-gray-50'
                }`}
              >
                {material.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <EditIcon className="w-5 h-5 text-green-600" />
            追加の指示（オプション）
          </h4>
          <textarea
            value={exteriorCustomPrompt}
            onChange={(e) => setExteriorCustomPrompt(e.target.value)}
            placeholder="例：1階と2階で色を変えてツートンカラーにしてください。"
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            disabled={isDisabled}
          />
        </div>

        <button
          onClick={handleExteriorGenerate}
          disabled={isDisabled || (!selectedExteriorColor && !selectedExteriorMaterial && !exteriorCustomPrompt.trim())}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <SparklesIcon className="w-5 h-5" />
          <span>外壁デザインを生成</span>
        </button>
      </div>
    );

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">外壁塗装シミュレーション</h3>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-x-4" aria-label="Tabs">
            {EXTERIOR_PAINTING_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setExteriorPaintingActiveTab(tab.id)}
                className={`${
                  exteriorPaintingActiveTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all`}
              >
                <tab.icon className="w-5 h-5"/>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-2">
          {exteriorPaintingActiveTab === 'easy' && renderEasyTab()}
          {exteriorPaintingActiveTab === 'detailed' && renderDetailedTab()}
        </div>
      </div>
    );
  };

  const renderSketchPanel = () => {
    const SKETCH_TABS: { id: 'easy' | 'detailed'; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
      { id: 'easy', name: 'かんたん', icon: MagicWandIcon },
      { id: 'detailed', name: '詳細設定', icon: DocumentTextIcon }
    ];
  
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">パースを生成</h3>
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-x-4" aria-label="Tabs">
                {SKETCH_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSketchActiveTab(tab.id)}
                        className={`${
                            sketchActiveTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all`}
                    >
                        <tab.icon className="w-5 h-5"/>
                        <span>{tab.name}</span>
                    </button>
                ))}
            </nav>
        </div>

        <div className="pt-2">
            {sketchActiveTab === 'easy' && renderSketchEasyPanel()}
            {sketchActiveTab === 'detailed' && renderPromptSection(false)}
        </div>
      </div>
    );
  };

  const renderSketchFinetunePanel = () => {
    const activeTabInfo = SKETCH_FINETUNE_TABS.find(tab => tab.id === sketchFinetuneActiveTab);
    
    // Determine the current custom prompt state and handler based on the active tab
    const isTimeTab = sketchFinetuneActiveTab === 'time';
    const currentCustomPrompt = isTimeTab ? customTimePrompt : customSceneryPrompt;
    const setCurrentCustomPrompt = isTimeTab ? setCustomTimePrompt : setCustomSceneryPrompt;

    const handleCustomGenerate = () => {
      if (currentCustomPrompt.trim()) {
        const finalPrompt = `このパース画像を、以下の指示で修正してください。画像の構図、画角、アングル、部屋の構造は絶対に維持してください。指示： ${currentCustomPrompt.trim()}`;
        onGenerate('partial', finalPrompt);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start pb-2 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-800">微調整モード (パース)</h3>
            <p className="text-sm text-gray-600 mt-1">生成されたパースを微調整します。</p>
          </div>
          <button 
            onClick={onExitFinetuning}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors flex-shrink-0 ml-4"
            aria-label="比較表示に戻る"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
            比較に戻る
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-x-2 gap-y-1" aria-label="Tabs">
            {SKETCH_FINETUNE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSketchFinetuneTabClick(tab.id)}
                className={`${
                  sketchFinetuneActiveTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all`}
              >
                <tab.icon className="w-5 h-5"/>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        { (sketchFinetuneActiveTab === 'details' || sketchFinetuneActiveTab === 'person') && renderPromptSection(true)}
        
        { (sketchFinetuneActiveTab === 'time' || sketchFinetuneActiveTab === 'scenery') && activeTabInfo?.options && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {activeTabInfo.options.map((option: SketchFinetuneOption) => (
                <button
                  key={option.id}
                  onClick={() => {
                    const finalPrompt = `このパース画像を、以下の指示で修正してください。画像の構図、画角、アングル、部屋の構造は絶対に維持してください。指示： ${option.promptFragment}`;
                    onGenerate('partial', finalPrompt);
                  }}
                  disabled={isDisabled}
                  className="w-full p-2.5 text-sm font-medium text-left text-gray-600 bg-white rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {option.name}
                </button>
              ))}
            </div>
            
            <div className="relative flex items-center pt-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase">または自由入力</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="space-y-2">
              <textarea
                value={currentCustomPrompt}
                onChange={(e) => setCurrentCustomPrompt(e.target.value)}
                placeholder={isTimeTab ? "例: 雷が鳴る嵐の夜" : "例: 建物の周りを緑豊かな森にしてください"}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                disabled={isDisabled}
              />
              <button
                onClick={handleCustomGenerate}
                disabled={isDisabled || !currentCustomPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>生成する</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Exterior mode rendering
  if (appMode === 'exterior') {
    // Show sub-mode selector first
    if (!isFinetuningMode) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">外観デザインを選択</h3>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {/* Sketch to Arch Card */}
            <button
              onClick={() => onExteriorSubModeChange?.('sketch2arch')}
              className={`relative group overflow-hidden rounded-xl transition-all duration-300 ${
                exteriorSubMode === 'sketch2arch'
                  ? 'ring-4 ring-blue-500 shadow-xl scale-105'
                  : 'ring-2 ring-gray-200 hover:ring-blue-300 hover:shadow-lg'
              }`}
            >
              <div className="aspect-square bg-gradient-to-br from-blue-400 to-cyan-500 p-6 flex flex-col items-center justify-center relative">
                {/* Before/After Animation Effect */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <PencilIcon className="w-16 h-16 text-gray-600 opacity-50" />
                  </div>
                  <div className="w-1/2 bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                    <HomeModernIcon className="w-16 h-16 text-white opacity-50" />
                  </div>
                </div>

                {/* Arrow Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-full p-3 shadow-lg transform group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>

                {/* Text Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center">
                    <h4 className="text-white font-bold text-xl mb-2">スケッチ → パース</h4>
                    <p className="text-white text-sm opacity-90">手描きスケッチから<br/>フォトリアルなパースを生成</p>
                  </div>
                </div>

                {/* Selected Indicator */}
                {exteriorSubMode === 'sketch2arch' && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full p-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {/* Exterior Painting Card */}
            <button
              onClick={() => onExteriorSubModeChange?.('exterior_painting')}
              className={`relative group overflow-hidden rounded-xl transition-all duration-300 ${
                exteriorSubMode === 'exterior_painting'
                  ? 'ring-4 ring-green-500 shadow-xl scale-105'
                  : 'ring-2 ring-gray-200 hover:ring-green-300 hover:shadow-lg'
              }`}
            >
              <div className="aspect-square bg-gradient-to-br from-green-400 to-emerald-500 p-6 flex flex-col items-center justify-center relative">
                {/* Before/After Animation Effect */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <HomeModernIcon className="w-16 h-16 text-gray-600 opacity-50" />
                  </div>
                  <div className="w-1/2 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <HomeModernIcon className="w-16 h-16 text-white opacity-50" />
                  </div>
                </div>

                {/* Paint Brush Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-full p-3 shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all">
                    <PaintBrushIcon className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                {/* Text Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center">
                    <h4 className="text-white font-bold text-xl mb-2">外壁塗装</h4>
                    <p className="text-white text-sm opacity-90">建物の外壁色・素材を<br/>シミュレーション</p>
                  </div>
                </div>

                {/* Selected Indicator */}
                {exteriorSubMode === 'exterior_painting' && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white rounded-full p-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          </div>

          <div className="pt-4">
            {exteriorSubMode === 'sketch2arch' && renderSketchPanel()}
            {exteriorSubMode === 'exterior_painting' && renderExteriorPaintingPanel()}
          </div>
        </div>
      );
    }

    // Finetuning mode for exterior
    if (exteriorSubMode === 'sketch2arch') {
      return renderSketchFinetunePanel();
    }
  }

  if (isFinetuningMode) {
    const FINETUNE_TABS = TABS.filter(tab => tab.id === 'partial' || tab.id === 'furniture' || tab.id === 'person' || tab.id === 'products');
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-800">微調整モード</h3>
                <p className="text-sm text-gray-600 mt-1">生成された画像を微調整します。</p>
              </div>
              <button 
                onClick={onExitFinetuning}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors flex-shrink-0 ml-4"
                aria-label="比較表示に戻る"
              >
                <ArrowUturnLeftIcon className="w-4 h-4" />
                比較に戻る
              </button>
            </div>

            <div className="border-b border-gray-200">
              <nav className="-mb-px flex flex-wrap gap-x-2 gap-y-1" aria-label="Tabs">
                {FINETUNE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleFinetuneTabClick(tab.id as 'partial' | 'furniture' | 'person' | 'products')}
                    className={`${
                      finetuneActiveTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all`}
                  >
                    <tab.icon className="w-5 h-5"/>
                    {tab.id === 'partial' ? '詳細設定' : tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {finetuneActiveTab === 'partial' && renderPromptSection(true)}
            {finetuneActiveTab === 'products' && renderProductsPanel()}
            {finetuneActiveTab === 'furniture' && (
                <div className="space-y-4">
                    {renderFurnitureOptions()}
                    <div className="relative flex items-center pt-2">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase">指示を入力</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                    {renderPromptSection(true)}
                </div>
            )}
            {finetuneActiveTab === 'person' && renderPromptSection(true)}
        </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'oneClick':
        return (
          <div className="space-y-4">
            <button
              onClick={() => onGenerate('oneClick', OMAKASE_PROMPT)}
              disabled={isDisabled}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <SparklesIcon className="w-6 h-6" />
              <span>ワンタップおまかせリノベーション</span>
            </button>
             <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-sm font-semibold text-gray-500">またはスタイルを選択</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <div className="border rounded-md">
              {RENOVATION_CATEGORIES.map((category) => (
                <div key={category.id} className="border-b border-gray-200 last:border-b-0">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === category.id ? null : category.id)}
                    className="w-full flex justify-between items-center p-3 text-left font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <category.icon className="w-6 h-6 text-indigo-500" />
                      {category.name}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transform transition-transform ${
                        openAccordion === category.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openAccordion === category.id && (
                    <div className="p-3 bg-gray-50">
                      <div className="grid grid-cols-1 gap-2">
                        {category.styles.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => onGenerate('oneClick', style.id)}
                            disabled={isDisabled}
                            className="w-full p-2.5 text-sm font-medium text-left text-gray-600 bg-white rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {style.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'partial':
        return renderPromptSection(false);
      case 'products':
        return renderProductsPanel();
      case 'furniture':
        return (
            <div className="space-y-4">
                {renderFurnitureOptions()}
                <div className="relative flex items-center pt-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase">指示を入力</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>
                {renderPromptSection(false)}
            </div>
        );
      case 'person':
        return renderPromptSection(false);
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-bold text-gray-800">リノベーションを実行</h3>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-x-2 gap-y-1" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all`}
            >
              <tab.icon className="w-5 h-5"/>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div>{renderTabContent()}</div>
    </div>
  );
};

export default RenovationPanel;