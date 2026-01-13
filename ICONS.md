# Icônes PWA

L'application nécessite des icônes pour la PWA. Vous devez créer les fichiers suivants dans le dossier `public/`:

- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

## Comment créer les icônes

### Option 1: Générateur en ligne

1. Créez une icône de base (1024x1024px recommandé)
2. Utilisez un outil comme [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) ou [RealFaviconGenerator](https://realfavicongenerator.net/)
3. Téléchargez les icônes générées
4. Placez `icon-192.png` et `icon-512.png` dans `public/`

### Option 2: Créer manuellement

Utilisez un outil comme:
- **Figma** (gratuit, en ligne)
- **Canva** (gratuit, en ligne)
- **GIMP** (gratuit, téléchargeable)
- **Photoshop** (payant)

Dimensions requises:
- `icon-192.png`: 192x192 pixels
- `icon-512.png`: 512x512 pixels

Conseil: Créez d'abord une version 1024x1024px, puis redimensionnez-la.

## Fichier favicon

Le fichier `favicon.ico` doit également être créé (16x16, 32x32, 48x48 pixels combinés en .ico).

Vous pouvez utiliser [favicon.io](https://favicon.io/) pour générer automatiquement tous les formats nécessaires.

## Vérification

Après avoir ajouté les icônes:
1. Lancez `npm run build`
2. Vérifiez que les fichiers sont dans `dist/`
3. Testez l'installation PWA dans le navigateur


