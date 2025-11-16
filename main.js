const { app, BrowserWindow, Menu, nativeTheme, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');
const { ThemeManager, THEMES } = require('./theme-manager');
const { FileWatcher } = require('./file-watcher');

// サンドボックスを無効化（開発環境用）
app.commandLine.appendSwitch('no-sandbox');

// テーママネージャーのインスタンス
const themeManager = new ThemeManager();

// ファイル監視マネージャーのインスタンス
const fileWatcher = new FileWatcher({ debounceDelay: 300 });

// Configure marked to use highlight.js for code blocks
const renderer = new marked.Renderer();

// 現在レンダリング中のマークダウンファイルのパスを保持
let currentMarkdownDir = '';

// コードブロックのカスタムレンダラー（marked v17対応）
renderer.code = function({text, lang, escaped}) {
  const code = text;
  const language = lang;

  // mermaidブロックの場合は特別な処理
  if (language === 'mermaid') {
    // Mermaidはdiv要素を使用し、コードをエスケープせずにそのまま出力
    return `<div class="mermaid">${code}</div>`;
  }

  // それ以外はhighlight.jsで処理
  if (language && hljs.getLanguage(language)) {
    try {
      const highlighted = hljs.highlight(code, { language: language }).value;
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    } catch (err) {
      console.error('Highlight error:', err);
    }
  }

  const autoHighlighted = hljs.highlightAuto(code).value;
  return `<pre><code class="hljs">${autoHighlighted}</code></pre>`;
};

// 画像ファイルをBase64 Data URLに変換する関数
function convertImageToDataURL(imagePath) {
  try {
    // 画像ファイルを読み込み
    const imageBuffer = fs.readFileSync(imagePath);

    // 拡張子からMIMEタイプを判定
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon'
    };

    const mimeType = mimeTypes[ext] || 'image/png';

    // Base64エンコード
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error(`画像の読み込みに失敗: ${imagePath}`, err);
    return null;
  }
}

// 画像タグのカスタムレンダラー（ローカル画像はBase64に変換）
renderer.image = function({href, title, text}) {
  let imageSrc = href;

  // http:// や https:// で始まる場合はそのまま使用
  // data: スキームの場合もそのまま使用
  if (!href.match(/^(https?:\/\/|data:)/i)) {
    // 相対パスを絶対パスに変換
    const absolutePath = path.resolve(currentMarkdownDir, href);

    // ローカル画像をBase64 Data URLに変換
    const dataURL = convertImageToDataURL(absolutePath);
    if (dataURL) {
      imageSrc = dataURL;
    } else {
      // 変換失敗時はエラーメッセージを表示
      console.warn(`画像が見つかりません: ${absolutePath}`);
      // 元のパスを使用（画像は表示されないが、altテキストは表示される）
      imageSrc = href;
    }
  }

  // HTML画像タグを生成
  const titleAttr = title ? ` title="${title}"` : '';
  const altAttr = text ? ` alt="${text}"` : '';
  return `<img src="${imageSrc}"${altAttr}${titleAttr}>`;
};

marked.setOptions({
  renderer: renderer,
  breaks: true,
  gfm: true
});

/**
 * メニューを作成・更新
 * @param {BrowserWindow} win - 対象のウィンドウ
 */
function createMenu(win) {
  // Electronのデフォルトメニューテンプレートを取得
  const template = [
    // File menu (macOS: アプリケーション名メニュー、その他: File)
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Open Markdown File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => openMarkdownFile(win)
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // File menu (非macOS)
    ...(process.platform !== 'darwin' ? [{
      label: 'File',
      submenu: [
        {
          label: 'Open Markdown File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => openMarkdownFile(win)
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(process.platform === 'darwin' ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // View menu（テーマ切り替えを追加）
    {
      label: 'View',
      submenu: [
        {
          label: 'Light Theme',
          type: 'radio',
          checked: themeManager.getCurrentTheme() === THEMES.LIGHT,
          click: () => {
            themeManager.setTheme(THEMES.LIGHT);
            applyTheme(win);
            createMenu(win);  // メニューを再構築してチェック状態を更新
          }
        },
        {
          label: 'Dark Theme',
          type: 'radio',
          checked: themeManager.getCurrentTheme() === THEMES.DARK,
          click: () => {
            themeManager.setTheme(THEMES.DARK);
            applyTheme(win);
            createMenu(win);
          }
        },
        {
          label: 'Follow System Theme',
          type: 'radio',
          checked: themeManager.getCurrentTheme() === THEMES.SYSTEM,
          click: () => {
            themeManager.setTheme(THEMES.SYSTEM);
            applyTheme(win);
            createMenu(win);
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * テーマを適用（レンダラープロセスへIPC送信）
 * @param {BrowserWindow} win - 対象のウィンドウ
 */
function applyTheme(win) {
  const cssPaths = themeManager.getThemeCssPaths(__dirname);

  try {
    // CSSファイルを読み込み
    const markdownCss = fs.readFileSync(cssPaths.markdown, 'utf-8');
    const highlightCss = fs.readFileSync(cssPaths.highlight, 'utf-8');

    // レンダラープロセスへ送信
    win.webContents.send('theme:change', {
      theme: themeManager.getEffectiveTheme(),
      css: {
        markdown: markdownCss,
        highlight: highlightCss,
        bodyBg: cssPaths.bodyBg
      }
    });
  } catch (err) {
    console.error('テーマの適用に失敗:', err);
  }
}

/**
 * マークダウンファイルを開くダイアログを表示
 * @param {BrowserWindow} win - 対象のウィンドウ
 */
async function openMarkdownFile(win) {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const newFilePath = result.filePaths[0];
    loadMarkdownContent(win, newFilePath);
    // 監視対象ファイルを変更
    fileWatcher.changeFile(newFilePath);
  }
}

/**
 * ファイル監視を開始
 * @param {BrowserWindow} win - 対象のウィンドウ
 * @param {string} markdownFile - 監視対象のマークダウンファイルのパス
 */
function startFileWatching(win, markdownFile) {
  // ファイル監視を開始
  fileWatcher.watch(markdownFile);

  // ファイル変更イベント
  fileWatcher.on('change', (filePath) => {
    console.log(`ファイルが変更されました: ${filePath}`);
    loadMarkdownContent(win, filePath);
  });

  // ファイル削除イベント
  fileWatcher.on('unlink', (filePath) => {
    console.log(`ファイルが削除されました: ${filePath}`);
    // ファイルが削除されても既存の表示を維持
  });

  // ファイル追加イベント（削除後の再作成）
  fileWatcher.on('add', (filePath) => {
    console.log(`ファイルが追加されました: ${filePath}`);
  });

  // エラーイベント
  fileWatcher.on('error', (error) => {
    console.error('ファイル監視エラー:', error);
  });

  // 監視準備完了イベント
  fileWatcher.on('ready', (filePath) => {
    console.log(`ファイル監視を開始しました: ${filePath}`);
  });
}

/**
 * マークダウンファイルを読み込んで表示を更新
 * @param {BrowserWindow} win - 対象のウィンドウ
 * @param {string} markdownFile - マークダウンファイルのパス
 */
function loadMarkdownContent(win, markdownFile) {
  try {
    // 現在のマークダウンファイルのディレクトリを保存（画像パス解決に使用）
    currentMarkdownDir = path.dirname(path.resolve(markdownFile));

    // マークダウンファイルを読み込み
    const markdown = fs.readFileSync(markdownFile, 'utf-8');
    const htmlContent = marked.parse(markdown);

    // テーマに応じたCSSファイルを読み込み
    const cssPaths = themeManager.getThemeCssPaths(__dirname);
    const githubCss = fs.readFileSync(cssPaths.markdown, 'utf-8');
    const highlightCss = fs.readFileSync(cssPaths.highlight, 'utf-8');

    // HTML全体を生成
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${path.basename(markdownFile)}</title>
  <style id="theme-styles">
    ${githubCss}
    ${highlightCss}
  </style>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${cssPaths.bodyBg};
    }

    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
    }

    @media (max-width: 767px) {
      .markdown-body {
        padding: 15px;
      }
    }

    /* Mermaid図のスタイル調整 */
    .markdown-body .mermaid {
      background-color: transparent;
      text-align: center;
      margin: 1em 0;
    }

    .markdown-body .mermaid svg {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <article class="markdown-body">
    ${htmlContent}
  </article>

  <!-- Mermaid.js スクリプト (UMD版) -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>
    // テーマに応じた設定
    const currentTheme = '${themeManager.getEffectiveTheme()}';
    const mermaidTheme = currentTheme === 'dark' ? 'dark' : 'default';

    // Mermaidの初期化
    mermaid.initialize({
      startOnLoad: true,
      theme: mermaidTheme,
      securityLevel: 'loose',
      fontFamily: 'inherit'
    });

    // DOMContentLoadedイベントで確実に実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        mermaid.run();
      });
    } else {
      mermaid.run();
    }
  </script>

  <script>
    // テーマ切り替え用スクリプト
    if (window.themeAPI) {
      window.themeAPI.onThemeChange((data) => {
        // テーマCSSを更新
        const styleElement = document.getElementById('theme-styles');
        if (styleElement) {
          styleElement.textContent = data.css.markdown + '\\n' + data.css.highlight;
        }

        // body背景色を変更
        document.body.style.backgroundColor = data.css.bodyBg;

        // Mermaid図のテーマ変更にはページリロードが必要
        location.reload();
      });
    }
  </script>
</body>
</html>
    `;

    // HTMLをロード
    // Data URLナビゲーション制限を回避するため、一時HTMLファイルを使用
    const tempHtmlPath = path.join(app.getPath('temp'), 'markdown-viewer-temp.html');
    fs.writeFileSync(tempHtmlPath, html, 'utf-8');
    win.loadFile(tempHtmlPath);

    // タイトルを更新
    win.setTitle(path.basename(markdownFile));
  } catch (err) {
    console.error('マークダウンファイルの読み込みに失敗:', err);
    dialog.showErrorBox('エラー', `ファイルの読み込みに失敗しました: ${err.message}`);
  }
}

function createWindow(markdownFile) {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,  // サンドボックスを無効化（開発用）
      preload: path.join(__dirname, 'preload.js')  // preloadスクリプトを指定
    }
  });

  // マークダウンファイルを読み込んで表示
  loadMarkdownContent(win, markdownFile);

  // ファイル監視を開始
  startFileWatching(win, markdownFile);

  // メニューを作成
  createMenu(win);

  // システムテーマ変更を監視
  nativeTheme.on('updated', () => {
    if (themeManager.getCurrentTheme() === THEMES.SYSTEM) {
      // システム設定に従うモードの場合のみ再適用
      applyTheme(win);
    }
  });

  // ウィンドウが閉じられたときにファイル監視を停止
  win.on('closed', () => {
    fileWatcher.unwatch();
  });

  // Open DevTools (optional, comment out in production)
  // win.webContents.openDevTools();

  return win;
}

app.whenReady().then(() => {
  // Get markdown file from command line arguments
  const args = process.argv.slice(app.isPackaged ? 1 : 2);

  let markdownFile;

  if (args.length === 0) {
    // 引数がない場合はデフォルトのマークダウンファイルを使用
    markdownFile = path.join(__dirname, 'default.md');
  } else {
    markdownFile = path.resolve(args[0]);

    if (!fs.existsSync(markdownFile)) {
      console.error(`File not found: ${markdownFile}`);
      // デフォルトファイルにフォールバック
      markdownFile = path.join(__dirname, 'default.md');
    }
  }

  createWindow(markdownFile);
});

app.on('window-all-closed', () => {
  app.quit();
});
