const { app, BrowserWindow, Menu, nativeTheme, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');
const { ThemeManager, THEMES } = require('./theme-manager');

// サンドボックスを無効化（開発環境用）
app.commandLine.appendSwitch('no-sandbox');

// テーママネージャーのインスタンス
const themeManager = new ThemeManager();

// Configure marked to use highlight.js for code blocks
const renderer = new marked.Renderer();

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
    loadMarkdownContent(win, result.filePaths[0]);
  }
}

/**
 * マークダウンファイルを読み込んで表示を更新
 * @param {BrowserWindow} win - 対象のウィンドウ
 * @param {string} markdownFile - マークダウンファイルのパス
 */
function loadMarkdownContent(win, markdownFile) {
  try {
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

    // HTMLをロード（先頭に移動）
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

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

  // メニューを作成
  createMenu(win);

  // システムテーマ変更を監視
  nativeTheme.on('updated', () => {
    if (themeManager.getCurrentTheme() === THEMES.SYSTEM) {
      // システム設定に従うモードの場合のみ再適用
      applyTheme(win);
    }
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
