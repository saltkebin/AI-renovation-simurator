import React, { useState, useEffect } from 'react';
import GuideSection from './GuideSection';
import GuideChatBot from './GuideChatBot';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  HomeIcon,
  SparklesIcon,
  PaintBrushIcon,
  CalculatorIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  LightBulbIcon
} from './Icon';

interface UserGuidePageProps {
  onNavigateBack: () => void;
  onStartTutorial: () => void;
  tenantId: string;
}

interface TableOfContentsItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  subsections?: { id: string; title: string }[];
}

const UserGuidePage: React.FC<UserGuidePageProps> = ({ onNavigateBack, onStartTutorial, tenantId }) => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [isTocOpen, setIsTocOpen] = useState(true);

  // ユーザーガイドの全文（AIチャットボット用）
  const userGuideContent = `
# AIリノベーション 機能ガイド

## はじめに
AIリノベーション・シミュレーターは、写真から理想の空間を作り、見積もりまで自動生成できるツールです。
6桁のPINコードでログインして、すぐに使い始められます。

## 主な機能
1. AIリノベーション - 写真から理想の空間デザインを生成
2. 外装デザイン - スケッチから外観パース、外壁塗装シミュレーション
3. AI見積もり - 画像から自動で概算見積もりを作成
4. 本格見積もり管理 - 正式な見積書の作成・編集・管理
5. 営業支援AIチャット - 提案書作成、商談準備をサポート
6. 商品データベース - 塗料・壁紙・家具などの商品管理
7. 見積書設定 - 項目マスター、テンプレート、会社情報の管理
`;

  const tableOfContents: TableOfContentsItem[] = [
    {
      id: 'getting-started',
      title: 'はじめに',
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      id: 'ai-renovation',
      title: 'AIリノベーション',
      icon: <SparklesIcon className="w-5 h-5" />,
      subsections: [
        { id: 'ai-renovation-basic', title: '基本の使い方' },
        { id: 'ai-renovation-styles', title: 'スタイルカテゴリー' },
        { id: 'ai-renovation-products', title: '商品を使ったリノベーション' },
        { id: 'ai-renovation-fine-tuning', title: '微調整（ファインチューニング）' },
      ]
    },
    {
      id: 'exterior-design',
      title: '外装デザイン',
      icon: <PaintBrushIcon className="w-5 h-5" />,
      subsections: [
        { id: 'exterior-sketch', title: 'スケッチから外観パース' },
        { id: 'exterior-paint', title: '外壁塗装デザイン' },
      ]
    },
    {
      id: 'ai-quotation',
      title: 'AI見積もり',
      icon: <CalculatorIcon className="w-5 h-5" />,
      subsections: [
        { id: 'quotation-estimate', title: '概算見積もり' },
        { id: 'quotation-save', title: '本格見積もり用として保存' },
      ]
    },
    {
      id: 'quotation-management',
      title: '本格見積もり管理',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      subsections: [
        { id: 'quotation-create', title: '見積書の作成' },
        { id: 'quotation-edit', title: '見積書の編集' },
        { id: 'quotation-assistant', title: '見積書作成アシスタント' },
        { id: 'quotation-preview', title: 'プレビュー・出力' },
        { id: 'quotation-list', title: '見積書の管理' },
      ]
    },
    {
      id: 'sales-chat',
      title: '営業支援AIチャット',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    },
    {
      id: 'settings',
      title: '設定・管理機能',
      icon: <CogIcon className="w-5 h-5" />,
      subsections: [
        { id: 'settings-database', title: '商品データベース' },
        { id: 'settings-master', title: '項目マスター' },
        { id: 'settings-template', title: '見積テンプレート' },
        { id: 'settings-company', title: '会社情報設定' },
        { id: 'settings-email', title: 'メール認証設定' },
      ]
    },
    {
      id: 'tips',
      title: '便利な使い方',
      icon: <LightBulbIcon className="w-5 h-5" />,
    },
    {
      id: 'faq',
      title: 'よくある質問',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    }
  ];

  // スクロール位置に応じてアクティブセクションを更新
  useEffect(() => {
    const handleScroll = () => {
      const sections = tableOfContents.flatMap(item =>
        item.subsections
          ? item.subsections.map(sub => sub.id)
          : [item.id]
      );

      for (const sectionId of sections.reverse()) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-md sticky top-0 z-40">
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
              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-800">ユーザーガイド</h1>
            </div>
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className="md:hidden px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              {isTocOpen ? '目次を閉じる' : '目次を開く'}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 目次（サイドバー） */}
          <aside className={`${isTocOpen ? 'block' : 'hidden'} md:block w-64 flex-shrink-0`}>
            <div className="sticky top-24 bg-white rounded-xl shadow-md p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                目次
              </h2>
              <nav className="space-y-1">
                {tableOfContents.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        activeSection === item.id
                          ? 'bg-indigo-100 text-indigo-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-indigo-600">{item.icon}</span>
                      <span className="text-sm">{item.title}</span>
                    </button>
                    {item.subsections && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subsections.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => scrollToSection(sub.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors text-xs ${
                              activeSection === sub.id
                                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {sub.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1 bg-white rounded-xl shadow-md p-8">
            {/* はじめに */}
            <GuideSection
              id="getting-started"
              title="はじめに"
              icon={<HomeIcon className="w-7 h-7" />}
            >
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-6 rounded-lg mb-6">
                <h3 className="font-bold text-lg text-indigo-900 mb-2">AIリノベーション・シミュレーターへようこそ！</h3>
                <p className="text-gray-700 leading-relaxed">
                  このツールは、写真から理想の空間を作り、見積もりまで自動生成できる強力なアシスタントです。
                  初心者の方でも簡単に使えるよう設計されています。
                </p>
              </div>

              <h4 className="font-bold text-gray-800 mb-3 mt-6">🔐 ログイン方法</h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>アプリにアクセスすると、PIN認証画面が表示されます</li>
                  <li>管理者から提供された<strong>6桁のPINコード</strong>を入力</li>
                  <li>「認証」ボタンをクリックしてログイン</li>
                </ol>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                💡 PINコードを忘れた場合は、管理者にお問い合わせください
              </p>

              <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <LightBulbIcon className="w-12 h-12 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-purple-900 mb-2">📚 まずはチュートリアルで体験！</h4>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      初めての方は、インタラクティブなチュートリアルで基本操作を学びましょう。
                      実際の画像を使って、画像アップロードから生成、微調整、ダウンロードまでの流れを体験できます。
                    </p>
                    <button
                      onClick={onStartTutorial}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      チュートリアルを開始
                    </button>
                  </div>
                </div>
              </div>
            </GuideSection>

            {/* AIリノベーション */}
            <GuideSection
              id="ai-renovation"
              title="AIリノベーション"
              icon={<SparklesIcon className="w-7 h-7" />}
            >
              <div className="mb-6">
                <img
                  src="/images/guide/1.png"
                  alt="AIリノベーション画面"
                  className="w-full rounded-xl border-2 border-gray-300 shadow-lg"
                />
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                写真をアップロードするだけで、AIが理想的な空間デザインを自動生成します。
                7つのカテゴリーから選べるスタイルで、様々な提案が可能です。
              </p>

              <div id="ai-renovation-basic" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">📸 基本の使い方</h4>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 mb-1">画像をアップロード</h5>
                      <p className="text-sm text-gray-600">「画像をアップロード」エリアをクリックして、リノベーションしたい部屋の写真を選択。ドラッグ&ドロップでも追加できます。</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 mb-1">リノベーションスタイルを選択</h5>
                      <p className="text-sm text-gray-600">7つのカテゴリーからスタイルを選んでクリック。「生成」ボタンで実行します。</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 mb-1">結果を確認</h5>
                      <p className="text-sm text-gray-600">ビフォー・アフターをスライダーで比較。気に入らなければ別のスタイルを試せます。</p>
                    </div>
                  </div>
                </div>
              </div>

              <div id="ai-renovation-styles" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">🎨 スタイルカテゴリー</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-indigo-700 mb-2">デザインテイスト</h5>
                    <p className="text-sm text-gray-600">北欧風、和モダン、インダストリアルなど、部屋全体の雰囲気を変えます。</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-indigo-700 mb-2">カラーテーマ</h5>
                    <p className="text-sm text-gray-600">白基調、ダークシック、アースカラーなど、色の印象を変えます。</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-indigo-700 mb-2">素材</h5>
                    <p className="text-sm text-gray-600">無垢材、コンクリート、レンガ壁など、質感と素材感を変えます。</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-indigo-700 mb-2">機能改善</h5>
                    <p className="text-sm text-gray-600">照明改善、収納力アップ、開放感など、実用的な問題を解決します。</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-indigo-700 mb-2">空間コンセプト</h5>
                    <p className="text-sm text-gray-600">カフェ風、ホテルライク、ホームシアターなど、用途に合わせた空間に。</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-indigo-700 mb-2">部屋タイプ別</h5>
                    <p className="text-sm text-gray-600">リビング、キッチン、寝室など、部屋ごとに最適化します。</p>
                  </div>
                  <div className="bg-white border border-indigo-200 rounded-lg p-4 md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h5 className="font-semibold text-indigo-700 mb-2">✨ おまかせ（推奨）</h5>
                    <p className="text-sm text-gray-600">AIが自動で最適なリノベーションを提案。迷ったらこれ！</p>
                  </div>
                </div>
              </div>

              <div id="ai-renovation-products" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">🛋️ 商品を使ったリノベーション</h4>
                <p className="text-gray-700 mb-3">登録済みの商品（壁紙、塗料、家具など）を使ってリノベーションできます。</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>リノベーション画面で「商品を使う」をクリック</li>
                  <li>カテゴリーから絞り込んで、使いたい商品にチェック</li>
                  <li>「生成」ボタンで、選んだ商品が配置された空間が生成されます</li>
                </ol>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>便利な使い方：</strong> 壁紙カタログから選んで配置、家具の配置イメージを確認、複数商品の組み合わせをテスト
                  </p>
                </div>
              </div>

              <div id="ai-renovation-fine-tuning" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">🎯 微調整（ファインチューニング）</h4>
                <p className="text-gray-700 mb-3">生成結果をさらに細かく調整できます。</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>生成後に「微調整」ボタンをクリック</li>
                  <li>明るさ調整、色味変更、家具配置変更、装飾追加・削除などを選択</li>
                  <li>「再生成」で調整が反映されます</li>
                </ol>
              </div>
            </GuideSection>

            {/* 外装デザイン */}
            <GuideSection
              id="exterior-design"
              title="外装デザイン"
              icon={<PaintBrushIcon className="w-7 h-7" />}
              imagePlaceholder
            >
              <p className="text-gray-700 mb-4 leading-relaxed">
                建物の外観デザインをシミュレーション。スケッチからパース生成、外壁塗装のカラーシミュレーションが可能です。
              </p>

              <div id="exterior-sketch" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">🏠 スケッチから外観パース</h4>
                <p className="text-gray-700 mb-3">手書きスケッチを本格的な完成予想図に変換します。</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>「外装デザイン」モードを選択</li>
                  <li>「スケッチから外観」を選択</li>
                  <li>紙に描いたスケッチの写真、またはタブレットで描いたスケッチをアップロード</li>
                  <li>（任意）外壁の素材、屋根の形状・色、開口部のスタイルを微調整</li>
                  <li>「パースを生成」をクリック</li>
                </ol>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                  <p className="text-sm text-blue-800">
                    <strong>活用例：</strong> 提案前のイメージ確認、お客様への説明資料作成、複数案の比較検討
                  </p>
                </div>
              </div>

              <div id="exterior-paint" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">🎨 外壁塗装デザイン</h4>
                <p className="text-gray-700 mb-3">既存の建物写真から塗装後のイメージを生成します。</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>「外壁塗装」を選択</li>
                  <li>建物の写真をアップロード</li>
                  <li>塗料タイプを選択（シリコン、フッ素、無機、遮熱塗料など）</li>
                  <li>色・素材を調整</li>
                  <li>「塗装デザインを生成」をクリック</li>
                </ol>
              </div>
            </GuideSection>

            {/* AI見積もり */}
            <GuideSection
              id="ai-quotation"
              title="AI見積もり"
              icon={<CalculatorIcon className="w-7 h-7" />}
              imagePlaceholder
            >
              <p className="text-gray-700 mb-4 leading-relaxed">
                生成した画像から工事内容を自動で分析し、概算見積もりを作成します。
              </p>

              <div id="quotation-estimate" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">💰 概算見積もり</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>リノベーション画像生成後、「概算見積もり」ボタンをクリック</li>
                  <li>AIが自動で見積書を生成
                    <ul className="list-disc list-inside ml-6 mt-1 text-sm text-gray-600">
                      <li>工事項目を自動抽出</li>
                      <li>金額を自動算出</li>
                      <li>備考欄に工事内容を説明</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div id="quotation-save" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">📄 本格見積もり用として保存</h4>
                <p className="text-gray-700 mb-3">概算見積もりを正式見積もりとして保存できます。</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>概算見積もり表示中に「本格見積もり用として保存」をクリック</li>
                  <li>顧客情報を入力（顧客名、連絡先、住所、物件情報など）</li>
                  <li>「保存」をクリック</li>
                </ol>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                  <p className="text-sm text-green-800">
                    💡 保存後は「メインメニュー &gt; 本格見積もり管理」から詳細な編集が可能です
                  </p>
                </div>
              </div>
            </GuideSection>

            {/* 本格見積もり管理 */}
            <GuideSection
              id="quotation-management"
              title="本格見積もり管理"
              icon={<DocumentTextIcon className="w-7 h-7" />}
              imagePlaceholder
            >
              <p className="text-gray-700 mb-4 leading-relaxed">
                正式な見積書を作成・編集・管理できます。テンプレート機能で効率的に作業できます。
              </p>

              <div id="quotation-create" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">📋 見積書の作成</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">新規作成</h5>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4 text-sm">
                      <li>メインメニュー &gt; 本格見積もり管理</li>
                      <li>「新規作成」または「テンプレートから作成」をクリック</li>
                      <li>顧客情報・見積項目を入力</li>
                      <li>保存</li>
                    </ol>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <h5 className="font-semibold text-indigo-800 mb-1 text-sm">テンプレートを使う</h5>
                    <p className="text-xs text-indigo-700">よく使う見積パターンをテンプレート化しておくと、素早く見積書を作成できます。</p>
                  </div>
                </div>
              </div>

              <div id="quotation-edit" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">✏️ 見積書の編集</h4>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h5 className="font-semibold text-gray-800 mb-1">項目の追加・編集</h5>
                    <p className="text-sm text-gray-600">項目名、数量、単位、単価を入力。単価は1万円単位で調整可能。金額は自動計算されます。</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h5 className="font-semibold text-gray-800 mb-1">顧客情報の編集</h5>
                    <p className="text-sm text-gray-600">名前、連絡先（メール・電話）、住所、物件情報などを入力できます。</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h5 className="font-semibold text-gray-800 mb-1">備考欄の活用</h5>
                    <p className="text-sm text-gray-600">工事内容の詳細、支払い条件、その他特記事項を記載します。</p>
                  </div>
                </div>
              </div>

              <div id="quotation-assistant" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">🤖 見積書作成アシスタント</h4>
                <p className="text-gray-700 mb-3">AIが見積書作成をサポートします。</p>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-semibold text-purple-900 mb-2">提案機能</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
                    <li>新しい項目を提案</li>
                    <li>備考欄の文章を推敲</li>
                    <li>高額項目の代替案提示</li>
                    <li>項目の漏れチェック</li>
                  </ul>
                  <p className="text-xs text-purple-700 mt-3">
                    <strong>使い方：</strong> 見積書編集中に「AIアシスタント」を表示 → 提案ボタンをクリック → AIの提案を確認・採用
                  </p>
                </div>
              </div>

              <div id="quotation-preview" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">👀 プレビュー・出力</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h5 className="font-semibold text-gray-800 mb-1 text-sm">プレビュー</h5>
                    <p className="text-xs text-gray-600">「プレビューに進む」で確認。会社ロゴのサイズ調整、表示/非表示切替が可能です。</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h5 className="font-semibold text-gray-800 mb-1 text-sm">PDF出力</h5>
                    <p className="text-xs text-gray-600">プレビュー画面から「PDF出力」で印刷用の見積書を生成します。</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h5 className="font-semibold text-gray-800 mb-1 text-sm">メール送信</h5>
                    <p className="text-xs text-gray-600">顧客のメールアドレス入力済みなら送信可能（メール認証設定が必要）。</p>
                  </div>
                </div>
              </div>

              <div id="quotation-list" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">📊 見積書の管理</h4>
                <p className="text-gray-700 mb-3">一覧表示でステータス別に管理できます。</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                  <li>ステータス別表示（下書き・送付済み・承認済み など）</li>
                  <li>金額・作成日で確認</li>
                  <li>カードをクリックで編集</li>
                  <li>複製：似た見積書を素早く作成</li>
                  <li>削除：不要な見積書を削除</li>
                </ul>
              </div>
            </GuideSection>

            {/* 営業支援AIチャット */}
            <GuideSection
              id="sales-chat"
              title="営業支援AIチャット"
              icon={<ChatBubbleLeftRightIcon className="w-7 h-7" />}
              imagePlaceholder
            >
              <p className="text-gray-700 mb-4 leading-relaxed">
                営業活動をAIがサポート。提案書作成、商談準備、お客様対応などを支援します。
              </p>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">📝 提案書の作成支援</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
                    <li>お客様の要望から提案内容を整理</li>
                    <li>プレゼン資料の構成提案</li>
                    <li>訴求ポイントの整理</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-2">💼 商談準備</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-green-800">
                    <li>よくある質問への回答案</li>
                    <li>競合比較のポイント整理</li>
                    <li>クロージングトークの提案</li>
                  </ul>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-semibold text-purple-900 mb-2">💰 見積もり相談</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-purple-800">
                    <li>適正な価格設定のアドバイス</li>
                    <li>値引き対応の判断材料</li>
                    <li>オプション提案のアイデア</li>
                  </ul>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h5 className="font-semibold text-orange-900 mb-2">📧 お客様対応</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-orange-800">
                    <li>問い合わせへの返信文案</li>
                    <li>クレーム対応のアドバイス</li>
                    <li>フォローメールの文例</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 mt-6">
                <h5 className="font-semibold text-indigo-900 mb-2">使い方</h5>
                <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-800">
                  <li>メインメニュー &gt; 営業支援AIチャット</li>
                  <li>相談内容を入力</li>
                  <li>AIの提案を確認</li>
                  <li>必要に応じて追加質問</li>
                </ol>
              </div>
            </GuideSection>

            {/* 設定・管理機能 */}
            <GuideSection
              id="settings"
              title="設定・管理機能"
              icon={<CogIcon className="w-7 h-7" />}
            >
              <p className="text-gray-700 mb-6 leading-relaxed">
                商品データベース、見積書関連の設定を一元管理できます。
              </p>

              <div id="settings-database" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">📦 商品データベース</h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                  <h5 className="font-semibold text-gray-800 mb-2">商品の登録</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>メインメニュー &gt; 商品データベース</li>
                    <li>カテゴリーを選択または作成</li>
                    <li>「商品を登録」をクリック</li>
                    <li>商品情報を入力（商品名、メーカー・型番、価格、商品画像URL、説明）</li>
                    <li>保存</li>
                  </ol>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    💡 <strong>商品画像：</strong> 商品データベースにアップロードして使用できます
                  </p>
                </div>
              </div>

              <div id="settings-master" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">📝 項目マスター</h4>
                <p className="text-gray-700 mb-3 text-sm">よく使う見積項目を登録しておくと、見積書作成時に「マスタから選択」で素早く追加できます。</p>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>メインメニュー &gt; 項目マスター管理</li>
                    <li>「新規作成」をクリック</li>
                    <li>項目情報を入力（カテゴリー、項目説明、デフォルト単位、デフォルト単価）</li>
                    <li>保存</li>
                  </ol>
                </div>
              </div>

              <div id="settings-template" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">📄 見積テンプレート</h4>
                <p className="text-gray-700 mb-3 text-sm">見積書のひな形を作成すると、定型的な見積書を素早く作成できます。</p>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>メインメニュー &gt; テンプレート管理</li>
                    <li>「新規作成」をクリック</li>
                    <li>テンプレート情報を入力（テンプレート名、説明、見積項目を追加、デフォルト備考）</li>
                    <li>保存</li>
                  </ol>
                </div>
              </div>

              <div id="settings-company" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">🏢 会社情報設定</h4>
                <p className="text-gray-700 mb-3 text-sm">見積書に表示する自社情報を設定します。</p>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>メインメニュー &gt; 会社情報設定</li>
                    <li>情報を入力（会社名、ロゴ画像、ロゴサイズ、郵便番号・住所、電話番号・FAX、メールアドレス、ウェブサイト、登録番号（インボイス））</li>
                    <li>保存</li>
                  </ol>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-blue-800">
                      💡 <strong>ロゴ画像：</strong> アップロードした画像が見積書に表示されます。サイズは20〜200pxで調整可能です。
                    </p>
                  </div>
                </div>
              </div>

              <div id="settings-email" className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4">📧 メール認証設定</h4>
                <p className="text-gray-700 mb-3 text-sm">見積書のメール送信機能を有効にするため、メールアドレスを認証します。</p>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>メインメニュー &gt; メール認証設定</li>
                    <li>メールアドレスを入力</li>
                    <li>「認証コード送信」をクリック</li>
                    <li>届いた6桁の認証コードを入力</li>
                    <li>「認証」をクリック</li>
                  </ol>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-green-800">
                      ✅ 設定後は、見積書プレビューから直接メール送信が可能になります（AI生成のメール文面を使用）
                    </p>
                  </div>
                </div>
              </div>
            </GuideSection>

            {/* 便利な使い方 */}
            <GuideSection
              id="tips"
              title="便利な使い方"
              icon={<LightBulbIcon className="w-7 h-7" />}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">🖼️ ビフォー・アフター比較</h5>
                  <p className="text-sm text-blue-800">スライダーをドラッグして、変化を分かりやすく提示できます。</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-semibold text-purple-900 mb-2">📜 履歴機能</h5>
                  <p className="text-sm text-purple-800">生成した画像はすべて保存されます。履歴パネルから過去の結果を確認できます。</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-2">💾 画像のダウンロード</h5>
                  <p className="text-sm text-green-800">生成画像の上の「ダウンロード」アイコンで、提案資料やプレゼンに活用できます。</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                  <h5 className="font-semibold text-orange-900 mb-2">🔄 クリア機能</h5>
                  <p className="text-sm text-orange-800">「クリア」ボタンで最初からやり直し、新しいプロジェクトを開始できます。</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-semibold text-yellow-900 mb-2">🔔 アップデート情報</h5>
                  <p className="text-sm text-yellow-800">トップ画面でアップデート確認。「使い方確認」で詳しい説明を表示できます。</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
                  <h5 className="font-semibold text-indigo-900 mb-2">❓ 機能ガイドTIPS</h5>
                  <p className="text-sm text-indigo-800">各機能のタイトル横にある「?」ボタンで、活用方法のヒントが表示されます。</p>
                </div>
              </div>
            </GuideSection>

            {/* よくある質問 */}
            <GuideSection
              id="faq"
              title="よくある質問"
              icon={<ChatBubbleLeftRightIcon className="w-7 h-7" />}
            >
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Q. 生成した画像がぼやけてしまいます</h5>
                  <p className="text-sm text-gray-700 ml-4">
                    A. より高解像度の写真を使用してください。また、照明が明るい写真を選ぶとより良い結果が得られます。
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Q. 意図と違う結果が出ます</h5>
                  <p className="text-sm text-gray-700 ml-4">
                    A. スタイルの説明を確認し、別のカテゴリーを試してみてください。微調整機能も活用できます。
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Q. エラーが出ます</h5>
                  <p className="text-sm text-gray-700 ml-4">
                    A. 画像サイズを確認してください（推奨: 5MB以下）。ページをリロードしても改善しない場合は管理者に連絡してください。
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Q. 単価が0円になります</h5>
                  <p className="text-sm text-gray-700 ml-4">
                    A. 項目マスターに単価を設定するか、手動で入力してください。
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Q. 見積書が保存できません</h5>
                  <p className="text-sm text-gray-700 ml-4">
                    A. 必須項目（顧客名など）が入力されているか確認してください。ネットワーク接続も確認してください。
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Q. メール送信ができません</h5>
                  <p className="text-sm text-gray-700 ml-4">
                    A. メール認証設定を完了させてください。また、顧客のメールアドレスが入力済みか確認してください。
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Q. PINコードを忘れてしまいました</h5>
                  <p className="text-sm text-gray-700 ml-4">
                    A. 管理者に連絡してリセットしてもらってください。
                  </p>
                </div>

                <div className="pb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Q. 商品画像が表示されません</h5>
                  <p className="text-sm text-gray-700 ml-4">
                    A. 画像URLが正しいか確認してください。URLが公開アクセス可能かどうかも確認してください。
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-6 mt-8 text-center">
                <h4 className="font-bold text-indigo-900 text-lg mb-2">📩 サポート</h4>
                <p className="text-indigo-800 mb-3">不明点や問題がある場合は、管理者にお問い合わせください。</p>
                <p className="text-sm text-indigo-600">
                  また、右下の <strong>AIガイドアシスタント</strong> でもご質問にお答えします！
                </p>
              </div>
            </GuideSection>

            {/* フッター */}
            <div className="text-center py-12 mt-12 border-t border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                AIリノベーションで、理想の空間づくりを楽しんでください！
              </h3>
              <p className="text-gray-600 mb-6">
                ご不明な点がありましたら、右下のAIガイドアシスタントにお気軽にご質問ください。
              </p>
              <button
                onClick={onNavigateBack}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                メインメニューに戻る
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* AIチャットボット */}
      <GuideChatBot tenantId={tenantId} userGuideContent={userGuideContent} />
    </div>
  );
};

export default UserGuidePage;
