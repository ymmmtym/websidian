---
tags:
  - llm
  - provider
  - aggregator
  - orchestration
  - mcp
created: 2026-09-05
---
## 概要

LLM を活用するシステムは **4層構造** で整理できる。ただし、すべての層が必要なわけではなく、ユースケースに応じて層をスキップするのが基本原則。

| 層 | 役割 | 代表例 | 必須？ |
|---|---|---|---|
| LLM プロバイダー層 | モデル本体の学習・提供、API 公開 | Anthropic, OpenAI, Google, Meta | ✅ 必須 |
| アグリゲーター層 | 複数プロバイダーを束ねて統一 API で提供 | OpenRouter | 任意 |
| オーケストレーション層 | 複数 LLM・ツールを組み合わせてワークフロー化 | LangChain, LlamaIndex, LiteLLM | 任意 |
| ツール層 | LLM をバックエンドとして使うプロダクト | Claude Code, Cursor, Copilot | ✅ 必須 |

外部サービスとの連携には **MCP（Model Context Protocol）** が使われる。

---

## 詳細説明

### 1. LLM プロバイダー層

モデルそのものを開発・運用し、REST API として外部に公開する。

| プロバイダー | 主要モデル | 特徴 |
|---|---|---|
| **Anthropic** | Claude 3.x / 4.x（Haiku, Sonnet, Opus） | 安全性重視・長コンテキスト |
| **OpenAI** | GPT-4o, o1, o3 | 最も普及・エコシステムが成熟 |
| **Google** | Gemini 2.x（Flash, Pro, Ultra） | マルチモーダル・GCP 統合 |
| **Meta / OSS** | Llama 3.x | オープンウェイト・ローカル実行可能 |

**Claude は「プロバイダー」であり「ツール提供者」でもある**

- Anthropic API → LLM プロバイダー層
- `claude.ai` → ツール層（チャット UI）
- Claude Code → ツール層（内部で Anthropic API を呼び出している）

---

### 2. アグリゲーター層

複数のプロバイダーを束ねて、**単一の OpenAI 互換エンドポイント**として提供する層。

#### 代表: OpenRouter

- 300+ モデルを単一エンドポイント（`https://openrouter.ai/api/v1`）で提供
- コスト構造：**プロバイダー公式料金 + マークアップ**（数%）
- フォールバック機能：あるプロバイダーがレート制限に引っかかると自動で別プロバイダーに切り替え

**レート制限の二重構造に注意**

```
ユーザー
  → OpenRouter のレート制限（プラン依存）
    → 各プロバイダーのレート制限（TPM / RPM）
```

#### OpenRouter vs LiteLLM

| | OpenRouter | LiteLLM |
|---|---|---|
| 形態 | クラウドサービス（SaaS） | OSS ライブラリ（セルフホスト） |
| API キー管理 | OpenRouter が一元管理 | 自分でプロバイダーキーを保持 |
| コスト | マークアップあり | プロバイダー直接料金のみ |
| カスタマイズ | 制限あり | 自由度高い |
| 向いている用途 | 手軽に複数モデルを試したい | 本番運用・コスト最適化 |

---

### 3. オーケストレーション層

単一の LLM 呼び出しでは解決できない複雑なタスクを、複数ステップ・複数ツールの連鎖で処理する層。

| フレームワーク | 特徴 |
|---|---|
| **LangChain** | Chain / Agent が中心。最も広く使われる |
| **LlamaIndex** | RAG（検索拡張生成）に特化。インデックス構築が得意 |
| **LiteLLM** | 100+ LLM を OpenAI 互換 API で統一するゲートウェイ |
| **Dify 他** | GUI でワークフローを組むノーコード系 |

---

### 4. ツール層（LLM 利用アプリ）

エンドユーザーや開発者が直接触れるプロダクト。

| ツール | 提供元 | 用途 |
|---|---|---|
| **Claude Code** | Anthropic | CLI から Claude を呼ぶコーディングエージェント |
| **Cursor** | Anysphere | VSCode フォーク。GPT / Claude をエディタに統合 |
| **GitHub Copilot** | Microsoft / OpenAI | IDE 補完・Copilot Chat |
| **ChatGPT** | OpenAI | 汎用チャット UI |
| **自社製アプリ** | 各社 | SDK を直接叩いて独自 UX を構築 |

---

### 5. 外部サービス連携と MCP

LLM が実世界のデータ・アクションにアクセスするための仕組み。

#### Function Calling（ツール呼び出し）

```
ユーザー → LLM → {"tool": "search", "query": "..."}
         ← 検索結果 ← 検索 API
         → 最終回答
```

#### MCP（Model Context Protocol）

Anthropic が提唱したツール統合の標準化プロトコル（2024年〜）。

- LLM クライアントと外部サービスの間を標準化
- MCP サーバーを実装すれば、どの MCP 対応クライアントからでも呼び出せる
- 対応例：GitHub, Slack, Notion, PostgreSQL, Brave Search …

```
[MCP クライアント] ←→ [MCP サーバー] ←→ [GitHub / DB / 外部サービス]
```

---

## 図解：全体レイヤー構造

```
┌──────────────────────────────────────────────┐
│           LLM プロバイダー層                   │
│   Anthropic  OpenAI  Google  Meta/OSS         │
└───────────────┬──────────────────────────────┘
                │ API
┌───────────────▼──────────────────────────────┐
│     アグリゲーター層（任意）                   │
│   OpenRouter  ── 複数プロバイダーを統一        │
└───────────────┬──────────────────────────────┘
                │ OpenAI 互換 API
┌───────────────▼──────────────────────────────┐
│     オーケストレーション層（任意）              │
│   LangChain  LlamaIndex  LiteLLM  Dify       │
└───────────────┬──────────────────────────────┘
                │ 呼び出し
┌───────────────▼──────────────────────────────┐
│     ツール層（LLM 利用アプリ）                 │
│   Claude Code  Cursor  Copilot  自社アプリ    │
└──────────────────────────────────────────────┘
         ↕ Function Calling / MCP
┌──────────────────────────────────────────────┐
│     外部サービス（MCP サーバー経由）           │
│   GitHub  Slack  DB  Web 検索  カレンダー …  │
└──────────────────────────────────────────────┘
```

---

## 図解：呼び出しパターン比較（層はスキップ可能）

```
            パターン A         パターン B          パターン C
            直接 API           + アグリゲーター     フルスタック
LLM      [Anthropic API]   [複数プロバイダー]    [複数プロバイダー]
              ↓                    ↓                    ↓
集約      （スキップ）         [OpenRouter]         [OpenRouter]
              ↓                    ↓                 （任意）↓
オケ      （スキップ）         （スキップ）         [LangChain 等]
              ↓                    ↓                    ↓
ツール    [自社アプリ]         [自社アプリ]          [自社アプリ]

向いている   単一モデルで         モデル比較・           RAG / Agent /
ケース       十分。コスト         切替が頻繁。           複数ステップの
             最小化したい         フォールバック         本番ワークフロー
                                  が必要
```

**原則：層は必要なときだけ加える。シンプルな用途に全層を重ねる必要はない。**

---

## まとめ

- **プロバイダー層**はモデルを作って API で公開する（Anthropic, OpenAI, Google, Meta）
- **アグリゲーター層**（OpenRouter 等）は複数プロバイダーを束ねる中継役。マークアップとレート制限の二重構造が運用上の注意点
- **オーケストレーション層**は RAG・Agent・複数ステップのワークフローが必要なときに登場
- **ツール層**はユーザーが触れる最終プロダクト（Claude Code, Cursor, Copilot 等）
- **Claude は 3 層に登場する**：プロバイダー（Anthropic API）・ツール（claude.ai）・ツール（Claude Code）
- **MCP** はツールと外部サービスを標準化する Anthropic 発のプロトコル

---

## 参考リンク

- [Anthropic API ドキュメント](https://docs.anthropic.com/)
- [OpenRouter](https://openrouter.ai/)
- [MCP（Model Context Protocol）](https://modelcontextprotocol.io/)
- [LangChain 公式](https://python.langchain.com/)
- [LlamaIndex 公式](https://www.llamaindex.ai/)
- [LiteLLM](https://litellm.ai/)

### 関連項目

- [[LLMハルシネーション]]
- [[Well-Knownディレクトリ]]
- [[opencodeのcron定期実行]]
- [[Cloudflare OS]]
- [[GitHub ModelsでIssueをPRに自動変換]]
