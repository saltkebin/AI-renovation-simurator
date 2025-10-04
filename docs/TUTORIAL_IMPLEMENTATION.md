# チュートリアル機能実装ドキュメント

## 概要
AIリノベーションシステムに、ユーザーがアプリの使い方を学べるインタラクティブなチュートリアル機能を追加しました。

## 実装日
2025年10月4日

## 目的
- 新規ユーザーがアプリの使い方を直感的に理解できるようにする
- サンプル画像を使用してAPIコストなしで機能を体験できるようにする
- 実際の操作を体験しながら学べるインタラクティブな形式を提供する

## 実装内容

### 1. 作成したコンポーネント

#### TutorialPage.tsx
- **役割**: チュートリアル選択画面と実行画面のメインコンポーネント
- **場所**: `components/TutorialPage.tsx`
- **機能**:
  - 3つのチュートリアル（リノベーション、スケッチ→パース、外壁塗装）の選択画面
  - リノベーションチュートリアルの7ステップを管理
  - 自動画像読み込み、スタイル選択、画像生成のフローを実装

#### TutorialStep.tsx
- **役割**: 画面下部に固定表示されるステップ説明カード
- **場所**: `components/TutorialStep.tsx`
- **機能**:
  - プログレスバー表示
  - ステップのタイトル、説明、ヒントを表示
  - 「戻る」「次へ」「スキップ」「終了」ボタン

#### TutorialProgress.tsx
- **役割**: プログレスバーコンポーネント
- **場所**: `components/TutorialProgress.tsx`
- **機能**:
  - 現在のステップ数と進捗率を視覚的に表示
  - パーセンテージ表示

#### TutorialHighlight.tsx
- **役割**: UI要素をハイライトするスポットライトエフェクト
- **場所**: `components/TutorialHighlight.tsx`
- **機能**:
  - React Portalを使用してオーバーレイ表示
  - radial-gradientで特定の要素を強調
  - パルスアニメーションでボーダーを表示

### 2. データ定義

#### constants.ts の追加内容

```typescript
// チュートリアルステップの型定義
export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  hint?: string;
  action: 'auto' | 'click' | 'wait' | null;
  highlightTarget?: string;
  buttonText?: string;
}

// リノベーションチュートリアルの7ステップ
export const TUTORIAL_RENOVATION_STEPS: TutorialStep[] = [
  // ステップ1: ウェルカム画面
  // ステップ2: 画像アップロード（自動）
  // ステップ3: スタイル選択（インタラクティブ）
  // ステップ4: 画像生成（自動）
  // ステップ5: 微調整（オプション）
  // ステップ6: 見積もり作成（オプション）
  // ステップ7: 完了画面
];

// サンプル画像パス
export const TUTORIAL_SAMPLE_IMAGES = {
  renovation: {
    before: '/images/tutorial/sample-room-before.png',
    scandinavian: '/images/tutorial/sample-room-scandinavian.png',
    minimalist: '/images/tutorial/sample-room-minimalist.png',
  },
};
```

### 3. アイコンの追加

Icon.tsx に以下のアイコンを追加：
- `AcademicCapIcon` - 学士帽アイコン（チュートリアルのメインアイコン）
- `PlayCircleIcon` - 再生ボタンアイコン（開始ボタン用）
- `XIcon` - バツ印アイコン（終了ボタン用）
- `ArrowRightIcon` - 右矢印アイコン（次へボタン用）
- `LightBulbIcon` - 電球アイコン（ヒント表示用）

### 4. メインメニューへの統合

MainMenu.tsx の変更：
- チュートリアルボタンを追加（紫色のグラデーション）
- `onSelectApp` に 'tutorial' タイプを追加
- メール設定とユーザーガイドの間に配置

App.tsx の変更：
- `SelectedApp` 型に 'tutorial' を追加
- チュートリアルルートを追加
- TutorialPage コンポーネントをインポート

## チュートリアルのフロー

### リノベーションチュートリアル（7ステップ）

1. **ステップ1: ウェルカム画面**
   - チュートリアルの概要説明
   - 所要時間の表示（約3-5分）
   - 「開始する」ボタン

2. **ステップ2: 画像アップロード**
   - 自動でサンプル画像を読み込み（800ms後）
   - ローディング → 画像表示 → 確認メッセージ

3. **ステップ3: スタイル選択**
   - 12種類のスタイルボタンを表示
   - ユーザーがスタイルを選択（インタラクティブ）
   - 選択後、自動的に次のステップへ進む（500ms後）

4. **ステップ4: 画像生成**
   - AIが画像を生成する演出（1000ms後）
   - Before/After比較スライダーで結果を表示
   - ComparisonViewコンポーネントを使用

5. **ステップ5: 微調整（オプション）**
   - 生成された画像を表示
   - 「この画像を微調整する」ボタン
   - スキップ可能

6. **ステップ6: 見積もり作成（オプション）**
   - Before/After画像を並べて表示
   - 「概算見積もりを作成」ボタン
   - スキップ可能

7. **ステップ7: 完了画面**
   - チェックマークアイコンで完了を祝福
   - メインメニューへ戻るボタン
   - 次のステップの提案

## 技術的な実装詳細

### 状態管理

```typescript
// チュートリアルの状態
const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
const [currentStepIndex, setCurrentStepIndex] = useState(0);

// リノベーションチュートリアルの状態
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
const [generatedImage, setGeneratedImage] = useState<string | null>(null);
const [showComparison, setShowComparison] = useState(false);
```

### 自動アクションの実装

useEffectを使用してステップ変更時に自動アクションを実行：

```typescript
useEffect(() => {
  if (!activeTutorial) return;

  // 画面を上部にスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const currentStep = tutorial.steps[currentStepIndex];

  if (currentStep.action === 'auto') {
    if (currentStepIndex === 1) {
      // ステップ2: サンプル画像を自動読み込み
      setTimeout(() => {
        setUploadedImage(TUTORIAL_SAMPLE_IMAGES.renovation.before);
      }, 800);
    } else if (currentStepIndex === 3) {
      // ステップ4: 生成画像を自動表示
      setTimeout(() => {
        setGeneratedImage(TUTORIAL_SAMPLE_IMAGES.renovation.scandinavian);
        setShowComparison(true);
      }, 1000);
    }
  }
}, [currentStepIndex, activeTutorial]);
```

### スタイル選択の処理

```typescript
const handleStyleSelect = (styleId: string) => {
  setSelectedStyle(styleId);
  // ステップ3でスタイルを選択すると自動的に次へ進む
  if (currentStepIndex === 2) {
    setTimeout(() => {
      setCurrentStepIndex(3);
    }, 500);
  }
};
```

## サンプル画像の配置

### 必要な画像ファイル（PNG形式）

```
public/
└── images/
    └── tutorial/
        ├── sample-room-before.png         # 元の室内画像
        ├── sample-room-scandinavian.png   # 北欧風リノベーション後
        └── sample-room-minimalist.png     # ミニマリスト風（未使用）
```

## 発生した問題と解決策

### 問題1: INTERIOR_STYLESが存在しない
**エラー**: `The requested module '/constants.ts' does not provide an export named 'INTERIOR_STYLES'`

**原因**: constants.tsには`INTERIOR_STYLES`という名前のエクスポートがなく、`FURNITURE_STYLES`が正しい名前だった

**解決策**:
- インポート文を `FURNITURE_STYLES` に変更
- 全ての参照箇所を修正

### 問題2: レイアウトの問題でメインコンテンツが表示されない
**症状**: TutorialStepコンポーネントだけが表示され、メインコンテンツが見えない

**原因**: flexレイアウトの設定により、コンテンツが正しく表示されていなかった

**解決策**:
```typescript
// 修正前
<div className="flex items-center justify-center min-h-screen p-4 md:p-8 pb-64">

// 修正後
<div className="container mx-auto p-4 md:p-8 pb-80 pt-8">
```

### 問題3: インタラクティブ性の欠如
**症状**: 「次へ」ボタンを押すだけで画像やUIが表示されない

**原因**:
1. 自動アクションがhandleNext内でのみ実行され、useEffectで実行されていなかった
2. 各ステップの表示条件が厳しすぎた（画像がない場合に何も表示されない）

**解決策**:
1. useEffectでステップ変更時に自動アクションを実行
2. ローディング状態を追加（画像がない場合はスピナーを表示）
3. 各ステップの表示条件を緩和

## UIデザイン

### カラースキーム
- **メインカラー**: 紫色（purple-500 to indigo-600）
- **アクセントカラー**:
  - 成功: 緑色（green-50, green-600）
  - ヒント: アンバー色（amber-50, amber-400）
  - ローディング: インディゴ色（indigo-600）

### レイアウト
- **メインコンテンツ**: 画面中央、最大幅6xl（max-w-6xl）
- **ステップカード**: 画面下部に固定（fixed bottom-8）、最大幅2xl
- **パディング**: メインコンテンツ下部に80（pb-80）でカードと重ならないように調整

### レスポンシブデザイン
- グリッドレイアウトでモバイルとデスクトップに対応
- スタイル選択は2列グリッド
- Before/After表示はLGサイズ以上で2列、それ以下で1列

## 今後の拡張予定

### 未実装のチュートリアル
1. **スケッチ→パース**
   - 手書きスケッチから3Dパース生成の使い方
   - 現在「準備中」として表示

2. **外壁塗装**
   - 外壁塗装シミュレーションの使い方
   - 現在「準備中」として表示

### 改善案
1. チュートリアル完了状態の保存（LocalStorage）
2. チュートリアルの再開機能
3. スキップしたステップの記録
4. チュートリアル完了バッジの表示
5. より詳細なアニメーション効果
6. 音声ガイドの追加（オプション）

## 依存関係

### 使用しているライブラリ
- React（状態管理、useEffect）
- Tailwind CSS（スタイリング）
- ComparisonView（Before/After比較スライダー）

### インポートしているコンポーネント
- Icon（各種アイコン）
- TutorialStep（ステップ表示カード）
- TutorialProgress（プログレスバー）
- TutorialHighlight（ハイライトオーバーレイ）
- ComparisonView（画像比較）

### 定数データ
- TUTORIAL_RENOVATION_STEPS（ステップデータ）
- TUTORIAL_SAMPLE_IMAGES（サンプル画像パス）
- FURNITURE_STYLES（スタイル一覧）

## テスト方法

### 手動テスト手順

1. **チュートリアル開始**
   - メインメニューで「チュートリアル」ボタンをクリック
   - 3つのチュートリアルカードが表示されることを確認

2. **リノベーションチュートリアル**
   - 「リノベーション」カードの「開始する」ボタンをクリック
   - ステップ1のウェルカム画面が表示されることを確認

3. **ステップ2: 画像読み込み**
   - 「次へ」ボタンをクリック
   - 800ms後に自動的にサンプル画像が表示されることを確認

4. **ステップ3: スタイル選択**
   - 「次へ」ボタンをクリック
   - 12種類のスタイルボタンが表示されることを確認
   - 任意のスタイル（例: 北欧風）を選択
   - 500ms後に自動的に次のステップへ進むことを確認

5. **ステップ4: 画像生成**
   - 1000ms後に生成画像が表示されることを確認
   - Before/After比較スライダーが機能することを確認

6. **ステップ5-7**
   - 「次へ」または「スキップ」ボタンで進む
   - 各ステップで適切なUIが表示されることを確認
   - ステップ7で完了画面が表示されることを確認

7. **終了とスキップ**
   - 「終了」ボタンでメインメニューに戻ることを確認
   - 「スキップ」ボタンでメインメニューに戻ることを確認

## 注意事項

### パフォーマンス
- サンプル画像のサイズが大きい場合、初回読み込みに時間がかかる可能性がある
- 画像の最適化（圧縮、WebP形式など）を検討すること

### アクセシビリティ
- キーボードナビゲーションのサポートを追加することを推奨
- スクリーンリーダー対応のARIAラベルを追加することを推奨

### ブラウザ互換性
- モダンブラウザ（Chrome, Firefox, Safari, Edge）で動作確認済み
- IE11はサポート対象外

## まとめ

チュートリアル機能の実装により、新規ユーザーがAIリノベーションシステムの使い方を直感的に学べるようになりました。サンプル画像を使用することでAPIコストをかけずに機能を体験でき、実際の操作フローを理解できます。

今後は、スケッチ→パースと外壁塗装のチュートリアルを追加し、より充実したユーザー体験を提供する予定です。
