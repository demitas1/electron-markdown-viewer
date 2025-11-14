const { nativeTheme } = require('electron');
const path = require('path');

// テーマの種類
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'  // システム設定に従う
};

/**
 * テーマ管理クラス
 * ライト・ダークテーマの状態管理とシステム設定の検知を担当
 */
class ThemeManager {
  constructor() {
    this.currentTheme = THEMES.SYSTEM;  // デフォルトはシステム設定
    this.effectiveTheme = null;         // 実際に適用されるテーマ (light/dark)
  }

  /**
   * システムテーマを検知
   * @returns {string} 'light' または 'dark'
   */
  getSystemTheme() {
    return nativeTheme.shouldUseDarkColors ? THEMES.DARK : THEMES.LIGHT;
  }

  /**
   * 有効なテーマを解決
   * システム設定モードの場合は実際のシステム設定を返す
   * @returns {string} 'light' または 'dark'
   */
  resolveEffectiveTheme() {
    if (this.currentTheme === THEMES.SYSTEM) {
      return this.getSystemTheme();
    }
    return this.currentTheme;
  }

  /**
   * テーマを設定
   * @param {string} theme - 'light', 'dark', または 'system'
   */
  setTheme(theme) {
    if (!Object.values(THEMES).includes(theme)) {
      throw new Error(`無効なテーマ: ${theme}`);
    }
    this.currentTheme = theme;
    this.effectiveTheme = this.resolveEffectiveTheme();
  }

  /**
   * 現在有効なテーマを取得
   * @returns {string} 'light' または 'dark'
   */
  getEffectiveTheme() {
    if (!this.effectiveTheme) {
      this.effectiveTheme = this.resolveEffectiveTheme();
    }
    return this.effectiveTheme;
  }

  /**
   * 現在のテーマ設定を取得（ユーザーが選択したテーマ）
   * @returns {string} 'light', 'dark', または 'system'
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * テーマに応じたCSSファイルパスを取得
   * @param {string} baseDir - アプリケーションのベースディレクトリ
   * @returns {Object} markdown, highlight, bodyBgのパスと色
   */
  getThemeCssPaths(baseDir) {
    const effectiveTheme = this.getEffectiveTheme();

    if (effectiveTheme === THEMES.DARK) {
      return {
        markdown: path.join(baseDir, 'node_modules/github-markdown-css/github-markdown-dark.css'),
        highlight: path.join(baseDir, 'node_modules/highlight.js/styles/github-dark.css'),
        bodyBg: '#0d1117'  // GitHub dark background
      };
    } else {
      return {
        markdown: path.join(baseDir, 'node_modules/github-markdown-css/github-markdown-light.css'),
        highlight: path.join(baseDir, 'node_modules/highlight.js/styles/github.css'),
        bodyBg: '#ffffff'  // White background
      };
    }
  }
}

module.exports = {
  ThemeManager,
  THEMES
};
