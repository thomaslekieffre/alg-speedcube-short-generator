# 🎬 Twisty Export

Générateur de vidéos verticales professionnelles pour cubes Rubik avec animations dynamiques.

## Prérequis

- Node.js 18+
- ffmpeg dans le PATH
- Chromium pour Playwright

```bash
npm install
npx playwright install chromium
```

## 🚀 Démarrage rapide

### Interface web (recommandé)

```bash
npm run dev
```

Ouvrir **http://localhost:5173** et utiliser l'interface pour générer votre commande d'export !

### Export en ligne de commande

```bash
npm run export -- --alg="R U R' U' M' U R U' R' M" --name="OLL 57" --notation="R U R' U' M' U R U' R' M" --puzzle="3x3x3" --bg="#667eea" --speed1=1.5 --speedSetup=3.0 --speed2=1.0 --showFlash=1 --showGlow=1 --showSpeed=1 --showMoves=1 --out="out/OLL_57.mp4"
```

## 📋 Paramètres

### Obligatoires

- `--alg` : Algorithme en notation standard (ex: "R U R' U'")
- `--name` : Nom affiché en haut (ex: "OLL 57")
- `--out` : Fichier de sortie MP4 (ex: "out/OLL_57.mp4")

### Optionnels

- `--notation` : Notation affichée en bas (défaut: même que alg)
- `--puzzle` : Type de puzzle (défaut: 3x3x3)
- `--bg` : Couleur de fond hex (défaut: aléatoire)
- `--speed1` : Vitesse lecture 1 (défaut: 1.5)
- `--speedSetup` : Vitesse reverse/setup (défaut: 3.0)
- `--speed2` : Vitesse lecture 2 (défaut: 1.0)
- `--showFlash` : Flash entre phases 0/1 (défaut: 1)
- `--showGlow` : Glow pulsant nom 0/1 (défaut: 1)
- `--showSpeed` : Badge vitesse 0/1 (défaut: 1)
- `--showMoves` : Compteur mouvements 0/1 (défaut: 1)
- `--trimStart` : Coupe début en secondes ou "auto" (défaut: auto)
- `--tailPad` : Marge fin en ms (défaut: 3000)
- `--headless` : Mode headless true/false (défaut: true)

## 🎥 Structure de la vidéo

La vidéo générée contient 3 phases :

1. **Lecture 1** (vitesse speed1)

   - Algorithme joué complètement
   - Nom + notation affichés
   - Compteur et vitesse visibles

2. **SETUP - Reverse** (vitesse speedSetup)

   - L'inverse de l'algorithme joué rapidement
   - "SETUP" affiché en haut (avec glow si activé)
   - Retour à l'état de départ

3. **Lecture 2** (vitesse speed2)
   - Algorithme rejoué complètement
   - Nom + notation affichés
   - Généralement plus lent pour voir les détails

## ✨ Fonctionnalités

### Effets visuels

- 🎨 **Fond gradient animé** : 3 couleurs harmonieuses générées à partir de votre choix
- 💫 **Glow pulsant** : Aura blanche qui pulse doucement sur le nom
- ✨ **Flash de transition** : Effet blanc cinématique entre chaque phase
- 🎯 **Pills blanches** : Overlays modernes pour nom et notation

### Indicateurs dynamiques

- 📊 **Compteur temps réel** : Badge vert en bas à gauche qui compte les mouvements
- ⚡ **Badge vitesse** : Badge blanc en bas à droite qui affiche la vitesse actuelle

### Optimisations

- 🔍 **Trim intelligent** : Détection et coupe automatique du noir initial
- 🚀 **FPS constants** : Optimisations GPU pour 30fps garanti
- 💾 **Compression optimale** : H.264 CRF 20 avec faststart

## 📦 Export en batch

Créer un fichier CSV :

```csv
name,alg,notation,puzzle,speed1,speedSetup,speed2,bg,out
OLL 57,R U R' U' M' U R U' R' M,R U R' U' M' U R U' R' M,3x3x3,1.5,3.0,1.0,#667eea,out/OLL_57.mp4
PBL 2,R U R U,R U R U,2x2x2,2.0,4.0,1.0,#28e6c0,out/PBL_2.mp4
F2L,R U' R' U2 R U R',R U' R' U2 R U R',3x3x3,1.5,3.0,1.0,#ff6b6b,out/F2L.mp4
```

```bash
npm run batch -- batch.csv
```

## 🔧 Dépannage

### Écran noir en headless

Ajouter `--headless=false` pour voir la fenêtre Chromium :

```bash
npm run export -- --alg="R U R' U'" --name="Test" --out="out/test.mp4" --headless=false
```

Les flags GPU fournis fonctionnent sur la plupart des systèmes Windows (SwiftShader).

### FFmpeg non trouvé

```bash
ffmpeg -version
```

Si absent, télécharger depuis https://ffmpeg.org/download.html

### Chutes de FPS

Les optimisations GPU sont activées par défaut. Si problème persiste :

- Tester avec des vitesses plus basses
- Vérifier que Chromium est à jour : `npx playwright install chromium`

### Vidéo trop courte / coupée

Augmenter le padding de fin :

```bash
--tailPad=5000
```

## 📐 Format de sortie

- **Résolution** : 1080×1920 (vertical, optimisé réseaux sociaux)
- **Format** : MP4 H.264
- **Pixel format** : yuv420p (compatible tous lecteurs)
- **Framerate** : 30 fps constant
- **CRF** : 20 (haute qualité)
- **Optimisations** : movflags +faststart pour streaming

## 🎨 Personnalisation

### Désactiver des effets

```bash
# Sans flash
--showFlash=0

# Sans glow
--showGlow=0

# Sans badges
--showSpeed=0 --showMoves=0

# Fond noir uni (pas de gradient)
--bg=#000000
```

### Vitesses recommandées

- **Rapide** : 1.5 - 2.5 (pour lecture 1)
- **Setup** : 3.0 - 5.0 (pour reverse rapide)
- **Lent** : 0.5 - 1.0 (pour lecture 2 détaillée)

### Puzzles supportés

- 3x3x3 (Rubik's Cube standard)
- 2x2x2 (Pocket Cube)
- 4x4x4, 5x5x5 (Revenge, Professor)
- Pyraminx, Megaminx, Skewb

## 🎯 Exemples

### OLL simple

```bash
npm run export -- --alg="R U R' U'" --name="Sexy Move" --bg="#3b82f6" --out="out/Sexy.mp4"
```

### PLL complexe

```bash
npm run export -- --alg="x R' U R' D2 R U' R' D2 R2 x'" --name="A-Perm" --speed1=1.2 --speed2=0.6 --bg="#ec4899" --out="out/A_Perm.mp4"
```

### 2x2x2 rapide

```bash
npm run export -- --alg="R U R U" --name="PBL 2" --puzzle="2x2x2" --speed1=2.0 --speedSetup=4.0 --bg="#10b981" --out="out/PBL_2.mp4"
```

## 📁 Structure du projet

```
twisty-export/
├── package.json          # Scripts et dépendances
├── vite.config.js        # Config serveur
├── README.md             # Cette doc
├── .gitignore
├── index.html            # Interface web de configuration
├── export.html           # Page de rendu pour Playwright
├── public/
│   └── fond.mp4         # Fond vidéo optionnel
└── scripts/
    ├── exportOne.mjs    # Export d'une vidéo
    └── batch.mjs        # Export batch CSV
```

## 🎬 Workflow complet

1. Lance `npm run dev`
2. Configure ton algo sur http://localhost:5173
3. Ajuste les vitesses et effets
4. Clique "Générer la commande"
5. Copie et exécute la commande dans un terminal
6. Récupère ta vidéo dans `out/`

---

## 📜 Licence

**IMPORTANT** : Les vidéos créées avec cet outil **ne peuvent pas être publiées** sans autorisation écrite de Lekieffre Thomas.

Voir le fichier [LICENSE](LICENSE) pour les détails complets.

Pour demander une autorisation de publication, contactez Lekieffre Thomas par mail : thomas.lekieffredev@gmail.com .

---

Fait avec ❤️ par Lekieffre Thomas pour Neanto  
© 2025 - Tous droits réservés
