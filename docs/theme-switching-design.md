# テーマ切り替え機能 実装設計書

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────┐
│         Main Process (main.js)              │
├─────────────────────────────────────────────┤
│ • nativeThemeでシステム設定を検知           │
│ • テーマ状態を管理                          │
│ • メニュー作成・更新                        │
│ • HTML生成時にテーマに応じたCSSを選択      │
│ • IPC通信でテーマ変更を通知                │
└─────────────────────────────────────────────┘
                    ↓ IPC
┌─────────────────────────────────────────────┐
│    Renderer Process (preload.js経由)        │
├─────────────────────────────────────────────┤
│ • テーマ変更イベントを受信                  │
│ • DOMを書き換えてテーマを適用               │
└─────────────────────────────────────────────┘
```

## 2. 必要なファイル

### 新規作成
- `preload.js` - IPC通信のブリッジ
- `theme-manager.js` - テーマ管理ロジック（モジュール化）

### 変更
- `main.js` - メニュー追加、IPC実装、テーママネージャー統合

## 3. テーマ管理の詳細設計

### 3.1 テーマの種類

```javascript
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'  // システム設定に従う
};
```

### 3.2 状態管理

```javascript
class ThemeManager {
  constructor() {
    this.currentTheme = THEMES.SYSTEM;  // デフォルトはシステム設定
    this.effectiveTheme = null;         // 実際に適用されるテーマ (light/dark)
  }

  // システムテーマを検知
  getSystemTheme() {
    return nativeTheme.shouldUseDarkColors ? THEMES.DARK : THEMES.LIGHT;
  }

  // 有効なテーマを解決
  resolveEffectiveTheme() {
    if (this.currentTheme === THEMES.SYSTEM) {
      return this.getSystemTheme();
    }
    return this.currentTheme;
  }

  // テーマを設定
  setTheme(theme) {
    this.currentTheme = theme;
    this.effectiveTheme = this.resolveEffectiveTheme();
  }

  // 現在有効なテーマを取得
  getEffectiveTheme() {
    return this.effectiveTheme || this.resolveEffectiveTheme();
  }
}
```

### 3.3 CSS選択ロジック

| テーマ | Markdown CSS | Highlight.js CSS | 背景色 |
|--------|-------------|------------------|--------|
| Light  | `github-markdown-light.css` | `github.css` | `#ffffff` |
| Dark   | `github-markdown-dark.css` | `github-dark.css` | `#0d1117` |

```javascript
function getThemeCssPaths(theme) {
  const basePath = __dirname;

  if (theme === THEMES.DARK) {
    return {
      markdown: path.join(basePath, 'node_modules/github-markdown-css/github-markdown-dark.css'),
      highlight: path.join(basePath, 'node_modules/highlight.js/styles/github-dark.css'),
      bodyBg: '#0d1117'  // GitHub dark background
    };
  } else {
    return {
      markdown: path.join(basePath, 'node_modules/github-markdown-css/github-markdown-light.css'),
      highlight: path.join(basePath, 'node_modules/highlight.js/styles/github.css'),
      bodyBg: '#ffffff'  // White background
    };
  }
}
```

## 4. メニュー実装

### 4.1 メニュー構造

```
View (表示)
├─ Light Theme (ライトテーマ)           (Radio)
├─ Dark Theme (ダークテーマ)            (Radio)
├─ System Theme (システム設定に従う)    (Radio) ✓
```

### 4.2 メニューコード（概要）

```javascript
const { Menu, nativeTheme } = require('electron');

function createMenu(themeManager, win) {
  const template = [
    {
      label: '表示',
      submenu: [
        {
          label: 'ライトテーマ',
          type: 'radio',
          checked: themeManager.currentTheme === THEMES.LIGHT,
          click: () => {
            themeManager.setTheme(THEMES.LIGHT);
            applyTheme(win, themeManager);
            createMenu(themeManager, win);  // メニューを再構築してチェック状態を更新
          }
        },
        {
          label: 'ダークテーマ',
          type: 'radio',
          checked: themeManager.currentTheme === THEMES.DARK,
          click: () => {
            themeManager.setTheme(THEMES.DARK);
            applyTheme(win, themeManager);
            createMenu(themeManager, win);
          }
        },
        {
          label: 'システム設定に従う',
          type: 'radio',
          checked: themeManager.currentTheme === THEMES.SYSTEM,
          click: () => {
            themeManager.setTheme(THEMES.SYSTEM);
            applyTheme(win, themeManager);
            createMenu(themeManager, win);
          }
        },
        { type: 'separator' },
        {
          label: 'DevToolsを開く',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.openDevTools();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
```

## 5. IPC通信設計

### 5.1 通信チャネル

```javascript
// Main → Renderer
'theme:change'
  payload: {
    theme: 'light' | 'dark',
    css: {
      markdown: string,    // MarkdownのCSS全文
      highlight: string,   // Highlight.jsのCSS全文
      bodyBg: string       // 背景色（例: '#ffffff'）
    }
  }
```

### 5.2 preload.js

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('themeAPI', {
  onThemeChange: (callback) => {
    ipcRenderer.on('theme:change', (event, data) => callback(data));
  }
});
```

### 5.3 Renderer側でのテーマ適用

HTML内に以下のスクリプトを埋め込み：

```javascript
<script>
if (window.themeAPI) {
  window.themeAPI.onThemeChange((data) => {
    // <style id="theme-styles">を書き換え
    const styleElement = document.getElementById('theme-styles');
    if (styleElement) {
      styleElement.textContent = data.css.markdown + '\n' + data.css.highlight;
    }

    // body背景色を変更
    document.body.style.backgroundColor = data.css.bodyBg;
  });
}
</script>
```

### 5.4 Main Process側のテーマ適用関数

```javascript
function applyTheme(win, themeManager) {
  const effectiveTheme = themeManager.getEffectiveTheme();
  const cssPaths = getThemeCssPaths(effectiveTheme);

  // CSSファイルを読み込み
  const markdownCss = fs.readFileSync(cssPaths.markdown, 'utf-8');
  const highlightCss = fs.readFileSync(cssPaths.highlight, 'utf-8');

  // レンダラープロセスへ送信
  win.webContents.send('theme:change', {
    theme: effectiveTheme,
    css: {
      markdown: markdownCss,
      highlight: highlightCss,
      bodyBg: cssPaths.bodyBg
    }
  });
}
```

## 6. システム設定変更の検知

```javascript
const { nativeTheme } = require('electron');

// アプリ起動後にリスナーを登録
app.whenReady().then(() => {
  // ... ウィンドウ作成など ...

  // システムテーマ変更を監視
  nativeTheme.on('updated', () => {
    if (themeManager.currentTheme === THEMES.SYSTEM) {
      // システム設定に従うモードの場合のみ再適用
      applyTheme(win, themeManager);
      createMenu(themeManager, win);  // メニューも更新（表示は変わらないが一貫性のため）
    }
  });
});
```

## 7. 起動時の動作フロー

```
1. アプリ起動
   ↓
2. ThemeManagerを初期化
   currentTheme = 'system'
   ↓
3. nativeTheme.shouldUseDarkColorsでシステム設定を検知
   ↓
4. effectiveTheme を解決（light または dark）
   ↓
5. 対応するCSSファイルを読み込み
   ↓
6. HTML生成時にCSSを埋め込み
   - <style id="theme-styles"> タグにCSS全文を含める
   - テーマ切り替え用のスクリプトも埋め込み
   ↓
7. ウィンドウ表示（preload.jsを指定）
   ↓
8. メニュー作成（システム設定に従う にチェック）
   ↓
9. nativeTheme.on('updated')リスナー登録
```

## 8. ファイル構成

```
markdown-viewer/
├── main.js              # メインプロセス（メニュー、IPC、ウィンドウ管理）
├── preload.js           # [新規] IPC通信ブリッジ
├── theme-manager.js     # [新規] テーマ管理ロジック
├── package.json
├── docs/
│   └── theme-switching-design.md  # 本ドキュメント
└── node_modules/
    ├── github-markdown-css/
    │   ├── github-markdown-light.css
    │   └── github-markdown-dark.css
    └── highlight.js/
        └── styles/
            ├── github.css
            └── github-dark.css
```

## 9. コード規模見積もり

| ファイル | 追加行数 | 変更内容 |
|---------|---------|---------|
| `main.js` | +80行 | メニュー作成、IPC実装、テーママネージャー統合 |
| `preload.js` | +15行 | 新規作成 |
| `theme-manager.js` | +60行 | 新規作成（クラス設計） |
| **合計** | **約155行** | - |

## 10. 主要な実装ポイント

### ✅ システム設定の検知
- `nativeTheme.shouldUseDarkColors`を使用してOSのダーク/ライトモード設定を取得
- `nativeTheme.on('updated')`でリアルタイム検知（OSの設定変更を即座に反映）

### ✅ テーマの切り替え
- メニューからの手動切り替え（ライト/ダーク/システム設定の3択）
- システム設定変更時の自動切り替え（システム設定モードの場合のみ）

### ✅ CSS動的読み込み
- テーマごとに異なるCSSファイルを選択
- レンダラープロセスへCSSを送信して既存の`<style>`タグを書き換え
- ページリロード不要で即座に反映

### ✅ 状態の同期
- メニューのラジオボタン状態とテーママネージャーの状態を同期
- テーマ変更時にメニューを再構築してチェック状態を更新

### ✅ セキュリティ
- `contextIsolation: true`を維持
- preload.jsで安全にIPCを公開
- レンダラープロセスから直接Node.js APIにアクセスしない

## 11. 設計の利点

### 1. SOLID原則に準拠
- **単一責任原則**: ThemeManagerクラスでテーマ管理のみを担当
- **依存性逆転の原則**: main.jsからテーマロジックを分離、インターフェース経由で利用

### 2. 拡張性
- 新しいテーマを追加しやすい（THEMES定数とgetThemeCssPathsに追加するだけ）
- カスタムテーマのサポートも容易（設定ファイルからCSSパスを読み込むなど）
- 将来的にテーマ設定の永続化（localStorage等）も実装可能

### 3. 保守性
- 各モジュールが独立しているため変更の影響範囲が限定的
- テストしやすい構造（ThemeManagerを単体でテスト可能）
- コードの可読性が高い

### 4. ユーザビリティ
- システム設定に自動追従（デフォルト動作）
- メニューから簡単に切り替え可能
- 設定変更が即座に反映（ページリロード不要）
- OSのダークモード変更を検知して自動適用

## 12. 実装時の注意点

### CSS読み込みタイミング
- 初回HTML生成時: CSSを埋め込み
- テーマ切り替え時: IPCでCSSを送信してDOM更新

### エラーハンドリング
- CSSファイルが存在しない場合のフォールバック処理
- IPC通信失敗時のエラーハンドリング

### パフォーマンス
- CSSファイルの読み込みは同期的に行うが、サイズが小さいため問題なし
- テーマ切り替えは即座に反映（数十ms以内）

### テスト項目
1. 起動時にシステム設定に従ったテーマが適用されること
2. メニューから各テーマに切り替え可能なこと
3. システム設定モード時、OS設定変更で自動的にテーマが切り替わること
4. 手動選択モード時、OS設定変更の影響を受けないこと
5. CSSが正しく適用され、表示が崩れないこと

## 13. 将来の拡張可能性

### テーマ設定の永続化
- Electron Storeなどを使用してユーザー設定を保存
- 次回起動時に前回のテーマ設定を復元

### カスタムテーマ
- ユーザー定義のCSSファイルを読み込む機能
- テーマエディタの追加

### キーボードショートカット
- `Cmd+Shift+D` でダークテーマ切り替えなど
- アクセラレーターキーの設定

### テーマプレビュー
- メニュー選択前にホバーでプレビュー表示
- テーマサムネイルの表示

---

**作成日**: 2025-11-14
**バージョン**: 1.0
**ステータス**: 設計完了、実装待ち
