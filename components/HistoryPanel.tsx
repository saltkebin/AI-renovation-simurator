import React from 'react';
import type { GeneratedImage } from '../types';

interface HistoryPanelProps {
  originalImage: string;
  generatedImages: GeneratedImage[];
  activeImage: string | null;
  onSelect: (image: GeneratedImage | null) => void;
  originalImageLabel?: string;
}

const HistoryThumbnail: React.FC<{
  image: string;
  label?: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ image, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 w-24 h-24 rounded-lg focus:outline-none transition-all duration-200 ${
        isActive ? 'ring-4 ring-offset-2 ring-indigo-500' : 'ring-2 ring-transparent hover:ring-indigo-300'
      }`}
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


const HistoryPanel: React.FC<HistoryPanelProps> = ({ originalImage, generatedImages, activeImage, onSelect, originalImageLabel = 'オリジナル' }) => {
  if (!originalImage && generatedImages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mt-8">
       <h3 className="text-lg font-bold text-gray-700 mb-4">生成履歴 (最大20件)</h3>
       <div className="flex items-center gap-4 p-2 overflow-x-auto">
        {originalImage && (
             <HistoryThumbnail
                image={originalImage}
                label={originalImageLabel}
                isActive={activeImage === null}
                onClick={() => onSelect(null)}
             />
        )}
        {generatedImages.map((img, index) => (
             <HistoryThumbnail
                key={index}
                image={img.src}
                isActive={activeImage === img.src}
                onClick={() => onSelect(img)}
             />
        ))}
       </div>
    </div>
  );
};

export default HistoryPanel;
