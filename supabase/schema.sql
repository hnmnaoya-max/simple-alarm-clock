-- Supabase SQL Editor で実行
-- アラーム履歴テーブル + RLS（Row Level Security）設定
-- ※ RLS を必ず有効化することで、ユーザーは自分のデータしか見えない・書き込めない状態を保つ

-- 1. テーブル作成
create table if not exists public.alarm_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  alarm_time text not null,
  triggered_at timestamptz default now() not null
);

create index if not exists alarm_history_user_idx
  on public.alarm_history (user_id, triggered_at desc);

-- 2. RLS 有効化
alter table public.alarm_history enable row level security;

-- 3. ポリシー（自分の行のみ操作可能）
drop policy if exists "select own history" on public.alarm_history;
create policy "select own history"
  on public.alarm_history for select
  using (auth.uid() = user_id);

drop policy if exists "insert own history" on public.alarm_history;
create policy "insert own history"
  on public.alarm_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "delete own history" on public.alarm_history;
create policy "delete own history"
  on public.alarm_history for delete
  using (auth.uid() = user_id);
