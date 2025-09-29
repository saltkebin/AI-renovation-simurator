
import React from 'react';
import { SparklesIcon, DatabaseIcon } from './Icon';

interface HeaderProps {
  onNavigate: (view: 'main' | 'database') => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="ml-3 text-2xl font-bold text-gray-800 tracking-tight">
              AIリノベーション・シミュレーター
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://guide-airenovation.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-2"
              title="活用ガイドを開く"
            >
              活用ガイド
            </a>
            <button
              onClick={() => onNavigate('database')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="商品データベースを開く"
            >
              <DatabaseIcon className="w-5 h-5" />
              <span>商品データベース</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
