#!/bin/bash
echo "=== DataReq Pro - Déploiement ==="
cd "$(dirname "$0")"

# Init git if needed
if [ ! -d ".git" ]; then
  git init
  git add -A
  git commit -m "Initial commit: DataReq Pro MVP"
fi

# Add remote
git remote remove origin 2>/dev/null
git remote add origin https://github.com/AlexMano25/datareq-pro.git
git branch -M main
git push -u origin main

echo ""
echo "=== Code poussé sur GitHub ==="
echo "Maintenant, allez sur: https://vercel.com/new/manoverde"
echo "et importez le repo AlexMano25/datareq-pro"
echo ""
echo "Variables d'environnement à ajouter:"
echo "  NEXT_PUBLIC_SUPABASE_URL = https://plxivltxibbomhsjhkbk.supabase.co"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseGl2bHR4aWJib21oc2poa2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODE5MjIsImV4cCI6MjA4ODE1NzkyMn0.BT7yDfQz5-Xd7vFzEj_5ju4ayTRhV1d8r0qSzAoC7NQ"
