# Aurora — Simple Alarm Clock

シンプルでスタイリッシュなUIのアラームWebアプリ。
Supabase認証でログインすると、アラーム鳴動の履歴をクラウド保存・参照可能。

**Live**: https://simple-alarm-clock-rosy.vercel.app/

## 機能

- 現在時刻表示（時:分 + 秒の円形プログレス）
- 任意の時刻にアラームをセット → 鳴動 + スヌーズ5分
- カウントダウン表示（"あと X時間XX分"）
- Supabase 認証（Email + Password）
- ログイン中は鳴動履歴を自動でクラウドに保存
- 履歴はSupabaseのRLSで本人のみ閲覧可能

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | マークアップ |
| `style.css` | スタイル（ダークテーマ + グラスモーフィズム） |
| `app.js` | アラーム + 認証 + 履歴ロジック |
| `config.js` | Supabase URL / anon key（要編集） |
| `supabase/schema.sql` | DBテーブル + RLSポリシー |

依存ゼロ（バニラHTML/CSS/JS + Supabase JS SDK CDN）。

## Supabase Setup

### 1. プロジェクト作成

[Supabase](https://supabase.com) で新規プロジェクト作成。

### 2. SQLでテーブル + RLS設定

Supabase ダッシュボード → SQL Editor で `supabase/schema.sql` の内容を実行。

これで `alarm_history` テーブルが作成され、RLS（Row Level Security）が有効化される。
**RLSが有効な状態では、ログインしたユーザーは自分の行しか select / insert / delete できない。**

### 3. 認証設定

Supabase ダッシュボード → Authentication → Providers → Email を有効化。

開発時は **Authentication → URL Configuration → Confirm email** をオフにすると、
サインアップ後すぐにログイン可能（本番運用時はオンにすること）。

### 4. URL と anon key を取得

Supabase ダッシュボード → Project Settings → API:
- **Project URL** → `config.js` の `url` に設定
- **anon public** key → `config.js` の `anonKey` に設定

> **anon key は公開前提のキー**。RLSが正しく設定されていれば、Gitに含めても安全。
> ただし `service_role` キーは絶対にクライアントに含めないこと。

### 5. デプロイ

`config.js` を編集 → コミット → プッシュ → Vercel が自動デプロイ。

```bash
git add config.js
git commit -m "Configure Supabase"
git push
```

## ローカル開発

```bash
# 任意のローカルサーバーで開く（file:// では一部機能が動かないため）
python3 -m http.server 8000
# → http://localhost:8000
```

## セキュリティ注意事項

- `service_role` キーは絶対にクライアントコード（`config.js` 等）に含めない
- 個人情報を保存するテーブルは必ず RLS を有効化する
- Supabase ダッシュボードで定期的にテーブルが Open（RLS無効）になっていないか確認
- 決済・メール配信などの重要処理は自作せず、専用サービス（Stripe, SendGrid等）を使う
