import React from 'react';
import { ArrowLeftIcon, AcademicCapIcon, PlayCircleIcon, HomeIcon, PencilIcon, PaintBrushIcon } from './Icon';
import { TUTORIAL_RENOVATION_STEPS } from '../constants';

interface TutorialPageProps {
  onNavigateBack: () => void;
  onStartTutorial: () => void;
}

const TutorialPage: React.FC<TutorialPageProps> = ({ onNavigateBack, onStartTutorial }) => {
  const tutorials = [
    {
      id: 'renovation',
      title: 'リノベーション',
      description: '室内リノベーションの基本操作を学びます',
      icon: <HomeIcon className="w-8 h-8 text-white" />,
      color: 'from-indigo-500 to-purple-600',
      available: true,
      steps: TUTORIAL_RENOVATION_STEPS,
    },
    {
      id: 'sketch2arch',
      title: 'スケッチ→パース',
      description: '手書きスケッチから3Dパースを生成',
      icon: <PencilIcon className="w-8 h-8 text-white" />,
      color: 'from-blue-500 to-cyan-600',
      available: false,
      steps: [],
    },
    {
      id: 'exterior-painting',
      title: '外壁塗装',
      description: '外壁塗装シミュレーションの使い方',
      icon: <PaintBrushIcon className="w-8 h-8 text-white" />,
      color: 'from-green-500 to-teal-600',
      available: false,
      steps: [],
    },
  ];

  const handleStartTutorial = (tutorialId: string) => {
    if (tutorialId === 'renovation') {
      onStartTutorial();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-200 transition-colors shadow-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            メインメニューへ戻る
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg mb-4">
            <AcademicCapIcon className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            チュートリアル
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AIリノベーションシステムの使い方を学びましょう。<br />
            各チュートリアルは3-5分で完了します。
          </p>
        </div>

        {/* Tutorial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition-all duration-300 ${
                tutorial.available
                  ? 'border-transparent hover:border-purple-400 hover:shadow-xl'
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <div className={`bg-gradient-to-r ${tutorial.color} p-4 rounded-xl shadow-md mb-4 flex items-center justify-center`}>
                {tutorial.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">{tutorial.title}</h3>

              {tutorial.available ? (
                <button
                  onClick={() => handleStartTutorial(tutorial.id)}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg p-6 text-left"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <PlayCircleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{tutorial.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/90">
                    <span>📚 {tutorial.steps.length} ステップ</span>
                    <span>•</span>
                    <span>⏱️ 約3-5分</span>
                  </div>
                </button>
              ) : (
                <div className="text-center">
                  <span className="inline-block px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg">
                    準備中
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="mt-12 max-w-3xl mx-auto bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-indigo-900 mb-2">💡 チュートリアルのヒント</h3>
          <ul className="text-sm text-indigo-800 space-y-2">
            <li>• チュートリアルはいつでも終了できます</li>
            <li>• 実際の操作を体験しながら学べるインタラクティブな形式です</li>
            <li>• サンプル画像を使用しています</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
