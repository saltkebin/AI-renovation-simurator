import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import RenovationPanel from './components/RenovationPanel';
import ComparisonView from './components/ComparisonView';
import Loader from './components/Loader';
import HistoryPanel from './components/HistoryPanel';
import QuotationPanel from './components/QuotationPanel';
import ErrorDisplay from './components/ErrorDisplay';
import ConfirmationModal from './components/ConfirmationModal';
import DatabasePage from './components/DatabasePage';
import PinAuth from './components/PinAuth';
import MainMenu from './components/MainMenu';
import QuotationEditorPage from './components/QuotationEditorPage';
import SalesChatBot from './components/SalesChatBot';
import TenantEmailSettingsPage from './components/TenantEmailSettingsPage';
import { generateRenovationImage, generateQuotation, generateArchFromSketch, generateRenovationWithProducts, generateExteriorPaintingQuotation } from './services/geminiService';
import type { RenovationMode, RenovationStyle, GeneratedImage, QuotationResult, RegisteredProduct, AppMode, ProductCategory, ExteriorSubMode } from './types';
import { RENOVATION_PROMPTS, OMAKASE_PROMPT, UPDATE_HISTORY } from './constants';
import { SparklesIcon, ArrowDownTrayIcon, CalculatorIcon, PaintBrushIcon, PencilIcon, TrashIcon } from './components/Icon';
import { db, verifyPin } from './services/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

type AppView = 'main' | 'database';
type SelectedApp = 'menu' | 'renovation' | 'quotation' | 'email-settings' | 'sales-chatbot';

interface ModalInfo {
  title: string;
  message: string | React.ReactNode;
  confirmText: string;
  onConfirm: () => void;
  cancelText?: string;
  onCancel?: () => void;
  confirmButtonColor?: 'red' | 'indigo';
  hideCancelButton?: boolean;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<SelectedApp>('menu');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeGeneratedImage, setActiveGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true); // For initial data load
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isFinetuningMode, setIsFinetuningMode] = useState<boolean>(false);
  const [isQuotationMode, setIsQuotationMode] = useState<boolean>(false);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [quotationResult, setQuotationResult] = useState<QuotationResult | null>(null);
  const [displayAspectRatio, setDisplayAspectRatio] = useState<string>('auto');
  const [originalImageAspectRatio, setOriginalImageAspectRatio] = useState<string>('4:3');
  const [appMode, setAppMode] = useState<AppMode>('renovation');
  const [exteriorSubMode, setExteriorSubMode] = useState<ExteriorSubMode>('sketch2arch');
  const [appView, setAppView] = useState<AppView>('main');
  const [showAllUpdates, setShowAllUpdates] = useState<boolean>(false);
  const [modalInfo, setModalInfo] = useState<ModalInfo | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<RegisteredProduct[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return; // Don't fetch data if not authenticated

    const fetchData = async () => {
      try {
        // Fetch Categories
        const categoriesCollection = collection(db, 'categories');
        const categorySnapshot = await getDocs(categoriesCollection);
        if (categorySnapshot.empty) {
          // Create default categories if none exist
          const defaultCategories = [{ name: '壁紙' }, { name: '家具' }, { name: '塗料' }];
          const newCategories: ProductCategory[] = [];
          for (const cat of defaultCategories) {
            const docRef = await addDoc(categoriesCollection, cat);
            newCategories.push({ id: docRef.id, ...cat });
          }
          setCategories(newCategories);
        } else {
          const categoriesList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory));
          setCategories(categoriesList);
        }

        // Fetch Products
        const productsCollection = collection(db, 'products');
        const productSnapshot = await getDocs(productsCollection);
        const productsList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredProduct));
        setProducts(productsList);

      } catch (e) {
        console.error("Failed to load data from Firestore", e);
        setError("商品データベースの読み込みに失敗しました。ページをリロードして再度お試しください。");
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]); // Add isAuthenticated to dependency array

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const resetState = () => {
    setOriginalImage(null);
    setGeneratedImages([]);
    setActiveGeneratedImage(null);
    setError(null);
    setMimeType('');
    setIsFinetuningMode(false);
    setIsQuotationMode(false);
    setQuotationResult(null);
    setDisplayAspectRatio('auto');
    setOriginalImageAspectRatio('4:3');
  };

  const performSwitch = useCallback((newMode: AppMode) => {
    // originalImage と関連 state は維持する
    setGeneratedImages([]);
    setActiveGeneratedImage(null);
    setError(null);
    setIsFinetuningMode(false);
    setIsQuotationMode(false);
    setQuotationResult(null);
    
    // 表示アスペクト比をオリジナル画像のものに戻す
    if (originalImage) {
      const img = new Image();
      img.onload = () => {
        setDisplayAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
      };
      img.src = originalImage;
    }
    
    setAppMode(newMode);
  }, [originalImage]);

  const handleAppModeChange = (newMode: AppMode) => {
    if (appMode === newMode || isLoading) {
      return;
    }
  
    if (generatedImages.length > 0) {
      setModalInfo({
        title: 'モードの切り替え',
        message: 'モードを切り替えると、生成された画像はすべてクリアされます。よろしいですか？',
        confirmText: 'はい、切り替える',
        confirmButtonColor: 'red',
        onConfirm: () => {
          performSwitch(newMode);
          setModalInfo(null);
        },
        cancelText: 'キャンセル',
        onCancel: () => setModalInfo(null),
      });
    } else {
      performSwitch(newMode);
    }
  };

  const handleImageUpload = (file: File) => {
    const processUpload = () => {
      resetState();
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setOriginalImage(imageUrl);
        setMimeType(file.type);
        setAppMode('renovation');
        
        const img = new Image();
        img.onload = () => {
          const aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
          const aspectRatioForPrompt = `${img.naturalWidth}:${img.naturalHeight}`;
          setDisplayAspectRatio(aspectRatio);
          setOriginalImageAspectRatio(aspectRatioForPrompt);
        };
        img.src = imageUrl;
      };
      reader.onerror = () => {
        setError('画像の読み込みに失敗しました。');
      };
      reader.readAsDataURL(file);
    };

    if (originalImage) {
      setModalInfo({
        title: '画像を再アップロード',
        message: '新しい画像をアップロードすると、現在の画像と生成履歴がすべてクリアされます。よろしいですか？',
        confirmText: 'はい、クリアして続行',
        confirmButtonColor: 'red',
        onConfirm: () => {
          processUpload();
          setModalInfo(null);
        },
        cancelText: 'キャンセル',
        onCancel: () => setModalInfo(null),
      });
    } else {
      processUpload();
    }
  };

  const handleUploadError = (message: string) => {
      setModalInfo({
        title: '画像アップロードエラー',
        message: message.split('\n').map((line, i) => <p key={i}>{line}</p>),
        confirmText: 'OK',
        onConfirm: () => setModalInfo(null),
        hideCancelButton: true,
      });
  };
  
  const handleClearAll = () => {
    setModalInfo({
      title: '全てクリアにする',
      message: 'これまでに生成した画像がすべて消えますがよろしいですか？',
      confirmText: 'クリアする',
      confirmButtonColor: 'red',
      onConfirm: () => {
        resetState();
        setModalInfo(null);
      },
      cancelText: 'キャンセル',
      onCancel: () => setModalInfo(null),
    });
  };

  const handleGenerate = useCallback(async (
    mode: RenovationMode | 'sketch', 
    promptOrStyle: string, 
    products?: RegisteredProduct[]
  ) => {
    const baseImage = (isFinetuningMode && activeGeneratedImage) ? activeGeneratedImage.src : originalImage;
    if (!baseImage) {
      setError('最初に画像をアップロードしてください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const base64Data = baseImage.split(',')[1];
    if (!base64Data) {
        setError('無効な画像データです。');
        setIsLoading(false);
        return;
    }
    
    try {
      let result;
      let description;

      if (mode === 'products') {
        if (!products || products.length === 0) {
          throw new Error("商品が選択されていません。");
        }
        result = await generateRenovationWithProducts(base64Data, mimeType, products, promptOrStyle, originalImageAspectRatio);
        description = undefined;
      } else if (appMode === 'exterior' && exteriorSubMode === 'sketch2arch' && !isFinetuningMode) {
        result = await generateArchFromSketch(base64Data, mimeType, promptOrStyle);
        description = `スケッチから生成: ${promptOrStyle}`;
      } else if (appMode === 'exterior' && exteriorSubMode === 'exterior_painting') {
        // Exterior painting mode - will be implemented in next step
        result = await generateRenovationImage(base64Data, mimeType, promptOrStyle, originalImageAspectRatio, false);
        description = undefined;
      } else {
        const isOmakase = promptOrStyle === OMAKASE_PROMPT;
        const prompt = mode === 'oneClick' 
          ? RENOVATION_PROMPTS[promptOrStyle as RenovationStyle] ?? promptOrStyle
          : promptOrStyle;
        
        if (!prompt) {
          throw new Error('無効なリノベーションスタイルです。');
        }
        
        result = await generateRenovationImage(base64Data, mimeType, prompt, originalImageAspectRatio, isOmakase);
        description = isOmakase ? result.text : undefined;
      }
      
      if (result.image) {
        const newImage: GeneratedImage = {
          src: `data:${result.mimeType};base64,${result.image}`,
          aspectRatio: originalImageAspectRatio,
          description: description,
        };
        setGeneratedImages(prevImages => [newImage, ...prevImages].slice(0, 20));
        setActiveGeneratedImage(newImage);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '画像の生成に失敗しました: 不明なエラーが発生しました。');
    }
    finally {
      setIsLoading(false);
    }
  }, [originalImage, activeGeneratedImage, mimeType, isFinetuningMode, originalImageAspectRatio, appMode]);

  const handleHistorySelect = (image: GeneratedImage | null) => {
    setActiveGeneratedImage(image);
  
    if (!isFinetuningMode || !image) {
      setIsFinetuningMode(false);
    }
  
    setIsQuotationMode(false);
    setQuotationResult(null);
    if (image) {
      setDisplayAspectRatio(image.aspectRatio.replace(':', '/'));
    } else if (originalImage) {
      const img = new Image();
      img.onload = () => {
        setDisplayAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
      };
      img.src = originalImage;
    }
  };

  const handleDownload = () => {
    if (!activeGeneratedImage) return;

    const link = document.createElement('a');
    link.href = activeGeneratedImage.src;

    const extension = activeGeneratedImage.src.substring("data:image/".length, activeGeneratedImage.src.indexOf(";base64"));
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const modePrefix = appMode === 'renovation' ? 'renovation' : 'sketch';
    link.download = `${modePrefix}_${timestamp}.${extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleEnterQuotationMode = () => {
    if (activeGeneratedImage) {
      setIsFinetuningMode(false);
      setIsQuotationMode(true);
      setQuotationResult(null);
      setError(null);
    }
  };
    
  const handleExitQuotationMode = () => {
    setIsQuotationMode(false);
    setQuotationResult(null);
    setError(null);
  };

  const handleExitQuotationRequest = () => {
    if (quotationResult) {
      setModalInfo({
        title: '比較表示に戻りますか？',
        message: 'AI概算見積もりが削除されますがよろしいですか？',
        confirmText: 'はい',
        confirmButtonColor: 'red',
        onConfirm: () => {
          handleExitQuotationMode();
          setModalInfo(null);
        },
        cancelText: 'キャンセル',
        onCancel: () => setModalInfo(null),
      });
    } else {
      handleExitQuotationMode();
    }
  };

  const handleGetQuote = async (floor: string, wall: string, casing: string) => {
      if (!originalImage || !activeGeneratedImage) {
          setError("見積もりには、元の画像と生成された画像の両方が必要です。");
          return;
      }
      setIsQuoting(true);
      setError(null);
      setQuotationResult(null);

      try {
          const originalBase64 = originalImage.split(',')[1];
          const generatedBase64 = activeGeneratedImage.src.split(',')[1];

          if (!originalBase64 || !generatedBase64) {
              throw new Error("無効な画像データです。");
          }

          const result = await generateQuotation(originalBase64, generatedBase64, mimeType, floor, wall, casing);
          setQuotationResult(result);

      } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : '見積もりの生成に失敗しました。');
      } finally {
          setIsQuoting(false);
      }
  };

  const handleGetExteriorQuote = async (wallArea: string, paintType: string) => {
      if (!originalImage || !activeGeneratedImage) {
          setError("見積もりには、元の画像と生成された画像の両方が必要です。");
          return;
      }
      setIsQuoting(true);
      setError(null);
      setQuotationResult(null);

      try {
          const originalBase64 = originalImage.split(',')[1];
          const generatedBase64 = activeGeneratedImage.src.split(',')[1];

          if (!originalBase64 || !generatedBase64) {
              throw new Error("無効な画像データです。");
          }

          const result = await generateExteriorPaintingQuotation(originalBase64, generatedBase64, mimeType, wallArea, paintType);
          setQuotationResult(result);

      } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : '見積もりの生成に失敗しました。');
      } finally {
          setIsQuoting(false);
      }
  };

  const handleDownloadQuotationImage = async (editedQuotation: QuotationResult | null) => {
    if (!originalImage || !activeGeneratedImage || !editedQuotation) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PADDING = 50;
    const IMG_GAP = 30;
    const FONT_FAMILY = 'Inter, "Helvetica Neue", "Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
    const IMAGE_MAX_WIDTH = 500;
    const SECTION_GAP = 40;
    
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };
    
    try {
      const [beforeImg, afterImg] = await Promise.all([
        loadImage(originalImage),
        loadImage(activeGeneratedImage.src)
      ]);

      const beforeAspectRatio = beforeImg.naturalHeight / beforeImg.naturalWidth;
      const afterAspectRatio = afterImg.naturalHeight / afterImg.naturalWidth;
      
      const beforeW = Math.min(beforeImg.naturalWidth, IMAGE_MAX_WIDTH);
      const beforeH = beforeW * beforeAspectRatio;
      const afterW = Math.min(afterImg.naturalWidth, IMAGE_MAX_WIDTH);
      const afterH = afterW * afterAspectRatio;

      const imagesWidth = beforeW + afterW + IMG_GAP;
      const canvasWidth = Math.max(imagesWidth, 1000) + PADDING * 2;
      const imagesMaxHeight = Math.max(beforeH, afterH);
      
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, isDrawing: boolean = true) => {
        const words = text.split('');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                if(isDrawing) ctx.fillText(line, x, currentY);
                line = words[n];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        if(isDrawing) ctx.fillText(line, x, currentY);
        return currentY + lineHeight;
      };

      let currentY = PADDING;
      ctx.font = `bold 36px ${FONT_FAMILY}`;
      currentY += 50;
      currentY += SECTION_GAP;
      ctx.font = `bold 18px ${FONT_FAMILY}`;
      currentY += 25;
      currentY += imagesMaxHeight;
      currentY += SECTION_GAP;
      ctx.font = `bold 24px ${FONT_FAMILY}`;
      currentY += 35;
      currentY += 20;
      ctx.font = `bold 48px ${FONT_FAMILY}`;
      currentY += 60;
      currentY += SECTION_GAP;
      ctx.font = `bold 20px ${FONT_FAMILY}`;
      currentY += 30;
      currentY += 15;
      ctx.font = `16px ${FONT_FAMILY}`;
      editedQuotation.construction_items.forEach(() => currentY += 35);
      currentY += SECTION_GAP;
      ctx.font = `bold 16px ${FONT_FAMILY}`;
      currentY += 25;
      ctx.font = `14px ${FONT_FAMILY}`;
      const notesFinalY = wrapText(editedQuotation.notes, 0, currentY, canvasWidth - PADDING*2, 22, false);
      currentY = notesFinalY;
      currentY += PADDING;

      canvas.width = canvasWidth;
      canvas.height = currentY;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let drawY = PADDING;
      
      ctx.fillStyle = '#1f2937';
      ctx.font = `bold 36px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText('AIリノベーション概算見積書', canvas.width / 2, drawY + 30);
      drawY += 50 + SECTION_GAP;

      const imagesStartX = (canvas.width - imagesWidth) / 2;
      ctx.font = `bold 18px ${FONT_FAMILY}`;
      ctx.fillStyle = '#374151';
      ctx.fillText('リフォーム前', imagesStartX + beforeW / 2, drawY);
      ctx.fillText('リフォーム後', imagesStartX + beforeW + IMG_GAP + afterW / 2, drawY);
      drawY += 30;
      ctx.drawImage(beforeImg, imagesStartX, drawY, beforeW, beforeH);
      ctx.drawImage(afterImg, imagesStartX + beforeW + IMG_GAP, drawY, afterW, afterH);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(imagesStartX, drawY, beforeW, beforeH);
      ctx.strokeRect(imagesStartX + beforeW + IMG_GAP, drawY, afterW, afterH);
      drawY += imagesMaxHeight + SECTION_GAP;

      ctx.beginPath();
      ctx.moveTo(PADDING, drawY);
      ctx.lineTo(canvas.width - PADDING, drawY);
      ctx.strokeStyle = '#d1d5db';
      ctx.stroke();
      drawY += SECTION_GAP;
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111827';
      ctx.font = `bold 24px ${FONT_FAMILY}`;
      ctx.fillText('■ 概算費用', PADDING, drawY);
      drawY += 40;
      
      ctx.fillStyle = '#059669';
      ctx.font = `bold 48px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText(editedQuotation.total_cost_range, canvas.width / 2, drawY);
      ctx.font = `18px ${FONT_FAMILY}`;
      ctx.fillStyle = '#374151';
      ctx.fillText('合計（税別）', canvas.width / 2, drawY + 30);
      drawY += 60 + SECTION_GAP;
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111827';
      ctx.font = `bold 20px ${FONT_FAMILY}`;
      ctx.fillText('■ 工事項目', PADDING, drawY);
      drawY += 35;
      
      ctx.font = `16px ${FONT_FAMILY}`;
      editedQuotation.construction_items.forEach(item => {
        ctx.fillStyle = '#374151';
        ctx.fillText(item.name, PADDING + 20, drawY);
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'right';
        ctx.fillText(item.cost_range, canvas.width - PADDING, drawY);
        ctx.textAlign = 'left';
        drawY += 35;
        ctx.beginPath();
        ctx.moveTo(PADDING + 20, drawY - 15);
        ctx.lineTo(canvas.width - PADDING, drawY - 15);
        ctx.strokeStyle = '#e5e7eb';
        ctx.stroke();
      });
      drawY += SECTION_GAP - 15;

      ctx.fillStyle = '#111827';
      ctx.font = `bold 16px ${FONT_FAMILY}`;
      ctx.fillText('■ 備考', PADDING, drawY);
      drawY += 30;
      
      ctx.fillStyle = '#4b5563';
      ctx.font = `14px ${FONT_FAMILY}`;
      wrapText(editedQuotation.notes, PADDING, drawY, canvas.width - PADDING * 2, 22, true);

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      link.download = `renovation_quotation_${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

    } catch (err) {
      console.error("Failed to create or download quotation image:", err);
      setError("見積もり画像の生成に失敗しました。");
    }
  };

  const renovationLoadingMessages = [
    "AIがリノベーションプランを考案中...",
    "最適なマテリアルを選んでいます...",
    "空間をデザインしています...",
    "もうすぐ完成です...",
  ];

  const sketchLoadingMessages = [
    "スケッチを3Dモデルに変換中...",
    "リアリティのある質感をレンダリングしています...",
    "照明と陰影を調整しています...",
    "まもなく完成です、お待ちください...",
  ];

  const exteriorPaintingLoadingMessages = [
    "外壁の色と素材を分析中...",
    "建物の構造を保ちながら外壁をペイントしています...",
    "テクスチャと質感を調整しています...",
    "仕上げ作業中、もうすぐ完成です...",
  ];

  const ModeSelector = () => (
    <div className="mb-6 flex justify-center items-center p-1.5 rounded-xl bg-gray-200 gap-2">
      <button
        onClick={() => handleAppModeChange('renovation')}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all w-1/2 justify-center ${appMode === 'renovation' ? 'bg-white text-gray-800 shadow-md' : 'bg-transparent text-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <PaintBrushIcon className="w-5 h-5" />
        リノベーション
      </button>
      <button
        onClick={() => handleAppModeChange('exterior')}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all w-1/2 justify-center ${appMode === 'exterior' ? 'bg-white text-gray-800 shadow-md' : 'bg-transparent text-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <PencilIcon className="w-5 h-5" />
        外観デザイン
      </button>
    </div>
  );

  if (!isAuthenticated) {
    return <PinAuth onAuthSuccess={handleAuthSuccess} verifyPin={verifyPin} />;
  }

  if (isInitialLoading) {
    return <Loader messages={["アプリを起動中..."]} />;
  }

  // Show main menu
  if (selectedApp === 'menu') {
    return <MainMenu onSelectApp={setSelectedApp} />;
  }

  // Show quotation editor
  if (selectedApp === 'quotation') {
    return <QuotationEditorPage onNavigateBack={() => setSelectedApp('menu')} />;
  }

  // Show sales chatbot
  if (selectedApp === 'sales-chatbot') {
    return <SalesChatBot onNavigateBack={() => setSelectedApp('menu')} />;
  }

  // Show email settings
  if (selectedApp === 'email-settings') {
    // Use Firebase project ID as tenant ID
    const tenantId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'default';
    return <TenantEmailSettingsPage onNavigateBack={() => setSelectedApp('menu')} tenantId={tenantId} />;
  }

  if (appView === 'database') {
    return <DatabasePage
            onNavigateBack={() => setAppView('main')}
            categories={categories}
            products={products}
            setCategories={setCategories}
            setProducts={setProducts}
          />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <Header onNavigate={(view) => {
        if (view === 'menu') {
          setSelectedApp('menu');
        } else {
          setAppView(view);
        }
      }} />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {/* Mobile: Image area first, then controls */}
        <div className="lg:hidden">
          {/* Mobile: Mode selector */}
          {originalImage && <ModeSelector />}

          {/* Mobile: Image display area */}
          <div className={`rounded-xl shadow-lg min-h-[400px] flex items-center justify-center p-4 mb-8 transition-colors duration-300 ${!originalImage ? 'bg-white' : isFinetuningMode ? 'bg-indigo-50' : isQuotationMode ? 'bg-emerald-50' : appMode === 'exterior' && exteriorSubMode === 'exterior_painting' ? 'bg-green-50' : appMode === 'exterior' ? 'bg-blue-50' :'bg-white'}`}>
            {isLoading && <Loader messages={
              appMode === 'renovation'
                ? renovationLoadingMessages
                : (exteriorSubMode === 'exterior_painting'
                    ? exteriorPaintingLoadingMessages
                    : sketchLoadingMessages)
            } />}
            {!isLoading && error && !isQuotationMode && (
              <ErrorDisplay error={error} />
            )}
            {!isLoading && !error && !originalImage && (
              <div className="text-center text-gray-500 max-w-3xl mx-auto px-4">
                <p className="text-2xl font-semibold mb-2">AIデザインツールへようこそ</p>
                <p className="mb-6">下のパネルから物件の写真やスケッチをアップロードして開始してください。</p>

                {/* Update History */}
                <div className="mt-8 text-left bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    アップデート情報
                  </h3>
                  <div className="space-y-3">
                    {(showAllUpdates ? UPDATE_HISTORY : UPDATE_HISTORY.slice(0, 5)).map((update, index) => (
                      <div key={index} className="border-l-4 border-blue-400 pl-3">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            {update.date}
                          </span>
                          <h4 className="text-sm font-bold text-blue-900">{update.title}</h4>
                        </div>
                        <p className="text-sm text-blue-800">{update.description}</p>
                      </div>
                    ))}
                  </div>
                  {UPDATE_HISTORY.length > 5 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowAllUpdates(!showAllUpdates)}
                        className="text-sm text-blue-700 hover:text-blue-900 font-medium underline transition-colors"
                      >
                        {showAllUpdates ? '最新の情報のみ表示' : `過去のアップデート情報を見る（${UPDATE_HISTORY.length - 5}件）`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!isLoading && !error && originalImage && !activeGeneratedImage && (
               <div className="w-full max-w-4xl mx-auto relative" style={{ aspectRatio: displayAspectRatio }}>
                <img src={originalImage} alt="アップロードされた画像" className="absolute inset-0 w-full h-full object-contain rounded-lg" />
               </div>
            )}
            {!isLoading && !isFinetuningMode && originalImage && activeGeneratedImage && (
              <div className="w-full">
                {appMode === 'renovation' ? (
                  <>
                    { isQuotationMode ? (
                      <div className="w-full max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                          <div className="w-full md:w-1/2">
                            <h3 className="text-center text-lg font-bold mb-2 text-emerald-800">リフォーム前</h3>
                            <div className="relative w-full shadow-md rounded-lg overflow-hidden bg-white" style={{ aspectRatio: displayAspectRatio }}>
                              <img src={originalImage} alt="リフォーム前" className="absolute inset-0 w-full h-full object-contain" />
                            </div>
                          </div>
                          <div className="w-full md:w-1/2">
                            <h3 className="text-center text-lg font-bold mb-2 text-emerald-800">リフォーム後</h3>
                            <div className="relative w-full shadow-md rounded-lg overflow-hidden bg-white" style={{ aspectRatio: displayAspectRatio }}>
                              <img src={activeGeneratedImage.src} alt="リフォーム後" className="absolute inset-0 w-full h-full object-contain" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ComparisonView before={originalImage} after={activeGeneratedImage.src} aspectRatio={displayAspectRatio} />
                    )}
                    {activeGeneratedImage.description && !isQuotationMode && (
                      <div className="mt-6 max-w-4xl mx-auto bg-indigo-50 p-5 rounded-xl border border-indigo-200">
                        <h4 className="text-md font-bold text-gray-800 mb-2 flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-indigo-500" />
                          AIによるリノベーションコンセプト
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{activeGeneratedImage.description}</p>
                      </div>
                    )}
                  </>
                ) : ( // exterior mode view
                  <div className="w-full max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="w-full md:w-1/2">
                        <h3 className="text-center text-lg font-bold mb-2 text-blue-800">{exteriorSubMode === 'sketch2arch' ? 'オリジナルスケッチ' : '変更前'}</h3>
                        <div className="relative w-full shadow-md rounded-lg overflow-hidden bg-white" style={{ aspectRatio: displayAspectRatio }}>
                          <img src={originalImage} alt="変更前" className="absolute inset-0 w-full h-full object-contain" />
                        </div>
                      </div>
                      <div className="w-full md:w-1/2">
                        <h3 className="text-center text-lg font-bold mb-2 text-blue-800">{exteriorSubMode === 'sketch2arch' ? '生成されたパース' : '変更後'}</h3>
                        <div className="relative w-full shadow-md rounded-lg overflow-hidden bg-white" style={{ aspectRatio: displayAspectRatio }}>
                          <img src={activeGeneratedImage.src} alt="変更後" className="absolute inset-0 w-full h-full object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
             {!isLoading && isFinetuningMode && !isQuotationMode && activeGeneratedImage && (
              <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center">
                 <div className="w-full relative" style={{ aspectRatio: displayAspectRatio }}>
                  <img src={activeGeneratedImage.src} alt="微調整中の画像" className="absolute inset-0 w-full h-full object-contain rounded-lg" />
                 </div>
                 <p className="mt-4 text-sm font-semibold text-gray-600">この画像の微調整を行います</p>
              </div>
            )}
          </div>

          {/* Mobile: Action buttons */}
          {!isLoading && activeGeneratedImage && (
             <div className="text-center mb-6 flex justify-center items-center gap-4 flex-wrap">
              {!isFinetuningMode && !isQuotationMode && (
                <>
                  <button
                    onClick={() => setIsFinetuningMode(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    この画像を微調整する
                  </button>
                  {(appMode === 'renovation' || (appMode === 'exterior' && exteriorSubMode === 'exterior_painting')) && (
                    <button
                      onClick={handleEnterQuotationMode}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <CalculatorIcon className="w-5 h-5" />
                      この画像で見積もりに移る
                    </button>
                  )}
                </>
              )}
              {isFinetuningMode && !isQuotationMode && (appMode === 'renovation' || (appMode === 'exterior' && exteriorSubMode === 'exterior_painting')) && (
                <button
                  onClick={handleEnterQuotationMode}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <CalculatorIcon className="w-5 h-5" />
                  この画像で見積もりに移る
                </button>
              )}
               <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                ダウンロード
              </button>
            </div>
          )}

          {/* Mobile: History panel */}
          {originalImage && (
            <HistoryPanel
              originalImage={originalImage}
              generatedImages={generatedImages}
              activeImage={activeGeneratedImage?.src ?? null}
              onSelect={handleHistorySelect}
              originalImageLabel={appMode === 'exterior' && exteriorSubMode === 'sketch2arch' ? 'スケッチ' : 'オリジナル'}
            />
          )}

          {/* Mobile: Control panel */}
          <div className={`rounded-xl shadow-lg p-6 space-y-6 mt-8 transition-colors duration-300 ${!originalImage ? 'bg-white' : isFinetuningMode ? 'bg-indigo-50' : isQuotationMode ? 'bg-emerald-50' : appMode === 'exterior' && exteriorSubMode === 'exterior_painting' ? 'bg-green-50' : appMode === 'exterior' ? 'bg-blue-50' : 'bg-white'}`}>
            {isQuotationMode ? (
              <QuotationPanel
                appMode={appMode}
                onGetQuote={handleGetQuote}
                onGetExteriorQuote={handleGetExteriorQuote}
                onExit={handleExitQuotationRequest}
                isQuoting={isQuoting}
                quotationResult={quotationResult}
                error={error}
                onDownloadImage={handleDownloadQuotationImage}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-700">1. 画像をアップロード</h2>
                  {originalImage && (
                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 transition-colors font-semibold"
                      title="全てクリアにする"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>クリア</span>
                    </button>
                  )}
                </div>
                <ImageUploader onImageUpload={handleImageUpload} image={originalImage} onError={handleUploadError} />
                {originalImage && (
                  <>
                    <h2 className="text-xl font-bold text-gray-700 pt-4">2. モードを選択</h2>
                    <RenovationPanel
                      appMode={appMode}
                      exteriorSubMode={exteriorSubMode}
                      onExteriorSubModeChange={setExteriorSubMode}
                      onGenerate={handleGenerate}
                      isDisabled={isLoading}
                      activeImage={isFinetuningMode && activeGeneratedImage ? activeGeneratedImage.src : originalImage}
                      mimeType={mimeType}
                      isFinetuningMode={isFinetuningMode}
                      onExitFinetuning={() => setIsFinetuningMode(false)}
                      categories={categories}
                      products={products}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 lg:items-start">
          <div className="lg:col-span-4 xl:col-span-3">
            <div className={`rounded-xl shadow-lg p-6 space-y-6 sticky top-8 transition-colors duration-300 ${!originalImage ? 'bg-white' : isFinetuningMode ? 'bg-indigo-50' : isQuotationMode ? 'bg-emerald-50' : appMode === 'exterior' && exteriorSubMode === 'exterior_painting' ? 'bg-green-50' : appMode === 'exterior' ? 'bg-blue-50' : 'bg-white'}`}>
              {isQuotationMode ? (
                <QuotationPanel
                  appMode={appMode}
                  onGetQuote={handleGetQuote}
                  onGetExteriorQuote={handleGetExteriorQuote}
                  onExit={handleExitQuotationRequest}
                  isQuoting={isQuoting}
                  quotationResult={quotationResult}
                  error={error}
                  onDownloadImage={handleDownloadQuotationImage}
                />
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-700">1. 画像をアップロード</h2>
                    {originalImage && (
                      <button
                        onClick={handleClearAll}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 transition-colors font-semibold"
                        title="全てクリアにする"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>クリア</span>
                      </button>
                    )}
                  </div>
                  <ImageUploader onImageUpload={handleImageUpload} image={originalImage} onError={handleUploadError} />
                  {originalImage && (
                    <>
                      <h2 className="text-xl font-bold text-gray-700 pt-4">2. モードを選択</h2>
                      <RenovationPanel
                        appMode={appMode}
                        exteriorSubMode={exteriorSubMode}
                        onExteriorSubModeChange={setExteriorSubMode}
                        onGenerate={handleGenerate}
                        isDisabled={isLoading}
                        activeImage={isFinetuningMode && activeGeneratedImage ? activeGeneratedImage.src : originalImage}
                        mimeType={mimeType}
                        isFinetuningMode={isFinetuningMode}
                        onExitFinetuning={() => setIsFinetuningMode(false)}
                        categories={categories}
                        products={products}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="lg:col-span-8 xl:col-span-9 sticky top-8 self-start">
           {originalImage && <ModeSelector />}
            <div className={`rounded-xl shadow-lg flex items-center justify-center p-4 transition-colors duration-300 ${originalImage ? 'max-h-[calc(100vh-6rem)]' : 'min-h-[400px]'} overflow-y-auto ${!originalImage ? 'bg-white' : isFinetuningMode ? 'bg-indigo-50' : isQuotationMode ? 'bg-emerald-50' : appMode === 'exterior' && exteriorSubMode === 'exterior_painting' ? 'bg-green-50' : appMode === 'exterior' ? 'bg-blue-50' :'bg-white'}`}>
            {isLoading && <Loader messages={
              appMode === 'renovation'
                ? renovationLoadingMessages
                : (exteriorSubMode === 'exterior_painting'
                    ? exteriorPaintingLoadingMessages
                    : sketchLoadingMessages)
            } />}
            {!isLoading && error && !isQuotationMode && (
              <ErrorDisplay error={error} />
            )}
            {!isLoading && !error && !originalImage && (
              <div className="text-center text-gray-500 max-w-3xl mx-auto">
                <p className="text-2xl font-semibold mb-2">AIデザインツールへようこそ</p>
                <p className="mb-6">左のパネルから物件の写真やスケッチをアップロードして開始してください。</p>

                {/* Update History */}
                <div className="mt-8 text-left bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    アップデート情報
                  </h3>
                  <div className="space-y-3">
                    {(showAllUpdates ? UPDATE_HISTORY : UPDATE_HISTORY.slice(0, 5)).map((update, index) => (
                      <div key={index} className="border-l-4 border-blue-400 pl-3">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            {update.date}
                          </span>
                          <h4 className="text-sm font-bold text-blue-900">{update.title}</h4>
                        </div>
                        <p className="text-sm text-blue-800">{update.description}</p>
                      </div>
                    ))}
                  </div>
                  {UPDATE_HISTORY.length > 5 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowAllUpdates(!showAllUpdates)}
                        className="text-sm text-blue-700 hover:text-blue-900 font-medium underline transition-colors"
                      >
                        {showAllUpdates ? '最新の情報のみ表示' : `過去のアップデート情報を見る（${UPDATE_HISTORY.length - 5}件）`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!isLoading && !error && originalImage && !activeGeneratedImage && (
               <div className="w-full max-w-4xl mx-auto relative" style={{ aspectRatio: displayAspectRatio }}>
                <img src={originalImage} alt="アップロードされた画像" className="absolute inset-0 w-full h-full object-contain rounded-lg" />
               </div>
            )}
            {!isLoading && !isFinetuningMode && originalImage && activeGeneratedImage && (
              <div className="w-full">
                {appMode === 'renovation' ? (
                  <>
                    { isQuotationMode ? (
                      <div className="w-full max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                          <div className="w-full md:w-1/2">
                            <h3 className="text-center text-lg font-bold mb-2 text-emerald-800">リフォーム前</h3>
                            <div className="relative w-full shadow-md rounded-lg overflow-hidden bg-white" style={{ aspectRatio: displayAspectRatio }}>
                              <img src={originalImage} alt="リフォーム前" className="absolute inset-0 w-full h-full object-contain" />
                            </div>
                          </div>
                          <div className="w-full md:w-1/2">
                            <h3 className="text-center text-lg font-bold mb-2 text-emerald-800">リフォーム後</h3>
                            <div className="relative w-full shadow-md rounded-lg overflow-hidden bg-white" style={{ aspectRatio: displayAspectRatio }}>
                              <img src={activeGeneratedImage.src} alt="リフォーム後" className="absolute inset-0 w-full h-full object-contain" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ComparisonView before={originalImage} after={activeGeneratedImage.src} aspectRatio={displayAspectRatio} />
                    )}
                    {activeGeneratedImage.description && !isQuotationMode && (
                      <div className="mt-6 max-w-4xl mx-auto bg-indigo-50 p-5 rounded-xl border border-indigo-200">
                        <h4 className="text-md font-bold text-gray-800 mb-2 flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-indigo-500" />
                          AIによるリノベーションコンセプト
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{activeGeneratedImage.description}</p>
                      </div>
                    )}
                  </>
                ) : ( // exterior mode view
                  <div className="w-full max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="w-full md:w-1/2">
                        <h3 className="text-center text-lg font-bold mb-2 text-blue-800">{exteriorSubMode === 'sketch2arch' ? 'オリジナルスケッチ' : '変更前'}</h3>
                        <div className="relative w-full shadow-md rounded-lg overflow-hidden bg-white" style={{ aspectRatio: displayAspectRatio }}>
                          <img src={originalImage} alt="変更前" className="absolute inset-0 w-full h-full object-contain" />
                        </div>
                      </div>
                      <div className="w-full md:w-1/2">
                        <h3 className="text-center text-lg font-bold mb-2 text-blue-800">{exteriorSubMode === 'sketch2arch' ? '生成されたパース' : '変更後'}</h3>
                        <div className="relative w-full shadow-md rounded-lg overflow-hidden bg-white" style={{ aspectRatio: displayAspectRatio }}>
                          <img src={activeGeneratedImage.src} alt="変更後" className="absolute inset-0 w-full h-full object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
             {!isLoading && isFinetuningMode && !isQuotationMode && activeGeneratedImage && (
              <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center">
                 <div className="w-full relative" style={{ aspectRatio: displayAspectRatio }}>
                  <img src={activeGeneratedImage.src} alt="微調整中の画像" className="absolute inset-0 w-full h-full object-contain rounded-lg" />
                 </div>
                 <p className="mt-4 text-sm font-semibold text-gray-600">この画像の微調整を行います</p>
              </div>
            )}
          </div>

          {/* Desktop: Action buttons */}
          {!isLoading && activeGeneratedImage && (
             <div className="text-center mt-6 flex justify-center items-center gap-4 flex-wrap">
              {!isFinetuningMode && !isQuotationMode && (
                <>
                  <button
                    onClick={() => setIsFinetuningMode(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    この画像を微調整する
                  </button>
                  {(appMode === 'renovation' || (appMode === 'exterior' && exteriorSubMode === 'exterior_painting')) && (
                    <button
                      onClick={handleEnterQuotationMode}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <CalculatorIcon className="w-5 h-5" />
                      この画像で見積もりに移る
                    </button>
                  )}
                </>
              )}
              {isFinetuningMode && !isQuotationMode && (appMode === 'renovation' || (appMode === 'exterior' && exteriorSubMode === 'exterior_painting')) && (
                <button
                  onClick={handleEnterQuotationMode}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <CalculatorIcon className="w-5 h-5" />
                  この画像で見積もりに移る
                </button>
              )}
               <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                ダウンロード
              </button>
            </div>
          )}

          {/* Desktop: History panel */}
          {originalImage && (
            <HistoryPanel
              originalImage={originalImage}
              generatedImages={generatedImages}
              activeImage={activeGeneratedImage?.src ?? null}
              onSelect={handleHistorySelect}
              originalImageLabel={appMode === 'exterior' && exteriorSubMode === 'sketch2arch' ? 'スケッチ' : 'オリジナル'}
            />
          )}
          </div>
        </div>
      </main>

      {modalInfo && (
        <ConfirmationModal
          isOpen={!!modalInfo}
          title={modalInfo.title}
          message={modalInfo.message}
          confirmText={modalInfo.confirmText}
          cancelText={modalInfo.cancelText}
          onConfirm={modalInfo.onConfirm}
          onCancel={modalInfo.onCancel || (() => setModalInfo(null))}
          confirmButtonColor={modalInfo.confirmButtonColor}
          hideCancelButton={modalInfo.hideCancelButton}
        />
      )}
    </div>
  );
};

export default App;