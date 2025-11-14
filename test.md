# Markdown Viewer Test

## Features

This is a **GitHub-compatible** markdown viewer built with Electron.

### Supported Elements

- **Bold text**
- *Italic text*
- ~~Strikethrough~~
- `inline code`
- [Links](https://github.com)

### Code Blocks

```python
def hello_world():
    print("Hello, World!")
    return 42

if __name__ == "__main__":
    result = hello_world()
    print(f"Result: {result}")
```

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
```

### Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Syntax highlighting | ✅ | High |
| GitHub CSS | ✅ | High |
| Scrolling | ✅ | High |
| Auto-reload | ❌ | Low |

### Blockquotes

> This is a blockquote.
> 
> It can span multiple lines.

### Task Lists

- [x] Create Electron app
- [x] Add markdown parsing
- [x] Style with GitHub CSS
- [ ] Add file watching

### Horizontal Rule

---

### Images (if you have any)

![Alt text](https://via.placeholder.com/150)

## Mathematical Expressions

Inline math: $E = mc^2$

Block math:

$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$

## Mermaid Diagrams

### フローチャート

```mermaid
graph TD
    A[開始] --> B{条件分岐}
    B -->|Yes| C[処理1]
    B -->|No| D[処理2]
    C --> E[終了]
    D --> E
```

### シーケンス図

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: こんにちは Bob!
    Bob->>Alice: こんにちは Alice!
    Alice->>Bob: 元気ですか?
    Bob->>Alice: 元気です!
```

### ガントチャート

```mermaid
gantt
    title プロジェクトスケジュール
    dateFormat  YYYY-MM-DD
    section 設計
    要件定義           :a1, 2024-01-01, 7d
    基本設計           :a2, after a1, 10d
    section 開発
    実装               :a3, after a2, 20d
    テスト             :a4, after a3, 10d
```

### クラス図

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +boolean indoor
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

### 状態遷移図

```mermaid
stateDiagram-v2
    [*] --> 待機中
    待機中 --> 処理中: 開始
    処理中 --> 完了: 成功
    処理中 --> エラー: 失敗
    エラー --> 待機中: リトライ
    完了 --> [*]
```

### ER図

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER {
        int orderNumber
        string deliveryAddress
    }
    LINE-ITEM {
        string productCode
        int quantity
        float pricePerUnit
    }
```

## Conclusion

This viewer supports most GitHub Flavored Markdown features, including Mermaid diagrams!
