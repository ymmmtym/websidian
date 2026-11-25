---
tags:
  - macos
  - command
  - automation
  - troubleshooting
created: 2026-11-25
---
## 概要

`caffeinate` は macOS に標準搭載されているコマンドで、Mac がスリープに入るのを防ぎます。長時間の処理や自動化スクリプトの実行中に、スリープによる中断を避けたいときに使います。

## 基本的な使い方

### オプションなし

```bash
caffeinate
```

- Mac 本体はスリープしません。
- ディスプレイ（画面）は通常どおり消えます。

### 画面も消えないようにする

```bash
caffeinate -d
```

- Mac 本体もディスプレイもスリープしません。

### 特定のコマンド実行中だけ有効にする

```bash
caffeinate python long_script.py
```

### タイマーで指定時間だけ有効にする（秒単位）

```bash
caffeinate -t 3600   # 1時間
```

### 画面も保護しつつタイマー指定

```bash
caffeinate -d -t 3600
```

### 特定のプロセス ID が終わるまで保護

```bash
caffeinate -w <PID>
```

## 動作の違い

| 状態 | 画面 | Mac 本体 |
|------|------|---------|
| 何もしない | 消える | スリープする |
| `caffeinate` | 消える | 起動し続ける |
| `caffeinate -d` | 消えない | 起動し続ける |

## Selenium + Chrome での利用

画面が消えても、Mac 本体がスリープしなければ Chrome も Selenium も動き続けます。

### 推奨の使い方

```bash
caffeinate python selenium_script.py
```

### ヘッドレスモードなら完全に安心

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument("--headless")
driver = webdriver.Chrome(options=options)
```

### モード別の比較

| モード | 画面が消えても平気か |
|--------|----------------------|
| 通常の Chrome + `caffeinate` | 平気です |
| ヘッドレス Chrome | 完全に平気です（画面の有無は関係ありません） |
| 何も対策なし（システムもスリープ） | 処理が止まります |

## 用途の例

- 長時間かかるダウンロードやビルド中にスリープを防ぎます。
- プレゼン中に画面が暗くなるのを防ぎます（`-d` を併用します）。
- Selenium などの自動化スクリプト実行中にスリープを防ぎます。

## まとめ

`caffeinate` は、macOS でスリープによる処理の中断を防ぐための最も手軽な方法です。画面の消灯も防ぎたいときは `-d`、決まった時間だけ有効にしたいときは `-t`、特定のコマンドやプロセスの間だけ有効にしたいときはコマンド引数や `-w` を使います。Selenium のような長時間の自動化では、`caffeinate` でラップするか、ヘッドレスモードを併用すると安定します。

## 参考情報

### 参照元

| ソース | URL | 内容 |
|--------|-----|------|
| caffeinate(1) man page | | オプション一覧とアサーションの種類 |
| man caffeinate | | ターミナルで確認できる公式のマニュアル |

### 関連項目

- [[opencodeのcron定期実行]] - macOS の launchd で定期実行する際のスリープ中断対策
