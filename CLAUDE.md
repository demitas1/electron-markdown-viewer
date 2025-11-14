# CLAUDE.md

回答はすべて日本語で行ってください
ソースコード中のコメント、ユーザー向けメッセージ文字列は日本語で書く
ドキュメントも指定がない場合は日本語で作成
コーディングはSOLID原則に従い、簡潔で拡張しやすいものにする
ディレクトリ名、ファイル名は英語を使用

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electron-based GitHub-compatible markdown viewer that renders markdown files with syntax highlighting and GitHub styling.

**Key Technologies:**
- Electron for desktop application framework
- marked for markdown parsing with GFM (GitHub Flavored Markdown) support
- highlight.js for syntax highlighting in code blocks
- github-markdown-css for GitHub-compatible styling

## Commands

**Install dependencies:**
```bash
cd markdown-viewer
npm install
# or use the install script
./install.sh
```

**Run the application:**
```bash
npm start <markdown-file>
# or
electron . <markdown-file>

# Linux環境でサンドボックスエラーが出る場合
ELECTRON_DISABLE_SANDBOX=1 npm start <markdown-file>
```

**Example:**
```bash
npm start test.md
npm start /path/to/document.md
npm start README.md
```

**Build for distribution (requires setup):**
```bash
npm install --save-dev electron-builder
npm run build
```

## Architecture

This is a single-file Electron application with all logic in `main.js`:

1. **Main Process (main.js):**
   - **初期化**: `app.commandLine.appendSwitch('no-sandbox')` でサンドボックスを無効化（Linux環境対策）
   - Entry point that reads command-line arguments for the markdown file path
   - Uses `marked` library to parse markdown to HTML with GFM and syntax highlighting enabled
   - Inlines CSS from `github-markdown-css` and `highlight.js` styles
   - Creates BrowserWindow with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` for security/compatibility balance
   - Loads the generated HTML via data URL

2. **Rendering Pipeline:**
   - Read markdown file → Parse with marked (configured with highlight.js) → Wrap in HTML template with GitHub CSS → Load in Electron window

3. **Configuration Points:**
   - Sandbox settings: main.js冒頭 (`app.commandLine.appendSwitch`) とBrowserWindow設定内 (`sandbox: false`)
   - Window size: createWindow関数内のBrowserWindow設定 (width/height)
   - Syntax highlighting theme: highlightCss読み込み部分 (highlight.js styles path)
   - DevTools: win.loadURL()の後 (uncomment to enable)

## Important Notes

- The application requires a markdown file path as a command-line argument
- File paths can be relative or absolute - resolved via `path.resolve()`
- All CSS is inlined in the HTML to avoid file system access from renderer
- Security: contextIsolation is enabled, nodeIntegration is disabled
- **Sandbox**: 開発環境用にサンドボックスを無効化している（Linux環境でのchrome-sandbox権限問題を回避）
  - `app.commandLine.appendSwitch('no-sandbox')` で全体的に無効化
  - `webPreferences.sandbox: false` でレンダラープロセスでも無効化
  - package.jsonの`start`スクリプトに `ELECTRON_DISABLE_SANDBOX=1` 環境変数設定を追加可能

## Known Issues and Solutions

**Linux環境でのサンドボックスエラー:**
```
FATAL:sandbox/linux/suid/client/setuid_sandbox_host.cc:166
The SUID sandbox helper binary was found, but is not configured correctly.
```

**解決方法:**
1. 環境変数で無効化: `ELECTRON_DISABLE_SANDBOX=1 npm start <file>`
2. コード内で無効化（既に実装済み）: `app.commandLine.appendSwitch('no-sandbox')`
3. 本番環境向け: chrome-sandboxに適切な権限を設定 (root所有、mode 4755)
