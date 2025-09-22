
import React, { useState, useEffect } from 'react';
import type { QuotationResult, QuotationItem } from '../types';
import { SpinnerIcon, CalculatorIcon, DocumentTextIcon, ArrowUturnLeftIcon, DocumentArrowDownIcon, PlusCircleIcon, TrashIcon } from './Icon';
import ErrorDisplay from './ErrorDisplay';

interface QuotationPanelProps {
  onGetQuote: (floor: string, wall: string, casing: string) => void;
  onExit: () => void;
  isQuoting: boolean;
  quotationResult: QuotationResult | null;
  error: string | null;
  onDownloadImage: (data: QuotationResult) => void;
}

// Editable state adds min/max cost properties for easier manipulation
type EditableQuotationItem = QuotationItem & { minCost: string; maxCost: string; };
type EditableQuotationResult = Omit<QuotationResult, 'construction_items'> & {
  construction_items: EditableQuotationItem[];
};


const QuotationPanel: React.FC<QuotationPanelProps> = ({ onGetQuote, onExit, isQuoting, quotationResult, error, onDownloadImage }) => {
  const [floorMaterial, setFloorMaterial] = useState('');
  const [wallMaterial, setWallMaterial] = useState('');
  const [casingMaterial, setCasingMaterial] = useState('');
  const [editableResult, setEditableResult] = useState<EditableQuotationResult | null>(null);

  const parseCost = (costRange: string): { min: number; max: number } => {
    const numbers = costRange.match(/(\d+(\.\d+)?)/g)?.map(parseFloat);

    if (!numbers || numbers.length === 0) {
      return { min: 0, max: 0 };
    }
    if (numbers.length === 1) {
      return { min: numbers[0], max: numbers[0] };
    }
    return { min: Math.min(...numbers), max: Math.max(...numbers) };
  };
  
  useEffect(() => {
    if (quotationResult) {
      const editableItems = quotationResult.construction_items.map(item => {
        const { min, max } = parseCost(item.cost_range);
        return {
          ...item,
          minCost: String(min),
          maxCost: String(max),
        };
      });
      setEditableResult({ ...quotationResult, construction_items: editableItems });
    } else {
        setEditableResult(null);
    }
  }, [quotationResult]);

  const updateItemsAndRecalculate = (updatedItems: EditableQuotationItem[]) => {
    if (!editableResult) return;
    
    let minTotal = 0;
    let maxTotal = 0;

    updatedItems.forEach(item => {
        const itemMin = parseFloat(item.minCost) || 0;
        const itemMax = parseFloat(item.maxCost) || itemMin;
        minTotal += itemMin;
        maxTotal += itemMax;
    });

    minTotal = Math.round(minTotal * 10) / 10;
    maxTotal = Math.round(maxTotal * 10) / 10;

    const newTotalCostRange = minTotal === maxTotal
      ? `${maxTotal}万円`
      : `${minTotal}万円〜${maxTotal}万円`;
      
    setEditableResult({
      ...editableResult,
      construction_items: updatedItems,
      total_cost_range: newTotalCostRange
    });
  };

  const handleAddItem = () => {
    if (!editableResult) return;
    const newItem: EditableQuotationItem = {
      name: '',
      cost_range: '0万円',
      minCost: '0',
      maxCost: '0',
    };
    const updatedItems = [...editableResult.construction_items, newItem];
    updateItemsAndRecalculate(updatedItems);
  };
  
  const handleDeleteItem = (indexToDelete: number) => {
    if (!editableResult) return;
    const updatedItems = editableResult.construction_items.filter((_, index) => index !== indexToDelete);
    updateItemsAndRecalculate(updatedItems);
  };

  const handleItemNameChange = (index: number, value: string) => {
    if (!editableResult) return;
    const updatedItems = [...editableResult.construction_items];
    updatedItems[index] = { ...updatedItems[index], name: value };
    setEditableResult({ ...editableResult, construction_items: updatedItems });
  };

  const handleCostChange = (index: number, type: 'min' | 'max', value: string) => {
    if (!editableResult) return;

    const updatedItems = [...editableResult.construction_items];
    const currentItem = { ...updatedItems[index] };

    if (type === 'min') {
        currentItem.minCost = value;
    } else {
        currentItem.maxCost = value;
    }
    
    const minNum = parseFloat(currentItem.minCost);
    const maxNum = parseFloat(currentItem.maxCost);

    // Auto-adjust if min > max to prevent invalid ranges
    if (!isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
        if (type === 'min') {
            currentItem.maxCost = value;
        } else {
            currentItem.minCost = value;
        }
    }
    
    // Reconstruct the original cost_range string from numbers
    const finalMin = parseFloat(currentItem.minCost) || 0;
    const finalMax = parseFloat(currentItem.maxCost) || finalMin;

    currentItem.cost_range = finalMin === finalMax 
        ? `${finalMax}万円` 
        : `${finalMin}万円〜${finalMax}万円`;
    
    updatedItems[index] = currentItem;
    
    updateItemsAndRecalculate(updatedItems);
  };

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editableResult) return;
    setEditableResult({ ...editableResult, total_cost_range: e.target.value });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editableResult) return;
    setEditableResult({ ...editableResult, notes: e.target.value });
  };

  const handleGetQuoteClick = () => {
    onGetQuote(floorMaterial, wallMaterial, casingMaterial);
  };
  
  const handleDownloadClick = () => {
    if (editableResult) {
        onDownloadImage(editableResult);
    }
  };

  const loadingMessages = [
    "変更点を分析中...",
    "工事項目を洗い出しています...",
    "費用を計算中...",
    "見積もりを作成しています...",
  ];
  
  const QuotationLoader: React.FC = () => {
    const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
      }, 2500);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="text-center py-8">
        <SpinnerIcon className="w-10 h-10 mx-auto animate-spin text-emerald-500" />
        <p className="mt-4 text-emerald-800 font-semibold">{loadingMessages[currentMessageIndex]}</p>
      </div>
    );
  };

  const renderMaterialInputs = () => (
    <div className="pt-4 space-y-4">
        <p className="text-sm text-center text-gray-600">より正確な見積もりのため、使用したい素材を指定できます（任意）。</p>
        <div className="space-y-3">
            <div>
                <label htmlFor="floor-material" className="block text-sm font-medium text-gray-700 mb-1">① 床材</label>
                <input
                    type="text"
                    id="floor-material"
                    value={floorMaterial}
                    onChange={(e) => setFloorMaterial(e.target.value)}
                    placeholder="例：オーク無垢材、タイルカーペット"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    disabled={isQuoting}
                />
            </div>
             <div>
                <label htmlFor="wall-material" className="block text-sm font-medium text-gray-700 mb-1">② 壁材</label>
                <input
                    type="text"
                    id="wall-material"
                    value={wallMaterial}
                    onChange={(e) => setWallMaterial(e.target.value)}
                    placeholder="例：珪藻土、アクセントクロス"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    disabled={isQuoting}
                />
            </div>
             <div>
                <label htmlFor="casing-material" className="block text-sm font-medium text-gray-700 mb-1">③ ケーシング (窓枠/ドア枠など)</label>
                <input
                    type="text"
                    id="casing-material"
                    value={casingMaterial}
                    onChange={(e) => setCasingMaterial(e.target.value)}
                    placeholder="例：木製ケーシング、アルミ"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    disabled={isQuoting}
                />
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start pb-2 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-bold text-gray-800">3. 見積もりモード</h3>
          <p className="text-sm text-gray-600 mt-1">AIが概算費用を算出します。</p>
        </div>
        <button 
          onClick={onExit}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors flex-shrink-0 ml-4"
          aria-label="比較表示に戻る"
        >
          <ArrowUturnLeftIcon className="w-4 h-4" />
          比較に戻る
        </button>
      </div>
      
      {!quotationResult && !isQuoting && (
        <div className="space-y-4">
            {renderMaterialInputs()}
            <p className="text-sm text-center text-gray-600 pt-2">準備ができたら下のボタンを押してください。</p>
            <button
            onClick={handleGetQuoteClick}
            disabled={isQuoting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
            <CalculatorIcon className="w-5 h-5" />
            <span>AIに見積もりを依頼</span>
            </button>
        </div>
      )}

      {isQuoting && <QuotationLoader />}

      {error && !isQuoting && (
        <div className="mt-4">
          <ErrorDisplay error={error} />
        </div>
      )}

      {editableResult && !isQuoting && (
        <div className="pt-4 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6 text-emerald-600" />
                <span>AI概算見積もり <span className="text-sm font-normal text-gray-500">(編集可能)</span></span>
              </h4>
              <button
                onClick={handleDownloadClick}
                className="flex items-center gap-1.5 px-3 py-1 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-md"
                title="見積もり画像をダウンロード"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                <span>保存</span>
              </button>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg text-center mb-4">
              <p className="text-sm font-semibold text-emerald-800">合計費用（概算）</p>
              <input
                type="text"
                value={editableResult.total_cost_range}
                onChange={handleTotalChange}
                className="w-full text-center text-3xl font-bold text-emerald-900 tracking-tight bg-transparent focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded-md py-1"
                aria-label="合計費用"
              />
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-bold text-gray-700">工事項目</h5>
              <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                  title="工事項目を追加"
              >
                  <PlusCircleIcon className="w-5 h-5" />
                  <span>項目を追加</span>
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              {editableResult.construction_items.map((item, index) => (
                <li key={index} className="flex flex-col gap-2 p-2 bg-gray-50 rounded-md">
                   <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemNameChange(index, e.target.value)}
                            className="flex-grow p-1.5 text-gray-700 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 transition-shadow"
                            aria-label={`工事項目 ${index + 1} 名称`}
                        />
                        <button
                            onClick={() => handleDeleteItem(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            title="この項目を削除"
                            aria-label={`工事項目 ${index + 1} を削除`}
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                   </div>
                    <div className="w-full flex items-center justify-end gap-1">
                        <input
                            type="number"
                            value={item.minCost}
                            onChange={(e) => handleCostChange(index, 'min', e.target.value)}
                            className="w-16 p-1.5 text-right font-semibold text-gray-800 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 transition-shadow"
                            aria-label={`工事項目 ${index + 1} 最低費用`}
                            step="1"
                            min="0"
                        />
                        <span className="text-gray-600">〜</span>
                        <input
                            type="number"
                            value={item.maxCost}
                            onChange={(e) => handleCostChange(index, 'max', e.target.value)}
                            className="w-16 p-1.5 text-right font-semibold text-gray-800 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 transition-shadow"
                            aria-label={`工事項目 ${index + 1} 最高費用`}
                            step="1"
                            min="0"
                        />
                        <span className="font-semibold text-gray-800 shrink-0">万円</span>
                    </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <h5 className="font-bold text-gray-700 mb-1">備考</h5>
               <textarea
                value={editableResult.notes}
                onChange={handleNotesChange}
                rows={4}
                className="w-full text-xs text-gray-600 leading-relaxed bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 p-2 transition-shadow"
                aria-label="備考"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <h4 className="text-md font-bold text-gray-700 mb-2">条件を変更して再見積もり</h4>
             {renderMaterialInputs()}
          </div>

          <button
            onClick={handleGetQuoteClick}
            disabled={isQuoting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
          >
            <CalculatorIcon className="w-5 h-5" />
            <span>もう一度見積もる</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default QuotationPanel;
