# Villaggio a 4 zampe — web app installabile

Questa è una prima versione web installabile (PWA), pensata per Safari su iPhone.

## Funzioni presenti
- Dashboard con cani presenti, arrivi e partenze di oggi.
- 48 box iniziali, ciascuno con nome e capienza modificabili.
- Prenotazioni manuali con cane, numero cani, proprietario, box, date, telefono e note.
- Controllo delle sovrapposizioni e della capienza del singolo box.
- Calendario mensile con conteggio dei cani presenti giorno per giorno.
- Totale soggiorno, importo pagato e saldo residuo.
- Pulsanti per creare e modificare prenotazioni.\n- Apertura WhatsApp con messaggio di conferma soggiorno precompilato (invio manuale).

## Installazione su iPhone
1. Pubblica questa cartella su un hosting HTTPS (ad esempio Netlify, Cloudflare Pages o un hosting del tuo dominio).
2. Apri l'indirizzo pubblicato con Safari su iPhone.
3. Tocca **Condividi** (quadrato con freccia).
4. Seleziona **Aggiungi alla schermata Home** e conferma.
5. Apri l'icona dalla schermata Home: si avvierà in modalità app.

Il service worker abilita la cache della parte applicativa. I dati sono salvati nel browser sul dispositivo.

## Importante: sincronizzazione e backup
Questa build iniziale salva i dati in `localStorage` sul singolo dispositivo. **Non sincronizza ancora i dati tra iPhone diversi o con altri collaboratori** e la cache offline non è un backup. Prima dell'uso operativo con dati reali va collegato un database cloud condiviso, con accesso autenticato, regole di sicurezza e backup. Non inserire dati personali reali finché il backend cloud non è stato configurato.

## WhatsApp
Dalla scheda della prenotazione puoi aprire WhatsApp con la conferma del soggiorno precompilata. L'invio resta manuale: controlla il messaggio e premi Invia in WhatsApp.

## Limiti da completare prima della produzione
- Collegamento database cloud multiutente e login.
- Esportazione/backup e recupero dati.
- Invio WhatsApp precompilato.
- Test approfonditi su iPhone/Safari, date, capienze e utilizzo simultaneo.
- Informativa privacy e gestione sicura dei dati dei proprietari.

La disponibilità è verificata box per box; non esiste alcun limite complessivo fisso di cani. La capienza iniziale di ogni box è impostata a 1 e va personalizzata dalla sezione **Box**.
