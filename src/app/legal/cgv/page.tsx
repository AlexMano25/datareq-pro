export const metadata = { title: 'Conditions Générales de Vente - DataReq Pro' };

export default function CGVPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Générales de Vente</h1>
      <p className="text-gray-500 mb-8">Dernière mise à jour : 13 mars 2026</p>

      <h2>1. Objet</h2>
      <p>Les présentes Conditions Générales de Vente (CGV) régissent les relations commerciales entre Mano Verde Inc SA et tout client professionnel souscrivant à un abonnement DataReq Pro.</p>

      <h2>2. Offres et tarifs</h2>
      <p>DataReq Pro est proposé en trois formules d'abonnement :</p>
      <p><strong>Plan Starter</strong> — 49 €/mois HT (588 €/an HT ou 468 €/an HT avec engagement annuel) : 3 projets, 5 formulaires/projet, 500 réponses/mois, 1 utilisateur, support email.</p>
      <p><strong>Plan Pro</strong> — 149 €/mois HT (1 788 €/an HT ou 1 488 €/an HT avec engagement annuel) : projets et formulaires illimités, 10 000 réponses/mois, 10 utilisateurs, analytics, audit trail, support prioritaire.</p>
      <p><strong>Plan Enterprise</strong> — Sur devis : volume et utilisateurs illimités, SSO/SAML, DPO dédié, SLA 99.99%, support 24/7.</p>
      <p>Les tarifs s'entendent hors taxes. La TVA applicable sera celle en vigueur au jour de la facturation selon la localisation du Client.</p>

      <h2>3. Essai gratuit</h2>
      <p>Un essai gratuit de 14 jours calendaires est proposé pour les plans Starter et Pro. Aucune carte bancaire n'est requise. À l'issue de la période d'essai, le Client choisit un plan payant ou son compte est mis en pause sans suppression de données pendant 30 jours.</p>

      <h2>4. Commande et activation</h2>
      <p>La commande est effectuée en ligne via le site datareq-pro.vercel.app. L'activation du Service est immédiate après validation du paiement ou début de l'essai gratuit. Un email de confirmation est envoyé au Client.</p>

      <h2>5. Facturation et paiement</h2>
      <p>La facturation est mensuelle ou annuelle selon le choix du Client. Le paiement s'effectue par carte bancaire (Visa, Mastercard, American Express) via Stripe. Les factures sont émises électroniquement et disponibles dans l'espace client. Elles sont conformes aux exigences légales françaises et européennes (mentions obligatoires, TVA).</p>

      <h2>6. Retard de paiement</h2>
      <p>En cas de retard de paiement, des pénalités de retard seront appliquées au taux de trois fois le taux d'intérêt légal en vigueur. Une indemnité forfaitaire de 40 € pour frais de recouvrement sera exigible de plein droit. L'accès au Service pourra être suspendu après une mise en demeure restée sans effet pendant 15 jours.</p>

      <h2>7. Dépassement de quota</h2>
      <p>En cas de dépassement du quota de réponses inclus dans le plan, les réponses excédentaires seront facturées au tarif suivant : 0,02 €/réponse pour le plan Starter, 0,01 €/réponse pour le plan Pro. Le Client est notifié automatiquement à 80% et 100% de son quota.</p>

      <h2>8. Durée et renouvellement</h2>
      <p>L'abonnement mensuel est conclu pour une durée d'un mois renouvelable par tacite reconduction. L'abonnement annuel est conclu pour une durée de 12 mois renouvelable par tacite reconduction. Le Client peut s'opposer au renouvellement à tout moment avant la date d'échéance.</p>

      <h2>9. Résiliation</h2>
      <p>Le Client peut résilier son abonnement à tout moment depuis son espace client. La résiliation prend effet à la fin de la période en cours. Aucun remboursement au prorata n'est effectué pour la période restante, sauf en cas de manquement grave de l'Éditeur. Pour l'engagement annuel, une pénalité de résiliation anticipée correspondant aux mois restants au tarif réduit sera appliquée.</p>

      <h2>10. Droit de rétractation</h2>
      <p>Conformément à l'article L221-28 du Code de la consommation français, le droit de rétractation ne s'applique pas aux contrats de fourniture de contenu numérique fourni sur un support immatériel dont l'exécution a commencé avec l'accord du consommateur. Toutefois, l'essai gratuit de 14 jours remplit une fonction équivalente de découverte sans engagement.</p>

      <h2>11. Garantie et limitation de responsabilité</h2>
      <p>L'Éditeur garantit la conformité du Service à sa description. La responsabilité totale de l'Éditeur est plafonnée au montant total payé par le Client au cours des 12 derniers mois.</p>

      <h2>12. Droit applicable</h2>
      <p>Les présentes CGV sont soumises au droit de la République Démocratique du Congo. Pour les clients européens, les dispositions impératives du droit de la consommation de leur pays de résidence s'appliquent en complément. Tout litige sera soumis aux tribunaux de Kinshasa après tentative de médiation.</p>

      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <p className="text-sm text-gray-600"><strong>Éditeur :</strong> Mano Verde Inc SA — RCCM en cours d'immatriculation</p>
        <p className="text-sm text-gray-600"><strong>Contact facturation :</strong> facturation@manovende.com</p>
        <p className="text-sm text-gray-500 mt-1">Document version 1.0 — Mars 2026</p>
      </div>
    </article>
  );
}
