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

# 引数が指定されているか確認
if [ $# -eq 0 ]; then
    echo "使用方法: $0 <markdown-file>"
    echo ""
    echo "例:"
    echo "  $0 README.md"
    echo "  $0 /path/to/document.md"
    exit 1
fi

# サンドボックスを無効化してAppImageを実行
ELECTRON_DISABLE_SANDBOX=1 "$APPIMAGE" "$@"
