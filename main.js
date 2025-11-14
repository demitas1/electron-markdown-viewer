const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');

// サンドボックスを無効化（開発環境用）
app.commandLine.appendSwitch('no-sandbox');

// Configure marked to use highlight.js for code blocks
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

function createWindow(markdownFile) {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false  // サンドボックスを無効化（開発用）
    }
  });

  // Read markdown file
  let markdown;
  try {
    markdown = fs.readFileSync(markdownFile, 'utf-8');
  } catch (err) {
    console.error('Error reading file:', err);
    app.quit();
    return;
  }

  // Convert markdown to HTML
  const htmlContent = marked.parse(markdown);

  // Read CSS files
  const githubCss = fs.readFileSync(
    path.join(__dirname, 'node_modules/github-markdown-css/github-markdown.css'),
    'utf-8'
  );
  const highlightCss = fs.readFileSync(
    path.join(__dirname, 'node_modules/highlight.js/styles/github.css'),
    'utf-8'
  );

  // Create complete HTML document
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${path.basename(markdownFile)}</title>
  <style>
    ${githubCss}
    ${highlightCss}
    
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
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
  </style>
</head>
<body>
  <article class="markdown-body">
    ${htmlContent}
  </article>
</body>
</html>
  `;

  // Load HTML content
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  // Open DevTools (optional, comment out in production)
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  // Get markdown file from command line arguments
  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  
  if (args.length === 0) {
    console.error('Usage: electron . <markdown-file>');
    app.quit();
    return;
  }

  const markdownFile = path.resolve(args[0]);
  
  if (!fs.existsSync(markdownFile)) {
    console.error(`File not found: ${markdownFile}`);
    app.quit();
    return;
  }

  createWindow(markdownFile);
});

app.on('window-all-closed', () => {
  app.quit();
});
