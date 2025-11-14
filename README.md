# Markdown Viewer

GitHub互換のマークダウンビューア（Electron製）

## ディレクトリ構成

```
markdown-viewer/
├── main.js              # Electronメインプロセス
├── package.json         # プロジェクト設定
├── package-lock.json    # 依存関係ロック
├── .gitignore           # Git除外設定
├── LICENSE.txt          # MITライセンス
├── CLAUDE.md            # Claude Code用ガイド
├── node_modules/        # 依存パッケージ
│   ├── electron/
│   ├── marked/
│   ├── github-markdown-css/
│   └── highlight.js/
├── test.md             # テスト用マークダウン
├── install.sh          # インストールスクリプト
└── README.md           # このファイル
```

## インストール

```bash
cd markdown-viewer
npm install
```

または

```bash
./install.sh
```

### 注意事項（Linux環境）

Linuxでサンドボックス関連のエラーが発生する場合は、環境変数を設定して実行してください：

```bash
ELECTRON_DISABLE_SANDBOX=1 npm start <markdown-file>
```

このアプリでは開発用にサンドボックスを無効化する設定が含まれています（`main.js`で`app.commandLine.appendSwitch('no-sandbox')`を使用）。

## 使い方

### コマンドラインから実行

```bash
npm start <markdown-file>
```

または

```bash
electron . <markdown-file>
```

### 例

```bash
npm start test.md
npm start /path/to/your/document.md
```

## 機能

- ✅ GitHub Flavored Markdown (GFM) 完全対応
- ✅ シンタックスハイライト（highlight.js）
- ✅ GitHub互換のスタイル
- ✅ 自動スクロール
- ✅ コードブロック、テーブル、タスクリスト対応
- ✅ 相対パス/絶対パス対応

## 依存パッケージ

- **electron**: デスクトップアプリフレームワーク
- **marked**: マークダウンパーサー
- **github-markdown-css**: GitHubスタイルCSS
- **highlight.js**: シンタックスハイライト

## カスタマイズ

### ウィンドウサイズの変更

`main.js` のcreateWindow関数内：

```javascript
const win = new BrowserWindow({
  width: 1000,  // 幅を変更
  height: 800,  // 高さを変更
  // ...
});
```

### デバッグツールの有効化

`main.js` のwin.loadURL()の後のコメントを外す：

```javascript
win.webContents.openDevTools();
```

### シンタックスハイライトテーマの変更

`main.js` でhighlight.jsのテーマを変更：

```javascript
const highlightCss = fs.readFileSync(
  path.join(__dirname, 'node_modules/highlight.js/styles/github-dark.css'),  // テーマを変更
  'utf-8'
);
```

利用可能なテーマ：
- `github.css` (デフォルト)
- `github-dark.css`
- `monokai.css`
- `atom-one-dark.css`
など（`node_modules/highlight.js/styles/`に一覧あり）

## 実行ファイルのビルド

本番用の実行ファイルを作成する場合：

```bash
npm install --save-dev electron-builder
```

`package.json`に追加：

```json
"scripts": {
  "build": "electron-builder"
},
"build": {
  "appId": "com.example.markdown-viewer",
  "linux": {
    "target": ["AppImage", "deb"]
  }
}
```

ビルド実行：

```bash
npm run build
```

## ライセンス

MIT
