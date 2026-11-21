# AGENTS.md

Obsidian Vault のノートを Quartz v5 で静的サイト化し、GitHub Pages で公開するリポジトリ。

## 構成の要点

- `quartz/` は上流 [jackyzha0/quartz](https://github.com/jackyzha0/quartz) v5 のコピー。原則として編集しない。サイトのカスタマイズは `quartz.config.yaml`（v5 は TS ではなく **YAML**）で行う。
- `content/` は Vault から同期される生成物。**直接編集しない**。次回の同期で上書きされる。
- トップページ（`/`）は `plugins/home-page/` のローカルプラグインがビルド時に生成する。`content/index.md` は置かない。
- 公開ルートは Vault 内の `knowledge/`。公開対象はその中の `vault-publish.txt` に列挙したパスだけ。`agents/`, `draft/` などは公開しない。
- プラグインは npm パッケージ（`@quartz-community/*`, `@quartz-themes/*`）または `plugins/` 配下のローカルプラグイン（`home-page`）。設定に追加したら `npx quartz plugin install` を実行する。
- タブ UI は採用していない（`@quartz-community/stacked-pages` は `enabled: false`）。以前は上部の横タブバーとして使っていたが、不要になったため無効化した。再有効化する場合は `quartz.config.yaml` の `stacked-pages` を `enabled: true` に戻す（見た目はプラグイン標準の左右の縦タブになる）。
- `public/`（ビルド成果物）と `node_modules/` はコミットしない。

## コマンド

- プレビュー: `npx quartz build --serve` → <http://localhost:8080>
- テスト: `npm test`（Quartz 本体のユニットテストのみ。`content/` は対象外）
- 型・整形: `npm run check` / 自動修正は `npm run format`
- PR を出すと `.github/workflows/test.yml` が `npm run check` → `npm test` → `npx quartz build` を実行する。ローカルで確認する場合もこの3つを通す。
- ノート同期: `./scripts/sync-from-vault.sh [--dry-run]`
  - Vault の既定パスは `~/Documents/Obsidian Vault`。`OBSIDIAN_VAULT` で上書きする
  - 公開ルートの既定は Vault 内の `knowledge/`。`VAULT_ROOT` で上書きする
  - 同期対象は `vault-publish.txt`（公開ルートからの相対パス）、同期先は `content/` 直下

## 壊しやすいポイント

- `package.json` の `name` は `@jackyzha0/quartz` のままにする。Quartz はこの名前でバージョンを検出し、プラグインの互換性チェックに使う。変更すると `npm test` とバージョン表示が壊れる。
- `quartz.config.default.yaml` はテストが読み込むため削除しない。
- `npx quartz create` は実行しない。`quartz.config.yaml` と `content/` を初期化してしまう。
- `content/` は `.prettierignore` で除外している。Vault 側の整形を正とするので、`npm run format` をかけない。
- `vault-publish.txt` から行を消しても `content/` のファイルは残る。公開をやめるときは `content/` 側も削除する。トップページの一覧はビルド時に自動更新される。
- macOS の `rsync` は openrsync で `--relative` / `/./` が効かない。同期スクリプトがディレクトリとファイルで分岐しているのはそのため。
- ビルド時の `point to pages that are not on the site` 警告は、未公開ノートへの `[[wikilink]]` によるもの。失敗ではない。
- `quartz.config.yaml` の `configuration.baseUrl` は公開 URL と一致させる（現在 `websidian.yumenomatayume.net`）。カスタムドメインのルート配信なのでパスは含めない。ドメインを変えたら更新する。
- ノートを追加してもトップページのリンク一覧は更新不要（`plugins/home-page/` がビルド時に生成する）。

## デプロイ

- `main` に push すると `.github/workflows/deploy.yml` が GitHub Actions 経由で GitHub Pages にデプロイする。Pages の Source は「GitHub Actions」。
- デプロイは `main` push のみがトリガー。作業ブランチでの確認は `.github/workflows/test.yml`（PR）またはローカルビルドで行う。

## コンテンツ規約

- リポジトリは public 前提。個人が特定できる情報や社外秘の情報を含むノートは公開しない。
- ノートは日本語。ファイル名も日本語のままでよい（Quartz の URL では小文字化・URL エンコードされる）。
