# Parle Francais - Conversation audio avec Gemini

Application pour pratiquer le francais a l'oral : tu parles dans ton telephone,
l'IA te repond a voix haute en francais, corrige gentiment tes fautes, et
relance la conversation.

## 1. Obtenir une cle API Gemini (gratuite)

1. Va sur https://aistudio.google.com/apikey
2. Connecte-toi avec un compte Google (aucune carte bancaire demandee)
3. Clique "Create API key"
4. Copie la cle generee.

Note : l'API Gemini a un quota gratuit genereux par jour (largement suffisant
pour pratiquer tous les jours). Aucun paiement requis pour ce niveau d'usage.

## 2. Configurer la cle sur ton PC

Dans le dossier du projet, copie `.env.example` en `.env` :

```bash
cp .env.example .env
```

Puis ouvre `.env` et remplace la ligne par ta vraie cle :

```
GEMINI_API_KEY=ta-vraie-cle-ici
```

**Ne partage jamais ce fichier `.env`** (il est deja ignore par git via `.gitignore`).

## 3. Installer et lancer le serveur

Dans le dossier du projet :

```bash
npm install
npm start
```

Tu dois voir : `Serveur pret : http://localhost:3000`

## 4. Ouvrir l'app sur ton ordinateur (test rapide)

Ouvre simplement http://localhost:3000 dans Chrome sur ton PC.
Autorise l'acces au micro quand le navigateur le demande.

## 5. Ouvrir l'app sur ton telephone (usage reel)

Ton telephone doit etre sur le **meme reseau WiFi** que ton PC.

1. Trouve l'adresse IP locale de ton PC :
   - Windows : ouvre PowerShell et tape `ipconfig`, cherche "Adresse IPv4"
     (ex: `192.168.1.42`)
2. Sur ton telephone, ouvre le navigateur et va sur :
   `http://192.168.1.42:3000` (remplace par ton IP)
3. Autorise l'acces au micro.

Astuce : sur Android/Chrome, tu peux appuyer sur le menu (3 points) puis
"Ajouter a l'ecran d'accueil" pour que l'app se comporte comme une vraie
application mobile.

### Important : compatibilite navigateur

- **Chrome (Android ou PC)** : fonctionne parfaitement, micro + voix.
- **Safari (iPhone/iPad)** : la reconnaissance vocale (micro -> texte) n'est
  pas supportee par Safari. L'app bascule automatiquement en mode clavier
  (tu tapes tes phrases, Claude te repond quand meme a voix haute). Pour
  avoir le micro sur iPhone, installe Chrome depuis l'App Store et utilise-le.

## 6. Utiliser l'app

- Choisis ton niveau (Debutant / Intermediaire / Avance) en haut a droite.
- Appuie sur le bouton micro bleu, parle en francais, relache (ou attends
  la pause automatique).
- L'IA te repond a voix haute et corrige gentiment tes fautes.
- Bouton "Recommencer" pour repartir de zero.
- Bouton "Voix ON/OFF" pour couper la synthese vocale si besoin.
- Bouton "Clavier" pour taper au lieu de parler.

## Comment ca marche (architecture)

```
Telephone (navigateur)
   |  1. Micro -> texte (reconnaissance vocale du navigateur, gratuite)
   |  2. Envoie le texte a ton PC
   v
Serveur Node.js sur ton PC (server.js)
   |  3. Ajoute des instructions (niveau, correction des fautes...)
   |  4. Appelle l'API Gemini avec ta cle secrete
   v
API Gemini (Google)
   |  5. Renvoie une reponse en francais
   v
Retour au telephone
   |  6. Affiche le texte + le lit a voix haute (synthese vocale du navigateur)
```

La cle API reste toujours sur ton PC (dans `.env`), jamais exposee dans le
navigateur : c'est le serveur qui fait l'intermediaire de facon securisee.

## Depannage

- **"Cle API manquante"** : verifie que le fichier `.env` existe et contient
  bien `GEMINI_API_KEY=...`, puis relance `npm start`.
- **Le micro ne marche pas sur telephone** : verifie que tu es bien en
  `http://` (pas besoin de https en local) et que le micro est autorise dans
  les parametres du navigateur. Sur iPhone, utilise Chrome plutot que Safari.
- **Impossible d'acceder depuis le telephone** : verifie que PC et telephone
  sont sur le meme WiFi, et que le pare-feu Windows n'ecran pas Node.js
  (une fenetre "Autoriser l'acces" apparait generalement au premier lancement
  - clique "Autoriser").
