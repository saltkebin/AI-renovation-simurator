# アップデート情報の自動生成

新機能を追加してコミット・プッシュする際、Gitのコミット履歴から自動的にアップデート情報を生成します。

## 🚀 自動生成（推奨）

### 基本的な使い方

```bash
# 最新3件のコミットからアップデート情報を生成
npm run update-info

# 最新5件のコミットから生成
npm run update-info -- --commits 5
```

このコマンドを実行すると：
1. Gitのコミット履歴を読み取り
2. コミットメッセージを業者向けの分かりやすい文章に変換
3. `constants.ts` の `UPDATE_HISTORY` を自動更新

### コミットメッセージの書き方

**Conventional Commits形式を推奨：**

```bash
git commit -m "feat(exterior): 塗料カスタム入力機能"
git commit -m "fix(quotation): 見積もり計算の精度向上"
git commit -m "feat(paint): ツートンカラー分割比率選択"
```

形式: `<type>(<scope>): <message>`

- **type**: `feat`(新機能), `fix`(修正), `docs`(ドキュメント), `style`(デザイン)
- **scope**: `exterior`, `renovation`, `quotation`, `paint` など
- **message**: 簡潔な説明（日本語OK）

### 自動変換の例

| コミットメッセージ | 生成されるタイトル | 生成される説明 |
|-------------------|-------------------|---------------|
| `feat(exterior): 塗料カスタム入力` | 塗料カスタム入力 | 塗料カスタム入力機能を追加しました。 |
| `fix(paint): 色選択の不具合修正` | 色選択の不具合修正 | 色選択の不具合修正に関する問題を修正し、より使いやすくなりました。 |
| `feat: 外壁ツートンカラー対応` | 外壁ツートンカラー対応 | 外壁ツートンカラー対応機能を追加しました。 |

## 📝 手動編集（必要に応じて）

自動生成後、より詳しい説明が必要な場合は `constants.ts` を直接編集してください。

```typescript
export const UPDATE_HISTORY: UpdateInfo[] = [
  {
    date: '2025-10-02',  // ← Git履歴から自動取得
    title: '塗料カスタム入力機能を追加',  // ← 自動生成（編集可）
    description: '見積もり時に、シリコンやフッ素以外のこだわりの塗料を自由に入力できるようになりました。'  // ← 自動生成（編集可）
  },
  // ...
];
```

## ⚙️ ワークフロー例

```bash
# 1. 新機能を実装
# 2. コミット（分かりやすいメッセージで）
git add .
git commit -m "feat(exterior): 塗料種類にその他オプション追加"

# 3. アップデート情報を自動生成
npm run update-info

# 4. 生成された内容を確認（必要に応じて手動編集）
# constants.ts を開いて確認

# 5. プッシュ
git add constants.ts
git commit -m "docs: アップデート情報を更新"
git push
```

## 🔧 技術詳細

- スクリプト: `scripts/generate-update-info.js`
- Gitコマンドでコミット履歴を取得
- コミットメッセージを解析して業者向けの文章に変換
- 日付はコミット日時を自動取得
