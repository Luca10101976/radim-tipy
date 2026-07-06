-- Security hardening migration for radim.pro
-- Run in Supabase SQL editor AFTER backing up existing policies.
-- Replace <ADMIN_UUID> with the auth.users.id of the admin account.

-- ── pending column (if missing from older schema) ────────────────────────────
alter table tips add column if not exists pending boolean default false;

-- ── Drop legacy permissive policies ────────────────────────────────────────
drop policy if exists "tips_select" on tips;
drop policy if exists "tips_insert" on tips;
drop policy if exists "tips_update" on tips;
drop policy if exists "tips_delete" on tips;
drop policy if exists "tips_select_public" on tips;
drop policy if exists "tips_insert_authenticated" on tips;
drop policy if exists "tips_update_author" on tips;
drop policy if exists "tips_delete_author" on tips;
drop policy if exists "tips_delete_admin" on tips;
drop policy if exists "tips_update_admin" on tips;
drop policy if exists "tips_select_admin" on tips;

drop policy if exists "votes_select" on votes;
drop policy if exists "votes_insert" on votes;
drop policy if exists "votes_update" on votes;
drop policy if exists "votes_delete" on votes;
drop policy if exists "votes_select_own" on votes;
drop policy if exists "votes_insert_own" on votes;
drop policy if exists "votes_update_own" on votes;
drop policy if exists "votes_delete_own" on votes;

drop policy if exists "reports_select" on reports;
drop policy if exists "reports_insert" on reports;
drop policy if exists "reports_select_admin" on reports;
drop policy if exists "reports_delete_admin" on reports;
drop policy if exists "reports_insert_own" on reports;
drop policy if exists "reports_select_own" on reports;

-- ── Tips: read approved & visible tips ───────────────────────────────────────
create policy "tips_select_public" on tips
  for select using (hidden = false and pending = false);

-- Admin reads all tips (pending, hidden, etc.)
create policy "tips_select_admin" on tips
  for select using (auth.uid() = '<ADMIN_UUID>'::uuid);

-- Authenticated users insert only their own pending tips
create policy "tips_insert_authenticated" on tips
  for insert with check (
    auth.uid() = user_id
    and pending = true
    and hidden = false
    and votes_up = 0
    and votes_down = 0
    and author_result in ('fungovalo', 'nefungovalo')
    and length(trim(title)) between 1 and 80
    and length(trim(problem)) between 1 and 300
    and length(trim(solution)) between 1 and 500
    and (warning is null or length(trim(warning)) <= 200)
  );

-- Authors cannot update tips after submission (moderation fields protected)
-- Only admin may update tips (approve, hide, etc.)
create policy "tips_update_admin" on tips
  for update using (auth.uid() = '<ADMIN_UUID>'::uuid);

create policy "tips_delete_admin" on tips
  for delete using (auth.uid() = '<ADMIN_UUID>'::uuid);

-- ── Votes: users manage only their own votes ─────────────────────────────────
create policy "votes_select_own" on votes
  for select using (auth.uid() = user_id);

create policy "votes_insert_own" on votes
  for insert with check (
    auth.uid() = user_id
    and vote_type in ('up', 'down')
    and exists (
      select 1 from tips t
      where t.id = tip_id and t.hidden = false and t.pending = false
    )
  );

create policy "votes_update_own" on votes
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and vote_type in ('up', 'down')
  );

create policy "votes_delete_own" on votes
  for delete using (auth.uid() = user_id);

-- ── Reports ──────────────────────────────────────────────────────────────────
create policy "reports_select_own" on reports
  for select using (auth.uid() = user_id);

create policy "reports_insert_own" on reports
  for insert with check (
    auth.uid() = user_id
    and length(trim(reason)) between 3 and 200
    and exists (
      select 1 from tips t
      where t.id = tip_id and t.hidden = false and t.pending = false
    )
  );

create policy "reports_select_admin" on reports
  for select using (auth.uid() = '<ADMIN_UUID>'::uuid);

create policy "reports_delete_admin" on reports
  for delete using (auth.uid() = '<ADMIN_UUID>'::uuid);

-- ── Vote counter recalculation (never trust client counters) ─────────────────
create or replace function recalculate_tip_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tip_id uuid;
begin
  target_tip_id := coalesce(new.tip_id, old.tip_id);

  update tips
  set
    votes_up = (
      select count(*)::integer from votes
      where tip_id = target_tip_id and vote_type = 'up'
    ),
    votes_down = (
      select count(*)::integer from votes
      where tip_id = target_tip_id and vote_type = 'down'
    )
  where id = target_tip_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists votes_recalculate_trigger on votes;
create trigger votes_recalculate_trigger
  after insert or update or delete on votes
  for each row execute function recalculate_tip_votes();

-- Backfill counters for existing data
update tips t
set
  votes_up = coalesce((
    select count(*)::integer from votes v
    where v.tip_id = t.id and v.vote_type = 'up'
  ), 0),
  votes_down = coalesce((
    select count(*)::integer from votes v
    where v.tip_id = t.id and v.vote_type = 'down'
  ), 0);
