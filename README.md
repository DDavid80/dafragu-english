# DaFragu English

Piattaforma per allenare l’inglese da viaggio, progettata per iPhone. Tema scuro, 12 lezioni, 60 espressioni, ascolto, registrazione locale, ripasso degli errori e profili multipli.

## Versioni

- **Sites**: app completa con database Sites. Continua a funzionare mentre si configura Google Sheets.
- **GitHub Pages**: stessa interfaccia e contenuti, con database Google Sheets tramite Apps Script. Il codice di accesso si inserisce sul dispositivo e non è nel repository.

I profili sono percorsi nello stesso spazio condiviso. Ogni profilo ha progressi, errori e preferiti propri. Non sono account privati: chi ha accesso allo spazio può selezionare gli altri profili.

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
