# Simple Alarm Clock

シンプルなUIのアラームWebアプリ。

## 機能

- 現在時刻表示（時:分:秒）
- 任意の時刻にアラームをセット
- 設定時刻になるとブラウザ内でビープ音が鳴動
- ワンクリックで解除

## 使い方

`index.html` をブラウザで開くだけ。

```bash
open index.html
```

## 構成

- `index.html` — マークアップ
- `style.css` — スタイル
- `app.js` — ロジック（Web Audio API でビープ音生成、外部音源不要）

依存ゼロ。バニラHTML/CSS/JSのみ。
