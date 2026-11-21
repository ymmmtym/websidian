---
tags:
  - openwrt
  - network
  - sre
  - linux
  - router
  - wireguard
  - docker
  - nuro
  - unifi
  - extroot
  - s3
  - rclone
created: 2026-09-07
---
## 概要

**OpenWrt** は、ルーターや組み込みデバイス向けのLinuxベースのオープンソースOSである。家庭用ルーターのファームウェアを置き換えて使い、SSHでログインしてシェル操作ができるため、通常のLinuxサーバーに近い感覚で扱える。本書はOpenWrtをSRE的な観点（トラフィック制御・監視・障害検証など）で活用し、ベンダーロックインを回避するための技術ノートである。

## アーキテクチャ

```
[ WAN ] ─── [ OpenWrt デバイス ] ─── [ LAN / Wi-Fi ]
                    │
          Linux Kernel + iptables/nftables
          + パッケージマネージャ (opkg)
          + LuCI (Web UI)
          + SSH アクセス
```

### 主要コンポーネント

| コンポーネント                 | 役割                   |
| ----------------------- | -------------------- |
| `netifd`                | ネットワークインターフェース管理デーモン |
| `dnsmasq`               | DNS / DHCPサーバー       |
| `iptables` / `nftables` | パケットフィルタリング・NAT      |
| `tc` (Traffic Control)  | 帯域制御・QoS             |
| `opkg`                  | パッケージ管理（apt的なもの）     |
| `LuCI`                  | Web管理UI              |

## SRE的な使いどころ

### 1. トラフィック制御・QoS

```bash
# eth0 の送信帯域を 100Mbit に制限
tc qdisc add dev eth0 root handle 1: htb default 10
tc class add dev eth0 parent 1: classid 1:10 htb rate 100mbit
```

- ラボ環境で意図的に帯域を絞り、劣化試験をする
- 特定のIPへのトラフィックを優先・制限する

### 2. ネットワーク監視・可視化

```bash
opkg install collectd collectd-mod-interface
```

収集できる主なメトリクス：インターフェースごとのbps / pps、パケットロス・エラー数、接続数（conntrack）

### 3. パケットキャプチャ・デバッグ

```bash
opkg install tcpdump
tcpdump -i eth0 -w /tmp/capture.pcap
```

### 4. VPN エンドポイント（WireGuard）

```bash
opkg install wireguard-tools kmod-wireguard
```

### 5. 障害注入（カオスエンジニアリング）

```bash
# 30% のパケットをドロップ（劣化試験）
iptables -A OUTPUT -m statistic --mode random --probability 0.3 -j DROP
```

## 対応機器の選び方

### 最低スペック（これ以下は避ける）

- RAM: 128MB以上（256MB推奨）
- Flash: 16MB以上

### 価格帯別おすすめ

| 価格帯 | 機種 | 用途 |
|---|---|---|
| 〜5,000円（中古） | Buffalo WZR-HP-AG300H等 | 学習・実験専用 |
| 〜10,000円 | Cudy WR3000S | Wi-Fi 6・コスパ重視 |
| 約20,000円 | GL.iNet GL-MT6000（Flint 2） | 実用＋学習の両立 |
| 約39,000円 | Linksys LN6001-JP | 自宅回線への本番導入 |

### 自宅回線導入の最有力：Linksys LN6001-JP

- OpenWrtプリインストール済み（書き込み失敗リスクなし）
- 日本回線（IPoE / MAP-E / DS-Lite）をオートで設定可能
- Wi-Fi 7対応・技適取得済み・国内正規サポートあり
- SSH / LuCI / opkg / WireGuard完備

## NURO光との組み合わせ

NURO光はONU（ソニー製またはZTE製）を無料レンタルするが、取り外し不可。ONUにはルーター機能があるため、OpenWrtルーターはその配下に置く構成になる。

```
[NURO光回線]
      │（光ファイバー）
[NURO ONU] ← 取り外し不可・無料レンタル
      │（LANケーブル）
[OpenWrtルーター] ← 自前購入
      │
[LAN / Wi-Fi]
```

> [!tip] NURO光のポイント
> - NURO光はフレッツ系と違いIPoE設定不要でシンプル
> - 二重NATを避けるためONU側またはOpenWrt側をブリッジモードにする

> [!warning] ZTE製ONUの注意
> 2026年4月以降ZTE製ONUがランダム配布される場合があり、LANポートが最大1Gbpsに制限される可能性があります。

## OpenWrt vs UniFi 比較

### UniFiとは

Ubiquiti社のエンタープライズ向けネットワーク製品ブランド。ルーター・スイッチ・AP・監視カメラを統合管理できる。

### 主力機：UniFi Dream Router 7（UDR7）

10G SFP+ WAN、Wi-Fi 7、PoEスイッチ、64GB NVR内蔵、マルチWAN / SD-WAN / OSPF対応。約4〜5万円。

### SRE的な比較表

| 観点 | OpenWrt | UniFi |
|---|---|---|
| 思想 | Linux自由操作 | 統合管理・可視化 |
| CLI操作 | ◎ SSH + opkg | △ GUI主体 |
| トラフィック制御 | ◎ tc完全自由 | △ 抽象化されたQoS |
| 拡張性 | ◎ opkgで自由 | ✗ エコシステム内限定 |
| 監視UI | 自前構築が必要 | ◎ 標準で強力 |
| ベンダーロックイン | なし | Ubiquitiエコシステムに依存 |
| 設定の移植性 | ◎ UCIファイルで移植可 | △ 他機器への移植困難 |
| 日本回線対応 | ◎ | ◎ MAP-E / DS-Lite対応 |

### 判断軸

```
OpenWrt向き：
  ✅ 設定をコードで管理したい（IaC的発想）
  ✅ 将来どのハードへでも移植したい
  ✅ Prometheus / Grafanaと統合した自前監視をしたい
  ✅ ベンダーに依存したくない

UniFi向き：
  ✅ 監視・可視化が最初から欲しい
  ✅ GUIで素早く設定したい
  ✅ APやスイッチも将来統合したい
  ✅ ロックインより「体験の統一感」を優先する
```

## DockerでOpenWrtを動かす

### rootfs vs openwrt-docker の違い

```
openwrt/rootfs（公式）
  └── OpenWrtのユーザーランドのみ
      Linuxカーネルはホストと共有
      → opkg・UCI・tcコマンドは試せる
      → 軽量・起動が速い
      → macOS / Windows対応

albrechtloh/openwrt-docker（コミュニティ）
  └── KVM上でOpenWrt専用カーネルごと動かす
      → iptables・conntrack・tcが完全に独立動作
      → LuCI WebUIも使える
      → privileged必須・Linux KVM必要
```

### compose.yaml サンプル

```yaml
services:

  # A) 公式rootfs：opkg・tc・WireGuardのコマンド体験用
  rootfs:
    image: openwrt/rootfs:latest
    container_name: openwrt-rootfs
    privileged: true
    stdin_open: true
    tty: true
    command: ["/bin/sh", "-c", "mkdir -p /var/lock && sleep infinity"]
    networks:
      - openwrt-net

  # B) フル版：LuCI WebUI + 独立カーネル（KVM必須）
  openwrt:
    image: albrechtloh/openwrt-docker:latest
    container_name: openwrt-full
    privileged: true
    devices:
      - /dev/kvm:/dev/kvm
    ports:
      - "8006:8006"   # LuCI WebUI → http://localhost:8006
    networks:
      - openwrt-net
    restart: unless-stopped

networks:
  openwrt-net:
    driver: bridge
```

### 操作コマンド

```bash
# A) rootfsを起動してシェルに入る
docker compose up -d rootfs
docker compose exec rootfs sh

# tcを試す
tc qdisc add dev lo root tbf rate 1mbit burst 32kbit latency 400ms
tc qdisc show

# B) フル版（Linux KVM必須）
docker compose up -d openwrt
open http://localhost:8006
```

> [!warning] openwrt-dockerはLinux KVM必須
> フル版は`/dev/kvm`が必要で、macOS / Windowsでは動作しません。

### 用途別の向き・不向き

| 用途 | rootfs | openwrt-docker |
|---|---|---|
| opkg・UCI体験 | ✅ | ✅ |
| tc / iptables（独立動作） | △ | ✅ |
| LuCI WebUI | ❌ | ✅ |
| macOS / Windows | ✅ | ❌ |
| 起動速度 | 数秒 | 30秒〜 |

## ストレージ拡張

### 方式の全体像

| 方式 | 向いている用途 |
|---|---|
| ExtRoot（USB） | opkgパッケージ増量・rootfs拡張 |
| 外部マウント（USB） | データ保存・NAS的用途 |
| S3マウント（rclone） | クラウド連携・ログ保管 |
| x86_64機（NVMe / SSD） | 本格的な大容量ストレージ |

### ExtRoot（USBストレージ拡張）

OpenWrtのoverlay（書き込み領域）をUSBメモリやUSB-SSDに移動する仕組み。内部Flashが少なくても実質無制限に近いストレージを確保できる。

```bash
opkg install block-mount kmod-fs-ext4 kmod-usb3 e2fsprogs parted

DISK="/dev/sda"
parted -s ${DISK} -- mklabel gpt mkpart extroot 2048s -2048s
mkfs.ext4 -L extroot ${DISK}1

mount ${DISK}1 /mnt
cp -a -f /overlay/. /mnt
umount /mnt
reboot
```

> [!tip] フォールバック安全性
> 外部ストレージを取り外した場合、内部overlayから起動するためExtRoot化前の状態に戻れます。

### S3連携（rclone）

ExtRoot化済みが前提（rcloneバイナリが約50MBのため）。

```bash
opkg install rclone

# S3設定
rclone config

# S3をマウント
rclone mount s3:my-bucket /mnt/s3 --daemon

# ログをS3に転送
rclone copy /var/log/messages s3:my-bucket/openwrt-logs/
```

### x86_64ミニPC（最大自由度）

HUNSN RJ03（M.2 NVMe×2・2.5GbE×4・N100搭載）等のミニPCにOpenWrt x86_64をインストールする構成。

```
[HUNSN RJ03]
  └── OpenWrt x86_64
  └── NVMe SSD（500GB〜）
  └── rcloneでS3連携
  └── collectd + Prometheusで監視
```

Amazon Japanで2.8万円程度から購入可能。ProxmoxでVM化すると柔軟性がさらに上がる。

### 用途別推奨

```
目的                       推奨構成
──────────────────────────────────────────
opkgを増やしたい          USBポート付きルーター + ExtRoot
S3にログ・データを飛ばす  ExtRoot + rclone
本格NAS・大容量           x86_64ミニPC（HUNSN RJ03等）+ NVMe
```

## まとめ

```
OpenWrt ＝ 「自由に操作できるLinuxがルーターに乗っている」状態

SRE文脈での価値：
  ✅ トラフィック制御・帯域制限 (tc / HTB)
  ✅ ルーターレベルの監視 (collectd / Prometheus)
  ✅ パケットキャプチャによる障害調査 (tcpdump)
  ✅ VPNエッジノード (WireGuard)
  ✅ 障害注入・劣化試験 (iptables)
  ✅ ストレージ拡張 (ExtRoot / rclone / x86_64)
  ✅ Dockerコンテナで事前学習可能

ベンダーロックイン回避の観点：
  ✅ OSSで設定がUCIファイルとして移植可能
  ✅ 任意メーカーのAPやスイッチと組み合わせ可能
  ✅ Prometheus / Grafanaへ自前でメトリクスを流せる
```

## 参考情報

### 参照元

出典: `~/Downloads/openwrt-notes.md`（元ノートの参考リンクを整理）

| ソース | URL | 内容 |
|--------|-----|------|
| OpenWrt 公式ドキュメント | https://openwrt.org/docs/start | 公式ドキュメント入口 |
| OpenWrt Table of Hardware | https://toh.openwrt.org/ | 対応機器データベース |
| OpenWrt ExtRoot公式ガイド | https://openwrt.org/docs/guide-user/additional-software/extroot_configuration | ExtRoot設定手順 |
| OpenWrt WireGuardセットアップ | https://openwrt.org/docs/guide-user/services/vpn/wireguard/start | WireGuard設定手順 |
| GL.iNet GL-MT6000 製品ページ | https://www.gl-inet.com/products/gl-mt6000/ | Flint 2 製品情報 |
| Linux Traffic Control (tc) 入門 | https://tldp.org/HOWTO/Traffic-Control-HOWTO/ | tcの基礎 |
| rclone 公式ドキュメント | https://rclone.org/docs/ | rcloneの使い方 |

### 関連項目

- [[ベンダーロックフリーなFaaS]] — ベンダーロックイン回避の思想
- [[Linuxコンテナのnamespaceとcgroups]] — Dockerでの動作検証の前提知識