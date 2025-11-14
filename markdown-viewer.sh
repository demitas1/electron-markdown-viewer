#!/bin/bash
# Markdown Viewer AppImage ラッパースクリプト

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# AppImageのパスを設定
APPIMAGE="${SCRIPT_DIR}/dist/markdown-viewer-1.0.0.AppImage"

# AppImageが存在するか確認
if [ ! -f "$APPIMAGE" ]; then
    echo "エラー: AppImageが見つかりません: $APPIMAGE"
    echo ""
    echo "先にビルドを実行してください:"
    echo "  npm run build"
    exit 1
fi

# AppImageに実行権限があるか確認
if [ ! -x "$APPIMAGE" ]; then
    echo "AppImageに実行権限を付与しています..."
    chmod +x "$APPIMAGE"
fi

# サンドボックスを無効化してAppImageを実行
# 引数なしで起動した場合はデフォルトのマークダウンファイルを表示
ELECTRON_DISABLE_SANDBOX=1 "$APPIMAGE" "$@"
