# Startseiten Harley Clannad Ostalb e.V.

Kleine Startseiten für die Knöpfe auf dem Handy-Startbildschirm (Clublogo als Symbol).
Sie leiten zur jeweiligen Google-Apps-Script-Web-App weiter und reichen den Link-Parameter durch.

- `kalender/?k=<Clubcode>` → Clubkalender
- `bestellungen/` → Bestellübersicht des Shops (nur für den Besitzer; Knopf öffnet den Browser wegen der Google-Anmeldung)

Symbole neu erzeugen: `python werkzeug/make-icons.py werkzeug/vereinslogo.jpg`
