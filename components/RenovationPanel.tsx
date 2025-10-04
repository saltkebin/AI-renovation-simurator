import React, { useState, useEffect } from 'react';
// FIX: Import AppMode type.
import type { RenovationMode, FurnitureStyleId, RoomTypeId, RegisteredProduct, ProductCategory, ArchOption, AppMode, SketchCategory, SketchFinetuneTabId, SketchFinetuneOption, ExteriorSubMode, ColorMode, RenovationSubMode, FacilityType, OriginalSpaceType, CommercialStep, CommercialRenovationContext } from '../types';
import { RENOVATION_CATEGORIES, OMAKASE_PROMPT, OMAKASE_SKETCH_PROMPT, FURNITURE_STYLES, ROOM_TYPES, SKETCH_CATEGORIES, SKETCH_FINETUNE_TABS, EXTERIOR_COLORS, EXTERIOR_MATERIALS, SPLIT_RATIOS, TUTORIAL_PRODUCTS, FACILITY_TYPES, ORIGINAL_SPACE_TYPES, COMMERCIAL_STEPS, FACILITY_ADJUSTMENT_ITEMS } from '../constants';
import { MagicWandIcon, EditIcon, SparklesIcon, LightBulbIcon, SpinnerIcon, ArrowUturnLeftIcon, SofaIcon, UserGroupIcon, BuildingStorefrontIcon, HomeModernIcon, CubeIcon, SwatchIcon, DocumentTextIcon, PencilIcon, PaintBrushIcon, TrashIcon } from './Icon';
import { generateSuggestions } from '../services/geminiService';
import FeatureTip from './FeatureTip';
import { featureFlags } from '../src/config/featureFlags';

interface RenovationPanelProps {
  // FIX: Added appMode prop to accept the application's current mode.
  appMode: AppMode;
  exteriorSubMode?: ExteriorSubMode;
  onExteriorSubModeChange?: (mode: ExteriorSubMode) => void;

  // Commercial facility renovation props (development only)
  renovationSubMode?: RenovationSubMode;
  onRenovationSubModeChange?: (mode: RenovationSubMode) => void;
  commercialContext?: CommercialRenovationContext;
  onCommercialContextChange?: (context: CommercialRenovationContext) => void;

  onGenerate: (mode: RenovationMode | 'sketch' | 'partial', prompt: string, products?: RegisteredProduct[]) => void;
  isDisabled: boolean;
  activeImage: string | null;
  mimeType: string;
  isFinetuningMode: boolean;
  onExitFinetuning: () => void;
  categories: ProductCategory[];
  products: RegisteredProduct[];
  tutorialMode?: boolean;
  tutorialStepIndex?: number;
  onTutorialFurnitureTabClick?: () => void;
  tutorialFurnitureTabClicked?: boolean;
  onTutorialFurnitureInputChange?: (text: string) => void;
  tutorialFurnitureInputValid?: boolean;
  onTutorialPersonTabClick?: () => void;
  tutorialPersonTabClicked?: boolean;
  onTutorialPersonInputChange?: (text: string) => void;
  tutorialPersonInputValid?: boolean;
  onTutorialProductsTabClick?: () => void;
  tutorialProductsTabClicked?: boolean;
  onTutorialStep11TabClick?: () => void;
  tutorialStep11TabClicked?: boolean;
  onTutorialStep11ProductSelect?: (productId: string) => void;
  tutorialStep11ProductSelected?: boolean;
  onTutorialStep11InputChange?: (text: string) => void;
  tutorialStep11InputValid?: boolean;
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
  renovationSubMode = 'residential',
  onRenovationSubModeChange,
  commercialContext,
  onCommercialContextChange,
  onGenerate,
  isDisabled,
  activeImage,
  mimeType,
  isFinetuningMode,
  onExitFinetuning,
  categories,
  products,
  tutorialMode,
  tutorialStepIndex,
  onTutorialFurnitureTabClick,
  tutorialFurnitureTabClicked,
  onTutorialFurnitureInputChange,
  tutorialFurnitureInputValid,
  onTutorialPersonTabClick,
  tutorialPersonTabClicked,
  onTutorialPersonInputChange,
  tutorialPersonInputValid,
  onTutorialProductsTabClick,
  tutorialProductsTabClicked,
  onTutorialStep11TabClick,
  tutorialStep11TabClicked,
  onTutorialStep11ProductSelect,
  tutorialStep11ProductSelected,
  onTutorialStep11InputChange,
  tutorialStep11InputValid,
}) => {
  const isStep1 = tutorialMode === true && tutorialStepIndex === 1;
  const isStep2 = tutorialMode === true && tutorialStepIndex === 2;
  const isStep3 = tutorialMode === true && tutorialStepIndex === 3;
  const isStep4 = tutorialMode === true && tutorialStepIndex === 4;
  const isStep8 = tutorialMode === true && tutorialStepIndex === 7;
  const isStep9 = tutorialMode === true && tutorialStepIndex === 8;
  const isStep10 = tutorialMode === true && tutorialStepIndex === 9;
  const isStep11 = tutorialMode === true && tutorialStepIndex === 10;
  // Filter categories based on mode
  const filteredCategories = React.useMemo(() => {
    // In tutorial Step 11, use tutorial categories
    if (isStep11) {
      return TUTORIAL_PRODUCTS.categories;
    }

    if (appMode === 'renovation') {
      // Show only 壁紙 and 家具 in renovation mode
      return categories.filter(c => ['壁紙', '家具'].includes(c.name));
    } else if (appMode === 'exterior' && exteriorSubMode === 'exterior_painting') {
      // Show only 塗料 in exterior painting mode
      return categories.filter(c => c.name === '塗料');
    }
    return categories;
  }, [appMode, exteriorSubMode, categories, isStep11]);

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
  const [exteriorPaintingActiveTab, setExteriorPaintingActiveTab] = useState<'easy' | 'detailed' | 'products'>('easy');
  const [selectedExteriorColor, setSelectedExteriorColor] = useState<string>('');
  const [selectedExteriorMaterial, setSelectedExteriorMaterial] = useState<string>('');
  const [exteriorCustomPrompt, setExteriorCustomPrompt] = useState('');
  const [customR, setCustomR] = useState<number>(255);
  const [customG, setCustomG] = useState<number>(255);
  const [customB, setCustomB] = useState<number>(255);

  // Two-tone color states
  const [colorMode, setColorMode] = useState<ColorMode>('single');
  const [secondaryColor, setSecondaryColor] = useState<string>('');
  const [secondaryR, setSecondaryR] = useState<number>(255);
  const [secondaryG, setSecondaryG] = useState<number>(255);
  const [secondaryB, setSecondaryB] = useState<number>(255);
  const [splitRatio, setSplitRatio] = useState<number>(50);

  // Set fixed prompt for Step 10 when partial tab is clicked
  useEffect(() => {
    if (isStep10 && tutorialProductsTabClicked && finetuneActiveTab === 'partial') {
      setCustomPrompt('カラフルな幾何学模様のプレイマット、壁には楽しい子供向けのアート、小さな子供用テーブルと椅子、おもちゃの収納棚が置かれた、明るく活気のある子供のプレイルーム。子供は椅子に座っている。');
    }
  }, [isStep10, tutorialProductsTabClicked, finetuneActiveTab]);

  // Set category to 家具 for Step 11
  useEffect(() => {
    if (isStep11 && tutorialStep11TabClicked) {
      setSelectedCategoryId('tutorial-furniture');
    }
  }, [isStep11, tutorialStep11TabClicked]);

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

  // Two-tone color presets
  const twoTonePresets = [
    {
      id: 'white_gray_horizontal',
      name: 'ホワイト×グレー',
      mode: 'two_tone_horizontal' as ColorMode,
      primaryColor: 'white',
      secondaryColor: 'gray',
      splitRatio: 70,
      material: 'siding'
    },
    {
      id: 'beige_brown_horizontal',
      name: 'ベージュ×ブラウン',
      mode: 'two_tone_horizontal' as ColorMode,
      primaryColor: 'beige',
      secondaryColor: 'brown',
      splitRatio: 60,
      material: 'stucco'
    },
    {
      id: 'cream_navy_horizontal',
      name: 'クリーム×ネイビー',
      mode: 'two_tone_horizontal' as ColorMode,
      primaryColor: 'cream',
      secondaryColor: 'navy',
      splitRatio: 70,
      material: 'siding'
    },
    {
      id: 'white_darkgray_horizontal',
      name: 'ホワイト×ダークグレー',
      mode: 'two_tone_horizontal' as ColorMode,
      primaryColor: 'white',
      secondaryColor: 'dark_gray',
      splitRatio: 50,
      material: 'concrete'
    },
    {
      id: 'lightgray_brown_horizontal',
      name: 'ライトグレー×ブラウン',
      mode: 'two_tone_horizontal' as ColorMode,
      primaryColor: 'light_gray',
      secondaryColor: 'brown',
      splitRatio: 60,
      material: 'siding'
    },
    {
      id: 'white_green_vertical',
      name: 'ホワイト×グリーン',
      mode: 'two_tone_vertical' as ColorMode,
      primaryColor: 'white',
      secondaryColor: 'green',
      splitRatio: 50,
      material: 'wood'
    },
    {
      id: 'beige_gray_vertical',
      name: 'ベージュ×グレー',
      mode: 'two_tone_vertical' as ColorMode,
      primaryColor: 'beige',
      secondaryColor: 'gray',
      splitRatio: 50,
      material: 'stucco'
    },
    {
      id: 'cream_black_horizontal',
      name: 'クリーム×ブラック',
      mode: 'two_tone_horizontal' as ColorMode,
      primaryColor: 'cream',
      secondaryColor: 'black',
      splitRatio: 70,
      material: 'tile'
    },
    {
      id: 'lightgray_navy_horizontal',
      name: 'ライトグレー×ネイビー',
      mode: 'two_tone_horizontal' as ColorMode,
      primaryColor: 'light_gray',
      secondaryColor: 'navy',
      splitRatio: 60,
      material: 'siding'
    },
    {
      id: 'white_brown_vertical',
      name: 'ホワイト×ブラウン',
      mode: 'two_tone_vertical' as ColorMode,
      primaryColor: 'white',
      secondaryColor: 'brown',
      splitRatio: 50,
      material: 'wood'
    },
    {
      id: 'cream_darkgray_vertical',
      name: 'クリーム×ダークグレー',
      mode: 'two_tone_vertical' as ColorMode,
      primaryColor: 'cream',
      secondaryColor: 'dark_gray',
      splitRatio: 50,
      material: 'siding'
    },
    {
      id: 'lightgray_brown_vertical',
      name: 'ライトグレー×ブラウン',
      mode: 'two_tone_vertical' as ColorMode,
      primaryColor: 'light_gray',
      secondaryColor: 'brown',
      splitRatio: 50,
      material: 'wood'
    },
    {
      id: 'white_navy_vertical',
      name: 'ホワイト×ネイビー',
      mode: 'two_tone_vertical' as ColorMode,
      primaryColor: 'white',
      secondaryColor: 'navy',
      splitRatio: 50,
      material: 'tile'
    },
    {
      id: 'beige_black_vertical',
      name: 'ベージュ×ブラック',
      mode: 'two_tone_vertical' as ColorMode,
      primaryColor: 'beige',
      secondaryColor: 'black',
      splitRatio: 50,
      material: 'concrete'
    },
    {
      id: 'gray_brown_vertical',
      name: 'グレー×ブラウン',
      mode: 'two_tone_vertical' as ColorMode,
      primaryColor: 'gray',
      secondaryColor: 'brown',
      splitRatio: 50,
      material: 'stucco'
    },
  ];

  const [exteriorPresetOpenAccordion, setExteriorPresetOpenAccordion] = useState<string | null>(null);
  const [easyTabColorType, setEasyTabColorType] = useState<'single' | 'two_tone_horizontal' | 'two_tone_vertical'>('single');


  useEffect(() => {
    // When categories are loaded, if no category is selected or the selected one is not in the list, select the appropriate default.
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.id === selectedCategoryId)) {
      // For exterior painting mode, try to select "塗料" category by default
      if (appMode === 'exterior' && exteriorSubMode === 'exterior_painting') {
        const paintCategory = filteredCategories.find(c => c.name === '塗料');
        setSelectedCategoryId(paintCategory ? paintCategory.id : filteredCategories[0].id);
      } else {
        // For renovation mode, select the first category
        setSelectedCategoryId(filteredCategories[0].id);
      }
    }
  }, [filteredCategories, selectedCategoryId, appMode, exteriorSubMode]);


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

  useEffect(() => {
    // When switching to exterior painting products tab, select "塗料" category
    if (appMode === 'exterior' && exteriorSubMode === 'exterior_painting' && exteriorPaintingActiveTab === 'products' && filteredCategories.length > 0) {
      const paintCategory = filteredCategories.find(c => c.name === '塗料');
      if (paintCategory && selectedCategoryId !== paintCategory.id) {
        setSelectedCategoryId(paintCategory.id);
      }
    }
  }, [appMode, exteriorSubMode, exteriorPaintingActiveTab, filteredCategories, selectedCategoryId]);

  const handleGenerate = () => {
    if (customPrompt.trim()) {
      const isProductsContext = (!isFinetuningMode && activeTab === 'products') || (isFinetuningMode && finetuneActiveTab === 'products');

      if (isProductsContext) {
        // チュートリアルモードStep 11: 自動的にチュートリアル商品を使用
        let selectedProducts;
        if (isStep11) {
          selectedProducts = TUTORIAL_PRODUCTS.products;
        } else {
          selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
          if (selectedProducts.length === 0) {
            alert("使用する商品を1つ以上選択してください。");
            return;
          }
        }
        
        const category = filteredCategories.find(c => c.id === selectedCategoryId);
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

    // Call tutorial handler when furniture tab is clicked in Step 8
    if (tutorialMode && tutorialStepIndex === 7 && tabId === 'furniture' && onTutorialFurnitureTabClick) {
      onTutorialFurnitureTabClick();
    }

    // Call tutorial handler when person tab is clicked in Step 9
    if (tutorialMode && tutorialStepIndex === 8 && tabId === 'person' && onTutorialPersonTabClick) {
      onTutorialPersonTabClick();
    }

    // Call tutorial handler when partial tab is clicked in Step 10
    if (tutorialMode && tutorialStepIndex === 9 && tabId === 'partial' && onTutorialProductsTabClick) {
      onTutorialProductsTabClick();
    }

    // Call tutorial handler when products tab is clicked in Step 11
    if (tutorialMode && tutorialStepIndex === 10 && tabId === 'products' && onTutorialStep11TabClick) {
      onTutorialStep11TabClick();
    }
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

    // Call tutorial handler when sofa is selected in Step 11
    if (tutorialMode && tutorialStepIndex === 10 && onTutorialStep11ProductSelect) {
      onTutorialStep11ProductSelect(id);
    }
  };

  const renderPromptSection = (isFinetune: boolean) => {
    const isFurnitureContext = (appMode === 'renovation') && ((isFinetune && finetuneActiveTab === 'furniture') || (!isFinetune && activeTab === 'furniture'));
    const isPersonContext = (isFinetune && ( (appMode === 'renovation' && finetuneActiveTab === 'person') || (appMode === 'exterior' && exteriorSubMode === 'sketch2arch' && sketchFinetuneActiveTab === 'person') )) || (!isFinetuningMode && activeTab === 'person');
    
    const placeholder = tutorialMode && tutorialStepIndex === 7 && isFurnitureContext
      ? "中央にラグを置いて"
      : tutorialMode && tutorialStepIndex === 8 && isPersonContext
      ? "子供が寝転がっている"
      : isPersonContext
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

    // Determine if input area should be elevated (Step 8 after furniture tab clicked or Step 9 after person tab clicked)
    const isInputAreaInteractive = tutorialMode && (
      (tutorialStepIndex === 7 && tutorialFurnitureTabClicked && isFurnitureContext) ||
      (tutorialStepIndex === 8 && tutorialPersonTabClicked && isPersonContext)
    );

    return (
      <div className="space-y-4">
        <button
          onClick={handleSuggest}
          disabled={isDisabled || isSuggesting || isStep8 || isStep9 || isStep10 || isStep11}
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

        {/* Input area wrapper with z-index for tutorial Step 8 */}
        <div className={isInputAreaInteractive ? 'relative z-50' : ''}>
          <textarea
            value={customPrompt}
            onChange={(e) => {
              setCustomPrompt(e.target.value);
              if (onTutorialFurnitureInputChange) {
                onTutorialFurnitureInputChange(e.target.value);
              }
              if (onTutorialPersonInputChange) {
                onTutorialPersonInputChange(e.target.value);
              }
            }}
            placeholder={placeholder}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={isDisabled}
          />
          <button
            onClick={handleGenerate}
            disabled={isDisabled || !customPrompt.trim() || (isStep8 && !tutorialFurnitureInputValid) || (isStep9 && !tutorialPersonInputValid)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-white rounded-md transition-colors mt-4 ${
              tutorialMode && tutorialStepIndex === 9
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 ring-4 ring-purple-300 ring-opacity-50 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed'
            }`}
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{generateButtonText}</span>
          </button>
        </div>
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
    // In tutorial Step 11, use tutorial products
    const productsToUse = isStep11 ? TUTORIAL_PRODUCTS.products : products;
    const filteredProducts = productsToUse.filter(p => p.categoryId === selectedCategoryId);
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
            {filteredCategories.length === 0 ? (
                <option>カテゴリー未登録</option>
            ) : (
                filteredCategories.map(category => (
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
                  {filteredProducts.map(product => {
                      const isHighlightedProduct = isStep11 && product.id === 'tutorial-sofa-1';
                      return (
                          <button
                              key={product.id}
                              onClick={() => handleProductSelect(product.id)}
                              className={`relative w-full aspect-square rounded-md focus:outline-none transition-all duration-200 ${
                                  selectedProductIds.includes(product.id)
                                      ? 'ring-4 ring-offset-1 ring-indigo-500'
                                      : isHighlightedProduct
                                      ? 'ring-4 ring-offset-1 ring-purple-500 animate-pulse'
                                      : 'ring-2 ring-transparent hover:ring-indigo-300'
                              }`}
                          >
                              <img src={product.src || product.imageUrl} alt="商品" className="w-full h-full object-cover rounded-md" />
                              {selectedProductIds.includes(product.id) && (
                                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-md">
                                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                  </div>
                              )}
                          </button>
                      );
                  })}
              </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">3. 使い方を指示</h4>
          <textarea
            value={customPrompt}
            onChange={(e) => {
              setCustomPrompt(e.target.value);
              if (onTutorialStep11InputChange) {
                onTutorialStep11InputChange(e.target.value);
              }
            }}
            placeholder={isStep11 ? "このソファを奥の壁に置いて" : "例: この壁紙を奥の壁に貼ってください。/ このソファを窓際に配置してください。"}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={isDisabled}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isDisabled || !customPrompt.trim() || selectedProductIds.length === 0 || (isStep11 && (!tutorialStep11ProductSelected || !tutorialStep11InputValid))}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-white rounded-md transition-colors ${
            tutorialMode && tutorialStepIndex === 10 && tutorialStep11ProductSelected && tutorialStep11InputValid
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 ring-4 ring-purple-300 ring-opacity-50 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed'
          }`}
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
    const OMAKASE_EXTERIOR_PROMPT = 'この建物の外観を分析し、建物の構造や形状、外壁の素材や質感は一切変更せず、外壁の色のみを変更して、最も魅力的で調和のとれた外観デザインを提案してください。周囲の環境や建物のスタイルに合わせた配色を選んでください。既存の外壁素材の質感やテクスチャは維持したまま、色だけを変更してください。';

    const rgbToHex = (r: number, g: number, b: number): string => {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
    };

    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 255, b: 255 };
    };

    const handlePresetColorSelect = (colorId: string) => {
      const isDeselecting = colorId === selectedExteriorColor;
      setSelectedExteriorColor(isDeselecting ? '' : colorId);

      if (isDeselecting) {
        // Reset RGB sliders to white (255, 255, 255) when deselecting
        setCustomR(255);
        setCustomG(255);
        setCustomB(255);
      } else {
        const color = EXTERIOR_COLORS.find(c => c.id === colorId);
        if (color) {
          const rgb = hexToRgb(color.hex);
          setCustomR(rgb.r);
          setCustomG(rgb.g);
          setCustomB(rgb.b);
        }
      }
    };

    const handleSecondaryPresetColorSelect = (colorId: string) => {
      const isDeselecting = colorId === secondaryColor;
      setSecondaryColor(isDeselecting ? '' : colorId);

      if (isDeselecting) {
        setSecondaryR(255);
        setSecondaryG(255);
        setSecondaryB(255);
      } else {
        const color = EXTERIOR_COLORS.find(c => c.id === colorId);
        if (color) {
          const rgb = hexToRgb(color.hex);
          setSecondaryR(rgb.r);
          setSecondaryG(rgb.g);
          setSecondaryB(rgb.b);
        }
      }
    };

    const handleExteriorGenerate = () => {
      if (!selectedExteriorColor && !selectedExteriorMaterial && !exteriorCustomPrompt.trim() && colorMode === 'single') {
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
- 外壁の素材や質感（既存のテクスチャを維持）

変更してよいのは外壁の表面の色のみです。外壁面だけをペイントするイメージで、既存の素材感を保ちながら色だけを変更してください。`;

      // Two-tone color handling
      if (colorMode === 'two_tone_horizontal') {
        const primaryHex = selectedExteriorColor ? EXTERIOR_COLORS.find(c => c.id === selectedExteriorColor)?.hex : rgbToHex(customR, customG, customB);
        const secondaryHex = secondaryColor ? EXTERIOR_COLORS.find(c => c.id === secondaryColor)?.hex : rgbToHex(secondaryR, secondaryG, secondaryB);

        promptParts.push(`外壁を水平に2色に分けてツートンカラーにしてください：
- 上部（建物の${splitRatio}%）: ${selectedExteriorColor ? EXTERIOR_COLORS.find(c => c.id === selectedExteriorColor)?.name : `RGB(${customR}, ${customG}, ${customB})`}（カラーコード: ${primaryHex}）
- 下部（建物の${100 - splitRatio}%）: ${secondaryColor ? EXTERIOR_COLORS.find(c => c.id === secondaryColor)?.name : `RGB(${secondaryR}, ${secondaryG}, ${secondaryB})`}（カラーコード: ${secondaryHex}）
境界線は自然な水平ラインで、建物の構造に沿って区切ってください。既存の外壁素材の質感やテクスチャは維持したまま、色だけを変更してください。`);
      } else if (colorMode === 'two_tone_vertical') {
        const primaryHex = selectedExteriorColor ? EXTERIOR_COLORS.find(c => c.id === selectedExteriorColor)?.hex : rgbToHex(customR, customG, customB);
        const secondaryHex = secondaryColor ? EXTERIOR_COLORS.find(c => c.id === secondaryColor)?.hex : rgbToHex(secondaryR, secondaryG, secondaryB);

        promptParts.push(`外壁を垂直に2色に分けてツートンカラーにしてください：
- 左側（建物の${splitRatio}%）: ${selectedExteriorColor ? EXTERIOR_COLORS.find(c => c.id === selectedExteriorColor)?.name : `RGB(${customR}, ${customG}, ${customB})`}（カラーコード: ${primaryHex}）
- 右側（建物の${100 - splitRatio}%）: ${secondaryColor ? EXTERIOR_COLORS.find(c => c.id === secondaryColor)?.name : `RGB(${secondaryR}, ${secondaryG}, ${secondaryB})`}（カラーコード: ${secondaryHex}）
境界線は自然な垂直ラインで、建物の構造に沿って区切ってください。既存の外壁素材の質感やテクスチャは維持したまま、色だけを変更してください。`);
      } else {
        // Single color mode
        if (selectedExteriorColor) {
          const color = EXTERIOR_COLORS.find(c => c.id === selectedExteriorColor);
          if (color) {
            promptParts.push(`外壁の色を${color.name}（16進数カラーコード: ${color.hex}）に変更してください。この色は外壁の表面のみに適用し、窓枠やドア、屋根には適用しないでください。既存の外壁素材の質感やテクスチャは維持したまま、色だけを変更してください。`);
          }
        } else {
          // Use custom RGB color if no preset color is selected
          const customHex = rgbToHex(customR, customG, customB);
          promptParts.push(`外壁の色をRGB(${customR}, ${customG}, ${customB})（16進数カラーコード: ${customHex}）に変更してください。この色は外壁の表面のみに適用し、窓枠やドア、屋根には適用しないでください。既存の外壁素材の質感やテクスチャは維持したまま、色だけを変更してください。`);
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
      setColorMode('single');
      setSecondaryColor('');
      setSecondaryR(255);
      setSecondaryG(255);
      setSecondaryB(255);
      setSplitRatio(50);
    };

    const handlePresetSelect = (preset: typeof exteriorPresetCategories[0]['presets'][0]) => {
      setSelectedExteriorColor(preset.color);
      setSelectedExteriorMaterial(preset.material);
    };

    const handlePresetGenerate = (preset: typeof exteriorPresetCategories[0]['presets'][0]) => {
      const color = EXTERIOR_COLORS.find(c => c.id === preset.color);

      let promptParts: string[] = [];
      const basePrompt = `重要な制約：この建物の外観写真について、以下の要素は絶対に変更しないでください：
- 建物の構造（柱、梁、基礎）
- 建物の形状（高さ、幅、奥行き）
- 窓の位置、大きさ、形状
- ドアの位置、大きさ、形状
- 屋根の形状、色、素材
- 周囲の環境（植栽、地面、空、背景）
- 建物の配置や向き
- 外壁の素材や質感（既存のテクスチャを維持）

変更してよいのは外壁の表面の色のみです。外壁面だけをペイントするイメージで、既存の素材感を保ちながら色だけを変更してください。`;

      if (color) {
        promptParts.push(`外壁の色を${color.name}（16進数カラーコード: ${color.hex}）に変更してください。この色は外壁の表面のみに適用し、窓枠やドア、屋根には適用しないでください。既存の外壁素材の質感やテクスチャは維持したまま、色だけを変更してください。`);
      }

      const finalPrompt = `${basePrompt}\n\n${promptParts.join('\n\n')}`;
      onGenerate('partial', finalPrompt);
    };

    const handleTwoTonePresetGenerate = (preset: typeof twoTonePresets[0]) => {
      const primaryColor = EXTERIOR_COLORS.find(c => c.id === preset.primaryColor);
      const secondaryColor = EXTERIOR_COLORS.find(c => c.id === preset.secondaryColor);

      let promptParts: string[] = [];
      const basePrompt = `重要な制約：この建物の外観写真について、以下の要素は絶対に変更しないでください：
- 建物の構造（柱、梁、基礎）
- 建物の形状（高さ、幅、奥行き）
- 窓の位置、大きさ、形状
- ドアの位置、大きさ、形状
- 屋根の形状、色、素材
- 周囲の環境（植栽、地面、空、背景）
- 建物の配置や向き
- 外壁の素材や質感（既存のテクスチャを維持）

変更してよいのは外壁の表面の色のみです。外壁面だけをペイントするイメージで、既存の素材感を保ちながら色だけを変更してください。`;

      if (preset.mode === 'two_tone_horizontal') {
        promptParts.push(`外壁を水平に2色に分けてツートンカラーにしてください：
- 上部: ${primaryColor?.name}（カラーコード: ${primaryColor?.hex}）
- 下部: ${secondaryColor?.name}（カラーコード: ${secondaryColor?.hex}）
境界線は建物の構造やバランスを考慮し、自然な水平ラインで区切ってください。分割比率は建物の形状に合わせて最適なバランスを自動で判断してください。既存の外壁素材の質感やテクスチャは維持したまま、色だけを変更してください。`);
      } else if (preset.mode === 'two_tone_vertical') {
        promptParts.push(`外壁を垂直に2色に分けてツートンカラーにしてください：
- 左側: ${primaryColor?.name}（カラーコード: ${primaryColor?.hex}）
- 右側: ${secondaryColor?.name}（カラーコード: ${secondaryColor?.hex}）
境界線は建物の構造やバランスを考慮し、自然な垂直ラインで区切ってください。分割比率は建物の形状に合わせて最適なバランスを自動で判断してください。既存の外壁素材の質感やテクスチャは維持したまま、色だけを変更してください。`);
      }

      const finalPrompt = `${basePrompt}\n\n${promptParts.join('\n\n')}`;
      onGenerate('partial', finalPrompt);
    };

    const EXTERIOR_PAINTING_TABS: { id: 'easy' | 'detailed' | 'products'; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
      { id: 'easy', name: 'かんたん', icon: MagicWandIcon },
      { id: 'detailed', name: '詳細設定', icon: EditIcon },
      { id: 'products', name: '商品', icon: BuildingStorefrontIcon }
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

        {/* Color Type Selection: 1色, 2色(上下), 2色(左右) */}
        <div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setEasyTabColorType('single')}
              className={`flex-1 px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                easyTabColorType === 'single'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              1色
            </button>
            <button
              onClick={() => setEasyTabColorType('two_tone_horizontal')}
              className={`flex-1 px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                easyTabColorType === 'two_tone_horizontal'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              2色(上下)
            </button>
            <button
              onClick={() => setEasyTabColorType('two_tone_vertical')}
              className={`flex-1 px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                easyTabColorType === 'two_tone_vertical'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              2色(左右)
            </button>
          </div>
        </div>

        {/* Preset Categories Accordion */}
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <SwatchIcon className="w-5 h-5 text-green-600" />
            {easyTabColorType === 'single'
              ? 'カラー別おすすめスタイル（1色）'
              : easyTabColorType === 'two_tone_horizontal'
              ? 'おすすめツートンスタイル（上下分割）'
              : 'おすすめツートンスタイル（左右分割）'}
          </h4>

          {/* Single Color Presets */}
          {easyTabColorType === 'single' && (
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
          )}

          {/* Two-Tone Color Presets */}
          {(easyTabColorType === 'two_tone_horizontal' || easyTabColorType === 'two_tone_vertical') && (
            <div className="grid grid-cols-1 gap-3">
              {twoTonePresets.filter(preset => preset.mode === easyTabColorType).map((preset) => {
                const primaryColor = EXTERIOR_COLORS.find(c => c.id === preset.primaryColor);
                const secondaryColor = EXTERIOR_COLORS.find(c => c.id === preset.secondaryColor);
                const material = EXTERIOR_MATERIALS.find(m => m.id === preset.material);

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleTwoTonePresetGenerate(preset)}
                    disabled={isDisabled}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <div className={`flex gap-1 flex-shrink-0 ${preset.mode === 'two_tone_horizontal' ? 'flex-col' : 'flex-row'}`}>
                      <div
                        className={`border-2 border-gray-300 ${
                          preset.mode === 'two_tone_horizontal'
                            ? 'w-12 h-6 rounded-t-lg'
                            : 'w-6 h-12 rounded-l-lg'
                        }`}
                        style={{ backgroundColor: primaryColor?.hex }}
                      />
                      <div
                        className={`border-2 border-gray-300 ${
                          preset.mode === 'two_tone_horizontal'
                            ? 'w-12 h-6 rounded-b-lg'
                            : 'w-6 h-12 rounded-r-lg'
                        }`}
                        style={{ backgroundColor: secondaryColor?.hex }}
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="font-semibold text-gray-800">{preset.name}</div>
                    </div>
                    <SparklesIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
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

        {/* Color Mode Selection */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">配色パターン</h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setColorMode('single')}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                colorMode === 'single'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              1色
            </button>
            <button
              onClick={() => setColorMode('two_tone_horizontal')}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                colorMode === 'two_tone_horizontal'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              上下2色
            </button>
            <button
              onClick={() => setColorMode('two_tone_vertical')}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                colorMode === 'two_tone_vertical'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              左右2色
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <SwatchIcon className="w-5 h-5 text-green-600" />
            {colorMode !== 'single' ? '第1の色（主要部分）' : '外壁の色を選択'}
          </h4>

          {/* Preset Color Palette */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">プリセットカラー（10色）</p>
            <div className="grid grid-cols-5 gap-2">
              {EXTERIOR_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handlePresetColorSelect(color.id)}
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

        {/* Second Color (Two-Tone Only) */}
        {colorMode !== 'single' && (
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <SwatchIcon className="w-5 h-5 text-orange-600" />
              第2の色（{colorMode === 'two_tone_horizontal' ? '下部' : '右側'}）
            </h4>

            {/* Secondary Preset Color Palette */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">プリセットカラー（10色）</p>
              <div className="grid grid-cols-5 gap-2">
                {EXTERIOR_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleSecondaryPresetColorSelect(color.id)}
                    className={`relative aspect-square rounded-lg border-2 transition-all ${
                      secondaryColor === color.id
                        ? 'border-orange-600 ring-2 ring-orange-300 scale-105'
                        : 'border-gray-300 hover:border-orange-400'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {secondaryColor === color.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary RGB Color Picker */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">カスタムカラー（RGB調整）</p>
              <div className="space-y-3">
                {/* R Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-gray-600">R (赤)</label>
                    <span className="text-sm font-semibold text-red-600">{secondaryR}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={secondaryR}
                    onChange={(e) => {
                      setSecondaryR(Number(e.target.value));
                      setSecondaryColor('');
                    }}
                    className="w-full h-2 bg-gradient-to-r from-black via-red-500 to-red-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* G Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-gray-600">G (緑)</label>
                    <span className="text-sm font-semibold text-green-600">{secondaryG}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={secondaryG}
                    onChange={(e) => {
                      setSecondaryG(Number(e.target.value));
                      setSecondaryColor('');
                    }}
                    className="w-full h-2 bg-gradient-to-r from-black via-green-500 to-green-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* B Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-gray-600">B (青)</label>
                    <span className="text-sm font-semibold text-blue-600">{secondaryB}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={secondaryB}
                    onChange={(e) => {
                      setSecondaryB(Number(e.target.value));
                      setSecondaryColor('');
                    }}
                    className="w-full h-2 bg-gradient-to-r from-black via-blue-500 to-blue-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Color Preview */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-sm text-gray-600 mb-2">プレビュー</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                      style={{ backgroundColor: rgbToHex(secondaryR, secondaryG, secondaryB) }}
                    />
                    <div className="text-sm">
                      <p className="text-gray-700">RGB: <span className="font-mono font-semibold">({secondaryR}, {secondaryG}, {secondaryB})</span></p>
                      <p className="text-gray-700">HEX: <span className="font-mono font-semibold">{rgbToHex(secondaryR, secondaryG, secondaryB)}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Ratio Selection */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">分割比率</p>
              <div className="grid grid-cols-3 gap-2">
                {SPLIT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setSplitRatio(ratio.value)}
                    className={`px-3 py-2 text-sm rounded-lg border-2 font-medium transition-all ${
                      splitRatio === ratio.value
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-gray-300 text-gray-700 hover:border-orange-400'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <EditIcon className="w-5 h-5 text-green-600" />
            追加の指示（オプション）
          </h4>
          <textarea
            value={exteriorCustomPrompt}
            onChange={(e) => setExteriorCustomPrompt(e.target.value)}
            placeholder={
              colorMode === 'single'
                ? "例：外壁全体を均一に塗装してください。軒天井は白で残してください。"
                : colorMode === 'two_tone_horizontal'
                ? "例：1階と2階の境界で水平に色分けしてください。幕板部分は上階の色に合わせてください。"
                : "例：玄関側とバルコニー側で垂直に色分けしてください。出隅部分は濃い色で統一してください。"
            }
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            disabled={isDisabled}
          />
        </div>

        <button
          onClick={handleExteriorGenerate}
          disabled={isDisabled || (!selectedExteriorColor && !exteriorCustomPrompt.trim())}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <SparklesIcon className="w-5 h-5" />
          <span>外壁デザインを生成</span>
        </button>
      </div>
    );

    const renderExteriorPaintingFinetunePanel = () => {
      const EXTERIOR_FINETUNE_TABS: { id: 'detailed' | 'products'; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
        { id: 'detailed', name: '詳細設定', icon: EditIcon },
        { id: 'products', name: '商品', icon: BuildingStorefrontIcon }
      ];

      const [finetuneActiveTab, setFinetuneActiveTab] = useState<'detailed' | 'products'>('detailed');

      return (
        <div className="space-y-4">
          <div className="flex justify-between items-start pb-2 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-gray-800">微調整モード (外壁塗装)</h3>
              <p className="text-sm text-gray-600 mt-1">生成された外壁デザインを微調整します。</p>
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
            <nav className="-mb-px flex gap-x-4" aria-label="Tabs">
              {EXTERIOR_FINETUNE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFinetuneActiveTab(tab.id)}
                  className={`${
                    finetuneActiveTab === tab.id
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
            {finetuneActiveTab === 'detailed' && renderDetailedTab()}
            {finetuneActiveTab === 'products' && renderProductsTab()}
          </div>
        </div>
      );
    };

    const renderProductsTab = () => {
      const filteredProducts = products.filter(p => p.categoryId === selectedCategoryId);

      const handleExteriorProductGenerate = () => {
        if (!exteriorCustomPrompt.trim()) return;

        const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
        if (selectedProducts.length === 0) {
          alert("使用する塗料を1つ以上選択してください。");
          return;
        }

        // 塗料の場合、外壁全体に均一に適用する指示を追加
        const finalPrompt = `提供されている塗料商品画像の色を使用して、以下の指示に従ってください：${exteriorCustomPrompt}。塗料は外壁の質感を保ちながら、自然に色を適用してください。`;

        onGenerate('products', finalPrompt, selectedProducts);
      };

      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="paint-category" className="block text-sm font-medium text-gray-700 mb-1">1. 塗料カテゴリーを選択</label>
            <select
              id="paint-category"
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedProductIds([]);
              }}
              disabled={isDisabled || categories.length === 0}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            >
              {filteredCategories.length === 0 ? (
                <option>カテゴリー未登録</option>
              ) : (
                filteredCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">2. 使用する塗料を選択</h4>
            {categories.length === 0 || !selectedCategoryId ? (
              <p className="text-center text-sm text-gray-500 py-4">
                データベースに塗料カテゴリーがありません。
              </p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">
                このカテゴリーに塗料がありません。
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-gray-100 rounded-lg">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product.id)}
                    className={`relative w-full aspect-square rounded-md focus:outline-none transition-all duration-200 ${
                      selectedProductIds.includes(product.id) ? 'ring-4 ring-offset-1 ring-green-500' : 'ring-2 ring-transparent hover:ring-green-300'
                    }`}
                  >
                    <img src={product.src} alt="塗料" className="w-full h-full object-cover rounded-md" />
                    {selectedProductIds.includes(product.id) && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-md">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">3. 塗装方法を指示</h4>
            <textarea
              value={exteriorCustomPrompt}
              onChange={(e) => setExteriorCustomPrompt(e.target.value)}
              placeholder="例：この塗料で外壁全体を塗装してください。 / 1階をこの色で、2階を別の色でツートンにしてください。"
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              disabled={isDisabled}
            />
          </div>

          <button
            onClick={handleExteriorProductGenerate}
            disabled={isDisabled || !exteriorCustomPrompt.trim() || selectedProductIds.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>この塗料で外壁をシミュレーション</span>
          </button>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <h3 className="text-lg font-bold text-gray-800">外壁塗装シミュレーション</h3>
          <FeatureTip tip="実際の塗料商品を使ったシミュレーションが可能です。「商品」タブから登録済みの塗料を選択して、施工後の外観イメージをお客様に提示できます。" />
        </div>
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
          {exteriorPaintingActiveTab === 'products' && renderProductsTab()}
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
        <div className="flex items-center">
          <h3 className="text-lg font-bold text-gray-800">パースを生成</h3>
          <FeatureTip tip="手書きスケッチや簡単な図面から、プロ品質のフォトリアルなパースを生成できます。提案段階での完成イメージ共有に最適です。" />
        </div>
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

    // Finetuning mode for exterior painting
    if (exteriorSubMode === 'exterior_painting') {
      return renderExteriorPaintingFinetunePanel();
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
                disabled={isStep8 || isStep9 || isStep10 || isStep11}
                className={`text-sm flex items-center gap-1 transition-colors flex-shrink-0 ml-4 ${
                  isStep8 || isStep9 || isStep10 || isStep11
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="比較表示に戻る"
              >
                <ArrowUturnLeftIcon className="w-4 h-4" />
                比較に戻る
              </button>
            </div>

            <div className="border-b border-gray-200">
              <nav className="-mb-px flex flex-wrap gap-x-2 gap-y-1" aria-label="Tabs">
                {FINETUNE_TABS.map((tab) => {
                  const isHighlighted = tutorialMode && (
                    (tutorialStepIndex === 7 && tab.id === 'furniture') ||
                    (tutorialStepIndex === 8 && tab.id === 'person') ||
                    (tutorialStepIndex === 9 && tab.id === 'partial') ||
                    (tutorialStepIndex === 10 && tab.id === 'products')
                  );
                  const isDisabledInStep8 = isStep8 && tab.id !== 'furniture';
                  const isDisabledInStep9 = isStep9 && tab.id !== 'person';
                  const isDisabledInStep10 = isStep10 && tab.id !== 'partial';
                  const isDisabledInStep11 = isStep11 && tab.id !== 'products';
                  const isDisabled = isDisabledInStep8 || isDisabledInStep9 || isDisabledInStep10 || isDisabledInStep11;
                  return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && handleFinetuneTabClick(tab.id as 'partial' | 'furniture' | 'person' | 'products')}
                    disabled={isDisabled}
                    className={`${
                      finetuneActiveTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : isHighlighted
                        ? 'border-purple-500 text-purple-600 ring-2 ring-purple-300 ring-opacity-50 animate-pulse'
                        : isDisabled
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all`}
                  >
                    <tab.icon className="w-5 h-5"/>
                    {tab.id === 'partial' ? '詳細設定' : tab.name}
                  </button>
                );
                })}
              </nav>
            </div>

            {finetuneActiveTab === 'partial' && !isStep11 && renderPromptSection(true)}
            {finetuneActiveTab === 'products' && !isStep10 && renderProductsPanel()}
            {finetuneActiveTab === 'furniture' && !isStep9 && !isStep10 && !isStep11 && (
                <div className="space-y-4">
                    {!isStep8 && renderFurnitureOptions()}
                    {!isStep8 && (
                      <div className="relative flex items-center pt-2">
                          <div className="flex-grow border-t border-gray-200"></div>
                          <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase">指示を入力</span>
                          <div className="flex-grow border-t border-gray-200"></div>
                      </div>
                    )}
                    {renderPromptSection(true)}
                </div>
            )}
            {finetuneActiveTab === 'person' && !isStep10 && !isStep11 && renderPromptSection(true)}
        </div>
    );
  }

  const renderCommercialModeUI = () => {
    if (!commercialContext || !onCommercialContextChange) {
      return null;
    }

    // Determine current phase based on generation count
    const getCurrentPhase = (): CommercialStep => {
      const count = commercialContext.generationCount;
      if (count <= 2) return 'facility_definition';
      if (count <= 5) return 'zoning';
      if (count <= 8) return 'detail_design';
      return 'finishing';
    };

    const currentPhase = getCurrentPhase();

    // Update currentStep if it doesn't match
    if (commercialContext.currentStep !== currentPhase) {
      onCommercialContextChange({
        ...commercialContext,
        currentStep: currentPhase,
      });
    }

    const handleFacilityTypeChange = (type: FacilityType) => {
      onCommercialContextChange({
        ...commercialContext,
        facilityType: type,
      });
    };

    const handleOriginalSpaceTypeChange = (type: OriginalSpaceType) => {
      onCommercialContextChange({
        ...commercialContext,
        originalSpaceType: type,
      });
    };

    const handleConceptKeywordsChange = (keywords: string[]) => {
      onCommercialContextChange({
        ...commercialContext,
        conceptKeywords: keywords,
      });
    };

    const handleTargetScaleChange = (scale: string) => {
      onCommercialContextChange({
        ...commercialContext,
        targetScale: scale,
      });
    };

    const handleZoningAreasChange = (areas: string[]) => {
      onCommercialContextChange({
        ...commercialContext,
        zoningData: {
          ...commercialContext.zoningData,
          areas,
        },
      });
    };

    const handleFlowPatternChange = (pattern: string) => {
      onCommercialContextChange({
        ...commercialContext,
        zoningData: {
          ...commercialContext.zoningData,
          flowPattern: pattern,
        },
      });
    };

    const handleColorSchemeChange = (colors: string[]) => {
      onCommercialContextChange({
        ...commercialContext,
        designDetails: {
          ...commercialContext.designDetails,
          colorScheme: colors,
        },
      });
    };

    const handleMaterialsChange = (materials: string[]) => {
      onCommercialContextChange({
        ...commercialContext,
        designDetails: {
          ...commercialContext.designDetails,
          materials,
        },
      });
    };

    const canGenerate = commercialContext.facilityType && commercialContext.originalSpaceType && activeImage;

    // Phase-specific data for facility type
    const facilityAdjustments = commercialContext.facilityType
      ? FACILITY_ADJUSTMENT_ITEMS[commercialContext.facilityType]
      : [];

    // Build cumulative prompt
    const buildPrompt = (additionalInstructions: string = ''): string => {
      let prompt = `商業施設リノベーション（第${commercialContext.generationCount + 1}回目）\n`;
      prompt += `施設タイプ: ${FACILITY_TYPES.find(f => f.id === commercialContext.facilityType)?.name}\n`;
      prompt += `元の空間: ${ORIGINAL_SPACE_TYPES.find(s => s.id === commercialContext.originalSpaceType)?.name}\n`;

      if (commercialContext.conceptKeywords.length > 0) {
        prompt += `コンセプト: ${commercialContext.conceptKeywords.join(', ')}\n`;
      }
      if (commercialContext.targetScale) {
        prompt += `規模: ${commercialContext.targetScale}\n`;
      }

      // Phase-specific additions
      if (currentPhase === 'zoning' || currentPhase === 'detail_design' || currentPhase === 'finishing') {
        if (commercialContext.zoningData.areas.length > 0) {
          prompt += `エリア構成: ${commercialContext.zoningData.areas.join(', ')}\n`;
        }
        if (commercialContext.zoningData.flowPattern) {
          prompt += `動線パターン: ${commercialContext.zoningData.flowPattern}\n`;
        }
      }

      if (currentPhase === 'detail_design' || currentPhase === 'finishing') {
        if (commercialContext.designDetails.colorScheme.length > 0) {
          prompt += `カラースキーム: ${commercialContext.designDetails.colorScheme.join(', ')}\n`;
        }
        if (commercialContext.designDetails.materials.length > 0) {
          prompt += `素材: ${commercialContext.designDetails.materials.join(', ')}\n`;
        }
      }

      if (additionalInstructions) {
        prompt += `\n追加指示: ${additionalInstructions}`;
      }

      return prompt;
    };

    const handleGenerate = (additionalInstructions: string = '') => {
      if (canGenerate) {
        const prompt = buildPrompt(additionalInstructions);

        // Note: generation count will be incremented in App.tsx after successful generation
        onGenerate('oneClick', prompt);
      }
    };

    const getPhaseInfo = () => {
      switch (currentPhase) {
        case 'facility_definition':
          return {
            title: 'フェーズ 1: 施設定義',
            description: 'リノベーションする施設のタイプと元の空間を選択してください',
            count: `${commercialContext.generationCount + 1}/3回目`,
          };
        case 'zoning':
          return {
            title: 'フェーズ 2: ゾーニング・レイアウト',
            description: 'エリア配置と動線パターンを設定してください',
            count: `${commercialContext.generationCount + 1}/6回目`,
          };
        case 'detail_design':
          return {
            title: 'フェーズ 3: 詳細デザイン',
            description: 'カラースキームと素材を選択してください',
            count: `${commercialContext.generationCount + 1}/9回目`,
          };
        case 'finishing':
          return {
            title: 'フェーズ 4: 仕上げ',
            description: '最終的な調整とディテールを追加してください',
            count: `第${commercialContext.generationCount + 1}回目`,
          };
      }
    };

    const phaseInfo = getPhaseInfo();

    return (
      <div className="space-y-6">
        {/* Phase indicator */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">{phaseInfo.title}</h4>
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
              {phaseInfo.count}
            </span>
          </div>
          <p className="text-sm text-purple-700">
            {phaseInfo.description}
          </p>
        </div>

        {/* Facility Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            施設タイプを選択 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {FACILITY_TYPES.map((facility) => (
              <button
                key={facility.id}
                onClick={() => handleFacilityTypeChange(facility.id)}
                className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  commercialContext.facilityType === facility.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {facility.name}
              </button>
            ))}
          </div>
        </div>

        {/* Original Space Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            元の空間タイプを選択 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {ORIGINAL_SPACE_TYPES.map((space) => (
              <button
                key={space.id}
                onClick={() => handleOriginalSpaceTypeChange(space.id)}
                className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  commercialContext.originalSpaceType === space.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {space.name}
              </button>
            ))}
          </div>
        </div>

        {/* Concept Keywords */}
        <div className="space-y-3">
          <label htmlFor="conceptKeywords" className="block text-sm font-semibold text-gray-700">
            コンセプトキーワード（任意）
          </label>
          <input
            id="conceptKeywords"
            type="text"
            value={commercialContext.conceptKeywords.join(', ')}
            onChange={(e) => handleConceptKeywordsChange(e.target.value.split(',').map(k => k.trim()).filter(k => k))}
            placeholder="例: モダン, 明るい, オープンスペース"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500">複数のキーワードをカンマ区切りで入力してください</p>
        </div>

        {/* Target Scale */}
        <div className="space-y-3">
          <label htmlFor="targetScale" className="block text-sm font-semibold text-gray-700">
            ターゲット規模（任意）
          </label>
          <input
            id="targetScale"
            type="text"
            value={commercialContext.targetScale}
            onChange={(e) => handleTargetScaleChange(e.target.value)}
            placeholder="例: 100㎡、20席、5部屋"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Phase 2: Zoning fields */}
        {(currentPhase === 'zoning' || currentPhase === 'detail_design' || currentPhase === 'finishing') && (
          <>
            <div className="border-t border-gray-200 pt-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-4">ゾーニング設定</h5>

              {/* Area Selection */}
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  エリア構成（複数選択可）
                </label>
                <div className="flex flex-wrap gap-2">
                  {['エントランス', 'メインエリア', '待合スペース', '作業スペース', 'プライベートルーム', 'バックヤード', 'トイレ', '収納'].map((area) => (
                    <button
                      key={area}
                      onClick={() => {
                        const areas = commercialContext.zoningData.areas.includes(area)
                          ? commercialContext.zoningData.areas.filter(a => a !== area)
                          : [...commercialContext.zoningData.areas, area];
                        handleZoningAreasChange(areas);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        commercialContext.zoningData.areas.includes(area)
                          ? 'bg-teal-600 text-white shadow'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flow Pattern */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  動線パターン
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['直線的', '回遊型', 'センター集中', 'エリア分離'].map((pattern) => (
                    <button
                      key={pattern}
                      onClick={() => handleFlowPatternChange(pattern)}
                      className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                        commercialContext.zoningData.flowPattern === pattern
                          ? 'bg-teal-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Phase 3: Detail Design fields */}
        {(currentPhase === 'detail_design' || currentPhase === 'finishing') && (
          <>
            <div className="border-t border-gray-200 pt-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-4">詳細デザイン設定</h5>

              {/* Color Scheme */}
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  カラースキーム（複数選択可）
                </label>
                <div className="flex flex-wrap gap-2">
                  {['ホワイト基調', 'ダークトーン', 'ナチュラルウッド', 'グレージュ', 'ビビッドアクセント', 'パステル', 'モノトーン', 'アースカラー'].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        const colors = commercialContext.designDetails.colorScheme.includes(color)
                          ? commercialContext.designDetails.colorScheme.filter(c => c !== color)
                          : [...commercialContext.designDetails.colorScheme, color];
                        handleColorSchemeChange(colors);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        commercialContext.designDetails.colorScheme.includes(color)
                          ? 'bg-pink-600 text-white shadow'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  素材（複数選択可）
                </label>
                <div className="flex flex-wrap gap-2">
                  {['無垢材', 'コンクリート', 'タイル', '大理石', 'スチール', 'ガラス', 'ラタン', '漆喰'].map((material) => (
                    <button
                      key={material}
                      onClick={() => {
                        const materials = commercialContext.designDetails.materials.includes(material)
                          ? commercialContext.designDetails.materials.filter(m => m !== material)
                          : [...commercialContext.designDetails.materials, material];
                        handleMaterialsChange(materials);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        commercialContext.designDetails.materials.includes(material)
                          ? 'bg-amber-600 text-white shadow'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {material}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Phase 4: Additional instructions */}
        {currentPhase === 'finishing' && (
          <div className="border-t border-gray-200 pt-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">追加の指示（任意）</h5>
            <textarea
              id="finishingInstructions"
              rows={4}
              placeholder="例: 照明をより明るく、天井を高く見せる工夫を..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={() => {
            const additionalInstructions = currentPhase === 'finishing'
              ? (document.getElementById('finishingInstructions') as HTMLTextAreaElement)?.value || ''
              : '';
            handleGenerate(additionalInstructions);
          }}
          disabled={!canGenerate || isDisabled}
          className={`w-full px-6 py-4 rounded-lg font-semibold text-base transition-all ${
            !canGenerate || isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'
          }`}
        >
          {isDisabled ? (
            <div className="flex items-center justify-center gap-2">
              <SpinnerIcon className="w-5 h-5 animate-spin" />
              生成中...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <SparklesIcon className="w-5 h-5" />
              {currentPhase === 'facility_definition' && '施設定義を生成'}
              {currentPhase === 'zoning' && 'ゾーニングを生成'}
              {currentPhase === 'detail_design' && '詳細デザインを生成'}
              {currentPhase === 'finishing' && '最終仕上げを生成'}
            </div>
          )}
        </button>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'oneClick':
        return (
          <div className="space-y-4">
            <div className={isStep1 ? 'relative z-50' : ''}>
              <button
                onClick={() => onGenerate('oneClick', OMAKASE_PROMPT)}
                disabled={isDisabled || isStep2 || isStep3}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 font-bold rounded-lg transition-all shadow-lg transform ${
                  isStep2 || isStep3
                    ? 'text-gray-500 bg-gray-300 cursor-not-allowed'
                    : isStep1
                    ? 'text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 ring-4 ring-purple-300 ring-opacity-50'
                    : 'text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-0.5'
                }`}
                style={isStep1 ? {
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                } : undefined}
              >
                <SparklesIcon className="w-6 h-6" />
                <span>ワンタップおまかせリノベーション</span>
              </button>
            </div>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-sm font-semibold text-gray-500">またはスタイルを選択</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <div className={`border rounded-md ${isStep3 ? 'relative z-50' : ''}`}>
              {RENOVATION_CATEGORIES.map((category) => (
                <div key={category.id} className="border-b border-gray-200 last:border-b-0">
                  <button
                    onClick={() => !(isStep1 || isStep2 || (isStep3 && category.id !== 'design_taste')) && setOpenAccordion(openAccordion === category.id ? null : category.id)}
                    disabled={isStep1 || isStep2 || (isStep3 && category.id !== 'design_taste')}
                    className={`w-full flex justify-between items-center p-3 text-left font-semibold transition-colors ${
                      (isStep1 || isStep2 || (isStep3 && category.id !== 'design_taste')) ? 'text-gray-400 cursor-not-allowed bg-gray-50' :
                      (isStep3 && category.id === 'design_taste') ? 'text-gray-700 hover:bg-gray-50 ring-2 ring-purple-400 bg-purple-50' :
                      'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <category.icon className={`w-6 h-6 ${
                        (isStep1 || isStep2 || (isStep3 && category.id !== 'design_taste')) ? 'text-gray-400' :
                        (isStep3 && category.id === 'design_taste') ? 'text-purple-500' :
                        'text-indigo-500'
                      }`} />
                      {category.name}
                    </span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
                        (isStep1 || isStep2 || (isStep3 && category.id !== 'design_taste')) ? 'text-gray-400' :
                        (isStep3 && category.id === 'design_taste') ? 'text-purple-500' :
                        'text-gray-500'
                      } ${openAccordion === category.id ? 'rotate-180' : ''}`}
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
                            disabled={isDisabled || isStep1 || (isStep3 && style.id !== 'minimalist')}
                            className={`w-full p-2.5 text-sm font-medium text-left rounded-md transition-colors border ${
                              (isStep1 || (isStep3 && style.id !== 'minimalist'))
                                ? 'text-gray-400 bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                                : (isStep3 && style.id === 'minimalist')
                                ? 'text-purple-700 bg-purple-50 border-purple-400 hover:bg-purple-100 ring-2 ring-purple-300'
                                : 'text-gray-600 bg-white border-gray-200 hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                            style={(isStep3 && style.id === 'minimalist') ? {
                              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            } : undefined}
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
    <div className={`w-full space-y-4 ${(isStep1 || isStep3) ? 'relative z-50' : ''}`}>
      <div className="flex items-center">
        <h3 className="text-lg font-bold text-gray-800">リノベーションを実行</h3>
        <FeatureTip tip="複数のスタイルを試して比較することで、お客様により多くの選択肢を提案できます。「かんたん」タブのワンタップおまかせ機能なら、AIが自動で最適なリノベーションを提案します。" />
      </div>

      {/* Commercial mode toggle (development only) */}
      {featureFlags.enableCommercialMode && onRenovationSubModeChange && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">対象施設タイプ</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onRenovationSubModeChange('residential')}
              className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                renovationSubMode === 'residential'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <HomeModernIcon className="w-5 h-5 inline-block mr-2" />
              住宅リノベーション
            </button>
            <button
              onClick={() => onRenovationSubModeChange('commercial')}
              className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                renovationSubMode === 'commercial'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <BuildingStorefrontIcon className="w-5 h-5 inline-block mr-2" />
              商業施設リノベーション
            </button>
          </div>
        </div>
      )}

      {/* Residential mode: Show tabs */}
      {renovationSubMode === 'residential' && (
        <>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-x-2 gap-y-1" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !isStep1 && handleTabClick(tab.id)}
                  disabled={isStep1 && tab.id !== 'oneClick'}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : isStep1 && tab.id !== 'oneClick'
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
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
        </>
      )}

      {/* Commercial mode: Show facility setup UI */}
      {renovationSubMode === 'commercial' && renderCommercialModeUI()}
    </div>
  );
};

export default RenovationPanel;