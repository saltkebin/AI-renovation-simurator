import React, { useEffect, useState } from 'react';

interface TutorialHighlightProps {
  targetSelector?: string;
  onClick?: () => void;
}

const TutorialHighlight: React.FC<TutorialHighlightProps> = ({ targetSelector, onClick }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetSelector) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetSelector]);

  if (!targetRect) {
    return (
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClick}
      />
    );
  }

  return (
    <>
      {/* Overlay with cutout */}
      <div
        className="fixed inset-0 z-40 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse ${targetRect.width + 20}px ${targetRect.height + 20}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px,
              transparent 0%,
              transparent 40%,
              rgba(0, 0, 0, 0.5) 70%,
              rgba(0, 0, 0, 0.7) 100%
            )
          `,
        }}
      />

      {/* Clickable overlay around the highlight */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClick}
        style={{
          clipPath: `polygon(
            0% 0%,
            0% 100%,
            ${targetRect.left - 10}px 100%,
            ${targetRect.left - 10}px ${targetRect.top - 10}px,
            ${targetRect.right + 10}px ${targetRect.top - 10}px,
            ${targetRect.right + 10}px ${targetRect.bottom + 10}px,
            ${targetRect.left - 10}px ${targetRect.bottom + 10}px,
            ${targetRect.left - 10}px 100%,
            100% 100%,
            100% 0%
          )`,
        }}
      />

      {/* Highlight border */}
      <div
        className="fixed z-50 border-4 border-purple-500 rounded-lg pointer-events-none animate-pulse"
        style={{
          left: `${targetRect.left - 10}px`,
          top: `${targetRect.top - 10}px`,
          width: `${targetRect.width + 20}px`,
          height: `${targetRect.height + 20}px`,
        }}
      />
    </>
  );
};

export default TutorialHighlight;
