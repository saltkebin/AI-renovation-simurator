import React, { useState, useEffect } from 'react';
import { FormalQuotation, FormalQuotationItem, QuotationStatus, TenantQuotationSettings, QuotationItemMaster, QuotationTemplate, TenantEmailSettings } from '../types';
import {
  ArrowLeftIcon,
  PlusIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  CogIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon
} from './Icon';
import { db, storage, functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp, getDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import QuotationChatBot from './QuotationChatBot';
import EmailPreviewModal, { type EmailData } from './EmailPreviewModal';
import QuotationPreviewModal from './QuotationPreviewModal';
import ConfirmationModal from './ConfirmationModal';
import FeatureTip from './FeatureTip';
import { downloadQuotationPDF, generateQuotationPDFBlob } from '../utils/pdfUtils';
import { generateQuotationEmail } from '../services/geminiService';
import { generateQuotationNumber } from '../utils/quotationNumberUtils';

interface QuotationEditorPageProps {
  onNavigateBack: () => void;
  onNavigateToSettings: () => void;
  onNavigateToItemMasters?: () => void;
  onNavigateToTemplates?: () => void;
  onNavigateToEmailSettings?: () => void;
  tenantId: string;
}

const QuotationEditorPage: React.FC<QuotationEditorPageProps> = ({
  onNavigateBack,
  onNavigateToSettings,
  onNavigateToItemMasters,
  onNavigateToTemplates,
  onNavigateToEmailSettings,
  tenantId
}) => {
  const [quotations, setQuotations] = useState<FormalQuotation[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingQuotation, setEditingQuotation] = useState<FormalQuotation | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load quotations and templates from Firestore
  useEffect(() => {
    loadQuotations();
    loadTemplates();
  }, [tenantId]);

  const loadQuotations = async () => {
    try {
      if (!tenantId) {
        console.log('No tenantId provided');
        setQuotations([]);
        return;
      }
      console.log('Loading quotations for tenantId:', tenantId);
      const quotationsCollection = collection(db, 'quotations');
      const q = query(quotationsCollection, where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      console.log('Found quotations:', snapshot.docs.length);
      const quotationsList = snapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('Quotation data:', { id: doc.id, ...data });
          return { id: doc.id, ...data } as FormalQuotation;
        })
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      console.log('Loaded quotations:', quotationsList);
      setQuotations(quotationsList);
    } catch (error) {
      console.error('Failed to load quotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    if (!tenantId) return;
    try {
      const templatesCollection = collection(db, 'quotationTemplates');
      const q = query(templatesCollection, where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      const templatesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuotationTemplate));
      setTemplates(templatesList);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleCreateNew = () => {
    if (templates.length > 0) {
      setShowTemplateSelector(true);
    } else {
      createNewQuotation();
    }
  };

  const createNewQuotation = (template?: QuotationTemplate) => {
    let items = [];
    let notes = '';
    let subtotal = 0;
    let tax = 0;
    let total = 0;

    if (template) {
      // Use template items
      items = template.items.map(item => ({
        ...item,
        id: Date.now().toString() + Math.random(), // Generate new IDs
      }));
      notes = template.defaultNotes;

      // Calculate totals
      subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      tax = Math.floor(subtotal * 0.1);
      total = subtotal + tax;
    }

    const newQuotation: FormalQuotation = {
      tenantId,
      status: 'draft',
      customerInfo: {
        name: '',
        address: '',
        propertyInfo: '',
      },
      items,
      subtotal,
      tax,
      total,
      notes,
      templateId: template?.id,
    };
    setEditingQuotation(newQuotation);
    setIsEditorOpen(true);
    setShowTemplateSelector(false);
  };

  const handleEdit = (quotation: FormalQuotation) => {
    setEditingQuotation(quotation);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditingQuotation(null);
    setIsEditorOpen(false);
  };

  const handleSave = async (quotation: FormalQuotation) => {
    try {
      console.log('Saving quotation:', quotation);

      if (quotation.id) {
        // Update existing
        const docRef = doc(db, 'quotations', quotation.id);
        await updateDoc(docRef, {
          ...quotation,
          updatedAt: Timestamp.now(),
        } as any);
      } else {
        // Create new - generate quotation number if not exists
        const quotationNumber = quotation.quotationNumber || await generateQuotationNumber(tenantId);
        console.log('Generated quotation number:', quotationNumber);

        await addDoc(collection(db, 'quotations'), {
          ...quotation,
          quotationNumber,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      await loadQuotations();
      handleCloseEditor();
    } catch (error) {
      console.error('Failed to save quotation:', error);
      console.error('Error details:', error);
      alert(`見積書の保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteDoc(doc(db, 'quotations', deleteConfirmId));
      await loadQuotations();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete quotation:', error);
      alert('見積書の削除に失敗しました');
      setDeleteConfirmId(null);
    }
  };

  const handleDuplicate = (quotation: FormalQuotation) => {
    // Create a copy with cleared customer info and reset status
    const duplicatedQuotation: FormalQuotation = {
      tenantId,
      status: 'draft',
      customerInfo: {
        name: '',
        email: '',
        address: '',
        propertyInfo: quotation.customerInfo.propertyInfo, // Keep property info as reference
      },
      items: quotation.items.map(item => ({
        ...item,
        id: Date.now().toString() + Math.random(), // Generate new IDs
      })),
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      total: quotation.total,
      notes: quotation.notes,
      // Don't copy: id, quotationNumber, createdAt, updatedAt, validUntil
    };
    setEditingQuotation(duplicatedQuotation);
    setIsEditorOpen(true);
  };

  const getStatusLabel = (status: QuotationStatus) => {
    switch (status) {
      case 'draft': return '下書き';
      case 'confirmed': return '確定';
      case 'sent': return '送信済み';
    }
  };

  const getStatusColor = (status: QuotationStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">見積書を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (isEditorOpen && editingQuotation) {
    return (
      <QuotationEditor
        quotation={editingQuotation}
        onSave={handleSave}
        onCancel={handleCloseEditor}
        tenantId={tenantId}
        onNavigateToEmailSettings={onNavigateToEmailSettings}
        loadQuotations={loadQuotations}
      />
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
              <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
              <h1 className="text-xl font-bold text-gray-800">見積書管理</h1>
              <FeatureTip tip="テンプレート機能を使えば、頻繁に使う見積書パターンを保存して再利用できます。項目マスタでよく使う工事項目を登録すると、見積書作成が更に効率化されます。" />
            </div>
            <div className="flex items-center gap-3">
              {onNavigateToTemplates && (
                <button
                  onClick={onNavigateToTemplates}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    <span>テンプレート</span>
                  </div>
                </button>
              )}
              {onNavigateToItemMasters && (
                <button
                  onClick={onNavigateToItemMasters}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>項目マスタ</span>
                  </div>
                </button>
              )}
              <button
                onClick={onNavigateToSettings}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CogIcon className="w-4 h-4" />
                  <span>テナント設定</span>
                </div>
              </button>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
              >
                <div className="flex items-center gap-2">
                  <PlusIcon className="w-5 h-5" />
                  <span>新規作成</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-8">
        {quotations.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">見積書がありません</h2>
            <p className="text-gray-600 mb-6">「新規作成」ボタンから見積書を作成してください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotations.map((quotation) => (
              <div
                key={quotation.id}
                onClick={() => handleEdit(quotation)}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        {quotation.customerInfo.name || '（顧客名未設定）'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quotation.status)}`}>
                        {getStatusLabel(quotation.status)}
                      </span>
                      {quotation.quotationNumber && (
                        <span className="text-sm text-gray-500">見積No: {quotation.quotationNumber}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{quotation.customerInfo.propertyInfo || '物件情報なし'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>合計: ¥{quotation.total.toLocaleString()}</span>
                      {quotation.createdAt && (
                        <span>作成日: {new Date(quotation.createdAt).toLocaleDateString('ja-JP')}</span>
                      )}
                      {quotation.validUntil && (
                        <span>有効期限: {new Date(quotation.validUntil).toLocaleDateString('ja-JP')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDuplicate(quotation)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="複製"
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => quotation.id && handleDeleteClick(quotation.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">テンプレートを選択</h2>
            <p className="text-sm text-gray-600 mb-6">テンプレートから作成するか、白紙から作成するかを選択してください</p>

            <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto mb-6">
              {/* Blank quotation option */}
              <button
                onClick={() => createNewQuotation()}
                className="border-2 border-gray-300 rounded-xl p-6 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-2">白紙から作成</h3>
                <p className="text-sm text-gray-600">項目なしの空の見積書を作成します</p>
              </button>

              {/* Template options */}
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => createNewQuotation(template)}
                  className="border-2 border-gray-300 rounded-xl p-6 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  )}
                  <p className="text-xs text-gray-500">項目数: {template.items.length}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmId !== null}
        title="見積書を削除"
        message="この見積書を削除してもよろしいですか？"
        confirmText="削除"
        cancelText="キャンセル"
        confirmButtonColor="red"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};

// Quotation Editor Component
interface QuotationEditorProps {
  quotation: FormalQuotation;
  onSave: (quotation: FormalQuotation) => void;
  onCancel: () => void;
  tenantId: string;
  onNavigateToEmailSettings?: () => void;
  loadQuotations: () => void;
}

const QuotationEditor: React.FC<QuotationEditorProps> = ({ quotation, onSave, onCancel, tenantId, onNavigateToEmailSettings, loadQuotations }) => {
  const [formData, setFormData] = useState<FormalQuotation>(quotation);
  const [tenantSettings, setTenantSettings] = useState<TenantQuotationSettings | null>(null);
  const [emailSettings, setEmailSettings] = useState<TenantEmailSettings | null>(null);
  const [itemMasters, setItemMasters] = useState<QuotationItemMaster[]>([]);
  const [showChatBot, setShowChatBot] = useState(true);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // Load tenant settings, email settings, and item masters
  useEffect(() => {
    const loadData = async () => {
      if (!tenantId) return;
      try {
        // Load tenant settings
        const settingsDocRef = doc(db, 'tenantQuotationSettings', tenantId);
        const settingsDocSnap = await getDoc(settingsDocRef);
        if (settingsDocSnap.exists()) {
          setTenantSettings({ ...settingsDocSnap.data(), id: settingsDocSnap.id } as TenantQuotationSettings);
        }

        // Load email settings
        const emailSettingsCollection = collection(db, 'tenantEmailSettings');
        const emailQuery = query(emailSettingsCollection, where('tenantId', '==', tenantId));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          setEmailSettings({ id: emailSnapshot.docs[0].id, ...emailSnapshot.docs[0].data() } as TenantEmailSettings);
        }

        // Load item masters
        const mastersCollection = collection(db, 'quotationItemMasters');
        const q = query(mastersCollection, where('tenantId', '==', tenantId));
        const mastersSnapshot = await getDocs(q);
        const mastersList = mastersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as QuotationItemMaster))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setItemMasters(mastersList);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, [tenantId]);

  const addItem = () => {
    const newItem: FormalQuotationItem = {
      id: Date.now().toString(),
      category: '',
      description: '',
      quantity: 1,
      unit: '式',
      unitPrice: '' as any,
      amount: 0,
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const addItemFromMaster = (master: QuotationItemMaster) => {
    const newItem: FormalQuotationItem = {
      id: Date.now().toString(),
      category: master.category,
      description: master.description,
      quantity: 1,
      unit: master.defaultUnit,
      unitPrice: master.defaultUnitPrice,
      amount: master.defaultUnitPrice,
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
    recalculateTotals([...formData.items, newItem]);
  };

  const updateItem = (index: number, field: keyof FormalQuotationItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = updatedItems[index].quantity || 0;
      const unitPrice = updatedItems[index].unitPrice === '' ? 0 : (updatedItems[index].unitPrice || 0);
      updatedItems[index].amount = quantity * unitPrice;
    }

    setFormData({ ...formData, items: updatedItems });
    recalculateTotals(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
    recalculateTotals(updatedItems);
  };

  const recalculateTotals = (items: FormalQuotationItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = Math.floor(subtotal * 0.1); // 10% tax
    const total = subtotal + tax;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert empty unitPrice to 0 before saving
    const dataToSave = {
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice === '' ? 0 : item.unitPrice,
        quantity: item.quantity || 0,
      })),
    };

    onSave(dataToSave);
  };

  const handleApplySuggestion = (suggestion: any) => {
    // Handle AI suggestions (can be extended later)
    console.log('Applying suggestion:', suggestion);
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadQuotationPDF(formData, tenantSettings || undefined);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('PDFの生成に失敗しました');
    }
  };

  const handleSendEmail = async () => {
    if (!formData.customerInfo.email) {
      alert('顧客のメールアドレスが登録されていません。顧客情報を編集してメールアドレスを追加してください。');
      return;
    }

    setIsGeneratingEmail(true);

    try {
      // Generate PDF and upload to Firebase Storage
      const pdfBlob = await generateQuotationPDFBlob(formData, tenantSettings || undefined);
      const timestamp = Date.now();
      const pdfRef = ref(storage, `quotations/pdf_${formData.id || timestamp}.pdf`);
      await uploadBytes(pdfRef, pdfBlob);
      const uploadedPdfUrl = await getDownloadURL(pdfRef);
      setPdfUrl(uploadedPdfUrl);

      // Generate email content using Gemini
      const companyName = tenantSettings?.companyInfo.name || '当社';
      const emailContent = await generateQuotationEmail(formData, companyName);

      // Set email data and open modal
      setEmailData({
        to: formData.customerInfo.email,
        subject: emailContent.subject,
        body: emailContent.body,
      });
      setIsEmailModalOpen(true);

    } catch (error) {
      console.error('Failed to prepare email:', error);
      alert('メールの準備に失敗しました');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const executeSendEmail = async (emailData: EmailData) => {
    try {
      const sendEmailFunction = httpsCallable(functions, 'sendQuotationEmail');
      await sendEmailFunction({
        tenantId: tenantId,
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        attachmentUrl: pdfUrl,
        quotationId: formData.id,
      });

      alert('メールを送信しました');
      setIsEmailModalOpen(false);
      // Reload quotations to show updated status
      loadQuotations();
      onCancel(); // Close the editor view

    } catch (error: any) {
      console.error('Failed to send email:', error);
      alert(`メールの送信に失敗しました: ${error.message}`);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>戻る</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-800">
                {formData.id ? '見積書編集' : '見積書作成'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <button
                  onClick={() => setShowChatBot(!showChatBot)}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-semibold"
                >
                  {showChatBot ? 'AIを非表示' : 'AIアシスタント'}
                </button>
                {!showChatBot && <FeatureTip tip="見積書作成アシスタントが、新しい項目の提案、備考欄の文章推敲、高額項目の代替案提示などをサポートします。" />}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className={`grid gap-6 ${showChatBot ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {/* Left side: Quotation Form */}
          <div className={showChatBot ? 'lg:col-span-2' : 'lg:col-span-1'}>
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">顧客情報</h2>
              <FeatureTip tip="メールアドレスを登録しておくと、プレビュー画面から見積書を直接メール送信できます。メール認証設定が必要です。" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">顧客名 *</label>
                <input
                  type="text"
                  value={formData.customerInfo.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    customerInfo: { ...formData.customerInfo, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">物件情報</label>
                <input
                  type="text"
                  value={formData.customerInfo.propertyInfo}
                  onChange={(e) => setFormData({
                    ...formData,
                    customerInfo: { ...formData.customerInfo, propertyInfo: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">住所</label>
                <input
                  type="text"
                  value={formData.customerInfo.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    customerInfo: { ...formData.customerInfo, address: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">メールアドレス</label>
                <input
                  type="email"
                  value={formData.customerInfo.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    customerInfo: { ...formData.customerInfo, email: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="example@mail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">電話番号</label>
                <input
                  type="tel"
                  value={formData.customerInfo.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    customerInfo: { ...formData.customerInfo, phone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="03-1234-5678"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h2 className="text-lg font-bold text-gray-800">見積項目</h2>
                <FeatureTip tip="「マスタから選択」で項目マスターに登録した内容を素早く追加できます。単価の上下ボタンは1万円単位で調整できます。" />
              </div>
              <div className="flex items-center gap-2">
                {itemMasters.length > 0 && (
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const master = itemMasters.find(m => m.id === e.target.value);
                        if (master) {
                          addItemFromMaster(master);
                          e.target.value = ''; // Reset select
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-semibold cursor-pointer bg-white hover:bg-gray-50"
                    >
                      <option value="">マスタから選択</option>
                      {itemMasters.map(master => (
                        <option key={master.id} value={master.id}>
                          {master.category} - {master.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" />
                    <span>項目追加</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">カテゴリー</label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updateItem(index, 'category', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="塗装工事"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">項目説明</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="外壁塗装"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">数量</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">単位</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="㎡"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">単価</label>
                      <input
                        type="number"
                        value={item.unitPrice === '' ? '' : item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value === '' ? '' as any : parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                        min="0"
                        step="10000"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-10 md:col-span-2 flex items-end">
                      <div className="w-full">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">金額</label>
                        <div className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm font-semibold text-gray-700">
                          ¥{item.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="削除"
                      >
                        <TrashIcon className="w-5 h-5 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Notes */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">備考</label>
                  <FeatureTip tip="備考欄には工事内容の詳細、支払い条件、特記事項などを記載できます。AIアシスタントに文章の推敲を依頼することもできます。" />
                </div>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="見積書の備考を入力してください"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">小計</span>
                  <span className="text-lg font-bold text-gray-800">¥{formData.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">消費税 (10%)</span>
                  <span className="text-lg font-bold text-gray-800">¥{formData.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 bg-emerald-50 rounded-lg p-4">
                  <span className="text-base font-bold text-emerald-900">合計金額</span>
                  <span className="text-2xl font-bold text-emerald-700">¥{formData.total.toLocaleString()}</span>
                </div>
                {/* Save Button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-md"
                  >
                    保存
                  </button>
                </div>
                {/* Preview Button */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg"
                  >
                    <EyeIcon className="w-6 h-6" />
                    <span>プレビューに進む</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Right side: AI ChatBot */}
      {showChatBot && (
        <div className="lg:col-span-1">
          <div className="sticky top-20 h-[calc(100vh-7rem)]">
            <QuotationChatBot
              tenantSettings={tenantSettings}
              currentQuotation={formData}
              onApplySuggestion={handleApplySuggestion}
            />
          </div>
        </div>
      )}

      {/* Quotation Preview Modal */}
      <QuotationPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        quotation={formData}
        tenantSettings={tenantSettings || undefined}
        emailSettings={emailSettings}
        onSendEmail={handleSendEmail}
        onNavigateToEmailSettings={onNavigateToEmailSettings}
      />

      {/* Email Preview Modal */}
      {isEmailModalOpen && emailData && (
        <EmailPreviewModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          onSend={executeSendEmail}
          initialData={emailData}
          pdfUrl={pdfUrl || undefined}
        />
      )}
        </div>
      </main>
    </div>
  );
};

export default QuotationEditorPage;
