# CLAUDE.md

回答はすべて日本語で行ってください
ソースコード中のコメント、ユーザー向けメッセージ文字列は日本語で書く
ドキュメントも指定がない場合は日本語で作成
コーディングはSOLID原則に従い、簡潔で拡張しやすいものにする
ディレクトリ名、ファイル名は英語を使用

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electron-based GitHub-compatible markdown viewer that renders markdown files with syntax highlighting, GitHub styling, and theme switching capabilities.

**Key Technologies:**
- Electron for desktop application framework
- marked for markdown parsing with GFM (GitHub Flavored Markdown) support
- highlight.js for syntax highlighting in code blocks
- github-markdown-css for GitHub-compatible styling (light/dark themes)
- mermaid for diagram rendering (flowcharts, sequence diagrams, gantt charts, etc.)

**Key Features:**
- Light/Dark theme switching with system theme detection
- File open dialog to load markdown files
- Default markdown file for argument-free startup
- GitHub-compatible markdown rendering
- Mermaid diagram support (flowcharts, sequence diagrams, gantt charts, class diagrams, state diagrams, ER diagrams)

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
# 引数なしで起動（default.mdを表示）
npm start

# ファイルを指定して起動
npm start <markdown-file>

# Linux環境でサンドボックスエラーが出る場合
ELECTRON_DISABLE_SANDBOX=1 npm start <markdown-file>
```

**Example:**
```bash
# デフォルトファイルを表示
npm start

# 特定のファイルを表示
npm start test.md
npm start /path/to/document.md
npm start README.md
```

**Build for distribution:**
```bash
npm run build

# ビルド成果物の実行（AppImage）- ラッパースクリプト使用（推奨）
# 引数なしで起動（default.mdを表示）
./markdown-viewer.sh

# ファイルを指定して起動
./markdown-viewer.sh <markdown-file>

# または直接実行
ELECTRON_DISABLE_SANDBOX=1 ./dist/markdown-viewer-1.0.0.AppImage
ELECTRON_DISABLE_SANDBOX=1 ./dist/markdown-viewer-1.0.0.AppImage <markdown-file>

# debパッケージのインストール
sudo dpkg -i dist/markdown-viewer_1.0.0_amd64.deb
```

## Architecture

Electron application with modular theme management and IPC communication:

### ファイル構成

```
markdown-viewer/
├── main.js              # メインプロセス（ウィンドウ管理、メニュー、IPC）
├── preload.js           # IPC通信ブリッジ（セキュアなAPIを公開）
├── theme-manager.js     # テーマ管理ロジック（SOLID原則に基づく設計）
├── default.md           # デフォルトマークダウンファイル（内蔵）
├── package.json
└── docs/
    └── theme-switching-design.md  # テーマ機能の設計ドキュメント
```

### 主要コンポーネント

1. **Main Process (main.js):**
   - **初期化**: `app.commandLine.appendSwitch('no-sandbox')` でサンドボックスを無効化（Linux環境対策）
   - Entry point that reads command-line arguments (optional - uses default.md if not provided)
   - Uses `marked` library to parse markdown to HTML with GFM and syntax highlighting enabled
   - **Custom Renderer**: marked v17対応のカスタムレンダラーで`mermaid`コードブロックを特別処理
   - Theme-aware CSS loading from `github-markdown-css` and `highlight.js`
   - **Mermaid Integration**: CDN経由でmermaid.js (UMD版) を読み込み、テーマに応じて初期化
   - Creates BrowserWindow with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false`, and preload script
   - Menu creation (File, Edit, View, Window, Help)
   - IPC communication for theme changes
   - File open dialog integration

2. **Theme Manager (theme-manager.js):**
   - Manages theme state (light/dark/system)
   - System theme detection via `nativeTheme` API
   - Theme-specific CSS path resolution
   - Modular and testable design following SOLID principles

3. **Preload Script (preload.js):**
   - Secure bridge between main and renderer processes
   - Exposes `themeAPI` to renderer via `contextBridge`
   - Maintains `contextIsolation: true` security

4. **Rendering Pipeline:**
   - Read markdown file (or default.md) → Parse with marked (configured with highlight.js and custom renderer for Mermaid) → Generate HTML with theme-aware CSS and Mermaid.js script → Load in Electron window via data URL → Mermaid automatically renders diagrams on page load

5. **Configuration Points:**
   - Sandbox settings: main.js冒頭 (`app.commandLine.appendSwitch`) とBrowserWindow設定内 (`sandbox: false`)
   - Window size: createWindow関数内のBrowserWindow設定 (width/height)
   - Theme: View menu or system settings
   - DevTools: View menu → Toggle DevTools (Ctrl+Shift+I)

## Important Notes

### 起動とファイル読み込み
- 引数なしで起動可能（default.mdを表示）
- File paths can be relative or absolute - resolved via `path.resolve()`
- File menu → Open Markdown File (Ctrl+O) でファイルを開く
- 対応拡張子: .md, .markdown, .mdown, .mkd

### セキュリティ
- All CSS is inlined in the HTML to avoid file system access from renderer
- Security: contextIsolation is enabled, nodeIntegration is disabled
- **Sandbox**: 開発環境用にサンドボックスを無効化している（Linux環境でのchrome-sandbox権限問題を回避）
  - `app.commandLine.appendSwitch('no-sandbox')` で全体的に無効化
  - `webPreferences.sandbox: false` でレンダラープロセスでも無効化
  - package.jsonの`start`スクリプトに `ELECTRON_DISABLE_SANDBOX=1` 環境変数設定を追加可能

### テーマ機能
- **Light Theme**: github-markdown-light.css + github.css (highlight.js) + default theme (Mermaid)
- **Dark Theme**: github-markdown-dark.css + github-dark.css (highlight.js) + dark theme (Mermaid)
- **Follow System Theme** (デフォルト): OSのダーク/ライトモード設定に自動追従
- システム設定変更時に自動的にテーマを切り替え（nativeTheme.on('updated')）
- テーマ切り替えはページリロードを伴う（Mermaid図の再レンダリングのため）

### Mermaid図のサポート
- **サポートされる図の種類**:
  - Flowchart (フローチャート): `graph TD`, `graph LR`, etc.
  - Sequence Diagram (シーケンス図): `sequenceDiagram`
  - Gantt Chart (ガントチャート): `gantt`
  - Class Diagram (クラス図): `classDiagram`
  - State Diagram (状態遷移図): `stateDiagram-v2`
  - ER Diagram (ER図): `erDiagram`
  - その他、Mermaidがサポートするすべての図

- **使用方法**:
  ````markdown
  ```mermaid
  graph TD
      A[開始] --> B{条件分岐}
      B -->|Yes| C[処理1]
      B -->|No| D[処理2]
  ```
  ````

- **技術的な実装**:
  - markedのカスタムレンダラーで`mermaid`コードブロックを`<div class="mermaid">`として出力
  - CDN経由でMermaid.js (UMD版) を読み込み
  - ページロード時に自動的にSVG図にレンダリング
  - テーマに応じてMermaidのテーマ設定も自動調整

## Menu Structure

アプリケーションメニューの構成：

### File
- **Open Markdown File...** (Ctrl+O / Cmd+O): ファイル選択ダイアログを開く
- Quit

### Edit
- Undo, Redo, Cut, Copy, Paste, Delete, Select All
- (macOS: Speech submenu)

### View
- **Light Theme**: ライトテーマに切り替え
- **Dark Theme**: ダークテーマに切り替え
- **Follow System Theme**: システム設定に従う（デフォルト）
- Reload, Force Reload
- **Toggle DevTools** (Ctrl+Shift+I / Cmd+Shift+I)
- Reset Zoom, Zoom In, Zoom Out
- Toggle Fullscreen

### Window
- Minimize, Zoom/Close
- (macOS: Front, Window)

### Help
- Learn More: Electron公式サイトを開く

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
