const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preloadスクリプト
 * メインプロセスとレンダラープロセス間のIPC通信ブリッジを提供
 * contextIsolation: true のセキュリティを維持しながら安全にAPIを公開
 */

// テーマAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('themeAPI', {
  /**
   * テーマ変更イベントを監視
   * @param {Function} callback - テーマ変更時に呼ばれるコールバック関数
   */
  onThemeChange: (callback) => {
    ipcRenderer.on('theme:change', (event, data) => callback(data));
  }
});

// スクロール位置保存・復元APIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('scrollAPI', {
  /**
   * スクロール位置保存リクエストを受信
   * @param {Function} callback - 保存リクエスト時に呼ばれるコールバック関数
   */
  onSaveScroll: (callback) => {
    ipcRenderer.on('scroll:save', () => callback());
  },

  /**
   * スクロール位置をメインプロセスに送信
   * @param {number} position - スクロール位置（ピクセル）
   */
  sendScrollPosition: (position) => {
    ipcRenderer.send('scroll:saved', position);
  },

  /**
   * コンテンツ準備完了をメインプロセスに通知
   * Mermaid図のレンダリング完了後に呼び出す
   */
  notifyReady: () => {
    ipcRenderer.send('content:ready');
  },

  /**
   * スクロール復元リクエストを受信
   * @param {Function} callback - 復元リクエスト時に呼ばれるコールバック関数（positionを引数に受け取る）
   */
  onRestoreScroll: (callback) => {
    ipcRenderer.on('scroll:restore', (event, position) => callback(position));
  }
});
