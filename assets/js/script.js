// SportsHub — Week Project Settimana VII
//
// Devi fare 4 cose per la Versione Base:
// 1. Definire le classi Squadra ed Evento (mappano i dati di TheSportsDB)
// 2. Funzione async cercaSquadre(query) che chiama /searchteams.php
// 3. Funzione async caricaDettagli(idTeam) che chiama in parallelo
//    eventsnext.php + eventslast.php usando Promise.all
// 4. Render dinamico: card squadre, lista prossimi eventi, lista risultati
//
// Endpoint base: https://www.thesportsdb.com/api/v1/json/3/
// Il `3` nell'URL è la chiave API pubblica di test di TheSportsDB: gratis, non serve registrarsi.
//
// Per le versioni Intermedia/Avanzata: localStorage preferiti, debounce, Promise.all multi.


// === Classi ===

// Squadra: trasforma l'oggetto "grezzo" dell'API nei nomi scelti da noi
class Squadra {
  constructor(dati) {
    this.id = dati.idTeam;          // id della squadra (serve per eventsnext/eventslast)
    this.nome = dati.strTeam;       // nome della squadra
    this.logo = dati.strBadge;      // URL dell'immagine del logo
    this.lega = dati.strLeague;     // campionato
    this.paese = dati.strCountry;   // paese
    this.sport = dati.strSport;     // sport (per il filtro nella versione avanzata)
  }
}


// Evento: una partita (prossima o già giocata)
class Evento {
  constructor(dati) {
    this.id = dati.idEvent;                       // id dell'evento
    this.data = dati.dateEvent;                   // data, formato "2026-11-28"
    this.casa = dati.strHomeTeam;                 // squadra di casa
    this.trasferta = dati.strAwayTeam;            // squadra in trasferta
    this.punteggioCasa = dati.intHomeScore;       // gol casa (null se non giocata)
    this.punteggioTrasferta = dati.intAwayScore;  // gol trasferta (null se non giocata)
  }
}


// === API ===



// === Stato ===



// === Render ===



// === Eventi ===
