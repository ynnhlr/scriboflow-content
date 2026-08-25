---
title: "Forstå sikre underskriftslinks"
description: "Se, hvordan underskriftslinks giver adgang til kontrakter, og hvornår de stopper med at virke."
category: "security-privacy-and-data"
slug: "understand-secure-signing-links"
order: 5
keywords:
  - "sikkert underskriftslink"
  - "underskriftsfrist"
  - "udløbet underskriftslink"
  - "tilbagekald underskriftslink"
lastUpdated: "2026-08-25"
relatedArticles:
  - "understand-contract-history-and-signing-evidence"
  - "protect-your-scriboflow-account"
---

# Forstå sikre underskriftslinks

Scriboflow giver hver aktiv underskriver et særskilt link til at gennemgå og underskrive en kontrakt. Underskriveren behøver ikke en Scriboflow-konto for at bruge linket.

## Hold underskriftslinks private

Alle med adgang til et aktivt underskriftslink kan muligvis åbne kontrakten. Modtagere bør derfor behandle linket som andre fortrolige adgangsoplysninger og undgå at videresende det.

Afsenderen vælger en underskriftsfrist, før kontrakten sendes. Standardfristen er 30 dage, men den kan ændres før afsendelse.

## Hvornår stopper et link med at virke?

Et underskriftslink kan ikke længere bruges til at underskrive, når:

- Underskriftsfristen er overskredet
- Anmodningen er erstattet af et nyt underskriftslink
- Afsenderen annullerer kontrakten
- En underskriver afviser kontrakten og lukker underskriftsforløbet
- Anmodningen allerede er gennemført eller tilbagekaldt

Ved genafsendelse oprettes et nyt link til den aktive modtager, og den tidligere aktive anmodning lukkes.

Standardunderskrifter via link registrerer underskriverens handlinger og beviser. Når identitetsbaseret underskrift som MitID er tilgængelig og valgt, tilføjes bekræftelse gennem den understøttede identitetsudbyder.

Hvis en modtager får vist, at linket er ugyldigt, udløbet eller tilbagekaldt, skal afsenderen oprette en ny underskriftsanmodning, hvis kontrakten fortsat kan sendes.
