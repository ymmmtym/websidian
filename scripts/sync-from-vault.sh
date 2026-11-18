#!/usr/bin/env bash
#
# Obsidian Vault のノートを content/ に同期します。
# 同期対象は vault-publish.txt に記載されたパスだけです。
#
# 使い方:
#   ./scripts/sync-from-vault.sh              # 同期
#   ./scripts/sync-from-vault.sh --dry-run    # 実行内容の確認のみ
#   OBSIDIAN_VAULT=/path/to/vault ./scripts/sync-from-vault.sh
#
set -euo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/Obsidian Vault}"
LIST_FILE="${PUBLISH_LIST:-vault-publish.txt}"
DEST_DIR="content"
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    -n | --dry-run) DRY_RUN=1 ;;
    -h | --help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "不明な引数: $arg" >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "$VAULT" ]]; then
  echo "Vault が見つかりません: $VAULT" >&2
  echo "OBSIDIAN_VAULT 環境変数で Vault のパスを指定できます。" >&2
  exit 1
fi

if [[ ! -f "$LIST_FILE" ]]; then
  echo "公開リストが見つかりません: $LIST_FILE" >&2
  exit 1
fi

rsync_opts=(-a --exclude '.obsidian/' --exclude '.DS_Store' --exclude '.trash/')
if [[ $DRY_RUN -eq 1 ]]; then
  rsync_opts+=(--dry-run --itemize-changes)
fi

mkdir -p "$DEST_DIR"

synced=0
missing=0

while IFS= read -r line || [[ -n "$line" ]]; do
  # 前後の空白を除去し、空行とコメント行をスキップ
  entry="${line#"${line%%[![:space:]]*}"}"
  entry="${entry%"${entry##*[![:space:]]}"}"
  [[ -z "$entry" || "$entry" == \#* ]] && continue

  entry="${entry#./}"
  entry="${entry%/}"

  if [[ ! -e "$VAULT/$entry" ]]; then
    echo "skip (Vault に存在しません): $entry" >&2
    missing=$((missing + 1))
    continue
  fi

  if [[ -d "$VAULT/$entry" ]]; then
    mkdir -p "$DEST_DIR/$entry"
    rsync "${rsync_opts[@]}" "$VAULT/$entry/" "$DEST_DIR/$entry/"
  else
    mkdir -p "$DEST_DIR/$(dirname "$entry")"
    rsync "${rsync_opts[@]}" "$VAULT/$entry" "$DEST_DIR/$entry"
  fi
  synced=$((synced + 1))
done <"$LIST_FILE"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "dry-run: $synced 件を同期対象として検出しました"
else
  echo "$synced 件を $DEST_DIR/ に同期しました"
fi

if [[ $missing -gt 0 ]]; then
  echo "$missing 件のパスが Vault に見つかりませんでした" >&2
fi
