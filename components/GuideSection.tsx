import React from 'react';

interface GuideSectionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  imagePlaceholder?: boolean;
}

const GuideSection: React.FC<GuideSectionProps> = ({
  id,
  title,
  icon,
  children,
  imagePlaceholder = false
}) => {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-indigo-200">
        {icon && <div className="text-indigo-600">{icon}</div>}
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>

      {imagePlaceholder && (
        <div className="mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-8 border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="text-6xl mb-3">📸</div>
            <p className="text-gray-500 font-semibold">機能のスクリーンショット</p>
            <p className="text-sm text-gray-400 mt-1">実際の画面イメージがここに表示されます</p>
          </div>
        </div>
      )}

      <div className="prose prose-sm max-w-none text-gray-700">
        {children}
      </div>
    </section>
  );
};

export default GuideSection;
