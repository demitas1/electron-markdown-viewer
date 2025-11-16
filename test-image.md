# 画像表示テスト

このマークダウンファイルは、画像表示機能のテストを行います。

## 相対パスでの画像表示

以下は相対パスでの画像表示のテストです:

```markdown
![alt](./path/to/image.jpg)
```

## 異なるパスパターン

### 1. 同じディレクトリ内の画像
```markdown
![テスト画像](./image.png)
```

### 2. サブディレクトリ内の画像
```markdown
![サブディレクトリの画像](./images/test.png)
```

### 3. 親ディレクトリの画像
```markdown
![親ディレクトリの画像](../image.jpg)
```

### 4. 絶対パスの画像
```markdown
![絶対パス](/absolute/path/to/image.png)
```

### 5. HTTPSのURL
```markdown
![Web画像](https://example.com/image.png)
```

### 6. タイトル付き画像
```markdown
![Alt text](./image.png "これはタイトルです")
```

## 実際の画像テスト

実際に画像ファイルが存在する場合、以下のように表示されます:

![PlaceholderイメージURL](https://via.placeholder.com/300x200/09f/fff.png?text=Test+Image)

## 注意事項

- 相対パスの画像を表示するには、マークダウンファイルと同じディレクトリまたはそのサブディレクトリに画像ファイルが必要です
- サポートされる画像形式: PNG, JPG, JPEG, GIF, SVG, WebP
- 画像がfile://プロトコルで正しく読み込まれます
