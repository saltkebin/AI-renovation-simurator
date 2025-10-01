# 外壁塗装シミュレーション機能 実装ドキュメント

## 概要

AIrenovation-appに外壁塗装シミュレーション機能を実装しました。建物の外観写真から、構造を保ったまま外壁の色と素材のみを変更できる機能です。

## 実装日

2025年10月1日

## 機能の構成

### 1. モード階層構造の変更

**変更前:**
- リノベーションモード
- スケッチ→パースモード

**変更後:**
- ①リノベーションモード
- ②外観モード
  - スケッチ→パース
  - 外壁塗装シミュレーション

### 2. 型定義の変更 (`types.ts`)

```typescript
// AppMode型の変更
export type AppMode = 'renovation' | 'exterior';

// 外観モードのサブモード定義
export type ExteriorSubMode = 'sketch2arch' | 'exterior_painting';

// 外壁塗装用の型定義
export interface ExteriorColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface ExteriorMaterialOption {
  id: string;
  name: string;
  promptFragment: string;
}
```

### 3. 定数定義 (`constants.ts`)

#### カラーパレット（10色）

```typescript
export const EXTERIOR_COLORS: ExteriorColorOption[] = [
  { id: 'white', name: 'ホワイト', hex: '#FFFFFF' },
  { id: 'cream', name: 'クリーム', hex: '#FFF8DC' },
  { id: 'beige', name: 'ベージュ', hex: '#F5F5DC' },
  { id: 'light_gray', name: 'ライトグレー', hex: '#D3D3D3' },
  { id: 'gray', name: 'グレー', hex: '#808080' },
  { id: 'dark_gray', name: 'ダークグレー', hex: '#505050' },
  { id: 'brown', name: 'ブラウン', hex: '#8B4513' },
  { id: 'navy', name: 'ネイビー', hex: '#1E3A5F' },
  { id: 'green', name: 'グリーン', hex: '#556B2F' },
  { id: 'black', name: 'ブラック', hex: '#2C2C2C' }
];
```

#### 素材オプション（6種類）

```typescript
export const EXTERIOR_MATERIALS: ExteriorMaterialOption[] = [
  { id: 'siding', name: 'サイディング', promptFragment: '...' },
  { id: 'stucco', name: '塗り壁', promptFragment: '...' },
  { id: 'tile', name: 'タイル', promptFragment: '...' },
  { id: 'wood', name: '木材', promptFragment: '...' },
  { id: 'brick', name: 'レンガ', promptFragment: '...' },
  { id: 'concrete', name: 'コンクリート', promptFragment: '...' }
];
```

## UI実装詳細

### 1. サブモード選択画面

外観モード選択時、2つのカードが横並びで表示されます：

- **スケッチ→パース**: 手描きスケッチからフォトリアルなパースを生成
- **外壁塗装**: 建物の外壁色・素材をシミュレーション

各カードには：
- Before/Afterのビジュアル表現
- ホバーアニメーション
- 選択状態のチェックマーク表示

### 2. 外壁塗装パネル - タブ構成

#### かんたんタブ

1. **AIおまかせ一発塗装**
   - ボタン1つで最適な外壁デザインを自動生成
   - グラデーションボタンで視覚的に目立つデザイン

2. **カラー別おすすめスタイル（アコーディオン形式）**
   - 6つのカラーカテゴリー
   - 合計22種類のプリセットスタイル

   **カテゴリー構成:**
   - 白系（3種類）
   - ベージュ系（3種類）
   - グレー系（4種類）
   - ブラウン系（3種類）
   - ダーク系（4種類）
   - グリーン系（3種類）

   各プリセットには：
   - カラーブロック（12x12）
   - スタイル名
   - 「色 × 素材」の組み合わせ表示
   - ワンクリック生成機能

#### 詳細設定タブ

1. **プリセットカラー選択（10色パレット）**
   - グリッド形式で表示
   - 選択時のリング＆スケールアニメーション
   - カラー名のタグ表示

2. **カスタムカラー（RGB調整）** ⭐ 新機能
   - R, G, B各チャンネルを0-255で調整可能
   - リアルタイムプレビュー表示
   - RGB値とHEX値の両方を表示
   - スライダー操作時、自動的にプリセット選択を解除

3. **外壁素材選択（オプション）**
   - 6種類の素材から選択
   - グリッド形式で2列表示

4. **追加の指示（オプション）**
   - カスタムテキスト入力
   - 例：「1階と2階で色を変えてツートンカラーにしてください」

5. **リセット機能**
   - 全選択をクリア
   - RGB値も初期値（255, 255, 255）にリセット

## プロンプト生成ロジック

### 基本制約プロンプト

建物の構造を保つため、以下の要素を変更しないよう強く制約：

```
重要な制約：この建物の外観写真について、以下の要素は絶対に変更しないでください：
- 建物の構造（柱、梁、基礎）
- 建物の形状（高さ、幅、奥行き）
- 窓の位置、大きさ、形状
- ドアの位置、大きさ、形状
- 屋根の形状、色、素材
- 周囲の環境（植栽、地面、空、背景）
- 建物の配置や向き

変更してよいのは外壁の表面の色と質感のみです。
```

### 色指定の優先順位

1. **プリセット色が選択されている場合**:
   ```
   外壁の色を{色名}（16進数カラーコード: {hex}）に変更してください。
   この色は外壁の表面のみに適用し、窓枠やドア、屋根には適用しないでください。
   ```

2. **プリセット未選択の場合（カスタムRGB使用）**:
   ```
   外壁の色をRGB({R}, {G}, {B})（16進数カラーコード: {HEX}）に変更してください。
   この色は外壁の表面のみに適用し、窓枠やドア、屋根には適用しないでください。
   ```

## コンポーネントの状態管理

### 新規追加の状態変数

```typescript
const [exteriorPaintingActiveTab, setExteriorPaintingActiveTab] =
  useState<'easy' | 'detailed'>('easy');
const [selectedExteriorColor, setSelectedExteriorColor] = useState<string>('');
const [selectedExteriorMaterial, setSelectedExteriorMaterial] = useState<string>('');
const [exteriorCustomPrompt, setExteriorCustomPrompt] = useState('');
const [customR, setCustomR] = useState<number>(255);
const [customG, setCustomG] = useState<number>(255);
const [customB, setCustomB] = useState<number>(255);
const [exteriorPresetOpenAccordion, setExteriorPresetOpenAccordion] =
  useState<string | null>(null);
```

### ヘルパー関数

```typescript
// RGB→HEX変換
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

// リセット処理
const handleResetSelection = () => {
  setSelectedExteriorColor('');
  setSelectedExteriorMaterial('');
  setExteriorCustomPrompt('');
  setCustomR(255);
  setCustomG(255);
  setCustomB(255);
};
```

## ファイル変更一覧

### 主要な変更ファイル

1. **types.ts**
   - `AppMode`型の変更
   - `ExteriorSubMode`型の追加
   - 外壁塗装関連の型定義追加

2. **constants.ts**
   - `EXTERIOR_COLORS`配列の追加
   - `EXTERIOR_MATERIALS`配列の追加

3. **App.tsx**
   - `exteriorSubMode`状態管理の追加
   - モード選択UIの更新
   - `handleGenerate`関数の更新

4. **RenovationPanel.tsx**
   - サブモード選択カードUI
   - 外壁塗装パネルの実装
   - かんたん/詳細設定タブの実装
   - RGBカラーピッカーの実装
   - プリセットスタイルアコーディオンの実装

## 今後の拡張可能性

### 検討事項

1. **カラーパレットの拡張**
   - ユーザー定義カラーの保存機能
   - カラーヒストリー機能

2. **プリセットスタイルの追加**
   - 地域別スタイル（欧州、アジアなど）
   - 時代別スタイル（モダン、クラシックなど）

3. **比較機能**
   - 複数の配色を並べて比較
   - Before/After スライダー

4. **保存・共有機能**
   - お気に入りスタイルの保存
   - シミュレーション結果のPDF出力

5. **AI提案の強化**
   - 周辺環境を考慮した配色提案
   - 季節・時間帯に応じた見え方シミュレーション

## 技術的な注意点

### Gemini APIへのプロンプト送信

- `onGenerate('partial', finalPrompt)`で送信
- `mode='partial'`を使用することで既存のリノベーション処理と統合

### レスポンシブデザイン

- モバイル画面でもカードは横並び（`grid-cols-2`）
- タブ切り替えは小画面でも見やすいデザイン

### パフォーマンス

- RGB値変更時の再レンダリングは最適化済み
- プリセット選択とカスタムRGBの排他制御を実装

## バグ修正履歴

### 2025-10-01

- ✅ カード表示がモバイルで縦並びになっていた問題を修正（`grid-cols-1 md:grid-cols-2` → `grid-cols-2`）
- ✅ RGB調整時にプリセット選択が残る問題を修正（自動クリア処理を追加）

## 実装完了状況

- ✅ 外観モード階層構造の実装
- ✅ サブモード選択UIの実装
- ✅ 外壁塗装基本機能（色・素材選択）
- ✅ かんたん/詳細設定タブの分割
- ✅ プリセットスタイル（22種類、6カテゴリー）
- ✅ RGBカラーピッカー（0-255スライダー×3）
- ✅ プロンプト生成ロジックの改善
- ✅ ツートンカラー機能（上下・左右の2色配色）
- ✅ 商品タブの追加（塗料商品DB連携準備）

---

## Phase 1 追加機能（2025-10-02実装）

### ツートンカラー機能

**配色パターン:**
- 1色（従来通り）
- 上下2色（水平分割）
- 左右2色（垂直分割）

**第2の色選択:**
- プリセットカラー10色から選択可能
- RGBカスタムカラー調整
- リアルタイムプレビュー表示

**分割比率:**
- 30% / 70%
- 50% / 50%
- 70% / 30%

**プロンプト生成例:**
```
外壁を水平に2色に分けてツートンカラーにしてください：
- 上部（建物の70%）: ホワイト（カラーコード: #FFFFFF）
- 下部（建物の30%）: ダークグレー（カラーコード: #5A5A5A）
境界線は自然な水平ラインで、建物の構造に沿って区切ってください。
```

### 商品タブ

**概要:**
- 外壁塗装パネルに「商品」タブを追加
- 実際の塗料商品データベースと連携予定
- 現在はプレースホルダー表示

**今後の実装予定:**
- 塗料カテゴリーフィルタ（シリコン、フッ素、無機、遮熱）
- 商品カード表示（画像、名前、メーカー、単価、耐用年数）
- 選択した商品の色情報をプロンプトに反映

---

**実装担当**: Claude Code
**レビュー**: 未実施
**テスト**: 手動テスト済み（UI表示確認）
