---
tags:
  - linux
  - systemd
  - cron
  - automation
created: 2026-11-04
---
## 概要

Linux の systemd が提供する定期実行の仕組み（timer）について、`.service` / `.timer` の2ファイル構成、有効化手順、スケジュール指定、cron との比較、本番運用の方針を整理する。

## systemd timer とは

systemd timer は、Linux の systemd が提供する定期実行の仕組みである。実行する時刻・間隔を `.timer` ユニットに定義し、実際に行う処理は `.service` ユニットに定義する。cron と同じく定期ジョブを実行できるが、systemd のサービス管理・依存関係・journal ログなどと連携できる。

systemd は2010年ごろに開発が始まり、2010年代半ばから主要なLinuxディストリビューションで広く採用された。timer は新しい流行技術というより、現在では十分に実績のある systemd の機能である。一方、cron も今なお広く使われており、timer がすべての環境で cron を置き換えたわけではない。

## `.service` と `.timer` の2ファイル

例として、毎日午前3時に `/usr/local/bin/backup.sh` を実行する設定である。

`/etc/systemd/system/backup.service`

```ini
[Unit]
Description=Daily backup

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

`Type=oneshot` は、処理を1回実行して終了するジョブに使う。

`/etc/systemd/system/backup.timer`

```ini
[Unit]
Description=Run backup daily

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

同じ名前の `.service` があれば、timer は通常それを起動する。別名のサービスを起動したい場合は、`.timer` の `[Timer]` に `Unit=別の名前.service` を指定できる。

## 設定を反映して有効化する

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
```

定期実行を有効にするのは `.service` ではなく **`.timer`** である。`.service` はスケジュールを待たずに手動実行するときにも使える。

```bash
# 登録済みtimerと次回実行予定を確認
systemctl list-timers --all

# ジョブを今すぐ手動実行
sudo systemctl start backup.service

# 実行ログを確認
sudo journalctl -u backup.service -n 50 --no-pager
```

設定ファイルを変更した後は `daemon-reload` を実行する。timer の状態確認には `systemctl status backup.timer` も使える。

## よく使うスケジュール指定

| 指定 | 意味 |
|---|---|
| `OnCalendar=daily` | 毎日実行 |
| `OnCalendar=Mon..Fri *-*-* 09:00:00` | 平日の午前9時 |
| `OnCalendar=*-*-* 03:00:00` | 毎日午前3時 |
| `OnBootSec=5min` | 起動から5分後 |
| `OnUnitActiveSec=1h` | 対象サービスの前回起動から1時間後 |
| `Persistent=true` | カレンダー式の実行時刻に停止していた場合、起動後に未実行分を補う（通常は1回） |
| `RandomizedDelaySec=5min` | 実行時刻に最大5分のランダムな遅延を加える |

`OnCalendar` の式は次のように検証できる。

```bash
systemd-analyze calendar 'Mon..Fri *-*-* 09:00:00'
```

timer は厳密なリアルタイム実行を保証する仕組みではない。実行タイミングに許容できる遅れがあるか、時刻同期やジョブの所要時間を考慮すること。

## cron と比べた利点

- **ログ確認がしやすい**：標準出力・標準エラーを含む実行ログを `journalctl` で確認しやすい。
- **サービス管理と一体化**：依存関係や実行順序を systemd のユニット設定で扱える。
- **停止中の実行を補える**：カレンダー式の timer では `Persistent=true` を利用できる。
- **実行条件や制限を設定できる**：ユーザー、環境、CPU・メモリ制限などを `.service` 側にまとめられる。
- **構成管理に載せやすい**：ユニットファイルを Git や Ansible などで管理できる。

一方、cron は設定が簡単で、既存の運用や共通基盤に組み込まれている場合も多い。簡単な個人用ジョブや cron が標準の環境では、cron を使い続けても問題ない。

## 本番環境で timer を使う方針

本番環境の定期ジョブでは、今後 systemd timer を標準として使う方針である。導入時は、少なくとも次を確認すると運用しやすくなる。

1. **失敗を検知する**：ログを見るだけでなく、必要に応じて監視・通知につなぐ。`OnFailure=` で失敗時に別ユニットを起動する構成も可能である。
2. **実行ユーザーを明示する**：必要以上の権限で動かさず、`User=` や `Group=` を検討する。
3. **多重実行や所要時間を考慮する**：前回処理が終わる前に次の実行時刻が来るケースを設計・テストする。
4. **必要ならリソースを制限する**：`.service` で `MemoryMax=`、`CPUQuota=`、`Nice=` などを検討する。
5. **手動実行もテストする**：`systemctl start backup.service` で、timer の時刻を待たずに処理とログを確認する。
6. **OS・systemd のバージョン差を確認する**：利用できるディレクティブや既定値は環境で異なることがある。

## まず覚えるコマンド

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers --all
systemctl status backup.timer
sudo systemctl start backup.service
sudo journalctl -u backup.service -n 50 --no-pager
```

## まとめ

systemd timer は cron に代わる、Linux の定期実行の選択肢である。cron より設定ファイルは増えるが、ログ・サービス管理・実行環境の設定を systemd にまとめられる。すべてのケースで cron より優れているわけではないが、本番環境の定期ジョブでは timer を標準にする方針は、systemd を使うLinux環境なら妥当な選択である。

## 参考情報

### 参照元

| ソース | URL | 内容 |
|--------|-----|------|
| systemd.timer(5) man page | | `.timer` ユニットの設定項目（`OnCalendar` / `Persistent` など） |
| systemd.time(7) man page | | `OnCalendar` の時刻表現 |

### 関連項目

- [[opencodeのcron定期実行]] - cron の代替となる定期実行手段の整理
- [[Linuxコンテナのnamespaceとcgroups]] - `MemoryMax=` / `CPUQuota=` によるリソース制限の基盤
