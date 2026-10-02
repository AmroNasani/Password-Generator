# Password Generator

Ein deutschsprachiger Passwortgenerator als Windows-App und Chrome-Erweiterung.
Beide verwenden dieselbe Oberfläche und Generatorlogik. Das ursprüngliche
Java-Kommandozeilenprogramm bleibt separat nutzbar.

## Funktionen

- Passwortlänge von 8 bis 128 Zeichen, per Schieberegler oder Zahleneingabe.
- Großbuchstaben, Kleinbuchstaben, Zahlen und Sonderzeichen frei kombinieren.
- Jede aktivierte Zeichenart kommt mindestens einmal vor.
- Ähnliche Zeichen wie I, l, 1, O, 0 und o optional ausschließen.
- Neu generieren, anzeigen/verbergen und in die Zwischenablage kopieren.
- Stärkeanzeige anhand der Größe des möglichen Passwortraums, keine Garantie für die Sicherheit eines Kontos.
- Lokale Erzeugung mit Web Crypto, ohne Server, Konto, Telemetrie oder Verlauf.
- Nur Einstellungen werden gespeichert. Passwörter bleiben im Arbeitsspeicher; kopierte Passwörter verbleiben in der Betriebssystem-Zwischenablage und können je nach Systemeinstellung in deren Verlauf oder Synchronisation landen.

## Windows verwenden

Nach dem Build: `dist/windows/Password-Generator-Setup-1.0.0.exe` ausführen.
Der Installer bietet einen Zielordner an und erstellt Startmenü- und
Desktop-Verknüpfungen. Installation ist pro Benutzer ohne Administratorrechte.
Alternativ die App direkt aus `dist/windows/win-unpacked/Password Generator.exe`
starten; dafür muss der gesamte Ordner zusammenbleiben.

Die Builds sind noch nicht mit einem Herausgeberzertifikat signiert. Windows
kann deshalb beim Installieren einen Hinweis anzeigen. Für eine öffentliche
Verteilung sollten Signierung und Release-Prozess eingerichtet werden.

## Chrome verwenden

1. `npm run build:extension` ausführen oder das erstellte `dist/Password-Generator-Chrome.zip` in einen dauerhaften Ordner entpacken.
2. `chrome://extensions` in Chrome öffnen.
3. **Entwicklermodus** aktivieren und **Entpackte Erweiterung laden** wählen.
4. `dist/chrome-extension` bzw. den entpackten Ordner auswählen.
5. Die Erweiterung über das Puzzle-Symbol an die Symbolleiste anheften.

Die Erweiterung verlangt ausschließlich Schreibzugriff auf die Zwischenablage;
sie liest keine Webseiten oder Passwörter aus Formularen. Sie ist lokal ladbar,
aber noch nicht im Chrome Web Store veröffentlicht. Eine Store-Veröffentlichung
erfordert ein Entwicklerkonto, Store-Eintrag und Prüfung durch Google.

## Entwicklung

Voraussetzungen: Node.js 22 oder neuer und npm. Der Windows-Installer wird unter
Windows gebaut. Für die Desktop-App und Chrome ist keine Java-Installation nötig.

```powershell
npm ci
npm start                 # Desktop-App öffnen
npm test                  # Generator, Zeichenauswahl und Randfälle
npm run test:ui           # Electron- und Erweiterungs-Bedienung testen
npm run build             # Tests, Chrome-ZIP und Windows-Installer
```

UI-Tests verwenden Electron und eine separate Testsitzung des installierten Chrome
(alternativer Pfad über `CHROME_PATH`). Ohne Chrome vor dem ersten UI-Test
`npx playwright install chromium` ausführen. Das persönliche Browserprofil wird nicht
verwendet. Test-Screenshots liegen in `artifacts/`.

## Aufbau

| Pfad | Zweck |
| --- | --- |
| `ui/` | Gemeinsame Oberfläche und Web-Crypto-Generator |
| `desktop/main.cjs` | Electron-Fenster mit Sandbox und deaktivierter Node-Integration |
| `extension/manifest.json` | Chrome Manifest V3 |
| `scripts/build-extension.mjs` | Erweiterungsordner und ZIP erstellen |
| `tests/` | Generator- und UI-Tests |
| `src/` | Ursprüngliche Java-CLI, jetzt mit SecureRandom und echten Tests |

Die Zufallsauswahl vermeidet Modulo-Verzerrung durch Rejection Sampling.
Passwörter ohne eine der gewählten Zeichenarten werden vollständig verworfen.
Dadurch sind alle gültigen Passwörter derselben Konfiguration gleich wahrscheinlich.
Die Oberfläche lädt keine externen Inhalte. Sicherheitskonfiguration nach den
[Electron-Empfehlungen](https://www.electronjs.org/docs/latest/tutorial/security);
die Erweiterung nutzt ein [Manifest-V3-Popup](https://developer.chrome.com/docs/extensions/develop/ui/add-popup).

## Java-CLI

Mit installiertem JDK 17 oder neuer:

```powershell
.\gradlew.bat test
.\gradlew.bat run --args="20"
```

Die CLI verwendet druckbare ASCII-Zeichen von 33 bis 126 und akzeptiert Längen
von 8 bis 128. Die erweiterten Zeichenoptionen stehen in der Oberfläche bereit.
