<img src="https://raw.githubusercontent.com/Sunwood-ai-labs/nekoneko-file-search-demo/main/article-campaigns/gemini-file-search-multimodal-rag-v1/assets/thumbnail-maki-gemini-file-search-en.png?cachebust=0e6d240" alt="Gemini File Search Multimodal RAG thumbnail">

Gemini API File Search has evolved into RAG that can search across images as well as text.

The interesting part is not simply that Gemini can understand images. That was already possible. What changed is that image embeddings, retrieval, metadata filtering, and citations are now part of the managed File Search store workflow for RAG.

Previously, if you wanted to build an internal search or product-support search system that included images, you often had to create image embeddings yourself, store them in a vector database, retrieve them separately from text documents, and then build your own citation layer to show which image supported the answer. With this update, a much larger part of that plumbing can move into File Search.

## What Changed

Google highlights three major changes:

1. Images can be added to a File Search store.
   PNG and JPEG images can now participate in the same retrieval experience as text documents.

2. Custom metadata can narrow the search scope.
   Operational labels such as `department`, `status`, and `year` can be used to filter what the model retrieves.

3. Citations are more precise.
   For PDFs and documents, citations can point to page-level evidence. For images, grounding metadata can include `media_id`, which makes it much easier to show the exact image used as evidence in a product UI.

The File Search documentation explains that multimodal File Search stores should use `models/gemini-embedding-2` instead of the default text-focused embedding model. For images, PNG and JPEG are supported, and when an image chunk contributes to the answer, the grounding metadata can return a `media_id`.

In other words, this is not just “call a vision-capable LLM.” It is an update for building product-grade RAG where images, documents, metadata, and citations all belong to the same managed retrieval flow.

## I Built a Neko Neko Company Demo

To make the change easier to feel, I built a demo app around a fictional company called Neko Neko Company.

- GitHub: https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo
- Live demo: https://sunwood-ai-labs.github.io/nekoneko-file-search-demo/
- Release: https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo/releases/tag/v1.0.0

The dataset is small, but it includes the kinds of mixed assets that often make real-world RAG messy:

- Nyan Server Mini product photo
  PNG image. `department: product`, `status: final`, `year: 2026`
- Kedama Cloud Pro shelf label
  PNG image. `department: store`, `status: final`, `year: 2026`
- Shippo Sensor packaging label
  PNG image. `department: legal`, `status: final`, `year: 2025`
- Support FAQ 2026 Q2
  Markdown document. `department: support`, `status: final`, `year: 2026`
- Warranty Policy 2026
  Markdown document. `department: legal`, `status: final`, `year: 2026`
- Product Master excerpt
  JSON/text document. `department: product`, `status: draft`, `year: 2026`

The app includes a question field, a send button, metadata filters, grounded answers, citation cards, and a citation detail modal. For image citations, the card shows the image preview directly. Clicking it opens the citation details, including metadata, supporting text, and `media_id`.

## Implementation Notes

When creating the File Search store, the demo specifies `models/gemini-embedding-2`.

```js
const fileSearchStore = await ai.fileSearchStores.create({
  config: {
    displayName,
    embeddingModel: 'models/gemini-embedding-2',
  },
});
```

During upload, each file is sent with its display name, MIME type, and custom metadata.

```js
await ai.fileSearchStores.uploadToFileSearchStore({
  file: filePath,
  fileSearchStoreName: fileSearchStore.name,
  config: {
    displayName: file.displayName,
    mimeType: file.mimeType,
    customMetadata: metadataForFileSearch(file.metadata),
  },
});
```

For retrieval, the server calls Gemini `generateContent` with a File Search tool. Filters selected in the UI are converted into `metadataFilter` on the server.

```js
const response = await ai.models.generateContent({
  model: candidateModel,
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
```

After the response comes back, the app reads `groundingMetadata.groundingChunks` and turns those chunks into citation cards. When a citation comes from an image, it can carry `mediaId`, which lets the UI say, “this exact image was part of the evidence.”

```js
const groundingMetadata = geminiResponse.candidates?.[0]?.groundingMetadata;
const citations = groundingMetadata?.groundingChunks
  ?.map(citationFromChunk)
  .filter(Boolean) ?? [];
```

The React app does not expose the API key in the browser. Instead, it calls a local Express proxy. The public GitHub Pages demo runs as a mock UI because it cannot safely hold secrets, while the real Gemini File Search path runs locally through `.env.local`.

## Demo Video and App Screenshot

I also posted a short demo video on X.

https://x.com/hAru_mAki_ch/status/2052031244666556447

Here is the app screen. After a question is sent, the UI shows the grounded Gemini API File Search answer, document citations, image citations, and metadata in the same workspace.

<img src="https://raw.githubusercontent.com/Sunwood-ai-labs/nekoneko-file-search-demo/main/article-campaigns/gemini-file-search-multimodal-rag-v1/assets/app-screenshot-nekoneko-file-search.png?cachebust=5134914" alt="Neko Neko Company File Search demo app screen">

## What I Learned While Testing

The first practical issue was model selection. Gemma 4 is interesting, but the star of this demo is the File Search tool. For the `generateContent` path that uses File Search, Gemini models are the natural fit. The implementation accepts a comma-separated `GEMINI_MODELS` fallback chain, so if a model hits `RESOURCE_EXHAUSTED` or a temporary `UNAVAILABLE` error, the proxy can try the next candidate.

The second issue was citation UX. Returning `media_id` is useful, but showing a long raw identifier in a card is not meaningful to users. In the demo, image citations display the actual image preview, and the raw metadata is available only when the user opens the detail view. RAG is more useful when people can quickly inspect the evidence, not just receive an answer.

The third issue was separating public demos from real API demos. You should not put a Gemini API key in GitHub Pages. The public site is therefore a safe mock experience, while the real API flow is local and explicit. That distinction matters because users will naturally ask, “is this really talking to Gemini?”

## How to Try It

To run only the mock UI:

```bash
npm install
npm run generate:dataset
npm run dev
```

To create a Gemini File Search store and test the real API path, place your key in `.env.local` and bootstrap the dataset.

```bash
GEMINI_API_KEY=your_api_key_here
```

```bash
npm install
npm run generate:dataset
npm run bootstrap:gemini
npm run dev
```

Then open:

```text
http://127.0.0.1:5178/
```

## Why This Matters

This update to Gemini API File Search is not just image input support. It is a step toward managed multimodal RAG where images, documents, metadata, and citations can be handled together.

In business applications, product photos, shelf labels, packaging labels, diagrams, PDFs, and FAQs rarely live in one neat format. Being able to ask a natural-language question, filter by operational metadata, and show evidence at the image or page level makes RAG feel much closer to a verifiable work search experience.

That is the real shift here: RAG is moving from “a system that gives plausible answers” toward “a system that helps people check the evidence.”

## References

- Google Blog: Gemini API File Search is now multimodal: build efficient, verifiable RAG  
  https://blog.google/innovation-and-ai/technology/developers-tools/expanded-gemini-api-file-search-multimodal-rag/
- Gemini API File Search docs  
  https://ai.google.dev/gemini-api/docs/file-search
- Gemini API release notes  
  https://ai.google.dev/gemini-api/docs/changelog
- Neko Neko Company File Search Demo  
  https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo
