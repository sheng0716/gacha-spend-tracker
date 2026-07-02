-- ============================================================
-- 二游消费记录 — Supabase 数据库 schema
-- 在 Supabase 控制台 → SQL Editor 里粘贴并 Run 一次即可。
-- ============================================================

-- 主表：每一笔充值记录
create table if not exists public.purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  order_date    date not null,
  game          text not null,
  product_name  text,
  currency      text not null,                -- 原币种：JPY / TWD / KRW / MYR / USD ...
  cost          numeric not null,             -- 原币金额
  status        text,                         -- 可选：Ordered/Approved/Dispatched/Delivered
  rate          numeric,                      -- 1 单位外币 = ? MYR（采用的汇率；MYR 记 1）
  rate_source   text not null default 'auto', -- 'auto'=中间汇率 / 'manual'=手填
  myr           numeric not null,             -- 换算后的 MYR（= cost * rate，可手动覆盖）
  note          text,
  created_at    timestamptz not null default now()
);

-- 常用查询索引
create index if not exists purchases_user_date_idx
  on public.purchases (user_id, order_date desc);

-- ------------------------------------------------------------
-- 行级安全 (RLS)：每个账号只能看到/改自己的数据
-- ------------------------------------------------------------
alter table public.purchases enable row level security;

drop policy if exists "own_select" on public.purchases;
create policy "own_select" on public.purchases
  for select using (auth.uid() = user_id);

drop policy if exists "own_insert" on public.purchases;
create policy "own_insert" on public.purchases
  for insert with check (auth.uid() = user_id);

drop policy if exists "own_update" on public.purchases;
create policy "own_update" on public.purchases
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_delete" on public.purchases;
create policy "own_delete" on public.purchases
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 游戏与商品预设（管理后台用，选好游戏/商品后表单自动带出币种和价格）
-- ============================================================

create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name        text not null,
  logo_url    text,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists games_user_idx
  on public.games (user_id);

alter table public.games enable row level security;

drop policy if exists "own_select" on public.games;
create policy "own_select" on public.games
  for select using (auth.uid() = user_id);

drop policy if exists "own_insert" on public.games;
create policy "own_insert" on public.games
  for insert with check (auth.uid() = user_id);

drop policy if exists "own_update" on public.games;
create policy "own_update" on public.games
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_delete" on public.games;
create policy "own_delete" on public.games
  for delete using (auth.uid() = user_id);


create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  game_id     uuid not null references public.games (id) on delete cascade,
  name        text not null,
  currency    text not null,
  price       numeric not null,
  created_at  timestamptz not null default now(),
  unique (game_id, name)
);

create index if not exists products_game_idx
  on public.products (game_id);
create index if not exists products_user_idx
  on public.products (user_id);

alter table public.products enable row level security;

drop policy if exists "own_select" on public.products;
create policy "own_select" on public.products
  for select using (auth.uid() = user_id);

drop policy if exists "own_insert" on public.products;
create policy "own_insert" on public.products
  for insert with check (auth.uid() = user_id);

drop policy if exists "own_update" on public.products;
create policy "own_update" on public.products
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_delete" on public.products;
create policy "own_delete" on public.products
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 用户设置（目前只有亮色模式自定义背景图）
-- ============================================================

create table if not exists public.settings (
  user_id           uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  light_bg_url      text,
  light_bg_position integer not null default 50, -- 背景图垂直位置，0=顶部对齐，100=底部对齐
  updated_at        timestamptz not null default now()
);

-- 如果 settings 表已经存在（比如之前跑过没有这一列的版本），补上新列
alter table public.settings
  add column if not exists light_bg_position integer not null default 50;

alter table public.settings enable row level security;

drop policy if exists "own_select" on public.settings;
create policy "own_select" on public.settings
  for select using (auth.uid() = user_id);

drop policy if exists "own_insert" on public.settings;
create policy "own_insert" on public.settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "own_update" on public.settings;
create policy "own_update" on public.settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage: game-logos bucket
-- 先在 Supabase 控制台 → Storage 里手动创建一个名为 game-logos 的
-- bucket（Public bucket 开启），然后运行下面的 RLS。
-- 上传路径约定：{user_id}/{game_id}/{文件名}
-- ============================================================

drop policy if exists "game_logos_read" on storage.objects;
create policy "game_logos_read" on storage.objects
  for select using (bucket_id = 'game-logos');

drop policy if exists "game_logos_insert_own" on storage.objects;
create policy "game_logos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'game-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "game_logos_update_own" on storage.objects;
create policy "game_logos_update_own" on storage.objects
  for update using (
    bucket_id = 'game-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "game_logos_delete_own" on storage.objects;
create policy "game_logos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'game-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Storage: backgrounds bucket（亮色模式自定义背景图）
-- 先在 Supabase 控制台 → Storage 里手动创建一个名为 backgrounds 的
-- bucket（Public bucket 开启），然后运行下面的 RLS。
-- 上传路径约定：{user_id}/{文件名}
-- ============================================================

drop policy if exists "backgrounds_read" on storage.objects;
create policy "backgrounds_read" on storage.objects
  for select using (bucket_id = 'backgrounds');

drop policy if exists "backgrounds_insert_own" on storage.objects;
create policy "backgrounds_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'backgrounds'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "backgrounds_update_own" on storage.objects;
create policy "backgrounds_update_own" on storage.objects
  for update using (
    bucket_id = 'backgrounds'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "backgrounds_delete_own" on storage.objects;
create policy "backgrounds_delete_own" on storage.objects
  for delete using (
    bucket_id = 'backgrounds'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
