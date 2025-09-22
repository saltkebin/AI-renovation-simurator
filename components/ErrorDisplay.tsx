
import React, { useState } from 'react';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) {
    return null;
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm w-full max-w-lg mx-auto">
      <p className="font-bold text-center text-red-800">問題が発生しました</p>
      <p className="mt-1 text-center">
        申し訳ありません、予期せぬエラーが発生しました。
        <br />
        時間をおいて再度お試しいただくか、プロンプトや画像を変更してみてください。
      </p>
      <div className="text-center mt-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-semibold text-gray-600 hover:text-gray-800 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 rounded"
          aria-expanded={showDetails}
        >
          {showDetails ? '詳細を隠す' : 'エラー詳細を表示'}
        </button>
      </div>
      {showDetails && (
        <div className="mt-2 p-2 bg-red-100 border-t border-red-200 rounded text-left text-xs text-red-900">
          <pre className="whitespace-pre-wrap font-mono" role="alert">
            {error}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;
