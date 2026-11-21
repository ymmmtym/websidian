---
tags:
  - bitwarden
  - ssh
  - security
  - dotfiles
created: 2026-07-29
---
## 概要

Bitwarden SSH Agent を使用する際、「Too many authentication failures」エラーが発生する問題と、その解決策を説明する。

## 問題の原因

SSH Agent が保持する鍵が多いと、認証時に目的の鍵が試行される前に `MaxAuthTries` の上限へ達し、接続が切断される。`MaxAuthTries` はサーバー側の `/etc/ssh/sshd_config` で設定され、デフォルトは 6 である。

### SSH の鍵試行フロー

```
ssh user@server-07
    │
    ├─ IdentityFile: ~/.ssh/id_rsa, id_ecdsa, id_ed25519, ...
    │  → ファイルが存在しないのでスキップ
    │
    └─ Agent に全7鍵を順に提示
        ├─ 鍵1: user@server-01 → 拒否
        ├─ 鍵2: user@server-02 → 拒否
        ├─ 鍵3: user@server-03 → 拒否
        ├─ 鍵4: user@server-04 → 拒否
        ├─ 鍵5: user@server-05 → 拒否
        ├─ 鍵6: user@server-06 → 拒否
        └─ 鍵7: user@server-07 → 到達前に MaxAuthTries=6 で切断
```

### 問題の核心

> [!danger] エラーの根本原因
> エージェント内の鍵数（7）が、サーバー側の `MaxAuthTries`（6）を上回るため、正しい鍵に到達する前に接続が切断されます。
> どの鍵が何番目に提示されるかは Bitwarden 側の順序に依存し、保証されません。そのため「運が悪いと毎回失敗する」状態になりやすいです。

| 項目                       | 値                 |
| ------------------------ | ----------------- |
| エージェント鍵数                 | 7                 |
| MaxAuthTries（サーバー側デフォルト） | 6                 |
| 結果                       | 正しい鍵に到達する前に切断されます |

## 解決策: IdentityFile + IdentitiesOnly

> [!tip] 解決策の核心
> `IdentityFile` で公開鍵を指定し、`IdentitiesOnly yes` でその鍵のみを試行します。これにより、Agent 内の鍵数に関わらず1回で接続に成功します。

### 動作フロー（修正後）

```
ssh user@server-07
    │
    ├─ IdentityFile: ~/.ssh/server-07.pub（公開鍵のみ）
    │  → 公開鍵を読み込み、一致する鍵を agent に要求
    │
    └─ Agent に **1つのみ** 提示
        └─ 鍵7: user@server-07 → 1回で成功
```

### 仕組み

| 処理 | 説明 |
|------|------|
| **SSH の鍵選択** | `IdentityFile` の公開鍵と一致する鍵を **agent からだけ** 探します |
| **IdentitiesOnly yes** | `IdentityFile` に指定した鍵以外は **一切試行しません** |
| **一致の比較** | 公開鍵の指紋（SHA256）で一致を判定します |
| **秘密鍵の署名** | Bitwarden agent が代理実行します（秘密鍵はディスクに保存されません） |

### 比較

```
Before:  Agent → 7鍵全部試行 → MaxAuthTries=6 で切断
After:   Agent → 1鍵のみ試行 → 1回で成功
```

## 実施手順

### Step 1: 公開鍵をエクスポート・保存

1. Bitwarden Desktop → `user@server-07` 鍵 → 公開鍵をコピーする
2. `~/.ssh/server-07.pub` に保存する（ファイル名は任意）

### Step 2: `~/.ssh/config` に Host server-07 を更新

```diff
 Host server-07
   HostName server-07
   User user
+  IdentityFile ~/.ssh/server-07.pub
+  IdentitiesOnly yes
```

### Step 3: 動作確認

```bash
ssh user@server-07
```

→ Bitwarden の承認ダイアログが出れば正常である。

### Step 4: wezterm の ssh_domains に identityfile を追加

`~/.wezterm.lua` の `ssh_domains` に `ssh_option` を追加する。

```lua
ssh_domains = {
  {
    name = 'server-07',
    remote_address = 'server-07',
    username = 'user',
    remote_wezterm_path = "/opt/homebrew/bin/wezterm",
    ssh_option = {
      identityfile = '~/.ssh/server-07.pub',
    },
  },
}
```

### Step 5: wezterm の接続確認

```bash
wezterm connect server-07
```

### Step 6: `~/.config/wezterm/wezterm.lua` の扱い

現在、`ssh_domains` を含む `~/.wezterm.lua` が `~/.config/wezterm/wezterm.lua` より優先して読み込まれていない。

- **選択肢 A**: `~/.config/wezterm/wezterm.lua` を削除する（`~/.wezterm.lua` を優先する）
- **選択肢 B**: 2つの設定ファイルを1つに統合する

## 参考情報

### 参照元

| ソース                            | URL                                                             | 内容                                     |
| ------------------------------ | --------------------------------------------------------------- | -------------------------------------- |
| OpenSSH マニュアル                  | [man.openbsd.org](https://man.openbsd.org/ssh_config)           | IdentityFile, IdentitiesOnly の公式ドキュメント |
| Bitwarden SSH Agent            | [bitwarden.com](https://bitwarden.com/help/ssh-agent/)          | SSH Agent のセットアップと仕様                   |
| Bitwarden clients Issue #15048 | [github.com](https://github.com/bitwarden/clients/issues/15048) | SSH Agent の鍵返却順序が作成順・名前順に一致しないという報告    |

### Bitwarden SSH Agent の仕様

| 項目 | 説明 |
|------|------|
| 秘密鍵の保存場所 | Bitwarden Vault（暗号化） |
| ディスクへの保存 | 平文の秘密鍵ファイルは保存しない。暗号化されたVaultデータはローカルにも保存される |
| 鍵の返却順序 | 不定です（保証はなく、作成順・名前順に一致せず、再起動でも変わりえます） |
| 個別鍵の切り出し | 不可（全鍵が返される） |

### MaxAuthTries について

- サーバー側の設定である（`/etc/ssh/sshd_config`）
- macOS のデフォルトは 6 である
- 変更も可能だが、IdentityFile + IdentitiesOnly の方が推奨される

### 推奨構成のメリット

| 比較 | MaxAuthTries 変更 | IdentityFile + IdentitiesOnly |
|------|-------------------|-------------------------------|
| 対象 | そのサーバーだけ | 全ての接続先で有効 |
| セキュリティ | 試行回数が増加 | 鍵の試行を1つに限定 |
| 管理 | サーバーごとに設定 | クライアント側で一元管理 |
| GitHub等 | 非対応 | 対応 |

### 関連項目

- [[SSH Config ベストプラクティス]]
- [[Bitwarden セキュリティ設定]]
- [[WezTerm SSH 接続設定]]
