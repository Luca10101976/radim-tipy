# radim.pro — audit prompt a výstup implementace

Datum: 2026-07-06

---

## PŮVODNÍ PROMPT (zadání pro AI)

Pracuji na projektu radim.pro.

**DŮLEŽITÉ:**
Aktuální workspace `/Users/lucielejnarova/Documents/New project` NENÍ radim.pro, ale jiný projekt Pan Batoh.
Správný zdroj projektu radim.pro je archiv:
`/Users/lucielejnarova/Desktop/radim-backup-2026-06-18.zip`

Archiv byl auditně rozbalen do:
`/private/tmp/radim-audit`

Nikdy nevypisuj hodnoty z `.env.local` ani `.env.vercel`.
Archiv obsahuje `.env.vercel` s `VERCEL_OIDC_TOKEN`, proto je projekt aktuálně BLOCKED a token musí být rotován.

### PROJEKT

radim.pro je Next.js 16 App Router web nasazený na Vercel.
Používá Supabase PostgreSQL + Supabase Auth magic link / OTP.
Účel: komunitní databáze domácích tipů. Uživatelé přidávají tipy na domácí problémy, ostatní hlasují, zda tip fungoval/nefungoval. Tipy mají success rate. Existují varianty tipů přes `parent_id`.

### TECH STACK

- Next.js 16.2.4
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- Supabase JS 2.103.3
- Vercel Analytics
- Supabase Auth magic link
- PostgreSQL + RLS

### DATABÁZE

Tabulka `tips`:
`id, title, category, problem, solution, author_result, warning, tags, votes_up, votes_down, hidden, pending, parent_id, user_id, created_at`

Tabulka `votes`:
`tip_id, user_id, vote_type`
Unikát: `(tip_id, user_id)`

Tabulka `reports`:
`tip_id, user_id, reason, created_at`

### KRITICKÉ AUDITNÍ NÁLEZY

1. **BLOCKED:** archiv obsahuje `.env.vercel` s `VERCEL_OIDC_TOKEN`. Token rotovat.
2. **BLOCKED:** chybí server-side validační vrstva pro mutace.
3. **BLOCKED:** neexistují `app/api/*` route handlery pro bezpečné insert/update/delete.
4. **BLOCKED:** `AddTipForm.tsx` validuje jen na frontendu.
5. **HIGH:** `lib/store.tsx` provádí přidání tipu, hlasování, reporty i admin mazání přímo přes klientský anon Supabase client.
6. **HIGH:** RLS policy pro `tips_insert` kontroluje jen `auth.uid() = user_id`, ale nevynucuje `pending=true`, `hidden=false`, délky, kategorii ani tagy.
7. **HIGH:** RLS policy pro `tips_update` dovoluje autorovi měnit vlastní tip obecně, tedy potenciálně `votes_up`, `votes_down`, `pending`, `hidden`.
8. **HIGH:** admin práva v UI jsou odvozena z `NEXT_PUBLIC_ADMIN_EMAIL`, ale skutečné zabezpečení musí být server/RLS.
9. **MEDIUM:** auth callback zobrazuje debug informace o token flow v UI.
10. **MEDIUM:** není vlastní rate limiting pro přidání tipů, reporty, hlasování ani login UI.
11. **HIGH:** `npm audit` našel zranitelnosti v `next` a `ws`.

### CO JE POTŘEBA UDĚLAT

1. Nejdřív odstranit secrets z archivu/repa a rotovat `VERCEL_OIDC_TOKEN`.
2. Navrhnout bezpečnou serverovou vrstvu (API routes nebo server actions).
3. Přidat server-side validaci vstupů (Zod).
4. Upravit RLS politiky.
5. Přepočet `votes_up/votes_down` přes DB trigger/RPC.
6. Odstranit debug z auth callbacku v produkci.
7. Přidat rate limiting pro citlivé mutace.
8. Aktualizovat dependencies a ověřit audit/lint/build.

### POŽADOVANÝ FORMÁT VÝSTUPU

```
IMPLEMENTACE:
BEZPEČNOSTNÍ KONTROLA:
RIZIKA:
DOPORUČENÉ OVĚŘENÍ:
VERDIKT:
NEJVĚTŠÍ RIZIKO:
```

---

## VÝSTUP IMPLEMENTACE

**PR:** https://github.com/Luca10101976/radim-tipy/pull/1  
**Větev:** `cursor/security-hardening-001a`

### Co bylo provedeno

#### 1. Serverová API vrstva

Všechny mutace jdou přes autentizované API routes s validací a rate limitingem:

| Endpoint | Účel | Rate limit |
|---|---|---|
| `POST /api/tips` | Přidání tipu | 5/h |
| `POST/DELETE /api/votes` | Hlasování | 60/h |
| `POST /api/reports` | Nahlášení | 10/h |
| `POST /api/admin/tips/[id]/approve` | Schválení | admin only |
| `DELETE /api/admin/tips/[id]/delete` | Smazání | admin only |
| `DELETE /api/admin/tips/delete-all` | Hromadné smazání | admin only |
| `POST /api/admin/reports/[tipId]/dismiss` | Zrušení reportu | admin only |

#### 2. Validace (Zod)

- Délky polí, whitelist kategorií a důvodů reportů
- Server-side content filter (`containsBlockedContent`)
- U variant tipů se `category`, `problem` a `tags` berou z rodiče

#### 3. Klient (`lib/store.tsx`)

Přímé Supabase mutace nahrazeny voláním API přes `lib/apiClient.ts` s Bearer tokenem ze session.

#### 4. SQL migrace (`supabase/security-hardening.sql`)

- Insert tipů: jen `pending=true`, `hidden=false`, `votes_up/down=0`
- Autor nemůže updatovat tipy (jen admin)
- Trigger `recalculate_tip_votes` — přepočet hlasů z tabulky `votes`

#### 5. Ostatní

- Debug v auth callbacku jen v `development`
- `ADMIN_USER_ID` (server-only) místo spoléhání na email
- `next` aktualizován na 16.2.9, přidán `zod`
- `.env.example`, rozšířený `.gitignore` (`.env.vercel`)
- Dokumentace v `SUPABASE_SETUP.md` §7

### Nové / upravené soubory

```
app/api/tips/route.ts
app/api/votes/route.ts
app/api/reports/route.ts
app/api/admin/tips/[id]/approve/route.ts
app/api/admin/tips/[id]/delete/route.ts
app/api/admin/tips/delete-all/route.ts
app/api/admin/reports/[tipId]/dismiss/route.ts
lib/validation.ts
lib/apiAuth.ts
lib/apiClient.ts
lib/apiResponse.ts
lib/rateLimit.ts
lib/store.tsx (upraveno)
app/auth/callback/page.tsx (upraveno)
supabase/security-hardening.sql
.env.example
SUPABASE_SETUP.md (upraveno)
```

### Po merge — manuální kroky

1. **Rotovat `VERCEL_OIDC_TOKEN`** ve Vercel Dashboard (pokud unikl z archivu)
2. Spustit `supabase/security-hardening.sql` — nahradit `<ADMIN_UUID>` skutečným UUID admina
3. Nastavit `ADMIN_USER_ID` ve Vercel env (stejné UUID jako v SQL)
4. Smoke test: přidání tipu → schválení adminem → hlasování → report

### Ověření buildu

- `npm run build` — OK (s placeholder env)
- `npm audit --audit-level=moderate` — 3 moderate (postcss v next, bez HIGH)
- ESLint — nové soubory bez chyb

---

## BEZPEČNOSTNÍ REPORT

### IMPLEMENTACE

- Serverová API vrstva pro všechny mutace
- Zod validace + rate limiting
- SQL migrace pro RLS a vote trigger
- Aktualizace dependencies (HIGH zranitelnosti v `next`/`ws` opraveny)

### BEZPEČNOSTNÍ KONTROLA

- Mutace již nejdou přímo z klienta přes anon key
- Admin kontrola na serveru přes `ADMIN_USER_ID`
- Hlasové počítadla se přepočítávají v DB triggeru
- RLS migrace připravena, ale **musí být spuštěna v Supabase**

### RIZIKA

- SQL migrace ještě není aplikována v produkční DB — bez ní zůstávají staré RLS politiky
- Rate limiting je in-memory (per serverless instance) — u více instancí zvaž Redis/Upstash
- `VERCEL_OIDC_TOKEN` z archivu vyžaduje manuální rotaci
- 3 moderate zranitelnosti v `postcss` (závislost `next`) — bez dostupného fixu bez breaking change

### DOPORUČENÉ OVĚŘENÍ

1. Spustit SQL migraci v Supabase
2. Nastavit `ADMIN_USER_ID` ve Vercel
3. Rotovat uniklý OIDC token
4. Otestovat: přidání tipu → schválení adminem → hlasování → report
5. `npm run build` s produkčními env proměnnými

### VERDIKT

**ČÁSTEČNĚ ODEBLOKOVÁNO** — kódová vrstva je hardened, ale produkce zůstává **BLOCKED** dokud neproběhne rotace tokenu, aplikace SQL migrace a nastavení `ADMIN_USER_ID`.

### NEJVĚTŠÍ RIZIKO

Neaplikovaná SQL migrace v produkční Supabase — staré RLS politiky stále dovolují autorovi měnit moderation fields a vote counters přímo z klienta, pokud by někdo obešel nové API routes.

---

## Kopírování na plochu (Mac)

Cloud prostředí nemá přístup k `/Users/lucielejnarova/Desktop/`. Soubor je v repozitáři:

```
radim-pro-audit-vystup-a-prompt.md
```

Zkopíruj na plochu např.:

```bash
cp "/cesta/k/radim-tipy/radim-pro-audit-vystup-a-prompt.md" ~/Desktop/
```

Nebo stáhni z GitHubu po merge PR #1.
