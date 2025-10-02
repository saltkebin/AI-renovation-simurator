import React, { useState, useEffect, useMemo } from 'react';
import type { QuotationResult, AppMode, PaintTypeId } from '../types';
import { CalculatorIcon, ArrowUturnLeftIcon, SpinnerIcon, ArrowDownTrayIcon, PencilIcon, TrashIcon, PlusCircleIcon } from './Icon';
import { PAINT_TYPES } from '../constants';

interface QuotationPanelProps {
  appMode: AppMode;
  onGetQuote: (floor: string, wall: string, casing: string) => void;
  onGetExteriorQuote: (wallArea: string, paintType: string) => void;
  onExit: () => void;
  isQuoting: boolean;
  quotationResult: QuotationResult | null;
  error: string | null;
  onDownloadImage: (editedQuotation: QuotationResult | null) => void;
}

// Helper to convert full-width characters to half-width
const toHalfWidth = (str: string): string => {
  if (!str) return '';
  return str.replace(/[！-～]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
};

const parseCost = (costStr: string): { min: number, max: number } => {
  if (!costStr) return { min: 0, max: 0 };
  
  const halfWidthStr = toHalfWidth(costStr);
  const isManYen = halfWidthStr.includes('万');
  const factor = isManYen ? 10000 : 1;

  // New logic: Extract all number sequences from the string.
  const numbers = halfWidthStr.match(/\d+(\.\d+)?/g)?.map(Number);

  if (!numbers || numbers.length === 0) return { min: 0, max: 0 };

  const min = (numbers[0] || 0) * factor;
  const max = (numbers[1] ?? numbers[0] ?? 0) * factor;
  
  return { min, max };
};

const formatToManYen = (num: number): string => {
  if (num === 0) return '0円';
  const manYen = num / 10000;
  return `${Math.round(manYen * 10) / 10}万円`;
};

interface EditableItem {
  name: string;
  costMin: number; // Stored in ManYen units
  costMax: number; // Stored in ManYen units
}

const QuotationPanel: React.FC<QuotationPanelProps> = ({ appMode, onGetQuote, onGetExteriorQuote, onExit, isQuoting, quotationResult, error, onDownloadImage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResult, setEditedResult] = useState<QuotationResult | null>(null);

  // Renovation mode states
  const [floor, setFloor] = useState('');
  const [wall, setWall] = useState('');
  const [casing, setCasing] = useState('');

  // Exterior painting mode states
  const [wallArea, setWallArea] = useState('');
  const [paintType, setPaintType] = useState<PaintTypeId>('ai_choice');
  const [customPaintType, setCustomPaintType] = useState('');

  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [editableNotes, setEditableNotes] = useState('');

  useEffect(() => {
    if (quotationResult) {
      setEditedResult(quotationResult);
      setIsEditing(false);
    }
  }, [quotationResult]);

  useEffect(() => {
    if (isEditing && editedResult) {
      const parsedItems = editedResult.construction_items.map(item => {
        let costString = item.cost_range;
        let nameString = item.name;

        // Try to parse cost_range first
        let parsed = parseCost(costString);

        // If cost_range gives no numbers, try parsing the name field as a fallback
        if ((parsed.min === 0 && parsed.max === 0) && item.name.match(/\d/)) {
            const nameParsed = parseCost(nameString);
            if (nameParsed.min !== 0 || nameParsed.max !== 0) {
                parsed = nameParsed;
                // Strip the cost part from the name string for cleaner display
                const match = nameString.match(/\d/);
                if (match && match.index) {
                    nameString = nameString.substring(0, match.index).trim();
                }
            }
        }
        
        return { name: nameString, costMin: parsed.min / 10000, costMax: parsed.max / 10000 };
      });
      setEditableItems(parsedItems);
      setEditableNotes(editedResult.notes);
    }
  }, [isEditing, editedResult]);

  const calculatedTotal = useMemo(() => {
    const totalMin = editableItems.reduce((sum, item) => sum + item.costMin, 0);
    const totalMax = editableItems.reduce((sum, item) => sum + item.costMax, 0);
    return { totalMin, totalMax };
  }, [editableItems]);

  const handleItemChange = (index: number, field: keyof EditableItem, value: string | number) => {
    const newItems = [...editableItems];
    const item = newItems[index];
    if (field === 'name') {
        item.name = value as string;
    } else {
        item[field] = Number(value) || 0;
    }
    setEditableItems(newItems);
  };

  const handleAddItem = () => {
    setEditableItems([...editableItems, { name: '新規項目', costMin: 0, costMax: 0 }]);
  };

  const handleDeleteItem = (index: number) => {
    setEditableItems(editableItems.filter((_, i) => i !== index));
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleSaveEditing = () => {
    const newConstructionItems = editableItems.map(item => ({
      name: item.name,
      cost_range: item.costMin === item.costMax ? formatToManYen(item.costMin * 10000) : `${formatToManYen(item.costMin * 10000)}〜${formatToManYen(item.costMax * 10000)}`
    }));
    const newTotalCostRange = calculatedTotal.totalMin === calculatedTotal.totalMax ? formatToManYen(calculatedTotal.totalMin * 10000) : `${formatToManYen(calculatedTotal.totalMin * 10000)}〜${formatToManYen(calculatedTotal.totalMax * 10000)}`;

    setEditedResult({
      construction_items: newConstructionItems,
      total_cost_range: newTotalCostRange,
      notes: editableNotes,
    });
    setIsEditing(false);
  };

  const renderRenovationInputs = () => (
    <div className="space-y-4">
        <div>
            <label htmlFor="floor-material" className="block text-sm font-medium text-gray-700">床材</label>
            <input type="text" id="floor-material" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="例: 無垢材フローリング" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="wall-material" className="block text-sm font-medium text-gray-700">壁材</label>
            <input type="text" id="wall-material" value={wall} onChange={(e) => setWall(e.target.value)} placeholder="例: 珪藻土、漆喰" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="casing-material" className="block text-sm font-medium text-gray-700">ケーシング (窓枠・ドア枠など)</label>
            <input type="text" id="casing-material" value={casing} onChange={(e) => setCasing(e.target.value)} placeholder="例: 木製、アルミ" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
        </div>
        <button onClick={() => onGetQuote(floor, wall, casing)} disabled={isQuoting} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors">
            {isQuoting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <CalculatorIcon className="w-5 h-5" />}
            <span>{isQuoting ? 'AIが見積もり中...' : 'AI概算見積もりを取得'}</span>
        </button>
    </div>
  );

  const renderExteriorInputs = () => (
    <div className="space-y-4">
        <div>
            <label htmlFor="wall-area" className="block text-sm font-medium text-gray-700">外壁面積 (任意)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="wall-area"
                value={wallArea}
                onChange={(e) => setWallArea(e.target.value)}
                placeholder="例: 120"
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">㎡</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">未入力の場合、AIが画像から推定します</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">塗料の種類 (任意)</label>
            <div className="space-y-2">
              {PAINT_TYPES.map((type) => (
                <div key={type.id}>
                  <div
                    onClick={() => setPaintType(type.id)}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      paintType === type.id
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-300 bg-white hover:border-emerald-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      id={`paint-type-${type.id}`}
                      type="radio"
                      name="paint-type"
                      value={type.id}
                      checked={paintType === type.id}
                      onChange={(e) => setPaintType(e.target.value as PaintTypeId)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                      readOnly
                    />
                    <div className="ml-3 flex-1">
                      <span className={`font-medium ${paintType === type.id ? 'text-emerald-900' : 'text-gray-700'}`}>
                        {type.name}
                      </span>
                      <span className={`ml-2 text-sm ${paintType === type.id ? 'text-emerald-700' : 'text-gray-500'}`}>
                        ({type.description})
                      </span>
                    </div>
                  </div>
                  {type.id === 'other' && paintType === 'other' && (
                    <div className="ml-7 mt-2">
                      <input
                        type="text"
                        value={customPaintType}
                        onChange={(e) => setCustomPaintType(e.target.value)}
                        placeholder="例: 特殊防水塗料、ナノテク塗料など"
                        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
        </div>

        <button onClick={() => onGetExteriorQuote(wallArea, paintType === 'other' && customPaintType ? customPaintType : paintType)} disabled={isQuoting} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors">
            {isQuoting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <CalculatorIcon className="w-5 h-5" />}
            <span>{isQuoting ? 'AIが見積もり中...' : 'AIおまかせ見積もりを取得'}</span>
        </button>
    </div>
  );

  const renderResult = () => {
    if (!editedResult) return null;

    if (isEditing) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">見積もり内容を編集</h3>
            <div>
              <button onClick={handleCancelEditing} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors">キャンセル</button>
              <button onClick={handleSaveEditing} className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-md ml-2 transition-colors">保存</button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">合計費用 (自動計算)</label>
            <div className="mt-1 text-center bg-gray-100 text-gray-800 p-3 rounded-lg">
              <p className="text-2xl font-bold">{`${calculatedTotal.totalMin.toLocaleString()}〜${calculatedTotal.totalMax.toLocaleString()} 万円`}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">工事項目</label>
              <button onClick={handleAddItem} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800 font-semibold">
                <PlusCircleIcon className="w-5 h-5"/>
                追加
              </button>
            </div>
            {editableItems.map((item, index) => (
              <div key={index} className="p-3 rounded-md bg-gray-50 border space-y-2">
                <div className="flex justify-between items-center">
                    <input type="text" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} className="flex-grow p-2 border-gray-300 rounded-md" placeholder="項目名" />
                    <button onClick={() => handleDeleteItem(index)} className="ml-2 p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <input type="number" value={item.costMin} onChange={e => handleItemChange(index, 'costMin', e.target.value)} className="w-full p-2 border-gray-300 rounded-md" />
                    <span className="text-gray-500">〜</span>
                    <input type="number" value={item.costMax} onChange={e => handleItemChange(index, 'costMax', e.target.value)} className="w-full p-2 border-gray-300 rounded-md" />
                    <span className="text-gray-600 font-medium">万円</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">備考</label>
            <textarea value={editableNotes} onChange={e => setEditableNotes(e.target.value)} rows={4} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-800">AIによる概算見積もり</h3>
            <p className="text-sm text-gray-500">内容の編集も可能です</p>
          </div>
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-900 font-semibold">
            <PencilIcon className="w-4 h-4" />
            編集
          </button>
        </div>

        <div className="text-center bg-emerald-600 text-white p-4 rounded-lg">
          <p className="text-sm">合計費用（税別）</p>
          <p className="text-3xl font-bold">{editedResult.total_cost_range}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">■ 工事項目</h4>
          <ul className="space-y-2 text-sm">
            {editedResult.construction_items.map((item, index) => (
              <li key={index} className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium text-gray-800">{item.cost_range}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">■ 備考</h4>
          <p className="text-xs text-gray-500 whitespace-pre-wrap bg-gray-100 p-3 rounded-md">{editedResult.notes}</p>
        </div>
        
        <button
          onClick={() => onDownloadImage(editedResult)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-emerald-800 bg-emerald-100 rounded-md hover:bg-emerald-200 transition-colors"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>見積もり画像をダウンロード</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-700">3. 見積もり</h2>
        <button onClick={onExit} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-semibold">
          <ArrowUturnLeftIcon className="w-4 h-4" />
          <span>比較表示に戻る</span>
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
          <p className="font-bold">エラー</p>
          <p>{error}</p>
        </div>
      )}

      {quotationResult ? renderResult() : (appMode === 'exterior' ? renderExteriorInputs() : renderRenovationInputs())}
    </div>
  );
};

export default QuotationPanel;