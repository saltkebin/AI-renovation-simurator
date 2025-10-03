import React, { useState, useEffect } from 'react';
import type { TenantEmailSettings } from '../types';
import { ArrowLeftIcon, SparklesIcon, CheckCircleIcon, XMarkIcon } from './Icon';
import { db, functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';

interface TenantEmailSettingsPageProps {
  onNavigateBack: () => void;
  tenantId: string;
}

const TenantEmailSettingsPage: React.FC<TenantEmailSettingsPageProps> = ({
  onNavigateBack,
  tenantId
}) => {
  const [emailSettings, setEmailSettings] = useState<TenantEmailSettings>({
    tenantId,
    provider: 'sendgrid',
    sendgridApiKey: '',
    senderEmail: '',
    senderName: '',
    isVerified: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Load email settings
  useEffect(() => {
    loadEmailSettings();
  }, [tenantId]);

  const loadEmailSettings = async () => {
    try {
      const settingsCollection = collection(db, 'tenantEmailSettings');
      const q = query(settingsCollection, where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as TenantEmailSettings;
        setEmailSettings({ ...data, id: snapshot.docs[0].id });
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!emailSettings.sendgridApiKey || !emailSettings.senderEmail) {
      setSaveMessage({ type: 'error', text: 'SendGrid API Keyと送信元メールアドレスは必須です' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailSettings.senderEmail)) {
      setSaveMessage({ type: 'error', text: '有効なメールアドレスを入力してください' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const dataToSave = {
        tenantId: emailSettings.tenantId,
        provider: 'sendgrid',
        sendgridApiKey: emailSettings.sendgridApiKey,
        senderEmail: emailSettings.senderEmail,
        senderName: emailSettings.senderName,
        isVerified: false, // Force re-verification on save
        lastTestedAt: null,
        testResult: null,
        errorMessage: null,
        updatedAt: Timestamp.now(),
      };

      if (emailSettings.id) {
        // Update existing
        const docRef = doc(db, 'tenantEmailSettings', emailSettings.id);
        await updateDoc(docRef, dataToSave);
      } else {
        // Create new
        await addDoc(collection(db, 'tenantEmailSettings'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
        });
      }

      setSaveMessage({ type: 'success', text: '設定を保存しました。APIキーを検証してください。' });
      await loadEmailSettings();
    } catch (error) {
      console.error('Failed to save email settings:', error);
      setSaveMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyApiKey = async () => {
    if (!emailSettings.id) {
      setSaveMessage({ type: 'error', text: '先に設定を保存してください' });
      return;
    }

    setIsVerifying(true);
    setSaveMessage(null);

    try {
      const verifyFunction = httpsCallable(functions, 'verifySendGridApiKey');
      const result = await verifyFunction({ apiKey: emailSettings.sendgridApiKey });
      const { success, error } = result.data as { success: boolean; error?: string };

      const docRef = doc(db, 'tenantEmailSettings', emailSettings.id);
      await updateDoc(docRef, {
        isVerified: success,
        lastTestedAt: Timestamp.now(),
        testResult: success ? 'success' : 'failure',
        errorMessage: error || null,
      });

      if (success) {
        setSaveMessage({ type: 'success', text: 'APIキーは有効です。メール送信機能が有効になりました。' });
      } else {
        setSaveMessage({ type: 'error', text: `APIキーの検証に失敗しました: ${error}` });
      }

      await loadEmailSettings();
    } catch (error: any) {
      console.error('API Key verification failed:', error);
      setSaveMessage({ type: 'error', text: `検証中にエラーが発生しました: ${error.message}` });
      const docRef = doc(db, 'tenantEmailSettings', emailSettings.id);
      await updateDoc(docRef, {
        isVerified: false,
        lastTestedAt: Timestamp.now(),
        testResult: 'failure',
        errorMessage: error.message,
      });
      await loadEmailSettings();
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateBack}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>戻る</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <SparklesIcon className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-800">メール送信設定</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {saveMessage.text}
          </div>
        )}

        {/* Status Card */}
        <div className={`mb-6 p-6 rounded-xl border-2 ${emailSettings.isVerified ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
          <div className="flex items-center gap-3 mb-2">
            {emailSettings.isVerified ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            ) : (
              <XMarkIcon className="w-6 h-6 text-yellow-600" />
            )}
            <h2 className="text-lg font-bold text-gray-800">
              {emailSettings.isVerified ? '✅ メール送信機能: 有効' : '⚠️ メール送信機能: 未検証'}
            </h2>
          </div>
          <p className="text-sm text-gray-700">
            {emailSettings.isVerified
              ? `送信元メールアドレス: ${emailSettings.senderEmail}`
              : 'メール送信を利用するには、SendGrid APIキーを保存後、検証をしてください。'
            }
          </p>
        </div>

        {/* Guide Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">📘 SendGrid設定ガイド</h2>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {showGuide ? '閉じる' : '表示する'}
            </button>
          </div>

          {showGuide && (
            <div className="space-y-4 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">ステップ1: SendGridアカウント作成</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li><a href="https://sendgrid.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">SendGrid公式サイト</a> にアクセス</li>
                  <li>「Start for Free」をクリック</li>
                  <li>メールアドレスとパスワードで登録</li>
                  <li>メール認証を完了</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">ステップ2: API Key取得</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>SendGrid管理画面にログイン</li>
                  <li>Settings → API Keys を選択</li>
                  <li>「Create API Key」をクリック</li>
                  <li>名前を入力（例: My App Email）</li>
                  <li>権限: 「Full Access」を選択</li>
                  <li>「Create & View」をクリック</li>
                  <li>表示されたAPI Keyをコピー</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">ステップ3: 下記フォームに入力</h3>
                <p>コピーしたAPI Keyと送信元メールアドレスを入力して保存してください。</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>ヒント:</strong> SendGrid無料プランは1日100通まで送信可能です。
                  月間40,000通以上必要な場合は有料プラン($19.95/月〜)をご検討ください。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">SendGrid設定</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              SendGrid API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={emailSettings.sendgridApiKey}
                onChange={(e) => setEmailSettings({ ...emailSettings, sendgridApiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
              >
                {showApiKey ? '隠す' : '表示'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              SendGrid管理画面で取得したAPI Keyを入力してください
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              送信元メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={emailSettings.senderEmail}
              onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="info@your-company.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              顧客に表示される送信元メールアドレス
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              送信者名（任意）
            </label>
            <input
              type="text"
              value={emailSettings.senderName || ''}
              onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="株式会社〇〇"
            />
            <p className="text-xs text-gray-500 mt-1">
              メールに表示される送信者名
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving || isVerifying}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '設定を保存'}
            </button>
            <button
              onClick={handleVerifyApiKey}
              disabled={isVerifying || isSaving || !emailSettings.id}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '検証中...' : 'APIキーを検証'}
            </button>
          </div>

          {emailSettings.lastTestedAt && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>最終検証日時:</strong>{' '}
                {new Date(emailSettings.lastTestedAt.toDate()).toLocaleString('ja-JP')}
              </p>
              <p className="text-sm text-gray-700">
                <strong>結果:</strong>{' '}
                {emailSettings.testResult === 'success' ? (
                  <span className="text-green-600">✅ 成功</span>
                ) : (
                  <span className="text-red-600">❌ 失敗</span>
                )}
              </p>
              {emailSettings.errorMessage && (
                <p className="text-sm text-red-600 mt-1">
                  エラー: {emailSettings.errorMessage}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TenantEmailSettingsPage;
