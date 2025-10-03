import type React from 'react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowDownTrayIcon, PaperAirplaneIcon } from './Icon';
import type { FormalQuotation, TenantQuotationSettings, TenantEmailSettings } from '../types';
import { downloadQuotationPDF } from '../utils/pdfUtils';

interface QuotationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: FormalQuotation;
  tenantSettings?: TenantQuotationSettings;
  emailSettings?: TenantEmailSettings | null;
  onSendEmail?: () => void;
  onNavigateToEmailSettings?: () => void;
}

const QuotationPreviewModal: React.FC<QuotationPreviewModalProps> = ({
  isOpen,
  onClose,
  quotation: initialQuotation,
  tenantSettings: initialTenantSettings,
  emailSettings,
  onSendEmail,
  onNavigateToEmailSettings
}) => {
  const [editableQuotation, setEditableQuotation] = useState(initialQuotation);
  const [editableTenantSettings, setEditableTenantSettings] = useState(initialTenantSettings);
  const [title, setTitle] = useState('御見積書');
  const [date, setDate] = useState(new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditableQuotation(initialQuotation);
      setEditableTenantSettings(initialTenantSettings);
      setTitle('御見積書');
      setDate(new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }));
    }
  }, [isOpen, initialQuotation, initialTenantSettings]);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await downloadQuotationPDF(editableQuotation, editableTenantSettings);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('PDFの生成に失敗しました');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const updateCustomerInfo = (field: string, value: string) => {
    setEditableQuotation({
      ...editableQuotation,
      customerInfo: {
        ...editableQuotation.customerInfo,
        [field]: value
      }
    });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...editableQuotation.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amount if quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }

    // Recalculate totals
    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;

    setEditableQuotation({
      ...editableQuotation,
      items: newItems,
      subtotal,
      tax,
      total
    });
  };

  const updateNotes = (value: string) => {
    setEditableQuotation({
      ...editableQuotation,
      notes: value
    });
  };

  const updateTenantInfo = (field: keyof typeof editableTenantSettings.companyInfo, value: string) => {
    if (!editableTenantSettings) return;
    setEditableTenantSettings({
      ...editableTenantSettings,
      companyInfo: {
        ...editableTenantSettings.companyInfo,
        [field]: value
      }
    });
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-full items-start justify-center p-4 pt-20">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full transform transition-all">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-800">見積書プレビュー</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Preview Content */}
          <div className="p-8 bg-gray-50">
            {/* PDF-like Preview */}
            <div className="bg-white shadow-lg rounded-lg p-12 max-w-4xl mx-auto" style={{ fontFamily: 'Yu Gothic, Meiryo, sans-serif' }}>
              {/* Title */}
              <div className="text-center mb-8">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-3xl font-bold text-gray-800 mb-4 text-center border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-2 py-1 transition-colors w-full"
                />
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm text-gray-600 text-center border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-2 py-1 transition-colors w-full"
                />
              </div>

              {/* Company Info & Customer Info */}
              <div className="flex justify-between mb-8">
                <div className="flex-1">
                  <div className="mb-2">
                    <label className="text-xs text-gray-500">お客様名</label>
                    <input
                      type="text"
                      value={editableQuotation.customerInfo.name}
                      onChange={(e) => updateCustomerInfo('name', e.target.value)}
                      className="w-full text-lg font-bold border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-2 py-1 transition-colors"
                      placeholder="顧客名"
                    />
                    <span className="text-lg ml-2">様</span>
                  </div>
                  {editableQuotation.customerInfo.address && (
                    <div className="mb-2">
                      <label className="text-xs text-gray-500">ご住所</label>
                      <input
                        type="text"
                        value={editableQuotation.customerInfo.address}
                        onChange={(e) => updateCustomerInfo('address', e.target.value)}
                        className="w-full text-sm border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-2 py-1 transition-colors"
                      />
                    </div>
                  )}
                  {editableQuotation.customerInfo.propertyInfo && (
                    <div>
                      <label className="text-xs text-gray-500">物件情報</label>
                      <input
                        type="text"
                        value={editableQuotation.customerInfo.propertyInfo}
                        onChange={(e) => updateCustomerInfo('propertyInfo', e.target.value)}
                        className="w-full text-sm border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-2 py-1 transition-colors"
                      />
                    </div>
                  )}
                </div>

                {editableTenantSettings && (
                  <div className="text-right text-xs text-gray-600 ml-8">
                    {editableTenantSettings.companyInfo.logo && (
                      <div className="mb-3 flex justify-end">
                        <img
                          src={editableTenantSettings.companyInfo.logo}
                          alt="Company Logo"
                          className="h-12 w-auto object-contain"
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={editableTenantSettings.companyInfo.name}
                      onChange={(e) => updateTenantInfo('name', e.target.value)}
                      className="font-bold text-sm mb-1 w-full text-right border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition-colors"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <span>〒</span>
                      <input
                        type="text"
                        value={editableTenantSettings.companyInfo.postalCode}
                        onChange={(e) => updateTenantInfo('postalCode', e.target.value)}
                        className="w-full text-right border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      value={editableTenantSettings.companyInfo.address}
                      onChange={(e) => updateTenantInfo('address', e.target.value)}
                      className="w-full text-right border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition-colors"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <span>TEL:</span>
                      <input
                        type="text"
                        value={editableTenantSettings.companyInfo.tel}
                        onChange={(e) => updateTenantInfo('tel', e.target.value)}
                        className="flex-1 text-right border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition-colors"
                      />
                    </div>
                    {editableTenantSettings.companyInfo.fax && (
                      <div className="flex items-center justify-end gap-1">
                        <span>FAX:</span>
                        <input
                          type="text"
                          value={editableTenantSettings.companyInfo.fax}
                          onChange={(e) => updateTenantInfo('fax', e.target.value)}
                          className="flex-1 text-right border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition-colors"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1">
                      <span>Email:</span>
                      <input
                        type="text"
                        value={editableTenantSettings.companyInfo.email}
                        onChange={(e) => updateTenantInfo('email', e.target.value)}
                        className="flex-1 text-right border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Total Amount */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-baseline justify-center gap-4">
                  <span className="text-lg font-bold text-gray-700">御見積金額</span>
                  <span className="text-3xl font-bold text-blue-700">¥{editableQuotation.total.toLocaleString()}</span>
                  <span className="text-sm text-gray-600">（消費税込）</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-300">項目</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-300">内容</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-300 w-20">数量</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-300 w-20">単位</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-300 w-32">単価</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-300 w-32">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableQuotation.items.map((item, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition-colors">
                        <td className="px-2 py-3 border border-gray-300">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => updateItem(index, 'category', e.target.value)}
                            className="w-full text-center text-sm border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                          />
                        </td>
                        <td className="px-2 py-3 border border-gray-300">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full text-sm border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                          />
                        </td>
                        <td className="px-2 py-3 border border-gray-300">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            className="w-full text-center text-sm border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                          />
                        </td>
                        <td className="px-2 py-3 border border-gray-300">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            className="w-full text-center text-sm border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                          />
                        </td>
                        <td className="px-2 py-3 border border-gray-300">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                            className="w-full text-right text-sm border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold border border-gray-300 bg-gray-50">
                          ¥{item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="flex justify-between py-2 border-b border-gray-300">
                    <span className="text-sm font-semibold">小計</span>
                    <span className="text-lg font-bold">¥{editableQuotation.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-300">
                    <span className="text-sm font-semibold">消費税</span>
                    <span className="text-lg font-bold">¥{editableQuotation.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-emerald-50 px-4 rounded-lg mt-2">
                    <span className="text-base font-bold text-emerald-900">合計</span>
                    <span className="text-2xl font-bold text-emerald-700">¥{editableQuotation.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {editableQuotation.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="font-bold text-sm mb-3 text-gray-700">備考</div>
                  <textarea
                    value={editableQuotation.notes}
                    onChange={(e) => updateNotes(e.target.value)}
                    className="w-full text-sm border border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-3 py-2 bg-transparent resize-none"
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-xl px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              閉じる
            </button>
            <div className="flex gap-3">
              {emailSettings?.isVerified ? (
                onSendEmail && (
                  <button
                    onClick={onSendEmail}
                    disabled={!editableQuotation.customerInfo.email}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    <span>メール送信</span>
                  </button>
                )
              ) : (
                onNavigateToEmailSettings && (
                  <button
                    onClick={onNavigateToEmailSettings}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                    title="メール送信機能を使用するにはメール設定が必要です"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    <span>メール設定が必要</span>
                  </button>
                )
              )}
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>{isGeneratingPDF ? '生成中...' : 'PDF保存'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default QuotationPreviewModal;
