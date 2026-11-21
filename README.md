# websidian

Obsidian Vault のノートを [Quartz v5](https://quartz.jzhao.xyz/) で静的サイト化し、GitHub Pages で公開するためのリポジトリです。

公開 URL: <https://websidian.yumenomatayume.net/>

## 構成

```
content/               公開するノート（Vault の knowledge/ がこの直下に対応）
quartz/                Quartz 本体（アップストリーム由来）
quartz.config.yaml     サイト設定（タイトル・baseUrl・テーマ・プラグイン）
vault-publish.txt      公開対象のノート一覧（公開ルートからの相対パス）
scripts/sync-from-vault.sh  Vault → content/ の同期スクリプト
.github/workflows/deploy.yml  GitHub Pages へのデプロイ
```

`content/` の中身は Vault から生成される想定です。直接編集せず、Vault 側を編集して同期してください。

## 前提

- Node.js 22 以上 / npm 10.9.2 以上
- Vault の場所: `~/Documents/Obsidian Vault`（`OBSIDIAN_VAULT` 環境変数で変更可）
- 公開ルート: Vault 内の `knowledge/`（`VAULT_ROOT` 環境変数で変更可）

## セットアップ

```bash
npm ci
```

開発用コマンド:

| コマンド                   | 内容                                          |
| -------------------------- | --------------------------------------------- |
| `npx quartz build`         | 本番ビルド（`public/` に出力）                |
| `npx quartz build --serve` | プレビューサーバー（<http://localhost:8080>） |
| `npm test`                 | Quartz 本体のユニットテスト                   |
| `npm run check`            | 型チェック（tsc）と整形チェック（prettier）   |
| `npm run format`           | prettier で自動整形                           |

## ノートを公開する

1. `vault-publish.txt` に公開したいノート（またはディレクトリ）を公開ルート（`knowledge/`）からの相対パスで追記する

   ```
   some-note.md
   another-directory/
   ```

2. 同期する

   ```bash
   ./scripts/sync-from-vault.sh --dry-run   # 確認
   ./scripts/sync-from-vault.sh             # 実行
   ```

3. ローカルで確認する

   ```bash
   npx quartz build --serve
   ```

   <http://localhost:8080> でプレビューできます。

4. 変更をコミットして push すると、GitHub Actions がビルドして GitHub Pages にデプロイします。

## サイト設定

`quartz.config.yaml` を編集します。主な項目:

| 項目                      | 説明                                                        |
| ------------------------- | ----------------------------------------------------------- |
| `configuration.pageTitle` | サイトタイトル                                              |
| `configuration.baseUrl`   | 公開先のホスト + パス（例: `websidian.yumenomatayume.net`） |
| `configuration.locale`    | UI の言語（`ja-JP`）                                        |
| `plugins`                 | 有効にするプラグイン（検索・グラフ・バックリンクなど）      |

> [!note]
> 公開先のドメインやパスを変えた場合は `configuration.baseUrl` も合わせて変更してください。カスタムドメインのルートで配信する場合はパスを含めません。

## タブ表示

ノートを移動すると、画面上部に横一列のタブが追加されます（`@quartz-community/stacked-pages`）。

- タブをクリックするとそのページに戻る
- `×` で閉じる（現在のタブを閉じると隣のタブへ移動）
- 最大 8 タブ（`quartz.config.yaml` の `stacked-pages` の `maxTabs` で変更）
- 履歴はブラウザの `sessionStorage` に保存され、リロードしても残る（ブラウザのタブを閉じると消える）
- 幅 800px 未満では非表示（`mobileBreakpoint`）

プラグイン標準の見た目は左右の縦タブ（バインダー風）です。`quartz/styles/custom.scss` で上部タブバーに上書きしているので、プラグインを外す場合はこの CSS も削除してください。

## GitHub Pages の有効化

1. GitHub のリポジトリで **Settings → Pages** を開く
2. **Source** で **GitHub Actions** を選択
3. `main` ブランチに push（または Actions から `Deploy Quartz site to GitHub Pages` を手動実行）

## 公開範囲について

このリポジトリは public を想定しています。Vault の `knowledge/` のうち `vault-publish.txt` に載せたノートだけが `content/` に入るので、`agents/` や `draft/` などは公開されません。個人情報や社外秘の情報を含むノートを追加しないよう注意してください。

## Quartz の更新

```bash
git remote add upstream https://github.com/jackyzha0/quartz.git  # 初回のみ
git fetch upstream
git merge upstream/v5
```

詳細は Quartz の [アップグレードガイド](https://quartz.jzhao.xyz/getting-started/upgrading) を参照してください。
