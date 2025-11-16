const chokidar = require('chokidar');
const EventEmitter = require('events');

/**
 * ファイル監視クラス
 * マークダウンファイルの変更を監視し、イベントを発火する
 * SOLID原則: 単一責任の原則に基づき、ファイル監視のみを担当
 */
class FileWatcher extends EventEmitter {
  /**
   * @param {Object} options - 設定オプション
   * @param {number} options.debounceDelay - デバウンス遅延（ミリ秒）デフォルト: 300ms
   */
  constructor(options = {}) {
    super();

    this.debounceDelay = options.debounceDelay || 300;
    this.watcher = null;
    this.currentFilePath = null;
    this.debounceTimer = null;
  }

  /**
   * ファイル監視を開始
   * @param {string} filePath - 監視対象のファイルパス
   */
  watch(filePath) {
    // 既存の監視を停止
    this.unwatch();

    this.currentFilePath = filePath;

    // chokidarでファイルを監視
    this.watcher = chokidar.watch(filePath, {
      persistent: true,
      ignoreInitial: true,  // 初期スキャンのイベントを無視
      awaitWriteFinish: {
        stabilityThreshold: 100,  // ファイル書き込みが安定するまで待つ
        pollInterval: 100
      }
    });

    // ファイル変更イベント
    this.watcher.on('change', (path) => {
      this._handleChange(path);
    });

    // ファイル削除イベント
    this.watcher.on('unlink', (path) => {
      this.emit('unlink', path);
    });

    // ファイル追加イベント（削除後の再作成を検知）
    this.watcher.on('add', (path) => {
      this.emit('add', path);
      // 再作成後も変更として扱う
      this._handleChange(path);
    });

    // エラーハンドリング
    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });

    this.emit('ready', filePath);
  }

  /**
   * ファイル変更ハンドラ（デバウンス処理）
   * @private
   * @param {string} path - 変更されたファイルパス
   */
  _handleChange(path) {
    // 既存のタイマーをクリア
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // デバウンス処理: 指定時間内の連続した変更を1つのイベントにまとめる
    this.debounceTimer = setTimeout(() => {
      this.emit('change', path);
      this.debounceTimer = null;
    }, this.debounceDelay);
  }

  /**
   * ファイル監視を停止
   */
  unwatch() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.currentFilePath = null;
  }

  /**
   * 監視対象ファイルを変更
   * @param {string} newFilePath - 新しい監視対象ファイルパス
   */
  changeFile(newFilePath) {
    this.watch(newFilePath);
  }

  /**
   * 現在監視中のファイルパスを取得
   * @returns {string|null} ファイルパス、または監視していない場合はnull
   */
  getCurrentFile() {
    return this.currentFilePath;
  }

  /**
   * 監視中かどうかを確認
   * @returns {boolean} 監視中の場合true
   */
  isWatching() {
    return this.watcher !== null;
  }
}

module.exports = { FileWatcher };
