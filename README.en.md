# Solen

[![CI](https://github.com/barrage75/solen/actions/workflows/ci.yml/badge.svg)](https://github.com/barrage75/solen/actions/workflows/ci.yml) [![28 attacks tested](https://img.shields.io/badge/attacks%20tested-28%2F28-2ea44f)](https://solen-demo.vercel.app/attaques) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white) ![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)

[![Try the live demo](https://img.shields.io/badge/%E2%96%B6%20Try%20the%20demo-solen--demo.vercel.app-FFD43B?style=for-the-badge&labelColor=0B1120)](https://solen-demo.vercel.app)

[Version française](README.md)

Solen is a mailbox add-in that catches email scams: fake bank detail changes, CEO fraud, payroll diversion, gift card scams, fake bank advisers, fake parcel fees, fake tax refunds, fake invoices, booby-trapped attachments, phishing and lookalike domains. It explains each fraud to the user in plain French. Deterministic code makes the call whenever money is at stake. The AI (Mistral) reads and explains the request, never sees an IBAN, and can only make the verdict stricter.

![Guided tour of the demo: Solen stops a fake bank detail change, then a CEO fraud](solen/docs/demo-solen.gif)

Demo built during the Finaxys "Build What's Next" hackathon on 23 and 24 October 2026. All data is fictitious and the demo has no link with Microsoft.

## Highlights

- **Code decides, AI explains.** Sender authentication (SPF, DKIM, DMARC), lookalike domains, executive impersonation, IBAN and amount checks are plain TypeScript rules. The AI verdict can only raise the alert level, never lower it.
- **The AI never sees an IBAN.** IBANs and account numbers are replaced with tokens before anything is sent to Mistral.
- **28 attacks replayed on every test run.** Hidden IBANs, Cyrillic letters in domains, white-on-white prompt injection in a PDF, forged authentication headers, corrupted PDFs, hijacked reply threads. The red-team suite swaps the AI for a trapped one that always answers "safe", and checks that the code still blocks every attack. Watch them replayed live on the [28 attacks page](https://solen-demo.vercel.app/attaques).

## Try the demo

Online, nothing to install: **https://solen-demo.vercel.app**. An animated guided tour starts when the page opens.

You can also **try your own email** on the [Tester un mail](https://solen-demo.vercel.app/essayer) page: you play the attacker, start from ready-made examples, and Solen analyzes it with the same pane as in the mailbox.

To run it locally, the Next.js app lives in the [`solen/`](solen/) folder.

```bash
cd solen
npm install
npm run dev            # http://localhost:3000
```

Without a Mistral key, pre-written fallback analyses take over for the demo emails.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript in strict mode, Fluent UI, Mistral Small with JSON output, unpdf for PDF attachments, Vitest, GitHub Actions and Vercel.

## The slides

[![Cover of the Solen slides: "We block email scams at the source."](diapo/apercu.png)](diapo/Solen-diapo-hackathon.pdf)

The 4-slide deck shown to the jury, in French: [open the PDF](diapo/Solen-diapo-hackathon.pdf).

## Learn more

The [project README](solen/README.md), in French, covers:

- who decides what between the code, the AI and humans;
- the 28 attacks Solen is tested against;
- setup on Windows, macOS and Linux, with or without a Mistral key;
- keyboard shortcuts, tests and deployment;
- current limits and next steps.
