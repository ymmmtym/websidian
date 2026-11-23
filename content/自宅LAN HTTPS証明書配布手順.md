---
tags:
  - certificate
  - https
  - mkcert
  - network
  - security
created: 2026-10-22
---
## 概要

自宅LAN内のDNSサーバーで名前解決しているサービスに、mkcert で発行したルートCAを各端末へ配布し、ブラウザの「保護されていない通信」の警告を出さずにアクセスできるようにする手順をまとめる。各OS（macOS / Windows / iOS / iPadOS / Android / Firefox）の信頼ストアへの登録方法、登録前に配布した証明書が本物かを照合する手順、困ったときの確認ポイントを扱う。

## 全体像

```
[Mac]  mkcert -CAROOT
  │
  ├── rootCA.pem を rootCA.crt にリネームしてコピー ──▶ [NAS 共有フォルダ]
  │                                                        │
  │                                                        ├──▶ Windows
  │                                                        ├──▶ iOS / iPadOS
  │                                                        ├──▶ Android
  │                                                        └──▶ Firefox / Node.js / Java
  │
  └── SHA-256 指紋を控える ──▶ [パスワード管理 / 紙メモ]
                                     │
                                     └── 各端末でインストール前に照合 ◀──┘
```

**重要原則**

| ファイル | 役割 | 扱い |
|---|---|---|
| `rootCA.pem` | ルートCAの**公開証明書** | 配布してよい（この手順で配るもの） |
| `rootCA-key.pem` | ルートCAの**秘密鍵** | **絶対に配布・共有・バックアップ同期しない** |
| `*.pem` / `*-key.pem` | 各サービス用のリーフ証明書と鍵 | サーバー側のみ。クライアントには配らない |

- `rootCA-key.pem` が漏れると、そのCAを信頼している全端末に対して**任意のサイトの証明書を作れてしまう**（＝通信の傍受が可能）状態になる。
- NAS・Git・iCloud / Dropbox などの同期フォルダ・チャットに置かないこと。漏えいした可能性がある場合は、CAごと作り直し（全端末へ旧ルートCAの削除＋新ルートCAの再配布）が必要である。

## Mac 側の準備

### ルートCAの保管場所を確認

```bash
mkcert -CAROOT
# 例: /Users/you/Library/Application Support/mkcert
```

このフォルダー内の `rootCA.pem` が配布対象である。

### 指紋（SHA-256）を控える

各端末で信頼ストアへ登録する前に本物かどうかを確認するために、**必ず事前に控えておく**。

```bash
openssl x509 -in "$(mkcert -CAROOT)/rootCA.pem" -noout -fingerprint -sha256
# 例: sha256 Fingerprint=3A:1B:...:9F
```

控えた指紋は、NASとは別の場所（パスワード管理アプリ、紙のメモなど）に保管すること。

### 配布用ファイルを作る（拡張子を `.crt` に）

`.pem` のままだと Windows / iOS / Android でテキストファイル扱いになり、インストーラーが起動しないことがある。**中身はそのままで、拡張子だけ `.crt` に変えたコピー**を用意する。

```bash
mkdir -p ~/Desktop/ca-dist
cp "$(mkcert -CAROOT)/rootCA.pem" ~/Desktop/ca-dist/rootCA.crt
```

指紋は、配布物とは**別の経路**で保管・確認する。配布用フォルダーや NAS に置くと、証明書と指紋をまとめて差し替えられ、照合が意味を失うためである。

```bash
# 表示だけ行い、配布用フォルダーにはファイルを置かない
openssl x509 -in "$(mkcert -CAROOT)/rootCA.pem" -noout -fingerprint -sha256
```

控えた値は、パスワード管理アプリや紙のメモなど、NAS とは別の場所に保管すること。

> ⚠️ `rootCA-key.pem` はこのフォルダーにコピーしないこと。

## NAS への配置

1. NASの共有フォルダー（例：`\\NAS\public\certs\`、`/volume1/public/certs/`）を作成する。
2. `rootCA.crt` をアップロードする（指紋は NAS に置かない）。
3. **権限は読み取り専用**にしておくと安全である（誤って差し替えられる事故を防げる）。

```
NAS/
└── public/
    └── certs/
        └── rootCA.crt          ← これだけ配布（指紋は置かない）
```

### （任意）NASのWebサーバー機能でURL配布する場合

Synology の Web Station、QNAP の Web サーバー、ASUSTOR などがWebサーバー機能を持つ場合、`http://nas.home.arpa/certs/rootCA.crt` のようなURLで配れるため、スマホが一番楽になる。

- **LAN内限定**にすること（ルーターのポート開放や外部公開はしない）。
- 配布ページは HTTPS を基本とする。HTTP で配る場合は、**ダウンロードしたファイルの指紋を、事前に控えた値と必ず照合**すること。同じページや同じ NAS に指紋を置くと差し替えに気づけないため、指紋は必ず別経路で確認する。

## 端末ごとのインストール手順

> [!warning] 信頼ストアへ登録する前に必ず照合する
> どの端末でも、NAS などからコピーした `rootCA.pem` / `rootCA.crt` の SHA-256 指紋を、事前に控えた値と照合してから登録する。不一致なら登録を中止し、配布元と転送経路を確認する。macOS / Windows は下記の各手順で端末上でも照合できる。iOS / iPadOS / Android は端末の標準機能で証明書の SHA-256 指紋を表示する手順を確認できなかったため、**Mac または Windows で照合済みのファイルだけを端末へ転送する**。NAS から端末へ直接取得したファイルをそのまま信頼せず、照合済みのコピーを直接転送する。照合方法は後述の「信頼ストアへ登録する前の照合」を参照。

### macOS（Mac 本体）

通常は `mkcert -install` 実行済みのため作業不要である。別のMacで信頼させたい場合は、`rootCA.pem` を置いたフォルダーを `CAROOT` に指定して実行する。CAROOT を指定しないと、既存の CA がない環境では新しい CA と秘密鍵が作成されてしまう。信頼ストアへの登録前に、コピーしたファイルの指紋を事前に控えた値と照合し、不一致なら以降のコマンドを実行しない。

```bash
mkdir -p ~/ca-root
cp /Volumes/public/certs/rootCA.crt ~/ca-root/rootCA.pem
openssl x509 -in ~/ca-root/rootCA.pem -noout -fingerprint -sha256
# 表示された値が事前に控えた値と一致することを確認してから実行する
CAROOT=~/ca-root mkcert -install
```

またはキーチェーンに直接登録（上の照合が済んでいること）：

```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain ~/ca-root/rootCA.pem
```

確認：

```bash
security find-certificate -a -c "mkcert" -Z /Library/Keychains/System.keychain
```

### Windows

信頼ストアへ登録する前に、コピーした `rootCA.crt` の証明書指紋（SHA-256）を確認する。`certutil` は Windows に標準搭載されている。

```cmd
certutil -dump C:\Temp\rootCA.crt
```

出力の `Cert Hash(sha256)` が、事前に控えた値と16進数として一致することを確認する。OpenSSL は `:区切り` で表示し、`certutil` は区切りや大文字小文字が異なることがあるため、比較前に区切り（`:` と空白）を除き、大文字小文字をそろえる。**`Get-FileHash` や `certutil -hashfile` が出すのは PEM ファイル全体のハッシュで、証明書の指紋とは別物**。その値で照合しない。

1. NASの `rootCA.crt` を `C:\Temp\rootCA.crt` にコピーし、上のコマンドで指紋を照合する。
2. 照合済みの `C:\Temp\rootCA.crt` をダブルクリック →「証明書のインストール」。照合後に NAS 上のファイルが差し替えられても、このコピーを使う限り影響しない。
3. 保存場所で **「ローカルコンピューター」** を選択（要管理者権限。自分のユーザーのみなら「現在のユーザー」でも可）。
4. **「証明書をすべて次のストアに配置する」** を選び、参照から **「信頼されたルート証明機関」** を選択。
5. 完了 → ブラウザを再起動。

PowerShell（管理者）でまとめて入れる場合（上の照合が済んだ `C:\Temp\rootCA.crt` に対して実行する）：

```powershell
Import-Certificate -FilePath "C:\Temp\rootCA.crt" `
  -CertStoreLocation Cert:\LocalMachine\Root
```

確認：

```powershell
Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*mkcert*" }
```

### iOS / iPadOS

1. Mac または Windows で指紋を照合済みの `rootCA.crt` を、**そのコピーのまま**端末へ直接転送する。Mac なら AirDrop または USB ケーブル、Windows なら USB ケーブルで端末の「ファイル」アプリへ保存する。NAS を経由して再取得しない。端末上で照合できないため、未照合のファイルをそのままインストールしない。
2. 「プロファイルがダウンロードされました」と表示されたら、**設定 → 一般 → VPNとデバイス管理** でプロファイルを選び「インストール」。
3. **設定 → 一般 → 情報 → 証明書信頼設定** を開き、該当のCAのスイッチを **オン**（完全な信頼）。
4. Safari を再起動して確認。

> 2 だけでは不十分で、**3 の「完全な信頼」を有効化しないと警告は消えません**。ここが一番の落とし穴です。

### Android

1. Mac または Windows で指紋を照合済みの `rootCA.crt` を、**そのコピーのまま**USB ケーブル（Android File Transfer など）で端末の「ダウンロード」フォルダーへ直接コピー（`.crt` のままでOK）。NAS を経由して再取得しない。端末上で照合できないため、未照合のファイルをそのままインストールしない。
2. **設定 → セキュリティ → 暗号化と認証情報 → インストール → CA証明書** を選択。
    *（メーカーにより「設定 → セキュリティ → その他のセキュリティ設定 → 証明書のインストール」など）*
3. 「このままインストールしますか？」の警告を確認して続行。
4. 端末のロック解除（PIN / パターン）を求められるので入力。

> ⚠️ Android では **ユーザーが追加したCAをアプリが信頼しない** のが既定です（ブラウザは概ね信頼します）。アプリから接続する場合は、アプリ側で Network Security Config に `debug-overrides` / カスタムトラストアンカーを設定する必要があります。

### Firefox（macOS / Windows）

Firefox は独自の証明書ストア（NSS）を持つため、OSに登録しただけでは信頼されないことがある。

**方法A：OSの証明書ストアを使わせる（おすすめ）**

1. `about:config` を開く（警告を承認）。
2. `security.enterprise_roots.enabled` を検索し、**true** に変更。
3. Firefox を再起動。

**方法B：mkcert に NSS へ入れさせる（Mac / Linux）**

```bash
brew install nss        # 未導入なら
CAROOT=~/ca-root mkcert -install
```

**方法C：手動インポート**

設定 → プライバシーとセキュリティ → 証明書 → 証明書を表示 → 「認証局証明書」タブ → インポート → `rootCA.crt` を選択し、「この認証局によるウェブサイトの識別を信頼する」にチェック。

### Node.js（CLIツール・ビルド環境）

Node はOSの証明書ストアを使わない。環境変数で明示する。

```bash
export NODE_EXTRA_CA_CERTS="$HOME/ca-root/rootCA.pem"
```

`~/.zshrc` などに書いておくと永続化できる。

### Java（該当する場合）

```bash
keytool -importcert -noprompt -trustcacerts \
  -alias mkcert-home \
  -file ~/ca-root/rootCA.pem \
  -cacerts
```

## 動作確認

### ブラウザ

`https://<自宅ドメイン>/` を開き、鍵アイコン（保護された通信）になっていることを確認する。詳細を開いて発行者が自分のCA（`mkcert ...`）であることも確認すること。

### コマンドライン

```bash
# サーバーが返している証明書のチェーンと有効期限を確認
openssl s_client -connect myserver.home.arpa:443 -servername myserver.home.arpa </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName

# CAを明示して検証（警告なく通ればOK）
curl -v --cacert ~/ca-root/rootCA.pem https://myserver.home.arpa/
```

### 信頼ストアへ登録する前の照合

```bash
# 端末側で、ダウンロードしたファイルの指紋を表示（登録前に実行）
openssl x509 -in rootCA.crt -noout -fingerprint -sha256
```

表示された値を、**事前に控えた値**（NAS とは別の場所に保管したもの）と比較してから、信頼ストアへ登録する。表示形式が異なるため、区切り（`:` と空白）を除き、大文字小文字をそろえてから比較する。不一致なら登録せず、配布元と転送経路を確認する。証明書を信頼した後に気づいても、攻撃者の CA が既に信頼された状態になる。

OS ごとの確認手段は次のとおり。

| OS | 指紋の確認手段 |
|---|---|
| macOS / Linux | 上の `openssl x509 -noout -fingerprint -sha256` |
| Windows | `certutil -dump <ファイル>` の `Cert Hash(sha256)` |
| iOS / iPadOS / Android | 端末の標準機能で確認する手順は未確認。PC で照合済みのファイルを転送する |

`Get-FileHash` や `certutil -hashfile` はファイル全体のハッシュを計算するため、証明書の指紋とは値が一致しない。照合には証明書を解析した値を使う。

## 運用メモ

- **リーフ証明書の有効期限**：mkcert の既定では約2年3か月。期限切れ前に再発行し、サーバーに配置し直す（クライアント側の作業は不要）。
- **ルートCAの有効期限**：約10年。ただし乗り換え時は全端末に入れ直しが必要なので、余裕を持って計画する。
- **サーバー証明書のSAN**：名前解決に使うFQDNと、IPアドレス直接アクセス用のIPの両方を入れておくと再発行の手間が減る。

  ```bash
  mkcert myserver.home.arpa "*.myserver.home.arpa" 192.0.2.50
  ```

- **リバースプロキシでの一括終端**：Nginx / Caddy / Traefik の1台で受けて、配下の各サービスへはHTTPで流す構成にすると、証明書の更新は1か所で済む。
- **NASのフォルダーは読み取り専用**にし、更新はMacから明示的に行う運用にすると事故が減る。
- **新しい端末を迎えたとき**は、この手順書の「端末ごとのインストール手順」と「指紋（SHA-256）を控える」をセットで保管しておくと迷わない。

## 困ったときのチェックリスト

| 症状 | 確認ポイント |
|---|---|
| iOS で警告が消えない | 「証明書信頼設定」で**完全な信頼**をオンにしたか |
| Windows でだけ警告が出る | 「信頼されたルート証明機関」に入れたか。ユーザーストアとコンピューターストアの取り違え |
| Firefox でだけ警告が出る | `security.enterprise_roots.enabled` が true か、NSSへインポートしたか |
| スマホのアプリだけ接続できない | Android のユーザーCA非信頼が原因。Network Security Config を確認 |
| 証明書の名前不一致エラー | SAN にそのFQDN / IPが入っているか（`openssl x509 -noout -ext subjectAltName`） |
| ある日突然警告が出た | リーフ証明書の期限切れ、またはルートCAの入れ替え漏れ |
| `curl` は通るがブラウザは駄目 | ブラウザ独自ストア（Firefox / 一部のChromium系）を確認 |

## 付録：よく使うコマンド早見表

```bash
# CAの保管場所
mkcert -CAROOT

# ルートCAの指紋
openssl x509 -in "$(mkcert -CAROOT)/rootCA.pem" -noout -fingerprint -sha256

# ルートCAの有効期限・主体者
openssl x509 -in "$(mkcert -CAROOT)/rootCA.pem" -noout -subject -dates

# 証明書の発行（FQDN + ワイルドカード + IP）
mkcert myserver.home.arpa "*.myserver.home.arpa" 192.0.2.50

# 発行された証明書のSAN確認
openssl x509 -in myserver.home.arpa+2.pem -noout -ext subjectAltName

# リモートの証明書を確認
openssl s_client -connect myserver.home.arpa:443 -servername myserver.home.arpa </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

## まとめ

- 配るのは `rootCA.pem`（`.crt` にリネームしたコピー）だけで、**秘密鍵 `rootCA-key.pem` は絶対に配らない**。漏れると全区間の通信が傍受可能になる。
- 配布前に SHA-256 指紋を控え、各端末では信頼ストアへ登録する前に照合する。
- 各端末での登録先は OS ごとに異なる（macOS=キーチェーン、Windows=信頼されたルート証明機関、iOS=証明書信頼設定の完全な信頼、Android=CA証明書＋アプリ側のNetwork Security Config、Firefox=NSS）。
- iOS は「プロファイルインストール」だけでは不十分で、**「完全な信頼」の有効化**が必要。
- リーフ証明書の更新はサーバー側だけで完結する。NASは読み取り専用にして更新はMacから行う。

## 参考情報

### 参照元
| ソース | URL | 内容 |
|--------|-----|------|
| mkcert (GitHub) | https://github.com/FiloSottile/mkcert | ルートCAの発行・インストール・各OS向けの信頼ストア登録手順 |
| OpenSSL Documentation | https://www.openssl.org/docs/ | 証明書の指紋・SAN・有効期限・チェーンの確認方法 |
| 各OSの証明書インポート手順 | - | macOS / Windows / iOS / Android / Firefox の信頼ストア登録操作 |

### 関連項目

- [[OpenWrt技術ノート]] - 対象環境である自宅LANのDNSサーバー（dnsmasq等）の構成
- [[Well-Knownディレクトリ]] - Webサーバー運用時に押さえるべき `.well-known` の扱い
