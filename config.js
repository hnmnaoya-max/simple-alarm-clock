// Supabase クライアント設定
//
// 1. https://supabase.com でプロジェクトを作成
// 2. Project Settings → API から URL と anon public key を取得
// 3. 下記の値を書き換える（anon key はクライアント公開前提のキーなのでGitに含めてOK。
//    ただし RLS（Row Level Security）を必ず有効化すること。supabase/schema.sql 参照）
// 4. Supabase の SQL Editor で supabase/schema.sql を実行

window.SUPABASE_CONFIG = {
  url: "YOUR_SUPABASE_URL",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
};
