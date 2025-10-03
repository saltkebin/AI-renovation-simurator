# デプロイ検証ガイド

**デプロイ日**: 2025/10/03
**ステータス**: ✅ 全テナントデプロイ完了

## 🎯 デプロイ完了したテナント

| # | テナント | プロジェクトID | URL | デプロイ |
|---|---------|---------------|-----|---------|
| 1 | デフォルト（デモ） | airenovation2 | https://airenovation2.web.app | ✅ 完了 |
| 2 | ひととiro | renovation-sasaki | https://renovation-sasaki.web.app | ✅ 完了 |
| 3 | 石橋ホーム | airenovation-horimoto | https://airenovation-horimoto.web.app | ✅ 完了 |

---

## ✅ 動作確認チェックリスト

各テナントで以下の機能を確認してください:

### 基本確認

#### テナント1: デフォルト（airenovation2）
- [ ] アプリにアクセスできる
- [ ] PIN認証が動作する
- [ ] メインメニューが表示される

#### テナント2: ひととiro（renovation-sasaki）
- [ ] アプリにアクセスできる
- [ ] PIN認証が動作する
- [ ] メインメニューが表示される

#### テナント3: 石橋ホーム（airenovation-horimoto）
- [ ] アプリにアクセスできる
- [ ] PIN認証が動作する
- [ ] メインメニューが表示される

---

### 🔐 Gemini API機能確認（重要！）

#### 1. 画像生成機能

**テスト手順:**
1. 「AIリノベーション」をクリック
2. 画像をアップロード
3. プロンプトを入力（例: "北欧風のリビングにする"）
4. 生成ボタンをクリック

**確認ポイント:**
- [ ] 画像が正常に生成される
- [ ] エラーが発生しない
- [ ] ブラウザのDevToolsでAPIキーが露出していない

#### 2. AI提案機能

**テスト手順:**
1. 画像生成後、「AI提案」ボタンをクリック
2. 提案が3つ表示されるか確認

**確認ポイント:**
- [ ] 提案が正常に表示される
- [ ] エラーが発生しない

#### 3. 見積生成機能

**テスト手順:**
1. 画像生成後、「見積もり作成」をクリック
2. 見積もりが生成されるか確認

**確認ポイント:**
- [ ] 見積もりが正常に生成される
- [ ] 金額が表示される

#### 4. チャットボット機能

**テスト手順:**
1. メインメニューから「営業支援AIチャット」をクリック
2. 業種を選択
3. メッセージを送信

**確認ポイント:**
- [ ] AIの応答が返ってくる
- [ ] ストリーミング表示が動作する
- [ ] エラーが発生しない

---

## 🔍 セキュリティ確認

### ブラウザDevToolsでAPIキー露出チェック

#### 確認手順:

1. **ブラウザでアプリを開く**
   - 例: https://airenovation2.web.app

2. **DevToolsを開く**
   - F12キーまたは右クリック > 検証

3. **Sourcesタブを開く**
   - `Sources` タブをクリック
   - `Page` > `(index)` > `assets` > `index-*.js` を開く

4. **APIキー検索**
   - `Ctrl+F` で検索ボックスを開く
   - `AIzaSy` で検索

**期待される結果:**
- ❌ **APIキーが見つからないこと**
- ✅ **"No matches found" と表示されること**

**もしAPIキーが見つかった場合:**
- ⚠️ セキュリティ実装が正しく動作していません
- キャッシュクリアしてリロード
- それでも見つかる場合は再デプロイが必要

---

## 🚨 トラブルシューティング

### エラー1: "Gemini APIキーの取得に失敗しました"

**原因:**
- Secret Managerの設定が正しくない
- 権限が付与されていない

**解決法:**
```bash
# 権限確認
gcloud secrets get-iam-policy GEMINI_API_KEY --project=PROJECT_ID

# 権限が無い場合は再付与
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=PROJECT_ID
```

### エラー2: "Function not found"

**原因:**
- Cloud Functionsがデプロイされていない

**解決法:**
```bash
# Functionsのデプロイ状況確認
gcloud functions list --project=PROJECT_ID

# 再デプロイ
firebase deploy --only functions --project=PROJECT_ID
```

### エラー3: 画像生成が動作しない

**原因:**
- APIキーが正しくない
- Quota超過

**解決法:**
1. Secret Managerのキーを確認
2. Google AI Studioでクォータ確認
3. APIキーを再発行して更新

---

## 📊 Cloud Functionsログ確認

各テナントでログを確認:

```bash
# テナント1
gcloud functions logs read callGeminiGenerate --project=airenovation2 --limit=10

# テナント2
gcloud functions logs read callGeminiGenerate --project=renovation-sasaki --limit=10

# テナント3
gcloud functions logs read callGeminiGenerate --project=airenovation-horimoto --limit=10
```

**正常なログ例:**
```
Successfully retrieved Gemini API key from Secret Manager
Calling Gemini API
Gemini API call successful
```

**エラーログ例:**
```
Failed to retrieve Gemini API key from Secret Manager
Error: Permission denied
```

---

## 🎯 パフォーマンス確認

### レスポンスタイム

**Before（フロントエンドから直接API呼び出し）:**
- 画像生成: 約5-10秒

**After（Cloud Function経由）:**
- 画像生成: 約5-12秒（+1-2秒のオーバーヘッド）
- 許容範囲内

### Cold Start対策

**初回リクエストが遅い場合:**
- Cloud Functionsのコールドスタートが原因
- 2回目以降は高速化

**改善策（オプション）:**
- Cloud Schedulerで定期的にウォームアップ
- Min instancesを設定（コスト増）

---

## ✅ 完了確認

全ての確認が完了したら:

### テナント1: airenovation2
- [ ] 基本機能確認
- [ ] Gemini API機能確認
- [ ] セキュリティ確認（APIキー露出なし）
- [ ] ログ確認

### テナント2: renovation-sasaki
- [ ] 基本機能確認
- [ ] Gemini API機能確認
- [ ] セキュリティ確認（APIキー露出なし）
- [ ] ログ確認

### テナント3: airenovation-horimoto
- [ ] 基本機能確認
- [ ] Gemini API機能確認
- [ ] セキュリティ確認（APIキー露出なし）
- [ ] ログ確認

---

## 🎉 成功の指標

全てのテナントで:
- ✅ 画像生成が正常に動作
- ✅ チャットボットが正常に動作
- ✅ ブラウザのソースコードにAPIキーが露出していない
- ✅ Cloud Functionsログにエラーがない
- ✅ レスポンスタイムが許容範囲内

**これらが確認できれば、セキュリティ実装は完全に成功です！**

---

## 📝 次のステップ

デプロイ検証完了後:

1. **監視設定（推奨）**
   - Cloud FunctionsのメトリクスをGoogle Cloud Consoleで確認
   - アラート設定（エラー率、レスポンスタイム）

2. **コスト監視**
   - Secret Manager使用料: 無料枠内
   - Cloud Functions使用料: 従量課金
   - Gemini API使用料: テナントごとに追跡可能

3. **ドキュメント更新**
   - 運用マニュアル作成
   - トラブルシューティング追加

4. **定期メンテナンス**
   - 月次でログ確認
   - APIキーのローテーション（6ヶ月ごと推奨）

---

**デプロイ完了おめでとうございます！安全なアーキテクチャになりました。**
