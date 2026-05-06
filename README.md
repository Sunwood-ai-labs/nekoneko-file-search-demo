# Nekoneko Company File Search Demo

Gemini API File Search の「画像も含むマルチモーダルRAG」を説明するための、ねこねこカンパニー社内検索デモです。

## 何が入っているか

- `public/dataset/images/`: PNG の商品写真、棚札、梱包ラベル
- `public/dataset/docs/`: FAQ、保証規定、商品マスター
- `src/data/catalog.ts`: デモ用メタデータ、`department`、`status`、`year`、`media_id`、ページ番号
- `src/lib/mockSearch.ts`: APIキーなしで動くローカル疑似検索
- `src/App.tsx`: メタデータフィルター、回答、citation 表示付き UI

## ローカル起動

```bash
npm install
npm run generate:dataset
npm run dev
```

## 検証

```bash
npm run check
```

## Gemini File Search に接続する場合

公式ドキュメントでは File Search store 作成時に `models/gemini-embedding-2` を指定すると、テキストと画像を同じ store に入れて検索できます。2026-05-06 時点の公式 File Search ガイドでは、画像・マルチモーダル embedding は `gemini-embedding-2`、音声と動画は未対応です。

接続時の想定フロー:

1. `GEMINI_API_KEY` を設定する
2. `models/gemini-embedding-2` で File Search store を作る
3. `public/dataset/images/*.png` と `public/dataset/docs/*` をアップロードする
4. UI 側の mock 検索を、`@google/genai` の `models.generateContent` + `fileSearch` tool 呼び出しに差し替える

この repo は API キーをコミットしない前提です。
