# 漢字ノート — Kanji Note

Carnet personnel de vocabulaire et de kanji japonais, avec révision par quiz et lexique que tu enrichis toi-même.

⚠️ **Différence avec la version artefact Claude** : cette version utilise le `localStorage` du navigateur au lieu du stockage de Claude. Tes données restent donc **sur l'appareil et le navigateur** où tu utilises l'app (pas de synchronisation automatique entre ton téléphone et ton ordinateur). Si tu changes de navigateur ou vides le cache, le lexique repart de zéro.

## 1. Installer les outils nécessaires (une seule fois)

Il te faut [Node.js](https://nodejs.org/) (version 18 ou plus) installé sur ton ordinateur.

## 2. Lancer le projet en local

```bash
npm install
npm run dev
```

Puis ouvre l'adresse affichée dans le terminal (en général `http://localhost:5173`).

## 3. Mettre le projet sur GitHub

```bash
git init
git add .
git commit -m "Premier commit : Kanji Note"
git branch -M main
git remote add origin https://github.com/<ton-utilisateur>/kanji-note.git
git push -u origin main
```

Remplace `<ton-utilisateur>` par ton nom d'utilisateur GitHub, et crée d'abord un dépôt vide nommé `kanji-note` sur github.com (bouton "New repository").

## 3bis. Publication automatique (recommandé, sans rien installer)

Ce projet contient déjà un fichier `.github/workflows/deploy.yml` qui demande à GitHub de construire et publier le site tout seul à chaque fois que tu envoies des fichiers, directement depuis ton navigateur. Voir la section suivante pour la marche à suivre complète.

## 4. Déployer en site accessible depuis ton téléphone (GitHub Pages)

Option la plus simple :

```bash
npm install
npm run build
npm run deploy
```

Cela publie le contenu de `dist/` sur une branche `gh-pages`. Ensuite, dans les paramètres du dépôt GitHub (`Settings` → `Pages`), choisis la branche `gh-pages` comme source. Ton site sera disponible à l'adresse :

```
https://<ton-utilisateur>.github.io/kanji-note/
```

Si tu renommes ton dépôt autrement que `kanji-note`, pense à modifier la ligne `base` dans `vite.config.js` pour qu'elle corresponde exactement au nom du dépôt.

## 5. Ajouter l'app à ton écran d'accueil Android

1. Ouvre l'URL de ton site (`https://<ton-utilisateur>.github.io/kanji-note/`) dans Chrome sur ton téléphone.
2. Appuie sur le menu ⋮ en haut à droite.
3. Choisis **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**.

Une icône apparaît sur ton téléphone et l'app s'ouvre en plein écran, comme une vraie application.

## Structure du projet

```
kanji-note/
├── index.html          point d'entrée HTML
├── public/
│   ├── icon.svg         icône de l'app
│   └── manifest.json     配置 pour l'installation sur mobile
├── src/
│   ├── main.jsx          démarrage React
│   ├── App.jsx           toute la logique et l'interface de l'app
│   └── index.css         style minimal de base
├── package.json
└── vite.config.js
```

Toute la logique (quiz, lexique, ajout de mots/kanji, statistiques) est dans `src/App.jsx` — tu n'as pas besoin d'y toucher pour utiliser l'app au quotidien, seulement si tu veux modifier son fonctionnement.
