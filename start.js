// Startseite für den Knopf auf dem Startbildschirm.
// - Vom Knopf gestartet (eigenes App-Fenster): sofort zur Web-App weiter.
// - Im Browser geöffnet (z. B. Link aus WhatsApp): Anleitung zeigen, wie man den Knopf anlegt, plus "öffnen".
// - Direktlink auf einen Termin (?t=...) geht immer sofort weiter.
(function () {
  var KEY = 'start.query.' + NAME;
  var query = location.search;
  try {
    if (query && query.length > 1) localStorage.setItem(KEY, query);
    else query = localStorage.getItem(KEY) || '';
  } catch (e) { /* ohne Speicher: dann eben ohne gemerkten Code */ }
  var url = TARGET + query;
  document.getElementById('go').href = url;

  var standalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var params = new URLSearchParams(query);
  if (standalone || params.has('t') || params.has('direkt')) {
    location.replace(url);
    return;
  }

  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  var inApp = /WhatsApp|FBAN|FBAV|Instagram|Line\//.test(ua);
  var html = '<h2>Als Knopf aufs Handy legen</h2>';
  if (ios) {
    html += (inApp ? '<p class="warn">Bitte zuerst in <b>Safari</b> öffnen (unten rechts das Kompass-Symbol oder „In Safari öffnen“).</p>' : '') +
      '<ol><li>Unten auf das <b>Teilen-Symbol</b> tippen <span class="sym">(Quadrat mit Pfeil nach oben)</span>.</li>' +
      '<li>Nach unten scrollen: <b>„Zum Home-Bildschirm“</b>.</li>' +
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
  html += '<p class="small">Danach öffnet der Knopf mit dem Clublogo direkt ' + (NAME === 'Clubshop' ? 'den Shop' : 'den Kalender') + '.</p>';
  document.getElementById('howto').innerHTML = html;
})();
