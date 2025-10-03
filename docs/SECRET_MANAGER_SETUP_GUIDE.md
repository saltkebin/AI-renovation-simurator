# Secret Manager セットアップガイド

**実施日**: デプロイ前に必須
**対象**: 全3テナント

## 📋 対象テナント一覧

現在運用中の3つのテナントすべてに対して、以下の設定が必要です:

| # | テナント名 | プロジェクトID | GitHub Secret名 |
|---|-----------|---------------|----------------|
| 1 | **デフォルト（デモ）** | `airenovation2` | `FIREBASE_CONFIG_DEFAULT` |
| 2 | **ひととiro** | 調査必要 | `FIREBASE_CONFIG_HITOTOIRO` |
| 3 | **石橋ホーム** | 調査必要 | `FIREBASE_CONFIG_ISHIBASHIHOME` |

## 🔍 ステップ0: プロジェクトID確認

まず、各テナントの正確なプロジェクトIDを確認します。

### 方法1: GitHub Secretsから確認

1. **GitHub リポジトリ** > **Settings** > **Secrets and variables** > **Actions**
2. 各SecretのJSONを確認:
   - `FIREBASE_CONFIG_DEFAULT` → `projectId` を確認
   - `FIREBASE_CONFIG_HITOTOIRO` → `projectId` を確認
   - `FIREBASE_CONFIG_ISHIBASHIHOME` → `projectId` を確認

### 方法2: Firebase Consoleから確認

1. [Firebase Console](https://console.firebase.google.com/)
2. 各プロジェクトを開く
3. **プロジェクト設定** (⚙️) > **全般** タブ
4. **プロジェクトID** をコピー

---

## 🔐 ステップ1: Secret Manager設定（各テナント）

### 前提条件

- gcloud CLIがインストール済み
- Googleアカウントでログイン済み
- 各プロジェクトへのOwner/Editor権限

### 認証確認

```bash
# 現在のログイン状態確認
gcloud auth list

# 未ログインの場合
gcloud auth login
```

---

## 📝 テナント1: airenovation2（デフォルト・デモ）

### 1-1. プロジェクト確認

```bash
gcloud config set project airenovation2
gcloud config get-value project
# 出力: airenovation2
```

### 1-2. Secret Manager API有効化

```bash
gcloud services enable secretmanager.googleapis.com --project=airenovation2
```

**期待される出力:**
```
Operation "operations/xxxx" finished successfully.
```

### 1-3. Gemini APIキーをシークレットに登録

**重要:** `YOUR_GEMINI_API_KEY` を実際のAPIキーに置き換えてください

```bash
# 対話的に登録（推奨）
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=airenovation2
```

**または、直接指定:**

```bash
gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=airenovation2
# [Enter]を押した後、APIキーを入力
# Ctrl+D (Windowsの場合 Ctrl+Z → Enter)で完了
```

**期待される出力:**
```
Created secret [GEMINI_API_KEY].
```

### 1-4. Cloud Functions権限付与

```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:airenovation2@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2
```

**期待される出力:**
```
Updated IAM policy for secret [GEMINI_API_KEY].
bindings:
- members:
  - serviceAccount:airenovation2@appspot.gserviceaccount.com
  role: roles/secretmanager.secretAccessor
```

### 1-5. 設定確認

```bash
# シークレット一覧確認
gcloud secrets list --project=airenovation2

# 権限確認
gcloud secrets get-iam-policy GEMINI_API_KEY --project=airenovation2
```

**✅ テナント1完了!**

---

## 📝 テナント2: ひととiro

### 2-0. プロジェクトID確認

GitHub Secretsから `FIREBASE_CONFIG_HITOTOIRO` の `projectId` を確認してください。

**例:** `airenovation-hitotoiro` （仮）

以下、`PROJECT_ID_HITOTOIRO` を実際のIDに置き換えて実行してください。

### 2-1. プロジェクト設定

```bash
# プロジェクトIDを変数に設定（実際のIDに置き換え）
PROJECT_ID_HITOTOIRO="airenovation-hitotoiro"

gcloud config set project $PROJECT_ID_HITOTOIRO
gcloud config get-value project
```

### 2-2. Secret Manager API有効化

```bash
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID_HITOTOIRO
```

### 2-3. Gemini APIキーをシークレットに登録

```bash
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=$PROJECT_ID_HITOTOIRO
```

### 2-4. Cloud Functions権限付与

```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_ID_HITOTOIRO}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID_HITOTOIRO
```

### 2-5. 設定確認

```bash
gcloud secrets list --project=$PROJECT_ID_HITOTOIRO
gcloud secrets get-iam-policy GEMINI_API_KEY --project=$PROJECT_ID_HITOTOIRO
```

**✅ テナント2完了!**

---

## 📝 テナント3: 石橋ホーム

### 3-0. プロジェクトID確認

GitHub Secretsから `FIREBASE_CONFIG_ISHIBASHIHOME` の `projectId` を確認してください。

**例:** `airenovation-ishibashihome` （仮）

以下、`PROJECT_ID_ISHIBASHIHOME` を実際のIDに置き換えて実行してください。

### 3-1. プロジェクト設定

```bash
# プロジェクトIDを変数に設定（実際のIDに置き換え）
PROJECT_ID_ISHIBASHIHOME="airenovation-ishibashihome"

gcloud config set project $PROJECT_ID_ISHIBASHIHOME
gcloud config get-value project
```

### 3-2. Secret Manager API有効化

```bash
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID_ISHIBASHIHOME
```

### 3-3. Gemini APIキーをシークレットに登録

```bash
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=$PROJECT_ID_ISHIBASHIHOME
```

### 3-4. Cloud Functions権限付与

```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_ID_ISHIBASHIHOME}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID_ISHIBASHIHOME
```

### 3-5. 設定確認

```bash
gcloud secrets list --project=$PROJECT_ID_ISHIBASHIHOME
gcloud secrets get-iam-policy GEMINI_API_KEY --project=$PROJECT_ID_ISHIBASHIHOME
```

**✅ テナント3完了!**

---

## 🚀 一括実行スクリプト（オプション）

プロジェクトIDが確定したら、以下のスクリプトで一括実行できます:

```bash
#!/bin/bash

# プロジェクトID設定（実際の値に置き換え）
PROJECT_IDS=(
  "airenovation2"
  "airenovation-hitotoiro"  # 実際のIDに置き換え
  "airenovation-ishibashihome"  # 実際のIDに置き換え
)

# Gemini APIキー（環境変数から取得推奨）
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"  # 実際のキーに置き換え

for PROJECT_ID in "${PROJECT_IDS[@]}"; do
  echo "========================================="
  echo "🔧 Setting up Secret Manager for: $PROJECT_ID"
  echo "========================================="

  # Secret Manager有効化
  gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

  # シークレット作成
  echo "$GEMINI_API_KEY" | \
    gcloud secrets create GEMINI_API_KEY \
    --data-file=- \
    --project=$PROJECT_ID

  # 権限付与
  gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID

  echo "✅ Completed: $PROJECT_ID"
  echo ""
done

echo "🎉 All tenants configured successfully!"
```

---

## ✅ 完了チェックリスト

設定完了後、以下を確認してください:

### テナント1: airenovation2
- [ ] Secret Manager API有効化
- [ ] `GEMINI_API_KEY` シークレット作成
- [ ] Cloud Functions権限付与
- [ ] 設定確認完了

### テナント2: ひととiro
- [ ] プロジェクトID確認
- [ ] Secret Manager API有効化
- [ ] `GEMINI_API_KEY` シークレット作成
- [ ] Cloud Functions権限付与
- [ ] 設定確認完了

### テナント3: 石橋ホーム
- [ ] プロジェクトID確認
- [ ] Secret Manager API有効化
- [ ] `GEMINI_API_KEY` シークレット作成
- [ ] Cloud Functions権限付与
- [ ] 設定確認完了

---

## 🔍 トラブルシューティング

### エラー: "Permission denied"

**原因**: プロジェクトへの権限不足

**解決法**:
1. Firebase Consoleでプロジェクトへのアクセス権を確認
2. Owner/Editor権限があることを確認
3. 再度 `gcloud auth login` を実行

### エラー: "Secret already exists"

**原因**: シークレットが既に存在

**解決法**:
```bash
# 既存シークレット削除
gcloud secrets delete GEMINI_API_KEY --project=PROJECT_ID

# 再作成
echo "YOUR_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=PROJECT_ID
```

### エラー: "Service account not found"

**原因**: Cloud Functions未デプロイ

**解決法**:
デフォルトのApp Engineサービスアカウントを使用:
```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=PROJECT_ID
```

---

## 📋 次のステップ

全テナントの設定が完了したら:

1. **Firebase Functionsデプロイ**
   ```bash
   firebase deploy --only functions
   ```

2. **フロントエンドデプロイ**
   ```bash
   firebase deploy --only hosting
   ```

3. **動作確認**
   - 各テナントのURLにアクセス
   - 画像生成機能をテスト
   - チャットボット機能をテスト

---

**重要**: このガイド完了後、APIキーは全てSecret Managerで安全に管理され、フロントエンドには一切露出しません。
