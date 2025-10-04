import React, { useState, useCallback, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useLocalStorage } from './hooks/useLocalStorage';
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
import TenantSettingsPage from './components/TenantSettingsPage';
import QuotationItemMasterPage from './components/QuotationItemMasterPage';
import QuotationTemplatePage from './components/QuotationTemplatePage';
import UserGuidePage from './components/UserGuidePage';
import TutorialPage from './components/TutorialPage';
import TutorialStep from './components/TutorialStep';
import type { CustomerInfo } from './components/CustomerInfoModal';
import { generateRenovationImage, generateQuotation, generateArchFromSketch, generateRenovationWithProducts, generateExteriorPaintingQuotation } from './services/geminiService';
import type { RenovationMode, RenovationStyle, GeneratedImage, QuotationResult, RegisteredProduct, AppMode, ProductCategory, ExteriorSubMode } from './types';
import { RENOVATION_PROMPTS, OMAKASE_PROMPT, UPDATE_HISTORY, HELP_TEXTS, TUTORIAL_RENOVATION_STEPS, TUTORIAL_SAMPLE_IMAGES } from './constants';
import { SparklesIcon, ArrowDownTrayIcon, CalculatorIcon, PaintBrushIcon, PencilIcon, TrashIcon } from './components/Icon';
import FeatureTip from './components/FeatureTip';
import HelpTooltip from './components/HelpTooltip';
import { db, storage, verifyPin } from './services/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

type AppView = 'main' | 'database';
type SelectedApp = 'menu' | 'renovation' | 'quotation' | 'email-settings' | 'sales-chatbot' | 'tenant-settings' | 'quotation-item-masters' | 'quotation-templates' | 'user-guide' | 'tutorial';

interface ModalInfo {
  title: string;
  message: string | React.ReactNode;
  confirmText: string;
  onConfirm: () => void;
  cancelText?: string;
  onCancel?: () => void;
  confirmButtonColor?: 'red' | 'indigo';
  hideCancelButton?: boolean;
  nextAction?: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<SelectedApp>('menu');

  // Tutorial states
  const [tutorialMode, setTutorialMode] = useState<boolean>(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState<number>(0);
  const [tutorialSliderUsed, setTutorialSliderUsed] = useState<boolean>(false);
  const [tutorialHistoryViewed, setTutorialHistoryViewed] = useState<Set<string>>(new Set());
  const [tutorialMinimalistSelected, setTutorialMinimalistSelected] = useState<boolean>(false);
  const [tutorialFurnitureTabClicked, setTutorialFurnitureTabClicked] = useState<boolean>(false);
  const [tutorialFurnitureInputValid, setTutorialFurnitureInputValid] = useState<boolean>(false);
  const [tutorialFurnitureImageGenerated, setTutorialFurnitureImageGenerated] = useState<boolean>(false);
  const [tutorialPersonTabClicked, setTutorialPersonTabClicked] = useState<boolean>(false);
  const [tutorialPersonInputValid, setTutorialPersonInputValid] = useState<boolean>(false);
  const [tutorialPersonImageGenerated, setTutorialPersonImageGenerated] = useState<boolean>(false);
  const [tutorialProductsTabClicked, setTutorialProductsTabClicked] = useState<boolean>(false);
  const [tutorialProductsImageGenerated, setTutorialProductsImageGenerated] = useState<boolean>(false);
  const [tutorialStep11HistorySelected, setTutorialStep11HistorySelected] = useState<boolean>(false);
  const [tutorialStep11FinetuneStarted, setTutorialStep11FinetuneStarted] = useState<boolean>(false);
  const [tutorialStep11TabClicked, setTutorialStep11TabClicked] = useState<boolean>(false);
  const [tutorialStep11ProductSelected, setTutorialStep11ProductSelected] = useState<boolean>(false);
  const [tutorialStep11InputValid, setTutorialStep11InputValid] = useState<boolean>(false);
  const [tutorialStep11ImageGenerated, setTutorialStep11ImageGenerated] = useState<boolean>(false);
  const [tutorialStep12DownloadClicked, setTutorialStep12DownloadClicked] = useState<boolean>(false);

  // 永続化する状態（ページリロード時も保持）
  const [originalImage, setOriginalImage] = useLocalStorage<string | null>('airenovation-originalImage', null);
  const [generatedImages, setGeneratedImages] = useLocalStorage<GeneratedImage[]>('airenovation-generatedImages', []);
  const [activeGeneratedImage, setActiveGeneratedImage] = useLocalStorage<GeneratedImage | null>('airenovation-activeGeneratedImage', null);
  const [appMode, setAppMode] = useLocalStorage<AppMode>('airenovation-appMode', 'renovation');
  const [exteriorSubMode, setExteriorSubMode] = useLocalStorage<ExteriorSubMode>('airenovation-exteriorSubMode', 'sketch2arch');
  const [mimeType, setMimeType] = useLocalStorage<string>('airenovation-mimeType', '');
  const [displayAspectRatio, setDisplayAspectRatio] = useLocalStorage<string>('airenovation-displayAspectRatio', 'auto');
  const [originalImageAspectRatio, setOriginalImageAspectRatio] = useLocalStorage<string>('airenovation-originalImageAspectRatio', '4:3');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true); // For initial data load
  const [error, setError] = useState<string | null>(null);
  const [isFinetuningMode, setIsFinetuningMode] = useState<boolean>(false);
  const [isQuotationMode, setIsQuotationMode] = useState<boolean>(false);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [quotationResult, setQuotationResult] = useState<QuotationResult | null>(null);
  const [appView, setAppView] = useState<AppView>('main');
  const [showAllUpdates, setShowAllUpdates] = useState<boolean>(false);
  const [modalInfo, setModalInfo] = useState<ModalInfo | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<RegisteredProduct[]>([]);
  const [tenantId] = useState<string>('airenovation2'); // テナントID

  // ページロード時に状態が復元されたことを通知
  useEffect(() => {
    if (originalImage && generatedImages.length > 0) {
      toast.success('前回の作業を復元しました', { duration: 2000 });
    }
  }, []); // 初回レンダリング時のみ実行

  // Reset tutorial state when leaving tutorial
  useEffect(() => {
    if (selectedApp !== 'tutorial' && tutorialMode) {
      setTutorialMode(false);
      setTutorialStepIndex(0);
      setTutorialSliderUsed(false);
      setTutorialHistoryViewed(new Set());
      setTutorialMinimalistSelected(false);
      setTutorialFurnitureTabClicked(false);
      setTutorialFurnitureInputValid(false);
      setTutorialFurnitureImageGenerated(false);
      setTutorialPersonTabClicked(false);
      setTutorialPersonInputValid(false);
      setTutorialPersonImageGenerated(false);
      setTutorialProductsTabClicked(false);
      setTutorialProductsImageGenerated(false);
      setTutorialStep11HistorySelected(false);
      setTutorialStep11FinetuneStarted(false);
      setTutorialStep11TabClicked(false);
      setTutorialStep11ProductSelected(false);
      setTutorialStep11InputValid(false);
      setTutorialStep11ImageGenerated(false);
      resetState();
    }
  }, [selectedApp, tutorialMode]);

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
        const errorMessage = "商品データベースの読み込みに失敗しました。ページをリロードして再度お試しください。";
        setError(errorMessage);
        toast.error(errorMessage);
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
    setMimeType('');
    setDisplayAspectRatio('auto');
    setOriginalImageAspectRatio('4:3');
    setError(null);
    setIsFinetuningMode(false);
    setIsQuotationMode(false);
    setQuotationResult(null);
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
  }, [originalImage, setGeneratedImages, setActiveGeneratedImage, setDisplayAspectRatio, setAppMode]);

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
        nextAction: '現在の生成履歴がクリアされ、新しいモードで最初から画像生成を開始します。',
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

  // Tutorial handlers
  const handleStartTutorial = () => {
    resetState();
    setTutorialMode(true);
    setTutorialStepIndex(0);
    setSelectedApp('tutorial');
    setAppMode('renovation');
  };

  const handleTutorialNext = () => {
    if (tutorialStepIndex < TUTORIAL_RENOVATION_STEPS.length - 1) {
      setTutorialStepIndex(tutorialStepIndex + 1);
      setTutorialSliderUsed(false); // Reset for next step

      // Step 10に移行する時、Step 9のフラグをリセット
      if (tutorialStepIndex === 8) {
        setTutorialProductsTabClicked(false);
        setTutorialProductsImageGenerated(false);
      }

      // Step 11に移行する時、微調整モードと選択画像をリセット
      if (tutorialStepIndex === 9) {
        setIsFinetuningMode(false);
        setActiveGeneratedImage(null);
      }
    } else {
      handleExitTutorial();
    }
  };

  const handleTutorialPrev = () => {
    if (tutorialStepIndex > 0) {
      setTutorialStepIndex(tutorialStepIndex - 1);
      setTutorialSliderUsed(false); // Reset for previous step
    }
  };

  const handleExitTutorial = () => {
    setTutorialMode(false);
    setTutorialStepIndex(0);
    setTutorialSliderUsed(false);
    setTutorialHistoryViewed(new Set());
    setTutorialMinimalistSelected(false);
    setTutorialFurnitureTabClicked(false);
    setTutorialFurnitureInputValid(false);
    setTutorialFurnitureImageGenerated(false);
    setTutorialPersonTabClicked(false);
    setTutorialPersonInputValid(false);
    setTutorialPersonImageGenerated(false);
    setTutorialProductsTabClicked(false);
    setTutorialProductsImageGenerated(false);
    setTutorialStep11HistorySelected(false);
    setTutorialStep11FinetuneStarted(false);
    setTutorialStep11TabClicked(false);
    setTutorialStep11ProductSelected(false);
    setTutorialStep11InputValid(false);
    setTutorialStep11ImageGenerated(false);
    setTutorialStep12DownloadClicked(false);
    setSelectedApp('menu');
    resetState();
  };

  const handleSkipTutorial = () => {
    handleExitTutorial();
  };

  const handleTutorialHistoryClick = (imageUrl: string, imageIndex: number) => {
    if (!tutorialMode) return;

    if (tutorialStepIndex === 5) {
      setTutorialHistoryViewed(prev => new Set([...prev, imageUrl]));

      // Check if minimalist image was selected (first generated image, index 0)
      if (imageIndex === 0) {
        setTutorialMinimalistSelected(true);
      } else {
        setTutorialMinimalistSelected(false);
      }
    } else if (tutorialStepIndex === 10) {
      // Step 11: Check by description field
      const selectedImage = generatedImages[imageIndex];
      if (selectedImage && selectedImage.description === 'tutorial-minimalist') {
        setTutorialStep11HistorySelected(true);
      }
    }
  };

  const handleTutorialFurnitureTabClick = () => {
    if (!tutorialMode || tutorialStepIndex !== 7) return;
    setTutorialFurnitureTabClicked(true);
  };

  const handleTutorialFurnitureInputChange = (text: string) => {
    if (!tutorialMode || tutorialStepIndex !== 7) return;

    // Check if text matches the required input
    if (text === '中央にラグを置いて') {
      setTutorialFurnitureInputValid(true);
    } else {
      setTutorialFurnitureInputValid(false);
    }
  };

  const handleTutorialPersonTabClick = () => {
    if (!tutorialMode || tutorialStepIndex !== 8) return;
    setTutorialPersonTabClicked(true);
  };

  const handleTutorialPersonInputChange = (text: string) => {
    if (!tutorialMode || tutorialStepIndex !== 8) return;

    // Check if text matches the required input
    if (text === '子供が寝転がっている') {
      setTutorialPersonInputValid(true);
    } else {
      setTutorialPersonInputValid(false);
    }
  };

  const handleTutorialProductsTabClick = () => {
    if (!tutorialMode || tutorialStepIndex !== 9) return;
    setTutorialProductsTabClicked(true);
  };

  const handleTutorialStep11TabClick = () => {
    if (!tutorialMode || tutorialStepIndex !== 10) return;
    setTutorialStep11TabClicked(true);
  };

  const handleTutorialStep11ProductSelect = (productId: string) => {
    if (!tutorialMode || tutorialStepIndex !== 10) return;
    if (productId === 'tutorial-sofa-1') {
      setTutorialStep11ProductSelected(true);
    }
  };

  const handleTutorialStep11InputChange = (text: string) => {
    if (!tutorialMode || tutorialStepIndex !== 10) return;
    if (text === 'このソファを奥の壁に置いて') {
      setTutorialStep11InputValid(true);
    } else {
      setTutorialStep11InputValid(false);
    }
  };

  const handleUseSampleImage = async () => {
    if (!tutorialMode) return;

    try {
      // Fetch sample image
      const response = await fetch(TUTORIAL_SAMPLE_IMAGES.renovation.before);
      const blob = await response.blob();
      const file = new File([blob], 'sample-room.png', { type: 'image/png' });

      // Process the file as if uploaded
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setOriginalImage(imageUrl);
        setMimeType('image/png');

        const img = new Image();
        img.onload = () => {
          const aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
          const aspectRatioForPrompt = `${img.naturalWidth}:${img.naturalHeight}`;
          setDisplayAspectRatio(aspectRatio);
          setOriginalImageAspectRatio(aspectRatioForPrompt);
          toast.success('サンプル画像を読み込みました');

          // Auto-advance to next step
          if (tutorialStepIndex === 0) {
            setTimeout(() => setTutorialStepIndex(1), 500);
          }
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to load sample image:', error);
      toast.error('サンプル画像の読み込みに失敗しました');
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
          toast.success('画像をアップロードしました');
        };
        img.src = imageUrl;
      };
      reader.onerror = () => {
        const errorMessage = '画像の読み込みに失敗しました。';
        setError(errorMessage);
        toast.error(errorMessage);
      };
      reader.readAsDataURL(file);
    };

    if (originalImage) {
      setModalInfo({
        title: '画像を再アップロード',
        message: '新しい画像をアップロードすると、現在の画像と生成履歴がすべてクリアされます。よろしいですか？',
        confirmText: 'はい、クリアして続行',
        confirmButtonColor: 'red',
        nextAction: '現在の画像と生成履歴がすべて削除され、新しい画像でリノベーションを開始します。',
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
    console.log('handleClearAll called');
    setModalInfo({
      title: '全てクリアにする',
      message: 'これまでに生成した画像がすべて消えますがよろしいですか？',
      confirmText: 'クリアする',
      confirmButtonColor: 'red',
      nextAction: 'アップロードした画像、生成した全ての画像、見積もりデータがリセットされ、最初の状態に戻ります。',
      onConfirm: () => {
        console.log('Clearing all data...');
        resetState();
        setModalInfo(null);
        toast.success('すべてクリアしました');
      },
      cancelText: 'キャンセル',
      onCancel: () => setModalInfo(null),
    });
  };

  // Use ref to access latest tutorial state without adding to dependencies
  const tutorialModeRef = React.useRef(tutorialMode);
  const tutorialStepIndexRef = React.useRef(tutorialStepIndex);

  React.useEffect(() => {
    tutorialModeRef.current = tutorialMode;
    tutorialStepIndexRef.current = tutorialStepIndex;
  }, [tutorialMode, tutorialStepIndex]);

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
      // Tutorial mode: Use mock data instead of API
      if (tutorialModeRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

        // Determine which sample image to use based on style or step
        let sampleImageUrl;
        let tutorialImageId = '';
        if (tutorialStepIndexRef.current === 7) {
          // Step 8: Furniture modification - use rug image
          sampleImageUrl = TUTORIAL_SAMPLE_IMAGES.renovation.minimalistWithRug;
          tutorialImageId = 'tutorial-minimalist-rug';
        } else if (tutorialStepIndexRef.current === 8) {
          // Step 9: Person modification - use rug + child image
          sampleImageUrl = TUTORIAL_SAMPLE_IMAGES.renovation.minimalistWithRugAndChild;
          tutorialImageId = 'tutorial-minimalist-rug-child';
        } else if (tutorialStepIndexRef.current === 9) {
          // Step 10: Partial modification - use playroom image
          sampleImageUrl = TUTORIAL_SAMPLE_IMAGES.renovation.minimalistPlayroom;
          tutorialImageId = 'tutorial-minimalist-playroom';
        } else if (tutorialStepIndexRef.current === 10) {
          // Step 11: Products modification - use sofa image
          sampleImageUrl = TUTORIAL_SAMPLE_IMAGES.renovation.minimalistWithSofa;
          tutorialImageId = 'tutorial-minimalist-sofa';
        } else {
          if (promptOrStyle === 'minimalist') {
            sampleImageUrl = TUTORIAL_SAMPLE_IMAGES.renovation.minimalist;
            tutorialImageId = 'tutorial-minimalist';
          } else {
            sampleImageUrl = TUTORIAL_SAMPLE_IMAGES.renovation.scandinavian;
            tutorialImageId = 'tutorial-scandinavian';
          }
        }

        const response = await fetch(sampleImageUrl);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          const newImage: GeneratedImage = {
            src: `data:image/png;base64,${base64}`,
            aspectRatio: originalImageAspectRatio,
            description: tutorialImageId,
          };
          setGeneratedImages(prevImages => [newImage, ...prevImages].slice(0, 20));
          setActiveGeneratedImage(newImage);
          toast.success('画像の生成が完了しました');
          setIsLoading(false);

          // Auto-advance to next step
          if (tutorialStepIndexRef.current === 1) {
            setTimeout(() => setTutorialStepIndex(2), 1000);
          } else if (tutorialStepIndexRef.current === 3) {
            setTimeout(() => setTutorialStepIndex(4), 1000);
          } else if (tutorialStepIndexRef.current === 7) {
            // Step 8: Mark furniture image as generated
            setTutorialFurnitureImageGenerated(true);
          } else if (tutorialStepIndexRef.current === 8) {
            // Step 9: Mark person image as generated
            setTutorialPersonImageGenerated(true);
          } else if (tutorialStepIndexRef.current === 9) {
            // Step 10: Mark products image as generated
            setTutorialProductsImageGenerated(true);
          } else if (tutorialStepIndexRef.current === 10) {
            // Step 11: Mark step 11 image as generated
            setTutorialStep11ImageGenerated(true);
          }
        };
        reader.readAsDataURL(blob);
        return;
      }

      // Normal mode: Call actual API
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
        toast.success('画像の生成が完了しました');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '画像の生成に失敗しました: 不明なエラーが発生しました。';
      setError(errorMessage);
      toast.error(errorMessage);
    }
    finally {
      setIsLoading(false);
    }
  }, [originalImage, activeGeneratedImage, mimeType, isFinetuningMode, originalImageAspectRatio, appMode, exteriorSubMode, setGeneratedImages, setActiveGeneratedImage]);

  const handleHistorySelect = (image: GeneratedImage | null) => {
    setActiveGeneratedImage(image);

    if (!isFinetuningMode || !image) {
      setIsFinetuningMode(false);
    }

    setIsQuotationMode(false);
    setQuotationResult(null);
    if (image) {
      setDisplayAspectRatio(image.aspectRatio.replace(':', '/'));

      // Check if Step 11 and minimalist image is selected
      if (tutorialMode && tutorialStepIndex === 10 && image.description === 'tutorial-minimalist') {
        setTutorialStep11HistorySelected(true);
      }
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

    // Step 12: Show tutorial modal
    if (tutorialMode && tutorialStepIndex === 11) {
      setModalInfo({
        title: 'ダウンロード',
        message: '選択した画像がお使いのデバイス(タブレット、PCなど)に保存されます',
        confirmText: 'OK',
        hideCancelButton: true,
        onConfirm: () => {
          setModalInfo(null);
          setTutorialStep12DownloadClicked(true);
        },
      });
      return;
    }

    const link = document.createElement('a');
    link.href = activeGeneratedImage.src;

    const extension = activeGeneratedImage.src.substring("data:image/".length, activeGeneratedImage.src.indexOf(";base64"));

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const modePrefix = appMode === 'renovation' ? 'renovation' : 'sketch';
    link.download = `${modePrefix}_${timestamp}.${extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('画像をダウンロードしました');
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
          const errorMessage = "見積もりには、元の画像と生成された画像の両方が必要です。";
          setError(errorMessage);
          toast.error(errorMessage);
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
          toast.success('見積もりを生成しました');

      } catch (err) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : '見積もりの生成に失敗しました。';
          setError(errorMessage);
          toast.error(errorMessage);
      } finally {
          setIsQuoting(false);
      }
  };

  const handleGetExteriorQuote = async (wallArea: string, paintType: string) => {
      if (!originalImage || !activeGeneratedImage) {
          const errorMessage = "見積もりには、元の画像と生成された画像の両方が必要です。";
          setError(errorMessage);
          toast.error(errorMessage);
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
          toast.success('外壁塗装の見積もりを生成しました');

      } catch (err) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : '見積もりの生成に失敗しました。';
          setError(errorMessage);
          toast.error(errorMessage);
      } finally {
          setIsQuoting(false);
      }
  };

  // Helper function to parse cost range and get max value
  const parseCostRangeMax = (costRange: string): number => {
    // Remove all non-numeric characters except for numbers and periods
    const numbers = costRange.match(/\d+(\.\d+)?/g);
    if (!numbers || numbers.length === 0) return 0;

    // Get the maximum value from the range
    const maxValue = Math.max(...numbers.map(Number));

    // Check if it's in 万円 (10,000 yen units)
    if (costRange.includes('万')) {
      return maxValue * 10000;
    }

    return maxValue;
  };

  const handleSaveAsFormalQuotation = async (quotationResult: QuotationResult, customerInfo: CustomerInfo, originalImageUrl?: string, renovatedImageUrl?: string) => {
    console.log('Saving as formal quotation:', { quotationResult, customerInfo });

    // 保存中のトースト通知
    const toastId = toast.loading('見積もりデータを保存しています...');

    try {
      const timestamp = Date.now();
      let uploadedOriginalImageUrl = '';
      let uploadedRenovatedImageUrl = '';

      // 画像をFirebase Storageにアップロード
      if (originalImageUrl) {
        const originalImageRef = ref(storage, `quotations/${tenantId}/${timestamp}-original.png`);
        await uploadString(originalImageRef, originalImageUrl, 'data_url');
        uploadedOriginalImageUrl = await getDownloadURL(originalImageRef);
        console.log('Original image uploaded:', uploadedOriginalImageUrl);
      }

      if (renovatedImageUrl) {
        const renovatedImageRef = ref(storage, `quotations/${tenantId}/${timestamp}-renovated.png`);
        await uploadString(renovatedImageRef, renovatedImageUrl, 'data_url');
        uploadedRenovatedImageUrl = await getDownloadURL(renovatedImageRef);
        console.log('Renovated image uploaded:', uploadedRenovatedImageUrl);
      }

      // 各項目の金額を計算
      const items = quotationResult.construction_items.map((item, index) => {
        const maxAmount = parseCostRangeMax(item.cost_range);
        return {
          id: `item-${timestamp}-${index}`,
          category: '概算見積もり項目',
          description: item.name,
          quantity: 1,
          unit: '式',
          unitPrice: maxAmount,
          amount: maxAmount,
          costRange: item.cost_range, // 概算の範囲を保存
        };
      });

      // 小計、税、合計を計算
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const tax = Math.round(subtotal * 0.1);
      const total = subtotal + tax;

      // データベースに保存
      const quotationData = {
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email || '',
          phone: customerInfo.phone || '',
          address: customerInfo.address || '',
          propertyInfo: customerInfo.propertyInfo || '',
        },
        items: items,
        notes: quotationResult.notes,
        subtotal: subtotal,
        tax: tax,
        total: total,
        totalCostRange: quotationResult.total_cost_range, // 概算の合計範囲
        quotationNumber: `Q-${timestamp}`,
        createdAt: new Date().toISOString(),
        status: 'draft',
        tenantId: tenantId,
        originalImageUrl: uploadedOriginalImageUrl,
        renovatedImageUrl: uploadedRenovatedImageUrl,
      };

      await addDoc(collection(db, 'quotations'), quotationData);
      console.log('Quotation saved to database');

      toast.success('概算見積もりをデータベースに保存しました', { id: toastId });

      // 保存後に確認モーダルを表示
      setModalInfo({
        title: '保存完了',
        message: (
          <div>
            <p className="mb-2">概算見積もりをデータベースに保存しました。</p>
            <p>本格見積もり作成画面に移動して、詳細な見積書を作成しますか？</p>
          </div>
        ),
        confirmText: '移動する',
        confirmButtonColor: 'indigo',
        onConfirm: () => {
          setSelectedApp('quotation');
          setModalInfo(null);
        },
        cancelText: 'このまま続ける',
        onCancel: () => setModalInfo(null),
      });

    } catch (error) {
      console.error('Error saving quotation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`保存に失敗しました: ${errorMessage}`, { id: toastId });
      setModalInfo({
        title: 'エラー',
        message: (
          <div>
            <p>データベースへの保存に失敗しました。</p>
            <p className="text-sm text-gray-600 mt-2">エラー: {errorMessage}</p>
          </div>
        ),
        confirmText: 'OK',
        onConfirm: () => setModalInfo(null),
        hideCancelButton: true,
      });
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
        <HelpTooltip text={HELP_TEXTS.renovationMode} />
      </button>
      <button
        onClick={() => handleAppModeChange('exterior')}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all w-1/2 justify-center ${appMode === 'exterior' ? 'bg-white text-gray-800 shadow-md' : 'bg-transparent text-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <PencilIcon className="w-5 h-5" />
        外観デザイン
        <HelpTooltip text={HELP_TEXTS.exteriorMode} />
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
    const tenantId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'default';
    return <QuotationEditorPage
      tenantId={tenantId}
      onNavigateBack={() => setSelectedApp('menu')}
      onNavigateToSettings={() => setSelectedApp('tenant-settings')}
      onNavigateToItemMasters={() => setSelectedApp('quotation-item-masters')}
      onNavigateToTemplates={() => setSelectedApp('quotation-templates')}
      onNavigateToEmailSettings={() => setSelectedApp('email-settings')}
    />;
  }

  // Show sales chatbot
  if (selectedApp === 'sales-chatbot') {
    return <SalesChatBot onNavigateBack={() => setSelectedApp('menu')} />;
  }

  // Show email settings
  if (selectedApp === 'email-settings') {
    // Use Firebase project ID as tenant ID
    const tenantId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'default';
    return <TenantEmailSettingsPage onNavigateBack={() => setSelectedApp('quotation')} tenantId={tenantId} />;
  }

  // Show tenant settings
  if (selectedApp === 'tenant-settings') {
    const tenantId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'default';
    return <TenantSettingsPage onNavigateBack={() => setSelectedApp('quotation')} tenantId={tenantId} />;
  }

  // Show quotation item masters
  if (selectedApp === 'quotation-item-masters') {
    const tenantId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'default';
    return <QuotationItemMasterPage onNavigateBack={() => setSelectedApp('quotation')} tenantId={tenantId} />;
  }

  // Show quotation templates
  if (selectedApp === 'quotation-templates') {
    const tenantId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'default';
    return <QuotationTemplatePage onNavigateBack={() => setSelectedApp('quotation')} tenantId={tenantId} />;
  }

  // Show user guide
  if (selectedApp === 'user-guide') {
    const tenantId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'default';
    return <UserGuidePage onNavigateBack={() => setSelectedApp('menu')} onStartTutorial={handleStartTutorial} tenantId={tenantId} />;
  }

  // Show tutorial
  if (selectedApp === 'tutorial') {
    // If tutorial hasn't started yet, show tutorial intro page
    if (!tutorialMode) {
      return <TutorialPage
        onNavigateBack={() => setSelectedApp('menu')}
        onStartTutorial={handleStartTutorial}
      />;
    }
    // If tutorialMode is true, continue to show main UI below with tutorial overlay
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#374151',
            fontSize: '14px',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #d1fae5',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #fee2e2',
            },
            duration: 5000,
          },
        }}
      />
      <Header onNavigate={(view) => {
        if (view === 'menu') {
          // Reset tutorial state when returning to menu
          if (tutorialMode) {
            setTutorialMode(false);
            setTutorialStepIndex(0);
            setTutorialSliderUsed(false);
            setTutorialHistoryViewed(new Set());
            resetState();
          }
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
            {isLoading && <Loader
              messages={
                appMode === 'renovation'
                  ? renovationLoadingMessages
                  : (exteriorSubMode === 'exterior_painting'
                      ? exteriorPaintingLoadingMessages
                      : sketchLoadingMessages)
              }
            />}
            {!isLoading && error && !isQuotationMode && (
              <ErrorDisplay error={error} />
            )}
            {!isLoading && !error && !originalImage && (
              <div className="text-center text-gray-500 max-w-3xl mx-auto px-4 py-12">
                <p className="text-2xl font-semibold mb-2">AIデザインツールへようこそ</p>
                <p className="mb-6">下のコントロールパネルから物件の写真やスケッチをアップロードして開始してください。</p>
              </div>
            )}
            {!isLoading && !error && originalImage && !activeGeneratedImage && (
               <div className="w-full max-w-4xl mx-auto relative" style={{ aspectRatio: displayAspectRatio }}>
                <img src={originalImage} alt="アップロードされた画像" className="absolute inset-0 w-full h-full object-contain rounded-lg" />
               </div>
            )}
            {!isLoading && !isFinetuningMode && originalImage && activeGeneratedImage && !isQuotationMode && (
              <div className="w-full">
                {appMode === 'renovation' ? (
                  <div className={`w-full max-w-4xl mx-auto ${tutorialMode && (tutorialStepIndex === 2 || tutorialStepIndex === 4) ? 'relative z-50' : ''}`} style={{ aspectRatio: displayAspectRatio }}>
                    <ComparisonView
                      before={originalImage}
                      after={activeGeneratedImage.src}
                      {...(tutorialMode && {
                        tutorialMode: true,
                        tutorialStepIndex: tutorialStepIndex,
                        onSliderUsed: () => setTutorialSliderUsed(true),
                      })}
                    />
                  </div>
                ) : (
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
                {activeGeneratedImage.description && appMode === 'renovation' && (
                  <div className="mt-6 max-w-4xl mx-auto bg-indigo-50 p-5 rounded-xl border border-indigo-200">
                    <h4 className="text-md font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-indigo-500" />
                      AIによるリノベーションコンセプト
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{activeGeneratedImage.description}</p>
                  </div>
                )}
              </div>
            )}
            {!isLoading && !isFinetuningMode && originalImage && activeGeneratedImage && isQuotationMode && (
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
             <div className={`text-center mb-6 flex justify-center items-center gap-4 flex-wrap ${tutorialMode && (tutorialStepIndex === 5 || tutorialStepIndex === 11) ? 'pointer-events-none' : ''}`}>
              {!isFinetuningMode && !isQuotationMode && (
                <>
                  <button
                    onClick={() => {
                      setIsFinetuningMode(true);
                      if (tutorialMode && tutorialStepIndex === 10 && tutorialStep11HistorySelected) {
                        setTutorialStep11FinetuneStarted(true);
                      }
                    }}
                    disabled={tutorialMode && tutorialStepIndex === 11}
                    className={`inline-flex items-center gap-2 px-6 py-3 min-h-[48px] text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 touch-manipulation ${
                      tutorialMode && tutorialStepIndex === 11
                        ? 'opacity-50 cursor-not-allowed bg-indigo-600'
                        : tutorialMode && (tutorialStepIndex === 6 || (tutorialStepIndex === 10 && tutorialStep11HistorySelected))
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 ring-4 ring-purple-300 ring-opacity-50 animate-pulse relative z-50'
                        : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                    }`}
                  >
                    <SparklesIcon className="w-5 h-5" />
                    この画像を微調整する
                    <HelpTooltip text={HELP_TEXTS.finetuningMode} />
                  </button>
                  {(appMode === 'renovation' || (appMode === 'exterior' && exteriorSubMode === 'exterior_painting')) && (
                    <button
                      onClick={handleEnterQuotationMode}
                      disabled={tutorialMode && (tutorialStepIndex === 11 || (tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked))}
                      className={`inline-flex items-center gap-2 px-6 py-3 min-h-[48px] font-bold rounded-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 touch-manipulation ${
                        tutorialMode && (tutorialStepIndex === 11 || (tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked))
                          ? 'opacity-50 cursor-not-allowed bg-emerald-600 text-white'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                      }`}
                    >
                      <CalculatorIcon className="w-5 h-5" />
                      この画像で見積もりに移る
                      <HelpTooltip text={HELP_TEXTS.quotationMode} />
                    </button>
                  )}
                </>
              )}
              {isFinetuningMode && !isQuotationMode && (appMode === 'renovation' || (appMode === 'exterior' && exteriorSubMode === 'exterior_painting')) && (
                <button
                  onClick={handleEnterQuotationMode}
                  disabled={tutorialMode && (tutorialStepIndex === 11 || (tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked))}
                  className={`inline-flex items-center gap-2 px-6 py-3 min-h-[48px] font-bold rounded-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 touch-manipulation ${
                    tutorialMode && (tutorialStepIndex === 11 || (tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked))
                      ? 'opacity-50 cursor-not-allowed bg-emerald-600 text-white'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                  }`}
                >
                  <CalculatorIcon className="w-5 h-5" />
                  この画像で見積もりに移る
                </button>
              )}
               <button
                onClick={handleDownload}
                disabled={tutorialMode && tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked}
                className={`inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg border transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  tutorialMode && tutorialStepIndex === 11
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-500 hover:from-purple-600 hover:to-indigo-700 ring-4 ring-purple-300 ring-opacity-50 animate-pulse pointer-events-auto relative z-50'
                    : tutorialMode && tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked
                    ? 'opacity-50 cursor-not-allowed bg-white text-gray-700 border-gray-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                ダウンロード
              </button>
            </div>
          )}

          {/* Step 12 Guide Arrow for Mobile */}
          {tutorialMode && tutorialStepIndex === 11 && !isLoading && activeGeneratedImage && (
            <div className="relative mb-4">
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-bounce pointer-events-none">
                <div className="text-purple-600 font-bold text-base mb-1">↓ ダウンロード ↓</div>
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
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
              {...(tutorialMode && {
                tutorialMode: true,
                tutorialStepIndex: tutorialStepIndex,
                onTutorialHistoryClick: handleTutorialHistoryClick,
              })}
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
                onSaveAsFormalQuotation={handleSaveAsFormalQuotation}
                originalImageUrl={originalImage || undefined}
                renovatedImageUrl={activeGeneratedImage?.src}
                tenantId={tenantId}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-700">1. 画像をアップロード</h2>
                  {originalImage && !tutorialMode && (
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
                <ImageUploader
                  onImageUpload={handleImageUpload}
                  image={originalImage}
                  onError={handleUploadError}
                  {...(tutorialMode && {
                    tutorialMode: true,
                    tutorialStepIndex: tutorialStepIndex,
                    onUseSampleImage: handleUseSampleImage,
                  })}
                />
                {originalImage && (
                  <>
                    <h2 className="text-xl font-bold text-gray-700 pt-4">2. モードを選択</h2>
                    <RenovationPanel
                      appMode={appMode}
                      exteriorSubMode={exteriorSubMode}
                      onExteriorSubModeChange={setExteriorSubMode}
                      onGenerate={handleGenerate}
                      isDisabled={isLoading || (tutorialMode && tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked)}
                      activeImage={isFinetuningMode && activeGeneratedImage ? activeGeneratedImage.src : originalImage}
                      mimeType={mimeType}
                      isFinetuningMode={isFinetuningMode}
                      onExitFinetuning={() => setIsFinetuningMode(false)}
                      categories={categories}
                      products={products}
                      {...(tutorialMode && {
                        tutorialMode: true,
                        tutorialStepIndex: tutorialStepIndex,
                      })}
                    />
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile: Update History */}
          {!originalImage && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                アップデート情報
              </h3>
              <div className="space-y-3">
                {(showAllUpdates ? UPDATE_HISTORY : UPDATE_HISTORY.slice(0, 5)).map((update, index) => (
                  <div key={index} className="border-l-4 border-blue-400 pl-3 pb-2">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        {update.date}
                      </span>
                      <h4 className="text-sm font-bold text-blue-900">{update.title}</h4>
                    </div>
                    <p className="text-sm text-blue-800 mb-2">{update.description}</p>
                    {update.howToUse && (
                      <button
                        onClick={() => {
                          setModalInfo({
                            title: `使い方: ${update.title}`,
                            message: (
                              <div className="text-left whitespace-pre-wrap text-sm text-gray-700">
                                {update.howToUse}
                              </div>
                            ),
                            confirmText: '閉じる',
                            onConfirm: () => setModalInfo(null),
                            hideCancelButton: true,
                          });
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-yellow-300 rounded-md hover:bg-yellow-400 transition-colors shadow-sm"
                      >
                        使い方確認
                      </button>
                    )}
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
          )}
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8" style={{ height: 'calc(100vh - 10rem)' }}>
          <div className={`lg:col-span-4 xl:col-span-3 overflow-y-auto relative ${tutorialMode && (tutorialStepIndex === 0 || tutorialStepIndex === 1 || (tutorialStepIndex >= 7 && tutorialStepIndex <= 10)) ? 'z-50' : ''} ${tutorialMode && ((tutorialStepIndex === 8 && tutorialPersonImageGenerated) || (tutorialStepIndex === 9 && tutorialProductsImageGenerated)) ? 'pointer-events-none opacity-50' : ''}`}>
            {/* Step 4 Guide Arrow */}
            {tutorialMode && tutorialStepIndex === 3 && (
              <div className="absolute top-[280px] left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-bounce">
                <div className="text-purple-600 font-bold text-base mb-1">↓ デザインテイストへ ↓</div>
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className={`rounded-xl shadow-lg p-6 space-y-6 transition-colors duration-300 ${!originalImage ? 'bg-white' : isFinetuningMode ? 'bg-indigo-50' : isQuotationMode ? 'bg-emerald-50' : appMode === 'exterior' && exteriorSubMode === 'exterior_painting' ? 'bg-green-50' : appMode === 'exterior' ? 'bg-blue-50' : 'bg-white'}`}>
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
                  onSaveAsFormalQuotation={handleSaveAsFormalQuotation}
                  originalImageUrl={originalImage || undefined}
                  renovatedImageUrl={activeGeneratedImage?.src}
                  tenantId={tenantId}
                />
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-700">1. 画像をアップロード</h2>
                    {originalImage && !tutorialMode && (
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
                  <ImageUploader
                  onImageUpload={handleImageUpload}
                  image={originalImage}
                  onError={handleUploadError}
                  {...(tutorialMode && {
                    tutorialMode: true,
                    tutorialStepIndex: tutorialStepIndex,
                    onUseSampleImage: handleUseSampleImage,
                  })}
                />
                  {originalImage && (
                    <>
                      <h2 className="text-xl font-bold text-gray-700 pt-4">2. モードを選択</h2>
                      <RenovationPanel
                        appMode={appMode}
                        exteriorSubMode={exteriorSubMode}
                        onExteriorSubModeChange={setExteriorSubMode}
                        onGenerate={handleGenerate}
                        isDisabled={isLoading || (tutorialMode && tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked)}
                        activeImage={isFinetuningMode && activeGeneratedImage ? activeGeneratedImage.src : originalImage}
                        mimeType={mimeType}
                        isFinetuningMode={isFinetuningMode}
                        onExitFinetuning={() => setIsFinetuningMode(false)}
                        categories={categories}
                        products={products}
                        {...(tutorialMode && {
                          tutorialMode: true,
                          tutorialStepIndex: tutorialStepIndex,
                          onTutorialFurnitureTabClick: handleTutorialFurnitureTabClick,
                          tutorialFurnitureTabClicked: tutorialFurnitureTabClicked,
                          onTutorialFurnitureInputChange: handleTutorialFurnitureInputChange,
                          tutorialFurnitureInputValid: tutorialFurnitureInputValid,
                          onTutorialPersonTabClick: handleTutorialPersonTabClick,
                          tutorialPersonTabClicked: tutorialPersonTabClicked,
                          onTutorialPersonInputChange: handleTutorialPersonInputChange,
                          tutorialPersonInputValid: tutorialPersonInputValid,
                          onTutorialProductsTabClick: handleTutorialProductsTabClick,
                          tutorialProductsTabClicked: tutorialProductsTabClicked,
                          onTutorialStep11TabClick: handleTutorialStep11TabClick,
                          tutorialStep11TabClicked: tutorialStep11TabClicked,
                          onTutorialStep11ProductSelect: handleTutorialStep11ProductSelect,
                          tutorialStep11ProductSelected: tutorialStep11ProductSelected,
                          onTutorialStep11InputChange: handleTutorialStep11InputChange,
                          tutorialStep11InputValid: tutorialStep11InputValid,
                        })}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className={`lg:col-span-8 xl:col-span-9 overflow-y-auto relative ${tutorialMode && (tutorialStepIndex === 5 || tutorialStepIndex === 10 || tutorialStepIndex === 11) ? 'z-50' : ''}`}>
            {/* Step 6: Internal overlay to block everything except HistoryPanel */}
            {tutorialMode && tutorialStepIndex === 5 && (
              <div className="absolute inset-0 z-40 pointer-events-auto" />
            )}

            {/* Step 6 Guide Arrow */}
            {tutorialMode && tutorialStepIndex === 5 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center animate-bounce pointer-events-none">
                <div className="text-purple-600 font-bold text-base mb-1">↓ 履歴から選択 ↓</div>
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            {/* Step 11: Internal overlay to block everything except HistoryPanel */}
            {tutorialMode && tutorialStepIndex === 10 && !tutorialStep11HistorySelected && (
              <div className="absolute inset-0 z-40 pointer-events-auto" />
            )}

            {/* Step 11 Guide Arrow */}
            {tutorialMode && tutorialStepIndex === 10 && !tutorialStep11HistorySelected && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center animate-bounce pointer-events-none">
                <div className="text-purple-600 font-bold text-base mb-1">↓ ミニマリスト画像を選択 ↓</div>
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
           {originalImage && <ModeSelector />}
            <div className={`rounded-xl shadow-lg flex items-center justify-center p-4 transition-colors duration-300 ${!originalImage ? 'bg-white' : isFinetuningMode ? 'bg-indigo-50' : isQuotationMode ? 'bg-emerald-50' : appMode === 'exterior' && exteriorSubMode === 'exterior_painting' ? 'bg-green-50' : appMode === 'exterior' ? 'bg-blue-50' :'bg-white'}`}>
            {isLoading && <Loader
              messages={
                appMode === 'renovation'
                  ? renovationLoadingMessages
                  : (exteriorSubMode === 'exterior_painting'
                      ? exteriorPaintingLoadingMessages
                      : sketchLoadingMessages)
              }
            />}
            {!isLoading && error && !isQuotationMode && (
              <ErrorDisplay error={error} />
            )}
            {!isLoading && !error && !originalImage && (
              <div className="text-center text-gray-500 max-w-3xl mx-auto">
                <p className="text-2xl font-semibold mb-2">AIデザインツールへようこそ</p>
                <p className="mb-6">左のパネルから物件の写真やスケッチをアップロードして開始してください。</p>

                {/* Update History - Desktop only */}
                <div className="mt-8 text-left bg-blue-50 border border-blue-200 rounded-lg p-4 hidden lg:block">
                  <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    アップデート情報
                  </h3>
                  <div className="space-y-3">
                    {(showAllUpdates ? UPDATE_HISTORY : UPDATE_HISTORY.slice(0, 5)).map((update, index) => (
                      <div key={index} className="border-l-4 border-blue-400 pl-3 pb-2">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            {update.date}
                          </span>
                          <h4 className="text-sm font-bold text-blue-900">{update.title}</h4>
                        </div>
                        <p className="text-sm text-blue-800 mb-2">{update.description}</p>
                        {update.howToUse && (
                          <button
                            onClick={() => {
                              setModalInfo({
                                title: `使い方: ${update.title}`,
                                message: (
                                  <div className="text-left whitespace-pre-wrap text-sm text-gray-700">
                                    {update.howToUse}
                                  </div>
                                ),
                                confirmText: '閉じる',
                                onConfirm: () => setModalInfo(null),
                                hideCancelButton: true,
                              });
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-yellow-300 rounded-md hover:bg-yellow-400 transition-colors shadow-sm"
                          >
                            使い方確認
                          </button>
                        )}
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
                      <div className={`w-full max-w-4xl mx-auto ${tutorialMode && (tutorialStepIndex === 2 || tutorialStepIndex === 4) ? 'relative z-50' : ''}`} style={{ aspectRatio: displayAspectRatio }}>
                        <ComparisonView
                          before={originalImage}
                          after={activeGeneratedImage.src}
                          {...(tutorialMode && {
                            tutorialMode: true,
                            tutorialStepIndex: tutorialStepIndex,
                            onSliderUsed: () => setTutorialSliderUsed(true),
                          })}
                        />
                      </div>
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
             <div className={`text-center mt-6 flex justify-center items-center gap-4 flex-wrap ${tutorialMode && (tutorialStepIndex === 5 || tutorialStepIndex === 11) ? 'pointer-events-none' : ''}`}>
              {!isFinetuningMode && !isQuotationMode && (
                <>
                  <button
                    onClick={() => {
                      setIsFinetuningMode(true);
                      if (tutorialMode && tutorialStepIndex === 10 && tutorialStep11HistorySelected) {
                        setTutorialStep11FinetuneStarted(true);
                      }
                    }}
                    disabled={tutorialMode && tutorialStepIndex === 11}
                    className={`inline-flex items-center gap-2 px-6 py-3 min-h-[48px] text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 touch-manipulation ${
                      tutorialMode && tutorialStepIndex === 11
                        ? 'opacity-50 cursor-not-allowed bg-indigo-600'
                        : tutorialMode && (tutorialStepIndex === 6 || (tutorialStepIndex === 10 && tutorialStep11HistorySelected))
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 ring-4 ring-purple-300 ring-opacity-50 animate-pulse relative z-50'
                        : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                    }`}
                  >
                    <SparklesIcon className="w-5 h-5" />
                    この画像を微調整する
                    <HelpTooltip text={HELP_TEXTS.finetuningMode} />
                  </button>
                  {(appMode === 'renovation' || (appMode === 'exterior' && exteriorSubMode === 'exterior_painting')) && (
                    <button
                      onClick={handleEnterQuotationMode}
                      disabled={tutorialMode && (tutorialStepIndex === 11 || (tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked))}
                      className={`inline-flex items-center gap-2 px-6 py-3 min-h-[48px] font-bold rounded-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 touch-manipulation ${
                        tutorialMode && (tutorialStepIndex === 11 || (tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked))
                          ? 'opacity-50 cursor-not-allowed bg-emerald-600 text-white'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                      }`}
                    >
                      <CalculatorIcon className="w-5 h-5" />
                      この画像で見積もりに移る
                      <HelpTooltip text={HELP_TEXTS.quotationMode} />
                    </button>
                  )}
                </>
              )}
              {isFinetuningMode && !isQuotationMode && (appMode === 'renovation' || (appMode === 'exterior' && exteriorSubMode === 'exterior_painting')) && (
                <button
                  onClick={handleEnterQuotationMode}
                  disabled={tutorialMode && (tutorialStepIndex === 11 || (tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked))}
                  className={`inline-flex items-center gap-2 px-6 py-3 min-h-[48px] font-bold rounded-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 touch-manipulation ${
                    tutorialMode && (tutorialStepIndex === 11 || (tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked))
                      ? 'opacity-50 cursor-not-allowed bg-emerald-600 text-white'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                  }`}
                >
                  <CalculatorIcon className="w-5 h-5" />
                  この画像で見積もりに移る
                </button>
              )}
               <button
                onClick={handleDownload}
                disabled={tutorialMode && tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked}
                className={`inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg border transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  tutorialMode && tutorialStepIndex === 11
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-500 hover:from-purple-600 hover:to-indigo-700 ring-4 ring-purple-300 ring-opacity-50 animate-pulse pointer-events-auto relative z-50'
                    : tutorialMode && tutorialStepIndex === 10 && tutorialStep11FinetuneStarted && !tutorialStep11TabClicked
                    ? 'opacity-50 cursor-not-allowed bg-white text-gray-700 border-gray-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                ダウンロード
              </button>
            </div>
          )}

          {/* Step 12 Guide Arrow for Desktop */}
          {tutorialMode && tutorialStepIndex === 11 && !isLoading && activeGeneratedImage && (
            <div className="relative mb-4">
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-bounce pointer-events-none">
                <div className="text-purple-600 font-bold text-base mb-1">↓ ダウンロード ↓</div>
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
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
              {...(tutorialMode && {
                tutorialMode: true,
                tutorialStepIndex: tutorialStepIndex,
                onTutorialHistoryClick: handleTutorialHistoryClick,
              })}
            />
          )}
          </div>
        </div>
      </main>
      {modalInfo && (
        <ConfirmationModal
          isOpen={true}
          title={modalInfo.title}
          message={modalInfo.message}
          confirmText={modalInfo.confirmText}
          onConfirm={modalInfo.onConfirm}
          cancelText={modalInfo.cancelText}
          onCancel={modalInfo.onCancel}
          confirmButtonColor={modalInfo.confirmButtonColor}
          hideCancelButton={modalInfo.hideCancelButton}
          nextAction={modalInfo.nextAction}
        />
      )}
      {tutorialMode && (
        <>
          {/* Overlay to block interactions outside tutorial targets */}
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40 pointer-events-auto" />

          <TutorialStep
            step={TUTORIAL_RENOVATION_STEPS[tutorialStepIndex]}
            currentStep={tutorialStepIndex + 1}
            totalSteps={TUTORIAL_RENOVATION_STEPS.length}
            onNext={handleTutorialNext}
            onPrev={handleTutorialPrev}
            onSkip={handleSkipTutorial}
            onExit={handleExitTutorial}
            isFirstStep={tutorialStepIndex === 0}
            isLastStep={tutorialStepIndex === TUTORIAL_RENOVATION_STEPS.length - 1}
            nextButtonDisabled={
              (tutorialStepIndex === 0 && !originalImage) ||
              (tutorialStepIndex === 1) ||
              (tutorialStepIndex === 2 && !tutorialSliderUsed) ||
              (tutorialStepIndex === 3) ||
              (tutorialStepIndex === 4 && !tutorialSliderUsed) ||
              (tutorialStepIndex === 5 && !tutorialMinimalistSelected) ||
              (tutorialStepIndex === 6 && !isFinetuningMode) ||
              (tutorialStepIndex === 7 && !tutorialFurnitureImageGenerated) ||
              (tutorialStepIndex === 8 && !tutorialPersonImageGenerated) ||
              (tutorialStepIndex === 9 && !tutorialProductsImageGenerated) ||
              (tutorialStepIndex === 10 && !tutorialStep11ImageGenerated) ||
              (tutorialStepIndex === 11 && !tutorialStep12DownloadClicked)
            }
          />
        </>
      )}
    </div>
  );
};

export default App;