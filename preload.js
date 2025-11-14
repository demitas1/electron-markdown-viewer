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
