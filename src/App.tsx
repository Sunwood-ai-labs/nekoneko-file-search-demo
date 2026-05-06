import { useMemo, useState } from 'react';
import { BookOpen, Boxes, Database, Filter, Image as ImageIcon, Search, Sparkles } from 'lucide-react';
import { dataset, prompts, type DatasetItem } from './data/catalog';
import { composeAnswer, searchDataset, type SearchFilters } from './lib/mockSearch';
import './styles.css';

const departments: Array<SearchFilters['department']> = ['all', 'support', 'product', 'legal', 'store'];
const statuses: Array<SearchFilters['status']> = ['all', 'final', 'draft'];
const years: Array<SearchFilters['year']> = ['all', '2026', '2025'];

function filterLabel(value: string) {
  return value === 'all' ? 'All' : value;
}

function CitationCard({ item, score, reason }: { item: DatasetItem; score: number; reason: string }) {
  return (
    <article className="citation-card">
      <div className="citation-media">
        {item.type === 'image' ? <img src={item.path} alt={item.title} /> : <BookOpen size={32} />}
      </div>
      <div className="citation-body">
        <div className="citation-topline">
          <span>{item.type === 'image' ? 'visual' : 'document'}</span>
          <strong>{score.toFixed(1)}</strong>
        </div>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
        <div className="chips">
          <span>{item.department}</span>
          <span>{item.status}</span>
          <span>{item.year}</span>
          {item.mediaId ? <span>media_id: {item.mediaId}</span> : <span>page: {item.page}</span>}
        </div>
        <small>{reason}</small>
      </div>
    </article>
  );
}

export default function App() {
  const [query, setQuery] = useState(prompts[0]);
  const [filters, setFilters] = useState<SearchFilters>({ department: 'all', status: 'all', year: 'all' });
  const citations = useMemo(() => searchDataset(query, filters), [query, filters]);
  const answer = useMemo(() => composeAnswer(query, citations), [query, citations]);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow"><Sparkles size={16} /> Gemini File Search multimodal RAG demo</p>
          <h1>ねこねこカンパニー<br />社内ナレッジ検索室</h1>
          <p className="lead">
            商品写真、棚札、梱包ラベル、FAQ、保証規定を同じ検索ストアに入れた想定のデモです。
            画像は <code>media_id</code>、文書はページ番号で根拠表示します。
          </p>
        </div>
        <div className="store-meter" aria-label="dataset summary">
          <Database size={28} />
          <strong>{dataset.length}</strong>
          <span>demo files</span>
        </div>
      </section>

      <section className="workspace">
        <aside className="control-panel">
          <label className="search-box">
            <Search size={18} />
            <textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={4} />
          </label>

          <div className="prompt-row">
            {prompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => setQuery(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="filters">
            <h2><Filter size={18} /> metadata filters</h2>
            <div>
              <span>department</span>
              <div className="segment">
                {departments.map((department) => (
                  <button
                    key={department}
                    className={filters.department === department ? 'active' : ''}
                    onClick={() => setFilters((current) => ({ ...current, department }))}
                  >
                    {filterLabel(department)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span>status</span>
              <div className="segment">
                {statuses.map((status) => (
                  <button
                    key={status}
                    className={filters.status === status ? 'active' : ''}
                    onClick={() => setFilters((current) => ({ ...current, status }))}
                  >
                    {filterLabel(status)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span>year</span>
              <div className="segment">
                {years.map((year) => (
                  <button
                    key={year}
                    className={filters.year === year ? 'active' : ''}
                    onClick={() => setFilters((current) => ({ ...current, year }))}
                  >
                    {filterLabel(year)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="answer-panel">
          <div className="answer-header">
            <div>
              <p className="eyebrow"><Boxes size={16} /> grounded response</p>
              <h2>回答</h2>
            </div>
            <span>{citations.length} citations</span>
          </div>
          <p className="answer">{answer}</p>
          <div className="citation-grid">
            {citations.map(({ item, score, reason }) => (
              <CitationCard key={item.id} item={item} score={score} reason={reason} />
            ))}
          </div>
        </section>
      </section>

      <section className="dataset-band">
        <div>
          <p className="eyebrow"><ImageIcon size={16} /> demo dataset</p>
          <h2>アップロード想定ファイル</h2>
        </div>
        <div className="dataset-list">
          {dataset.map((item) => (
            <a href={item.path} key={item.id} className="dataset-row">
              <span>{item.title}</span>
              <small>{item.department} / {item.status} / {item.mediaId ?? `page ${item.page}`}</small>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
