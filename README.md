# Solen

Solen est une extension de boîte mail qui détecte les arnaques par mail (faux changement de RIB, fraude au président, faux conseiller bancaire, hameçonnage, faux support informatique, domaines sosies) et explique la fraude à l'utilisateur en français. Le code décide dès que de l'argent est en jeu ; l'IA (Mistral) comprend et explique, ne voit jamais un IBAN et ne peut qu'aggraver le verdict.

![Solen signale un faux changement de RIB dans la boîte mail de démonstration](solen/docs/capture-solen.png)

Maquette de démonstration réalisée pendant le hackathon Finaxys « Build What's Next », les 23 et 24 octobre 2026. Toutes les données sont fictives et la démo n'a aucun lien avec Microsoft.

## Essayer la démo

L'application Next.js se trouve dans le dossier [`solen/`](solen/).

```bash
cd solen
npm install
npm run dev            # http://localhost:3000
```

Sans clé Mistral, les analyses de secours prennent le relais pour les mails de démo. Une visite guidée animée se lance à l'ouverture.

## En savoir plus

Le [README du projet](solen/README.md) détaille :

- qui décide quoi entre le code, l'IA et les humains ;
- les 28 attaques contre lesquelles Solen est testé ;
- l'installation sous Windows, Mac et Linux, avec ou sans clé Mistral ;
- les raccourcis, les tests et le déploiement sur Netlify ;
- les limites actuelles et la suite.
