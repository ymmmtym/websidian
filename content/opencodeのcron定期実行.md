---
tags:
  - opencode
  - cron
  - scheduling
  - automation
created: 2026-09-05
---
## 概要

opencode に cron（定期実行）機能があるかを調査し、組み込み機能がないことを確認した上で、プラグイン・GitHub Actions・OS cron を組み合わせた4つの代替手段を整理した記録。

## opencode 本体の cron 機能

opencode の CLI には**組み込みの cron 機能は存在しない**。提供されているコマンドは `run` / `serve` / `session` / `stats` などで、スケジューリング機能は含まれていない。

非対話モードの `opencode run` は外部のスケジューラから呼び出す前提で設計されており、定期実行はプラグインや OS の仕組みを組み合わせて実現する。

> [!tip] 非対話モード
> `opencode run "プロンプト"` は自動化・スクリプティング用途に最適。`--auto` フラグで権限を自動承認できるため、無人実行に使える。

## 代替手段 1: opencode-scheduler プラグイン

OS のネイティブスケジューラ（macOS: launchd / Linux: systemd / Windows: schtasks）を利用して `opencode run` を定期実行するプラグイン。OS の cron フォールバックも持つ。

### インストール

```bash
opencode plugin opencode-scheduler
```

### プラットフォーム別バックエンド

| プラットフォーム | スケジューラ | 備考 |
|------------------|--------------|------|
| macOS | `launchd` | 完全対応（監視付き実行） |
| Linux (systemd) | `systemd --user` | 完全対応（監視付き実行） |
| Linux / POSIX | `cron` (`crontab`) | フォールバック（機会損失の補完なし） |
| Windows | `schtasks` | cron サブセットで対応 |

### 主なツール

| ツール | 説明 |
|--------|------|
| `schedule_job` | cron 式でジョブ作成 |
| `list_jobs` | ジョブ一覧表示 |
| `update_job` | ジョブ更新 |
| `delete_job` | ジョブ削除 |
| `run_job` | 即時実行 |
| `job_logs` | 実行ログ表示 |

### cron 構文

標準の5フィールド cron 式を使用する。

```
┌───────────── 分 (0-59)
│ ┌───────────── 時 (0-23)
│ │ ┌───────────── 日 (1-31)
│ │ │ ┌───────────── 月 (1-12)
│ │ │ │ ┌───────────── 曜日 (0-6, 日曜=0)
│ │ │ │ │
* * * * *
```

| 式 | 意味 |
|-----|------|
| `0 9 * * *` | 毎日 9:00 |
| `0 */6 * * *` | 6時間ごと |
| `30 8 * * 1` | 毎週月曜 8:30 |
| `0 9,17 * * *` | 毎日 9時と17時 |

### 動作の仕組み

1. 自然言語でジョブを記述
2. プラグインが workdir 単位でジョブファイルを書き、OS スケジューラにタイマー登録
3. 指定時刻に OS スケジューラが監視スクリプトを呼び出し
4. ジョブを実行し、ログ・メタデータを更新

> [!note] 監視機能
> ジョブは workdir 単位でスコープされ、前回実行が未完了なら次の実行をスキップする（重複防止）。`timeoutSeconds` で強制タイムアウトも設定可能。

## 代替手段 2: opencode-cron プラグイン

セッション内で cron ジョブを管理する軽量プラグイン。ジョブは SQLite（`~/.config/opencode/cron.db`）に保存され、実行履歴も記録される。

```bash
opencode plugin opencode-cron
```

| ツール | 説明 |
|--------|------|
| `create_cron_job` | cron 式でジョブ作成 |
| `list_cron_jobs` | ジョブ一覧（状態・次回実行時刻） |
| `delete_cron_job` | ジョブ削除 |
| `enable_cron_job` | ジョブ有効化 |
| `disable_cron_job` | ジョブ無効化 |
| `watch_cron_jobs` | スケジューラ起動（自動トリガー） |
| `stop_watching_cron` | スケジューラ停止 |
| `get_cron_history` | 実行履歴表示 |

> [!warning] 制約
> セッション内で動作する設計のため、`watch_cron_jobs` はセッション中のみ機能する。セッション終了時には自動停止する。

## 代替手段 3: GitHub Actions

`opencode github install` で GitHub 連携をセットアップし、`schedule` イベントの cron ワークフローで定期実行する。CI 基盤に乗るため、マシンが起動していなくても動作する。

`.github/workflows/opencode-scheduled.yml`:

```yaml
name: Scheduled OpenCode Task
on:
  schedule:
    - cron: "0 9 * * 1" # 毎週月曜 9時 UTC

jobs:
  opencode:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
      pull-requests: write
      issues: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          persist-credentials: false
      - name: Run OpenCode
        uses: anomalyco/opencode/github@latest
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        with:
          model: anthropic/claude-sonnet-4-20250514
          prompt: |
            Review the codebase for any TODO comments and create a summary.
            If you find issues worth addressing, open an issue to track them.
```

> [!note] schedule イベントの注意
> スケジュール実行には `prompt` 必須。ユーザーコンテキストがないため、PR 作成等には `contents: write` と `pull-requests: write` の権限付与が必要。出力はログと PR に反映される（コメント先のissueがないため）。

## 代替手段 4: OS cron + opencode run

シンプルな方法。OS の cron（または launchd）から `opencode run` を直接呼び出す。

```bash
# crontab の例: 毎日 9:00 に実行
0 9 * * * cd /path/to/project && opencode run --auto "TODOコメントを集計してサマリを作成"
```

- 最小構成で動作する
- ログ管理・実行制御は自分で実装する必要がある
- MCP 設定（`opencode.json`）を拾うため workdir から実行するのが重要

## 方法の比較

| 方法 | バックエンド | 永続性 | セッション依存 | マシン稼働必須 | 重複防止 |
|------|--------------|--------|----------------|----------------|----------|
| opencode-scheduler | launchd/systemd | ○ | なし | ○ | ○ |
| opencode-cron | セッション内 (SQLite) | 要 watch | ○ | ○ | - |
| GitHub Actions | GitHub 側 | ○ | なし | 不要 | ○ |
| OS cron + run | cron | ○ | なし | ○ | 手動 |

> [!tip] 推奨
> ローカルでの定期実行なら **opencode-scheduler**、GitHub と連携した自動化なら **GitHub Actions** が最も実用的。

## 結論

opencode 自体に組み込みの cron 機能はないが、**opencode-scheduler プラグイン**（ローカル・OSネイティブ）と **GitHub Actions の schedule イベント**（クラウド・CI）の2つが主要な実現手段。用途に応じて使い分けるのがよい。

## 参考情報

### 参照元

| ソース | URL | 内容 |
|--------|-----|------|
| opencode CLI ドキュメント | https://opencode.ai/docs/cli/ | `run` コマンド等の非対話実行 |
| opencode GitHub ドキュメント | https://opencode.ai/docs/github/ | schedule イベントのワークフロー例 |
| different-ai/opencode-scheduler | https://github.com/different-ai/opencode-scheduler | launchd/systemd 使ったプラグイン |
| kziemski/opencode-scheduler | https://github.com/kziemski/opencode-scheduler | 同系統の別実装 |
| opencode-cron (npm) | https://www.npmjs.com/package/opencode-cron | セッション内 cron プラグイン |
| opencode-scheduler (npm) | https://www.npmjs.com/package/opencode-scheduler | スケジューラプラグイン |

### 関連項目

- [[AIツールチェーン管理]]
- [[AIエージェントのコンテキスト管理]]
