<p align="center">
  <img src="./assets/nekoneko-file-search-logo.svg" alt="Nekoneko Company File Search Demo" width="860">
</p>

<p align="center">
  <strong>日本語</strong> · <a href="./README.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo/releases/tag/v1.0.0"><img alt="Release" src="https://img.shields.io/github/v/release/Sunwood-ai-labs/nekoneko-file-search-demo?sort=semver"></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-1d211d"></a>
  <img alt="React" src="https://img.shields.io/badge/React-19-4b89dc">
  <img alt="Gemini File Search" src="https://img.shields.io/badge/Gemini-File%20Search-c96b3c">
</p>

Nekoneko Company File Search Demo は、Gemini API File Search のマルチモーダル RAG を試すための小さな公開デモです。架空の「ねこねこカンパニー」データセットを使い、商品写真、棚札、梱包ラベル、FAQ、保証規定、商品マスターを同じ検索体験で扱います。

このアプリは2つのモードで動きます。

- Gemini API サーバー未設定時の **ローカル mock モード**
- `GEMINI_API_KEY` と File Search store 設定済みの **Gemini File Search モード**

## ✨ 特長

- PNG 画像とテキスト文書を同じ UI で検索できます。
- `department`、`status`、`year` の metadata filter を使えます。
- 入力後に明示的な送信ボタンで検索できます。
- 回答に citation カードを表示します。
- citation 詳細モーダルで、根拠テキスト、metadata、完全な `media_id`、画像プレビューを確認できます。
- アップロード想定ファイルをインラインのサムネイル付きギャラリーで確認できます。
- Gemini API キーはローカル Express proxy 側に置き、ブラウザへ出しません。
- quota や一時的な高負荷エラー時に Gemini File Search 対応モデルを順番にフォールバックします。

## 🧺 デモデータセット

同梱している架空ファイルは6つです。

| ファイル | 種類 | metadata |
| --- | --- | --- |
| にゃんサーバー Mini 商品写真 | PNG 画像 | `product`, `final`, `2026` |
| 毛玉クラウド Pro 棚札 | PNG 画像 | `store`, `final`, `2026` |
| しっぽセンサー 梱包ラベル | PNG 画像 | `legal`, `final`, `2025` |
| サポートFAQ 2026 Q2 | Markdown 文書 | `support`, `final`, `2026` |
| 保証規定 2026 | Markdown 文書 | `legal`, `final`, `2026` |
| 商品マスター 抜粋 | JSON/text 文書 | `product`, `draft`, `2026` |

画像 fixture は `public/dataset/images/`、文書 fixture は `public/dataset/docs/` にあります。

## 🚀 クイックスタート

```bash
npm install
npm run generate:dataset
npm run dev
```

[http://127.0.0.1:5178/](http://127.0.0.1:5178/) を開きます。

Gemini credentials が無い場合でも、UI はローカル mock 検索で触れます。

## 🔎 Gemini File Search セットアップ

`.env.local` を作成します。

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODELS=gemini-3.1-flash-lite-preview,gemini-2.5-flash,gemini-2.5-pro,gemini-2.5-flash-lite
```

File Search store を作成し、同梱データセットをアップロードします。

```bash
npm run generate:dataset
npm run bootstrap:gemini
npm run dev
```

`scripts/bootstrap-file-search.mjs` は `models/gemini-embedding-2` を使って File Search store を作成し、6ファイルすべてを custom metadata 付きでアップロードします。作成された `GEMINI_FILE_SEARCH_STORE` は `.env.local` に書き戻されます。

## 🧠 モデルフォールバック

`GEMINI_MODELS` はカンマ区切りのフォールバックチェーンです。`/api/query` は以下の retryable な quota / 高負荷エラー時に、次の Gemini モデルを試します。

- `RESOURCE_EXHAUSTED`
- `UNAVAILABLE`
- HTTP `429`
- HTTP `503`

Gemma 4 モデルは Gemini API のモデル一覧に表示される場合がありますが、このデモは File Search tool が主題なので Gemini 系モデルを使います。

## 🧪 検証

```bash
npm run check
npm run build
```

`npm run check` はデータセット画像を再生成し、Vite アプリをビルドします。

## 🌐 GitHub Pages

このリポジトリには GitHub Pages workflow が入っています。Pages build では `GITHUB_PAGES=true` を設定し、Vite の base path を `/nekoneko-file-search-demo/` に切り替えます。

公開された静的サイトでは、secret なしの mock UI を確認できます。実際の Gemini File Search は API キーをブラウザへ出さないため、ローカル Express API proxy 経由で使います。

## 🗂️ リポジトリ構成

```text
assets/                         ロゴなど公開向けビジュアル
public/dataset/images/           PNG デモ画像
public/dataset/docs/             テキスト/JSON デモファイル
scripts/bootstrap-file-search.mjs Gemini File Search store 作成スクリプト
scripts/generate-dataset-images.mjs 画像 fixture 生成スクリプト
server/index.mjs                 ローカル Gemini API proxy
src/                             React アプリ
.github/workflows/               CI と Pages deploy
```

## 🔐 セキュリティメモ

- `.env.local` はコミットしないでください。
- `GEMINI_API_KEY` は server-side に置いてください。
- このローカル API proxy はデモ/開発用であり、本番用に堅牢化されたものではありません。

## 📦 リリース

最新リリース: [v1.0.0](https://github.com/Sunwood-ai-labs/nekoneko-file-search-demo/releases/tag/v1.0.0)

## 📄 ライセンス

MIT License. 詳細は [LICENSE](./LICENSE) を参照してください。
