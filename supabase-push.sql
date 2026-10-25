-- Chạy bổ sung trong Supabase SQL Editor để bật Web Push trên Vercel.
-- Các bảng này chỉ được truy cập bằng SUPABASE_SERVICE_ROLE_KEY ở API server.

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_ranking_state (
  key text primary key,
  signature text not null,
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
alter table public.push_ranking_state enable row level security;

revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.push_ranking_state from anon, authenticated;
grant all on public.push_subscriptions to service_role;
grant all on public.push_ranking_state to service_role;
