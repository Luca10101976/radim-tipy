-- Add variant support to tips
alter table tips
  add column if not exists parent_id uuid references tips(id) on delete cascade;

-- Index for fast variant lookup
create index if not exists tips_parent_id_idx on tips(parent_id);
