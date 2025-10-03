import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon } from './Icon';
import { useChat, type Action, type Message } from '../hooks/useChat';

interface SalesChatBotProps {
  onNavigateBack: () => void;
}

const industryOptions = [
  'インテリアコーディネーター',
  'リフォーム営業',
  '不動産仲介',
  '外壁塗装',
  'その他'
];

const industryActions: Record<string, Action[]> = {
  'インテリアコーディネーター': [
    { label: 'ヒアリングシート作成', prompt: '顧客への初回ヒアリングで聞くべき項目を網羅したヒアリングシートのテンプレートを作成してください。' },
    { label: 'コンセプト提案（3案）', prompt: '顧客に提案するためのデザインコンセプトを3案、それぞれ異なる切り口（例：ミニマル、北欧風、和モダンなど）で簡潔に説明してください。' },
    { label: '予算オーバー時の説得', prompt: '顧客の希望が予算をオーバーしている場合、どのように説明し、納得してもらうか、具体的なトークスクリプトを提案してください。' },
  ],
  'リフォーム営業': [
    { label: '追客メール作成', prompt: '初回訪問後、まだ返信のない見込み客に送るための、丁寧で効果的なフォローアップメールの文面を作成してください。' },
    { label: '付加価値の伝え方', prompt: '他社より見積もりが高い場合、価格以上の価値（品質、保証、デザイン性など）を顧客に納得してもらうための説明方法を教えてください。' },
    { label: '工事遅延のお詫び', prompt: '工事の遅延が発生してしまった場合、顧客への誠実な謝罪と今後の対応を伝えるための電話のトークスクリプトを作成してください。' },
  ],
  '不動産仲介': [
    { label: '物件の魅力的な紹介文', prompt: '物件の魅力を最大限に引き出す、広告用のキャッチーな紹介文を作成してください。ターゲット層も意識してください。' },
    { label: '内見時のキラー質問', prompt: '物件の内見時に、顧客の購入意欲を高めるための効果的な質問（キラークエスチョン）を3つ提案してください。' },
    { label: '価格交渉のロールプレイ', prompt: '買い手から価格交渉をされた場合を想定し、物件の価値を下げずに交渉をうまく進めるためのロールプレイングをしましょう。あなたが顧客役で、私に値下げを要求してください。' },
  ],
  '外壁塗装': [
    { label: '塗料のグレード説明', prompt: 'シリコン、フッ素、無機塗料の違いと、それぞれのメリット・デメリットを、専門知識のない顧客にも分かるように簡単に説明してください。' },
    { label: '近隣挨拶の文面作成', prompt: '工事開始前に、近隣住民へ挨拶に伺う際の案内文を作成してください。工事期間や注意事項を含めてください。' },
    { label: '足場代の必要性を解説', prompt: '「足場代は無料にならないのか？」と聞かれた際に、足場の重要性と安全性、そして費用が発生する理由を顧客に納得してもらえるような説明をしてください。' },
  ],
};

const getSystemPrompt = (selectedIndustry: string): string => {
  let specialization = '';
  switch (selectedIndustry) {
    case 'インテリアコーディネーター':
      specialization = '顧客の潜在的なニーズを引き出し、より高単価で満足度の高いデザインを提案するトークスキルに長けています。特に、デザインコンセプトの言語化や、予算に対するクライアントの懸念を払拭する提案が得意です。';
      break;
    case 'リフォーム営業':
      specialization = '見込み客への効果的なフォローアップ、工事の付加価値を伝える魅力的な見積もり説明、顧客の期待値を適切に管理するコミュニケーションのプロです。';
      break;
    case '不動産仲介':
      specialization = '物件の魅力を最大限に引き出す紹介文の作成、内見時の顧客の心を掴むトーク、購入を迷っている顧客の背中を押す交渉術の専門家です。';
      break;
    case '外壁塗装':
      specialization = '塗料の専門的な利点を一般の顧客にも分かりやすく説明し、長期的なコストメリットを提示して信頼を勝ち取るプロフェッショナルです。相見積もりにも動じません。';
      break;
    default:
      specialization = '様々な業界に対応できる、経験豊富な営業コンサルタントです。';
      break;
  }
  return `あなたは、${specialization}顧客の課題解決を第一に考える、トップクラスの営業支援AIアシスタントです。常にプロフェッショナルとして、具体的かつ実践的なアドバイスを日本語で提供してください。`;
};

const ChatView: React.FC<{ industry: string; onNavigateBack: () => void; }> = ({ industry, onNavigateBack }) => {
  const systemPrompt = getSystemPrompt(industry);
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
    const actions = industryActions[industry] || [];
    const welcomeMessage = `こんにちは！「${industry}」向けの営業支援AIです。どのようなご相談ですか？`;
    const content = actions.length > 0 ? welcomeMessage : `${welcomeMessage}\n具体的な相談内容を入力してください。`;

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content,
        actions: actions.length > 0 ? actions : undefined,
      },
    ]);
  }, [industry, setMessages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>業種選択に戻る</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">営業支援AI ({industry})</h1>
          </div>
        </div>
      </header>
      <main className="flex-grow flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((message, index) => (
            <div key={message.id}>
              <div className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>}
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${ 
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                  {isLoading && index === messages.length - 1 && message.content === '' ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                </div>
                {message.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />}
              </div>
              {message.actions && !isLoading && (
                <div className="flex flex-wrap gap-2 mt-3 ml-12">
                  {message.actions.map(action => (
                    <button
                      key={action.label}
                      onClick={() => handleActionClick(action)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'AIが応答中です...' : 'ご相談内容を入力してください...'}
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
      </main>
    </div>
  );
}

const SalesChatBot: React.FC<SalesChatBotProps> = ({ onNavigateBack }) => {
  const [industry, setIndustry] = useState<string | null>(null);

  if (!industry) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={onNavigateBack}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>メインメニューに戻る</span>
              </button>
              <h1 className="text-xl font-bold text-gray-800">営業支援AIチャットボット</h1>
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">あなたの業種を選択してください</h2>
            <p className="text-gray-600 mb-8">最適な営業サポートAIが応答します。</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {industryOptions.map(opt => (
                <button 
                  key={opt}
                  onClick={() => setIndustry(opt)} 
                  className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:bg-indigo-50 transition-all font-semibold text-gray-700 border-2 border-transparent hover:border-indigo-400"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <ChatView industry={industry} onNavigateBack={() => setIndustry(null)} />;
};

export default SalesChatBot;