# AutoÉcole — Code de la route (Bénin)

Application locale d'apprentissage du code de la route, construite à partir du
**Manuel du candidat à l'examen du permis de conduire** (édition 2011, Direction
Générale des Transports Terrestres du Bénin).

Aucun compte, aucun serveur : la progression est enregistrée dans le
`localStorage` du navigateur. L'interface est en français et pensée mobile
d'abord.

## Ce que contient l'application

- **919 questions corrigées** extraites du manuel, réparties sur 10 modules avec
  QCM (le chapitre I, sans QCM, est couvert par des fiches).
- **233 illustrations** découpées automatiquement du PDF, en WebP compressé.
- **Entraînement libre** : correction immédiate, questions non vues en priorité.
- **Quiz chronométré** : 5 secondes par question par défaut, passage automatique
  à l'expiration du temps.
- **Examen blanc configurable** : 20 à 40 questions, seuil de fautes réglable,
  tirage pondéré par module et correction uniquement à la fin.
- **Révisions espacées** (boîtes de Leitner, intervalles 1, 2, 4, 7, 15 jours) :
  une erreur renvoie la question en révision immédiate.
- **Suivi global et par module** : couverture, exactitude, maîtrise, questions
  dues, temps moyen, séries de jours, historique détaillé des sessions.
- **Fiches de cours** pour les généralités et la signalisation, rédigées à
  partir des définitions du chapitre I.
- **PWA** : manifeste, icônes et service worker pour un usage hors ligne après
  une première visite.

## Stack

- Next.js 16 (App Router, export statique `output: "export"`)
- React 19 et TypeScript
- Tailwind CSS 4
- lucide-react pour les icônes
- Vitest pour les tests unitaires
- PyMuPDF et Pillow pour l'extraction du PDF

## Démarrer

```bash
npm install
npm run dev
```

L'application est alors disponible sur <http://localhost:3000>.

## Construire et servir en statique

```bash
npm run build
npm run start   # sert le dossier out/ avec npx serve
```

Ou avec n'importe quel serveur de fichiers :

```bash
cd out && python3 -m http.server 4173
```

Le service worker ne s'enregistre qu'en production. Un premier chargement en
ligne est nécessaire pour mettre les pages en cache.

## Tests et vérifications

```bash
npm run typecheck
npm run test
```

## Régénérer les données depuis le PDF

Le script d'extraction lit le PDF à la racine du projet et écrit
`src/data/questions.json`, `public/questions/*.webp` et `scripts/report.json`.

```bash
python3 -m venv /tmp/autoecole-venv
/tmp/autoecole-venv/bin/pip install -r scripts/requirements.txt
/tmp/autoecole-venv/bin/python scripts/extract.py
```

Le parseur gère les options sur une ligne, les options numérotées sur plusieurs
lignes, les questions à réponses multiples, les libellés d'options en images
(a–e) et les variantes de rédaction des corrigés. Quelques coquilles évidentes
du document source sont corrigées via `ANSWER_OVERRIDES` (par exemple
`Réponse .d.` ou un corrigé citant une option inexistante). Le reste des
corrigés reste fidèle au manuel.

## Structure

```
src/
  app/            pages (parcours, cours, module, session, examen, révisions,
                  statistiques, réglages)
  components/     shell de navigation, composants UI et moteur de session
  data/           questions.json généré + fiches de cours
  lib/            contenu, progression, statistiques, répétition espacée,
                  formatage et sons
public/
  questions/      illustrations WebP
  icons/          icônes PWA
  sw.js           service worker
scripts/
  extract.py      extraction du PDF
  report.json     rapport de la dernière extraction
```

## Notes

- La progression est limitée à cet appareil et à ce navigateur. Les réglages
  permettent d'exporter et d'importer une sauvegarde JSON.
- Les questions à réponses multiples se valident explicitement ; les questions
  à réponse unique sont validées dès la sélection.
- Le score de préparation suit la formule :
  `100 × (0,20 × couverture + 0,50 × exactitude + 0,30 × maîtrise)`.
- Certains corrigés du manuel sont discutables ; ils ont été conservés pour ne
  pas trahir la source, sauf coquille manifeste.
