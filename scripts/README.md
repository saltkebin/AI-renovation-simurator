# 自動化スクリプト

このディレクトリには、新規クライアント追加を自動化するスクリプトが含まれています。

## 📋 スクリプト一覧

### 🚀 `setup-new-client.sh`
**新規クライアント完全セットアップ**

すべての必要な設定を自動で実行します：
- GitHub Actions workflows更新
- CORS設定適用
- ドキュメント更新
- Git commit

```bash
./scripts/setup-new-client.sh <client-name> <firebase-project-id>

# 例:
./scripts/setup-new-client.sh newclient airenovation-newclient
```

### 🔧 `setup-client-cors.sh`
**CORS設定のみ**

既存プロジェクトにCORS設定を適用する場合：

```bash
./scripts/setup-client-cors.sh <client-name> <firebase-project-id>

# 例:
./scripts/setup-client-cors.sh newclient airenovation-newclient
```

## 📋 前提条件

- **gcloud CLI**: インストール済み・認証済み
- **Firebase プロジェクト**: 作成済み（Storage有効化）
- **GitHub Secrets**: 手動で設定済み

## 🔄 使用例

### 新規クライアント「company123」を追加する場合

1. **Firebaseプロジェクト作成**（手動）
   - プロジェクト名: `airenovation-company123`
   - Storage, Firestore, Hosting有効化

2. **GitHub Secrets設定**（手動）
   - `FIREBASE_CONFIG_COMPANY123`
   - `FIREBASE_SERVICE_ACCOUNT_COMPANY123`
   - `GEMINI_API_KEY_COMPANY123`

3. **自動化スクリプト実行**
   ```bash
   ./scripts/setup-new-client.sh company123 airenovation-company123
   ```

4. **手動で完了**
   - Firestore/Storage rules設定
   - PIN認証設定
   - デプロイテスト

## 🌐 現在のクライアント

| Client | Firebase Project | URL |
|--------|-----------------|-----|
| default | `airenovation2` | https://airenovation2.web.app |
| hitotoiro | `airenovation-hitotoiro` | https://airenovation-hitotoiro.web.app |
| ishibashihome | `airenovation-horimoto` | https://airenovation-horimoto.web.app |

## ⚠️ 注意事項

- スクリプト実行前に必ずFirebaseプロジェクトとSecretsの準備を完了してください
- CORS設定にはgcloud認証が必要です
- スクリプト実行後にデプロイテストを行ってください

## 🔧 トラブルシューティング

### gcloud認証エラー
```bash
gcloud auth login
gcloud config set project <firebase-project-id>
```

### Bucket not found エラー
Firebase StorageがFirebaseコンソールで有効化されているか確認してください。

### GitHub Actions失敗
必要なSecretsがすべて設定されているか確認してください：
- `FIREBASE_CONFIG_[CLIENT_UPPER]`
- `FIREBASE_SERVICE_ACCOUNT_[CLIENT_UPPER]`
- `GEMINI_API_KEY_[CLIENT_UPPER]`