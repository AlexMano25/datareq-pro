# DataReq Pro — déploiement VPS (Hostinger KVM2, Docker + Caddy + Cloudflare)

Cible : `https://rgpd.manovende.com` → conteneur `datareq-web:3000`,
base : Supabase auto-hébergé `https://datareq-db.manovende.com` (PostgREST + GoTrue).

## 0. Arborescence sur le VPS

```
/opt/apps/datareq/
├── docker-compose.yml      ← copie de deploy/vps/docker-compose.yml
├── .env                    ← NEXT_PUBLIC_* utilisées au build (non commité)
└── app/                    ← git clone du dépôt (branche vps-migration / main)
    └── api.env             ← variables runtime (voir .env.example), non commité
```

## 1. Base de données

Suivre `supabase/README.md` :

1. base `datareq` + schéma via `docker exec -i supabase-db psql -U supabase_admin -d datareq -v ON_ERROR_STOP=1 < supabase/migrations/20260906000000_datareq_schema.sql`
2. colonnes Y-Note (rejouable) : `docker exec -i supabase-db psql -U supabase_admin -d datareq -v ON_ERROR_STOP=1 < supabase/migrations/20260906100000_ynote.sql`
3. `PGRST_DB_SCHEMAS=public,datareq,storage` puis `docker compose restart rest`
4. GoTrue : `GOTRUE_SITE_URL=https://rgpd.manovende.com` et
   `GOTRUE_URI_ALLOW_LIST=https://rgpd.manovende.com/auth/callback,https://rgpd.manovende.com/**`
   (Google OAuth : renseigner `GOTRUE_EXTERNAL_GOOGLE_*` si utilisé).

## 2. Variables d'environnement

```bash
mkdir -p /opt/apps/datareq && cd /opt/apps/datareq
git clone https://github.com/AlexMano25/datareq-pro.git app
cp app/deploy/vps/docker-compose.yml .
cp app/.env.example app/api.env      # puis renseigner toutes les valeurs
```

`app/api.env` (runtime, lu par `env_file`) :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://datareq-db.manovende.com` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé anon de la stack Supabase (JWT signé avec `JWT_SECRET`) |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service_role (serveur uniquement) |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` | `https://rgpd.manovende.com` |
| `CAMPAY_ENVIRONMENT` | `DEMO` puis `PROD` (carte bancaire uniquement) |
| `CAMPAY_APP_USERNAME` / `CAMPAY_APP_PASSWORD` | identifiants de l'app CamPay |
| `CAMPAY_WEBHOOK_SECRET` | secret configuré dans le dashboard CamPay (`Authorization: Bearer …`) |
| `YNOTE_CLIENT_ID` / `YNOTE_CLIENT_SECRET` | OAuth2 Y-Note (Orange Money + MTN MoMo) |
| `YNOTE_CUSTOMER_KEY` / `YNOTE_CUSTOMER_SECRET` | identifiants marchand Y-Note (`API_MUT`) |
| `YNOTE_STATUS_URL` | optionnel — défaut `https://omapi.ynote.africa/prod/webpaymentmtn/status` |

### Règle métier paiements

| Moyen | Fournisseur | Routes |
|---|---|---|
| Carte bancaire (Visa / Mastercard) | CamPay — lien de paiement | `POST /api/payments/campay`, `GET /api/payments/campay/status`, `POST /api/webhooks/campay` |
| Orange Money, MTN Mobile Money | Y-Note — push USSD | `POST /api/payments/ynote`, `GET /api/payments/ynote/status`, `POST /api/webhooks/ynote` |

Le webhook Y-Note (`notifUrl`) est envoyé automatiquement à chaque `webpayment` :
`https://rgpd.manovende.com/api/webhooks/ynote` (dérivé de `NEXT_PUBLIC_APP_URL`).
Il **re-vérifie** le statut auprès de l'API Y-Note avant de passer la facture en `paid`
(idempotent : une seule transition `open → paid/void`, activation de l'abonnement une seule fois).

`/opt/apps/datareq/.env` (build, mêmes `NEXT_PUBLIC_*`) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://datareq-db.manovende.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://rgpd.manovende.com
NEXT_PUBLIC_SITE_URL=https://rgpd.manovende.com
```

> Les `NEXT_PUBLIC_*` sont inlinées dans le bundle client au `next build` :
> tout changement de ces valeurs impose un `docker compose build`.

## 3. Build & lancement

```bash
cd /opt/apps/datareq
docker compose build --no-cache datareq-web
docker compose up -d
docker logs -f datareq-web        # attendre "Ready in ..."
```

Le service rejoint le réseau externe `supabase_default` (celui de la stack Supabase
et de Caddy). Vérifier son nom : `docker network ls | grep supabase`.

## 4. Caddy — bloc à ajouter

Dans le `Caddyfile` de la stack (même bloc de site que les autres apps, ou un
site dédié), ajouter :

```caddyfile
@datareqapp host rgpd.manovende.com
handle @datareqapp {
    reverse_proxy datareq-web:3000
}
```

Variante en site dédié :

```caddyfile
rgpd.manovende.com {
    encode gzip
    reverse_proxy datareq-web:3000
}
```

Puis recharger : `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`
(adapter le nom du conteneur Caddy).

## 5. DNS / Cloudflare

- Enregistrement `rgpd.manovende.com` → tunnel Cloudflare existant (ou A vers 168.231.79.70, proxied).
- Si tunnel : route `rgpd.manovende.com` → `http://caddy:80` (ou l'origine utilisée par les autres apps).
- Mode SSL Cloudflare : Full (strict) si Caddy gère les certificats.

## 6. Vérifications post-déploiement

```bash
curl -sI https://rgpd.manovende.com | head -1                 # 200
curl -s https://rgpd.manovende.com/api/webhooks/campay         # {"status":"ok","service":"campay-webhook"}
curl -s https://rgpd.manovende.com/api/webhooks/ynote          # {"status":"ok","service":"ynote-webhook"}
```

Puis dans le navigateur : inscription → `register_tenant` crée tenant + essai 14 j →
`/dashboard/projects`. Créer un super admin via `supabase/README.md §5` pour `/admin`.

CamPay : déclarer l'URL de webhook `https://rgpd.manovende.com/api/webhooks/campay` (carte).
Y-Note : aucune déclaration côté dashboard, la `notifUrl` est transmise à chaque paiement ;
vérifier que `https://rgpd.manovende.com/api/webhooks/ynote` est joignable depuis Internet
(Cloudflare/Caddy) et que les 4 variables `YNOTE_*` sont renseignées dans `api.env`.

## 7. Mise à jour

```bash
cd /opt/apps/datareq/app && git pull
cd .. && docker compose build datareq-web && docker compose up -d
```
