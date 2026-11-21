# websidian

このリポジトリの `content/` を Obsidian の Vault として開き、[Quartz v5](https://quartz.jzhao.xyz/) で静的サイト化して GitHub Pages で公開します。

公開 URL: <https://websidian.yumenomatayume.net/>

## 構成

```
content/               Obsidian の Vault（ここを直接編集する）
  draft/               下書き（Git・サイトともに除外、Obsidian からは見える）
.opencode/commands/obsidian/  Obsidian ノート用の OpenCode コマンド
quartz/                Quartz 本体（アップストリーム由来）
plugins/home-page/     トップページをビルド時に生成するローカルプラグイン
quartz.config.yaml     サイト設定（タイトル・baseUrl・テーマ・プラグイン）
.github/workflows/deploy.yml  GitHub Pages へのデプロイ
```

`content/` を Obsidian で開いてノートを直接編集します。Git にコミットした `.md` がサイトに公開されます。トップページは `plugins/home-page/` がビルド時に生成するので、`content/index.md` は置きません。

## 前提

- Node.js 22 以上 / npm 10.9.2 以上
- Obsidian でこのリポジトリの `content/` を Vault として開く

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

1. Obsidian で `content/` を開き、ノートを作成・編集する
2. ローカルで確認する

   ```bash
   npx quartz build --serve
   ```

   <http://localhost:8080> でプレビューできます。

3. 変更をコミットして push すると、GitHub Actions がビルドして GitHub Pages にデプロイします。

## トップページ

トップページ（`/`）は `plugins/home-page/` のローカルプラグインがビルド時に生成します。`content/` のノートから一覧を作るので、記事を追加しても手動でリンクを更新する必要はありません。

プラグインの設定を変更したら `npx quartz plugin install` を実行してください。

## Obsidian コマンド

このリポジトリを OpenCode で開くと、以下のスラッシュコマンドが使えます（`.opencode/commands/obsidian/` で管理）。

| コマンド            | 内容                                                            |
| ------------------- | --------------------------------------------------------------- |
| `/obsidian/chat`    | チャットのやり取りを `content/` のノートにまとめる              |
| `/obsidian/check`   | `content/` を読み取り専用で監査する（個人情報・リンク切れなど） |
| `/obsidian/publish` | `content/draft/` の下書きを `content/` のノートへ昇格させる     |

`/obsidian/check` は下書き（`content/draft/`）も監査対象に含みます。公開前に個人情報や秘密情報が混入していないか確認してください。

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

タブ UI は使用していません（`@quartz-community/stacked-pages` を `enabled: false` にしています）。

以前は画面上部に横一列のタブバーを表示していましたが、不要になったため無効化しました。再有効化する場合は `quartz.config.yaml` の `stacked-pages` を `enabled: true` にしてください。見た目はプラグイン標準の左右の縦タブ（バインダー風）になります。

## GitHub Pages の有効化

1. GitHub のリポジトリで **Settings → Pages** を開く
2. **Source** で **GitHub Actions** を選択
3. `main` ブランチに push（または Actions から `Deploy Quartz site to GitHub Pages` を手動実行）

## 公開範囲について

このリポジトリは public を想定しています。`content/` のうち Git にコミットしたノートだけが公開されます。下書きは `content/draft/` に置いてください。このディレクトリは `.gitignore` と Quartz の `ignorePatterns` の両方で除外しているので、Obsidian からは見えますが Git にもサイトにも出ません。個人情報や社外秘の情報を含むノートをコミットしないよう注意してください。

## Quartz の更新

```bash
git remote add upstream https://github.com/jackyzha0/quartz.git  # 初回のみ
git fetch upstream
git merge upstream/v5
```

詳細は Quartz の [アップグレードガイド](https://quartz.jzhao.xyz/getting-started/upgrading) を参照してください。
