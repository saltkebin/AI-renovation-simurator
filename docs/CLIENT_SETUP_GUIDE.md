# 新規クライアント追加ガイド

このドキュメントでは、新規クライアント環境を追加する手順を説明します。

## 📋 概要

新しいクライアントを追加することで、完全に独立したFirebase環境（データベース、ストレージ、ホスティング）を構築できます。

**所要時間**: 約15-20分

## 🎯 例：「newclient」を追加する場合

### Phase 1: Firebase プロジェクト作成（5分）

#### 1-1. Firebaseプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `airenovation-newclient`
4. Google アナリティクス: **無効**
5. 「プロジェクトを作成」

#### 1-2. 必須サービスの有効化

**A. Firestore Database**
1. ビルド > Firestore Database
2. データベースの作成 > **本番環境モードで開始**
3. ロケーション: `asia-northeast1 (Tokyo)`
4. 有効にする

**B. Cloud Storage**
1. ビルド > Storage
2. 始める > **本番環境モードで開始**
3. ロケーション: `asia-northeast1 (Tokyo)`
4. 完了

**C. Firebase Hosting**
1. ビルド > Hosting
2. 始める
3. CLI手順は無視して「次へ」→「次へ」→「コンソールに進む」

**D. Cloud Functions**
1. ビルド > Functions
2. 「始める」をクリック
3. アップグレード案内が表示されたら「後で」を選択

#### 1-3. Firebase 設定情報の取得

**A. Firebase Config の取得**

1. プロジェクト設定（⚙️）> 全般タブ
2. マイアプリ > ウェブアイコン `</>`
3. アプリのニックネーム: `WebApp`
4. Firebase Hosting のチェックは**外す**
5. アプリを登録
6. 以下の形式の設定をコピー:

```json
{
  "apiKey": "AIza...",
  "authDomain": "airenovation-newclient.firebaseapp.com",
  "projectId": "airenovation-newclient",
  "storageBucket": "airenovation-newclient.firebasestorage.app",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef..."
}
```

**B. Service Account の取得**

1. プロジェクト設定 > サービスアカウントタブ
2. 「新しい秘密鍵の生成」
3. 「キーを生成」
4. ダウンロードされたJSONファイルの**内容全体**をコピー

### Phase 2: GitHub Secrets 設定（3分）

#### 2-1. GitHub Secrets への追加

1. GitHubリポジトリ > Settings > Secrets and variables > Actions
2. 以下の3つのSecretsを追加:

**A. Firebase Config**
- 名前: `FIREBASE_CONFIG_NEWCLIENT`
- 値: Phase 1-3-A で取得したJSON（波括弧含む完全形式）

**B. Firebase Service Account**
- 名前: `FIREBASE_SERVICE_ACCOUNT_NEWCLIENT`
- 値: Phase 1-3-B で取得したService Account JSON

**C. Gemini API Key**
- 名前: `GEMINI_API_KEY_NEWCLIENT`
- 値: クライアント専用のGemini APIキー

#### 2-2. Gemini API Key の HTTPリファラー設定

Gemini APIキーにHTTPリファラー制限を設定します：

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Gemini APIキーが作成されているプロジェクトを選択
3. **APIs & Services** > **Credentials**
4. 該当する **APIキー** をクリック
5. **Application restrictions** セクション:
   - **HTTP referrers (web sites)** を選択
6. **Add an item** で以下を追加:
   ```
   https://airenovation-newclient.web.app/*
   https://airenovation-newclient.firebaseapp.com/*
   http://localhost:*
   ```
7. **Save** をクリック

**重要**:
- 末尾の `/*` を必ず含めてください
- `localhost:*` は開発・テスト用です
- 設定反映まで数分かかる場合があります

### Phase 3: GitHub Actions ワークフロー更新（5分）

#### 3-1. Manual Deploy ワークフローの更新

`.github/workflows/manual-deploy.yml` を編集:

**A. クライアント選択肢に追加**（18行目付近）
```yaml
options:
  - default
  - hitotoiro
  - ishibashihome
  - newclient  # ← 追加
```

**B. Firebase Config の分岐に追加**（53行目付近）
```yaml
if [ "$CLIENT_UPPER" = "DEFAULT" ]; then
  CONFIG_JSON='${{ secrets.FIREBASE_CONFIG_DEFAULT }}'
elif [ "$CLIENT_UPPER" = "HITOTOIRO" ]; then
  CONFIG_JSON='${{ secrets.FIREBASE_CONFIG_HITOTOIRO }}'
elif [ "$CLIENT_UPPER" = "ISHIBASHIHOME" ]; then
  CONFIG_JSON='${{ secrets.FIREBASE_CONFIG_ISHIBASHIHOME }}'
elif [ "$CLIENT_UPPER" = "NEWCLIENT" ]; then  # ← 追加
  CONFIG_JSON='${{ secrets.FIREBASE_CONFIG_NEWCLIENT }}'
else
  echo "ERROR: Unknown client..." >&2
  exit 1
fi
```

**C. Gemini API Key の分岐に追加**（90行目付近）
```yaml
if [ "$CLIENT_UPPER" = "DEFAULT" ]; then
  GEMINI_API_KEY='${{ secrets.GEMINI_API_KEY_DEFAULT }}'
elif [ "$CLIENT_UPPER" = "HITOTOIRO" ]; then
  GEMINI_API_KEY='${{ secrets.GEMINI_API_KEY_HITOTOIRO }}'
elif [ "$CLIENT_UPPER" = "ISHIBASHIHOME" ]; then
  GEMINI_API_KEY='${{ secrets.GEMINI_API_KEY_ISHIBASHIHOME }}'
elif [ "$CLIENT_UPPER" = "NEWCLIENT" ]; then  # ← 追加
  GEMINI_API_KEY='${{ secrets.GEMINI_API_KEY_NEWCLIENT }}'
else
  echo "ERROR: Unknown client..." >&2
  exit 1
fi
```

#### 3-2. Auto Deploy ワークフローの更新

`.github/workflows/auto-deploy-all-clients.yml` を編集:

**A. クライアントマトリクスに追加**（14行目付近）
```yaml
strategy:
  matrix:
    client:
      - default
      - hitotoiro
      - ishibashihome
      - newclient  # ← 追加
```

**B. Firebase Config の分岐に追加**（同様に追加）
**C. Gemini API Key の分岐に追加**（同様に追加）

#### 3-3. 変更をコミット & プッシュ

```bash
git add .github/workflows/
git commit -m "feat: newclient環境を追加"
git push
```

### Phase 4: Firestore & Storage ルール設定（3分）

#### 4-1. Firestore Rules

1. Firebase Console > Firestore Database > ルール
2. 以下に置き換え:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // PIN認証用の設定読み取り許可
    match /config/auth {
      allow read: if true;
    }

    // その他全てのコレクションは読み書き許可
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. 「公開」をクリック

#### 4-2. Cloud Storage Rules

1. Firebase Console > Storage > ルール
2. 以下に置き換え:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. 「公開」をクリック

#### 4-3. PINコード設定

1. Firestore Database > データタブ
2. コレクションを開始 > コレクションID: `config`
3. ドキュメントID: `auth`
4. フィールド追加:
   - フィールド: `pin`
   - 型: `string`
   - 値: `"123456"` （ダブルクォート含む）
5. 保存

### Phase 5: デプロイ & 動作確認（5分）

#### 5-1. 手動デプロイの実行

1. GitHub > Actions タブ
2. 「Manual Deploy to Client」を選択
3. Run workflow > Client: `newclient` を選択
4. Run workflow 実行

#### 5-2. デプロイ完了の確認

約2-3分でデプロイ完了。以下が表示されれば成功:

```
✅ Set client environment variables
✅ Build application
✅ Deploy to Firebase Hosting
✅ Success: https://airenovation-newclient.web.app
```

#### 5-3. アプリの動作確認

1. `https://airenovation-newclient.web.app` にアクセス
2. PINコード（123456）でログイン
3. 基本機能をテスト:
   - 画像アップロード
   - AIリノベーション
   - 見積もり機能

## 📊 作業時間の内訳

| Phase | 内容 | 時間 |
|-------|------|------|
| 1 | Firebase プロジェクト作成 | 5分 |
| 2 | GitHub Secrets 設定 | 3分 |
| 3 | ワークフロー更新 | 5分 |
| 4 | ルール & PIN 設定 | 3分 |
| 5 | デプロイ & 確認 | 5分 |
| **合計** | | **約20分** |

## ✅ 完成後の結果

- **クライアント名**: `newclient`
- **Firebase プロジェクト**: `airenovation-newclient`
- **URL**: `https://airenovation-newclient.web.app`
- **データ分離**: 完全に独立した環境
- **自動デプロイ**: コード更新時に自動反映

## 🔄 今後の運用

### 自動デプロイ

`main` ブランチへのプッシュで、全クライアント環境に自動デプロイされます。

### 手動デプロイ

特定のクライアントのみデプロイする場合:
1. GitHub > Actions > Manual Deploy to Client
2. クライアントを選択して実行

## ⚠️ トラブルシューティング

### よくある問題

| 問題 | 原因 | 解決法 |
|------|------|--------|
| GitHub Actions失敗 | Secret名が間違っている | 正確な命名規則で再設定 |
| JSON Parse Error | JSON形式が不正 | 波括弧含む完全形式で設定 |
| PIN認証エラー | Rules未設定 | Firestore Rules を設定・公開 |
| 画像アップロードエラー | Storage Rules未設定 | Storage Rules を設定・公開 |
| デプロイ先が間違っている | .firebaserc の設定ミス | ワークフローを確認 |
| Gemini API 403エラー | HTTPリファラー未設定 | Google Cloud ConsoleでHTTPリファラーを設定 |

### エラーログの確認

1. **GitHub Actions**: Actions > 失敗したワークフロー > エラー詳細
2. **アプリエラー**: ブラウザのDevTools > Console
3. **Firebase**: Firebase Console > 各サービスのログ

## 📝 チェックリスト

新規クライアント追加時に以下を確認:

- [ ] Firebase プロジェクト作成完了
- [ ] Firestore, Storage, Hosting 有効化
- [ ] Firebase Config 取得
- [ ] Service Account 取得
- [ ] GitHub Secrets 3つ登録
- [ ] Gemini API Key の HTTPリファラー設定
- [ ] manual-deploy.yml 更新（3箇所）
- [ ] auto-deploy-all-clients.yml 更新（3箇所）
- [ ] 変更をプッシュ
- [ ] Firestore Rules 設定
- [ ] Storage Rules 設定
- [ ] PIN コード設定
- [ ] 手動デプロイ実行
- [ ] アプリ動作確認

---

**完了！新規クライアント環境の構築が完了しました。**
