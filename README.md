# twisty-export

Générateur de vidéos de cubes Rubik avec cubing.js, Playwright et ffmpeg.

## Prérequis

- Node.js 18+
- ffmpeg dans le PATH
- Chromium pour Playwright

```bash
npm install
npx playwright install chromium
```

## Utilisation

### Prévisualisation

```bash
npm run dev
```

Ouvrir http://localhost:5173 pour tester les algos et réglages.

### Export unique

```bash
npm run export -- --alg="R U R' U'" --name="Sexy Move" --notation="R U R' U'" --out="out/Sexy_Move.mp4" --bg="#0e0f12" --speedFast=2.6 --speedSlow=0.65 --repeats=3 --puzzle="3x3x3"
```

### Paramètres

- `--alg` : Algorithme (requis)
- `--name` : Nom affiché dans l'overlay (défaut: "")
- `--notation` : Notation affichée (défaut: alg)
- `--out` : Fichier de sortie MP4 (défaut: out/export.mp4)
- `--puzzle` : Type de puzzle (défaut: 3x3x3)
- `--speedFast` : Vitesse partie rapide (défaut: 2.6)
- `--speedSlow` : Vitesse partie lente (défaut: 0.65)
- `--repeats` : Nombre de répétitions rapides (défaut: 3)
- `--bg` : Couleur de fond (défaut: #0e0f12)
- `--bgImage` : Chemin image de fond (optionnel, remplace bg)

### Export en batch

Créer un fichier CSV avec colonnes: `name,alg,notation,puzzle,speedFast,speedSlow,repeats,bg,bgImage,out`

```bash
npm run batch -- batch.csv
```

## Dépannage

### Écran noir en headless

Si la vidéo est noire, essayer avec `headless: false` dans `scripts/exportOne.mjs` pour debug.

Les flags GPU fournis devraient résoudre le problème sur la plupart des systèmes:

- `--use-gl=egl`
- `--enable-webgl`
- `--ignore-gpu-blocklist`
- `--disable-software-rasterizer`

Sur Windows, ajouter `--disable-gpu` si nécessaire.

### FFmpeg non trouvé

Vérifier que ffmpeg est dans le PATH:

```bash
ffmpeg -version
```

## Structure du rendu

1. **Partie A (rapide)** : L'algo est répété N fois à vitesse `speedFast`
2. **Partie B (lente)** : L'algo est joué 1 fois à vitesse `speedSlow` avec overlays visibles

Avant chaque partie, l'inverse de l'algorithme est appliqué en setup pour que le cube finisse résolu.

## Format de sortie

- Résolution: 1080x1920 (vertical)
- Format: MP4 H.264
- Pixel format: yuv420p
- Framerate: 30 fps
- CRF: 20 (haute qualité)
