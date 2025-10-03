import type React from 'react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PaperAirplaneIcon, XMarkIcon } from './Icon';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => Promise<void>;
  initialData: {
    to: string;
    subject: string;
    body: string;
  };
  pdfUrl?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  onSend,
  initialData,
  pdfUrl
}) => {
  const [emailData, setEmailData] = useState<EmailData>(initialData);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmailData(initialData);
    }
  }, [isOpen, initialData]);

  const handleSendClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    try {
      await onSend(emailData);
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('メール送信に失敗しました。');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleClose = () => {
    if (!isSending) {
      setShowConfirmation(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 transform transition-all z-[10000]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">メールプレビュー</h2>
            <button
              onClick={handleClose}
              disabled={isSending}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            {/* To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                宛先 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="customer@example.com"
                required
                disabled={isSending}
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                件名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="見積書の送付について"
                required
                disabled={isSending}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                本文 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[300px] font-mono text-sm"
                placeholder="メール本文を入力してください"
                required
                disabled={isSending}
              />
            </div>

            {/* PDF Attachment Info */}
            {pdfUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📎 添付ファイル: 見積書PDF
                </p>
              </div>
            )}

            {/* Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ 送信前に内容を必ずご確認ください。送信後は取り消せません。
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSending}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSendClick}
              disabled={isSending || !emailData.to || !emailData.subject || !emailData.body}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              <span>{isSending ? '送信中...' : '送信'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-60"
            onClick={handleCancelConfirmation}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 z-[10002]">
            <h3 className="text-xl font-bold text-gray-800 mb-4">送信確認</h3>
            <p className="text-gray-700 mb-6">
              本当にメールを送信しますか？<br />
              送信後は取り消すことができません。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelConfirmation}
                disabled={isSending}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={isSending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
              >
                {isSending ? '送信中...' : '送信する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EmailPreviewModal;
