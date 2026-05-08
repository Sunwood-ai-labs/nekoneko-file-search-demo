Gemini APIのFile Searchが、いよいよ「画像も含めて探せるRAG」に進化しました。

ポイントは、Geminiが画像を理解できるようになった、という話ではありません。そこは以前からできました。今回面白いのは、RAGのための managed File Search store の中に、画像の埋め込み、検索、metadata filter、citation まで入ってきたことです。

これまで画像を含む社内検索や商品検索を作るなら、画像embeddingを自分で作り、ベクタDBへ入れ、テキスト文書とは別に検索し、最後に「どの画像を根拠にしたか」をアプリ側で組み立てる必要がありました。今回のアップデートでは、その面倒な配管のかなり大きな部分をFile Search側に寄せられます。

## 何が変わったのか

Googleの発表で大きく取り上げられている変更は、主に3つです。

1. 画像をFile Search storeに入れられる
   PNG/JPEG画像を、テキスト文書と同じ検索体験に混ぜられます。

2. custom metadataで絞り込める
   `department`、`status`、`year` のような業務ラベルで検索範囲を狭められます。

3. citationが細かくなった
   PDFなどはページ位置、画像は `media_id` で根拠をUIに戻しやすくなりました。

公式ドキュメントでは、マルチモーダルFile Searchを使う場合、File Search store作成時にデフォルトのテキスト向けembeddingではなく `models/gemini-embedding-2` を指定する、と説明されています。画像についてはPNG/JPEGが対象で、画像チャンクが回答に使われた場合はgrounding metadataに `media_id` が返ります。

つまり、これは「画像対応のLLMを呼ぶ」だけではなく、「画像と文書を同じ検索ストアに入れ、検索結果と根拠表示までプロダクトに組み込む」ためのアップデートです。

## ねこねこカンパニーのデモを作った

この変化を体感できるように、架空の会社「ねこねこカンパニー」のデモアプリを作りました。

- GitHub: https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo
- Live demo: https://sunwood-ai-labs.github.io/nekoneko-file-search-demo/
- Release: https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo/releases/tag/v1.0.0

データセットは小さいですが、RAGでよく起きる悩みを一通り入れています。

- にゃんサーバー Mini 商品写真
  PNG画像。`department: product`, `status: final`, `year: 2026`
- 毛玉クラウド Pro 棚札
  PNG画像。`department: store`, `status: final`, `year: 2026`
- しっぽセンサー 梱包ラベル
  PNG画像。`department: legal`, `status: final`, `year: 2025`
- サポートFAQ 2026 Q2
  Markdown文書。`department: support`, `status: final`, `year: 2026`
- 保証規定 2026
  Markdown文書。`department: legal`, `status: final`, `year: 2026`
- 商品マスター 抜粋
  JSON/text文書。`department: product`, `status: draft`, `year: 2026`

UIでは、質問欄、送信ボタン、metadata filter、回答、引用カード、引用詳細モーダルを用意しました。画像のcitationでは、カード上に画像プレビューをそのまま表示し、クリックすると `media_id` やmetadata、根拠テキストを確認できます。

## 実装の要点

File Search storeを作るところでは、`models/gemini-embedding-2` を指定します。

```js
const fileSearchStore = await ai.fileSearchStores.create({
  config: {
    displayName,
    embeddingModel: 'models/gemini-embedding-2',
  },
});
```

アップロード時には、ファイル名、MIME type、custom metadataを付けます。

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

検索時は、Geminiの `generateContent` に File Search tool を渡します。UI側のfilter指定は、サーバーで `metadataFilter` に変換しています。

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

回答後は、`groundingMetadata.groundingChunks` を読み、引用カードへ変換します。画像由来のcitationなら `mediaId` を持てるので、UIで「この画像を根拠にした」と示しやすくなります。

```js
const groundingMetadata = geminiResponse.candidates?.[0]?.groundingMetadata;
const citations = groundingMetadata?.groundingChunks
  ?.map(citationFromChunk)
  .filter(Boolean) ?? [];
```

このデモではAPIキーをブラウザに出さないため、Reactアプリから直接Gemini APIを呼ばず、ローカルのExpress proxyを経由しています。GitHub Pages上の公開デモはsecretを持たないのでmock UIとして動き、実際のGemini File Searchはローカルで `.env.local` を設定して試す構成です。

## 使っていて分かったハマりどころ

まず、モデル選びです。Gemma 4は話題性がありますが、このデモの主役はFile Search toolです。File Searchを使うgenerateContentの経路では、Gemini系モデルを使うのが自然です。実装では `GEMINI_MODELS` をカンマ区切りのフォールバックチェーンにして、quotaや一時的な高負荷で `RESOURCE_EXHAUSTED` や `UNAVAILABLE` が出たときに次のモデルを試すようにしました。

次に、citationのUIです。APIから `media_id` が返っても、そのまま長い文字列をカードに出すだけでは、ユーザーには何も伝わりません。今回のデモでは、画像citationはカード上に画像を表示し、クリックで詳細を開けるようにしました。RAGの価値は「答えが出る」だけでなく、「どの根拠を見れば確認できるか」がすぐ分かることにあります。

最後に、公開デモと実APIデモの切り分けです。GitHub PagesにAPIキーを置くわけにはいかないので、公開サイトはmockで体験を見せ、実際のGemini通信はローカルproxyで動かす形にしました。ここを曖昧にすると、「本当にGemini APIを使っているのか」が分かりにくくなります。

## 試し方

mock UIだけ触るなら、これで起動できます。

```bash
npm install
npm run generate:dataset
npm run dev
```

Gemini File Search storeを作って実APIで試す場合は、`.env.local` にAPIキーを置いてからbootstrapします。

```bash
GEMINI_API_KEY=your_api_key_here
```

```bash
npm install
npm run generate:dataset
npm run bootstrap:gemini
npm run dev
```

起動後、`http://127.0.0.1:5178/` を開くとデモを試せます。

## まとめ

今回のGemini API File Searchのアップデートは、単なる画像入力対応ではありません。画像、文書、metadata、citationをまとめて扱える managed RAG の進化です。

特に業務アプリでは、商品写真、棚札、梱包ラベル、図表、PDF、FAQがばらばらに存在します。そこに対して、自然言語で聞き、metadataで絞り、回答の根拠を画像やページ単位で見せられるようになるのは、かなり実用寄りの変化です。

RAGを「それっぽい回答を出す仕組み」から、「確認できる業務検索」に近づけるアップデート。今回のFile Searchのマルチモーダル化は、まさにその方向の一歩だと思います。

## 参考

- Google Blog: Gemini API File Search is now multimodal: build efficient, verifiable RAG  
  https://blog.google/innovation-and-ai/technology/developers-tools/expanded-gemini-api-file-search-multimodal-rag/
- Gemini API File Search docs  
  https://ai.google.dev/gemini-api/docs/file-search
- Gemini API release notes  
  https://ai.google.dev/gemini-api/docs/changelog
- Nekoneko Company File Search Demo  
  https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo
