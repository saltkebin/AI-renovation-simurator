# 新規クライアント向け完全セットアップガイド

このドキュメントは、AIリノベーション・シミュレーターを新しいクライアント向けに**12分で完全デプロイ**するための実証済み手順書です。

## 🎯 目的

クライアントごとに独立したFirebaseプロジェクトを作成することで、以下のメリットがあります。

- **データの完全分離:** 各クライアントの顧客データや商品データベースが完全に分離され、安全性が向上します。
- **独立したURL:** クライアントごとに独自のURL（例: `https://airenovation-client.web.app`）が提供されます。
- **リソースの分離:** 各クライアントの利用状況が他のクライアントに影響を与えません。
- **スケーラブル展開:** 自動化により新クライアント追加が12分で完了します。

## ⏱️ 所要時間：約12分

- Firebase設定: **5分**
- GitHub Secrets設定: **3分**
- デプロイ実行: **2分**
- セキュリティ設定: **2分**

---

## 📋 事前準備

### 必要な情報

1. **クライアント名** (英小文字推奨、例: `hitotoiro`)
2. **Gemini APIキー** (クライアント専用)
3. **希望PINコード** (6桁)

---

## 🚀 Step 1: Firebaseプロジェクト作成 (5分)

### 1-1. プロジェクト作成

1. **Firebaseコンソールにアクセス**
   [Firebaseコンソール](https://console.firebase.google.com/) を開き、Googleアカウントでログイン

2. **プロジェクトを追加**
   「**+ プロジェクトを追加**」をクリック

3. **プロジェクト名の入力**
   ```
   命名規則: airenovation-[クライアント名]
   例: airenovation-hitotoiro
   ```

4. **Google アナリティクス**
   「**Google アナリティクスを有効にする**」の**チェックを外す**（簡素化のため）

5. **プロジェクト作成完了**
   「**プロジェクトを作成**」をクリックし、完了まで待機

### 1-2. 必須サービスの有効化

#### A. Firestore Database
1. **ビルド** > **Firestore Database**
2. **データベースの作成** > **本番環境モードで開始**
3. **ロケーション**: `asia-northeast1 (Tokyo)`
4. **有効にする**

#### B. Cloud Storage
1. **ビルド** > **Storage**
2. **始める** > **本番環境モードで開始**
3. **ロケーション**: `asia-northeast1 (Tokyo)`
4. **完了**

#### C. Firebase Hosting
1. **ビルド** > **Hosting**
2. **始める**
3. CLI手順は**すべて無視**して「**次へ**」→「**次へ**」→「**コンソールに進む**」

### 1-3. Webアプリ登録・設定取得

1. **プロジェクト設定** (⚙️) > **全般** タブ
2. **マイアプリ** > **ウェブアイコン `</>`**
3. **アプリのニックネーム**: `WebApp`
4. **Firebase Hostingのチェックは外す**
5. **アプリを登録**

6. **firebaseConfig取得**
   ```javascript
   const firebaseConfig = {
     "apiKey": "AIza...",
     "authDomain": "airenovation-client.firebaseapp.com",
     "projectId": "airenovation-client",
     "storageBucket": "airenovation-client.firebasestorage.app",
     "messagingSenderId": "123456789",
     "appId": "1:123456789:web:abcdef..."
   };
   ```

   **⚠️ 重要:** `{ }` の波括弧も含めて**完全なJSON形式**をコピー

### 1-4. Service Account取得

1. **プロジェクト設定** > **サービスアカウント** タブ
2. **新しい秘密鍵の生成**
3. **キーを生成**
4. ダウンロードされたJSONファイルの**中身を全てコピー**

---

## 🔐 Step 2: GitHub Secrets設定 (3分)

### 2-1. GitHub リポジトリアクセス

1. **GitHub リポジトリ** > **Settings** > **Secrets and variables** > **Actions**

### 2-2. 3つのSecrets追加

各Secretを**正確に**以下の命名規則で追加：

#### A. Firebase Config
- **名前**: `FIREBASE_CONFIG_[CLIENT_NAME]` (例: `FIREBASE_CONFIG_HITOTOIRO`)
- **値**: Step 1-3で取得したJSON（波括弧含む完全形式）
```json
{
  "apiKey": "AIza...",
  "authDomain": "airenovation-client.firebaseapp.com",
  "projectId": "airenovation-client",
  "storageBucket": "airenovation-client.firebasestorage.app",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef..."
}
```

#### B. Firebase Service Account
- **名前**: `FIREBASE_SERVICE_ACCOUNT_[CLIENT_NAME]` (例: `FIREBASE_SERVICE_ACCOUNT_HITOTOIRO`)
- **値**: Step 1-4で取得したService Account JSON完全版

#### C. Gemini API Key
- **名前**: `GEMINI_API_KEY_[CLIENT_NAME]` (例: `GEMINI_API_KEY_HITOTOIRO`)
- **値**: クライアント専用のGemini APIキー

### 2-3. Workflow設定更新

`.github/workflows/manual-deploy.yml` の `options` にクライアント名を追加：

```yaml
inputs:
  client:
    description: 'Client to deploy to'
    required: true
    type: choice
    options:
      - default
      - hitotoiro
      - [新しいクライアント名]  # ← ここに追加
```

**コミット・プッシュ**してworkflowを更新

---

## 🚀 Step 3: デプロイ実行 (2分)

### 3-1. GitHub Actionsでデプロイ

1. **GitHub リポジトリ** > **Actions** タブ
2. **Manual Deploy to Client** ワークフローを選択
3. **Run workflow** > **Client**: `[新しいクライアント名]` を選択
4. **Run workflow** 実行

### 3-2. デプロイ成功確認

約2-3分でデプロイ完了。以下が表示されれば成功：

```
✅ Set client environment variables
✅ Build application
✅ Create dynamic .firebaserc
✅ Deploy to Firebase Hosting ([CLIENT_NAME])
✅ Success: https://airenovation-[client].web.app
```

---

## 🔒 Step 4: セキュリティ設定 (2分)

**⚠️ 重要:** この設定なしではアプリが動作しません

### 4-1. Firestore Rules設定

1. **Firebase Console** > **プロジェクト** > **Firestore Database** > **ルール**
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

### 4-2. Cloud Storage Rules設定

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

### 4-3. PINコード設定

1. **Firestore Database** > **データ** タブ
2. **コレクションを開始** > **config**
3. **ドキュメントID**: `auth`
4. **フィールド追加**:
   - **フィールド**: `pin`
   - **型**: `string`
   - **値**: `"123456"` (6桁の文字列、ダブルクォート必須)
5. **保存**

---

## ✅ Step 5: 動作確認

### 5-1. アプリアクセス

デプロイURLにアクセス: `https://airenovation-[client].web.app`

### 5-2. 機能テスト

1. **PIN認証**: 設定したPINコードでログイン
2. **画像アップロード**: リノベーション機能テスト
3. **データベース**: 商品登録機能テスト
4. **見積もり**: AI見積もり機能テスト

### 5-3. エラー時の対処

#### A. PIN認証失敗
- **原因**: Firestore Rules未設定
- **解決**: Step 4-1を再実行

#### B. 商品登録失敗
- **原因**: Storage Rules未設定
- **解決**: Step 4-2を再実行

#### C. デプロイ失敗
- **原因**: GitHub Secrets形式エラー
- **解決**: JSON形式を再確認してSecrets再設定

---

## 📊 トラブルシューティング

### よくある問題と解決法

| 問題 | 原因 | 解決法 |
|------|------|--------|
| GitHub Actions失敗 | Secret名の大文字小文字間違い | 正確な命名規則で再設定 |
| JSON Parse Error | Firebase Config形式エラー | 波括弧含む完全JSON形式で再設定 |
| Authentication失敗 | Service Account形式エラー | ダウンロードファイル完全コピー |
| PIN認証エラー | Firestore Rules未設定 | Rules設定・公開実行 |
| 商品登録エラー | Storage Rules未設定 | Storage Rules設定・公開実行 |

### エラーログ確認方法

1. **GitHub Actions失敗**: Actions > 失敗したworkflow > エラー詳細確認
2. **アプリエラー**: ブラウザ Developer Tools > Console でエラー確認

---

## 🎉 完了

**所要時間: 約12分**

新しいクライアント向けAIリノベーション・シミュレーターが完全稼働状態で配信開始！

### 配信URL
```
https://airenovation-[client].web.app
```

### 管理機能
- **Firebase Console**: プロジェクト管理・データ確認
- **GitHub Actions**: 再デプロイ・更新管理
- **クライアント専用**: 完全データ分離環境

---

## 📝 次回クライアント追加時

このドキュメントに従って：
1. 新しいFirebaseプロジェクト作成
2. GitHub Secrets追加
3. Workflow選択肢更新
4. デプロイ実行
5. セキュリティ設定

**12分で新規クライアント環境構築完了！**