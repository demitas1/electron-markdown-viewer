# 画像表示テスト

このマークダウンファイルは、実際の画像ファイルを使用して画像表示機能のテストを行います。

## ローカル画像の表示

以下は実際のSVG画像です:

![テスト画像](./images/test.svg)

## Web画像の表示

以下はWeb上の画像です:

![Placeholder画像](https://via.placeholder.com/300x200/09f/fff.png?text=Web+Image)

## パス指定のテスト

### 1. サブディレクトリ内の画像
![サブディレクトリの画像](./images/test.svg)

### 2. タイトル付き画像
![Alt text](./images/test.svg "これはタイトルです")

## 複数の画像

![画像1](./images/test.svg)

![画像2](https://via.placeholder.com/200x150/f90/fff.png?text=Image+2)

## 説明

- ローカル画像はBase64エンコードされてData URLとして埋め込まれます
- Web画像はそのままURLが使用されます
- 画像が見つからない場合はaltテキストが表示されます
