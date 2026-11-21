---
tags:
  - supabase
  - postgresql
  - react
  - rls
  - baas
created: 2026-11-21
---
## 概要

Supabase の採用判断から、React + TypeScript + Vite での接続方法、RLS 設計、セルフホスト、内部構造までをまとめます。これまでの議論を、後から読み返せる形で1本にしたものです。

## 目次

1. [Supabase とは何か](#supabase-とは何か)
2. [React + TypeScript + Vite でバックエンドに選ぶべきか](#react--typescript--vite-でバックエンドに選ぶべきか)
3. [静的サイトでも使えるのか](#静的サイトでも使えるのか)
4. [Supabase への接続方法](#supabase-への接続方法)
5. [環境変数とビルドの注意点](#環境変数とビルドの注意点)
6. [RLS（Row Level Security）の設計](#rlsrow-level-securityの設計)
7. [セルフホストする方法](#セルフホストする方法)
8. [代替サービスの比較](#代替サービスの比較)
9. [Terraform によるインフラ管理](#terraform-によるインフラ管理)
10. [内部構造：Supabase の仕組み](#内部構造supabase-の仕組み)
11. [まとめ](#まとめ)
12. [用語集](#用語集)

## Supabase とは何か

**Supabase は「Firebase の代替」として作られた、オープンソースのバックエンド基盤（BaaS）です。** 最大の特徴は、中核が NoSQL ではなく **本物の PostgreSQL** であることです。

### 提供している機能

| 機能 | 内容 |
|---|---|
| **Database** | マネージド PostgreSQL です。Table Editor / SQL Editor が付き、標準 SQL と拡張機能（pgvector など）が使えます。 |
| **Auth** | メール・パスワード、マジックリンク、OTP、OAuth、SSO に対応します。 |
| **Storage** | ファイルを保存します。権限は DB と同じポリシー設計で扱えます。 |
| **Realtime** | WebSocket で変更通知・プレゼンス同期を行います。 |
| **Edge Functions** | Deno 互換の TypeScript 関数を実行します。 |
| **自動生成 API** | テーブル定義から REST / GraphQL API が自動生成されます。 |
| **Row Level Security** | 「ユーザーは自分の行だけ読める」を DB 側で宣言的に書けます。 |

### Firebase との違い

| | Supabase | Firebase |
|---|---|---|
| DB | PostgreSQL（リレーショナル・SQL）です。 | Firestore（NoSQL）です。 |
| 権限 | RLS（SQL ポリシー）を使用します。 | セキュリティルールを使用します。 |
| ベンダーロックイン | 回避しやすいです（セルフホスト可・OSS）。 | 色が濃いです。 |
| 得意分野 | 集計・JOIN・複雑な関係です。 | モバイル中心の疎結合データです。 |

### 料金の目安

| プラン | 料金 | 主な内容 |
|---|---|---|
| **Free** | $0 | プロジェクト2つ、DB 500MB、ファイル 1GB、MAU 5万人、API リクエスト無制限です。**1週間アクセスがないと一時停止**します。 |
| **Pro** | $25/月 | DB 8GB、ストレージ 100GB、MAU 10万人、日次バックアップです。$10 分のコンピュートクレジット込みです（Micro 1台なら実質 $25）。 |
| **Team** | $599/月 | SOC 2 / SSO / SLA など組織向けの内容です。 |

> **注意**：請求は「プラン基本料＋コンピュート＋超過従量」なので、$25 は「下限」と考えておくのが安全です。

## React + TypeScript + Vite でバックエンドに選ぶべきか

### Supabase を選ぶ最大のメリット

1. **型定義の自動生成**
   - `supabase gen types typescript` で、DB スキーマから TypeScript の `Database` 型を一発出力できます。
   - テーブル名・カラム名・戻り値・フィルタ条件すべてに補完と型チェックが効くため、開発体験が圧倒的に高いです。

2. **ローカルとクラウドの挙動が一致する**
   - Docker のローカル環境で検証したマイグレーションがそのまま本番へ移行できます。

3. **API サーバーを書かなくて良い**
   - 認証・データ永続化・ファイルアップロードを React から直接叩けます（RLS でアクセス制御します）。

### 他の構成を検討すべきケース

| やりたいこと・制約 | Supabase 単体の課題 | 代替案 |
|---|---|---|
| 独自の外部 API 連携・決済（Stripe など） | シークレットキーをフロントに置けません。 | **Supabase + Edge Functions** |
| 高度なビジネスロジック・バッチ処理 | ロジックが DB 関数に寄って保守が難しくなります。 | **Node / Hono / Go の API** + RDB |
| 完全無料・スリープなしでの個人運用 | 無料枠は1週間非アクティブで停止します。 | **Cloudflare D1 + Hono** |
| 静的ホスティング + 最小限の軽量 DB | Postgres のリッチな機能が不要です。 | **Firebase**、**Cloudflare D1 / Turso** |

### 他の主要な選択肢

- **Cloudflare Workers + Hono + D1（SQLite）** — コスト最小・スリープなしです。認証と Storage は自前で組み合わせる必要があります。
- **自前の Node.js / Hono サーバー + Neon / Supabase（DB のみ）** — ビジネスロジックをサーバー側で綺麗に制御したい場合です。CRUD と認証の実装工数が純増します。
- **Firebase（Auth + Firestore）** — ドキュメント指向・JOIN 不要なら最速です。複雑なクエリで破綻しやすいです。

## 静的サイトでも使えるのか

**使えます。というより「静的サイト + Supabase」が最も標準的な使い方です。**

ここで言う「静的」は**フロントエンドの配信方法**の話であり、アプリの動作が静的になるわけではありません。ユーザー登録もデータ追加も、ちゃんとサーバーと通信しています。ただしそのサーバーが「あなたのサーバー」ではなく「Supabase のサーバー」なだけです。

```
[ブラウザ]  ──HTTPS──▶  [Supabase のサーバー群]
  React                     Auth（登録・ログイン）
  （静的ファイル）           PostgREST（データ読み書き）
                            Storage（ファイル）
  ← Cloudflare Pages 等が配信        ↑ ここが動的処理を担当
```

正確には**「サーバーレス SPA」**と呼ぶほうがしっくりきます。

### ブラウザから直接叩く先

| やりたいこと | 叩く先 |
|---|---|
| データ取得・更新 | PostgREST（自動生成された REST API）です。 |
| ログイン・セッション | GoTrue（Auth API）です。 |
| ファイル取得・保存 | Storage API です。 |
| リアルタイム購読 | Realtime（WebSocket）です。 |

`vite build` が出す静的ファイルを Cloudflare Pages / Netlify / Vercel / S3+CloudFront に置けば、**サーバーは1台も要りません**。

### 静的サイトでよく詰まるポイント

1. **SPA のフォールバック設定**
   - `/posts/123` を直接開いて 404 にならないよう、リライト設定が必要です。
   - Cloudflare Pages なら `_redirects` に `/* /index.html 200` を設定します。

2. **Auth のリダイレクト URL 許可リスト**
   - メール確認やマジックリンクの戻り先を、ダッシュボードの Site URL と Redirect URLs に設定します。`emailRedirectTo` を指定しない `signUp` では確認後に Site URL へ戻るため、Site URL をアプリの URL に設定してください。
   - ローカルでは Vite アプリの URL（例: `http://localhost:5173/`）を Redirect URLs に登録します。`localhost:54321` は Supabase API のポートなので、アプリの URL ではありません。ローカルで確認フローを試す場合は、下の `signUp` の例のように `emailRedirectTo` にこのローカル URL を指定します。

3. **秘密鍵が必要な処理は置けない**
   - Stripe の webhook 検証、外部 API キー利用、メール送信などはブラウザに置けません。ここだけ **Edge Functions** に逃がします。

4. **動的データの SEO**
   - 純 SPA だとクローラには空の HTML が見えます。SEO が要件ならプリレンダーや Astro への移行を検討します。

5. **無料枠の一時停止**
   - 1週間アクセスがないとプロジェクトが止まります。

## Supabase への接続方法

### インストール

```bash
npm install @supabase/supabase-js
```

### 接続情報を環境変数に設定

Docker のローカル環境なら、`supabase status` で API URL とキーを確認できます。

```env
# .env.local
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=ローカル環境の公開用キー
```

> 新しいキー名では「publishable key」と表示されることもあります。どちらもブラウザに渡す公開用のキーです。

### クライアントを作る

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types' // supabase gen types typescript

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

### 呼び出し例

```ts
// ユーザー登録（メール確認が有効な場合、session は null になります）
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    // 許可リストに登録したローカルのアプリ URL を指定します（末尾の / も一致させます）
    emailRedirectTo: 'http://localhost:5173/',
  },
})
if (error) throw error

if (data.session) {
  // データ追加（user_id は DB 側で自動セット）
  const { data: post, error: insertError } = await supabase
    .from('posts')
    .insert({ title: 'はじめての投稿' })
    .select()
    .single()
  if (insertError) {
    // RLS や制約で拒否された場合は保存されません
    alert(`投稿を保存できませんでした: ${insertError.message}`)
  }
} else {
  // メール確認待ちです。確認後にサインインしてから投稿を追加します。
}

// セッション管理（localStorage に保存され、自動でトークン更新される）
supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null)
})
```

API エンドポイントの設計も、CORS 設定も、認証ミドルウェアも不要です。メール確認が有効な場合は、確認が完了するまで認証済みとして投稿を追加できません。`emailRedirectTo` にローカル URL を指定すれば、Site URL が本番でも確認後にローカルへ戻れます（指定する URL は Redirect URLs に登録しておきます）。

## 環境変数とビルドの注意点

### `VITE_` が付いた変数は公開される

**`VITE_` が付いた環境変数は、ビルド時にフロントエンドの JavaScript に埋め込まれます。** 公開後はブラウザーの開発者ツールや配信ファイルから確認できます。難読化・圧縮しても秘密にはなりません。

```env
# 公開される（ブラウザに渡す前提）
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

`anon` キーや `publishable key` は**公開されてもよいキー**です。データへのアクセス可否は **RLS ポリシー**で制御します。

### 絶対に置いてはいけないもの

```env
# 危険：RLS を迂回できる鍵
SUPABASE_SERVICE_ROLE_KEY=...
```

`service_role` キーや `secret key` は RLS を迂回できるため、漏れると全データに触られます。必要な場合は Edge Function など、サーバー側だけで使います。

> **原則：「フロントで使う値は見られる」と考えるのが安全です。**

## RLS（Row Level Security）の設計

API が誰でも叩ける以上、**RLS がアプリの認可そのもの**になります。

### テーブル定義とポリシー

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  title text not null check (char_length(title) between 1 and 100),
  body text,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

-- 読み取り：本人の投稿のみ
create policy "自分の投稿を参照" on public.posts
  for select using (auth.uid() = user_id);

-- 追加：本人としてのみ、かつ user_id を偽装できない
create policy "自分の投稿を追加" on public.posts
  for insert with check (auth.uid() = user_id);

-- 更新・削除：本人のみ
create policy "自分の投稿を更新" on public.posts
  for update using (auth.uid() = user_id);
create policy "自分の投稿を削除" on public.posts
  for delete using (auth.uid() = user_id);
```

`user_id` の `default auth.uid()` がポイントです。フロントが `user_id` を送る必要がなく、送っても `with check` で偽装を弾けます。

### ユーザー登録で先に知っておくべき落とし穴

**① プロフィールテーブルの自動作成**

`auth.users` は Supabase の管理領域なので直接触れません。登録時に `profiles` 行を作るにはトリガーを使います。

```sql
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**② メール送信の制限**

無料枠のデフォルト SMTP は送信数が厳しく制限され、実質本番運用には耐えません。本番では Resend などのカスタム SMTP がほぼ必須です。Docker のローカル環境では Mailpit に溜まるので気づきにくいところです。

**③ スパム登録**

公開 API なので bot が登録しに来ます。Supabase Auth の設定で **CAPTCHA（Cloudflare Turnstile / hCaptcha）** を有効化しておくと楽です。

**④ メール確認のリダイレクト先**

本番ドメインを Redirect URLs に登録し忘れると、確認リンクが機能しません。

### サーバーが必要になる境界線

| 要件 | 判断 |
|---|---|
| 単一テーブルへの追加・更新 | **静的なままで OK** です。 |
| 複数テーブルにまたがる整合性が必要 | トランザクション用に **RPC（Postgres 関数）** を1本作ります。それでも静的なままです。 |
| 集計・権限判定が複雑 | RLS で書ける範囲なら OK です。無理なら RPC にします。 |
| 決済・外部 API キー・メール送信 | **Edge Functions 必須** です（秘密鍵をブラウザに置けません）。 |
| 重い画像処理・長時間バッチ | 別途ワーカー or 外部サービスにします。 |

## セルフホストする方法

**公式に手順と Docker Compose 構成が用意されています。**

### 大まかな手順

1. **公式リポジトリの docker 設定を取得します**

   ```bash
   git clone --depth 1 https://github.com/supabase/supabase
   cd supabase/docker
   cp .env.example .env
   ```

2. **秘密情報の初期設定を行います（必須）**

   `.env` 内のデフォルト値は公開されている危険な値なので、すべてランダムな文字列に書き換えます。
   - `POSTGRES_PASSWORD`（DB パスワード）
   - `JWT_SECRET`（トークン署名用の鍵）
   - `ANON_KEY` / `SERVICE_ROLE_KEY`（`JWT_SECRET` を元に生成する JWT）
   - ダッシュボード（Studio）のログインパスワード

3. **公開 URL を `.env` に設定します（起動前に行います）**

   ```env
   # API_EXTERNAL_URL には /auth/v1 を含めます（OAuth コールバックは /auth/v1/callback になります）
   API_EXTERNAL_URL=https://api.example.com/auth/v1
   SITE_URL=https://app.example.com
   SUPABASE_PUBLIC_URL=https://api.example.com
   ```

   メール確認や OAuth の戻り先は localhost のままだと機能しません。Auth は起動時にこれらの値を読み込むため、起動後に変更した場合は `docker compose up -d` を再実行してください（必要なら `sh run.sh recreate auth`）。

4. **ゲートウェイのホストポートを絞ります**

   現在の Compose の既定ゲートウェイは `api-gw`（Envoy）です。プロキシを同じ Docker ネットワークで動かす場合は `docker-compose.yml` の `api-gw` の `ports` をコメントアウトします。ホスト上の Nginx などから接続する場合は、削除せず `127.0.0.1:8000:8000` のようにループバックへバインドします（Kong オーバーライドを使う場合も `kong` が対象です）。Studio（3000）はホストポートを公開しません。

5. **コンテナを起動します**

   ```bash
   docker compose up -d
   ```

6. **リバースプロキシで HTTPS 化します**

   Nginx、Caddy、Cloudflare Tunnel などを前面に置き、**API ゲートウェイ（既定は `api-gw`: 8000）だけへ**ルーティングします。Studio（3000）へ直接転送しないでください（ダッシュボードの Basic 認証や `/api/mcp` の拒否はゲートウェイで適用されます）。WebSocket の Upgrade ヘッダーと `X-Forwarded-*` ヘッダーも設定します。本番では公開するのはプロキシのポート（80/443）のみとし、ファイアウォールでそれ以外の受信ポートを遮断します。

### メリット

- **無料枠の一時停止がない**です（サーバーが動いている限り常時稼働します）。
- **コストがサーバー代だけ**です（月額 1,000円前後の VPS でも動きます）。
- **データ管理の自由度が高い**です（独自バックアップ、VPC 内接続など）。

### デメリット

- **メモリを消費します** — 10個前後のコンテナが同時に動くため、**最低 2GB、できれば 4GB 以上**の RAM が推奨です。512MB〜1GB では OOM で落ちやすいです。
- **保守運用の責任がすべて自分**です — OS / Docker / PostgreSQL のパッチ適用、日次バックアップとリストア検証、各コンポーネントのバージョンアップを行います。
- **一部クラウド専用機能はありません** — DB ブランチングなどです。

### どちらを選ぶか

- **開発〜初期リリース**：クラウドの無料プランで始めます。「インフラ保守に時間を取られないこと」が最大の価値です。
- **データ量が増えた / $25 を節約したい / スリープを防ぎたい**：そのタイミングで VPS + Docker Compose へ移行します。中身は同じ PostgreSQL なので `pg_dump` / `pg_restore` で移行は容易です。ただし、これでは Storage のメタデータのみが移り、ファイル本体は移りません。Storage オブジェクトは別途コピーし、移行先でアクセスできることを確認してからプロジェクトを切り替えます。

## 代替サービスの比較

世の中のリストは**「同じ土俵の比較」になっていない**ことが多いので、カテゴリを分けて理解するのが重要です。

| カテゴリ | 該当サービス | Supabase の代替になるか |
|---|---|---|
| フルスタック BaaS（DB＋認証＋Storage） | Appwrite、Nhost、Firebase | **なる**（同カテゴリ）です。 |
| DB のみ | Neon | **ならない**（認証・Storage は自前）です。 |
| 単一バイナリで完結 | PocketBase | なる（ただし規模の上限が違う）です。 |
| 独自モデルのバックエンド | Convex | なるが、設計思想ごと乗り換えることになります。 |

### 各サービスの実像

**Appwrite**
以前は MariaDB ベースのドキュメント指向でしたが、**Appwrite 2.0 で PostgreSQL がデフォルト**になりました（MariaDB・MongoDB も選択可）。ただし API の形は依然ドキュメント指向で、**PostgreSQL の RLS ではなく Appwrite 独自の権限モデル**を使います。SQL の JOIN・集計・制約を活かしたいなら Supabase が素直です。セルフホストのコンテナ数は Supabase 以上です。

**Firebase**
Firestore は NoSQL のため、**リレーションを持つデータには噛み合いません**。プッシュ通知やモバイル中心なら最強ですが、Web のデータ管理アプリでは後からクエリで苦しむ典型パターンです。

**PocketBase**
**単一の Go バイナリに SQLite・認証・Storage・リアルタイムが全部入り**です。VPS に置いて `./pocketbase serve` で終わりという手軽さは唯一無二です。ただし SQLite は**単一ライターかつ水平スケール不可**、そして実質**ほぼ1人でメンテナンスされている**プロジェクトでバス係数が低いです。個人開発〜数千ユーザー規模なら十分実用的です。

**Neon**
**使っていないとき 0 にスケールするサーバーレス PostgreSQL**です。2025年5月に **Databricks が約10億ドルで買収**しました（サービスは継続）。ブランチ機能が強力で、DB だけ欲しいなら非常に良い選択です。ただし**認証と Storage は自分で組む**必要があり、Supabase の「書かなくていい」利点は失われます。

**Convex**
**クエリを TypeScript の関数として書き、データ変更で自動再描画**という設計は、React との相性では Supabase より上です。セルフホストも可能で、ライセンスは FSL（2年後に Apache 2.0 へ自動移行）です。ただし**データモデルが独自（SQL ではない）**で、RLS のような宣言的権限もなく、**移行コストはこの中で最大**です。新規プロジェクトなら魅力的ですが、既存の Supabase 前提の設計からは見送りが妥当です。

**Nhost**
**PostgreSQL + Hasura（GraphQL）**です。Hasura 互換の独自 GraphQL エンジン **Constellation** を Go で開発中です。GraphQL を主軸にしたいなら有力ですが、**REST 前提の Supabase クライアントコードは全書き換え**になります。

### 見落としやすい罠

1. **移行しても「スリープ問題」は解決しないことが多い**
   - Nhost の無料枠も1週間で一時停止します。Neon は設計上スケールトゥゼロなので、むしろコールドスタートが発生します。
   - **スリープを確実に避けたいなら、選択肢は実質2つ**です：PocketBase（自サーバーで常時稼働）か、Cloudflare Workers + D1（無料枠が広くスリープなし）です。

2. **リストに抜けている最有力候補**
   - **Cloudflare Workers + Hono + D1** が本来もっとも自然な比較対象です。常時稼働・低コスト・TypeScript 完結です。ただし CPU 時間 10ms 制限に注意してください。

3. **型生成の落差**
   - `supabase gen types typescript` に相当する体験は他ではほぼ得られません。Drizzle ORM が近いですが、**スキーマからクライアントまで一気通貫で型付く**点では Supabase が頭一つ抜けています。

### 優先順位の結論

| 順位 | 選択肢 | 条件 |
|---|---|---|
| 1 | **Supabase 継続** | 検証資産がそのまま活きる。停止が気になるなら Pro か VPS セルフホスト。 |
| 2 | **Cloudflare Workers + Hono + D1** | 「無料で常時稼働」を最優先。認証と Storage の自作工数が発生。 |
| 3 | **PocketBase** | 1台の VPS で完結、規模が小さいと割り切れるなら最軽量。 |
| 4 | **Neon + Better Auth** | DB だけマネージドで借りたい場合。 |
| 5 | Appwrite / Nhost / Convex / Firebase | 明確な理由がある場合のみ。 |

## Terraform によるインフラ管理

**公式の Terraform Provider（`supabase/supabase`）が提供されています。** これは他の BaaS と比べても大きな強みです。

### 役割の切り分け

Supabase の IaC は **「プラットフォーム設定」と「データベーススキーマ」で役割を分ける**のが標準的なベストプラクティスです。

| 対象 | 管理ツール | 具体例 |
|---|---|---|
| **インフラ・プロジェクト設定** | **Terraform** | プロジェクト作成、リージョン、コンピュートサイズ、カスタムドメイン、OAuth プロバイダ、SMTP 設定、IP 制限、Secrets です。 |
| **データベース・中身** | **Supabase CLI / マイグレーション** | テーブル定義、RLS ポリシー、関数、トリガー、インデックス、Storage バケットです。 |

> テーブルや RLS を Terraform で書くのはアンチパターンです。`supabase migration`（SQL ファイル）で Git 管理するのが基本です。

### コード例

```hcl
terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

provider "supabase" {
  access_token = var.supabase_access_token # Personal Access Token
}

# プロジェクトの作成
resource "supabase_project" "production" {
  organization_id   = var.supabase_org_id
  name              = "my-react-app-prod"
  database_password = var.db_password
  region            = "ap-northeast-1" # 東京リージョン
  instance_size     = "micro"
}

# 認証設定（Site URL・リダイレクト URL など）
resource "supabase_settings" "production" {
  project_ref = supabase_project.production.id

  auth = jsonencode({
    site_url       = "https://my-app.pages.dev"
    uri_allow_list = "https://my-app.pages.dev/**,http://localhost:5173/**"
  })
}
```

`supabase_settings` の `auth` は API 形式の JSON 文字列です。`uri_allow_list` は Management API の仕様上 **カンマ区切りの文字列**で渡します（配列ではありません）。SMTP 設定もこの JSON に API 形式で含めます（詳細は [Settings リソースのドキュメント](https://registry.terraform.io/providers/supabase/supabase/1.5.1/docs/resources/settings)）。`~> 1.0` の制約では `supabase_auth_config` は使用できません。

### 既存プロジェクトを Terraform 管理下に置く

```hcl
import {
  to = supabase_project.production
  id = "your-project-ref"
}
```

`terraform import supabase_project.production <project_ref>` でも取り込めます。

### メリット

1. **環境の複製が一瞬でできます** — Staging / Production を変数違いで `terraform apply` するだけです。
2. **GUI ポチポチ作業を撲滅し、差分レビューができます** — OAuth の設定漏れのような事故を PR レビューで防げます。
3. **他サービスとの一元管理ができます** — Supabase で作った URL とキーを Cloudflare Pages の環境変数に流し込む、といったパイプラインが組めます。

> 「ローカルの Docker（CLI）でスキーマを検証し、本番のインフラ構成は Terraform で再現性を担保する」という運用が綺麗にハマります。

## 内部構造：Supabase の仕組み

### 核心：Supabase というソフトウェアは存在しない

Supabase が配っているのは、実体としては **`docker-compose.yml` と設定値の束**です。中で動いているのは、それぞれ別の人が作った独立したサーバー群（GoTrue、PostgREST、Storage API など）です。

そして、それら**全部が1つの PostgreSQL を指している**。これが全体を貫く設計です。

> 例えるなら、Supabase は「シェアハウスの運営」です。住人（Auth、Storage、Realtime）はそれぞれ別の会社から来た他人ですが、全員が同じ建物の同じ台所（PostgreSQL）を使い、玄関（API ゲートウェイ）はひとつです。Supabase は「住人を集めて配線を繋いだ大家」であって、住人本身ではありません。

### 3層構造

```
[ブラウザ]  React + supabase-js
    │  https://xxx.supabase.co/rest/v1/...     ← 入口は1つだけ
    ▼
┌─────────────────────────────────────────┐
│ ① 玄関：API ゲートウェイ（Kong / api-gw） │
│    パスで振り分けるだけ。認証はしない      │
│    /auth/v1     → GoTrue                 │
│    /rest/v1     → PostgREST              │
│    /storage/v1  → Storage                │
│    /realtime/v1 → Realtime               │
│    /functions/v1 → Edge Runtime          │
└─────────────────────────────────────────┘
    ▼
┌─────────────────────────────────────────┐
│ ② 住人：各サービス（すべて独立したOSS）    │
│    GoTrue         = 認証。JWT を発行する   │
│    PostgREST      = テーブルを REST API に │
│    Storage        = ファイル保存          │
│    Realtime       = DB変更をWebSocket配信  │
│    Edge Functions = Deno の関数           │
└─────────────────────────────────────────┘
    ▼
┌─────────────────────────────────────────┐
│ ③ 土台：PostgreSQL（1台だけ）             │
│    public.*        ← あなたのテーブル      │
│    auth.users      ← GoTrue のユーザー表   │
│    storage.objects ← ファイルのメタ情報    │
│    ★ RLS ポリシーもここに住んでいる        │
└─────────────────────────────────────────┘
```

**重要な点**：`auth.users` も `storage.objects` も、あなたの `posts` テーブルと**同じ PostgreSQL の中**にあります。別サービスだから別DB、ではありません。だから「投稿したユーザーの名前を JOIN で取る」が普通にできるわけです。

### リクエストの流れを1本追う

**① ログイン**

```ts
await supabase.auth.signUp({ email, password })
```

1. ブラウザ → API ゲートウェイ（`/auth/v1/signup`）→ GoTrue です。
2. GoTrue が `auth.users` にパスワードのハッシュを保存します。
3. GoTrue が **JWT に署名して返します**（中身は `{"sub": "ユーザーID", "role": "authenticated"}`）。
4. `supabase-js` がそれを localStorage に保存し、以降のリクエストに自動で付けます。

この時点で、ブラウザは「私はこのユーザーです」という**署名付きの身分証**を持ちました。

**② 投稿を追加**（ここが一番理解しにくく、一番重要な部分）

```ts
await supabase.from('posts').insert({ title: 'はじめて' })
```

1. ブラウザ → API ゲートウェイ（`/rest/v1/posts`）→ PostgREST です。
2. PostgREST は SQL を組み立て、Postgres に接続します。このとき**セッション変数に JWT を埋め込みます**：

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"ユーザーID","role":"authenticated"}';
insert into posts (title) values ('はじめて');
```

3. Postgres は行を挿入しようとする前に、**自分で RLS ポリシーを評価します**。
4. ポリシー内の `auth.uid()` は、実は「`request.jwt.claims` を読むだけの SQL 関数」です。

```sql
-- auth.uid() の中身はほぼこれ
select coalesce(
  nullif(current_setting('request.jwt.claims', true), '')::json->>'sub',
  null
)::uuid
```

5. `with check (auth.uid() = user_id)` が真なら挿入成功、偽なら**Postgres が拒否**します。

つまり、**認可しているのは PostgREST でもゲートウェイでもなく、PostgreSQL 自身**です。Supabase は「JWT を Postgres まで届ける配管」を用意しただけで、判断は DB に任せている。これが「API サーバーを書かなくていい」の正体です。

### 混同しやすい4点

| よくある誤解 | 実際 |
|---|---|
| anon key = 認証 | anon key は**身分証のない入場券**です。誰でも持てます。「未ログイン客」を表すだけです。守っているのは RLS です。 |
| Auth は別のデータベース | 同じ PostgreSQL の `auth` スキーマです。JOIN できます。 |
| RLS は Supabase の独自機能 | **PostgreSQL 標準の機能**です。Supabase が有効化しているだけです。 |
| PostgREST が権限チェックしている | 何もチェックしません。SQL を組み立てて流すだけです。判断は Postgres です。 |

**anon key が漏れても大丈夫な理由**は「鍵が安全だから」ではなく「RLS さえ正しければ、その鍵でできることは未ログイン客に許したことだけだから」です。逆に言えば、**RLS を有効化し忘れたテーブルは、anon key を持つ全員に丸裸**になります。

### セルフホストが重い理由

`supabase start` で立ち上がるコンテナ群：

| コンテナ | 役割 |
|---|---|
| `kong` | 玄関です（ローカルでは `:54321`）。 |
| `postgres` / `postgres-meta` | 本体と、Studio 用のスキーマ読み取りです。 |
| `auth`（GoTrue） | 認証です。 |
| `rest`（PostgREST） | REST API 生成です。 |
| `storage` / `imgproxy` | ファイル保存と画像変換です。 |
| `realtime` | WAL を読んで変更を配信します。 |
| `studio` | 管理画面です（`:54323`）。 |
| `edge-runtime` | 関数です。 |
| `supavisor` | コネクションプーラです。 |
| `mailpit` | ローカル用のメール受信箱です（`:54324`）。 |

これを1台の VPS で動かすとメモリを食う、というのがセルフホストの注意点でした。**クラウド版とセルフホストで中身は同じで、違うのは運営者だけ**です。

### 責任分担のまとめ

| 役割 | 担当 |
|---|---|
| 誰なのかを確認する | **GoTrue**（JWT を発行します） |
| 何をしてよいかを決める | **PostgreSQL の RLS** |

たとえるなら、**GoTrue は身分証を発行する窓口、RLS は入場ゲート**です。

## まとめ

### Supabase で十分なケース

- [x] ユーザー登録・ログインがある
- [x] テーブル間のリレーション（外部キー）を扱う
- [x] 決済・外部 API キー・メール送信を**使わない**（または Edge Functions で対応可）
- [x] フロントは静的配信（Cloudflare Pages など）でよい
- [x] 無料枠の一時停止が許容できる、または Pro / セルフホストで解決する

→ **迷わず Supabase のまま行くのがベスト。** すでに Docker で動かせているアドバンテージは非常に大きいです。

### 見直しが必要なケース

- [ ] 1週間の非アクティブ停止が絶対に許容できない → Cloudflare D1 / PocketBase
- [ ] 月額 $25 を払えない → VPS セルフホスト / Cloudflare D1
- [ ] 秘密鍵を使う処理が中心 → Edge Functions 必須（それでも Supabase で可）
- [ ] GraphQL を主軸にしたい → Nhost
- [ ] TypeScript で完結するリアクティブ設計に魅力 → Convex（新規なら）
- [ ] NoSQL でよい → Firebase

### 導入時に必ずやること

1. **全テーブルで RLS を有効化**し、デフォルト拒否から始めます。
2. **`service_role` キーをフロントに置きません**。
3. **カスタム SMTP を設定**します（本番では必須）。
4. **CAPTCHA を有効化**します（スパム登録対策）。
5. **Redirect URLs に本番ドメインを登録**します。
6. **`supabase gen types typescript` を CI に組み込みます**。
7. **マイグレーションを Git 管理**し、インフラは Terraform で再現可能にします。

## 用語集

| 用語 | 説明 |
|---|---|
| **BaaS** | Backend as a Service です。バックエンド機能をマネージドで提供するサービスです。 |
| **PostgREST** | PostgreSQL のテーブルを自動で REST API に変換するサーバーです。 |
| **GoTrue** | Supabase が使う認証サーバーです。JWT を発行します。 |
| **Kong / api-gw** | API ゲートウェイです。パスを見て各サービスへ振り分けます。CLI や従来構成では Kong、現在のセルフホスト Compose の既定は `api-gw`（Envoy）です。 |
| **RLS** | Row Level Security です。行単位のアクセス制御で、PostgreSQL 標準機能です。 |
| **JWT** | JSON Web Token です。署名付きの身分証です。 |
| **anon key** | 未ログイン客を表す公開鍵です。誰でも持てます。 |
| **service_role key** | RLS を迂回できる秘密鍵です。**絶対にフロントに置かない**でください。 |
| **RPC** | Remote Procedure Call です。Supabase では Postgres 関数を呼ぶ仕組みです。 |
| **Edge Functions** | Supabase のサーバーレス関数です（Deno 互換）。 |
| **Mailpit** | ローカル開発用のメール受信箱です。 |
| **Supavisor** | コネクションプーラです。 |
| **IaC** | Infrastructure as Code です。インフラをコードで管理する手法です。 |

## 参考情報

### 参照元

| ソース | URL | 内容 |
|--------|-----|------|
| Supabase 公式ドキュメント | https://supabase.com/docs | 製品機能と設定の公式資料 |
| Supabase CLI（ローカル開発） | https://supabase.com/docs/guides/local-development | ローカル環境と型生成の手順 |
| Supabase セルフホスト | https://supabase.com/docs/guides/self-hosting/docker | Docker Compose によるセルフホスト |
| Terraform Provider: supabase/supabase | https://registry.terraform.io/providers/supabase/supabase/latest/docs | プロジェクト設定の IaC |
| Cloudflare D1 | https://developers.cloudflare.com/d1/ | 代替候補のドキュメント |

### 関連項目

- [[ベンダーロックフリーなFaaS]] - サーバーレス構成の選択肢
- [[Docker Composeのトップレベル要素とconfigs・secretsの利用]] - セルフホスト時の Compose 設定
- [[Linuxコンテナのnamespaceとcgroups]] - コンテナのリソース制限の基礎
