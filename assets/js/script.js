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
    this.sport = dati.strSport;     // sport (per il filtro)
  }

  // Ricostruisce una Squadra da un oggetto salvato in localStorage (nomi già nostri)
  static fromJSON(obj) {
    const squadra = new Squadra({});
    Object.assign(squadra, obj);
    return squadra;
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

  // Data in formato leggibile, es. "28 nov 2026"
  dataFormattata() {
    if (!this.data) return "Data da definire";
    return new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(new Date(this.data));
  }

  // Punteggio "2 - 1", oppure "-" se la partita non è ancora stata giocata
  punteggio() {
    if (this.punteggioCasa === null || this.punteggioTrasferta === null) return "-";
    return `${this.punteggioCasa} - ${this.punteggioTrasferta}`;
  }
}


// === API ===

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123/";

// Funzione di appoggio: fa la fetch, controlla lo status e restituisce il JSON.
// Il signal (opzionale) permette di annullare la richiesta con AbortController.
async function getJSON(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Errore HTTP ${response.status}`);
  }
  return await response.json();
}

// Cerca le squadre per nome e restituisce un array di oggetti Squadra
async function cercaSquadre(query, signal) {
  const url = new URL(BASE_URL + "searchteams.php");
  url.searchParams.set("t", query);            // ?t=Arsenal
  const data = await getJSON(url, signal);
  if (data.teams === null) return [];          // nessuna squadra trovata
  return data.teams.map((t) => new Squadra(t));
}

// Carica in parallelo prossimi eventi e ultimi risultati di una squadra
async function caricaDettagli(idTeam) {
  const urlProssimi = new URL(BASE_URL + "eventsnext.php");
  urlProssimi.searchParams.set("id", idTeam);
  const urlRisultati = new URL(BASE_URL + "eventslast.php");
  urlRisultati.searchParams.set("id", idTeam);

  // Le due richieste partono insieme: aspettiamo che finiscano entrambe
  const [dataProssimi, dataRisultati] = await Promise.all([
    getJSON(urlProssimi),
    getJSON(urlRisultati),
  ]);

  // Se non ci sono eventi l'API manda null: usiamo [] per non rompere map()
  const prossimi = (dataProssimi.events || []).map((e) => new Evento(e));
  const risultati = (dataRisultati.results || []).map((e) => new Evento(e));
  return { prossimi, risultati };
}


// === Stato ===

const STORAGE_KEY = "sportshub-preferiti";

// Riferimenti agli elementi della pagina
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const spinner = document.getElementById("spinner");
const erroreBox = document.getElementById("errore");
const listaSquadre = document.getElementById("lista-squadre");
const dettagliSection = document.getElementById("dettagli-section");
const preferitiSection = document.getElementById("preferiti-section");
const listaPreferiti = document.getElementById("lista-preferiti");

let squadreTrovate = [];        // risultati dell'ultima ricerca
let preferiti = caricaPreferiti(); // squadre salvate in localStorage
let squadraSelezionata = null;  // squadra di cui stiamo vedendo i dettagli
let controller = null;          // AbortController della ricerca in corso
let debounceTimer = null;       // timer del debounce

// --- localStorage ---
function caricaPreferiti() {
  try {
    const salvati = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return salvati.map((obj) => Squadra.fromJSON(obj));
  } catch (err) {
    return []; // JSON rovinato o localStorage non disponibile
  }
}

function salvaPreferiti() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferiti));
}

function eInPreferiti(id) {
  return preferiti.some((s) => s.id === id);
}

function aggiungiPreferita(squadra) {
  if (!eInPreferiti(squadra.id)) {
    preferiti.push(squadra);
    salvaPreferiti();
  }
}

function rimuoviPreferita(id) {
  preferiti = preferiti.filter((s) => s.id !== id);
  salvaPreferiti();
}


// === Render ===

// Crea un elemento con classe e testo (textContent, mai innerHTML con dati dell'API)
function creaElemento(tag, classe, testo) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (testo !== undefined) el.textContent = testo;
  return el;
}

function mostraErrore(messaggio) {
  erroreBox.textContent = messaggio;
  erroreBox.hidden = false;
}

// Card di una squadra. modo = "risultato" oppure "preferita"
function creaCard(squadra, modo) {
  const card = creaElemento("article", "card");
  card.dataset.id = squadra.id;
  if (squadraSelezionata && squadraSelezionata.id === squadra.id) {
    card.classList.add("selezionata");
  }

  if (squadra.logo) {
    const img = creaElemento("img", "card-logo");
    img.src = squadra.logo;
    img.alt = `Logo ${squadra.nome}`;
    card.appendChild(img);
  }
  card.appendChild(creaElemento("h3", "card-nome", squadra.nome));
  card.appendChild(creaElemento("p", "card-info", squadra.lega));
  card.appendChild(creaElemento("p", "card-info", squadra.paese));

  const btn = creaElemento("button", "btn-fav");
  btn.type = "button";
  if (modo === "preferita" || eInPreferiti(squadra.id)) {
    btn.textContent = modo === "preferita" ? "Rimuovi" : "Rimuovi dai preferiti";
    btn.dataset.azione = "rimuovi";
  } else {
    btn.textContent = "★ Aggiungi ai preferiti";
    btn.dataset.azione = "aggiungi";
  }
  card.appendChild(btn);
  return card;
}

function renderSquadre() {
  listaSquadre.replaceChildren();
  const visibili = squadreTrovate;

  if (visibili.length === 0) {
    listaSquadre.appendChild(creaElemento("p", "vuoto", "Nessuna squadra trovata."));
    return;
  }
  const griglia = creaElemento("div", "griglia");
  visibili.forEach((s) => griglia.appendChild(creaCard(s, "risultato")));
  listaSquadre.appendChild(griglia);
}

function renderPreferiti() {
  listaPreferiti.replaceChildren();
  preferitiSection.hidden = preferiti.length === 0;
  const griglia = creaElemento("div", "griglia");
  preferiti.forEach((s) => griglia.appendChild(creaCard(s, "preferita")));
  listaPreferiti.appendChild(griglia);
}

// Lista di eventi (prossimi o risultati) della squadra selezionata
function creaListaEventi(titolo, eventi, vuoto, squadra) {
  const blocco = creaElemento("div", "blocco-eventi");
  blocco.appendChild(creaElemento("h3", "", titolo));

  if (eventi.length === 0) {
    blocco.appendChild(creaElemento("p", "vuoto", vuoto));
    return blocco;
  }
  const ul = creaElemento("ul", "eventi");
  eventi.forEach((ev) => {
    const li = creaElemento("li", "evento");

    // Casa o trasferta? Confrontiamo il nome della squadra con quello di casa
    const inCasa = ev.casa === squadra.nome;
    li.appendChild(creaElemento("span", "evento-data", ev.dataFormattata()));
    li.appendChild(creaElemento("span", "evento-partita", `${ev.casa} vs ${ev.trasferta}`));
    li.appendChild(creaElemento("span", inCasa ? "tag tag-casa" : "tag tag-trasferta", inCasa ? "Casa" : "Trasferta"));
    li.appendChild(creaElemento("span", "evento-punteggio", ev.punteggio()));
    ul.appendChild(li);
  });
  blocco.appendChild(ul);
  return blocco;
}

function renderDettagli(squadra, prossimi, risultati) {
  dettagliSection.replaceChildren();
  dettagliSection.appendChild(creaElemento("h2", "", squadra.nome));
  const colonne = creaElemento("div", "colonne");
  colonne.appendChild(creaListaEventi("Prossimi eventi", prossimi, "Nessun evento in programma.", squadra));
  colonne.appendChild(creaListaEventi("Ultimi risultati", risultati, "Nessun risultato disponibile.", squadra));
  dettagliSection.appendChild(colonne);
  dettagliSection.hidden = false;
}

// === Azioni ===

async function eseguiRicerca(query) {
  if (controller) controller.abort();           // annulla la ricerca precedente
  controller = new AbortController();
  const mioController = controller;

  erroreBox.hidden = true;
  spinner.hidden = false;
  listaSquadre.replaceChildren();

  try {
    squadreTrovate = await cercaSquadre(query, mioController.signal);
    renderSquadre();
  } catch (err) {
    if (err.name === "AbortError") return;      // richiesta annullata di proposito
    mostraErrore("Impossibile cercare le squadre. Riprova più tardi.");
    console.error(err);
  } finally {
    // Nascondiamo lo spinner solo se questa è ancora l'ultima ricerca
    if (controller === mioController) spinner.hidden = true;
  }
}

async function mostraDettagli(squadra) {
  squadraSelezionata = squadra;
  erroreBox.hidden = true;
  dettagliSection.replaceChildren(creaElemento("p", "vuoto", "Caricamento..."));
  dettagliSection.hidden = false;
  renderSquadre();
  renderPreferiti();

  try {
    const { prossimi, risultati } = await caricaDettagli(squadra.id);
    if (squadraSelezionata !== squadra) return;  // nel frattempo ne hai scelta un'altra
    renderDettagli(squadra, prossimi, risultati);
  } catch (err) {
    dettagliSection.hidden = true;
    mostraErrore("Impossibile caricare i dettagli della squadra.");
    console.error(err);
  }
}

// Gestisce i click sulle card (event delegation) in entrambe le liste
function gestisciClickCard(event) {
  const card = event.target.closest(".card");
  if (!card) return;
  const id = card.dataset.id;
  const squadra = [...squadreTrovate, ...preferiti].find((s) => s.id === id);
  if (!squadra) return;

  const bottone = event.target.closest(".btn-fav");
  if (bottone) {
    if (bottone.dataset.azione === "aggiungi") aggiungiPreferita(squadra);
    else rimuoviPreferita(id);
    renderSquadre();
    renderPreferiti();
    return;
  }
  mostraDettagli(squadra);
}


// === Eventi ===

// Submit: ricerca immediata
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(debounceTimer);
  const query = searchInput.value.trim();
  if (query) eseguiRicerca(query);
});

// Debounce: la ricerca parte dopo 400ms di pausa nella digitazione
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = searchInput.value.trim();
  if (query.length < 2) return;
  debounceTimer = setTimeout(() => eseguiRicerca(query), 400);
});

listaSquadre.addEventListener("click", gestisciClickCard);
listaPreferiti.addEventListener("click", gestisciClickCard);

// === Avvio ===
renderPreferiti();
