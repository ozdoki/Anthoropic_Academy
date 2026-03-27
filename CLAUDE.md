# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
# 開発サーバー起動（Turbopack）
npm run dev

# ビルド
npm run build

# Lint
npm run lint

# テスト（全件）
npm test

# テスト（特定ファイル）
npx vitest run src/lib/__tests__/file-system.test.ts

# 初回セットアップ（install + DB 生成・移行）
npm run setup

# DB リセット
npm run db:reset
```

## アーキテクチャ概要

### 全体像

Claude AI（Haiku 4.5）を使って React コンポーネントをリアルタイム生成するツール。Next.js 15 App Router + Vercel AI SDK を使用。APIキーなし時はモック生成モードで動作する。

### データフロー

1. ユーザーがチャットで要件を入力
2. `/api/chat` エンドポイントが Claude に送信
3. Claude が Tool Call（`str_replace_editor` / `file_manager`）でファイル操作を指示
4. `FileSystemContext` が操作を受け取り `VirtualFileSystem` を更新
5. `PreviewFrame` が JSX 変換（Babel Standalone）＋ ImportMap でブラウザ内実行
6. 登録ユーザーは Prisma SQLite でプロジェクト永続化

### 主要なモジュール

| モジュール | ファイル | 役割 |
|-----------|---------|------|
| VirtualFileSystem | `src/lib/file-system.ts` | メモリ上でファイルツリーを管理。ディスク書き込みなし |
| JSX Transformer | `src/lib/transform/jsx-transformer.ts` | Babel で JSX 変換、CDN（esm.sh）ベースの ImportMap を生成 |
| AI Provider | `src/lib/provider.ts` | Anthropic クライアントまたは MockLanguageModel を返す |
| AI Tools | `src/lib/tools/` | `str_replace_editor`（作成・編集・表示）と `file_manager`（削除・リネーム） |
| FileSystemContext | `src/lib/contexts/file-system-context.tsx` | AI のツール呼び出しを受け取り VirtualFileSystem に反映 |
| ChatContext | `src/lib/contexts/chat-context.tsx` | Vercel AI SDK の `useChat` をラップ、匿名ユーザー追跡を担当 |
| Generation Prompt | `src/lib/prompts/generation.tsx` | AI へのシステムプロンプト。Tailwind CSS と `/App.jsx` エントリーポイントを前提とする |

### 認証

JWT（jose）＋ bcrypt。Cookie（httpOnly, 7日間）で管理。Server Actions（`src/actions/index.ts`）で signUp / signIn / signOut を処理。

### 匿名ユーザー

sessionStorage で作業内容を保持（`src/lib/anon-work-tracker.ts`）。サインイン時に `use-auth.ts` が自動でプロジェクト化してリダイレクト。

### UI レイアウト

`src/app/main-content.tsx` が中心。react-resizable-panels で左（チャット 35%）／右（プレビュー or コードエディタ 65%）に分割。

### AI 生成の前提

- エントリーポイントは `/App.jsx` 固定
- スタイリングは Tailwind CSS のみ（CSS ファイルは変換時に除去）
- 外部ライブラリは esm.sh CDN から自動ロード（ImportMap 経由）

## 技術スタック

- **フレームワーク**: Next.js 15（App Router）、React 19
- **AI**: `@ai-sdk/anthropic` + `ai`（Vercel AI SDK）、Claude Haiku 4.5
- **DB**: Prisma 6 + SQLite（`prisma/dev.db`）、生成クライアントは `src/generated/prisma/`
- **UI**: Tailwind CSS v4、Radix UI、shadcn/ui（new-york スタイル）、Monaco Editor
- **テスト**: Vitest + React Testing Library（jsdom 環境）
- **パスエイリアス**: `@/*` → `src/*`

## 注意事項

- `node-compat.cjs` は Node.js 25+ での `localStorage`/`sessionStorage` SSR 問題の回避策。`dev`/`build`/`start` スクリプトに `--require` で自動ロードされる。
- APIキー（`ANTHROPIC_API_KEY`）は `.env` で設定。未設定でも Mock モードで動作する。
- Prisma クライアントは `src/generated/prisma/` に生成される（標準の `node_modules/.prisma` ではない）。
