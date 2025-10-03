# Gemini API セキュリティ設定ガイド

## 概要

このドキュメントでは、AIリノベーションアプリで使用しているGemini APIキーのセキュリティ設定手順を説明します。

## 現在のアーキテクチャ

### マルチテナント構成
- **テナント1**: airenovation2.web.app
- **テナント2**: renovation-sasaki.web.app (または対応するプロジェクト)
- **テナント3**: airenovation-horimoto.web.app (または対応するプロジェクト)

### API キー管理
- 各テナントは独立したFirebaseプロジェクトを持つ
- 各プロジェクトは専用のGemini API キーを使用
- API キーはフロントエンド（`VITE_GEMINI_API_KEY`）で直接使用
- GitHub Secretsで管理: `GEMINI_API_KEY_DEFAULT`, `GEMINI_API_KEY_HITOTOIRO`, `GEMINI_API_KEY_ISHIBASHIHOME`

## HTTPリファラー制限の設定手順

### 1. Google Cloud Console にアクセス

https://console.cloud.google.com/apis/credentials

### 2. 対象プロジェクトを選択

各テナントに対応するGCPプロジェクトを選択してください。

### 3. API キーを編集

1. 「認証情報」ページで該当するGemini API キーを選択
2. 「キーの制限」セクションに移動

### 4. アプリケーションの制限を設定

#### 4-1. 制限タイプを選択
**「HTTPリファラー（ウェブサイト）」** を選択

#### 4-2. リファラーURLを追加

「ウェブサイトの制限」で「項目を追加」をクリックし、以下のURLを追加：

**airenovation2 プロジェクトの場合:**
```
https://airenovation2.web.app/*
https://airenovation2.firebaseapp.com/*
```

**renovation-sasaki プロジェクトの場合:**
```
https://renovation-sasaki.web.app/*
https://renovation-sasaki.firebaseapp.com/*
```

**airenovation-horimoto プロジェクトの場合:**
```
https://airenovation-horimoto.web.app/*
https://airenovation-horimoto.firebaseapp.com/*
```

### 5. API の制限（推奨）

1. 「API の制限」セクションで **「キーを制限」** を選択
2. **「Generative Language API」** のみにチェックを入れる

これにより、このキーは Generative Language API (Gemini) 以外では使用できなくなります。

### 6. 保存

「保存」ボタンをクリックして設定を適用します。

## 開発環境用API キーの作成（推奨）

本番用のAPI キーにHTTPリファラー制限をかけると、ローカル開発環境（`localhost`）からはアクセスできなくなります。

### 開発用キーの作成手順

1. Google Cloud Console で「認証情報を作成」→「APIキー」を選択
2. 作成されたキーの名前を「Gemini API Key - Development」などに変更
3. HTTPリファラー制限で以下を追加：
```
http://localhost:*/*
http://127.0.0.1:*/*
```
4. API制限で「Generative Language API」のみを選択
5. `.env.local` ファイルに追加：
```
VITE_GEMINI_API_KEY=開発用のAPIキー
```

## セキュリティ上の注意事項

### ⚠️ 重要な制限事項
- HTTPリファラーはクライアント側で送信されるため、完全なセキュリティ保証にはなりません
- 悪意のあるユーザーがリファラーを偽装することは技術的に可能です
- しかし、カジュアルな不正使用や誤った使用の大部分を防ぐことができます

### 💡 今後のセキュリティ強化案

より強固なセキュリティが必要な場合は、以下の対策を検討してください：

1. **Firebase App Check の導入**
   - 正規のアプリからのリクエストであることを検証
   - リプレイアタックやボットからの保護

2. **Cloud Functions経由のAPI呼び出し**
   - API キーをバックエンドに隠蔽
   - レート制限やユーザー認証の追加
   - 注意: CORS設定に注意が必要（過去に実装を試みたが失敗）

3. **使用量アラートの設定**
   - Google Cloud Console で予算アラートを設定
   - 異常な使用量を早期に検知

## 設定確認方法

### 1. 制限が正しく適用されているか確認

1. Google Cloud Console で各APIキーの詳細を確認
2. 「アプリケーションの制限」が「HTTPリファラー」になっていることを確認
3. リファラーURLが正しく設定されていることを確認

### 2. 動作確認

1. 本番環境（各テナントのURL）でアプリにアクセス
2. AI画像生成機能やチャットボット機能が正常に動作することを確認
3. ブラウザの開発者ツールでエラーが出ていないことを確認

### 3. 制限の動作確認（オプション）

別のドメインから同じAPIキーを使おうとすると、以下のようなエラーが返されます：

```json
{
  "error": {
    "code": 403,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "PERMISSION_DENIED"
  }
}
```

## トラブルシューティング

### 問題: 本番環境でAPIが動作しない

**原因**: リファラーURLの設定ミス

**解決策**:
1. URLの末尾に `/*` が付いているか確認
2. `https://` が付いているか確認
3. `.web.app` と `.firebaseapp.com` の両方が登録されているか確認

### 問題: 設定したのに制限がかからない

**原因**: 設定の反映に時間がかかっている

**解決策**:
- 数分待ってから再度テスト
- ブラウザのキャッシュをクリア

### 問題: localhost で開発できない

**原因**: 本番用キーにリファラー制限がかかっている

**解決策**:
- 開発用のAPIキーを別途作成（上記参照）
- `.env.local` で開発用キーを使用

## 関連ファイル

- `.github/workflows/auto-deploy-all-clients.yml` - GitHub Actions デプロイ設定
- `services/geminiService.ts` - Gemini API呼び出しロジック
- `vite.config.ts` - 環境変数の設定

## 更新履歴

- 2025-01-03: 初版作成
  - HTTPリファラー制限の設定手順を追加
  - マルチテナント構成の説明を追加
  - セキュリティ強化案を追加
