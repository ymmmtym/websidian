# AGENTS.md

Obsidian Vault のノートを Quartz v5 で静的サイト化し、GitHub Pages で公開するリポジトリ。

## 構成の要点

- `quartz/` は上流 [jackyzha0/quartz](https://github.com/jackyzha0/quartz) v5 のコピー。原則として編集しない。サイトのカスタマイズは `quartz.config.yaml`（v5 は TS ではなく **YAML**）で行う。
- `content/` は Vault から同期される生成物。**直接編集しない**（例外は `content/index.md`）。次回の同期で上書きされる。
- 公開対象は `vault-publish.txt` に列挙したパスだけ。Vault 全体（`agents/`, `draft/` など）は公開しない。
- プラグインは npm パッケージ（`@quartz-community/*`, `@quartz-themes/*`）。設定に追加したら `npx quartz plugin install` を実行する。
- タブ UI は `@quartz-community/stacked-pages` の有効化で実現している（自前実装しない）。履歴は `sessionStorage` 保存、`mobileBreakpoint`（既定 800px）未満では非表示。
- `public/`（ビルド成果物）と `node_modules/` はコミットしない。

## コマンド

- プレビュー: `npx quartz build --serve` → <http://localhost:8080>
- CI と同じ手順: `npm ci` → `npx quartz plugin install` → `npx quartz build`
- テスト: `npm test`（Quartz 本体のユニットテストのみ。`content/` は対象外）
- 型・整形: `npm run check` / 自動修正は `npm run format`
- ノート同期: `./scripts/sync-from-vault.sh [--dry-run]`
  - Vault の既定パスは `~/Documents/Obsidian Vault`。`OBSIDIAN_VAULT` で上書きする
  - 同期対象は `vault-publish.txt`（Vault からの相対パス）

## 壊しやすいポイント

- `package.json` の `name` は `@jackyzha0/quartz` のままにする。Quartz はこの名前でバージョンを検出し、プラグインの互換性チェックに使う。変更すると `npm test` とバージョン表示が壊れる。
- `quartz.config.default.yaml` はテストが読み込むため削除しない。
- `npx quartz create` は実行しない。`quartz.config.yaml` と `content/` を初期化してしまう。
- `content/` は `.prettierignore` で除外している。Vault 側の整形を正とするので、`npm run format` をかけない。
- `vault-publish.txt` から行を消しても `content/` のファイルは残る。公開をやめるときは `content/` 側も削除し、`content/index.md` の一覧も更新する。
- macOS の `rsync` は openrsync で `--relative` / `/./` が効かない。同期スクリプトがディレクトリとファイルで分岐しているのはそのため。
- ビルド時の `point to pages that are not on the site` 警告は、未公開ノートへの `[[wikilink]]` によるもの。失敗ではない。
- `quartz.config.yaml` の `configuration.baseUrl` は公開 URL と一致させる（既定 `ymmmtym.github.io/websidian`）。リポジトリ名を変えたら更新する。
- ノートを追加したら `content/index.md` のリンク一覧も手動で更新する（自動生成ではない）。

## デプロイ

- `main` に push すると `.github/workflows/deploy.yml` が GitHub Actions 経由で GitHub Pages にデプロイする。Pages の Source は「GitHub Actions」。
- デプロイは `main` push のみがトリガー。作業ブランチでの確認はローカルビルドで行う。

## コンテンツ規約

- リポジトリは public 前提。個人が特定できる情報や社外秘の情報を含むノートは公開しない。
- ノートは日本語。ファイル名も日本語のままでよい（Quartz の URL では小文字化・URL エンコードされる）。
