# Firebase Extensions - メール送信設定ガイド

このガイドでは、見積もりPDFをメールで送信するためのFirebase Extension設定方法を説明します。

## 必要な拡張機能

**Trigger Email from Firestore** (公式Firebase拡張機能)

## セットアップ手順

### 1. Firebase Consoleにアクセス

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択
3. 左メニューから「Extensions」を選択

### 2. Trigger Email拡張機能のインストール

1. 「Extensions」ページで「Browse Extensions」をクリック
2. 検索バーで「Trigger Email」を検索
3. **「Trigger Email from Firestore」** を選択
4. 「Install」ボタンをクリック

### 3. 拡張機能の設定

インストール時に以下の設定を行います：

#### 基本設定

- **Email documents collection**: `mail`
  - アプリから作成するコレクション名
- **Default FROM email address**: `salt@webyorozuya.net`
  - 送信元メールアドレス（全テナント共通）
- **Default REPLY-TO email address**: **空欄のまま**
  - アプリ側で各テナントのメールアドレスを自動設定

#### SMTP設定

以下のいずれかのSMTPプロバイダーを選択：

##### オプション1: Gmail使用（salt@webyorozuya.net）

```
SMTP connection URI: smtps://salt@webyorozuya.net:APP_PASSWORD@smtp.gmail.com:465
```

⚠️ **重要**: Gmailの場合、アプリパスワードを生成する必要があります：
1. salt@webyorozuya.net のGoogleアカウント設定 > セキュリティ
2. 2段階認証を有効化
3. アプリパスワードを生成
4. 生成された16文字のパスワードを上記URIの`APP_PASSWORD`部分に入力（スペースなし）

##### オプション2: SendGrid使用（本番環境推奨）

```
SMTP connection URI: smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
```

SendGrid APIキーの取得：
1. [SendGrid](https://sendgrid.com/) でアカウント作成
2. Settings > API Keys
3. 新しいAPIキーを作成
4. フルアクセス権限を付与

##### オプション3: AWS SES使用（大量送信向け）

```
SMTP connection URI: smtps://USERNAME:PASSWORD@email-smtp.us-east-1.amazonaws.com:465
```

### 4. Cloud Firestoreセキュリティルールの更新

`firestore.rules`に以下を追加：

```javascript
match /mail/{mailId} {
  // アプリケーションからのみ書き込み可能
  allow create: if request.auth != null || true; // 認証状態に応じて調整
  // Extensionが読み取り・更新可能
  allow read, update, delete: if false;
}
```

### 5. テスト

1. アプリケーションで見積もりを作成
2. 顧客情報にメールアドレスを入力
3. 「メール送信」ボタンをクリック
4. メールプレビューで内容を確認
5. 送信ボタンをクリック

#### デバッグ方法

Firebase Consoleで確認：

```
1. Firestore Database > mail コレクション
2. 送信したメールのドキュメントを確認
3. `delivery`フィールドをチェック：
   - state: 'SUCCESS' → 送信成功
   - state: 'ERROR' → エラー発生（error.messageを確認）
```

## メールドキュメント構造

アプリケーションが作成するドキュメント構造：

```javascript
{
  to: "customer@example.com",
  from: "salt@webyorozuya.net",  // 送信元（全テナント共通）
  replyTo: "tenant@example.com",  // 返信先（各テナント個別）
  message: {
    subject: "見積書の送付について",
    text: "本文（プレーンテキスト）",
    html: "本文（HTML形式）",
    attachments: [{
      filename: "quotation_山田太郎.pdf",
      path: "https://firebasestorage.googleapis.com/..."
    }]
  },
  tenantId: "default",
  quotationId: "abc123",
  createdAt: Timestamp
}
```

### メール送受信の仕組み

**送信元**: `salt@webyorozuya.net`（全テナント共通）
- SMTP認証に使用
- 顧客のメールボックスに表示される送信元

**返信先**: 各テナントのメールアドレス（`tenantQuotationSettings.companyInfo.email`）
- 顧客が返信ボタンを押したときの宛先
- 各テナントが個別に設定可能

## セキュリティベストプラクティス

1. **本番環境では必ず認証を有効化**
   ```javascript
   allow create: if request.auth != null;
   ```

2. **テナントIDでフィルタリング**
   ```javascript
   allow create: if request.auth.token.tenantId == request.resource.data.tenantId;
   ```

3. **レート制限の実装**
   - App Checkを有効化
   - Cloud Functionsでレート制限を実装

4. **SMTP認証情報の保護**
   - Secret Managerに保存（推奨）
   - 環境変数として設定

## 費用

- **Firebase Extensions**: 無料
- **Cloud Functions**: 無料枠内で十分
  - 月間200万回の呼び出し
- **SendGrid**: 無料プランあり
  - 月間100通まで無料

## トラブルシューティング

### メールが送信されない

1. Firestore `mail`コレクションを確認
2. `delivery.state`が`ERROR`の場合、`delivery.error.message`を確認
3. SMTP認証情報が正しいか確認
4. 送信元メールアドレスがSMTPプロバイダーで認証されているか確認

### PDFが添付されない

1. Firebase Storage URLが公開アクセス可能か確認
2. Storage Rulesを確認：
   ```javascript
   match /quotations/{pdfId} {
     allow read: if true; // または適切な権限設定
   }
   ```

### Gmail App Passwordの問題

- 2段階認証が有効になっているか確認
- アプリパスワードは16文字（スペース除く）
- SMTPユーザー名はGmailアドレス全体

## 参考リンク

- [Firebase Extensions - Trigger Email](https://firebase.google.com/products/extensions/firestore-send-email)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
