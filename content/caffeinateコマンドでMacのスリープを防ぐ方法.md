---
tags:
  - macos
  - command
  - automation
  - troubleshooting
created: 2026-11-25
---
## 概要

`caffeinate` は macOS に標準搭載されているコマンドで、アイドル時に Mac がスリープに入るのを防ぎます。長時間の処理や自動化スクリプトの実行中に、スリープによる中断を避けたいときに使います。

## 基本的な使い方

### オプションなし

```bash
caffeinate
```

- アイドル時に Mac 本体がスリープするのを防ぎます。
- MacBook のふたを閉じた場合は、スリープすることがあります。
- ディスプレイ（画面）は通常どおり消えます。

### 画面も消えないようにする

```bash
caffeinate -d
```

- アイドル時の Mac 本体とディスプレイのスリープを防ぎます。
- ふたを閉じた場合のスリープは防げません。

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
| 何もしない | 消える | アイドルスリープする |
| `caffeinate` | 消える | アイドルスリープしない |
| `caffeinate -d` | 消えない | アイドルスリープしない |

いずれもアイドルスリープだけを防ぎます。MacBook のふたを閉じた場合のスリープは防げません。

## Selenium + Chrome での利用

画面が消えても、Mac 本体がアイドルスリープしなければ Chrome も Selenium も動き続けます。ただし、MacBook のふたを閉じた場合はスリープすることがあります。

### 推奨の使い方

```bash
caffeinate python selenium_script.py
```

### ヘッドレスモードでも `caffeinate` は必要

ヘッドレスモードは Chrome の画面を表示しないだけなので、Mac 本体のアイドルスリープは防ぎません。長時間の処理では `caffeinate` と併用します。

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument("--headless")
driver = webdriver.Chrome(options=options)
```

`caffeinate python selenium_script.py` のように実行すると、ヘッドレスモードの処理中もスリープを防げます。

### モード別の比較

| モード | 画面が消えても平気か |
|--------|----------------------|
| 通常の Chrome + `caffeinate` | 平気です |
| ヘッドレス Chrome + `caffeinate` | 画面の有無は関係ありません |
| ヘッドレス Chrome のみ（`caffeinate` なし） | アイドルスリープで処理が止まることがあります |
| 何も対策なし（システムもスリープ） | 処理が止まります |

## 用途の例

- 長時間かかるダウンロードやビルド中にスリープを防ぎます。
- プレゼン中に画面が暗くなるのを防ぎます（`-d` を併用します）。
- Selenium などの自動化スクリプト実行中にスリープを防ぎます。

## まとめ

`caffeinate` は、macOS でアイドルスリープによる処理の中断を防ぐための最も手軽な方法です。画面の消灯も防ぎたいときは `-d`、決まった時間だけ有効にしたいときは `-t`、特定のコマンドやプロセスの間だけ有効にしたいときはコマンド引数や `-w` を使います。Selenium のような長時間の自動化では、ヘッドレスモードと併用しつつ `caffeinate` でラップすると安定します。MacBook のふたを閉じた場合のスリープは防げないため、その間はふたを開いたままにするか、電源と外部ディスプレイをつないだクラムシェルモードで使ってください。

## 参考情報

### 参照元

| ソース | URL | 内容 |
|--------|-----|------|
| caffeinate(1) man page | | オプション一覧とアサーションの種類 |
| caffeinate.c（apple-oss-distributions/PowerManagement） | https://github.com/apple-oss-distributions/PowerManagement/blob/main/caffeinate/caffeinate.c | 既定のアサーションが `PreventUserIdleSystemSleep` であること |
| man caffeinate | | ターミナルで確認できる公式のマニュアル |

### 関連項目

- [[opencodeのcron定期実行]] - macOS の launchd で定期実行する際のスリープ中断対策
