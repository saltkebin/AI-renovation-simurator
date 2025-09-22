
import React, { useState, useRef, useId, useEffect } from 'react';
import { UploadIcon, ArrowPathIcon } from './Icon';
import heic2any from 'heic2any';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  image: string | null;
  onError: (message: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, image, onError }) => {
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

  return (
    <div>
      <label
        htmlFor={fileInputId}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
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
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">クリックしてアップロード</span> またはドラッグ&ドロップ
            </p>
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
      {preview && (
        <button
          onClick={triggerFileSelect}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>画像を切り替える</span>
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
