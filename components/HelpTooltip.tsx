import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuestionMarkCircleIcon } from './Icon';

interface HelpTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ text, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 256; // w-64 = 256px
      const tooltipHeight = 80; // 概算

      let top = rect.top;
      let left = rect.left;

      // Position based on prop
      switch (position) {
        case 'top':
          top = rect.top - tooltipHeight - 8;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 8;
          break;
      }

      // Keep tooltip within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < 16) left = 16;
      if (left + tooltipWidth > viewportWidth - 16) left = viewportWidth - tooltipWidth - 16;
      if (top < 16) top = 16;
      if (top + tooltipHeight > viewportHeight - 16) top = viewportHeight - tooltipHeight - 16;

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="inline-flex items-center justify-center focus:outline-none ml-1"
        aria-label="ヘルプ"
      >
        <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400 hover:text-indigo-600 cursor-help transition-colors" />
      </button>

      {isVisible && createPortal(
        <div
          className="fixed w-64 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-xl"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 9999,
            whiteSpace: 'normal'
          }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};

export default HelpTooltip;
