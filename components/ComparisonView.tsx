import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ComparisonViewProps {
  before: string;
  after: string;
  tutorialMode?: boolean;
  tutorialStepIndex?: number;
  onSliderUsed?: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ before, after, tutorialMode, tutorialStepIndex, onSliderUsed }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isStep2 = tutorialMode === true && tutorialStepIndex === 2;
  const isStep4 = tutorialMode === true && tutorialStepIndex === 4;
  const isSliderStep = isStep2 || isStep4;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
    if (isSliderStep && onSliderUsed) {
      onSliderUsed();
    }
  };

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        let percentage = (x / rect.width) * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        setSliderPosition(percentage);
        if (isSliderStep && onSliderUsed) {
          onSliderUsed();
        }
    }
  }, [isSliderStep, onSliderUsed]);

  const handleMouseMove = useCallback((e: MouseEvent) => handleMove(e.clientX), [handleMove]);
  const handleTouchMove = useCallback((e: TouchEvent) => handleMove(e.touches[0].clientX), [handleMove]);

  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleTouchEnd = useCallback(() => {
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  }, [handleTouchMove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      className={`w-full h-full relative select-none ${isSliderStep ? 'z-50' : ''}`}
      ref={containerRef}
    >
      <img src={before} alt="リノベーション前" className="absolute inset-0 w-full h-full object-contain rounded-lg pointer-events-none" />

      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={after} alt="リノベーション後" className="absolute inset-0 w-full h-full object-contain rounded-lg pointer-events-none" />
      </div>
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-ew-resize opacity-75 z-10 ${
          isSliderStep ? 'bg-purple-500' : 'bg-white'
        }`}
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {isSliderStep && (
          <div className="absolute -inset-2 bg-purple-500 rounded-full blur opacity-50 animate-pulse"></div>
        )}
        <div className={`absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 rounded-full shadow-lg flex items-center justify-center pointer-events-none ${
          isSliderStep ? 'bg-gradient-to-r from-purple-500 to-indigo-600 ring-4 ring-purple-300 ring-opacity-50' : 'bg-white'
        }`}>
            <svg className={`w-5 h-5 ${isSliderStep ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
        </div>
      </div>
       <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={handleSliderChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        aria-label="比較スライダー"
      />
    </div>
  );
};

export default ComparisonView;