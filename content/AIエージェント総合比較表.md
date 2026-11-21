---
tags:
  - ai
  - agent
  - llm
  - comparison
  - saas
created: 2026-11-04
---

## 概要

2026年10月30日時点の SaaS / クラウド型 AI エージェント（汎用チャット・エージェント、コーディング特化エージェント、AIアプリビルダー）を、無料枠・CLI 対応・SKILL.md 対応・料金の観点で比較する。OSS のセルフホストは対象外。

## 凡例

### 評価記号

| 記号 | 意味 |
|------|------|
| **◎** | 完全無料で利用可能 / 標準対応 |
| **○** | 無料枠ありで利用可能 |
| **△** | 限定・制限あり / APIキー持ち込みでツール無料（モデルコスト別） |
| **✕** | 有料プラン必須 / 非対応 |
| **N/A** | 該当なし |

### 無料枠充実度（★評価）

| 評価 | 基準 |
|------|------|
| ★★★★★ | Frontierモデルが完全無料で使える |
| ★★★★☆ | 実用的な無料枠あり |
| ★★★☆☆ | 無料枠ありだが制限あり |
| ★★☆☆☆ | 限定アクセス・回数制限あり |
| ★☆☆☆☆ | ほぼ有料必須 |

### OSSツールについて

「OSS（△）」と表記されているツール（Aider、Qwen Code、DeepSeek Harness）は、**セルフホスト（自前サーバー構築）は不要**である。ローカルPCにインストールして使うCLIツールである。ただし、モデルのAPIキー（Claude、OpenAI、DeepSeek、Alibaba Cloud等）を持ち込む必要があり、そのAPI利用料が別途発生する。

## 目次

1. [総合比較表（全サービス一覧）](#総合比較表)
2. [汎用AIチャット・エージェント](#汎用aiチャットエージェント)
3. [コーディング特化エージェント](#コーディング特化エージェント)
4. [AIアプリビルダー](#aiアプリビルダー)
5. [SKILL.md対応の詳細](#skillmd対応の詳細)
6. [CLIコーディングエージェントの詳細](#cliコーディングエージェントの詳細)
7. [総合ランキング・おすすめ](#総合ランキングおすすめ)

## 総合比較表

| カテゴリ | サービス | 無料枠 | CLI無料 | SKILL.md | 充実度 | 有料プラン |
|----------|----------|--------|---------|----------|--------|-----------|
| 汎用 | ChatGPT (OpenAI) | △ | ✕ | ◎ | ★★☆☆☆ | Plus $20/月〜 |
| 汎用 | Claude (Anthropic) | △ | ✕ | ◎ | ★★☆☆☆ | Pro $20/月〜 |
| 汎用 | Google Gemini | ◎ | △ | △ | ★★★★☆ | $20/月 |
| 汎用 | Microsoft Copilot | △ | △ | ◎ | ★★☆☆☆ | M365 Personal〜 |
| 汎用 | Meta Muse | ◎ | ○ | △ | ★★★★☆ | $20/月〜 |
| 汎用 | Kimi | △ | △ | ◎ | ★★☆☆☆ | 49元/月〜 |
| 汎用 | DeepSeek | ◎◎ | △ | △ | ★★★★★ | API有料 |
| 汎用 | Qwen (Alibaba) | ◎ | △ | ◎ | ★★★★☆ | APIキー or Alibaba Cloud |
| 汎用 | Sakana Chat | ◎ | ✕ | ✕ | ★★★★☆ | 現時点無料 |
| コーディング | GitHub Copilot | △ | ✕ | ◎ | ★★☆☆☆ | Pro $10/月〜 |
| コーディング | Cursor | △ | ○ | ◎ | ★★★☆☆ | Pro $20/月 |
| コーディング | Windsurf (Devin Desktop) | △ | ○ | △ | ★★☆☆ | Pro $20/月〜 |
| コーディング | Amazon Q Developer | ○ | ○ | ◎ | ★★★☆☆ | Pro $19/月 |
| コーディング | JetBrains Junie | ○ | ○ | △ | ★★☆☆☆ | AI Pro $10/月〜 |
| コーディング | Devin (Cognition) | ○ | ○ | △ | ★★★☆☆ | Pro $20/月〜 |
| コーディング | Aider | △ (OSS) | △ (OSS) | ◎ | ★★★☆☆ | ツール無料 + APIコスト |
| コーディング | Sourcegraph Cody | ✕ | ✕ | △ | ★☆☆☆☆ | Enterpriseのみ |
| コーディング | Tabnine | ✕ | ✕ | ✕ | ★☆☆☆☆ | $39〜59/月 |
| アプリビルダー | Replit Agent | ○ | N/A | ✕ | ★★★☆☆ | Core $20/月〜 |
| アプリビルダー | v0.dev (Vercel) | △ | N/A | ✕ | ★★☆☆☆ | Plus $30/月〜 |
| アプリビルダー | Bolt.new | ○ | N/A | ✕ | ★★★☆☆ | Pro $25/月〜 |
| アプリビルダー | Lovable | ○ | N/A | ✕ | ★★★☆☆ | Pro $25/月〜 |

## 汎用AIチャット・エージェント

### ChatGPT (OpenAI)

| 項目 | 内容 |
|------|------|
| **無料枠** | △ Work限定アクセス。Agentモードは終了。基本チャット・Web検索・ファイル作成・コード実行は無料で利用可能 |
| **CLIコーディングエージェント無料** | ✕ Codex CLIはPlus $20/月〜 |
| **SKILL.md対応** | ◎ `.codex/skills/` ディレクトリ。Open Agent Skills標準対応 |
| **無料枠充実度** | ★★☆☆☆ |
| **有料プラン** | Plus $20/月、Pro $200/月 |
| **主な特徴** | Web検索・ファイル作成・コード実行は無料版でも利用可能。Work機能（組織向け）は有料。Codex CLIは有料プラン必須 |

### Claude (Anthropic)

| 項目 | 内容 |
|------|------|
| **無料枠** | △ チャット・Web検索・Artifacts無料。Computer Use / CoworkはPro必須 |
| **CLIコーディングエージェント無料** | ✕ Claude CodeはPro $20/月〜 |
| **SKILL.md対応** | ◎ `.claude/skills/` ディレクトリ。CLAUDE.md併用可能 |
| **無料枠充実度** | ★★☆☆☆ |
| **有料プラン** | Pro $20/月、Max $100〜200/月 |
| **主な特徴** | 無料版でもWeb検索・コード実行・Artifacts作成が可能。Computer Use（マウス/キーボード操作）はPro以上。Claude Codeはターミナル対話型エージェント |

### Google Gemini

| 項目 | 内容 |
|------|------|
| **無料枠** | ◎ Flash-Lite無料。Deep Research・画像生成・Gemini Live・Canvas・Gems無料 |
| **CLIコーディングエージェント無料** | △ Antigravity / Gemini CLIはAPIキー or 有料プラン |
| **SKILL.md対応** | △ Interactions API方式。SKILL.md非標準 |
| **無料枠充実度** | ★★★★☆ |
| **有料プラン** | Google One AI $20/月 |
| **主な特徴** | 無料版でも充実した機能。Computer Useは開発者向けAPI（プレビュー）。Gemini CLIは2026年10月に無料枠縮小 |

### Microsoft Copilot

| 項目 | 内容 |
|------|------|
| **無料枠** | △ チャット無料。Tasks / Coworkは有料 |
| **CLIコーディングエージェント無料** | △ Copilot CLIはM365有料プラン向け |
| **SKILL.md対応** | ◎ `.github/copilot/` ディレクトリ。`gh skill install` 対応 |
| **無料枠充実度** | ★★☆☆☆ |
| **有料プラン** | Microsoft 365 Personal〜 |
| **主な特徴** | 無料版はBing Chat相当。エージェント機能（Tasks/Cowork）はM365必要。GitHub連携が強力 |

### Meta Muse

| 項目 | 内容 |
|------|------|
| **無料枠** | ◎ 週1億トークン（100M tokens/week）。個人利用で十分実用的 |
| **CLIコーディングエージェント無料** | ○ Muse Code CLI。無料枠内で利用可能 |
| **SKILL.md対応** | △ JSON設定方式（`~/.config/muse/settings.json`）。SKILL.md非標準 |
| **無料枠充実度** | ★★★★☆ |
| **有料プラン** | Power $20/月、Maximum $100/月 |
| **主な特徴** | メール・カレンダー・決済・スマートホーム連携。週1億トークンは現時点で最大級の無料枠。Muse CodeはRust製、macOS/Linux対応 |

### Kimi (月之暗面 / Moonshot AI)

| 項目 | 内容 |
|------|------|
| **無料枠** | △ OK Computer・Deep Researcherは約3回の試用のみ。基本チャットは無料 |
| **CLIコーディングエージェント無料** | △ Kimi Code CLI。無料枠あり（制限あり） |
| **SKILL.md対応** | ◎ `.kimi-code/skills/` ディレクトリ。SKILL.md標準対応 |
| **無料枠充実度** | ★★☆☆☆ |
| **有料プラン** | 49元/月（約1,000円）〜 |
| **主な特徴** | 中国語圏で人気。200万文字コンテキスト。OK ComputerはMulti-Agent対応。`/skill:name` スラッシュコマンドでSkills呼び出し |

### DeepSeek

| 項目 | 内容 |
|------|------|
| **無料枠** | ◎◎ Webチャット完全無料。DeepSeek HarnessもOSSで無料 |
| **CLIコーディングエージェント無料** | △ Harness CLI。APIキー持ち込みでツール無料 |
| **SKILL.md対応** | △ プラグイン方式。SKILL.md非標準 |
| **無料枠充実度** | ★★★★★ |
| **有料プラン** | API有料（Webチャット無料） |
| **主な特徴** | Frontierモデル（V4）が完全無料で使える貴重なサービス。100万トークンコンテキスト。プラグイン拡張が豊富 |

### Qwen (Alibaba)

| 項目 | 内容 |
|------|------|
| **無料枠** | ◎ Qwen Studioアプリ完全無料。CUAエジェントもOSS |
| **CLIコーディングエージェント無料** | △ Qwen Code CLI。APIキー or Alibaba Cloud |
| **SKILL.md対応** | ◎ SKILL.md標準対応。オープンソース |
| **無料枠充実度** | ★★★★☆ |
| **有料プラン** | APIキー or Alibaba Cloud |
| **主な特徴** | Qwen Studioはチャット・画像・動画・Deep Researchが無料。CUAは397Bパラメータの画面操作エージェント。2026年4月にOAuth無料枠終了 |

### Sakana Chat

| 項目 | 内容 |
|------|------|
| **無料枠** | ◎ 時点無料。Web検索・コード実行・ファイル作成可 |
| **CLIコーディングエージェント無料** | ✕ Webのみ。CLI非対応 |
| **SKILL.md対応** | ✕ 内部スキル別仕様（html, pdf, pptx等）。SKILL.md不可 |
| **無料枠充実度** | ★★★★☆ |
| **有料プラン** | 現時点無料 |
| **主な特徴** | 調査からレポート作成（HTML/PDF/PPTX）まで一貫して無料で実行可能。Web検索・Python/シェル実行・ファイル入出力が統合 |

## コーディング特化エージェント

### GitHub Copilot

| 項目 | 内容 |
|------|------|
| **無料枠** | △ エディタ統合（VS Code等）は無料。CLIは有料向け |
| **CLIコーディングエージェント無料** | ✕ Copilot CLIはPro $10/月〜 |
| **SKILL.md対応** | ◎ SKILL.md対応。`gh skill install` でスキル管理 |
| **無料枠充実度** | ★★☆☆☆ |
| **有料プラン** | Pro $10/月、Business $19/月 |
| **主な特徴** | VS Code等への自動補完・チャットは無料。CLI・エージェント機能は有料。GitHubエコシステム（PR・Issue・Actions）との統合が強力 |

### Cursor

| 項目 | 内容 |
|------|------|
| **無料枠** | △ Hobbyプラン無料。Pro $20/月 |
| **CLIコーディングエージェント無料** | ○ cursor-agent CLI。Hobbyで利用可 |
| **SKILL.md対応** | ◎ `.cursor/skills/` + `.mdc` rules併用可。AGENTS.md・CLAUDE.mdも読み込み可 |
| **無料枠充実度** | ★★★☆☆ |
| **有料プラン** | Pro $20/月 |
| **主な特徴** | エディタ+CLI両対応。`.mdc` ルールファイル（Cursor独自）とSKILL.mdの両に対応。他ツールからの移行が容易 |

### Windsurf (旧Codeium / Devin Desktop)

| 項目 | 内容 |
|------|------|
| **無料枠** | △ Freeプランあり。5回/日のpremiumモデル利用可 |
| **CLIコーディングエージェント無料** | ○ CLI対応。Free枠内で利用可 |
| **SKILL.md対応** | △ 独自方式。SKILL.md非標準 |
| **無料枠充実度** | ★★☆☆☆ |
| **有料プラン** | Pro $20/月、Max $200/月 |
| **主な特徴** | 旧Codeium。Cognition AI（Devin）が買収。Cascadeフローでエージェント的コーディング。SWE-1.6/1.7モデル |

### Amazon Q Developer

| 項目 | 内容 |
|------|------|
| **無料枠** | ○ 月50回のagentic requests無料。CodeWhisperer後継 |
| **CLIコーディングエージェント無料** | ○ Q Developer CLI。無料枠内で利用可 |
| **SKILL.md対応** | ◎ SKILL.md対応 |
| **無料枠充実度** | ★★★☆☆ |
| **有料プラン** | Pro $19/月 |
| **主な特徴** | AWS連携が強力。コード変換・セキュリティ診断・CLIエージェントが充実。MCPサーバーベスのツール連携 |

### JetBrains Junie

| 項目 | 内容 |
|------|------|
| **無料枠** | ○ 3 AI credits/30日 + Junie Lite無料。IDE統合 |
| **CLIコーディングエージェント無料** | ○ Junie CLI。無料枠内で利用可 |
| **SKILL.md対応** | △ JetBrains独自方式。SKILL.md非標準 |
| **無料枠充実度** | ★★☆☆☆ |
| **有料プラン** | AI Pro $10/月、AI Ultimate $30/月 |
| **主な特徴** | IntelliJ等に統合。JunieエージェントがIDE内+CLIで動作。BYOK（APIキー持ち込み）も可。Codexも統合 |

### Devin (Cognition)

| 項目 | 内容 |
|------|------|
| **無料枠** | ○ Freeプランあり。Light quota。SWE-2無料期間あり（2026年10月〜11月） |
| **CLIコーディングエージェント無料** | ○ Devin CLI。無料枠内で利用可 |
| **SKILL.md対応** | △ 独自方式。SKILL.md非標準 |
| **無料枠充実度** | ★★★☆☆ |
| **有料プラン** | Pro $20/月、Max $200/月 |
| **主な特徴** | 自律型AIソフトウェアエンジニア。フルスタック開発・デプロイまで自動化。2026年4月にCore/Teamプランを廃止しFree/Pro/Max/Teamsへ変更 |

### Aider

| 項目 | 内容 |
|------|------|
| **無料枠** | △ ツール自体無料（OSS）。モデルAPIコスト別 |
| **CLIコーディングエージェント無料** | △ 完全無料（OSS）。APIキー持ち込み |
| **SKILL.md対応** | ◎ SKILL.md対応。コミュニティ充実 |
| **無料枠充実度** | ★★★☆☆ |
| **有料プラン** | ツール無料 + APIコストのみ |
| **主な特徴** | ターミナルネイティブ。Git自動コミット。Claude/GPT/DeepSeek等多数モデル対応。Repo mapで大規模コードベース対応。セルフホスト不要 |

### Sourcegraph Cody

| 項目 | 内容 |
|------|------|
| **無料枠** | ✕ Free/Pro終了。Enterpriseのみ |
| **CLIコーディングエージェント無料** | ✕ CLIはEnterprise向け |
| **SKILL.md対応** | △ 独自方式 |
| **無料枠充実度** | ★☆☆☆☆ |
| **有料プラン** | Enterprise（カスム見積） |
| **主な特徴** | 2025年7月にFree/Pro終了。コードベース全体の理解に強いが、個人開発者向けではなくなった |

### Tabnine

| 項目 | 内容 |
|------|------|
| **無料枠** | ✕ 無料枠終了。Enterpriseのみ |
| **CLIコーディングエージェント無料** | ✕ 有料必須 |
| **SKILL.md対応** | ✕ 非対応 |
| **無料枠充実度** | ★☆☆☆☆ |
| **有料プラン** | $39〜59/月（年契約のみ） |
| **主な特徴** | 2026年7月にTricentisが買収。個人向け販売終了。プライバシー重視の企業向け |

## AIアプリビルダー

### Replit Agent

| 項目 | 内容 |
|------|------|
| **無料枠** | ○ Starter無料。Free Modeで日次クレジット |
| **CLIコーディングエージェント無料** | N/A ブラウザベース |
| **SKILL.md対応** | ✕ 非対応 |
| **無料枠充実度** | ★★★☆☆ |
| **有料プラン** | Core $20/月、Pro $100/月 |
| **主な特徴** | ブラウザ内でフルスタック開発・デプロイまで完結。Free Modeで無料エージェント利用可 |

### v0.dev (Vercel)

| 項目 | 内容 |
|------|------|
| **無料枠** | △ $5クレジット/月（新規はワンタイム）。7メッセージ/日制限 |
| **CLIコーディングエージェント無料** | N/A ブラウザベース |
| **SKILL.md対応** | ✕ 非対応 |
| **無料枠充実度** | ★★☆☆☆ |
| **有料プラン** | Plus $30/月、Business $100/月 |
| **主な特徴** | Next.js/ReactのUI生成・デプロイに特化。Vercel連携が強力。無料枠は試用レベル |

### Bolt.new (StackBlitz)

| 項目 | 内容 |
|------|------|
| **無料枠** | ○ 1M tokens/月。300K tokens/日。無料ホスティング |
| **CLIコーディングエージェント無料** | N/A ブラウザベース |
| **SKILL.md対応** | ✕ 非対応 |
| **無料枠充実度** | ★★★☆☆ |
| **有料プラン** | Pro $25/月 |
| **主な特徴** | ブラウザ内Node.jsランタイムでフルスタック構築。StackBlitz連携。無料枠はアプリビルダーとして実用的 |

### Lovable

| 項目 | 内容 |
|------|------|
| **無料枠** | ○ 5 build credits/日（月30上限）。チャット無料 |
| **CLIコーディングエージェント無料** | N/A ブラウザベース |
| **SKILL.md対応** | ✕ 非対応 |
| **無料枠充実度** | ★★★☆☆ |
| **有料プラン** | Pro $25/月、Business $50/月 |
| **主な特徴** | ノーコード〜低コードでWebアプリ構築。GitHub連携・デプロイ対応。2026年9月からチャット無料化 |

## SKILL.md対応の詳細

### SKILL.mdとは

SKILL.mdは、AIエージェントにプロジェクト固有の知識・ワークフロー・コード規約を教えるためのオープン標準フォーマットである。YAML Frontmatter付きのMarkdownファイルで、以下のような構成である：

```markdown
---
name: skill-name
description: このスキルの説明
---
# スキルの内容
ここにコード規約、ワークフロー、ベストプラクティスを記述
```

### 各サービスのSKILL.md配置場所

| サービス | SKILL.mdの配置場所 | 呼び出し方法 |
|----------|-------------------|-------------|
| Kimi Code | `.kimi-code/skills/` または `.agents/skills/` | `/skill:name` スラッシュコマンド |
| OpenAI Codex | `.codex/skills/` または `.agents/skills/` | 自動検出 + `/skill:name` |
| Claude Code | `.claude/skills/` または `~/.claude/skills/` | `/skill-name` スラッシュコマンド |
| GitHub Copilot CLI | `.github/copilot/skills/` | `gh skill install` でインストール |
| Cursor | `.cursor/skills/` または `.agents/skills/` | 自動検出 + スラッシュコマンド |
| Qwen Code | プロジェクトスコープ or ユーザースコープ | 自動検出 |
| Aider | プロジェクトスコープ or ユーザースコープ | 自動検出 |
| Amazon Q Developer | `.amazonq/skills/` | 自動検出 |

### SKILL.md非標準のサービス

| サービス | 独自方式 | 備考 |
|----------|----------|------|
| Meta Muse | `~/.config/muse/settings.json`（JSON設定） | スキル機能はあるがSKILL.md形式ではない |
| DeepSeek | プラグイン方式（Harness） | プラグインで拡張。SKILL.md非対応 |
| Google Gemini | Interactions API | 開発者向けAPI方式 |
| JetBrains Junie | JetBrains独自式 | IDE内設定で管理 |
| Devin | 独自方式 | ワークフロー定義ファイル |
| Windsurf | 独自方式 | Cascade設定で管理 |

## CLIコーディングエージェントの詳細

### 各サービスのCLIツール一覧

| サービス | CLI名 | 特徴 |
|----------|-------|------|
| Kimi Code | `kimi` | ターミナル対話型。SKILL.md自動検出。Planモード対応 |
| Muse Code | `muse` | Rust製。OSサンドボックス内で動作。セッション間メッセージング対応 |
| OpenAI Codex | `codex` | `codex exec` でワンショット実行。`codex review` でコードレビュー |
| Claude Code | `claude` | コンピュータ操作（マウス/キーボード）対応。CLAUDE.md併用 |
| Qwen Code | `qwen` | オープンソース。MCP対応。ローカルモデルも利用可 |
| DeepSeek Harness | `dsh` | プラグイン拡張可能。オープンソース。ワークスペース管理 |
| Gemini CLI | `gemini` | Antigravityエージェント統合。Linuxサンドボックス |
| Copilot CLI | `gh copilot` | GitHub CLI統合。`gh skill install` でスキル管理 |
| Cursor | `cursor-agent` | エディタと同じ設定（.mdc rules）をCLIでも使用 |
| Aider | `aider` | ターミナルネイティブ。Git自動コミット。複数モデル対応 |

### CLI無料利用の条件まとめ

#### ◎ 無料枠内でCLIが使える
- **Meta Muse**: 週1億トークン枠内で `muse` コマンド使用可。かなり実用的。

#### ○ 無料枠ありでCLIが使える
- **Cursor Hobby**: 無料版で `cursor-agent` CLI使用可。制限ありだが使える。
- **Windsurf Free**: Freeプランで5回/日のpremiumモデル + CLI使用可。
- **Amazon Q Developer**: 月50回のagentic requests無料 + CLI使用可。
- **JetBrains Junie**: 3 AI credits/30日 + Junie Lite無料 + CLI使用可。かなり制限あり。
- **Devin Free**: Light quotaでCLI使用可。SWE-2は期間限定無料。

#### △ APIキー持ち込みでツール無料（OSS）
- **Aider**: ツール$0。DeepSeek API（非常に安価）やOllama（ローカルモデル）で月数百円〜無料運用可。
- **Qwen Code**: ツール$0。Alibaba Cloud or 独自APIキー。
- **DeepSeek Harness**: ツール$0。DeepSeek APIキー or 他社API。

#### ✕ CLIは有料プラン必須
- **Claude Code**: Pro $20/月〜
- **OpenAI Codex**: Plus $20/月〜
- **GitHub Copilot CLI**: Pro $10/月〜
- **Kimi Code**: 無料枠あり（制限あり）

## 総合ランキング・おすすめ

### 無料で使いたい場合の総合ランキング

| 順位 | サービス | 理由 |
|------|----------|------|
| 1 | **DeepSeek** | WebチャットでFrontierモデルが完全無料。調査・分析に最適 |
| 2 | **Meta Muse** | 週1億トークンは個人利用で十分実用的。タスク自動化に強い |
| 3 | **Qwen Studio** | アプリが完全無料。CUAエージェントもOSSで利用可 |
| 4 | **Google Gemini** | 無料版でもDeep Research・画像生成・Liveが使える |
| 5 | **Sakana Chat** | 調査からレポート作成まで一貫して無料で実行可能 |
| 6 | **Amazon Q Developer** | 月50回のエージェントリクエスト無料。AWS連携が強力 |
| 7 | **Bolt.new** | 1M tokens/月の無料枠はアプリビルダーとして実用的 |
| 8 | **Aider** | OSSツール無料 + APIコストが極めて安価。Git連携・複数モデル対応 |

### SKILL.md + CLIを無料で使いたい場合

| 順位 | サービス | 理由 |
|------|----------|------|
| 1 | **Aider + DeepSeek API** | ツール無料 + APIコスト最小。SKILL.md標準対応。Git自動コミット |
| 2 | **Cursor Hobby** | 無料版でCLI + SKILL.md両方利用可。AGENTS.md・CLAUDE.mdも読み込み可 |
| 3 | **Amazon Q Developer Free** | 月50回 + CLI + SKILL.md対応。AWS環境なら最強 |
| 4 | **Meta Muse Free** | 週1億トークンでCLIも無料。SKILL.mdは非標準だがスキル機能あり |
| 5 | **Qwen Code + API** | OSSでSKILL.md標準対応。APIコスト別 |

### SRE・インフラエンジニア向けおすすめ

フリーランスのSRE・インフラエンジニアとして、以下の組み合わせが現実的である：

1. **調査・分析**: DeepSeek（Webチャット完全無料）+ Sakana Chat（レポート作成）
2. **コード生成・レビュー**: Aider + DeepSeek API（コスト最適）または Cursor Hobby（無料枠あり）
3. **AWS連携**: Amazon Q Developer Free（月50回）
4. **タスク自動化**: Meta Muse（週1億トークン）

> **免責事項**: 本資料の料金・機能情報は2026年10月時点のものです。各社のサービス内容は予告なく変更される可能性があります。最新情報は各社の公式サイトでご確認ください。

## まとめ

- 無料でFrontier級モデルを使うなら DeepSeek、個人利用で枠が大きいのは Meta Muse、レポート作成まで無料で完結するのは Sakana Chat。
- SKILL.md と CLI を無料で揃えるなら **Aider + DeepSeek API** か **Cursor Hobby**、AWS 中心の用途なら **Amazon Q Developer Free** が第一候補。
- SRE・インフラ用途は「調査は DeepSeek / Sakana、コードは Aider か Cursor、AWS は Q Developer、自動化は Meta Muse」の組み合わせが現実的。

## 参考情報

### 参照元

| ソース | URL | 内容 |
|--------|-----|------|
| OpenAI Codex Docs | https://developers.openai.com/plugins/build/skills | SKILL.md の配置と仕様 |
| Claude Code Docs | https://code.claude.com/docs/en/skills | SKILL.md の配置と仕様 |
| Cursor Docs（Skills） | https://cursor.com/docs/skills | SKILL.md 対応 |
| Cursor Docs（CLI） | https://cursor.com/docs/cli/using | `cursor-agent` CLI の利用方法 |
| GitHub Copilot Docs | https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills | Copilot CLI のスキル追加 |
| Kimi Code Docs | https://www.kimi.com/code/docs/en/kimi-code-cli/customization/skills.html | Kimi Code のスキル設定 |
| Meta Muse Docs | https://dev.meta.ai/docs/muse-code | Muse Code CLI |
| Amazon Q Developer Pricing | https://aws.amazon.com/q/developer/pricing/ | 料金・無料枠 |
| JetBrains AI Assistant | https://www.jetbrains.com/help/ai-assistant/licensing-and-subscriptions.html | 料金・プラン |
| Devin Pricing | https://devin.ai/pricing | 料金・プラン |
| Replit Pricing | https://replit.com/pricing | 料金・プラン |
| v0 Pricing | https://v0.app/pricing | 料金・プラン |
| Bolt.new Pricing | https://bolt.new/pricing | 料金・プラン |
| Lovable Pricing | https://lovable.dev/pricing | 料金・プラン |
| DeepSeek | https://chat.deepseek.com | Web チャット |
| Qwen | https://chat.qwenlm.ai | Qwen Studio |

### 関連項目

- [[AIエージェントのコンテキスト管理]] - エージェント利用時に効くコンテキスト設計の前提
- [[LLMエコシステムの4層構造]] - モデル・API・ツール・アプリの位置づけ
- [[AIツールチェーン管理]] - 複数ツールを併用する際の管理方法
