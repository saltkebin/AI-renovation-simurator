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
import MainMenu from './components/MainMenu';
import TenantSettingsPage from './components/TenantSettingsPage';
import QuotationEditorPage from './components/QuotationEditorPage';
import QuotationItemMasterPage from './components/QuotationItemMasterPage';
import QuotationTemplatePage from './components/QuotationTemplatePage';
import TenantEmailSettingsPage from './components/TenantEmailSettingsPage';
import SalesChatBot from './components/SalesChatBot';
import PinAuth from './components/PinAuth';
import { generateRenovationImage, generateQuotation, generateArchFromSketch, generateRenovationWithProducts, generateExteriorPaintingQuotation } from './services/geminiService';
import type { RenovationMode, RenovationStyle, GeneratedImage, QuotationResult, RegisteredProduct, AppMode, ProductCategory, ExteriorSubMode, FormalQuotation } from './types';
import { RENOVATION_PROMPTS, OMAKASE_PROMPT, UPDATE_HISTORY } from './constants';
import { SparklesIcon, ArrowDownTrayIcon, CalculatorIcon, PaintBrushIcon, PencilIcon, TrashIcon } from './components/Icon';
import { db, storage, verifyPin } from './services/firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { CustomerInfo } from './components/CustomerInfoModal';
import { convertEstimatedToFormalItems } from './utils/quotationUtils';
import { AppProvider, useAppContext } from './context/AppContext';

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

const AppContent: React.FC = () => {
  const { appView, navigate, goBack } = useAppContext();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeGeneratedImage, setActiveGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
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
  const [showAllUpdates, setShowAllUpdates] = useState<boolean>(false);
  const [modalInfo, setModalInfo] = useState<ModalInfo | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<RegisteredProduct[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const categoriesCollection = collection(db, 'categories');
        const categorySnapshot = await getDocs(categoriesCollection);
        if (categorySnapshot.empty) {
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
  }, [isAuthenticated]);

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
  
  // ... (The rest of the functions like handleGenerate, handleImageUpload, etc. remain the same)

  if (!isAuthenticated) {
    return <PinAuth onAuthSuccess={handleAuthSuccess} verifyPin={verifyPin} />;
  }

  if (isInitialLoading && appView !== 'menu') {
    return <Loader messages={["アプリを起動中..."]} />;
  }

  if (appView === 'menu') {
    return <MainMenu onSelectApp={(app) => navigate(app)} />;
  }

  if (appView === 'sales-chatbot') {
    return <SalesChatBot onNavigateBack={() => navigate('menu')} />;
  }

  if (appView === 'tenant-settings' || appView === 'email-settings') {
    return <TenantEmailSettingsPage onNavigateBack={goBack} tenantId="default" />;
  }

  if (appView === 'item-masters') {
    return <QuotationItemMasterPage onNavigateBack={() => navigate('quotation')} tenantId="default" />;
  }

  if (appView === 'templates') {
    return <QuotationTemplatePage onNavigateBack={() => navigate('quotation')} tenantId="default" />;
  }

  if (appView === 'quotation') {
    return (
      <QuotationEditorPage
        onNavigateBack={() => navigate('menu')}
        onNavigateToSettings={() => navigate('tenant-settings', 'quotation')}
        onNavigateToItemMasters={() => navigate('item-masters', 'quotation')}
        onNavigateToTemplates={() => navigate('templates', 'quotation')}
        onNavigateToEmailSettings={() => navigate('email-settings', 'quotation')}
        tenantId="default"
      />
    );
  }

  // ... (The rest of the main view for 'main' appView)
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* This Header might need access to navigate, passed as a prop */}
      <Header onNavigate={(view) => navigate(view)} />
      {/* ... The rest of the JSX for the main renovation view ... */}
    </div>
  );
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
