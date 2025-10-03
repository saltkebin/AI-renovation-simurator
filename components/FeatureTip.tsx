import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FeatureTipProps {
  tip: string;
}

const FeatureTip: React.FC<FeatureTipProps> = ({ tip }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<'left' | 'right'>('left');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const tooltipWidth = viewportWidth < 768 ? 256 : 320; // w-64 = 256px, w-80 = 320px

      let left = rect.left;
      let arrowPos: 'left' | 'right' = 'left';

      // If tooltip would overflow on the right, align it to the right edge
      if (rect.left + tooltipWidth > viewportWidth - 16) {
        left = rect.right - tooltipWidth;
        arrowPos = 'right';
      }

      // Ensure tooltip doesn't go off the left edge
      if (left < 16) {
        left = 16;
        arrowPos = 'left';
      }

      setTooltipPosition({
        top: rect.bottom + 8,
        left: left
      });
      setArrowPosition(arrowPos);
    }
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center hover:bg-blue-200 transition-colors shadow-sm ml-2"
        aria-label="活用方法のヒント"
      >
        ?
      </button>
      {/* Tooltip rendered at body level using Portal */}
      {isOpen && createPortal(
        <div
          className="fixed bg-gray-800 text-white text-xs rounded-lg p-3 w-64 md:w-80 shadow-xl"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 9999
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-start gap-2">
            <span className="text-yellow-300 flex-shrink-0">💡</span>
            <p className="leading-relaxed">{tip}</p>
          </div>
          {/* Arrow */}
          <div
            className="absolute -top-1 w-2 h-2 bg-gray-800 transform rotate-45"
            style={{
              [arrowPosition]: '8px'
            }}
          ></div>
        </div>,
        document.body
      )}
    </>
  );
};

export default FeatureTip;
