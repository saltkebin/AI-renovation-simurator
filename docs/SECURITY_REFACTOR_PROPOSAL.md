# APIキーのセキュリティアーキテクチャ改善提案

**ステータス: ✅ 実装完了 (2025/10/03)**

このドキュメントは、アプリケーション全体のGemini APIキーの取り扱いに関する現在のセキュリティリスクと、その解決策についてまとめたものです。

## 1. 現状の課題：APIキーのフロントエンド漏洩

**現状の構成:**
現在、AIリノベーションの画像生成機能と、各種チャットボット機能は、`VITE_GEMINI_API_KEY`という環境変数を使ってAPIキーをフロントエンドのJavaScriptに直接埋め込んでいます。

各テナントごとにFirebaseプロジェクトを分けてデプロイしているため、請求はテナントごとに行われますが、セキュリティの観点では以下の重大なリスクが存在します。

**セキュリティリスク:**
- ビルド時にJavaScriptファイルに直接書き込まれたAPIキーは、エンドユーザーのブラウザに配信されます。
- これにより、悪意のある第三者がブラウザの開発者ツールを使うことで、**APIキーを容易に閲覧・コピーすることが可能**です。
- 盗まれたAPIキーが不正利用された場合、該当テナントのGoogle Cloudプロジェクトに**予期せぬ高額な請求が発生する**危険性があります。

この問題は、Gemini APIを利用するすべての機能（画像生成、チャットボット）に共通しています。

## 2. 解決策：バックエンド経由でのAPI呼び出し

APIキーをフロントエンドから完全に分離し、安全なサーバーサイド（バックエンド）経由でAPIを呼び出すアーキテクチャに変更します。

**変更前のフロー（現状）:**
`ユーザーのブラウザ（APIキーが露出） → Gemini API`

**変更後のフロー（提案）:**
`ユーザーのブラウザ → Cloud Function → Secret Manager（安全にキー取得）→ Gemini API`

## 3. 実装のステップ

このアーキテクチャ変更は、以下のステップで実装します。

### ステップ1：【準備】APIキーをバックエンドの安全な場所に保管する

これは、プロジェクト管理者によるGoogle Cloudコンソールでの設定が必要な作業です。

1.  **Secret Managerの有効化:**
    各テナントのGoogle Cloudプロジェクトで「Secret Manager」APIを有効にします。

2.  **シークレットの作成:**
    `GEMINI_API_KEY`という名前で新しい「シークレット」を作成し、そこに現在のAPIキーの値を保存します。

3.  **Cloud Functionsへの権限付与:**
    Cloud Functionsが使用するサービスアカウントに対し、「Secret Managerのシークレット アクセサー」のIAMロールを付与し、作成したシークレットへのアクセスを許可します。

### ステップ2：【バックエンド】API呼び出しを中継するCloud Functionを作成

`functions/index.js`に、フロントエンドからのリクエストを中継するための新しい関数を追加します。

- **`callGeminiStream`関数の作成:**
  - フロントエンドからプロンプトなどの情報を受け取ります。
  - 関数内で、Secret ManagerからAPIキーを安全に読み込みます。
  - そのキーを使い、サーバーサイドでGemini APIを呼び出します。
  - Geminiからの応答をストリーム形式でフロントエンドに中継します。

### ステップ3：【フロントエンド】API呼び出し部分を全面的に書き換え

`geminiService.ts`の役割を、APIの直接呼び出しから、バックエンド（Cloud Function）の呼び出しに変更します。

- **`geminiService.ts`の改修:**
  - APIキーの保持とGemini APIクライアントの初期化ロジックを完全に削除します。
  - 代わりに、ステップ2で作成した`callGeminiStream`関数を呼び出す処理を実装します。
- **各コンポーネントの修正:**
  - `QuotationChatBot.tsx`や`SalesChatBot.tsx`などが、新しい`geminiService.ts`の関数を呼び出すように修正します。

## 4. この改修によるメリット

- **セキュリティの飛躍的向上:** APIキーがブラウザに一切送信されなくなり、不正利用のリスクがなくなります。
- **テナントごとの課金モデルの維持:** 各テナントのプロジェクト内でAPIが呼び出されるため、現在の課金体系はそのまま維持されます。
- **将来の拡張性:** API呼び出しのロジックがバックエンドに集約されるため、将来的なキーの管理や更新が容易になります。

---

## 5. 実装完了報告

### 実装内容

**✅ バックエンド実装:**
- `functions/package.json`: `@google-cloud/secret-manager`と`@google/genai`を依存関係に追加
- `functions/index.js`:
  - Secret Manager統合（`getGeminiApiKey`, `getGeminiClient`関数）
  - `callGeminiGenerate`: 通常のGemini API呼び出し用Cloud Function
  - `callGeminiStream`: ストリーミング応答用Cloud Function

**✅ フロントエンド実装:**
- `services/geminiService.ts`: 完全書き換え
  - APIキーの直接利用を削除
  - Cloud Function経由の呼び出しに変更
  - 8つの既存関数を全て改修

**✅ 環境設定:**
- `.env.local`: `VITE_GEMINI_API_KEY`を削除

### デプロイ前の準備

**各テナントで実施が必要:**

```bash
# 1. Secret Manager有効化
gcloud services enable secretmanager.googleapis.com --project=YOUR_PROJECT_ID

# 2. Gemini APIキーをシークレットに登録
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=YOUR_PROJECT_ID

# 3. Cloud Functions権限付与
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=YOUR_PROJECT_ID
```

### 次のステップ

1. 各テナントでSecret Manager設定
2. `cd functions && npm install`
3. Firebase Functionsデプロイ
4. フロントエンドビルド＆デプロイ
5. 動作確認
