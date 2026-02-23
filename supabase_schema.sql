-- ============================================================
-- DiGital InvWOrker v2 - Complete Supabase SQL Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id              uuid references auth.users on delete cascade primary key,
  email           text,
  username        text,
  whatsapp        text,
  balance         numeric default 0,           -- DGC Coins
  tk_balance      numeric default 0,           -- BDT Wallet
  is_verified     boolean default false,
  is_admin        boolean default false,
  ad_boost_until  timestamptz,
  referred_by     uuid references profiles(id) on delete set null,
  referral_code   text unique,
  last_checkin_at timestamptz,
  created_at      timestamptz default now()
);

alter table profiles enable row level security;
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update" on profiles;
create policy "profiles_update" on profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert" on profiles;
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
-- Admin can read all profiles
drop policy if exists "admin_select_all_profiles" on profiles;
create policy "admin_select_all_profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
drop policy if exists "admin_update_all_profiles" on profiles;
create policy "admin_update_all_profiles" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

create or replace function trg_initialize_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Ensure balance starts at 7200 (matching AuthContext requirements) 
  -- and is_admin starts as false, regardless of what is sent in the insert.
  new.balance    := 7200;
  new.is_admin   := false;
  return new;
end;
$$;

drop trigger if exists trg_on_profile_create on profiles;
create trigger trg_on_profile_create
  before insert on profiles
  for each row execute function trg_initialize_profile();

-- ─────────────────────────────────────────────────────────────
-- 2. ASSETS CONFIG TABLE (Admin-controlled)
-- ─────────────────────────────────────────────────────────────
create table if not exists assets_config (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  description     text,
  price_coins     numeric not null,           -- price in coins (e.g. 7200 = 10 BDT)
  monthly_roi     numeric not null default 6, -- monthly ROI percentage (e.g. 6 = 6%)
  maintenance_fee   numeric not null default 1,     -- worker monthly rent cost %
  investor_roi      numeric not null default 2,     -- investor fixed % (Part A)
  worker_gross_gen  numeric not null default 6,     -- worker monthly gross % (Part B)
  icon              text default '🛺',
  is_active         boolean default true,
  duration_days     int default 90,                 -- depreciation duration
  sort_order        int default 0,
  created_at        timestamptz default now()
);

-- Ensure columns exist if table was already created without it
alter table assets_config add column if not exists worker_gross_gen numeric not null default 6;
alter table assets_config add column if not exists investor_roi numeric not null default 2;
alter table assets_config add column if not exists sort_order int default 0;

-- Optional: Clear old/broken entries to ensure a fresh shop state
-- truncate table assets_config cascade;

alter table assets_config enable row level security;
-- Everyone can read active assets
drop policy if exists "assets_config_select" on assets_config;
create policy "assets_config_select" on assets_config for select using (is_active = true);
-- Only admins can modify
drop policy if exists "assets_config_admin_all" on assets_config;
create policy "assets_config_admin_all" on assets_config for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Insert default assets
insert into assets_config (name, description, price_coins, monthly_roi, worker_gross_gen, maintenance_fee, duration_days, icon, sort_order, is_active)
values 
('Riksha', 'Starter asset. Low maintenance.', 7200, 6, 8, 2, 30, '🛺', 1, true),
('CNG', 'Middle-tier transport.', 36000, 10, 12, 3, 30, '🛗', 2, true),
('Truck', 'Heavy-duty earner.', 72000, 12, 15, 3, 30, '🚚', 3, true),
('Excavator', 'High-end mining asset.', 360000, 15, 20, 5, 45, '🏗️', 4, true)
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- 3. USER ASSETS TABLE
-- ─────────────────────────────────────────────────────────────
create table if not exists user_assets (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references profiles(id) on delete cascade not null,
  asset_id            uuid references assets_config(id) on delete restrict not null,
  last_collected_at   timestamptz default now(),
  status              text default 'active' check (status in ('active', 'paused', 'expired')),
  health              int default 100,
  type                text default 'worker' check (type in ('worker', 'investor')), -- Part A or Part B
  release_date        timestamptz, -- Date when investor capital + ROI is released
  purchased_at        timestamptz default now()
);

alter table user_assets enable row level security;
drop policy if exists "user_assets_select" on user_assets;
create policy "user_assets_select" on user_assets for select using (auth.uid() = user_id);
drop policy if exists "user_assets_insert" on user_assets;
-- Disabled for security: assets must be purchased via buy_asset() RPC
-- create policy "user_assets_insert" on user_assets for insert with check (auth.uid() = user_id);
drop policy if exists "user_assets_update" on user_assets;
create policy "user_assets_update" on user_assets for update using (auth.uid() = user_id);
drop policy if exists "admin_assets_all" on user_assets;
create policy "admin_assets_all" on user_assets for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ─────────────────────────────────────────────────────────────
-- 4. TRANSACTIONS TABLE
-- ─────────────────────────────────────────────────────────────
create table if not exists transactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  amount      numeric not null,
  trx_id      text,                           -- bKash/payment reference
  type        text check (type in ('deposit', 'withdraw', 'referral_bonus', 'maintenance', 'purchase', 'collection', 'repair', 'daily_reward')),
  status      text default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  note        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table transactions enable row level security;
drop policy if exists "trx_select_own" on transactions;
create policy "trx_select_own"  on transactions for select using (auth.uid() = user_id);
drop policy if exists "trx_insert_own" on transactions;
-- Disabled for security: transactions are recorded by the system via RPCs
-- create policy "trx_insert_own"  on transactions for insert with check (auth.uid() = user_id);
drop policy if exists "admin_trx_all" on transactions;
create policy "admin_trx_all"   on transactions for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ─────────────────────────────────────────────────────────────
-- 5. OWNER VAULT TABLE
-- ─────────────────────────────────────────────────────────────
create table if not exists owner_vault (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references profiles(id) on delete cascade,
  user_asset_id         uuid references user_assets(id) on delete set null,
  gap_coins             numeric default 0,    -- coins earned from user's missed time
  maintenance_coins     numeric default 0,
  collected_at          timestamptz default now()
);

alter table owner_vault enable row level security;
drop policy if exists "owner_vault_admin_only" on owner_vault;
create policy "owner_vault_admin_only" on owner_vault for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ─────────────────────────────────────────────────────────────
-- 6. SERVER-SIDE FUNCTION: collect_income
--    Handles the 24h cap logic securely on the server
-- ─────────────────────────────────────────────────────────────
create or replace function collect_income(p_user_asset_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id         uuid;
  v_asset_id        uuid;
  v_monthly_roi     numeric;
  v_price_coins     numeric;
  v_ad_boost_until  timestamptz;
  v_last_collected  timestamptz;
  v_seconds_elapsed numeric;
  v_cap_seconds     numeric := 86400; -- 24 hours
  v_rate_per_sec    numeric;
  v_user_coins      numeric;
  v_gap_coins       numeric;
  v_new_balance     numeric;
begin
  -- Get user asset info
  select ua.user_id, ua.asset_id, ua.last_collected_at
  into v_user_id, v_asset_id, v_last_collected
  from user_assets ua
  where ua.id = p_user_asset_id and ua.status = 'active' and ua.type = 'worker';

  if not found then
    return json_build_object('success', false, 'error', 'Asset not found or inactive');
  end if;

  -- Security: ensure caller is the owner
  if v_user_id != auth.uid() then
    return json_build_object('success', false, 'error', 'Unauthorized');
  end if;

  -- Get asset config
  declare
    v_worker_gross numeric;
  begin
    select price_coins, monthly_roi, worker_gross_gen
    into v_price_coins, v_monthly_roi, v_worker_gross
    from assets_config
    where id = v_asset_id;

    -- Use worker_gross_gen if available, otherwise fallback to monthly_roi
    v_monthly_roi := coalesce(v_worker_gross, v_monthly_roi, 6);
  end;

  -- Calculate seconds elapsed
  v_seconds_elapsed := extract(epoch from (now() - v_last_collected));

  -- Calculate rate per second: price * monthly_roi% / 30 days / 86400 seconds
  v_rate_per_sec := v_price_coins * (v_monthly_roi / 100.0) / 30.0 / 86400.0;

  -- Apply Flash Sale Bonus from user_assets
  declare
    v_bonus_percent numeric;
  begin
    select bonus_income_percent into v_bonus_percent from user_assets where id = p_user_asset_id;
    if v_bonus_percent > 0 then
      v_rate_per_sec := v_rate_per_sec * (1.0 + (v_bonus_percent / 100.0));
    end if;
  end;

  -- Apply 24h cap
  v_user_coins := v_rate_per_sec * least(v_seconds_elapsed, v_cap_seconds);
  v_gap_coins  := v_rate_per_sec * greatest(0, v_seconds_elapsed - v_cap_seconds);

  -- Update user balance
  update profiles
  set balance = balance + v_user_coins
  where id = v_user_id
  returning balance into v_new_balance;

  -- Update last_collected_at
  update user_assets
  set last_collected_at = now()
  where id = p_user_asset_id;

  -- Record collection transaction
  insert into transactions (user_id, amount, type, status, note)
  values (v_user_id, v_user_coins, 'collection', 'completed', 'Auto-collected from asset');

  -- If gap coins > 0, record in owner vault
  if v_gap_coins > 0 then
    insert into owner_vault (user_id, user_asset_id, gap_coins)
    values (v_user_id, p_user_asset_id, v_gap_coins);
  end if;

  return json_build_object(
    'success',      true,
    'user_coins',   round(v_user_coins::numeric, 2),
    'gap_coins',    round(v_gap_coins::numeric, 2),
    'new_balance',  round(v_new_balance::numeric, 2),
    'elapsed_hrs',  round((v_seconds_elapsed / 3600)::numeric, 1)
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 7. SERVER-SIDE FUNCTION: buy_asset
-- ─────────────────────────────────────────────────────────────
create or replace function buy_asset(p_asset_id uuid, p_type text default 'worker')
returns json
language plpgsql
security definer
as $$
declare
  v_user_id     uuid := auth.uid();
  v_price       numeric;
  v_balance     numeric;
  v_asset_name  text;
  v_flash_active boolean;
  v_discount    numeric;
  v_bonus       numeric;
  v_ends_at     timestamptz;
  v_final_price numeric;
begin
  select price_coins, name into v_price, v_asset_name
  from assets_config where id = p_asset_id and is_active = true;

  if not found then
    return json_build_object('success', false, 'error', 'Asset not available');
  end if;

  -- Flash Sale Logic
  v_final_price := v_price;
  v_bonus := 0;
  
  select flash_sale_active, flash_sale_discount, flash_sale_bonus, flash_sale_ends_at 
  into v_flash_active, v_discount, v_bonus, v_ends_at
  from system_settings where id = 1;

  if found and v_flash_active = true and v_ends_at > now() then
    v_final_price := v_price - (v_price * (v_discount / 100.0));
  else
    v_bonus := 0; -- reset bonus if sale expired
  end if;

  select balance into v_balance from profiles where id = v_user_id;

  if v_balance < v_final_price then
    return json_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Deduct coins
  update profiles set balance = balance - v_final_price where id = v_user_id;

  -- Create user asset with bonus if applicable
  declare
    v_duration int;
  begin
    select duration_days into v_duration from assets_config where id = p_asset_id;
    v_duration := coalesce(v_duration, 30);

    insert into user_assets (user_id, asset_id, bonus_income_percent, type, release_date) 
    values (v_user_id, p_asset_id, v_bonus, p_type, (case when p_type = 'investor' then now() + (v_duration || ' days')::interval else null end));
  end;

  -- Record transaction
  insert into transactions (user_id, amount, type, status, note)
  values (v_user_id, -v_final_price, 'purchase', 'completed', 'Purchased: ' || v_asset_name || (case when v_bonus > 0 then ' (Flash Sale 🎉)' else '' end));

  return json_build_object('success', true, 'message', 'Asset purchased successfully!');
end;
$$;


-- ─────────────────────────────────────────────────────────────
-- 9. REFERRAL FUNCTION
-- ─────────────────────────────────────────────────────────────
create or replace function process_referral(p_new_user_id uuid, p_referral_code text)
returns void
language plpgsql
security definer
as $$
declare
  v_referrer_id uuid;
  v_bonus       numeric := 720;
begin
  select id into v_referrer_id
  from profiles where referral_code = p_referral_code;

  if v_referrer_id is not null and v_referrer_id != p_new_user_id then
    -- Update new user's referred_by
    update profiles set referred_by = v_referrer_id where id = p_new_user_id;
    -- Note: Bonus is given via trg_user_verification trigger when admin verifies account
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 11. REFERRAL BONUS TRIGGER (When user is_verified becomes true)
-- ─────────────────────────────────────────────────────────────
create or replace function trg_handle_user_verification()
returns trigger
language plpgsql
security definer
as $$
declare
  v_bonus_val   numeric;
  v_referrer_l1 uuid;
  v_referrer_l2 uuid;
  v_referrer_l3 uuid;
begin
  -- If user was NOT verified and now IS verified
  if (old.is_verified = false and new.is_verified = true) then
    
    -- Get dynamic base bonus value from settings
    select referral_bonus_value into v_bonus_val from system_settings where id = 1;
    v_bonus_val := coalesce(v_bonus_val, 720);

    -- LEVEL 1 BONUS (100% of bonus_val)
    v_referrer_l1 := new.referred_by;
    if v_referrer_l1 is not null then
      -- Admin Check: If the inviter is an Admin, no commission is paid
      if not exists (select 1 from profiles where id = v_referrer_l1 and is_admin = true) then
        update profiles set balance = balance + v_bonus_val where id = v_referrer_l1;
        insert into transactions (user_id, amount, type, status, note)
        values (v_referrer_l1, v_bonus_val, 'referral_bonus', 'completed', 'L1 Bonus for verifying ' || new.username);

        -- LEVEL 2 BONUS (5% of bonus_val)
        select referred_by into v_referrer_l2 from profiles where id = v_referrer_l1;
        if v_referrer_l2 is not null then
          if not exists (select 1 from profiles where id = v_referrer_l2 and is_admin = true) then
             update profiles set balance = balance + (v_bonus_val * 0.05) where id = v_referrer_l2;
             insert into transactions (user_id, amount, type, status, note)
             values (v_referrer_l2, (v_bonus_val * 0.05), 'referral_bonus', 'completed', 'L2 Bonus for verifying ' || new.username);

             -- LEVEL 3 BONUS (2% of bonus_val)
             select referred_by into v_referrer_l3 from profiles where id = v_referrer_l2;
             if v_referrer_l3 is not null then
               if not exists (select 1 from profiles where id = v_referrer_l3 and is_admin = true) then
                 update profiles set balance = balance + (v_bonus_val * 0.02) where id = v_referrer_l3;
                 insert into transactions (user_id, amount, type, status, note)
                 values (v_referrer_l3, (v_bonus_val * 0.02), 'referral_bonus', 'completed', 'L3 Bonus for verifying ' || new.username);
               end if;
             end if;
          end if;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_verification on profiles;
create trigger trg_user_verification
  after update of is_verified on profiles
  for each row execute function trg_handle_user_verification();

-- ─────────────────────────────────────────────────────────────
-- 12. REFINED DAILY MAINTENANCE (Run this via Supabase Cron)
-- ─────────────────────────────────────────────────────────────
create or replace function run_daily_maintenance()
returns void
language plpgsql
security definer
as $$
declare
  r record;
  v_fee numeric;
  v_new_health int;
begin
  for r in 
    select ua.id as ua_id, ua.user_id, ua.health, ua.purchased_at, ac.price_coins, ac.name, ac.duration_days, ac.maintenance_fee
    from user_assets ua
    join assets_config ac on ac.id = ua.asset_id
    where ua.status = 'active'
    and ua.type = 'worker'
  loop
    -- Check expiration first
    if r.purchased_at < now() - (r.duration_days || ' days')::interval then
      update user_assets set status = 'expired' where id = r.ua_id;
      continue;
    end if;
    -- Fee: (Asset Price * Maintenance Fee% / 30 days)
    v_fee := (r.price_coins * (r.maintenance_fee / 100.0)) / 30;
    
    -- Deduct from user
    update profiles set balance = greatest(0, balance - v_fee) where id = r.user_id;

    -- Send to owner vault
    insert into owner_vault (user_id, user_asset_id, maintenance_coins)
    values (r.user_id, r.ua_id, v_fee);

    -- Log transaction
    insert into transactions (user_id, amount, type, status, note)
    values (r.user_id, -v_fee, 'maintenance', 'completed', 'Daily maintenance for ' || r.name);

    -- Decrease Health
    v_new_health := greatest(0, r.health - 5);
    update user_assets set health = v_new_health where id = r.ua_id;

    if v_new_health = 0 then
      update user_assets set status = 'paused' where id = r.ua_id;
    end if;

  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 13. ADMIN HELPER: increment_balance
-- ─────────────────────────────────────────────────────────────
create or replace function increment_balance(p_user_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Unauthorized';
  end if;

  update profiles
  set balance = balance + p_amount
  where id = p_user_id;
end;
$$;

create or replace function increment_tk_balance(p_user_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Unauthorized';
  end if;

  update profiles
  set tk_balance = coalesce(tk_balance, 0) + p_amount
  where id = p_user_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 14. SERVER-SIDE FUNCTION: repair_asset
-- ─────────────────────────────────────────────────────────────
create or replace function repair_asset(p_user_asset_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id     uuid := auth.uid();
  v_asset_id    uuid;
  v_price       numeric;
  v_balance     numeric;
  v_repair_cost numeric;
  v_health      int;
  v_status      text;
begin
  -- Get user asset details
  select user_id, asset_id, health, status
  into v_user_id, v_asset_id, v_health, v_status
  from user_assets where id = p_user_asset_id;

  if not found then
    return json_build_object('success', false, 'error', 'Asset not found');
  end if;

  if v_user_id != auth.uid() then
    return json_build_object('success', false, 'error', 'Unauthorized');
  end if;

  if v_health = 100 then
    return json_build_object('success', false, 'error', 'Asset is already at full health');
  end if;

  -- Get asset price
  select price_coins into v_price
  from assets_config where id = v_asset_id;

  -- Repair cost = 10% of total price
  v_repair_cost := v_price * 0.10;

  select balance into v_balance from profiles where id = v_user_id;

  if v_balance < v_repair_cost then
    return json_build_object('success', false, 'error', 'Insufficient balance for repair');
  end if;

  -- Deduct repair cost
  update profiles set balance = balance - v_repair_cost where id = v_user_id;

  -- Restore health and status
  update user_assets set health = 100, status = 'active' where id = p_user_asset_id;

  -- Record transaction
  insert into transactions (user_id, amount, type, status, note)
  values (v_user_id, -v_repair_cost, 'repair', 'completed', 'Repaired asset');

  return json_build_object('success', true, 'message', 'Asset repaired to 100% health!');
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 15. SERVER-SIDE FUNCTION: daily_checkin
-- ─────────────────────────────────────────────────────────────
create or replace function daily_checkin()
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_checkin timestamptz;
  v_reward numeric := 0; 
  v_daily_income numeric := 0;
begin
  select last_checkin_at into v_last_checkin from profiles where id = v_user_id;

  -- If user already checked in within the last 24 hours
  if v_last_checkin is not null and v_last_checkin > now() - interval '24 hours' then
    return json_build_object('success', false, 'error', 'Already checked in today. Please return later.');
  end if;

  -- Reward is a flat 2 DGC (Business/Investment bonus)
  v_reward := 2;

  -- Update balance and last_checkin_at
  update profiles 
  set balance = balance + v_reward, last_checkin_at = now() 
  where id = v_user_id;

  -- Record transaction
  insert into transactions (user_id, amount, type, status, note)
  values (v_user_id, v_reward, 'daily_reward', 'completed', 'Daily Check-in Reward (Business Bonus)');

  return json_build_object('success', true, 'message', 'Daily bonus claimed! +2 DGC', 'reward', v_reward);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 16. SERVER-SIDE FUNCTION: watch_ad
-- ─────────────────────────────────────────────────────────────
create or replace function watch_ad()
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_reward numeric := 10;
begin
  -- Update balance
  update profiles set balance = balance + v_reward where id = v_user_id;

  -- Record transaction
  insert into transactions (user_id, amount, type, status, note)
  values (v_user_id, v_reward, 'daily_reward', 'completed', 'Watched Advertisement Reward');
  
  return json_build_object('success', true, 'message', 'Rewarded +10 DGC for watching ad!');
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 19. ATOMIC WITHDRAWAL REQUEST
-- ─────────────────────────────────────────────────────────────
create or replace function request_withdrawal(p_amount numeric, p_number text, p_type text)
returns json
language plpgsql
security definer
as $$
declare
  v_balance numeric;
begin
  if p_amount < 100 then
    return json_build_object('success', false, 'error', 'Minimum withdrawal is 100 DGC');
  end if;

  select balance into v_balance from profiles where id = auth.uid();
  
  if v_balance < p_amount then
    return json_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Deduct balance IMMEDIATELY
  update profiles set balance = balance - p_amount where id = auth.uid();

  -- Record transaction
  insert into transactions (user_id, amount, type, status, note)
  values (auth.uid(), -p_amount, 'withdraw', 'pending', 'Withdrawal to ' || p_type || ' bKash: ' || p_number);

  return json_build_object('success', true, 'message', 'Withdrawal request submitted!');
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 20. SECURE TRANSACTION REJECT (WITH REFUND)
-- ─────────────────────────────────────────────────────────────
create or replace function reject_transaction(p_trx_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_trx record;
begin
  -- Only admin check
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    return json_build_object('success', false, 'error', 'Unauthorized');
  end if;

  select * into v_trx from transactions where id = p_trx_id and status = 'pending';
  
  if not found then
    return json_build_object('success', false, 'error', 'Transaction not found or not pending');
  end if;

  -- Update status
  update transactions set status = 'rejected', updated_at = now() where id = p_trx_id;

  -- If it was a withdrawal, refund the balance
  if v_trx.type = 'withdraw' then
    update profiles set balance = balance + abs(v_trx.amount) where id = v_trx.user_id;
  end if;

  return json_build_object('success', true);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 18. PROCESS INVESTOR RELEASES (Run daily)
-- ─────────────────────────────────────────────────────────────
create or replace function process_investor_releases()
returns void
language plpgsql
security definer
as $$
declare
  r record;
  v_payout numeric;
begin
  for r in 
    select ua.id, ua.user_id, ac.price_coins, ac.investor_roi
    from user_assets ua
    join assets_config ac on ac.id = ua.asset_id
    where ua.type = 'investor' 
    and ua.status = 'active'
    and ua.release_date <= now()
  loop
    v_payout := r.price_coins * (1 + (r.investor_roi / 100.0));
    
    -- Release Principal + ROI
    update profiles set balance = balance + v_payout where id = r.user_id;
    
    -- Record transaction
    insert into transactions (user_id, amount, type, status, note)
    values (r.user_id, v_payout, 'deposit', 'completed', 'Investor Capital + ROI Release');
    
    -- Mark as expired (completed)
    update user_assets set status = 'expired' where id = r.id;
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 17. SYSTEM SETTINGS (Flash Sale)
-- ─────────────────────────────────────────────────────────────
create table if not exists system_settings (
  id int primary key default 1,
  flash_sale_active      boolean default false,
  flash_sale_discount    numeric default 0,
  flash_sale_bonus       numeric default 0,
  flash_sale_ends_at     timestamptz,
  referral_bonus_value   numeric default 720
);

-- Insert default row
insert into system_settings (id, flash_sale_active) values (1, false) on conflict do nothing;

alter table system_settings enable row level security;
drop policy if exists "anyone_select_settings" on system_settings;
create policy "anyone_select_settings" on system_settings for select using (true);
drop policy if exists "admin_update_settings" on system_settings;
create policy "admin_update_settings" on system_settings for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Update user_assets with bonus_income_percent if missing
alter table user_assets add column if not exists bonus_income_percent numeric default 0;

-- ─────────────────────────────────────────────────────────────
-- 18. TOURNAMENTS INFRASTRUCTURE
-- ─────────────────────────────────────────────────────────────
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  game text not null default 'Free Fire',
  title text not null,
  entry_fee numeric not null default 0,
  prize_pool text not null,
  total_spots int not null default 50,
  date_time timestamptz not null,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists tournament_participants (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(tournament_id, user_id)
);

alter table tournaments enable row level security;
drop policy if exists "anyone_select_tournaments" on tournaments;
create policy "anyone_select_tournaments" on tournaments for select using (true);
drop policy if exists "admin_all_tournaments" on tournaments;
create policy "admin_all_tournaments" on tournaments for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

alter table tournament_participants enable row level security;
drop policy if exists "anyone_select_participants" on tournament_participants;
create policy "anyone_select_participants" on tournament_participants for select using (true);
drop policy if exists "user_insert_participants" on tournament_participants;
-- Disabled for security: tournament joining must be done via join_tournament() RPC
-- create policy "user_insert_participants" on tournament_participants for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 19. RPC: join_tournament
-- ─────────────────────────────────────────────────────────────
create or replace function join_tournament(p_tournament_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_fee numeric;
  v_spots_taken int;
  v_total_spots int;
  v_balance numeric;
  v_title text;
  v_game text;
begin
  -- Get tournament info
  select entry_fee, total_spots, title, game 
  into v_fee, v_total_spots, v_title, v_game
  from tournaments where id = p_tournament_id;

  if not found then
    return json_build_object('success', false, 'error', 'Tournament not found');
  end if;

  -- Check if already joined
  if exists (select 1 from tournament_participants where tournament_id = p_tournament_id and user_id = auth.uid()) then
    return json_build_object('success', false, 'error', 'You have already joined this tournament');
  end if;

  -- Check spots
  select count(*) into v_spots_taken from tournament_participants where tournament_id = p_tournament_id;
  if v_spots_taken >= v_total_spots then
    return json_build_object('success', false, 'error', 'Tournament is full');
  end if;

  -- Check balance
  select balance into v_balance from profiles where id = auth.uid();
  if v_balance < v_fee then
    return json_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Atomic actions
  -- 1. Deduct balance
  update profiles set balance = balance - v_fee where id = auth.uid();

  -- 2. Add as participant
  insert into tournament_participants (tournament_id, user_id)
  values (p_tournament_id, auth.uid());

  -- 3. Record transaction
  insert into transactions (user_id, amount, type, status, note)
  values (auth.uid(), -v_fee, 'purchase', 'completed', 'Tournament Entry: ' || v_title || ' (' || v_game || ')');

  return json_build_object('success', true, 'message', 'Successfully joined the tournament!');
end;
$$;
