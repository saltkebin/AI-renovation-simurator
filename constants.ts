import type { RenovationCategory, RenovationStyle, FurnitureStyle, RoomType, ArchOption, SketchCategory, SketchFinetuneTab, SketchFinetuneOption, ExteriorColorOption, ExteriorMaterialOption, PaintType, WallpaperMaterialId, FurnitureCategoryId, FurnitureMaterialId } from './types';
import { PaintBrushIcon, SwatchIcon, CubeIcon, EyeIcon, HomeModernIcon, EditIcon, UserGroupIcon, SunIcon, PhotoIcon } from './components/Icon';

export const OMAKASE_PROMPT = "この部屋の雰囲気を分析し、あなたの美的センスで最も魅力的になるように全面的にリノベーションしてください。スタイルやテーマは自由にお任せします。";

export const OMAKASE_SKETCH_PROMPT = "このスケッチを分析し、あなたの美的センスで最も魅力的になるようなフォトリアルな完成予想パースを生成してください。スケッチに描かれている部屋の構造、家具の配置、アングルは忠実に再現してください。";

export const RENOVATION_PROMPTS: Record<RenovationStyle | string, string> = {
  // Omakase Prompt - mapped for consistency
  [OMAKASE_PROMPT]: OMAKASE_PROMPT,

  // Design Taste
  nordic: "この部屋を、木の温もりとシンプルなデザインが特徴の北欧風スタイルにリフォームしてください。明るい木材と白やグレーを基調とし、自然光が映えるようにしてください。",
  japandi: "この部屋を、和の要素と現代的なデザインを融合させた和モダンスタイルにリフォームしてください。障子、格子、間接照明などの伝統的な要素をモダンに取り入れてください。",
  industrial: "この部屋を、黒い金属、むき出しの配管、古材などの要素を取り入れたインダストリアルスタイルにリフォームしてください。",
  minimalist: "この部屋を、不要な装飾を削ぎ落とし、白、グレー、黒を基調としたミニマルなデザインにリフォームしてください。",
  bohemian: "この部屋を、様々な色、柄、素材を自由に組み合わせたボヘミアンスタイルにリフォームしてください。観葉植物やラグを多く取り入れてください。",
  french_country: "この部屋を、白を基調に古木やアンティーク調の家具を配した、優雅で素朴なフレンチカントリースタイルにリフォームしてください。",
  mid_century_modern: "この部屋を、機能的で曲線的なデザインの家具やポップな色使いが特徴の、1950年代ミッドセンチュリーモダンスタイルにリフォームしてください。",
  scandinavian_dark: "この部屋を、ダークな色調と素材感を重視したスカンジナビアン・ダークスタイルにしてください。間接照明を効果的に使い、落ち着いたムーディーな空間にしてください。",
  coastal: "この部屋を、白やブルーを基調に、流木や自然素材を取り入れた、開放的でリラックスできる西海岸（コースタル）スタイルにリフォームしてください。",
  asian_resort: "この部屋を、ダークブラウンの木材やラタン家具、観葉植物を多用した、バリのリゾートホテルのようなアジアンリゾートスタイルにリフォームしてください。",

  // Color Theme
  white_based: "この部屋全体を、壁も天井も白を基調とした、清潔感のあるデザインにリフォームしてください。床も明るい色合いにしてください。",
  dark_chic: "この部屋を、ダークグレーや黒を基調とした、重厚でシックなデザインにリフォームしてください。間接照明で高級感を演出してください。",
  earth_tones: "この部屋を、ベージュ、ブラウン、テラコッタなどのアースカラーを基調とした、落ち着きのある自然な空間にリフォームしてください。",
  pastel_colors: "この部屋を、淡いピンクやブルーなどのパステルカラーを基調とした、柔らかく明るい印象の空間にリフォームしてください。",
  monotone: "この部屋を、白と黒のモノトーンで統一された、シャープでモダンな空間にリフォームしてください。",
  greige_nuance: "この部屋を、グレーとベージュを組み合わせたグレージュを基調とした、上品で洗練されたニュアンスカラーの空間にリフォームしてください。",
  vivid_pop: "この部屋を、白やグレーをベースに、ビビッドなイエローやブルーなどの差し色をアクセントウォールや家具で取り入れた、明るくポップな空間にしてください。",
  forest_green: "この部屋の壁を深いフォレストグリーンにし、観葉植物を多く配置するなど、森の中にいるようなリラックスできる空間にリフォームしてください。",
  navy_gold: "この部屋を、知的な印象のネイビーを基調とし、照明器具や小物にゴールドをアクセントとして加えた、高級感のある空間にリフォームしてください。",
  natural_beige: "この部屋を、生成りやベージュ、アイボリーといったナチュラルなベージュトーンで統一し、シンプルで心地よい空間にリフォームしてください。",

  // Material
  solid_wood: "この部屋の床を、温かみのある無垢材のフローリングに張り替えてください。壁や天井はそれに合わせて調整してください。",
  exposed_concrete: "この部屋の壁を、コンクリート打ちっぱなしのデザインに変更してください。天井も同様のスタイルにしてください。",
  brick_wall: "この部屋の壁一面を、ヴィンテージ感のあるレンガ壁に変更してください。",
  marble: "この部屋の床を、高級感のある大理石に変更してください。壁もそれに合わせてエレガントなスタイルにしてください。",
  plaster_wall: "この部屋の壁を、職人技が感じられる漆喰（しっくい）壁に変更してください。自然な風合いで落ち着いた空間にしてください。",
  mortar_floor: "この部屋の床を、継ぎ目のない滑らかなモルタル仕上げに変更してください。ミニマルで無機質な空間を演出してください。",
  tile_wall: "この部屋の壁一面に、サブウェイタイルやヘキサゴンタイルなど、デザイン性の高いタイルをアクセントとして張ってください。",
  brass_accent: "この部屋のドアノブ、照明、水栓などの金物類を、経年変化も楽しめる真鍮（ブラス）製のものに交換し、ヴィンテージ感を加えてください。",
  rattan_material: "この部屋に、ラタン（籐）素材の椅子や照明、収納家具を取り入れて、ナチュラルでリゾート感のある雰囲気にしてください。",
  glass_partition: "この部屋を、黒いアイアンフレームのガラス間仕切りで緩やかに区切り、開放感を保ちつつ独立した空間を作り出してください。",
  
  // Focus Improvement
  improve_lighting: "この部屋がもっと明るく感じられるように、照明計画を全面的に見直してください。ダウンライトや間接照明を追加し、全体的に明るい空間にしてください。",
  increase_storage: "この部屋の収納力を大幅にアップさせるため、壁面収納や作り付けの棚を設置してください。部屋がすっきりと片付くようにしてください。",
  create_openness: "この部屋がより広く、開放的に感じられるようにリフォームしてください。圧迫感のある家具を撤去し、視線が抜けるようなレイアウトにしてください。",
  add_workspace: "この部屋の一角に、集中できるリモートワーク用のワークスペースを設けてください。コンパクトなデスクと椅子、適切な照明を配置してください。",
  soundproof: "この部屋の防音性を高めるリフォームをしてください。壁や窓に防音材を追加し、静かな環境を実現してください。",
  optimize_flow: "この部屋のレイアウトを、キッチンからパントリー、洗濯スペースへの動線がスムーズになるように変更し、家事効率を大幅に向上させてください。",
  improve_insulation: "この部屋に内窓を追加し、壁に断熱材を入れることで断熱性を高めてください。夏は涼しく冬は暖かい、エネルギー効率の良い部屋にしてください。",
  barrier_free: "この部屋の床の段差をなくし、ドアを引き戸に変更するなど、高齢者や車椅子でも安全に暮らせるバリアフリー設計にしてください。",
  improve_ventilation: "この部屋に室内窓やシーリングファンを設置して、空気の流れを改善してください。風通しが良く、常に新鮮な空気が循環する快適な空間にしてください。",
  indoor_greening: "この部屋に、天井から吊るすハンギングプランツや大型の観葉植物を効果的に配置し、緑豊かな癒やしの空間を創出してください。",

  // Space Concept
  cafe_style: "この部屋を、おしゃれなカフェのような居心地の良い空間にリフォームしてください。カウンター席や黒板メニューなどを設置してください。",
  hotel_like: "この部屋を、高級ホテルの客室のような、洗練された非日常的な空間にリフォームしてください。",
  art_gallery: "この部屋を、アート作品が映える美術館のような空間にリフォームしてください。壁は白で統一し、ピクチャーレールやスポットライトを設置してください。",
  pet_friendly: "この部屋を、犬や猫などのペットが快適に過ごせるようにリフォームしてください。滑りにくい床材や、キャットウォークなどを設置してください。",
  home_theater: "この部屋を、迫力のある映像と音響を楽しめるホームシアターにリフォームしてください。プロジェクター、スクリーン、音響設備を設置し、遮光性を高めてください。",
  hobby_room: "この部屋を、壁一面にコレクションを飾れる棚と作業用のデスクを設置した、趣味に没頭できるホビールームにリフォームしてください。",
  kids_space: "この部屋の壁一面を黒板塗料で仕上げ、床には安全なクッションマットを敷くなど、子供が創造力を働かせて自由に遊べるキッズスペースにしてください。",
  home_gym: "この部屋の床を、防音・防振効果のある素材に変更し、自宅で本格的なトレーニングができるホームジムにしてください。",
  tatami_corner: "この部屋の一角に、モダンな琉球畳を敷いた小上がりの畳コーナーを設けてください。収納も兼ね備え、多目的に使える和の空間にしてください。",
  library_space: "この部屋の壁一面を床から天井までの本棚にし、読書用の快適なアームチェアを配置した、落ち着いた雰囲気のライブラリーにしてください。",
};


export const RENOVATION_CATEGORIES: RenovationCategory[] = [
  {
    id: 'design_taste',
    name: 'デザインテイスト',
    icon: PaintBrushIcon,
    styles: [
      { id: 'nordic', name: '北欧風' },
      { id: 'japandi', name: '和モダン' },
      { id: 'industrial', name: 'インダストリアル' },
      { id: 'minimalist', name: 'ミニマリスト' },
      { id: 'bohemian', name: 'ボヘミアン' },
      { id: 'french_country', name: 'フレンチカントリー' },
      { id: 'mid_century_modern', name: 'ミッドセンチュリー' },
      { id: 'scandinavian_dark', name: 'スカンジナビアン・ダーク' },
      { id: 'coastal', name: '西海岸（コースタル）' },
      { id: 'asian_resort', name: 'アジアンリゾート' },
    ],
  },
  {
    id: 'color_theme',
    name: 'カラーテーマ',
    icon: SwatchIcon,
    styles: [
      { id: 'white_based', name: '白基調' },
      { id: 'dark_chic', name: 'ダークシック' },
      { id: 'earth_tones', name: 'アースカラー' },
      { id: 'pastel_colors', name: 'パステルカラー' },
      { id: 'monotone', name: 'モノトーン' },
      { id: 'greige_nuance', name: 'グレージュ・ニュアンス' },
      { id: 'vivid_pop', name: 'ビビッド＆ポップ' },
      { id: 'forest_green', name: 'フォレストグリーン' },
      { id: 'navy_gold', name: 'ネイビー＆ゴールド' },
      { id: 'natural_beige', name: 'ナチュラルベージュ' },
    ],
  },
  {
    id: 'material',
    name: 'マテリアル',
    icon: CubeIcon,
    styles: [
      { id: 'solid_wood', name: '無垢材フローリング' },
      { id: 'exposed_concrete', name: 'コンクリート打ちっぱなし' },
      { id: 'brick_wall', name: 'レンガ壁' },
      { id: 'marble', name: '大理石' },
      { id: 'plaster_wall', name: '漆喰壁' },
      { id: 'mortar_floor', name: 'モルタル床' },
      { id: 'tile_wall', name: 'タイル張り（壁）' },
      { id: 'brass_accent', name: '真鍮（ブラス）アクセント' },
      { id: 'rattan_material', name: 'ラタン（籐）素材' },
      { id: 'glass_partition', name: 'ガラス間仕切り' },
    ],
  },
  {
    id: 'focus_improvement',
    name: 'フォーカス改善',
    icon: EyeIcon,
    styles: [
      { id: 'improve_lighting', name: '明るさ改善' },
      { id: 'increase_storage', name: '収納力アップ' },
      { id: 'create_openness', name: '開放感アップ' },
      { id: 'add_workspace', name: 'ワークスペース追加' },
      { id: 'soundproof', name: '防音性向上' },
      { id: 'optimize_flow', name: '家事動線の最適化' },
      { id: 'improve_insulation', name: '断熱性向上' },
      { id: 'barrier_free', name: 'バリアフリー化' },
      { id: 'improve_ventilation', name: '換気・通風改善' },
      { id: 'indoor_greening', name: '室内緑化' },
    ],
  },
  {
    id: 'space_concept',
    name: '空間コンセプト',
    icon: HomeModernIcon,
    styles: [
      { id: 'cafe_style', name: 'カフェ風' },
      { id: 'hotel_like', name: 'ホテルライク' },
      { id: 'art_gallery', name: 'アートギャラリー風' },
      { id: 'pet_friendly', name: 'ペットと暮らす' },
      { id: 'home_theater', name: 'ホームシアター' },
      { id: 'hobby_room', name: '趣味を楽しむ部屋' },
      { id: 'kids_space', name: 'キッズスペース充実' },
      { id: 'home_gym', name: 'ホームジム' },
      { id: 'tatami_corner', name: '和室・畳コーナー' },
      { id: 'library_space', name: 'ライブラリー（書斎）' },
    ],
  },
];

export const FURNITURE_STYLES: FurnitureStyle[] = [
  { id: 'none', name: '指定なし' },
  { id: 'modern', name: 'モダン' },
  { id: 'nordic', name: '北欧' },
  { id: 'industrial', name: 'インダストリアル' },
  { id: 'natural', name: 'ナチュラル' },
  { id: 'hotel_like', name: 'ホテルライク' },
  { id: 'country', name: 'カントリー' },
  { id: 'japanese', name: '和風' },
  { id: 'other', name: 'その他（自由入力）' },
];

export const ROOM_TYPES: RoomType[] = [
  { id: 'none', name: '指定なし' },
  { id: 'living_room', name: 'リビング' },
  { id: 'dining_room', name: 'ダイニング' },
  { id: 'bed_room', name: 'ベッドルーム' },
  { id: 'guest_room', name: 'ゲストルーム' },
  { id: 'home_office', name: '書斎・ワークスペース' },
  { id: 'kids_room', name: '子供部屋' },
  { id: 'other', name: 'その他（自由入力）' },
];

export const ARCH_STYLES: ArchOption[] = [
  { id: 'modern', name: 'モダン', promptFragment: '全体をモダンなスタイルでデザインしてください' },
  { id: 'japandi', name: '和モダン', promptFragment: '和の要素を取り入れた和モダンスタイルでデザインしてください' },
  { id: 'nordic', name: '北欧', promptFragment: '明るい木材やファブリックを使った北欧スタイルでデザインしてください' },
  { id: 'industrial', name: 'インダストリアル', promptFragment: 'コンクリートや金属を多用したインダストリアルスタイルでデザインしてください' },
  { id: 'minimalist', name: 'ミニマリスト', promptFragment: '装飾を排したミニマリストスタイルでデザインしてください' },
  { id: 'french_country', name: 'フレンチカントリー', promptFragment: '白を基調に古木やアンティーク調の家具を配した、優雅で素朴なフレンチカントリースタイルでデザインしてください' },
  { id: 'mid_century_modern', name: 'ミッドセンチュリー', promptFragment: '機能的で曲線的なデザインの家具が特徴の、1950年代ミッドセンチュリーモダンスタイルでデザインしてください' },
  { id: 'bohemian', name: 'ボヘミアン', promptFragment: '様々な色、柄、素材を自由に組み合わせたボヘミアンスタイルでデザインしてください' },
  { id: 'coastal', name: '西海岸（コースタル）', promptFragment: '白やブルーを基調に、流木や自然素材を取り入れた、開放的でリラックスできる西海岸（コースタル）スタイルでデザインしてください' },
  { id: 'asian_resort', name: 'アジアンリゾート', promptFragment: 'ダークブラウンの木材やラタン家具、観葉植物を多用した、バリのリゾートホテルのようなアジアンリゾートスタイルでデザインしてください' },
];

export const ARCH_MATERIALS: ArchOption[] = [
  { id: 'concrete', name: 'コンクリート', promptFragment: '壁や天井をコンクリート打ちっぱなしにしてください' },
  { id: 'wood', name: '無垢材', promptFragment: '床や壁に温かみのある無垢材をふんだんに使用してください' },
  { id: 'brick', name: 'レンガ', promptFragment: 'アクセントとしてレンガの壁を取り入れてください' },
  { id: 'plaster', name: '漆喰', promptFragment: '壁をニュアンスのある漆喰仕上げにしてください' },
  { id: 'glass', name: 'ガラス', promptFragment: 'ガラスを多用して開放感を演出してください' },
  { id: 'marble', name: '大理石', promptFragment: '床や壁に高級感のある大理石を取り入れてください' },
  { id: 'mortar', name: 'モルタル', promptFragment: '床を継ぎ目のない滑らかなモルタル仕上げにしてください' },
  { id: 'tile', name: 'タイル', promptFragment: '壁や床にデザイン性の高いタイルをアクセントとして使用してください' },
  { id: 'brass', name: '真鍮', promptFragment: '照明や金物に真鍮（ブラス）をアクセントとして加えてください' },
  { id: 'rattan', name: 'ラタン', promptFragment: '家具や照明にラタン（籐）素材を取り入れてナチュラルな雰囲気にしてください' },
];

export const ARCH_COLOR_THEMES: ArchOption[] = [
  { id: 'monotone', name: 'モノトーン', promptFragment: '全体を白・黒・グレーのモノトーンで統一してください' },
  { id: 'earth', name: 'アースカラー', promptFragment: 'ベージュやブラウンなどのアースカラーを基調としてください' },
  { id: 'dark', name: 'ダーク調', promptFragment: '黒やダークグレーを基調としたシックな空間にしてください' },
  { id: 'natural', name: 'ナチュラル', promptFragment: 'アイボリーや木の色など、ナチュラルな色合いでまとめてください' },
  { id: 'pastel', name: 'パステル', promptFragment: '淡いパステルカラーを使った柔らかい印象にしてください' },
  { id: 'greige', name: 'グレージュ', promptFragment: 'グレーとベージュを組み合わせたグレージュを基調とした、上品な空間にしてください' },
  { id: 'vivid_pop', name: 'ビビッド＆ポップ', promptFragment: 'ビビッドな差し色をアクセントにした、ポップで明るい空間にしてください' },
  { id: 'forest_green', name: 'フォレストグリーン', promptFragment: '深いフォレストグリーンを基調とした、森の中にいるような空間にしてください' },
  { id: 'navy_gold', name: 'ネイビー＆ゴールド', promptFragment: '知的なネイビーと華やかなゴールドを組み合わせた、高級感のある空間にしてください' },
  { id: 'terracotta', name: 'テラコッタ', promptFragment: 'テラコッタカラーを基調とした、暖かく素朴な雰囲気にしてください' },
];

export const SKETCH_CATEGORIES: SketchCategory[] = [
  {
    id: 'arch_style',
    name: '建築スタイル',
    icon: HomeModernIcon,
    options: ARCH_STYLES,
  },
  {
    id: 'arch_material',
    name: '主要なマテリアル',
    icon: CubeIcon,
    options: ARCH_MATERIALS,
  },
  {
    id: 'arch_color_theme',
    name: 'カラーテーマ',
    icon: SwatchIcon,
    options: ARCH_COLOR_THEMES,
  },
];

export const SKETCH_TIME_OPTIONS: SketchFinetuneOption[] = [
  { id: 'day_sunny', name: '昼（快晴）', promptFragment: '昼間の明るい日差しが差し込む、晴天の様子に変更してください。' },
  { id: 'day_cloudy', name: '昼（曇り）', promptFragment: '柔らかい光が全体に回る、曇りの日の昼間の様子に変更してください。' },
  { id: 'morning', name: '早朝の朝日', promptFragment: '爽やかな朝日が差し込む、清々しい早朝の様子に変更してください。' },
  { id: 'evening_sunset', name: '夕方（夕焼け）', promptFragment: '空が赤く染まる、美しい夕焼けが見える夕方の時間帯に変更してください。' },
  { id: 'magic_hour', name: 'マジックアワー', promptFragment: '日没後の空が美しいグラデーションになる「マジックアワー」の幻想的な雰囲気に変更してください。' },
  { id: 'night_moonlight', name: '夜（月明かり）', promptFragment: '月明かりが静かに差し込む、落ち着いた夜の雰囲気に変更してください。' },
  { id: 'night_city', name: '夜（街の灯り）', promptFragment: '窓の外に街の夜景が広がる、煌びやかな夜の雰囲気に変更してください。' },
  { id: 'rainy', name: '雨の日', promptFragment: '窓の外は雨が降っており、室内はしっとりと落ち着いた雰囲気に変更してください。' },
  { id: 'snowy', name: '雪の日', promptFragment: '窓の外に雪が降り積もる、静かで明るい雪の日の様子に変更してください。' },
  { id: 'stormy_night', name: '嵐の夜', promptFragment: '窓の外は激しい嵐で、室内照明が際立つドラマチックな夜の雰囲気に変更してください。' },
];

const sceneryPromptPrefix = '建物自体は一切変更せず、その周囲の風景だけを変更し、窓からその風景が透けて見えるようにしてください。風景の指示：';

export const SKETCH_SCENERY_OPTIONS: SketchFinetuneOption[] = [
  { id: 'scenery_city', name: '都市のビル群', promptFragment: `${sceneryPromptPrefix}高層ビルが立ち並ぶ都市の風景。` },
  { id: 'scenery_residential', name: '閑静な住宅街', promptFragment: `${sceneryPromptPrefix}落ち着いた雰囲気の閑静な住宅街。` },
  { id: 'scenery_forest', name: '緑豊かな森', promptFragment: `${sceneryPromptPrefix}緑豊かな森や林が見える風景。` },
  { id: 'scenery_mountain', name: '雄大な山々', promptFragment: `${sceneryPromptPrefix}雄大な山々が連なる壮大な景色。` },
  { id: 'scenery_ocean', name: '穏やかな海', promptFragment: `${sceneryPromptPrefix}穏やかな海と水平線が見える風景。` },
  { id: 'scenery_beach', name: 'リゾートビーチ', promptFragment: `${sceneryPromptPrefix}白い砂浜と青い海が広がるリゾートビーチ。` },
  { id: 'scenery_garden', name: '日本庭園', promptFragment: `${sceneryPromptPrefix}美しく手入れされた日本庭園。` },
  { id: 'scenery_countryside', name: '田園風景', promptFragment: `${sceneryPromptPrefix}のどかな田園風景。` },
  { id: 'scenery_future_city', name: '近未来都市', promptFragment: `${sceneryPromptPrefix}空飛ぶ車や超高層ビルがあるサイバーパンクな近未来都市。` },
  { id: 'scenery_clear', name: '風景のみクリア', promptFragment: '建物自体は一切変更せず、窓の外の風景をすべて削除し、白またはグレーの無地の背景にしてください。' },
];

export const SKETCH_FINETUNE_TABS: SketchFinetuneTab[] = [
  { id: 'details', name: '詳細指示', icon: EditIcon },
  { id: 'time', name: '時間帯・天候', icon: SunIcon, options: SKETCH_TIME_OPTIONS },
  { id: 'scenery', name: '風景', icon: PhotoIcon, options: SKETCH_SCENERY_OPTIONS },
  { id: 'person', name: '人物', icon: UserGroupIcon },
];

// Exterior painting colors
export const EXTERIOR_COLORS: ExteriorColorOption[] = [
  { id: 'white', name: 'ホワイト', hex: '#FFFFFF' },
  { id: 'cream', name: 'クリーム', hex: '#FFF8DC' },
  { id: 'beige', name: 'ベージュ', hex: '#F5E6D3' },
  { id: 'light_gray', name: 'ライトグレー', hex: '#D3D3D3' },
  { id: 'gray', name: 'グレー', hex: '#9E9E9E' },
  { id: 'dark_gray', name: 'ダークグレー', hex: '#5A5A5A' },
  { id: 'brown', name: 'ブラウン', hex: '#8B4513' },
  { id: 'navy', name: 'ネイビー', hex: '#1A237E' },
  { id: 'green', name: 'グリーン', hex: '#4A7C59' },
  { id: 'black', name: 'ブラック', hex: '#2C2C2C' },
];

// Exterior materials
export const EXTERIOR_MATERIALS: ExteriorMaterialOption[] = [
  { id: 'siding', name: 'サイディング', promptFragment: '外壁をモダンなサイディングに変更してください。清潔感のある仕上がりにしてください。' },
  { id: 'stucco', name: '塗り壁', promptFragment: '外壁を質感のある塗り壁仕上げに変更してください。職人の手仕事が感じられる風合いにしてください。' },
  { id: 'tile', name: 'タイル', promptFragment: '外壁を高級感のあるタイル張りに変更してください。' },
  { id: 'wood', name: '木材', promptFragment: '外壁を温かみのある木材仕上げに変更してください。ナチュラルな風合いにしてください。' },
  { id: 'concrete', name: 'コンクリート', promptFragment: '外壁をコンクリート打ちっぱなし風に変更してください。モダンで無機質な印象にしてください。' },
  { id: 'brick', name: 'レンガ', promptFragment: '外壁をレンガ調に変更してください。クラシックで重厚感のある仕上がりにしてください。' },
];

// Split ratios for two-tone colors
export const SPLIT_RATIOS = [
  { value: 30, label: '上部30% / 下部70%' },
  { value: 50, label: '上下50% / 50%' },
  { value: 70, label: '上部70% / 下部30%' },
];

// Paint product categories
export const PAINT_CATEGORIES = [
  { id: 'all', name: '全て' },
  { id: 'silicon', name: 'シリコン塗料' },
  { id: 'fluorine', name: 'フッ素塗料' },
  { id: 'inorganic', name: '無機塗料' },
  { id: 'heat_shield', name: '遮熱塗料' },
];

// Paint types for quotation
export const PAINT_TYPES: PaintType[] = [
  { id: 'ai_choice', name: 'AIにおまかせ', description: '最適な塗料を自動選択' },
  { id: 'silicon', name: 'シリコン塗料', description: '耐用年数10-15年' },
  { id: 'fluorine', name: 'フッ素塗料', description: '耐用年数15-20年' },
  { id: 'inorganic', name: '無機塗料', description: '耐用年数20-25年' },
  { id: 'heat_shield', name: '遮熱塗料', description: '耐用年数12-18年' },
  { id: 'other', name: 'その他', description: 'カスタム塗料を入力' },
];

// Wallpaper materials
export const WALLPAPER_MATERIALS: { id: WallpaperMaterialId; name: string }[] = [
  { id: 'non_woven', name: '不織布' },
  { id: 'vinyl', name: 'ビニール' },
  { id: 'paper', name: '紙' },
  { id: 'fabric', name: '布' },
  { id: 'other', name: 'その他' },
];

// Furniture categories
export const FURNITURE_CATEGORIES: { id: FurnitureCategoryId; name: string }[] = [
  { id: 'sofa', name: 'ソファ' },
  { id: 'table', name: 'テーブル' },
  { id: 'chair', name: 'チェア' },
  { id: 'storage', name: '収納家具' },
  { id: 'bed', name: 'ベッド' },
  { id: 'desk', name: 'デスク' },
  { id: 'shelf', name: 'シェルフ' },
  { id: 'other', name: 'その他' },
];

// Furniture materials
export const FURNITURE_MATERIALS: { id: FurnitureMaterialId; name: string }[] = [
  { id: 'wood', name: '木材' },
  { id: 'metal', name: '金属' },
  { id: 'fabric', name: 'ファブリック' },
  { id: 'leather', name: 'レザー' },
  { id: 'glass', name: 'ガラス' },
  { id: 'plastic', name: 'プラスチック' },
  { id: 'mixed', name: '複合素材' },
  { id: 'other', name: 'その他' },
];

// Update information
// IMPORTANT: When adding new features, add an entry at the TOP of this array with today's date (YYYY-MM-DD format)
// The date should match the date you push to git (use the current date when you add the entry)
export interface UpdateInfo {
  date: string; // YYYY-MM-DD format - Use the date when you push the update
  title: string;
  description: string;
  howToUse?: string; // 使い方の詳細説明
}

export const UPDATE_HISTORY: UpdateInfo[] = [
  {
    date: '2025-10-03',
    title: '営業支援AIチャット・本格見積もり管理・メール送信設定機能を追加',
    description: '営業支援AIチャットで提案力を強化。概算見積もりから本格見積書を作成・管理でき、顧客へのメール送信設定も可能になりました。',
    howToUse: `【営業支援AIチャット】
メインメニューから「営業支援AIチャット」を選択すると、営業活動をサポートするAIアシスタントが利用できます。顧客への提案方法、クロージングのコツ、物件の魅力的な説明方法など、営業に関する質問に具体的にアドバイスします。

【本格見積もり管理】
1. AI画像生成後、「概算見積もりを取得」ボタンで概算見積もりを作成
2. 顧客情報を入力して「本格見積もり用として保存」
3. メインメニューから「本格見積もり管理」を選択
4. 保存した見積もりを開いて、項目の追加・編集、金額の調整が可能
5. 見積書作成アシスタントが項目の提案や文章の推敲をサポート
6. PDFダウンロードやメール送信で顧客に提出

【メール送信設定】
メインメニューから「メール送信設定」を選択し、SendGrid APIキーを登録すると、見積書をメールで直接顧客に送信できるようになります。`
  },
  {
    date: '2025-10-02',
    title: '商品データベース機能の大幅拡張',
    description: '塗料・壁紙・家具の詳細情報（メーカー名、価格、素材など）を登録・編集できるようになりました。商品をクリックすると詳細情報の確認・修正が可能です。',
    howToUse: `【商品データベースの使い方】
1. ヘッダーメニューから「データベース」を選択
2. 「塗料」「壁紙」「家具」のタブから登録したい商品カテゴリを選択
3. 「新規登録」ボタンをクリック
4. 商品名、メーカー名、価格、素材などの詳細情報を入力
5. 登録した商品は一覧に表示され、クリックすることで編集・削除が可能
6. AI画像生成時に「商品を指定して生成」を選ぶと、登録した商品を使用したシミュレーションができます

※商品データはクラウドに保存され、いつでも確認・編集できます。`
  },
  {
    date: '2025-10-02',
    title: '外壁塗装カスタム塗料入力機能',
    description: '見積もり時に、シリコンやフッ素以外のこだわりの塗料名を自由に入力できるようになりました。業者様独自の塗料にも対応できます。',
    howToUse: `【カスタム塗料の入力方法】
1. 外壁塗装モードで画像生成後、「AI概算見積もりを取得」をクリック
2. 「塗料の種類」で「その他」を選択
3. 表示される入力欄に、使用したい塗料名を入力（例：「特殊防水塗料」「ナノテク塗料」など）
4. 外壁面積と合わせて見積もりを取得
5. AIが入力した塗料名を考慮した見積もりを生成します

※一般的な塗料（シリコン、フッ素など）は選択肢から選べます。`
  },
  {
    date: '2025-10-02',
    title: '外壁塗装シミュレーション機能を追加',
    description: '建物の外観写真から、様々な色やツートンカラーの塗装シミュレーションができるようになりました。見積もり機能も搭載しています。',
    howToUse: `【外壁塗装シミュレーションの使い方】
1. メインメニューで「外観デザイン」モードを選択
2. 建物の外観写真をアップロード
3. 「外壁塗装」タブを選択
4. 好きな色を選択（単色またはツートンカラー）
5. 「画像を生成」ボタンで塗装後のイメージを確認
6. 気に入った結果が出たら「この画像で見積もりを作成」
7. 外壁面積と塗料の種類を入力してAI概算見積もりを取得

※複数の色パターンを試して、顧客に最適な提案ができます。`
  },
];