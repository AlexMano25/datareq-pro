-- =============================================================================
-- DataReq Pro — Y-Note (PayNote) : Orange Money + MTN MoMo par push USSD
-- Rejouable. À appliquer après 20260906000000_datareq_schema.sql :
--   docker exec -i supabase-db psql -U supabase_admin -d datareq -v ON_ERROR_STOP=1 \
--     < supabase/migrations/20260906100000_ynote.sql
--
-- Règle métier : carte bancaire → CamPay (lien de paiement),
--                Orange Money / MTN MoMo → Y-Note (push USSD).
-- =============================================================================

-- 1. Colonnes fournisseur ------------------------------------------------------
alter table datareq.invoices
  add column if not exists provider          text,
  add column if not exists ynote_message_id  text,   -- MessageId renvoyé par Y-Note
  add column if not exists provider_status   text,   -- dernier statut brut du fournisseur
  add column if not exists provider_payload  jsonb;  -- dernière réponse / notification brute

-- 2. Contraintes : payment_method + provider ----------------------------------
alter table datareq.invoices drop constraint if exists invoices_payment_method_check;
alter table datareq.invoices
  add constraint invoices_payment_method_check
  check (
    payment_method is null
    or payment_method in ('campay_om', 'campay_momo', 'campay_card', 'ynote_om', 'ynote_momo', 'manual')
  );

alter table datareq.invoices drop constraint if exists invoices_provider_check;
alter table datareq.invoices
  add constraint invoices_provider_check
  check (provider is null or provider in ('campay', 'ynote', 'manual'));

-- 3. Reprise des lignes existantes -------------------------------------------
update datareq.invoices
   set provider = case
                    when payment_method like 'campay_%' then 'campay'
                    when payment_method like 'ynote_%'  then 'ynote'
                    when payment_method = 'manual'      then 'manual'
                  end
 where provider is null and payment_method is not null;

-- 4. Index ---------------------------------------------------------------------
create index if not exists invoices_ynote_message_id_idx on datareq.invoices (ynote_message_id);

-- 5. Documentation -------------------------------------------------------------
comment on column datareq.invoices.provider         is 'campay (carte) | ynote (Orange Money / MTN MoMo) | manual';
comment on column datareq.invoices.ynote_message_id is 'MessageId Y-Note (webpayment) — clé de suivi du push USSD';
comment on column datareq.invoices.provider_status  is 'Dernier statut brut renvoyé par le fournisseur de paiement';
comment on column datareq.invoices.provider_payload is 'Dernière réponse/notification brute du fournisseur (débogage)';

notify pgrst, 'reload schema';
