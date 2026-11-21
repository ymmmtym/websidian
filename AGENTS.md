# AGENTS.md

Obsidian Vault のノートを Quartz v5 で静的サイト化し、GitHub Pages で公開するリポジトリ。

## 構成の要点

- `quartz/` は上流 [jackyzha0/quartz](https://github.com/jackyzha0/quartz) v5 のコピー。原則として編集しない。サイトのカスタマイズは `quartz.config.yaml`（v5 は TS ではなく **YAML**）で行う。
- `content/` は Obsidian で直接編集する Vault。Git にコミットしたノートが公開される。
- トップページ（`/`）は `plugins/home-page/` のローカルプラグインがビルド時に生成する。`content/index.md` は置かない。
- 下書きは `content/draft/` に置く。`.gitignore` と `quartz.config.yaml` の `ignorePatterns` で除外しており、Git にもサイトにも出ない。
- Obsidian ノート用の OpenCode コマンドは `.opencode/commands/obsidian/`（`chat` / `check` / `publish`）。パスはリポジトリ直下の `content/` を前提にする。
- プラグインは npm パッケージ（`@quartz-community/*`, `@quartz-themes/*`）または `plugins/` 配下のローカルプラグイン（`home-page`）。設定に追加したら `npx quartz plugin install` を実行する。
- タブ UI は採用していない（`@quartz-community/stacked-pages` は `enabled: false`）。以前は上部の横タブバーとして使っていたが、不要になったため無効化した。再有効化する場合は `quartz.config.yaml` の `stacked-pages` を `enabled: true` に戻す（見た目はプラグイン標準の左右の縦タブになる）。
- `public/`（ビルド成果物）と `node_modules/` はコミットしない。

## コマンド

- Obsidian ノート用: `/obsidian/chat`（要約して `content/` に保存）, `/obsidian/check`（読み取り専用の監査。`draft/` も対象）, `/obsidian/publish`（`draft/` → `content/` へ昇格）
- プレビュー: `npx quartz build --serve` → <http://localhost:8080>
- テスト: `npm test`（Quartz 本体のユニットテストのみ。`content/` は対象外）
- 型・整形: `npm run check` / 自動修正は `npm run format`
- PR を出すと `.github/workflows/test.yml` が `npm run check` → `npm test` → `npx quartz build` を実行する。ローカルで確認する場合もこの3つを通す。

## 壊しやすいポイント

- `package.json` の `name` は `@jackyzha0/quartz` のままにする。Quartz はこの名前でバージョンを検出し、プラグインの互換性チェックに使う。変更すると `npm test` とバージョン表示が壊れる。
- `quartz.config.default.yaml` はテストが読み込むため削除しない。
- `npx quartz create` は実行しない。`quartz.config.yaml` と `content/` を初期化してしまう。
- `content/` は `.prettierignore` で除外している。Obsidian 側の整形を正とするので、`npm run format` をかけない。
- 公開をやめるときは `content/` のファイルを削除してコミットする。トップページの一覧はビルド時に自動更新される。
- `content/draft/` を除外する設定は `.gitignore` と `quartz.config.yaml` の `ignorePatterns` の2箇所。片方だけだとローカルビルドか Git のどちらかで漏れる。
- ビルド時の `point to pages that are not on the site` 警告は、未公開ノートへの `[[wikilink]]` によるもの。失敗ではない。
- `quartz.config.yaml` の `configuration.baseUrl` は公開 URL と一致させる（現在 `websidian.yumenomatayume.net`）。カスタムドメインのルート配信なのでパスは含めない。ドメインを変えたら更新する。
- ノートを追加してもトップページのリンク一覧は更新不要（`plugins/home-page/` がビルド時に生成する）。

## デプロイ

- `main` に push すると `.github/workflows/deploy.yml` が GitHub Actions 経由で GitHub Pages にデプロイする。Pages の Source は「GitHub Actions」。
- デプロイは `main` push のみがトリガー。作業ブランチでの確認は `.github/workflows/test.yml`（PR）またはローカルビルドで行う。

## コンテンツ規約

- リポジトリは public 前提。個人が特定できる情報や社外秘の情報を含むノートはコミットしない（下書きは `content/draft/` に置く）。
- ノートは日本語。ファイル名も日本語のままでよい（Quartz の URL では小文字化・URL エンコードされる）。
