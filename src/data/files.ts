export type DatasetFile = {
  id: string;
  displayName: string;
  filePath: string;
  mimeType: string;
  metadata: Record<string, string | number>;
};

export const datasetFiles: DatasetFile[] = [
  {
    id: 'img-nk-001',
    displayName: 'にゃんサーバー Mini 商品写真',
    filePath: 'public/dataset/images/nyan-server-mini.png',
    mimeType: 'image/png',
    metadata: {
      department: 'product',
      status: 'final',
      year: 2026,
      kind: 'image',
      product: 'nyan-server-mini',
    },
  },
  {
    id: 'img-nk-002',
    displayName: '毛玉クラウド Pro 棚札',
    filePath: 'public/dataset/images/kedama-cloud-shelf.png',
    mimeType: 'image/png',
    metadata: {
      department: 'store',
      status: 'final',
      year: 2026,
      kind: 'image',
      product: 'kedama-cloud-pro',
    },
  },
  {
    id: 'img-nk-003',
    displayName: 'しっぽセンサー 梱包ラベル',
    filePath: 'public/dataset/images/shippo-sensor-label.png',
    mimeType: 'image/png',
    metadata: {
      department: 'legal',
      status: 'final',
      year: 2025,
      kind: 'image',
      product: 'shippo-sensor',
    },
  },
  {
    id: 'doc-nk-101',
    displayName: 'サポートFAQ 2026 Q2',
    filePath: 'public/dataset/docs/support-faq-2026-q2.md',
    mimeType: 'text/markdown',
    metadata: {
      department: 'support',
      status: 'final',
      year: 2026,
      kind: 'document',
    },
  },
  {
    id: 'doc-nk-201',
    displayName: '保証規定 2026',
    filePath: 'public/dataset/docs/warranty-policy-2026.md',
    mimeType: 'text/markdown',
    metadata: {
      department: 'legal',
      status: 'final',
      year: 2026,
      kind: 'document',
    },
  },
  {
    id: 'doc-nk-301',
    displayName: '商品マスター 抜粋',
    filePath: 'public/dataset/docs/product-master-extract.json',
    mimeType: 'text/plain',
    metadata: {
      department: 'product',
      status: 'draft',
      year: 2026,
      kind: 'document',
    },
  },
];

export function metadataForFileSearch(metadata: DatasetFile['metadata']) {
  return Object.entries(metadata).map(([key, value]) =>
    typeof value === 'number'
      ? { key, numericValue: value }
      : { key, stringValue: value }
  );
}
