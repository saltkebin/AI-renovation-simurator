import React, { useState, useEffect, useRef } from 'react';
import { TenantQuotationSettings } from '../types';
import { ArrowLeftIcon, BuildingOfficeIcon, CogIcon, SparklesIcon, PhotoIcon, XMarkIcon } from './Icon';
import { db, storage } from '../services/firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface TenantSettingsPageProps {
  onNavigateBack: () => void;
  tenantId: string;
}

const TenantSettingsPage: React.FC<TenantSettingsPageProps> = ({ onNavigateBack, tenantId }) => {
  const [activeTab, setActiveTab] = useState<'company' | 'defaults' | 'ai'>('company');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<TenantQuotationSettings>({
    tenantId,
    companyInfo: {
      name: '',
      logo: '',
      postalCode: '',
      address: '',
      tel: '',
      fax: '',
      email: '',
      website: '',
      registrationNumber: '',
    },
    quotationDefaults: {
      validityPeriod: 30,
      paymentTerms: '工事完了後、当月末締め翌月末払い',
      taxRate: 10,
      notes: '',
    },
    aiCustomData: {
      companyPolicy: '',
      pricingGuidelines: '',
      commonDiscounts: '',
      specialNotes: '',
    },
  });

  // Load settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'tenantQuotationSettings', tenantId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as TenantQuotationSettings;
          setSettings({ ...data, id: docSnap.id });
        }
      } catch (error) {
        console.error('Failed to load tenant settings:', error);
        setSaveMessage({ type: 'error', text: '設定の読み込みに失敗しました' });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [tenantId]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const docRef = doc(db, 'tenantQuotationSettings', tenantId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, settings as any);
      } else {
        // Create new document
        await setDoc(docRef, settings);
      }

      setSaveMessage({ type: 'success', text: '設定を保存しました' });
    } catch (error) {
      console.error('Failed to save tenant settings:', error);
      setSaveMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveMessage({ type: 'error', text: '画像ファイルを選択してください' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'ファイルサイズは2MB以下にしてください' });
      return;
    }

    setIsUploadingLogo(true);
    setSaveMessage(null);

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `tenants/${tenantId}/logo/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update settings with new logo URL
      setSettings({
        ...settings,
        companyInfo: {
          ...settings.companyInfo,
          logo: downloadURL
        }
      });

      setSaveMessage({ type: 'success', text: 'ロゴをアップロードしました' });
    } catch (error) {
      console.error('Failed to upload logo:', error);
      setSaveMessage({ type: 'error', text: 'ロゴのアップロードに失敗しました' });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings.companyInfo.logo) return;

    try {
      // Delete from Firebase Storage
      const logoRef = ref(storage, settings.companyInfo.logo);
      await deleteObject(logoRef);

      // Update settings
      setSettings({
        ...settings,
        companyInfo: {
          ...settings.companyInfo,
          logo: ''
        }
      });

      setSaveMessage({ type: 'success', text: 'ロゴを削除しました' });
    } catch (error) {
      console.error('Failed to remove logo:', error);
      setSaveMessage({ type: 'error', text: 'ロゴの削除に失敗しました' });
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
              <CogIcon className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-800">テナント設定</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 max-w-5xl">
        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {saveMessage.text}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'company' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5" />
              <span>会社情報</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('defaults')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'defaults' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <div className="flex items-center gap-2">
              <CogIcon className="w-5 h-5" />
              <span>見積書デフォルト設定</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'ai' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5" />
              <span>AI支援データ</span>
            </div>
          </button>
        </div>

        {/* Company Info Tab */}
        {activeTab === 'company' && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">会社情報</h2>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">会社ロゴ</label>
              <div className="flex items-start gap-4">
                {settings.companyInfo.logo ? (
                  <div className="relative">
                    <img
                      src={settings.companyInfo.logo}
                      alt="Company Logo"
                      className="h-24 w-auto object-contain border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUploadingLogo ? 'アップロード中...' : 'ロゴを選択'}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF (最大2MB)</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">会社名 *</label>
                <input
                  type="text"
                  value={settings.companyInfo.name}
                  onChange={(e) => setSettings({ ...settings, companyInfo: { ...settings.companyInfo, name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="株式会社○○建設"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">登録番号</label>
                <input
                  type="text"
                  value={settings.companyInfo.registrationNumber}
                  onChange={(e) => setSettings({ ...settings, companyInfo: { ...settings.companyInfo, registrationNumber: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="T1234567890123"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">郵便番号 *</label>
                <input
                  type="text"
                  value={settings.companyInfo.postalCode}
                  onChange={(e) => setSettings({ ...settings, companyInfo: { ...settings.companyInfo, postalCode: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">電話番号 *</label>
                <input
                  type="tel"
                  value={settings.companyInfo.tel}
                  onChange={(e) => setSettings({ ...settings, companyInfo: { ...settings.companyInfo, tel: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="03-1234-5678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">住所 *</label>
              <input
                type="text"
                value={settings.companyInfo.address}
                onChange={(e) => setSettings({ ...settings, companyInfo: { ...settings.companyInfo, address: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="東京都○○区○○ 1-2-3"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">FAX</label>
                <input
                  type="tel"
                  value={settings.companyInfo.fax}
                  onChange={(e) => setSettings({ ...settings, companyInfo: { ...settings.companyInfo, fax: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="03-1234-5679"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">メールアドレス *</label>
                <input
                  type="email"
                  value={settings.companyInfo.email}
                  onChange={(e) => setSettings({ ...settings, companyInfo: { ...settings.companyInfo, email: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="info@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ウェブサイト</label>
              <input
                type="url"
                value={settings.companyInfo.website}
                onChange={(e) => setSettings({ ...settings, companyInfo: { ...settings.companyInfo, website: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>
        )}

        {/* Quotation Defaults Tab */}
        {activeTab === 'defaults' && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">見積書デフォルト設定</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">有効期限（日数）</label>
                <input
                  type="number"
                  value={settings.quotationDefaults.validityPeriod}
                  onChange={(e) => setSettings({ ...settings, quotationDefaults: { ...settings.quotationDefaults, validityPeriod: parseInt(e.target.value) || 0 } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">消費税率（%）</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.quotationDefaults.taxRate}
                  onChange={(e) => setSettings({ ...settings, quotationDefaults: { ...settings.quotationDefaults, taxRate: parseFloat(e.target.value) || 0 } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">支払条件</label>
              <input
                type="text"
                value={settings.quotationDefaults.paymentTerms}
                onChange={(e) => setSettings({ ...settings, quotationDefaults: { ...settings.quotationDefaults, paymentTerms: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="工事完了後、当月末締め翌月末払い"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">デフォルト備考</label>
              <textarea
                value={settings.quotationDefaults.notes}
                onChange={(e) => setSettings({ ...settings, quotationDefaults: { ...settings.quotationDefaults, notes: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="見積書に記載する標準的な備考を入力してください"
              />
            </div>
          </div>
        )}

        {/* AI Custom Data Tab */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-800">AI見積アシスタント用データ</h2>
              <p className="text-sm text-gray-600 mt-1">ここで設定した情報は、AI見積アシスタントが見積書作成を支援する際に参照します</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">会社方針・強み</label>
              <textarea
                value={settings.aiCustomData.companyPolicy}
                onChange={(e) => setSettings({ ...settings, aiCustomData: { ...settings.aiCustomData, companyPolicy: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="例：高品質な施工と迅速な対応を心がけています。地域密着型で、アフターサービスにも力を入れています。"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">価格設定ガイドライン</label>
              <textarea
                value={settings.aiCustomData.pricingGuidelines}
                onChange={(e) => setSettings({ ...settings, aiCustomData: { ...settings.aiCustomData, pricingGuidelines: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="例：塗装工事は1㎡あたり3,000〜5,000円、内装工事は面積と材料によって変動。人工代は1日あたり20,000円を基準とする。"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">一般的な値引き条件</label>
              <textarea
                value={settings.aiCustomData.commonDiscounts}
                onChange={(e) => setSettings({ ...settings, aiCustomData: { ...settings.aiCustomData, commonDiscounts: e.target.value } })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="例：100万円以上の工事で5%割引、リピーター様は3%割引、紹介割引あり"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">特記事項のパターン</label>
              <textarea
                value={settings.aiCustomData.specialNotes}
                onChange={(e) => setSettings({ ...settings, aiCustomData: { ...settings.aiCustomData, specialNotes: e.target.value } })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="例：天候による工期変動の可能性、近隣への配慮事項、産業廃棄物処理費用は別途など"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TenantSettingsPage;
