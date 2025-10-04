import React, { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, XIcon, LightBulbIcon } from './Icon';
import TutorialProgress from './TutorialProgress';
import ConfirmationModal from './ConfirmationModal';
import type { TutorialStep as TutorialStepType } from '../constants';

interface TutorialStepProps {
  step: TutorialStepType;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onExit: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextButtonDisabled?: boolean;
}

const TutorialStep: React.FC<TutorialStepProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onExit,
  isFirstStep,
  isLastStep,
  nextButtonDisabled = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-2xl flex items-center gap-2 transition-all text-sm font-semibold"
        title="チュートリアルを展開"
      >
        <LightBulbIcon className="w-5 h-5" />
        ガイドを開く
      </button>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl p-6 border-2 border-purple-500">
        {/* Progress Bar */}
        <div className="mb-3">
          <TutorialProgress current={currentStep} total={totalSteps} />
        </div>

        {/* Title with collapse button */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-800">{step.title}</h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="折りたたむ"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{step.description}</p>

        {/* Hint */}
        {step.hint && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-3 rounded-r-lg">
            <div className="flex items-start gap-2">
              <LightBulbIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{step.hint}</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-2 mt-4">
          {/* Next Button */}
          <button
            onClick={onNext}
            disabled={nextButtonDisabled}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all shadow-md text-sm font-bold ${
              nextButtonDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : !nextButtonDisabled && (currentStep === 3 || currentStep === 5 || currentStep === 6 || currentStep === 7 || currentStep === 8 || currentStep === 9 || currentStep === 10 || currentStep === 11 || currentStep === 12)
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white hover:shadow-lg ring-4 ring-purple-300 ring-opacity-50 animate-pulse'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white hover:shadow-lg'
            }`}
          >
            {step.buttonText || (isLastStep ? '完了' : '次へ')}
            {!isLastStep && <ArrowRightIcon className="w-4 h-4" />}
          </button>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            {/* Exit Button */}
            <button
              onClick={() => setShowExitModal(true)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              title="チュートリアルを終了"
            >
              <XIcon className="w-3 h-3" />
              終了
            </button>

            {/* Skip Button */}
            {!isLastStep && (
              <button
                onClick={onSkip}
                className="flex-1 px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
              >
                スキップ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Exit Confirmation Modal */}
    <ConfirmationModal
      isOpen={showExitModal}
      onClose={() => setShowExitModal(false)}
      onConfirm={() => {
        setShowExitModal(false);
        onExit();
      }}
      title="チュートリアルを終了しますか？"
      message="チュートリアルの進行状況は保存されません。本当に終了しますか？"
      confirmText="終了する"
      cancelText="続ける"
    />
    </>
  );
};

export default TutorialStep;
