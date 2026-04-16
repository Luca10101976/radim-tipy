# Supabase Setup

## 1. Vytvoř projekt na supabase.com

Po vytvoření projektu zkopíruj:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` v `.env.local`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` v `.env.local`
- Nastav `NEXT_PUBLIC_ADMIN_EMAIL` na email admina

## 2. Spusť SQL schéma v Supabase SQL editoru

```sql
-- Tabulky

create table tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  problem text not null,
  solution text not null,
  author_result text check (author_result in ('fungovalo', 'nefungovalo')) not null,
  warning text,
  category text not null,
  tags jsonb default '[]',
  votes_up integer default 0,
  votes_down integer default 0,
  hidden boolean default false,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid references tips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  vote_type text check (vote_type in ('up', 'down')) not null,
  created_at timestamptz default now(),
  unique (tip_id, user_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid references tips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reason text not null,
  created_at timestamptz default now(),
  unique (tip_id, user_id)
);

-- RLS
alter table tips enable row level security;
alter table votes enable row level security;
alter table reports enable row level security;

-- Tips policies
create policy "tips_select" on tips for select using (hidden = false);
create policy "tips_insert" on tips for insert with check (auth.uid() = user_id);
create policy "tips_update" on tips for update using (auth.uid() = user_id);
create policy "tips_delete" on tips for delete using (auth.uid() = user_id);

-- Votes policies
create policy "votes_select" on votes for select using (auth.uid() = user_id);
create policy "votes_insert" on votes for insert with check (auth.uid() = user_id);
create policy "votes_update" on votes for update using (auth.uid() = user_id);
create policy "votes_delete" on votes for delete using (auth.uid() = user_id);

-- Reports policies
create policy "reports_select" on reports for select using (auth.uid() = user_id);
create policy "reports_insert" on reports for insert with check (auth.uid() = user_id);
```

## 3. Admin — rozšířené RLS politiky

Admin potřebuje číst všechny reports a mazat/skrývat tips. Po prvním přihlášení admina:

1. Zjisti `auth.uid()` admina v SQL editoru: `select id, email from auth.users;`
2. Přidej admin politiky (nahraď `<ADMIN_UUID>` skutečným UUID):

```sql
-- Admin může číst všechny reports
create policy "reports_select_admin" on reports
  for select using (auth.uid() = '<ADMIN_UUID>');

-- Admin může mazat jakýkoliv tip
create policy "tips_delete_admin" on tips
  for delete using (auth.uid() = '<ADMIN_UUID>');

-- Admin může updatovat (hidden) jakýkoliv tip
create policy "tips_update_admin" on tips
  for update using (auth.uid() = '<ADMIN_UUID>');

-- Admin může mazat jakékoliv reports
create policy "reports_delete_admin" on reports
  for delete using (auth.uid() = '<ADMIN_UUID>');
```

## 4. Seed data — MOCK_TIPS

Spusť pro vložení výchozích tipů:

```sql
insert into tips (id, title, problem, solution, author_result, warning, category, tags, votes_up, votes_down, created_at) values
(
  '00000000-0000-0000-0000-000000000001',
  'Ocet na vodní kámen v konvici',
  'Vodní kámen uvnitř konvice, voda začíná divně chutnat.',
  'Naplň konvici směsí 1:1 voda + bílý ocet, přiveď k varu, nech 1 hodinu stát, vylij a proplachni čistou vodou. Zopakuj jednou čistou vodou.',
  'fungovalo',
  'Po proplachnutí opři konvici víčkem, aby pach octu dobře vytrál.',
  'Kuchyně & vaření',
  '["vodní kámen","ocet","kuchyně"]',
  84, 9,
  '2024-11-01'
),
(
  '00000000-0000-0000-0000-000000000002',
  'Jedlá soda na zápach v lednici',
  'Lednice táhne nepříjemným zápachem i po vyčištění.',
  'Dej do lednice otevřenou misku s jedlou sodou. Nech působit 24–48 hodin. Soda absorbuje zápach.',
  'fungovalo',
  null,
  'Kuchyně & vaření',
  '["zápach","jedlá soda","kuchyně","přírodní"]',
  71, 8,
  '2024-11-05'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Citron na skvrny od kávy v hrncích',
  'Hnědé skvrny od čaje a kávy uvnitř hrnků, nejdou umýt.',
  'Namočte hrnek solí, pak vetřete půlku citronu. Nechte 5 minut, opláchněte.',
  'fungovalo',
  null,
  'Kuchyně & vaření',
  '["skvrny","citron","kuchyně","přírodní"]',
  55, 14,
  '2024-11-10'
),
(
  '00000000-0000-0000-0000-000000000004',
  'Ocet na plíseň v koupelně',
  'Plíseň ve spárách dlaždic a kolem vany.',
  'Nastříkej čistý bílý ocet na postižená místa, nech 1 hodinu, vydrhni starým zubním kartáčkem.',
  'fungovalo',
  'Nepřidávej chlorové čisticí prostředky — kombinace s octem uvolňuje nebezpečné výpary.',
  'Koupelna & hygiena',
  '["plíseň","ocet","koupelna"]',
  38, 27,
  '2024-11-12'
),
(
  '00000000-0000-0000-0000-000000000005',
  'Jedlá soda + ocet na ucpaný odtok',
  'Pomalý odtok ve sprše, voda stojí a nechce odtékat.',
  'Sypni 3 lžíce jedlé sody do odtoku, pak přidej hrnek octa. Nech 15 minut bouřit, pak spláchni vroucí vodou.',
  'nefungovalo',
  'Při silném ucpání nepomůže — v takovém případě je nutný mechanický čistič nebo instalatér.',
  'Koupelna & hygiena',
  '["zápach","jedlá soda","ocet","koupelna"]',
  12, 41,
  '2024-11-15'
),
(
  '00000000-0000-0000-0000-000000000006',
  'Mražení na likvidaci roztočů v polštářích',
  'Alergik v domácnosti, podezření na roztoče v polštářích.',
  'Vlož polštář do plastového sáčku, dej na 48 hodin do mrazáku (-18 °C). Pak vynes ven, vysus.',
  'fungovalo',
  null,
  'Prádlo & textil',
  '["přírodní"]',
  29, 19,
  '2024-11-18'
),
(
  '00000000-0000-0000-0000-000000000007',
  'Žluč na tukové skvrny z oblečení',
  'Mastná skvrna od jídla na tričku, nepomáhá ani předpírání.',
  'Nanes žlučové mýdlo přímo na skvrnu (vlhkou), jemně vetři, nech 30 minut působit, pak standardně vyper.',
  'fungovalo',
  null,
  'Prádlo & textil',
  '["mastnota","skvrny"]',
  67, 7,
  '2024-11-20'
),
(
  '00000000-0000-0000-0000-000000000008',
  'Ocet v pračce na zápach prádla',
  'Prádlo smrdí i po vyprání, zvláště ručníky.',
  'Přidej 100 ml bílého octa do aviváž přihrádky místo aviváže. Ber to jako reset pračky — zopakuj 2–3 praní.',
  'fungovalo',
  null,
  'Prádlo & textil',
  '["zápach","ocet","pračka","přírodní"]',
  48, 22,
  '2024-11-22'
),
(
  '00000000-0000-0000-0000-000000000009',
  'Sůl na čerstvou skvrnu od červeného vína',
  'Červené víno na koberci nebo ubrus, právě se stalo.',
  'Okamžitě nasypte velké množství soli na skvrnu, nechte absorbovat 10 minut (sůl zčervená). Vysaj nebo setřes.',
  'fungovalo',
  'Funguje jen čerstvá skvrna — na zaschlé víno tohle nestačí.',
  'Úklid & čištění',
  '["skvrny","přírodní"]',
  73, 8,
  '2024-11-25'
),
(
  '00000000-0000-0000-0000-000000000010',
  'Kávová sedlina jako hnojivo pro pokojovky',
  'Pokojové rostliny žloutnoucí, hledám levné hnojivo.',
  'Po uvaření kávy nech sedlinu vychladnout, zamíchej do zeminy (ne příliš mnoho — jen tenká vrstva). Opakuj 1× za 2 týdny.',
  'fungovalo',
  'Kávová sedlina okyseluje půdu — nevhodná pro rostliny preferující zásaditou půdu (kaktusy, sukulenty).',
  'Zahrada & balkon',
  '["přírodní"]',
  41, 31,
  '2024-11-27'
),
(
  '00000000-0000-0000-0000-000000000011',
  'Citronová kůra v mikrovlnce',
  'Mikrovlnka páchne starým jídlem, nejde to vydřít.',
  'Dej do misky s vodou citronovou kůru nebo pár kapek citronové šťávy. Zahřívej 3 minuty na max. výkon. Nech 2 min. stát, pak otři vlhkým hadříkem.',
  'fungovalo',
  null,
  'Kuchyně & vaření',
  '["zápach","citron","kuchyně","přírodní"]',
  79, 4,
  '2024-12-01'
),
(
  '00000000-0000-0000-0000-000000000012',
  'Pasta na zuby na drobná škrábání na obrazovce',
  'Drobné škrábance na displeji telefonu nebo notebooku.',
  'Nanes malé množství bílé pasty na zuby na mikrohadřík, jemně kroužkovými pohyby vetři do škrábance 1–2 minuty. Otři čistým hadříkem.',
  'nefungovalo',
  'Může poškodit povrchové antireflexní vrstvy — riziko je větší než zisk. Nedoporučuji.',
  'Domácí vychytávky',
  '["chemie"]',
  6, 28,
  '2024-12-03'
);
```

## 5. Auth nastavení v Supabase

V Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://radim.pro` (nebo localhost pro vývoj)
- **Redirect URLs**: přidej `https://radim.pro/auth/callback` a `http://localhost:3000/auth/callback`

## 6. Vercel env variables

V Vercel Dashboard → Settings → Environment Variables přidej:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_EMAIL`
