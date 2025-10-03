import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useChat, type Action } from '../hooks/useChat';
import type { TenantQuotationSettings, FormalQuotation } from '../types';
import { PaperAirplaneIcon } from './Icon';

interface QuotationChatBotProps {
  tenantSettings: TenantQuotationSettings | null;
  currentQuotation: FormalQuotation;
  onApplySuggestion: (suggestion: any) => void;
}

const QuotationChatBot: React.FC<QuotationChatBotProps> = ({
  tenantSettings,
  currentQuotation,
  onApplySuggestion,
}) => {
  const initialActions: Action[] = [
    { label: '新しい項目を提案', prompt: '現在の見積もり内容を確認し、追加すると価値が上がるような新しい項目を1つ提案してください。提案理由も簡潔に説明してください。' },
    { label: '備考欄を推敲', prompt: '現在の備考欄の内容を、よりプロフェッショナルで顧客に分かりやすい文章に推敲してください。変更案のみを提示してください。' },
    { label: '見積もりを評価', prompt: '見積もり全体を評価し、改善できる点があれば指摘してください。' },
    { label: 'コストが高い項目を確認', prompt: '見積もりの中で特に高額な項目を2-3点挙げ、コストを削減するための代替案や見直しについて提案してください。' },
    { label: '項目の漏れがないか確認', prompt: '一般的なリフォーム見積もりに含まれるべき項目（例：諸経費、現場管理費、廃材処分費など）が現在の見積もりに含まれているか確認し、もし漏れがあれば指摘・提案してください。' },
    { label: '顧客向け概要を作成', prompt: 'この見積もりの内容を、専門知識のない顧客にも分かりやすく、丁寧な言葉で要約してください。総額と主要な工事内容、備考欄のポイントを含めてください。' },
  ];

  const systemPrompt = useMemo(() => {
    // 見積もり項目の詳細をフォーマット
    const itemsList = currentQuotation.items.length > 0
      ? currentQuotation.items.map((item, index) =>
          `${index + 1}. ${item.description || '（未入力）'} - ${item.quantity}${item.unit} × ¥${(item.unitPrice || 0).toLocaleString()} = ¥${item.amount.toLocaleString()}`
        ).join('\n')
      : '（まだ項目が追加されていません）';

    let prompt = `あなたは建築・リフォーム業界の見積書作成を専門とするAIアシスタントです。

【重要】以下の見積書情報は、ユーザーが現在編集中の実際の見積書データです。この情報を必ず参照して、具体的で実践的なアドバイスを提供してください。「見積書を拝見できない」などとは言わないでください。

【現在編集中の見積書情報】
顧客名: ${currentQuotation.customerInfo.name || '（未入力）'}
${currentQuotation.customerInfo.email ? `メールアドレス: ${currentQuotation.customerInfo.email}` : ''}
${currentQuotation.customerInfo.phone ? `電話番号: ${currentQuotation.customerInfo.phone}` : ''}
${currentQuotation.customerInfo.address ? `住所: ${currentQuotation.customerInfo.address}` : ''}
${currentQuotation.customerInfo.propertyInfo ? `物件情報: ${currentQuotation.customerInfo.propertyInfo}` : ''}

【見積もり項目（全${currentQuotation.items.length}件）】
${itemsList}

【金額内訳】
小計: ¥${currentQuotation.subtotal.toLocaleString()}
消費税(10%): ¥${currentQuotation.tax.toLocaleString()}
合計: ¥${currentQuotation.total.toLocaleString()}

【備考】
${currentQuotation.notes || '（なし）'}

上記の見積書内容を踏まえて、具体的なアドバイスや提案を行ってください。回答は必ず日本語で行ってください。`;

    return prompt;
  }, [currentQuotation, tenantSettings]);

  const {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    messagesEndRef,
    handleActionClick,
    handleSendMessage,
  } = useChat(systemPrompt);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'こんにちは！見積書作成のお手伝いをします。以下から選択するか、直接質問を入力してください。',
        actions: initialActions,
      },
    ]);
  }, []); // Run only once

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const ActionButton: React.FC<{action: Action}> = ({ action }) => (
    <button
      onClick={() => handleActionClick(action)}
      disabled={isLoading}
      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {action.label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-800">見積書作成アシスタント</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={message.id}>
            <div className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">AI</div>}
              <div
                className={`max-w-[90%] rounded-lg px-4 py-2 shadow-sm ${ 
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                {isLoading && index === messages.length - 1 && message.content === '' ? (
                  <div className="flex items-center space-x-2 py-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                )}
              </div>
              {message.role === 'user' && <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0" />}
            </div>
            {message.actions && !isLoading && (
              <div className="flex flex-wrap gap-2 mt-3 ml-10">
                {message.actions.map(action => <ActionButton key={action.label} action={action} />)}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'AIが応答中です...' : '追加の質問や相談内容を入力...'}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-24"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span className="ml-2">送信</span>
                </>
              )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationChatBot;