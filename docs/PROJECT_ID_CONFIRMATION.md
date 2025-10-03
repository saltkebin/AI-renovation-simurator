# プロジェクトID確認手順

## 🎯 プロジェクトIDとは？

**プロジェクトID** = Google Cloud/FirebaseプロジェクトのユニークなID

例:
- `airenovation2`
- `airenovation-hitotoiro`
- `my-project-12345`

このIDは以下で共通して使用されます:
- Google Cloud Console
- Firebase Console
- GitHub Actions（Secret内のJSONに記載）
- gcloudコマンド

---

## 📝 確認方法

### ✅ 方法1: GitHub Secretsから確認（推奨・最速）

#### 手順:

1. **GitHubリポジトリを開く**
   - https://github.com/YOUR_USERNAME/AIrenovation-app

2. **Settings > Secrets and variables > Actions**

3. **各Secretを確認:**

**テナント1（デフォルト・デモ）:**
```
Secret名: FIREBASE_CONFIG_DEFAULT
↓クリックして内容表示
{
  "apiKey": "...",
  "authDomain": "airenovation2.firebaseapp.com",
  "projectId": "airenovation2",  ← ★これがプロジェクトID
  "storageBucket": "...",
  ...
}
```

**テナント2（ひととiro）:**
```
Secret名: FIREBASE_CONFIG_HITOTOIRO
↓クリックして内容表示
{
  ...
  "projectId": "????????",  ← ★これを確認
  ...
}
```

**テナント3（石橋ホーム）:**
```
Secret名: FIREBASE_CONFIG_ISHIBASHIHOME
↓クリックして内容表示
{
  ...
  "projectId": "????????",  ← ★これを確認
  ...
}
```

#### 確認したらメモ:
```
テナント1: airenovation2
テナント2: ___________________
テナント3: ___________________
```

---

### 方法2: Firebase Consoleから確認

#### 手順:

1. **Firebase Consoleを開く**
   - https://console.firebase.google.com/

2. **各プロジェクトを選択**

3. **プロジェクト設定（⚙️）を開く**
   - 左上の歯車アイコン > プロジェクトの設定

4. **「全般」タブで確認**
   ```
   プロジェクトの詳細
   -------------------
   プロジェクト名: AIリノベーション（デモ）
   プロジェクトID: airenovation2  ← ★これ
   ```

---

### 方法3: Google Cloud Consoleから確認

#### 手順:

1. **Google Cloud Consoleを開く**
   - https://console.cloud.google.com/

2. **プロジェクト選択メニュー**
   - 画面上部のプロジェクト名をクリック

3. **プロジェクト一覧を表示**
   ```
   プロジェクト名              ID
   ---------------------------------
   AIリノベーション（デモ）    airenovation2
   ひととiro                  airenovation-hitotoiro (例)
   石橋ホーム                 airenovation-ishibashihome (例)
   ```

---

## 🔍 プロジェクトIDの特徴

### ✅ 正しいプロジェクトID:
- 小文字のみ
- 数字とハイフン `-` を含む場合がある
- 例: `airenovation2`, `my-project-123`

### ❌ これは違います:
- プロジェクト番号: `123456789012` （数字のみ）
- プロジェクト名: `AIリノベーション（デモ）` （日本語）
- アプリID: `1:123456789:web:abc...` （長い文字列）

---

## 📋 確認後の次のステップ

3つのプロジェクトIDを確認したら、以下のコマンドで設定します:

### テナント1: airenovation2

```bash
gcloud services enable secretmanager.googleapis.com --project=airenovation2

echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=airenovation2

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:airenovation2@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2
```

### テナント2: ひととiro（プロジェクトID確認後）

```bash
# 確認したIDに置き換え
PROJECT_ID_HITOTOIRO="確認したID"

gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID_HITOTOIRO

echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=$PROJECT_ID_HITOTOIRO

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_ID_HITOTOIRO}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID_HITOTOIRO
```

### テナント3: 石橋ホーム（プロジェクトID確認後）

```bash
# 確認したIDに置き換え
PROJECT_ID_ISHIBASHIHOME="確認したID"

gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID_ISHIBASHIHOME

echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=$PROJECT_ID_ISHIBASHIHOME

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_ID_ISHIBASHIHOME}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID_ISHIBASHIHOME
```

---

## ⚠️ よくある間違い

### ❌ 間違い例1: プロジェクト番号を使用
```bash
# これは間違い
gcloud ... --project=123456789012
```

### ✅ 正しい例: プロジェクトID を使用
```bash
# これが正しい
gcloud ... --project=airenovation2
```

### ❌ 間違い例2: プロジェクト名を使用
```bash
# これは間違い
gcloud ... --project="AIリノベーション（デモ）"
```

### ✅ 正しい例: プロジェクトID を使用
```bash
# これが正しい
gcloud ... --project=airenovation2
```

---

## 📞 困ったときは

プロジェクトIDが見つからない場合:
1. Firebase Console で確認（最も確実）
2. GitHub Secrets の `FIREBASE_CONFIG_*` を確認
3. Google Cloud Console で確認

それでも不明な場合:
- Firebase プロジェクトの所有者に確認
- GitHub リポジトリの管理者に確認
