import React from 'react';
import { HomeIcon, DocumentTextIcon, CogIcon, ChatBubbleLeftRightIcon } from './Icon';

interface MainMenuProps {
  onSelectApp: (app: 'renovation' | 'quotation' | 'email-settings' | 'sales-chatbot') => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelectApp }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-12">
          <div className="inline-block bg-indigo-600 p-4 rounded-2xl shadow-lg">
            <HomeIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mt-4 mb-2">
            AIリノベーションシステム
          </h1>
          <p className="text-lg text-gray-600">
            利用するアプリケーションを選択してください
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Main Feature: AI Renovation (Large) */}
          <div className="lg:col-span-3">
            <button
              onClick={() => onSelectApp('renovation')}
              className="group w-full h-full relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-indigo-400 flex flex-col"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                  <HomeIcon className="w-10 h-10 text-white" />
                </div>
                <div className="flex-grow">
                  <h2 className="text-3xl font-bold text-gray-800 mb-3 group-hover:text-indigo-600 transition-colors">
                    AIリノベーション
                  </h2>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    AI画像生成技術を使って、室内・外観のリノベーションシミュレーションを行います。
                  </p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-600 text-base pl-4 border-l-4 border-indigo-100">
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-indigo-400 rounded-full"></span>インテリアデザインシミュレーション</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-indigo-400 rounded-full"></span>外壁塗装シミュレーション</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-indigo-400 rounded-full"></span>手書きスケッチから3Dパース生成</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-indigo-400 rounded-full"></span>概算見積もり自動生成</li>
              </ul>
              <div className="absolute bottom-8 right-8 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </button>
          </div>

          {/* Sub Features (Small) */}
          <div className="lg:col-span-2 grid grid-cols-1 gap-6">
            {/* Sales Chatbot */}
            <button
              onClick={() => onSelectApp('sales-chatbot')}
              className="group w-full relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-left border-2 border-transparent hover:border-sky-400 flex items-center gap-5"
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-sky-500 to-cyan-600 p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-sky-600 transition-colors">営業支援AIチャット</h3>
                <p className="text-sm text-gray-600 mt-1">営業トークや提案をAIがサポート</p>
              </div>
            </button>

            {/* Quotation Editor */}
            <button
              onClick={() => onSelectApp('quotation')}
              className="group w-full relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-left border-2 border-transparent hover:border-emerald-400 flex items-center gap-5"
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">本格見積もり管理</h3>
                <p className="text-sm text-gray-600 mt-1">詳細な見積書を作成・管理</p>
              </div>
            </button>

            {/* Email Settings */}
            <button
              onClick={() => onSelectApp('email-settings')}
              className="group w-full relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-left border-2 border-transparent hover:border-gray-400 flex items-center gap-5"
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-gray-500 to-gray-600 p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                <CogIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-600 transition-colors">メール送信設定</h3>
                <p className="text-sm text-gray-600 mt-1">SendGrid APIキーの登録・管理</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;