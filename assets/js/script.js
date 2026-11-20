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



// === API ===



// === Stato ===



// === Render ===



// === Eventi ===
