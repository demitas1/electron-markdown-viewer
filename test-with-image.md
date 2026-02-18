# 画像表示テスト

このマークダウンファイルは、マークダウン記法と `<img>` タグ両方の画像表示機能をテストします。

---

## 1. マークダウン記法（従来）

### シンプルなローカル画像

![テスト画像 SVG](./images/test.svg)

### PNGファイル

![テスト画像 PNG](./images/test.png)

### タイトル付き

![Alt text](./images/test.svg "これはタイトルです")

### Web画像

![Placeholder画像](https://via.placeholder.com/300x200/09f/fff.png?text=Web+Image)

---

## 2. `<img>` タグ記法（新規対応）

### シンプルなローカル画像

<img src="./images/test.svg">

### PNGファイル

<img src="./images/test.png">

### style属性でサイズ指定（width / height）

<img src="./images/test.svg" style="width: 200px; height: 200px;">

### style属性で最大幅指定

<img src="./images/test.png" style="max-width: 150px;">

### width / height 属性で指定

<img src="./images/test.svg" width="120" height="120">

### alt・title属性付き

<img src="./images/test.png" alt="テスト画像" title="これはimgタグのタイトルです" style="width: 180px;">

### self-closing形式

<img src="./images/test.svg" style="width: 100px;" />

### Web画像（変換なし・そのまま使用）

<img src="https://via.placeholder.com/300x200/f90/fff.png?text=img+tag" style="border: 2px solid gray;">

---

## 3. 説明

| 記法 | ローカル画像 | サイズ指定 |
|------|-------------|-----------|
| マークダウン `![alt](src)` | Base64変換 | 非対応 |
| `<img>` タグ | Base64変換 | style / width / height 属性を保持 |

- ローカル画像はいずれの記法でも Base64 エンコードされ Data URL として埋め込まれます
- `<img>` タグは `style`・`width`・`height` など全属性をそのまま保持します
- `http://`、`https://`、`data:` で始まる src は変換をスキップします
- 画像が見つからない場合は alt テキストが表示されます
