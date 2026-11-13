// Startseite für den Knopf auf dem Startbildschirm.
// - Vom Knopf gestartet (eigenes App-Fenster): sofort zur Web-App weiter.
// - Im Browser geöffnet (z. B. Link aus WhatsApp): Anleitung zeigen, wie man den Knopf anlegt, plus "öffnen".
// - Direktlink auf einen Termin (?t=...) geht immer sofort weiter.
// - Seiten mit OPENS_IN_BROWSER (Knopf öffnet den Browser statt eines App-Fensters): Anleitung nur beim ersten
//   Aufruf, danach sofort weiter. ?anleitung zeigt sie wieder.
(function () {
  var KEY = 'start.query.' + NAME;
  var SEEN = 'start.seen.' + NAME;
  var inBrowserMode = typeof OPENS_IN_BROWSER !== 'undefined' && OPENS_IN_BROWSER === true;
  var label = typeof TARGET_LABEL !== 'undefined' ? TARGET_LABEL : 'den Kalender';

  var params = new URLSearchParams(location.search);
  var showHowto = params.has('anleitung');
  params.delete('anleitung');
  var query = params.toString();
  try {
    if (query) localStorage.setItem(KEY, query);
    else query = localStorage.getItem(KEY) || '';
  } catch (e) { /* ohne Speicher: dann eben ohne gemerkten Code */ }
  params = new URLSearchParams(query);
  var url = TARGET + (query ? (TARGET.indexOf('?') >= 0 ? '&' : '?') + query : '');
  document.getElementById('go').href = url;

  var standalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var seen = false;
  try { seen = localStorage.getItem(SEEN) === '1'; } catch (e) {}
  if (!showHowto && (standalone || params.has('t') || params.has('direkt') || (inBrowserMode && seen))) {
    location.replace(url);
    return;
  }
  if (inBrowserMode) { try { localStorage.setItem(SEEN, '1'); } catch (e) {} }

  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  var inApp = /WhatsApp|FBAN|FBAV|Instagram|Line\//.test(ua);
  var html = '<h2>Als Knopf aufs Handy legen</h2>';
  if (ios) {
    html += (inApp ? '<p class="warn">Bitte zuerst in <b>Safari</b> öffnen (unten rechts das Kompass-Symbol oder „In Safari öffnen“).</p>' : '') +
      '<ol><li>Unten auf das <b>Teilen-Symbol</b> tippen <span class="sym">(Quadrat mit Pfeil nach oben)</span>.</li>' +
      '<li>Nach unten scrollen: <b>„Zum Home-Bildschirm“</b>.</li>' +
      (inBrowserMode ? '<li>Steht dort der Schalter <b>„Als Web-App öffnen“</b>: <b>ausschalten</b>. Dann öffnet der Knopf ' +
        'Safari, wo du bei Google angemeldet bist.</li>' : '') +
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
  html += '<p class="small">Danach öffnet der Knopf mit dem Clublogo direkt ' + label + '.' +
    (inBrowserMode ? ' Diese Seite erscheint nur beim ersten Mal.' : '') + '</p>';
  document.getElementById('howto').innerHTML = html;
})();
