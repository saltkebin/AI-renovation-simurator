import React, { useState, useEffect, useRef, useId } from 'react';
import type { RegisteredProduct, ProductCategory } from '../types';
import { UploadIcon, TrashIcon, ArrowUturnLeftIcon, PlusCircleIcon, CubeIcon } from './Icon';

const processFile = (file: File): Promise<{ src: string }> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Invalid file type'));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ src: reader.result as string });
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

const DatabasePage: React.FC<{ onNavigateBack: () => void }> = ({ onNavigateBack }) => {
  const [products, setProducts] = useState<RegisteredProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [newCategoryName, setNewCategoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('registeredProducts');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
      const storedCategories = localStorage.getItem('productCategories');
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        // デフォルトのカテゴリを作成
        const defaultCategories = [{ id: 'default-wallpaper', name: '壁紙' }, { id: 'default-furniture', name: '家具' }];
        setCategories(defaultCategories);
        localStorage.setItem('productCategories', JSON.stringify(defaultCategories));
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  const saveProducts = (newProducts: RegisteredProduct[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem('registeredProducts', JSON.stringify(newProducts));
    } catch (e) {
      console.error("Failed to save products to localStorage", e);
    }
  };
  
  const saveCategories = (newCategories: ProductCategory[]) => {
    setCategories(newCategories);
    try {
      localStorage.setItem('productCategories', JSON.stringify(newCategories));
    } catch (e) {
      console.error("Failed to save categories to localStorage", e);
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') return;
    const newCategory: ProductCategory = {
      id: `${Date.now()}`,
      name: newCategoryName.trim(),
    };
    saveCategories([...categories, newCategory]);
    setNewCategoryName('');
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('このカテゴリーを削除しますか？カテゴリー内のすべての商品も削除されます。')) {
      const newCategories = categories.filter(c => c.id !== categoryId);
      const newProducts = products.filter(p => p.categoryId !== categoryId);
      saveCategories(newCategories);
      saveProducts(newProducts);
      if(activeCategoryId === categoryId) {
        setActiveCategoryId('all');
      }
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || activeCategoryId === 'all') return;

    const newProducts: RegisteredProduct[] = [...products];
    for (const file of Array.from(files)) {
      try {
        const { src } = await processFile(file);
        newProducts.push({ id: `${Date.now()}-${Math.random()}`, src, categoryId: activeCategoryId });
      } catch (error) {
        console.error("Error processing file:", file.name, error);
      }
    }
    saveProducts(newProducts);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await uploadFiles(event.target.files);
    if (event.target) {
        event.target.value = ''; 
    }
  };

  const handleDeleteProduct = (id: string) => {
    const newProducts = products.filter(p => p.id !== id);
    saveProducts(newProducts);
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    await uploadFiles(event.dataTransfer.files);
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const filteredProducts = products.filter(p => activeCategoryId === 'all' || p.categoryId === activeCategoryId);

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
            {/* Sidebar for categories */}
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
                  {categories.map(category => (
                    <li key={category.id}>
                      <button
                        onClick={() => setActiveCategoryId(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center group ${activeCategoryId === category.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <span className="truncate">{category.name}</span>
                        <TrashIcon onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }} className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity" />
                      </button>
                    </li>
                  ))}
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

            {/* Main content for products */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-700 mb-4">
                    {activeCategoryId === 'all' ? 'すべての商品' : `カテゴリー: ${categories.find(c=>c.id === activeCategoryId)?.name || ''}`}
                    <span className="text-base font-normal ml-2 text-gray-500">({filteredProducts.length}件)</span>
                  </h2>
                  
                  {activeCategoryId !== 'all' ? (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        このカテゴリーに商品画像を追加します。
                      </p>
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
                              {filteredProducts.map(product => (
                                  <div key={product.id} className="relative group border rounded-lg overflow-hidden shadow">
                                      <img src={product.src} alt="登録商品" className="w-full h-32 object-cover" />
                                      <button
                                          onClick={() => handleDeleteProduct(product.id)}
                                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                          aria-label="商品を削除"
                                      >
                                          <TrashIcon className="w-4 h-4" />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
};

export default DatabasePage;