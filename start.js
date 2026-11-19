// Startseite für Kalender, Shop und Bestellungen.
// Einstellungen je Seite (vor diesem Skript gesetzt):
//   TARGET         Adresse der Web-App (eigener Server oder Google, ggf. mit ?seite=...)
//   NAME           Kurzname der Seite (Speicherschlüssel)
//   TARGET_LABEL   Text "den Kalender" / "den Shop" / "die Bestellübersicht"
//   NEEDS_NAME     true: Namen einmal abfragen, dauerhaft merken und als &name= mitgeben (gilt für alle Seiten gemeinsam)
//   NAMES_PARAM    Parameter, mit dem die Namensliste abgerufen wird ('k' Kalender, 'runde' Shop)
//   ALWAYS_REDIRECT true: nie die Anleitung zeigen (Shop: Mitglieder kommen nur über den Rundenlink)
//   OPENS_IN_BROWSER true: Knopf öffnet den Browser; Anleitung nur beim ersten Aufruf
//   EMBED          true: Web-App im Rahmen auf dieser Seite zeigen statt weiterzuleiten (ohne den Google-Hinweis oben)
// Parameter dürfen hinter ? oder # stehen; # ist besser, der Teil geht nicht an den Server von GitHub.
// Steuerparameter: anleitung (Anleitung zeigen), direkt (sofort weiter), namewechsel (Namen neu wählen),
// neu (nur damit sich die Adresse ändert: eingebettet lädt die Seite bei geändertem # neu).
(function () {
  var cfg = {
    needsName: typeof NEEDS_NAME !== 'undefined' && NEEDS_NAME === true,
    namesParam: typeof NAMES_PARAM !== 'undefined' ? NAMES_PARAM : '',
    always: typeof ALWAYS_REDIRECT !== 'undefined' && ALWAYS_REDIRECT === true,
    inBrowser: typeof OPENS_IN_BROWSER !== 'undefined' && OPENS_IN_BROWSER === true,
    embed: typeof EMBED !== 'undefined' && EMBED === true,
    label: typeof TARGET_LABEL !== 'undefined' ? TARGET_LABEL : 'den Kalender'
  };
  var KEY = 'start.query.' + NAME;
  var SEEN = 'start.seen.' + NAME;
  var NAME_KEY = 'club.name';
  var CONTROL = ['anleitung', 'direkt', 'namewechsel', 'name', 'start', 'neu'];

  // Eingebettet: "Seite neu laden" und "Name ändern" im Kalender ändern nur den Teil hinter # dieser Seite
  window.addEventListener('hashchange', function () { location.reload(); });

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } return v; }
  function parse(s) { var p = new URLSearchParams(s); var o = {}; p.forEach(function (v, k) { o[k] = v; }); return o; }

  // Parameter aus ? und # zusammenführen (# gewinnt)
  var all = parse(location.search);
  var fromHash = parse(location.hash.replace(/^#/, ''));
  Object.keys(fromHash).forEach(function (k) { all[k] = fromHash[k]; });
  var showHowto = 'anleitung' in all;
  var direct = 'direkt' in all;
  var rename = 'namewechsel' in all;

  // Weitergegebene Parameter (Code, Runde, Schlüssel, Termin); gemerkt wird alles außer dem Termin.
  // Gemerkte Werte ergänzen, was im Link fehlt: "Name ändern" bringt nur den Clubcode mit, der Verwalter-Schlüssel
  // soll dabei nicht verloren gehen. Neue Werte im Link ersetzen gemerkte.
  var forward = {};
  Object.keys(all).forEach(function (k) { if (CONTROL.indexOf(k) < 0) forward[k] = all[k]; });
  try { var saved = JSON.parse(store(KEY) || '{}'); Object.keys(saved).forEach(function (k) { if (!(k in forward)) forward[k] = saved[k]; }); } catch (e) {}
  var keep = {};
  Object.keys(forward).forEach(function (k) { if (k !== 't') keep[k] = forward[k]; });
  if (Object.keys(keep).length) store(KEY, JSON.stringify(keep));

  function validName(n) { return /^[\p{L}\p{N} .'\-]{2,40}$/u.test(n); }
  function targetUrl() {
    var p = new URLSearchParams();
    Object.keys(forward).forEach(function (k) { p.set(k, forward[k]); });
    if (cfg.needsName) {
      var n = store(NAME_KEY);
      if (n) p.set('name', n);
      p.set('start', '1');
    }
    var q = p.toString();
    return TARGET + (q ? (TARGET.indexOf('?') >= 0 ? '&' : '?') + q : '');
  }
  function launch() {
    if (cfg.needsName && (rename || !store(NAME_KEY))) { showPicker(); return; }
    showTarget(targetUrl());
  }
  // Weiterleiten oder (EMBED) die Web-App bildschirmfüllend im Rahmen zeigen
  // Eingebettet: bis die Web-App "bereit" meldet (oder spätestens nach 20 s), bleibt das Logo mit "wird geladen" sichtbar
  function showTarget(url) {
    if (!cfg.embed) { location.replace(url); return; }
    document.body.className = 'embedded';
    document.getElementById('howto').classList.add('hidden');
    go.classList.add('hidden');
    var wait = document.createElement('p');
    wait.className = 'loading';
    // "den Kalender" -> "Kalender wird geladen …", "die Bestellübersicht" -> "Bestellübersicht wird geladen …"
    wait.textContent = cfg.label.replace(/^(den|die|das) /, '') + ' wird geladen …';
    document.querySelector('main').appendChild(wait);
    showVersion();
    var frame = document.createElement('iframe');
    frame.id = 'app';
    frame.className = 'waiting';
    frame.title = NAME;
    frame.setAttribute('allow', 'clipboard-write');
    frame.src = url;
    document.body.appendChild(frame);
    var reveal = function () { frame.className = ''; };
    window.addEventListener('message', function (e) {
      var from = e.origin || '';
      if ((from === new URL(TARGET).origin || /\.googleusercontent\.com$/.test(from)) && e.data && e.data.clubkalender === 'bereit') reveal();
    });
    setTimeout(reveal, 20000);
  }
  // Unter dem Ladetext die Version der Web-App: sofort die zuletzt gesehene, dann die aktuelle (?seite=version)
  function showVersion() {
    var VERSION_KEY = 'start.version.' + NAME;
    var line = document.createElement('p');
    line.className = 'small version';
    var show = function (v) { line.textContent = v ? 'Version ' + v : ''; };
    show(store(VERSION_KEY));
    document.querySelector('main').appendChild(line);
    fetch(TARGET.replace(/\?.*$/, '') + '?seite=version', { credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.version) { store(VERSION_KEY, String(d.version)); show(String(d.version)); } })
      .catch(function () { /* ohne Antwort bleibt die gemerkte Version */ });
  }

  var go = document.getElementById('go');
  go.href = targetUrl();
  go.addEventListener('click', function (e) { e.preventDefault(); launch(); });

  var standalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var seen = store(SEEN) === '1';
  if (rename || (!showHowto && (standalone || 't' in forward || direct || cfg.always || (cfg.inBrowser && seen)))) {
    launch();
    return;
  }
  if (cfg.inBrowser) store(SEEN, '1');
  showHowtoBox();

  // ---- Namensauswahl (einmal, danach gemerkt) -------------------------------------------------
  function showPicker() {
    var box = document.getElementById('howto');
    var current = store(NAME_KEY);
    box.innerHTML = '<h2>Wer bist du?</h2>' +
      '<p class="small">Das Handy merkt sich deinen Namen. Dann musst du ihn nicht jedes Mal auswählen.</p>' +
      '<select id="pickSel" class="field"><option value="">Namen werden geladen …</option></select>' +
      '<input id="pickOther" class="field hidden" maxlength="40" placeholder="Vor- und Nachname">' +
      '<p id="pickErr" class="warn hidden"></p>' +
      '<a id="pickOk" class="button" href="#">Weiter</a>' +
      '<p class="small"><a id="pickSkip" href="#">Ohne Namen weiter</a></p>';
    box.classList.remove('hidden');
    go.classList.add('hidden');
    var sel = document.getElementById('pickSel');
    var other = document.getElementById('pickOther');
    // labels (optional, Kalender): Anzeige "Spitzname (Name)"; gespeichert wird immer der Name
    function fill(names, labels) {
      var known = names.some(function (n) { return n.toLowerCase() === current.toLowerCase(); });
      sel.innerHTML = '<option value="">– bitte wählen –</option>' + names.map(function (n, i) {
        return '<option value="' + esc(n) + '"' + (known && n.toLowerCase() === current.toLowerCase() ? ' selected' : '') + '>' +
          esc((labels && labels[i]) || n) + '</option>';
      }).join('') + '<option value="__other__"' + (current && !known ? ' selected' : '') + '>Anderer Name (Gast) …</option>';
      if (current && !known) other.value = current;
      toggleOther();
    }
    function toggleOther() { other.classList.toggle('hidden', sel.value !== '__other__'); }
    sel.addEventListener('change', toggleOther);
    var codeValue = cfg.namesParam ? forward[cfg.namesParam] : '';
    if (codeValue) {
      var base = TARGET.replace(/\?.*$/, '');
      fetch(base + '?seite=namen&' + cfg.namesParam + '=' + encodeURIComponent(codeValue), { credentials: 'omit' })
        .then(function (r) { return r.json(); })
        .then(function (d) { fill(d && d.ok && d.names ? d.names : [], d && d.labels); })
        .catch(function () { fill([]); });
    } else {
      fill([]);
    }
    document.getElementById('pickOk').addEventListener('click', function (e) {
      e.preventDefault();
      var n = (sel.value === '__other__' ? other.value : sel.value).trim().replace(/\s+/g, ' ');
      if (!validName(n)) {
        var err = document.getElementById('pickErr');
        err.textContent = 'Bitte deinen Namen wählen oder eingeben (2 bis 40 Buchstaben).';
        err.classList.remove('hidden');
        return;
      }
      store(NAME_KEY, n);
      rename = false;
      showTarget(targetUrl());
    });
    document.getElementById('pickSkip').addEventListener('click', function (e) {
      e.preventDefault();
      cfg.needsName = false;
      showTarget(targetUrl());
    });
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ---- Anleitung für den Knopf ------------------------------------------------------------------
  function showHowtoBox() {
    var ua = navigator.userAgent || '';
    var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var android = /Android/.test(ua);
    var inApp = /WhatsApp|FBAN|FBAV|Instagram|Line\//.test(ua);
    var html = '<h2>Als Knopf aufs Handy legen</h2>';
    if (ios) {
      html += (inApp ? '<p class="warn">Bitte zuerst in <b>Safari</b> öffnen (unten rechts das Kompass-Symbol oder „In Safari öffnen“).</p>' : '') +
        '<ol><li>Unten auf das <b>Teilen-Symbol</b> tippen <span class="sym">(Quadrat mit Pfeil nach oben)</span>.</li>' +
        '<li>Nach unten scrollen: <b>„Zum Home-Bildschirm“</b>.</li>' +
        (cfg.inBrowser ? '<li>Steht dort der Schalter <b>„Als Web-App öffnen“</b>: <b>ausschalten</b>.</li>' : '') +
        '<li>Oben rechts <b>„Hinzufügen“</b>.</li></ol>';
    } else if (android) {
      html += (inApp ? '<p class="warn">Bitte zuerst in <b>Chrome</b> öffnen (Menü ⋮ → „In Chrome öffnen“).</p>' : '') +
        '<ol><li>Oben rechts auf <b>⋮</b> tippen.</li>' +
        '<li><b>„Zum Startbildschirm hinzufügen“</b> (oder „App installieren“).</li>' +
        '<li><b>„Hinzufügen“</b> bzw. <b>„Installieren“</b>.</li></ol>';
    } else {
      html += '<p>Am Handy: <b>iPhone</b> in Safari Teilen-Symbol → „Zum Home-Bildschirm“, ' +
        '<b>Android</b> in Chrome ⋮ → „Zum Startbildschirm hinzufügen“. Am PC einfach als Lesezeichen speichern.</p>';
    }
    html += '<p class="small">Danach öffnet der Knopf mit dem Clublogo direkt ' + cfg.label + '.' +
      (cfg.inBrowser ? ' Diese Seite erscheint nur beim ersten Mal.' : '') + '</p>';
    document.getElementById('howto').innerHTML = html;
  }
})();
