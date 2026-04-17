create table experiences (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid references tips(id) on delete cascade,
  solution text,
  result text check (result in ('fungovalo','nefungovalo')),
  created_at timestamp default now()
);

alter table experiences enable row level security;

-- Anyone can read experiences
create policy "Public read experiences"
  on experiences for select
  using (true);

-- Anyone can add an experience (no auth required, MVP)
create policy "Public insert experiences"
  on experiences for insert
  with check (
    solution is not null
    and length(trim(solution)) > 0
    and length(solution) <= 200
  );
