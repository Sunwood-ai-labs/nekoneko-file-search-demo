export type DatasetItem = {
  id: string;
  title: string;
  type: 'image' | 'document';
  department: 'support' | 'product' | 'legal' | 'store';
  status: 'draft' | 'final';
  year: '2025' | '2026';
  path: string;
  mediaId?: string;
  page?: number;
  tags: string[];
  excerpt: string;
};

export const dataset: DatasetItem[] = [
  {
    id: 'img-nk-001',
    title: 'にゃんサーバー Mini 商品写真',
    type: 'image',
    department: 'product',
    status: 'final',
    year: '2026',
    path: '/dataset/images/nyan-server-mini.png',
    mediaId: 'media_nk_001',
    tags: ['orange', 'edge-ai', 'silent-mode'],
    excerpt: 'オレンジ色の小型エッジAI筐体。背面にUSB-CとLAN、前面に魚型LED。静音モード表示あり。',
  },
  {
    id: 'img-nk-002',
    title: '毛玉クラウド Pro 棚札',
    type: 'image',
    department: 'store',
    status: 'final',
    year: '2026',
    path: '/dataset/images/kedama-cloud-shelf.png',
    mediaId: 'media_nk_002',
    tags: ['shelf-label', 'price', 'warranty'],
    excerpt: '棚札に税込 49,800 円、3年保証、法人サポート優先、白い雲型ロゴが記載されている。',
  },
  {
    id: 'img-nk-003',
    title: 'しっぽセンサー 梱包ラベル',
    type: 'image',
    department: 'legal',
    status: 'final',
    year: '2025',
    path: '/dataset/images/shippo-sensor-label.png',
    mediaId: 'media_nk_003',
    tags: ['label', 'battery', 'compliance'],
    excerpt: 'リチウム電池同梱、航空便はUN3481表示必須。返品時はバッテリー残量30%以下を推奨。',
  },
  {
    id: 'doc-nk-101',
    title: 'サポートFAQ 2026 Q2',
    type: 'document',
    department: 'support',
    status: 'final',
    year: '2026',
    path: '/dataset/docs/support-faq-2026-q2.md',
    page: 2,
    tags: ['faq', 'returns', 'silent-mode'],
    excerpt: 'にゃんサーバー Mini の魚型LEDが青点滅なら静音モード。返品は購入から30日以内、開封済みは初期不良のみ。',
  },
  {
    id: 'doc-nk-201',
    title: '保証規定 2026',
    type: 'document',
    department: 'legal',
    status: 'final',
    year: '2026',
    path: '/dataset/docs/warranty-policy-2026.md',
    page: 4,
    tags: ['warranty', 'battery', 'legal'],
    excerpt: '毛玉クラウド Pro は法人契約で3年保証。しっぽセンサーの電池劣化は消耗扱いだが、購入後90日は交換対象。',
  },
  {
    id: 'doc-nk-301',
    title: '商品マスター 抜粋',
    type: 'document',
    department: 'product',
    status: 'draft',
    year: '2026',
    path: '/dataset/docs/product-master-extract.json',
    page: 1,
    tags: ['sku', 'pricing', 'product'],
    excerpt: 'SKU NK-MINI-ORANGE はにゃんサーバー Mini オレンジ。SKU NK-CLOUD-PRO は毛玉クラウド Pro。',
  },
];

export const prompts = [
  '青く点滅している魚型LEDは何を意味する？',
  '毛玉クラウド Pro の価格と保証期間を根拠付きで教えて',
  'しっぽセンサーを航空便で返品するときの注意点は？',
  'department: legal だけに絞ると、電池関連で何が分かる？',
];
