# Solen

[![CI](https://github.com/barrage75/solen/actions/workflows/ci.yml/badge.svg)](https://github.com/barrage75/solen/actions/workflows/ci.yml) [![28 attaques testées](https://img.shields.io/badge/attaques%20test%C3%A9es-28%2F28-2ea44f)](solen/src/redteam/cases.ts) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white) ![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)

[![Essayer la démo en ligne](https://img.shields.io/badge/%E2%96%B6%20Essayer%20la%20d%C3%A9mo-solen--demo.vercel.app-FFD43B?style=for-the-badge&labelColor=0B1120)](https://solen-demo.vercel.app)

Solen est une extension de boîte mail qui détecte les arnaques par mail (faux changement de RIB, fraude au président, faux conseiller bancaire, hameçonnage, faux support informatique, domaines sosies) et explique la fraude à l'utilisateur en français. Le code décide dès que de l'argent est en jeu ; l'IA (Mistral) comprend et explique, ne voit jamais un IBAN et ne peut qu'aggraver le verdict.

![Solen signale un faux changement de RIB dans la boîte mail de démonstration](solen/docs/capture-solen.png)

Maquette de démonstration réalisée pendant le hackathon Finaxys « Build What's Next », les 23 et 24 octobre 2026. Toutes les données sont fictives et la démo n'a aucun lien avec Microsoft.

## Essayer la démo

En ligne, sans rien installer : **https://solen-demo.vercel.app**. Une visite guidée animée se lance à l'ouverture.

En local, l'application Next.js se trouve dans le dossier [`solen/`](solen/).

```bash
cd solen
npm install
npm run dev            # http://localhost:3000
```

Sans clé Mistral, les analyses de secours prennent le relais pour les mails de démo.

## La diapo

[![Couverture de la diapo Solen : « On bloque l'arnaque par mail à la source. »](diapo/apercu.png)](diapo/Solen-diapo-hackathon.pdf)

Le diaporama présenté au jury, en 4 diapositives : [ouvrir le PDF](diapo/Solen-diapo-hackathon.pdf).

## En savoir plus

Le [README du projet](solen/README.md) détaille :

- qui décide quoi entre le code, l'IA et les humains ;
- les 28 attaques contre lesquelles Solen est testé ;
- l'installation sous Windows, Mac et Linux, avec ou sans clé Mistral ;
- les raccourcis, les tests et la mise en ligne ;
- les limites actuelles et la suite.
