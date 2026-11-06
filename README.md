# DaFragu English

Piattaforma per allenare l’inglese da viaggio, progettata per iPhone. Tema scuro, 12 lezioni, 60 espressioni, ascolto, registrazione locale, ripasso degli errori e profili multipli.

## Versioni

- **Sites**: app completa con database Sites. Continua a funzionare mentre si configura Google Sheets.
- **GitHub Pages**: stessa interfaccia e contenuti, con database Google Sheets tramite Apps Script. Il codice di accesso si inserisce sul dispositivo e non è nel repository.

I profili sono percorsi nello stesso spazio condiviso. Ogni profilo ha progressi, errori e preferiti propri.

## PIN, eliminazione, confronto e sfide

- **PIN a 4 cifre**: ogni profilo si apre con il proprio PIN. Al primo accesso si sceglie il PIN. Cambiando profilo, quello precedente si richiude. Il PIN si cambia da **Cambia il PIN** nella scelta profilo.
- **Controllo sul database** (Google Sheets): il PIN è salvato come hash nella colonna `PinHash` del foglio `Utenti`. Senza PIN il database non consegna i dettagli del profilo e non accetta nuovi dati per quel profilo. Dopo 5 PIN sbagliati il profilo si blocca 10 minuti. Il codice dello spazio resta necessario per collegarsi.
- **PIN dimenticato**: nel foglio `Utenti` svuota la cella `PinHash` del profilo. Al prossimo accesso si sceglie un nuovo PIN.
- **Limite**: chi ha il codice dello spazio vede comunque i numeri di confronto di tutti i profili (lezioni, precisione, giorni, serie, risposte corrette per giorno). Non vede le singole risposte, gli errori e i preferiti di un profilo con PIN. Con Database Sites e senza Google Sheets il PIN è solo un blocco nell'app.
- **Elimina il profilo**: serve il PIN. Il profilo sparisce dall'app e dal database la considera inattivo (`Attivo` = FALSE in `Utenti`). I dati restano nel foglio. Per recuperarlo rimetti `Attivo` a TRUE.
- **Confronto**: la scheda Progressi mostra tutti i profili affiancati.
- **Sfide**: dalla scheda Progressi si invia una sfida a un altro profilo. Dura 7 giorni dal momento in cui l'altro accetta. Vince chi dà più risposte corrette. L'altro accetta o rifiuta dalla Home o dai Progressi.
- **In coppia**: nella missione di coppia si scelgono i due profili.

Dopo l'aggiornamento di `Code.gs` va ripubblicato l'Apps Script: **Esegui il deployment → Gestisci i deployment → Modifica → Nuova versione**. L'indirizzo /exec non cambia.

## Aggiungere persone

Tocca l’iniziale del profilo in alto → **Aggiungi un altro utente**. Puoi creare fino a 50 profili. Nella scheda Progressi puoi cambiare profilo. I nomi non sono modificabili, per mantenere il collegamento con lo storico.

## Attivare Google Sheets

Il database è già stato creato sull’account comune DaFraguTravel:
https://docs.google.com/spreadsheets/d/120y5xnqs3F258GdUba-mTcsTF18yQd2466mCppg6EN8/edit

1. Nel foglio apri **Estensioni → Apps Script**.
2. Copia `google-apps-script/Code.gs` nel progetto. Il file include già l’ID del database.
3. Seleziona ed esegui **setup**. Google chiederà l’autorizzazione al foglio. Il codice dello spazio viene generato una sola volta nelle proprietà private dello script.
4. **Esegui il deployment → Nuovo deployment → App web**. Esegui come proprietario, consenti l’accesso all’endpoint necessario per l’app; tutte le letture e scritture dei dati richiedono comunque il codice dello spazio.
5. Copia l’indirizzo che termina con **/exec**. Nel foglio, menu **DaFragu English → Mostra collegamento**, trovi il codice dello spazio.
6. Nell’app apri **Preferenze e backup → Collegamento dati**, inserisci indirizzo e codice, premi **Verifica e collega Google Sheets**.
7. Configura gli altri dispositivi con gli stessi dati. I progressi già presenti sul dispositivo vengono accodati per la sincronizzazione. Il salvataggio usa ID univoci e non duplica i tentativi quando si ripete un invio.

Prima di passare un dispositivo da Sites a Sheets, attendi **Salvato online** su Sites ed esporta un backup. Se altri dispositivi non hanno ancora sincronizzato, sincronizzali prima della migrazione. La migrazione trasferisce gli eventi effettivamente presenti sul dispositivo, non recupera dati rimasti esclusivamente su altri dispositivi.

Non pubblicare il codice dello spazio nel repository. Il foglio resta privato: non occorre pubblicarlo sul web.

## GitHub Pages

Il workflow `.github/workflows/pages.yml` costruisce la versione statica da `github/main.tsx` e dalla stessa app in `app/`. In **Settings → Pages**, seleziona **GitHub Actions** come origine. La disponibilità di Pages per un repository privato dipende dal piano GitHub. Il repository è inizialmente privato.

Per una compilazione locale:

```sh
pnpm install --frozen-lockfile
pnpm exec vite build --config vite.github.config.ts
```

L’output è `github-dist/`. La versione scaricabile in `release/DaFragu_English.html` contiene interfaccia, lezioni e stili in un file. Aprila da un server HTTPS per microfono e collegamento online; il comportamento delle pagine aperte come file locale dipende dal browser.

## Controlli

```sh
node scripts/tests/google-sheets.test.mjs
pnpm exec tsc --noEmit
```

Le registrazioni vocali non vengono inviate al database e sono disponibili soltanto durante la schermata corrente. Non viene assegnato un voto automatico alla pronuncia.
