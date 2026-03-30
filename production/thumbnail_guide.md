# サムネイル・パッケージ画像 制作ガイド

## サムネイルの重要性

YouTubeではサムネイルのクリック率（CTR）が動画の成長を左右する。催眠音声ジャンルのサムネイルは以下を意識する。

---

## デザイン方針

### カラーパレット

催眠・睡眠・リラックスのイメージに合う色：

| 色 | 用途 | hex例 |
|---|---|---|
| ダークネイビー | 背景メイン | #0a1628 |
| ディープパープル | 背景・アクセント | #2d1b69 |
| ソフトブルー | 光・ハイライト | #6bb5ff |
| ゴールド | テキストアクセント | #ffd700 |
| ホワイト | テキスト | #ffffff |

> 明るすぎる色は避ける。暗く落ち着いた色調が催眠ジャンルの定番。

### フォント

| 用途 | 推奨フォント | 備考 |
|---|---|---|
| メインタイトル | Noto Sans JP Bold / 源ノ角ゴシック Bold | 視認性重視 |
| サブタイトル | Noto Serif JP / 源ノ明朝 | 高級感・落ち着き |
| 英字 | Montserrat / Playfair Display | ブランド名等 |

### レイアウトパターン

**パターンA：中央配置型**
```
┌──────────────────────────────┐
│                              │
│    [AI生成イメージ画像]       │
│                              │
│    ── テーマタイトル ──       │
│    サブタイトル               │
│                              │
└──────────────────────────────┘
```

**パターンB：左右分割型**
```
┌──────────────────────────────┐
│              │               │
│   テーマ     │  [イメージ    │
│   タイトル   │   画像]       │
│              │               │
│   サブ情報   │               │
└──────────────────────────────┘
```

---

## AI画像生成

### ツール

| ツール | 特徴 | 価格 |
|---|---|---|
| Midjourney | 高品質、アート寄り | 月$10〜 |
| Stable Diffusion（ローカル） | 無料、カスタマイズ自由 | 無料（GPU必要） |
| DALL-E 3 | ChatGPT経由で手軽 | ChatGPT Plus内 |
| Leonardo AI | 無料枠あり | 無料〜 |

### プロンプト例

```
テーマ別の画像生成プロンプト（英語推奨）：

【安眠系】
"dreamy starry night sky, soft purple and navy gradient, 
ethereal moonlight, peaceful atmosphere, 
digital art, high quality, 4k"

【メンタルケア系】
"serene river flowing through misty forest, 
leaves floating on water, golden light filtering through trees, 
meditative atmosphere, digital painting, 4k"

【前世退行系】
"mystical corridor with glowing doors, 
ancient temple atmosphere, golden and purple light, 
spiritual journey, digital art, cinematic, 4k"

【共通の追加指示】
"no text, no people, landscape orientation 16:9, 
dark moody atmosphere, high resolution"
```

---

## Canvaでのサムネイル制作手順

1. **新規デザイン**: YouTubeサムネイル（1280×720px）
2. **背景**: AI生成画像を配置（全面 or 半面）
3. **テキスト**: テーマタイトルを大きく配置
4. **調整**: 暗めのオーバーレイを追加（テキストの視認性確保）
5. **エクスポート**: PNG形式で保存

### テキスト配置のルール

- タイトルは **3行以内**（長いと読めない）
- フォントサイズは **画面の1/5以上** を占める大きさ
- コントラストを確保（暗い背景に明るいテキスト）
- 右下にチャンネルロゴ（小さく）

---

## サムネイルの一貫性

シリーズ（柱）ごとにデザインテンプレートを統一する：

| シリーズ | カラー | アイコン/モチーフ |
|---|---|---|
| 安眠・睡眠導入 | ネイビー＋ブルー | 月、星空、雲 |
| メンタルケア | パープル＋ゴールド | 光、水、森 |
| 意識探索 | ディープブルー＋ゴールド | 扉、回廊、宇宙 |

---

## BOOTH/DLsite用パッケージ画像

- サイズ：各プラットフォームの規定に従う
- サムネイルよりも情報量を多くしてOK（タイトル、時間、内容説明）
- R18でないことが明確にわかるデザイン

---

## TODO

- [ ] チャンネルロゴのデザイン
- [ ] 各シリーズのサムネイルテンプレートをCanvaで作成
- [ ] AI画像の生成テスト（各テーマ3パターンずつ）
- [ ] サムネイルA/Bテスト用のバリエーション準備
