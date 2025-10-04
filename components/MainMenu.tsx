import React from 'react';
import { HomeIcon, DocumentTextIcon, CogIcon, ChatBubbleLeftRightIcon, BookOpenIcon, AcademicCapIcon } from './Icon';

interface MainMenuProps {
  onSelectApp: (app: 'renovation' | 'quotation' | 'email-settings' | 'sales-chatbot' | 'user-guide' | 'tutorial') => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelectApp }) => {
  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-2 sm:mb-6">
          <div className="inline-block bg-indigo-600 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg">
            <HomeIcon className="w-6 sm:w-10 h-6 sm:h-10 text-white" />
          </div>
          <h1 className="text-base sm:text-3xl md:text-4xl font-bold text-gray-800 mt-1.5 sm:mt-3 mb-0.5 sm:mb-1">
            AIリノベーションシステム
          </h1>
          <p className="text-xs sm:text-base text-gray-600">
            利用するアプリケーションを選択してください
          </p>
        </div>

        <div className="space-y-1.5 sm:space-y-4">
          {/* Main Feature: AI Renovation (Large, More Prominent) */}
          <button
            onClick={() => onSelectApp('renovation')}
            className="group w-full relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 p-2 sm:p-5 text-left border-2 sm:border-4 border-indigo-300 hover:border-indigo-200 flex flex-col"
          >
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="flex-shrink-0 bg-white p-1.5 sm:p-3 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <HomeIcon className="w-5 sm:w-8 h-5 sm:h-8 text-indigo-600" />
              </div>
              <div className="flex-grow">
                <h2 className="text-sm sm:text-2xl font-bold text-white mb-0.5 sm:mb-2 group-hover:text-indigo-100 transition-colors">
                  AIリノベーション
                </h2>
                <p className="text-indigo-50 mb-1 sm:mb-3 leading-relaxed text-xs sm:text-sm">
                  AI画像生成技術を使って、室内・外観のリノベーションシミュレーションを行います。
                </p>
              </div>
            </div>
            <ul className="space-y-0.5 sm:space-y-2 text-white text-xs sm:text-sm pl-2 sm:pl-4 border-l-2 sm:border-l-4 border-indigo-300">
              <li className="flex items-center gap-1 sm:gap-2"><span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white rounded-full"></span>インテリアデザインシミュレーション</li>
              <li className="flex items-center gap-1 sm:gap-2"><span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white rounded-full"></span>外壁塗装シミュレーション</li>
              <li className="flex items-center gap-1 sm:gap-2"><span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white rounded-full"></span>手書きスケッチから3Dパース生成</li>
              <li className="flex items-center gap-1 sm:gap-2"><span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white rounded-full"></span>概算見積もり自動生成</li>
            </ul>
            <div className="absolute bottom-2 sm:bottom-5 right-2 sm:right-5 text-white opacity-75 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
              <svg className="w-4 sm:w-7 h-4 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </button>

          {/* Secondary Features Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-4">
            {/* Sales Chatbot */}
            <button
              onClick={() => onSelectApp('sales-chatbot')}
              className="group w-full relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-2 sm:p-4 text-left border-2 border-transparent hover:border-sky-400 flex items-center gap-1.5 sm:gap-4"
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-sky-500 to-cyan-600 p-1.5 sm:p-2.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                <ChatBubbleLeftRightIcon className="w-4 sm:w-7 h-4 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xs sm:text-lg font-bold text-gray-800 group-hover:text-sky-600 transition-colors">営業支援AIチャット</h3>
                <p className="text-xs text-gray-600 mt-0.5">営業トークや提案をAIがサポート</p>
              </div>
            </button>

            {/* Quotation Editor */}
            <button
              onClick={() => onSelectApp('quotation')}
              className="group w-full relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-2 sm:p-4 text-left border-2 border-transparent hover:border-emerald-400 flex items-center gap-1.5 sm:gap-4"
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 sm:p-2.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                <DocumentTextIcon className="w-4 sm:w-7 h-4 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xs sm:text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">本格見積もり管理</h3>
                <p className="text-xs text-gray-600 mt-0.5">詳細な見積書を作成・管理</p>
              </div>
            </button>
          </div>

          {/* Settings and Guide Row (3 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-4">
            {/* Email Settings */}
            <button
              onClick={() => onSelectApp('email-settings')}
              className="group w-full relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-2 sm:p-4 text-left border-2 border-transparent hover:border-gray-400 flex flex-col items-center gap-1.5 sm:gap-3"
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-gray-500 to-gray-600 p-1.5 sm:p-2.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                <CogIcon className="w-4 sm:w-7 h-4 sm:h-7 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xs sm:text-base font-bold text-gray-800 group-hover:text-gray-600 transition-colors">メール送信設定</h3>
                <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">SendGrid APIキーの登録・管理</p>
              </div>
            </button>

            {/* Tutorial */}
            <button
              onClick={() => onSelectApp('tutorial')}
              className="group w-full relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-2 sm:p-4 text-left border-2 border-transparent hover:border-purple-400 flex flex-col items-center gap-1.5 sm:gap-3"
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 p-1.5 sm:p-2.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                <AcademicCapIcon className="w-4 sm:w-7 h-4 sm:h-7 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xs sm:text-base font-bold text-gray-800 group-hover:text-purple-600 transition-colors">チュートリアル</h3>
                <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">使い方を実際に体験しながら学ぶ</p>
              </div>
            </button>

            {/* User Guide */}
            <button
              onClick={() => onSelectApp('user-guide')}
              className="group w-full relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-2 sm:p-4 text-left border-2 border-transparent hover:border-amber-400 flex flex-col items-center gap-1.5 sm:gap-3"
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 p-1.5 sm:p-2.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                <BookOpenIcon className="w-4 sm:w-7 h-4 sm:h-7 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xs sm:text-base font-bold text-gray-800 group-hover:text-amber-600 transition-colors">ユーザーガイド</h3>
                <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">機能の使い方をAIチャットで質問</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;