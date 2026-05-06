import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, Boxes, Database, Filter, Image as ImageIcon, Send, Sparkles } from 'lucide-react';
import { dataset, prompts, type DatasetItem } from './data/catalog';
import { composeAnswer, searchDataset, type SearchFilters } from './lib/mockSearch';
import type { GeminiQueryResponse, GeminiStatus } from './lib/geminiTypes';
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

function GeminiCitationCard({ citation }: { citation: NonNullable<GeminiQueryResponse['citations'][number]> }) {
  return (
    <article className="citation-card api-citation">
      <div className="citation-body">
        <div className="citation-topline">
          <span>{citation.mediaId ? 'media citation' : 'retrieved context'}</span>
          <strong>API</strong>
        </div>
        <h3>{citation.title ?? 'Gemini File Search citation'}</h3>
        <p>{citation.text ?? citation.uri ?? citation.fileSearchStore ?? 'Gemini returned grounding metadata for this source.'}</p>
        <div className="chips">
          {citation.mediaId ? <span>media_id: {citation.mediaId}</span> : null}
          {citation.pageNumber ? <span>page: {citation.pageNumber}</span> : null}
          {citation.customMetadata?.map((metadata) => (
            <span key={`${metadata.key}-${metadata.stringValue ?? metadata.numericValue}`}>
              {metadata.key}: {metadata.stringValue ?? metadata.numericValue}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [draftQuery, setDraftQuery] = useState(prompts[0]);
  const [query, setQuery] = useState(prompts[0]);
  const [filters, setFilters] = useState<SearchFilters>({ department: 'all', status: 'all', year: 'all' });
  const [status, setStatus] = useState<GeminiStatus | null>(null);
  const [apiResponse, setApiResponse] = useState<GeminiQueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);
  const mockCitations = useMemo(() => searchDataset(query, filters), [query, filters]);
  const mockAnswer = useMemo(() => composeAnswer(query, mockCitations), [query, mockCitations]);
  const usingGemini = status?.configured && apiResponse?.mode === 'gemini';
  const answer = status?.configured
    ? apiResponse?.answer ?? 'Gemini File Search の回答を待っています。'
    : mockAnswer;

  useEffect(() => {
    fetch('/api/status')
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus({ mode: 'mock', configured: false, model: 'unknown', message: 'API server is not reachable.' }));
  }, []);

  function submitQuery() {
    const nextQuery = draftQuery.trim();
    if (!nextQuery) return;
    setQuery(nextQuery);
  }

  useEffect(() => {
    if (!status?.configured) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    setIsLoading(true);
    setError('');
    setApiResponse(null);
    fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, filters }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Gemini API request failed.');
        return payload as GeminiQueryResponse;
      })
      .then((payload) => {
        if (requestId === requestIdRef.current) setApiResponse(payload);
      })
      .catch((apiError) => {
        if (apiError.name === 'AbortError') return;
        if (requestId !== requestIdRef.current) return;
        setError(apiError.message);
        setApiResponse(null);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsLoading(false);
      });
    return () => controller.abort();
  }, [query, filters, status?.configured]);

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
          <span>{status?.configured ? 'Gemini files' : 'demo files'}</span>
        </div>
      </section>

      <section className="workspace">
        <aside className="control-panel">
          <label className="search-box">
            <textarea value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} rows={4} />
            <button type="button" className="send-button" onClick={submitQuery} disabled={!draftQuery.trim() || isLoading}>
              <Send size={18} />
              <span>{isLoading ? '送信中' : '送信'}</span>
            </button>
          </label>

          <div className="prompt-row">
            {prompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => setDraftQuery(prompt)}>
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
            <span>{status?.configured ? 'Gemini API' : 'mock mode'}</span>
          </div>
          <div className={`api-status ${status?.configured ? 'ok' : 'warn'}`}>
            {status?.configured ? <Sparkles size={16} /> : <AlertTriangle size={16} />}
            <span>{status?.message ?? 'Checking Gemini API status...'}</span>
            {status?.storeName ? <code>{status.storeName}</code> : null}
          </div>
          {error ? <div className="api-status warn"><AlertTriangle size={16} /><span>{error}</span></div> : null}
          {isLoading ? <p className="loading-line">Gemini File Search に問い合わせ中...</p> : null}
          <p className="answer">{answer}</p>
          <div className="citation-grid">
            {usingGemini
              ? apiResponse.citations.map((citation, index) => <GeminiCitationCard key={index} citation={citation} />)
              : mockCitations.map(({ item, score, reason }) => (
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
