import React, { useState, useRef, useId } from 'react';
import type { RegisteredProduct, ProductCategory, PaintProduct, PaintTypeId, WallpaperProduct, WallpaperMaterialId, FurnitureProduct, FurnitureCategoryId, FurnitureMaterialId } from '../types';
import { UploadIcon, TrashIcon, ArrowUturnLeftIcon, PlusCircleIcon, CubeIcon } from './Icon';
import { db, storage } from '../services/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ConfirmationModal from './ConfirmationModal'; // Import the modal component
import { PAINT_TYPES, WALLPAPER_MATERIALS, FURNITURE_CATEGORIES, FURNITURE_MATERIALS } from '../constants';

interface DatabasePageProps {
  onNavigateBack: () => void;
  categories: ProductCategory[];
  products: RegisteredProduct[];
  setCategories: React.Dispatch<React.SetStateAction<ProductCategory[]>>;
  setProducts: React.Dispatch<React.SetStateAction<RegisteredProduct[]>>;
}

// Modal info state type (similar to App.tsx)
interface ModalInfo {
  title: string;
  message: string | React.ReactNode;
  confirmText: string;
  onConfirm: () => void;
  cancelText?: string;
  onCancel?: () => void;
  confirmButtonColor?: 'red' | 'indigo';
}

const DatabasePage: React.FC<DatabasePageProps> = ({
  onNavigateBack,
  categories,
  products,
  setCategories,
  setProducts
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [modalInfo, setModalInfo] = useState<ModalInfo | null>(null); // State for the modal
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  // Paint product specific fields
  const [paintManufacturer, setPaintManufacturer] = useState('');
  const [paintProductName, setPaintProductName] = useState('');
  const [paintColorName, setPaintColorName] = useState('');
  const [paintColorCode, setPaintColorCode] = useState('');
  const [paintGrade, setPaintGrade] = useState<PaintTypeId | ''>('');
  const [paintPricePerSqm, setPaintPricePerSqm] = useState('');
  const [paintDurability, setPaintDurability] = useState('');
  const [paintDescription, setPaintDescription] = useState('');

  // Wallpaper product specific fields
  const [wallpaperManufacturer, setWallpaperManufacturer] = useState('');
  const [wallpaperProductName, setWallpaperProductName] = useState('');
  const [wallpaperDesign, setWallpaperDesign] = useState('');
  const [wallpaperColorCode, setWallpaperColorCode] = useState('');
  const [wallpaperMaterial, setWallpaperMaterial] = useState<WallpaperMaterialId | ''>('');
  const [wallpaperSize, setWallpaperSize] = useState('');
  const [wallpaperPricePerRoll, setWallpaperPricePerRoll] = useState('');
  const [wallpaperPricePerSqm, setWallpaperPricePerSqm] = useState('');
  const [wallpaperDescription, setWallpaperDescription] = useState('');

  // Furniture product specific fields
  const [furnitureManufacturer, setFurnitureManufacturer] = useState('');
  const [furnitureProductName, setFurnitureProductName] = useState('');
  const [furnitureCategory, setFurnitureCategory] = useState<FurnitureCategoryId | ''>('');
  const [furnitureMaterial, setFurnitureMaterial] = useState<FurnitureMaterialId | ''>('');
  const [furnitureSize, setFurnitureSize] = useState('');
  const [furnitureColor, setFurnitureColor] = useState('');
  const [furniturePrice, setFurniturePrice] = useState('');
  const [furnitureDescription, setFurnitureDescription] = useState('');

  // State for pending product images
  const [pendingPaintImages, setPendingPaintImages] = useState<File[]>([]);
  const [pendingWallpaperImages, setPendingWallpaperImages] = useState<File[]>([]);
  const [pendingFurnitureImages, setPendingFurnitureImages] = useState<File[]>([]);

  // State for editing products
  const [editingProduct, setEditingProduct] = useState<RegisteredProduct | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategoryType, setEditingCategoryType] = useState<'paint' | 'wallpaper' | 'furniture' | null>(null);

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === '') return;
    try {
      const docRef = await addDoc(collection(db, 'categories'), { name: newCategoryName.trim() });
      const newCategory: ProductCategory = { id: docRef.id, name: newCategoryName.trim() };
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
    } catch (e) {
      console.error("Error adding category: ", e);
      // Optionally, show an error modal
      setModalInfo({
        title: 'エラー',
        message: 'カテゴリーの追加に失敗しました。',
        confirmText: 'OK',
        onConfirm: () => setModalInfo(null)
      });
    }
  };
  
  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const performDelete = async () => {
      try {
        // Delete all products in the category
        const q = query(collection(db, "products"), where("categoryId", "==", categoryId));
        const querySnapshot = await getDocs(q);
        const deletePromises: Promise<void>[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const product = docSnapshot.data() as Omit<RegisteredProduct, 'id'>;
          if (product.src) {
            const imageRef = ref(storage, product.src);
            deletePromises.push(deleteObject(imageRef).catch(err => console.warn("Image delete failed, might not exist:", err)));
          }
          deletePromises.push(deleteDoc(doc(db, "products", docSnapshot.id)));
        });
        await Promise.all(deletePromises);

        // Delete the category itself
        await deleteDoc(doc(db, "categories", categoryId));

        // Update state
        setCategories(categories.filter(c => c.id !== categoryId));
        setProducts(products.filter(p => p.categoryId !== categoryId));

        if(activeCategoryId === categoryId) {
          setActiveCategoryId('all');
        }
      } catch (e) {
        console.error("Error deleting category: ", e);
        setModalInfo({
          title: 'エラー',
          message: 'カテゴリーの削除に失敗しました。',
          confirmText: 'OK',
          onConfirm: () => setModalInfo(null)
        });
      }
    };

    // Set modal info to ask for confirmation
    setModalInfo({
      title: 'カテゴリーの削除',
      message: `カテゴリー「${categoryName}」を削除しますか？カテゴリー内のすべての商品も削除されます。この操作は取り消せません。`,
      confirmText: '削除する',
      confirmButtonColor: 'red',
      onConfirm: () => {
        performDelete();
        setModalInfo(null);
      },
      cancelText: 'キャンセル',
      onCancel: () => setModalInfo(null)
    });
  };

  const resetPaintFields = () => {
    setPaintManufacturer('');
    setPaintProductName('');
    setPaintColorName('');
    setPaintColorCode('');
    setPaintGrade('');
    setPaintPricePerSqm('');
    setPaintDurability('');
    setPaintDescription('');
    setPendingPaintImages([]);
  };

  const resetWallpaperFields = () => {
    setWallpaperManufacturer('');
    setWallpaperProductName('');
    setWallpaperDesign('');
    setWallpaperColorCode('');
    setWallpaperMaterial('');
    setWallpaperSize('');
    setWallpaperPricePerRoll('');
    setWallpaperPricePerSqm('');
    setWallpaperDescription('');
    setPendingWallpaperImages([]);
  };

  const resetFurnitureFields = () => {
    setFurnitureManufacturer('');
    setFurnitureProductName('');
    setFurnitureCategory('');
    setFurnitureMaterial('');
    setFurnitureSize('');
    setFurnitureColor('');
    setFurniturePrice('');
    setFurnitureDescription('');
    setPendingFurnitureImages([]);
  };

  const handlePaintImageSelection = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setPendingPaintImages(fileArray);
  };

  const handleRegisterPaintProducts = async () => {
    if (pendingPaintImages.length === 0) return;

    const newUploadedProducts: RegisteredProduct[] = [];
    for (const file of pendingPaintImages) {
      try {
        const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const productData: any = {
          src: downloadURL,
          categoryId: activeCategoryId,
        };

        // Add paint-specific fields
        if (paintManufacturer) productData.manufacturer = paintManufacturer;
        if (paintProductName) productData.productName = paintProductName;
        if (paintColorName) productData.color = paintColorName;
        if (paintColorCode) productData.colorCode = paintColorCode;
        if (paintGrade) productData.grade = paintGrade;
        if (paintPricePerSqm) productData.pricePerSqm = parseFloat(paintPricePerSqm);
        if (paintDurability) productData.durability = parseInt(paintDurability);
        if (paintDescription) productData.description = paintDescription;

        const docRef = await addDoc(collection(db, 'products'), productData);
        newUploadedProducts.push({ id: docRef.id, ...productData });
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
      }
    }
    setProducts([...products, ...newUploadedProducts]);
    resetPaintFields();
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || activeCategoryId === 'all') return;

    const isPaintCategory = categories.find(c => c.id === activeCategoryId)?.name === '塗料';

    // For paint category, just store the files, don't upload yet
    if (isPaintCategory) {
      handlePaintImageSelection(files);
      return;
    }

    // For non-paint categories, upload immediately as before
    const newUploadedProducts: RegisteredProduct[] = [];
    for (const file of Array.from(files)) {
      try {
        const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const productData: any = {
          src: downloadURL,
          categoryId: activeCategoryId,
        };

        const docRef = await addDoc(collection(db, 'products'), productData);
        newUploadedProducts.push({ id: docRef.id, ...productData });
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
      }
    }
    setProducts([...products, ...newUploadedProducts]);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await uploadFiles(event.target.files);
    if (event.target) {
        event.target.value = ''; 
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) return;

    const performDelete = async () => {
      try {
        const imageRef = ref(storage, productToDelete.src);
        await deleteObject(imageRef);
        await deleteDoc(doc(db, "products", id));
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        if (error.code === 'storage/object-not-found') {
          console.warn("Image not found in storage, but deleting from Firestore anyway.");
          await deleteDoc(doc(db, "products", id));
          setProducts(products.filter(p => p.id !== id));
        } else {
          console.error("Error deleting product: ", error);
          setModalInfo({
            title: 'エラー',
            message: '商品の削除に失敗しました。',
            confirmText: 'OK',
            onConfirm: () => setModalInfo(null)
          });
        }
      }
    };

    // Show confirmation modal
    const categoryName = categories.find(c => c.id === productToDelete.categoryId)?.name || '不明';
    setModalInfo({
      title: '商品の削除',
      message: `この商品を削除しますか？\nカテゴリー: ${categoryName}\n\nこの操作は取り消せません。`,
      confirmText: '削除する',
      confirmButtonColor: 'red',
      onConfirm: () => {
        performDelete();
        setModalInfo(null);
      },
      cancelText: 'キャンセル',
      onCancel: () => setModalInfo(null)
    });
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    await uploadFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handlePaintProductClick = (product: RegisteredProduct) => {
    const isPaint = categories.find(c => c.id === product.categoryId)?.name === '塗料';
    if (!isPaint) return;

    setEditingPaintProduct(product);
    // Load existing data into form
    const paintProduct = product as any;
    setPaintManufacturer(paintProduct.manufacturer || '');
    setPaintProductName(paintProduct.productName || '');
    setPaintColorName(paintProduct.color || '');
    setPaintColorCode(paintProduct.colorCode || '');
    setPaintGrade(paintProduct.grade || '');
    setPaintPricePerSqm(paintProduct.pricePerSqm ? String(paintProduct.pricePerSqm) : '');
    setPaintDurability(paintProduct.durability ? String(paintProduct.durability) : '');
    setPaintDescription(paintProduct.description || '');
    setIsEditModalOpen(true);
  };

  const handleUpdatePaintProduct = async () => {
    if (!editingPaintProduct) return;

    try {
      const productData: any = {
        src: editingPaintProduct.src,
        categoryId: editingPaintProduct.categoryId,
      };

      // Add paint-specific fields
      if (paintManufacturer) productData.manufacturer = paintManufacturer;
      if (paintProductName) productData.productName = paintProductName;
      if (paintColorName) productData.color = paintColorName;
      if (paintColorCode) productData.colorCode = paintColorCode;
      if (paintGrade) productData.grade = paintGrade;
      if (paintPricePerSqm) productData.pricePerSqm = parseFloat(paintPricePerSqm);
      if (paintDurability) productData.durability = parseInt(paintDurability);
      if (paintDescription) productData.description = paintDescription;

      // Update in Firestore
      const productRef = doc(db, 'products', editingPaintProduct.id);
      await updateDoc(productRef, productData);

      // Update local state
      setProducts(products.map(p =>
        p.id === editingPaintProduct.id
          ? { id: p.id, ...productData }
          : p
      ));

      // Close modal and reset
      setIsEditModalOpen(false);
      setEditingPaintProduct(null);
      resetPaintFields();
    } catch (error) {
      console.error("Error updating product:", error);
      setModalInfo({
        title: 'エラー',
        message: '商品情報の更新に失敗しました。',
        confirmText: 'OK',
        onConfirm: () => setModalInfo(null)
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingPaintProduct(null);
    resetPaintFields();
  };

  const filteredProducts = products.filter(p => activeCategoryId === 'all' || p.categoryId === activeCategoryId);

  const isPaintCategory = categories.find(c => c.id === activeCategoryId)?.name === '塗料';

  return (
    <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <h1 className="text-2xl font-bold text-gray-800">商品データベース</h1>
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <ArrowUturnLeftIcon className="w-5 h-5" />
                        <span>シミュレーターに戻る</span>
                    </button>
                </div>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/4 lg:w-1/5">
              <div className="bg-white rounded-xl shadow-lg p-4 sticky top-24">
                <h2 className="text-lg font-bold text-gray-800 mb-3">カテゴリー</h2>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => setActiveCategoryId('all')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeCategoryId === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <CubeIcon className="w-5 h-5" />
                      すべての商品
                    </button>
                  </li>
                  {categories.map(category => {
                    const isDefaultCategory = ['壁紙', '家具', '塗料'].includes(category.name);
                    return (
                      <li key={category.id}>
                        <button
                          onClick={() => setActiveCategoryId(category.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center group ${activeCategoryId === category.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          <span className="truncate">{category.name}</span>
                          {!isDefaultCategory && (
                            <TrashIcon onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id, category.name); }} className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      placeholder="新規カテゴリー名"
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                    <button onClick={handleAddCategory} className="p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">
                      <PlusCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-700 mb-4">
                    {activeCategoryId === 'all' ? 'すべての商品' : `カテゴリー: ${categories.find(c=>c.id === activeCategoryId)?.name || ''}`}
                    <span className="text-base font-normal ml-2 text-gray-500">({filteredProducts.length}件)</span>
                  </h2>
                  
                  {activeCategoryId !== 'all' ? (
                    <>
                      {!isPaintCategory && (
                        <p className="text-sm text-gray-600 mb-4">
                          このカテゴリーに商品画像を追加します。
                        </p>
                      )}

                      {isPaintCategory && pendingPaintImages.length === 0 && (
                        <p className="text-sm text-gray-600 mb-4">
                          塗料の色見本画像を選択してください。詳細情報を入力後、登録できます。
                        </p>
                      )}

                      {isPaintCategory && pendingPaintImages.length > 0 && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-semibold text-blue-800 mb-3">
                            💡 塗料カテゴリー専用の詳細情報
                          </p>
                          <p className="text-xs text-blue-700 mb-4">
                            以下の情報は<strong>オプション</strong>ですが、入力しておくと画像生成や見積もりの精度が向上します。
                          </p>

                          {/* Image Preview */}
                          <div className="mb-4 grid grid-cols-3 gap-2">
                            {pendingPaintImages.map((file, index) => (
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">メーカー名</label>
                              <input
                                type="text"
                                value={paintManufacturer}
                                onChange={(e) => setPaintManufacturer(e.target.value)}
                                placeholder="例: 日本ペイント"
                                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">商品名</label>
                              <input
                                type="text"
                                value={paintProductName}
                                onChange={(e) => setPaintProductName(e.target.value)}
                                placeholder="例: パーフェクトトップ"
                                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">色名</label>
                              <input
                                type="text"
                                value={paintColorName}
                                onChange={(e) => setPaintColorName(e.target.value)}
                                placeholder="例: クリーム"
                                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">カラーコード</label>
                              <input
                                type="text"
                                value={paintColorCode}
                                onChange={(e) => setPaintColorCode(e.target.value)}
                                placeholder="例: #FFF8DC"
                                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">塗料グレード</label>
                              <select
                                value={paintGrade}
                                onChange={(e) => setPaintGrade(e.target.value as PaintTypeId)}
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
                                value={paintPricePerSqm}
                                onChange={(e) => setPaintPricePerSqm(e.target.value)}
                                placeholder="例: 2800"
                                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">耐用年数（年）</label>
                              <input
                                type="number"
                                value={paintDurability}
                                onChange={(e) => setPaintDurability(e.target.value)}
                                placeholder="例: 12"
                                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">商品説明</label>
                              <textarea
                                value={paintDescription}
                                onChange={(e) => setPaintDescription(e.target.value)}
                                placeholder="例: 高耐候性シリコン樹脂塗料"
                                rows={2}
                                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={handleRegisterPaintProducts}
                              className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                            >
                              登録する
                            </button>
                            <button
                              onClick={resetPaintFields}
                              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      )}

                      {(!isPaintCategory || pendingPaintImages.length === 0) && (
                        <label
                          htmlFor={fileInputId}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                              <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">クリックまたはドラッグ＆ドロップで選択</span> (複数可)
                              </p>
                              {isPaintCategory && (
                                <p className="text-xs text-blue-600">
                                  色見本画像を推奨（正確な色情報のため）
                                </p>
                              )}
                          </div>
                          <input
                              id={fileInputId}
                              ref={fileInputRef}
                              type="file"
                              multiple
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
                      商品を追加するには、左のメニューからカテゴリーを選択してください。
                    </div>
                  )}

                  <div className="mt-8">
                      {filteredProducts.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">このカテゴリーに登録されている商品はありません。</p>
                      ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {filteredProducts.map(product => {
                                const isPaint = categories.find(c => c.id === product.categoryId)?.name === '塗料';
                                return (
                                  <div
                                    key={product.id}
                                    className={`relative group border rounded-lg overflow-hidden shadow ${isPaint ? 'cursor-pointer hover:border-indigo-500' : ''}`}
                                    onClick={() => isPaint && handlePaintProductClick(product)}
                                  >
                                      <img src={product.src} alt="登録商品" className="w-full h-32 object-cover" />
                                      <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProduct(product.id);
                                          }}
                                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                          aria-label="商品を削除"
                                      >
                                          <TrashIcon className="w-4 h-4" />
                                      </button>
                                      {isPaint && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 bg-opacity-0 group-hover:bg-opacity-90 text-white text-xs p-1 text-center transition-all opacity-0 group-hover:opacity-100">
                                          クリックして編集
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                          </div>
                      )}
                  </div>
              </div>
            </div>
          </div>
        </main>
        {modalInfo && (
            <ConfirmationModal
              isOpen={!!modalInfo}
              title={modalInfo.title}
              message={modalInfo.message}
              confirmText={modalInfo.confirmText}
              onConfirm={modalInfo.onConfirm}
              onCancel={modalInfo.onCancel || (() => setModalInfo(null))}
              confirmButtonColor={modalInfo.confirmButtonColor}
            />
        )}

        {/* Paint Product Edit Modal */}
        {isEditModalOpen && editingPaintProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
              <div className="sticky top-0 bg-white border-b px-6 py-4">
                <h2 className="text-xl font-bold text-gray-800">塗料商品情報の編集</h2>
              </div>

              <div className="p-6">
                {/* Product Image */}
                <div className="mb-6">
                  <img
                    src={editingPaintProduct.src}
                    alt="商品画像"
                    className="w-full max-w-xs mx-auto h-48 object-cover rounded border border-gray-300"
                  />
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  以下の情報を編集できます。空欄のままにすると情報が削除されます。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">メーカー名</label>
                    <input
                      type="text"
                      value={paintManufacturer}
                      onChange={(e) => setPaintManufacturer(e.target.value)}
                      placeholder="例: 日本ペイント"
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">商品名</label>
                    <input
                      type="text"
                      value={paintProductName}
                      onChange={(e) => setPaintProductName(e.target.value)}
                      placeholder="例: パーフェクトトップ"
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">色名</label>
                    <input
                      type="text"
                      value={paintColorName}
                      onChange={(e) => setPaintColorName(e.target.value)}
                      placeholder="例: クリーム"
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">カラーコード</label>
                    <input
                      type="text"
                      value={paintColorCode}
                      onChange={(e) => setPaintColorCode(e.target.value)}
                      placeholder="例: #FFF8DC"
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">塗料グレード</label>
                    <select
                      value={paintGrade}
                      onChange={(e) => setPaintGrade(e.target.value as PaintTypeId)}
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">選択してください</option>
                      {PAINT_TYPES.filter(pt => pt.id !== 'ai_choice').map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">㎡単価（円）</label>
                    <input
                      type="number"
                      value={paintPricePerSqm}
                      onChange={(e) => setPaintPricePerSqm(e.target.value)}
                      placeholder="例: 2800"
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">耐用年数（年）</label>
                    <input
                      type="number"
                      value={paintDurability}
                      onChange={(e) => setPaintDurability(e.target.value)}
                      placeholder="例: 12"
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">商品説明</label>
                    <textarea
                      value={paintDescription}
                      onChange={(e) => setPaintDescription(e.target.value)}
                      placeholder="例: 高耐候性シリコン樹脂塗料"
                      rows={3}
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex gap-3">
                <button
                  onClick={handleUpdatePaintProduct}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                >
                  更新する
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default DatabasePage;
