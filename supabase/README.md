# DataReq Pro — base de données (schéma `datareq`)

Supabase auto-hébergé sur le VPS Hostinger (PostgREST + GoTrue uniquement).
Aucune donnée à reprendre depuis l'ancien projet Cloud : on part d'une base vide.

## 1. Créer la base (une seule fois)

```bash
docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 <<'SQL'
create database datareq;
SQL
```

> Si la base `datareq` est déjà créée par la stack (une base par app), sauter cette étape.
> GoTrue doit pointer sur la **même** base (schéma `auth`), car les tables
> `datareq.*` référencent `auth.users`. Vérifier `GOTRUE_DB_DATABASE_URL` /
> `PGRST_DB_URI` → `.../datareq`.

## 2. Appliquer le schéma

Depuis le dossier du dépôt cloné sur le VPS (`/opt/apps/datareq/app` par exemple) :

```bash
docker exec -i supabase-db psql -U supabase_admin -d datareq -v ON_ERROR_STOP=1 \
  < supabase/migrations/20260906000000_datareq_schema.sql
```

Le script est **rejouable** (`if not exists`, `or replace`, `drop policy if exists`,
seeds en `on conflict`). Il se termine par `notify pgrst, 'reload schema';`.

Il crée :

| Élément | Détail |
|---|---|
| Schéma | `datareq` |
| 15 tables | `tenants`, `tenant_users`, `projects`, `forms`, `form_fields`, `responses`, `response_items`, `data_subject_requests`, `legal_rules`, `audit_logs`, `plans`, `subscriptions`, `invoices`, `super_admins`, `admin_audit_log` |
| RPC | `datareq.register_tenant(p_user_id uuid, p_tenant_name text)` → tenant + membre `admin` + abonnement `trialing` 14 j sur le plan `free` |
| Helpers RLS | `is_tenant_member`, `is_tenant_editor`, `is_tenant_admin`, `is_super_admin`, `form_is_public`, … |
| RLS | multi-tenant via `tenant_users` ; formulaires publiés+publics lisibles en `anon` ; `super_admins` lisibles par eux-mêmes |
| Grants | `usage` sur le schéma pour `anon`, `authenticated`, `service_role` ; CRUD filtré par RLS pour `authenticated` ; `service_role` tout |
| Seeds | plans `free` / `starter` / `pro` ; 10 règles légales globales (RGPD + Cameroun) |

## 3. Exposer le schéma dans PostgREST (obligatoire)

Dans le `.env` de la stack Supabase (service `rest`), ajouter `datareq` à la liste :

```env
PGRST_DB_SCHEMAS=public,datareq,storage
```

puis redémarrer PostgREST :

```bash
docker compose restart rest
```

Sans cela, l'app reçoit `PGRST106: The schema must be one of the following: public, storage`.
Le client Next.js envoie déjà `Accept-Profile: datareq` / `Content-Profile: datareq`
(`src/lib/supabase/client.ts`) et `db: { schema: 'datareq' }` partout ailleurs.

## 4. Vérifications rapides

```bash
# Tables + RLS activé
docker exec -i supabase-db psql -U supabase_admin -d datareq -c \
  "select tablename, rowsecurity from pg_tables where schemaname='datareq' order by 1;"

# Plans seedés
docker exec -i supabase-db psql -U supabase_admin -d datareq -c \
  "select name, display_name, price_monthly, max_projects, max_users from datareq.plans order by sort_order;"

# PostgREST voit le schéma (depuis le VPS, clé anon requise)
curl -s -H "apikey: $ANON_KEY" -H "Accept-Profile: datareq" \
  "https://datareq-db.manovende.com/rest/v1/plans?select=name,display_name"
```

## 5. Créer un super admin (page `/admin`)

Après inscription du compte concerné via l'app :

```bash
docker exec -i supabase-db psql -U supabase_admin -d datareq -v ON_ERROR_STOP=1 <<'SQL'
insert into datareq.super_admins (user_id, email)
select id, email from auth.users where email = 'mothoalex@manovende.com'
on conflict (user_id) do update set is_active = true;
SQL
```

## 6. Conventions du schéma (déduites du code)

- `plans.price_monthly` est en **centimes d'euro** (le code fait `/ 100` puis convertit
  en FCFA au taux fixe 655,957 pour CamPay). `-1` = illimité.
- `invoices.amount` : centimes d'euro ; `invoices.amount_xaf` : montant CamPay.
  Statuts : `draft | open | paid | void | uncollectible`.
- `subscriptions` : une ligne par tenant (`unique (tenant_id)`), statuts
  `trialing | active | past_due | canceled | expired | suspended`.
- `tenant_users.role` : `admin | contributor | viewer` (le créateur du tenant est `admin`).
- `forms.public_token` : 32 hex générés automatiquement, unique.
- `legal_rules.tenant_id = null` = règle globale visible par tous les tenants.
