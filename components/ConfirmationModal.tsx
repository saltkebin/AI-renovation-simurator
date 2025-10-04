
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: 'red' | 'indigo';
  hideCancelButton?: boolean;
  nextAction?: string; // 次に何が起こるかの説明
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'キャンセル',
  confirmButtonColor = 'indigo',
  hideCancelButton = false,
  nextAction,
}) => {
  if (!isOpen) {
    return null;
  }

  const confirmColorClasses = {
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
  };

  const isLoading = !confirmText || confirmText === '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full" role="document">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <div className="mt-2 text-sm text-gray-600">
          {message}
        </div>
        {nextAction && (
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 flex-shrink-0 mt-0.5">ℹ️</span>
              <div>
                <p className="text-xs font-semibold text-blue-800">次に起こること</p>
                <p className="text-xs text-blue-700 mt-1">{nextAction}</p>
              </div>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="mt-6 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="mt-6 flex justify-end gap-3">
            {!hideCancelButton && onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmColorClasses[confirmButtonColor]}`}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmationModal;
