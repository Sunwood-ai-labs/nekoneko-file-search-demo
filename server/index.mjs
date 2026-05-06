import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const port = Number(process.env.API_PORT ?? 8787);
const model = process.env.GEMINI_MODEL ?? process.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
const storeName = process.env.GEMINI_FILE_SEARCH_STORE ?? process.env.VITE_GEMINI_FILE_SEARCH_STORE;
const apiKey = process.env.GEMINI_API_KEY;

app.use(express.json());

function metadataFilter(filters) {
  const clauses = [];
  if (filters?.department && filters.department !== 'all') clauses.push(`department="${filters.department}"`);
  if (filters?.status && filters.status !== 'all') clauses.push(`status="${filters.status}"`);
  if (filters?.year && filters.year !== 'all') clauses.push(`year=${Number(filters.year)}`);
  return clauses.join(' AND ');
}

function citationFromChunk(chunk) {
  const context = chunk?.retrievedContext;
  if (!context) return null;
  return {
    title: context.title,
    text: context.text,
    uri: context.uri,
    mediaId: context.mediaId,
    pageNumber: context.pageNumber,
    fileSearchStore: context.fileSearchStore,
    customMetadata: context.customMetadata,
  };
}

function formatGeminiError(error) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(rawMessage);
    const apiError = parsed.error;
    if (!apiError) return { status: 500, message: rawMessage };
    const retryInfo = apiError.details?.find((detail) => detail['@type']?.includes('RetryInfo'));
    const retryDelay = retryInfo?.retryDelay ? ` Retry after ${retryInfo.retryDelay}.` : '';
    return {
      status: apiError.code === 429 ? 429 : 500,
      message: `${apiError.status ?? 'GEMINI_ERROR'}: ${apiError.message}${retryDelay}`,
    };
  } catch {
    return { status: 500, message: rawMessage };
  }
}

app.get('/api/status', (_request, response) => {
  response.json({
    mode: apiKey && storeName ? 'gemini' : 'mock',
    configured: Boolean(apiKey && storeName),
    storeName,
    model,
    message: apiKey && storeName
      ? 'Gemini API and File Search store are configured.'
      : 'Gemini API is not fully configured. Run npm run bootstrap:gemini.',
  });
});

app.post('/api/query', async (request, response) => {
  if (!apiKey || !storeName) {
    response.status(400).json({
      error: 'Gemini API is not configured. Set GEMINI_API_KEY and GEMINI_FILE_SEARCH_STORE.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const filter = metadataFilter(request.body.filters);
    const prompt = `あなたはねこねこカンパニーの社内検索アシスタントです。
File Searchの検索結果だけを根拠に、日本語で簡潔に回答してください。
画像が根拠ならmedia_idに言及し、文書が根拠ならページ番号やタイトルに言及してください。

質問: ${request.body.query}`;

    const geminiResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName],
              ...(filter ? { metadataFilter: filter } : {}),
            },
          },
        ],
      },
    });

    const groundingMetadata = geminiResponse.candidates?.[0]?.groundingMetadata;
    const citations = groundingMetadata?.groundingChunks?.map(citationFromChunk).filter(Boolean) ?? [];
    response.json({
      mode: 'gemini',
      answer: geminiResponse.text ?? '',
      citations,
      rawGroundingMetadata: groundingMetadata,
      model,
      storeName,
    });
  } catch (error) {
    const formatted = formatGeminiError(error);
    response.status(formatted.status).json({
      error: formatted.message,
    });
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Nekoneko Gemini API server listening on http://127.0.0.1:${port}`);
});
