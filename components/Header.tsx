
import React, { useState, useEffect } from 'react';
import { SparklesIcon, DatabaseIcon, Bars3Icon, XMarkIcon, BookOpenIcon } from './Icon';

interface HeaderProps {
  onNavigate: (view: 'main' | 'database') => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside or on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-mobile-menu]') && !target.closest('[data-menu-button]')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavigateAndClose = (view: 'main' | 'database') => {
    onNavigate(view);
    closeMobileMenu();
  };

  const handleGuideClick = () => {
    window.open('https://guide-airenovation.netlify.app/', '_blank', 'noopener,noreferrer');
    closeMobileMenu();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center min-w-0">
            <SparklesIcon className="h-8 w-8 text-indigo-600 flex-shrink-0" />
            <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 tracking-tight truncate">
              AIリノベーション・シミュレーター
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
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

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="メニューを開く"
            data-menu-button
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white relative z-50" data-mobile-menu>
            <div className="py-2 space-y-1">
              <button
                onClick={handleGuideClick}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <BookOpenIcon className="w-5 h-5 text-gray-400" />
                <span>活用ガイド</span>
              </button>
              <button
                onClick={() => handleNavigateAndClose('database')}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <DatabaseIcon className="w-5 h-5 text-gray-400" />
                <span>商品データベース</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-25 z-30"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Header;
