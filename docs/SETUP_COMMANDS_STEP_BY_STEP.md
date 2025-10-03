# Secret Manager 設定コマンド - 具体的な書き換え手順

## 📝 書き換えが必要な箇所

### 🔴 書き換える場所は2つだけ:

1. **`PROJECT_ID`** → 各テナントのプロジェクトID
2. **`YOUR_GEMINI_API_KEY`** → 実際のGemini APIキー

---

## 🎯 ステップ1: 準備（情報収集）

### A. プロジェクトIDを確認

GitHub Secretsから確認:
```
FIREBASE_CONFIG_DEFAULT → projectId: "airenovation2"
FIREBASE_CONFIG_HITOTOIRO → projectId: "??????" ← これを確認
FIREBASE_CONFIG_ISHIBASHIHOME → projectId: "??????" ← これを確認
```

**メモ:**
```
テナント1: airenovation2
テナント2: _____________ (確認して記入)
テナント3: _____________ (確認して記入)
```

### B. Gemini APIキーを準備

現在使用している`.env.local`のキー、または新しく発行したキー:
```
例: YOUR_GEMINI_API_KEY
```

**メモ:**
```
使用するGemini APIキー: _________________________________
```

---

## 🚀 ステップ2: テナント1（airenovation2）設定

### 元のコマンド（テンプレート）:
```bash
# 1. Secret Manager API有効化
gcloud services enable secretmanager.googleapis.com --project=PROJECT_ID

# 2. Gemini APIキー登録
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=-\
  --project=PROJECT_ID

# 3. Cloud Functions権限付与
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=PROJECT_ID
```

### 📝 書き換え後（実際に実行するコマンド）:

**書き換え箇所:**
- `PROJECT_ID` → `airenovation2` に変更（全4箇所）
- `YOUR_GEMINI_API_KEY` → 実際のAPIキーに変更（1箇所）

```bash
# 1. Secret Manager API有効化
gcloud services enable secretmanager.googleapis.com --project=airenovation2

# 2. Gemini APIキー登録
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=-\
  --project=airenovation2

# 3. Cloud Functions権限付与
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:airenovation2@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2
```

### 💻 実行方法:

**コピペして実行（推奨）:**
1. 上記3つのコマンドをメモ帳にコピー
2. APIキー部分を実際のキーに書き換え
3. 1つずつターミナルに貼り付けて実行

**または1行ずつ:**
```bash
gcloud services enable secretmanager.googleapis.com --project=airenovation2
```
Enterで実行 → 完了を待つ

```bash
echo "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=- --project=airenovation2
```
Enterで実行 → 完了を待つ

```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY --member="serviceAccount:airenovation2@appspot.gserviceaccount.com" --role="roles/secretmanager.secretAccessor" --project=airenovation2
```
Enterで実行 → 完了を待つ

---

## 🚀 ステップ3: テナント2（ひととiro）設定

### 📝 書き換え後（実際に実行するコマンド）:

**前提:** GitHub Secretsで `FIREBASE_CONFIG_HITOTOIRO` の `projectId` が `airenovation-hitotoiro` だったとします。

**書き換え箇所:**
- `PROJECT_ID` → `airenovation-hitotoiro` に変更（全4箇所）
- `YOUR_GEMINI_API_KEY` → 実際のAPIキーに変更（1箇所）

```bash
# 1. Secret Manager API有効化
gcloud services enable secretmanager.googleapis.com --project=airenovation-hitotoiro

# 2. Gemini APIキー登録
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=-\
  --project=airenovation-hitotoiro

# 3. Cloud Functions権限付与
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:airenovation-hitotoiro@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation-hitotoiro
```

---

## 🚀 ステップ4: テナント3（石橋ホーム）設定

### 📝 書き換え後（実際に実行するコマンド）:

**前提:** GitHub Secretsで `FIREBASE_CONFIG_ISHIBASHIHOME` の `projectId` が `airenovation-ishibashihome` だったとします。

**書き換え箇所:**
- `PROJECT_ID` → `airenovation-ishibashihome` に変更（全4箇所）
- `YOUR_GEMINI_API_KEY` → 実際のAPIキーに変更（1箇所）

```bash
# 1. Secret Manager API有効化
gcloud services enable secretmanager.googleapis.com --project=airenovation-ishibashihome

# 2. Gemini APIキー登録
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=-\
  --project=airenovation-ishibashihome

# 3. Cloud Functions権限付与
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:airenovation-ishibashihome@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation-ishibashihome
```

---

## 📊 書き換え箇所の早見表

### コマンドごとの書き換え箇所:

#### コマンド1: Secret Manager API有効化
```bash
gcloud services enable secretmanager.googleapis.com --project=PROJECT_ID
                                                              ↑
                                                        ここを書き換え
```

**例:**
```bash
gcloud services enable secretmanager.googleapis.com --project=airenovation2
```

---

#### コマンド2: Gemini APIキー登録
```bash
echo "YOUR_GEMINI_API_KEY" | \
      ↑
  ここを書き換え

  gcloud secrets create GEMINI_API_KEY \
  --data-file=-\
  --project=PROJECT_ID
            ↑
      ここを書き換え
```

**例:**
```bash
echo "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=-\
  --project=airenovation2
```

---

#### コマンド3: Cloud Functions権限付与
```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
                           ↑
                     ここを書き換え
  --role="roles/secretmanager.secretAccessor" \
  --project=PROJECT_ID
            ↑
      ここを書き換え
```

**例:**
```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:airenovation2@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=airenovation2
```

---

## ✅ 確認コマンド

各テナントで設定が完了したら:

```bash
# シークレット一覧確認
gcloud secrets list --project=airenovation2

# 期待される出力:
# NAME              CREATED              REPLICATION_POLICY  LOCATIONS
# GEMINI_API_KEY    2025-10-03T...       automatic           -
```

```bash
# 権限確認
gcloud secrets get-iam-policy GEMINI_API_KEY --project=airenovation2

# 期待される出力:
# bindings:
# - members:
#   - serviceAccount:airenovation2@appspot.gserviceaccount.com
#   role: roles/secretmanager.secretAccessor
```

---

## 🎯 まとめ: 書き換えチェックリスト

### テナント1: airenovation2

- [ ] プロジェクトID確認: `airenovation2`
- [ ] Gemini APIキー準備: `AIza...`
- [ ] コマンド1実行: `--project=airenovation2`
- [ ] コマンド2実行: `echo "APIキー"` + `--project=airenovation2`
- [ ] コマンド3実行: `serviceAccount:airenovation2@...` + `--project=airenovation2`
- [ ] 確認コマンド実行

### テナント2: ひととiro

- [ ] プロジェクトID確認: `_____________`
- [ ] Gemini APIキー準備: `AIza...`
- [ ] コマンド1実行: `--project=確認したID`
- [ ] コマンド2実行: `echo "APIキー"` + `--project=確認したID`
- [ ] コマンド3実行: `serviceAccount:確認したID@...` + `--project=確認したID`
- [ ] 確認コマンド実行

### テナント3: 石橋ホーム

- [ ] プロジェクトID確認: `_____________`
- [ ] Gemini APIキー準備: `AIza...`
- [ ] コマンド1実行: `--project=確認したID`
- [ ] コマンド2実行: `echo "APIキー"` + `--project=確認したID`
- [ ] コマンド3実行: `serviceAccount:確認したID@...` + `--project=確認したID`
- [ ] 確認コマンド実行

---

## ⚠️ よくある間違い

### ❌ 間違い1: クォートを忘れる
```bash
#間違い
echo AIzaSy... | gcloud secrets create...

# 正しい
echo "AIzaSy..." | gcloud secrets create...
```

### ❌ 間違い2: @appspot.gserviceaccount.com を忘れる
```bash
#間違い
--member="serviceAccount:airenovation2"

# 正しい
--member="serviceAccount:airenovation2@appspot.gserviceaccount.com"
```

### ❌ 間違い3: プロジェクトIDの書き換え漏れ
```bash
# コマンド2でプロジェクトIDを書き換え忘れ
echo "APIキー" | gcloud secrets create GEMINI_API_KEY --data-file=- --project=PROJECT_ID
                                                                             ↑ 書き換え忘れ!
```

---

**次のステップ**: 3つのテナント全てでこの設定が完了したら、Firebase Functionsをデプロイします！