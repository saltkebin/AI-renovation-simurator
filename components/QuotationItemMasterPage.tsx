import React, { useState, useEffect } from 'react';
import type { QuotationItemMaster } from '../types';
import { ArrowLeftIcon, PlusIcon, PencilSquareIcon, TrashIcon, DocumentTextIcon } from './Icon';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface QuotationItemMasterPageProps {
  onNavigateBack: () => void;
  tenantId: string;
}

const QuotationItemMasterPage: React.FC<QuotationItemMasterPageProps> = ({
  onNavigateBack,
  tenantId
}) => {
  const [masters, setMasters] = useState<QuotationItemMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMaster, setEditingMaster] = useState<QuotationItemMaster | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load masters from Firestore
  useEffect(() => {
    loadMasters();
  }, [tenantId]);

  const loadMasters = async () => {
    try {
      const mastersCollection = collection(db, 'quotationItemMasters');
      const q = query(mastersCollection, where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      const mastersList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as QuotationItemMaster))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setMasters(mastersList);
    } catch (error) {
      console.error('Failed to load masters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMaster({
      tenantId,
      category: '',
      description: '',
      defaultUnit: '式',
      defaultUnitPrice: '' as any,
      sortOrder: masters.length,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (master: QuotationItemMaster) => {
    setEditingMaster(master);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingMaster) return;

    // Convert empty defaultUnitPrice to 0 before saving
    const dataToSave = {
      ...editingMaster,
      defaultUnitPrice: editingMaster.defaultUnitPrice === '' ? 0 : editingMaster.defaultUnitPrice,
    };

    try {
      if (dataToSave.id) {
        // Update existing
        const docRef = doc(db, 'quotationItemMasters', dataToSave.id);
        await updateDoc(docRef, {
          category: dataToSave.category,
          description: dataToSave.description,
          defaultUnit: dataToSave.defaultUnit,
          defaultUnitPrice: dataToSave.defaultUnitPrice,
          sortOrder: dataToSave.sortOrder,
        });
      } else {
        // Create new
        await addDoc(collection(db, 'quotationItemMasters'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
        });
      }
      await loadMasters();
      setIsModalOpen(false);
      setEditingMaster(null);
    } catch (error) {
      console.error('Failed to save master:', error);
      alert('項目マスタの保存に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この項目マスタを削除してもよろしいですか？')) return;

    try {
      await deleteDoc(doc(db, 'quotationItemMasters', id));
      await loadMasters();
    } catch (error) {
      console.error('Failed to delete master:', error);
      alert('項目マスタの削除に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">項目マスタを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateBack}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>戻る</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-800">見積項目マスタ管理</h1>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              <div className="flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                <span>新規作成</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-8">
        {masters.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">項目マスタがありません</h2>
            <p className="text-gray-600 mb-6">「新規作成」ボタンからよく使う見積項目を登録してください</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">カテゴリー</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">項目説明</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">単位</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">単価</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {masters.map((master, index) => (
                  <tr
                    key={master.id}
                    onClick={() => handleEdit(master)}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors cursor-pointer`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-800">{master.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{master.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{master.defaultUnit}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-right">¥{master.defaultUnitPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => master.id && handleDelete(master.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {isModalOpen && editingMaster && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingMaster.id ? '項目マスタ編集' : '項目マスタ作成'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">カテゴリー *</label>
                <input
                  type="text"
                  value={editingMaster.category}
                  onChange={(e) => setEditingMaster({ ...editingMaster, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="塗装工事"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">項目説明 *</label>
                <input
                  type="text"
                  value={editingMaster.description}
                  onChange={(e) => setEditingMaster({ ...editingMaster, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="外壁塗装 シリコン系"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">単位 *</label>
                  <input
                    type="text"
                    value={editingMaster.defaultUnit}
                    onChange={(e) => setEditingMaster({ ...editingMaster, defaultUnit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="㎡"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">単価 *</label>
                  <input
                    type="number"
                    value={editingMaster.defaultUnitPrice === '' ? '' : editingMaster.defaultUnitPrice}
                    onChange={(e) => setEditingMaster({ ...editingMaster, defaultUnitPrice: e.target.value === '' ? '' as any : parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="10000"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingMaster(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!editingMaster.category || !editingMaster.description}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationItemMasterPage;
