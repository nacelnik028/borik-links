# Kontext projektu pro další chaty

Poslední aktualizace: 19. 10. 2026. Tento soubor čti při zahájení práce v projektu. Po podstatných změnách aktualizuj příslušné části, zejména aktuální stav a rozpracované návrhy. Je to mapa projektu; před úpravou ověř skutečný stav dotčeného kódu a `git status`, protože soubory se mohou mezitím změnit.

## Účel a styl

Osobní český web Víta (Boříka), značka `borik.space`: představení, hudba, hry, živý Discord/Spotify stav a odkazy na sociální sítě. Tmavý vzhled, barevné akcenty, polární záře, hvězdy, orbitální dekorace kolem avataru a karty. Texty jsou neformální a osobní. S uživatelem komunikuj česky.

## Technologie a spuštění

- Statický HTML/CSS/vanilla JavaScript. Bez frameworku, balíčků, backendu a build kroku; v projektu není nastavený automatický testovací runner.
- Pro základní náhled otevři `index.html` v prohlížeči. Pro schránku je vhodné HTTPS nebo localhost; při selhání kopírování existuje ruční fallback.
- Hosting může být libovolný statický server. Konkrétní nasazení ani vlastnictví domény nebyly při tomto průchodu ověřeny; `borik.space` je značka v HTML.
- Externí služby: Google Fonts (DM Sans, Space Grotesk), Lanyard WebSocket a obrázky z Discord CDN / služby pro ikony aplikací, obaly Spotify.
- Soubory čti a zapisuj jako UTF-8. Ve Windows PowerShell použij u `Get-Content` explicitně `-Encoding UTF8`, jinak může být český text v terminálu zkomolený.

## Mapa souborů a vazby

| Soubor | Odpovědnost |
| --- | --- |
| `README.md` | Návod pro vlastníka: úpravy konfigurace, ovládání a omezení živých údajů. |
| `index.html` | Struktura, výchozí texty, inline SVG, sociální odkazy, dialog rychlého menu a prvky pro JS. |
| `config.js` | `window.SITE_CONFIG`: osobní texty, datum narození, přezdívky, zájmy, top 3, Discord a výchozí motiv. |
| `css/style.css` | Kompletní vzhled, tři motivy, animace a responzivita. |
| `js/app.js` | Vykreslení bia a zájmů, věk, psaní jmen, motivy, schránka, dialog, čas a klidný režim. |
| `js/top-three.js` | Generování dvou žebříčků a karet z `SITE_CONFIG.topThree`. |
| `js/presence.js` | Discord avatar/stav, poslední online, herní aktivita a Spotify přes Lanyard. |
| `js/effects.js` | Canvas hvězdy, padající hvězdy, vlastní kurzor, částice a reakce záře na myš. |

Skripty se načítají přes `defer` v pořadí config → app → top-three → presence → effects. `app.js` poskytuje ostatním `window.siteStorage`, `window.siteCalm` a událost `motionchange`. Zachovej potřebné ID elementů při změně HTML, nebo současně uprav jejich použití v JS.

## Obsah a rozložení

1. Horní lišta: značka, O mně, Odkazy, rychlé menu.
2. Hero: psaný nadpis, slogan, tlačítka a Discord avatar s orbitální dekorací.
3. `#about`: bio vlevo, Spotify a aktuální aktivita v pravém sloupci.
4. `#top-three`: „Moje top 3“, panely Hry a Interpreti / kapely vedle sebe, na mobilu pod sebou.
5. `#links`: Instagram, GitHub, Steam, Discord, Spotify, TikTok.
6. Volba motivu a patička s klidným režimem.

Aktuální hry v pořadí: Kingdom Come: Deliverance II, Cyberpunk 2077, RimWorld. Interpreti: Connor Kaufmann, Bohnes, Autumn Kings. Všech šest položek má nyní prázdný popis a URL. Zdroj pravdy je `config.js`; sociální URL jsou přímo v `index.html` a nejsou automaticky odvozené z konfigurace.

`topThree` je pole skupin `{ title, category, items }`. Položky mají `title`, volitelné `description`, `url` a podporují vlastní `category`. Renderer z každé skupiny zobrazí přesně tři položky; chybějící titul má placeholder „Výběr už brzy.“. Platné HTTP(S) URL vytvoří odkaz, jinak je karta článkem. Obsah se vkládá přes textové DOM API. Bio podporuje `**zvýraznění**`, `{age}` a odstavce oddělené prázdným řádkem, nikoli vlastní HTML.

## Ovládání a živá data

- Motivy: `violet`, `aurora`, `sunset`; uložená volba přebíjí `defaultTheme`.
- LocalStorage klíče: `borik-theme`, `borik-calm`, `_lo` (čas posledního online stavu zaznamenaného tímto prohlížečem). Přístup k úložišti je ošetřen pro případ blokování.
- Ctrl+K / Cmd+K přepíná nativní dialog, Esc jej zavře. Dialog nabízí kotvy, kopírování Discordu a změnu motivu.
- Čas se zobrazuje pro `Europe/Prague`; věk se počítá z narozenin v konfiguraci podle data prohlížeče.
- Klidný režim i `prefers-reduced-motion` omezují pohyb. Systémové omezení pohybu nelze tlačítkem přebít. Animace reagují na skrytí karty, vlastní kurzor na jemný ukazatel.
- Lanyard: `wss://api.lanyard.rest/socket`, odběr podle `discordId`, heartbeat, timeout 12 s a opakování spojení s prodlevou rostoucí od 3 do 30 s.
- Rozlišují se načítání, neaktivita a nedostupnost služby. „Naposledy online“ není úplná historie Discordu. Spotify progress běží po sekundě; živá data vyžadují internet a profil dostupný přes Lanyard.

## Aktuální stav: kompaktní favorité

Na žádost uživatele bylo 19. 10. 2026 realizováno zhutnění sekce Moje top 3:

- Hry a Interpreti / kapely jsou dva panely vedle sebe; do 660 px se skládají pod sebe.
- Každý panel obsahuje tři řádky s drobným číslem a názvem, oddělené linkami. První místo má číslo v barvě motivu.
- Velké dekorativní plochy byly odstraněny. Řádky mají minimální výšku 64 px a rostou podle obsahu. Panel má s aktuálním obsahem na mobilu přibližně 252 px.
- Opakovaný štítek kategorie se nezobrazuje u každé položky; vlastní kategorie odlišná od skupiny se zobrazí. Volitelné popisy, odkazy a placeholdery zůstávají podporované.
- Odstup před favority a odkazy je 32 px místo 42 px. Úvod a živé karty si zachovávají dosavadní rozložení.
- Změny jsou v `css/style.css` a `js/top-three.js`. Třídu `.panel` má celá skupina, jednotlivé řádky používají `.favorite-card`. Grid dvou panelů řídí `#top-three-groups`.

## Ověřování změn

Před změnami zkontroluj pracovní strom a zachovej cizí úpravy. Pro úpravy layoutu ověř desktop i šířky přibližně 850, 660, 390 a 360 px, dlouhé názvy, přetékání, všechny motivy a klidný režim. Při zásahu do JS ověř konzoli, ovládání klávesnicí a dotčené funkce. U živých karet ověř dostupný i nedostupný stav, pokud to prostředí umožňuje. Nevydávej kontrolu zdrojů za test v prohlížeči.

Ověření realizace: headless Microsoft Edge přes Python Playwright, šířky 1440, 850, 660, 390 a 360 px, všechny tři motivy bez vodorovného přetékání. Zkontrolovány screenshoty desktopu a mobilu, reduced motion, otevření/zavření menu klávesnicí, dlouhé názvy a popisy, vlastní kategorie, platný i zakázaný protokol odkazu, focus odkazu a prázdná položka. Bez chyb JavaScriptu. Prošel `node --check js/top-three.js` a `git diff --check`. Dostupný živý stav Lanyardu nebyl tímto testem ověřován.
