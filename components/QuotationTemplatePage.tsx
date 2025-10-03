import React, { useState, useEffect } from 'react';
import type { QuotationTemplate, FormalQuotationItem } from '../types';
import { ArrowLeftIcon, PlusIcon, PencilSquareIcon, TrashIcon, DocumentTextIcon, XMarkIcon } from './Icon';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface QuotationTemplatePageProps {
  onNavigateBack: () => void;
  tenantId: string;
}

const QuotationTemplatePage: React.FC<QuotationTemplatePageProps> = ({
  onNavigateBack,
  tenantId
}) => {
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<QuotationTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load templates from Firestore
  useEffect(() => {
    loadTemplates();
  }, [tenantId]);

  const loadTemplates = async () => {
    try {
      const templatesCollection = collection(db, 'quotationTemplates');
      const q = query(templatesCollection, where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      const templatesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuotationTemplate));
      setTemplates(templatesList);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate({
      tenantId,
      name: '',
      description: '',
      items: [],
      defaultNotes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (template: QuotationTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      if (editingTemplate.id) {
        // Update existing
        const docRef = doc(db, 'quotationTemplates', editingTemplate.id);
        await updateDoc(docRef, {
          name: editingTemplate.name,
          description: editingTemplate.description,
          items: editingTemplate.items,
          defaultNotes: editingTemplate.defaultNotes,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new
        await addDoc(collection(db, 'quotationTemplates'), {
          ...editingTemplate,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      await loadTemplates();
      setIsModalOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('テンプレートの保存に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このテンプレートを削除してもよろしいですか？')) return;

    try {
      await deleteDoc(doc(db, 'quotationTemplates', id));
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('テンプレートの削除に失敗しました');
    }
  };

  const addItemToTemplate = () => {
    if (!editingTemplate) return;
    const newItem: FormalQuotationItem = {
      id: Date.now().toString(),
      category: '',
      description: '',
      quantity: 1,
      unit: '式',
      unitPrice: 0,
      amount: 0,
    };
    setEditingTemplate({
      ...editingTemplate,
      items: [...editingTemplate.items, newItem],
    });
  };

  const updateTemplateItem = (index: number, field: keyof FormalQuotationItem, value: any) => {
    if (!editingTemplate) return;
    const updatedItems = [...editingTemplate.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate amount if quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    setEditingTemplate({
      ...editingTemplate,
      items: updatedItems,
    });
  };

  const removeTemplateItem = (index: number) => {
    if (!editingTemplate) return;
    const updatedItems = editingTemplate.items.filter((_, i) => i !== index);
    setEditingTemplate({
      ...editingTemplate,
      items: updatedItems,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">テンプレートを読み込み中...</p>
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
              <h1 className="text-xl font-bold text-gray-800">見積書テンプレート管理</h1>
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
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">テンプレートがありません</h2>
            <p className="text-gray-600 mb-6">「新規作成」ボタンからよく使う見積パターンを登録してください</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleEdit(template)}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-800">{template.name}</h3>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => template.id && handleDelete(template.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                )}
                <div className="text-sm text-gray-500">
                  <p>項目数: {template.items.length}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {isModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingTemplate.id ? 'テンプレート編集' : 'テンプレート作成'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTemplate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">テンプレート名 *</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="外壁塗装標準パッケージ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">説明</label>
                <textarea
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="一般的な外壁塗装工事の標準パッケージ"
                  rows={2}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">見積項目</label>
                  <button
                    onClick={addItemToTemplate}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    + 項目追加
                  </button>
                </div>
                <div className="space-y-2">
                  {editingTemplate.items.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updateTemplateItem(index, 'category', e.target.value)}
                          className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="カテゴリー"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateTemplateItem(index, 'description', e.target.value)}
                          className="col-span-4 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="項目説明"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateTemplateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                          placeholder="数量"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateTemplateItem(index, 'unit', e.target.value)}
                          className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                          placeholder="単位"
                        />
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateTemplateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="col-span-3 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                          placeholder="単価"
                        />
                        <button
                          onClick={() => removeTemplateItem(index)}
                          className="col-span-1 p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <TrashIcon className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">デフォルト備考</label>
                <textarea
                  value={editingTemplate.defaultNotes}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="デフォルトで記載する備考を入力"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTemplate(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!editingTemplate.name}
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

export default QuotationTemplatePage;
