---
tags:
  - docker
  - infrastructure
  - docker-compose
  - devops
created: 2026-09-26
---
## 概要

`docker compose.yaml` のトップレベルには `services` 以外にもネットワーク・ボリューム・設定データ・機密情報などのリソースを定義できる。本ノートでは各トップレベル要素の詳細と、`configs` / `secrets` をサービスから実際に利用する方法をまとめる。

## Docker Compose のトップレベル要素

`services` を除くトップレベルキーは以下の通り。

| キー | 説明 |
|------|------|
| `services` | サービス定義（**必須**） |
| `networks` | ネットワーク定義（例: `driver: bridge` など） |
| `volumes` | 名前付きボリューム定義（例: `driver: local` など） |
| `configs` | 設定ファイル／データの定義 |
| `secrets` | 機密情報の定義 |
| `name` | プロジェクト名の指定 |
| `version` | **非推奨**（旧フォーマット用、現在は無視される） |

> [!note]
> `deploy` はトップレベルではなく、**`services` 配下のサービス別キー**である（Swarm モード用）。
> トップレベルの `deploy` は Compose では存在しない。

## networks — ネットワーク定義

サービス間の通信を定義する。未指定時は Compose が `default` ネットワークを1つ自動作成する。トップレベルの `networks` で明示的に定義することで複数ネットワークを構成できる。

### 主要な属性

| 属性 | 説明 |
|------|------|
| `driver` | ドライバ指定（`bridge`, `overlay`, `host`, `none` など）。未指定なら platform デフォルト |
| `driver_opts` | ドライバ固有のオプション（key-value） |
| `external` | `true` なら外部管理の既存ネットワークを使用（作成しない、存在しなければエラー）。`name` 以外の属性は指定不可 |
| `name` | ネットワーク実名の指定（プロジェクト名でスコープされない）。`external: true` との併用で既存 NW 参照に利用 |
| `attachable` | `true` なら standalone コンテナも接続可能（主に overlay 用） |
| `ipam` | 独自 IPAM 設定（`subnet`/`ip_range`/`gateway`/`aux_addresses` など） |
| `internal` | `true` なら外部から隔離したネットワークを生成 |
| `enable_ipv4` / `enable_ipv6` | IPv4／IPv6 のアドレス割当ての有効化 |
| `labels` | メタデータ付与（配列 or マップ） |

### 例

```yaml
networks:
  frontend:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.host_binding_ipv4: "127.0.0.1"
  backend:
    external: true
    name: production-backend
```

## volumes — 名前付きボリューム定義

永続データストアを定義する。複数サービスで共有可能。空定義（`volumes: { db-data: }`）ならエンジンのデフォルト設定で作成される。

### 主要な属性

| 属性 | 説明 |
|------|------|
| `driver` | ボリュームドライバ（`local`, `nfs`, クラウドプラグインなど） |
| `driver_opts` | ドライバ固有のオプション。NFS や named bind mount に使用 |
| `external` | `true` なら既存ボリュームを使用（作成しない、なければエラー）。`name` 以外の属性は指定不可 |
| `name` | ボリューム実名の指定（`${VAR}` による環境変数化も可能） |
| `labels` | メタデータ付与（`docker volume inspect` で確認可能） |

### named bind mount の例（ホストパスに固定ボリュームを割り当てる）

```yaml
volumes:
  app-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /srv/app-data
```

## configs — 設定データ定義

イメージの再ビルドなしに設定を注入する仕組み。コンテナ内にファイルとしてマウントされる（Linux では `/config名` に既定マウント、既定権限 0444）。

### ソースの種類

| ソース | 説明 |
|--------|------|
| `file` | 指定ファイルの内容から作成 |
| `content` | インライン文字列から作成（変数補間可）。Compose v2.23.1+ |
| `environment` | ホスト環境変数の値から作成。Compose v2.23.1+ |
| `external` | 既存の config を参照（作成しない）。`name` 以外の属性は指定不可 |

### 定義例

```yaml
configs:
  app_config:
    content: |
      debug=${DEBUG}
      spring.application.name=${COMPOSE_PROJECT_NAME}
  http_config:
    external: true
    name: "${HTTP_CONFIG_KEY}"
```

### サービス側での利用（Short syntax）

名前を指定するだけで `/config名` にマウントされる。

```yaml
services:
  redis:
    image: redis:latest
    configs:
      - my_config            # /my_config にマウント

configs:
  my_config:
    file: ./my_config.txt
```

### サービス側での利用（Long syntax）

マウント先パス・所有者・パーミッションを細かく制御できる。

```yaml
services:
  redis:
    image: redis:latest
    configs:
      - source: my_config
        target: /redis_config   # パス名を変更
        uid: "103"
        gid: "103"
        mode: 0440
configs:
  my_config:
    external: true
```

## secrets — 機密情報定義

configs のうち機密データ（パスワード・証明書など）に特化したもの。コンテナ内にファイルとしてマウントされ、サービス側の `secrets:` で明示的に許可されたサービスだけがアクセスできる。

### ソースの種類

| ソース | 説明 |
|--------|------|
| `file` | 指定ファイルの内容から作成 |
| `environment` | ホスト環境変数の値から作成（`docker stack deploy` では**非対応**） |

### 定義例

```yaml
secrets:
  server-certificate:
    file: ./server.cert
  db-password:
    environment: "DB_PASSWORD"
```

### サービス側での利用

Short syntax では `/run/secrets/<名前>` に読み取り専用でマウントされる。

```yaml
services:
  frontend:
    image: example/webapp
    secrets:
      - server-certificate   # /run/secrets/server-certificate

secrets:
  server-certificate:
    file: ./server.cert
```

Long syntax も `configs` と同様に `target` / `uid` / `gid` / `mode` を指定できる。

```yaml
services:
  frontend:
    image: example/webapp
    secrets:
      - source: server-certificate
        target: server.cert    # /run/secrets/server.cert になる
        uid: "103"
        gid: "103"
        mode: 0o440
```

### アプリ側での読み方

コンテナ内では普通の読み取り専用ファイルとして見えるため、アプリはそのパスを開いて読む。

```bash
cat /my_config                      # configs (short syntax)
cat /run/secrets/db-password        # secrets
```

### 利用の流れ

1. トップレベル `configs` / `secrets` に定義（`file` / `content` / `environment` / `external`）
2. 利用するサービスの `configs:` / `secrets:` に列挙して「許可」
3. コンテナ内の既定マウントパス（`/設定名` `/run/secrets/名前`）をアプリの設定・起動時引数・環境変数で参照

> [!tip] 注意点
> - Docker Compose では、`uid` / `gid` / `mode` は **`environment` ソースの secret でのみ有効**。`file` ソースでは bind-mount が使われるため無視される
> - `environment` ソースの secret は `docker stack deploy`（Swarm）では非対応。逆に `external` ソースは `docker compose up` では使えず、stack deploy 向け

## name / version — プロジェクト設定

- **`name`**: プロジェクト名を固定する。未指定ならディレクトリ名が使われる。`COMPOSE_PROJECT_NAME` として補間でも参照可能。
- **`version`**: 非推奨。現在は informative のみで警告が出るだけ。省略が推奨。

```yaml
name: myapp
services:
  web:
    image: nginx
```

## 参考情報

### 参照元

| ソース | URL | 内容 |
|--------|-----|------|
| Docker Docs: Compose file reference | https://docs.docker.com/reference/compose-file/ | Compose ファイルの仕様全体 |
| Docker Docs: networks | https://docs.docker.com/reference/compose-file/networks/ | トップレベル networks の属性と例 |
| Docker Docs: volumes | https://docs.docker.com/reference/compose-file/volumes/ | トップレベル volumes の属性と例 |
| Docker Docs: configs | https://docs.docker.com/reference/compose-file/configs/ | トップレベル configs の仕様 |
| Docker Docs: secrets | https://docs.docker.com/reference/compose-file/secrets/ | トップレベル secrets の仕様 |
| Compose Specification | https://compose-spec.github.io/compose-spec/ | Compose の公式仕様（実装非依存） |
| Docker Docs: How Compose works | https://docs.docker.com/compose/intro/compose-application-model/ | Compose のアプリケーションモデル概要 |

### 関連項目

- [[Linuxコンテナのnamespaceとcgroups]]
- [[OpenWrt技術ノート]]