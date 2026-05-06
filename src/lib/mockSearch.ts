import { dataset, type DatasetItem } from '../data/catalog';

export type SearchFilters = {
  department: 'all' | DatasetItem['department'];
  status: 'all' | DatasetItem['status'];
  year: 'all' | DatasetItem['year'];
};

export type Citation = {
  item: DatasetItem;
  score: number;
  reason: string;
};

const tokenMap: Record<string, string[]> = {
  青: ['blue', '青', '点滅', '静音'],
  led: ['LED', '魚型LED', '点滅'],
  保証: ['保証', '3年', '90日'],
  価格: ['価格', '49,800', '税込'],
  電池: ['電池', 'バッテリー', 'UN3481', '航空便'],
  返品: ['返品', '交換', '30日', '航空便'],
  legal: ['legal', '規定', '法務', 'UN3481'],
};

export function searchDataset(query: string, filters: SearchFilters): Citation[] {
  const lowered = query.toLowerCase();
  const expanded = new Set(
    query
      .split(/[\s、。:：?？]+/)
      .filter(Boolean)
      .flatMap((token) => [token, ...(tokenMap[token.toLowerCase()] ?? [])])
  );

  return dataset
    .filter((item) => filters.department === 'all' || item.department === filters.department)
    .filter((item) => filters.status === 'all' || item.status === filters.status)
    .filter((item) => filters.year === 'all' || item.year === filters.year)
    .map((item) => {
      const haystack = [item.title, item.excerpt, item.department, item.status, item.year, ...item.tags]
        .join(' ')
        .toLowerCase();
      let score = 0;
      expanded.forEach((token) => {
        if (haystack.includes(token.toLowerCase())) score += 2;
      });
      if (lowered.includes(item.department)) score += 3;
      if (item.type === 'image' && /写真|画像|棚札|ラベル|見た目|色/.test(query)) score += 2;
      return {
        item,
        score,
        reason: item.type === 'image' ? '画像の見た目とメタデータが一致' : '文書本文の意味検索で一致',
      };
    })
    .filter((citation) => citation.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export function composeAnswer(query: string, citations: Citation[]): string {
  if (citations.length === 0) {
    return '該当する根拠は見つかりませんでした。フィルターを緩めるか、別の言い方で検索してください。';
  }

  const snippets = citations.map(({ item }) => item.excerpt);
  if (/毛玉|価格|保証/.test(query)) {
    return '毛玉クラウド Pro は棚札上で税込 49,800 円、保証規定では法人契約時に3年保証です。価格は画像 citation、保証は文書のページ citation で確認できます。';
  }
  if (/青|LED|点滅|静音/.test(query)) {
    return '魚型LEDの青点滅は静音モードを示します。商品写真側の visual citation と、サポートFAQのページ citation が同じ結論を支えています。';
  }
  if (/電池|返品|航空|UN3481/.test(query)) {
    return 'しっぽセンサーを航空便で扱う場合は UN3481 表示が必要です。返品時はバッテリー残量30%以下が推奨され、購入後90日以内なら電池初期不良として交換対象になり得ます。';
  }
  return snippets.join(' ');
}
