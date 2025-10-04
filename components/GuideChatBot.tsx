import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, SparklesIcon } from './Icon';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { streamChat } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface GuideChatBotProps {
  tenantId: string;
  userGuideContent: string;
}

const GuideChatBot: React.FC<GuideChatBotProps> = ({ tenantId, userGuideContent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'こんにちは！AIリノベーションのサポートアシスタントです。\n\n機能の使い方、登録されている商品情報、見積もりテンプレートなど、なんでもお聞きください。',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // システムプロンプトを生成
  const getSystemPrompt = () => {
    return `あなたはAIリノベーション・シミュレーターのサポートアシスタントです。

【あなたの役割】
- ユーザーの質問に対して、親切で分かりやすい回答を提供する
- 機能の使い方を丁寧に説明する
- 登録されているデータベース情報を活用して具体的な情報を提供する
- 初心者にも分かりやすい言葉で説明する

【利用可能な情報】
1. ユーザーガイド（全機能の詳細説明）
2. データベース情報（商品、テンプレート、項目マスター、会社情報など）

【回答のスタイル】
- 簡潔で分かりやすく
- 具体例を交えて説明
- 必要に応じて手順を番号付きで示す
- 絵文字を適度に使用して親しみやすく

【ユーザーガイド全文】
${userGuideContent}`;
  };

  // データベースから関連情報を取得
  const fetchRelevantData = async (userQuery: string): Promise<string> => {
    let contextInfo = '';

    try {
      // 商品情報の取得
      if (userQuery.includes('商品') || userQuery.includes('塗料') || userQuery.includes('壁紙') || userQuery.includes('家具')) {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('tenantId', '==', tenantId), limit(20));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const products = snapshot.docs.map(doc => {
            const data = doc.data();
            return `${data.name} (${data.category}) - ${data.manufacturer || ''} ${data.price ? '¥' + data.price.toLocaleString() : ''}`;
          });
          contextInfo += `\n\n【登録商品情報】\n${products.join('\n')}`;
        }
      }

      // 見積もりテンプレート情報の取得
      if (userQuery.includes('テンプレート') || userQuery.includes('見積') || userQuery.includes('項目')) {
        const templatesRef = collection(db, 'quotationTemplates');
        const q = query(templatesRef, where('tenantId', '==', tenantId), limit(10));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const templates = snapshot.docs.map(doc => {
            const data = doc.data();
            return `${data.name}: ${data.description || ''} (項目数: ${data.items?.length || 0})`;
          });
          contextInfo += `\n\n【見積もりテンプレート】\n${templates.join('\n')}`;
        }
      }

      // 項目マスター情報の取得
      if (userQuery.includes('マスタ') || userQuery.includes('項目') || userQuery.includes('単価')) {
        const mastersRef = collection(db, 'quotationItemMasters');
        const q = query(mastersRef, where('tenantId', '==', tenantId), limit(20));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const masters = snapshot.docs.map(doc => {
            const data = doc.data();
            return `${data.category} - ${data.description}: ¥${data.defaultUnitPrice?.toLocaleString() || 0}/${data.defaultUnit}`;
          });
          contextInfo += `\n\n【項目マスター】\n${masters.join('\n')}`;
        }
      }

      // 会社情報の取得
      if (userQuery.includes('会社') || userQuery.includes('設定') || userQuery.includes('情報')) {
        const companyRef = collection(db, 'companies');
        const q = query(companyRef, where('tenantId', '==', tenantId), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          contextInfo += `\n\n【会社情報】\n会社名: ${data.name || '未設定'}\n住所: ${data.address || '未設定'}\n電話: ${data.phone || '未設定'}`;
        }
      }

    } catch (error) {
      console.error('Failed to fetch database info:', error);
    }

    return contextInfo;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
    };

    // アシスタントの空メッセージを追加（ストリーミング用）
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);

    try {
      // データベースから関連情報を取得
      const dbContext = await fetchRelevantData(userInput);

      // システムプロンプトにデータベース情報を追加
      const systemPrompt = getSystemPrompt() + (dbContext || '');

      // ストリーミングチャット
      const stream = streamChat(
        [{ role: 'user', content: userInput }],
        systemPrompt
      );

      for await (const chunk of stream) {
        setMessages(prev => prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, content: msg.content + chunk }
            : msg
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map((msg, index) =>
        index === prev.length - 1
          ? { ...msg, content: '申し訳ございません。エラーが発生しました。もう一度お試しください。' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'AIリノベーションの使い方を教えて',
    '登録されている商品を教えて',
    '見積もりテンプレートの使い方は？',
    '外壁塗装シミュレーションの手順は？',
    'メール送信の設定方法は？'
  ];

  return (
    <>
      {/* チャットボット起動ボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 group"
        aria-label="ガイドチャットを開く"
      >
        <ChatBubbleLeftRightIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <SparklesIcon className="w-3 h-3 text-white" />
        </div>
      </button>

      {/* チャットウィンドウ */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">AIガイドアシスタント</h3>
                <p className="text-xs text-indigo-100">機能・データベース連携対応</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* メッセージエリア */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                  }`}
                >
                  {message.content ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  ) : (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* サジェスチョン（最初のメッセージのみの時） */}
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center mb-3">よくある質問</p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(question)}
                    className="w-full text-left px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="質問を入力してください..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              商品情報・テンプレート・マスタ情報にも対応
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default GuideChatBot;
