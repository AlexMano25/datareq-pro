#!/bin/bash
# DataReq Pro — pousser le code sur GitHub (le déploiement VPS est décrit dans deploy/vps/README.md)
set -e
echo "=== DataReq Pro - Push GitHub ==="
cd "$(dirname "$0")"

if [ ! -d ".git" ]; then
  git init
  git add -A
  git commit -m "Initial commit: DataReq Pro MVP"
fi

git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/AlexMano25/datareq-pro.git
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"

echo ""
echo "=== Code poussé sur GitHub ==="
echo "Variables d'environnement : voir .env.example (aucune valeur ne doit être commitée)."
echo "Déploiement VPS : deploy/vps/README.md"
