-- ============================================================================
-- DataReq Pro — schéma `datareq` (Supabase auto-hébergé, PostgREST + GoTrue)
-- ----------------------------------------------------------------------------
-- Script rejouable : tout est en `if not exists` / `or replace` / `drop policy
-- if exists`. Déduit du code Next.js (src/lib/types.ts, src/lib/hooks/*,
-- src/app/api/**). Aucune donnée existante à reprendre.
--
-- Application :
--   docker exec -i supabase-db psql -U supabase_admin -d datareq \
--     -v ON_ERROR_STOP=1 < supabase/migrations/20260906000000_datareq_schema.sql
--
-- Prérequis : PostgREST doit exposer le schéma → PGRST_DB_SCHEMAS=public,datareq,storage
-- ============================================================================

begin;

create schema if not exists datareq;

-- ----------------------------------------------------------------------------
-- 0. Utilitaires
-- ----------------------------------------------------------------------------

-- Jeton public de formulaire (32 hex) sans dépendance à pgcrypto.
create or replace function datareq.generate_public_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select replace(gen_random_uuid()::text, '-', '');
$$;

-- Trigger générique updated_at
create or replace function datareq.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. Tables
-- ----------------------------------------------------------------------------

-- 1.1 tenants -----------------------------------------------------------------
create table if not exists datareq.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  region      text not null default 'eu-west-1',
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1.2 tenant_users -------------------------------------------------------------
-- Rôles réellement testés dans l'UI : admin / contributor / viewer
-- (src/lib/types.ts, dashboard/team, dashboard/settings).
create table if not exists datareq.tenant_users (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references datareq.tenants (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'contributor'
              constraint tenant_users_role_check
              check (role in ('admin', 'contributor', 'viewer')),
  created_at  timestamptz not null default now(),
  constraint tenant_users_tenant_user_key unique (tenant_id, user_id)
);
create index if not exists tenant_users_user_id_idx on datareq.tenant_users (user_id);

-- 1.3 projects -----------------------------------------------------------------
create table if not exists datareq.projects (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references datareq.tenants (id) on delete cascade,
  name        text not null,
  description text,
  geography   text,
  sectors     text[],
  objectives  text,
  status      text not null default 'draft'
              constraint projects_status_check
              check (status in ('draft', 'active', 'completed', 'archived')),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists projects_tenant_id_idx on datareq.projects (tenant_id, created_at desc);

-- 1.4 forms --------------------------------------------------------------------
create table if not exists datareq.forms (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references datareq.tenants (id) on delete cascade,
  project_id   uuid not null references datareq.projects (id) on delete cascade,
  name         text not null,
  description  text,
  status       text not null default 'draft'
               constraint forms_status_check
               check (status in ('draft', 'published', 'closed')),
  is_public    boolean not null default false,
  public_token text not null default datareq.generate_public_token(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint forms_public_token_key unique (public_token)
);
create index if not exists forms_tenant_id_idx  on datareq.forms (tenant_id, created_at desc);
create index if not exists forms_project_id_idx on datareq.forms (project_id);

-- 1.5 form_fields --------------------------------------------------------------
create table if not exists datareq.form_fields (
  id          uuid primary key default gen_random_uuid(),
  form_id     uuid not null references datareq.forms (id) on delete cascade,
  label       text not null,
  field_type  text not null default 'text'
              constraint form_fields_field_type_check
              check (field_type in ('text', 'textarea', 'number', 'date', 'select',
                                    'multiselect', 'checkbox', 'email', 'phone')),
  required    boolean not null default false,
  is_pii      boolean not null default false,
  order_index integer not null default 0,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists form_fields_form_id_idx on datareq.form_fields (form_id, order_index);

-- 1.6 responses ----------------------------------------------------------------
create table if not exists datareq.responses (
  id           uuid primary key default gen_random_uuid(),
  form_id      uuid not null references datareq.forms (id) on delete cascade,
  project_id   uuid not null references datareq.projects (id) on delete cascade,
  tenant_id    uuid not null references datareq.tenants (id) on delete cascade,
  submitted_at timestamptz not null default now(),
  source       text not null default 'public',
  meta         jsonb not null default '{}'::jsonb
);
create index if not exists responses_form_id_idx   on datareq.responses (form_id, submitted_at desc);
create index if not exists responses_tenant_id_idx on datareq.responses (tenant_id, submitted_at desc);

-- 1.7 response_items -----------------------------------------------------------
create table if not exists datareq.response_items (
  id               uuid primary key default gen_random_uuid(),
  response_id      uuid not null references datareq.responses (id) on delete cascade,
  form_field_id    uuid not null references datareq.form_fields (id) on delete cascade,
  raw_value        text,
  anonymized_value text,
  is_pseudonymized boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists response_items_response_id_idx on datareq.response_items (response_id);
create index if not exists response_items_field_id_idx    on datareq.response_items (form_field_id);

-- 1.8 data_subject_requests (demandes RGPD) ------------------------------------
create table if not exists datareq.data_subject_requests (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references datareq.tenants (id) on delete cascade,
  requester_email text not null,
  request_type    text not null default 'access'
                  constraint dsr_request_type_check
                  check (request_type in ('access', 'delete', 'rectification',
                                          'portability', 'objection')),
  status          text not null default 'pending'
                  constraint dsr_status_check
                  check (status in ('pending', 'in_progress', 'completed', 'rejected')),
  notes           text,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);
create index if not exists dsr_tenant_id_idx on datareq.data_subject_requests (tenant_id, created_at desc);

-- 1.9 legal_rules (tenant_id null = règle globale visible par tous) -----------
create table if not exists datareq.legal_rules (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references datareq.tenants (id) on delete cascade,
  jurisdiction text not null,
  article_ref  text,
  title        text not null,
  rule_text    text not null,
  tags         text[] not null default '{}'::text[],
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists legal_rules_tenant_id_idx on datareq.legal_rules (tenant_id);

-- 1.10 audit_logs --------------------------------------------------------------
-- Colonnes lues par dashboard/audit : action, entity_type, entity_id, user_id,
-- details (texte), created_at.
create table if not exists datareq.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references datareq.tenants (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  details     text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_tenant_id_idx on datareq.audit_logs (tenant_id, created_at desc);

-- 1.11 plans -------------------------------------------------------------------
-- price_monthly est en CENTIMES D'EURO (le code fait price_monthly / 100 puis
-- eurToXaf() côté paiement CamPay). -1 = illimité pour les max_*.
create table if not exists datareq.plans (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  display_name            text not null,
  price_monthly           integer not null default 0,
  max_projects            integer not null default 1,
  max_forms_per_project   integer not null default 1,
  max_responses_per_month integer not null default 100,
  max_users               integer not null default 1,
  features                jsonb not null default '{}'::jsonb,
  is_active               boolean not null default true,
  sort_order              integer not null default 0,
  created_at              timestamptz not null default now(),
  constraint plans_name_key unique (name)
);

-- 1.12 subscriptions (1 par tenant : .eq('tenant_id').single()) -------------
create table if not exists datareq.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references datareq.tenants (id) on delete cascade,
  plan_id              uuid not null references datareq.plans (id) on delete restrict,
  status               text not null default 'trialing'
                       constraint subscriptions_status_check
                       check (status in ('trialing', 'active', 'past_due', 'canceled',
                                         'expired', 'suspended')),
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz not null default (now() + interval '14 days'),
  trial_end            timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint subscriptions_tenant_id_key unique (tenant_id)
);
create index if not exists subscriptions_plan_id_idx on datareq.subscriptions (plan_id);

-- 1.13 invoices ----------------------------------------------------------------
-- Colonnes documentées dans api/payments/campay/route.ts et api/webhooks/campay.
-- amount = centimes d'euro ; amount_xaf = montant CamPay en FCFA.
create table if not exists datareq.invoices (
  id                        uuid primary key default gen_random_uuid(),
  tenant_id                 uuid not null references datareq.tenants (id) on delete cascade,
  subscription_id           uuid references datareq.subscriptions (id) on delete set null,
  invoice_number            text not null,
  amount                    integer not null default 0,
  currency                  text not null default 'eur',
  status                    text not null default 'draft'
                            constraint invoices_status_check
                            check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  description               text,
  payment_method            text
                            constraint invoices_payment_method_check
                            check (payment_method is null or payment_method in ('campay_om', 'campay_card', 'campay_momo', 'manual')),
  external_reference        text,
  campay_reference          text,
  campay_operator           text,
  campay_code               text,
  campay_operator_reference text,
  amount_xaf                integer,
  payment_link              text,
  paid_at                   timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint invoices_invoice_number_key unique (invoice_number)
);
create index if not exists invoices_tenant_id_idx        on datareq.invoices (tenant_id, created_at desc);
create index if not exists invoices_campay_reference_idx on datareq.invoices (campay_reference);
create index if not exists invoices_external_ref_idx     on datareq.invoices (external_reference);

-- 1.14 super_admins ------------------------------------------------------------
create table if not exists datareq.super_admins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  email      text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  constraint super_admins_user_id_key unique (user_id)
);

-- 1.15 admin_audit_log ---------------------------------------------------------
create table if not exists datareq.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references datareq.super_admins (id) on delete cascade,
  action      text not null,
  target_type text,
  target_id   uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists admin_audit_log_created_at_idx on datareq.admin_audit_log (created_at desc);

-- ----------------------------------------------------------------------------
-- 2. Triggers updated_at
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['tenants', 'projects', 'forms', 'subscriptions', 'invoices'] loop
    execute format('drop trigger if exists set_updated_at on datareq.%I', t);
    execute format(
      'create trigger set_updated_at before update on datareq.%I
         for each row execute function datareq.set_updated_at()', t);
  end loop;
end
$$;

-- ----------------------------------------------------------------------------
-- 3. Fonctions d'aide RLS (SECURITY DEFINER pour éviter la récursion sur
--    tenant_users). STABLE pour être évaluées une fois par requête.
-- ----------------------------------------------------------------------------
create or replace function datareq.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from datareq.tenant_users tu
    where tu.tenant_id = p_tenant_id and tu.user_id = auth.uid()
  );
$$;

-- Membre autorisé à écrire (admin ou contributor ; viewer = lecture seule)
create or replace function datareq.is_tenant_editor(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from datareq.tenant_users tu
    where tu.tenant_id = p_tenant_id and tu.user_id = auth.uid()
      and tu.role in ('admin', 'contributor')
  );
$$;

create or replace function datareq.is_tenant_admin(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from datareq.tenant_users tu
    where tu.tenant_id = p_tenant_id and tu.user_id = auth.uid()
      and tu.role = 'admin'
  );
$$;

create or replace function datareq.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from datareq.super_admins sa
    where sa.user_id = auth.uid() and sa.is_active
  );
$$;

-- Tenant propriétaire d'un formulaire (utilisé par form_fields / response_items)
create or replace function datareq.form_tenant(p_form_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select f.tenant_id from datareq.forms f where f.id = p_form_id;
$$;

create or replace function datareq.response_tenant(p_response_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.tenant_id from datareq.responses r where r.id = p_response_id;
$$;

-- Formulaire ouvert au public (status published + is_public)
create or replace function datareq.form_is_public(p_form_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from datareq.forms f
    where f.id = p_form_id and f.status = 'published' and f.is_public
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC register_tenant(p_user_id, p_tenant_name)
--    Appelée juste après auth.signUp (souvent SANS session → rôle anon) depuis
--    src/app/register/page.tsx, api/auth/register et auth/callback.
--    Crée le tenant + membre admin + abonnement d'essai (14 j) sur le plan free.
--    Idempotente : si l'utilisateur a déjà un tenant, le renvoie.
-- ----------------------------------------------------------------------------
create or replace function datareq.register_tenant(p_user_id uuid, p_tenant_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant   datareq.tenants%rowtype;
  v_plan_id  uuid;
  v_existing uuid;
  v_name     text;
begin
  if p_user_id is null then
    raise exception 'register_tenant: p_user_id requis';
  end if;

  -- Garde-fous : un utilisateur connecté ne peut créer que pour lui-même ;
  -- un appel anonyme (juste après signUp) n'est accepté que pour un compte
  -- auth.users créé il y a moins de 15 minutes.
  if auth.uid() is not null then
    if auth.uid() <> p_user_id then
      raise exception 'register_tenant: utilisateur non autorisé';
    end if;
  else
    if not exists (
      select 1 from auth.users u
      where u.id = p_user_id and u.created_at > now() - interval '15 minutes'
    ) then
      raise exception 'register_tenant: utilisateur inconnu ou trop ancien';
    end if;
  end if;

  -- Déjà membre d'un tenant → renvoyer ce tenant (idempotence)
  select tu.tenant_id into v_existing
  from datareq.tenant_users tu
  where tu.user_id = p_user_id
  order by tu.created_at
  limit 1;

  if v_existing is not null then
    select * into v_tenant from datareq.tenants t where t.id = v_existing;
    return to_jsonb(v_tenant);
  end if;

  v_name := nullif(btrim(coalesce(p_tenant_name, '')), '');
  if v_name is null then
    v_name := 'Mon organisation';
  end if;

  select p.id into v_plan_id
  from datareq.plans p
  where p.name = 'free' and p.is_active
  limit 1;
  if v_plan_id is null then
    raise exception 'register_tenant: plan "free" introuvable (seed manquant)';
  end if;

  insert into datareq.tenants (name, region, created_by)
  values (v_name, 'eu-west-1', p_user_id)
  returning * into v_tenant;

  insert into datareq.tenant_users (tenant_id, user_id, role)
  values (v_tenant.id, p_user_id, 'admin');

  insert into datareq.subscriptions
    (tenant_id, plan_id, status, current_period_start, current_period_end, trial_end)
  values
    (v_tenant.id, v_plan_id, 'trialing', now(), now() + interval '14 days', now() + interval '14 days')
  on conflict (tenant_id) do nothing;

  insert into datareq.audit_logs (tenant_id, user_id, action, entity_type, entity_id, details)
  values (v_tenant.id, p_user_id, 'create', 'tenant', v_tenant.id,
          'Organisation créée : "' || v_tenant.name || '"');

  return to_jsonb(v_tenant);
end;
$$;

revoke all on function datareq.register_tenant(uuid, text) from public;
grant execute on function datareq.register_tenant(uuid, text) to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. Grants
-- ----------------------------------------------------------------------------
grant usage on schema datareq to anon, authenticated, service_role;

-- service_role : tout (routes paiement / webhook / soumission publique)
grant all on all tables in schema datareq to service_role;
grant all on all sequences in schema datareq to service_role;

-- authenticated : CRUD filtré par RLS
grant select, insert, update, delete on all tables in schema datareq to authenticated;
grant usage on all sequences in schema datareq to authenticated;

-- anon : lecture des formulaires publics + dépôt de réponses + lecture des plans
grant select on datareq.forms, datareq.form_fields, datareq.plans to anon;
grant insert on datareq.responses, datareq.response_items to anon;

grant execute on all functions in schema datareq to anon, authenticated, service_role;

alter default privileges in schema datareq grant all on tables to service_role;
alter default privileges in schema datareq grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema datareq grant usage on sequences to authenticated, service_role;
alter default privileges in schema datareq grant execute on functions to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 6. Row Level Security
-- ----------------------------------------------------------------------------
alter table datareq.tenants               enable row level security;
alter table datareq.tenant_users          enable row level security;
alter table datareq.projects              enable row level security;
alter table datareq.forms                 enable row level security;
alter table datareq.form_fields           enable row level security;
alter table datareq.responses             enable row level security;
alter table datareq.response_items        enable row level security;
alter table datareq.data_subject_requests enable row level security;
alter table datareq.legal_rules           enable row level security;
alter table datareq.audit_logs            enable row level security;
alter table datareq.plans                 enable row level security;
alter table datareq.subscriptions         enable row level security;
alter table datareq.invoices              enable row level security;
alter table datareq.super_admins          enable row level security;
alter table datareq.admin_audit_log       enable row level security;

-- 6.1 tenants ------------------------------------------------------------------
drop policy if exists tenants_select on datareq.tenants;
create policy tenants_select on datareq.tenants for select to authenticated
  using (datareq.is_tenant_member(id) or created_by = auth.uid() or datareq.is_super_admin());

drop policy if exists tenants_insert on datareq.tenants;
create policy tenants_insert on datareq.tenants for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists tenants_update on datareq.tenants;
create policy tenants_update on datareq.tenants for update to authenticated
  using (datareq.is_tenant_admin(id) or datareq.is_super_admin())
  with check (datareq.is_tenant_admin(id) or datareq.is_super_admin());

drop policy if exists tenants_delete on datareq.tenants;
create policy tenants_delete on datareq.tenants for delete to authenticated
  using (datareq.is_tenant_admin(id) or datareq.is_super_admin());

-- 6.2 tenant_users -------------------------------------------------------------
drop policy if exists tenant_users_select on datareq.tenant_users;
create policy tenant_users_select on datareq.tenant_users for select to authenticated
  using (user_id = auth.uid() or datareq.is_tenant_member(tenant_id) or datareq.is_super_admin());

drop policy if exists tenant_users_insert on datareq.tenant_users;
create policy tenant_users_insert on datareq.tenant_users for insert to authenticated
  with check (
    datareq.is_tenant_admin(tenant_id)
    or datareq.is_super_admin()
    -- créateur d'un tenant (route /api/tenants) qui s'ajoute lui-même
    or (tenant_users.user_id = auth.uid() and exists (
          select 1 from datareq.tenants t
          where t.id = tenant_users.tenant_id and t.created_by = auth.uid()))
  );

drop policy if exists tenant_users_update on datareq.tenant_users;
create policy tenant_users_update on datareq.tenant_users for update to authenticated
  using (datareq.is_tenant_admin(tenant_id) or datareq.is_super_admin())
  with check (datareq.is_tenant_admin(tenant_id) or datareq.is_super_admin());

drop policy if exists tenant_users_delete on datareq.tenant_users;
create policy tenant_users_delete on datareq.tenant_users for delete to authenticated
  using (datareq.is_tenant_admin(tenant_id) or datareq.is_super_admin());

-- 6.3 projects -----------------------------------------------------------------
drop policy if exists projects_select on datareq.projects;
create policy projects_select on datareq.projects for select to authenticated
  using (datareq.is_tenant_member(tenant_id) or datareq.is_super_admin());

drop policy if exists projects_insert on datareq.projects;
create policy projects_insert on datareq.projects for insert to authenticated
  with check (datareq.is_tenant_editor(tenant_id));

drop policy if exists projects_update on datareq.projects;
create policy projects_update on datareq.projects for update to authenticated
  using (datareq.is_tenant_editor(tenant_id))
  with check (datareq.is_tenant_editor(tenant_id));

drop policy if exists projects_delete on datareq.projects;
create policy projects_delete on datareq.projects for delete to authenticated
  using (datareq.is_tenant_admin(tenant_id));

-- 6.4 forms --------------------------------------------------------------------
drop policy if exists forms_select on datareq.forms;
create policy forms_select on datareq.forms for select to authenticated
  using (datareq.is_tenant_member(tenant_id) or datareq.is_super_admin()
         or (status = 'published' and is_public));

drop policy if exists forms_public_select on datareq.forms;
create policy forms_public_select on datareq.forms for select to anon
  using (status = 'published' and is_public);

drop policy if exists forms_insert on datareq.forms;
create policy forms_insert on datareq.forms for insert to authenticated
  with check (datareq.is_tenant_editor(tenant_id));

drop policy if exists forms_update on datareq.forms;
create policy forms_update on datareq.forms for update to authenticated
  using (datareq.is_tenant_editor(tenant_id))
  with check (datareq.is_tenant_editor(tenant_id));

drop policy if exists forms_delete on datareq.forms;
create policy forms_delete on datareq.forms for delete to authenticated
  using (datareq.is_tenant_admin(tenant_id));

-- 6.5 form_fields --------------------------------------------------------------
drop policy if exists form_fields_select on datareq.form_fields;
create policy form_fields_select on datareq.form_fields for select to authenticated
  using (datareq.is_tenant_member(datareq.form_tenant(form_id))
         or datareq.form_is_public(form_id) or datareq.is_super_admin());

drop policy if exists form_fields_public_select on datareq.form_fields;
create policy form_fields_public_select on datareq.form_fields for select to anon
  using (datareq.form_is_public(form_id));

drop policy if exists form_fields_insert on datareq.form_fields;
create policy form_fields_insert on datareq.form_fields for insert to authenticated
  with check (datareq.is_tenant_editor(datareq.form_tenant(form_id)));

drop policy if exists form_fields_update on datareq.form_fields;
create policy form_fields_update on datareq.form_fields for update to authenticated
  using (datareq.is_tenant_editor(datareq.form_tenant(form_id)))
  with check (datareq.is_tenant_editor(datareq.form_tenant(form_id)));

drop policy if exists form_fields_delete on datareq.form_fields;
create policy form_fields_delete on datareq.form_fields for delete to authenticated
  using (datareq.is_tenant_editor(datareq.form_tenant(form_id)));

-- 6.6 responses ----------------------------------------------------------------
drop policy if exists responses_select on datareq.responses;
create policy responses_select on datareq.responses for select to authenticated
  using (datareq.is_tenant_member(tenant_id) or datareq.is_super_admin());

-- Dépôt public (anon ou utilisateur connecté) sur un formulaire publié+public.
-- La cohérence tenant/projet est imposée par le WITH CHECK.
drop policy if exists responses_public_insert on datareq.responses;
create policy responses_public_insert on datareq.responses for insert to anon, authenticated
  with check (
    datareq.form_is_public(responses.form_id)
    and exists (select 1 from datareq.forms f
                where f.id = responses.form_id
                  and f.tenant_id = responses.tenant_id
                  and f.project_id = responses.project_id)
  );

drop policy if exists responses_delete on datareq.responses;
create policy responses_delete on datareq.responses for delete to authenticated
  using (datareq.is_tenant_admin(tenant_id));

-- 6.7 response_items -----------------------------------------------------------
drop policy if exists response_items_select on datareq.response_items;
create policy response_items_select on datareq.response_items for select to authenticated
  using (datareq.is_tenant_member(datareq.response_tenant(response_id)) or datareq.is_super_admin());

drop policy if exists response_items_public_insert on datareq.response_items;
create policy response_items_public_insert on datareq.response_items for insert to anon, authenticated
  with check (
    exists (select 1 from datareq.responses r
            where r.id = response_items.response_id and datareq.form_is_public(r.form_id))
  );

drop policy if exists response_items_delete on datareq.response_items;
create policy response_items_delete on datareq.response_items for delete to authenticated
  using (datareq.is_tenant_admin(datareq.response_tenant(response_id)));

-- 6.8 data_subject_requests ----------------------------------------------------
drop policy if exists dsr_select on datareq.data_subject_requests;
create policy dsr_select on datareq.data_subject_requests for select to authenticated
  using (datareq.is_tenant_member(tenant_id) or datareq.is_super_admin());

drop policy if exists dsr_insert on datareq.data_subject_requests;
create policy dsr_insert on datareq.data_subject_requests for insert to authenticated
  with check (datareq.is_tenant_editor(tenant_id));

drop policy if exists dsr_update on datareq.data_subject_requests;
create policy dsr_update on datareq.data_subject_requests for update to authenticated
  using (datareq.is_tenant_editor(tenant_id))
  with check (datareq.is_tenant_editor(tenant_id));

drop policy if exists dsr_delete on datareq.data_subject_requests;
create policy dsr_delete on datareq.data_subject_requests for delete to authenticated
  using (datareq.is_tenant_admin(tenant_id));

-- 6.9 legal_rules --------------------------------------------------------------
drop policy if exists legal_rules_select on datareq.legal_rules;
create policy legal_rules_select on datareq.legal_rules for select to authenticated
  using (tenant_id is null or datareq.is_tenant_member(tenant_id) or datareq.is_super_admin());

drop policy if exists legal_rules_insert on datareq.legal_rules;
create policy legal_rules_insert on datareq.legal_rules for insert to authenticated
  with check ((tenant_id is not null and datareq.is_tenant_admin(tenant_id)) or datareq.is_super_admin());

drop policy if exists legal_rules_update on datareq.legal_rules;
create policy legal_rules_update on datareq.legal_rules for update to authenticated
  using ((tenant_id is not null and datareq.is_tenant_admin(tenant_id)) or datareq.is_super_admin())
  with check ((tenant_id is not null and datareq.is_tenant_admin(tenant_id)) or datareq.is_super_admin());

drop policy if exists legal_rules_delete on datareq.legal_rules;
create policy legal_rules_delete on datareq.legal_rules for delete to authenticated
  using ((tenant_id is not null and datareq.is_tenant_admin(tenant_id)) or datareq.is_super_admin());

-- 6.10 audit_logs (append-only côté client) ------------------------------------
drop policy if exists audit_logs_select on datareq.audit_logs;
create policy audit_logs_select on datareq.audit_logs for select to authenticated
  using (datareq.is_tenant_member(tenant_id) or datareq.is_super_admin());

drop policy if exists audit_logs_insert on datareq.audit_logs;
create policy audit_logs_insert on datareq.audit_logs for insert to authenticated
  with check (datareq.is_tenant_member(tenant_id));

-- 6.11 plans (catalogue public en lecture) -------------------------------------
drop policy if exists plans_select on datareq.plans;
create policy plans_select on datareq.plans for select to anon, authenticated
  using (is_active or datareq.is_super_admin());

drop policy if exists plans_admin_write on datareq.plans;
create policy plans_admin_write on datareq.plans for all to authenticated
  using (datareq.is_super_admin())
  with check (datareq.is_super_admin());

-- 6.12 subscriptions -----------------------------------------------------------
drop policy if exists subscriptions_select on datareq.subscriptions;
create policy subscriptions_select on datareq.subscriptions for select to authenticated
  using (datareq.is_tenant_member(tenant_id) or datareq.is_super_admin());

-- Les changements de statut/période passent par le service_role (paiements)
-- ou par un super admin (useSuperAdmin.ts).
drop policy if exists subscriptions_admin_write on datareq.subscriptions;
create policy subscriptions_admin_write on datareq.subscriptions for all to authenticated
  using (datareq.is_super_admin())
  with check (datareq.is_super_admin());

-- 6.13 invoices ----------------------------------------------------------------
drop policy if exists invoices_select on datareq.invoices;
create policy invoices_select on datareq.invoices for select to authenticated
  using (datareq.is_tenant_member(tenant_id) or datareq.is_super_admin());

drop policy if exists invoices_admin_write on datareq.invoices;
create policy invoices_admin_write on datareq.invoices for all to authenticated
  using (datareq.is_super_admin())
  with check (datareq.is_super_admin());

-- 6.14 super_admins (chacun ne voit que sa ligne) ------------------------------
drop policy if exists super_admins_select_self on datareq.super_admins;
create policy super_admins_select_self on datareq.super_admins for select to authenticated
  using (user_id = auth.uid() or datareq.is_super_admin());

-- 6.15 admin_audit_log ---------------------------------------------------------
drop policy if exists admin_audit_log_select on datareq.admin_audit_log;
create policy admin_audit_log_select on datareq.admin_audit_log for select to authenticated
  using (datareq.is_super_admin());

drop policy if exists admin_audit_log_insert on datareq.admin_audit_log;
create policy admin_audit_log_insert on datareq.admin_audit_log for insert to authenticated
  with check (
    datareq.is_super_admin()
    and admin_audit_log.admin_id = (select sa.id from datareq.super_admins sa where sa.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 7. Seeds
-- ----------------------------------------------------------------------------

-- 7.1 plans (price_monthly en centimes d'euro ; ≈ FCFA via 655,957)
--   free    :     0 €  →        0 FCFA
--   starter :    15 €  →  ~ 9 840 FCFA / mois
--   pro     :    45 €  →  ~29 520 FCFA / mois
insert into datareq.plans
  (id, name, display_name, price_monthly, max_projects, max_forms_per_project,
   max_responses_per_month, max_users, features, is_active, sort_order)
values
  ('11111111-1111-4111-8111-000000000001', 'free', 'Gratuit', 0,
   1, 2, 100, 1,
   '{"export_csv": true, "anonymization": true, "public_forms": true,
     "audit_log": false, "custom_legal_rules": false, "api_access": false,
     "priority_support": false}'::jsonb,
   true, 1),
  ('11111111-1111-4111-8111-000000000002', 'starter', 'Starter', 1500,
   5, 10, 2000, 3,
   '{"export_csv": true, "anonymization": true, "public_forms": true,
     "audit_log": true, "custom_legal_rules": false, "api_access": false,
     "priority_support": false}'::jsonb,
   true, 2),
  ('11111111-1111-4111-8111-000000000003', 'pro', 'Pro', 4500,
   -1, -1, -1, 10,
   '{"export_csv": true, "anonymization": true, "public_forms": true,
     "audit_log": true, "custom_legal_rules": true, "api_access": true,
     "priority_support": true}'::jsonb,
   true, 3)
on conflict (name) do update set
  display_name            = excluded.display_name,
  price_monthly           = excluded.price_monthly,
  max_projects            = excluded.max_projects,
  max_forms_per_project   = excluded.max_forms_per_project,
  max_responses_per_month = excluded.max_responses_per_month,
  max_users               = excluded.max_users,
  features                = excluded.features,
  is_active               = excluded.is_active,
  sort_order              = excluded.sort_order;

-- 7.2 legal_rules globales (tenant_id null) — base RGPD + loi camerounaise
create unique index if not exists legal_rules_global_ref_key
  on datareq.legal_rules (jurisdiction, article_ref) where tenant_id is null;

insert into datareq.legal_rules (tenant_id, jurisdiction, article_ref, title, rule_text, tags)
values
  (null, 'UE — RGPD', 'Art. 5',  'Principes relatifs au traitement',
   'Licéité, loyauté, transparence ; limitation des finalités ; minimisation ; exactitude ; limitation de la conservation ; intégrité et confidentialité.',
   '{principes,minimisation}'),
  (null, 'UE — RGPD', 'Art. 6',  'Licéité du traitement',
   'Tout traitement doit reposer sur une base légale : consentement, contrat, obligation légale, intérêt vital, mission d''intérêt public ou intérêt légitime.',
   '{base-legale,consentement}'),
  (null, 'UE — RGPD', 'Art. 13', 'Information des personnes',
   'Lors de la collecte, informer la personne : identité du responsable, finalités, base légale, destinataires, durée de conservation, droits.',
   '{information,formulaire}'),
  (null, 'UE — RGPD', 'Art. 15', 'Droit d''accès',
   'La personne concernée peut obtenir confirmation du traitement et une copie de ses données. Délai de réponse : 1 mois.',
   '{droits,acces,dsr}'),
  (null, 'UE — RGPD', 'Art. 17', 'Droit à l''effacement',
   'La personne peut obtenir l''effacement de ses données dans les meilleurs délais lorsque l''un des motifs de l''article 17 s''applique.',
   '{droits,effacement,dsr}'),
  (null, 'UE — RGPD', 'Art. 20', 'Droit à la portabilité',
   'Les données fournies par la personne doivent pouvoir lui être restituées dans un format structuré, couramment utilisé et lisible par machine.',
   '{droits,portabilite,dsr}'),
  (null, 'UE — RGPD', 'Art. 30', 'Registre des activités de traitement',
   'Tenir un registre écrit des traitements : finalités, catégories de données et de personnes, destinataires, durées, mesures de sécurité.',
   '{registre,documentation}'),
  (null, 'UE — RGPD', 'Art. 32', 'Sécurité du traitement',
   'Mettre en œuvre des mesures techniques et organisationnelles appropriées, dont la pseudonymisation et le chiffrement.',
   '{securite,pseudonymisation}'),
  (null, 'Cameroun', 'Loi n° 2010/012', 'Cybersécurité et cybercriminalité',
   'Obligation de protéger les données à caractère personnel traitées par des moyens électroniques et de garantir leur confidentialité.',
   '{cameroun,securite}'),
  (null, 'Cameroun', 'Loi n° 2024/017', 'Protection des données à caractère personnel',
   'Cadre camerounais de protection des données : consentement, droits des personnes, obligations du responsable de traitement, autorité de contrôle.',
   '{cameroun,droits,consentement}')
on conflict (jurisdiction, article_ref) where tenant_id is null do nothing;

commit;

-- Recharger le cache de schéma PostgREST
notify pgrst, 'reload schema';
