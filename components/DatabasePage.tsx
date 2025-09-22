import React, { useState, useRef, useId } from 'react';
import type { RegisteredProduct, ProductCategory } from '../types';
import { UploadIcon, TrashIcon, ArrowUturnLeftIcon, PlusCircleIcon, CubeIcon } from './Icon';
import { db, storage } from '../services/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface DatabasePageProps {
  onNavigateBack: () => void;
  categories: ProductCategory[];
  products: RegisteredProduct[];
  setCategories: React.Dispatch<React.SetStateAction<ProductCategory[]>>;
  setProducts: React.Dispatch<React.SetStateAction<RegisteredProduct[]>>;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === '') return;
    try {
      const docRef = await addDoc(collection(db, 'categories'), { name: newCategoryName.trim() });
      const newCategory: ProductCategory = { id: docRef.id, name: newCategoryName.trim() };
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
    } catch (e) {
      console.error("Error adding category: ", e);
    }
  };
  
  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('このカテゴリーを削除しますか？カテゴリー内のすべての商品も削除されます。')) {
      try {
        // Delete all products in the category from Firestore and Storage
        const q = query(collection(db, "products"), where("categoryId", "==", categoryId));
        const querySnapshot = await getDocs(q);
        const deletePromises: Promise<void>[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const product = { id: docSnapshot.id, ...docSnapshot.data() } as RegisteredProduct;
          // Delete image from storage
          const imageRef = ref(storage, product.src);
          deletePromises.push(deleteObject(imageRef));
          // Delete product document from firestore
          deletePromises.push(deleteDoc(doc(db, "products", product.id)));
        });
        await Promise.all(deletePromises);

        // Delete the category
        await deleteDoc(doc(db, "categories", categoryId));

        // Update state
        const newCategories = categories.filter(c => c.id !== categoryId);
        setCategories(newCategories);
        setProducts(products.filter(p => p.categoryId !== categoryId));

        if(activeCategoryId === categoryId) {
          setActiveCategoryId('all');
        }
      } catch (e) {
        console.error("Error deleting category: ", e);
      }
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || activeCategoryId === 'all') return;

    const newUploadedProducts: RegisteredProduct[] = [];
    for (const file of Array.from(files)) {
      try {
        // Create a storage reference
        const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
        
        // Upload file
        await uploadBytes(storageRef, file);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Add product to Firestore
        const docRef = await addDoc(collection(db, 'products'), {
          src: downloadURL,
          categoryId: activeCategoryId,
        });

        newUploadedProducts.push({ id: docRef.id, src: downloadURL, categoryId: activeCategoryId });

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

    try {
      // Delete image from storage
      const imageRef = ref(storage, productToDelete.src);
      await deleteObject(imageRef);

      // Delete product from firestore
      await deleteDoc(doc(db, "products", id));

      // Update state
      const newProducts = products.filter(p => p.id !== id);
      setProducts(newProducts);
    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        console.warn("Image not found in storage, but deleting from Firestore anyway.");
        await deleteDoc(doc(db, "products", id));
        const newProducts = products.filter(p => p.id !== id);
        setProducts(newProducts);
      } else {
        console.error("Error deleting product: ", error);
      }
    }
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