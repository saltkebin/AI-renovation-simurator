import React from 'react';
import type { GeneratedImage } from '../types';

interface HistoryPanelProps {
  originalImage: string;
  generatedImages: GeneratedImage[];
  activeImage: string | null;
  onSelect: (image: GeneratedImage | null) => void;
  originalImageLabel?: string;
  tutorialMode?: boolean;
  tutorialStepIndex?: number;
  onTutorialHistoryClick?: (imageUrl: string, imageIndex: number) => void;
  tutorialStep11TabClicked?: boolean;
}

const HistoryThumbnail: React.FC<{
  image: string;
  label?: string;
  isActive: boolean;
  onClick: () => void;
  isHighlighted?: boolean;
  disabled?: boolean;
}> = ({ image, label, isActive, onClick, isHighlighted = false, disabled = false }) => {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative flex-shrink-0 w-24 h-24 rounded-lg focus:outline-none transition-all duration-200 ${
        disabled ? 'opacity-30 cursor-not-allowed' :
        isActive ? 'ring-4 ring-offset-2 ring-indigo-500' :
        isHighlighted ? 'ring-4 ring-offset-2 ring-purple-500' :
        'ring-2 ring-transparent hover:ring-indigo-300'
      }`}
      style={isHighlighted ? {
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      } : undefined}
      aria-label={label || '生成された画像履歴'}
    >
      <img src={image} alt={label || '生成画像'} className="w-full h-full object-cover rounded-lg" />
      {label && (
        <div className="absolute top-0 left-0 w-full px-2 py-1 bg-black bg-opacity-50 text-white text-xs font-bold text-center rounded-t-lg">
          {label}
        </div>
      )}
    </button>
  );
};


const HistoryPanel: React.FC<HistoryPanelProps> = ({
  originalImage,
  generatedImages,
  activeImage,
  onSelect,
  originalImageLabel = 'オリジナル',
  tutorialMode,
  tutorialStepIndex,
  onTutorialHistoryClick,
  tutorialStep11TabClicked
}) => {
  if (!originalImage && generatedImages.length === 0) {
    return null;
  }

  const isStep5 = tutorialMode === true && tutorialStepIndex === 5;
  const isStep10 = tutorialMode === true && tutorialStepIndex === 10;
  const isStep11 = tutorialMode === true && tutorialStepIndex === 11;

  const handleClick = (image: GeneratedImage | null, imageIndex?: number) => {
    onSelect(image);
    if ((isStep5 || isStep10) && onTutorialHistoryClick && image && imageIndex !== undefined) {
      onTutorialHistoryClick(image.src, imageIndex);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 mt-8 ${(isStep5 || isStep10) ? 'relative z-50' : ''}`}>
       <h3 className="text-lg font-bold text-gray-700 mb-4">生成履歴 (最大20件)</h3>
       <div className="flex items-center gap-4 p-2 overflow-x-auto">
        {originalImage && (
             <HistoryThumbnail
                image={originalImage}
                label={originalImageLabel}
                isActive={activeImage === null}
                onClick={() => onSelect(null)}
                isHighlighted={false}
                disabled={isStep10 || isStep11}
             />
        )}
        {generatedImages.map((img, index) => {
          // Highlight minimalist image
          // Step 6: first generated image (index 0)
          // Step 11: find the image with 'tutorial-minimalist' description (but stop highlighting after tab clicked)
          const isMinimalistImage = isStep5 && index === 0;
          const isMinimalistForStep11 = isStep10 && img.description === 'tutorial-minimalist' && !tutorialStep11TabClicked;
          const isHighlighted = isMinimalistImage || isMinimalistForStep11;
          const isDisabled = (isStep10 && img.description !== 'tutorial-minimalist') || isStep11;

          return (
             <HistoryThumbnail
                key={index}
                image={img.src}
                isActive={activeImage === img.src}
                onClick={() => handleClick(img, index)}
                isHighlighted={isHighlighted}
                disabled={isDisabled}
             />
          );
        })}
       </div>
    </div>
  );
};

export default HistoryPanel;
