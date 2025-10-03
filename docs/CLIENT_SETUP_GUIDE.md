# 新規クライアント追加 完全ガイド

このドキュメントでは、新規クライアントを追加する具体的な手順を詳しく説明します。

## 📊 概要

**従来の手動作業**: 約30分
**自動化後の作業**: 約14分（手動10分 + 自動4分）

## 🎯 例：「client-a」を追加する場合

### **Phase 1: Firebase準備（手動・5分）**

#### 1-1. Firebaseプロジェクト作成

1. **Firebaseコンソールにアクセス**
   - [Firebase Console](https://console.firebase.google.com/) を開く
   - Googleアカウントでログイン

2. **プロジェクト作成**
   - 「**+ プロジェクトを追加**」をクリック
   - **プロジェクト名**: `airenovation-client-a`
   - **Google アナリティクス**: チェックを外す（無効）
   - 「**プロジェクトを作成**」をクリック

#### 1-2. 必須サービス有効化

**A. Firestore Database**
1. **ビルド** > **Firestore Database**
2. **データベースの作成** > **本番環境モードで開始**
3. **ロケーション**: `asia-northeast1 (Tokyo)`
4. **有効にする**

**B. Cloud Storage**
1. **ビルド** > **Storage**
2. **始める** > **本番環境モードで開始**
3. **ロケーション**: `asia-northeast1 (Tokyo)`
4. **完了**

**C. Firebase Hosting**
1. **ビルド** > **Hosting**
2. **始める**
3. CLI手順は**すべて無視**して「**次へ**」→「**次へ**」→「**コンソールに進む**」

#### 1-3. 設定情報取得

**Firebase Config取得**
1. **プロジェクト設定** (⚙️) > **全般** タブ
2. **マイアプリ** > **ウェブアイコン `</>`**
3. **アプリのニックネーム**: `WebApp`
4. **Firebase Hostingのチェックは外す**
5. **アプリを登録**
6. **firebaseConfig取得** - 以下のような形式をコピー：
   ```json
   {
     "apiKey": "AIza...",
     "authDomain": "airenovation-client-a.firebaseapp.com",
     "projectId": "airenovation-client-a",
     "storageBucket": "airenovation-client-a.firebasestorage.app",
     "messagingSenderId": "123456789",
     "appId": "1:123456789:web:abcdef..."
   }
   ```

**Service Account取得**
1. **プロジェクト設定** > **サービスアカウント** タブ
2. **新しい秘密鍵の生成**
3. **キーを生成**
4. ダウンロードされたJSONファイルの**中身を全てコピー**

#### 1-4. Secret Manager設定（新規追加 🔒）

**Gemini APIキーをSecure保管**

ターミナルで以下を実行:

```bash
# Secret Manager有効化
gcloud services enable secretmanager.googleapis.com --project=airenovation-client-a

# Gemini APIキーをシークレットに登録
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=airenovation-client-a

# Cloud Functions権限付与
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:airenovation-client-a@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation-client-a
```

**重要:** `YOUR_GEMINI_API_KEY`は実際のGemini APIキーに置き換えてください

### **Phase 2: GitHub Secrets設定（手動・2分）** ← 1分短縮!

#### 2-1. GitHub リポジトリにアクセス
1. **GitHub リポジトリ** > **Settings** > **Secrets and variables** > **Actions**

#### 2-2. 2つのSecrets追加（Gemini APIキーは不要に！）

**A. Firebase Config**
- **名前**: `FIREBASE_CONFIG_CLIENT_A`
- **値**: Phase 1-3で取得したJSON（波括弧含む完全形式）
```json
{
  "apiKey": "AIza...",
  "authDomain": "airenovation-client-a.firebaseapp.com",
  "projectId": "airenovation-client-a",
  "storageBucket": "airenovation-client-a.firebasestorage.app",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef..."
}
```

**B. Firebase Service Account**
- **名前**: `FIREBASE_SERVICE_ACCOUNT_CLIENT_A`
- **値**: Phase 1-3で取得したService Account JSON完全版

~~**C. Gemini API Key**~~ ← **不要！Secret Managerで管理**
- ~~名前: `GEMINI_API_KEY_CLIENT_A`~~
- ~~値: クライアント専用のGemini APIキー~~

### **Phase 3: 自動化スクリプト実行（自動・2分）**

#### 3-1. ターミナルを開く

```bash
# プロジェクトディレクトリに移動
cd C:\Users\tabis\OneDrive\Desktop\開発\AIrenovation-app
```

#### 3-2. 自動セットアップ実行

```bash
# 完全自動セットアップ
./scripts/setup-new-client.sh client-a airenovation-client-a
```

#### 3-3. スクリプトが自動実行する内容

- ✅ `.github/workflows/manual-deploy.yml` に `client-a` を追加
- ✅ `.github/workflows/auto-deploy-all-clients.yml` に `client-a` を追加
- ✅ Firebase Storage CORS設定適用 (`gs://airenovation-client-a.firebasestorage.app`)
- ✅ ドキュメント更新
- ✅ Git commit作成
- ✅ 確認後にGitHub push

#### 3-4. 期待される出力

```
🚀 Starting complete setup for client: client-a
ℹ️  Firebase project: airenovation-client-a
ℹ️  Expected URL: https://airenovation-client-a.web.app

📝 Step 1: Updating GitHub Actions workflows...
✅ Added client-a to manual-deploy.yml options
✅ Added CLIENT_A configuration to manual-deploy.yml
✅ Added client-a to auto-deploy matrix
✅ Added CLIENT_A configuration to auto-deploy-all-clients.yml

🔧 Step 2: Setting up CORS configuration...
✅ CORS settings applied successfully!
✅ CORS settings verified!

📚 Step 3: Updating documentation...
✅ Updated setup documentation

📦 Step 4: Committing changes...
✅ Changes committed successfully
Push changes to GitHub? (y/N): y
✅ Changes pushed to GitHub

🎉 Complete setup finished for client: client-a
```

### **Phase 4: 最終設定（手動・2分）**

#### 4-1. Firestore Rules設定

1. **Firebase Console** > **airenovation-client-a** > **Firestore Database** > **ルール**
2. 以下のルールに**完全置き換え**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to config/auth for PIN verification
    match /config/auth {
      allow read: if true;
    }

    // Allow read/write access to product categories
    match /categories/{document} {
      allow read, write: if true;
    }

    // Allow read/write access to products
    match /products/{document} {
      allow read, write: if true;
    }

    // Allow read/write access to other collections
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. **公開** をクリック

#### 4-2. Cloud Storage Rules設定

1. **Firebase Console** > **Storage** > **ルール**
2. 以下のルールに**完全置き換え**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write access to all files
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. **公開** をクリック

#### 4-3. PINコード設定

1. **Firestore Database** > **データ** タブ
2. **コレクションを開始** > **config**
3. **ドキュメントID**: `auth`
4. **フィールド追加**:
   - **フィールド**: `pin`
   - **型**: `string`
   - **値**: `"123456"` (6桁の文字列、ダブルクォート必須)
5. **保存**

### **Phase 5: デプロイ & テスト（自動・2分）**

#### 5-1. GitHub Actionsでデプロイ

1. **GitHub リポジトリ** > **Actions** タブ
2. **Manual Deploy to Client** ワークフローを選択
3. **Run workflow** > **Client**: `client-a` を選択
4. **Run workflow** 実行

#### 5-2. デプロイ成功確認

約2-3分でデプロイ完了。以下が表示されれば成功：

```
✅ Set client environment variables
✅ Build application
✅ Create dynamic .firebaserc
✅ Deploy to Firebase Hosting (client-a)
✅ Success: https://airenovation-client-a.web.app
```

#### 5-3. 動作確認

**アプリアクセス**
- URL: `https://airenovation-client-a.web.app`

**機能テスト**
1. **PIN認証**: 設定したPINコード（123456）でログイン
2. **画像アップロード**: リノベーション機能テスト
3. **データベース**: 商品登録機能テスト
4. **見積もり**: AI見積もり機能テスト
5. **商品画像生成**: 実際の商品画像を使用した生成テスト

## 📊 作業時間の詳細内訳

| フェーズ | 作業内容 | 時間 | 自動/手動 | 詳細 |
|---------|----------|------|-----------|------|
| **1** | Firebase準備 + Secret Manager | **6分** | 手動 | プロジェクト作成、サービス有効化、設定取得、APIキー保護 |
| **2** | GitHub Secrets | **2分** | 手動 | 2つのSecret設定（Gemini APIキー不要） |
| **3** | 自動化スクリプト | **2分** | **自動** | Workflows更新、CORS設定、Git操作 |
| **4** | 最終設定 | **2分** | 手動 | Rules設定、PIN設定 |
| **5** | デプロイ&テスト | **2分** | **自動** | GitHub Actions実行、動作確認 |
| | | | | |
| **合計** | | **14分** | **手動10分 + 自動4分** | **従来30分から16分短縮 + セキュア化** |

## 🎯 完成後の結果

### ✅ 新しいクライアント環境

- **クライアント名**: `client-a`
- **Firebase プロジェクト**: `airenovation-client-a`
- **URL**: `https://airenovation-client-a.web.app`
- **データ分離**: 完全独立環境
- **CORS設定**: 商品画像機能対応済み
- **自動デプロイ**: 今後のアップデート自動対応

### 🔄 今後の管理

**自動デプロイ対応**
- コード更新時に全クライアント自動デプロイ
- 手動デプロイも可能（特定クライアントのみ）

**管理機能**
- Firebase Console: プロジェクト管理・データ確認
- GitHub Actions: デプロイ・更新管理

## ⚠️ トラブルシューティング

### よくある問題と解決法

| 問題 | 原因 | 解決法 |
|------|------|--------|
| スクリプト権限エラー | 実行権限なし | `chmod +x scripts/*.sh` |
| gcloud認証エラー | 未認証 | `gcloud auth login` |
| Bucket not found | Storage未有効化 | Firebase Console で Storage 有効化 |
| GitHub Actions失敗 | Secret名間違い | 正確な命名規則で再設定 |
| JSON Parse Error | 形式エラー | 波括弧含む完全JSON形式で再設定 |
| PIN認証エラー | Rules未設定 | Firestore Rules設定・公開実行 |
| 商品登録エラー | Storage Rules未設定 | Storage Rules設定・公開実行 |
| CORS エラー | CORS未設定 | `./scripts/setup-client-cors.sh` 再実行 |

### エラーログ確認方法

1. **GitHub Actions失敗**: Actions > 失敗したworkflow > エラー詳細確認
2. **アプリエラー**: ブラウザ Developer Tools > Console でエラー確認
3. **スクリプトエラー**: ターミナルの出力を確認

## 📝 次回以降の簡単手順

2回目以降は手順を覚えているので、さらに短縮可能：

1. **Firebase準備**（3分）
2. **GitHub Secrets**（2分）
3. **自動化スクリプト**（1分）
4. **最終設定**（1分）
5. **デプロイ&テスト**（1分）

**合計：約8分で完了**

---

## 🎉 完了

新規クライアント「client-a」の追加が完了しました！

**14分で完全に独立したクライアント環境が構築されました。**