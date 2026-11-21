---
tags:
  - megacmd
  - synology
  - nas
  - troubleshooting
  - linux
created: 2026-10-29
---

## 概要

Synology NAS（DS920+ / geminilake / x86_64）で `mega-cmd` が利用できなくなった事象について、segfault を起点に原因を特定し、公式 SPK の手動インストールで解決するまでの記録。あわせて同期設定の確認方法と、再発時の診断ポイントをまとめる。

## 事象

Synology NAS（DS920+ / geminilake / x86_64）上で `mega-cmd` が利用できなくなった。

```
mega-logout
[Initiating server in background. Log: /var/services/homes/<ユーザー>/.megaCmd/megacmdserver.log]
Warning: unable to get locale
                                                                   Resuming session ...

[Server is probably down. Type to respawn or reconnect to it]
```

## 環境

| 項目 | 値 |
|------|-----|
| NAS モデル | DS920+ |
| アーキテクチャ | geminilake (x86_64) |
| DSM カーネル | Linux 4.4.302+ |
| 初期 MEGAcmd バージョン | 1.4.0.0 (code 1040000) |
| 解決後バージョン | 2.6.0.0 (code 2060000) |

## 調査と診断

### ログ確認

```bash
sudo cat /var/services/homes/<ユーザー>/.megaCmd/megacmdserver.log
sudo cat /root/.megaCmd/megacmdserver.log
```

root 側のログに `Not logged in.` が記録されていた。

### カーネルメッセージ確認（根本原因の発見）

```bash
sudo dmesg | grep -i "killed process\|oom\|mega"
```

結果:

```
mega-cmd-server[18487]: segfault at ac0 ip 0000000000fd2f37 ... error 4 in mega-cmd-server
```

**`mega-cmd-server` がセグメンテーションフォルト（segfault）で繰り返しクラッシュ**していることが判明。

### 原因

- MEGAcmd 1.4.0 は MEGA 側の API 変更に対応しておらず、ログイン時のノード取得中にクラッシュする既知のバグ。
- Synology Package Center では 1.4.0 のまま更新されておらず、自動更新不可。
- MEGA 公式 GitHub Issue #989 でも同様の報告があり、バージョン 1.7.0 以降への更新で解消と確認されている。

## 解決方法

### 手順1: 既存パッケージのアンインストール

```bash
sudo synopkg stop MEGAcmd
sudo synopkg uninstall MEGAcmd

# 念のため古い設定も削除
rm -rf /var/services/homes/<ユーザー>/.megaCmd
```

### 手順2: 最新版 SPK のダウンロード

MEGA 公式の NAS ページまたは共有フォルダから最新版を取得。

- 公式ページ: https://mega.io/ja/nas
- 共有フォルダ（2.0.0 系）: https://mega.nz/folder/ogBQnbKa#CoRlU5uarTf4XpY3TbPELQ

DS920+ は **x86_64（Intel）/ geminilake** アーキテクチャなので、対応する `.spk` を選択。

### 手順3: DSM で手動インストール

1. DSM にブラウザでログイン
2. **パッケージセンター** → **右上の「手動インストール」**
3. ダウンロードした `.spk` ファイルを選択してインストール

### 手順4: 動作確認

```bash
mega-version
# MEGAcmd version: 2.6.0.0: code 2060000

mega-whoami
# Account e-mail: <メールアドレス>
```

ログイン成功。

## 同期設定の確認

アップデート後、既存の同期設定を確認するコマンド:

```bash
# 同期タスク一覧
mega-sync

# 同期の詳細状態
mega-sync --help

# 進行中の転送状態（同期転送も表示）
mega-transfers --show-syncs

# 同期設定ファイルの確認
cat /var/services/homes/<ユーザー>/.megaCmd/syncs
```

同期が引き継がれない場合は再設定:

```bash
mega-sync /volume1/ローカルフォルダ /MEGA上のフォルダ
```

## まとめ

- Synology Package Center の「パッケージソース」に追加する方法は存在しない（MEGA がリポジトリ URL を公開していない）。
- Docker 版（`dehahost/megacmd` や `rclone`）も選択肢として存在するが、今回は公式 SPK の手動インストールで解決。
- 今後同様の問題が発生した場合は、まず `dmesg | grep mega` で segfault の有無を確認すると早期診断が可能。
- 記録日: 2026-10-29

## 参考情報

### 参照元

| ソース | URL | 内容 |
|--------|-----|------|
| MEGA 公式 NAS ページ | https://mega.io/ja/nas | 最新版 SPK の入手 |
| MEGA 共有フォルダ（2.0.0 系） | https://mega.nz/folder/ogBQnbKa#CoRlU5uarTf4XpY3TbPELQ | SPK の共有フォルダ |
| MEGA 公式 GitHub Issue #989 | | 同様の segfault 報告（URL 特定不可） |

### 関連項目

- 該当なし
