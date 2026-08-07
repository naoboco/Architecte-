# ARCHI — jeu d'architecture (V1)

Prototype jouable pour découvrir l'architecture par la manipulation.

## Inspirations fonctionnelles
- Planner 5D : plan 2D, manipulation de pièces/meubles et logique glisser-déposer.
- SketchUp for Schools : apprentissage de la modélisation par projets.
- Minecraft Education : défis de construction, recherche, planification et créativité.

Le code et le design de ce projet sont originaux : il reprend des principes d'interaction généraux, pas le code ou les éléments graphiques de ces produits.

## Jouer localement

```bash
python -m http.server 8000
```
Puis ouvrir http://localhost:8000

## GitHub Pages
Déposer le contenu du dossier à la racine d'un dépôt GitHub puis activer **Settings → Pages → Deploy from a branch**.

## V1 incluse
- mode carrière et XP sauvegardés dans localStorage
- studio de plan 2D : pièces redimensionnables, portes, fenêtres et meubles
- analyse simple d'un plan
- sauvegarde de projets dans un portfolio
- jeu de structures (pont + triangles + test de charge)
- jeu de lumière (soleil, orientation et fenêtre)
- jeu d'échelles 1:50
- feed d'exploration
- PWA / fonctionnement hors ligne après première ouverture

## Étape suivante recommandée
Passer le Studio en moteur géométrique plus avancé : murs segmentés, snap des ouvertures aux murs, collisions, circulation et véritable vue 3D WebGL/Three.js.
