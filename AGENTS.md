# AGENTS.md

Obsidian Vault のノートを Quartz v5 で静的サイト化し、GitHub Pages で公開するリポジトリ。

## 構成の要点

- `quartz/` は上流 [jackyzha0/quartz](https://github.com/jackyzha0/quartz) v5 のコピー。原則として編集しない。サイトのカスタマイズは `quartz.config.yaml`（v5 は TS ではなく **YAML**）で行う。
- `content/` は Obsidian で直接編集する Vault。Git にコミットしたノートが公開される。
- トップページ（`/`）は `plugins/home-page/` のローカルプラグインがビルド時に生成する。`content/index.md` は置かない。
- 下書きは `content/draft/` に置く。`.gitignore` と `quartz.config.yaml` の `ignorePatterns` で除外しており、Git にもサイトにも出ない。
- Obsidian ノート用の OpenCode コマンドは `.opencode/commands/obsidian/`（`chat` / `check` / `publish`）。パスはリポジトリ直下の `content/` を前提にする。
- プラグインは npm パッケージ（`@quartz-community/*`, `@quartz-themes/*`）または `plugins/` 配下のローカルプラグイン（`home-page`, `pwa`）。設定に追加したら `npx quartz plugin install` を実行する。
- PWA 対応は `plugins/pwa/` のローカルプラグイン。`manifest.webmanifest`、アイコン一式、Service Worker をビルド時に出力する。サイトのコードには手を入れず、`externalResources` で `<head>` のタグと登録スクリプトだけを足す。
  - ローカルプラグインは `dist/index.js` と `dist/index.d.ts` の両方が要る。`index.d.ts` が無いと `quartz plugin install` が「no dist/index.d.ts found」でスキップし、`externalResources` が呼ばれずタグが出ない。
  - Service Worker は同一オリジンの GET だけを扱い、ページは network-first、それ以外は stale-while-revalidate。キャッシュ名は `ctx.buildId` を含むのでデプロイのたびに入れ替わる。
  - `--serve`（開発サーバー）では Service Worker を登録しない。WebSocket によるリロードと競合するため。
  - アイコンは `quartz/static/icon.png` から `sharp` で生成する。白抜きロゴなので、地色は `backgroundColor` ではなく `themeColor` を使う（白地に白で消えるため）。
- タブ UI は採用していない（`@quartz-community/stacked-pages` は `enabled: false`）。以前は上部の横タブバーとして使っていたが、不要になったため無効化した。再有効化する場合は `quartz.config.yaml` の `stacked-pages` を `enabled: true` に戻す（見た目はプラグイン標準の左右の縦タブになる）。
- `public/`（ビルド成果物）と `node_modules/` はコミットしない。

## コマンド

- Obsidian ノート用: `/obsidian/chat`（要約して `content/` に保存）, `/obsidian/check`（読み取り専用の監査。`draft/` も対象）, `/obsidian/publish`（`draft/` → `content/` へ昇格）
- プレビュー: `npx quartz build --serve` → <http://localhost:8080>
- テスト: `npm test`（Quartz 本体と `plugins/*/*.test.ts`。`content/` は対象外）
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
- Mermaid は `diagramRenderer: pele` を使う（既定の `mermaid` は不可）。mermaid.js 版は描画前に `innerText` を `innerHTML` へ書き戻すため、図の中の `<token>` のような山カッコが HTML タグとして解釈され、`Syntax error in text` になる。`pele` はこの往復をせず `<br/>` も改行として描画する。プラグイン側でも mermaid.js は非推奨。
- `quartz.config.yaml` の `configuration.baseUrl` は公開 URL と一致させる（現在 `websidian.yumenomatayume.net`）。カスタムドメインのルート配信なのでパスは含めない。ドメインを変えたら更新する。
- ノートを追加してもトップページのリンク一覧は更新不要（`plugins/home-page/` がビルド時に生成する）。

## デプロイ

- `main` に push すると `.github/workflows/deploy.yml` が GitHub Actions 経由で GitHub Pages にデプロイする。Pages の Source は「GitHub Actions」。
- デプロイは `main` push のみがトリガー。作業ブランチでの確認は `.github/workflows/test.yml`（PR）またはローカルビルドで行う。

## コンテンツ規約

- リポジトリは public 前提。個人が特定できる情報や社外秘の情報を含むノートはコミットしない（下書きは `content/draft/` に置く）。
- ノートは日本語。ファイル名も日本語のままでよい（Quartz の URL では小文字化・URL エンコードされる）。

## コンテンツ監査で合意した方針（2026-11-24）

`content/` 全体（26ノート）を読み取り専用で監査した結果。今後の `/obsidian/check` 等でも、以下は「対応不要」として扱い、修正を提案しない。

### 未解決 Wiki リンクは意図的に残す

以下の11件は未解決だが、クリック時に 404 になっても許容する。将来ノートを分割・実装するときの手がかりとして `[[...]]` を残しておく方針。

- `content/AIエージェントのコンテキスト管理.md:11,220-223`（8件）: `コンテキスト`, `コーディングエージェント`, `チャットエージェント`, `コンテキストエンジニアリング`（11行目と223行目の2回）, `コンテキストウィンドウ`, `プロンプトエンジニアリング`, `エージェント設計`
- `content/Bitwarden SSH Agent と SSH の動作メカニズム.md:172-174`（3件）: `SSH Config ベストプラクティス`, `Bitwarden セキュリティ設定`, `WezTerm SSH 接続設定`

- 無視リストに登録する場合は、重複を除いた10文字列を使う（上記の `コンテキストエンジニアリング` は1つにまとめる）。一覧は `.opencode/commands/obsidian/check.md` の「2-8. 既知の無視対象」にも記載する。
- スタブ記事は作らない。グラフプラグインを改造して幽霊ノードを出すこともしない。リンクの削除・プレーンテキスト化もしない。
- 将来これらと完全同一のファイル名でノートを公開したときは、無視リストから外す。
- Quartz のグラフは `contentIndex.json` に載っている実在ページとタグしかノードにしない。未解決リンクは辺ごと消え、Obsidian の幽霊ノードとは挙動が異なる。
- frontmatter の `tags` と本文の `[[...]]` は別仕組み。タグは `tags/<tag>` ノードになり、`[[...]]` は既存ページへの辺になるだけ。同名でも自動的にはつながらない。このリポジトリでは graph の `showTags` が既定で有効なので、共通タグを持つノートはグラフ上で関連して見える。

### 低優先として許容する項目

- `content/自宅LAN HTTPS証明書配布手順.md:265,297` の `mkcert` 例は TEST-NET-1 の `192.0.2.50` に変更済み。文書用アドレスなので個人情報ではない。
- `content/draft/jev-summary.md` には `tags` / `created` を設定済み。下書きのまま Git 管理外・ビルド除外。
- 公開ノートは **ですます調を原則とする**（外部公開サイトのため）。現状は常体が20件、ですます調が3件（`Google Antigravity学習ノート.md`, `Linuxシステム監視コマンドガイド.md`, `アプリケーション開発テンプレート仕様.md`）、混在が1件（`Supabase完全ガイド.md`）残っているが、今は既知の負債として許容する。修正は個別指示があったときに行う。`content/draft/` は対象外。

### 監査で検出なしだった項目

個人情報、秘密情報、環境識別子との一致、frontmatter の閉じ忘れ・YAML エラー・タグ型/形式不良・タグ表記揺れ、完全重複・本文重複・同名ファイル・近重複ノート、添付リンク切れ（`.md` 以外のファイルなし）、Markdown の相対リンク切れ、Wiki リンクの「曖昧」「見出しなし」。

監査は `content/` の読み取りのみで、外部 URL へのアクセス、`npm run check` / `npm test` / `npx quartz build` は未実施。新しい未解決リンクが増えた場合は、この方針をそのまま広げず、個別に判断する。
