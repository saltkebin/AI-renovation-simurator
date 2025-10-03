# サービスアカウントエラーの解決方法

## ❌ 発生したエラー

```
ERROR: Service account airenovation2@appspot.gserviceaccount.com does not exist.
```

## 🔍 原因

`PROJECT_ID@appspot.gserviceaccount.com` というサービスアカウントは、App Engineをデプロイした時に作成されます。まだApp EngineやCloud Functionsをデプロイしていない場合は存在しません。

## ✅ 解決方法: 正しいサービスアカウントを使用

### オプション1: Compute Engine デフォルトサービスアカウント（推奨）

Firebase Functionsは通常、Compute Engineのデフォルトサービスアカウントを使用します。

**airenovation2の場合:**

```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:864979476179-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2
```

### オプション2: Firebase Admin SDKサービスアカウント

```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:firebase-adminsdk-fbsvc@airenovation2.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2
```

### オプション3: 両方に権限付与（最も確実）

```bash
# Compute Engine デフォルト
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:864979476179-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2

# Firebase Admin SDK
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:firebase-adminsdk-fbsvc@airenovation2.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2
```

---

## 📋 各テナントの正しいコマンド

### テナント1: airenovation2

#### ステップ1: Secret Manager API有効化（変更なし）
```bash
gcloud services enable secretmanager.googleapis.com --project=airenovation2
```

#### ステップ2: Gemini APIキー登録（変更なし）
```bash
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=airenovation2
```

#### ステップ3: 権限付与（修正版）
```bash
# Compute Engine サービスアカウント
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:864979476179-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2

# Firebase Admin SDK サービスアカウント
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:firebase-adminsdk-fbsvc@airenovation2.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2
```

---

## 🔍 他のテナントのサービスアカウント確認方法

### テナント2とテナント3の場合

各テナントで実行:

```bash
# プロジェクトIDを確認したIDに置き換え
PROJECT_ID="airenovation-hitotoiro"  # または airenovation-ishibashihome

# サービスアカウント一覧を取得
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.members)" \
  --filter="bindings.members:serviceAccount AND bindings.members:compute"
```

**期待される出力:**
```
MEMBERS
serviceAccount:123456789-compute@developer.gserviceaccount.com
```

このアカウントを使用:
```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:123456789-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

---

## 🎯 簡単な方法: プロジェクト番号を使用

プロジェクト番号（例: 864979476179）がわかれば、以下のパターンで作成できます:

```bash
# プロジェクト番号を確認
gcloud projects describe airenovation2 --format="value(projectNumber)"
# 出力: 864979476179

# サービスアカウント
{プロジェクト番号}-compute@developer.gserviceaccount.com
```

### テナント2、テナント3用のコマンド生成:

```bash
# 1. プロジェクト番号取得
PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format="value(projectNumber)")

# 2. 権限付与
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=PROJECT_ID
```

---

## ✅ 確認コマンド

```bash
# 権限が正しく付与されたか確認
gcloud secrets get-iam-policy GEMINI_API_KEY --project=airenovation2
```

**期待される出力:**
```yaml
bindings:
- members:
  - serviceAccount:864979476179-compute@developer.gserviceaccount.com
  - serviceAccount:firebase-adminsdk-fbsvc@airenovation2.iam.gserviceaccount.com
  role: roles/secretmanager.secretAccessor
```

---

## 📝 まとめ: 修正版セットアップ手順

### テナント1: airenovation2（完全版）

```bash
# 1. Secret Manager API有効化
gcloud services enable secretmanager.googleapis.com --project=airenovation2

# 2. Gemini APIキー登録
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=airenovation2

# 3. 権限付与（Compute Engine）
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:864979476179-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2

# 4. 権限付与（Firebase Admin SDK）- オプション
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:firebase-adminsdk-fbsvc@airenovation2.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2

# 5. 確認
gcloud secrets get-iam-policy GEMINI_API_KEY --project=airenovation2
```

### テナント2、3（汎用版）

```bash
# プロジェクトID設定
PROJECT_ID="確認したプロジェクトID"

# プロジェクト番号取得
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"

# Secret Manager設定
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

# 確認
gcloud secrets get-iam-policy GEMINI_API_KEY --project=$PROJECT_ID
```

---

**次のステップ**: 3つのテナント全てでこの修正版コマンドを実行してください！
