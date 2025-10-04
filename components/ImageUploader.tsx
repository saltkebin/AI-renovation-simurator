
import React, { useState, useRef, useId, useEffect } from 'react';
import { UploadIcon, ArrowPathIcon } from './Icon';
import HelpTooltip from './HelpTooltip';
import { HELP_TEXTS } from '../constants';
import heic2any from 'heic2any';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  image: string | null;
  onError: (message: string) => void;
  tutorialMode?: boolean;
  tutorialStepIndex?: number;
  onUseSampleImage?: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, image, onError, tutorialMode, tutorialStepIndex, onUseSampleImage }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    setPreview(image);
  }, [image]);

  const processFile = async (file: File | null | undefined) => {
    if (!file) {
      return;
    }

    let processedFile: File | null = file;
    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
      setIsConverting(true);
      setPreview(null);
      try {
        const conversionResult = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.92,
        });
        
        if (!conversionResult) {
          throw new Error("HEIC conversion returned an empty result.");
        }

        const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
        
        if (!(convertedBlob instanceof Blob)) {
          console.error("HEIC conversion result is not a Blob:", convertedBlob);
          throw new Error("HEIC変換で有効な画像データを取得できませんでした。");
        }
        
        const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpeg');
        processedFile = new File([convertedBlob], newFileName, { type: 'image/jpeg' });
      } catch (e: unknown) {
        console.error('HEIC画像の変換に失敗しました:', e);
        
        let detail = '不明なエラーが発生しました。';
        if (e instanceof Error) {
            detail = e.message;
        } else if (typeof e === 'string') {
            detail = e;
        } else if (e && typeof e === 'object') {
            if ('message' in e && typeof (e as any).message === 'string') {
                detail = (e as any).message;
            } else {
                try {
                    detail = JSON.stringify(e);
                } catch {
                    detail = '内容を文字列化できないエラーオブジェクトです。';
                }
            }
        }

        const message = `HEIC画像の変換に失敗しました: ${detail}\n\n別の画像をお試しください。`;
        onError(message);
        processedFile = null;
      } finally {
        setIsConverting(false);
      }
    }
    
    if (processedFile && processedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(processedFile);
      onImageUpload(processedFile);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    processFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Tutorial mode: make upload area clickable to load sample image in step 0
  const isStep0 = tutorialMode === true && tutorialStepIndex === 0;

  const handleLabelClick = (e: React.MouseEvent<HTMLLabelElement | HTMLDivElement>) => {
    if (isStep0 && onUseSampleImage && !preview) {
      e.preventDefault();
      onUseSampleImage();
    } else if (tutorialMode && preview) {
      // Tutorial mode: prevent changing image after upload
      e.preventDefault();
    }
  };

  return (
    <div className={isStep0 && !preview ? 'relative z-50' : ''}>
      {isStep0 && !preview ? (
        <div
          onClick={handleLabelClick}
          className="relative flex flex-col items-center justify-center w-full h-48 md:h-48 min-h-[12rem] border-2 border-dashed rounded-lg transition-all border-purple-400 bg-purple-50 cursor-pointer hover:bg-purple-100 hover:border-purple-500"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon className="w-10 h-10 mb-3 text-purple-600" />
            <div className="mb-2 text-sm text-purple-700 font-semibold">
              サンプル画像を使用
            </div>
            <p className="text-xs text-purple-600">クリックして読み込む</p>
          </div>
        </div>
      ) : (
        <label
          htmlFor={tutorialMode && preview ? undefined : fileInputId}
          onClick={tutorialMode && preview ? handleLabelClick : undefined}
          onDragOver={tutorialMode && preview ? undefined : handleDragOver}
          onDrop={tutorialMode && preview ? undefined : handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-48 md:h-48 min-h-[12rem] border-2 border-dashed rounded-lg transition-all ${
            tutorialMode && preview
              ? 'border-gray-300 cursor-default bg-gray-50'
              : 'border-gray-300 cursor-pointer bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
          }`}
        >
        {preview ? (
          <img src={preview} alt="プレビュー" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
        ) : isConverting ? (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <ArrowPathIcon className="w-10 h-10 mb-3 text-gray-400 animate-spin" />
            <p className="mb-2 text-sm text-gray-500 font-semibold">HEIC画像を変換中...</p>
            <p className="text-xs text-gray-500">少々お待ちください</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
            <div className="mb-2 text-sm text-gray-500 flex items-center justify-center gap-1">
              <span className="font-semibold">クリックしてアップロード</span> またはドラッグ&ドロップ
              <HelpTooltip text={HELP_TEXTS.imageUpload} />
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP, HEICなど</p>
          </div>
        )}
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.heic,.heif"
          onChange={handleFileChange}
        />
      </label>
      )}
      {preview && !tutorialMode && (
        <button
          onClick={triggerFileSelect}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>画像を切り替える</span>
          <HelpTooltip text={HELP_TEXTS.imageSwitch} />
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
