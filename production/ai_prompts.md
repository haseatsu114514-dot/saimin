# AIプロンプト集（台本・画像生成）

ChatGPT（またはClaude 3等）を使って催眠音声の台本を効率的に出力させるためのプロンプトの「型」、およびサムネイル用の画像生成プロンプト集。

---

## 📝 催眠台本生成用プロンプト

このプロンプトをそのままChatGPT等のAIに貼り付け、要件の `[ ]` 部分を書き換えて出力させる。
出力されたものをそのまま使うのではなく、必ず【自分で声に出して読んで微調整】すること。

```text
あなたは世界で最も熟練した「ヒプノセラピスト（催眠療法士）」です。
「声の持つ癒やしの力」と「言葉のメタファー」を巧みに使い、リスナーを深いリラックス状態へ導く音声の台本を作成してください。

以下の要件に従い、催眠誘導のスクリプト（台本）を書いてください。

### 【依頼内容の設定】
・テーマ：[考えすぎを手放す / 自己肯定感を高める / ぐっすり眠る 等]
・ターゲット層：[日々のストレスで頭がいっぱいの30代〜40代 等]
・想定録音時間：約 [30] 分
・深化のテクニック：[階段を降りる / 温かい光に包まれる / 海に潜る 等]

### 【構成の必須ルール（4ステップ）】
以下の4つのステップを明確に分けて記述してください。
1. 導入（Induction）：日常の意識から切り離し、深呼吸と身体の弛緩を促す。
2. 深化（Deepening）：上の「深化のテクニック」を使い、さらに深いトランス状態へ導く。
3. 暗示（Suggestion）：テーマに沿ったポジティブな暗示を入れる。具体的なメタファー（川に葉を流す、光を吸い込む等）を使うこと。
4. 覚醒（Awakening）：1から5まで数え、日常の意識へすっきりと戻す（※睡眠導入がテーマの場合は覚醒させず、そのまま眠りへ導く指示にする）。

### 【言葉の選び方のルール】
・「〜しないでください」「〜が消えますように」などの【否定語】は絶対に使わないこと。「〜を手放すことができます」「〜という安心感が広がります」など、必ず【肯定的な表現】に変換してください。
・「大丈夫？」といった不安を煽りかねない表現は避けてください。
・語尾は「〜してください」「〜してみましょう」「〜していきます」など、柔らかく穏やかに。
・音声として読み上げるため、文は短く切り、リスナーがイメージを膨らませるための「間（沈黙）」を入れる箇所には「（…間…）」と明記してください。

それでは、最も深く、最も心地よい台本を出力してください。
```

---

## 🖼️ サムネイル画像生成プロンプト（Midjourney / DALL-E 3等用）

AIによる画像生成は「英語で指示を出す」「人物や文字を入れない」のが鉄則。

### 基本設定（全プロンプトの末尾につけると安定する魔法のワード）
> `, no text, no people, landscape orientation 16:9, dark moody atmosphere, highly detailed, 4k, cinematic lighting`

### 1. 安眠・睡眠導入系
星空、月、穏やかな夜のイメージ。

> `dreamy starry night sky, soft purple and navy gradient, glowing full moon reflecting on calm ocean water, ethereal light, peaceful and serene atmosphere` + 基本設定

### 2. メンタルケア系（癒し・浄化）
静かな森、光の差し込む川、オーロラなどのイメージ。

> `serene gentle river flowing through a misty magical forest, glowing fireflies, golden light filtering through ancient trees, meditative and calming environment` + 基本設定

### 3. 意識探索系（前世・ハイヤーセルフ）
回廊、扉、宇宙の神秘などのイメージ。

> `mystical endless corridor with glowing ethereal doors, ancient temple architecture, indigo and gold lighting, spiritual journey, surreal cosmic background` + 基本設定

### 4. ASMR的アプローチ（シャッフル睡眠など脳の休息）
抽象的な波紋、柔らかい光のグラデーションのイメージ。

> `abstract soft glowing orbs floating in dark space, gentle ripples in calm water, smooth gradient of deep blue and violet, relaxing visual, minimalist` + 基本設定
